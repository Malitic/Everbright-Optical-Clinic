import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Types
export interface Appointment {
  id: string;
  time: string;
  patient: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  type: string;
  status: 'confirmed' | 'in-progress' | 'pending' | 'completed' | 'cancelled';
  notes?: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  medicalHistory: string[];
  lastVisit: string;
  avatar?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  od: {
    sphere: string;
    cylinder: string;
    axis: string;
    add: string;
  };
  os: {
    sphere: string;
    cylinder: string;
    axis: string;
    add: string;
  };
  pd: string;
  notes: string;
  status: 'draft' | 'sent' | 'filled';
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  threshold: number;
  price: number;
  supplier: string;
  lastUpdated: string;
}

// API Functions
const optometristApi = {
  // Appointments
  getTodayAppointments: async (): Promise<Appointment[]> => {
    const response = await axios.get(`${API_BASE_URL}/optometrist/appointments/today`);
    return response.data;
  },

  getAppointments: async (date?: string): Promise<Appointment[]> => {
    const params = date ? { date } : {};
    const response = await axios.get(`${API_BASE_URL}/optometrist/appointments`, { params });
    return response.data;
  },

  updateAppointmentStatus: async (id: string, status: string): Promise<Appointment> => {
    const response = await axios.patch(`${API_BASE_URL}/optometrist/appointments/${id}/status`, { status });
    return response.data;
  },

  // Patients
  getPatients: async (): Promise<Patient[]> => {
    const response = await axios.get(`${API_BASE_URL}/optometrist/patients`);
    return response.data;
  },

  getPatient: async (id: string): Promise<Patient> => {
    const response = await axios.get(`${API_BASE_URL}/optometrist/patients/${id}`);
    return response.data;
  },

  createPatient: async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    const response = await axios.post(`${API_BASE_URL}/optometrist/patients`, patient);
    return response.data;
  },

  // Prescriptions
  getPrescriptions: async (): Promise<Prescription[]> => {
    const response = await axios.get(`${API_BASE_URL}/optometrist/prescriptions`);
    return response.data;
  },

  createPrescription: async (prescription: Omit<Prescription, 'id' | 'date'>): Promise<Prescription> => {
    const response = await axios.post(`${API_BASE_URL}/optometrist/prescriptions`, prescription);
    return response.data;
  },

  // Inventory
  getInventory: async (): Promise<InventoryItem[]> => {
    const response = await axios.get(`${API_BASE_URL}/optometrist/inventory`);
    return response.data;
  },

  updateInventory: async (id: string, stock: number): Promise<InventoryItem> => {
    const response = await axios.patch(`${API_BASE_URL}/optometrist/inventory/${id}`, { stock });
    return response.data;
  },
};

// React Query Hooks
export const useTodayAppointments = () => {
  return useQuery({
    queryKey: ['optometrist', 'appointments', 'today'],
    queryFn: optometristApi.getTodayAppointments,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAppointments = (date?: string) => {
  return useQuery({
    queryKey: ['optometrist', 'appointments', date || 'all'],
    queryFn: () => optometristApi.getAppointments(date),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      optometristApi.updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optometrist', 'appointments'] });
    },
  });
};

export const usePatients = () => {
  return useQuery({
    queryKey: ['optometrist', 'patients'],
    queryFn: optometristApi.getPatients,
    staleTime: 10 * 60 * 1000,
  });
};

export const usePatient = (id: string) => {
  return useQuery({
    queryKey: ['optometrist', 'patients', id],
    queryFn: () => optometristApi.getPatient(id),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optometristApi.createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optometrist', 'patients'] });
    },
  });
};

export const usePrescriptions = () => {
  return useQuery({
    queryKey: ['optometrist', 'prescriptions'],
    queryFn: optometristApi.getPrescriptions,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreatePrescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: optometristApi.createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optometrist', 'prescriptions'] });
    },
  });
};

export const useInventory = () => {
  return useQuery({
    queryKey: ['optometrist', 'inventory'],
    queryFn: optometristApi.getInventory,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) => 
      optometristApi.updateInventory(id, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optometrist', 'inventory'] });
    },
  });
};

export default optometristApi;
