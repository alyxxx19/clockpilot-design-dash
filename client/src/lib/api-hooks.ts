import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiClient, handleApiError } from './api';
import { queryKeys, invalidateQueries } from './queryClient';
import { useToast } from '@/hooks/use-toast';

// Types for API responses
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: string;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface Employee {
  id: number;
  userId: number;
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  departmentId?: number;
  managerId?: number;
  hireDate: string;
  contractType: string;
  hourlyRate?: number;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
  isActive: boolean;
  phone?: string;
  address?: string;
  userEmail: string;
  userRole: string;
  departmentName?: string;
}

interface PlanningEntry {
  id: number;
  employeeId: number;
  projectId?: number;
  taskId?: number;
  startTime: string;
  endTime: string;
  date: string;
  status: string;
  validatedBy?: number;
  validatedAt?: string;
  notes?: string;
}

interface TimeEntry {
  id: number;
  employeeId: number;
  projectId?: number;
  taskId?: number;
  startTime: string;
  endTime?: string;
  date: string;
  workingHours: number;
  overtimeHours: number;
  breakDuration: number;
  status: string;
  description?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface Task {
  id: number;
  projectId?: number;
  assignedTo?: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  completedAt?: string;
}

interface Project {
  id: number;
  name: string;
  description?: string;
  clientName?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  spent?: number;
  isActive: boolean;
}

// =============================================================================
// EMPLOYEES HOOKS
// =============================================================================

export const useEmployees = (
  filters?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: number;
    status?: 'active' | 'inactive';
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  },
  options?: UseQueryOptions<PaginatedResponse<Employee>>
) => {
  return useQuery({
    queryKey: queryKeys.employeesList(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Employee>>('/api/employees', { params: filters }),
    staleTime: 2 * 60 * 1000, // 2 minutes for employee data
    ...options,
  });
};

export const useEmployee = (
  id: number,
  options?: UseQueryOptions<Employee>
) => {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: () => apiClient.get<Employee>(`/api/employees/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes for individual employee
    ...options,
  });
};

export const useEmployeeStats = (
  id: number,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.employeeStats(id),
    queryFn: () => apiClient.get(`/api/employees/${id}/stats`),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds for stats
    ...options,
  });
};

export const useCreateEmployee = (
  options?: UseMutationOptions<Employee, Error, Partial<Employee>>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (employeeData: Partial<Employee>) =>
      apiClient.post<Employee>('/api/employees', employeeData),
    onSuccess: (data, variables) => {
      // Invalidate employees list
      invalidateQueries.employees();
      
      // Add to cache optimistically
      queryClient.setQueryData(queryKeys.employee(data.id), data);
      
      toast({
        title: "Employé créé",
        description: `${data.firstName} ${data.lastName} a été ajouté avec succès`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useUpdateEmployee = (
  options?: UseMutationOptions<Employee, Error, { id: number; updates: Partial<Employee> }>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Employee> }) =>
      apiClient.put<Employee>(`/api/employees/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.employee(id) });
      
      // Snapshot previous value
      const previousEmployee = queryClient.getQueryData<Employee>(queryKeys.employee(id));
      
      // Optimistically update
      if (previousEmployee) {
        queryClient.setQueryData(queryKeys.employee(id), {
          ...previousEmployee,
          ...updates,
        });
      }
      
      return { previousEmployee };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEmployee) {
        queryClient.setQueryData(queryKeys.employee(variables.id), context.previousEmployee);
      }
      
      toast({
        title: "Erreur",
        description: handleApiError(err),
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      // Invalidate related queries
      invalidateQueries.employees();
      
      toast({
        title: "Employé mis à jour",
        description: `${data.firstName} ${data.lastName} a été modifié avec succès`,
      });
    },
    ...options,
  });
};

