import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Check, Trash2, Filter, Search, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { type Notification } from '@shared/schema';

interface NotificationListProps {
  showHeader?: boolean;
  maxHeight?: string;
}

export function NotificationList({ showHeader = true, maxHeight = '600px' }: NotificationListProps) {
  const { token } = useAuth();
  const {
    notifications: contextNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    playSound,
    setPlaySound,
    refreshNotifications
  } = useNotifications();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'all',
    read: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load notifications from API
  const loadNotifications = async (page: number = 1) => {
    if (!token) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (filter.type !== 'all') {
        params.append('type', filter.type);
      }

      if (filter.read !== 'all') {
        params.append('read', filter.read === 'read' ? 'true' : 'false');
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  // Initialize and load notifications
  useEffect(() => {
    loadNotifications();
  }, [token, filter.type, filter.read]);

  // Filter notifications by search term
  useEffect(() => {
    if (!filter.search) {
      setFilteredNotifications(notifications);
    } else {
      const searchLower = filter.search.toLowerCase();
      const filtered = notifications.filter(
        notification =>
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower)
      );
      setFilteredNotifications(filtered);
    }
  }, [notifications, filter.search]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'planning_modified':
        return '📅';
      case 'validation_required':
        return '✅';
      case 'time_missing':
        return '⏰';
      case 'overtime_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'low') return 'secondary';
    
    switch (type) {
      case 'task_assigned':
        return 'default';
      case 'planning_modified':
        return 'default';
      case 'validation_required':
        return 'default';
      case 'time_missing':
        return 'secondary';
      case 'overtime_alert':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return 'Tâche assignée';
      case 'planning_modified':
        return 'Planning modifié';
      case 'validation_required':
        return 'Validation requise';
      case 'time_missing':
        return 'Temps manquant';
      case 'overtime_alert':
        return 'Alerte heures sup.';
      default:
        return 'Notification';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement des notifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlaySound(!playSound)}
                title={playSound ? 'Désactiver le son' : 'Activer le son'}
              >
                {playSound ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAsRead}
                  data-testid="mark-all-read-button"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={filter.search}
                onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
                data-testid="notification-search-input"
              />
            </div>
            
            <Select
              value={filter.type}
              onValueChange={(value) => setFilter(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full sm:w-48" data-testid="type-filter-select">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="task_assigned">Tâches assignées</SelectItem>
                <SelectItem value="planning_modified">Planning modifié</SelectItem>
                <SelectItem value="validation_required">Validation requise</SelectItem>
                <SelectItem value="time_missing">Temps manquant</SelectItem>
                <SelectItem value="overtime_alert">Heures supplémentaires</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filter.read}
              onValueChange={(value) => setFilter(prev => ({ ...prev, read: value }))}
            >
              <SelectTrigger className="w-full sm:w-48" data-testid="read-filter-select">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="divide-y" style={{ maxHeight, overflowY: 'auto' }}>
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification trouvée</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                  !notification.read_at ? 'bg-blue-50/50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge
                          variant={getNotificationColor(notification.type, notification.priority)}
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {format(new Date(notification.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {!notification.read_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title="Marquer comme lu"
                            data-testid={`mark-read-button-${notification.id}`}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          title="Supprimer"
                          data-testid={`delete-button-${notification.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <>
            <Separator />
            <div className="p-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} notifications)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadNotifications(pagination.page - 1)}
                  data-testid="prev-page-button"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadNotifications(pagination.page + 1)}
                  data-testid="next-page-button"
                >
                  Suivant
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}