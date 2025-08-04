import { useState, useEffect, useCallback, useRef } from 'react';
// Mock auth hook - will be replaced with real implementation
const useAuth = () => ({
  user: { id: 1, role: 'employee' },
  isAuthenticated: true
});
import { apiRequest } from '@/lib/queryClient';

export interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  contextType?: 'planning' | 'task' | 'employee' | 'timeentry';
  contextId?: number;
  contextUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface NotificationFilters {
  type?: 'info' | 'warning' | 'error' | 'success';
  isRead?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  digestFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  types: {
    info: boolean;
    warning: boolean;
    error: boolean;
    success: boolean;
  };
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  filters: NotificationFilters;
  preferences: NotificationPreferences;
  isLoading: boolean;
  hasMore: boolean;
  
  // Actions
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  setFilters: (filters: NotificationFilters) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NOTIFICATIONS_PER_PAGE = 20;

export function useNotifications(): UseNotificationsReturn {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFiltersState] = useState<NotificationFilters>({});
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    digestFrequency: 'daily',
    types: {
      info: true,
      warning: true,
      error: true,
      success: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Notifications WebSocket connected');
      // Send authentication
      ws.send(JSON.stringify({
        type: 'auth',
        token: localStorage.getItem('token')
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification' && mountedRef.current) {
          const newNotification: Notification = {
            id: data.id,
            type: data.notificationType || 'info',
            title: data.title,
            message: data.message,
            isRead: false,
            createdAt: data.createdAt || new Date().toISOString(),
            contextType: data.contextType,
            contextId: data.contextId,
            contextUrl: data.contextUrl,
            priority: data.priority || 'medium'
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Notifications WebSocket disconnected');
      // Reconnect after delay
      if (mountedRef.current) {
        setTimeout(() => {
          if (mountedRef.current && isAuthenticated) {
            // Reconnect logic here
          }
        }, 5000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [isAuthenticated, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async (pageNum: number = 1, resetList: boolean = false) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: NOTIFICATIONS_PER_PAGE.toString(),
        ...filters
      });

      const response = await apiRequest(`/api/notifications?${queryParams}`);
      
      if (mountedRef.current) {
        if (resetList || pageNum === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data.notifications]);
        }
        
        setUnreadCount(response.data.unreadCount);
        setHasMore(response.data.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated, filters]);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await apiRequest('/api/notifications/preferences');
      if (mountedRef.current) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  }, [isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications(1, true);
      loadPreferences();
    }
  }, [isAuthenticated, loadNotifications, loadPreferences]);

  // Reload when filters change
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications(1, true);
    }
  }, [filters, loadNotifications]);

  // Actions
  const markAsRead = useCallback(async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
      
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, isRead: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
      
      if (mountedRef.current) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' });
      
      if (mountedRef.current) {
        const notifToDelete = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(notif => notif.id !== id));
        
        if (notifToDelete && !notifToDelete.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }, [notifications]);

  const setFilters = useCallback((newFilters: NotificationFilters) => {
    setFiltersState(newFilters);
  }, []);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      await apiRequest('/api/notifications/preferences', {
        method: 'PATCH',
        body: updatedPreferences
      });
      
      if (mountedRef.current) {
        setPreferences(updatedPreferences);
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }, [preferences]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadNotifications(page + 1, false);
  }, [hasMore, isLoading, page, loadNotifications]);

  const refresh = useCallback(async () => {
    await loadNotifications(1, true);
  }, [loadNotifications]);

  return {
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
  };
}