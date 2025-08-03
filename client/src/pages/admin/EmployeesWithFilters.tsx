import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { FilterBar } from '@/components/FilterBar';
import { useFilters } from '@/hooks/useFilters';
import type { FilterOption, ActiveFilter } from '@/components/FilterBar';
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
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  Building,
  Calendar,
  Clock,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Employee {
  id: string;
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  userEmail: string;
  phone?: string;
  departmentId?: number;
  departmentName?: string;
  managerId?: number;
  hireDate: string;
  contractType: string;
  hourlyRate?: number;
  weeklyHours?: number;
  vacationDaysTotal: number;
  vacationDaysUsed: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  name: string;
}

interface EmployeesResponse {
  message: string;
  data: Employee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const Employees: React.FC = () => {
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
    persistKey: 'admin-employees',
    urlSync: true
  });

  // Récupération des départements pour les options de filtre
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
    queryFn: () => apiRequest('/api/departments'),
  });

  // Récupération des employés avec filtres
  const { data: employeesData, isLoading, error } = useQuery<EmployeesResponse>({
    queryKey: ['/api/employees', getQueryParams()],
    queryFn: () => apiRequest('/api/employees', { params: getQueryParams() }),
  });

  // Options de filtres pour la FilterBar
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'active', label: 'Actif' },
        { value: 'inactive', label: 'Inactif' }
      ]
    },
    {
      key: 'department',
      label: 'Département',
      type: 'select',
      options: departments.map(dept => ({
        value: dept.id.toString(),
        label: dept.name
      }))
    },
    {
      key: 'contractType',
      label: 'Type de contrat',
      type: 'select',
      options: [
        { value: 'CDI', label: 'CDI' },
        { value: 'CDD', label: 'CDD' },
        { value: 'STAGE', label: 'Stage' },
        { value: 'FREELANCE', label: 'Freelance' },
        { value: 'INTERIM', label: 'Intérim' }
      ]
    },
    {
      key: 'hiredAfter',
      label: 'Embauché après',
      type: 'date'
    },
    {
      key: 'hiredBefore',
      label: 'Embauché avant',
      type: 'date'
    },
    {
      key: 'minWeeklyHours',
      label: 'Heures min/semaine',
      type: 'select',
      options: [
        { value: '10', label: '10h' },
        { value: '20', label: '20h' },
        { value: '35', label: '35h' }
      ]
    },
    {
      key: 'maxWeeklyHours',
      label: 'Heures max/semaine',
      type: 'select',
      options: [
        { value: '35', label: '35h' },
        { value: '40', label: '40h' },
        { value: '48', label: '48h' }
      ]
    },
    {
      key: 'hasEmail',
      label: 'A un email',
      type: 'boolean'
    },
    {
      key: 'hasPhone',
      label: 'A un téléphone',
      type: 'boolean'
    }
  ];

  // Options de tri
  const sortOptions = [
    { value: 'name', label: 'Nom' },
    { value: 'hire_date', label: 'Date d\'embauche' },
    { value: 'department', label: 'Département' },
    { value: 'contract_type', label: 'Type de contrat' },
    { value: 'weekly_hours', label: 'Heures/semaine' }
  ];

  // Gestion de l'export
  const exportEmployees = async (format: 'excel' | 'pdf') => {
    try {
      const params = { ...getQueryParams(), format };
      const response = await apiRequest('/api/employees/export', { 
        params,
        responseType: 'blob'
      });
      
      const blob = new Blob([response], { 
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `employes-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: `Les données ont été exportées en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données",
        variant: "destructive"
      });
    }
  };

  // États pour les dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Gestion de la suppression
  const deleteEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) => apiRequest(`/api/employees/${employeeId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({
        title: "Employé supprimé",
        description: "L'employé a été supprimé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'employé",
        variant: "destructive"
      });
    }
  });

  const handleDeleteEmployee = (employee: Employee) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${employee.firstName} ${employee.lastName} ?`)) {
      deleteEmployeeMutation.mutate(employee.id);
    }
  };

  const getBadgeVariant = (status: boolean) => {
    return status ? 'default' : 'secondary';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatContractType = (type: string) => {
    const types: Record<string, string> = {
      CDI: 'CDI',
      CDD: 'CDD',
      STAGE: 'Stage',
      FREELANCE: 'Freelance',
      INTERIM: 'Intérim'
    };
    return types[type] || type;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Gestion des Employés
              </h1>
              <p className="text-gray-600 mt-1">
                {employeesData?.pagination.total || 0} employé(s) au total
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline" 
                onClick={() => exportEmployees('excel')}
                className="flex items-center gap-2"
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              
              <Button
                variant="outline" 
                onClick={() => exportEmployees('pdf')}
                className="flex items-center gap-2"
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" data-testid="button-add-employee">
                    <Plus className="h-4 w-4" />
                    Nouvel Employé
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouvel employé</DialogTitle>
                    <DialogDescription>
                      Remplissez les informations pour créer un nouveau profil employé.
                    </DialogDescription>
                  </DialogHeader>
                  {/* Formulaire à implémenter */}
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Prénom</Label>
                        <Input id="firstName" data-testid="input-first-name" />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Nom</Label>
                        <Input id="lastName" data-testid="input-last-name" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" data-testid="input-email" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button data-testid="button-save-employee">Créer</Button>
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
              searchPlaceholder="Rechercher par nom, email ou numéro d'employé..."
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

            {/* Table des employés */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Liste des Employés</span>
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
                    <p className="text-red-600">Erreur lors du chargement des employés</p>
                  </div>
                )}
                
                {!isLoading && !error && employeesData?.data.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun employé trouvé</p>
                    {(search || filters.length > 0) && (
                      <Button variant="outline" onClick={reset} className="mt-2">
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                )}

                {!isLoading && !error && employeesData?.data && employeesData.data.length > 0 && (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employé</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Département</TableHead>
                          <TableHead>Contrat</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {employeesData.data.map((employee) => (
                          <TableRow key={employee.id} data-testid={`row-employee-${employee.id}`}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {employee.firstName} {employee.lastName}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  #{employee.employeeNumber}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Embauché le {formatDate(employee.hireDate)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {employee.userEmail}
                                </div>
                                {employee.phone && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {employee.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {employee.departmentName || 'Non assigné'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline">
                                  {formatContractType(employee.contractType)}
                                </Badge>
                                {employee.weeklyHours && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {employee.weeklyHours}h/sem
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getBadgeVariant(employee.isActive)}>
                                {employee.isActive ? 'Actif' : 'Inactif'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedEmployee(employee);
                                    setIsEditDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-${employee.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEmployee(employee)}
                                  className="text-red-600 hover:text-red-700"
                                  data-testid={`button-delete-${employee.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination */}
                    {employeesData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {employeesData.pagination.page} sur {employeesData.pagination.totalPages}
                          ({employeesData.pagination.total} résultats)
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={!employeesData.pagination.hasPrev}
                            data-testid="button-prev-page"
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!employeesData.pagination.hasNext}
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