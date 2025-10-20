import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE_URL });

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Branch {
  id: number;
  name: string;
  code: string;
  address: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Get all branches (admin only)
export const getBranches = async (): Promise<Branch[]> => {
  const response = await api.get('/branches');
  return response.data.branches || response.data;
};

// Get active branches (public)
export const getActiveBranches = async (): Promise<Branch[]> => {
  const response = await api.get('/branches/active');
  return response.data;
};
