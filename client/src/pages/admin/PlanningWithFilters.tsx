import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilterBar } from '@/components/FilterBar';
import { useFilters } from '@/hooks/useFilters';
import type { FilterOption } from '@/components/FilterBar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Building,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PlanningEntry {
  id: string;
  employeeId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  validationStatus?: string;
  notes?: string;
  plannedHours: number;
  hasConflicts: boolean;
  employee: {
    firstName: string;
    lastName: string;
    departmentName?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  name: string;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

interface PlanningResponse {
  message: string;
  data: PlanningEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const Planning: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Configuration des filtres
  const {
    search,
    filters,
    sort,
    sortDirection,
    page,
    setSearch,
    setFilters,
    setSort,
    setPage,
    reset,
    savedFilters,
    saveFilters,
    loadFilters,
    getQueryParams
  } = useFilters({
    persistKey: 'admin-planning',
    urlSync: true
  });

  // Récupération des départements et employés pour les options de filtre
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    queryFn: async () => {
      const response = await apiRequest('/api/departments');
      return response.data || response;
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['/api/employees/all'],
    queryFn: async () => {
      const response = await apiRequest('/api/employees/all');
      return response.data || response;
    },
  });

  // Récupération des entrées de planification avec filtres
  const { data: planningData, isLoading, error } = useQuery<PlanningResponse>({
    queryKey: ['/api/planning', getQueryParams()],
    queryFn: async () => {
      const params = getQueryParams();
      const response = await apiRequest('/api/planning?' + new URLSearchParams(params as any).toString());
      return response;
    },
  });

  // Options de filtres pour la FilterBar
  const filterOptions: FilterOption[] = [
    {
      key: 'start_date',
      label: 'Date de début',
      type: 'date'
    },
    {
      key: 'end_date',
      label: 'Date de fin',
      type: 'date'
    },
    {
      key: 'employee_id',
      label: 'Employé',
      type: 'select',
      options: (employees || []).map((emp: any) => ({
        value: emp.id.toString(),
        label: `${emp.firstName} ${emp.lastName}`
      }))
    },
    {
      key: 'department_id',
      label: 'Département',
      type: 'select',
      options: (departments || []).map((dept: any) => ({
        value: dept.id.toString(),
        label: dept.name
      }))
    },
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'draft', label: 'Brouillon' },
        { value: 'submitted', label: 'Soumis' },
        { value: 'validated', label: 'Validé' },
        { value: 'rejected', label: 'Rejeté' }
      ]
    },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'work', label: 'Travail' },
        { value: 'vacation', label: 'Congés' },
        { value: 'sick', label: 'Maladie' },
        { value: 'training', label: 'Formation' },
        { value: 'meeting', label: 'Réunion' }
      ]
    },
    {
      key: 'validationStatus',
      label: 'Validation',
      type: 'select',
      options: [
        { value: 'pending', label: 'En attente' },
        { value: 'validated', label: 'Validé' },
        { value: 'rejected', label: 'Rejeté' }
      ]
    },
    {
      key: 'hasConflicts',
      label: 'Avec conflits',
      type: 'boolean'
    }
  ];

  // Options de tri
  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'employee', label: 'Employé' },
    { value: 'department', label: 'Département' },
    { value: 'status', label: 'Statut' },
    { value: 'created_at', label: 'Date de création' }
  ];

  // Gestion de l'export
  const exportPlanning = async (format: 'excel' | 'pdf') => {
    try {
      const params = { ...getQueryParams(), format };
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`/api/planning/export?${queryString}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `planning-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: `Le planning a été exporté en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le planning",
        variant: "destructive"
      });
    }
  };

  // États pour les dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PlanningEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Gestion de la validation
  const validatePlanningMutation = useMutation({
    mutationFn: (entryId: string) => apiRequest(`/api/planning/validate`, { 
      method: 'POST',
      body: JSON.stringify({ entryId, status: 'validated' }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/planning'] });
      toast({
        title: "Planning validé",
        description: "L'entrée de planning a été validée avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de valider l'entrée de planning",
        variant: "destructive"
      });
    }
  });

  const rejectPlanningMutation = useMutation({
    mutationFn: (entryId: string) => apiRequest(`/api/planning/validate`, { 
      method: 'POST',
      body: JSON.stringify({ entryId, status: 'rejected' }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/planning'] });
      toast({
        title: "Planning rejeté",
        description: "L'entrée de planning a été rejetée",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de rejeter l'entrée de planning",
        variant: "destructive"
      });
    }
  });

  const handleValidateEntry = (entry: PlanningEntry) => {
    validatePlanningMutation.mutate(entry.id);
  };

  const handleRejectEntry = (entry: PlanningEntry) => {
    if (window.confirm(`Êtes-vous sûr de vouloir rejeter cette entrée de planning ?`)) {
      rejectPlanningMutation.mutate(entry.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: 'secondary',
      submitted: 'outline',
      validated: 'default',
      rejected: 'destructive'
    };
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      submitted: 'Soumis',
      validated: 'Validé',
      rejected: 'Rejeté'
    };
    return { variant: variants[status] || 'secondary', label: labels[status] || status };
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      work: 'Travail',
      vacation: 'Congés',
      sick: 'Maladie',
      training: 'Formation',
      meeting: 'Réunion'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Gestion de la Planification
              </h1>
              <p className="text-gray-600 mt-1">
                {planningData?.pagination.total || 0} entrée(s) de planning au total
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline" 
                onClick={() => exportPlanning('excel')}
                className="flex items-center gap-2"
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              
              <Button
                variant="outline" 
                onClick={() => exportPlanning('pdf')}
                className="flex items-center gap-2"
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" data-testid="button-add-planning">
                    <Plus className="h-4 w-4" />
                    Nouvelle Entrée
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter une entrée de planning</DialogTitle>
                    <DialogDescription>
                      Créez une nouvelle entrée dans le planning.
                    </DialogDescription>
                  </DialogHeader>
                  {/* Formulaire à implémenter */}
                  <div className="py-4">
                    <p className="text-muted-foreground">Formulaire de création à implémenter</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button data-testid="button-save-planning">Créer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Barre de filtres */}
            <FilterBar
              searchPlaceholder="Rechercher dans le planning..."
              searchValue={search}
              onSearchChange={setSearch}
              filterOptions={filterOptions}
              activeFilters={filters}
              onFiltersChange={setFilters}
              sortOptions={sortOptions}
              sortValue={sort}
              sortDirection={sortDirection}
              onSortChange={setSort}
              onReset={reset}
              onSaveFilters={saveFilters}
              savedFilterSets={savedFilters}
              onLoadFilterSet={loadFilters}
              className="w-full"
            />

            {/* Table de planification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Entrées de Planning</span>
                  {isLoading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Chargement...
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-center py-8">
                    <p className="text-red-600">Erreur lors du chargement du planning</p>
                  </div>
                )}
                
                {!isLoading && !error && planningData?.data.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune entrée de planning trouvée</p>
                    {(search || filters.length > 0) && (
                      <Button variant="outline" onClick={reset} className="mt-2">
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                )}

                {!isLoading && !error && planningData?.data && planningData.data.length > 0 && (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employé</TableHead>
                          <TableHead>Date & Horaires</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Conflits</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {planningData.data.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-planning-${entry.id}`}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {entry.employee.firstName} {entry.employee.lastName}
                                </span>
                                {entry.employee.departmentName && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Building className="h-3 w-3" />
                                    {entry.employee.departmentName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium">
                                  {formatDate(entry.date)}
                                </span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {entry.plannedHours}h planifiées
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getTypeBadge(entry.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(entry.status).variant}>
                                {getStatusBadge(entry.status).label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {entry.hasConflicts ? (
                                <div className="flex items-center gap-1 text-orange-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">Conflits</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm">OK</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {entry.status === 'submitted' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleValidateEntry(entry)}
                                      className="text-green-600 hover:text-green-700"
                                      data-testid={`button-validate-${entry.id}`}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRejectEntry(entry)}
                                      className="text-red-600 hover:text-red-700"
                                      data-testid={`button-reject-${entry.id}`}
                                    >
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEntry(entry);
                                    setIsEditDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-${entry.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {planningData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {planningData.pagination.page} sur {planningData.pagination.totalPages}
                          ({planningData.pagination.total} résultats)
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={!planningData.pagination.hasPrev}
                            data-testid="button-prev-page"
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!planningData.pagination.hasNext}
                            data-testid="button-next-page"
                          >
                            Suivant
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};