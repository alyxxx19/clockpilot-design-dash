import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle, CheckCircle, Info, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

interface TimeSlot {
  start: string;
  end: string;
  type: 'travail' | 'pause' | 'reunion' | 'formation';
  task?: string;
  location?: string;
}

interface AdminSchedule {
  date: string;
  slots: TimeSlot[];
  totalPlanned: number;
}

interface EmployeeEntry {
  date: string;
  slots: TimeSlot[];
  totalWorked: number;
  status: 'draft' | 'submitted' | 'approved';
}

interface DayComparison {
  date: string;
  admin: AdminSchedule;
  employee: EmployeeEntry | null;
  variance: {
    hours: number;
    status: 'match' | 'under' | 'over' | 'missing';
  };
}

// Données de démonstration
const mockData: DayComparison[] = [
  {
    date: '2024-01-15',
    admin: {
      date: '2024-01-15',
      slots: [
        { start: '08:30', end: '12:00', type: 'travail', task: 'Production A', location: 'Atelier 1' },
        { start: '12:00', end: '13:00', type: 'pause', task: 'Pause déjeuner' },
        { start: '13:00', end: '17:30', type: 'travail', task: 'Production A', location: 'Atelier 1' }
      ],
      totalPlanned: 8
    },
    employee: {
      date: '2024-01-15',
      slots: [
        { start: '08:45', end: '12:00', type: 'travail', task: 'Production A' },
        { start: '12:00', end: '13:00', type: 'pause' },
        { start: '13:00', end: '17:45', type: 'travail', task: 'Production A' }
      ],
      totalWorked: 8,
      status: 'submitted'
    },
    variance: { hours: 0, status: 'match' }
  },
  {
    date: '2024-01-16',
    admin: {
      date: '2024-01-16',
      slots: [
        { start: '08:30', end: '12:00', type: 'travail', task: 'Formation sécurité', location: 'Salle B' },
        { start: '12:00', end: '13:00', type: 'pause' },
        { start: '13:00', end: '17:30', type: 'travail', task: 'Production B', location: 'Atelier 2' }
      ],
      totalPlanned: 8
    },
    employee: {
      date: '2024-01-16',
      slots: [
        { start: '08:30', end: '12:00', type: 'formation', task: 'Formation sécurité' },
        { start: '12:00', end: '13:00', type: 'pause' },
        { start: '13:00', end: '18:00', type: 'travail', task: 'Production B' }
      ],
      totalWorked: 8.5,
      status: 'approved'
    },
    variance: { hours: 0.5, status: 'over' }
  },
  {
    date: '2024-01-17',
    admin: {
      date: '2024-01-17',
      slots: [
        { start: '08:30', end: '17:30', type: 'travail', task: 'Production C', location: 'Atelier 1' }
      ],
      totalPlanned: 8
    },
    employee: null,
    variance: { hours: -8, status: 'missing' }
  }
];

