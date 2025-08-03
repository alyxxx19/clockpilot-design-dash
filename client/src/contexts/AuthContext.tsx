import React, { createContext, useContext, useState, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Employee {
  id: number;
  userId: number;
  employeeNumber?: string;
  department?: string;
  position?: string;
  hourlyRate?: string;
  weeklyHours?: number;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
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
  const [employee, setEmployee] = useState<Employee | null>(null);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      // Demo accounts for immediate testing
      if (email === 'demo-admin@clockpilot.com' && password === 'demo' && role === 'admin') {
        setUser({
          id: '1',
          email: 'demo-admin@clockpilot.com',
          role: 'admin',
          name: 'Admin Démo'
        });
        return true;
      }
      
      if (email === 'demo-employee@clockpilot.com' && password === 'demo' && role === 'employee') {
        setUser({
          id: '2',
          email: 'demo-employee@clockpilot.com',
          role: 'employee',
          name: 'Employé Démo'
        });
        
        setEmployee({
          id: 1,
          userId: 2,
          employeeNumber: 'EMP001',
          department: 'Développement',
          position: 'Développeur Full-Stack',
          hourlyRate: '25.00',
          weeklyHours: 35,
          isActive: true
        });
        
        return true;
      }

      // Try backend authentication for other accounts
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      
      if (response.user) {
        setUser({
          id: response.user.id.toString(),
          email: response.user.email,
          role: response.user.role,
          name: response.user.name
        });
        
        if (response.employee) {
          setEmployee(response.employee);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setEmployee(null);
  };

  const value: AuthContextType = {
    user,
    employee,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};