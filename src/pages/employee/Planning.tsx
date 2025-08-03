import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { LoadingState } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/lib/supabase';

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

interface ScheduleEntry {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_start?: string;
  break_end?: string;
  location: string;
  task: string;
  notes?: string;
}

export const Planning: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'jour' | 'semaine' | 'mois'>('mois');
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const { user } = useAuth();

  // Calculate date range for current view
  const dateRange = React.useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'semaine') {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      end.setDate(start.getDate() + 6);
    } else if (viewMode === 'mois') {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }, [currentDate, viewMode]);

  const { timeEntries } = useTimeEntries(dateRange.start, dateRange.end);

  // Load schedule entries (planned vs actual)
  useEffect(() => {
    const loadScheduleEntries = async () => {
      if (!user) return;

      try {
        setLoading(true);
        // In a real app, this would fetch from a schedules table
        // For now, we'll use time entries as schedule data
        const entries: ScheduleEntry[] = timeEntries.map(entry => ({
          id: entry.id,
          date: entry.date,
          start_time: entry.start_time,
          end_time: entry.end_time || '17:30',
          break_start: entry.break_start,
          break_end: entry.break_end,
          location: 'Bureau',
          task: entry.project,
          notes: entry.notes
        }));

        setScheduleEntries(entries);
      } catch (error) {
        console.error('Error loading schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScheduleEntries();
  }, [user, timeEntries]);

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

  const goToToday = () => {
    setCurrentDate(new Date());
    toast({
      title: "Navigation",
      description: "Retour à la date d'aujourd'hui",
    });
  };

  const getEntryForDate = (date: string) => {
    return scheduleEntries.find(entry => entry.date === date);
  };

  const handleEntryClick = (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setIsDetailModalOpen(true);
  };

  const renderDayView = () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const entry = getEntryForDate(dateStr);
    
    if (!entry) {
      return (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucun planning pour cette journée</p>
        </div>
      );
    }

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
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{entry.start_time} - {entry.end_time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{entry.location}</span>
              </div>
              <div>
                <p className="font-medium">{entry.task}</p>
                {entry.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
            const entry = getEntryForDate(dateStr);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div key={index} className="space-y-2">
                <div className="text-center">
                  <p className="text-sm font-medium">{daysOfWeek[index]}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {date.getDate()}
                  </p>
                  {isToday && <Badge variant="secondary" className="text-xs">Aujourd'hui</Badge>}
                </div>

                <div className="min-h-32 border border-border rounded-lg p-2">
                  {entry ? (
                    <div 
                      className="p-2 bg-primary text-primary-foreground rounded cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleEntryClick(entry)}
                    >
                      <div className="text-xs space-y-1">
                        <div>{entry.start_time}-{entry.end_time}</div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{entry.location}</span>
                        </div>
                        <div className="font-medium">{entry.task}</div>
                      </div>
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
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentDate.getFullYear() && 
                           today.getMonth() === currentDate.getMonth();

    const renderCalendarDays = () => {
      const days = [];
      
      // Empty days at start
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-20"></div>);
      }
      
      // Days of month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const entry = getEntryForDate(dateStr);
        const isToday = isCurrentMonth && day === today.getDate();
        
        days.push(
          <div
            key={day}
            className={`h-20 border border-border p-1 cursor-pointer hover:bg-accent transition-colors ${
              isToday ? 'bg-accent ring-2 ring-primary' : 'bg-card'
            }`}
            onClick={() => entry && handleEntryClick(entry)}
          >
            <div className={`text-sm font-medium mb-1 ${
              isToday ? 'text-primary font-bold' : 'text-card-foreground'
            }`}>
              {day}
            </div>
            {entry && (
              <div className="space-y-1">
                <div className="text-xs px-1 py-0.5 rounded bg-primary text-primary-foreground">
                  {entry.start_time}-{entry.end_time}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {entry.task}
                </div>
              </div>
            )}
          </div>
        );
      }
      
      return days;
    };

    return (
      <div className="space-y-4">
        {/* Day headers */}
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
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden">
          {renderCalendarDays()}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <LoadingState message="Chargement de votre planning..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <BreadcrumbNav />
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mon Planning</h1>
            <p className="text-muted-foreground">Consultez vos horaires planifiés</p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Aujourd'hui
            </Button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
              <TabsList>
                <TabsTrigger value="jour">Jour</TabsTrigger>
                <TabsTrigger value="semaine">Semaine</TabsTrigger>
                <TabsTrigger value="mois">Mois</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Planning</CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'jour' && renderDayView()}
              {viewMode === 'semaine' && renderWeekView()}
              {viewMode === 'mois' && renderMonthView()}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Entrées planifiées :</span>
                  <span className="font-medium">{scheduleEntries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cette semaine :</span>
                  <span className="font-medium">
                    {scheduleEntries.filter(entry => {
                      const entryDate = new Date(entry.date);
                      const weekStart = new Date();
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      return entryDate >= weekStart && entryDate <= weekEnd;
                    }).length} jours
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ce mois :</span>
                  <span className="font-medium">
                    {scheduleEntries.filter(entry => {
                      const entryDate = new Date(entry.date);
                      return entryDate.getMonth() === currentDate.getMonth() &&
                             entryDate.getFullYear() === currentDate.getFullYear();
                    }).length} jours
                  </span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="text-sm">Jour planifié</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-accent border-2 border-primary rounded"></div>
                    <span className="text-sm">Aujourd'hui</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Détails du {selectedEntry?.date && new Date(selectedEntry.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </DialogTitle>
            </DialogHeader>
            {selectedEntry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Horaires</label>
                    <p className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{selectedEntry.start_time} - {selectedEntry.end_time}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Lieu</label>
                    <p className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedEntry.location}</span>
                    </p>
                  </div>
                </div>
                
                {selectedEntry.break_start && selectedEntry.break_end && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pause</label>
                    <p>{selectedEntry.break_start} - {selectedEntry.break_end}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tâche</label>
                  <p className="font-medium">{selectedEntry.task}</p>
                </div>
                
                {selectedEntry.notes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Notes</label>
                    <p className="text-sm text-muted-foreground">{selectedEntry.notes}</p>
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