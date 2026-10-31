
const CACHE = 'sql-20261031-ux8';
const FILES = ["./","./language.js","./game-ux.css","./audio.js","./assets/jetbrains-mono-latin-wght-normal-B9CIFXIH.woff2","./assets/sqlite3-Con_VOcu.wasm","./assets/sqlite3-opfs-async-proxy-Ck-yCayi.js","./assets/index-BTsi1aUo.css","./assets/index-B3dxuywU.js","./assets/__vite-browser-external-BIHI7g3E.js","./assets/nodefs-CAPNCeCP.js","./assets/opfs-ahp-Ik8c_pfz.js","./assets/__vite-browser-external-9wXp6ZBx.js","./assets/nodefs-BPYWvzlX.js","./assets/opfs-ahp-BVRg_Iad.js","./assets/sqlite3-worker1-S784ELMu.js"];
const ON_DEMAND = ["/assets/pglite-DgipwPsY.wasm","/assets/initdb-DwLcS450.wasm","/assets/pglite-n8RDJ3Sw.data","/assets/postgres-worker-BLLzAq31.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('sql-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  // Built files have hashed names, so a URL match is enough. Servers that send
  // Vary: Origin would otherwise make every lookup miss.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true, ignoreVary: true }).then((hit) => {
      if (hit) return hit;
      const path = new URL(event.request.url).pathname;
      if (!ON_DEMAND.some((file) => path.endsWith(file))) return fetch(event.request);
      return fetch(event.request).then((response) => {
        if (response.ok) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
        return response;
      });
    }),
  );
});