export const ScheduleComparison: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'comparison' | 'admin-only' | 'employee-only'>('comparison');
  const [showLegend, setShowLegend] = useState(true);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const getCurrentDayData = (): DayComparison | null => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return mockData.find(d => d.date === dateStr) || null;
  };

  const getVarianceColor = (status: string) => {
    switch (status) {
      case 'match': return 'text-green-600 bg-green-50';
      case 'over': return 'text-orange-600 bg-orange-50';
      case 'under': return 'text-blue-600 bg-blue-50';
      case 'missing': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getVarianceIcon = (status: string) => {
    switch (status) {
      case 'match': return <CheckCircle className="h-4 w-4" />;
      case 'over': case 'under': return <AlertTriangle className="h-4 w-4" />;
      case 'missing': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Brouillon</Badge>;
      case 'submitted': return <Badge className="bg-blue-100 text-blue-800">Soumis</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      default: return null;
    }
  };

  const renderTimeSlot = (slot: TimeSlot, isAdmin: boolean) => {
    const baseClasses = "p-3 rounded-lg border-l-4 mb-2";
    const adminClasses = "bg-slate-50 border-l-slate-600 border border-slate-200";
    const employeeClasses = "bg-blue-50 border-l-blue-600 border border-blue-200";
    
    return (
      <div key={`${slot.start}-${slot.end}`} className={`${baseClasses} ${isAdmin ? adminClasses : employeeClasses}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium text-sm">
              {slot.start} - {slot.end}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {slot.task || `${slot.type.charAt(0).toUpperCase()}${slot.type.slice(1)}`}
            </div>
            {slot.location && (
              <div className="text-xs text-muted-foreground">
                📍 {slot.location}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {slot.type}
          </Badge>
        </div>
      </div>
    );
  };

  const dayData = getCurrentDayData();

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Comparaison Planning</h1>
          <p className="text-muted-foreground">Comparez le planning administratif avec vos heures saisies</p>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Date Navigation */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium min-w-48 text-center">
                  {selectedDate.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* View Mode */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="comparison">Comparaison</TabsTrigger>
                  <TabsTrigger value="admin-only">Planning Admin</TabsTrigger>
                  <TabsTrigger value="employee-only">Mes Heures</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Legend Toggle */}
              <div className="flex items-center space-x-2">
                <Switch checked={showLegend} onCheckedChange={setShowLegend} />
                <Label>Légende</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        {showLegend && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Légende</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Types de données</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-slate-50 border-l-4 border-l-slate-600 border border-slate-200 rounded"></div>
                    <span className="text-sm">Planning Administratif (Officiel)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-50 border-l-4 border-l-blue-600 border border-blue-200 rounded"></div>
                    <span className="text-sm">Heures Employé (Saisies)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Statuts de variance</h4>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Conforme</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm">Écart détecté</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Données manquantes</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {dayData ? (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Résumé de la journée</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getVarianceColor(dayData.variance.status)}`}>
                    {getVarianceIcon(dayData.variance.status)}
                    <span className="text-sm font-medium">
                      {dayData.variance.status === 'match' && 'Conforme'}
                      {dayData.variance.status === 'over' && `+${dayData.variance.hours}h`}
                      {dayData.variance.status === 'under' && `${dayData.variance.hours}h`}
                      {dayData.variance.status === 'missing' && 'Non saisi'}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">{dayData.admin.totalPlanned}h</div>
                    <div className="text-sm text-muted-foreground">Planifié (Admin)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {dayData.employee?.totalWorked || 0}h
                    </div>
                    <div className="text-sm text-muted-foreground">Saisi (Employé)</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${dayData.variance.hours >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                      {dayData.variance.hours > 0 ? '+' : ''}{dayData.variance.hours}h
                    </div>
                    <div className="text-sm text-muted-foreground">Écart</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admin Schedule */}
              {(viewMode === 'comparison' || viewMode === 'admin-only') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-slate-600" />
                      <span>Planning Administratif</span>
                      <Badge variant="outline" className="bg-slate-50 text-slate-700">Officiel</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dayData.admin.slots.map(slot => renderTimeSlot(slot, true))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total planifié:</span>
                        <span className="font-medium">{dayData.admin.totalPlanned}h</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Employee Entry */}
              {(viewMode === 'comparison' || viewMode === 'employee-only') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span>Heures Saisies</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">Employé</Badge>
                      </div>
                      {dayData.employee && getStatusBadge(dayData.employee.status)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dayData.employee ? (
                      <>
                        <div className="space-y-2">
                          {dayData.employee.slots.map(slot => renderTimeSlot(slot, false))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total saisi:</span>
                            <span className="font-medium">{dayData.employee.totalWorked}h</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucune heure saisie pour cette journée</p>
                        <Button className="mt-4" size="sm">
                          Saisir mes heures
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Discrepancies Analysis */}
            {viewMode === 'comparison' && dayData.employee && dayData.variance.status !== 'match' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span>Analyse des écarts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dayData.variance.status === 'over' && (
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h4 className="font-medium text-orange-800 mb-2">Heures supplémentaires détectées</h4>
                        <p className="text-sm text-orange-700">
                          Vous avez travaillé {dayData.variance.hours}h de plus que prévu. 
                          Assurez-vous que ces heures supplémentaires sont justifiées.
                        </p>
                      </div>
                    )}
                    {dayData.variance.status === 'under' && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Heures manquantes</h4>
                        <p className="text-sm text-blue-700">
                          Il manque {Math.abs(dayData.variance.hours)}h par rapport au planning prévu.
                          Vérifiez votre saisie ou contactez votre superviseur.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
              <p className="text-muted-foreground">
                Aucun planning ou saisie d'heures trouvé pour cette date.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};