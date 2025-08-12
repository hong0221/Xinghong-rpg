
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open('xinhong-rpg-cache-v21').then(function(cache) {
      return cache.addAll([
        './index.html',
        './style.css',
        './app.js',
        './levels_firebase.js',
        './progress_sync.js',
        './config.js',
        './manifest.json',
        './icon.png'
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
