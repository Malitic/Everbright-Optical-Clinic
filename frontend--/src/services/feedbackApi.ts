import api from '../api/axiosClient';

export interface Feedback {
  id: number;
  customer_id: number;
  branch_id: number;
  appointment_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  branch: {
    id: number;
    name: string;
    address: string;
  };
  appointment?: {
    id: number;
    appointment_date: string;
    appointment_time: string;
    appointment_type: string;
    optometrist?: {
      name: string;
      email: string;
    };
  };
}

export interface AvailableAppointment {
  id: number;
  date: string;
  time: string;
  type: string;
  optometrist_name?: string;
  branch_name?: string;
}

export interface FeedbackSubmission {
  appointment_id: number;
  rating: number;
  comment?: string;
}

export interface FeedbackAnalytics {
  branch_ratings: Array<{
    branch_id: number;
    branch_name: string;
    avg_rating: number;
    feedback_count: number;
  }>;
  overall_stats: {
    avg_rating: number;
    total_feedback: number;
    unique_customers: number;
  };
  trend_data: Array<{
    month: string;
    avg_rating: number;
    feedback_count: number;
  }>;
  latest_feedback: Array<{
    id: number;
    customer_name: string;
    branch_name: string;
    rating: number;
    comment?: string;
    appointment_date?: string;
    created_at: string;
  }>;
  rating_distribution: Array<{
    rating: number;
    count: number;
    percentage: number;
  }>;
  filters: {
    start_date: string;
    end_date: string;
    branch_id?: number;
  };
}

export const submitFeedback = async (data: FeedbackSubmission): Promise<{ feedback: Feedback }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await api.post('/feedback', data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
  return response.data;
};

export const getAvailableAppointments = async (): Promise<{ appointments: AvailableAppointment[] }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await api.get('/feedback/available-appointments', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
  return response.data;
};

export const getCustomerFeedback = async (customerId: number): Promise<{ data: Feedback[]; pagination: any }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await api.get(`/customers/${customerId}/feedback`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  });
  return response.data;
};

export const getFeedbackAnalytics = async (params?: {
  branch_id?: number;
  start_date?: string;
  end_date?: string;
}): Promise<FeedbackAnalytics> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  console.log('Feedback Analytics API Call:', {
    url: '/admin/feedback/analytics',
    params,
    token: token.substring(0, 20) + '...'
  });

  try {
    const response = await api.get('/admin/feedback/analytics', { 
      params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
    
    console.log('Feedback Analytics Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Feedback Analytics Error:', error);
    throw error;
  }
};

