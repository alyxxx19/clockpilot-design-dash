import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  employee: string;
  department: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  hourlyRate: number;
  totalCost: number;
}

export const Reports: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('this-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployees, setSelectedEmployees] = useState('all');

  // Données de démonstration
  const reportData: ReportData[] = [
    {
      employee: 'Marie Dupont',
      department: 'Production',
      regularHours: 152,
      overtimeHours: 8,
      totalHours: 160,
      hourlyRate: 15.50,
      totalCost: 2480
    },
    {
      employee: 'Jean Martin',
      department: 'Logistique',
      regularHours: 148,
      overtimeHours: 4,
      totalHours: 152,
      hourlyRate: 16.00,
      totalCost: 2432
    },
    {
      employee: 'Sarah Wilson',
      department: 'Qualité',
      regularHours: 144,
      overtimeHours: 0,
      totalHours: 144,
      hourlyRate: 17.50,
      totalCost: 2520
    },
    {
      employee: 'Thomas Bernard',
      department: 'Maintenance',
      regularHours: 156,
      overtimeHours: 12,
      totalHours: 168,
      hourlyRate: 18.00,
      totalCost: 3024
    }
  ];

  const departmentStats = [
    { department: 'Production', employees: 8, totalHours: 1248, avgHours: 156, cost: 19380 },
    { department: 'Logistique', employees: 4, totalHours: 608, avgHours: 152, cost: 9728 },
    { department: 'Qualité', employees: 3, totalHours: 432, avgHours: 144, cost: 7560 },
    { department: 'Maintenance', employees: 3, totalHours: 504, avgHours: 168, cost: 9072 }
  ];

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Export en cours",
      description: `Le rapport est en cours d'export au format ${format.toUpperCase()}.`,
    });
  };

  const totalHours = reportData.reduce((sum, row) => sum + row.totalHours, 0);
  const totalCost = reportData.reduce((sum, row) => sum + row.totalCost, 0);
  const totalOvertime = reportData.reduce((sum, row) => sum + row.overtimeHours, 0);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rapports</h1>
            <p className="text-muted-foreground mt-1">Analyse des heures et de la productivité</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres de rapport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateRange">Période</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">Cette semaine</SelectItem>
                    <SelectItem value="this-month">Ce mois</SelectItem>
                    <SelectItem value="last-month">Mois dernier</SelectItem>
                    <SelectItem value="this-quarter">Ce trimestre</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les départements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="logistique">Logistique</SelectItem>
                    <SelectItem value="qualite">Qualité</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employees">Employés</Label>
                <Select value={selectedEmployees} onValueChange={setSelectedEmployees}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les employés" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les employés</SelectItem>
                    <SelectItem value="active">Employés actifs</SelectItem>
                    <SelectItem value="selected">Employés sélectionnés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Générer le rapport
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total des Heures</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures Supplémentaires</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOvertime}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+15%</span> vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coût Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCost.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-2%</span> vs budget
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivité Moyenne</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+3%</span> vs objectif
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets de rapports */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="employees">Détail par employé</TabsTrigger>
            <TabsTrigger value="departments">Analyse par département</TabsTrigger>
            <TabsTrigger value="overtime">Heures supplémentaires</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse par département</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Département</TableHead>
                      <TableHead>Employés</TableHead>
                      <TableHead>Total Heures</TableHead>
                      <TableHead>Moyenne/Employé</TableHead>
                      <TableHead>Coût Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {departmentStats.map((dept) => (
                      <TableRow key={dept.department}>
                        <TableCell className="font-medium">{dept.department}</TableCell>
                        <TableCell>{dept.employees}</TableCell>
                        <TableCell>{dept.totalHours}h</TableCell>
                        <TableCell>{dept.avgHours}h</TableCell>
                        <TableCell>{dept.cost.toLocaleString()}€</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Détail par employé</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Heures Normales</TableHead>
                      <TableHead>Heures Sup.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Taux Horaire</TableHead>
                      <TableHead>Coût Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={row.employee}>
                        <TableCell className="font-medium">{row.employee}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.regularHours}h</TableCell>
                        <TableCell>{row.overtimeHours}h</TableCell>
                        <TableCell className="font-medium">{row.totalHours}h</TableCell>
                        <TableCell>{row.hourlyRate}€</TableCell>
                        <TableCell className="font-medium">{row.totalCost.toLocaleString()}€</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance par département</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentStats.map((dept) => (
                    <div key={dept.department} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">{dept.department}</h3>
                        <span className="text-sm text-muted-foreground">
                          {dept.employees} employés
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total heures</p>
                          <p className="font-medium">{dept.totalHours}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Moyenne/employé</p>
                          <p className="font-medium">{dept.avgHours}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Coût total</p>
                          <p className="font-medium">{dept.cost.toLocaleString()}€</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overtime" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des heures supplémentaires</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Département</TableHead>
                      <TableHead>Heures Sup.</TableHead>
                      <TableHead>% du temps total</TableHead>
                      <TableHead>Coût Heures Sup.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.filter(row => row.overtimeHours > 0).map((row) => (
                      <TableRow key={row.employee}>
                        <TableCell className="font-medium">{row.employee}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell>{row.overtimeHours}h</TableCell>
                        <TableCell>
                          {((row.overtimeHours / row.totalHours) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>
                          {(row.overtimeHours * row.hourlyRate * 1.5).toFixed(0)}€
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};