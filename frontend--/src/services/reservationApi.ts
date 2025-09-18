import axios from 'axios';

const API_BASE = '/api/reservations';

export const getReservations = async () => {
  const response = await axios.get(API_BASE);
  return response.data;
};

export const createReservation = async (data: { product_id: string; quantity: number; notes?: string }) => {
  const response = await axios.post(API_BASE, data);
  return response.data;
};

export const updateReservation = async (id: string, data: any) => {
  const response = await axios.put(`${API_BASE}/${id}`, data);
  return response.data;
};

export const deleteReservation = async (id: string) => {
  const response = await axios.delete(`${API_BASE}/${id}`);
  return response.data;
};
