import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Users,
  Clock,
  TrendingUp,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { ExportButton } from '@/components/ExportButton';

interface ReportMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

export const Reports: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const metrics: ReportMetric[] = [
    {
      title: 'Heures totales',
      value: '1,247h',
      change: '+12%',
      trend: 'up',
      icon: <Clock className="h-5 w-5" />
    },
    {
      title: 'Employés actifs',
      value: '23',
      change: '+2',
      trend: 'up',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Heures supplémentaires',
      value: '84h',
      change: '-8%',
      trend: 'down',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'Taux de présence',
      value: '94.2%',
      change: '+1.5%',
      trend: 'up',
      icon: <BarChart3 className="h-5 w-5" />
    }
  ];

  const departmentStats = [
    { name: 'Production', employees: 12, hours: 456, overtime: 32, attendance: 96 },
    { name: 'Logistique', employees: 6, hours: 234, overtime: 18, attendance: 92 },
    { name: 'Qualité', employees: 3, hours: 123, overtime: 12, attendance: 98 },
    { name: 'Maintenance', employees: 2, hours: 89, overtime: 8, attendance: 91 }
  ];

  const weeklyData = [
    { week: 'S1', planned: 280, actual: 276, variance: -4 },
    { week: 'S2', planned: 280, actual: 289, variance: 9 },
    { week: 'S3', planned: 280, actual: 275, variance: -5 },
    { week: 'S4', planned: 280, actual: 282, variance: 2 }
  ];

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 5) return 'text-red-600 bg-red-50';
    if (variance > 0) return 'text-orange-600 bg-orange-50';
    if (variance < -5) return 'text-blue-600 bg-blue-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rapports</h1>
            <p className="text-muted-foreground mt-1">Analyses et statistiques des temps de travail</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <ExportButton 
              type="reports" 
              options={{
                type: 'monthly',
                dateRange: dateFrom && dateTo ? {
                  start: dateFrom,
                  end: dateTo
                } : undefined
              }}
              className="size-sm"
            />
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Programmer export
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Label>Période :</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="this-week">Cette semaine</SelectItem>
                    <SelectItem value="this-month">Ce mois</SelectItem>
                    <SelectItem value="last-month">Mois dernier</SelectItem>
                    <SelectItem value="this-quarter">Ce trimestre</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPeriod === 'custom' && (
                <>
                  <div className="flex items-center space-x-2">
                    <Label>Du :</Label>
                    <Input 
                      type="date" 
                      value={dateFrom} 
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label>Au :</Label>
                    <Input 
                      type="date" 
                      value={dateTo} 
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Label>Département :</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="logistique">Logistique</SelectItem>
                    <SelectItem value="qualite">Qualité</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {metric.title}
                    </p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className={`text-sm ${getTrendColor(metric.trend)}`}>
                      {getTrendIcon(metric.trend)} {metric.change}
                    </p>
                  </div>
                  <div className="text-muted-foreground">
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Statistiques par département */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par département</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentStats.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {dept.employees} employés
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{dept.hours}h</p>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-orange-600">+{dept.overtime}h sup.</span>
                        <Badge variant="outline" className="text-xs">
                          {dept.attendance}% présence
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Évolution hebdomadaire */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution hebdomadaire</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((week, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{week.week}</p>
                      <p className="text-sm text-muted-foreground">
                        {week.planned}h planifiées
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{week.actual}h réalisées</p>
                      <Badge className={`text-xs ${getVarianceColor(week.variance)}`}>
                        {week.variance > 0 ? '+' : ''}{week.variance}h
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau de bord détaillé */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé détaillé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Employé</th>
                    <th className="text-left p-2">Département</th>
                    <th className="text-right p-2">H. planifiées</th>
                    <th className="text-right p-2">H. réalisées</th>
                    <th className="text-right p-2">H. sup.</th>
                    <th className="text-right p-2">Taux présence</th>
                    <th className="text-right p-2">Écart</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Marie Dupont</td>
                    <td className="p-2">Production</td>
                    <td className="p-2 text-right">152h</td>
                    <td className="p-2 text-right">148h</td>
                    <td className="p-2 text-right">8h</td>
                    <td className="p-2 text-right">
                      <Badge variant="outline" className="text-green-600">97%</Badge>
                    </td>
                    <td className="p-2 text-right">
                      <Badge className="text-xs bg-blue-50 text-blue-600">-4h</Badge>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Jean Martin</td>
                    <td className="p-2">Logistique</td>
                    <td className="p-2 text-right">152h</td>
                    <td className="p-2 text-right">156h</td>
                    <td className="p-2 text-right">4h</td>
                    <td className="p-2 text-right">
                      <Badge variant="outline" className="text-green-600">98%</Badge>
                    </td>
                    <td className="p-2 text-right">
                      <Badge className="text-xs bg-orange-50 text-orange-600">+4h</Badge>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Sarah Wilson</td>
                    <td className="p-2">Qualité</td>
                    <td className="p-2 text-right">152h</td>
                    <td className="p-2 text-right">152h</td>
                    <td className="p-2 text-right">0h</td>
                    <td className="p-2 text-right">
                      <Badge variant="outline" className="text-green-600">100%</Badge>
                    </td>
                    <td className="p-2 text-right">
                      <Badge className="text-xs bg-green-50 text-green-600">0h</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};