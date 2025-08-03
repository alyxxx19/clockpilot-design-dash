import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { type CreateNotification } from '@shared/schema';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userRole?: string;
}

export class NotificationService {
  private io: SocketIOServer;
  private connectedUsers = new Map<number, Set<string>>(); // userId -> Set of socketIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      path: '/socket.io',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await storage.getUser(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      console.log(`User ${userId} connected via WebSocket`);

      // Add socket to user's connected sockets
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);

      // Join user's personal room
      socket.join(`user_${userId}`);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected from WebSocket`);
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId);
          }
        }
      });

      // Handle mark notification as read
      socket.on('mark_notification_read', async (notificationId: number) => {
        try {
          const success = await storage.markNotificationAsRead(notificationId);
          if (success) {
            socket.emit('notification_marked_read', { notificationId, success: true });
            
            // Broadcast to all user's connected devices
            this.io.to(`user_${userId}`).emit('notification_status_changed', {
              notificationId,
              status: 'read'
            });

            // Send updated unread count
            const unreadCount = await storage.getUnreadNotificationCount(userId);
            this.io.to(`user_${userId}`).emit('unread_count_updated', { count: unreadCount });
          } else {
            socket.emit('notification_marked_read', { notificationId, success: false, error: 'Notification not found' });
          }
        } catch (error) {
          console.error('Error marking notification as read:', error);
          socket.emit('notification_marked_read', { notificationId, success: false, error: 'Server error' });
        }
      });

      // Handle mark all notifications as read
      socket.on('mark_all_notifications_read', async () => {
        try {
          const count = await storage.markAllNotificationsAsRead(userId);
          socket.emit('all_notifications_marked_read', { success: true, count });
          
          // Broadcast to all user's connected devices
          this.io.to(`user_${userId}`).emit('notifications_bulk_read', { count });
          this.io.to(`user_${userId}`).emit('unread_count_updated', { count: 0 });
        } catch (error) {
          console.error('Error marking all notifications as read:', error);
          socket.emit('all_notifications_marked_read', { success: false, error: 'Server error' });
        }
      });

      // Send initial unread count
      this.sendUnreadCount(userId);
    });
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: number, notification: CreateNotification) {
    try {
      // Save notification to database
      const savedNotification = await storage.createNotification({
        ...notification,
        user_id: userId
      });

      // Send to all connected devices of the user
      this.io.to(`user_${userId}`).emit('new_notification', savedNotification);

      // Update unread count
      const unreadCount = await storage.getUnreadNotificationCount(userId);
      this.io.to(`user_${userId}`).emit('unread_count_updated', { count: unreadCount });

      console.log(`Notification sent to user ${userId}:`, notification.title);
      return savedNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendNotificationToUsers(userIds: number[], notification: Omit<CreateNotification, 'user_id'>) {
    const results = [];
    for (const userId of userIds) {
      try {
        const result = await this.sendNotificationToUser(userId, {
          ...notification,
          user_id: userId
        });
        results.push(result);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }
    return results;
  }

  // Send unread count to user
  async sendUnreadCount(userId: number) {
    try {
      const count = await storage.getUnreadNotificationCount(userId);
      this.io.to(`user_${userId}`).emit('unread_count_updated', { count });
    } catch (error) {
      console.error('Error sending unread count:', error);
    }
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  isUserConnected(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  // Trigger-based notification senders
  async sendTaskAssignedNotification(taskId: number, assignedToUserId: number, assignedByUserId: number) {
    const assignedByUser = await storage.getUser(assignedByUserId);
    const assignerName = assignedByUser ? `${assignedByUser.username}` : 'quelqu\'un';

    return this.sendNotificationToUser(assignedToUserId, {
      user_id: assignedToUserId,
      type: 'task_assigned',
      title: 'Nouvelle tâche assignée',
      message: `${assignerName} vous a assigné une nouvelle tâche.`,
      action_url: `/tasks/${taskId}`,
      priority: 'medium',
      data: { taskId, assignedBy: assignedByUserId }
    });
  }

  async sendPlanningModifiedNotification(employeeUserId: number, date: string, modifiedByUserId: number) {
    const modifiedByUser = await storage.getUser(modifiedByUserId);
    const modifierName = modifiedByUser ? `${modifiedByUser.username}` : 'un manager';

    return this.sendNotificationToUser(employeeUserId, {
      user_id: employeeUserId,
      type: 'planning_modified',
      title: 'Planning modifié',
      message: `${modifierName} a modifié votre planning pour le ${date}.`,
      action_url: `/planning?date=${date}`,
      priority: 'medium',
      data: { date, modifiedBy: modifiedByUserId }
    });
  }

  async sendValidationRequiredNotification(managerUserId: number, employeeUserId: number, weekStart: string) {
    const employee = await storage.getUser(employeeUserId);
    const employeeName = employee ? `${employee.username}` : 'un employé';

    return this.sendNotificationToUser(managerUserId, {
      user_id: managerUserId,
      type: 'validation_required',
      title: 'Validation requise',
      message: `${employeeName} a soumis ses heures pour validation (semaine du ${weekStart}).`,
      action_url: `/validation?employee=${employeeUserId}&week=${weekStart}`,
      priority: 'high',
      data: { employeeId: employeeUserId, weekStart }
    });
  }

  async sendTimeMissingNotification(employeeUserId: number, date: string) {
    return this.sendNotificationToUser(employeeUserId, {
      user_id: employeeUserId,
      type: 'time_missing',
      title: 'Saisie de temps manquante',
      message: `N'oubliez pas de saisir vos heures pour le ${date}.`,
      action_url: `/time-entries?date=${date}`,
      priority: 'medium',
      data: { date }
    });
  }

  async sendOvertimeAlertNotification(employeeUserId: number, date: string, hours: number) {
    return this.sendNotificationToUser(employeeUserId, {
      user_id: employeeUserId,
      type: 'overtime_alert',
      title: 'Alert heures supplémentaires',
      message: `Vous avez atteint ${hours}h supplémentaires le ${date}. Pensez à justifier si nécessaire.`,
      action_url: `/time-entries?date=${date}`,
      priority: 'high',
      data: { date, hours }
    });
  }
}

// Singleton instance
let notificationService: NotificationService | null = null;

export const initializeNotificationService = (httpServer: HTTPServer): NotificationService => {
  if (!notificationService) {
    notificationService = new NotificationService(httpServer);
  }
  return notificationService;
};

export const getNotificationService = (): NotificationService => {
  if (!notificationService) {
    throw new Error('NotificationService not initialized. Call initializeNotificationService first.');
  }
  return notificationService;
};