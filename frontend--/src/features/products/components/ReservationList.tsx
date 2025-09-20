import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ReservationItem } from '../types/product.types';

const PRODUCTS_STORAGE_KEY = 'localStorage_products';
const RESERVATIONS_STORAGE_KEY = 'reservations';

const ReservationList: React.FC = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load reservations
    const storedReservations = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (storedReservations) {
      try {
        setReservations(JSON.parse(storedReservations));
      } catch (error) {
        console.error('Error parsing reservations:', error);
      }
    }

    // Load products
    const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (storedProducts) {
      try {
        const parsedProducts = JSON.parse(storedProducts);
        const migratedProducts = parsedProducts.map((p: any) => ({
          id: p.id || '',
          name: p.name || '',
          model: p.model || '',
          description: p.description || '',
          price: p.price || 0,
          images: p.imageDataUrls || p.images || [],
          badges: p.badges || [],
          options: p.options || { prescription: false },
        }));
        setProducts(migratedProducts);
      } catch (error) {
        console.error('Error parsing products:', error);
      }
    }
  }, []);

  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };

  const getTotalPrice = (): number => {
    return reservations.reduce((total, reservation) => {
      const product = getProductById(reservation.productId);
      return total + (product ? product.price * reservation.quantity : 0);
    }, 0);
  };

  const handleConfirmReservation = () => {
    // Clear reservations
    localStorage.removeItem(RESERVATIONS_STORAGE_KEY);
    setReservations([]);
    setShowSuccess(true);

    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (showSuccess) {
    return (
      <div className="p-4 max-w-2xl mx-auto text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <h2 className="text-xl font-bold">Reservation Confirmed!</h2>
          <p>Your reservation has been successfully confirmed. Thank you for your purchase.</p>
        </div>
        <button
          onClick={() => navigate('/customer/products')}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">My Reservations</h2>

      {reservations.length === 0 ? (
        <p className="text-center text-gray-500">No reservations yet.</p>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {reservations.map(reservation => {
              const product = getProductById(reservation.productId);
              if (!product) return null;

              return (
                <div key={reservation.productId} className="border rounded-lg p-4 flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-20 h-20 flex-shrink-0">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600">{product.model}</p>
                    <p className="font-bold">₱{Number(product.price || 0).toFixed(2)}</p>
                    <p className="text-sm">Quantity: {reservation.quantity}</p>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <p className="font-bold">₱{(product.price * reservation.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="border-t pt-4 mb-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span>₱{getTotalPrice().toFixed(2)}</span>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="text-center">
            <button
              onClick={handleConfirmReservation}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Confirm Reservation
            </button>
          </div>
        </>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/customer/products')}
          className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Products
        </button>
      </div>
    </div>
  );
};

export default ReservationList;
