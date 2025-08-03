import React from 'react';
import { Clock, CheckSquare, BarChart3, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export const EmployeeDashboard: React.FC = () => {
  const currentTime = new Date().toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

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
              <div className="text-2xl font-bold">7h 30m</div>
              <p className="text-xs text-muted-foreground">
                Objectif: 8h 00m
              </p>
              <Progress value={94} className="mt-2" />
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

          {/* Prochaine pause */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prochaine pause</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15:30</div>
              <p className="text-xs text-muted-foreground">
                Dans 2h 15m
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pointage rapide */}
          <Card>
            <CardHeader>
              <CardTitle>Pointage rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">{currentTime}</div>
                <p className="text-muted-foreground">Heure actuelle</p>
              </div>
              <div className="flex space-x-2">
                <Button className="flex-1" size="lg">
                  Pointer l'arrivée
                </Button>
                <Button variant="outline" className="flex-1" size="lg">
                  Pointer la pause
                </Button>
              </div>
              <Button variant="secondary" className="w-full" size="lg">
                Pointer le départ
              </Button>
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
              <Button variant="outline" className="w-full mt-4">
                Voir toutes les tâches
              </Button>
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
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Arrivée</p>
                  <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">08:30</p>
                  <p className="text-xs text-muted-foreground">Bureau</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Pause déjeuner</p>
                  <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">12:00 - 13:00</p>
                  <p className="text-xs text-muted-foreground">1h 00m</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Départ</p>
                  <p className="text-xs text-muted-foreground">Hier</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">17:30</p>
                  <p className="text-xs text-muted-foreground">Bureau</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};