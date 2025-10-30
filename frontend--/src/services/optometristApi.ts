import api from '../api/axiosClient';

export interface OptometristPatient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  last_visit?: string;
  next_appointment?: string;
  total_appointments: number;
  total_prescriptions: number;
  status: 'active' | 'inactive';
}

export interface OptometristPatientDetails {
  patient: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    date_of_birth?: string;
  };
  appointments: Array<{
    id: number;
    date: string;
    time: string;
    type: string;
    status: string;
    branch?: {
      name: string;
      address: string;
    };
    notes?: string;
  }>;
  prescriptions: Array<{
    id: number;
    prescription_number: string;
    issue_date: string;
    expiry_date: string;
    status: string;
    type: string;
    right_eye?: any;
    left_eye?: any;
    vision_acuity?: string;
    recommendations?: string;
    additional_notes?: string;
  }>;
  statistics: {
    total_appointments: number;
    total_prescriptions: number;
    last_visit?: string;
    next_appointment?: string;
  };
}

export interface OptometristPrescription {
  id: number;
  prescription_number: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  type: string;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  appointment?: {
    id: number;
    date: string;
    type: string;
  };
  right_eye?: any;
  left_eye?: any;
  vision_acuity?: string;
  recommendations?: string;
  additional_notes?: string;
}

export interface OptometristAppointment {
  id: number;
  patient?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  branch?: {
    name: string;
    address: string;
  };
  notes?: string;
}

export const getOptometristPatients = async (): Promise<{ data: OptometristPatient[]; total: number }> => {
  const response = await api.get('/optometrist/patients');
  return response.data;
};

export const getOptometristPatient = async (patientId: number): Promise<OptometristPatientDetails> => {
  const response = await api.get(`/optometrist/patients/${patientId}`);
  return response.data;
};

export const getOptometristPrescriptions = async (): Promise<{ data: OptometristPrescription[]; total: number }> => {
  const response = await api.get('/optometrist/prescriptions');
  return response.data;
};

export const getOptometristTodayAppointments = async (): Promise<{ data: OptometristAppointment[]; total: number }> => {
  const response = await api.get('/optometrist/appointments/today');
  return response.data;
};

export interface CreatePrescriptionData {
  appointment_id: string;
  right_eye: {
    sphere: string;
    cylinder: string;
    axis: string;
    pd: string;
  };
  left_eye: {
    sphere: string;
    cylinder: string;
    axis: string;
    pd: string;
  };
  vision_acuity?: string;
  additional_notes?: string;
  recommendations?: string;
  lens_type?: string;
  coating?: string;
  follow_up_date?: string;
  follow_up_notes?: string;
}

export const createPrescription = async (data: CreatePrescriptionData): Promise<OptometristPrescription> => {
  const response = await api.post('/prescriptions', data);
  return response.data;
};

export const getOptometristAllAppointments = async (): Promise<{ data: OptometristAppointment[]; total: number }> => {
  const response = await api.get('/optometrist/appointments');
  return response.data;
};
