
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('xinhong-rpg-cache').then(function(cache) {
      return cache.addAll([
        './index.html',
        './style.css',
        './app.js',
        './icon.png',
        './manifest.json'
      ]);
    })
  );
});
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});
