import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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

export interface ReceiptItem {
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Receipt {
  id: number;
  receipt_number: string;
  customer_id: number;
  branch_id: number;
  appointment_id?: number;
  reservation_id?: number;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'refunded';
  notes?: string;
  items: ReceiptItem[];
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    name: string;
    email: string;
  };
  branch?: {
    id: number;
    name: string;
    address: string;
  };
  appointment?: {
    id: number;
    appointment_date: string;
    start_time: string;
    end_time: string;
    type: string;
    optometrist?: {
      id: number;
      name: string;
    };
  };
  reservation?: {
    id: number;
    product?: {
      id: number;
      name: string;
      price: number;
    };
  };
}

export interface ReceiptsResponse {
  data: Receipt[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateReceiptFromAppointmentRequest {
  appointment_id: number;
  items: ReceiptItem[];
  payment_method: 'cash' | 'card' | 'insurance' | 'online';
  notes?: string;
}

export interface CreateReceiptFromReservationRequest {
  reservation_id: number;
  payment_method: 'cash' | 'card' | 'insurance' | 'online';
  notes?: string;
}

export const getCustomerReceipts = async (customerId: number): Promise<ReceiptsResponse> => {
  const response = await api.get(`/customers/${customerId}/receipts`);
  return response.data;
};

export const getReceipt = async (receiptId: number): Promise<Receipt> => {
  const response = await api.get(`/receipts/${receiptId}`);
  return response.data;
};

export const downloadReceipt = async (receiptId: number): Promise<{ download_url: string }> => {
  const response = await api.get(`/receipts/${receiptId}/download`);
  return response.data;
};

export const createReceiptFromAppointment = async (data: CreateReceiptFromAppointmentRequest): Promise<{ receipt: Receipt }> => {
  const response = await api.post('/receipts/from-appointment', data);
  return response.data;
};

export const createReceiptFromReservation = async (data: CreateReceiptFromReservationRequest): Promise<{ receipt: Receipt }> => {
  const response = await api.post('/receipts/from-reservation', data);
  return response.data;
};
