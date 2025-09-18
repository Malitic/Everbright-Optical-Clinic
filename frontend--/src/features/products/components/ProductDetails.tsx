import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product, ReservationItem } from '../types/product.types';

const PRODUCTS_STORAGE_KEY = 'localStorage_products';
const RESERVATIONS_STORAGE_KEY = 'reservations';

const ProductDetails: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    if (!productId) return;

    // Load product from localStorage
    const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts);
        const foundProduct = parsedProducts.find((p: any) => p.id === productId);
        if (foundProduct) {
          // Migrate to new structure
          const migratedProduct: Product = {
            id: foundProduct.id || '',
            name: foundProduct.name || '',
            model: foundProduct.model || '',
            description: foundProduct.description || '',
            price: foundProduct.price || 0,
            images: foundProduct.imageDataUrls || foundProduct.images || [],
            badges: foundProduct.badges || [],
            options: foundProduct.options || { prescription: false },
          };
          setProduct(migratedProduct);
        }
      } catch (error) {
        console.error('Error parsing products from localStorage:', error);
      }
    }
  }, [productId]);

  const handleReserve = () => {
    if (!product) return;

    // Load existing reservations
    const storedReservations = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    let reservations: ReservationItem[] = [];
    if (storedReservations) {
      try {
        reservations = JSON.parse(storedReservations);
      } catch (error) {
        console.error('Error parsing reservations:', error);
      }
    }

    // Check if product already reserved
    const existingIndex = reservations.findIndex(r => r.productId === product.id);
    if (existingIndex >= 0) {
      // Increase quantity
      reservations[existingIndex].quantity += 1;
    } else {
      // Add new reservation
      reservations.push({ productId: product.id, quantity: 1 });
    }

    // Save back to localStorage
    localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));

    // Navigate to reservations
    navigate('/customer/reservations');
  };

  if (!product) {
    return <div className="p-4">Product not found.</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/customer/products')}
        className="mb-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
      >
        Back to Gallery
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images Section */}
        <div>
          {/* Main Image */}
          <div className="mb-4">
            {product.images.length > 0 ? (
              <img
                src={product.images[selectedImageIndex]}
                alt={`${product.name} ${selectedImageIndex + 1}`}
                className="w-full h-96 object-cover rounded"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                No Image
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-20 h-20 object-cover rounded cursor-pointer border-2 ${
                    index === selectedImageIndex ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  onClick={() => setSelectedImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-lg text-gray-600 mb-4">{product.model}</p>

          {/* Badges */}
          <div className="mb-4 flex flex-wrap gap-2">
            {product.badges.map((badge, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
              >
                {badge}
              </span>
            ))}
          </div>

          <p className="text-2xl font-bold mb-4">₱{product.price.toFixed(2)}</p>

          <p className="text-gray-700 mb-6">{product.description}</p>

          {/* Options */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Options:</h3>
            <ul className="space-y-1">
              {product.options.color && (
                <li>Color: {product.options.color}</li>
              )}
              <li>
                Type: {product.options.prescription ? 'Prescription' : 'Non-Prescription'}
              </li>
            </ul>
          </div>

          {/* Reserve Button */}
          <button
            onClick={handleReserve}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Reserve the Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
