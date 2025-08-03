import React, { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

interface TimeEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  duration: string;
}

const mockEntries: TimeEntry[] = [
  { id: '1', date: '2024-01-15', startTime: '08:30', endTime: '17:30', type: 'Travail', duration: '8h 00m' },
  { id: '2', date: '2024-01-14', startTime: '08:30', endTime: '17:30', type: 'Travail', duration: '8h 00m' },
  { id: '3', date: '2024-01-13', startTime: '09:00', endTime: '17:00', type: 'Travail', duration: '7h 00m' },
  { id: '4', date: '2024-01-12', startTime: '08:30', endTime: '17:30', type: 'Travail', duration: '8h 00m' },
];

export const TimeEntry: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState('');
  const { toast } = useToast();

  const handleQuickClock = () => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    
    toast({
      title: "Pointage effectué",
      description: `Pointage enregistré à ${currentTime}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startTime || !endTime || !type) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Saisie enregistrée",
      description: "Vos heures ont été enregistrées avec succès",
    });

    // Reset form
    setStartTime('');
    setEndTime('');
    setType('');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Saisie des heures</h1>
          <p className="text-muted-foreground">Enregistrez vos heures de travail</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pointage rapide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Pointage rapide</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-foreground mb-2">
                  {new Date().toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <p className="text-muted-foreground">
                  {new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
              
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleQuickClock}
              >
                <Plus className="mr-2 h-4 w-4" />
                Pointer maintenant
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Enregistre automatiquement l'heure actuelle
              </p>
            </CardContent>
          </Card>

          {/* Saisie manuelle */}
          <Card>
            <CardHeader>
              <CardTitle>Saisie manuelle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Heure de début</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Heure de fin</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="travail">Travail</SelectItem>
                      <SelectItem value="pause">Pause</SelectItem>
                      <SelectItem value="formation">Formation</SelectItem>
                      <SelectItem value="reunion">Réunion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Enregistrer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Historique */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Historique des pointages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{formatDate(entry.date)}</p>
                    <p className="text-sm text-muted-foreground">{entry.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {entry.startTime} - {entry.endTime}
                    </p>
                    <p className="text-sm text-muted-foreground">{entry.duration}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Button variant="outline">
                Voir plus d'entrées
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Résumé de la semaine */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Résumé de la semaine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">32h 15m</div>
                <p className="text-sm text-muted-foreground">Heures travaillées</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">7h 45m</div>
                <p className="text-sm text-muted-foreground">Heures restantes</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">1h 30m</div>
                <p className="text-sm text-muted-foreground">Heures supplémentaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};