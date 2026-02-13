// FamilyVine Service Worker v28
// SECURITY: Uses network-first for navigation and API to ensure auth redirects always work
const CACHE_NAME = 'familyvine-v28';
const STATIC_CACHE_NAME = 'familyvine-static-v28';

// Only cache truly static assets (icons, manifest) — NOT HTML or JS bundles
const STATIC_FILES = [
  '/manifest.json',
  '/icons/icon-192x192.png?v=3',
  '/icons/icon-512x512.png?v=3',
  '/favicon.ico'
];

// Install event - cache essential static files only
self.addEventListener('install', (event) => {
  console.log('FamilyVine SW: Installing v22...');

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

// Activate event - clean up ALL old caches (including v4 that cached too aggressively)
self.addEventListener('activate', (event) => {
  console.log('FamilyVine SW: Activating v5...');

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

// Fetch event — network-first for navigation and API, cache-first only for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const url = new URL(event.request.url);

  // NEVER cache or intercept API requests — always go straight to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests (HTML pages) — ALWAYS network-first
  // Critical for auth: ensures ProtectedRoute redirects run on fresh HTML every time
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only fall back to cache when truly offline
          return caches.match('/') || new Response('Offline — please check your connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — cache-first is safe because
  // React build uses content-hashed filenames; new builds = new URLs
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
    return;
  }

  // Everything else — network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  console.log('FamilyVine SW: Background sync triggered');

  if (event.tag === 'background-sync') {
    event.waitUntil(
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
