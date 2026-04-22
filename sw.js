const CACHE_NAME = "sanegestao-pro-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./tailwind.css",
  "./sw.js",
  "./vendor/leaflet/leaflet.css",
  "./vendor/leaflet/leaflet.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled(
        APP_SHELL.map(async (asset) => {
          await cache.add(asset);
        })
      );
      results.forEach((res, idx) => {
        if (res.status === "rejected") {
          console.warn("SW cache falhou para:", APP_SHELL[idx], res.reason);
        }
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((networkRes) => {
          const cloned = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return networkRes;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
