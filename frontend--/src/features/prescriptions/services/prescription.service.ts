import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Prescription {
  id: number;
  patient_id: number;
  optometrist_id: number;
  appointment_id?: number;
  type: 'glasses' | 'contact_lenses' | 'sunglasses' | 'progressive' | 'bifocal';
  prescription_data: {
    sphere_od?: string;
    cylinder_od?: string;
    axis_od?: string;
    add_od?: string;
    sphere_os?: string;
    cylinder_os?: string;
    axis_os?: string;
    add_os?: string;
    pd?: string;
  };
  issue_date: string;
  expiry_date: string;
  notes?: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  optometrist?: {
    id: number;
    name: string;
    email: string;
  };
  appointment?: {
    id: number;
    appointment_date: string;
    start_time: string;
    type: string;
  };
}

export interface CreatePrescriptionRequest {
  patient_id: number;
  appointment_id?: number;
  type: 'glasses' | 'contact_lenses' | 'sunglasses' | 'progressive' | 'bifocal';
  prescription_data: {
    sphere_od?: string;
    cylinder_od?: string;
    axis_od?: string;
    add_od?: string;
    sphere_os?: string;
    cylinder_os?: string;
    axis_os?: string;
    add_os?: string;
    pd?: string;
  };
  issue_date: string;
  expiry_date: string;
  notes?: string;
}

export interface UpdatePrescriptionRequest extends Partial<CreatePrescriptionRequest> {
  status?: 'active' | 'expired' | 'cancelled';
}

export const getPrescriptions = (params?: any) => {
  return apiClient.get<{ data: Prescription[] }>('/prescriptions', { params });
};

export const getPrescription = (id: string) => {
  return apiClient.get<Prescription>(`/prescriptions/${id}`);
};

export const createPrescription = (data: CreatePrescriptionRequest) => {
  return apiClient.post<Prescription>('/prescriptions', data);
};

export const updatePrescription = (id: string, data: UpdatePrescriptionRequest) => {
  return apiClient.put<Prescription>(`/prescriptions/${id}`, data);
};

export const deletePrescription = (id: string) => {
  return apiClient.delete(`/prescriptions/${id}`);
};

export const getPatientPrescriptions = (patientId: number) => {
  return apiClient.get<Prescription[]>(`/prescriptions/patient/${patientId}`);
};
