const CACHE_NAME = "arkan-app-v3";
const APP_FILES = [
  "./",
  "./index.html",
  "./booking.html",
  "./manifest.webmanifest",
  "./config.js",
  "./arkan-logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith("arkan-app-") &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

if (request.method !== "GET") {
  return;
}

const requestURL = new URL(request.url);

const isSupabaseImage =
  requestURL.hostname.endsWith(".supabase.co") &&
  requestURL.pathname.includes("/storage/v1/object/public/site-media/");

if (isSupabaseImage) {
  event.respondWith(
    caches.open("arkan-images-v1").then(async cache => {
      const cached = await cache.match(request);

      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);

   if (response.ok || response.type === "opaque") {
  await cache.put(request, response.clone());
}

        return response;
      } catch (error) {
        return new Response("", {
          status: 503,
          statusText: "Image unavailable offline"
        });
      }
    })
  );

  return;
}

if (requestURL.origin !== self.location.origin) {
  return;
}

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match(request) ||
            await caches.match("./index.html")
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
