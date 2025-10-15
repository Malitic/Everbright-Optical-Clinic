import React, { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/productApi';
import { getReservations, createReservation } from '@/services/reservationApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_paths: string[];
  stock_quantity: number;
  is_active: boolean;
}

interface Reservation {
  id: string;
  product_id: string;
  quantity: number;
  status: string;
  created_at: string;
}

export const ProductGalleryLocalStorage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [products, setProducts] = useState<Product[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newReservationProductId, setNewReservationProductId] = useState<string | null>(null);
  const [reservationQuantity, setReservationQuantity] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load products and reservations on mount
  useEffect(() => {
    fetchProducts();
    if (role === 'customer') {
      fetchReservations();
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await getProducts(searchQuery);
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchReservations = async () => {
    try {
      const data = await getReservations();
      setReservations(data);
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    }
  };

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
        id: '',
        name: '',
        description: '',
        price: 0,
        image_paths: [],
        stock_quantity: 0,
        is_active: true,
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
    if (!editingProduct.name.trim()) {
      alert('Product name is required.');
      return;
    }
    if (editingProduct.price <= 0) {
      alert('Price must be greater than zero.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', editingProduct.name);
      formData.append('description', editingProduct.description);
      formData.append('price', editingProduct.price.toString());
      formData.append('stock_quantity', editingProduct.stock_quantity.toString());
      formData.append('is_active', editingProduct.is_active ? '1' : '0');

      if (editingProduct.id) {
        await updateProduct(editingProduct.id, formData);
      } else {
        await createProduct(formData);
      }
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product.');
    }
  };

  // Delete product via API
  const deleteProductById = async (id: string) => {
    try {
      await deleteProduct(id);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product.');
    }
  };

  // Start reservation for a product
  const startReservation = (productId: string) => {
    setNewReservationProductId(productId);
    setReservationQuantity(1);
  };

  // Cancel reservation
  const cancelReservation = () => {
    setNewReservationProductId(null);
    setReservationQuantity(1);
  };

  // Save reservation via API
  const saveReservation = async () => {
    if (!newReservationProductId) return;
    try {
      await createReservation({
        product_id: parseInt(newReservationProductId),
        branch_id: 1, // Default branch ID, you may want to make this dynamic
        quantity: reservationQuantity,
      });
      cancelReservation();
      fetchReservations();
      alert('Reservation created successfully!');
    } catch (error) {
      console.error('Failed to create reservation:', error);
      alert('Failed to create reservation.');
    }
  };

  // Get reservations count for a product
  const getReservationCount = (productId: string) => {
    return reservations.filter(r => r.product_id === productId).length;
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Product Gallery</h2>

      <div className="mb-4 flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-grow"
          aria-label="Search products"
        />
        {(role === 'admin' || role === 'staff' || role === 'optometrist') && !editingProduct && (
          <Button onClick={() => startEditing()} variant="default" className="flex items-center space-x-1">
            <Plus size={16} />
            <span>Add Product</span>
          </Button>
        )}
      </div>

      {editingProduct && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="text-xl font-semibold mb-2">
            {editingProduct.id ? 'Edit Product' : 'Add Product'}
          </h3>
          <div className="mb-2">
            <label className="block font-medium mb-1">Name:</label>
            <input
              type="text"
              value={editingProduct.name}
              onChange={e => handleEditChange('name', e.target.value)}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">Description:</label>
            <textarea
              value={editingProduct.description}
              onChange={e => handleEditChange('description', e.target.value)}
              className="w-full border px-2 py-1 rounded"
              rows={3}
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">Price:</label>
            <input
              type="number"
              min={0}
              value={editingProduct.price}
              onChange={e => handleEditChange('price', parseFloat(e.target.value))}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="mb-2">
            <label className="block font-medium mb-1">Stock Quantity:</label>
            <input
              type="number"
              min={0}
              value={editingProduct.stock_quantity}
              onChange={e => handleEditChange('stock_quantity', parseInt(e.target.value))}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="flex space-x-2 mt-4">
            <button
              onClick={saveProduct}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={cancelEditing}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <div key={product.id} className="border rounded p-4 flex flex-col">
            {product.image_paths && product.image_paths.length > 0 ? (
              <div className="mb-2">
                <img
                  src={`http://127.0.0.1:8000/storage/${product.image_paths[0]}`}
                  alt={`${product.name} cover`}
                  className="w-full aspect-[4/3] object-contain border cursor-pointer rounded bg-gray-50"
                />
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

            {role === 'customer' && product.is_active && product.stock_quantity > 0 && (
              <>
                {newReservationProductId === product.id ? (
                  <div className="mt-2 p-2 border rounded bg-gray-50">
                    <input
                      type="number"
                      min={1}
                      max={product.stock_quantity}
                      value={reservationQuantity}
                      onChange={e => setReservationQuantity(parseInt(e.target.value))}
                      className="w-full border px-2 py-1 rounded mb-2"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={saveReservation}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={cancelReservation}
                        className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startReservation(product.id)}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Reserve
                  </button>
                )}
              </>
            )}

            {(role === 'admin' || role === 'staff' || role === 'optometrist') && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => startEditing(product)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteProductById(product.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No products available.</p>
      )}
    </div>
  );
};
