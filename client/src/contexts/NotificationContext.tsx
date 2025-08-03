import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { type Notification } from '@shared/schema';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: number) => void;
  refreshNotifications: () => Promise<void>;
  playSound: boolean;
  setPlaySound: (enabled: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [playSound, setPlaySound] = useState(() => {
    return localStorage.getItem('notifications-sound') !== 'false';
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketInstance = io({
      auth: {
        token: token
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('📡 Connected to notification service');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('📡 Disconnected from notification service');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Notification event handlers
    socketInstance.on('new_notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to notifications list
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast.success(notification.title, {
        description: notification.message,
        action: notification.action_url ? {
          label: 'Voir',
          onClick: () => window.location.href = notification.action_url!
        } : undefined,
        duration: notification.priority === 'high' ? 8000 : 4000
      });

      // Play sound if enabled
      if (playSound && notification.priority !== 'low') {
        playNotificationSound();
      }
    });

    socketInstance.on('unread_count_updated', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    socketInstance.on('notification_status_changed', ({ notificationId, status }: { notificationId: number; status: string }) => {
      if (status === 'read') {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    });

    socketInstance.on('notifications_bulk_read', ({ count }: { count: number }) => {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      toast.success(`${count} notifications marquées comme lues`);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user, token, playSound]);

  // Load initial notifications
  useEffect(() => {
    if (user) {
      refreshNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Update localStorage when playSound changes
  useEffect(() => {
    localStorage.setItem('notifications-sound', playSound.toString());
  }, [playSound]);

  const refreshNotifications = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = (notificationId: number) => {
    if (socket && isConnected) {
      socket.emit('mark_notification_read', notificationId);
    }
  };

  const markAllAsRead = () => {
    if (socket && isConnected) {
      socket.emit('mark_all_notifications_read');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast.success('Notification supprimée');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Short, pleasant notification sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    playSound,
    setPlaySound
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}