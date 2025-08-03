// sw.js
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

// 1. 설치 단계: 캐시할 자원을 저장합니다.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// 2. 요청 처리 단계: 네트워크 요청을 가로채 캐시된 자원을 우선 반환합니다.
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 캐시에 응답이 있으면 그것을 반환하고, 없으면 네트워크로 요청을 보냅니다.
                return response || fetch(event.request);
            })
    );
});