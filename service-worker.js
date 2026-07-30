const CACHE = 'van-fee-calc-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'utils.js',
  'storage.js',
  'calculations.js',
  'ui.js',
  'charts.js',
  'exports.js',
  'manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      return caches.open(CACHE).then(cache => {
        if (e.request.url.startsWith(self.location.origin)) cache.put(e.request, res.clone());
        return res;
      });
    }))
  );
});
