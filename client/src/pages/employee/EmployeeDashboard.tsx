import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckSquare, BarChart3, Calendar, Play, Pause, Square, ChevronLeft, ChevronRight, User, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalWeekHours: string;
  totalTodayHours: string;
  activeTasks: number;
  completedTasks: number;
  todaySchedule: any;
  recentTimeEntries: any[];
  upcomingTasks: any[];
}

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, employee } = useAuth();
  
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Charger les pointages depuis localStorage
  useEffect(() => {
    const savedPointages = localStorage.getItem('pointages');
    if (savedPointages) {
      const parsed = JSON.parse(savedPointages).map((p: any) => ({
        ...p,
        timestamp: new Date(p.timestamp)
      }));
      setPointages(parsed);
    }
  }, []);

  // Sauvegarder les pointages dans localStorage
  const savePointages = (newPointages: Pointage[]) => {
    localStorage.setItem('pointages', JSON.stringify(newPointages));
    setPointages(newPointages);
  };

  // Obtenir les pointages du jour actuel
  const getTodayPointages = () => {
    const today = new Date().toISOString().split('T')[0];
    return pointages.filter(p => p.date === today);
  };

  // Déterminer l'état actuel du pointage
  const getCurrentState = () => {
    const todayPointages = getTodayPointages();
    if (todayPointages.length === 0) return 'not_started';
    
    const lastPointage = todayPointages[todayPointages.length - 1];
    switch (lastPointage.type) {
      case 'arrivee': return 'working';
      case 'pause_debut': return 'on_break';
      case 'pause_fin': return 'working';
      case 'depart': return 'finished';
      default: return 'not_started';
    }
  };

  // Gérer le pointage
  const handlePointage = (type: Pointage['type']) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const newPointage: Pointage = {
      id: Date.now().toString(),
      type,
      timestamp: now,
      date: today
    };

    const newPointages = [...pointages, newPointage];
    savePointages(newPointages);

    const messages = {
      arrivee: 'Arrivée pointée',
      pause_debut: 'Début de pause pointé',
      pause_fin: 'Reprise pointée',
      depart: 'Départ pointé'
    };

    toast({
      title: messages[type],
      description: `Pointage effectué à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    });
  };

  // Naviguer vers les tâches
  const handleViewAllTasks = () => {
    navigate('/employee/tasks');
  };

  // Naviguer vers la saisie d'heures
  const handleTimeEntry = () => {
    navigate('/employee/time-entry');
  };

  // Naviguer vers les rapports
  const handleViewReports = () => {
    navigate('/employee/reports');
  };

  // Naviguer vers le planning
  const handleViewPlanning = () => {
    navigate('/employee/planning');
  };

  // Calculer les heures travaillées aujourd'hui
  const calculateTodayHours = () => {
    const todayPointages = getTodayPointages();
    let totalMinutes = 0;
    let workStart: Date | null = null;
    let breakStart: Date | null = null;

    for (const pointage of todayPointages) {
      switch (pointage.type) {
        case 'arrivee':
          workStart = pointage.timestamp;
          break;
        case 'pause_debut':
          if (workStart) {
            totalMinutes += (pointage.timestamp.getTime() - workStart.getTime()) / (1000 * 60);
          }
          breakStart = pointage.timestamp;
          break;
        case 'pause_fin':
          workStart = pointage.timestamp;
          break;
        case 'depart':
          if (workStart) {
            totalMinutes += (pointage.timestamp.getTime() - workStart.getTime()) / (1000 * 60);
          }
          break;
      }
    }

    // Si encore en train de travailler, ajouter le temps jusqu'à maintenant
    const currentState = getCurrentState();
    if (currentState === 'working' && workStart) {
      totalMinutes += (currentTime.getTime() - workStart.getTime()) / (1000 * 60);
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return { hours, minutes, totalMinutes };
  };

  // Obtenir le planning pour une date donnée
  const getPlanningForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mockPlanning.find(p => p.date === dateStr);
  };

  // Vérifier si un créneau est en cours
  const isShiftActive = (shift: Shift) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    if (today !== selectedDateStr) return false;

    const [startHour, startMin] = shift.start.split(':').map(Number);
    const [endHour, endMin] = shift.end.split(':').map(Number);
    
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    return currentTotalMin >= startTotalMin && currentTotalMin <= endTotalMin;
  };

  // Naviguer dans le calendrier
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (planningView === 'jour') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (planningView === 'semaine') {
      newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setSelectedDate(newDate);
  };

  const currentState = getCurrentState();
  const todayHours = calculateTodayHours();
  const todayPlanning = getPlanningForDate(selectedDate);

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenue sur votre espace employé</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Heures du jour */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayHours.hours}h {todayHours.minutes.toString().padStart(2, '0')}m
              </div>
              <p className="text-xs text-muted-foreground">
                Objectif: 8h 00m
              </p>
              <Progress value={(todayHours.totalMinutes / 480) * 100} className="mt-2" />
            </CardContent>
          </Card>

          {/* Tâches en cours */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâches en cours</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                5 terminées cette semaine
              </p>
            </CardContent>
          </Card>

          {/* Heures de la semaine */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Semaine</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32h 15m</div>
              <p className="text-xs text-muted-foreground">
                Objectif: 40h 00m
              </p>
              <Progress value={81} className="mt-2" />
            </CardContent>
          </Card>

          {/* Statut actuel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statut</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {currentState === 'not_started' && 'Non commencé'}
                {currentState === 'working' && 'En travail'}
                {currentState === 'on_break' && 'En pause'}
                {currentState === 'finished' && 'Terminé'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pointage rapide */}
          <Card>
            <CardHeader>
              <CardTitle>Pointage rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-muted-foreground">Heure actuelle</p>
              </div>
              
              <div className="space-y-2">
                {currentState === 'not_started' && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handlePointage('arrivee')}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Pointer l'arrivée
                  </Button>
                )}
                
                {currentState === 'working' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="lg"
                      onClick={() => handlePointage('pause_debut')}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pointer la pause
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      size="lg"
                      onClick={() => handlePointage('depart')}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Pointer le départ
                    </Button>
                  </>
                )}
                
                {currentState === 'on_break' && (
                  <>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handlePointage('pause_fin')}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Reprendre
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      size="lg"
                      onClick={() => handlePointage('depart')}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Pointer le départ
                    </Button>
                  </>
                )}
                
                {currentState === 'finished' && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Journée terminée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tâches du jour */}
          <Card>
            <CardHeader>
              <CardTitle>Tâches du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="flex-1 text-sm">Révision du rapport mensuel</span>
                  <span className="text-xs text-muted-foreground">En cours</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="flex-1 text-sm">Réunion équipe - 14h30</span>
                  <span className="text-xs text-muted-foreground">À venir</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="flex-1 text-sm">Formation sécurité</span>
                  <span className="text-xs text-muted-foreground">À venir</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4 transition-colors hover:bg-accent"
                onClick={handleViewAllTasks}
              >
                Voir toutes les tâches
              </Button>
            </CardContent>
          </Card>

          {/* Widget Planning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Mon Planning
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateDate('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={planningView} onValueChange={(value) => setPlanningView(value as any)}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="jour">Jour</TabsTrigger>
                  <TabsTrigger value="semaine">Semaine</TabsTrigger>
                  <TabsTrigger value="mois">Mois</TabsTrigger>
                </TabsList>
                
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="font-medium">
                      {selectedDate.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                    {selectedDate.toDateString() === new Date().toDateString() && (
                      <Badge variant="secondary" className="mt-1">Aujourd'hui</Badge>
                    )}
                  </div>
                  
                  {todayPlanning ? (
                    <div className="space-y-2">
                      {todayPlanning.shifts.map((shift, index) => (
                        <div 
                          key={index}
                          className={`p-3 rounded-lg border transition-colors ${
                            isShiftActive(shift) 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-card border-border'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{shift.task}</p>
                              <p className={`text-xs ${
                                isShiftActive(shift) ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {shift.department}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                {shift.start} - {shift.end}
                              </p>
                              {isShiftActive(shift) && (
                                <Badge variant="secondary" className="mt-1">
                                  En cours
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Aucun créneau planifié</p>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Historique récent */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historique récent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTodayPointages().slice(-5).reverse().map((pointage) => (
                <div key={pointage.id} className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">
                      {pointage.type === 'arrivee' && 'Arrivée'}
                      {pointage.type === 'pause_debut' && 'Début de pause'}
                      {pointage.type === 'pause_fin' && 'Reprise'}
                      {pointage.type === 'depart' && 'Départ'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pointage.timestamp.toLocaleDateString('fr-FR') === new Date().toLocaleDateString('fr-FR') 
                        ? 'Aujourd\'hui' 
                        : pointage.timestamp.toLocaleDateString('fr-FR')
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {pointage.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground">Bureau</p>
                  </div>
                </div>
              ))}
              
              {getTodayPointages().length === 0 && (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">Aucun pointage aujourd'hui</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};