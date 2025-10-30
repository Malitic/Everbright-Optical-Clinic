import apiClient from '@/api/axiosClient';
import { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../types/appointment.types';

export const getAppointments = (params?: any) => {
  return apiClient.get<{ data: Appointment[] }>('/appointments', { params });
};

export const getAppointment = (id: string) => {
  return apiClient.get<Appointment>(`/appointments/${id}`);
};

export const createAppointment = (data: CreateAppointmentRequest) => {
  return apiClient.post<Appointment>('/appointments', data);
};

export const updateAppointment = (id: string, data: UpdateAppointmentRequest) => {
  return apiClient.put<Appointment>(`/appointments/${id}`, data);
};

export const deleteAppointment = (id: string) => {
  return apiClient.delete(`/appointments/${id}`);
};

export const getTodayAppointments = () => {
  return apiClient.get<Appointment[]>('/appointments/today');
};

// Additional service functions for optometrist management
export const getOptometrists = () => {
  return apiClient.get('/users', { params: { role: 'optometrist' } });
};

export const getAvailableTimeSlots = (optometristId: string, date: string) => {
  return apiClient.get(`/appointments/available-slots`, {
    params: { optometrist_id: optometristId, date }
  });
};
