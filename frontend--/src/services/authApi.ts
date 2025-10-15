import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance for auth requests
const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
});

export interface LoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: string;
  branch_id?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    name: string;
    address: string;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await authApi.post('/login', credentials);
  return response.data;
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const response = await authApi.post('/register', userData);
  return response.data;
};

export const logout = async (): Promise<void> => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    await authApi.post('/logout', {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export const getProfile = async (): Promise<User> => {
  const token = sessionStorage.getItem('auth_token');
  const response = await authApi.get('/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

export const refreshToken = async (): Promise<string> => {
  const token = sessionStorage.getItem('auth_token');
  const response = await authApi.post('/auth/refresh', {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data.token;
};
