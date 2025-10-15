import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Include auth token if present
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminProducts = async (filters: {
  branch_id?: string;
  approval_status?: string;
  search?: string;
} = {}) => {
  const params = new URLSearchParams();
  if (filters.branch_id) params.append('branch_id', filters.branch_id);
  if (filters.approval_status) params.append('approval_status', filters.approval_status);
  if (filters.search) params.append('search', filters.search);

  const response = await axios.get(`${API_BASE_URL}/admin/products?${params}`);
  return response.data;
};

export const approveProduct = async (productId: number) => {
  const response = await axios.put(`${API_BASE_URL}/admin/products/${productId}/approve`);
  return response.data;
};

export const rejectProduct = async (productId: number) => {
  const response = await axios.put(`${API_BASE_URL}/admin/products/${productId}/reject`);
  return response.data;
};

export const getManufacturers = async () => {
  const response = await axios.get(`${API_BASE_URL}/manufacturers`);
  return response.data;
};

export const getBranches = async () => {
  const response = await axios.get(`${API_BASE_URL}/branches/active`);
  return response.data;
};




