import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile, User as ApiUser } from '../services/authApi';

export type UserRole = 'customer' | 'optometrist' | 'staff' | 'admin';
export type User = ApiUser;

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  register: (name: string, email: string, password: string, confirmPassword: string, role: UserRole, branchId?: string) => Promise<void>;
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
    const token = sessionStorage.getItem(TOKEN_KEY);
    const storedUser = sessionStorage.getItem(CURRENT_USER_KEY);

    console.log('AuthContext: useEffect - checking stored auth data', { token: !!token, storedUser: !!storedUser });

    if (token && storedUser) {
      const userData = JSON.parse(storedUser);
      console.log('AuthContext: Found stored user:', userData);
      setUser(userData);
    }
    setIsLoading(false);
  }, []);

  // Monitor user state changes
  useEffect(() => {
    console.log('AuthContext: User state changed:', user);
  }, [user]);

  const login = async (email: string, password: string, role: UserRole): Promise<User> => {
    try {
      console.log('AuthContext: Starting login process');
      setIsLoading(true);

      // Use real API authentication
      console.log('AuthContext: Calling API login');
      const response = await apiLogin({ email, password, role });
      console.log('AuthContext: API response received:', response);

      // Normalize role to a lowercase string for routing compatibility
      const roleRaw: any = (response.user as any)?.role;
      console.log('AuthContext: Raw role from API:', roleRaw, 'Type:', typeof roleRaw);
      const normalizedRole = (typeof roleRaw === 'string' ? roleRaw : (roleRaw?.value ?? String(roleRaw || 'customer'))).toLowerCase();
      console.log('AuthContext: Normalized role:', normalizedRole);
      const normalizedUser: User = { ...(response.user as any), role: normalizedRole } as User;

      // Store auth data
      sessionStorage.setItem(TOKEN_KEY, response.token);
      sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
      console.log('AuthContext: Auth data stored in sessionStorage');

      console.log('AuthContext: Setting user state to:', normalizedUser);
      setUser(normalizedUser);
      console.log('AuthContext: User state updated');
      
      // Force a synchronous state update by calling setUser again
      setTimeout(() => {
        setUser(normalizedUser);
        console.log('AuthContext: User state force updated');
      }, 0);
      
      // Return normalized user so callers can rely on a simple role string
      return normalizedUser;
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      // Handle API errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Login failed. Please try again.');
      }
    } finally {
      console.log('AuthContext: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string, role: UserRole, branchId?: string) => {
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
        role,
        ...(branchId ? { branch_id: parseInt(branchId) } : {}),
      });

      // Only store auth data if a token is issued (customer). Pending roles get no token
      if (response.token) {
        // Normalize role to a lowercase string
        const roleRaw: any = (response.user as any)?.role;
        const normalizedRole = (typeof roleRaw === 'string' ? roleRaw : (roleRaw?.value ?? String(roleRaw || 'customer'))).toLowerCase();
        const normalizedUser: User = { ...(response.user as any), role: normalizedRole } as User;

        sessionStorage.setItem(TOKEN_KEY, response.token);
        sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
      }
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
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(CURRENT_USER_KEY);
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
