import axios from 'axios';

const defaultOrigin = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : 'http://127.0.0.1:8000';
const API_BASE_URL = import.meta.env.VITE_API_URL || `${defaultOrigin}/api`;

const getApiBaseCandidates = (): string[] => {
  const candidates: string[] = [];
  if (import.meta.env.VITE_API_URL) candidates.push(import.meta.env.VITE_API_URL);
  // Prioritize localhost since backend is running there
  candidates.push('http://127.0.0.1:8000/api');
  candidates.push('http://localhost:8000/api');
  if (defaultOrigin) candidates.push(`${defaultOrigin}/api`);
  // If running over LAN, try same host at port 8000
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      candidates.push(`http://${host}:8000/api`);
    }
  }
  // De-duplicate while preserving order
  return Array.from(new Set(candidates));
};

const isNetworkError = (err: any) => err?.code === 'ERR_NETWORK' || err?.message === 'Network Error';

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
  const bases = getApiBaseCandidates();
  let lastErr: any = null;
  for (const base of bases) {
    try {
      const response = await axios.post(`${base}/login`, credentials, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        withCredentials: false,
      });
      return response.data;
    } catch (err: any) {
      lastErr = err;
      if (isNetworkError(err)) {
        // Try next candidate
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error('Network Error');
};

export const register = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const bases = getApiBaseCandidates();
  let lastErr: any = null;
  for (const base of bases) {
    try {
      const response = await axios.post(`${base}/register`, userData, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        withCredentials: false,
      });
      return response.data;
    } catch (err: any) {
      lastErr = err;
      if (isNetworkError(err)) continue;
      throw err;
    }
  }
  throw lastErr || new Error('Network Error');
};

export const logout = async (): Promise<void> => {
  const token = sessionStorage.getItem('auth_token');
  if (!token) return;
  const bases = getApiBaseCandidates();
  for (const base of bases) {
    try {
      await axios.post(`${base}/logout`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: false,
      });
      return;
    } catch (err: any) {
      if (isNetworkError(err)) continue;
      // best-effort: ignore other errors during logout
      return;
    }
  }
};

export const getProfile = async (): Promise<User> => {
  const token = sessionStorage.getItem('auth_token');
  const bases = getApiBaseCandidates();
  let lastErr: any = null;
  for (const base of bases) {
    try {
      const response = await axios.get(`${base}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
        withCredentials: false,
      });
      return response.data;
    } catch (err: any) {
      lastErr = err;
      if (isNetworkError(err)) continue;
      throw err;
    }
  }
  throw lastErr || new Error('Network Error');
};

