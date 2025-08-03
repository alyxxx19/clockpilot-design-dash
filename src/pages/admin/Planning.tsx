import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  Plus,
  Copy,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  name: string;
  department: string;
  selected: boolean;
}

interface Shift {
  id: string;
  employeeId: string;
  day: string;
  startTime: string;
  endTime: string;
  task: string;
  department: string;
  notes?: string;
}

export const Planning: React.FC = () => {
  const { toast } = useToast();
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Marie Dupont', department: 'Production', selected: false },
    { id: '2', name: 'Jean Martin', department: 'Logistique', selected: false },
    { id: '3', name: 'Sarah Wilson', department: 'Qualité', selected: false },
    { id: '4', name: 'Thomas Bernard', department: 'Maintenance', selected: false },
    { id: '5', name: 'Emma Rousseau', department: 'Production', selected: false },
    { id: '6', name: 'Lucas Moreau', department: 'Logistique', selected: false }
  ]);

  const [shifts, setShifts] = useState<Shift[]>([
    { id: '1', employeeId: '1', day: 'monday', startTime: '08:00', endTime: '16:00', task: 'Production A', department: 'Production' },
    { id: '2', employeeId: '2', day: 'monday', startTime: '09:00', endTime: '17:00', task: 'Réception', department: 'Logistique' },
    { id: '3', employeeId: '1', day: 'tuesday', startTime: '08:00', endTime: '16:00', task: 'Production B', department: 'Production' },
  ]);

  const weekDays = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' }
  ];

  const taskTypes = [
    'Production A',
    'Production B',
    'Contrôle Qualité',
    'Maintenance',
    'Réception',
    'Expédition',
    'Nettoyage',
    'Formation'
  ];

  const getTaskColor = (task: string) => {
    const colors: { [key: string]: string } = {
      'Production A': 'bg-blue-100 text-blue-800',
      'Production B': 'bg-green-100 text-green-800',
      'Contrôle Qualité': 'bg-purple-100 text-purple-800',
      'Maintenance': 'bg-orange-100 text-orange-800',
      'Réception': 'bg-cyan-100 text-cyan-800',
      'Expédition': 'bg-pink-100 text-pink-800',
      'Nettoyage': 'bg-gray-100 text-gray-800',
      'Formation': 'bg-yellow-100 text-yellow-800'
    };
    return colors[task] || 'bg-gray-100 text-gray-800';
  };

  const handleEmployeeSelect = (employeeId: string, checked: boolean) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === employeeId ? { ...emp, selected: checked } : emp
    ));
  };

  const handleSelectAll = (checked: boolean) => {
    setEmployees(prev => prev.map(emp => ({ ...emp, selected: checked })));
  };

  const handleCreateShift = (day: string, employeeId?: string) => {
    setSelectedDay(day);
    setSelectedEmployee(employeeId || '');
    setIsShiftDialogOpen(true);
  };

  const duplicateWeek = () => {
    toast({
      title: "Semaine dupliquée",
      description: "Le planning a été dupliqué pour la semaine suivante.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Planning</h1>
            <p className="text-muted-foreground mt-1">Gestion des plannings hebdomadaires</p>
          </div>
          
          <Button onClick={duplicateWeek}>
            <Copy className="w-4 h-4 mr-2" />
            Dupliquer la semaine
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Liste des Employés */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Employés
                <Checkbox
                  checked={employees.every(emp => emp.selected)}
                  onCheckedChange={handleSelectAll}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-3">
                    <Checkbox
                      checked={employee.selected}
                      onCheckedChange={(checked) => handleEmployeeSelect(employee.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.department}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calendrier Hebdomadaire */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Semaine du 14 au 20 Octobre 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-4 font-medium">Employé</th>
                      {weekDays.map(day => (
                        <th key={day.key} className="text-center py-2 px-2 font-medium min-w-32">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.filter(emp => emp.selected).map((employee) => (
                      <tr key={employee.id} className="border-t">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-sm">{employee.name}</p>
                            <p className="text-xs text-muted-foreground">{employee.department}</p>
                          </div>
                        </td>
                        {weekDays.map(day => {
                          const dayShifts = shifts.filter(shift => 
                            shift.employeeId === employee.id && shift.day === day.key
                          );
                          
                          return (
                            <td key={day.key} className="py-2 px-2 text-center">
                              <div className="min-h-16 space-y-1">
                                {dayShifts.map(shift => (
                                  <div 
                                    key={shift.id}
                                    className={`p-2 rounded text-xs font-medium cursor-pointer ${getTaskColor(shift.task)}`}
                                  >
                                    <div>{shift.startTime} - {shift.endTime}</div>
                                    <div className="text-xs">{shift.task}</div>
                                  </div>
                                ))}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full h-8 text-xs"
                                  onClick={() => handleCreateShift(day.key, employee.id)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog Création de Shift */}
        <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Créer un nouveau créneau</DialogTitle>
              <DialogDescription>
                Définissez les horaires et les tâches pour ce créneau.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Heure de début</Label>
                  <Input id="startTime" type="time" defaultValue="08:00" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">Heure de fin</Label>
                  <Input id="endTime" type="time" defaultValue="16:00" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task">Type de tâche</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une tâche" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map(task => (
                      <SelectItem key={task} value={task}>{task}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="department">Secteur/Département</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un secteur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="logistique">Logistique</SelectItem>
                    <SelectItem value="qualite">Qualité</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes additionnelles</Label>
                <Textarea id="notes" placeholder="Informations complémentaires..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={() => setIsShiftDialogOpen(false)}>
                Créer le créneau
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};