const CACHE_NAME = 'edubridge-dynamic-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/css/style.css?v=1.0',
  '/js/main.js',
  '/manifest.json',
  '/images/favicon.ico',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// 1. Install Event: Static Assets Cache karein
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: Purane Caches delete karein
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 3. Fetch Event: Network First Strategy (Dynamic Caching)
self.addEventListener('fetch', (event) => {
  // Sirf GET requests handle karein
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Agar network se response mila, to use Cache mein bhi save kar lein
        const responseToCache = networkResponse.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          // Sirf http/https requests ko cache karein
          if(event.request.url.startsWith('http')) {
             cache.put(event.request, responseToCache);
          }
        });

        return networkResponse;
      })
      .catch(() => {
        // Agar Network fail (Offline), to Cache check karein
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse; // Cache wala page dikhayein
          }
          // Agar Cache mein bhi nahi hai aur ye HTML request hai, to Offline page dikhayein
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
        });
      })
  );
});