const CACHE_NOME = 'controle-de-gastos-v32';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const req = evento.request;
  if(req.method !== 'GET'){ return; }
  const url = new URL(req.url);
  const mesmoSite = url.origin === self.location.origin;
  if(mesmoSite){
    // rede primeiro: o app sempre abre na versão mais nova; sem internet usa o que está salvo
    evento.respondWith(
      fetch(req, {cache:'no-cache'}).then((res) => {
        if(res.ok){ const copia = res.clone(); caches.open(CACHE_NOME).then((c) => c.put(req, copia)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  evento.respondWith(
    caches.match(req).then((r) => r || fetch(req).then((res) => {
      if(res.ok){ const copia = res.clone(); caches.open(CACHE_NOME).then((c) => c.put(req, copia)); }
      return res;
    }).catch(() => r))
  );
});
