// Core types for optometrist dashboard
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
  type: 'checkup' | 'fitting' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
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
  prescriptions: Prescription[];
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

// Dashboard card props
export interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
    variant?: string;
  };
  loading?: boolean;
  error?: string;
  className?: string;
}
