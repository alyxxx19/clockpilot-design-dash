import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const months = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Données de démonstration
const shifts = {
  '2024-01-15': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-16': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-17': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-18': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-19': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-22': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-23': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-24': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-25': { type: 'work', hours: '08:30 - 17:30' },
  '2024-01-26': { type: 'vacation', hours: 'Congé' },
};

export const Planning: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 1)); // Janvier 2024

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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentDate.getFullYear() && 
                         today.getMonth() === currentDate.getMonth();

  const renderCalendarDays = () => {
    const days = [];
    
    // Jours vides en début de mois
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-16"></div>);
    }
    
    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = formatDateKey(currentDate.getFullYear(), currentDate.getMonth(), day);
      const shift = shifts[dateKey];
      const isToday = isCurrentMonth && day === today.getDate();
      
      days.push(
        <div
          key={day}
          className={`h-16 border border-border p-1 ${
            isToday ? 'bg-accent' : 'bg-card'
          }`}
        >
          <div className={`text-sm font-medium ${
            isToday ? 'text-accent-foreground' : 'text-card-foreground'
          }`}>
            {day}
          </div>
          {shift && (
            <div className={`text-xs mt-1 px-1 py-0.5 rounded ${
              shift.type === 'work' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-destructive text-destructive-foreground'
            }`}>
              {shift.type === 'work' ? '8h30' : 'Congé'}
            </div>
          )}
        </div>
      );
    }
    
    return days;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mon Planning</h1>
          <p className="text-muted-foreground">Consultez vos horaires et plannings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendrier */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Légende et statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Légende</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span className="text-sm">Jour travaillé</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-destructive rounded"></div>
                <span className="text-sm">Congé</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-accent border border-border rounded"></div>
                <span className="text-sm">Aujourd'hui</span>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="font-medium mb-3">Ce mois-ci</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Jours travaillés:</span>
                    <span className="font-medium">20</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Congés pris:</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures prévues:</span>
                    <span className="font-medium">160h</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planning de la semaine */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Planning de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['Lundi 15', 'Mardi 16', 'Mercredi 17', 'Jeudi 18', 'Vendredi 19'].map((day, index) => (
                <div key={day} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{day} Janvier</p>
                    <p className="text-sm text-muted-foreground">
                      {index === 4 ? 'Congé' : 'Bureau'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {index === 4 ? 'Jour de congé' : '08:30 - 17:30'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {index === 4 ? '' : '8h 00m'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};