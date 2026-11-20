// MARRPS — Service Worker
// Estratégia: rede primeiro (versão mais recente sempre que há rede);
// sem rede, usa a cópia guardada — a app continua a funcionar offline.

const CACHE_NAME = 'marrps-debito-gas-v2026.10.07b';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon.png',
  // Google Fonts são carregadas externamente; o browser cacheia-as por conta própria.
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap'
];

// Instalação: pré-carrega todos os recursos para o cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(err => {
        // Não falha se algum recurso (ex: fontes externas) der erro.
        console.warn('Some assets failed to cache:', err);
      }))
      .then(() => self.skipWaiting())
  );
});

// Ativação: limpa caches antigos.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: rede primeiro, cache como reserva quando não há rede.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request, { ignoreSearch: true })
      .then(cached => cached || caches.match('./index.html')))
  );
});
