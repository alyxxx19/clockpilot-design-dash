import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  CheckSquare, 
  Clock, 
  Plus, 
  Edit, 
  Play, 
  Pause, 
  CheckCircle2,
  Circle,
  AlertTriangle,
  Calendar,
  User,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Task {
  id: number;
  projectId: number | null;
  assignedToId: number | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | null;
  estimatedHours: string | null;
  dueDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  clientName: string | null;
  isActive: boolean | null;
  createdAt: Date;
}

const getPriorityColor = (priority: string | null) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo': return 'bg-gray-500';
    case 'in_progress': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'cancelled': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'todo': return 'À faire';
    case 'in_progress': return 'En cours';
    case 'completed': return 'Terminé';
    case 'cancelled': return 'Annulé';
    default: return status;
  }
};

const getPriorityLabel = (priority: string | null) => {
  switch (priority) {
    case 'high': return 'Haute';
    case 'medium': return 'Moyenne';
    case 'low': return 'Basse';
    default: return 'Non définie';
  }
};

export const Tasks: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [editTaskDialog, setEditTaskDialog] = useState<Task | null>(null);

  // Fetch tasks for current user
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: [`/api/tasks/employee/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Task> }) => {
      return apiRequest(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/employee/${user?.id}`] });
      toast({
        title: "Tâche mise à jour",
        description: "La tâche a été mise à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la tâche",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus as Task['status'] }
    });
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedStatus === 'all') return true;
    return task.status === selectedStatus;
  });

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  if (tasksLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Chargement des tâches...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Tâches</h1>
            <p className="text-muted-foreground">
              Gérez vos tâches et suivez votre progression
            </p>
          </div>
          <Button size="sm" data-testid="button-new-task">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckSquare className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold" data-testid="text-total-tasks">{taskStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Circle className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">À faire</p>
                  <p className="text-2xl font-bold" data-testid="text-todo-tasks">{taskStats.todo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold" data-testid="text-progress-tasks">{taskStats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Terminées</p>
                  <p className="text-2xl font-bold" data-testid="text-completed-tasks">{taskStats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progression générale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Progress value={completionRate} className="flex-1" />
              <span className="text-sm font-medium" data-testid="text-completion-rate">
                {completionRate.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {taskStats.completed} tâches terminées sur {taskStats.total}
            </p>
          </CardContent>
        </Card>

        {/* Task Filters */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-all">Toutes</TabsTrigger>
            <TabsTrigger value="todo" data-testid="filter-todo">À faire</TabsTrigger>
            <TabsTrigger value="in_progress" data-testid="filter-progress">En cours</TabsTrigger>
            <TabsTrigger value="completed" data-testid="filter-completed">Terminées</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus}>
            {/* Task List */}
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Aucune tâche {selectedStatus !== 'all' ? getStatusLabel(selectedStatus).toLowerCase() : ''}
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedStatus === 'all' 
                        ? "Vous n'avez pas encore de tâches assignées."
                        : `Aucune tâche ${getStatusLabel(selectedStatus).toLowerCase()} pour le moment.`
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTasks.map((task) => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <Card key={task.id} data-testid={`card-task-${task.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium text-foreground" data-testid={`text-task-title-${task.id}`}>
                                {task.title}
                              </h3>
                              <Badge 
                                className={`${getStatusColor(task.status)} text-white`}
                                data-testid={`badge-status-${task.id}`}
                              >
                                {getStatusLabel(task.status)}
                              </Badge>
                              {task.priority && (
                                <Badge 
                                  variant="outline" 
                                  className={`border-2 ${getPriorityColor(task.priority)} border-opacity-50`}
                                  data-testid={`badge-priority-${task.id}`}
                                >
                                  {getPriorityLabel(task.priority)}
                                </Badge>
                              )}
                            </div>
                            
                            {task.description && (
                              <p className="text-muted-foreground mb-3" data-testid={`text-description-${task.id}`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              {project && (
                                <div className="flex items-center space-x-1">
                                  <FolderOpen className="h-4 w-4" />
                                  <span data-testid={`text-project-${task.id}`}>{project.name}</span>
                                </div>
                              )}
                              {task.estimatedHours && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span data-testid={`text-hours-${task.id}`}>{task.estimatedHours}h</span>
                                </div>
                              )}
                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span data-testid={`text-due-${task.id}`}>
                                    {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {task.status === 'todo' && (
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                data-testid={`button-start-${task.id}`}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Commencer
                              </Button>
                            )}
                            {task.status === 'in_progress' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(task.id, 'todo')}
                                  data-testid={`button-pause-${task.id}`}
                                >
                                  <Pause className="h-4 w-4 mr-1" />
                                  Pause
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleStatusChange(task.id, 'completed')}
                                  data-testid={`button-complete-${task.id}`}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Terminer
                                </Button>
                              </>
                            )}
                            {task.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(task.id, 'in_progress')}
                                data-testid={`button-reopen-${task.id}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Rouvrir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};