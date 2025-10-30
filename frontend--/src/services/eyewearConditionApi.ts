import api from '../api/axiosClient';

export interface EyewearConditionAssessment {
  customer_id: number;
  eyewear_label: string;
  condition: 'good' | 'needs_fix' | 'needs_replacement' | 'bad';
  assessment_date: string;
  next_check_date?: string;
  notes?: string;
  assessed_by: number;
}

export interface EyewearConditionNotification {
  id: string;
  eyewear_label: string;
  condition: 'good' | 'needs_fix' | 'needs_replacement' | 'bad';
  assessment_date: string;
  next_check_date?: string;
  notes?: string;
  assessed_by: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
}

export interface EyewearConditionReport {
  totalAssessments: number;
  conditionBreakdown: {
    good: number;
    needs_fix: number;
    needs_replacement: number;
    bad: number;
  };
  urgentAlerts: number;
  overdueChecks: number;
  recentAssessments: EyewearConditionNotification[];
}

/**
 * Send eyewear condition assessment notification
 */
export const sendEyewearConditionNotification = async (
  assessment: EyewearConditionAssessment
): Promise<{ message: string; notification_id: string }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.post('/notifications/eyewear-condition', assessment);
  return response.data;
};

/**
 * Get eyewear condition notifications for a customer
 */
export const getEyewearConditionNotifications = async (
  customerId?: number
): Promise<EyewearConditionNotification[]> => {
  const params = customerId ? { customer_id: customerId } : {};
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');

  const response = await api.get('/notifications', { params: { ...params, type: 'eyewear_condition' } });
  return response.data.notifications || [];
};

/**
 * Get eyewear condition reports for admin
 */
export const getEyewearConditionReports = async (): Promise<EyewearConditionReport> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.get('/notifications/eyewear-condition/reports');
  return response.data;
};

/**
 * Mark eyewear condition notification as read
 */
export const markEyewearNotificationAsRead = async (notificationId: string): Promise<void> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  await api.post('/notifications/mark-read', { notification_id: notificationId });
};

/**
 * Get customers list for eyewear assessment
 */
export const getCustomersForAssessment = async (): Promise<Array<{
  id: number;
  name: string;
  email: string;
  recent_eyewear?: string;
}>> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.get('/customers');
  return response.data.customers || [];
};
