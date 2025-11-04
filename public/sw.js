const CACHE = 'raizes-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/router.js',
  '/supabase.js',
  '/components/ui.js',
  '/components/mascot.js',
  '/utils/accessibility.js',
  '/pages/splash.js',
  '/pages/welcome.js',
  '/pages/login.js',
  '/pages/register.js',
  '/pages/games.js',
  '/games/onde-esta-o-brinquedo.js',
  '/pages/progress.js',
  '/img/mascot.svg',
  '/manifest.json',
];
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(cache=> cache.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=> Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
  );
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(res=> res || fetch(e.request).then(resp=>{
        const copy = resp.clone();
        caches.open(CACHE).then(cache=> cache.put(e.request, copy));
        return resp;
      }).catch(()=> caches.match('/index.html')))
    );
  }
});
