import api from '../api/axiosClient';

export const getAdminProducts = async (filters: {
  branch_id?: string;
  approval_status?: string;
  search?: string;
} = {}) => {
  const params: Record<string, any> = {};
  if (filters.branch_id) params.branch_id = filters.branch_id;
  if (filters.approval_status) params.approval_status = filters.approval_status;
  if (filters.search) params.search = filters.search;

  const response = await api.get('/admin/products', { params });
  return response.data;
};

export const approveProduct = async (productId: number) => {
  const response = await api.put(`/admin/products/${productId}/approve`);
  return response.data;
};

export const rejectProduct = async (productId: number) => {
  const response = await api.put(`/admin/products/${productId}/reject`);
  return response.data;
};

export const getManufacturers = async () => {
  const response = await api.get('/manufacturers');
  return response.data;
};

export const getBranches = async () => {
  const response = await api.get('/branches/active');
  return response.data;
};




