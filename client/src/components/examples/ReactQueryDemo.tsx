import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Import React Query hooks
import {
  useEmployees,
  useTimeEntries,
  useCreateTimeEntry,
  useUpdateTaskStatus
} from '@/lib/api-hooks';

export const ReactQueryDemo: React.FC = () => {
  const { user } = useAuth();

  // Example 1: Employees with pagination and filters
  const {
    data: employees,
    isLoading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees
  } = useEmployees({
    page: 1,
    limit: 5,
    department: undefined,
    status: 'active'
  });

  // Example 2: Time Entries with real-time updates
  const {
    data: timeEntries,
    isLoading: timeEntriesLoading,
    isFetching: timeEntriesFetching
  } = useTimeEntries({
    employeeId: user?.employee?.id,
    page: 1,
    limit: 10
  }, {
    enabled: !!user?.employee?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Example 3: Optimistic mutations
  const createTimeEntryMutation = useCreateTimeEntry({
    onSuccess: () => {
      console.log('Time entry created successfully with cache invalidation');
    }
  });

  const updateTaskStatusMutation = useUpdateTaskStatus({
    onSuccess: (data) => {
      console.log('Task status updated optimistically:', data.status);
    }
  });

  const handleCreateTimeEntry = () => {
    if (!user?.employee?.id) return;
    
    createTimeEntryMutation.mutate({
      employeeId: user.employee.id,
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      description: 'Démonstration React Query',
    });
  };

  const handleUpdateTaskStatus = () => {
    // Simulating task status update with optimistic UI
    updateTaskStatusMutation.mutate({
      id: 1,
      status: 'completed'
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">React Query - Démonstration</h2>
        <p className="text-muted-foreground">
          Cache intelligent, optimistic updates, et gestion d'état serveur
        </p>
      </div>

      {/* Example 1: Loading States & Error Handling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Employés (Cache 2min)
            {employeesLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {employeesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : employeesError ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              Erreur: {employeesError.message}
            </div>
          ) : (
            <div className="space-y-3">
              {employees?.data?.map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                    <p className="text-sm text-muted-foreground">{employee.departmentName || 'Aucun département'}</p>
                  </div>
                  <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                    {employee.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              ))}
              
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Total: {employees?.pagination?.total || 0} employés
                </span>
                <Button variant="outline" size="sm" onClick={() => refetchEmployees()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example 2: Real-time Updates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Entrées de Temps (Auto-refresh 30s)
            {timeEntriesFetching && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntriesLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-2">
              {timeEntries?.data?.slice(0, 3).map((entry: any, index: number) => (
                <div key={entry.id || index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                  <span className="text-sm">
                    {entry.date} • {entry.startTime} - {entry.endTime || 'En cours'}
                  </span>
                  <Badge variant="outline">{entry.status}</Badge>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm">Aucune entrée trouvée</p>
              )}
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Dernière mise à jour: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example 3: Optimistic Mutations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Mutations Optimistes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button 
                onClick={handleCreateTimeEntry}
                disabled={createTimeEntryMutation.isPending}
                size="sm"
              >
                {createTimeEntryMutation.isPending ? 'Création...' : 'Créer Entrée'}
              </Button>
              
              <Button 
                onClick={handleUpdateTaskStatus}
                disabled={updateTaskStatusMutation.isPending}
                variant="outline"
                size="sm"
              >
                {updateTaskStatusMutation.isPending ? 'Mise à jour...' : 'Marquer Tâche Terminée'}
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Les changements apparaissent immédiatement (optimistic updates)</p>
              <p>• Cache invalidé automatiquement après succès</p>
              <p>• Rollback automatique en cas d'erreur</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Performance & Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Cache Status:</p>
              <p className="text-muted-foreground">
                Employés: {employeesLoading ? 'Loading' : 'Cached (2min)'}
              </p>
              <p className="text-muted-foreground">
                Temps: {timeEntriesLoading ? 'Loading' : 'Cached (30s)'}
              </p>
            </div>
            
            <div>
              <p className="font-medium">Network Activity:</p>
              <p className="text-muted-foreground">
                Background: {timeEntriesFetching ? 'Fetching' : 'Idle'}
              </p>
              <p className="text-muted-foreground">
                Mutations: {createTimeEntryMutation.isPending || updateTaskStatusMutation.isPending ? 'Active' : 'Idle'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};