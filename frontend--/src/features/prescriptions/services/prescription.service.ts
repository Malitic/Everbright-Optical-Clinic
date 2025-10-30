import apiClient from '@/api/axiosClient';

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
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
  branch_id?: number;
  type: string;
  prescription_data: any;
  prescription_number: string;
  right_eye: {
    sphere?: string;
    cylinder?: string;
    axis?: string;
    pd?: string;
  };
  left_eye: {
    sphere?: string;
    cylinder?: string;
    axis?: string;
    pd?: string;
  };
  vision_acuity?: string;
  additional_notes?: string;
  recommendations?: string;
  lens_type?: string;
  coating?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
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
  branch?: {
    id: number;
    name: string;
    code: string;
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

export const downloadPrescriptionPdf = async (prescriptionId: number) => {
  const resp = await apiClient.get(`/pdf/prescriptions/${prescriptionId}`, { responseType: 'blob' });
  const blob = resp.data as Blob;
  const href = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `prescription_${prescriptionId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);
};

export const listCustomerReceipts = async () => {
  return apiClient.get(`/pdf/receipts/customer`);
};

export const downloadReceiptPdf = async (appointmentId: number) => {
  const resp = await apiClient.get(`/pdf/receipts/${appointmentId}`, { responseType: 'blob' });
  const blob = resp.data as Blob;
  const href = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = `receipt_${appointmentId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(href);
};

// Export service object for easier imports
export const prescriptionService = {
  getPrescriptions: async (params?: any) => {
    const response = await getPrescriptions(params);
    // The API returns { data: [...] } structure
    return response.data; // Return the paginated response object
  },
  getPrescription: async (id: string) => {
    const response = await getPrescription(id);
    return response.data;
  },
  createPrescription: async (data: CreatePrescriptionRequest) => {
    const response = await createPrescription(data);
    return response.data;
  },
  updatePrescription: async (id: string, data: UpdatePrescriptionRequest) => {
    const response = await updatePrescription(id, data);
    return response.data;
  },
  deletePrescription: async (id: string) => {
    await deletePrescription(id);
  },
  getPatientPrescriptions: async (patientId: number) => {
    const response = await getPatientPrescriptions(patientId) as any;
    // Handle both paginated and non-paginated responses
    const payload = response?.data ?? response;
    if (payload && payload.data) {
      return payload.data; // Paginated response
    } else if (Array.isArray(payload)) {
      return payload; // Direct array response
    } else {
      return []; // Fallback
    }
  },
  downloadPrescriptionPdf,
  listCustomerReceipts: async () => {
    const response = await listCustomerReceipts();
    return response.data;
  },
  downloadReceiptPdf
};