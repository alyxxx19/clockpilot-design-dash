import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useNotifications, type Notification, type NotificationFilters } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  BellOff,
  CheckCircle2,
  Trash2,
  Filter,
  Search,
  Settings,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  ExternalLink,
  Eye,
} from 'lucide-react';

const notificationTypeConfig = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800'
  },
  error: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800'
  }
};

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = notificationTypeConfig[notification.type];
  const Icon = config.icon;

  const handleContextClick = () => {
    if (notification.contextUrl) {
      window.open(notification.contextUrl, '_blank');
    }
  };

  const timeAgo = useMemo(() => {
    const date = new Date(notification.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  }, [notification.createdAt]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative p-4 border rounded-lg transition-all duration-200 ${
        !notification.isRead 
          ? `${config.bgColor} ${config.borderColor} shadow-sm` 
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      } hover:shadow-md cursor-pointer`}
      data-testid={`notification-item-${notification.id}`}
    >
      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}

      <div className="flex items-start gap-3 pl-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo}
                </span>
                
                {notification.contextType && (
                  <Badge variant="outline" className="text-xs">
                    {notification.contextType}
                  </Badge>
                )}
                
                {notification.priority === 'high' && (
                  <Badge variant="destructive" className="text-xs">
                    Priorité haute
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notification.id);
                      }}
                      className="h-8 w-8 p-0"
                      data-testid={`button-mark-read-${notification.id}`}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {notification.contextUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextClick();
                      }}
                      className="h-8 w-8 p-0"
                      data-testid={`button-context-${notification.id}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    data-testid={`button-delete-${notification.id}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: any;
  onUpdatePreferences: (prefs: any) => void;
}

function NotificationPreferencesModal({ 
  isOpen, 
  onClose, 
  preferences, 
  onUpdatePreferences 
}: NotificationPreferencesModalProps) {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = () => {
    onUpdatePreferences(localPrefs);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Préférences de notifications
          </DialogTitle>
          <DialogDescription>
            Configurez comment vous souhaitez recevoir vos notifications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Channels */}
          <div className="space-y-4">
            <h4 className="font-medium">Canaux de notification</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email</Label>
              <Switch
                id="email-notifications"
                checked={localPrefs.emailNotifications}
                onCheckedChange={(checked) => 
                  setLocalPrefs((prev: any) => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push</Label>
              <Switch
                id="push-notifications"
                checked={localPrefs.pushNotifications}
                onCheckedChange={(checked) => 
                  setLocalPrefs((prev: any) => ({ ...prev, pushNotifications: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="inapp-notifications">Dans l'application</Label>
              <Switch
                id="inapp-notifications"
                checked={localPrefs.inAppNotifications}
                onCheckedChange={(checked) => 
                  setLocalPrefs((prev: any) => ({ ...prev, inAppNotifications: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Frequency */}
          <div className="space-y-3">
            <Label htmlFor="digest-frequency">Fréquence du digest</Label>
            <Select
              value={localPrefs.digestFrequency}
              onValueChange={(value) => 
                setLocalPrefs((prev: any) => ({ ...prev, digestFrequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immédiat</SelectItem>
                <SelectItem value="daily">Quotidien</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
                <SelectItem value="never">Jamais</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Types */}
          <div className="space-y-4">
            <h4 className="font-medium">Types de notifications</h4>
            
            {Object.entries(localPrefs.types).map(([type, enabled]) => (
              <div key={type} className="flex items-center justify-between">
                <Label htmlFor={`type-${type}`} className="capitalize">
                  {type === 'info' ? 'Informations' : 
                   type === 'warning' ? 'Avertissements' :
                   type === 'error' ? 'Erreurs' : 'Succès'}
                </Label>
                <Switch
                  id={`type-${type}`}
                  checked={enabled as boolean}
                  onCheckedChange={(checked) => 
                    setLocalPrefs((prev: any) => ({ 
                      ...prev, 
                      types: { ...prev.types, [type]: checked }
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    filters,
    preferences,
    isLoading,
    hasMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setFilters,
    updatePreferences,
    loadMore,
    refresh
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const { toast } = useToast();

  // Infinite scroll
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMore
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        if (!notification.title.toLowerCase().includes(searchLower) &&
            !notification.message.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'all' && notification.type !== selectedType) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'read' && !notification.isRead) return false;
      if (selectedStatus === 'unread' && notification.isRead) return false;

      return true;
    });
  }, [notifications, searchQuery, selectedType, selectedStatus]);

  // Group notifications by day
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {};

    filteredNotifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = 'Aujourd\'hui';
      } else if (isYesterday(date)) {
        groupKey = 'Hier';
      } else {
        groupKey = format(date, 'EEEE d MMMM yyyy', { locale: fr });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });

    return groups;
  }, [filteredNotifications]);

  // Handlers
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      toast({
        title: "Notification marquée comme lue",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer la notification comme lue",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: "Toutes les notifications marquées comme lues",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de marquer toutes les notifications comme lues",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      toast({
        title: "Notification supprimée",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la notification",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePreferences = async (prefs: any) => {
    try {
      await updatePreferences(prefs);
      toast({
        title: "Préférences mises à jour",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les préférences",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes vos notifications sont lues'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              data-testid="button-refresh"
            >
              <Bell className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                data-testid="button-mark-all-read"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreferences(true)}
              data-testid="button-preferences"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="h-4 w-4" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <Label htmlFor="search" className="text-sm font-medium">
                    Recherche
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search"
                    />
                  </div>
                </div>

                {/* Type filter */}
                <div>
                  <Label htmlFor="type-filter" className="text-sm font-medium">
                    Type
                  </Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="info">Informations</SelectItem>
                      <SelectItem value="warning">Avertissements</SelectItem>
                      <SelectItem value="error">Erreurs</SelectItem>
                      <SelectItem value="success">Succès</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status filter */}
                <div>
                  <Label htmlFor="status-filter" className="text-sm font-medium">
                    Statut
                  </Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="unread">Non lues</SelectItem>
                      <SelectItem value="read">Lues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick stats */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Statistiques</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total</span>
                      <Badge variant="secondary">{notifications.length}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Non lues</span>
                      <Badge variant="default">{unreadCount}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {Object.keys(groupedNotifications).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
                  <p className="text-muted-foreground text-center">
                    {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                      ? 'Aucune notification ne correspond à vos filtres.'
                      : 'Vous n\'avez pas encore de notifications.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                  <div key={dateGroup} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-semibold text-foreground">{dateGroup}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {groupNotifications.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <AnimatePresence>
                        {groupNotifications.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={handleMarkAsRead}
                            onDelete={handleDelete}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}

                {/* Load more sentinel */}
                {hasMore && (
                  <div ref={sentinelRef} className="flex justify-center py-4">
                    {isLoading && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span>Chargement...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preferences Modal */}
        <NotificationPreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          preferences={preferences}
          onUpdatePreferences={handleUpdatePreferences}
        />
      </div>
    </div>
  );
}