// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.100.6:8000/api';

// Helper function to get the full API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = sessionStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};
