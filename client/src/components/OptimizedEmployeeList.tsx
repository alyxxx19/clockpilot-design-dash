import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { performanceUtils } from '@/lib/performanceOptimizer';
import { LazyImage } from './LazyComponent';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  avatar?: string;
}

interface OptimizedEmployeeListProps {
  searchTerm?: string;
  departmentFilter?: string;
}

export function OptimizedEmployeeList({ 
  searchTerm = '', 
  departmentFilter = '' 
}: OptimizedEmployeeListProps) {
  const [visibleCount, setVisibleCount] = useState(20);

  // Memoized query key for better caching
  const queryKey = useMemo(() => [
    'employees',
    { search: searchTerm, department: departmentFilter }
  ], [searchTerm, departmentFilter]);

  // Performance monitoring
  const { data: employees = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const endTiming = performanceUtils.monitor.startTiming('employee-fetch');
      
      try {
        // Check cache first
        const cached = performanceUtils.cache.getCachedApiResponse<Employee[]>(
          'employees', 
          { search: searchTerm, department: departmentFilter }
        );
        
        if (cached) {
          endTiming();
          return cached;
        }

        // Simulate API call with optimized fields selection
        const params = new URLSearchParams({
          search: searchTerm,
          department: departmentFilter,
          fields: 'id,firstName,lastName,email,department,avatar',
          limit: '100'
        });

        const response = await fetch(`/api/employees?${params}`);
        const result = await response.json();
        
        // Cache the result
        performanceUtils.cache.setCachedApiResponse(
          'employees',
          { search: searchTerm, department: departmentFilter },
          result.data,
          5 * 60 * 1000 // 5 minutes
        );
        
        endTiming();
        return result.data;
      } catch (error) {
        endTiming();
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Memoized filtered employees
  const filteredEmployees = useMemo(() => {
    const endTiming = performanceUtils.monitor.startTiming('employee-filter');
    
    const filtered = employees.filter(employee => {
      const matchesSearch = !searchTerm || 
        `${employee.firstName} ${employee.lastName} ${employee.email}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      
      const matchesDepartment = !departmentFilter || 
        employee.department === departmentFilter;
      
      return matchesSearch && matchesDepartment;
    });
    
    endTiming();
    return filtered;
  }, [employees, searchTerm, departmentFilter]);

  // Virtual scrolling - only render visible items
  const visibleEmployees = useMemo(() => {
    return filteredEmployees.slice(0, visibleCount);
  }, [filteredEmployees, visibleCount]);

  // Load more callback
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredEmployees.length));
  }, [filteredEmployees.length]);

  // Intersection observer for infinite scrolling
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0].isIntersecting && visibleCount < filteredEmployees.length) {
      loadMore();
    }
  }, [loadMore, visibleCount, filteredEmployees.length]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton loading with optimized rendering */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border rounded animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erreur lors du chargement des employés</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Performance: {performanceUtils.monitor.getAverageMetric('employee-fetch').toFixed(2)}ms fetch, 
          {performanceUtils.monitor.getAverageMetric('employee-filter').toFixed(2)}ms filter
        </div>
      )}

      {/* Optimized employee list */}
      {visibleEmployees.map((employee, index) => (
        <EmployeeCard 
          key={employee.id}
          employee={employee}
          isLast={index === visibleEmployees.length - 1}
          onIntersect={observerCallback}
        />
      ))}

      {/* Load more indicator */}
      {visibleCount < filteredEmployees.length && (
        <div className="text-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            data-testid="button-load-more"
          >
            Charger plus ({filteredEmployees.length - visibleCount} restants)
          </button>
        </div>
      )}

      {filteredEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Aucun employé trouvé
        </div>
      )}
    </div>
  );
}

// Optimized employee card component
interface EmployeeCardProps {
  employee: Employee;
  isLast: boolean;
  onIntersect: (entries: IntersectionObserverEntry[]) => void;
}

function EmployeeCard({ employee, isLast, onIntersect }: EmployeeCardProps) {
  const handleRef = useCallback((node: HTMLDivElement | null) => {
    if (node && isLast) {
      const observer = performanceUtils.memory.createIntersectionObserver(
        onIntersect,
        { threshold: 0.1 }
      );
      observer.observe(node);
      
      return () => performanceUtils.memory.disconnectObserver(observer);
    }
  }, [isLast, onIntersect]);

  return (
    <div 
      ref={handleRef}
      className="flex items-center space-x-4 p-4 border rounded hover:bg-gray-50 transition-colors duration-150"
      data-testid={`card-employee-${employee.id}`}
    >
      {/* Optimized avatar with lazy loading */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
        {employee.avatar ? (
          <LazyImage
            src={employee.avatar}
            alt={`${employee.firstName} ${employee.lastName}`}
            className="w-full h-full object-cover"
            width={40}
            height={40}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
        )}
      </div>

      {/* Employee info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">
          {employee.firstName} {employee.lastName}
        </h3>
        <p className="text-sm text-gray-500 truncate">
          {employee.email} • {employee.department}
        </p>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button 
          className="text-blue-600 hover:text-blue-800 text-sm"
          data-testid={`button-edit-${employee.id}`}
        >
          Modifier
        </button>
      </div>
    </div>
  );
}