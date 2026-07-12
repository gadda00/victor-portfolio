/* ===================================================================
 * Service Worker — victorndunda.com
 * -------------------------------------------------------------------
 * Caches the site shell for offline use. Uses a stale-while-revalidate
 * strategy for same-origin GET requests. Skips non-GET, third-party,
 * and Google OAuth requests.
 *
 * Install: pre-caches the shell.
 * Activate: cleans up old cache versions.
 * Fetch: serves from cache, falls back to network, updates cache in background.
 * =================================================================== */

const CACHE_VERSION = 'vnd-v4.0.0';
const SHELL_CACHE = `shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

// Resources to pre-cache on install (the "app shell")
// NOTE: Dashboard files are NOT pre-cached — they change frequently and
// should always be fetched from network first to avoid stale UI.
const SHELL_URLS = [
  '/',
  '/index.html',
  '/404.html',
  '/styles.css',
  '/app.js',
  '/i18n.js',
  '/enhancements.js',
  '/feed.xml',
  '/feed.xsl',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon-16.png',
  '/apple-touch-icon.png',
  '/manifest.webmanifest',
  '/og-image.png',
  '/logo.svg',
];

// Never cache these (would break OAuth + live job data + dashboard freshness)
const NEVER_CACHE = [
  '/admin/',
  '/dashboard/',
  '/jobs/',
  '/book/',
  'accounts.google.com',
  'api.linkedin.com',
  'api.twitter.com',
  'arbeitnow.com',
  'remoteok.com',
  'cdnjs.cloudflare.com',
];

// ─── Install: pre-cache the shell ──────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_URLS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] install failed:', err))
  );
});

// ─── Activate: clean up old caches ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: stale-while-revalidate for same-origin GETs ────────
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Skip non-http(s)
  if (!url.protocol.startsWith('http')) return;

  // Skip never-cache URLs
  if (NEVER_CACHE.some(n => url.href.includes(n))) return;

  // For navigation requests, try network-first (so user gets fresh content),
  // fall back to cached page if offline. Only fall back to /index.html for root.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          // Cache the latest navigation response
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
          }
          return resp;
        })
        .catch(() => {
          // Try exact cache match first
          return caches.match(req).then(r => {
            if (r) return r;
            // Only fall back to /index.html for root path requests
            const url = new URL(req.url);
            if (url.pathname === '/' || url.pathname === '/index.html') {
              return caches.match('/index.html');
            }
            // For other paths, return a simple offline message
            return new Response(
              '<!DOCTYPE html><html><head><title>Offline</title></head><body style="font-family:sans-serif;text-align:center;padding:3rem"><h1>You are offline</h1><p>This page is not cached. Please reconnect to view it.</p><a href="/" style="color:#00d4ff">Go to Home</a></body></html>',
              { headers: { 'Content-Type': 'text/html' }, status: 503 }
            );
          });
        })
    );
    return;
  }

  // For same-origin GET requests: stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req)
          .then(resp => {
            // Only cache successful responses
            if (resp && resp.status === 200) {
              const copy = resp.clone();
              caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
            }
            return resp;
          })
          .catch(() => cached); // offline + cache miss → fail
        return cached || fetchPromise;
      })
    );
    return;
  }

  // For cross-origin GET (fonts, etc.): cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      if (resp && resp.status === 200) {
        const copy = resp.clone();
        caches.open(RUNTIME_CACHE).then(c => c.put(req, copy));
      }
      return resp;
    }))
  );
});

// ─── Message handler: allow page to trigger skipWaiting ────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
