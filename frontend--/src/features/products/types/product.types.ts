export interface Product {
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
