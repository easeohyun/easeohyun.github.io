const CACHE_VERSION = 9;
const CURRENT_CACHE_NAME = `umamusume-filter-cache-v${CACHE_VERSION}`;
const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './workers/filterWorker.js',
  './characters.json',
  './skill-descriptions.json',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(error => console.error('Failed to cache app shell:', error))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CURRENT_CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

const handleAssetRequest = async (request) => {
    const cache = await caches.open(CURRENT_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(error => {
        console.error('Asset fetch failed:', error);
        throw error;
    });

    return cachedResponse || fetchPromise;
};

const handleJsonRequest = async (request) => {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CURRENT_CACHE_NAME);
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('Network request failed, attempting to serve from cache.', error);
        const cache = await caches.open(CURRENT_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
};

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (APP_SHELL_ASSETS.includes(url.pathname) || url.origin === self.location.origin) {
         event.respondWith(handleAssetRequest(request));
    } else if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
        event.respondWith(handleAssetRequest(request));
    } else if (url.pathname.endsWith('.json')) {
        event.respondWith(handleJsonRequest(request));
    }
});
