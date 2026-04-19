const CACHE_NAME = "local-video-player-shell-v19";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=20260419f",
  "./boot.js?v=20260419h",
  "./app.js?v=20260419h",
  "./manifest.webmanifest",
  "./vendor/fontawesome/css/all.min.css?v=1",
  "./vendor/fontawesome/webfonts/fa-solid-900.woff2",
  "./vendor/fontawesome/webfonts/fa-regular-400.woff2",
  "./vendor/fontawesome/webfonts/fa-brands-400.woff2",
  "./vendor/plyr/plyr.css?v=1",
  "./vendor/plyr/plyr.min.js?v=1"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isDocumentRequest = event.request.mode === "navigate" || event.request.destination === "document";

  if (isDocumentRequest) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", clone));
        return response;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
