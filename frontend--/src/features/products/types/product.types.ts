export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_paths: string[]; // array of image file paths
  stock_quantity: number;
  is_active: boolean;
  created_by_role: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

// Legacy interface for backward compatibility
export interface LegacyProduct {
  id: string;
  name: string;
  model: string;
  description: string;
  price: number;
  images: string[]; // array of image URLs or base64 strings
  badges: string[]; // e.g., ["Best Seller", "In Stock"]
  options: {
    color?: string;
    prescription: boolean; // true for prescription, false for non-prescription
  };
}

export interface ReservationItem {
  productId: string;
  quantity: number;
}
