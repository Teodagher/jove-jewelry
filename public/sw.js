// Enhanced Service Worker for PWA with offline support
const CACHE_NAME = 'jove-pwa-v1';
const IMAGE_CACHE = 'jove-images-v2';
const OLD_CACHES = ['jove-images-v1', 'jove-pwa-v0'];
const SUPABASE_URL = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

// Assets to precache for offline functionality
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');

  event.waitUntil(
    Promise.all([
      // Precache critical assets
      caches.open(CACHE_NAME).then(cache => {
        console.log('📦 Pre-caching critical assets...');
        return cache.addAll(PRECACHE_ASSETS).catch(error => {
          console.warn('⚠️ Some pre-cache assets failed:', error);
        });
      }),
      // Precache common images
      caches.open(IMAGE_CACHE).then(cache => {
        const commonImages = [
          `${SUPABASE_URL}/bracelets/bracelet-black-leather-emerald-whitegold.webp`,
          `${SUPABASE_URL}/rings/Ring emerald white gold.webp`,
          `${SUPABASE_URL}/necklaces/necklace-black-leather-emerald-yellowgold.webp`
        ];
        console.log('📦 Pre-caching common images...');
        return cache.addAll(commonImages).catch(error => {
          console.warn('⚠️ Some image pre-cache failed:', error);
        });
      })
    ]).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (OLD_CACHES.includes(cacheName) ||
              (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Supabase images - cache first strategy
  if (url.href.startsWith(SUPABASE_URL) && url.pathname.includes('.webp')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            console.log('🚀 Image cache hit:', url.pathname);
            return response;
          }

          console.log('📥 Image cache miss, fetching:', url.pathname);
          return fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              const cacheHeaders = new Headers(responseClone.headers);
              cacheHeaders.set('sw-cache-timestamp', Date.now().toString());

              const cachedResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: cacheHeaders
              });

              cache.put(event.request, cachedResponse);
              console.log('💾 Cached image:', url.pathname);
            }
            return networkResponse;
          }).catch(error => {
            console.error('❌ Image fetch failed:', url.pathname, error);
            throw error;
          });
        });
      })
    );
    return;
  }

  // Handle navigation requests - network first, fallback to offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful navigations
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, try cache first, then offline page
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle API requests - network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful GET requests
          if (response.ok && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for GET requests
          if (event.request.method === 'GET') {
            return caches.match(event.request);
          }
          // For non-GET requests, throw error
          throw new Error('Network request failed and no cache available');
        })
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
