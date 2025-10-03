import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

export const ProductGalleryTest: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    console.log('ProductGalleryTest: Component mounted');
    console.log('User:', user);
    
    // Test API call
    const testAPI = async () => {
      try {
        setLoading(true);
        console.log('Testing API call...');
        
        const response = await fetch('http://127.0.0.1:8000/api/products', {
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        setProducts(data);
        setError(null);
      } catch (err) {
        console.error('API Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Product Gallery Test</h2>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Product Gallery Test</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Product Gallery Test</h2>
      
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold">Debug Info:</h3>
        <p><strong>User:</strong> {user ? `${user.name} (${user.role})` : 'Not logged in'}</p>
        <p><strong>Products Count:</strong> {products.length}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product, index) => (
          <div key={product.id || index} className="border rounded p-4">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-gray-700">{product.description}</p>
            <p className="font-bold mt-2">₱{parseFloat(product.price).toFixed(2)}</p>
            <p className="text-sm text-gray-600 mt-1">
              Stock: {product.stock_quantity} | Category: {product.category}
            </p>
            {product.image_paths && product.image_paths.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Images: {product.image_paths.length}
              </p>
            )}
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No products found.</p>
        </div>
      )}
    </div>
  );
};

