import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EmployeeSidebar } from '@/components/layouts/EmployeeSidebar';
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
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Flag,
  Plus,
  Edit,
  Check,
  X,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  category?: string;
  dueDate?: string;
  assigneeId: number;
  projectId?: number;
  createdAt: string;
  updatedAt: string;
  assignee: {
    firstName: string;
    lastName: string;
  };
  project?: {
    name: string;
  };
  isOverdue: boolean;
}

interface Project {
  id: number;
  name: string;
}

interface TasksResponse {
  message: string;
  data: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const Tasks: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
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
    persistKey: 'employee-tasks',
    urlSync: true
  });

  // Récupération des projets pour les options de filtre
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const response = await apiRequest('/api/projects');
      return response.data || response;
    },
  });

  // Récupération des tâches avec filtres
  const { data: tasksData, isLoading, error } = useQuery<TasksResponse>({
    queryKey: ['/api/tasks', getQueryParams()],
    queryFn: async () => {
      const params = getQueryParams();
      const response = await apiRequest('/api/tasks?' + new URLSearchParams(params as any).toString());
      return response;
    },
  });

  // Options de filtres pour la FilterBar
  const filterOptions: FilterOption[] = [
    {
      key: 'status',
      label: 'Statut',
      type: 'select',
      options: [
        { value: 'todo', label: 'À faire' },
        { value: 'in_progress', label: 'En cours' },
        { value: 'completed', label: 'Terminé' },
        { value: 'cancelled', label: 'Annulé' }
      ]
    },
    {
      key: 'priority',
      label: 'Priorité',
      type: 'select',
      options: [
        { value: 'low', label: 'Faible' },
        { value: 'medium', label: 'Moyenne' },
        { value: 'high', label: 'Élevée' },
        { value: 'urgent', label: 'Urgente' }
      ]
    },
    {
      key: 'category',
      label: 'Catégorie',
      type: 'select',
      options: [
        { value: 'development', label: 'Développement' },
        { value: 'bug', label: 'Bug' },
        { value: 'feature', label: 'Fonctionnalité' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'documentation', label: 'Documentation' },
        { value: 'meeting', label: 'Réunion' },
        { value: 'training', label: 'Formation' }
      ]
    },
    {
      key: 'projectId',
      label: 'Projet',
      type: 'select',
      options: (projects || []).map((project: any) => ({
        value: project.id.toString(),
        label: project.name
      }))
    },
    {
      key: 'dueAfter',
      label: 'Échéance après',
      type: 'date'
    },
    {
      key: 'dueBefore',
      label: 'Échéance avant',
      type: 'date'
    },
    {
      key: 'assignedToMe',
      label: 'Assignées à moi',
      type: 'boolean'
    },
    {
      key: 'overdue',
      label: 'En retard',
      type: 'boolean'
    }
  ];

  // Options de tri
  const sortOptions = [
    { value: 'title', label: 'Titre' },
    { value: 'priority', label: 'Priorité' },
    { value: 'due_date', label: 'Échéance' },
    { value: 'status', label: 'Statut' },
    { value: 'assignee', label: 'Assigné à' },
    { value: 'created_at', label: 'Date de création' }
  ];

  // Gestion de l'export
  const exportTasks = async (format: 'excel' | 'pdf') => {
    try {
      const params = { ...getQueryParams(), format };
      const queryString = new URLSearchParams(params as any).toString();
      const response = await fetch(`/api/tasks/export?${queryString}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taches-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: `Les tâches ont été exportées en ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les tâches",
        variant: "destructive"
      });
    }
  };

  // États pour les dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Gestion du changement de statut
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => 
      apiRequest(`/api/tasks/${taskId}`, { 
        method: 'PUT',
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la tâche a été modifié avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la tâche",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (task: Task, newStatus: string) => {
    updateTaskStatusMutation.mutate({ taskId: task.id, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      todo: 'secondary',
      in_progress: 'outline',
      completed: 'default',
      cancelled: 'destructive'
    };
    const labels: Record<string, string> = {
      todo: 'À faire',
      in_progress: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };
    return { variant: variants[status] || 'secondary', label: labels[status] || status };
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      low: 'secondary',
      medium: 'outline',
      high: 'default',
      urgent: 'destructive'
    };
    const labels: Record<string, string> = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée',
      urgent: 'Urgente'
    };
    return { variant: variants[priority] || 'secondary', label: labels[priority] || priority };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const isTaskOverdue = (task: Task) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <EmployeeSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CheckSquare className="h-6 w-6" />
                Mes Tâches
              </h1>
              <p className="text-gray-600 mt-1">
                {tasksData?.pagination.total || 0} tâche(s) au total
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline" 
                onClick={() => exportTasks('excel')}
                className="flex items-center gap-2"
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              
              <Button
                variant="outline" 
                onClick={() => exportTasks('pdf')}
                className="flex items-center gap-2"
                data-testid="button-export-pdf"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2" data-testid="button-add-task">
                    <Plus className="h-4 w-4" />
                    Nouvelle Tâche
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle tâche</DialogTitle>
                    <DialogDescription>
                      Ajoutez une nouvelle tâche à votre liste.
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
                    <Button data-testid="button-save-task">Créer</Button>
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
              searchPlaceholder="Rechercher dans les tâches..."
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

            {/* Table des tâches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Liste des Tâches</span>
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
                    <p className="text-red-600">Erreur lors du chargement des tâches</p>
                  </div>
                )}
                
                {!isLoading && !error && tasksData?.data.length === 0 && (
                  <div className="text-center py-8">
                    <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucune tâche trouvée</p>
                    {(search || filters.length > 0) && (
                      <Button variant="outline" onClick={reset} className="mt-2">
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                )}

                {!isLoading && !error && tasksData?.data && tasksData.data.length > 0 && (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tâche</TableHead>
                          <TableHead>Projet</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Échéance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasksData.data.map((task) => (
                          <TableRow 
                            key={task.id} 
                            data-testid={`row-task-${task.id}`}
                            className={isTaskOverdue(task) ? 'bg-red-50' : ''}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{task.title}</span>
                                  {isTaskOverdue(task) && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                {task.description && (
                                  <span className="text-sm text-muted-foreground line-clamp-1">
                                    {task.description}
                                  </span>
                                )}
                                {task.category && (
                                  <Badge variant="outline" className="w-fit mt-1 text-xs">
                                    {task.category}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {task.project ? (
                                <span className="text-sm">{task.project.name}</span>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPriorityBadge(task.priority).variant}>
                                <Flag className="h-3 w-3 mr-1" />
                                {getPriorityBadge(task.priority).label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={task.status}
                                onValueChange={(value) => handleStatusChange(task, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="todo">À faire</SelectItem>
                                  <SelectItem value="in_progress">En cours</SelectItem>
                                  <SelectItem value="completed">Terminé</SelectItem>
                                  <SelectItem value="cancelled">Annulé</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {task.dueDate ? (
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span className={`text-sm ${isTaskOverdue(task) ? 'text-red-600 font-medium' : ''}`}>
                                      {formatDate(task.dueDate)}
                                    </span>
                                  </div>
                                  {isTaskOverdue(task) && (
                                    <span className="text-xs text-red-600">En retard</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {task.status !== 'completed' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleStatusChange(task, 'completed')}
                                    className="text-green-600 hover:text-green-700"
                                    data-testid={`button-complete-${task.id}`}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setIsEditDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-${task.id}`}
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
                    {tasksData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Page {tasksData.pagination.page} sur {tasksData.pagination.totalPages}
                          ({tasksData.pagination.total} résultats)
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={!tasksData.pagination.hasPrev}
                            data-testid="button-prev-page"
                          >
                            Précédent
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!tasksData.pagination.hasNext}
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