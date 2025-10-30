import api from '../api/axiosClient';

export interface Notification {
  id: number;
  user_id: number;
  role: 'customer' | 'staff' | 'optometrist' | 'admin';
  title: string;
  message: string;
  status: 'unread' | 'read';
  type?: string;
  data?: any;
  read_at?: string;
  created_at: string;
  updated_at: string;
  time_ago?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  unread_count: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Get user's notifications
export const getNotifications = async (params?: {
  status?: 'unread' | 'read';
  type?: string;
  per_page?: number;
}): Promise<NotificationResponse> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');

  const response = await api.get('/notifications', { params });
  return response.data;
};

// Get unread notification count
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');

  const response = await api.get('/notifications/unread-count');
  return response.data;
};

// Mark notification as read
export const markAsRead = async (notificationId: number): Promise<void> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  await api.put(`/notifications/${notificationId}/read`);
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<{ count: number }> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.put('/notifications/mark-all-read');
  return response.data;
};

// Create a notification (admin only)
export const createNotification = async (notification: {
  user_id: number;
  role: 'customer' | 'staff' | 'optometrist' | 'admin';
  title: string;
  message: string;
  type?: string;
  data?: any;
}): Promise<Notification> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) throw new Error('No authentication token found');
  const response = await api.post('/notifications', notification);
  return response.data.notification || response.data;
};

