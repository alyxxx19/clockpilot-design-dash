import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckSquare, BarChart3, Calendar, User, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
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
  const { user, employee } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: [`/api/dashboard/stats/${user?.id}`],
    enabled: !!user?.id,
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const currentStats = dashboardStats || {
    totalWeekHours: '0h',
    totalTodayHours: '0h',
    activeTasks: 0,
    completedTasks: 0,
    todaySchedule: null,
    recentTimeEntries: [],
    upcomingTasks: []
  };

  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement du tableau de bord...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground">
              Bienvenue, {user?.name} • {currentTime.toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => navigate('/employee/tasks')}
              data-testid="button-view-tasks"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Mes Tâches
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/employee/time-entry')}
              data-testid="button-time-entry"
            >
              <Clock className="h-4 w-4 mr-2" />
              Saisie d'heures
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                  <p className="text-2xl font-bold" data-testid="text-today-hours">
                    {currentStats.totalTodayHours}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Cette semaine</p>
                  <p className="text-2xl font-bold" data-testid="text-week-hours">
                    {currentStats.totalWeekHours}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tâches actives</p>
                  <p className="text-2xl font-bold" data-testid="text-active-tasks">
                    {currentStats.activeTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tâches terminées</p>
                  <p className="text-2xl font-bold" data-testid="text-completed-tasks">
                    {currentStats.completedTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="h-20 flex-col space-y-2"
                onClick={() => navigate('/employee/tasks')}
                data-testid="button-manage-tasks"
              >
                <CheckSquare className="h-6 w-6" />
                <span>Gérer mes tâches</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => navigate('/employee/time-entry')}
                data-testid="button-log-time"
              >
                <Clock className="h-6 w-6" />
                <span>Saisir les heures</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => navigate('/employee/reports')}
                data-testid="button-view-reports"
              >
                <BarChart3 className="h-6 w-6" />
                <span>Voir les rapports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Employee Info */}
        {employee && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informations employé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numéro d'employé</p>
                  <p className="font-medium" data-testid="text-employee-number">
                    {employee.employeeNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Département</p>
                  <p className="font-medium" data-testid="text-department">
                    {employee.department}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Poste</p>
                  <p className="font-medium" data-testid="text-position">
                    {employee.position}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Heures par semaine</p>
                  <p className="font-medium" data-testid="text-weekly-hours">
                    {employee.weeklyHours}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};