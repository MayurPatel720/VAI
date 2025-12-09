// Vachanamrut AI Service Worker
// Production-level caching strategy

const CACHE_NAME = 'vachanamrut-ai-v1';
const STATIC_CACHE = 'vachanamrut-static-v1';
const DYNAMIC_CACHE = 'vachanamrut-dynamic-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// API routes that should always go to network
const NETWORK_ONLY = [
  '/api/auth',
  '/api/chat/message',
  '/api/payment',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Network-only for certain routes
  if (NETWORK_ONLY.some(route => url.pathname.startsWith(route))) {
    event.respondWith(fetch(request));
    return;
  }

  // For API routes - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache successful GET responses
          if (response.ok) {
            const clonedResponse = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // For static assets - Cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
          
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (!response.ok) throw new Error('Network response was not ok');
            
            const clonedResponse = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
            
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline messages (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    console.log('[SW] Syncing offline messages...');
    // Implement sync logic here
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New spiritual insight awaits',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Vachanamrut AI', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
