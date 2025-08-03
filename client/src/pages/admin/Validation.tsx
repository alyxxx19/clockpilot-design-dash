import React, { useState } from 'react';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  AlertCircle,
  Calendar,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TimeEntry {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  submittedAt: string;
}

export const Validation: React.FC = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);

  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      employeeName: 'Marie Dupont',
      department: 'Production',
      date: '2024-10-14',
      startTime: '08:00',
      endTime: '16:30',
      totalHours: 8.5,
      status: 'pending',
      notes: 'Heures supplémentaires pour finir la commande urgente',
      submittedAt: '2024-10-14 16:35'
    },
    {
      id: '2',
      employeeName: 'Jean Martin',
      department: 'Logistique',
      date: '2024-10-14',
      startTime: '09:00',
      endTime: '17:00',
      totalHours: 8,
      status: 'pending',
      submittedAt: '2024-10-14 17:05'
    },
    {
      id: '3',
      employeeName: 'Sarah Wilson',
      department: 'Qualité',
      date: '2024-10-13',
      startTime: '07:30',
      endTime: '15:30',
      totalHours: 8,
      status: 'approved',
      submittedAt: '2024-10-13 15:35'
    },
    {
      id: '4',
      employeeName: 'Thomas Bernard',
      department: 'Maintenance',
      date: '2024-10-13',
      startTime: '10:00',
      endTime: '18:00',
      totalHours: 8,
      status: 'rejected',
      notes: 'Décalage horaire non autorisé',
      submittedAt: '2024-10-13 18:10'
    }
  ]);

  const filteredEntries = timeEntries.filter(entry => {
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || entry.department === departmentFilter;
    return matchesStatus && matchesDepartment;
  });

  const pendingEntries = timeEntries.filter(entry => entry.status === 'pending');
  const totalPendingHours = pendingEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
  const approvedThisMonth = timeEntries.filter(entry => entry.status === 'approved').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Validé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleValidation = (entryId: string, action: 'approve' | 'reject') => {
    setTimeEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, status: action === 'approve' ? 'approved' : 'rejected' }
        : entry
    ));
    
    toast({
      title: action === 'approve' ? "Heures validées" : "Heures rejetées",
      description: `Les heures ont été ${action === 'approve' ? 'validées' : 'rejetées'} avec succès.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Validation des Heures</h1>
          <p className="text-muted-foreground mt-1">Gestion des pointages et validation des heures</p>
        </div>

        {/* Widgets latéraux */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Attente</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingEntries.length}</div>
              <p className="text-xs text-muted-foreground">demandes en attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Heures à Valider</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPendingHours}h</div>
              <p className="text-xs text-muted-foreground">heures totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Validées ce Mois</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedThisMonth}</div>
              <p className="text-xs text-muted-foreground">validations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employés Actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">employés</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Validé</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrer par département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Logistique">Logistique</SelectItem>
                  <SelectItem value="Qualité">Qualité</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des pointages */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Soumis le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{entry.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{entry.department}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {new Date(entry.date).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{entry.startTime} - {entry.endTime}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{entry.totalHours}h</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(entry.submittedAt).toLocaleDateString('fr-FR')} à{' '}
                      {new Date(entry.submittedAt).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Détails du pointage</DialogTitle>
                              <DialogDescription>
                                {entry.employeeName} - {new Date(entry.date).toLocaleDateString('fr-FR')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Heure de début</label>
                                  <p className="text-sm text-muted-foreground">{entry.startTime}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Heure de fin</label>
                                  <p className="text-sm text-muted-foreground">{entry.endTime}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Total d'heures</label>
                                <p className="text-sm text-muted-foreground">{entry.totalHours} heures</p>
                              </div>
                              {entry.notes && (
                                <div>
                                  <label className="text-sm font-medium">Notes</label>
                                  <p className="text-sm text-muted-foreground">{entry.notes}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {entry.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleValidation(entry.id, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleValidation(entry.id, 'reject')}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};