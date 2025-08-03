import React, { useState } from 'react';
import { CheckSquare, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'inprogress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  estimatedTime: string;
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Révision du rapport mensuel',
    description: 'Vérifier et corriger le rapport de performance de janvier',
    status: 'inprogress',
    priority: 'high',
    dueDate: '2024-01-16',
    estimatedTime: '2h'
  },
  {
    id: '2',
    title: 'Formation sécurité',
    description: 'Compléter le module de formation sécurité en ligne',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-01-18',
    estimatedTime: '1h'
  },
  {
    id: '3',
    title: 'Mise à jour inventaire',
    description: 'Mettre à jour la base de données inventaire',
    status: 'completed',
    priority: 'low',
    dueDate: '2024-01-15',
    estimatedTime: '30m'
  },
  {
    id: '4',
    title: 'Réunion équipe projet',
    description: 'Préparer les documents pour la réunion de mercredi',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-01-17',
    estimatedTime: '45m'
  },
  {
    id: '5',
    title: 'Révision procédures',
    description: 'Réviser les nouvelles procédures de qualité',
    status: 'todo',
    priority: 'high',
    dueDate: '2024-01-19',
    estimatedTime: '1h 30m'
  }
];

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'completed' ? 'todo' : 'completed'
        };
      }
      return task;
    }));
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="h-5 w-5 text-green-600" />;
      case 'inprogress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Haute</Badge>;
      case 'medium':
        return <Badge variant="secondary">Moyenne</Badge>;
      default:
        return <Badge variant="outline">Basse</Badge>;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Terminée</Badge>;
      case 'inprogress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">En cours</Badge>;
      default:
        return <Badge variant="outline">À faire</Badge>;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isOverdue = (dueDate: string, status: Task['status']) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'inprogress').length,
      todo: tasks.filter(t => t.status === 'todo').length
    };
  };

  const stats = getTaskStats();

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tâches</h1>
          <p className="text-muted-foreground">Gérez vos tâches et suivez votre progression</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-accent rounded-lg">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Terminées</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Circle className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">À faire</p>
                  <p className="text-2xl font-bold">{stats.todo}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="inprogress">En cours</SelectItem>
                    <SelectItem value="completed">Terminées</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les priorités</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des tâches */}
        <Card>
          <CardHeader>
            <CardTitle>Mes tâches ({filteredTasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border border-border rounded-lg hover:shadow-md transition-shadow ${
                    task.status === 'completed' ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-1 hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(task.status)}
                    </button>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium ${
                            task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-card-foreground'
                          }`}>
                            {task.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {isOverdue(task.dueDate, task.status) && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                        <span>Échéance: {formatDate(task.dueDate)}</span>
                        <span>Durée estimée: {task.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredTasks.length === 0 && (
                <div className="text-center py-8">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune tâche trouvée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};