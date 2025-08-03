const CACHE_NAME = 'umamusume-filter-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/workers/filterWorker.js',
    '/characters.json',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate 이벤트를 추가하여 오래된 캐시를 정리합니다.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


self.addEventListener('fetch', (event) => {
    // 'characters.json'에 대해 Stale-While-Revalidate 전략 적용
    if (event.request.url.includes('characters.json')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
    } else if (ASSETS_TO_CACHE.includes(event.request.url) || event.request.destination) {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return response || fetch(event.request).then(networkResponse => {
                    // 동적으로 로드되는 자원도 캐싱되도록 개선
                    if (networkResponse.ok) {
                       const cacheControl = networkResponse.headers.get('Cache-Control');
                       // 브라우저 확장 프로그램 등에 의한 요청은 캐시하지 않음
                       if (!cacheControl || !cacheControl.includes('no-store')) {
                            return caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse.clone());
                                return networkResponse;
                            });
                       }
                    }
                    return networkResponse;
                });
            })
        );
    }
});
