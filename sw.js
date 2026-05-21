/* ════════════════════════════════════════════
   DS Attend — Service Worker
   Caches the app shell for offline use.
   ════════════════════════════════════════════ */

var CACHE_NAME = 'ds-attend-v1';

var APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

/* Install — cache app shell */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

/* Activate — clean old caches */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* Fetch — network first, fall back to cache */
self.addEventListener('fetch', function(e) {
  /* Don't intercept Google Sheets API calls — always needs network */
  if (e.request.url.indexOf('script.google.com') !== -1 ||
      e.request.url.indexOf('googleapis.com') !== -1) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        /* Cache fresh copy of app shell */
        if (response.ok && e.request.method === 'GET') {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(e.request, copy); });
        }
        return response;
      })
      .catch(function() {
        /* Offline — serve from cache */
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
  );
});
