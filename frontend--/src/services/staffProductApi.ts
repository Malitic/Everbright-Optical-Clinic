import api from '../api/axiosClient';

export const getStaffProducts = async (filters: {
  approval_status?: string;
  search?: string;
} = {}) => {
  const params: Record<string, any> = {};
  if (filters.approval_status) params.approval_status = filters.approval_status;
  if (filters.search) params.search = filters.search;

  const response = await api.get('/staff/products', { params });
  return response.data;
};




