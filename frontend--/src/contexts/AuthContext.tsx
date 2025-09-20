import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile, User as ApiUser } from '../services/authApi';

export type UserRole = 'customer' | 'optometrist' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, confirmPassword: string, role: UserRole) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for localStorage management
const USERS_STORAGE_KEY = 'auth_users';
const CURRENT_USER_KEY = 'auth_current_user';
const TOKEN_KEY = 'auth_token';

// Generate a simple mock token
const generateMockToken = (userId: string): string => {
  return `mock_token_${userId}_${Date.now()}`;
};

// Get users from localStorage
const getStoredUsers = (): User[] => {
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error reading users from localStorage:', error);
    return [];
  }
};

// Save users to localStorage
const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
};

// Find user by email
const findUserByEmail = (email: string): User | null => {
  const users = getStoredUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

// Validate password (simple check for demo)
const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);

      // Use real API authentication
      const response = await apiLogin({ email, password, role });
      
      // Check if the user's role matches the expected role
      if (response.user.role !== role) {
        throw new Error(`Invalid role. Expected ${role}, but user has role ${response.user.role}.`);
      }

      // Store auth data
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));

      setUser(response.user);
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, role: UserRole) => {
    try {
      setIsLoading(true);

      // Validate password length
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long.');
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match. Please try again.');
      }

      // Use real API registration
      const response = await apiRegister({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        password_confirmation: confirmPassword,
        role
      });

      // Store auth data
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(response.user));

      setUser(response.user);
    } catch (error: any) {
      // Handle API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
