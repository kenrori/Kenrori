/* Kenrori service worker: cài như ứng dụng và đọc lại chương đã mở khi mất mạng. */
const SHELL = "kenrori-shell-v3", READ = "kenrori-read-v1", MAX_READ = 400;
const SHELL_FILES = ["./", "./index.html", "./css/site.css", "./js/app.js", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./fonts/beaufort-medium.woff", "./fonts/beaufort-bold.woff"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("kenrori-") && k !== SHELL && k !== READ).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim() {
  const c = await caches.open(READ), ks = await c.keys();
  for (let i = 0; i < ks.length - MAX_READ; i++) await c.delete(ks[i]);
}
// Trang và dữ liệu: lấy bản mới trên mạng trước, mất mạng thì dùng bản đã lưu.
async function networkFirst(req, key, fallback) {
  const c = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) await c.put(key, res.clone());
    return res;
  } catch (e) {
    return (await c.match(key, { ignoreSearch: true })) || (fallback && (await c.match(fallback))) || Response.error();
  }
}
// Chương và ảnh: hiện ngay bản đã lưu, đồng thời tải bản mới ở nền.
async function staleWhileRevalidate(e) {
  const c = await caches.open(READ), hit = await c.match(e.request);
  const net = fetch(e.request).then(async res => {
    if (res.ok || res.type === "opaque") { await c.put(e.request, res.clone()); trim() }
    return res;
  }).catch(() => hit || Response.error());
  if (hit) { e.waitUntil(net); return hit }
  return net;
}

self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (/admin\.html$/.test(u.pathname) || /\/(js\/(admin|emotes)|css\/admin)/.test(u.pathname) || u.pathname.includes("/truyen/")) return;
    // Code và giao diện: lấy bản mới trước, mất mạng thì dùng bản đã lưu
    if (/\.(js|css)$/.test(u.pathname)) { e.respondWith(networkFirst(r, u.origin + u.pathname)); return }
    if (r.mode === "navigate") { e.respondWith(networkFirst(r, u.origin + u.pathname, "./index.html")); return }
    if (/\/(data|glossary)\.json$/.test(u.pathname)) { e.respondWith(networkFirst(r, u.origin + u.pathname)); return }
    if (/\.(txt|jpe?g|png|webp|gif|avif|vtt|woff2?)$/i.test(u.pathname)) { e.respondWith(staleWhileRevalidate(e)); return }
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || u.hostname === "i.ytimg.com") e.respondWith(staleWhileRevalidate(e));
});
