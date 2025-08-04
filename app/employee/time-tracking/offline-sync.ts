import Dexie from 'dexie';

// Types for offline queue
export interface OfflineQueueItem {
  id?: number;
  type: 'clock-in' | 'clock-out' | 'time-entry-update' | 'time-entry-delete';
  data: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  timestamp: number;
  retryCount: number;
  synced: boolean;
  error?: string;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queueCount: number;
  lastSyncTime?: number;
  error?: string;
}

// Dexie database for offline storage
class OfflineDatabase extends Dexie {
  offlineQueue: any;

  constructor() {
    super('ClockPilotOffline');
    
    this.version(1).stores({
      offlineQueue: '++id, type, timestamp, synced, retryCount'
    });
  }
}

export class OfflineSyncManager {
  private db: OfflineDatabase;
  private syncInProgress = false;
  private maxRetries = 3;
  private baseRetryDelay = 1000; // 1 second
  private listeners: Array<(status: SyncStatus) => void> = [];
  private onlineStatus = navigator.onLine;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.db = new OfflineDatabase();
    this.setupEventListeners();
    this.registerServiceWorker();
  }

  // Register service worker
  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.serviceWorkerRegistration = registration;
        
        console.log('Service Worker registered:', registration);
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker installed, ask user to refresh
                this.notifyListeners({ 
                  isOnline: this.onlineStatus,
                  isSyncing: this.syncInProgress,
                  queueCount: 0,
                  error: 'Nouvelle version disponible. Veuillez actualiser la page.'
                });
              }
            });
          }
        });
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Handle messages from service worker
  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'SYNC_SUCCESS':
        console.log('Sync successful for item:', data.data.item);
        this.updateSyncStatus();
        break;
        
      case 'SYNC_COMPLETE':
        console.log('All items synced');
        this.syncInProgress = false;
        this.updateSyncStatus();
        break;
        
      case 'QUEUE_COUNT':
        this.notifyListeners({
          isOnline: this.onlineStatus,
          isSyncing: this.syncInProgress,
          queueCount: data.count
        });
        break;
    }
  }

  // Setup event listeners
  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('Connection restored');
      this.onlineStatus = true;
      this.updateSyncStatus();
      this.syncWhenOnline();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost');
      this.onlineStatus = false;
      this.updateSyncStatus();
    });

    // Page visibility for sync triggers
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.onlineStatus) {
        this.syncWhenOnline();
      }
    });
  }

  // Add action to offline queue
  async addToQueue(
    type: OfflineQueueItem['type'],
    data: any,
    endpoint: string,
    method: OfflineQueueItem['method'] = 'POST'
  ): Promise<void> {
    try {
      const queueItem: OfflineQueueItem = {
        type,
        data,
        endpoint,
        method,
        timestamp: Date.now(),
        retryCount: 0,
        synced: false
      };

      await this.db.offlineQueue.add(queueItem);
      console.log('Added to offline queue:', queueItem);
      
      this.updateSyncStatus();
      
      // Try to register background sync
      if (this.serviceWorkerRegistration?.sync) {
        try {
          await this.serviceWorkerRegistration.sync.register('clockpilot-sync');
        } catch (error) {
          console.log('Background sync registration failed:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      throw error;
    }
  }

  // Get pending queue items
  async getPendingItems(): Promise<OfflineQueueItem[]> {
    try {
      return await this.db.offlineQueue
        .where('synced')
        .equals(false)
        .and(item => item.retryCount < this.maxRetries)
        .toArray();
    } catch (error) {
      console.error('Failed to get pending items:', error);
      return [];
    }
  }

  // Get queue count
  async getQueueCount(): Promise<number> {
    try {
      return await this.db.offlineQueue
        .where('synced')
        .equals(false)
        .count();
    } catch (error) {
      console.error('Failed to get queue count:', error);
      return 0;
    }
  }

  // Sync all pending items
  async syncPendingItems(): Promise<void> {
    if (this.syncInProgress || !this.onlineStatus) {
      return;
    }

    this.syncInProgress = true;
    this.updateSyncStatus();

    try {
      const pendingItems = await this.getPendingItems();
      console.log(`Syncing ${pendingItems.length} pending items`);

      for (const item of pendingItems) {
        await this.syncItem(item);
      }

      // Clean up successfully synced items
      await this.cleanupSyncedItems();
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.notifyListeners({
        isOnline: this.onlineStatus,
        isSyncing: false,
        queueCount: await this.getQueueCount(),
        error: 'Erreur de synchronisation'
      });
    } finally {
      this.syncInProgress = false;
      this.updateSyncStatus();
    }
  }

  // Sync individual item
  private async syncItem(item: OfflineQueueItem): Promise<void> {
    try {
      console.log('Syncing item:', item);
      
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        },
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        // Mark as synced
        await this.db.offlineQueue.update(item.id!, { 
          synced: true,
          error: undefined
        });
        
        console.log('Item synced successfully:', item.id);
        
        // Notify success
        this.notifyListeners({
          isOnline: this.onlineStatus,
          isSyncing: this.syncInProgress,
          queueCount: await this.getQueueCount(),
          lastSyncTime: Date.now()
        });
        
      } else {
        // Increment retry count
        const newRetryCount = item.retryCount + 1;
        await this.db.offlineQueue.update(item.id!, { 
          retryCount: newRetryCount,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
        
        console.log(`Item sync failed (attempt ${newRetryCount}):`, item.id);
        
        // Exponential backoff for retries
        if (newRetryCount < this.maxRetries) {
          const delay = this.baseRetryDelay * Math.pow(2, newRetryCount - 1);
          setTimeout(() => this.syncItem(item), delay);
        }
      }
      
    } catch (error) {
      console.error('Sync error for item:', item.id, error);
      
      // Increment retry count
      const newRetryCount = item.retryCount + 1;
      await this.db.offlineQueue.update(item.id!, { 
        retryCount: newRetryCount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Clean up synced items (keep recent ones for history)
  private async cleanupSyncedItems(): Promise<void> {
    try {
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      await this.db.offlineQueue
        .where('synced')
        .equals(true)
        .and(item => item.timestamp < cutoffTime)
        .delete();
        
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // Sync when online
  private async syncWhenOnline(): Promise<void> {
    if (this.onlineStatus && !this.syncInProgress) {
      const queueCount = await this.getQueueCount();
      if (queueCount > 0) {
        console.log(`Auto-syncing ${queueCount} items`);
        await this.syncPendingItems();
      }
    }
  }

  // Update sync status and notify listeners
  private async updateSyncStatus(): Promise<void> {
    const queueCount = await this.getQueueCount();
    
    this.notifyListeners({
      isOnline: this.onlineStatus,
      isSyncing: this.syncInProgress,
      queueCount,
      lastSyncTime: queueCount === 0 ? Date.now() : undefined
    });
  }

  // Add status listener
  addStatusListener(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately notify with current status
    this.updateSyncStatus();
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(status: SyncStatus): void {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  // Force sync
  async forceSync(): Promise<void> {
    await this.syncPendingItems();
  }

  // Check if currently online
  isOnline(): boolean {
    return this.onlineStatus;
  }

  // Check if sync is in progress
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  // Clear all queue items (for testing/reset)
  async clearQueue(): Promise<void> {
    await this.db.offlineQueue.clear();
    this.updateSyncStatus();
  }
}

// Singleton instance
export const offlineSyncManager = new OfflineSyncManager();