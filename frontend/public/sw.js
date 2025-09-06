// FamilyVine Service Worker
const CACHE_NAME = 'familyvine-v4';
const STATIC_CACHE_NAME = 'familyvine-static-v4';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png?v=3',
  '/icons/icon-512x512.png?v=3',
  '/favicon.ico'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('FamilyVine SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('FamilyVine SW: Caching static files');
        return cache.addAll(STATIC_FILES.map(url => new Request(url, {
          cache: 'reload'
        })));
      })
      .then(() => {
        console.log('FamilyVine SW: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('FamilyVine SW: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('FamilyVine SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== CACHE_NAME) {
              console.log('FamilyVine SW: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('FamilyVine SW: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          return cachedResponse;
        }

        // Clone the request because it can only be used once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it can only be used once
            const responseToCache = response.clone();

            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests when offline
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  console.log('FamilyVine SW: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle any pending data sync here
      console.log('FamilyVine SW: Syncing data...')
    );
  }
});

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  console.log('FamilyVine SW: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'familyvine-notification'
  };

  event.waitUntil(
    self.registration.showNotification('FamilyVine', options)
  );
});