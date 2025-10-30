// API Configuration
const resolveApiBaseUrl = (): string => {
  // Try reading from .env
  const fromEnv =
    (import.meta as any)?.env?.VITE_API_URL ||
    (import.meta as any)?.env?.VITE_API_BASE_URL;

  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim();
  }

  // ✅ FIXED: Default directly to Laravel backend instead of frontend origin
  return "http://127.0.0.1:8000/api";
};

export const API_BASE_URL = resolveApiBaseUrl();

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
