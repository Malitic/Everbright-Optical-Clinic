import axios from 'axios';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../types/appointment.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAppointments = (params?: any) => {
  return apiClient.get<{ data: Appointment[] }>('/api-mysql.php/appointments', { params });
};

export const getAppointment = (id: string) => {
  return apiClient.get<Appointment>(`/api-mysql.php/appointments/${id}`);
};

export const createAppointment = (data: CreateAppointmentRequest) => {
  return apiClient.post<Appointment>('/api-mysql.php/appointments', data);
};

export const updateAppointment = (id: string, data: UpdateAppointmentRequest) => {
  return apiClient.put<Appointment>(`/api-mysql.php/appointments/${id}`, data);
};

export const deleteAppointment = (id: string) => {
  return apiClient.delete(`/api-mysql.php/appointments/${id}`);
};

export const getTodayAppointments = () => {
  return apiClient.get<Appointment[]>('/api-mysql.php/appointments/today');
};

// Additional service functions for optometrist management
export const getOptometrists = () => {
  return apiClient.get('/api-mysql.php/users?role=optometrist');
};

export const getAvailableTimeSlots = (optometristId: string, date: string) => {
  return apiClient.get(`/api-mysql.php/appointments/available-slots`, {
    params: { optometrist_id: optometristId, date }
  });
};
