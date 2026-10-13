// Service Worker for MindLabZ PWA - Ultra-Reliable SPA & Mobile Offline Cache
const CACHE_NAME = 'mindlabz-pwa-v2';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.png',
  '/app-icon.jpg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Install: precache SPA shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA Precache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean obsolete caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for SKIP_WAITING message triggered during user-initiated update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch: Bulletproof SPA Navigation & Network Handling
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass API routes, live WebSocket bridges, and external cloud services
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/live') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic')
  ) {
    return;
  }

  // 1. NAVIGATION REQUESTS (Smartphone browser refresh / "mise à jour", subroutes like /profile, /learn, etc.)
  // Crucial fix: If server returns 404 (e.g. on Netlify or static host), NEVER serve the 404!
  // Fall back to the cached index.html so React Router renders the requested subroute smoothly.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // If the network gave a successful 200 response, serve it
          if (networkResponse && networkResponse.status === 200) {
            return networkResponse;
          }
          // If network returned 404 or non-200, fallback to SPA index.html
          return caches.match('/index.html').then((cached) => {
            return (
              cached ||
              caches.match('/') ||
              networkResponse
            );
          });
        })
        .catch(() => {
          // Network failure / Offline fallback
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // 2. STATIC ASSETS (Scripts, styles, images, fonts)
  // Cache-first with stale-while-revalidate update
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background for freshest styles/scripts
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});
