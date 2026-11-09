const CACHE_NAME = 'zerobudget-v0.1.15';

// Archivos estáticos a cachear para modo offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Fuerza la instalación inmediata
});

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
  self.clients.claim(); // Toma el control de los clientes abiertos sin necesidad de recargar
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones a Google Apps Script o peticiones que no sean GET
  if (event.request.url.includes('script.google.com') || event.request.method !== 'GET') {
    return;
  }
  
  // Estrategia Network-First: Intenta ir a la red, si falla (offline), devuelve la caché
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Actualiza la caché silenciosamente con la nueva versión descargada
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Fallo de red (offline), intenta recuperar de la caché
        return caches.match(event.request);
      })
  );
});
