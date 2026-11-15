
const CACHE_NAME = "arkan-app-v4";
const IMAGE_CACHE = "arkan-images-v2";

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

const SUPABASE_HOST = "pwjntufyeydlbzolmgsi.supabase.co";

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.allSettled(
        APP_FILES.map(file => cache.add(file))
      );

      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith("arkan-app-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // تخزين صور أركان العامة من Supabase
  const isSupabaseImage =
    url.hostname === SUPABASE_HOST &&
    url.pathname.includes(
      "/storage/v1/object/public/site-media/"
    );

  if (isSupabaseImage) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE);

        const cached = await cache.match(request);

        if (cached) {
          return cached;
        }

        try {
          const response = await fetch(request);

          if (
            response.ok ||
            response.type === "opaque"
          ) {
            try {
              await cache.put(
                request,
                response.clone()
              );
            } catch (error) {
              console.error("Image cache error:", error);
            }
          }

          return response;

        } catch (error) {
          return new Response("", {
            status: 503,
            statusText: "Image unavailable offline"
          });
        }
      })()
    );

    return;
  }

  // تجاهل الطلبات الخارجية الأخرى
  if (url.origin !== self.location.origin) return;

  // صفحات التطبيق
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }

          return response;

        } catch (error) {
          const cached = await caches.match(request);

          if (cached) return cached;

          const booking = await caches.match("./booking.html");

          if (booking) return booking;

          const home = await caches.match("./index.html");

          if (home) return home;

          return new Response(
            "التطبيق غير متاح دون اتصال. افتحه مرة واحدة مع الإنترنت أولاً.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );
        }
      })()
    );

    return;
  }

  // ملفات التطبيق المحلية
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      const cached = await cache.match(request);

      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok) {
          await cache.put(request, response.clone());
        }

        return response;

      } catch (error) {
        return new Response("", { status: 503 });
      }
    })()
  );
});
