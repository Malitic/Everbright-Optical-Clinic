import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const submitRoleRequest = (requested_role: 'staff' | 'optometrist') =>
  api.post('/role-requests', { requested_role });

export const listRoleRequests = (status?: 'pending' | 'approved' | 'rejected') =>
  api.get('/admin/role-requests', { params: { status } });

export const approveRoleRequest = (id: number) =>
  api.put(`/admin/role-requests/${id}/approve`);

export const rejectRoleRequest = (id: number) =>
  api.put(`/admin/role-requests/${id}/reject`);



