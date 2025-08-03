import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Filter,
  FileText,
  Mail,
  Search,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { LoadingState } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTimeEntries } from '@/hooks/useTimeEntries';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

export const Reports: React.FC = () => {
  const [periode, setPeriode] = useState('ce-mois');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (periode) {
      case 'cette-semaine':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay() + 1);
        break;
      case 'mois-dernier':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'ce-trimestre':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      default: // ce-mois
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  }, [periode]);

  const { timeEntries, loading } = useTimeEntries(dateRange.start, dateRange.end);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = timeEntries.reduce((sum, entry) => sum + entry.total_hours, 0);
    const workingDays = timeEntries.filter(entry => entry.total_hours > 0).length;
    const averagePerDay = workingDays > 0 ? totalHours / workingDays : 0;
    
    // Calculate expected working days in period
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    let expectedDays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
        expectedDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    const attendanceRate = expectedDays > 0 ? (workingDays / expectedDays) * 100 : 0;
    
    return {
      totalHours,
      workingDays,
      expectedDays,
      averagePerDay,
      attendanceRate
    };
  }, [timeEntries, dateRange]);

  // Filter and paginate data
  const filteredEntries = useMemo(() => {
    return timeEntries.filter(entry => {
      const matchesSearch = entry.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.date.includes(searchTerm);
      const matchesStatus = statusFilter === 'tous' || entry.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [timeEntries, searchTerm, statusFilter]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEntries.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEntries, currentPage]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);

  // Alert calculations
  const pendingEntries = timeEntries.filter(entry => entry.status === 'submitted').length;
  const draftEntries = timeEntries.filter(entry => entry.status === 'draft').length;

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Export en cours",
      description: `Votre rapport ${format.toUpperCase()} sera téléchargé dans quelques instants`,
    });
  };

  const handleViewEntry = (entry: any) => {
    toast({
      title: "Détails de l'entrée",
      description: `Affichage des détails pour le ${new Date(entry.date).toLocaleDateString('fr-FR')}`,
    });
  };

  const handleEditEntry = () => {
    navigate('/employee/time-entry');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Validé</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Soumis</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Brouillon</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <LoadingState message="Chargement de vos rapports..." />
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

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Rapports</h1>
              <p className="text-muted-foreground">Analysez vos heures de travail et votre performance</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cette-semaine">Cette semaine</SelectItem>
                  <SelectItem value="ce-mois">Ce mois</SelectItem>
                  <SelectItem value="mois-dernier">Mois dernier</SelectItem>
                  <SelectItem value="ce-trimestre">Ce trimestre</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
              
              <Button variant="outline" onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              
              <Button variant="outline" onClick={() => handleExport('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(pendingEntries > 0 || draftEntries > 0) && (
          <div className="mb-6 space-y-2">
            {pendingEntries > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {pendingEntries} entrée(s) en attente de validation par votre superviseur
                </AlertDescription>
              </Alert>
            )}
            {draftEntries > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {draftEntries} entrée(s) en brouillon - N'oubliez pas de soumettre vos heures
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures Totales</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalHours > 0 ? (
                  <span className="text-green-600">✓ Données disponibles</span>
                ) : (
                  <span className="text-orange-600">Aucune donnée</span>
                )}
              </p>
              <Progress value={Math.min((stats.totalHours / (stats.expectedDays * 8)) * 100, 100)} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne/Jour</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averagePerDay.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                Objectif: 8.0h
              </p>
              <Progress value={(stats.averagePerDay / 8) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jours Travaillés</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workingDays}/{stats.expectedDays}</div>
              <p className="text-xs text-muted-foreground">
                jours cette période
              </p>
              <Progress value={(stats.workingDays / stats.expectedDays) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Présence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.attendanceRate >= 95 ? (
                  <span className="text-green-600">✓ Excellent</span>
                ) : stats.attendanceRate >= 80 ? (
                  <span className="text-orange-600">⚠ Correct</span>
                ) : (
                  <span className="text-red-600">⚠ À améliorer</span>
                )}
              </p>
              <Progress value={stats.attendanceRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value="approved">Validé</SelectItem>
                      <SelectItem value="submitted">Soumis</SelectItem>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="rejected">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Détail des Heures</span>
                  <Badge variant="outline">
                    {filteredEntries.length} entrée(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredEntries.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Début</TableHead>
                          <TableHead>Fin</TableHead>
                          <TableHead>Pause</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Projet</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-medium">
                              {new Date(entry.date).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>{entry.start_time}</TableCell>
                            <TableCell>{entry.end_time || '-'}</TableCell>
                            <TableCell>
                              {entry.break_start && entry.break_end 
                                ? `${entry.break_start}-${entry.break_end}` 
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="font-medium">{entry.total_hours}h</TableCell>
                            <TableCell>{entry.project}</TableCell>
                            <TableCell>{getStatusBadge(entry.status)}</TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleViewEntry(entry)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleEditEntry}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredEntries.length)} sur {filteredEntries.length} entrées
                        </p>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Précédent
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune donnée pour cette période</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/employee/time-entry')}
                    >
                      Commencer la saisie
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Résumé</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total travaillé :</span>
                    <span className="font-medium">{stats.totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jours travaillés :</span>
                    <span className="font-medium">{stats.workingDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Moyenne/jour :</span>
                    <span className="font-medium">{stats.averagePerDay.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taux présence :</span>
                    <span className="font-medium">{stats.attendanceRate.toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate('/employee/planning')}
                  >
                    Voir mon planning
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Tendances</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Régularité</span>
                    <Badge className={stats.attendanceRate >= 95 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {stats.attendanceRate >= 95 ? 'Excellente' : 'À améliorer'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Productivité</span>
                    <Badge className={stats.averagePerDay >= 7.5 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      {stats.averagePerDay >= 7.5 ? 'Très bonne' : 'Correcte'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};