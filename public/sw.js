// Enhanced Service Worker for PWA with aggressive caching
const CACHE_VERSION = 'v3';
const CACHE_NAME = `jove-pwa-${CACHE_VERSION}`;
const IMAGE_CACHE = `jove-images-${CACHE_VERSION}`;
const PAGE_CACHE = `jove-pages-${CACHE_VERSION}`;
const API_CACHE = `jove-api-${CACHE_VERSION}`;
const STATIC_CACHE = `jove-static-${CACHE_VERSION}`;

const SUPABASE_URL = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days for pages
const IMAGE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days for images

// Assets to precache for offline functionality
const PRECACHE_ASSETS = [
  '/',
  '/customize',
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
      caches.open(STATIC_CACHE).then(cache => {
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
  const currentCaches = [CACHE_NAME, IMAGE_CACHE, PAGE_CACHE, API_CACHE, STATIC_CACHE];

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
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

// Helper: Check if cache is stale
function isCacheStale(response, maxAge) {
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;

  const age = Date.now() - parseInt(timestamp, 10);
  return age > maxAge;
}

// Helper: Add timestamp to cached response
function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Strategy: Stale-While-Revalidate for pages
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = addTimestamp(networkResponse.clone());
      await cache.put(request, responseToCache);
      console.log('🔄 Updated cache:', request.url);
    }
    return networkResponse;
  }).catch(error => {
    console.warn('⚠️ Network fetch failed:', error);
    return null;
  });

  // Return cached version immediately if available and not too stale
  if (cachedResponse && !isCacheStale(cachedResponse, maxAge)) {
    console.log('⚡ Serving from cache:', request.url);
    // Update in background
    fetchPromise;
    return cachedResponse;
  }

  // Wait for network if no cache or stale
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Fallback to stale cache if network failed
  if (cachedResponse) {
    console.log('📦 Serving stale cache:', request.url);
    return cachedResponse;
  }

  throw new Error('No cache and network failed');
}

// Strategy: Cache First for images
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse && !isCacheStale(cachedResponse, maxAge)) {
    console.log('🚀 Image from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = addTimestamp(networkResponse.clone());
      await cache.put(request, responseToCache);
      console.log('💾 Cached image:', request.url);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      console.log('📦 Serving stale image:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle Supabase images - cache first strategy
  if (url.href.startsWith(SUPABASE_URL) && url.pathname.includes('.webp')) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE, IMAGE_MAX_AGE));
    return;
  }

  // Handle navigation requests - stale-while-revalidate
  if (event.request.mode === 'navigate') {
    event.respondWith(
      staleWhileRevalidate(event.request, PAGE_CACHE, CACHE_MAX_AGE)
        .catch(() => {
          // Fallback to offline page
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Handle API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(API_CACHE);
            const responseToCache = addTimestamp(response.clone());
            await cache.put(event.request, responseToCache);
            console.log('💾 Cached API:', url.pathname);
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('📦 Serving cached API:', url.pathname);
            return cachedResponse;
          }
          throw new Error('Network request failed and no cache available');
        })
    );
    return;
  }

  // Handle static assets (JS, CSS, fonts) - cache first
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE, CACHE_MAX_AGE));
    return;
  }

  // Handle other images - cache first
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    event.respondWith(cacheFirst(event.request, IMAGE_CACHE, IMAGE_MAX_AGE));
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(
    staleWhileRevalidate(event.request, CACHE_NAME, CACHE_MAX_AGE)
      .catch(() => fetch(event.request))
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Clear specific cache
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    const cacheName = event.data.cacheName;
    caches.delete(cacheName).then(() => {
      console.log('🗑️ Cleared cache:', cacheName);
    });
  }

  // Get cache info
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.keys().then(cacheNames => {
      const info = {
        caches: cacheNames,
        version: CACHE_VERSION
      };
      event.ports[0].postMessage(info);
    });
  }
});

// Background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('🔄 Background sync triggered');
    // Handle background sync
  }
});
