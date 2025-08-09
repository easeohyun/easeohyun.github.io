const CACHE_VERSION = 3;
const CURRENT_CACHE_NAME = `umamusume-filter-cache-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/workers/filterWorker.js',
  '/characters.json',
  '/skill-descriptions.json',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME)
    .then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CURRENT_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    const isApiData = url.pathname.endsWith('/characters.json') || url.pathname.endsWith('/skill-descriptions.json');
    const isCachableAsset = ASSETS_TO_CACHE.some(asset => {
        const assetUrl = new URL(asset, self.location.origin);
        return assetUrl.href === url.href;
    });

    if (isApiData) {
        event.respondWith(
            caches.open(CURRENT_CACHE_NAME).then(cache => {
                return fetch(request).then(networkResponse => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => {
                    return cache.match(request);
                });
            })
        );
    } else if (isCachableAsset) {
        event.respondWith(
            caches.match(request).then(response => {
                return response || fetch(request).then(networkResponse => {
                    return caches.open(CURRENT_CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
    }
});
