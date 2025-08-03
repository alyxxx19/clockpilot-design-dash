import React, { useState } from 'react';
import { Bell, BellRing, Check, Trash2, Settings, Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    playSound,
    setPlaySound
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notificationId: number, actionUrl?: string) => {
    markAsRead(notificationId);
    if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

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

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          data-testid="notification-dropdown-trigger"
        >
          {isConnected ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellRing className="h-5 w-5 text-muted-foreground" />
          )}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="notification-badge"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        data-testid="notification-dropdown-content"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPlaySound(!playSound)}
              title={playSound ? 'Désactiver le son' : 'Activer le son'}
              data-testid="sound-toggle-button"
            >
              {playSound ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                title="Marquer tout comme lu"
                data-testid="mark-all-read-button"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read_at ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">
                        {getNotificationIcon(notification.type)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {notification.title}
                        </p>
                        <Badge
                          variant={getNotificationColor(notification.type, notification.priority)}
                          className="ml-2 text-xs"
                          data-testid={`notification-priority-${notification.id}`}
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: fr
                          })}
                        </span>
                        
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
                              <Check className="h-3 w-3" />
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
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
                data-testid="view-all-notifications-button"
              >
                Voir toutes les notifications ({notifications.length})
              </Button>
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <div className="p-2 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            {isConnected ? 'Connecté' : 'Déconnecté'}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}