/**
 * Sentinel Connect service worker.
 *
 * Strategy is chosen per request type because agents work through dead zones:
 *   - navigations  → network-first, falling back to the cached app shell so the
 *                    PWA still opens with no signal.
 *   - static assets → cache-first (hashed filenames make them immutable).
 *   - web fonts     → cache-first, opaque responses included.
 *   - API calls     → never cached; the app's own IndexedDB outbox owns
 *                     offline writes, and stale reads would mislead the agent.
 */

const VERSION = "v1";
const SHELL_CACHE = `sentinel-shell-${VERSION}`;
const ASSET_CACHE = `sentinel-assets-${VERSION}`;

const SHELL_URLS = ["/", "/manifest.webmanifest", "/favicon.svg", "/icon-192.png"];

const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

/**
 * Caches the shell plus the hashed bundles it references.
 *
 * The build's filenames aren't known here, and the page's own asset requests
 * happen before this worker controls the page — so without discovering them
 * from the shell HTML at install time, an offline reload would serve
 * index.html against bundles that were never cached and boot to a blank screen.
 */
async function precache() {
  const shell = await caches.open(SHELL_CACHE);
  await Promise.allSettled(SHELL_URLS.map((url) => shell.add(url)));

  const response = await fetch("/index.html", { cache: "no-cache" });
  const html = await response.text();
  await shell.put(
    "/index.html",
    new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
  );

  const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
  if (urls.length === 0) return;

  const assets = await caches.open(ASSET_CACHE);
  await Promise.allSettled(urls.map((url) => assets.add(url)));
}

self.addEventListener("install", (event) => {
  // Never let a caching hiccup block activation — the app works online either way.
  event.waitUntil(precache().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Fonts are cross-origin and opaque; cache them so text renders offline.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE, { allowOpaque: true }));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Live data only — the outbox handles writes made while offline.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(SHELL_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() =>
          caches
            .match("/index.html", { ignoreVary: true })
            .then((cached) => cached ?? new Response("Offline", { status: 503 })),
        ),
    );
    return;
  }

  if (["script", "style", "image", "font"].includes(request.destination)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  }
});

async function cacheFirst(request, cacheName, { allowOpaque = false } = {}) {
  // ignoreVary matters: entries are stored by URL at install time, while the
  // page's own request for the same file carries an Origin header (module
  // scripts are fetched with crossorigin). Honouring Vary would miss on that
  // difference and fall through to the network — which is exactly what isn't
  // there when an agent opens the app offline.
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;

  const response = await fetch(request);
  const storable = allowOpaque ? response.ok || response.type === "opaque" : response.ok;

  if (storable) {
    const copy = response.clone();
    void caches.open(cacheName).then((cache) => cache.put(request, copy));
  }

  return response;
}
