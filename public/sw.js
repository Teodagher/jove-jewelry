// Simple Service Worker for aggressive image caching
const CACHE_NAME = 'jove-images-v1';
const SUPABASE_URL = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/public/customization-item';

// Install event - cache common images
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  event.waitUntil(clients.claim());
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
            // Cache successful responses
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
              console.log('💾 Cached:', url.pathname);
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

