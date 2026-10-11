"use strict";

const CACHE_NAME = "mono-serpent-v2.0.1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./game.js",
  "./locales.js",
  "./manifest.webmanifest",
  "./icons/mono-serpent.svg",
  "./icons/mono-serpent-192.png",
  "./icons/mono-serpent-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES.map((file) => new URL(file, self.registration.scope))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith("mono-serpent-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request)
      .then((response) => {
        if (!response.ok) return response;
        return caches.open(CACHE_NAME)
          .then((cache) => cache.put(request, response.clone()))
          .then(() => response);
      })
      .catch(async () => (await caches.match(request)) || caches.match(new URL("./index.html", self.registration.scope))));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (!response.ok) return response;
    return caches.open(CACHE_NAME)
      .then((cache) => cache.put(request, response.clone()))
      .then(() => response);
  })));
});
