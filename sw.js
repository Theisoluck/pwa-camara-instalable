const CACHE_STATIC_NAME = 'pwa-camara-v1';
const STATIC_FILES = [
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalación: precachea el App Shell y los iconos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then((cache) => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activación: borra cachés de versiones anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nombresCaches) => {
        return Promise.all(
          nombresCaches.map((nombreCache) => {
            if (nombreCache !== CACHE_STATIC_NAME) {
              return caches.delete(nombreCache);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Cache First, si no está en caché va a la red
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((respuestaCache) => {
        return respuestaCache || fetch(event.request);
      })
  );
});