export const useDeleteEmployee = (
  options?: UseMutationOptions<void, Error, number>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/employees/${id}`),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.employee(id) });
      
      // Invalidate lists
      invalidateQueries.employees();
      
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
    ...options,
  });
};

// =============================================================================
// PLANNING HOOKS
// =============================================================================

export const usePlanning = (
  filters?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    groupBy?: 'day' | 'week' | 'month';
    page?: number;
    limit?: number;
  },
  options?: UseQueryOptions<PaginatedResponse<PlanningEntry>>
) => {
  return useQuery({
    queryKey: queryKeys.planningList(filters),
    queryFn: () => apiClient.get<PaginatedResponse<PlanningEntry>>('/api/planning', { params: filters }),
    staleTime: 60 * 1000, // 1 minute for planning data
    ...options,
  });
};

export const usePlanningWeek = (
  employeeId: number,
  weekStartDate: string,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.planningWeek(employeeId, weekStartDate),
    queryFn: () => apiClient.get(`/api/planning/${employeeId}/week/${weekStartDate}`),
    enabled: !!(employeeId && weekStartDate),
    staleTime: 60 * 1000, // 1 minute
    ...options,
  });
};

export const usePlanningConflicts = (
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.planningConflicts(),
    queryFn: () => apiClient.get('/api/planning/conflicts'),
    staleTime: 30 * 1000, // 30 seconds for conflicts
    ...options,
  });
};

export const useCreatePlanningEntry = (
  options?: UseMutationOptions<PlanningEntry, Error, Partial<PlanningEntry>>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (planningData: Partial<PlanningEntry>) =>
      apiClient.post<PlanningEntry>('/api/planning', planningData),
    onSuccess: () => {
      invalidateQueries.planning();
      toast({
        title: "Planning créé",
        description: "L'entrée de planning a été créée avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useGeneratePlanning = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/api/planning/generate', data),
    onSuccess: () => {
      invalidateQueries.planning();
      toast({
        title: "Planning généré",
        description: "Le planning automatique a été généré avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useValidatePlanning = (
  options?: UseMutationOptions<any, Error, any>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => apiClient.post('/api/planning/validate', data),
    onMutate: async (variables) => {
      // Optimistic update for validation status
      const queryKey = queryKeys.planningList({ 
        employeeId: variables.employeeId, 
        startDate: variables.weekStartDate 
      });
      
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      
      // Update status optimistically
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((entry: PlanningEntry) => ({
            ...entry,
            status: 'validated',
            validatedAt: new Date().toISOString(),
          })),
        };
      });
      
      return { previous, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      
      toast({
        title: "Erreur",
        description: handleApiError(err),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      invalidateQueries.planning();
      toast({
        title: "Planning validé",
        description: "Le planning hebdomadaire a été validé avec succès",
      });
    },
    ...options,
  });
};

// =============================================================================
// TIME ENTRIES HOOKS
// =============================================================================

export const useTimeEntries = (
  filters?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    groupBy?: 'day' | 'week' | 'month';
    page?: number;
    limit?: number;
  },
  options?: UseQueryOptions<PaginatedResponse<TimeEntry>>
) => {
  return useQuery({
    queryKey: queryKeys.timeEntriesList(filters),
    queryFn: () => apiClient.get<PaginatedResponse<TimeEntry>>('/api/time-entries', { params: filters }),
    staleTime: 30 * 1000, // 30 seconds for real-time time tracking
    ...options,
  });
};

export const useCurrentTimeEntries = (
  employeeId: number,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.timeEntriesCurrent(employeeId),
    queryFn: () => apiClient.get(`/api/time-entries/${employeeId}/current`),
    enabled: !!employeeId,
    staleTime: 10 * 1000, // 10 seconds for current day entries
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
    ...options,
  });
};

export const useTimeEntriesCompare = (
  employeeId: number,
  options?: UseQueryOptions<any>
) => {
  return useQuery({
    queryKey: queryKeys.timeEntriesCompare(employeeId),
    queryFn: () => apiClient.get(`/api/time-entries/compare/${employeeId}`),
    enabled: !!employeeId,
    staleTime: 60 * 1000, // 1 minute for comparison data
    ...options,
  });
};

export const useCreateTimeEntry = (
  options?: UseMutationOptions<TimeEntry, Error, Partial<TimeEntry>>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (timeEntryData: Partial<TimeEntry>) =>
      apiClient.post<TimeEntry>('/api/time-entries', timeEntryData),
    onMutate: async (variables) => {
      // Optimistically add to current entries
      if (variables.employeeId) {
        const queryKey = queryKeys.timeEntriesCurrent(variables.employeeId);
        await queryClient.cancelQueries({ queryKey });
        
        const previous = queryClient.getQueryData(queryKey);
        const optimisticEntry = {
          id: Date.now(), // Temporary ID
          ...variables,
          status: 'draft',
          createdAt: new Date().toISOString(),
        };
        
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return { entries: [optimisticEntry], totals: {} };
          return {
            ...old,
            entries: [...(old.entries || []), optimisticEntry],
          };
        });
        
        return { previous, queryKey };
      }
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      
      toast({
        title: "Erreur",
        description: handleApiError(err),
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      invalidateQueries.timeEntries();
      toast({
        title: "Temps enregistré",
        description: "L'entrée de temps a été créée avec succès",
      });
    },
    ...options,
  });
};

export const useUpdateTimeEntry = (
  options?: UseMutationOptions<TimeEntry, Error, { id: number; updates: Partial<TimeEntry> }>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<TimeEntry> }) =>
      apiClient.put<TimeEntry>(`/api/time-entries/${id}`, updates),
    onMutate: async ({ id, updates }) => {
      // Optimistically update time entry
      const queries = queryClient.getQueriesData({ queryKey: queryKeys.timeEntries() });
      
      for (const [queryKey, queryData] of queries) {
        if (queryData && typeof queryData === 'object' && 'data' in queryData) {
          const typedData = queryData as PaginatedResponse<TimeEntry>;
          const updatedData = {
            ...typedData,
            data: typedData.data.map(entry => 
              entry.id === id ? { ...entry, ...updates } : entry
            ),
          };
          queryClient.setQueryData(queryKey, updatedData);
        }
      }
    },
    onSuccess: () => {
      invalidateQueries.timeEntries();
      toast({
        title: "Temps mis à jour",
        description: "L'entrée de temps a été modifiée avec succès",
      });
    },
    onError: (error) => {
      // Refetch on error to restore correct state
      invalidateQueries.timeEntries();
      toast({
        title: "Erreur",
        description: handleApiError(error),
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useSubmitTimeEntries = (
  options?: UseMutationOptions<any, Error, { weekStartDate: string; employeeId?: number }>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { weekStartDate: string; employeeId?: number }) =>
      apiClient.post('/api/time-entries/submit', data),
    onMutate: async (variables) => {
      // Optimistically update status to submitted
      const filters = { 
        employeeId: variables.employeeId, 
        startDate: variables.weekStartDate 
      };
      const queryKey = queryKeys.timeEntriesList(filters);
      
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data?.map((entry: TimeEntry) => ({
            ...entry,
            status: 'submitted',
          })),
        };
      });
      
      return { previous, queryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      
      toast({
        title: "Erreur",
        description: handleApiError(err),
        variant: "destructive",
      });
    },
    onSuccess: () => {
      invalidateQueries.timeEntries();
      toast({
        title: "Temps soumis",
        description: "Vos heures hebdomadaires ont été soumises pour validation",
      });
    },
    ...options,
  });
};

// =============================================================================
// TASKS HOOKS
// =============================================================================

export const useTasks = (
  filters?: {
    assignedTo?: number;
    projectId?: number;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  },
  options?: UseQueryOptions<PaginatedResponse<Task>>
) => {
  return useQuery({
    queryKey: queryKeys.tasksList(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Task>>('/api/tasks', { params: filters }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

export const useTask = (
  id: number,
  options?: UseQueryOptions<Task>
) => {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => apiClient.get<Task>(`/api/tasks/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useUpdateTaskStatus = (
  options?: UseMutationOptions<Task, Error, { id: number; status: string }>
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiClient.patch<Task>(`/api/tasks/${id}`, { status }),
    onMutate: async ({ id, status }) => {
      // Optimistically update task status
      await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });
      
      const previousTask = queryClient.getQueryData<Task>(queryKeys.task(id));
      
      if (previousTask) {
        queryClient.setQueryData(queryKeys.task(id), {
          ...previousTask,
          status,
          ...(status === 'completed' && { completedAt: new Date().toISOString() }),
        });
      }
      
      // Update in lists as well
      const queries = queryClient.getQueriesData({ queryKey: queryKeys.tasks() });
      for (const [queryKey, queryData] of queries) {
        if (queryData && typeof queryData === 'object' && 'data' in queryData) {
          const typedData = queryData as PaginatedResponse<Task>;
          const updatedData = {
            ...typedData,
            data: typedData.data.map(task => 
              task.id === id ? { ...task, status } : task
            ),
          };
          queryClient.setQueryData(queryKey, updatedData);
        }
      }
      
      return { previousTask };
    },
    onError: (err, variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(queryKeys.task(variables.id), context.previousTask);
      }
      
      invalidateQueries.tasks();
      
      toast({
        title: "Erreur",
        description: handleApiError(err),
        variant: "destructive",
      });
    },
    onSuccess: (data) => {
      invalidateQueries.tasks();
      
      const statusLabels: Record<string, string> = {
        todo: 'À faire',
        in_progress: 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée',
      };
      
      toast({
        title: "Statut mis à jour",
        description: `Tâche marquée comme "${statusLabels[data.status] || data.status}"`,
      });
    },
    ...options,
  });
};

