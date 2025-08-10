const CACHE_VERSION = 4;
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

const handleApiRequest = async (request) => {
    const cache = await caches.open(CURRENT_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const networkFetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(error => {
        console.error('Network fetch failed:', error);
    });

    return cachedResponse || networkFetchPromise;
};

const handleAssetRequest = async (request) => {
    const cache = await caches.open(CURRENT_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    return cachedResponse || fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(error => {
        console.error('Asset fetch failed:', error);
    });
};

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.pathname.endsWith('.json')) {
        event.respondWith(handleApiRequest(request));
    } else if (APP_SHELL_ASSETS.some(asset => url.href === new URL(asset, self.location.origin).href)) {
        event.respondWith(handleAssetRequest(request));
    }
});
