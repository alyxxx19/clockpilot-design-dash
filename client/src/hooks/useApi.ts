import { useState, useCallback } from 'react';
import { apiClient, authAPI, handleApiError } from '@/lib/api';

// Generic hook for API calls with loading states and error handling
export const useApi = () => {
  return {
    client: apiClient,
    auth: authAPI,
    handleError: handleApiError,
  };
};

// Hook for API calls with automatic loading state management
export const useApiCall = <T = any, P extends any[] = any[]>(
  apiFunction: (...args: P) => Promise<T>
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: P): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

// Hook for mutations (POST, PUT, DELETE, PATCH) with optimistic updates
export const useMutation = <TData = any, TVariables extends any[] = any[]>(
  mutationFn: (...variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: string, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: string | null, variables: TVariables) => void;
  }
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (...variables: TVariables): Promise<TData | null> => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await mutationFn(...variables);

        options?.onSuccess?.(data, variables);
        options?.onSettled?.(data, null, variables);

        return data;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);

        options?.onError?.(errorMessage, variables);
        options?.onSettled?.(null, errorMessage, variables);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, options]
  );

  return {
    mutate,
    isLoading,
    error,
    reset: () => {
      setError(null);
      setIsLoading(false);
    },
  };
};

// Hook for queries with caching and automatic retries
export const useQuery = <T = any>(
  queryKey: string | string[],
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
    retry?: number;
    retryDelay?: number;
  }
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus = true,
    retry = 3,
    retryDelay = 1000,
  } = options || {};

  const fetchData = useCallback(
    async (retryCount = 0): Promise<void> => {
      if (!enabled) return;

      // Check if data is still fresh
      const now = Date.now();
      if (data && lastFetch && (now - lastFetch) < staleTime) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const result = await queryFn();
        setData(result);
        setLastFetch(now);
      } catch (err) {
        const errorMessage = handleApiError(err);
        
        if (retryCount < retry) {
          setTimeout(() => {
            fetchData(retryCount + 1);
          }, retryDelay * (retryCount + 1));
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, queryFn, data, lastFetch, staleTime, retry, retryDelay]
  );

  // Initial fetch
  useState(() => {
    fetchData();
  });

  // Refetch on window focus
  useState(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  });

  const refetch = useCallback(() => {
    setLastFetch(0); // Force refetch
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
};

// Specialized hooks for common API operations

// Employee operations
export const useEmployees = (filters?: any) => {
  return useQuery(
    ['employees', filters],
    () => apiClient.get('/api/employees', { params: filters }),
    { staleTime: 2 * 60 * 1000 } // 2 minutes
  );
};

export const useEmployee = (id: number) => {
  return useQuery(
    ['employee', id],
    () => apiClient.get(`/api/employees/${id}`),
    { enabled: !!id }
  );
};

export const useCreateEmployee = () => {
  return useMutation(
    (employeeData: any) => apiClient.post('/api/employees', employeeData)
  );
};

export const useUpdateEmployee = () => {
  return useMutation(
    (data: { id: number; updates: any }) => 
      apiClient.put(`/api/employees/${data.id}`, data.updates)
  );
};

export const useDeleteEmployee = () => {
  return useMutation(
    (id: number) => apiClient.delete(`/api/employees/${id}`)
  );
};

// Time entries operations
export const useTimeEntries = (filters?: any) => {
  return useQuery(
    ['timeEntries', filters],
    () => apiClient.get('/api/time-entries', { params: filters }),
    { staleTime: 30 * 1000 } // 30 seconds for real-time data
  );
};

export const useCreateTimeEntry = () => {
  return useMutation(
    (timeEntryData: any) => apiClient.post('/api/time-entries', timeEntryData)
  );
};

export const useUpdateTimeEntry = () => {
  return useMutation(
    (data: { id: number; updates: any }) => 
      apiClient.put(`/api/time-entries/${data.id}`, data.updates)
  );
};

export const useSubmitTimeEntries = () => {
  return useMutation(
    (data: { weekStartDate: string; employeeId?: number }) => 
      apiClient.post('/api/time-entries/submit', data)
  );
};

// Planning operations
export const usePlanning = (filters?: any) => {
  return useQuery(
    ['planning', filters],
    () => apiClient.get('/api/planning', { params: filters }),
    { staleTime: 60 * 1000 } // 1 minute
  );
};

export const useCreatePlanningEntry = () => {
  return useMutation(
    (planningData: any) => apiClient.post('/api/planning', planningData)
  );
};

export const useGeneratePlanning = () => {
  return useMutation(
    (data: any) => apiClient.post('/api/planning/generate', data)
  );
};

export const useValidatePlanning = () => {
  return useMutation(
    (data: any) => apiClient.post('/api/planning/validate', data)
  );
};