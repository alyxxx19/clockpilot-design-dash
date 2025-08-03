import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

const weeklyData = [
  { day: 'Lun', hours: 8.5, target: 8 },
  { day: 'Mar', hours: 8.0, target: 8 },
  { day: 'Mer', hours: 7.5, target: 8 },
  { day: 'Jeu', hours: 8.5, target: 8 },
  { day: 'Ven', hours: 7.0, target: 8 },
  { day: 'Sam', hours: 0, target: 0 },
  { day: 'Dim', hours: 0, target: 0 }
];

const monthlyData = [
  { week: 'Sem 1', hours: 32, target: 40 },
  { week: 'Sem 2', hours: 40, target: 40 },
  { week: 'Sem 3', hours: 38, target: 40 },
  { week: 'Sem 4', hours: 35, target: 40 }
];

const timeEntries = [
  { date: '15/01/2024', start: '08:30', end: '17:30', break: '1h00', total: '8h00' },
  { date: '14/01/2024', start: '08:30', end: '17:30', break: '1h00', total: '8h00' },
  { date: '13/01/2024', start: '09:00', end: '17:00', break: '1h00', total: '7h00' },
  { date: '12/01/2024', start: '08:30', end: '17:30', break: '1h00', total: '8h00' },
  { date: '11/01/2024', start: '08:45', end: '17:45', break: '1h00', total: '8h00' }
];

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('weekly');
  const [period, setPeriod] = useState('current');
  const { toast } = useToast();

  const handleExportPDF = () => {
    toast({
      title: "Export en cours",
      description: "Votre rapport PDF sera téléchargé dans quelques instants",
    });
  };

  const renderChart = () => {
    const data = reportType === 'weekly' ? weeklyData : monthlyData;
    const maxHours = Math.max(...data.map(d => Math.max(d.hours, d.target)));
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>0h</span>
          <span>{maxHours}h</span>
        </div>
        
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{reportType === 'weekly' ? item.day : item.week}</span>
                <span>{item.hours}h / {item.target}h</span>
              </div>
              <div className="relative">
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${(item.hours / maxHours) * 100}%` }}
                  ></div>
                </div>
                {item.target > 0 && (
                  <div 
                    className="absolute top-0 w-0.5 h-2 bg-destructive"
                    style={{ left: `${(item.target / maxHours) * 100}%` }}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Heures réalisées</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-0.5 bg-destructive"></div>
            <span>Objectif</span>
          </div>
        </div>
      </div>
    );
  };

  const getTotalHours = () => {
    const data = reportType === 'weekly' ? weeklyData : monthlyData;
    return data.reduce((sum, item) => sum + item.hours, 0);
  };

  const getTargetHours = () => {
    const data = reportType === 'weekly' ? weeklyData : monthlyData;
    return data.reduce((sum, item) => sum + item.target, 0);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Rapports</h1>
          <p className="text-muted-foreground">Analysez vos heures de travail et votre performance</p>
        </div>

        {/* Contrôles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration du rapport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Rapport hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Rapport mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Période actuelle</SelectItem>
                    <SelectItem value="previous">Période précédente</SelectItem>
                    <SelectItem value="custom">Période personnalisée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleExportPDF} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Exporter PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Graphique */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>
                  {reportType === 'weekly' ? 'Heures de la semaine' : 'Heures du mois'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart()}
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Heures travaillées</span>
                </div>
                <div className="text-2xl font-bold">{getTotalHours()}h</div>
                <div className="text-sm text-muted-foreground">Objectif: {getTargetHours()}h</div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Performance</span>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round((getTotalHours() / getTargetHours()) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  {getTotalHours() >= getTargetHours() ? 'Objectif atteint' : 'Sous l\'objectif'}
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Jours travaillés</span>
                </div>
                <div className="text-2xl font-bold">
                  {reportType === 'weekly' ? '5' : '20'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {reportType === 'weekly' ? 'Cette semaine' : 'Ce mois'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau détaillé */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Détail des heures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Arrivée</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Départ</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Pause</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map((entry, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{entry.date}</td>
                      <td className="py-3 px-4">{entry.start}</td>
                      <td className="py-3 px-4">{entry.end}</td>
                      <td className="py-3 px-4">{entry.break}</td>
                      <td className="py-3 px-4 font-medium">{entry.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-between items-center text-sm">
              <span className="text-muted-foreground">
                Affichage des 5 dernières entrées
              </span>
              <Button variant="outline" size="sm">
                Voir tout l'historique
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};