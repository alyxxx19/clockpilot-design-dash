'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, History, Timer, CheckCircle, Play, Square } from 'lucide-react';
import { format, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { fr } from 'date-fns/locale';

// Note: These components would need to be created for Next.js project
// For now, using basic HTML elements with Tailwind classes
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">{children}</div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${className}`}>{children}</h3>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  size = 'default',
  className = '',
  ...props 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean;
  size?: 'default' | 'lg';
  className?: string;
  [key: string]: any;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
      disabled:pointer-events-none disabled:opacity-50
      ${size === 'lg' ? 'px-8 py-4 text-lg' : 'px-4 py-2'}
      ${className}
    `}
    {...props}
  >
    {children}
  </button>
);

const Badge = ({ 
  children, 
  variant = 'default', 
  className = '' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline';
  className?: string;
}) => (
  <span className={`
    inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
    ${variant === 'outline' ? 'border' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}
    ${className}
  `}>
    {children}
  </span>
);

// Toast hook simulation
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''}`);
    // In a real Next.js app, you'd use a proper toast library like react-hot-toast
  }
});

interface TimeEntry {
  id: string;
  employeeId: string;
  type: 'work' | 'break';
  clockIn: string;
  clockOut?: string;
  location?: {
    latitude: number;
    longitude: number;
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
  };
  notes?: string;
}

interface ClockOutRequest {
  notes?: string;
}

