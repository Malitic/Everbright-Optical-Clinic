import api from '../api/axiosClient';

export interface EyewearReminder {
  id: string;
  eyewear_id: string;
  eyewear_label: string;
  next_check_date: string;
  assessment_date: string;
  assessed_by: string;
  notes?: string;
  priority: string;
  is_overdue: boolean;
  created_at: string;
}

export interface EyewearConditionFormData {
  lens_clarity: 'clear' | 'slightly_blurry' | 'blurry' | 'very_blurry';
  frame_condition: 'excellent' | 'good' | 'loose' | 'damaged';
  eye_discomfort: 'no' | 'mild' | 'moderate' | 'severe';
  remarks?: string;
}

export interface EyewearAppointmentData {
  appointment_date: string;
  preferred_time: string;
  notes?: string;
}

export interface EyewearRemindersResponse {
  reminders: EyewearReminder[];
  count: number;
}

/**
 * Get pending eyewear reminders for the logged-in customer
 */
export const getEyewearReminders = async (): Promise<EyewearRemindersResponse> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');

  const response = await api.get('/eyewear/reminders');
  return response.data;
};

/**
 * Submit eyewear condition self-check form
 */
export const submitEyewearConditionForm = async (
  eyewearId: string,
  formData: EyewearConditionFormData
): Promise<{ message: string; notification_id: string }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.post(`/eyewear/${eyewearId}/condition-form`, formData);
  return response.data;
};

/**
 * Schedule appointment for eyewear check
 */
export const scheduleEyewearAppointment = async (
  eyewearId: string,
  appointmentData: EyewearAppointmentData
): Promise<{ message: string; appointment_id: string }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.post(`/eyewear/${eyewearId}/set-appointment`, appointmentData);
  return response.data;
};

/**
 * Mark eyewear reminder as dismissed
 */
export const dismissEyewearReminder = async (reminderId: string): Promise<void> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  await api.post('/notifications/mark-read', { notification_id: reminderId });
};
