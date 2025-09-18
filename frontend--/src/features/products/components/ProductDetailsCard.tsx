import React, { useState } from "react";
import { Product } from "../types/product.types";

interface Props {
  product: Product;
}

const ProductDetailsCard: React.FC<Props> = ({ product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleReserve = (product: Product) => {
    const stored = localStorage.getItem("reservations");
    let reservations = stored ? JSON.parse(stored) : [];

    const existing = reservations.find((item: any) => item.productId === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      reservations.push({
        productId: product.id,
        quantity: 1
      });
    }

    localStorage.setItem("reservations", JSON.stringify(reservations));
    alert(`${product.name} has been reserved!`);
  };

  const handleMouseEnter = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image Container */}
      <div
        className="relative overflow-hidden"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={product.images[currentImageIndex] || product.images[0]}
          alt={`${product.name} ${currentImageIndex === 0 ? 'front' : 'side'}`}
          className="w-full aspect-[4/3] object-contain transition-transform duration-300 group-hover:scale-105 bg-gray-50"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {product.badges.map((badge, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-white/90 text-gray-800 rounded-full shadow-sm"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Prescription Indicator */}
        {product.options.prescription && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full">
              Rx
            </span>
          </div>
        )}

        {/* Reserve Button Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={() => handleReserve(product)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
          >
            Reserve Now
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.model}</p>
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">₱{product.price.toLocaleString()}</span>
          <button
            onClick={() => handleReserve(product)}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
