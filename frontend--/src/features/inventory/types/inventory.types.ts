export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  brand: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  location: string;
  expiryDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryCategory = 
  | 'frames'
  | 'lenses'
  | 'contact_lenses'
  | 'solutions'
  | 'accessories'
  | 'tools'
  | 'equipment';

export interface CreateInventoryItemRequest {
  name: string;
  sku: string;
  category: InventoryCategory;
  brand: string;
  model: string;
  color: string;
  size: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  location: string;
  expiryDate?: string;
  description?: string;
}

export interface UpdateInventoryItemRequest extends Partial<CreateInventoryItemRequest> {}

export interface InventoryFilters {
  category?: InventoryCategory;
  brand?: string;
  supplier?: string;
  lowStock?: boolean;
  search?: string;
}

export interface LowStockAlert {
  item: InventoryItem;
  currentQuantity: number;
  minQuantity: number;
  reorderQuantity: number;
}

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  'frames',
  'lenses',
  'contact_lenses',
  'solutions',
  'accessories',
  'tools',
  'equipment'
];
