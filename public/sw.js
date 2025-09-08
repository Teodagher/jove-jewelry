// Enhanced Service Worker for aggressive image caching
const CACHE_NAME = 'jove-images-v2';
const OLD_CACHES = ['jove-images-v1']; // Clean up old caches
const SUPABASE_URL = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';
const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

// Install event - cache common images
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Pre-cache common variant images
      const commonImages = [
        `${SUPABASE_URL}/bracelets/bracelet-black-leather-emerald-whitegold.webp`,
        `${SUPABASE_URL}/rings/Ring emerald white gold.webp`,
        `${SUPABASE_URL}/necklaces/necklace-black-leather-emerald-yellowgold.webp`
      ];
      
      console.log('📦 Pre-caching common images...');
      return cache.addAll(commonImages).catch(error => {
        console.warn('⚠️ Some pre-cache images failed:', error);
      });
    }).then(() => {
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
            if (OLD_CACHES.includes(cacheName)) {
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

// Fetch event - cache images aggressively
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle Supabase image requests
  if (url.href.startsWith(SUPABASE_URL) && url.pathname.includes('.webp')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            console.log('🚀 Cache hit:', url.pathname);
            return response;
          }
          
          console.log('📥 Cache miss, fetching:', url.pathname);
          return fetch(event.request).then(networkResponse => {
            // Cache successful responses with timestamp
            if (networkResponse.ok) {
              // Clone the response and add cache timestamp
              const responseClone = networkResponse.clone();
              const cacheHeaders = new Headers(responseClone.headers);
              cacheHeaders.set('sw-cache-timestamp', Date.now().toString());
              
              const cachedResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: cacheHeaders
              });
              
              cache.put(event.request, cachedResponse);
              console.log('💾 Cached with timestamp:', url.pathname);
            }
            return networkResponse;
          }).catch(error => {
            console.error('❌ Fetch failed:', url.pathname, error);
            throw error;
          });
        });
      })
    );
  }
});

