import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE_URL });

export interface BranchPerformance {
  id: number;
  name: string;
  code: string;
  address: string;
  revenue: number;
  patients: number;
  appointments: number;
  growth: number;
  inventory_items: number;
  low_stock_alerts: number;
  satisfaction: number;
  is_active: boolean;
}

export interface BranchAnalyticsSummary {
  total_revenue: number;
  total_patients: number;
  total_appointments: number;
  average_growth: number;
  total_branches: number;
}

export interface ProductAvailability {
  product_id: number;
  product_name: string;
  branch_id: number;
  branch_name: string;
  branch_code: string;
  available_quantity: number;
  stock_quantity: number;
  reserved_quantity: number;
  is_available: boolean;
}

export interface BranchAnalyticsResponse {
  branches: BranchPerformance[];
  summary: BranchAnalyticsSummary;
}

export interface ProductAvailabilityResponse {
  availability: ProductAvailability[];
  summary: {
    total_products: number;
    total_branches: number;
    in_stock_items: number;
  };
}

export const getBranchPerformance = async (): Promise<BranchAnalyticsResponse> => {
  const token = sessionStorage.getItem('auth_token');
  const response = await api.get('/analytics/branch-performance', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  return response.data;
};

export const getBranchAnalytics = async (branchId: number): Promise<any> => {
  const token = sessionStorage.getItem('auth_token');
  const response = await api.get(`/analytics/branches/${branchId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  return response.data;
};

export const getProductAvailability = async (productId?: number, branchId?: number): Promise<ProductAvailabilityResponse> => {
  const token = sessionStorage.getItem('auth_token');
  const params = new URLSearchParams();
  
  if (productId) params.append('product_id', productId.toString());
  if (branchId) params.append('branch_id', branchId.toString());
  
  const response = await api.get(`/analytics/product-availability?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  return response.data;
};
