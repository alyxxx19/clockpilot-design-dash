import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Filter,
  FileText,
  Mail,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Award,
  Coffee,
  Users,
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';

// Types de données
interface DayData {
  date: string;
  arrivee: string;
  depart: string;
  pause: string;
  travailEffectif: number;
  heuresSupplementaires: number;
  projet: string;
  statut: 'validé' | 'en_attente' | 'brouillon' | 'rejeté';
  anomalies: string[];
}

interface ProjectData {
  nom: string;
  heures: number;
  pourcentage: number;
  couleur: string;
}

interface WeeklyData {
  semaine: string;
  travail: number;
  pause: number;
  heuresSupplementaires: number;
  objectif: number;
}

// Données de démonstration enrichies
const mockDayData: DayData[] = [
  {
    date: '2024-01-15',
    arrivee: '08:30',
    depart: '17:45',
    pause: '1h00',
    travailEffectif: 8.25,
    heuresSupplementaires: 0.25,
    projet: 'Développement Frontend',
    statut: 'validé',
    anomalies: []
  },
  {
    date: '2024-01-16',
    arrivee: '08:45',
    depart: '17:30',
    pause: '1h00',
    travailEffectif: 7.75,
    heuresSupplementaires: 0,
    projet: 'Tests & Debug',
    statut: 'en_attente',
    anomalies: ['Retard 15min']
  },
  {
    date: '2024-01-17',
    arrivee: '08:30',
    depart: '18:00',
    pause: '1h15',
    travailEffectif: 8.25,
    heuresSupplementaires: 0.25,
    projet: 'Réunion Client',
    statut: 'validé',
    anomalies: []
  },
  {
    date: '2024-01-18',
    arrivee: '09:00',
    depart: '17:30',
    pause: '1h00',
    travailEffectif: 7.5,
    heuresSupplementaires: 0,
    projet: 'Formation',
    statut: 'brouillon',
    anomalies: ['Retard 30min']
  },
  {
    date: '2024-01-19',
    arrivee: '-',
    depart: '-',
    pause: '-',
    travailEffectif: 0,
    heuresSupplementaires: 0,
    projet: 'Congé',
    statut: 'validé',
    anomalies: []
  }
];

const mockProjectData: ProjectData[] = [
  { nom: 'Développement Frontend', heures: 45.5, pourcentage: 35, couleur: 'bg-blue-500' },
  { nom: 'Tests & Debug', heures: 32.25, pourcentage: 25, couleur: 'bg-green-500' },
  { nom: 'Réunions', heures: 25.75, pourcentage: 20, couleur: 'bg-purple-500' },
  { nom: 'Formation', heures: 19.5, pourcentage: 15, couleur: 'bg-orange-500' },
  { nom: 'Administration', heures: 6.5, pourcentage: 5, couleur: 'bg-gray-500' }
];

const mockWeeklyData: WeeklyData[] = [
  { semaine: 'Sem 1', travail: 38.5, pause: 5, heuresSupplementaires: 1.5, objectif: 40 },
  { semaine: 'Sem 2', travail: 40, pause: 5, heuresSupplementaires: 0, objectif: 40 },
  { semaine: 'Sem 3', travail: 42, pause: 5.5, heuresSupplementaires: 2, objectif: 40 },
  { semaine: 'Sem 4', travail: 32, pause: 4, heuresSupplementaires: 0, objectif: 40 }
];

