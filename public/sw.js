// ClockPilot Service Worker
const CACHE_NAME = 'clockpilot-v1';
const STATIC_CACHE_NAME = 'clockpilot-static-v1';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline',
  // Add other static assets as needed
];

// API endpoints that can work offline
const OFFLINE_ENDPOINTS = [
  '/api/time-entries/clock-in',
  '/api/time-entries/clock-out',
  '/api/time-entries/current',
  '/api/time-entries/today'
];

// IndexedDB setup for offline queue
const DB_NAME = 'clockpilot-offline';
const DB_VERSION = 1;
const STORE_NAME = 'offline-queue';

class OfflineQueue {
  constructor() {
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
      };
    });
  }

  async addToQueue(type, data, endpoint, method = 'POST') {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const queueItem = {
      type,
      data,
      endpoint,
      method,
      timestamp: Date.now(),
      retryCount: 0,
      synced: false
    };
    
    return store.add(queueItem);
  }

  async getQueuedItems() {
    if (!this.db) await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result.filter(item => !item.synced));
      request.onerror = () => reject(request.error);
    });
  }

  async markAsSynced(id) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.synced = true;
        store.put(item);
      }
    };
  }

  async incrementRetryCount(id) {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.retryCount = (item.retryCount || 0) + 1;
        store.put(item);
      }
    };
  }

  async clearSyncedItems() {
    if (!this.db) await this.initDB();
    
    const transaction = this.db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const items = request.result;
      items.forEach(item => {
        if (item.synced) {
          store.delete(item.id);
        }
      });
    };
  }
}

const offlineQueue = new OfflineQueue();

// Install event
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request).then(response => {
        // Don't cache if not a successful response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      // Return offline page for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline');
      }
    })
  );
});

// Handle API requests
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const isOfflineEndpoint = OFFLINE_ENDPOINTS.some(endpoint => 
    url.pathname.startsWith(endpoint)
  );

  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed for:', url.pathname);
    
    // Handle offline scenarios
    if (isOfflineEndpoint) {
      if (request.method === 'GET') {
        // Return cached response for GET requests
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
      } else if (request.method === 'POST') {
        // Queue POST requests for later sync
        const data = await request.json().catch(() => ({}));
        await offlineQueue.addToQueue(
          getRequestType(url.pathname),
          data,
          url.pathname,
          request.method
        );
        
        // Return a success response to prevent errors
        return new Response(JSON.stringify({
          success: true,
          offline: true,
          message: 'Action enregistrée hors ligne'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Return generic offline response
    return new Response(JSON.stringify({
      error: 'Connexion indisponible',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get request type from pathname
function getRequestType(pathname) {
  if (pathname.includes('clock-in')) return 'clock-in';
  if (pathname.includes('clock-out')) return 'clock-out';
  return 'unknown';
}

// Background sync
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'clockpilot-sync') {
    event.waitUntil(syncOfflineQueue());
  }
});

// Sync offline queue
async function syncOfflineQueue() {
  console.log('[SW] Syncing offline queue...');
  
  try {
    const queuedItems = await offlineQueue.getQueuedItems();
    console.log('[SW] Found', queuedItems.length, 'items to sync');
    
    for (const item of queuedItems) {
      try {
        const response = await fetch(item.endpoint, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data)
        });
        
        if (response.ok) {
          await offlineQueue.markAsSynced(item.id);
          console.log('[SW] Synced item:', item.id);
          
          // Notify clients about successful sync
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              data: { item, response: await response.json() }
            });
          });
        } else {
          await offlineQueue.incrementRetryCount(item.id);
          console.log('[SW] Failed to sync item:', item.id);
        }
      } catch (error) {
        console.log('[SW] Error syncing item:', item.id, error);
        await offlineQueue.incrementRetryCount(item.id);
      }
    }
    
    // Clean up synced items
    await offlineQueue.clearSyncedItems();
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE'
      });
    });
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Message handling
self.addEventListener('message', event => {
  const { data } = event;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_QUEUE_COUNT':
      offlineQueue.getQueuedItems().then(items => {
        event.source.postMessage({
          type: 'QUEUE_COUNT',
          count: items.length
        });
      });
      break;
      
    case 'FORCE_SYNC':
      syncOfflineQueue();
      break;
  }
});

console.log('[SW] Service Worker loaded');