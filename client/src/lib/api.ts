import axios, { AxiosError } from 'axios';

// Token management utility
export const tokenManager = {
  getToken: () => localStorage.getItem('token'),
  getAccessToken: () => localStorage.getItem('token'), // Alias for compatibility
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (accessToken: string, refreshToken?: string) => {
    localStorage.setItem('token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
};

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: '/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          tokenManager.setTokens(accessToken, newRefreshToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenManager.clearTokens();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Error handling utility
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Données invalides';
        case 401:
          return 'Non autorisé';
        case 403:
          return 'Accès refusé';
        case 404:
          return 'Ressource non trouvée';
        case 500:
          return 'Erreur serveur interne';
        default:
          return `Erreur ${error.response.status}`;
      }
    }
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Erreur inconnue';
};

// Authentication API functions
export const authAPI = {
  // Login user
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  },

  // Register user
  register: async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await apiClient.post('/api/auth/register', {
      email,
      password,
      firstName,
      lastName
    });
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    return response.data;
  },

  // Get current user
  me: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  // Get current user (alias for compatibility)
  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  // Refresh token
  refresh: async (refreshToken: string) => {
    const response = await apiClient.post('/api/auth/refresh', {
      refreshToken
    });
    return response.data;
  }
};

export default apiClient;