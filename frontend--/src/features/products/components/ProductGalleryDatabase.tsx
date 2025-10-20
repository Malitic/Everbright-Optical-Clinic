import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Product } from '../types/product.types';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../../services/productApi';
import { getStorageUrl } from '../../../utils/imageUtils';

// Branch code → display label mapping
const BRANCH_LABELS: Record<string, string> = {
  UNITOP: 'UNITOP MALL 2nd Floor Foodcourt Area, Balibago Sta. Rosa, Laguna',
  NEWSTAR: 'NEWSTAR MALL, Ground floor Balibago Sta. Rosa Laguna',
  GARNET: 'GARNET ST. CORNER EMERALD, Balibago Sta. Rosa Laguna (near Balibago church)',
  BALIBAGO: 'Balibago Branch',
};

interface Reservation {
  id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  status: string;
  created_at: string;
}

const RESERVATIONS_STORAGE_KEY = 'localStorage_reservations';

export const ProductGalleryDatabase: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newReservationProductId, setNewReservationProductId] = useState<number | null>(null);
  const [reservationQuantity, setReservationQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedImageIndices, setSelectedImageIndices] = useState<{[productId: number]: number}>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAvailability, setShowAvailability] = useState<{[productId: number]: boolean}>({});

  // Load products and reservations on mount; poll for near-real-time updates
  useEffect(() => {
    fetchProducts(false);
    if (role === 'customer') {
      loadReservations();
    }
    const intervalId = setInterval(() => {
      fetchProducts(true);
    }, 5000);
    
    // Listen for product deletion events to refresh immediately
    const handleProductDeletion = (event: CustomEvent) => {
      console.log('Product deleted, refreshing database gallery:', event.detail.productId);
      // Immediately refresh products to reflect deletion
      fetchProducts(true);
    };
    
    window.addEventListener('productDeleted', handleProductDeletion as EventListener);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('productDeleted', handleProductDeletion as EventListener);
    };
  }, [role]);

  const fetchProducts = async (silent: boolean = false) => {
    try {
      if (!silent && !hasLoadedOnce) setLoading(true);
      setError(null);
      const data = await getProducts(searchQuery);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      if (!silent && !hasLoadedOnce) setLoading(false);
      if (!hasLoadedOnce) setHasLoadedOnce(true);
    }
  };

  const loadReservations = () => {
    try {
      const stored = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
      if (stored) {
        const parsedReservations = JSON.parse(stored);
        setReservations(parsedReservations);
      }
    } catch (error) {
      console.error('Error loading reservations:', error);
    }
  };

  const saveReservations = (newReservations: Reservation[]) => {
    try {
      localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(newReservations));
      setReservations(newReservations);
    } catch (error) {
      console.error('Error saving reservations:', error);
    }
  };

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(true);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle input changes for editing product
  const handleEditChange = (field: keyof Product, value: string | number | boolean) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, [field]: value });
  };

  // Start editing a product or create new
  const startEditing = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
    } else {
      setEditingProduct({
        id: 0,
        name: '',
        description: '',
        price: 0,
        category: 'General',
        image_paths: [],
        stock_quantity: 0,
        is_active: true,
        created_by_role: user?.role || 'staff',
        created_at: '',
        updated_at: '',
      });
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProduct(null);
  };

  // Save product (add or update) via API
  const saveProduct = async () => {
    if (!editingProduct) return;

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('name', editingProduct.name);
      formData.append('description', editingProduct.description);
      formData.append('category', editingProduct.category);
      formData.append('price', editingProduct.price.toString());
      formData.append('stock_quantity', editingProduct.stock_quantity.toString());
      formData.append('is_active', editingProduct.is_active ? '1' : '0');

      // Handle image uploads
      if (fileInputRef.current?.files) {
        Array.from(fileInputRef.current.files).forEach((file, index) => {
          formData.append(`images[${index}]`, file);
        });
      }

      if (editingProduct.id === 0) {
        // Create new product
        await createProduct(formData);
      } else {
        // Update existing product
        await updateProduct(editingProduct.id.toString(), formData);
      }

      await fetchProducts(); // Refresh the list
      cancelEditing();
    } catch (error) {
      console.error('Failed to save product:', error);
      setError('Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const deleteProductHandler = async (productId: number) => {

    try {
      setLoading(true);
      setError(null);
      await deleteProduct(productId.toString());
      await fetchProducts(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete product:', error);
      setError('Failed to delete product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle reservation
  const handleReservation = (productId: number) => {
    setNewReservationProductId(productId);
  };

  const confirmReservation = () => {
    if (!newReservationProductId || !user) return;

    const newReservation: Reservation = {
      id: Date.now().toString(),
      product_id: newReservationProductId.toString(),
      user_id: user.id.toString(),
      quantity: reservationQuantity,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const updatedReservations = [...reservations, newReservation];
    saveReservations(updatedReservations);

    // Update product stock
    setProducts(products.map(p => 
      p.id === newReservationProductId 
        ? { ...p, stock_quantity: p.stock_quantity - reservationQuantity }
        : p
    ));

    setNewReservationProductId(null);
    setReservationQuantity(1);
  };

  const getReservationCount = (productId: number) => {
    return reservations
      .filter(r => r.product_id === productId.toString())
      .reduce((sum, r) => sum + r.quantity, 0);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Product Gallery</h2>
        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={() => startEditing()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Product
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading products...</p>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduct.id === 0 ? 'Add Product' : 'Edit Product'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) => handleEditChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => handleEditChange('price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editingProduct.stock_quantity}
                  onChange={(e) => handleEditChange('stock_quantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Images</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      console.log(`Selected ${files.length} images`);
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can select up to 4 images. Supported formats: JPEG, PNG, JPG, GIF (max 2MB each)
                </p>
                {fileInputRef.current?.files && fileInputRef.current.files.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <p className="text-sm text-blue-700">
                      {fileInputRef.current.files.length} image(s) selected
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingProduct.is_active}
                  onChange={(e) => handleEditChange('is_active', e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm font-medium">Active</label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveProduct}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Modal */}
      {newReservationProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reserve Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={reservationQuantity}
                  onChange={(e) => setReservationQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setNewReservationProductId(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReservation}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Confirm Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="border rounded p-4 flex flex-col">
            {product.image_paths && product.image_paths.length > 0 ? (
              <div className="mb-2">
                {/* Main Image Display */}
                <div className="relative">
                  {(() => {
                    const src = getStorageUrl(product.image_paths[selectedImageIndices[product.id] || 0]);
                    return (
                      <img
                        src={src}
                        alt={`${product.name} cover`}
                        className="w-full aspect-[4/3] object-contain border cursor-pointer rounded bg-gray-50"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).replaceWith(Object.assign(document.createElement('div'), {
                            className: 'w-full aspect-[4/3] bg-gray-200 flex items-center justify-center text-gray-500 rounded',
                            textContent: 'Image unavailable'
                          } as any));
                        }}
                      />
                    );
                  })()}
                  
                  {/* Image Navigation Arrows (if multiple images) */}
                  {product.image_paths.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = selectedImageIndices[product.id] || 0;
                          const newIndex = currentIndex > 0 ? currentIndex - 1 : product.image_paths.length - 1;
                          setSelectedImageIndices(prev => ({ ...prev, [product.id]: newIndex }));
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                      >
                        ‹
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIndex = selectedImageIndices[product.id] || 0;
                          const newIndex = currentIndex < product.image_paths.length - 1 ? currentIndex + 1 : 0;
                          setSelectedImageIndices(prev => ({ ...prev, [product.id]: newIndex }));
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>
                
                {/* Image Thumbnails (if multiple images) */}
                {product.image_paths.length > 1 && (
                  <div className="flex space-x-1 mt-2 overflow-x-auto">
                    {product.image_paths.map((imagePath, index) => (
                      <img
                        key={index}
                        src={getStorageUrl(imagePath)}
                        alt={`${product.name} ${index + 1}`}
                        className={`w-12 h-12 object-cover rounded border cursor-pointer ${
                          (selectedImageIndices[product.id] || 0) === index 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndices(prev => ({ ...prev, [product.id]: index }));
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
                
                {/* Image Count Indicator */}
                {product.image_paths.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {(selectedImageIndices[product.id] || 0) + 1} of {product.image_paths.length}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-2 aspect-[4/3] bg-gray-200 flex items-center justify-center text-gray-500">
                No Images
              </div>
            )}
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-gray-700 flex-grow">{product.description}</p>
            <p className="font-bold mt-2">₱{Number(product.price || 0).toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">
              Stock: {product.stock_quantity} | Reservations: {getReservationCount(product.id)}
            </p>

            {/* Branch availability toggle (if data present) */}
            {Array.isArray((product as any).branch_availability) && (
              <div className="mt-2">
                <button
                  onClick={() => setShowAvailability(prev => ({ ...prev, [product.id]: !prev[product.id] }))}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showAvailability[product.id] ? 'Hide availability' : 'Check availability'}
                </button>
                {showAvailability[product.id] && (
                  <div className="mt-2 space-y-1">
                    {['UNITOP','NEWSTAR','GARNET','BALIBAGO'].map((code) => {
                      const ba = ((product as any).branch_availability as any[]).find((x: any) => x.branch?.code === code);
                      const isAvailable = !!ba?.is_available;
                      const qty = ba?.available_quantity ?? 0;
                      return (
                        <div key={code} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{BRANCH_LABELS[code] || code}</span>
                          <span className={isAvailable ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                            {isAvailable ? `${qty} pcs` : 'Out of Stock'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {role === 'customer' && product.is_active && (
              <button
                onClick={() => handleReservation(product.id)}
                disabled={product.stock_quantity <= 0}
                className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:bg-gray-400"
              >
                {product.stock_quantity > 0 ? 'Reserve' : 'Out of Stock'}
              </button>
            )}

            {(role === 'admin' || role === 'staff') && (
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => startEditing(product)}
                  className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Edit
                </button>
                {role === 'admin' && (
                  <button
                    onClick={() => deleteProductHandler(product.id)}
                    className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <p>No products found.</p>
          {searchQuery && (
            <p className="text-sm mt-2">Try adjusting your search terms.</p>
          )}
        </div>
      )}
    </div>
  );
};
