import { QueryClient } from '@tanstack/react-query';
import { apiClient, handleApiError } from './api';

// Configure React Query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after component unmount
      gcTime: 10 * 60 * 1000,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Retry 3 times on error with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Don't refetch on reconnect for cached data
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on network error
      retry: (failureCount, error) => {
        if (failureCount < 1 && error && typeof error === 'object' && 'code' in error) {
          return error.code === 'NETWORK_ERROR';
        }
        return false;
      },
    },
  },
});

// Default query function using our API client
export const defaultQueryFn = async ({ queryKey }: { queryKey: readonly unknown[] }) => {
  const [url, ...params] = queryKey as [string, ...any[]];
  
  if (params.length > 0) {
    // Handle parameterized queries
    const config = params[0];
    return await apiClient.get(url, config);
  }
  
  return await apiClient.get(url);
};

// Set default query function
queryClient.setQueryDefaults(['default'], {
  queryFn: defaultQueryFn,
});

// API request helper with error handling
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const method = options.method || 'GET';
  const isFormData = options.body instanceof FormData;
  
  const config = {
    method,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...options,
  };

  try {
    let response;
    
    switch (method.toUpperCase()) {
      case 'POST':
        response = await apiClient.post(url, options.body ? JSON.parse(options.body as string) : undefined);
        break;
      case 'PUT':
        response = await apiClient.put(url, options.body ? JSON.parse(options.body as string) : undefined);
        break;
      case 'PATCH':
        response = await apiClient.patch(url, options.body ? JSON.parse(options.body as string) : undefined);
        break;
      case 'DELETE':
        response = await apiClient.delete(url);
        break;
      default:
        response = await apiClient.get(url);
    }
    
    return response;
  } catch (error) {
    const errorMessage = handleApiError(error);
    throw new Error(errorMessage);
  }
};

// Query key factories for consistent cache management
export const queryKeys = {
  // Auth
  currentUser: () => ['auth', 'me'] as const,
  
  // Employees
  employees: () => ['employees'] as const,
  employeesList: (filters?: any) => ['employees', 'list', filters] as const,
  employee: (id: number) => ['employees', 'detail', id] as const,
  employeeStats: (id: number) => ['employees', 'stats', id] as const,
  
  // Planning
  planning: () => ['planning'] as const,
  planningList: (filters?: any) => ['planning', 'list', filters] as const,
  planningWeek: (employeeId: number, date: string) => ['planning', 'week', employeeId, date] as const,
  planningConflicts: () => ['planning', 'conflicts'] as const,
  
  // Time Entries
  timeEntries: () => ['timeEntries'] as const,
  timeEntriesList: (filters?: any) => ['timeEntries', 'list', filters] as const,
  timeEntriesCurrent: (employeeId: number) => ['timeEntries', 'current', employeeId] as const,
  timeEntriesCompare: (employeeId: number) => ['timeEntries', 'compare', employeeId] as const,
  
  // Tasks
  tasks: () => ['tasks'] as const,
  tasksList: (filters?: any) => ['tasks', 'list', filters] as const,
  task: (id: number) => ['tasks', 'detail', id] as const,
  
  // Projects
  projects: () => ['projects'] as const,
  projectsList: (filters?: any) => ['projects', 'list', filters] as const,
  project: (id: number) => ['projects', 'detail', id] as const,
  
  // Departments
  departments: () => ['departments'] as const,
  department: (id: number) => ['departments', 'detail', id] as const,
  
  // Reports
  reports: () => ['reports'] as const,
  reportData: (type: string, filters?: any) => ['reports', type, filters] as const,
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  employees: () => queryClient.invalidateQueries({ queryKey: queryKeys.employees() }),
  planning: () => queryClient.invalidateQueries({ queryKey: queryKeys.planning() }),
  timeEntries: () => queryClient.invalidateQueries({ queryKey: queryKeys.timeEntries() }),
  tasks: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks() }),
  projects: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects() }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch helpers
export const prefetchQueries = {
  employee: (id: number) => 
    queryClient.prefetchQuery({
      queryKey: queryKeys.employee(id),
      queryFn: () => apiClient.get(`/api/employees/${id}`),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }),
  
  planning: (filters?: any) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.planningList(filters),
      queryFn: () => apiClient.get('/api/planning', { params: filters }),
      staleTime: 60 * 1000, // 1 minute
    }),
    
  timeEntries: (filters?: any) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.timeEntriesList(filters),
      queryFn: () => apiClient.get('/api/time-entries', { params: filters }),
      staleTime: 30 * 1000, // 30 seconds
    }),
};

export default queryClient;