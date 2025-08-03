import React, { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Save, Send, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/layouts/Sidebar';

// Import React Query hooks
import {
  useTimeEntries,
  useCurrentTimeEntries,
  useCreateTimeEntry,
  useUpdateTimeEntry,
  useSubmitTimeEntries,
  usePrefetchTimeEntries
} from '@/lib/api-hooks';

interface TimeEntryFormData {
  projectId?: number;
  taskId?: number;
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
}

export const TimeEntryWithQuery: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState<TimeEntryFormData>({
    startTime: '',
    endTime: '',
    description: '',
    location: ''
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  // Prefetch hook for performance optimization
  const prefetchTimeEntries = usePrefetchTimeEntries();

  // React Query hooks for time entries
  const {
    data: currentDayEntries,
    isLoading: isLoadingCurrent,
    error: currentError,
    refetch: refetchCurrent
  } = useCurrentTimeEntries(user?.employee?.id || 0, {
    enabled: !!user?.employee?.id,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });

  const {
    data: weekEntries,
    isLoading: isLoadingWeek,
    error: weekError
  } = useTimeEntries(
    {
      employeeId: user?.employee?.id,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
      groupBy: 'day'
    },
    {
      enabled: !!user?.employee?.id,
      staleTime: 60 * 1000, // 1 minute cache
    }
  );

  // Mutation hooks with optimistic updates
  const createTimeEntryMutation = useCreateTimeEntry({
    onSuccess: () => {
      setFormData({
        startTime: '',
        endTime: '',
        description: '',
        location: ''
      });
      refetchCurrent();
    }
  });

  const updateTimeEntryMutation = useUpdateTimeEntry();

  const submitWeekMutation = useSubmitTimeEntries({
    onSuccess: () => {
      // Prefetch next week's data for smooth UX
      const nextWeekStart = addDays(weekStart, 7);
      prefetchTimeEntries({
        employeeId: user?.employee?.id,
        startDate: format(nextWeekStart, 'yyyy-MM-dd'),
        endDate: format(addDays(nextWeekStart, 6), 'yyyy-MM-dd')
      });
    }
  });

  const handleCreateEntry = async () => {
    if (!user?.employee?.id || !formData.startTime) return;

    try {
      await createTimeEntryMutation.mutateAsync({
        employeeId: user.employee.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description,
        location: formData.location,
        projectId: formData.projectId,
        taskId: formData.taskId
      });
    } catch (error) {
      console.error('Failed to create time entry:', error);
    }
  };

  const handleUpdateEntry = async (entryId: number, updates: Partial<any>) => {
    try {
      await updateTimeEntryMutation.mutateAsync({
        id: entryId,
        updates
      });
    } catch (error) {
      console.error('Failed to update time entry:', error);
    }
  };

  const handleSubmitWeek = async () => {
    if (!user?.employee?.id) return;

    try {
      await submitWeekMutation.mutateAsync({
        weekStartDate: format(weekStart, 'yyyy-MM-dd'),
        employeeId: user.employee.id
      });
    } catch (error) {
      console.error('Failed to submit week:', error);
    }
  };

  // Loading states
  if (isLoadingCurrent || isLoadingWeek) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 min-h-screen p-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // Error states
  if (currentError || weekError) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 min-h-screen p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des données : {currentError?.message || weekError?.message}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Saisie de Temps - React Query</h1>
          <p className="text-muted-foreground mt-1">
            Démonstration des hooks React Query optimisés
          </p>
        </div>

        {/* Current Day Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aujourd'hui - {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
            </CardTitle>
            <CardDescription>
              Entrées en temps réel avec auto-refresh (30s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentDayEntries?.entries?.length > 0 ? (
              <div className="space-y-3">
                {currentDayEntries.entries.map((entry: any, index: number) => (
                  <div key={entry.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{entry.startTime} - {entry.endTime || 'En cours'}</span>
                      <Badge variant={entry.status === 'draft' ? 'secondary' : 'default'}>
                        {entry.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {entry.workingHours || 0}h
                      {entry.overtimeHours > 0 && (
                        <span className="text-amber-600 ml-2">
                          +{entry.overtimeHours}h sup.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Total journée:</span>
                    <span className="font-medium">
                      {currentDayEntries.totals?.totalWorking || 0}h
                    </span>
                  </div>
                  {currentDayEntries.totals?.totalOvertime > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>Heures supplémentaires:</span>
                      <span className="font-medium">
                        +{currentDayEntries.totals.totalOvertime}h
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune entrée pour aujourd'hui</p>
            )}
          </CardContent>
        </Card>

        {/* New Entry Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nouvelle Entrée</CardTitle>
            <CardDescription>
              Optimistic updates - les changements apparaissent immédiatement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Heure de début</label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  data-testid="input-start-time"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Heure de fin</label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-end-time"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Description de l'activité..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  data-testid="input-description"
                />
              </div>
              <div className="col-span-2">
                <Button 
                  onClick={handleCreateEntry}
                  disabled={createTimeEntryMutation.isPending || !formData.startTime}
                  className="w-full"
                  data-testid="button-create-entry"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createTimeEntryMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Semaine du {format(weekStart, 'd MMM', { locale: fr })} au {format(weekEnd, 'd MMM yyyy', { locale: fr })}
              <Button
                onClick={handleSubmitWeek}
                disabled={submitWeekMutation.isPending}
                variant="outline"
                data-testid="button-submit-week"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitWeekMutation.isPending ? 'Soumission...' : 'Soumettre la semaine'}
              </Button>
            </CardTitle>
            <CardDescription>
              Cache intelligent : données mises à jour automatiquement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weekEntries?.data && weekEntries.data.length > 0 ? (
              <div className="space-y-4">
                {weekEntries.data.map((dayGroup: any) => (
                  <div key={dayGroup.date} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">
                        {format(new Date(dayGroup.date), 'EEEE d MMMM', { locale: fr })}
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        {dayGroup.totalHours}h travaillées
                        {dayGroup.overtimeHours > 0 && (
                          <span className="text-amber-600 ml-2">
                            (+{dayGroup.overtimeHours}h sup.)
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {dayGroup.entries?.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                        >
                          <span>{entry.startTime} - {entry.endTime}</span>
                          <Badge variant="outline">{entry.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total hebdomadaire:</span>
                    <span className="text-lg font-bold">
                      {weekEntries.pagination?.total || 0}h
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune entrée cette semaine</p>
            )}
          </CardContent>
        </Card>

        {/* Query Status Indicators */}
        <div className="mt-6 text-xs text-muted-foreground space-y-1">
          <div>Cache Status: Current Day - {isLoadingCurrent ? 'Loading' : 'Cached'}</div>
          <div>Cache Status: Week Data - {isLoadingWeek ? 'Loading' : 'Cached'}</div>
          <div>Mutations: {createTimeEntryMutation.isPending || updateTimeEntryMutation.isPending || submitWeekMutation.isPending ? 'Active' : 'Idle'}</div>
        </div>
      </main>
    </div>
  );
};