export const Reports: React.FC = () => {
  const [periode, setPeriode] = useState('ce-mois');
  const [typeRapport, setTypeRapport] = useState('detaille');
  const [groupBy, setGroupBy] = useState('jour');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [projectFilter, setProjectFilter] = useState('tous');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculs des statistiques principales
  const totalHours = mockDayData.reduce((sum, day) => sum + day.travailEffectif, 0);
  const totalDays = mockDayData.filter(day => day.travailEffectif > 0).length;
  const averagePerDay = totalDays > 0 ? totalHours / totalDays : 0;
  const workingDaysInMonth = 22;
  const attendanceRate = (totalDays / workingDaysInMonth) * 100;
  const totalOvertime = mockDayData.reduce((sum, day) => sum + day.heuresSupplementaires, 0);

  // Alertes
  const pendingValidation = mockDayData.filter(day => day.statut === 'en_attente').length;
  const anomalies = mockDayData.filter(day => day.anomalies.length > 0).length;
  const drafts = mockDayData.filter(day => day.statut === 'brouillon').length;

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    toast({
      title: "Export en cours",
      description: `Votre rapport ${format.toUpperCase()} sera téléchargé dans quelques instants`,
    });
  };

  const handleEmailExport = () => {
    toast({
      title: "Email envoyé",
      description: "Le rapport a été envoyé à votre adresse email",
    });
  };

  // Naviguer vers la saisie d'heures
  const handleTimeEntry = () => {
    navigate('/employee/time-entry');
  };

  // Naviguer vers le planning
  const handleViewPlanning = () => {
    navigate('/employee/planning');
  };

  // Voir les détails d'une journée
  const handleViewDay = (day: DayData) => {
    toast({
      title: "Détails du jour",
      description: `Affichage des détails pour le ${new Date(day.date).toLocaleDateString('fr-FR')}`,
    });
  };

  // Éditer une journée
  const handleEditDay = (day: DayData) => {
    navigate('/employee/time-entry');
    toast({
      title: "Édition",
      description: "Redirection vers la saisie d'heures",
    });
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'validé':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Validé</Badge>;
      case 'en_attente':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">En attente</Badge>;
      case 'brouillon':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Brouillon</Badge>;
      case 'rejeté':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getCalendarDayColor = (day: DayData) => {
    if (day.travailEffectif === 0) return 'bg-gray-100';
    switch (day.statut) {
      case 'validé': return 'bg-green-500';
      case 'en_attente': return 'bg-orange-500';
      case 'brouillon': return 'bg-blue-500';
      case 'rejeté': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredData = mockDayData.filter(day => {
    const matchesSearch = day.projet.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         day.date.includes(searchTerm);
    const matchesStatus = statusFilter === 'tous' || day.statut === statusFilter;
    const matchesProject = projectFilter === 'tous' || day.projet === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const renderWeeklyChart = () => {
    const maxHours = Math.max(...mockWeeklyData.map(w => Math.max(w.travail + w.pause, w.objectif)));
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>0h</span>
          <span>{maxHours}h</span>
        </div>
        
        <div className="space-y-4">
          {mockWeeklyData.map((week, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{week.semaine}</span>
                <span>{week.travail + week.pause}h / {week.objectif}h</span>
              </div>
              <div className="relative">
                <div className="w-full bg-muted rounded-full h-6 flex overflow-hidden">
                  <div 
                    className="bg-primary rounded-l-full h-6 transition-all duration-300 flex items-center justify-center text-xs text-primary-foreground font-medium"
                    style={{ width: `${(week.travail / maxHours) * 100}%` }}
                  >
                    {week.travail > 10 ? `${week.travail}h` : ''}
                  </div>
                  <div 
                    className="bg-gray-400 h-6 transition-all duration-300 flex items-center justify-center text-xs text-white"
                    style={{ width: `${(week.pause / maxHours) * 100}%` }}
                  >
                    {week.pause > 2 ? `${week.pause}h` : ''}
                  </div>
                  {week.heuresSupplementaires > 0 && (
                    <div 
                      className="bg-red-500 h-6 transition-all duration-300 flex items-center justify-center text-xs text-white"
                      style={{ width: `${(week.heuresSupplementaires / maxHours) * 100}%` }}
                    >
                      +{week.heuresSupplementaires}h
                    </div>
                  )}
                </div>
                <div 
                  className="absolute top-0 w-0.5 h-6 bg-destructive"
                  style={{ left: `${(week.objectif / maxHours) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Travail</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>Pause</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Heures sup.</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-destructive"></div>
            <span>Objectif</span>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectChart = () => {
    return (
      <div className="space-y-4">
        {mockProjectData.map((project, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{project.nom}</span>
              <span>{project.heures}h ({project.pourcentage}%)</span>
            </div>
            <div className="relative">
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className={`${project.couleur} rounded-full h-3 transition-all duration-300`}
                  style={{ width: `${project.pourcentage}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = 31;
    const firstDay = 1; // Lundi
    const today = 15;
    
    return (
      <div className="space-y-4">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>
        
        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayData = mockDayData.find(d => new Date(d.date).getDate() === day);
            const isToday = day === today;
            const isWeekend = (day + firstDay - 2) % 7 >= 5;
            
            return (
              <div
                key={day}
                className={`
                  relative h-12 border border-border rounded cursor-pointer transition-all hover:shadow-md
                  ${isToday ? 'ring-2 ring-primary' : ''}
                  ${isWeekend ? 'bg-gray-50' : 'bg-white'}
                `}
              >
                <div className="p-1 h-full flex flex-col justify-between">
                  <span className={`text-xs ${isToday ? 'font-bold text-primary' : 'text-foreground'}`}>
                    {day}
                  </span>
                  {dayData && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${getCalendarDayColor(dayData)} mx-auto`}></div>
                      {dayData.travailEffectif > 0 && (
                        <span className="text-xs font-medium text-center">
                          {dayData.travailEffectif}h
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Légende du calendrier */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Validé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>En attente</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Brouillon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Rejeté</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* En-tête amélioré */}
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
                  <SelectItem value="ce-mois">Ce mois</SelectItem>
                  <SelectItem value="mois-dernier">Mois dernier</SelectItem>
                  <SelectItem value="ce-trimestre">Ce trimestre</SelectItem>
                  <SelectItem value="cette-annee">Cette année</SelectItem>
                  <SelectItem value="personnalise">Personnalisé</SelectItem>
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
              
              <Button variant="outline" onClick={handleEmailExport}>
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
            </div>
          </div>
        </div>

        {/* Alertes */}
        {(pendingValidation > 0 || anomalies > 0 || drafts > 0) && (
          <div className="mb-6 space-y-2">
            {pendingValidation > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {pendingValidation} jour(s) en attente de validation par votre superviseur
                </AlertDescription>
              </Alert>
            )}
            {anomalies > 0 && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {anomalies} jour(s) avec des anomalies détectées (retards, heures manquantes)
                </AlertDescription>
              </Alert>
            )}
            {drafts > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {drafts} jour(s) en brouillon - N'oubliez pas de soumettre vos heures
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Cards de statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures Totales</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↑ +5%</span> vs mois dernier
              </p>
              <Progress value={(totalHours / 160) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne/Jour</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averagePerDay.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">↓ -0.2h</span> vs moyenne
              </p>
              <Progress value={(averagePerDay / 8) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jours Travaillés</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDays}/{workingDaysInMonth}</div>
              <p className="text-xs text-muted-foreground">
                jours ce mois
              </p>
              <Progress value={(totalDays / workingDaysInMonth) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Présence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">✓ Excellent</span>
              </p>
              <Progress value={attendanceRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtres Avancés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Type de rapport</Label>
                  <Select value={typeRapport} onValueChange={setTypeRapport}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detaille">Détaillé</SelectItem>
                      <SelectItem value="resume">Résumé</SelectItem>
                      <SelectItem value="comparatif">Comparatif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Grouper par</Label>
                  <Select value={groupBy} onValueChange={setGroupBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jour">Jour</SelectItem>
                      <SelectItem value="semaine">Semaine</SelectItem>
                      <SelectItem value="projet">Projet</SelectItem>
                      <SelectItem value="activite">Type d'activité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les statuts</SelectItem>
                      <SelectItem value="validé">Validé</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="brouillon">Brouillon</SelectItem>
                      <SelectItem value="rejeté">Rejeté</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Options d'affichage</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-weekends" defaultChecked />
                      <Label htmlFor="include-weekends" className="text-sm">Inclure weekends</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="include-holidays" defaultChecked />
                      <Label htmlFor="include-holidays" className="text-sm">Inclure jours fériés</Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Contenu principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* Graphique des heures hebdomadaires */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Évolution Hebdomadaire</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderWeeklyChart()}
              </CardContent>
            </Card>

            {/* Vue calendrier mensuelle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Calendrier Mensuel</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">Janvier 2024</span>
                    <Button variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderCalendar()}
              </CardContent>
            </Card>

            {/* Tableau détaillé */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Détail des Heures</span>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Arrivée</TableHead>
                      <TableHead>Départ</TableHead>
                      <TableHead>Pause</TableHead>
                      <TableHead>Travail</TableHead>
                      <TableHead>H. Sup.</TableHead>
                      <TableHead>Projet/Tâche</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((day, index) => (
                      <TableRow key={index} className={day.anomalies.length > 0 ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">
                          {new Date(day.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{day.arrivee}</TableCell>
                        <TableCell>{day.depart}</TableCell>
                        <TableCell>{day.pause}</TableCell>
                        <TableCell className="font-medium">{day.travailEffectif}h</TableCell>
                        <TableCell>
                          {day.heuresSupplementaires > 0 ? (
                            <span className="text-red-600 font-medium">+{day.heuresSupplementaires}h</span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{day.projet}</TableCell>
                        <TableCell>{getStatusBadge(day.statut)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDay(day)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEditDay(day)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredData.length)} sur {filteredData.length} entrées
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar droite */}
          <div className="space-y-6">
            {/* Résumé personnalisé */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Résumé du Mois</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total travaillé :</span>
                    <span className="font-medium">{totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Objectif :</span>
                    <span className="font-medium">160h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Performance :</span>
                    <span className="font-medium text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Jours d'absence :</span>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heures sup :</span>
                    <span className="font-medium text-orange-600">{totalOvertime}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Congés restants :</span>
                    <span className="font-medium">12 jours</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 text-sm">
                    <Award className="h-4 w-4 text-yellow-600" />
                    <span>Prochaine évaluation : 15/02</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analyse et tendances */}
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
                    <Badge className="bg-green-100 text-green-800">Excellente</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ponctualité</span>
                    <Badge className="bg-orange-100 text-orange-800">À améliorer</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Productivité</span>
                    <Badge className="bg-green-100 text-green-800">Très bonne</Badge>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border text-xs text-muted-foreground">
                  <div className="space-y-2">
                    <p>💡 Conseil : Essayez d'arriver 15min plus tôt pour améliorer votre ponctualité</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={handleViewPlanning}
                    >
                      Voir mon planning
                    </Button>
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