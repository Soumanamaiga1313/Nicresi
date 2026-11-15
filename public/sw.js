// NICRESI — site disponible hors connexion.
// Pages : le réseau d'abord (toujours la dernière version), la copie enregistrée si Internet est coupé,
// sinon la page « hors-ligne » avec les contacts (l'appel téléphonique marche sans Internet).
// Fichiers (CSS, JS, images) : la copie enregistrée tout de suite, mise à jour en arrière-plan.
// Les espaces du NCC (/owner, /start, /api) ne passent jamais par ici.
// __VERSION__ est remplacé par le commit lors de l'installation (scripts/serveur/installer.sh).
var CACHE = 'nicresi-__VERSION__';
var BASE = ['/', '/hors-ligne.html', '/css/style.css', '/js/site.js', '/img/girafe.png', '/img/icone-192.png', '/favicon.ico'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (cles) {
    return Promise.all(cles.filter(function (c) { return c.indexOf('nicresi-') === 0 && c !== CACHE; }).map(function (c) { return caches.delete(c); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || /^\/(owner|start|api)(\/|$)/.test(url.pathname)) return;

  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok) { var copie = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); }
      return r;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('/hors-ligne.html'); });
    }));
    return;
  }

  e.respondWith(caches.match(req).then(function (enCache) {
    var reseau = fetch(req).then(function (r) {
      if (r.ok) { var copie = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, copie); }); }
      return r;
    }).catch(function () { return enCache || caches.match(req, { ignoreSearch: true }); });
    return enCache || reseau;
  }));
});
