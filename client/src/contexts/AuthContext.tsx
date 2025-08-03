import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { authAPI, tokenManager, handleApiError } from '@/lib/api';

export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  username: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    departmentId?: number;
    managerId?: number;
    isActive: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage and validate token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a stored token
        const accessToken = tokenManager.getAccessToken();
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        // Try to get current user with existing token
        const userData = await authAPI.getCurrentUser();
        const transformedUser: User = {
          id: userData.id,
          email: userData.email,
          role: userData.role as UserRole,
          username: userData.username,
          employee: userData.employee,
        };
        setUser(transformedUser);
      } catch (error) {
        console.warn('Failed to initialize auth:', error);
        // Clear invalid tokens
        tokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for token expiration events
  useEffect(() => {
    const handleTokenExpired = () => {
      setUser(null);
      tokenManager.clearTokens();
    };

    window.addEventListener('auth:tokenExpired', handleTokenExpired);
    return () => {
      window.removeEventListener('auth:tokenExpired', handleTokenExpired);
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await authAPI.login(email, password);
      
      // Store tokens
      tokenManager.setTokens(response.tokens);
      
      // Set user data
      const userData: User = {
        id: response.user.id,
        email: response.user.email,
        role: response.user.role as UserRole,
        username: response.user.username,
        employee: response.user.employee,
      };
      
      setUser(userData);

      // Store user data in localStorage for persistence
      try {
        localStorage.setItem('clockpilot_user', JSON.stringify(userData));
      } catch (error) {
        console.warn('Failed to store user data:', error);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = handleApiError(error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      setUser(null);
      tokenManager.clearTokens();
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await authAPI.getCurrentUser();
      const transformedUser: User = {
        id: userData.id,
        email: userData.email,
        role: userData.role as UserRole,
        username: userData.username,
        employee: userData.employee,
      };
      setUser(transformedUser);
      
      // Update localStorage
      try {
        localStorage.setItem('clockpilot_user', JSON.stringify(transformedUser));
      } catch (error) {
        console.warn('Failed to update user data in storage:', error);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // If refresh fails due to auth error, log out
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 401) {
          await logout();
        }
      }
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user && !isLoading,
    isLoading,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};