import React from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Clock,
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  // Données de démonstration
  const todayStats = {
    totalHours: 124.5,
    activeEmployees: 18,
    presentEmployees: 15,
    attendanceRate: 83
  };

  const recentAlerts = [
    { id: 1, type: 'delay', employee: 'Marie Dupont', message: 'Retard de 15 min', time: '09:15' },
    { id: 2, type: 'absence', employee: 'Jean Martin', message: 'Absence non justifiée', time: '08:00' },
    { id: 3, type: 'overtime', employee: 'Sarah Wilson', message: 'Heures sup. non validées', time: '18:30' }
  ];

  const topEmployees = [
    { name: 'Alice Dubois', hours: 42.5, department: 'Production' },
    { name: 'Thomas Bernard', hours: 41.2, department: 'Logistique' },
    { name: 'Emma Rousseau', hours: 39.8, department: 'Qualité' },
    { name: 'Lucas Moreau', hours: 38.5, department: 'Production' },
    { name: 'Camille Leroy', hours: 37.9, department: 'Admin' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard Administrateur</h1>
          <p className="text-muted-foreground mt-1">Vue d'ensemble des activités en temps réel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures Aujourd'hui</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12%</span> vs hier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.activeEmployees}</div>
              <p className="text-xs text-muted-foreground">
                Total employés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Présents</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.presentEmployees}</div>
              <p className="text-xs text-muted-foreground">
                sur {todayStats.activeEmployees} employés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Présence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+2%</span> vs semaine dernière
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Alertes Récentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertes Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          alert.type === 'delay' ? 'secondary' : 
                          alert.type === 'absence' ? 'destructive' : 'default'
                        }
                        className="w-2 h-2 p-0 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-sm">{alert.employee}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Employés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top 5 Employés (Cette Semaine)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topEmployees.map((employee, index) => (
                  <div key={employee.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{employee.hours}h</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};