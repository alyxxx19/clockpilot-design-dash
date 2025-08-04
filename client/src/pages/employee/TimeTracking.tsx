import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, MapPin, Wifi, WifiOff, CheckCircle, XCircle, History, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { format, differenceInMinutes, startOfDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { OfflineIndicator, useOfflineStatus } from '@/components/OfflineIndicator';

interface TimeEntry {
  id: number;
  employeeId: number;
  clockIn: string;
  clockOut?: string;
  type: 'work' | 'break';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ClockInRequest {
  type: 'work' | 'break';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  notes?: string;
}

interface ClockOutRequest {
  notes?: string;
}

interface GeolocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export default function TimeTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const offlineStatus = useOfflineStatus();
  
  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [geolocation, setGeolocation] = useState<GeolocationData | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get geolocation on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Géolocalisation non disponible:', error);
        }
      );
    }
  }, []);

  // Fetch current active time entry
  const { data: currentEntry, isLoading: currentLoading } = useQuery<TimeEntry>({
    queryKey: ['/api/time-entries/current'],
    queryFn: async () => {
      const response = await apiRequest('/api/time-entries/current');
      return response.data;
    },
    retry: false,
    enabled: offlineStatus.isOnline
  });

  // Fetch today's time entries
  const { data: todayEntries = [], isLoading: todayLoading } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries/today'],
    queryFn: async () => {
      const response = await apiRequest('/api/time-entries/today');
      return response.data;
    },
    retry: false,
    enabled: offlineStatus.isOnline
  });

  // Clock in mutation
  const clockInMutation = useMutation({
    mutationFn: async (data: ClockInRequest) => {
      if (!offlineStatus.isOnline) {
        // Store action for offline sync
        await offlineStatus.syncManager.addToQueue(
          'clock-in',
          data,
          '/api/time-entries/clock-in',
          'POST'
        );
        return { success: true, offline: true };
      }
      
      return await apiRequest('/api/time-entries/clock-in', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data: any) => {
      if (data?.offline) {
        toast({
          title: "Action enregistrée hors ligne",
          description: "L'action sera synchronisée dès que la connexion sera rétablie",
          variant: "default",
        });
      } else {
        toast({
          title: "Pointage d'entrée réussi",
          description: "Bonne journée de travail !",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/time-entries/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/time-entries/today'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de pointage",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Clock out mutation
  const clockOutMutation = useMutation({
    mutationFn: async (data: ClockOutRequest) => {
      if (!offlineStatus.isOnline) {
        // Store action for offline sync
        await offlineStatus.syncManager.addToQueue(
          'clock-out',
          data,
          '/api/time-entries/clock-out',
          'POST'
        );
        return { success: true, offline: true };
      }
      
      return await apiRequest('/api/time-entries/clock-out', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: (data: any) => {
      if (data?.offline) {
        toast({
          title: "Action enregistrée hors ligne",
          description: "L'action sera synchronisée dès que la connexion sera rétablie",
          variant: "default",
        });
      } else {
        toast({
          title: "Pointage de sortie réussi",
          description: "Bonne fin de journée !",
          variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/time-entries/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/time-entries/today'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de pointage",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  // Calculate today's worked time
  const calculateWorkedTime = () => {
    let totalMinutes = 0;
    
    if (Array.isArray(todayEntries)) {
      todayEntries.forEach((entry: TimeEntry) => {
        if (entry.clockIn && entry.type === 'work') {
          const clockInTime = new Date(entry.clockIn);
          const clockOutTime = entry.clockOut ? new Date(entry.clockOut) : currentTime;
          totalMinutes += differenceInMinutes(clockOutTime, clockInTime);
        }
      });
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes, totalMinutes };
  };

  const workedTime = calculateWorkedTime();
  const isClockedIn = currentEntry && !currentEntry.clockOut;

  const handleClockIn = () => {
    const data: ClockInRequest = {
      type: 'work',
      ...(geolocation && { location: geolocation }),
    };
    clockInMutation.mutate(data);
  };

  const handleClockOut = () => {
    const data: ClockOutRequest = {};
    clockOutMutation.mutate(data);
  };

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm:ss', { locale: fr });
  };

  const formatDate = (date: Date) => {
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-4xl">
      {/* Header avec indicateur hors ligne */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pointage Temps Réel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {formatDate(currentTime)}
          </p>
        </div>
        <div className="ml-4">
          <OfflineIndicator />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Time */}
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-mono font-bold">
                {formatTime(currentTime)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Heure actuelle
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Worked Time */}
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Timer className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">
                {workedTime.hours}h {workedTime.minutes}m
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Temps travaillé aujourd'hui
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              {isClockedIn ? (
                <>
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-bold text-green-600">
                    Pointé
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                  <div className="text-lg font-bold text-red-600">
                    Non pointé
                  </div>
                </>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                État actuel
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Card */}
      <Card className="shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Main Button */}
            <div>
              {isClockedIn ? (
                <Button
                  size="lg"
                  className="h-32 w-32 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105"
                  onClick={handleClockOut}
                  disabled={clockOutMutation.isPending}
                  data-testid="button-clock-out"
                >
                  <div className="text-center">
                    <XCircle className="h-12 w-12 mx-auto mb-2" />
                    <div className="font-bold">SORTIE</div>
                  </div>
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="h-32 w-32 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105"
                  onClick={handleClockIn}
                  disabled={clockInMutation.isPending}
                  data-testid="button-clock-in"
                >
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                    <div className="font-bold">ENTRÉE</div>
                  </div>
                </Button>
              )}
            </div>

            {/* Current Entry Info */}
            {isClockedIn && currentEntry && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Pointé depuis {format(new Date(currentEntry.clockIn), 'HH:mm', { locale: fr })}
                </p>
                {currentEntry.location && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-green-600">
                      Géolocalisation enregistrée
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Geolocation Status */}
            {geolocation && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" />
                <span>Géolocalisation activée</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today's History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historique du jour
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Chargement...
              </p>
            </div>
          ) : !Array.isArray(todayEntries) || todayEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun pointage aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEntries.map((entry: TimeEntry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  data-testid={`time-entry-${entry.id}`}
                >
                  <div className="flex items-center gap-3">
                    {entry.type === 'work' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        {entry.type === 'work' ? 'Travail' : 'Pause'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Entrée: {format(new Date(entry.clockIn), 'HH:mm', { locale: fr })}
                        {entry.clockOut && (
                          <span>
                            {' - Sortie: '}
                            {format(new Date(entry.clockOut), 'HH:mm', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {entry.clockOut ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {differenceInMinutes(new Date(entry.clockOut), new Date(entry.clockIn))}min
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        En cours
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}