/* Offline-fähig: App-Dateien werden gecacht. Bei neuer Version CACHE hochzählen. */
const CACHE = "mathe-kaetzchen-v1";
const ASSETS = ["./", "./index.html", "./style.css", "./manifest.json",
  "./js/cats.js", "./js/visuals.js", "./js/ai.js", "./js/store.js", "./js/generators.js", "./js/app.js",
  "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Eigene Dateien: Netz zuerst (Updates kommen sofort), offline aus dem Cache. Fremde Server (KI, Schrift) nicht anfassen.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request)
    .then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html"))));
});