// =============================================================================
// PROJECTS HOOKS
// =============================================================================

export const useProjects = (
  filters?: {
    status?: string;
    clientName?: string;
    page?: number;
    limit?: number;
  },
  options?: UseQueryOptions<PaginatedResponse<Project>>
) => {
  return useQuery({
    queryKey: queryKeys.projectsList(filters),
    queryFn: () => apiClient.get<PaginatedResponse<Project>>('/api/projects', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes for projects
    ...options,
  });
};

export const useProject = (
  id: number,
  options?: UseQueryOptions<Project>
) => {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => apiClient.get<Project>(`/api/projects/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

// =============================================================================
// PREFETCH HOOKS
// =============================================================================

export const usePrefetchEmployee = () => {
  const queryClient = useQueryClient();
  
  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.employee(id),
      queryFn: () => apiClient.get<Employee>(`/api/employees/${id}`),
      staleTime: 2 * 60 * 1000,
    });
  };
};

export const usePrefetchPlanning = () => {
  const queryClient = useQueryClient();
  
  return (filters?: any) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.planningList(filters),
      queryFn: () => apiClient.get('/api/planning', { params: filters }),
      staleTime: 60 * 1000,
    });
  };
};

export const usePrefetchTimeEntries = () => {
  const queryClient = useQueryClient();
  
  return (filters?: any) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.timeEntriesList(filters),
      queryFn: () => apiClient.get('/api/time-entries', { params: filters }),
      staleTime: 30 * 1000,
    });
  };
};