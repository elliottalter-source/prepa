// Fait marcher l'appli hors ligne (métro, mode avion)
const CACHE = "prepa-v1";
const SHELL = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const own = u.origin === location.origin;
  const lib = /^(www\.gstatic\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname);
  if (!own && !lib) return; // Firestore et Auth passent directement
  const put = res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); return res; };
  if (own) {
    // Réseau d'abord pour avoir la dernière version, cache si hors ligne
    e.respondWith(fetch(r).then(put).catch(() => caches.match(r).then(m => m || caches.match("./index.html"))));
  } else {
    // Librairies et polices : cache d'abord
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(put)));
  }
});
