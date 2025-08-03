import axios, { AxiosResponse, AxiosError } from 'axios';

// Types for API responses
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  code?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    employee?: {
      id: number;
      firstName: string;
      lastName: string;
      departmentId?: number;
      managerId?: number;
      isActive: boolean;
    };
  };
  tokens: AuthTokens;
}

export interface RefreshResponse {
  message: string;
  tokens: AuthTokens;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '', // Same origin since we're using Vite proxy
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    try {
      this.accessToken = localStorage.getItem('clockpilot_access_token');
      this.refreshToken = localStorage.getItem('clockpilot_refresh_token');
    } catch (error) {
      console.warn('Failed to load tokens from localStorage:', error);
    }
  }

  setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    
    try {
      localStorage.setItem('clockpilot_access_token', tokens.accessToken);
      localStorage.setItem('clockpilot_refresh_token', tokens.refreshToken);
    } catch (error) {
      console.warn('Failed to save tokens to localStorage:', error);
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    try {
      localStorage.removeItem('clockpilot_access_token');
      localStorage.removeItem('clockpilot_refresh_token');
      localStorage.removeItem('clockpilot_user');
    } catch (error) {
      console.warn('Failed to clear tokens from localStorage:', error);
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;

    try {
      const response = await axios.post<RefreshResponse>('/api/auth/refresh', {
        refreshToken: this.refreshToken,
      });

      const { tokens } = response.data;
      this.setTokens(tokens);

      // Process failed queue
      this.failedQueue.forEach(({ resolve }) => resolve(tokens.accessToken));
      this.failedQueue = [];

      return tokens.accessToken;
    } catch (error) {
      // Process failed queue
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      
      // Clear tokens if refresh fails
      this.clearTokens();
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }
}

export const tokenManager = new TokenManager();

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await tokenManager.refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login or emit event for auth context
        window.dispatchEvent(new CustomEvent('auth:tokenExpired'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Generic API wrapper with type safety
export class ApiClient {
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await api.get<ApiResponse<T>>(url, config);
    return (response.data.data || response.data) as T;
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return (response.data.data || response.data) as T;
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return (response.data.data || response.data) as T;
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return (response.data.data || response.data) as T;
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await api.patch<ApiResponse<T>>(url, data, config);
    return (response.data.data || response.data) as T;
  }
}

// Auth-specific API calls
export class AuthAPI {
  private client = new ApiClient();

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async register(userData: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
  }): Promise<any> {
    return this.client.post('/api/auth/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await this.client.post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      tokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<any> {
    return this.client.get('/api/auth/me');
  }

  async refreshToken(): Promise<RefreshResponse> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post<RefreshResponse>('/api/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }
}

// Export instances
export const apiClient = new ApiClient();
export const authAPI = new AuthAPI();

// Export the axios instance for advanced usage
export { api as axiosInstance };

// Utility function to handle API errors
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse>;
    
    if (axiosError.response?.data?.error) {
      return axiosError.response.data.error;
    }
    
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    switch (axiosError.response?.status) {
      case 400:
        return 'Requête invalide. Veuillez vérifier les données saisies.';
      case 401:
        return 'Non autorisé. Veuillez vous reconnecter.';
      case 403:
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      case 404:
        return 'Ressource non trouvée.';
      case 409:
        return 'Conflit détecté. La ressource existe déjà ou est en cours d\'utilisation.';
      case 422:
        return 'Données de validation échouées.';
      case 429:
        return 'Trop de requêtes. Veuillez réessayer plus tard.';
      case 500:
        return 'Erreur serveur interne. Veuillez réessayer plus tard.';
      case 502:
        return 'Mauvaise passerelle. Le serveur est temporairement indisponible.';
      case 503:
        return 'Service indisponible. Veuillez réessayer plus tard.';
      default:
        return axiosError.message || 'Une erreur inattendue s\'est produite.';
    }
  }

  if (error.message) {
    return error.message;
  }

  return 'Une erreur inattendue s\'est produite.';
};

// Hook for using API with loading states
export const useApi = () => {
  return {
    client: apiClient,
    auth: authAPI,
    handleError: handleApiError,
  };
};