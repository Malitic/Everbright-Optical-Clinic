import React, { createContext, useContext, useState, useEffect } from 'react';

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

      // Find user by email
      const existingUser = findUserByEmail(email);

      if (!existingUser) {
        throw new Error('User not found. Please check your email or register first.');
      }

      // For demo purposes, we'll use a simple password check
      // In a real app, passwords would be hashed
      const users = getStoredUsers();
      const userWithPassword = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!userWithPassword || userWithPassword.role !== role) {
        throw new Error('Invalid credentials. Please check your email, password, and role.');
      }

      // For demo, we'll accept any password for existing users
      // In production, you'd verify the hashed password

      // Generate mock token
      const token = generateMockToken(existingUser.id);

      // Store auth data
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existingUser));

      setUser(existingUser);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed. Please try again.');
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

      // Check if user already exists
      const existingUser = findUserByEmail(email);
      if (existingUser) {
        throw new Error('An account with this email already exists. Please use a different email or try logging in.');
      }

      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
      };

      // Get existing users and add new user
      const users = getStoredUsers();
      users.push(newUser);
      saveUsers(users);

      // Generate mock token
      const token = generateMockToken(newUser.id);

      // Store auth data
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      setUser(newUser);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
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
