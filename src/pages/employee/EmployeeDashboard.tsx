import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckSquare, BarChart3, Calendar, Play, Pause, Square, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { LoadingState } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { supabase } from '@/lib/supabase';

interface TodayStats {
  totalMinutes: number;
  currentStatus: 'not_started' | 'working' | 'on_break' | 'finished';
  lastAction?: {
    type: 'clock_in' | 'break_start' | 'break_end' | 'clock_out';
    time: string;
  };
}

export const EmployeeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalMinutes: 0,
    currentStatus: 'not_started'
  });
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const { timeEntries } = useTimeEntries(
    startOfWeek.toISOString().split('T')[0],
    endOfWeek.toISOString().split('T')[0]
  );

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch today's time tracking data
  useEffect(() => {
    const fetchTodayData = async () => {
      if (!user) return;

      try {
        // Get today's time entries
        const { data: todayEntries } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .order('created_at', { ascending: false });

        if (todayEntries && todayEntries.length > 0) {
          const entry = todayEntries[0];
          const startTime = new Date(`${entry.date}T${entry.start_time}`);
          const endTime = entry.end_time ? new Date(`${entry.date}T${entry.end_time}`) : new Date();
          
          let totalMinutes = 0;
          if (entry.status !== 'draft') {
            totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
            
            // Subtract break time if applicable
            if (entry.break_start && entry.break_end) {
              const breakStart = new Date(`${entry.date}T${entry.break_start}`);
              const breakEnd = new Date(`${entry.date}T${entry.break_end}`);
              totalMinutes -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60);
            }
          }

          setTodayStats({
            totalMinutes: Math.max(0, totalMinutes),
            currentStatus: entry.end_time ? 'finished' : 'working',
            lastAction: {
              type: entry.end_time ? 'clock_out' : 'clock_in',
              time: entry.end_time || entry.start_time
            }
          });
        }
      } catch (error) {
        console.error('Error fetching today data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayData();
  }, [user, today]);

  // Calculate weekly hours
  useEffect(() => {
    const total = timeEntries.reduce((sum, entry) => sum + entry.total_hours, 0);
    setWeeklyHours(total);
  }, [timeEntries]);

  const handleClockAction = async (action: 'clock_in' | 'break_start' | 'break_end' | 'clock_out') => {
    if (!user) return;

    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);

    try {
      if (action === 'clock_in') {
        // Create new time entry
        const { error } = await supabase
          .from('time_entries')
          .insert([{
            user_id: user.id,
            date: today,
            start_time: timeString,
            total_hours: 0,
            project: 'Travail général',
            status: 'draft'
          }]);

        if (error) throw error;

        setTodayStats(prev => ({
          ...prev,
          currentStatus: 'working',
          lastAction: { type: 'clock_in', time: timeString }
        }));

        toast({
          title: "Arrivée pointée",
          description: `Pointage effectué à ${timeString}`,
        });
      } else {
        // Update existing entry
        const { data: existingEntry } = await supabase
          .from('time_entries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', today)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingEntry) {
          const updates: any = {};
          
          switch (action) {
            case 'break_start':
              updates.break_start = timeString;
              break;
            case 'break_end':
              updates.break_end = timeString;
              break;
            case 'clock_out':
              updates.end_time = timeString;
              updates.status = 'submitted';
              
              // Calculate total hours
              const startTime = new Date(`${today}T${existingEntry.start_time}`);
              const endTime = new Date(`${today}T${timeString}`);
              let totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
              
              // Subtract break time
              if (existingEntry.break_start && existingEntry.break_end) {
                const breakStart = new Date(`${today}T${existingEntry.break_start}`);
                const breakEnd = new Date(`${today}T${existingEntry.break_end}`);
                totalHours -= (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
              }
              
              updates.total_hours = Math.round(totalHours * 100) / 100;
              break;
          }

          const { error } = await supabase
            .from('time_entries')
            .update(updates)
            .eq('id', existingEntry.id);

          if (error) throw error;

          const newStatus = action === 'clock_out' ? 'finished' : 
                           action === 'break_start' ? 'on_break' : 'working';

          setTodayStats(prev => ({
            ...prev,
            currentStatus: newStatus,
            lastAction: { type: action, time: timeString }
          }));

          const messages = {
            break_start: 'Début de pause pointé',
            break_end: 'Reprise pointée',
            clock_out: 'Départ pointé'
          };

          toast({
            title: messages[action],
            description: `Pointage effectué à ${timeString}`,
          });
        }
      }
    } catch (error) {
      console.error('Clock action error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le pointage",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <LoadingState message="Chargement de votre dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  const todayHours = Math.floor(todayStats.totalMinutes / 60);
  const todayMinutes = Math.floor(todayStats.totalMinutes % 60);
  const weeklyProgress = (weeklyHours / 40) * 100;
  const dailyProgress = (todayStats.totalMinutes / 480) * 100; // 8 hours = 480 minutes

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <BreadcrumbNav />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Bonjour {user?.full_name || 'Utilisateur'} 👋
          </h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayHours}h {todayMinutes.toString().padStart(2, '0')}m
              </div>
              <p className="text-xs text-muted-foreground">
                Objectif: 8h 00m
              </p>
              <Progress value={dailyProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{weeklyHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                Objectif: 40h 00m
              </p>
              <Progress value={weeklyProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statut actuel</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {todayStats.currentStatus === 'not_started' && 'Non commencé'}
                {todayStats.currentStatus === 'working' && 'En travail'}
                {todayStats.currentStatus === 'on_break' && 'En pause'}
                {todayStats.currentStatus === 'finished' && 'Terminé'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklyProgress > 100 ? '100+' : Math.round(weeklyProgress)}%
              </div>
              <p className="text-xs text-muted-foreground">
                de l'objectif hebdomadaire
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <p className="text-muted-foreground">Heure actuelle</p>
              </div>
              
              <div className="space-y-2">
                {todayStats.currentStatus === 'not_started' && (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => handleClockAction('clock_in')}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Pointer l'arrivée
                  </Button>
                )}
                
                {todayStats.currentStatus === 'working' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleClockAction('break_start')}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Commencer la pause
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleClockAction('clock_out')}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Pointer le départ
                    </Button>
                  </>
                )}
                
                {todayStats.currentStatus === 'on_break' && (
                  <>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleClockAction('break_end')}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Reprendre le travail
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="w-full" 
                      size="lg"
                      onClick={() => handleClockAction('clock_out')}
                    >
                      <Square className="mr-2 h-4 w-4" />
                      Pointer le départ
                    </Button>
                  </>
                )}
                
                {todayStats.currentStatus === 'finished' && (
                  <div className="text-center py-4">
                    <Badge className="bg-green-100 text-green-800">
                      Journée terminée
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      Dernière action: {todayStats.lastAction?.time}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/employee/time-entry')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Saisie détaillée des heures
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/employee/planning')}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Consulter mon planning
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/employee/reports')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Voir mes rapports
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/employee/tasks')}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Gérer mes tâches
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.start_time} - {entry.end_time || 'En cours'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{entry.total_hours}h</p>
                      <Badge 
                        variant={
                          entry.status === 'approved' ? 'default' :
                          entry.status === 'submitted' ? 'secondary' :
                          entry.status === 'rejected' ? 'destructive' : 'outline'
                        }
                        className="text-xs"
                      >
                        {entry.status === 'approved' && 'Validé'}
                        {entry.status === 'submitted' && 'Soumis'}
                        {entry.status === 'rejected' && 'Rejeté'}
                        {entry.status === 'draft' && 'Brouillon'}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {timeEntries.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground text-sm">Aucune activité récente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};