export default function TimeTracking() {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);
  const [geolocation, setGeolocation] = useState<GeolocationCoordinates | null>(null);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<any[]>([]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocation(position.coords);
        },
        (error) => {
          console.warn('Géolocalisation non disponible:', error);
        }
      );
    }
  }, []);

  // Load pending actions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('clockpilot_pending_actions');
    if (saved) {
      setPendingActions(JSON.parse(saved));
    }
  }, []);

  // Fetch data
  useEffect(() => {
    if (isOnline) {
      fetchCurrentEntry();
      fetchTodayEntries();
      syncPendingActions();
    }
  }, [isOnline]);

  const fetchCurrentEntry = async () => {
    try {
      const response = await fetch('/api/time-entries/current', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentEntry(data);
      }
    } catch (error) {
      console.error('Error fetching current entry:', error);
    }
  };

  const fetchTodayEntries = async () => {
    try {
      const response = await fetch('/api/time-entries/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTodayEntries(data);
      }
    } catch (error) {
      console.error('Error fetching today entries:', error);
    }
  };

  const syncPendingActions = async () => {
    if (pendingActions.length === 0) return;

    const synced = [];
    for (const action of pendingActions) {
      try {
        const endpoint = action.type === 'clock-in' ? '/api/time-entries/clock-in' : '/api/time-entries/clock-out';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(action.data),
        });

        if (response.ok) {
          synced.push(action);
        }
      } catch (error) {
        console.error('Error syncing action:', error);
        break;
      }
    }

    if (synced.length > 0) {
      const remaining = pendingActions.filter(action => !synced.includes(action));
      setPendingActions(remaining);
      localStorage.setItem('clockpilot_pending_actions', JSON.stringify(remaining));
      
      toast({
        title: "Synchronisation réussie",
        description: `${synced.length} action(s) synchronisée(s)`,
      });

      fetchCurrentEntry();
      fetchTodayEntries();
    }
  };

  const handleClockIn = async (type: 'work' | 'break' = 'work') => {
    setLoading(true);
    
    const data: ClockInRequest = {
      type,
      location: geolocation ? {
        latitude: geolocation.latitude,
        longitude: geolocation.longitude,
      } : undefined,
    };

    try {
      if (!isOnline) {
        // Store action for later sync
        const action = { type: 'clock-in', data, timestamp: new Date().toISOString() };
        const newPending = [...pendingActions, action];
        setPendingActions(newPending);
        localStorage.setItem('clockpilot_pending_actions', JSON.stringify(newPending));
        
        toast({
          title: "Action enregistrée hors ligne",
          description: "L'action sera synchronisée dès que la connexion sera rétablie",
        });
        return;
      }

      const response = await fetch('/api/time-entries/clock-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Pointage d'entrée réussi",
          description: "Bonne journée de travail !",
        });
        fetchCurrentEntry();
        fetchTodayEntries();
      } else {
        throw new Error('Erreur lors du pointage');
      }
    } catch (error: any) {
      toast({
        title: "Erreur de pointage",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    
    const data: ClockOutRequest = {};

    try {
      if (!isOnline) {
        // Store action for later sync
        const action = { type: 'clock-out', data, timestamp: new Date().toISOString() };
        const newPending = [...pendingActions, action];
        setPendingActions(newPending);
        localStorage.setItem('clockpilot_pending_actions', JSON.stringify(newPending));
        
        toast({
          title: "Action enregistrée hors ligne",
          description: "L'action sera synchronisée dès que la connexion sera rétablie",
        });
        return;
      }

      const response = await fetch('/api/time-entries/clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Pointage de sortie réussi",
          description: "Bonne fin de journée !",
        });
        fetchCurrentEntry();
        fetchTodayEntries();
      } else {
        throw new Error('Erreur lors du pointage');
      }
    } catch (error: any) {
      toast({
        title: "Erreur de pointage",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayHours = () => {
    let totalMinutes = 0;
    todayEntries.forEach(entry => {
      if (entry.clockOut) {
        totalMinutes += differenceInMinutes(new Date(entry.clockOut), new Date(entry.clockIn));
      } else if (entry.clockIn) {
        totalMinutes += differenceInMinutes(currentTime, new Date(entry.clockIn));
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const getWorkingTime = () => {
    if (!currentEntry?.clockIn) return null;
    const seconds = differenceInSeconds(currentTime, new Date(currentEntry.clockIn));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWorking = currentEntry && !currentEntry.clockOut;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Pointage Temps Réel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(currentTime, 'EEEE dd MMMM yyyy', { locale: fr })}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heure actuelle</p>
                  <p className="text-lg font-semibold">
                    {format(currentTime, 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Timer className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Temps travaillé</p>
                  <p className="text-lg font-semibold">
                    {calculateTodayHours()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">État</p>
                  <p className="text-lg font-semibold">
                    {isOnline ? 'En ligne' : 'Hors ligne'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Clock Control */}
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Current Status */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  {isWorking ? 'Vous êtes pointé' : 'Vous n\'êtes pas pointé'}
                </h2>
                {isWorking && (
                  <div className="space-y-1">
                    <p className="text-gray-600 dark:text-gray-400">
                      Pointé depuis: {format(new Date(currentEntry.clockIn), 'HH:mm', { locale: fr })}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {getWorkingTime()}
                    </p>
                  </div>
                )}
              </div>

              {/* Main Button */}
              <div className="flex justify-center">
                <Button
                  onClick={isWorking ? handleClockOut : () => handleClockIn('work')}
                  disabled={loading}
                  size="lg"
                  className={`
                    h-32 w-32 rounded-full text-white font-bold text-lg shadow-lg transform transition-all duration-300
                    ${isWorking 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-green-500 hover:bg-green-600 hover:scale-105'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  data-testid={isWorking ? 'button-clock-out' : 'button-clock-in'}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                  ) : isWorking ? (
                    <div className="flex flex-col items-center space-y-2">
                      <Square className="h-8 w-8" />
                      <span>Sortir</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <Play className="h-8 w-8" />
                      <span>Entrer</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Offline Actions */}
              {pendingActions.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {pendingActions.length} action(s) en attente de synchronisation
                    </p>
                  </div>
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
            {todayEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucun pointage aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayEntries.map((entry: TimeEntry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
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
                        <Badge variant="outline" className="text-blue-600 border-blue-600 animate-pulse">
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
    </div>
  );
}