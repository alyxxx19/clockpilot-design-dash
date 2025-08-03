import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Coffee, Home, Calendar as CalendarIcon, Clock, MapPin, FileText, AlertTriangle, CheckCircle, Info, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const daysOfWeekFull = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Structure enrichie des données de planning
interface PlanningShift {
  start: string;
  end: string;
  pauseStart: string;
  pauseEnd: string;
  location: string;
  totalHours: number;
  task?: string;
  notes?: string;
}

interface PlanningDay {
  date: string;
  type: 'travail' | 'conge' | 'repos' | 'ferie' | 'maladie' | 'mi-temps';
  shifts: PlanningShift[];
}

// Nouvelles interfaces pour la comparaison
interface AdminSchedule {
  date: string;
  shifts: PlanningShift[];
  totalPlanned: number;
}

interface EmployeeEntry {
  date: string;
  shifts: PlanningShift[];
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

// Données de démonstration enrichies - Planning employé
const enrichedPlanning: PlanningDay[] = [
  {
    date: '2024-01-15',
    type: 'travail',
    shifts: [{
      start: '08:30',
      end: '17:30',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      location: 'Bureau',
      totalHours: 8,
      task: 'Développement Frontend',
      notes: 'Réunion équipe à 14h'
    }]
  },
  {
    date: '2024-01-16',
    type: 'travail',
    shifts: [{
      start: '08:30',
      end: '17:30',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      location: 'Bureau',
      totalHours: 8,
      task: 'Tests et Debug'
    }]
  },
  {
    date: '2024-01-17',
    type: 'mi-temps',
    shifts: [{
      start: '09:00',
      end: '13:00',
      pauseStart: '',
      pauseEnd: '',
      location: 'Télétravail',
      totalHours: 4,
      task: 'Formation'
    }]
  },
  {
    date: '2024-01-18',
    type: 'travail',
    shifts: [{
      start: '08:30',
      end: '17:30',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      location: 'Bureau',
      totalHours: 8,
      task: 'Réunion client'
    }]
  },
  {
    date: '2024-01-19',
    type: 'conge',
    shifts: []
  },
  {
    date: '2024-01-20',
    type: 'repos',
    shifts: []
  },
  {
    date: '2024-01-21',
    type: 'repos',
    shifts: []
  },
  {
    date: '2024-01-22',
    type: 'travail',
    shifts: [{
      start: '08:30',
      end: '17:30',
      pauseStart: '12:00',
      pauseEnd: '13:00',
      location: 'Bureau',
      totalHours: 8,
      task: 'Développement Backend'
    }]
  },
  {
    date: '2024-01-23',
    type: 'maladie',
    shifts: []
  },
  {
    date: '2024-01-24',
    type: 'ferie',
    shifts: []
  }
];

// Données de comparaison admin vs employé
const comparisonData: DayComparison[] = [
  {
    date: '2024-01-15',
    admin: {
      date: '2024-01-15',
      shifts: [{
        start: '08:30',
        end: '17:30',
        pauseStart: '12:00',
        pauseEnd: '13:00',
        location: 'Bureau',
        totalHours: 8,
        task: 'Développement Frontend'
      }],
      totalPlanned: 8
    },
    employee: {
      date: '2024-01-15',
      shifts: [{
        start: '08:45',
        end: '17:45',
        pauseStart: '12:00',
        pauseEnd: '13:00',
        location: 'Bureau',
        totalHours: 8,
        task: 'Développement Frontend'
      }],
      totalWorked: 8,
      status: 'submitted'
    },
    variance: { hours: 0, status: 'match' }
  },
  {
    date: '2024-01-16',
    admin: {
      date: '2024-01-16',
      shifts: [{
        start: '08:30',
        end: '17:30',
        pauseStart: '12:00',
        pauseEnd: '13:00',
        location: 'Bureau',
        totalHours: 8,
        task: 'Tests et Debug'
      }],
      totalPlanned: 8
    },
    employee: {
      date: '2024-01-16',
      shifts: [{
        start: '08:30',
        end: '18:00',
        pauseStart: '12:00',
        pauseEnd: '13:00',
        location: 'Bureau',
        totalHours: 8.5,
        task: 'Tests et Debug'
      }],
      totalWorked: 8.5,
      status: 'approved'
    },
    variance: { hours: 0.5, status: 'over' }
  },
  {
    date: '2024-01-17',
    admin: {
      date: '2024-01-17',
      shifts: [{
        start: '09:00',
        end: '13:00',
        pauseStart: '',
        pauseEnd: '',
        location: 'Télétravail',
        totalHours: 4,
        task: 'Formation'
      }],
      totalPlanned: 4
    },
    employee: null,
    variance: { hours: -4, status: 'missing' }
  }
];

export const Planning: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15)); // 15 Janvier 2024
  const [viewMode, setViewMode] = useState<'jour' | 'semaine' | 'mois'>('mois');
  const [selectedDay, setSelectedDay] = useState<PlanningDay | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const { toast } = useToast();

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'jour') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'semaine') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getPlanningForDate = (date: string): PlanningDay | null => {
    return enrichedPlanning.find(p => p.date === date) || null;
  };

  const getComparisonForDate = (date: string): DayComparison | null => {
    return comparisonData.find(d => d.date === date) || null;
  };

  const getTypeColor = (type: PlanningDay['type']) => {
    switch (type) {
      case 'travail': return 'bg-primary text-primary-foreground';
      case 'mi-temps': return 'bg-blue-100 text-blue-800';
      case 'conge': return 'bg-orange-100 text-orange-800';
      case 'repos': return 'bg-gray-100 text-gray-800';
      case 'ferie': return 'bg-purple-100 text-purple-800';
      case 'maladie': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: PlanningDay['type']) => {
    switch (type) {
      case 'travail': return 'Travail';
      case 'mi-temps': return 'Mi-temps';
      case 'conge': return 'Congé';
      case 'repos': return 'Repos';
      case 'ferie': return 'Férié';
      case 'maladie': return 'Maladie';
      default: return type;
    }
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

  const handleDayClick = (day: PlanningDay) => {
    setSelectedDay(day);
    setIsDetailModalOpen(true);
  };

  // Aller à aujourd'hui
  const goToToday = () => {
    setSelectedDate(new Date());
    toast({
      title: "Navigation",
      description: "Retour à la date d'aujourd'hui",
    });
  };

  // Naviguer vers la saisie d'heures
  const handleTimeEntry = () => {
    navigate('/employee/time-entry');
  };

  const renderTimeSlot = (slot: PlanningShift, isAdmin: boolean) => {
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
              {slot.task || 'Travail'}
            </div>
            {slot.location && (
              <div className="text-xs text-muted-foreground">
                📍 {slot.location}
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {slot.totalHours}h
          </Badge>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayPlanning = getPlanningForDate(dateStr);
    const comparison = getComparisonForDate(dateStr);
    
    if (showComparison && comparison) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h3>
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getVarianceColor(comparison.variance.status)}`}>
              {getVarianceIcon(comparison.variance.status)}
              <span className="text-sm font-medium">
                {comparison.variance.status === 'match' && 'Conforme'}
                {comparison.variance.status === 'over' && `+${comparison.variance.hours}h`}
                {comparison.variance.status === 'under' && `${comparison.variance.hours}h`}
                {comparison.variance.status === 'missing' && 'Non saisi'}
              </span>
            </div>
          </div>

          {/* Résumé de comparaison */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la journée</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-600">{comparison.admin.totalPlanned}h</div>
                  <div className="text-sm text-muted-foreground">Planifié (Admin)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {comparison.employee?.totalWorked || 0}h
                  </div>
                  <div className="text-sm text-muted-foreground">Saisi (Employé)</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${comparison.variance.hours >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {comparison.variance.hours > 0 ? '+' : ''}{comparison.variance.hours}h
                  </div>
                  <div className="text-sm text-muted-foreground">Écart</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparaison détaillée */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Planning Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-slate-600" />
                  <span>Planning Administratif</span>
                  <Badge variant="outline" className="bg-slate-50 text-slate-700">Officiel</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {comparison.admin.shifts.map(shift => renderTimeSlot(shift, true))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total planifié:</span>
                    <span className="font-medium">{comparison.admin.totalPlanned}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Heures Employé */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span>Heures Saisies</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">Employé</Badge>
                  </div>
                  {comparison.employee && getStatusBadge(comparison.employee.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {comparison.employee ? (
                  <>
                    <div className="space-y-2">
                      {comparison.employee.shifts.map(shift => renderTimeSlot(shift, false))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total saisi:</span>
                        <span className="font-medium">{comparison.employee.totalWorked}h</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune heure saisie pour cette journée</p>
                    <Button className="mt-4" size="sm" onClick={handleTimeEntry}>
                      Saisir mes heures
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analyse des écarts */}
          {comparison.employee && comparison.variance.status !== 'match' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Analyse des écarts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comparison.variance.status === 'over' && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Heures supplémentaires détectées</h4>
                      <p className="text-sm text-orange-700">
                        Vous avez travaillé {comparison.variance.hours}h de plus que prévu. 
                        Assurez-vous que ces heures supplémentaires sont justifiées.
                      </p>
                    </div>
                  )}
                  {comparison.variance.status === 'under' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Heures manquantes</h4>
                      <p className="text-sm text-blue-700">
                        Il manque {Math.abs(comparison.variance.hours)}h par rapport au planning prévu.
                        Vérifiez votre saisie ou contactez votre superviseur.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    // Vue planning normal (sans comparaison)
    if (!dayPlanning || dayPlanning.shifts.length === 0) {
      return (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun créneau planifié pour cette journée</p>
        </div>
      );
    }

    const shift = dayPlanning.shifts[0];
    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6h à 22h

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h3>
          <Badge className={getTypeColor(dayPlanning.type)} variant="secondary">
            {getTypeLabel(dayPlanning.type)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-3">
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="flex items-center h-12 border-b border-border">
                  <div className="w-16 text-sm text-muted-foreground">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 relative">
                    {/* Bloc de travail */}
                    {shift.start && (
                      (() => {
                        const startHour = parseInt(shift.start.split(':')[0]);
                        const startMin = parseInt(shift.start.split(':')[1]);
                        const endHour = parseInt(shift.end.split(':')[0]);
                        const endMin = parseInt(shift.end.split(':')[1]);
                        
                        if (hour >= startHour && hour < endHour) {
                          const isFirstHour = hour === startHour;
                          const isLastHour = hour === endHour - 1;
                          
                          return (
                            <div className={`absolute left-2 right-2 bg-primary text-primary-foreground rounded-md p-2 ${
                              isFirstHour ? 'top-' + Math.floor(startMin / 60 * 48) : 'top-0'
                            } ${
                              isLastHour ? 'bottom-' + Math.floor((60 - endMin) / 60 * 48) : 'bottom-0'
                            }`}>
                              {isFirstHour && (
                                <div className="text-xs font-medium">
                                  {shift.task || 'Travail'}
                                </div>
                              )}
                            </div>
                          );
                        }
                        
                        // Bloc de pause
                        if (shift.pauseStart && shift.pauseEnd) {
                          const pauseStartHour = parseInt(shift.pauseStart.split(':')[0]);
                          const pauseEndHour = parseInt(shift.pauseEnd.split(':')[0]);
                          
                          if (hour >= pauseStartHour && hour < pauseEndHour) {
                            return (
                              <div className="absolute left-2 right-2 top-0 bottom-0 bg-muted border-2 border-dashed border-muted-foreground rounded-md flex items-center justify-center">
                                <Coffee className="h-4 w-4 text-muted-foreground" />
                              </div>
                            );
                          }
                        }
                        
                        return null;
                      })()
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informations latérales */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Détails</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{shift.start} - {shift.end}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{shift.location}</span>
                </div>
                {shift.pauseStart && (
                  <div className="flex items-center space-x-2">
                    <Coffee className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{shift.pauseStart} - {shift.pauseEnd}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{shift.totalHours}h travaillées</span>
                </div>
              </CardContent>
            </Card>

            {shift.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{shift.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            Semaine du {weekDays[0].getDate()} au {weekDays[6].getDate()} {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayPlanning = getPlanningForDate(dateStr);
            const comparison = showComparison ? getComparisonForDate(dateStr) : null;
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={index} className="space-y-2">
                <div className="text-center">
                  <p className="text-sm font-medium">{daysOfWeek[index]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {date.getDate()}
                  </p>
                  {isToday && <Badge variant="secondary" className="text-xs">Aujourd'hui</Badge>}
                  {comparison && (
                    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getVarianceColor(comparison.variance.status)}`}>
                      {getVarianceIcon(comparison.variance.status)}
                    </div>
                  )}
                </div>

                <div className="min-h-32 border border-border rounded-lg p-2">
                  {dayPlanning ? (
                    <div 
                      className={`p-2 rounded cursor-pointer hover:opacity-80 transition-opacity ${getTypeColor(dayPlanning.type)}`}
                      onClick={() => handleDayClick(dayPlanning)}
                    >
                      {dayPlanning.shifts.length > 0 ? (
                        <div className="text-xs space-y-1">
                          <div>{dayPlanning.shifts[0].start}-{dayPlanning.shifts[0].end}</div>
                          {dayPlanning.shifts[0].pauseStart && (
                            <div className="flex items-center space-x-1">
                              <Coffee className="h-3 w-3" />
                              <span>{dayPlanning.shifts[0].pauseStart}-{dayPlanning.shifts[0].pauseEnd}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{dayPlanning.shifts[0].location}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-center">
                          {getTypeLabel(dayPlanning.type)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      Libre
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentDate.getFullYear() && 
                           today.getMonth() === currentDate.getMonth();

    const renderCalendarDays = () => {
      const days = [];
      
      // Jours vides en début de mois
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-20"></div>);
      }
      
      // Jours du mois
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayPlanning = getPlanningForDate(dateKey);
        const comparison = showComparison ? getComparisonForDate(dateKey) : null;
        const isToday = isCurrentMonth && day === today.getDate();
        
        days.push(
          <div
            key={day}
            className={`h-20 border border-border p-1 cursor-pointer hover:bg-accent transition-colors ${
              isToday ? 'bg-accent ring-2 ring-primary' : 'bg-card'
            }`}
            onClick={() => dayPlanning && handleDayClick(dayPlanning)}
          >
            <div className={`text-sm font-medium mb-1 flex items-center justify-between ${
              isToday ? 'text-primary font-bold' : 'text-card-foreground'
            }`}>
              <span>{day}</span>
              {comparison && (
                <div className={`w-2 h-2 rounded-full ${
                  comparison.variance.status === 'match' ? 'bg-green-500' :
                  comparison.variance.status === 'over' ? 'bg-orange-500' :
                  comparison.variance.status === 'under' ? 'bg-blue-500' :
                  'bg-red-500'
                }`}></div>
              )}
            </div>
            {dayPlanning && (
              <div className="space-y-1">
                {dayPlanning.shifts.length > 0 ? (
                  <div className={`text-xs px-1 py-0.5 rounded ${getTypeColor(dayPlanning.type)}`}>
                    {dayPlanning.shifts[0].start}-{dayPlanning.shifts[0].end}
                  </div>
                ) : (
                  <div className={`text-xs px-1 py-0.5 rounded ${getTypeColor(dayPlanning.type)}`}>
                    {getTypeLabel(dayPlanning.type)}
                  </div>
                )}
                {dayPlanning.shifts[0]?.pauseStart && (
                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                    <Coffee className="h-3 w-3" />
                    <span>{dayPlanning.shifts[0].pauseStart}-{dayPlanning.shifts[0].pauseEnd}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      return days;
    };

    return (
      <div className="space-y-4">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {daysOfWeek.map(day => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
          {renderCalendarDays()}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon Planning</h1>
            <p className="text-muted-foreground">Consultez vos horaires et comparez avec vos heures saisies</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium min-w-48 text-center">
              {viewMode === 'jour' && currentDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
              {viewMode === 'semaine' && `Semaine du ${currentDate.toLocaleDateString('fr-FR')}`}
              {viewMode === 'mois' && `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contrôles */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Mode de vue */}
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <TabsList>
                  <TabsTrigger value="jour">Jour</TabsTrigger>
                  <TabsTrigger value="semaine">Semaine</TabsTrigger>
                  <TabsTrigger value="mois">Mois</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Options d'affichage */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch checked={showComparison} onCheckedChange={setShowComparison} />
                  <Label>Mode comparaison</Label>
                </div>
                {showComparison && (
                  <div className="flex items-center space-x-2">
                    <Switch checked={showLegend} onCheckedChange={setShowLegend} />
                    <Label>Légende</Label>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                >
                  Aujourd'hui
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Légende (mode comparaison) */}
        {showComparison && showLegend && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Légende - Mode Comparaison</CardTitle>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contenu principal */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {showComparison ? 'Planning & Comparaison' : 'Planning'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'jour' && renderDayView()}
              {viewMode === 'semaine' && renderWeekView()}
              {viewMode === 'mois' && renderMonthView()}
            </CardContent>
          </Card>

          {/* Légende et statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>{showComparison ? 'Indicateurs' : 'Légende'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showComparison ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="text-sm">Jour travaillé</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                    <span className="text-sm">Mi-temps</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-orange-100 border border-orange-200 rounded"></div>
                    <span className="text-sm">Congé</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                    <span className="text-sm">Jour de repos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-purple-100 border border-purple-200 rounded"></div>
                    <span className="text-sm">Jour férié</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                    <span className="text-sm">Absence maladie</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Coffee className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Pause</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-accent border-2 border-primary rounded"></div>
                    <span className="text-sm">Aujourd'hui</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Conformité</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Conforme</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm">Heures sup.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Heures manq.</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Non saisi</span>
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-3">Ce mois-ci</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Jours travaillés:</span>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Congés pris:</span>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures prévues:</span>
                    <span className="font-medium">144h</span>
                  </div>
                  {showComparison && (
                    <>
                      <div className="flex justify-between">
                        <span>Heures saisies:</span>
                        <span className="font-medium">140h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taux conformité:</span>
                        <span className="font-medium text-green-600">97%</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modal de détails */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Détails du {selectedDay?.date && new Date(selectedDay.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </DialogTitle>
            </DialogHeader>
            {selectedDay && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeColor(selectedDay.type)} variant="secondary">
                    {getTypeLabel(selectedDay.type)}
                  </Badge>
                </div>
                
                {selectedDay.shifts.length > 0 && (
                  <div className="space-y-4">
                    {selectedDay.shifts.map((shift, index) => (
                      <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Horaires</label>
                            <p className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{shift.start} - {shift.end}</span>
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Lieu</label>
                            <p className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>{shift.location}</span>
                            </p>
                          </div>
                        </div>
                        
                        {shift.pauseStart && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Pause</label>
                            <p className="flex items-center space-x-1">
                              <Coffee className="h-4 w-4" />
                              <span>{shift.pauseStart} - {shift.pauseEnd}</span>
                            </p>
                          </div>
                        )}
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Total</label>
                          <p className="font-medium">{shift.totalHours}h travaillées</p>
                        </div>
                        
                        {shift.task && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Tâche</label>
                            <p>{shift.task}</p>
                          </div>
                        )}
                        
                        {shift.notes && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <p className="text-sm text-muted-foreground">{shift.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedDay.shifts.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Aucun créneau de travail pour cette journée
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};