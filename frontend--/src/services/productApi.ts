import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const API_BASE = `${API_BASE_URL}/products`;

// Include auth token if present
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProducts = async (search = '') => {
  const response = await axios.get(API_BASE, {
    params: { search },
  });
  return response.data;
};

export const getProduct = async (id: string) => {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data;
};

export const createProduct = async (formData: FormData) => {
  const response = await axios.post(API_BASE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateProduct = async (id: string, formData: FormData) => {
  const response = await axios.post(`${API_BASE}/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    method: 'POST',
    params: { _method: 'PUT' }, // Laravel method spoofing
  });
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
};
