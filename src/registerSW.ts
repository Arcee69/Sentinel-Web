/**
 * Registers the offline service worker.
 *
 * Skipped in dev, where Vite serves modules that the cache-first strategy would
 * happily serve stale.
 */
export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Pick up a new build without waiting for every tab to close.
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;

          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(() => {
        // Offline support is an enhancement — never block startup on it.
      });
  });
}
