export interface InventoryItem {
  id: number;
  product_id: number;
  branch_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expiry_date?: string;
  min_stock_threshold: number;
  auto_restock_enabled: boolean;
  auto_restock_quantity: number;
  last_restock_date?: string;
  status: string;
  days_until_expiry?: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_paths?: string[];
  };
  branch: {
    id: number;
    name: string;
    code: string;
  };
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
  branch_id?: string;
  lowStock?: boolean;
  expiringSoon?: boolean;
  expired?: boolean;
  search?: string;
}

export interface LowStockAlert {
  item: InventoryItem;
  currentQuantity: number;
  minQuantity: number;
  reorderQuantity: number;
}

export interface StockTransfer {
  id: number;
  product_id: number;
  from_branch_id: number;
  to_branch_id: number;
  quantity: number;
  reason?: string;
  status: 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
  requested_by: number;
  approved_by?: number;
  approved_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    name: string;
    price: number;
    image_paths?: string[];
  };
  fromBranch: {
    id: number;
    name: string;
    code: string;
  };
  toBranch: {
    id: number;
    name: string;
    code: string;
  };
  requestedBy: {
    id: number;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateStockTransferRequest {
  product_id: number;
  from_branch_id: number;
  to_branch_id: number;
  quantity: number;
  reason?: string;
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
