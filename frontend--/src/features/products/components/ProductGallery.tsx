import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/product.types';
import { storage } from '../utils/storage';

const ProductGallery: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Load products from storage
    const storedProducts = storage.getProducts();
    // Ensure the structure matches the new Product interface
    const migratedProducts = storedProducts.map((p: any) => ({
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
  }, []);

  const handleProductClick = (productId: string) => {
    navigate(`/customer/products/${productId}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Product Gallery</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <div
            key={product.id}
            className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleProductClick(product.id)}
          >
            {/* Cover Photo */}
            <div className="mb-2">
              {product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={`${product.name} cover`}
                  className="w-full aspect-[4/3] object-contain rounded bg-gray-50"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                  No Image
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="mb-2 flex flex-wrap gap-1">
              {product.badges.map((badge, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                >
                  {badge}
                </span>
              ))}
            </div>

            {/* Product Info */}
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-gray-600">{product.model}</p>
            <p className="font-bold mt-2">₱{Number(product.price || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>
      {products.length === 0 && (
        <p className="text-center text-gray-500 mt-8">No products available.</p>
      )}
    </div>
  );
};

export default ProductGallery;
