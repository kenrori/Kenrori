/* Kenrori: trang quản trị */
const $ = s => document.querySelector(s), esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) {} }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} }, del: k => { try { localStorage.removeItem(k) } catch (e) {} } };
const KEYS = { novel: "novels", manga: "manga" }, log = m => { const el = $("#log"), ok = /^✅/.test(m), er = /^❌/.test(m); el.textContent = String(m).replace(/^(✅|❌)\s*/, ""); el.className = ok ? "ok" : er ? "err" : ""; clearTimeout(log.t); log.t = setTimeout(() => el.classList.add("fade"), ok ? 4000 : er ? 9000 : 6000) };
const slugify = x => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const b64t = t => { const b = new TextEncoder().encode(String(t).normalize("NFC")); let s = ""; for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(s) };
const t64 = b => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\n/g, "")), c => c.charCodeAt(0)));
const fileB64 = f => new Promise(r => { const x = new FileReader(); x.onload = () => r(x.result.split(",")[1]); x.readAsDataURL(f) });
const resize = (f, w = 600) => new Promise(r => { const im = new Image(); im.onload = () => { const k = Math.min(1, w / im.width), c = document.createElement("canvas"); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); r(c.toDataURL("image/jpeg", .85).split(",")[1]) }; im.src = URL.createObjectURL(f) });
const rid = () => Date.now().toString(36);
let cfg = {}, data = null;

const api = (p, o = {}) => fetch(`https://api.github.com/repos/${cfg.u}/${cfg.r}/contents/${p}` + (o.q ? o.q + "&_=" + Date.now() : ""), { method: o.m || "GET", cache: "no-store", headers: { Authorization: "Bearer " + cfg.t, Accept: "application/vnd.github+json" }, body: o.body && JSON.stringify(o.body) });
/* ===== Gom nhiều file vào một lần lưu (một commit), web cập nhật nhanh hơn ===== */
let STAGE = null, RUND = 0, NOJ = false, WATCH = null;
const ghx = async (path, o = {}) => { const r = await fetch(`https://api.github.com/repos/${cfg.u}/${cfg.r}/${path}`, { method: o.m || "GET", cache: "no-store", headers: { Authorization: "Bearer " + cfg.t, Accept: "application/vnd.github+json" }, body: o.body && JSON.stringify(o.body) }); const j = await r.json().catch(() => ({})); if (!r.ok) { const e = new Error(j.message || "GitHub báo lỗi " + r.status); e.st = r.status; throw e } return j };
async function flush(msg) {
  if (!STAGE || !STAGE.length) return; const m = new Map(); STAGE.splice(0).forEach(f => m.set(f.path, f)); const L = [...m.values()];
  if (!NOJ) { try { const g = await api(".nojekyll", { q: "?ref=" + cfg.b }); NOJ = true; if (g.status === 404) L.push({ path: ".nojekyll", b64: "" }) } catch (e) {} }
  let tree;
  try {
    tree = new Array(L.length); let k = 0, done = 0; const worker = async () => { while (k < L.length) { const i = k++; const b = await ghx("git/blobs", { m: "POST", body: { content: L[i].b64, encoding: "base64" } }); tree[i] = { path: L[i].path, mode: "100644", type: "blob", sha: b.sha }; done++; if (L.length > 3) log(`Đang lưu ${done}/${L.length} file lên GitHub...`) } };
    await Promise.all(Array.from({ length: Math.min(4, L.length) }, worker));
  } catch (e) { for (const f of L) await putNow(f.path, f.b64, f.msg || msg); return } // dự phòng: lưu từng file như cũ
  for (let t = 0; t < 4; t++) {
    const ref = await ghx(`git/ref/heads/${encodeURIComponent(cfg.b)}`), base = ref.object.sha, bc = await ghx(`git/commits/${base}`);
    const tr = await ghx("git/trees", { m: "POST", body: { base_tree: bc.tree.sha, tree } }), c = await ghx("git/commits", { m: "POST", body: { message: msg || L[0].msg || "Cập nhật", tree: tr.sha, parents: [base] } });
    try { await ghx(`git/refs/heads/${encodeURIComponent(cfg.b)}`, { m: "PATCH", body: { sha: c.sha, force: false } }); return } catch (e) { if (e.st !== 422 || t === 3) throw e; await new Promise(z => setTimeout(z, 600)) }
  }
}
async function put(path, content, msg) { if (STAGE) { STAGE.push({ path, b64: content, msg }); return } return putNow(path, content, msg) }
/* Theo dõi đến khi người đọc thấy bản mới */
function watchLive(rev) {
  clearInterval(WATCH); const t0 = Date.now(), chip = $("#livechip"); chip.hidden = false; chip.className = "lc wait"; chip.textContent = "Đang đưa lên web...";
  const url = siteBase() + "data.json";
  WATCH = setInterval(async () => {
    const s = Math.round((Date.now() - t0) / 1000); chip.textContent = `Đang đưa lên web... ${s}s`;
    try { const r = await fetch(url + "?v=" + Date.now(), { cache: "no-store" }); if (r.ok && (await r.json()).rev >= rev) { clearInterval(WATCH); chip.className = "lc ok"; chip.textContent = `Web đã cập nhật (${s}s)`; log(`✅ Người đọc đã thấy thay đổi trên web (sau ${s} giây).`); setTimeout(() => { if (chip.className === "lc ok") chip.hidden = true }, 15000) } } catch (e) {}
    if (s > 300) { clearInterval(WATCH); chip.className = "lc"; chip.textContent = "Web cập nhật chậm, hãy kiểm tra lại sau" }
  }, 4000);
}
async function putNow(path, content, msg) {
  for (let t = 0; t < 3; t++) {
    let sha; const g = await api(path, { q: "?ref=" + cfg.b });
    if (g.ok) sha = (await g.json()).sha; else if (g.status !== 404) throw new Error("Không đọc được " + path + " (" + g.status + ")");
    const r = await api(path, { m: "PUT", body: { message: msg, content, branch: cfg.b, sha } });
    if (r.ok) return;
    const j = await r.json().catch(() => ({}));
    if (r.status === 409 && t < 2) { await new Promise(res => setTimeout(res, 800)); continue }
    throw new Error(j.message || "Lỗi " + r.status);
  }
}
const siteBase = () => { const S = data.site || {}; let b = (S.url || "").trim(); if (!b) b = cfg.r.toLowerCase() === (cfg.u + ".github.io").toLowerCase() ? `https://${cfg.u}.github.io/` : `https://${cfg.u}.github.io/${cfg.r}/`; return b.endsWith("/") ? b : b + "/" };
const shPath = (k, s) => `truyen/${k === "manga" ? "manga-" : ""}${s.slug}.html`;
const hx = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function shareHtml(k, s) {
  const base = siteBase(), self = base + shPath(k, s), target = `../index.html#${k}/${s.slug}`, img = s.cover ? (/^https?:/.test(s.cover) ? s.cover : base + s.cover) : "";
  const fmt = k === "manga" ? "Manga" : s.format || "Light Novel", d = (s.desc || "").replace(/\s+/g, " ").trim(), D = d.length > 200 ? d.slice(0, 197) + "..." : d;
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${hx(s.title)} (${fmt}) | Kenrori</title><meta name="description" content="${hx(D)}"><link rel="canonical" href="${hx(self)}">
<meta property="og:type" content="book"><meta property="og:site_name" content="Kenrori"><meta property="og:locale" content="vi_VN">
<meta property="og:title" content="${hx(s.title)}"><meta property="og:description" content="${hx(D)}"><meta property="og:url" content="${hx(self)}">${img ? `\n<meta property="og:image" content="${hx(img)}"><meta name="twitter:image" content="${hx(img)}">` : ""}
<meta name="twitter:card" content="${img ? "summary_large_image" : "summary"}"><meta name="theme-color" content="#ff00ff">
<script>location.replace(${JSON.stringify(target).replace(/</g, "\\u003c")})<\/script>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.6;color:#121316}img{width:180px;border-radius:6px}a{color:#ff00ff;font-weight:700}</style></head>
<body>${img ? `<img src="${hx(img)}" alt="Bìa ${hx(s.title)}">` : ""}<h1>${hx(s.title)}</h1>${s.orig ? `<p>${hx(s.orig)}</p>` : ""}<p>${fmt}${s.author ? `, tác giả ${hx(s.author)}` : ""}</p><p>${hx(D)}</p><p><a href="${hx(target)}">Đọc trên Kenrori</a></p></body></html>`;
}
const sitemapXml = () => { const b = siteBase(), u = [b + "index.html", ...["novel", "manga"].flatMap(k => data[KEYS[k]].map(s => b + shPath(k, s)))]; return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${u.map(x => `<url><loc>${hx(x)}</loc></url>`).join("")}</urlset>` };
async function writeShare(k, s) { await put(shPath(k, s), b64t(shareHtml(k, s)), "Trang chia sẻ: " + s.title); await put("sitemap.xml", b64t(sitemapXml()), "Cập nhật sitemap") }
async function writeAllShare() { const L = ["novel", "manga"].flatMap(k => data[KEYS[k]].map(s => [k, s])); for (let i = 0; i < L.length; i++) { log(`Đang tạo trang chia sẻ ${i + 1}/${L.length}...`); await put(shPath(...L[i]), b64t(shareHtml(...L[i])), "Trang chia sẻ: " + L[i][1].title) } await put("sitemap.xml", b64t(sitemapXml()), "Cập nhật sitemap"); return L.length }
const feedXml = () => {
  const S = data.site || {}; let base = (S.url || "").trim();
  if (!base) base = cfg.r.toLowerCase() === (cfg.u + ".github.io").toLowerCase() ? `https://${cfg.u}.github.io/` : `https://${cfg.u}.github.io/${cfg.r}/`;
  if (!base.endsWith("/")) base += "/";
  const x = t => String(t ?? "").replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]));
  const items = []; for (const k of ["novel", "manga"]) data[KEYS[k]].forEach(s => s.chapters.forEach((c, i) => items.push({ k, s, c, i })));
  items.sort((p, q) => (q.c.date || "").localeCompare(p.c.date || "") || q.i - p.i);
  const it = items.slice(0, 30).map(({ k, s, c, i }) => `<item><title>${x(s.title)} – ${x((c.vol ? c.vol + " · " : "") + c.t)}</title><link>${x(base + "#" + k + "/" + s.slug + "/" + i)}</link><guid isPermaLink="false">${x(k + ":" + s.slug + ":" + (c.file || (c.pages && c.pages[0]) || c.t))}</guid>${c.date ? `<pubDate>${new Date(c.date + "T00:00:00Z").toUTCString()}</pubDate>` : ""}</item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Kenrori</title><link>${x(base)}</link><description>Chương mới cập nhật</description><language>vi</language>${it}</channel></rss>`;
};
/* Viết hoa chữ cái đầu mỗi chữ trong tên truyện và tên chương (khi bật "Cách hiện tên"). Chạy mỗi lần lưu. */
const tcap = t => typeof t === "string" ? t.split(/(\s+)/).map(w => w.replace(/^([^\p{L}\p{N}]*)(\p{Ll})/u, (m, a, b) => a + b.toLocaleUpperCase("vi"))).join("") : t;
function tcapAll() { let n = 0; for (const k of Object.values(KEYS)) for (const s of data[k] || []) { const t = tcap(s.title); if (t !== s.title) { s.title = t; n++ } for (const c of s.chapters || []) { const u = tcap(c.t); if (u !== c.t) { c.t = u; n++ } } } return n }
async function save(msg) {
  if (data.site && data.site.tcap !== false) tcapAll();
  data.rev = Date.now(); const own = !STAGE; if (own) STAGE = [];
  try {
    await put("data.json", b64t(JSON.stringify(data, null, 1)), msg);
    try { await put("feed.xml", b64t(feedXml()), "Cập nhật RSS") } catch (e) { log("Đã lưu, nhưng chưa cập nhật được RSS: " + e.message) }
    await flush(msg);
  } finally { if (own) STAGE = null }
  watchLive(data.rev);
}
async function run(fn) {
  const bs = [...document.querySelectorAll("button")]; bs.forEach(b => b.disabled = true); if (!RUND++) STAGE = [];
  try { await fn(); if (RUND === 1 && STAGE && STAGE.length) await flush("Cập nhật") } catch (e) { log("❌ " + e.message) }
  finally { if (!--RUND) STAGE = null; bs.forEach(b => b.disabled = false) }
}
const done = m => { log(m); fillSel(); manage() };

const needHttps = () => { if (!window.crypto?.subtle) throw new Error("Cần mở bằng địa chỉ https (GitHub Pages) để dùng đăng nhập bảo mật.") };
const enc = new TextEncoder(), toB = u => btoa(String.fromCharCode(...u)), fromB = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function pkey(pin, salt) { const k = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]); return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" }, k, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]) }
async function seal(pin, text) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await pkey(pin, salt), enc.encode(text))); return { salt: toB(salt), iv: toB(iv), ct: toB(ct) } }
async function unseal(pin, o) { return new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB(o.iv) }, await pkey(pin, fromB(o.salt)), fromB(o.ct))) }
async function connect(c, after) {
  cfg = c;
  await run(async () => {
    log("Đang kết nối...");
    const rp = await fetch(`https://api.github.com/repos/${cfg.u}/${cfg.r}`, { headers: { Authorization: "Bearer " + cfg.t } });
    if (!rp.ok) throw new Error("Không vào được repo (" + rp.status + "). Kiểm tra tên người dùng, tên repo và token.");
    const r = await api("data.json", { q: "?ref=" + cfg.b });
    if (r.status === 404) data = {}; else if (r.ok) data = JSON.parse(t64((await r.json()).content)); else throw new Error("Không đọc được data.json (" + r.status + ")");
    for (const k of ["tips", "links", "novels", "manga", "videos", "projects"]) data[k] ??= []; data.site ??= {};
    if (after) await after();
    $("#login").hidden = $("#setup").hidden = true; $("#bye").hidden = false; $("#app").hidden = false; $("#gate").hidden = true; $("#c_date").value = $("#j_date").value = $("#t_date").value = new Date().toISOString().slice(0, 10);
    fillSel(); manage(); siteLoad(); trLoadKey(); glLoad(); log("✅ Đã đăng nhập. Chọn mục cần thêm."); deepLink();
  });
}
let sealed = null; try { sealed = JSON.parse(ls.get("cfg2") || "null") } catch (e) {}
const oldCfg = ls.get("cfg"); if (oldCfg) { try { const c = JSON.parse(oldCfg); $("#g_u").value = c.u; $("#g_r").value = c.r; $("#g_b").value = c.b; $("#g_t").value = c.t } catch (e) {} ls.del("cfg") }
if (sealed) { $("#login").hidden = false; $("#setup").hidden = true; $("#g_u").value = sealed.u; $("#g_r").value = sealed.r; $("#g_b").value = sealed.b; log("Nhập mã PIN để đăng nhập.") }
$("#l_go").onclick = async () => {
  try { needHttps(); let t; try { t = await unseal($("#l_pin").value, sealed) } catch (e) { throw new Error("Sai mã PIN") } sessionPin = $("#l_pin").value; await connect({ u: sealed.u, r: sealed.r, b: sealed.b, t }) } catch (e) { log("❌ " + e.message) }
};
$("#l_pin").addEventListener("keydown", e => { if (e.key === "Enter") $("#l_go").click() });
$("#l_new").onclick = () => { $("#login").hidden = true; $("#setup").hidden = false; $("#setup").open = true; log("Nhập lại thông tin và đặt PIN mới.") };
$("#g_go").onclick = async () => {
  try {
    needHttps(); const c = { u: $("#g_u").value.trim(), r: $("#g_r").value.trim(), b: $("#g_b").value.trim() || "main", t: $("#g_t").value.trim() }, pin = $("#g_p").value;
    if (!c.u || !c.r || !c.t) throw new Error("Hãy điền đủ tên người dùng, repo và token"); if (pin.length < 6) throw new Error("PIN cần ít nhất 6 ký tự");
    sessionPin = pin; await connect(c, async () => { ls.set("cfg2", JSON.stringify({ u: c.u, r: c.r, b: c.b, ...await seal(pin, c.t) })) });
  } catch (e) { log("❌ " + e.message) }
};
$("#l_out").onclick = () => location.reload();

const NI = {
  game: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>', genre: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  ws: '<path d="M4 19V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v14M9 19V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v11M14.5 7.5l2.9-.8a1 1 0 0 1 1.2.7l2.9 10.7M3 19h18"/>',
  dash: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  series: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5zM20 19v3H6"/>', chap: '<path d="M12 5v14M5 12h14"/>',
  imp: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M12 18v-6M9 15l3 3 3-3"/>',
  tr: '<path d="M4 5h8M8 3v2M10 5c-1 4-3.5 7-6 8.5M6 9c1 2 3 3.5 5 4.5M13 21l4-9 4 9M14.5 18h5"/>', proj: '<path d="M10 3H5a2 2 0 0 0-2 2v5h3a2 2 0 1 1 0 4H3v5a2 2 0 0 0 2 2h5v-3a2 2 0 1 1 4 0v3h5a2 2 0 0 0 2-2v-5h-3a2 2 0 1 1 0-4h3V5a2 2 0 0 0-2-2h-5v3a2 2 0 1 1-4 0z"/>',
  tip: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>', link: '<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>',
  vid: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>', site: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  man: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const TABS = [["dash", "Tổng quan"], ["—", "Truyện"], ["ws", "Bộ truyện"], ["genre", "Thể loại"], ["—", "Game và công cụ"], ["proj", "Dự án"], ["tip", "Mẹo game"], ["—", "Khác"], ["link", "Liên kết"], ["vid", "Video"], ["—", "Hệ thống"], ["game", "Tu luyện"], ["site", "Cài đặt trang web"], ["man", "Quản lý"]];
const PT = { edit: "Sửa chương", vol: "Tập và bìa tập", series: "Bộ truyện", chap: "Thêm chương", tr: "Dịch chương", imp: "Nhập từ file" };
/* Các trang chỉ mở được từ bên trong một bộ (không có trên menu) */
const HID = ["series", "chap", "tr", "imp"];
$("#tabs").innerHTML = TABS.map(([k, l]) => k === "—" ? `<div class="tg">${l}</div>` : `<button type="button" data-k="${k}"><svg class="i" viewBox="0 0 24 24">${NI[k]}</svg>${l}</button>`).join("");
const tab = k => { if (k !== "ws") wsPark(); $("#retbar").hidden = !(RET === "ws" && k !== "ws" && WS.k); if (!$("#retbar").hidden) $("#ret_go span").textContent = data[WS.k]?.[WS.i]?.title || ""; document.querySelector("main").classList.toggle("wide", ["tr", "dash", "game", "genre"].includes(k)); $("#ptitle").textContent = PT[k] || (TABS.find(x => x[0] === k) || [])[1] || ""; scrollTo(0, 0); [...TABS.map(x => x[0]).filter(x => x !== "—"), "edit", "vol", ...HID].forEach(t => $("#p-" + t).classList.toggle("on", t === k)); document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.k === (HID.includes(k) ? "ws" : k))); if ($("#p-chap").classList.contains("inws")) $("#p-chap").classList.add("on") };
let RET = null; const WS = { k: null, i: -1, W: null, dirty: false, f: "all", open: null, last: null };
$("#tabs").onclick = e => { const b = e.target.closest("button[data-k]"); if (!b) return; if (WS.dirty && !confirm("Bỏ các thay đổi chưa lưu ở trang Bộ truyện?")) return; WS.dirty = false; RET = null; tab(b.dataset.k); if (b.dataset.k === "ws") wsHome() }; tab("dash");

function fillSel() {
  const o = []; for (const k of ["novel", "manga"]) data[KEYS[k]].forEach((s, i) => o.push(`<option value="${k}|${i}">${k === "novel" ? "📖" : "🖼️"} ${esc(s.title)}</option>`));
  const cur = $("#c_ser").value; $("#c_ser").innerHTML = o.join("") || "<option value=''>(chưa có bộ nào)</option>"; if (cur && o.some(x => x.includes(`value="${cur}"`))) $("#c_ser").value = cur; chapUI(); gChips(); trFill(); impFill();
}
const cType = () => (document.querySelector('input[name="c_type"]:checked') || {}).value || "text";
function chapUI() { const k = $("#c_ser").value.split("|")[0], img = k === "novel" && cType() === "img"; $("#c_typew").hidden = k !== "novel"; $("#c_novel").hidden = k !== "novel" || img; $("#c_manga").hidden = !(k === "manga" || img); $("#c_firstw").hidden = !img; $("#c_imgl").textContent = img ? "Ảnh minh họa" : "Ảnh các trang"; $("#c_title").placeholder = img ? "Minh họa" : "Chương 12: ..."; volList() }
document.querySelectorAll('input[name="c_type"]').forEach(r => r.addEventListener("change", chapUI));
function volList() {
  const [k, i] = $("#c_ser").value.split("|"), s = data[KEYS[k]]?.[i], vs = [...new Set((s?.chapters || []).map(c => (c.vol || "").trim()).filter(Boolean))];
  $("#c_vols").innerHTML = vs.map(v => `<option value="${esc(v)}">`).join(""); $("#c_vol").value = vs.length ? (s.chapters[s.chapters.length - 1].vol || "") : "";
}
$("#c_ser").onchange = chapUI;

$("#p-series").onsubmit = e => { e.preventDefault(); run(async () => {
  const fmt = $("#s_kind").value, kind = fmt === "webnovel" ? "novel" : fmt, title = $("#s_title").value.trim(), src = $("#s_src").value.trim(); if (src && !/^https?:\/\//.test(src)) throw new Error("Link tác phẩm gốc phải bắt đầu bằng https://"); if (!title) throw new Error("Hãy nhập tên truyện");
  const slug = slugify($("#s_slug").value || title), list = data[KEYS[kind]]; let s = list.find(x => x.slug === slug);
  if (!s) { s = { slug, chapters: [] }; list.push(s) }
  Object.assign(s, { title, orig: $("#s_orig").value.trim(), alts: $("#s_alts").value.split("\n").map(x => x.trim()).filter(Boolean), artist: $("#s_artist").value.trim(), author: $("#s_author").value.trim(), country: $("#s_country").value, age: $("#s_age").value, status: $("#s_status").value, genres: $("#s_genres").value.split(",").map(x => x.trim()).filter(Boolean), desc: $("#s_desc").value.trim(), src, team: $("#s_team").value.split("\n").map(l => { const [r, ...n] = l.split("|"); return n.length ? { r: r.trim(), n: n.join("|").trim() } : { r: "", n: r.trim() } }).filter(t => t.n), prog: $("#s_prog").value.trim(), sched: $("#s_sched").value.trim() }); if ($("#s_feat").checked) s.feat = true; else delete s.feat; if (kind === "novel") s.format = fmt === "webnovel" ? "Web Novel" : "Light Novel";
  const f = $("#s_cover").files[0];
  if (f) { log("Đang tải ảnh bìa..."); const p = `images/${slug}-bia.jpg`; await put(p, await resize(f), "Bìa: " + title); s.cover = p }
  await save("Thêm/sửa truyện: " + title);
  try { log("Đang tạo trang chia sẻ..."); await writeShare(kind, s) } catch (e) { done("✅ Đã lưu bộ truyện, nhưng chưa tạo được trang chia sẻ: " + e.message); return }
  done("✅ Đã lưu bộ truyện. Web cập nhật sau 1–2 phút.");
  if (RET === "ws") { WS.k = KEYS[kind]; WS.i = list.indexOf(s); goRet() }
}) };

$("#p-chap").onsubmit = e => { e.preventDefault(); run(async () => {
  const [kind, i] = $("#c_ser").value.split("|"), s = data[KEYS[kind]]?.[i]; if (!s) throw new Error("Hãy tạo/chọn bộ truyện trước");
  const img = kind === "novel" && cType() === "img", t = $("#c_title").value.trim() || (img ? "Minh họa" : ""); if (!t) throw new Error("Hãy nhập tên chương");
  const id = `c${s.chapters.length + 1}_${rid()}`, ch = { t, date: $("#c_date").value }; if ($("#c_vol").value.trim()) ch.vol = $("#c_vol").value.trim();
  if (kind === "novel" && !img) {
    let text = $("#c_text").value; const f = $("#c_file").files[0]; if (!text.trim() && f) text = await f.text();
    if (!text.trim()) throw new Error("Hãy dán nội dung hoặc chọn file .txt");
    const p = `novels/${s.slug}/${id}.txt`; log("Đang tải chương..."); await put(p, b64t(text), "Chương: " + t); ch.file = p; ch.words = trWords(text);
  } else {
    const fs = [...$("#c_imgs").files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); if (!fs.length) throw new Error(img ? "Hãy chọn ảnh minh họa" : "Hãy chọn ảnh các trang");
    ch.pages = []; if (img) ch.type = "img";
    const cz = $("#c_cz").checked; let szA = 0, szB = 0;
    for (let j = 0; j < fs.length; j++) {
      const f = fs[j]; let ext = (f.name.split(".").pop() || "jpg").toLowerCase(), b64 = null; szA += f.size;
      if (cz) { log(`Đang nén trang ${j + 1}/${fs.length}...`); const r = await squeeze(f); if (r) { b64 = r.b64; ext = r.ext; szB += r.size } }
      if (!b64) { b64 = await fileB64(f); szB += f.size }
      const p = `${img ? "novels" : "manga"}/${s.slug}/${id}/${String(j + 1).padStart(3, "0")}.${ext}`; log(`Đang tải trang ${j + 1}/${fs.length}...`); await put(p, b64, `${s.title} ${t} tr.${j + 1}`); ch.pages.push(p);
    }
    const fz = b => b < 1048576 ? Math.round(b / 1024) + " KB" : (b / 1048576).toFixed(1) + " MB"; window.lastSz = `${fz(szA)} → ${fz(szB)}`;
  }
  const vols = s.chapters.map(c => (c.vol || "").trim()), fi = ch.vol ? vols.indexOf(ch.vol) : -1;
  if (img && $("#c_first").checked && fi >= 0) s.chapters.splice(fi, 0, ch);
  else if (ch.vol) { const at = vols.lastIndexOf(ch.vol); if (at >= 0) s.chapters.splice(at + 1, 0, ch); else s.chapters.push(ch) } else s.chapters.push(ch);
  await save("Thêm chương: " + s.title + " - " + t);
  const szMsg = window.lastSz ? ` Dung lượng ảnh: ${window.lastSz}.` : ""; window.lastSz = "";
  ["c_title", "c_text"].forEach(x => $("#" + x).value = ""); $("#c_file").value = $("#c_imgs").value = ""; done("✅ Đã đăng chương." + szMsg + " Web cập nhật sau 1–2 phút."); if ($("#p-chap").classList.contains("inws")) wsDraw();
}) };

$("#p-tip").onsubmit = e => { e.preventDefault(); run(async () => {
  const title = $("#tp_title").value.trim(); if (!title) throw new Error("Hãy nhập tiêu đề");
  const d = { title, game: $("#tp_game").value.trim(), text: $("#tp_text").value.trim(), img: "" }, f = $("#tp_img").files[0];
  if (f) { const p = `images/tips/${slugify(title)}-${rid()}.${(f.name.split(".").pop() || "jpg").toLowerCase()}`; log("Đang tải ảnh..."); await put(p, await fileB64(f), "Ảnh mẹo: " + title); d.img = p }
  data.tips.unshift(d); await save("Thêm mẹo: " + title); e.target.reset(); done("✅ Đã thêm mẹo.");
}) };
$("#p-link").onsubmit = e => { e.preventDefault(); run(async () => {
  const title = $("#l_title").value.trim(), url = $("#l_url").value.trim(); if (!title || !/^https?:\/\//.test(url)) throw new Error("Cần tên và địa chỉ bắt đầu bằng https://");
  data.links.push({ title, url, desc: $("#l_desc").value.trim(), tags: $("#l_tags").value.split(",").map(x => x.trim()).filter(Boolean) });
  await save("Thêm liên kết: " + title); e.target.reset(); done("✅ Đã thêm liên kết.");
}) };
$("#p-vid").onsubmit = e => { e.preventDefault(); run(async () => {
  const title = $("#v_title").value.trim(), v = $("#v_yt").value.trim(); if (!title || !v) throw new Error("Cần tên bài và link/ID YouTube");
  const m = v.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  data.videos.push({ title, youtube: m ? m[1] : v, desc: $("#v_desc").value.trim() }); await save("Thêm video: " + title); e.target.reset(); done("✅ Đã thêm video.");
}) };

const hueOf = t => [...String(t)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
const thumb = s => `<span class="mth" style="--h:${hueOf(s.title)}">${s.cover ? `<img src="${esc(s.cover)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`;
// ---------- Tự sắp xếp chương ----------
const ROM = t => { const v = { I: 1, V: 5, X: 10, L: 50, C: 100 }; let n = 0; t = t.toUpperCase(); for (let i = 0; i < t.length; i++) { const a = v[t[i]], b = v[t[i + 1]] || 0; n += a < b ? -a : a } return n };
const numOf = x => /^[IVXLC]+$/i.test(x) ? ROM(x) : parseFloat(x.replace(",", "."));
const NUM = "(\\d+(?:[.,]\\d+)?|[IVXLC]+(?![\\p{L}]))";
const CK = [
  [0, /^(minh h(ọa|oạ)|tranh minh h(ọa|oạ)|ảnh minh h(ọa|oạ)|ảnh màu|illustrations?|colou?r (pages|illustrations?))/i],
  [1, /^(lời mở đầu|mở đầu|mở màn|khúc dạo đầu|dạo đầu|prologue|lời dẫn|tự chương|序章|プロローグ)/i],
  [3, /^(vĩ thanh|epilogue|lời kết|hồi kết|kết thúc|chương cuối|chương kết|終章|エピローグ)/i],
  [4, /^(ngoại truyện|side ?story|extra|bonus|phụ lục|phiên ngoại|short story|truyện ngắn|ss(?![\p{L}])|番外)/iu],
  [5, /^(lời bạt|lời tác giả|lời người dịch|lời nhóm dịch|lời cảm ơn|afterword|postscript|tái bút|あとがき)/i]];
const CHN = new RegExp(`(?:^|[\\s:\\-–—(\\[,])(?:chương|chapter|chap|ch\\.?|hồi|phần|tiết|episode|ep\\.?|part|act|第)\\s*${NUM}`, "iu"), LEAD = new RegExp(`^${NUM}\\s*[.:\\-–—)]`, "iu");
function chKey(c) {
  const t = (c.t || "").normalize("NFC").trim(), num = (m => m ? numOf(m[1]) : null)(CHN.exec(t) || LEAD.exec(t));
  for (const [r, re] of CK) if (re.test(t)) { const m = /(\d+(?:[.,]\d+)?)/.exec(t.replace(re, "")); return [r, m ? numOf(m[1]) : 0] }
  if (num != null && !isNaN(num)) return [2, num];
  return null;
}
const volNum = v => { const m = new RegExp(`(?:tập|volume|vol\\.?|quyển|book|arc|phần)\\s*${NUM}`, "iu").exec(v || "") || new RegExp(`^${NUM}(?![\\p{L}\\d])`, "u").exec((v || "").trim()); return m ? numOf(m[1]) : null };
function chSort(list) {
  // Giữ các tập theo số tập (tập không có số đứng sau tập trước nó), trong mỗi tập xếp theo loại rồi theo số chương.
  const groups = []; const by = new Map();
  list.forEach((c, i) => { const v = (c.vol || "").trim(); if (!by.has(v)) { const g = { v, first: i, items: [] }; by.set(v, g); groups.push(g) } by.get(v).items.push({ c, i }) });
  let prev = -Infinity; groups.forEach(g => { const n = volNum(g.v); g.n = n != null ? n : (g.v ? prev + 0.001 : -1); if (n != null) prev = n; else if (g.v) prev = g.n });
  groups.sort((a, b) => a.n - b.n || a.first - b.first);
  const isImgCh = c => c.type === "img" || (!!c.pages && !c.file && !c.text);
  return groups.flatMap(g => { let last = [0.5, 0];
    const K = g.items.map(({ c, i }) => { let k = chKey(c); if (!k && isImgCh(c) && !/\d/.test(c.t || "")) k = [0, 0]; if (k) last = k; return { c, i, k: k || last } });
    return K.sort((a, b) => a.k[0] - b.k[0] || a.k[1] - b.k[1] || a.i - b.i).map(x => x.c) });
}
function manage() {
  const q = ($("#m_q")?.value || "").trim().toLowerCase(), hit = o => !q || JSON.stringify(o).toLowerCase().includes(q), out = [];
  for (const k of ["novels", "manga"]) data[k].forEach((s, i) => {
    if (!hit([s.title, s.orig, s.alts, s.author])) return;
    out.push(`<details class="ms"><summary>${thumb(s)}<span class="mti"><b>${esc(s.title)}</b><small>${k === "novels" ? (s.format || "Light Novel") : "Manga"}${s.author ? ", " + esc(s.author) : ""}, ${s.chapters.length} chương${s.status ? ", " + esc(s.status) : ""}</small></span><span class="mact"><button type="button" class="sec sm" data-s="${k}|${i}">Sửa bộ</button><button type="button" class="sec sm" data-v="${k}|${i}">Tập và bìa</button>${s.chapters.length > 1 ? `<button type="button" class="sec sm" data-o="${k}|${i}" title="Tự xếp: Minh họa, Mở đầu, Chương 1, 2, 3..., Vĩ thanh, Lời bạt">Sắp xếp chương</button>` : ""}<button type="button" class="dng sm" data-d="${k}|${i}">Gỡ bộ</button></span></summary><div class="mch">${s.chapters.map((c, j) => `<div class="mc"><span class="mcn">${j + 1}</span><span class="mct">${c.vol ? `<em>${esc(c.vol)}, </em>` : ""}${esc(c.t)}${c.type === "img" ? ` <em>(${c.pages.length} ảnh)</em>` : ""}</span><small>${c.date || ""}</small><span class="mca"><button type="button" data-e="${k}|${i}|${j}">Sửa</button><button type="button" data-m="${k}|${i}|${j}|-1" title="Chuyển lên"${j ? "" : " disabled"}>↑</button><button type="button" data-m="${k}|${i}|${j}|1" title="Chuyển xuống"${j < s.chapters.length - 1 ? "" : " disabled"}>↓</button><button type="button" class="dng" data-d="${k}|${i}|${j}" title="Gỡ chương">✕</button></span></div>`).join("") || '<p class="mu">Chưa có chương nào.</p>'}</div></details>`);
  });
  const grp = [];
  for (const [k, l] of [["projects", "Dự án"], ["tips", "Mẹo game"], ["links", "Liên kết"], ["videos", "Video"]]) {
    const rows = data[k].map((d, i) => [d, i]).filter(([d]) => hit(d)).map(([d, i]) => `<div class="li"><span class="lt">${esc(d.title)}${d.game ? ` <em>${esc(d.game)}</em>` : ""}</span>${k === "projects" ? `<button type="button" class="sec sm" data-p="${i}">Sửa</button>` : ""}<button type="button" class="dng sm" data-d="${k}|${i}">Gỡ</button></div>`).join("");
    if (rows) grp.push(`<div class="mgrp"><h4>${l}</h4><div class="lst">${rows}</div></div>`);
  }
  $("#manage").innerHTML = ((out.length ? `<h4 style="margin:0 0 8px">Truyện</h4>${out.join("")}` : "") + grp.join("")) || `<p class="mu">${q ? "Không có mục nào khớp với từ khóa." : "Chưa có nội dung. Bắt đầu bằng mục Bộ truyện."}</p>`;
  dash(); if ($("#g_list")) gRender();
}
$("#manage").onclick = e => { const b = e.target.closest("button[data-d]"); if (!b) return; const [k, i, j] = b.dataset.d.split("|"); if (!confirm("Gỡ mục này khỏi web?")) return;
  run(async () => { j === undefined ? data[k].splice(+i, 1) : data[k][+i].chapters.splice(+j, 1); await save("Xóa mục"); done("✅ Đã gỡ.") }) };

async function getText(p) {
  const r = await fetch(`https://api.github.com/repos/${cfg.u}/${cfg.r}/contents/${p}?ref=${cfg.b}&_=${Date.now()}`, { cache: "no-store", headers: { Authorization: "Bearer " + cfg.t, Accept: "application/vnd.github.raw+json" } });
  if (!r.ok) throw new Error("Không tải được " + p + " (" + r.status + ")"); return r.text();
}
let ed = null;
$("#manage").addEventListener("click", e => {
  const bs = e.target.closest("button[data-s]"), bm = e.target.closest("button[data-m]"), be = e.target.closest("button[data-e]"), bo = e.target.closest("button[data-o]");
  if (bo) {
    e.preventDefault(); const [k, i] = bo.dataset.o.split("|"), s = data[k][+i], L = chSort(s.chapters);
    if (L.every((c, j) => c === s.chapters[j])) return log("✅ Các chương của " + s.title + " đã đúng thứ tự, không cần sắp xếp.");
    const moved = L.filter((c, j) => c !== s.chapters[j]).length, show = L.slice(0, 25).map((c, j) => `${j + 1}. ${c.vol ? c.vol + ", " : ""}${c.t}`).join("\n");
    if (!confirm(`Sắp xếp lại ${s.chapters.length} chương của "${s.title}" (${moved} chương đổi vị trí)?\n\nThứ tự mới:\n${show}${L.length > 25 ? "\n..." : ""}`)) return;
    s.chapters = L; run(async () => { await save("Sắp xếp chương: " + s.title); done("✅ Đã sắp xếp chương của " + s.title + ".") });
  } else if (bs) {
    const [k, i] = bs.dataset.s.split("|"), s = data[k][+i];
    $("#s_kind").value = k === "novels" ? (s.format === "Web Novel" ? "webnovel" : "novel") : "manga"; $("#s_src").value = s.src || ""; $("#s_team").value = (s.team || []).map(t => t.r ? t.r + " | " + t.n : t.n).join("\n"); $("#s_prog").value = s.prog || ""; $("#s_feat").checked = !!s.feat; $("#s_sched").value = s.sched || ""; $("#s_title").value = s.title; $("#s_slug").value = s.slug; $("#s_author").value = s.author || ""; $("#s_country").value = s.country || ""; $("#s_age").value = s.age ?? ""; $("#s_orig").value = s.orig || ""; $("#s_alts").value = (s.alts || []).join("\n"); $("#s_artist").value = s.artist || "";
    $("#s_status").value = s.status || "Đang dịch"; $("#s_desc").value = s.desc || ""; $("#s_genres").value = (s.genres || []).join(", "); gChips(); $("#s_cover").value = ""; cvPrev(s.cover); tab("series"); $("#ptitle").textContent = "Sửa bộ: " + s.title; log("Đang sửa bộ " + s.title + ". Chọn ảnh bìa mới nếu muốn đổi.");
  } else if (bm) {
    const [k, i, j, d] = bm.dataset.m.split("|"), a = data[k][+i].chapters, x = +j, y = x + +d; if (y < 0 || y >= a.length) return;
    [a[x], a[y]] = [a[y], a[x]]; run(async () => { await save("Đổi thứ tự chương"); done("✅ Đã đổi thứ tự chương.") });
  } else if (be) {
    const [k, i, j] = be.dataset.e.split("|"), s = data[k][+i], c = s.chapters[+j]; ed = { k, i: +i, j: +j };
    run(async () => {
      $("#e_info").textContent = s.title; $("#e_title").value = c.t; $("#e_date").value = c.date || ""; $("#e_vol").value = c.vol || ""; const isImg = c.type === "img" || !!c.pages; $("#e_novel").hidden = k !== "novels" || isImg; $("#e_mn").hidden = !(k !== "novels" || isImg);
      const imgCh = k === "manga" || c.type === "img"; $("#e_imgw").hidden = !imgCh; if (imgCh) { EI = pagesOf(c).map(p => ({ p })); eiRender() }
      if (k === "novels" && !isImg) { log("Đang tải nội dung chương..."); $("#e_text").value = c.text ?? await getText(c.file) }
      tab("edit"); log("Đang sửa: " + c.t);
    });
  }
});
$("#p-edit").onsubmit = e => { e.preventDefault(); run(async () => {
  if (!ed) throw new Error("Chưa chọn chương nào"); const s = data[ed.k][ed.i], c = s.chapters[ed.j], t = $("#e_title").value.trim(); if (!t) throw new Error("Hãy nhập tên chương");
  c.t = t; c.date = $("#e_date").value; const ev = $("#e_vol").value.trim(); if (ev) c.vol = ev; else delete c.vol;
  if (ed.k === "novels" && !(c.type === "img" || c.pages)) {
    const text = $("#e_text").value; if (!text.trim()) throw new Error("Nội dung đang trống");
    c.words = trWords(text);
    if (c.text !== undefined) c.text = text; else { log("Đang lưu nội dung..."); await put(c.file, b64t(text), "Sửa chương: " + t) }
  } else if (ed.k === "manga" || c.type === "img") {
    if (!EI.length) throw new Error("Chương phải có ít nhất một ảnh");
    const dir = (pagesOf(c)[0] || `${ed.k === "manga" ? "manga" : "novels"}/${s.slug}/c${ed.j + 1}_${rid()}/x`).replace(/[^/]+$/, ""), out = [], nw = EI.filter(x => x.f).length; let up = 0;
    for (let j = 0; j < EI.length; j++) {
      const x = EI[j]; if (x.p) { out.push(x.p); continue }
      up++; let ext = (x.f.name.split(".").pop() || "jpg").toLowerCase(), b64 = null;
      if ($("#e_cz").checked) { log(`Đang nén ảnh mới ${up}/${nw}...`); const r = await squeeze(x.f); if (r) { b64 = r.b64; ext = r.ext } }
      if (!b64) b64 = await fileB64(x.f);
      const p = `${dir}${String(j + 1).padStart(3, "0")}-${rid()}.${ext}`; log(`Đang tải ảnh mới ${up}/${nw}...`); await put(p, b64, `${s.title} ${t} ảnh ${j + 1}`); out.push(p); x.p = p; x.f = null;
    }
    c.pages = out; delete c.dir; delete c.n; delete c.pad; delete c.ext;
  }
  await save("Sửa chương: " + s.title + " - " + t); ed = null; done("✅ Đã lưu chỉnh sửa. Web cập nhật sau 1–2 phút."); goRet();
}) };
$("#e_cancel").onclick = () => { ed = null; goRet() };

/* ===== Quản lý bộ ===== */
function goRet() { const r = RET; RET = null; if (r === "ws" && WS.k && data[WS.k][WS.i]) { tab("ws"); $("#ws_home").hidden = true; $("#ws_one").hidden = false; wsDraw() } else tab("man") }
$("#ret_go").onclick = () => { ed = null; goRet() };
const chHome = document.createComment("p-chap"); $("#p-chap").before(chHome);
function wsPark() { const f = $("#p-chap"); if (!f.classList.contains("inws")) return; chHome.after(f); f.classList.remove("inws", "on"); $("#ws_addb").classList.remove("on"); $("#ws_addb").textContent = "+ Thêm chương" }
const wsS = () => WS.k ? data[WS.k][WS.i] : null;
const wsType = (k, s) => k === "manga" ? "manga" : s.format === "Web Novel" ? "wn" : "ln";
const wsLat = s => s.chapters.reduce((m, c) => (c.date || "") > m ? c.date : m, "");
function wsHome(pick) { WS.pick = pick || null; const pk = $("#ws_pk"); pk.hidden = !WS.pick; pk.textContent = WS.pick === "tr" ? "Chọn bộ truyện chữ muốn dịch chương mới." : WS.pick === "chap" ? "Chọn bộ muốn đăng chương. Mỗi chương chỉ đăng được vào bộ của nó." : ""; WS.k = null; WS.W = null; WS.dirty = false; wsPark(); $("#ws_one").hidden = true; $("#ws_home").hidden = false; $("#ptitle").textContent = "Bộ truyện"; wsGrid() }
function wsGrid() {
  const q = $("#ws_q").value.trim().toLowerCase(), L = [];
  for (const k of ["novels", "manga"]) data[k].forEach((s, i) => { const t = wsType(k, s); if (WS.f !== "all" && WS.f !== t) return; if (q && ![s.title, s.orig, ...(s.alts || [])].join(" ").toLowerCase().includes(q)) return; L.push({ k, i, s, t }) });
  L.sort((a, b) => wsLat(b.s).localeCompare(wsLat(a.s)));
  $("#ws_grid").innerHTML = L.map(({ k, i, s, t }) => `<button type="button" class="wsc" data-ws="${k}|${i}"><span class="wsct" style="--h:${hueOf(s.title)}">${s.cover ? `<img src="${esc(s.cover)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</span><b>${esc(s.title)}</b><small>${t === "manga" ? "Manga" : t === "wn" ? "Web Novel" : "Light Novel"}, ${s.chapters.length} chương</small></button>`).join("") || `<p class="mu">${q || WS.f !== "all" ? "Không có bộ nào khớp." : "Chưa có bộ nào. Bấm Thêm bộ mới để bắt đầu."}</p>`;
}
$("#ws_q").oninput = wsGrid;
$("#ws_f").onclick = e => { const b = e.target.closest("[data-wf]"); if (!b) return; WS.f = b.dataset.wf; document.querySelectorAll("#ws_f .chip").forEach(x => x.classList.toggle("on", x === b)); wsGrid() };
$("#ws_grid").onclick = e => { const b = e.target.closest("[data-ws]"); if (b) { const [k, i] = b.dataset.ws.split("|"); wsOpen(k, +i) } };
$("#ws_new").onclick = () => { RET = "ws"; WS.k = null; tab("series"); $("#s_new").click() };
function wsOpen(k, i) { const pick = WS.pick; WS.pick = null; $("#ws_pk").hidden = true; WS.k = k; WS.i = +i; WS.W = null; WS.dirty = false; WS.open = null; WS.last = null; RET = null; tab("ws"); $("#ws_home").hidden = true; $("#ws_one").hidden = false; wsDraw(); scrollTo(0, 0); if (pick === "chap") $("#ws_addb").click(); else if (pick === "tr") { if (k === "manga") log("Manga không dùng mục Dịch chương, hãy bấm + Thêm chương để đăng ảnh."); else $("#ws_tr").click() } }
$("#ws_back").onclick = () => { if (WS.dirty && !confirm("Bỏ các thay đổi chưa lưu?")) return; wsHome() };
const wsVol = c => (c.vol || "").trim();
function wsDraw() {
  const s = wsS(); if (!s) return wsHome();
  if (!WS.dirty || !WS.W) WS.W = s.chapters.map(c => ({ ...c, _o: c }));
  const W = WS.W, k = WS.k, kind = k === "manga" ? "manga" : "novel", vs = [...new Set(W.map(wsVol).filter(Boolean))];
  $("#ptitle").textContent = "Bộ truyện"; $("#ws_t").textContent = s.title;
  $("#ws_m").textContent = `${k === "manga" ? "Manga" : s.format || "Light Novel"}, ${s.status || "Đang dịch"}, ${s.chapters.length} chương${vs.length ? ", " + vs.length + " tập" : ""}`;
  $("#ws_cvw").style.setProperty("--h", hueOf(s.title)); $("#ws_cv").src = s.cover || ""; $("#ws_web").href = `index.html#${kind}/${s.slug}`; $("#ws_imp").hidden = k === "manga"; $("#ws_tr").hidden = k === "manga";
  const runs = []; W.forEach((c, j) => { const v = wsVol(c), r = runs[runs.length - 1]; if (r && r.v === v) r.js.push(j); else runs.push({ v, js: [j] }) });
  if (!WS.open) WS.open = new Set(W.length <= 25 ? runs.map(r => r.v) : runs.filter(r => !r.v).map(r => r.v));
  const vc = s.vc || {}, wd = c => (c.type === "img" || (c.pages && kind === "novel")) ? (c.pages || []).length + " ảnh" : kind === "novel" ? (c.words || 0).toLocaleString("vi-VN") + " chữ" : (c.pages ? c.pages.length : c.n || 0) + " trang";
  const row = j => { const c = W[j]; return `<div class="wsr${WS.last === j ? " mv" : ""}" data-j="${j}"><input type="checkbox" value="${j}" aria-label="Chọn chương"><button type="button" class="wsn" data-wpos="${j}" title="Chuyển tới vị trí khác">${j + 1}</button><span class="tt">${esc(c.t)}</span><small>${wd(c)}</small><small>${c.date || ""}</small><span class="wa"><button type="button" data-wed="${j}">Sửa</button><button type="button" data-wmv="${j}|-1" title="Lên"${j ? "" : " disabled"}>↑</button><button type="button" data-wmv="${j}|1" title="Xuống"${j < W.length - 1 ? "" : " disabled"}>↓</button><button type="button" data-wsp="${j}" title="Bắt đầu tập mới từ chương này">✂ Tách tập</button><button type="button" class="dng" data-wrm="${j}" title="Gỡ chương">✕</button></span></div>` };
  $("#ws_list").innerHTML = runs.map(r => `<div class="vg${WS.open.has(r.v) ? " open" : ""}${r.v ? "" : " nov"}" data-v="${esc(r.v)}"><div class="vgh"><input type="checkbox" class="vga" aria-label="Chọn cả nhóm">${r.v ? `<label class="vcv2" title="Đổi bìa ${esc(r.v)}">${vc[r.v] ? `<img src="${esc(vc[r.v])}" alt="" onerror="this.remove()">` : "+bìa"}<input type="file" accept="image/*" hidden data-wvc="${esc(r.v)}"></label>` : ""}<button type="button" class="vgt"><b>${r.v ? esc(r.v) : "Chưa có tập"}</b><small>${r.js.length} chương, số ${r.js[0] + 1}${r.js.length > 1 ? "–" + (r.js[r.js.length - 1] + 1) : ""}</small></button>${r.v ? `<button type="button" class="sec sm" data-wren="${esc(r.v)}">Đổi tên</button>` : ""}</div><div class="vgb">${r.js.map(row).join("")}</div></div>`).join("") || '<p class="mu" style="padding:10px">Bộ này chưa có chương nào. Bấm Thêm chương để đăng chương đầu tiên.</p>';
  $("#ws_vols").innerHTML = vs.map(v => `<option value="${esc(v)}">`).join("");
  $("#ws_exp").textContent = runs.length && runs.every(r => WS.open.has(r.v)) ? "Thu gọn hết" : "Mở hết";
  $("#ws_dirty").hidden = !WS.dirty; wsSync();
  if ($("#p-chap").classList.contains("inws")) { $("#c_ser").value = kind + "|" + WS.i; chapUI() }
}
function wsSync() {
  let n = 0; document.querySelectorAll("#ws_list .vg").forEach(g => { const L = [...g.querySelectorAll(".vgb input")], c = L.filter(x => x.checked).length; n += c; const a = g.querySelector(".vga"); a.checked = c > 0 && c === L.length; a.indeterminate = c > 0 && c < L.length });
  $("#ws_sel").hidden = !n; $("#ws_cnt").textContent = `Đã chọn ${n} chương`;
}
const wsPick = () => [...document.querySelectorAll("#ws_list .vgb input:checked")].map(c => +c.value);
const wsDirty = () => { WS.dirty = true; wsDraw() };
let wsShift = null;
$("#ws_list").addEventListener("click", e => {
  const W = WS.W, t = e.target;
  const g = t.closest(".vgt"); if (g) { const v = g.closest(".vg").dataset.v; WS.open.has(v) ? WS.open.delete(v) : WS.open.add(v); g.closest(".vg").classList.toggle("open"); $("#ws_exp").textContent = "Mở hết"; return }
  const mv = t.closest("[data-wmv]");
  if (mv) { const [j, d] = mv.dataset.wmv.split("|").map(Number), y = j + d; if (y < 0 || y >= W.length) return;
    if (wsVol(W[y]) !== wsVol(W[j])) { if (W[y].vol) W[j].vol = W[y].vol; else delete W[j].vol; WS.open.add(wsVol(W[j])); WS.last = j } else { [W[j], W[y]] = [W[y], W[j]]; WS.last = y }
    return wsDirty() }
  const ps = t.closest("[data-wpos]");
  if (ps) { const j = +ps.dataset.wpos, n = parseInt(prompt(`Chuyển "${W[j].t}" tới vị trí số (1–${W.length}):`, j + 1)); if (!n || n < 1 || n > W.length || n - 1 === j) return;
    const [c] = W.splice(j, 1), at = n - 1, nb = W[at] || W[at - 1]; W.splice(at, 0, c); if (nb) { if (nb.vol) c.vol = nb.vol; else delete c.vol } WS.open.add(wsVol(c)); WS.last = at; return wsDirty() }
  const sp = t.closest("[data-wsp]");
  if (sp) { const j = +sp.dataset.wsp, v = wsVol(W[j]); if (j > 0 && wsVol(W[j - 1]) !== v) return log("Chương này đã là chương đầu của " + (v || "nhóm chưa có tập") + ".");
    const ns = W.map(c => volNum(wsVol(c))).filter(x => x != null), def = "Tập " + ((ns.length ? Math.floor(Math.max(...ns)) : v ? 1 : 0) + 1);
    const nw = (prompt(`Tách từ "${W[j].t}" đến hết ${v || "nhóm này"} thành tập mới. Tên tập mới:`, def) || "").trim(); if (!nw) return;
    for (let x = j; x < W.length && wsVol(W[x]) === v; x++) W[x].vol = nw;
    WS.open.add(nw); WS.last = j; wsDirty(); log(`Đã tách ${nw}. Kiểm tra lại rồi bấm Lưu thay đổi.`); return }
  const rm = t.closest("[data-wrm]");
  if (rm) { const j = +rm.dataset.wrm; if (!confirm(`Gỡ "${W[j].t}" khỏi web? (Bấm Lưu thay đổi mới có hiệu lực)`)) return; W.splice(j, 1); WS.last = null; return wsDirty() }
  const ed2 = t.closest("[data-wed]");
  if (ed2) { if (WS.dirty) return log("❌ Hãy Lưu thay đổi hoặc Hoàn tác trước khi sửa chương"); const j = +ed2.dataset.wed; RET = "ws";
    let b = $("#manage").querySelector(`button[data-e="${WS.k}|${WS.i}|${j}"]`); if (!b) { $("#m_q").value = ""; manage(); b = $("#manage").querySelector(`button[data-e="${WS.k}|${WS.i}|${j}"]`) } b?.click(); return }
  const rn = t.closest("[data-wren]");
  if (rn) { const s = wsS(), old = rn.dataset.wren, nw = (prompt(`Đổi tên "${old}" thành:`, old) || "").trim(); if (!nw || nw === old) return;
    run(async () => { for (const c of [...s.chapters, ...W]) if (wsVol(c) === old) c.vol = nw; if (s.vc && s.vc[old]) { s.vc[nw] = s.vc[old]; delete s.vc[old] } if (WS.open.delete(old)) WS.open.add(nw); await save(`Đổi tên tập: ${s.title} - ${old} thành ${nw}`); done(`✅ Đã đổi tên ${old} thành ${nw}.`); wsDraw() }); return }
  const cb = t.closest(".vgb input");
  if (cb) { const j = +cb.value; if (e.shiftKey && wsShift != null) { const [a, b] = [Math.min(wsShift, j), Math.max(wsShift, j)]; document.querySelectorAll("#ws_list .vgb input").forEach(x => { if (+x.value >= a && +x.value <= b) x.checked = cb.checked }) } wsShift = j; wsSync() }
});
$("#ws_list").addEventListener("change", e => {
  const a = e.target.closest(".vga"); if (a) { a.closest(".vg").querySelectorAll(".vgb input").forEach(c => c.checked = a.checked); wsSync(); return }
  const f = e.target.closest("[data-wvc]"); if (!f || !f.files[0]) return; const s = wsS(), v = f.dataset.wvc, file = f.files[0];
  run(async () => { log("Đang tải bìa " + v + "..."); const p = `images/${s.slug}-${slugify(v) || "tap"}-${rid()}.jpg`; await put(p, await resize(file), "Bìa " + v + ": " + s.title); s.vc = { ...(s.vc || {}), [v]: p }; await save("Bìa tập: " + s.title + " - " + v); done("✅ Đã đổi bìa " + v + "."); wsDraw() });
});
const wsSetVol = v => { const L = wsPick(); if (!L.length) return; L.forEach(j => { if (v) WS.W[j].vol = v; else delete WS.W[j].vol }); if (v) WS.open.add(v); else WS.open.add(""); WS.last = null; wsDirty() };
$("#ws_set").onclick = () => { const v = $("#ws_vol").value.trim(); if (!v) return log("❌ Nhập tên tập trước"); wsSetVol(v); $("#ws_vol").value = "" };
$("#ws_unset").onclick = () => wsSetVol("");
$("#ws_none").onclick = () => { document.querySelectorAll("#ws_list input[type=checkbox]").forEach(c => c.checked = false); wsSync() };
$("#ws_rm").onclick = () => { const L = wsPick(); if (!L.length || !confirm(`Gỡ ${L.length} chương đã chọn khỏi web? (Bấm Lưu thay đổi mới có hiệu lực)`)) return; const S = new Set(L); WS.W = WS.W.filter((c, j) => !S.has(j)); WS.last = null; wsDirty() };
$("#ws_exp").onclick = () => { const all = $("#ws_exp").textContent === "Thu gọn hết"; WS.open = new Set(all ? [] : WS.W.map(wsVol)); wsDraw() };
$("#ws_sort").onclick = () => { let W = WS.W; const vs = new Set(W.map(wsVol)), seg = vs.size <= 1 ? vAutoPlan(W) : [];
  if (seg.length >= 2 && confirm(`Bộ này ${[...vs][0] ? "mới chỉ có 1 tập" : "chưa chia tập"}, nếu sắp xếp ngay thì Chương 1 của các tập sẽ bị trộn vào nhau. Chia tập trước rồi mới sắp xếp?\n\n${seg.map(g => `${g.name}: chương ${g.js[0] + 1}–${g.js[g.js.length - 1] + 1}, bắt đầu bằng "${W[g.js[0]].t.slice(0, 40)}"`).join("\n")}\n\nBấm Hủy để chỉ sắp xếp, không chia tập.`)) { seg.forEach(g => g.js.forEach(j => W[j].vol = g.name)); WS.open = null }
  const L = chSort(W); if (L.every((c, j) => c === W[j])) return log("✅ Các chương đã đúng thứ tự."); WS.W = L; WS.last = null; wsDirty(); log("Đã sắp xếp. Kiểm tra lại rồi bấm Lưu thay đổi.") };
$("#ws_auto").onclick = () => { const W = WS.W, seg = vAutoPlan(W); if (seg.length < 2) return log("Không tìm thấy chỗ chuyển tập (Minh họa hoặc Mở đầu nằm giữa các chương). Hãy chọn chương rồi gán tập bằng tay.");
  if (seg.every(g => g.js.every(j => wsVol(W[j]) === g.name))) return log("✅ Các chương đã được chia tập đúng.");
  if (!confirm(`Chia thành ${seg.length} tập?\n\n${seg.map(g => `${g.name}: chương ${g.js[0] + 1}–${g.js[g.js.length - 1] + 1}, bắt đầu bằng "${W[g.js[0]].t.slice(0, 40)}"`).join("\n")}`)) return;
  seg.forEach(g => g.js.forEach(j => W[j].vol = g.name)); WS.W = chSort(W); WS.open = null; WS.last = null; wsDirty(); log("Đã chia tập và xếp lại chương trong từng tập. Kiểm tra rồi bấm Lưu thay đổi.") };
$("#ws_save").onclick = () => run(async () => { const s = wsS(); if (!s || !WS.dirty) return; s.chapters = WS.W.map(({ _o, ...c }) => { if (!wsVol(c)) delete c.vol; return c }); await save("Sắp xếp chương: " + s.title); WS.dirty = false; WS.W = null; WS.last = null; done("✅ Đã lưu thay đổi của " + s.title + ". Web cập nhật sau 1–2 phút."); wsDraw() });
$("#ws_undo").onclick = () => { WS.dirty = false; WS.W = null; WS.last = null; wsDraw(); log("Đã hoàn tác.") };
$("#ws_addb").onclick = () => { const f = $("#p-chap"); if (f.classList.contains("inws")) return wsPark(); if (WS.dirty) return log("❌ Hãy Lưu thay đổi hoặc Hoàn tác trước khi thêm chương");
  $("#ws_add").appendChild(f); f.classList.add("inws", "on"); $("#ws_addb").classList.add("on"); $("#ws_addb").textContent = "Đóng khung thêm chương"; $("#c_ser").value = (WS.k === "manga" ? "manga" : "novel") + "|" + WS.i; chapUI(); $("#c_title").focus() };
$("#ws_tr").onclick = () => { if (WS.dirty) return log("❌ Hãy Lưu thay đổi hoặc Hoàn tác trước"); if (WS.k !== "novels") return; RET = "ws"; tab("tr"); trFill(); $("#t_ser").value = WS.i; $("#t_ser").dispatchEvent(new Event("change")) };
$("#ws_imp").onclick = () => { if (WS.dirty) return log("❌ Hãy Lưu thay đổi hoặc Hoàn tác trước"); RET = "ws"; tab("imp"); impFill(); $("#i_ser").value = WS.i };
$("#ws_edit").onclick = () => { if (WS.dirty) return log("❌ Hãy Lưu thay đổi hoặc Hoàn tác trước"); RET = "ws"; let b = $("#manage").querySelector(`button[data-s="${WS.k}|${WS.i}"]`); if (!b) { $("#m_q").value = ""; manage(); b = $("#manage").querySelector(`button[data-s="${WS.k}|${WS.i}"]`) } b?.click() };
$("#ws_cvf").onchange = e => { const f = e.target.files[0], s = wsS(); if (!f || !s) return; run(async () => { log("Đang tải ảnh bìa..."); const p = `images/${s.slug}-bia-${rid()}.jpg`; await put(p, await resize(f), "Bìa: " + s.title); s.cover = p; await save("Đổi bìa: " + s.title); try { await writeShare(WS.k === "manga" ? "manga" : "novel", s) } catch (err) {} e.target.value = ""; done("✅ Đã đổi ảnh bìa. Web cập nhật sau 1–2 phút."); wsDraw() }) };
addEventListener("beforeunload", e => { if (WS.dirty) { e.preventDefault(); e.returnValue = "" } });
function deepLink() {
  const [a, k, slug, j] = decodeURIComponent(location.hash.slice(1)).split("/");
  if (HID.includes(a) && !k) { tab("ws"); wsHome(a === "chap" || a === "tr" ? a : null); return }
  if (TABS.some(x => x[0] === a && a !== "—")) { tab(a); if (a === "site" && k === "mk") setTimeout(() => { const x = $("#cm_pw"); if (x) { x.closest("details")?.setAttribute("open", ""); x.scrollIntoView({ block: "center" }); x.focus() } }, 50); return }
  if (!a || !KEYS[k]) return;
  const key = KEYS[k], i = data[key].findIndex(x => x.slug === slug); if (i < 0) { log("Không tìm thấy bộ truyện này trong dữ liệu."); return }
  if (a === "chap") { wsOpen(key, i); $("#ws_addb").click() }
  else if (a === "series") $(`#manage button[data-s="${key}|${i}"]`)?.click();
  else if (a === "bo") wsOpen(key, i);
  else if (a === "editchap") $(`#manage button[data-e="${key}|${i}|${j}"]`)?.click();
}

const GENRES = ["Hành động", "Phiêu lưu", "Lãng mạn", "Học đường", "Fantasy", "Isekai", "Hài hước", "Kinh dị", "Slice of Life", "Harem", "Drama", "Sci-fi", "Võ thuật", "Tu tiên", "Game", "Trinh thám"];
const curG = () => $("#s_genres").value.split(",").map(x => x.trim()).filter(Boolean);
function gChips() {
  const ex = new Set(GENRES); ["novels", "manga"].forEach(k => data[k].forEach(s => (s.genres || []).forEach(g => ex.add(g))));
  const cur = curG(); $("#g_chips").innerHTML = [...ex].map(g => `<button type="button" class="chip${cur.includes(g) ? " on" : ""}" data-g="${esc(g)}">${esc(g)}</button>`).join("");
}
$("#g_chips").onclick = e => { const b = e.target.closest("button[data-g]"); if (!b) return; const g = b.dataset.g, c = curG(); $("#s_genres").value = (c.includes(g) ? c.filter(x => x !== g) : [...c, g]).join(", "); gChips() };
$("#s_genres").addEventListener("input", () => gChips());

let pe = null;
$("#p-proj").onsubmit = e => { e.preventDefault(); run(async () => {
  const title = $("#j_title").value.trim(); if (!title) throw new Error("Hãy nhập tên dự án");
  const links = $("#j_links").value.split("\n").map(l => l.split("|").map(x => x.trim())).filter(([a, b]) => a && /^https?:\/\//.test(b || "")).map(([label, url]) => ({ label, url }));
  const d = { title, type: $("#j_type").value.trim(), status: $("#j_status").value, version: $("#j_ver").value.trim(), date: $("#j_date").value, desc: $("#j_desc").value.trim(), links, howto: $("#j_how").value.trim(), img: pe != null ? (data.projects[pe].img || "") : "" };
  const f = $("#j_img").files[0];
  if (f) { const p = `images/projects/${slugify(title)}-${rid()}.${(f.name.split(".").pop() || "jpg").toLowerCase()}`; log("Đang tải ảnh..."); await put(p, await fileB64(f), "Ảnh dự án: " + title); d.img = p }
  if (pe != null) data.projects[pe] = d; else data.projects.unshift(d);
  await save("Dự án: " + title); pe = null; e.target.reset(); $("#j_date").value = new Date().toISOString().slice(0, 10); done("✅ Đã lưu dự án. Web cập nhật sau 1–2 phút.");
}) };
$("#manage").addEventListener("click", e => {
  const b = e.target.closest("button[data-p]"); if (!b) return; pe = +b.dataset.p; const d = data.projects[pe];
  $("#j_title").value = d.title; $("#j_type").value = d.type || ""; $("#j_status").value = d.status || "Đang phát triển"; $("#j_ver").value = d.version || ""; $("#j_date").value = d.date || "";
  $("#j_desc").value = d.desc || ""; $("#j_links").value = (d.links || []).map(l => l.label + " | " + l.url).join("\n"); $("#j_how").value = d.howto || ""; $("#j_img").value = "";
  tab("proj"); log("Đang sửa dự án: " + d.title + " (chọn ảnh mới nếu muốn đổi)");
});

function siteLoad() {
  const S = data.site, A = S.about || {}, G = S.giscus || {};
  $("#tcap").checked = S.tcap !== false; $("#agetags").value = Object.entries(S.ageTags && typeof S.ageTags === "object" ? S.ageTags : { "Ecchi": 16, "Gore": 16, "Mature": 18, "Adult": 18, "Smut": 18, "Người lớn": 18, "18+": 18 }).map(([k, v]) => k + ": " + v).join("\n"); fnRender(); const K = S.kiku || {}; $("#kk_on").checked = K.on !== false; $("#kk_name").value = K.name || ""; $("#kk_ai").checked = !!K.ai; kkoRender();
  $("#a_text").value = S.announce?.text || ""; $("#a_url").value = S.announce?.url || ""; $("#b_name").value = A.name || ""; $("#b_intro").value = A.intro || ""; $("#b_dc").value = A.discord || "";
  $("#b_ct").value = (A.contacts || []).map(c => c.label + " | " + c.url).join("\n");
  $("#g_repo").value = G.repo || ""; $("#g_rid").value = G.repoId || ""; $("#g_cat").value = G.category || ""; $("#g_cid").value = G.categoryId || ""; $("#w_url").value = S.url || ""; $("#b_rep").value = S.report || ""; $("#gc_code").value = S.gc || ""; $("#sb_url").value = (S.sb || {}).url || ""; $("#sb_key").value = (S.sb || {}).key || ""; $("#st_rules").value = S.rules || ""; $("#cm_mode").value = S.cmt || "anon"; $("#gp_key").value = S.giphy || ""; $("#st_on").checked = S.st === true; try { $("#cm_pw").value = localStorage.getItem("cmtMod") || "" } catch (e) {} stkRender();
}
/* ===== Phông chữ cho danh hiệu ===== */
const FN_SAMPLE = "Hắc Kiếm Sĩ · ẤN THIÊN KIẾM Ỷ · Quỹ Đạo";
function fnRender() {
  const L = data.site.fonts ||= [], box = $("#fn_list"); if (!box) return;
  if (window.KG && KG.addFonts) KG.addFonts(L);
  box.innerHTML = L.length ? L.map((f, i) => `<div class="fnr" data-i="${i}"><div class="fns" style="font-family:'${esc(f.family).replace(/'/g, "")}','Be Vietnam Pro',sans-serif;font-weight:${+f.w || 700};font-style:${f.it ? "italic" : "normal"}">${FN_SAMPLE}</div>
<div class="fnc"><input class="fn_n" value="${esc(f.name || f.family)}" maxlength="40" aria-label="Tên hiện trong danh sách"><select class="fn_w" aria-label="Độ đậm">${[[400, "Thường"], [500, "Vừa"], [600, "Hơi đậm"], [700, "Đậm"], [800, "Rất đậm"], [900, "Đậm nhất"]].map(([v, l]) => `<option value="${v}"${(+f.w || 700) === v ? " selected" : ""}>${l} (${v})</option>`).join("")}</select>
<label class="ck"><input type="checkbox" class="fn_it"${f.it ? " checked" : ""}> Nghiêng</label><small class="mu">${f.file ? "File: " + esc(f.file) : "Google Fonts" + (f.gw ? ", có sẵn độ đậm " + esc(f.gw.replace(/;/g, ", ")) : ", chỉ có độ đậm thường")}${f.vi === false ? ". <b>Không có bộ chữ tiếng Việt</b>" : ""}</small><button type="button" class="sec sm fn_x">Xóa</button></div></div>`).join("") : '<p class="mu">Chưa thêm phông nào.</p>';
  box.querySelectorAll(".fnr").forEach(r => { const f = L[+r.dataset.i], up = () => { f.name = r.querySelector(".fn_n").value.trim().slice(0, 40) || f.family; f.w = +r.querySelector(".fn_w").value; f.it = r.querySelector(".fn_it").checked; const s = r.querySelector(".fns"); s.style.fontWeight = f.w; s.style.fontStyle = f.it ? "italic" : "normal"; if (window.KG) KG.addFonts(L) };
    r.querySelector(".fn_n").oninput = up; r.querySelector(".fn_w").onchange = up; r.querySelector(".fn_it").onchange = up;
    r.querySelector(".fn_x").onclick = () => run(async () => { if (!confirm(`Xóa phông "${f.name}"? Danh hiệu đang dùng phông này sẽ quay về phông Beaufort.`)) return; L.splice(+r.dataset.i, 1); await save("Xóa phông chữ: " + f.name); fnRender(); log("✅ Đã xóa phông.") }) });
}
const fnId = n => (slugify(n) || "font").slice(0, 24) + "-" + rid().slice(-4);
$("#fn_gadd").onclick = () => run(async () => {
  const fam = $("#fn_g").value.replace(/[^\p{L}\p{N} -]/gu, "").replace(/\s+/g, " ").trim(); if (!fam) throw new Error("Nhập tên phông, ví dụ Pattaya");
  const L = data.site.fonts ||= []; if (L.some(f => f.family.toLowerCase() === fam.toLowerCase())) throw new Error("Phông này đã có trong danh sách");
  const base = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(fam).replace(/%20/g, "+"), get = async q => { try { const r = await fetch(base + q + "&display=swap"); return r.ok ? await r.text() : null } catch (e) { return null } };
  log("Đang kiểm tra phông trên Google Fonts...");
  let gw = "400;700", css = await get(":wght@400;700"); if (css == null) { gw = "400;900"; css = await get(":wght@400;900") } if (css == null) { gw = ""; css = await get("") }
  if (css == null) throw new Error(`Không tìm thấy phông "${fam}" trên Google Fonts. Kiểm tra lại tên (viết đúng hoa thường, có dấu cách), ví dụ "Dancing Script".`);
  const vi = /\/\*\s*vietnamese\s*\*\//.test(css), w = gw.includes("700") ? 700 : gw.includes("900") ? 900 : 400;
  L.push({ id: fnId(fam), name: fam, family: fam, gw, w, it: false, vi }); $("#fn_g").value = "";
  await save("Thêm phông chữ: " + fam); fnRender();
  log(vi ? `✅ Đã thêm phông ${fam}.` : `⚠️ Đã thêm phông ${fam}, nhưng phông này không có bộ chữ tiếng Việt: chữ có dấu sẽ hiện bằng phông khác. Nên xóa và chọn phông khác.`);
});
$("#fn_file").onchange = e => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; run(async () => {
  const ext = (f.name.split(".").pop() || "").toLowerCase(); if (!/^(woff2?|ttf|otf)$/.test(ext)) throw new Error("Chỉ nhận file WOFF2, WOFF, TTF hoặc OTF");
  if (f.size > 2 * 1024 * 1024) throw new Error("File phông lớn hơn 2 MB. Nên đổi sang WOFF2 cho nhẹ (tìm \"ttf to woff2\" trên mạng).");
  const nm = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 40) || "Phông riêng", id = fnId(nm);
  const path = `fonts/custom/${id}.${ext}`; log("Đang tải phông lên...");
  try { const ff = new FontFace("KR " + id, await f.arrayBuffer(), { weight: "100 900" }); await ff.load(); document.fonts.add(ff) } catch (e) { throw new Error("File này không đọc được như một phông chữ. Hãy thử file khác.") } // xem trước ngay, không cần chờ GitHub
  await put(path, await fileB64(f), "Phông chữ: " + f.name);
  (data.site.fonts ||= []).push({ id, name: nm, family: "KR " + id, file: path, w: 700, it: false });
  await save("Thêm phông chữ: " + nm); fnRender(); log(`✅ Đã thêm phông ${nm}. Web nhận phông sau 1–2 phút.`);
}) };
$("#tcap_go").onclick = () => run(async () => {
  const n = tcapAll(); if (!n) return log("✅ Tên truyện và tên chương đều đã viết hoa sẵn.");
  await save("Viết hoa tên truyện và tên chương"); fillSel(); manage(); if (WS.k && !WS.dirty) wsDraw(); log(`✅ Đã viết hoa ${n} tên truyện và tên chương.`);
});
$("#p-site").onsubmit = e => { e.preventDefault(); run(async () => {
  const t = id => $("#" + id).value.trim(), ok = v => !v || /^https?:\/\//.test(v);
  if (/service_role|sb_secret_/.test(t("sb_key")) || (t("sb_key").split(".").length === 3 && /service_role/.test((() => { try { return atob((t("sb_key").split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")) } catch (e) { return "" } })()))) throw new Error("Đây là key bí mật (secret/service_role). Hãy dùng publishable key hoặc anon key.");
  if (t("sb_url") && !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/i.test(t("sb_url"))) throw new Error("Project URL Supabase có dạng https://xxxx.supabase.co");
  if (!ok(t("b_dc")) || !ok(t("a_url")) || !ok(t("w_url")) || !ok(t("b_rep"))) throw new Error("Link phải bắt đầu bằng https://");
  data.site = { announce: { text: t("a_text"), url: t("a_url") }, about: { name: t("b_name"), intro: t("b_intro"), discord: t("b_dc"), contacts: $("#b_ct").value.split("\n").map(l => { const [x, ...y] = l.split("|"); return { label: (x || "").trim(), url: y.join("|").trim() } }).filter(c => c.label) }, giscus: { repo: t("g_repo"), repoId: t("g_rid"), category: t("g_cat"), categoryId: t("g_cid") }, url: t("w_url"), report: t("b_rep"), sb: { url: t("sb_url").replace(/\/+$/, ""), key: t("sb_key") }, rules: $("#st_rules").value.trim(), cmt: $("#cm_mode").value, giphy: t("gp_key"), st: $("#st_on").checked, tcap: $("#tcap").checked, ageTags: Object.fromEntries($("#agetags").value.split("\n").map(l => l.split(/[:=]/)).filter(p => p.length > 1 && p[0].trim() && [13, 16, 18].includes(parseInt(p[1]))).map(p => [p[0].trim().slice(0, 40), parseInt(p[1])])), fonts: (data.site && data.site.fonts) || [], game: !!(data.site && data.site.game), genres: (data.site && data.site.genres) || undefined, stickers: data.site.stickers || [], kiku: { ...((data.site && data.site.kiku) || {}), on: $("#kk_on").checked, name: t("kk_name").slice(0, 20), ai: $("#kk_ai").checked }, gc: t("gc_code").replace(/^https?:\/\//, "").replace(/\.goatcounter\.com.*$/, "") };
  await save("Cập nhật cài đặt trang web"); done("✅ Đã lưu cài đặt. Web cập nhật sau 1–2 phút.");
}) };
/* ===== Cập nhật web bằng gói .zip (đọc zip ngay trong trình duyệt, không cần thư viện) ===== */
async function unzipFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer); let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error("File này không phải .zip hợp lệ");
  const n = dv.getUint16(e + 10, true), out = []; let p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    if (dv.getUint32(p, true) !== 0x02014b50) throw new Error("File .zip bị hỏng, hãy tải lại file");
    const meth = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl)).replace(/\\/g, "/"); p += 46 + nl + xl + cl;
    if (name.endsWith("/")) continue;
    const st = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true), raw = buf.subarray(st, st + csz);
    let d;
    if (meth === 0) d = raw;
    else if (meth === 8 && window.DecompressionStream) d = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else throw new Error("Trình duyệt này không giải nén được " + name + ". Hãy dùng Chrome hoặc Edge bản mới.");
    out.push({ name, d });
  }
  return out;
}
const UPOK = /^(index\.html|admin\.html|sw\.js|manifest\.webmanifest|(js|css)\/[\w.-]+\.(js|css)|(img|fonts|icons|stickers)\/[\w\/.-]+\.(webp|png|jpe?g|gif|svg|woff2?|ico))$/;
function upPath(name) { // bỏ thư mục bọc ngoài nếu có, chỉ nhận file của web
  if (/(^|\/)(__MACOSX|\.DS_Store)/.test(name)) return "";
  const seg = name.split("/").filter(Boolean);
  for (let k = 0; k < seg.length; k++) { const q = seg.slice(k).join("/"); if (UPOK.test(q) && !q.includes("..")) return q }
  return "";
}
const u8b64 = u => { let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s) };
$("#up_go").onclick = () => run(async () => {
  const f = $("#up_zip").files[0]; if (!f) throw new Error("Hãy chọn file .zip trước");
  if (f.size > 60e6) throw new Error("Gói lớn hơn 60 MB, hãy chia nhỏ ra");
  log("Đang đọc gói " + f.name + "...");
  const L = await unzipFile(f), ok = [], skip = [];
  for (const x of L) { const q = upPath(x.name); if (q) ok.push({ q, d: x.d }); else if (!/(^|\/)(__MACOSX|\.DS_Store)/.test(x.name)) skip.push(x.name) }
  if (!ok.length) throw new Error("Trong gói không có file nào của web (cần các thư mục js, css, img... hoặc index.html).");
  log(`Đang tải ${ok.length} file lên GitHub...`);
  for (const x of ok) await put(x.q, u8b64(x.d), "Cập nhật " + x.q);
  await flush("Cập nhật web từ gói " + f.name); $("#up_zip").value = "";
  log(`✅ Đã đặt ${ok.length} file vào đúng chỗ: ${[...new Set(ok.map(x => x.q.includes("/") ? x.q.split("/")[0] + "/" : x.q))].join(", ")}.${skip.length ? ` Bỏ qua ${skip.length} file không thuộc web (${skip.slice(0, 4).join(", ")}${skip.length > 4 ? "..." : ""}).` : ""} Web cập nhật sau 1–2 phút. Nếu chưa thấy thay đổi, tải lại trang bằng Ctrl+F5.`);
  if (ok.some(x => x.q === "admin.html" || x.q.startsWith("js/admin"))) log("Gói có cập nhật trang quản trị: tải lại trang này sau 2 phút để dùng bản mới.");
});
/* ===== Dịch cả tập ngay sau khi nhập file ===== */
const IMGM = /^\u0000IMG(\d+)$/;
let impTrOn = false;
const iProg = m => { $("#i_tprog").textContent = m };
function impTrSync() { // dùng chung cài đặt và bảng tên với mục Dịch chương, theo đúng bộ đang nhập
  if ($("#i_ser").value !== "" && $("#t_ser").value !== $("#i_ser").value && data.novels[+$("#i_ser").value]) { $("#t_ser").value = $("#i_ser").value; trSer() }
  for (const [a, b] of [["i_tsrc", "t_src"], ["i_tgen", "t_genre"]]) { if (!$("#" + a).options.length) $("#" + a).innerHTML = $("#" + b).innerHTML; $("#" + a).value = $("#" + b).value }
  const n = trGl().length, on = PROV.filter(p => p.on).length;
  $("#i_trsum").textContent = on ? `${n ? `Bảng tên của bộ có ${n} tên. ` : "Bộ này chưa có bảng tên, sẽ tự tạo khi dịch. "}Đang bật ${on} dịch vụ AI.` : "Chưa bật dịch vụ AI nào: vào mục Dịch chương, mở Cài đặt dịch tự động để thêm key.";
  $("#i_tundo").hidden = !IMP.some(x => x.orig);
}
[["i_tsrc", "t_src"], ["i_tgen", "t_genre"]].forEach(([a, b]) => $("#" + a).addEventListener("change", () => { $("#" + b).value = $("#" + a).value; $("#" + b).dispatchEvent(new Event("change")) }));
function impBusy(on) { impTrOn = on; ["i_tgo", "i_pub", "i_go", "i_tundo"].forEach(id => $("#" + id).disabled = on); $("#i_tstop").hidden = !on }
const lsTry = (k, v) => { try { localStorage.setItem(k, v); return true } catch (e) { return false } };
const lsJ = k => { try { return JSON.parse(localStorage.getItem(k) || "null") } catch (e) { return null } };
function glAddFrom(brief) { // thêm tên mới trong phần phân tích vào bảng tên, không hỏi lại
  const have = new Set(trGl().map(([x]) => x)), add = []; let sec = "";
  for (const l of String(brief).split("\n")) {
    const h = /^\s*(Nhân vật|Thuật ngữ mới|Xưng hô|Thể loại|Giọng kể)\s*:/i.exec(l); if (h) { sec = h[1].toLowerCase(); continue }
    if (!/nhân vật|thuật ngữ/.test(sec)) continue;
    const m = /^\s*[-•*]\s*(.+?)\s*=\s*(.+?)\s*(?:\(.*)?$/.exec(l); if (!m) continue;
    const x = m[1].trim(), y = m[2].trim(); if (!x || !y || x === y || have.has(x) || x.length > 40 || y.length > 60) continue; have.add(x); add.push(x + "=" + y);
  }
  if (add.length) { const g = $("#t_gl"); g.value = (g.value.trim() ? g.value.trim() + "\n" : "") + add.join("\n"); if (trSlug) ls.set("gl:" + trSlug, g.value) }
  return add.length;
}
async function impTitles(L) {
  const T = L.map(([x]) => x.t), key = "itrt:" + hashS(T.join("\n")), C = lsJ(key);
  let out = Array.isArray(C) && C.length === T.length ? C : null;
  if (!out) {
    iProg("Đang dịch tên các chương...");
    const t = await gem(`Dịch các tên chương sau sang tiếng Việt, mỗi dòng một tên, giữ đúng thứ tự và đúng ${T.length} dòng, có đánh số như bản gốc. Có số chương thì viết dạng "Chương N: tên" (第3話, 第三章, Chapter 3 → Chương 3). Prologue, プロローグ, 序章 → Mở đầu; Epilogue, エピローグ, 尾声 → Vĩ thanh; Afterword, あとがき, 后记 → Lời bạt; Illustrations, 口絵, 插图 → Minh họa; Interlude, 幕間 → Giữa chương. Chỉ trả về danh sách.\n\n${T.map((t, i) => `${i + 1}. ${t}`).join("\n")}`, { sys: trSys() });
    const R = t.replace(/```[\w-]*/g, "").split("\n").map(l => l.trim()).filter(l => /^\d+[.)]\s*/.test(l)).map(l => l.replace(/^\d+[.)]\s*/, "").trim());
    if (R.length === T.length) { out = R; lsTry(key, JSON.stringify(R)) }
  }
  if (out) L.forEach(([x], k) => { if (out[k]) { x.orig ??= { t: x.t, body: x.body, w: x.w }; x.t = out[k].slice(0, 200) } });
}
async function impTrOne(x, n, N, t0) {
  const src = (x.orig || x).body.map(l => { const m = IMGM.exec(l); return m ? `[img:${m[1]}]` : l }).join("\n"), fast = $("#t_mode").value === "fast";
  const cs = chunks(trPre(src), fast ? 4200 : 2400), key = "itr:" + hashS(src) + ":" + cs.length, C = lsJ(key) || { parts: [] }, name = `Chương ${n + 1}/${N} "${x.t.slice(0, 40)}"`;
  if (!cs.length) return true;
  if ($("#i_tbr").checked && !C.brief) {
    iProg(`${name}: đang đọc trước để chốt nhân vật và xưng hô...`);
    try { await trBrief(trPre(src)); C.brief = $("#t_brief").value; const k = glAddFrom(C.brief); if (k) log(`Thêm ${k} tên mới vào bảng tên từ ${x.t.slice(0, 40)}.`); lsTry(key, JSON.stringify(C)) } catch (e) { log("Bỏ qua bước đọc trước của " + x.t.slice(0, 40) + ": " + e.message) }
  }
  $("#t_brief").value = C.brief || ""; const sys = trSys(), pol = $("#t_pol2").checked;
  for (let k = 0; k < cs.length; k++) {
    if (C.parts[k]) continue; if (trStop) return false;
    x.trp = `Đang dịch ${k + 1}/${cs.length}`; impRender();
    iProg(`${name}: phần ${k + 1}/${cs.length}, đã chạy ${trSec(t0)}${trLastBy ? ". Dịch vụ: " + trLastBy : ""}`);
    const ctx = C.parts[k - 1] ? trParas(C.parts[k - 1]).slice(-3).join("\n").slice(-900) : "";
    let t = await gem(trUser(cs[k], ctx), { sys });
    if (pol && !trStop) { try { t = await gem(trPolishUser(cs[k], trClean(t)), { sys }) } catch (e) {} }
    C.parts[k] = trClean(t); if (!lsTry(key, JSON.stringify(C)) && !impTrOne.warn) { impTrOne.warn = 1; log("Bộ nhớ trình duyệt đã đầy, phần đã dịch chỉ giữ tới khi đóng trang. Nhớ đăng trước khi đóng.") }
  }
  // Ghép bản dịch, đưa ảnh về đúng chỗ (ảnh AI làm rơi thì đặt lại theo vị trí tương ứng)
  let out = trParas(C.parts.join("\n\n")); const seen = new Set();
  out = out.map(l => { const m = /^\[img:(\d+)\]$/.exec(l.replace(/\s+/g, "")); if (m && x.imgs[+m[1]] != null && !seen.has(+m[1])) { seen.add(+m[1]); return "\u0000IMG" + m[1] } return m ? "" : l }).filter(Boolean);
  const sb = (x.orig || x).body;
  x.imgs.forEach((_, j) => { if (seen.has(j)) return; const at = sb.findIndex(l => l === "\u0000IMG" + j); out.splice(Math.round(Math.max(0, at) / Math.max(1, sb.length) * out.length), 0, "\u0000IMG" + j) });
  x.orig ??= { t: x.t, body: x.body, w: x.w }; x.body = out; x.w = out.filter(l => l[0] !== "\u0000").join(" ").split(/\s+/).filter(Boolean).length; x.tr = 1; delete x.trp;
  return true;
}
$("#i_tgo").onclick = async () => {
  if (impTrOn) return; impTrSync();
  if (!PROV.some(p => p.on)) return log("❌ Chưa bật dịch vụ AI nào. Vào mục Dịch chương, mở Cài đặt dịch tự động để thêm key (Gemini có gói miễn phí).");
  const L = IMP.map((x, i) => [x, i]).filter(([x]) => x.on && x.type === "text" && !x.tr);
  if (!L.length) return log(IMP.some(x => x.tr) ? "Các chương đã chọn đều đã dịch xong." : "Hãy chọn ít nhất một chương chữ để dịch.");
  const fast = $("#t_mode").value === "fast", chars = L.reduce((a, [x]) => a + x.body.filter(l => !IMGM.test(l)).join("").length, 0);
  const calls = L.reduce((a, [x]) => a + chunks(trPre(x.body.join("\n")), fast ? 4200 : 2400).length, 0) * ($("#t_pol2").checked ? 2 : 1) + ($("#i_tbr").checked ? L.length : 0) + 1;
  if (!confirm(`Dịch ${L.length} chương (${chars.toLocaleString("vi-VN")} ký tự, khoảng ${calls} lượt gọi AI)?\n\nGiữ trang này mở tới khi xong. Nếu bị gián đoạn, nhập lại đúng file này rồi bấm Dịch các chương đã chọn, phần đã dịch được giữ lại.`)) return;
  trStop = false; impBusy(true); const t0 = Date.now(), brief0 = $("#t_brief").value; let ok = 0, err = null;
  try {
    const LT = IMP.map((x, i) => [x, i]).filter(([x]) => x.on && !x.orig); // tên chương (cả chương minh họa) dịch một lượt
    try { if (LT.length) await impTitles(LT) } catch (e) { log("Chưa dịch được tên chương, giữ tên gốc: " + e.message) }
    impRender();
    for (const [n, [x]] of L.entries()) { if (trStop) break; if (await impTrOne(x, n, L.length, t0)) ok++; impRender() }
  } catch (e) { err = e } finally {
    L.forEach(([x]) => delete x.trp); $("#t_brief").value = brief0; trDraft(); impBusy(false); impRender(); impTrSync();
  }
  const left = L.length - ok;
  if (err) { iProg(`❌ ${err.message} Đã dịch xong ${ok}/${L.length} chương, bấm Dịch các chương đã chọn để dịch tiếp.`); log("❌ " + err.message) }
  else if (left) iProg(`Đã dừng. Xong ${ok}/${L.length} chương, bấm Dịch các chương đã chọn để dịch tiếp.`);
  else { iProg(`✅ Đã dịch xong ${ok} chương trong ${trSec(t0)}. Bấm Xem ở từng chương để đọc soát, rồi bấm Đăng các chương đã chọn.`); log(`✅ Đã dịch ${ok} chương. Nhớ bấm Lưu bảng tên lên repo trong mục Dịch chương nếu muốn giữ bảng tên mới.`) }
};
$("#i_tstop").onclick = () => { trStop = true; iProg("Đang dừng sau khi xong phần đang dịch...") };
$("#i_tundo").onclick = () => { if (impTrOn || !confirm("Bỏ bản dịch của tất cả chương và trở về bản gốc? (Phần đã dịch vẫn được nhớ, bấm Dịch lại sẽ lấy ra ngay.)")) return; IMP.forEach(x => { if (x.orig) { x.t = x.orig.t; x.body = x.orig.body; x.w = x.orig.w; delete x.orig; delete x.tr } }); impRender(); impTrSync(); iProg("") };
$("#i_ser").addEventListener("change", impTrSync);
/* ===== Bộ đồ thêm cho trợ lý Kiku ===== */
function kkoRender() {
  const L = ((data.site || {}).kiku || {}).outfits || [];
  let base = ""; try { base = siteBase() } catch (e) {}
  $("#kko_list").innerHTML = L.length ? L.map((o, i) => `<div class="kkoi"><img src="${esc(base + o.src)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'"><div><b>${esc(o.n)}</b><small>${o.acc ? "Đội được phụ kiện" : "Không đội phụ kiện"}</small></div><button type="button" class="dng sm" data-kkx="${i}">Gỡ</button></div>`).join("") : '<p class="mu">Chưa thêm bộ đồ nào.</p>';
}
$("#kko_list").onclick = e => { const b = e.target.closest("[data-kkx]"); if (!b) return; const L = data.site.kiku.outfits, o = L[+b.dataset.kkx]; if (!o || !confirm(`Gỡ bộ đồ "${o.n}"?`)) return; run(async () => { L.splice(+b.dataset.kkx, 1); await save("Gỡ bộ đồ của trợ lý: " + o.n); kkoRender(); done("✅ Đã gỡ bộ đồ " + o.n) }) };
$("#kko_go").onclick = () => run(async () => {
  const n = $("#kko_n").value.trim(), f = $("#kko_f").files[0];
  if (n.length < 2) throw new Error("Hãy đặt tên cho bộ đồ"); if (!f) throw new Error("Hãy chọn ảnh bộ đồ");
  if (!/png|webp/i.test(f.type)) throw new Error("Ảnh cần là PNG hoặc WebP có nền trong suốt"); if (f.size > 3e6) throw new Error("Ảnh lớn hơn 3 MB, hãy giảm kích thước rồi thử lại");
  let b64 = null, ext = /webp/i.test(f.type) ? "webp" : "png"; const r = await squeeze(f, 576, .9); if (r && r.ext === "webp") { b64 = r.b64; ext = "webp" } if (!b64) b64 = await fileB64(f);
  const id = rid(), path = `img/kiku/c-${(slugify(n) || "bo-do").slice(0, 30)}-${id}.${ext}`; log("Đang tải ảnh bộ đồ lên...");
  await put(path, b64, "Bộ đồ trợ lý: " + n);
  const K = data.site.kiku = { on: true, name: "Kiku", ...(data.site.kiku || {}) }; K.outfits = [...(K.outfits || []), { id, n, src: path, acc: $("#kko_acc").checked }];
  await save("Thêm bộ đồ cho trợ lý: " + n); $("#kko_n").value = ""; $("#kko_f").value = ""; kkoRender();
  done(`✅ Đã thêm bộ đồ "${n}". Người đọc chọn được trong tủ đồ sau 1–2 phút.`);
});
/* ===== Kiểm duyệt bình luận và nhãn dán ===== */
$("#cm_pwgo").onclick = () => run(async () => {
  const pw = $("#cm_pw").value, u = $("#sb_url").value.trim().replace(/\/+$/, ""), k = $("#sb_key").value.trim();
  if (!pw) throw new Error("Hãy nhập mật khẩu kiểm duyệt"); if (!u || !k) throw new Error("Hãy điền Project URL và key Supabase trước");
  const r = await fetch(u + "/rest/v1/rpc/mod_check", { method: "POST", headers: { apikey: k, "Content-Type": "application/json" }, body: JSON.stringify({ p: pw }) });
  if (r.status === 404) throw new Error("Chưa có bình luận trên Supabase. Hãy chạy file binh-luan.sql trước.");
  if (!r.ok) throw new Error("Supabase báo lỗi " + r.status + ". Kiểm tra lại URL và key.");
  if (!(await r.json())) throw new Error("Sai mật khẩu kiểm duyệt, hoặc bạn chưa đặt mật khẩu bằng set_comment_password trong SQL Editor.");
  localStorage.setItem("cmtMod", pw); log("✅ Mật khẩu đúng và đã lưu trên máy này. Trên web bạn sẽ thấy nút kiểm duyệt dưới mỗi bình luận.");
});
$("#cm_pwx").onclick = () => { try { localStorage.removeItem("cmtMod") } catch (e) {} $("#cm_pw").value = ""; log("✅ Đã xóa mật khẩu kiểm duyệt khỏi máy này.") };
const stkOk = p => /^stickers\/[A-Za-z0-9._-]+\.(gif|png|webp|jpg|svg)$/.test(p) || /^https:\/\/cdn\.discordapp\.com\/emojis\/\d{15,21}\.(png|gif|webp)$/.test(p);
const stkG = x => (x.g || "Nhãn dán").trim() || "Nhãn dán";
function stkRender() {
  const L = (data.site.stickers || []).map((x, i) => ({ ...x, i })), G = [...new Set(L.map(stkG))];
  $("#stk_gs").innerHTML = G.map(g => `<option value="${esc(g)}">`).join("");
  $("#stk_list").innerHTML = G.map(g => { const A = L.filter(x => stkG(x) === g); return `<div class="stkh"><b>${esc(g)}</b><small>${A.length} emote</small><button type="button" class="dng sm" data-stgx="${esc(g)}">Gỡ cả bộ</button></div><div class="stkl">${A.map(x => `<div class="stki" title="${esc(x.n || "")}"><img src="${esc(x.p)}" alt="${esc(x.n || "")}" loading="lazy"><button type="button" class="dng" data-stx="${x.i}" title="Gỡ emote" aria-label="Gỡ emote ${esc(x.n || "")}">✕</button></div>`).join("")}</div>` }).join("") || '<p class="mu">Chưa có bộ emote nào. Người đọc vẫn dùng được emoji, kaomoji và GIF.</p>';
}
async function stkAdd(items, msg) { // items: [{n, g, make: async () => ({ p })}]
  const L = data.site.stickers = data.site.stickers || []; let n = 0, k = 0;
  try { for (const it of items) { k++; log(`Đang thêm emote ${k}/${items.length}...`); try { const r = await it.make(); if (r && stkOk(r.p) && !L.some(x => x.p === r.p)) { L.push({ p: r.p, n: it.n, g: it.g }); n++ } } catch (e) { log(`Bỏ qua ${it.n}: ${e.message}`) } } }
  finally { if (n) { await save(msg); stkRender() } }
  return n;
}
$("#stk_in").onchange = e => { const fs = [...e.target.files], g = $("#stk_g").value.trim() || "Nhãn dán"; e.target.value = ""; if (!fs.length) return; run(async () => {
  const n = await stkAdd(fs.map(f => ({ n: (slugify(f.name.replace(/\.[^.]+$/, "")) || "emote").slice(0, 30), g, make: async () => {
    if (f.size > 1.5e6) throw new Error("lớn hơn 1,5 MB");
    let b64 = null, ext = (f.name.split(".").pop() || "png").toLowerCase().replace("jpeg", "jpg"); const r = await squeeze(f, 160, .9); if (r) { b64 = r.b64; ext = r.ext } if (!b64) b64 = await fileB64(f);
    const p = `stickers/${(slugify(f.name.replace(/\.[^.]+$/, "")) || "emote").slice(0, 30)}-${rid()}.${ext}`; await put(p, b64, "Emote: " + f.name); return { p };
  } })), "Thêm emote bình luận");
  done(`✅ Đã thêm ${n} emote vào bộ "${g}". Web cập nhật sau 1–2 phút.`);
}) };
$("#dc_go").onclick = () => run(async () => {
  const t = $("#dc_in").value, g = $("#stk_g").value.trim() || "Discord", seen = new Set(), items = [];
  for (const m of t.matchAll(/<(a?):(\w{2,32}):(\d{15,21})>|https:\/\/(?:cdn|media)\.discordapp\.(?:com|net)\/emojis\/(\d{15,21})\.(png|gif|webp)/g)) {
    const id = m[3] || m[4], anim = m[1] === "a" || m[5] === "gif", nm = m[2] || "emote"; if (seen.has(id)) continue; seen.add(id);
    items.push({ n: nm, g, make: async () => {
      const ext = anim ? "gif" : "png", src = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
      try { const r = await fetch(src + "?size=128&quality=lossless"); if (!r.ok) throw new Error("HTTP " + r.status); const b = await r.blob(); if (b.size > 1.5e6) throw new Error("ảnh quá lớn"); const b64 = await fileB64(b), p = `stickers/dc-${slugify(nm) || "emote"}-${id.slice(-6)}.${ext}`; await put(p, b64, "Emote Discord: " + nm); return { p } }
      catch (e) { return { p: src } } // Không tải về được thì dùng thẳng link Discord
    } });
  }
  if (!items.length) throw new Error("Không thấy mã emote Discord nào. Mã có dạng <:ten:123456789012345678>.");
  const n = await stkAdd(items, "Thêm emote từ Discord"); $("#dc_in").value = "";
  done(`✅ Đã thêm ${n} emote vào bộ "${g}"${n < items.length ? ` (${items.length - n} emote trùng hoặc lỗi đã bỏ qua)` : ""}. Web cập nhật sau 1–2 phút.`);
});
const kemoLoad = () => window.KEMO ? Promise.resolve(window.KEMO) : new Promise((ok, no) => { const s = document.createElement("script"); s.src = "js/emotes.js?v=20261127"; s.onload = () => ok(window.KEMO); s.onerror = () => no(new Error("Không tải được js/emotes.js. Hãy tải file này lên GitHub.")); document.body.appendChild(s) });
$("#kemo_go").onclick = () => run(async () => {
  const n = await stkAdd((await kemoLoad()).map(e => ({ n: e.n, g: "Kenrori", make: async () => { const p = `stickers/kenrori-${e.k}.svg`; await put(p, b64t(e.svg), "Emote Kenrori: " + e.n); return { p } } })), "Thêm bộ emote Kenrori");
  done(n ? `✅ Đã thêm ${n} emote Kenrori. Web cập nhật sau 1–2 phút.` : "✅ Bộ emote Kenrori đã có sẵn.");
});
$("#stk_list").onclick = e => {
  const b = e.target.closest("[data-stx]"), bg = e.target.closest("[data-stgx]");
  if (b) { if (!confirm("Gỡ emote này? Bình luận cũ đã dùng nó sẽ không hiện ảnh nữa.")) return; run(async () => { data.site.stickers.splice(+b.dataset.stx, 1); await save("Gỡ emote bình luận"); stkRender(); done("✅ Đã gỡ emote.") }) }
  if (bg) { const g = bg.dataset.stgx; if (!confirm(`Gỡ cả bộ "${g}"?`)) return; run(async () => { data.site.stickers = data.site.stickers.filter(x => stkG(x) !== g); await save("Gỡ bộ emote: " + g); stkRender(); done(`✅ Đã gỡ bộ "${g}".`) }) }
};
let ve = null;
$("#manage").addEventListener("click", e => {
  const b = e.target.closest("button[data-v]"); if (!b) return; const [k, i] = b.dataset.v.split("|"); ve = { k, i: +i }; const s = data[k][+i];
  $("#v_info").textContent = s.title + " · " + s.chapters.length + " chương"; $("#v_name").value = ""; $("#v_from").value = $("#v_to").value = "";
  vRender(); vcRender(); tab("vol");
});
let vLast = null;
const vols = s => [...new Set(s.chapters.map(c => (c.vol || "").trim()).filter(Boolean))];
const nextVol = s => { const n = vols(s).map(volNum).filter(x => x != null); return "Tập " + ((n.length ? Math.floor(Math.max(...n)) : 0) + 1) };
function vRender(keep) {
  const s = data[ve.k][ve.i], runs = [], open = new Set(keep ? [...document.querySelectorAll("#v_list .vg.open")].map(g => g.dataset.v) : []);
  s.chapters.forEach((c, j) => { const v = (c.vol || "").trim(), r = runs[runs.length - 1]; if (r && r.v === v) r.js.push(j); else runs.push({ v, js: [j] }) });
  const few = s.chapters.length <= 20;
  $("#v_list").innerHTML = runs.map(r => `<div class="vg${(keep ? open.has(r.v) : few || !r.v) ? " open" : ""}${r.v ? "" : " nov"}" data-v="${esc(r.v)}"><div class="vgh"><input type="checkbox" class="vga" aria-label="Chọn cả nhóm"><button type="button" class="vgt"><b>${r.v ? esc(r.v) : "Chưa có tập"}</b><small>${r.js.length} chương, số ${r.js[0] + 1}${r.js.length > 1 ? "–" + (r.js[r.js.length - 1] + 1) : ""}</small></button>${r.v ? `<button type="button" class="sec sm" data-vren="${esc(r.v)}">Đổi tên</button>` : ""}</div><div class="vgb">${r.js.map(j => `<label class="vc"><input type="checkbox" value="${j}"> ${j + 1}. ${esc(s.chapters[j].t)}${s.chapters[j].type === "img" ? ' <small class="mu">(ảnh)</small>' : ""}</label>`).join("")}</div></div>`).join("") || '<p class="mu">Bộ này chưa có chương nào.</p>';
  $("#v_vols").innerHTML = vols(s).map(v => `<option value="${esc(v)}">`).join("");
  $("#v_info").textContent = `${s.title}: ${s.chapters.length} chương, ${vols(s).length} tập`;
  if (!$("#v_name").value.trim()) $("#v_name").value = s.chapters.some(c => !(c.vol || "").trim()) ? nextVol(s) : "";
  vLast = null; vSync();
}
function vSync() {
  let n = 0; document.querySelectorAll("#v_list .vg").forEach(g => { const L = [...g.querySelectorAll(".vgb input")], k = L.filter(c => c.checked).length; n += k; const a = g.querySelector(".vga"); a.checked = k > 0 && k === L.length; a.indeterminate = k > 0 && k < L.length });
  $("#v_cnt").textContent = n ? `Đã chọn ${n} chương` : "Chưa chọn chương nào";
}
const vSel = () => [...document.querySelectorAll("#v_list .vgb input:checked")].map(c => +c.value);
const vbox = f => { document.querySelectorAll("#v_list .vgb input").forEach(c => c.checked = f(+c.value)); document.querySelectorAll("#v_list .vg").forEach(g => { if (g.querySelector(".vgb input:checked")) g.classList.add("open") }); vSync() };
$("#v_none").onclick = () => vbox(() => false);
$("#v_exp").onclick = () => { const L = document.querySelectorAll("#v_list .vg"), all = [...L].every(g => g.classList.contains("open")); L.forEach(g => g.classList.toggle("open", !all)); $("#v_exp").textContent = all ? "Mở hết" : "Thu gọn hết" };
$("#v_range").onclick = () => { const x = +$("#v_from").value, y = +$("#v_to").value || x; if (!x) return log("❌ Nhập số chương bắt đầu"); vbox(j => j + 1 >= x && j + 1 <= y) };
$("#v_list").addEventListener("click", e => {
  const t = e.target.closest(".vgt"); if (t) { t.closest(".vg").classList.toggle("open"); return }
  const rn = e.target.closest("button[data-vren]");
  if (rn) { const s = data[ve.k][ve.i], old = rn.dataset.vren, nw = (prompt(`Đổi tên "${old}" thành:`, old) || "").trim(); if (!nw || nw === old) return;
    run(async () => { s.chapters.forEach(c => { if ((c.vol || "").trim() === old) c.vol = nw }); if (s.vc && s.vc[old]) { s.vc[nw] = s.vc[old]; delete s.vc[old] } await save(`Đổi tên tập: ${s.title} - ${old} thành ${nw}`); vRender(true); vcRender(); done(`✅ Đã đổi tên ${old} thành ${nw}.`) }); return }
  const c = e.target.closest(".vgb input"); if (!c) return;
  const j = +c.value; if (e.shiftKey && vLast != null) { const [a, b] = [Math.min(vLast, j), Math.max(vLast, j)]; document.querySelectorAll("#v_list .vgb input").forEach(x => { const k = +x.value; if (k >= a && k <= b) x.checked = c.checked }) }
  vLast = j; vSync();
});
$("#v_list").addEventListener("change", e => { const a = e.target.closest(".vga"); if (!a) return; a.closest(".vg").querySelectorAll(".vgb input").forEach(c => c.checked = a.checked); vSync() });
$("#v_cancel").onclick = () => { ve = null; manage(); tab("man") };
const vAssign = v => run(async () => {
  if (!ve) throw new Error("Chưa chọn bộ truyện"); const s = data[ve.k][ve.i], sel = vSel();
  if (!sel.length) throw new Error("Hãy chọn ít nhất một chương (tích ô cạnh tên chương hoặc cạnh tên tập)");
  sel.forEach(j => { if (v) s.chapters[j].vol = v; else delete s.chapters[j].vol });
  await save("Gán tập: " + s.title); $("#v_name").value = ""; vRender(true); vcRender(); done(v ? `✅ Đã gán ${sel.length} chương vào ${v}.` : `✅ Đã bỏ ${sel.length} chương ra khỏi tập.`);
});
$("#p-vol").onsubmit = e => { e.preventDefault(); const v = $("#v_name").value.trim(); if (!v) return log("❌ Nhập tên tập, hoặc bấm Bỏ khỏi tập"); vAssign(v) };
$("#v_clear").onclick = () => vAssign("");
function vAutoPlan(L) {
  const seg = []; let prev = null;
  L.forEach((c, j) => {
    let k = chKey(c); if (!k && (c.type === "img" || (c.pages && !c.file && !c.text)) && !/\d/.test(c.t || "")) k = [0, 0];
    let brk = !seg.length;
    if (!brk && k && prev) brk = (k[0] <= 1 && prev[0] >= 2) || (k[0] === 2 && (prev[0] === 3 || prev[0] === 5)) || (k[0] === 2 && prev[0] === 2 && k[1] <= 1 && prev[1] > 1);
    if (brk) seg.push({ js: [] }); seg[seg.length - 1].js.push(j); if (k) prev = k;
  });
  const used = new Set(); seg.forEach((g, n) => { const own = (L[g.js[0]].vol || "").trim(); let name = own && !used.has(own) ? own : "Tập " + (n + 1), x = n + 1; while (used.has(name)) name = "Tập " + (++x); g.name = name; used.add(name) });
  return seg;
}
$("#v_auto").onclick = () => {
  if (!ve) return; const s = data[ve.k][ve.i], seg = vAutoPlan(s.chapters);
  if (!s.chapters.length) return log("❌ Bộ này chưa có chương nào");
  if (seg.length < 2) return log("Không tìm thấy chỗ chuyển tập (không có Minh họa hoặc Mở đầu xen giữa, số chương không quay về 1). Hãy gán tay.");
  const same = seg.every(g => g.js.every(j => (s.chapters[j].vol || "").trim() === g.name));
  if (same) return log("✅ Các chương đã được chia tập đúng như cách tự chia, không cần đổi.");
  const sum = seg.map(g => `${g.name}: chương ${g.js[0] + 1}–${g.js[g.js.length - 1] + 1} (${g.js.length} chương, bắt đầu bằng "${s.chapters[g.js[0]].t.slice(0, 40)}")`).join("\n");
  if (!confirm(`Chia "${s.title}" thành ${seg.length} tập như sau?\n\n${sum}\n\nSau đó vẫn sửa tay hoặc đổi tên tập được.`)) return;
  run(async () => { seg.forEach(g => g.js.forEach(j => s.chapters[j].vol = g.name)); await save("Tự chia tập: " + s.title); $("#v_name").value = ""; vRender(); vcRender(); done(`✅ Đã chia thành ${seg.length} tập.`) });
};

/* ===== Công cụ dịch ===== */
let sessionPin = "", trKey = "", trSlug = null, trTimer = null, trStop = false, trNext = 0;
const IMGL = /^\[img:[^\]\n]*\]$/gm;
const trWords = t => { t = String(t).replace(IMGL, "").trim(); return t ? t.split(/\s+/).length : 0 };
const trGl = () => $("#t_gl").value.split("\n").map(l => l.split("=")).filter(p => p.length >= 2 && p[0].trim()).map(([x, ...y]) => [x.trim(), y.join("=").trim()]);
const trCount = () => { $("#t_sc").textContent = "· " + $("#t_in").value.replace(/\s/g, "").length.toLocaleString("vi-VN") + " ký tự"; $("#t_oc").textContent = "· " + trWords($("#t_out").value).toLocaleString("vi-VN") + " chữ" };
const trBusy = on => document.querySelectorAll(".trb").forEach(b => b.disabled = on);
const trDraft = () => { if (trSlug) ls.set("dr:" + trSlug, JSON.stringify({ t: $("#t_title").value, v: $("#t_vol").value, i: $("#t_in").value, o: $("#t_out").value, b: $("#t_brief").value, p: TRP })) };
function trFill() {
  const cur = $("#t_ser").value;
  $("#t_ser").innerHTML = data.novels.map((s, i) => `<option value="${i}">${esc(s.title)}</option>`).join("") || "<option value=''>(chưa có novel, hãy tạo ở tab Bộ truyện)</option>";
  if (cur && data.novels[+cur]) $("#t_ser").value = cur; trSer();
}
function trSer() {
  if (trSlug) trDraft(); const s = data.novels[+$("#t_ser").value]; trSlug = s ? s.slug : null; if (!s) return;
  let d = {}; try { d = JSON.parse(ls.get("dr:" + s.slug) || "{}") } catch (e) {}
  const vs = [...new Set(s.chapters.map(c => (c.vol || "").trim()).filter(Boolean))]; $("#t_vols").innerHTML = vs.map(v => `<option value="${esc(v)}">`).join("");
  $("#t_title").value = d.t || ""; $("#t_vol").value = d.v ?? (s.chapters.length ? (s.chapters[s.chapters.length - 1].vol || "") : "");
  $("#t_in").value = d.i || ""; $("#t_out").value = d.o || ""; $("#t_brief").value = d.b || ""; $("#t_bw").hidden = !d.b; TRP = d.p && Array.isArray(d.p.parts) ? d.p : { k: "", parts: [] }; $("#t_gl").value = ls.get("gl:" + s.slug) || GL[s.slug] || ""; $("#t_notes").value = ls.get("nt:" + s.slug) ?? (GL[s.slug + "#notes"] || ""); trCount();
  $("#t_prog").textContent = d.i ? "Đã khôi phục bản nháp." : "";
}
$("#t_ser").onchange = () => { trExitRV(); trSer() };
$("#t_gl").addEventListener("input", () => { if (trSlug) ls.set("gl:" + trSlug, $("#t_gl").value) });
$("#t_in").addEventListener("input", () => { if ($("#t_brief").value && !$("#t_in").value.trim()) { $("#t_brief").value = ""; $("#t_bw").hidden = true } });
["t_in", "t_out", "t_title", "t_vol", "t_brief"].forEach(id => $("#" + id).addEventListener("input", () => { trCount(); clearTimeout(trTimer); trTimer = setTimeout(trDraft, 600) }));
const TRSET = ["t_src", "t_genre", "t_dlg", "t_hon", "t_mode", "t_style", "t_bon", "t_pol2"];
(function () { let S = {}; try { S = JSON.parse(ls.get("trset") || "{}") } catch (e) {} if (S.style === "tự nhiên, mượt mà, đúng chất light novel") delete S.style; TRSET.forEach(id => { const k = id.slice(2), el = $("#" + id); if (S[k] == null) return; if (el.type === "checkbox") el.checked = !!S[k]; else el.value = S[k] }) })();
TRSET.forEach(id => $("#" + id).addEventListener("change", () => { const S = {}; TRSET.forEach(x => { const el = $("#" + x); S[x.slice(2)] = el.type === "checkbox" ? el.checked : el.value }); ls.set("trset", JSON.stringify(S)) }));
$("#t_notes").addEventListener("input", () => { if (trSlug) ls.set("nt:" + trSlug, $("#t_notes").value) });
/* ----- Nhiều dịch vụ AI ----- */
const PV = {
  gemini: { n: "Gemini", m: "gemini-3.6-flash", h: "(lấy tại aistudio.google.com/apikey)" },
  anthropic: { n: "Claude", m: "claude-sonnet-5-5", h: "(lấy tại console.anthropic.com)" },
  openai: { n: "OpenAI", m: "gpt-6-luna", h: "(lấy tại platform.openai.com)" },
  groq: { n: "Groq", m: "openai/gpt-oss-120b", h: "(lấy tại console.groq.com)", url: "https://api.groq.com/openai/v1" },
  openrouter: { n: "OpenRouter", m: "openrouter/free", h: "(lấy tại openrouter.ai/keys)" },
  custom: { n: "Tùy chỉnh", m: "", h: "(key của dịch vụ đó; Ollama chạy trên máy thì để trống)" }
};
let PROV = [], pvCool = {}, trLastBy = "";
const pvName = p => `${PV[p.type]?.n || p.type}, ${p.model}`;
/* Gợi ý model; [id, mô tả]. Danh sách miễn phí thay đổi thường xuyên, kiểm tra lại trên trang của nhà cung cấp. */
const PVM = {
  gemini: [["gemini-3.6-flash", "có trong gói miễn phí"], ["gemini-3.8-flash", "có trong gói miễn phí"], ["gemini-2.5-flash", "có trong gói miễn phí"], ["gemini-2.5-flash-lite", "miễn phí, nhẹ, nhanh"]],
  groq: [["openai/gpt-oss-120b", "miễn phí, giới hạn token mỗi ngày"], ["qwen/qwen3.8-27b", "miễn phí"], ["openai/gpt-oss-20b", "miễn phí, nhẹ"]],
  openrouter: [["openrouter/free", "miễn phí, tự chọn ngẫu nhiên một model miễn phí"], ["google/gemma-4-26b-a4b-it:free", "miễn phí"], ["nvidia/nemotron-3-ultra-550b-a55b:free", "miễn phí"]],
  anthropic: [["claude-sonnet-5-5", "trả phí"], ["claude-haiku-5-5", "trả phí, rẻ và nhanh"], ["claude-opus-5-5", "trả phí, mạnh nhất"]],
  openai: [["gpt-6-luna", "trả phí, rẻ"], ["gpt-6.2-sol", "trả phí"]], custom: []
};
const PVF = {
  gemini: "Gói miễn phí không cần thẻ. Lưu ý: Google dùng nội dung gửi qua gói miễn phí để cải thiện sản phẩm (trừ EU, Anh, Thụy Sĩ).",
  groq: "Gói miễn phí không cần thẻ, giới hạn khoảng 30 yêu cầu/phút và theo số token mỗi ngày. Model mã nguồn mở, nên dịch thử để xem tiếng Việt có ổn không.",
  openrouter: "Model có đuôi :free là miễn phí, giới hạn khoảng 20 yêu cầu/phút và 50 yêu cầu/ngày (1.000/ngày nếu tài khoản từng nạp 10 USD). Danh sách model miễn phí thay đổi thường xuyên."
};
async function pvSave() { if (!sessionPin) throw new Error("Hãy đăng nhập lại bằng PIN để lưu dịch vụ"); needHttps(); ls.set("llm2", JSON.stringify(await seal(sessionPin, JSON.stringify(PROV)))); pvCool = {}; pvRender() }
async function trLoadKey() {
  try { const o = JSON.parse(ls.get("llm2") || "null"); if (o && sessionPin) PROV = JSON.parse(await unseal(sessionPin, o)) } catch (e) {}
  if (!PROV.length) { try { const o = JSON.parse(ls.get("gem2") || "null"); if (o && sessionPin) { PROV = [{ type: "gemini", key: await unseal(sessionPin, o), model: ls.get("gmodel") || PV.gemini.m, url: "", on: true }]; await pvSave(); ls.del("gem2") } } catch (e) {} }
  pvRender();
}
function pvRender() {
  $("#pv_list").innerHTML = PROV.map((p, i) => `<div class="li"><input type="checkbox" data-pon="${i}" ${p.on ? "checked" : ""} title="Bật hoặc tắt dịch vụ này"><span class="lt">${i + 1}. ${esc(pvName(p))} <em>${p.key ? "key …" + esc(p.key.slice(-4)) : "không có key"}${p.url ? ", " + esc(p.url) : ""}</em></span><span class="pvs" id="pvs${i}"></span><button type="button" class="sec sm" data-pt="${i}">Kiểm tra</button><button type="button" class="sec sm" data-pm="${i}|-1" title="Ưu tiên lên"${i ? "" : " disabled"}>↑</button><button type="button" class="sec sm" data-pm="${i}|1" title="Ưu tiên xuống"${i < PROV.length - 1 ? "" : " disabled"}>↓</button><button type="button" class="dng sm" data-px="${i}">Xóa</button></div>`).join("") || '<p class="mu">Chưa có dịch vụ nào. Thêm ít nhất một dịch vụ bên dưới để dùng dịch tự động.</p>';
}
const pvTypeUI = () => { const t = $("#pv_type").value; $("#pv_model").value = PV[t].m; $("#pv_models").innerHTML = (PVM[t] || []).map(([id, d]) => `<option value="${esc(id)}">${esc(d)}</option>`).join(""); $("#pv_free").textContent = PVF[t] || ""; $("#pv_model").placeholder = t === "custom" ? "deepseek-chat, llama3.1..." : ""; $("#pv_urlw").hidden = t !== "custom"; $("#pv_hint").textContent = PV[t].h };
$("#pv_type").onchange = pvTypeUI; pvTypeUI();
$("#pv_add").onclick = async () => {
  try {
    const type = $("#pv_type").value, key = $("#pv_key").value.trim(), model = $("#pv_model").value.trim(), url = $("#pv_url").value.trim().replace(/\/+$/, "").replace(/\/chat\/completions$/, "");
    if (!model) throw new Error("Hãy nhập tên model"); if (type !== "custom" && !key) throw new Error("Hãy dán API key");
    if (type === "custom" && !/^https?:\/\//.test(url)) throw new Error("Địa chỉ API phải bắt đầu bằng http:// hoặc https://");
    PROV.push({ type, key, model, url: type === "custom" ? url : "", on: true }); await pvSave(); $("#pv_key").value = "";
    log("✅ Đã thêm " + pvName(PROV[PROV.length - 1]) + ". Bấm Kiểm tra để thử.");
  } catch (e) { log("❌ " + e.message) }
};
$("#pv_list").addEventListener("click", async e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.pt != null) { const i = +b.dataset.pt, st = $("#pvs" + i); st.className = "pvs"; st.textContent = "Đang thử..."; const t0 = Date.now(); try { const r = await callOne(PROV[i], 'Dịch câu sau sang tiếng Việt, chỉ trả về bản dịch: "Good morning, everyone."'); st.className = "pvs ok"; st.textContent = `Hoạt động, ${((Date.now() - t0) / 1000).toFixed(1)}s: ${r.slice(0, 60)}`; st.title = r } catch (err) { st.className = "pvs err"; st.textContent = err.message; st.title = err.message } return }
  try {
    if (b.dataset.px != null) { const i = +b.dataset.px; if (!confirm("Xóa dịch vụ " + pvName(PROV[i]) + "?")) return; PROV.splice(i, 1); await pvSave() }
    else if (b.dataset.pm) { const [i, d] = b.dataset.pm.split("|").map(Number); [PROV[i], PROV[i + d]] = [PROV[i + d], PROV[i]]; await pvSave() }
  } catch (err) { log("❌ " + err.message) }
});
$("#pv_list").addEventListener("change", async e => { const c = e.target.closest("[data-pon]"); if (!c) return; PROV[+c.dataset.pon].on = c.checked; try { await pvSave() } catch (err) { log("❌ " + err.message) } });
class PvErr extends Error { constructor(m, st) { super(m); this.st = st } }
const NOX = new Set(); // dịch vụ không nhận tham số tăng tốc
async function callOne(p, prompt, o = {}) {
  const sys = o.sys || "", stream = !!o.onDelta, xk = p.type + "|" + p.model, extra = !NOX.has(xk); let url, headers = { "Content-Type": "application/json" }, body, pick, dpick, hasX = false;
  if (p.type === "gemini") {
    url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(p.model)}:${stream ? "streamGenerateContent?alt=sse" : "generateContent"}`; headers["x-goog-api-key"] = p.key;
    body = { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4 } }; if (sys) body.systemInstruction = { parts: [{ text: sys }] };
    if (extra && /2\.5-flash/.test(p.model)) { body.generationConfig.thinkingConfig = { thinkingBudget: 0 }; hasX = true } else if (extra && /gemini-3/.test(p.model)) { body.generationConfig.thinkingConfig = { thinkingLevel: "low" }; hasX = true }
    pick = dpick = j => (j.candidates?.[0]?.content?.parts || []).filter(x => !x.thought).map(x => x.text || "").join("");
  } else if (p.type === "anthropic") {
    url = "https://api.anthropic.com/v1/messages"; Object.assign(headers, { "x-api-key": p.key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" });
    body = { model: p.model, max_tokens: 12000, messages: [{ role: "user", content: prompt }] }; if (sys) body.system = sys; if (stream) body.stream = true;
    pick = j => (j.content || []).map(x => x.text || "").join(""); dpick = j => j.type === "content_block_delta" ? j.delta?.text || "" : "";
  } else {
    url = (p.type === "openai" ? "https://api.openai.com/v1" : p.type === "openrouter" ? "https://openrouter.ai/api/v1" : p.type === "groq" ? PV.groq.url : p.url) + "/chat/completions";
    if (p.key) headers.Authorization = "Bearer " + p.key; if (p.type === "openrouter") headers["X-Title"] = "Kenrori";
    body = { model: p.model, messages: [...(sys ? [{ role: "system", content: sys }] : []), { role: "user", content: prompt }] }; if (p.type !== "openai") body.temperature = 0.4; if (stream) body.stream = true;
    if (extra && p.type === "openai" && /^(gpt-5|gpt-6|o\d)/.test(p.model)) { body.reasoning_effort = "low"; hasX = true }
    pick = j => j.choices?.[0]?.message?.content || ""; dpick = j => j.choices?.[0]?.delta?.content || "";
  }
  let r;
  try { r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) }) }
  catch (e) { throw new PvErr("Không kết nối được (mạng, trình chặn quảng cáo, hoặc dịch vụ không cho gọi từ trình duyệt)", 0) }
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    if (r.status === 400 && hasX) { NOX.add(xk); return callOne(p, prompt, o) }
    throw new PvErr((r.status === 401 || r.status === 403 ? "Key sai hoặc không có quyền. " : r.status === 404 ? "Không tìm thấy model, kiểm tra tên model. " : r.status === 429 ? "Hết hạn mức tạm thời. " : "") + (j.error?.message || j.message || (Array.isArray(j) && j[0]?.error?.message) || "Lỗi " + r.status), r.status);
  }
  let t = "";
  if (stream && r.body) {
    const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "";
    try {
      for (;;) {
        const { done, value } = await rd.read(); if (done) break; buf += dec.decode(value, { stream: true }); let n;
        while ((n = buf.indexOf("\n")) >= 0) { const line = buf.slice(0, n).trim(); buf = buf.slice(n + 1); if (!line.startsWith("data:")) continue; const d = line.slice(5).trim(); if (!d || d === "[DONE]") continue; let j; try { j = JSON.parse(d) } catch (e) { continue } if (j.error) throw new PvErr(j.error.message || "Dịch vụ báo lỗi giữa chừng", -2); const x = dpick(j); if (x) { t += x; o.onDelta(t) } }
      }
    } catch (e) { if (e instanceof PvErr) throw e; throw new PvErr("Mất kết nối giữa chừng", 0) }
  } else t = pick(await r.json().catch(() => ({})));
  t = String(t || "").trim(); if (!t) throw new PvErr("Không trả về nội dung (có thể bị bộ lọc nội dung chặn)", -1);
  return t;
}
async function gem(prompt, o = {}) {
  const L = PROV.map((p, i) => [p, i]).filter(([p]) => p.on);
  if (!L.length) throw new Error("Chưa có dịch vụ AI nào đang bật. Mở Cài đặt dịch tự động để thêm.");
  const errs = new Map();
  for (let round = 0; round < 3; round++) {
    for (const [p, i] of L) {
      if ((pvCool[i] || 0) > Date.now()) continue;
      try { const t = await callOne(p, prompt, o); trLastBy = pvName(p); return t }
      catch (e) { errs.set(i, pvName(p) + ": " + e.message); pvCool[i] = Date.now() + (e.st === 429 || e.st >= 500 || e.st === 0 || e.st === -2 ? 60e3 : e.st === -1 ? 0 : 600e3); if (trStop) throw new Error([...errs.values()].join(" | ")) }
    }
    const wait = Math.ceil((Math.min(...L.map(([, i]) => pvCool[i] || 0)) - Date.now()) / 1000);
    if (wait > 90 || trStop || round === 2) break;
    for (let s = Math.max(wait, 1); s > 0 && !trStop; s--) { $("#t_prog").textContent = `Các dịch vụ đang bận hoặc hết hạn mức, thử lại sau ${s}s...`; await new Promise(z => setTimeout(z, 1000)) }
  }
  throw new Error([...errs.values()].join(" | ") || "Tất cả dịch vụ đang tạm khóa, thử lại sau ít phút.");
}
/* ===== Dịch: lời dặn cho AI ===== */
const TRG = {
  auto: ["Tự nhận theo nội dung", "Tự nhận thể loại: bối cảnh cổ đại phương Đông dùng Hán Việt vừa phải; hiện đại hoặc phương Tây dùng thuần Việt."],
  ln: ["Light novel học đường, romcom, đời thường", "Thuần Việt, giọng trẻ trung, câu ngắn, nhịp nhanh, đọc như truyện teen Việt viết hay. Giữ chất châm chọc (tsukkomi) của lời kể. Cảm thán tự nhiên (Hả?, Ơ…, Thôi xong, Trời ạ), không phiên âm kiểu \"Ehh\". Xưng hô gợi ý: bạn bè tớ/cậu hoặc tôi/cậu; bạn thân con trai tao/mày hoặc tôi/ông; người yêu anh/em; hậu bối với senpai em/anh(chị); thầy cô thầy(cô)/em; người kể ngôi thứ nhất thường xưng tôi."],
  isekai: ["Isekai, fantasy", "Thuần Việt, pha Hán Việt cho tước vị và ma pháp khi nghe hay (Ma Vương, Dũng Giả, Thánh Nữ, Công tước). Tên phương Tây viết dạng Latin chuẩn (アリシア → Alicia). Bảng trạng thái, tên skill giữ định dạng. Xưng hô gợi ý: thường dân với quý tộc tôi/ngài; quý tộc kiêu ngạo, ma vương, rồng ta/ngươi; mạo hiểm giả ngang hàng tôi/cậu; hầu gái với chủ tôi(em)/chủ nhân, cậu chủ, tiểu thư; thần linh ta/ngươi."],
  tienhiep: ["Tiên hiệp, huyền huyễn, kiếm hiệp, cổ đại", "Hán Việt cho tên người, địa danh, môn phái, công pháp, cảnh giới, pháp bảo (筑基 → Trúc Cơ, 青云门 → Thanh Vân Môn) và vài từ tạo khí chất (khí tức, linh lực, thần thức, uy áp, sát ý). Câu văn vẫn là tiếng Việt tự nhiên, gọn, dứt khoát khi đánh nhau; không biến cả câu thành Hán Việt. Xưng hô gợi ý: ta/ngươi, tại hạ/đạo hữu, sư huynh/sư đệ/sư tỷ/sư muội, vi sư/đồ nhi, lão phu/tiểu tử, vãn bối/tiền bối, trẫm/khanh. Ngôi ba trong lời kể: hắn (nam, trung tính), nàng (nữ), lão (người già); tránh anh ta, cô ta. Định ngữ đặt sau danh từ, không viết kiểu convert."],
  dothi: ["Đô thị, ngôn tình hiện đại", "Thuần Việt, tên nhân vật Hán Việt. Xưng hô hiện đại anh/em, tôi/cô, tôi/cậu. Nam chính dịu dàng, kể từ góc nhìn nữ chính thì gọi là anh thay vì hắn."],
  litrpg: ["Web novel tiếng Anh (litRPG, hệ thống)", "Thuần Việt; giữ thuật ngữ game người Việt quen dùng (level, HP, MP, buff, debuff, skill, dungeon có thể dịch hầm ngục). Thông báo hệ thống trong [ ] dịch và giữ định dạng."]
};
const TRL = {
  "tiếng Nhật": "Đặc thù tiếng Nhật: chủ ngữ hay bị lược, hãy xác định ai làm gì qua kính ngữ và động từ cho/nhận (くれる: người khác làm cho mình; あげる: mình làm cho người khác; もらう: mình nhận). Đại từ ngôi một là manh mối giọng nhân vật (俺 suồng sã, 僕 hiền, 私 lịch sự, あたし nữ cá tính, わし ông già). Đuôi câu như わ, のよ, ぜ, ぞ, じゃ, っす thể hiện bằng trợ từ cuối câu tiếng Việt (nhé, nha, đấy, cơ, chứ, mà, ạ). Ruby dạng 漢字《よみ》: nếu là cách đọc thì dùng để lấy tên đúng; nếu là chữ khác nghĩa (本気《マジ》) thì dịch theo nghĩa hợp nhất; không để sót 《》. …… thành …, ―― thành — hoặc …, ！？ thành ?!. Tên Nhật viết Romaji Hepburn, không kéo dài nguyên âm (Sato Yuki), tên katakana của người phương Tây chuyển về dạng Latin.",
  "tiếng Trung": "Đặc thù tiếng Trung: tên riêng, địa danh, môn phái chuyển Hán Việt, viết hoa từng âm tiết (林动 → Lâm Động), cẩn thận chữ đa âm và họ kép (欧阳 Âu Dương, 上官 Thượng Quan). Tên phương Tây phiên âm Trung chuyển về dạng Latin gốc. Định ngữ đặt sau danh từ (一个很漂亮的女子 → một cô gái rất đẹp). Không dịch 了/过/着 thành đã/rồi/đang ở mọi chỗ; 被 không phải lúc nào cũng là bị. Từ đệm lặp dày (不禁, 顿时, 微微, 淡淡) dịch đa dạng hoặc bỏ. Bỏ các dòng tác giả xin phiếu, cảm ơn ủng hộ.",
  "tiếng Anh": "Đặc thù tiếng Anh: bỏ đã/đang/sẽ trừ khi cần rõ thời gian; he/she/it mỗi câu thì bỏ bớt hoặc thay bằng tên, ngôi ba hợp bối cảnh; bị động chuyển chủ động; danh từ hóa chuyển thành động từ (His realization… → Mãi sau hắn mới nhận ra…); It was cold → Trời lạnh; thành ngữ, slang dịch bằng cách nói Việt tương đương; câu dài nhiều mệnh đề thì tách. Nếu là bản Anh của truyện Trung: pinyin chuyển Hán Việt, thuật ngữ tu tiên (Foundation Establishment, Golden Core) chuyển Hán Việt (Trúc Cơ, Kim Đan).",
  "tiếng Hàn": "Đặc thù tiếng Hàn: tên người giữ dạng Romanization (Kim Dokja); hyung, noona, sunbae chuyển anh, chị, tiền bối theo quan hệ; kính ngữ là dấu hiệu dùng cặp xưng hô lịch sự."
};
const TRH = { keep3: "giữ -senpai, -sama, -chan khi mang sắc thái; bỏ -san, -kun và thay bằng xưng hô Việt", keep: "giữ nguyên các hậu tố -san, -kun, -chan, -senpai, -sama", drop: "bỏ hết các hậu tố, thay bằng xưng hô Việt" };
const trDlg = () => $("#t_dlg").value === "dash" ? "mỗi lời thoại mở đầu bằng gạch ngang và dấu cách \"– \"; chuyển 「」“” sang quy ước này; thoại và hành động trong cùng một đoạn gốc vẫn giữ trong một đoạn (– Muốn chết! – Hắn nổi giận, vung tay…)" : "lời thoại đặt trong ngoặc kép \"…\"; chuyển 「」“” thành ngoặc kép; 『』 (tên riêng, trích dẫn, giọng qua điện thoại) dùng ngoặc kép bên trong";
function trSys() {
  const src = $("#t_src").value, g = TRG[$("#t_genre").value] || TRG.auto, gl = trGl(), nt = $("#t_notes").value.trim(), br = $("#t_brief").value.trim(), st = $("#t_style").value.trim();
  return `Bạn là dịch giả truyện chuyên nghiệp, dịch ${src} sang tiếng Việt. Bản dịch phải đọc như truyện viết bằng tiếng Việt: đúng nghĩa, đúng giọng nhân vật, nhất quán từ đầu đến cuối.

NGUYÊN TẮC
1. Dịch ý theo câu, không dịch từng chữ. Được đảo trật tự, tách câu dài, gộp câu vụn cho tự nhiên, nhưng không thêm, không bớt ý, không bỏ sót câu nào.
2. Giữ đúng số đoạn: mỗi đoạn gốc thành đúng một đoạn dịch, các đoạn cách nhau một dòng trống.
3. Xưng hô quan trọng nhất: chọn cặp xưng và gọi theo bối cảnh, tuổi, vai vế, mức thân thiết và thái độ trong cảnh; mỗi cặp nhân vật giữ nhất quán (có thể bất đối xứng, ví dụ A gọi B là cậu xưng tôi, B gọi A là anh xưng em). Câu thoại không có chủ ngữ thì suy ra người nói từ ngữ cảnh.
4. Bỏ đại từ thừa. Tránh văn dịch: "một cách + tính từ", "việc" đầu câu, nhiều "của" liên tiếp, "bị/được" thừa, "điều đó", "nó" chỉ sự việc, "đã" ở mọi câu, lặp "anh ấy/cô ấy", lặp dẫn thoại "cô ấy nói", lặp một từ cảm xúc trong cùng đoạn.
5. Từ tượng thanh, tượng hình chuyển thành từ Việt (ドキドキ → thình thịch, ニヤニヤ → cười nham nhở, ぎゅっ → ôm chặt), không phiên âm. Chơi chữ: ưu tiên giữ được cái hay, cái buồn cười.
6. Hội thoại: ${trDlg()}.
7. Câu quá mơ hồ: dịch theo cách hiểu hợp lý nhất và thêm [?] ở cuối câu đó. Dòng có dạng [img:...] là ảnh minh họa: chép lại y nguyên thành một đoạn riêng, không dịch.
${TRL[src] ? "8. " + TRL[src] + "\n" : ""}${/Nhật/.test(src) ? "9. Hậu tố gọi tên tiếng Nhật: " + (TRH[$("#t_hon").value] || TRH.keep3) + ".\n" : ""}
THỂ LOẠI VÀ VĂN PHONG: ${g[1]}${st ? "\nYÊU CẦU THÊM VỀ VĂN PHONG: " + st : ""}
${gl.length ? "\nBẢNG TÊN RIÊNG, BẮT BUỘC DÙNG ĐÚNG:\n" + gl.map(([x, y]) => x + " = " + y).join("\n") + "\n" : ""}${nt ? "\nGHI CHÚ CỦA NGƯỜI DỊCH CHO BỘ NÀY, BẮT BUỘC THEO:\n" + nt + "\n" : ""}${br ? "\nPHÂN TÍCH CHƯƠNG NÀY (nhân vật và xưng hô đã chốt, dùng thống nhất cho mọi phần):\n" + br + "\n" : ""}
Chỉ trả về bản dịch. Không giải thích, không ghi chú, không tiêu đề, không lặp lại bản gốc, không bọc trong dấu \`\`\`.`;
}
const trUser = (txt, ctx) => `${ctx ? `Ngữ cảnh ngay trước (chỉ để giữ mạch văn và xưng hô, KHÔNG dịch lại, KHÔNG đưa vào kết quả):\n"""\n${ctx}\n"""\n\n` : ""}Dịch đoạn sau. Đoạn gốc có ${trParas(txt).length} đoạn văn, bản dịch phải có đúng ${trParas(txt).length} đoạn:\n"""\n${txt}\n"""`;
const trPolishUser = (src, draft) => `Dưới đây là bản gốc và bản dịch nháp. Hãy biên tập bản dịch như một biên tập viên truyện: sửa chỗ sai nghĩa hoặc sót ý so với bản gốc, sửa câu còn mùi văn dịch, thống nhất xưng hô và tên riêng, làm câu mượt, tự nhiên hơn. Giữ đúng số đoạn của bản nháp. Chỉ trả về bản dịch đã biên tập.\n\nBẢN GỐC:\n"""\n${src}\n"""\n\nBẢN DỊCH NHÁP:\n"""\n${draft}\n"""`;
/* Làm sạch bản gốc và kết quả */
const trPre = t => String(t).replace(/\r/g, "").replace(/^[\u3000 \t]+/gm, "").replace(/[|｜](?=[^\n|｜《]{1,20}《)/g, "");
function trClean(t) {
  t = String(t).trim().replace(/^```[\w-]*\s*\n?/, "").replace(/\n?```\s*$/, "").replace(/^(bản dịch|dịch)\s*:\s*\n/i, "");
  t = t.replace(/\u3000/g, " ").replace(/……/g, "…").replace(/！？|！\?|!？/g, "?!").replace(/！/g, "!").replace(/？/g, "?").replace(/：/g, ": ").replace(/；/g, "; ").replace(/，/g, ", ").replace(/（/g, " (").replace(/）/g, ")").replace(/《[\u3040-\u30ffー・]{1,20}》/g, "");
  if ($("#t_dlg").value === "dash") t = t.replace(/^[「“"『]([^\n]*?)[」”"』]$/gm, "– $1");
  else t = t.replace(/[「『]/g, "\"").replace(/[」』]/g, "\"");
  return trParas(t.replace(/[ \t]{2,}/g, " ")).join("\n\n");
}
const chunks = (txt, max = 2400) => { const ps = trParas(txt), out = []; let cur = ""; for (const p of ps) { if (cur && cur.length + p.length > max) { out.push(cur); cur = "" } cur += (cur ? "\n" : "") + p } if (cur) out.push(cur); return out };
const hashS = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) };
let TRP = { k: "", parts: [] };
const trSec = t0 => { const s = Math.round((Date.now() - t0) / 1000); return s < 60 ? s + " giây" : Math.floor(s / 60) + " phút " + (s % 60) + " giây" };
/* Phân tích chương trước khi dịch: nhân vật, xưng hô, thuật ngữ mới */
async function trBrief(src) {
  const gl = trGl(), nt = $("#t_notes").value.trim(), g = TRG[$("#t_genre").value] || TRG.auto;
  const sys = `Bạn là biên tập viên truyện dịch ${$("#t_src").value} sang tiếng Việt. Đọc chương truyện và chuẩn bị ghi chú để dịch nhất quán. Trả lời ngắn gọn, đúng định dạng, dưới 300 chữ, không giải thích thêm.`;
  const user = `${gl.length ? "Bảng tên đã chốt (tên nào có ở đây thì dùng đúng như vậy):\n" + gl.map(([x, y]) => x + " = " + y).join("\n") + "\n\n" : ""}${nt ? "Ghi chú của người dịch:\n" + nt + "\n\n" : ""}Thể loại người dịch chọn: ${g[0]}.\n\nViết ghi chú theo đúng mẫu sau:
Thể loại: <thể loại và văn phong nên dùng>
Giọng kể: <ngôi kể; nếu ngôi thứ nhất thì người kể xưng gì>
Nhân vật:
- <tên gốc> = <tên tiếng Việt> (<giới tính>, <vai trò hoặc quan hệ, rất ngắn>)
Xưng hô:
- <A> → <B>: xưng <...>, gọi <...>
Thuật ngữ mới:
- <từ gốc> = <bản dịch>
Chỉ liệt kê nhân vật có tên và thuật ngữ thật sự có trong chương; không liệt kê đại từ (俺, 私, 他, I, he...). Tên và thuật ngữ đã có trong bảng tên thì không liệt kê lại.

Chương truyện:
"""
${src.slice(0, 14000)}
"""`;
  const t = await gem(user, { sys }); $("#t_brief").value = t.replace(/^```[\w-]*\s*\n?|\n?```\s*$/g, "").trim(); $("#t_bw").hidden = false; trDraft();
}
async function trRun(fresh) {
  const raw = $("#t_in").value; if (!raw.trim()) throw new Error("Hãy dán bản gốc vào ô bên trái");
  const src = trPre(raw), fast = $("#t_mode").value === "fast", cs = chunks(src, fast ? 4200 : 2400), key = hashS(src) + ":" + cs.length + ":" + (fast ? 1 : 0), polish = $("#t_pol2").checked;
  if (fresh || TRP.k !== key || TRP.parts.length !== cs.length) TRP = { k: key, parts: Array(cs.length).fill("") };
  trStop = false; const t0 = Date.now(), out = $("#t_out"), prog = m => $("#t_prog").textContent = m;
  if ($("#t_bon").checked && !$("#t_brief").value.trim()) { prog("Đang đọc trước cả chương để chốt nhân vật, xưng hô và thuật ngữ..."); try { await trBrief(src) } catch (e) { log("Bỏ qua bước phân tích chương: " + e.message) } }
  const sys = trSys(), live = {}, todo = cs.map((_, k) => k).filter(k => !TRP.parts[k]); let raf = 0, err = null;
  const paint = () => { raf = 0; out.value = cs.map((_, k) => TRP.parts[k] || live[k] || "").filter(x => x.trim()).map(x => trParas(x).join("\n\n")).join("\n\n"); out.scrollTop = out.scrollHeight; trCount() };
  const paintSoon = () => { if (!raf) raf = requestAnimationFrame(paint) };
  const doneN = () => TRP.parts.filter(Boolean).length, status = () => prog(`Đang dịch: xong ${doneN()}/${cs.length} phần, ${trSec(t0)}${trLastBy ? ". Dịch vụ: " + trLastBy : ""}`);
  out.readOnly = true; status();
  const worker = async () => {
    while (todo.length && !trStop && !err) {
      const k = todo.shift(), ctx = fast ? (cs[k - 1] ? trParas(cs[k - 1]).slice(-2).join("\n").slice(-600) : "") : (TRP.parts[k - 1] ? trParas(TRP.parts[k - 1]).slice(-3).join("\n").slice(-900) : "");
      try {
        let t = await gem(trUser(cs[k], ctx), { sys, onDelta: s => { live[k] = s; paintSoon() } });
        if (polish && !trStop) { prog(`Đang trau chuốt phần ${k + 1}/${cs.length}...`); try { t = await gem(trPolishUser(cs[k], trClean(t)), { sys, onDelta: s => { live[k] = s; paintSoon() } }) } catch (e) {} }
        TRP.parts[k] = trClean(t); delete live[k]; paintSoon(); trDraft(); status();
      } catch (e) { delete live[k]; err = err || new Error(`Lỗi ở phần ${k + 1}/${cs.length}: ${e.message}`); paintSoon() }
    }
  };
  try { await Promise.all(Array.from({ length: fast ? Math.min(3, todo.length || 1) : 1 }, worker)) } finally { cancelAnimationFrame(raf); paint(); out.readOnly = false; trDraft() }
  const miss = cs.length - doneN();
  if (err) throw new Error(err.message.replace(/[.\s]*$/, ".") + (miss ? ` Còn ${miss} phần chưa dịch, bấm Dịch tiếp để dịch nốt.` : ""));
  if (miss) { prog(`Đã dừng. Xong ${doneN()}/${cs.length} phần, bấm Dịch tiếp để dịch nốt.`); return }
  prog(`✅ Đã dịch xong ${cs.length} phần trong ${trSec(t0)} (dịch vụ cuối: ${trLastBy}). Đọc lại và chỉnh sửa trước khi đăng.`);
}
async function trGo(fresh) { trBusy(true); $("#t_stop").hidden = false; try { await trRun(fresh) } catch (e) { $("#t_prog").textContent = "❌ " + e.message; log("❌ " + e.message) } trBusy(false); $("#t_stop").hidden = true }
$("#t_all").onclick = () => { if ($("#t_out").value.trim() && !confirm("Ô bản dịch đang có nội dung, dịch lại từ đầu sẽ ghi đè. Tiếp tục?")) return; if ($("#t_bon").checked) $("#t_brief").value = ""; trGo(true) };
$("#t_resume").onclick = () => trGo(false);
$("#t_stop").onclick = () => { trStop = true; $("#t_prog").textContent = "Đang dừng sau khi xong các phần đang dịch..." };
$("#t_sel").onclick = async () => {
  const ta = $("#t_in"), sel = trPre(ta.value.slice(ta.selectionStart, ta.selectionEnd)).trim(); if (!sel) return log("Hãy bôi đen đoạn gốc cần dịch ở ô bên trái");
  trBusy(true); try { log("Đang dịch đoạn đã chọn..."); const t = trClean(await gem(trUser(sel, ""), { sys: trSys() })), o = $("#t_out"), p = o.selectionStart ?? o.value.length; o.value = o.value.slice(0, p) + t + o.value.slice(p); trDraft(); trCount(); log("✅ Đã chèn bản dịch tại vị trí con trỏ trong ô bên phải.") } catch (e) { log("❌ " + e.message) } trBusy(false);
};
$("#t_polish").onclick = async () => {
  const o = $("#t_out"), a = o.selectionStart, b = o.selectionEnd, whole = a === b, txt = (whole ? o.value : o.value.slice(a, b)).trim(); if (!txt) return log("Chưa có bản dịch để trau chuốt");
  if (whole && !confirm("Trau chuốt toàn bộ bản dịch? (Muốn trau chuốt một đoạn, bôi đen đoạn đó trong ô bản dịch trước.)")) return;
  trBusy(true); const sys = trSys(), cs = chunks(txt, 3000), res = [];
  try {
    for (let k = 0; k < cs.length; k++) { $("#t_prog").textContent = `Đang trau chuốt ${k + 1}/${cs.length}...`; res.push(trClean(await gem(`Biên tập đoạn dịch tiếng Việt sau cho mượt và tự nhiên như truyện viết bằng tiếng Việt: sửa câu còn mùi văn dịch, lặp từ, xưng hô thiếu nhất quán. Không đổi nghĩa, không thêm hay bớt ý, giữ đúng số đoạn. Chỉ trả về đoạn đã biên tập.\n"""\n${cs[k]}\n"""`, { sys }))) }
    const t = res.join("\n\n"); o.value = whole ? t : o.value.slice(0, a) + t + o.value.slice(b); trDraft(); trCount(); $("#t_prog").textContent = "✅ Đã trau chuốt. Bấm Ctrl+Z trong ô bản dịch nếu muốn quay lại bản cũ."; log("✅ Đã trau chuốt bản dịch.");
  } catch (e) { $("#t_prog").textContent = "❌ " + e.message } trBusy(false);
};
$("#t_bnew").onclick = async () => { const src = trPre($("#t_in").value); if (!src.trim()) return log("Hãy dán bản gốc trước"); trBusy(true); $("#t_prog").textContent = "Đang phân tích chương..."; try { await trBrief(src); $("#t_prog").textContent = "✅ Đã phân tích chương. Sửa lại nếu cần, bản dịch sẽ theo ghi chú này." } catch (e) { $("#t_prog").textContent = "❌ " + e.message } trBusy(false) };
$("#t_badd").onclick = () => {
  const have = new Set(trGl().map(([x]) => x)), add = [];
  let sec = ""; for (const l of $("#t_brief").value.split("\n")) { const h = /^\s*(Nhân vật|Thuật ngữ mới|Xưng hô|Thể loại|Giọng kể)\s*:/i.exec(l); if (h) { sec = h[1].toLowerCase(); continue } if (!/nhân vật|thuật ngữ/.test(sec)) continue; const m = /^\s*[-•*]\s*(.+?)\s*=\s*(.+?)\s*(?:\(.*)?$/.exec(l); if (m && !have.has(m[1]) && m[1] !== m[2] && !/^(tôi|tớ|ta|mình|anh|em|chị|cậu|ngươi|hắn|nàng|cô|nó|họ|bọn họ|chúng ta)$/i.test(m[2])) { have.add(m[1]); add.push(m[1] + " = " + m[2]) } }
  if (!add.length) return log("Không có tên mới nào để thêm (hoặc bảng tên đã có hết).");
  if (!confirm("Thêm vào bảng tên riêng:\n" + add.join("\n"))) return;
  const g = $("#t_gl"); g.value = (g.value.trim() ? g.value.trim() + "\n" : "") + add.join("\n"); if (trSlug) ls.set("gl:" + trSlug, g.value); $("#t_set").open = true; log(`✅ Đã thêm ${add.length} tên vào bảng tên. Nhớ bấm Lưu bảng tên lên repo để dùng ở máy khác.`);
};
$("#t_join").onclick = () => { const sp = /Nhật|Trung|Hàn/.test($("#t_src").value) ? "" : " "; $("#t_in").value = $("#t_in").value.replace(/\r/g, "").replace(/([^\n])\n(?!\n)/g, "$1" + sp); trCount(); trDraft() };
$("#t_apply").onclick = () => { let t = $("#t_out").value; trGl().forEach(([x, y]) => t = t.split(x).join(y)); $("#t_out").value = t; trDraft(); log("✅ Đã áp dụng bảng tên riêng cho bản dịch.") };
$("#t_clear").onclick = () => { if (!confirm("Xóa bản gốc, bản dịch và tên chương đang soạn?")) return; ["t_in", "t_out", "t_title"].forEach(id => $("#" + id).value = ""); TRP = { k: "", parts: [] }; $("#t_brief").value = ""; $("#t_bw").hidden = true; trDraft(); trCount(); $("#t_prog").textContent = "" };
$("#t_pub").onclick = () => run(async () => {
  if (trRV) trSync();
  const s = data.novels[+$("#t_ser").value]; if (!s) throw new Error("Hãy chọn bộ truyện (novel)");
  const t = $("#t_title").value.trim(), text = $("#t_out").value.trim(); if (!t) throw new Error("Hãy nhập tên chương"); if (!text) throw new Error("Chưa có bản dịch để đăng");
  if (!confirm(`Đăng "${t}" (${trWords(text)} chữ) lên bộ "${s.title}"?`)) return;
  const ch = { t, date: $("#t_date").value }, vol = $("#t_vol").value.trim(); if (vol) ch.vol = vol;
  const id = `c${s.chapters.length + 1}_${rid()}`, p = `novels/${s.slug}/${id}.txt`, body = text.split(/\n+/).map(x => x.trim()).filter(Boolean).join("\n");
  log("Đang tải chương lên..."); await put(p, b64t(body), "Chương: " + t); ch.file = p; ch.words = trWords(body);
  if (vol) { const at = s.chapters.map(c => (c.vol || "").trim()).lastIndexOf(vol); if (at >= 0) s.chapters.splice(at + 1, 0, ch); else s.chapters.push(ch) } else s.chapters.push(ch);
  await save("Thêm chương: " + s.title + " - " + t);
  ["t_in", "t_out", "t_title"].forEach(x => $("#" + x).value = ""); TRP = { k: "", parts: [] }; $("#t_brief").value = ""; $("#t_bw").hidden = true; trDraft(); $("#t_prog").textContent = "";
  done("✅ Đã đăng chương. Web cập nhật sau 1–2 phút.");
});

/* ===== Bảng tên trên repo ===== */
let GL = {};
async function glFetch() { const r = await api("glossary.json", { q: "?ref=" + cfg.b }); if (r.status === 404) return {}; if (!r.ok) throw new Error("Không đọc được glossary.json (" + r.status + ")"); return JSON.parse(t64((await r.json()).content)) }
async function glLoad() { try { GL = await glFetch(); if (trSlug && !$("#t_gl").value.trim() && GL[trSlug]) { $("#t_gl").value = GL[trSlug]; ls.set("gl:" + trSlug, GL[trSlug]) } if (trSlug && !$("#t_notes").value.trim() && GL[trSlug + "#notes"]) { $("#t_notes").value = GL[trSlug + "#notes"]; ls.set("nt:" + trSlug, GL[trSlug + "#notes"]) } } catch (e) { GL = {} } }
$("#gl_push").onclick = () => run(async () => {
  if (!trSlug) throw new Error("Hãy chọn bộ truyện"); log("Đang lưu bảng tên lên repo...");
  const cur = await glFetch(), t = $("#t_gl").value, nt = $("#t_notes").value; if (t.trim()) cur[trSlug] = t; else delete cur[trSlug]; if (nt.trim()) cur[trSlug + "#notes"] = nt; else delete cur[trSlug + "#notes"];
  await put("glossary.json", b64t(JSON.stringify(cur, null, 1)), "Bảng tên riêng: " + trSlug); GL = cur; log("✅ Đã lưu bảng tên và ghi chú của bộ này lên repo.");
});
$("#gl_pull").onclick = () => run(async () => {
  if (!trSlug) throw new Error("Hãy chọn bộ truyện"); GL = await glFetch(); const t = GL[trSlug] || "", nt = GL[trSlug + "#notes"] || ""; if (!t && !nt) throw new Error("Repo chưa có bảng tên hay ghi chú cho bộ này");
  if (($("#t_gl").value.trim() || $("#t_notes").value.trim()) && !confirm("Ghi đè bảng tên và ghi chú đang có trên máy này bằng bản trên repo?")) return;
  $("#t_gl").value = t; ls.set("gl:" + trSlug, t); $("#t_notes").value = nt; ls.set("nt:" + trSlug, nt); log("✅ Đã lấy bảng tên và ghi chú từ repo.");
});

/* ===== Chế độ đối chiếu ===== */
let trRV = false, trS = [], trO = [], trTimer2 = null;
const trParas = t => t.replace(/\r/g, "").split(/\n+/).map(x => x.trim()).filter(Boolean);
const trFlag = v => !v.trim() ? "miss" : (/Nhật|Trung|Hàn/.test($("#t_src").value) && /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(v) ? "cjk" : "");
const autosize = t => { t.style.height = "auto"; t.style.height = t.scrollHeight + "px" };
const trSync = () => { $("#t_out").value = trO.filter(x => x && x.trim()).join("\n\n"); trCount(); trDraft() };
function trRender(fresh) {
  trS = trParas($("#t_in").value); if (fresh) trO = trParas($("#t_out").value);
  const n = Math.max(trS.length, trO.length), cnt = trO.filter(x => x && x.trim()).length;
  $("#t_rvs").textContent = trS.length === cnt ? `✅ ${trS.length} đoạn gốc – ${cnt} đoạn dịch (khớp nhau).` : `⚠️ ${trS.length} đoạn gốc – ${cnt} đoạn dịch. Dùng ＋ / − để căn lại cho khớp.`;
  $("#t_rows").innerHTML = Array.from({ length: n }, (_, i) => { const o = trO[i] || ""; return `<div class="rv ${trFlag(o)}"><div class="rn">${i + 1}</div><div class="rs">${esc(trS[i] || "")}</div><div class="ro"><textarea data-i="${i}" rows="2">${esc(o)}</textarea><div class="ra"><button type="button" data-a="re" data-i="${i}" title="Dịch lại đoạn này">↻</button><button type="button" data-a="ins" data-i="${i}" title="Chèn dòng trống phía trên (đẩy bản dịch xuống)">＋</button><button type="button" data-a="del" data-i="${i}" title="Xóa dòng bản dịch này (kéo bản dịch lên)">−</button></div></div></div>` }).join("");
  document.querySelectorAll("#t_rows textarea").forEach(autosize);
}
function trExitRV() { if (trRV) $("#t_view").click() }
$("#t_view").onclick = () => {
  trRV = !trRV; $(".trgrid").hidden = trRV; $("#t_rv").hidden = !trRV; $("#t_view").textContent = trRV ? "✏️ Về soạn thảo" : "👁 Đối chiếu";
  if (trRV) trRender(true); else trSync();
};
$(".trbar").addEventListener("click", e => { const b = e.target.closest("button"); if (b && trRV && b.id !== "t_view" && b.id !== "t_stop") trExitRV() }, true);
$("#t_only").onchange = e => $("#t_rows").classList.toggle("only", e.target.checked);
$("#t_rows").addEventListener("input", e => {
  const ta = e.target.closest("textarea"); if (!ta) return; trO[+ta.dataset.i] = ta.value; autosize(ta);
  clearTimeout(trTimer2); trTimer2 = setTimeout(trSync, 400);
});
$("#t_rows").addEventListener("change", e => { const ta = e.target.closest("textarea"); if (ta) ta.closest(".rv").className = "rv " + trFlag(ta.value) });
$("#t_rows").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return; const i = +b.dataset.i, act = b.dataset.a;
  if (act === "ins") { trO.splice(i, 0, ""); trRender(); trSync() }
  else if (act === "del") { trO.splice(i, 1); trRender(); trSync() }
  else if (act === "re") {
    if (!trS[i]) return log("Dòng này không có bản gốc để dịch lại.");
    b.disabled = true; log("Đang dịch lại đoạn " + (i + 1) + "...");
    try { const t = trParas(trClean(await gem(trUser(trS[i], ""), { sys: trSys() }))).join(" "), ta = $(`#t_rows textarea[data-i="${i}"]`); trO[i] = t; if (ta) { ta.value = t; autosize(ta); ta.closest(".rv").className = "rv " + trFlag(t) } trSync(); log("✅ Đã dịch lại đoạn " + (i + 1) + ".") } catch (err) { log("❌ " + err.message) }
    b.disabled = false;
  }
});

/* ===== Giao diện: tổng quan, xem trước bìa, lọc ===== */
$("#m_q").addEventListener("input", () => manage());
$("#manage").addEventListener("click", e => { if (e.target.closest("summary button")) e.preventDefault() }, true);
function cvPrev(src) { const im = $("#s_prev"); if (src) { im.onerror = () => { im.hidden = true; $("#s_ph").hidden = false }; im.src = src; im.hidden = false; $("#s_ph").hidden = true } else { im.hidden = true; im.removeAttribute("src"); $("#s_ph").hidden = false } }
$("#s_cover").addEventListener("change", e => { const f = e.target.files[0]; cvPrev(f ? URL.createObjectURL(f) : "") });
/* Ô nhập nhiều người (tác giả, họa sĩ): mỗi người một thẻ, lưu lại dạng "A, B" như cũ */
const PSPLIT = /\s*[,、&;]\s*|\s+\/\s+/;
function pChips(src) {
  const box = document.createElement("div"), inp = document.createElement("input"), D = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
  box.className = "pchips"; inp.id = src.id + "_in"; inp.placeholder = "Gõ tên rồi nhấn Enter"; inp.autocomplete = "off";
  src.hidden = true; src.tabIndex = -1; src.after(box);
  const get = () => String(D.get.call(src) || "").split(PSPLIT).map(x => x.trim()).filter(Boolean);
  const put = L => { D.set.call(src, [...new Set(L)].join(", ")); draw() };
  const add = t => { const L = String(t || "").split(PSPLIT).map(x => x.trim()).filter(Boolean); if (L.length) put([...get(), ...L]); inp.value = "" };
  function draw() {
    const L = get(); box.querySelectorAll(".pchip").forEach(x => x.remove());
    L.forEach((n, i) => { const c = document.createElement("span"); c.className = "pchip"; c.innerHTML = `${i ? `<button type="button" class="pmv" title="Đưa lên trước" aria-label="Đưa ${esc(n)} lên trước">‹</button>` : ""}<b>${esc(n)}</b><button type="button" class="px" title="Bỏ người này" aria-label="Bỏ ${esc(n)}">×</button>`;
      c.querySelector(".px").onclick = () => put(get().filter((_, j) => j !== i));
      const mv = c.querySelector(".pmv"); if (mv) mv.onclick = () => { const A = get(); [A[i - 1], A[i]] = [A[i], A[i - 1]]; put(A) };
      box.insertBefore(c, inp) });
    inp.placeholder = L.length ? "Thêm người nữa..." : "Gõ tên rồi nhấn Enter";
  }
  Object.defineProperty(src, "value", { configurable: true, get() { return D.get.call(this) }, set(v) { D.set.call(this, v); draw() } });
  inp.onkeydown = e => { if ((e.key === "Enter" || e.key === ",") && inp.value.trim()) { e.preventDefault(); add(inp.value) } else if (e.key === "Enter") e.preventDefault(); else if (e.key === "Backspace" && !inp.value) { const L = get(); if (L.length) { L.pop(); put(L) } } };
  inp.onblur = () => { if (inp.value.trim()) add(inp.value) };
  inp.onpaste = e => { const t = (e.clipboardData || {}).getData?.("text") || ""; if (PSPLIT.test(t)) { e.preventDefault(); add(t) } };
  box.onclick = e => { if (e.target === box) inp.focus() };
  box.appendChild(inp); src.form?.addEventListener("reset", () => setTimeout(draw));
  draw();
}
document.querySelectorAll(".pchip-src").forEach(pChips);
$("#s_new").onclick = () => { $("#p-series").reset(); cvPrev(""); gChips(); $("#ptitle").textContent = "Bộ truyện"; $("#s_title").focus() };
function goEdit(k, i, j) { $("#m_q").value = ""; manage(); $(`#manage button[data-e="${k}|${i}|${j}"]`)?.click() }
function dash() {
  const el = $("#dash"); if (!el || !data) return;
  const S = [...data.novels.map((s, i) => ["novels", s, i]), ...data.manga.map((s, i) => ["manga", s, i])];
  const nch = S.reduce((a, [, s]) => a + s.chapters.length, 0), nw = data.novels.reduce((a, s) => a + s.chapters.reduce((b, c) => b + (c.words || 0), 0), 0);
  const rec = []; S.forEach(([k, s, i]) => s.chapters.forEach((c, j) => rec.push({ k, s, i, c, j }))); rec.sort((a, b) => (b.c.date || "").localeCompare(a.c.date || "") || b.j - a.j);
  const drafts = []; try { for (let x = 0; x < localStorage.length; x++) { const key = localStorage.key(x); if (!key.startsWith("dr:")) continue; const d = JSON.parse(localStorage.getItem(key) || "{}"); if ((d.i || "").trim() || (d.o || "").trim()) drafts.push({ s: data.novels.find(n => n.slug === key.slice(3)), slug: key.slice(3), d }) } } catch (e) {}
  const qa = [["series", "Thêm bộ truyện mới", "$('#ws_new').click()"], ["chap", "Đăng chương", "tab('ws');wsHome('chap')"], ["tr", "Dịch chương mới", "tab('ws');wsHome('tr')"], ["man", "Quản lý nội dung", "tab('man')"]];
  el.innerHTML = `<div class="dgrid"><div class="dmain"><div class="stats"><div class="stat"><b>${data.novels.filter(s => s.format !== "Web Novel").length}</b><span>Light Novel</span></div><div class="stat"><b>${data.novels.filter(s => s.format === "Web Novel").length}</b><span>Web Novel</span></div><div class="stat"><b>${data.manga.length}</b><span>Manga</span></div><div class="stat"><b>${nch.toLocaleString("vi-VN")}</b><span>Chương đã đăng</span></div><div class="stat"><b>${nw.toLocaleString("vi-VN")}</b><span>Chữ đã dịch</span></div></div>
<h4>Làm nhanh</h4><div class="qa">${qa.map(([k, l, x]) => `<button type="button" onclick="${x}"><svg class="i" viewBox="0 0 24 24">${NI[k]}</svg>${l}</button>`).join("")}</div>
<h4>Bảo trì</h4><div class="acts" style="margin-top:8px"><button type="button" onclick="backupDl()">Tải bản sao lưu</button><button type="button" class="sec" onclick="$('#bk_in').click()">Khôi phục từ bản sao lưu</button><button type="button" class="sec" onclick="regenShare()">Tạo lại trang chia sẻ cho tất cả bộ</button>${/^[a-z0-9-]+$/i.test(data.site?.gc || "") ? `<a class="btnl" href="https://${data.site.gc}.goatcounter.com" target="_blank" rel="noopener">Xem thống kê lượt xem</a>` : ""}</div><p class="mu" style="margin-top:6px">Nên tải bản sao lưu trước những thay đổi lớn như gộp thể loại hay gỡ bộ truyện.</p><p class="mu" style="margin-top:6px">Trang chia sẻ giúp link từng bộ hiện đúng bìa, tên và tóm tắt khi dán lên Discord, Facebook. Bộ mới hoặc vừa sửa được tạo tự động; nút này dùng cho các bộ đăng từ trước.</p>
${drafts.length ? `<h4>Bản dịch đang dở trên máy này</h4><div class="lst">${drafts.map(({ s, slug, d }) => `<div class="li"><span class="lt">${esc(s ? s.title : slug)}${d.t ? ` <em>${esc(d.t)}</em>` : ""}</span><small>${(d.o || "").trim() ? d.o.trim().split(/\s+/).length.toLocaleString("vi-VN") + " chữ" : "chưa dịch"}</small><button type="button" class="sec sm" onclick="openDraft('${esc(slug)}')">Mở</button></div>`).join("")}</div>` : ""}
<h4>Chương mới đăng</h4>${rec.length ? `<div class="lst">${rec.slice(0, 8).map(r => `<div class="li">${thumb(r.s)}<span class="lt">${esc(r.s.title)} <em>${r.c.vol ? esc(r.c.vol) + ", " : ""}${esc(r.c.t)}</em></span><small>${r.c.date || ""}</small><button type="button" class="sec sm" onclick="goEdit('${r.k}',${r.i},${r.j})">Sửa</button></div>`).join("")}</div>` : '<p class="mu">Chưa có chương nào. Tạo bộ truyện rồi đăng chương đầu tiên.</p>'}</div>
<aside class="stp" id="stp" aria-label="Khu Sáng tác"></aside></div>`;
  stPanel();
}
/* ===== Bảng Khu Sáng tác bên phải trang Tổng quan ===== */
let STP = null;
async function stPanel(force) {
  const el = $("#stp"); if (!el) return;
  const sb = data.site?.sb || {}, on = !!data.site?.st, ok = /^https:\/\//.test(sb.url || "") && !!sb.key, pw = localStorage.getItem("cmtMod") || "";
  const site = "index.html", ln = (h, t, c = "") => `<a class="${c}" href="${site}${h}" target="_blank" rel="noopener">${t}</a>`;
  const head = `<div class="stph"><h3>Khu Sáng tác</h3><span class="lc ${on && ok ? "ok" : ""}">${on && ok ? "Đang bật" : "Đang tắt"}</span></div>`;
  if (!ok) { el.innerHTML = head + `<p class="mu">Kết nối Supabase để người đọc tự đăng truyện, bình luận và để bạn quản lý tài khoản tác giả ở đây.</p><button type="button" onclick="tab('site')">Mở Cài đặt trang web</button>`; return }
  const links = `<div class="stpa">${ln("#kiem-duyet/tai-khoan", `<svg class="i" viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M16 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5"/></svg><span>Quản lý tài khoản</span>`)}${ln("#kiem-duyet", `<svg class="i" viewBox="0 0 24 24"><path d="M4 21V4h11l-1 4h6v9h-9l1-4H4"/></svg><span>Báo cáo và truyện bị ẩn</span><b id="stp_rc" hidden></b>`)}${ln("#sang-tac", `<svg class="i" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg><span>Xem khu Sáng tác</span>`)}</div>`;
  const off = on ? "" : `<p class="stpn">Khu Sáng tác đang tắt nên người đọc chưa thấy mục này. <button type="button" class="lnk" onclick="tab('site')">Bật trong Cài đặt</button></p>`;
  if (!pw) { el.innerHTML = head + off + `<div class="stpn"><b>Nhập mật khẩu kiểm duyệt để xem số liệu</b><p>Mật khẩu này cũng cho bạn vào trang quản lý tài khoản mà không cần tài khoản Sáng tác.</p><button type="button" onclick="location.hash='site/mk';deepLink()">Nhập mật khẩu</button></div>` + links; return }
  el.innerHTML = head + off + `<div class="stpg">${'<div class="stpk"><b>…</b><span>&nbsp;</span></div>'.repeat(6)}</div>` + links;
  try {
    if (!STP || force) {
      const r = await fetch(sb.url.replace(/\/+$/, "") + "/rest/v1/rpc/st_admin", { method: "POST", headers: { apikey: sb.key, "Content-Type": "application/json" }, body: JSON.stringify({ p: pw, act: "summary", a: {} }) });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(r.status === 404 ? "Máy chủ chưa có hàm st_admin. Hãy chạy lại supabase-setup.sql mới." : (j && j.message) || "Supabase báo lỗi " + r.status);
      STP = j;
    }
    const S = STP, n = x => (+x || 0).toLocaleString("vi-VN"), ago = t => { const d = (Date.now() - new Date(t)) / 864e5; return d < 1 / 24 ? "vừa xong" : d < 1 ? Math.floor(d * 24) + " giờ trước" : d < 2 ? "hôm qua" : Math.floor(d) + " ngày trước" };
    const K = [["users", "Tài khoản", S.new7 ? `+${n(S.new7)} trong 7 ngày` : ""], ["writers", "Tác giả", ""], ["published", "Truyện công khai", S.works > S.published ? `${n(S.works - S.published)} nháp hoặc bị ẩn` : ""], ["chapters", "Chương", ""], ["reports", "Báo cáo chờ xử lý", "", S.reports > 0], ["banned", "Tài khoản bị khóa", ""]];
    el.querySelector(".stpg").outerHTML = `<div class="stpg">${K.map(([k, l, sub, hot]) => `<div class="stpk${hot ? " hot" : ""}"><b>${n(S[k])}</b><span>${l}</span>${sub ? `<small>${sub}</small>` : ""}</div>`).join("")}</div>`
      + (S.open && S.open.length ? `<h4>Cần xử lý</h4><div class="stpl">${S.open.map(r => `<a class="stpr" href="${site}#kiem-duyet" target="_blank" rel="noopener"><b>${esc(r.work || "Truyện đã bị xóa")}</b><span>${esc(r.reason)}</span><small>${ago(r.created_at)}</small></a>`).join("")}</div>` : `<p class="stpok">Không có báo cáo nào đang chờ.</p>`)
      + (S.recent && S.recent.length ? `<h4>Truyện mới cập nhật</h4><div class="stpl">${S.recent.map(w => `<a class="stpw" href="${site}#st/${esc(w.id)}" target="_blank" rel="noopener"><span class="stpc">${/^https:\/\//.test(w.cover_url || "") ? `<img src="${esc(w.cover_url)}" alt="" loading="lazy">` : ""}</span><span class="stpt"><b>${esc(w.title)}</b><small>${esc(w.author)}, ${ago(w.updated_at)}</small></span>${w.hidden ? '<em class="bad">Bị ẩn</em>' : w.visibility !== "published" ? "<em>Nháp</em>" : ""}</a>`).join("")}</div>` : "");
    const rc = $("#stp_rc"); if (rc && S.reports > 0) { rc.hidden = false; rc.textContent = S.reports }
    el.insertAdjacentHTML("beforeend", `<button type="button" class="lnk stpre" onclick="stPanel(true)">Tải lại số liệu</button>`);
  } catch (e) { el.querySelector(".stpg").outerHTML = `<p class="stpn err">${esc(/mật khẩu|kiểm duyệt/i.test(e.message) ? "Mật khẩu kiểm duyệt lưu trên máy này không còn đúng. Hãy nhập lại trong Cài đặt." : e.message)}</p>` }
}
function openDraft(slug) { const i = data.novels.findIndex(n => n.slug === slug); if (i < 0) return log("Bộ của bản nháp này không còn trên web."); WS.k = "novels"; WS.i = i; WS.W = null; WS.dirty = false; RET = "ws"; tab("tr"); trFill(); $("#t_ser").value = i; $("#t_ser").dispatchEvent(new Event("change")) }

/* ===== Bìa từng tập ===== */
function vcRender() {
  if (!ve) return; const s = data[ve.k][ve.i], vols = [...new Set(s.chapters.map(c => (c.vol || "").trim()).filter(Boolean))], vc = s.vc || {};
  $("#vc_vol").innerHTML = vols.map(v => `<option>${esc(v)}</option>`).join("") || "<option value=''>(chưa có tập nào, hãy gán chương vào tập trước)</option>";
  $("#vc_list").innerHTML = Object.entries(vc).map(([v, p]) => `<div class="vci"><img src="${esc(p)}" alt="" onerror="this.style.visibility='hidden'">${esc(v)}<br><button type="button" class="dng sm" data-vcx="${esc(v)}">Gỡ</button></div>`).join("") || '<p class="mu" style="margin:0">Chưa có bìa tập nào.</p>';
}
$("#vc_save").onclick = () => run(async () => {
  if (!ve) throw new Error("Chưa chọn bộ truyện"); const s = data[ve.k][ve.i], v = $("#vc_vol").value, f = $("#vc_file").files[0];
  if (!v) throw new Error("Bộ này chưa có tập nào. Gán chương vào tập trước."); if (!f) throw new Error("Hãy chọn ảnh bìa tập");
  log("Đang tải bìa tập..."); const p = `images/${s.slug}-${slugify(v) || "tap"}-${rid()}.jpg`; await put(p, await resize(f), "Bìa " + v + ": " + s.title);
  s.vc = { ...(s.vc || {}), [v]: p }; await save("Bìa tập: " + s.title + " - " + v); $("#vc_file").value = ""; vcRender(); done("✅ Đã lưu bìa " + v + ".");
});
$("#vc_list").onclick = e => { const b = e.target.closest("button[data-vcx]"); if (!b || !ve) return; const s = data[ve.k][ve.i], v = b.dataset.vcx; if (!confirm("Gỡ bìa " + v + "?")) return; run(async () => { delete s.vc[v]; await save("Gỡ bìa tập: " + s.title + " - " + v); vcRender(); done("✅ Đã gỡ bìa " + v + ".") }) };
/* ===== Công cụ thể loại ===== */
function gRender() {
  const m = new Map(); ["novels", "manga"].forEach(k => data[k].forEach(s => (s.genres || []).forEach(g => m.set(g, (m.get(g) || 0) + 1))));
  $("#g_list").innerHTML = [...m].sort((a, b) => a[0].localeCompare(b[0], "vi")).map(([g, n]) => `<div class="gt"><b>${esc(g)}</b><small>${n} bộ</small><input data-gold="${esc(g)}" placeholder="Tên mới" list="g_all"><span style="display:flex;gap:6px"><button type="button" class="sec sm" data-gren="${esc(g)}">Đổi tên</button><button type="button" class="dng sm" data-gdel="${esc(g)}">Gỡ</button></span></div>`).join("") + `<datalist id="g_all">${[...m.keys()].map(g => `<option value="${esc(g)}">`).join("")}</datalist>` || '<p class="mu">Chưa có thể loại nào.</p>';
}
$("#g_list").onclick = e => {
  const r = e.target.closest("button[data-gren]"), d = e.target.closest("button[data-gdel]"); if (!r && !d) return;
  const old = (r || d).dataset[r ? "gren" : "gdel"], nw = r ? (document.querySelector(`#g_list input[data-gold="${CSS.escape(old)}"]`)?.value || "").trim() : "";
  if (r && !nw) return log("❌ Hãy gõ tên mới cho thể loại " + old);
  if (!confirm(r ? `Đổi "${old}" thành "${nw}" ở tất cả các bộ?` : `Gỡ thể loại "${old}" khỏi tất cả các bộ?`)) return;
  run(async () => {
    let c = 0; ["novels", "manga"].forEach(k => data[k].forEach(s => { if (!(s.genres || []).includes(old)) return; c++; s.genres = [...new Set(s.genres.map(g => g === old ? nw : g).filter(Boolean))] }));
    await save(r ? `Đổi thể loại ${old} thành ${nw}` : `Gỡ thể loại ${old}`); done(`✅ Đã cập nhật ${c} bộ.`);
  });
};

/* ===== Nén ảnh manga ===== */
async function squeeze(f, maxW = 1400, q = .82) {
  if (/gif/i.test(f.type)) return null;
  try {
    const bm = await createImageBitmap(f), k = Math.min(1, maxW / bm.width), w = Math.round(bm.width * k), h = Math.round(bm.height * k);
    if (h > 16000 || w * h > 40e6) { bm.close?.(); return null }
    const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(bm, 0, 0, w, h); bm.close?.();
    const toB = t => new Promise(r => c.toBlob(r, t, q));
    let b = await toB("image/webp"), ext = "webp"; if (!b || b.type !== "image/webp") { b = await toB("image/jpeg"); ext = "jpg" }
    if (!b || b.size >= f.size * .95) return null;
    const b64 = await new Promise(r => { const x = new FileReader(); x.onload = () => r(x.result.split(",")[1]); x.readAsDataURL(b) });
    return { b64, ext, size: b.size };
  } catch (e) { return null }
}
function regenShare() { run(async () => { const n = await writeAllShare(); done(`✅ Đã tạo trang chia sẻ cho ${n} bộ và cập nhật sitemap.`) }) }

/* ===== Sửa ảnh trong chương ảnh ===== */
let EI = [];
const pagesOf = c => c.pages || (c.n ? Array.from({ length: c.n }, (_, k) => c.dir + String(k + 1).padStart(c.pad || 2, "0") + "." + (c.ext || "jpg")) : []);
function eiRender() {
  $("#e_imgs").innerHTML = EI.map((x, j) => `<div class="ei${x.f ? " new" : ""}"><img src="${esc(x.u || x.p)}" alt="" loading="lazy">${j + 1}${x.f ? ", mới" : ""}<div><button type="button" class="sm sec" data-eim="${j}|-1" title="Lên trước"${j ? "" : " disabled"}>←</button><button type="button" class="sm sec" data-eim="${j}|1" title="Ra sau"${j < EI.length - 1 ? "" : " disabled"}>→</button><button type="button" class="sm dng" data-eix="${j}" title="Bỏ ảnh">✕</button></div></div>`).join("") || '<p class="mu" style="margin:0">Chương chưa có ảnh nào.</p>';
}
$("#e_imgs").onclick = e => {
  const m = e.target.closest("button[data-eim]"), x = e.target.closest("button[data-eix]");
  if (m) { const [j, d] = m.dataset.eim.split("|").map(Number); [EI[j], EI[j + d]] = [EI[j + d], EI[j]]; eiRender() }
  else if (x) { const j = +x.dataset.eix; if (EI[j].u) URL.revokeObjectURL(EI[j].u); EI.splice(j, 1); eiRender() }
};
$("#e_add").onchange = e => { [...e.target.files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).forEach(f => EI.push({ f, u: URL.createObjectURL(f) })); e.target.value = ""; eiRender() };

/* ===== Xem trước chương ===== */
/* ===== Chèn ảnh minh họa vào giữa chương chữ ===== */
const IMGC = {}; // ảnh vừa tải lên, để xem trước ngay khi GitHub Pages chưa cập nhật
function insSlug(id) { if (id === "t_out") return trSlug; if (id === "e_text") return ed ? data[ed.k][ed.i].slug : null; const [k, i] = $("#c_ser").value.split("|"); return data[KEYS[k]]?.[i]?.slug }
document.addEventListener("click", e => {
  const b = e.target.closest("[data-insimg]"); if (!b) return; const ta = $("#" + b.dataset.insimg), slug = insSlug(b.dataset.insimg);
  if (!slug) return log("❌ Hãy chọn bộ truyện trước"); const pos = ta.selectionStart ?? ta.value.length;
  const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.multiple = true;
  inp.onchange = () => { const fs = [...inp.files].sort((a, c) => a.name.localeCompare(c.name, undefined, { numeric: true })); if (!fs.length) return; run(async () => {
    const lines = [];
    for (let j = 0; j < fs.length; j++) { log(`Đang tải ảnh ${j + 1}/${fs.length}...`); const f = fs[j]; let b64 = null, ext = (f.name.split(".").pop() || "jpg").toLowerCase().replace("jpeg", "jpg"); const r = await squeeze(f); if (r) { b64 = r.b64; ext = r.ext } if (!b64) b64 = await fileB64(f); const p = `novels/${slug}/img/${rid()}.${ext}`; await put(p, b64, "Ảnh minh họa trong chương"); IMGC[p] = URL.createObjectURL(f); lines.push(`[img:${p}]`) }
    const pre = ta.value.slice(0, pos), post = ta.value.slice(pos), ins = (pre && !/\n$/.test(pre) ? "\n" : "") + lines.join("\n") + (post && !/^\n/.test(post) ? "\n" : "");
    ta.value = pre + ins + post; ta.dispatchEvent(new Event("input", { bubbles: true })); ta.focus(); ta.setSelectionRange(pos + ins.length, pos + ins.length);
    log(`✅ Đã chèn ${lines.length} ảnh. Bấm Xem trước để xem, nhớ lưu hoặc đăng chương để giữ thay đổi.`);
  }) };
  inp.click();
});
function preview({ title, vol, text, imgs }) {
  let body, info, note = "";
  if (imgs) { body = `<div class="pvg">${imgs.map(u => `<img src="${esc(u)}" alt="">`).join("")}</div>`; info = imgs.length + " ảnh"; if (!imgs.length) note = "Chưa có ảnh nào." }
  else {
    const ps = String(text || "").normalize("NFC").split(/\n+/).map(x => x.trim()).filter(Boolean), w = ps.join(" ").split(/\s+/).filter(Boolean).length;
    const im = x => /^\[img:\s*([^\]|]+?)\s*(?:\|\s*([^\]]*))?\]$/.exec(x), ni = ps.filter(im).length;
    body = `<div class="pvt">${ps.map(x => { const m = im(x); return m ? `<figure><img src="${esc(IMGC[m[1]] || m[1])}" alt="">${m[2] ? `<figcaption>${esc(m[2])}</figcaption>` : ""}</figure>` : `<p>${esc(x)}</p>` }).join("") || '<p class="mu">Chưa có nội dung.</p>'}</div>`; info = `${trWords(ps.join("\n")).toLocaleString("vi-VN")} chữ, ${ps.length - ni} đoạn${ni ? `, ${ni} ảnh` : ""}`;
    if (ps.length === 1 && w > 300) note = "Cả chương chỉ có một đoạn, có thể bị mất xuống dòng.";
    else if (ps.some(x => x.length > 2000)) note = "Có đoạn rất dài, có thể bị dính nhiều đoạn vào nhau.";
    else if (/[぀-ヿ一-鿿]/.test(ps.join(""))) note = "Còn sót chữ Nhật hoặc Trung trong nội dung.";
  }
  $("#pv_c").innerHTML = `<div class="pvhd">${vol ? `<div class="pvv">${esc(vol)}</div>` : ""}<h1>${esc(title || "Chưa có tên chương")}</h1><p class="mu">${info}</p></div>${body}`;
  $("#pv_note").textContent = note; $("#pvw").hidden = false; $("#pv_c").scrollTop = 0;
}
const pvClose = () => { $("#pvw").hidden = true };
$("#pv_x").onclick = pvClose; $("#pvw").onclick = e => { if (e.target.id === "pvw") pvClose() };
addEventListener("keydown", e => { if (e.key === "Escape" && !$("#pvw").hidden) pvClose() });
$("#c_pv").onclick = async () => {
  const [kind] = $("#c_ser").value.split("|"), img = kind === "manga" || cType() === "img", t = $("#c_title").value.trim() || (img && kind === "novel" ? "Minh họa" : ""), vol = $("#c_vol").value.trim();
  if (img) return preview({ title: t, vol, imgs: [...$("#c_imgs").files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(f => URL.createObjectURL(f)) });
  let text = $("#c_text").value; const f = $("#c_file").files[0]; if (!text.trim() && f) text = await f.text(); preview({ title: t, vol, text });
};
$("#e_pv").onclick = () => { const vol = $("#e_vol").value.trim(), t = $("#e_title").value.trim(); if (!$("#e_imgw").hidden) preview({ title: t, vol, imgs: EI.map(x => x.u || x.p) }); else preview({ title: t, vol, text: $("#e_text").value }) };
$("#t_pv").onclick = () => { if (trRV) trSync(); preview({ title: $("#t_title").value.trim(), vol: $("#t_vol").value.trim(), text: $("#t_out").value }) };

/* ===== Sao lưu và khôi phục ===== */
async function backupDl() {
  let gl = {}; try { gl = await glFetch() } catch (e) {}
  const b = { app: "kenrori", at: new Date().toISOString(), data, glossary: gl }, a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(b, null, 1)], { type: "application/json" })); a.download = `kenrori-sao-luu-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); log("✅ Đã tải bản sao lưu.");
}
$("#bk_in").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  let b; try { b = JSON.parse(await f.text()) } catch (err) { return log("❌ File không phải bản sao lưu hợp lệ") }
  const d = b && b.data && Array.isArray(b.data.novels) ? b.data : b && Array.isArray(b.novels) ? b : null; if (!d) return log("❌ File không có dữ liệu truyện");
  const cnt = (d.novels || []).length + (d.manga || []).length;
  if (!confirm(`Khôi phục bản sao lưu${b.at ? " ngày " + b.at.slice(0, 10) : ""} (${cnt} bộ truyện)?\nDữ liệu hiện tại trên web sẽ bị thay thế. Nên tải bản sao lưu hiện tại trước.`)) return;
  run(async () => {
    data = d; for (const k of ["tips", "links", "novels", "manga", "videos", "projects"]) data[k] ??= []; data.site ??= {};
    await save("Khôi phục từ bản sao lưu");
    if (b.glossary && Object.keys(b.glossary).length) { await put("glossary.json", b64t(JSON.stringify(b.glossary, null, 1)), "Khôi phục bảng tên"); GL = b.glossary }
    siteLoad(); done(`✅ Đã khôi phục ${cnt} bộ truyện. Web cập nhật sau 1–2 phút.`);
  });
};

/* ===== Nhập cả bộ từ file ===== */
let IMP = [], IMPINFO = "";
function impFill() { const cur = $("#i_ser").value; $("#i_ser").innerHTML = data.novels.map((s, i) => `<option value="${i}">${esc(s.title)}</option>`).join("") || "<option value=''>(chưa có novel, hãy tạo ở mục Bộ truyện)</option>"; if (cur && data.novels[+cur]) $("#i_ser").value = cur; if (!$("#i_date").value) $("#i_date").value = new Date().toISOString().slice(0, 10) }
const rxq = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const NUMKW = /^(chương|chapter|chap|ch|hồi|phần|episode|tập|volume|vol|quyển)$/i;
function loadMammoth() { return window.mammoth ? Promise.resolve() : new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.13.0/mammoth.browser.min.js"; sc.onload = res; sc.onerror = () => rej(new Error("Không tải được thư viện đọc file Word. Kiểm tra mạng rồi thử lại.")); document.head.appendChild(sc) }) }
const linesToBlocks = t => String(t).replace(/\r/g, "").normalize("NFC").split("\n").map(l => l.trim()).filter(Boolean).map(l => { const m = /^(#{1,6})\s+(.+)$/.exec(l); return m ? { h: m[1].length, t: m[2].trim() } : { h: 0, t: l } });
/* ----- EPUB: đọc theo mục lục, mỗi mục là một chương, giữ đoạn văn và ảnh minh họa ----- */
const EBLK = /^(p|div|h[1-6]|li|blockquote|section|article|figure|figcaption|pre|dd|dt|tr|td|aside|header|footer|center|table|tbody|thead|ul|ol|dl|main|nav|body|hr)$/i;
const IMIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" };
const nTxt = s => String(s || "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
async function epubBlocks(f) {
  log("Đang đọc " + f.name + "...");
  const Z = await unzipFile(f), M = new Map(Z.map(x => [x.name.replace(/^\/+/, ""), x.d])), td = new TextDecoder();
  const txt = p => { const d = M.get(p); return d ? td.decode(d) : "" };
  const xml = (s, t = "application/xml") => new DOMParser().parseFromString(s, t);
  const dir = p => p.includes("/") ? p.slice(0, p.lastIndexOf("/") + 1) : "";
  const res = (b, h) => { try { return decodeURIComponent(new URL(h, "https://e/" + b).pathname.slice(1)) } catch (e) { return "" } };
  const opfP = (xml(txt("META-INF/container.xml")).querySelector("rootfile") || { getAttribute: () => "" }).getAttribute("full-path");
  if (!opfP || !M.has(opfP)) throw new Error(f.name + " không phải file EPUB hợp lệ");
  const opf = xml(txt(opfP)), man = {};
  opf.querySelectorAll("manifest > item").forEach(i => { man[i.getAttribute("id")] = { href: res(dir(opfP), i.getAttribute("href") || ""), type: i.getAttribute("media-type") || "", props: i.getAttribute("properties") || "" } });
  // Mục lục: EPUB 3 (nav) hoặc EPUB 2 (toc.ncx)
  const toc = {}, addToc = (b, h, t) => { const k = res(b, h).split("#")[0]; t = String(t || "").replace(/\s+/g, " ").trim(); if (k && t && !toc[k]) toc[k] = t };
  const nav = Object.values(man).find(i => /\bnav\b/.test(i.props));
  if (nav) { const d = xml(txt(nav.href), "application/xhtml+xml"), ns = [...d.getElementsByTagName("nav")], n = ns.find(x => /toc/.test(x.getAttribute("epub:type") || x.getAttribute("type") || "")) || ns[0]; if (n) [...n.getElementsByTagName("a")].forEach(a => a.getAttribute("href") && addToc(dir(nav.href), a.getAttribute("href"), a.textContent)) }
  if (!Object.keys(toc).length) { const sp = opf.querySelector("spine"), nx = sp && man[sp.getAttribute("toc")]; if (nx) { const d = xml(txt(nx.href)); [...d.getElementsByTagName("navPoint")].forEach(p => { const c = p.getElementsByTagName("content")[0], l = p.getElementsByTagName("text")[0]; if (c && l) addToc(dir(nx.href), c.getAttribute("src") || "", l.textContent) }) } }
  const spine = [...opf.querySelectorAll("spine > itemref")].map(r => man[r.getAttribute("idref")]).filter(i => i && /html/.test(i.type) && !/\bnav\b/.test(i.props));
  const out = [];
  for (const it of spine) {
    const s = txt(it.href); if (!s) continue;
    let d = xml(s, "application/xhtml+xml"); if (d.getElementsByTagName("parsererror").length) d = xml(s, "text/html");
    const body = d.getElementsByTagName("body")[0] || d.documentElement;
    [...body.querySelectorAll("rt, rp, script, style")].forEach(x => x.remove()); // bỏ chữ phiên âm furigana
    const B = [];
    const pushImg = im => { const src = im.getAttribute("src") || im.getAttribute("xlink:href") || im.getAttribute("href") || "", p = res(dir(it.href), src), dd = M.get(p), mt = IMIME[(p.split(".").pop() || "").toLowerCase()]; if (dd && mt) B.push({ img: `data:${mt};base64,${u8b64(dd)}` }) };
    const walk = el => {
      for (const n of [...el.childNodes]) {
        if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, " ").trim(); if (t && el === body) B.push({ h: 0, t: t.normalize("NFC") }); continue }
        if (n.nodeType !== 1) continue;
        const tg = n.localName.toLowerCase();
        if (tg === "img" || tg === "image") { pushImg(n); continue }
        if (tg === "svg") { [...n.getElementsByTagName("image")].forEach(pushImg); continue }
        if (tg === "br" || tg === "hr") continue;
        if ([...n.children].some(c => EBLK.test(c.localName))) { walk(n); continue }
        [...n.querySelectorAll("img, image")].forEach(pushImg);
        const c = n.cloneNode(true); [...c.querySelectorAll("br")].forEach(b => b.replaceWith("\n"));
        const hm = /^h([1-6])$/.exec(tg);
        c.textContent.split("\n").map(x => x.replace(/\s+/g, " ").trim()).filter(Boolean).forEach(x => B.push({ h: hm ? +hm[1] : 0, t: x.normalize("NFC") }));
      }
    };
    walk(body);
    const tt = toc[it.href]; let head = null;
    if (tt) { const i0 = B.findIndex(b => !b.img); if (i0 >= 0 && i0 < 4 && (B[i0].h || nTxt(B[i0].t) === nTxt(tt))) B.splice(i0, 1); head = { h: 1, t: tt.normalize("NFC") } }
    else { const i0 = B.findIndex(b => !b.img); if (i0 >= 0 && B[i0].h) { head = { h: 1, t: B[i0].t }; B.splice(i0, 1) } }
    B.forEach(b => { if (b.h) b.h = 0 });
    if (head) out.push(head); out.push(...B);
  }
  out.title = ((opf.getElementsByTagName("dc:title")[0] || opf.querySelector("metadata title") || {}).textContent || "").trim();
  if (!out.some(b => !b.img)) throw new Error(f.name + ": không tìm thấy chữ trong EPUB");
  return out;
}
/* ----- PDF: lấy chữ theo dòng rồi ghép lại thành đoạn, bỏ số trang và dòng lặp đầu/cuối trang ----- */
const PDFJS = "https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/legacy/build/";
let pdfP = null;
const loadPdf = () => pdfP ??= import(PDFJS + "pdf.min.mjs").then(m => { m.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.mjs"; return m }).catch(e => { pdfP = null; throw new Error("Không tải được thư viện đọc PDF. Kiểm tra mạng rồi thử lại.") });
const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const med = a => { const b = [...a].sort((x, y) => x - y); return b.length ? b[b.length >> 1] : 0 };
async function pdfBlocks(f) {
  log("Đang đọc " + f.name + "..."); const lib = await loadPdf();
  const doc = await lib.getDocument({ data: new Uint8Array(await f.arrayBuffer()), isEvalSupported: false }).promise, P = [];
  for (let i = 1; i <= doc.numPages; i++) {
    if (i % 20 === 1 && doc.numPages > 20) log(`Đang đọc ${f.name}: trang ${i}/${doc.numPages}...`);
    const pg = await doc.getPage(i), tc = await pg.getTextContent(), L = [];
    for (const it of tc.items) {
      if (!it.str) continue;
      const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
      let l = L.find(q => Math.abs(q.y - y) < Math.max(1.5, Math.min(q.h, h) * .45));
      if (!l) L.push(l = { y, h, P: [] }); l.P.push({ x, w: it.width || 0, s: it.str }); if (it.str.trim()) l.h = Math.max(l.h, h);
    }
    for (const l of L) {
      l.P.sort((a, b) => a.x - b.x); let s = "", end = -1e9;
      for (const p of l.P) { if (s && p.x - end > l.h * .18 && !/\s$/.test(s) && !/^\s/.test(p.s) && !(CJK.test(s.slice(-1)) && CJK.test(p.s[0]))) s += " "; s += p.s; end = Math.max(end, p.x + p.w) }
      l.t = s.replace(/\s+/g, " ").trim().normalize("NFC"); l.x = l.P.find(p => p.s.trim())?.x ?? l.P[0].x; l.r = end;
    }
    P.push(L.filter(l => l.t).sort((a, b) => b.y - a.y));
  }
  const all = P.flat(), chars = all.reduce((a, l) => a + l.t.length, 0);
  if (!all.length || chars < 30 * doc.numPages) throw new Error(f.name + " là PDF dạng ảnh chụp (scan), không có chữ để lấy. Cần chạy nhận dạng chữ (OCR) trước, hoặc dùng file Word/EPUB.");
  // Dòng lặp lại ở đầu/cuối nhiều trang (tên truyện, số trang) thì bỏ
  const key = t => t.toLowerCase().replace(/\d+/g, "#").replace(/\s+/g, " ").trim(), cnt = {};
  P.forEach(L => new Set([...L.slice(0, 2), ...L.slice(-2)].map(l => key(l.t))).forEach(k => cnt[k] = (cnt[k] || 0) + 1));
  const lim = Math.max(3, P.length * .3), isPgNum = t => /^(trang|page|p\.)?\s*[-–—]?\s*\d{1,4}\s*[-–—]?\s*(\/\s*\d{1,4})?$/i.test(t);
  P.forEach(L => { const edge = new Set([...L.slice(0, 2), ...L.slice(-2)]); for (let k = L.length - 1; k >= 0; k--) if (edge.has(L[k]) && (isPgNum(L[k].t) || cnt[key(L[k].t)] >= lim)) L.splice(k, 1) });
  const body = P.flat(), hm = med(body.map(l => l.h)) || 10, gaps = [];
  P.forEach(L => { for (let k = 1; k < L.length; k++) { const g = L[k - 1].y - L[k].y; if (g > 0 && g < hm * 3) gaps.push(g) } });
  const gap = med(gaps) || hm * 1.3, left = med(body.filter(l => l.h < hm * 1.2).map(l => Math.round(l.x))), right = med(body.filter(l => l.h < hm * 1.2).map(l => l.r));
  const out = []; let cur = "", prev = null;
  const flush = () => { if (cur.trim()) out.push({ h: 0, t: cur.trim() }); cur = "" };
  const join = (a, b) => /[a-zà-ỹ]-$/i.test(a) && /^[a-zà-ỹ]/.test(b) ? a.slice(0, -1) + b : CJK.test(a.slice(-1)) || CJK.test(b[0]) ? a + b : a + " " + b;
  P.forEach((L, pi) => L.forEach(l => {
    if (l.h >= hm * 1.3 && l.t.length <= 90) { // chữ to hơn hẳn: tiêu đề chương
      flush(); const last = out[out.length - 1];
      if (last && last.h && prev && prev.big && prev.pi === pi && prev.y - l.y < l.h * 2.2) last.t += " " + l.t; else out.push({ h: 1, t: l.t });
      prev = { ...l, pi, big: true }; return;
    }
    const same = prev && prev.pi === pi && !prev.big;
    const nw = !prev || prev.big || (same && prev.y - l.y > gap * 1.55) || l.x > left + hm * .9 || (/[.!?…:"”'’」』)\]]$/.test(prev.t) && prev.r < right - hm * 2.5);
    if (nw) { flush(); cur = l.t } else cur = join(cur, l.t);
    prev = { ...l, pi };
  }));
  flush();
  return out;
}
async function impSources() {
  const fs = [...$("#i_file").files].sort((a, b) => a.name.localeCompare(b.name, "vi", { numeric: true })), out = [];
  if (fs.length) { for (const f of fs) { const B = await impBlocks(f); out.push({ name: B.title ? `${B.title} (${f.name})` : f.name, B }) } return out }
  return [{ name: "", B: await impBlocks(null) }];
}
async function impBlocks(f) {
  const url = $("#i_url").value.trim(), paste = $("#i_paste").value;
  if (f && /\.epub$/i.test(f.name)) return await epubBlocks(f);
  if (f && /\.pdf$/i.test(f.name)) return await pdfBlocks(f);
  if (f && /\.docx$/i.test(f.name)) {
    log("Đang đọc " + f.name + "..."); await loadMammoth();
    const r = await mammoth.convertToHtml({ arrayBuffer: await f.arrayBuffer() }), doc = new DOMParser().parseFromString(r.value, "text/html"), out = [], pushImg = im => { const u = im.getAttribute("src") || ""; if (/^data:image\/(png|jpe?g|gif|webp);base64,/.test(u)) out.push({ img: u }) };
    const walk = el => {
      for (const n of el.children) {
        const tg = n.tagName;
        if (/^H[1-6]$/.test(tg)) { const t = n.textContent.trim(); if (t) out.push({ h: +tg[1], t: t.normalize("NFC") }); n.querySelectorAll("img").forEach(im => pushImg(im)); continue }
        if (tg === "UL" || tg === "OL" || tg === "TABLE") { n.querySelectorAll("li, tr").forEach(x => { const t = x.textContent.trim(); if (t) out.push({ h: 0, t: t.normalize("NFC") }) }); continue }
        n.querySelectorAll("img").forEach(im => pushImg(im));
        const t = n.textContent.replace(/\s+/g, " ").trim(); if (t) out.push({ h: 0, t: t.normalize("NFC") });
      }
    };
    walk(doc.body); return out;
  }
  if (f) return linesToBlocks(await f.text());
  if (url) {
    const id = (/\/document\/d\/([\w-]+)/.exec(url) || [])[1]; if (!id) throw new Error("Link Google Docs không hợp lệ");
    try { const r = await fetch(`https://docs.google.com/document/d/${id}/export?format=txt`); if (!r.ok) throw 0; return linesToBlocks(await r.text()) }
    catch (e) { throw new Error("Google không cho tải trực tiếp file từ link. Trong Google Docs, chọn Tệp → Tải xuống → Microsoft Word (.docx) rồi chọn file đó ở ô bên trên, hoặc chọn tất cả nội dung và dán vào ô bên dưới.") }
  }
  if (paste.trim()) return linesToBlocks(paste);
  throw new Error("Hãy chọn file, dán link Google Docs hoặc dán nội dung");
}
function impSplit(B) {
  const kws = $("#i_kw").value.split(",").map(x => x.trim()).filter(Boolean), vkws = $("#i_vkw").value.split(",").map(x => x.trim()).filter(Boolean);
  const volRe = vkws.length ? new RegExp(`^(${vkws.map(rxq).join("|")})\\.?\\s*([0-9]+|[IVXLC]+)\\b`, "i") : null;
  const isChap = t => t.length <= 120 && kws.some(k => { const m = new RegExp(`^${rxq(k)}(?=$|[\\s\\d:.\\-–—)])(.*)$`, "i").exec(t); if (!m) return false; if (!NUMKW.test(k)) return t.length <= 80; return /^\s*([0-9]+|[IVXLCivxlc]+\b|[:.\-–—])/.test(m[1]) || m[1].trim() === "" });
  const isVol = t => volRe && t.length <= 100 && volRe.test(t);
  const volName = t => { const m = volRe.exec(t); if (t.length <= 60 && t !== t.toUpperCase()) return t; return /^(tập|quyển)$/i.test(m[1]) ? `${m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()} ${m[2]}` : `${m[1]} ${m[2]}` };
  const H = B.filter(b => b.h && !isVol(b.t)), cnt = {}; H.forEach(b => cnt[b.h] = (cnt[b.h] || 0) + 1);
  const lv = Object.entries(cnt).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
  const mode = $("#i_mode").value, useH = mode === "h" || (mode === "auto" && !!lv), chapLv = lv ? +lv[0] : 0;
  const segs = []; let vol = "", cur = { t: "Mở đầu", vol: "", body: [], imgs: [], pre: true };
  for (const b of B) {
    if (b.img) { cur.imgs.push(b.img); cur.body.push("\u0000IMG" + (cur.imgs.length - 1)); continue }
    if (isVol(b.t) && (b.h || b.t.length <= 60)) { if (cur.body.length || cur.imgs.length) segs.push(cur); vol = volName(b.t); cur = { t: "Mở đầu", vol, body: [], imgs: [], pre: true }; continue }
    const head = useH ? (b.h && b.h <= chapLv) : isChap(b.t);
    if (head) { if (cur.body.length || cur.imgs.length || !cur.pre) segs.push(cur); cur = { t: b.t.slice(0, 200), vol, body: [], imgs: [] } }
    else cur.body.push(b.t);
  }
  if (cur.body.length || cur.imgs.length || !cur.pre) segs.push(cur);
  return { useH, segs: segs.map(g => { const w = g.body.filter(x => x[0] !== "\u0000").join(" ").split(/\s+/).filter(Boolean).length, img = g.imgs.length > 0 && (w <= 5 || (w < 30 && /minh h(ọa|oạ)|illustration|口絵|挿絵|插图|彩页/i.test(g.t))); return { ...g, w, type: img ? "img" : "text", on: g.pre ? (w >= 50 || img) : (w > 0 || img), t: g.pre && img ? "Minh họa" : g.t } }) };
}
const VNRE = /(?:^|[^\p{L}])(?:tập|tap|volume|vol|quyển|quyen)\.?\s*[-_#:]?\s*(\d+|[IVXLC]+)(?![\p{L}\d])/iu;
const volIn = t => { t = String(t).replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)); return VNRE.exec(t) || /第?\s*(\d{1,3})\s*[巻卷册冊]/.exec(t) };
function impVols(segs, name, s, carry) {
  // Trả về { n, src }: số tập đã nhận ra (để file sau nối tiếp)
  const own = $("#i_vol").value.trim(), multi = $("#i_file").files.length > 1; let n = null, src = "";
  const fm = volIn(name.replace(/\.[^.]+$/, "").replace(/[_.]+/g, " "));
  if (fm) { n = numOf(fm[1]); src = "tên file" }
  if (n == null) { const pre = segs.find(g => g.pre), L = [...(pre ? pre.body.slice(0, 30) : []), ...segs.slice(0, 3).map(g => g.t)]; for (const t of L) { if (t.length > 150) continue; const m = volIn(t); if (m) { n = numOf(m[1]); src = "trang đầu file"; break } } }
  const has = segs.some(g => g.vol);
  if (has) { let i = 0; const fv = segs.find(g => g.vol).vol; while (i < segs.length && !segs[i].vol) segs[i++].vol = fv; src = "các dòng Tập trong file" }
  else if (own && !multi) { segs.forEach(g => g.vol = own); src = "ô Tập" }
  else {
    if (n == null && carry != null) { n = carry + 1; src = "nối tiếp file trước" }
    const plan = vAutoPlan(segs.map(g => ({ t: g.t, type: g.type, pages: g.type === "img" ? g.imgs : null })));
    if (plan.length >= 2) { const b = n ?? 1; plan.forEach((p, k) => p.js.forEach(j => segs[j].vol = "Tập " + (b + k))); n = b + plan.length - 1; src = (src ? src + ", " : "") + "tự chia theo Minh họa và Mở đầu" }
    else if (n != null) segs.forEach(g => g.vol = "Tập " + n);
  }
  // Dùng đúng tên tập đã có trong bộ (ví dụ "Tập 1: Lớp D") nếu cùng số tập
  const ex = [...new Set(s.chapters.map(c => (c.vol || "").trim()).filter(Boolean))];
  segs.forEach(g => { if (!g.vol || ex.includes(g.vol)) return; const k = volNum(g.vol), m = k != null && ex.find(v => volNum(v) === k); if (m) g.vol = m });
  const last = segs.length ? volNum(segs[segs.length - 1].vol || "") : null;
  return { n: last ?? n, src, vols: [...new Set(segs.map(g => g.vol).filter(Boolean))] };
}
function impRender() {
  const sel = IMP.filter(x => x.on), lost = IMP.filter(x => x.type === "text" && x.imgs.length).reduce((a, x) => a + x.imgs.length, 0);
  $("#i_sum").textContent = `Tìm thấy ${IMP.length} phần, đã chọn ${sel.length} để đăng`;
  $("#i_note").textContent = [IMPINFO, lost ? `Có ${lost} ảnh nằm giữa các chương chữ, sẽ được đăng kèm ngay tại vị trí đó trong chương. Ảnh nằm riêng trong phần "Minh họa" được đăng thành chương minh họa.` : ""].filter(Boolean).join(" ");
  $("#i_list").innerHTML = IMP.map((x, i) => `<div class="irow${x.on ? "" : " off"}"><input type="checkbox" data-ion="${i}" ${x.on ? "checked" : ""} aria-label="Chọn"><span class="n">${i + 1}</span><input type="text" class="vi" data-ivol="${i}" value="${esc(x.vol)}" placeholder="Tập"><input type="text" data-it="${i}" value="${esc(x.t)}"><small>${x.type === "img" ? x.imgs.length + " ảnh" : x.w.toLocaleString("vi-VN") + " chữ"}${x.trp ? `<em class="itg run">${esc(x.trp)}</em>` : x.tr ? '<em class="itg">Đã dịch</em>' : ""}</small><button type="button" class="sec sm" data-ipv="${i}">Xem</button><span class="sn">${esc(x.type === "img" ? "Chương minh họa" : (x.body[0] || "").slice(0, 140))}</span></div>`).join("");
}
$("#i_go").onclick = () => run(async () => {
  if (!data.novels[+$("#i_ser").value]) throw new Error("Hãy tạo bộ truyện (novel) trước ở mục Bộ truyện");
  const s = data.novels[+$("#i_ser").value], S = await impSources(), info = []; let carry = null, useH = false; IMP = [];
  for (const src of S) {
    if (!src.B.length) { info.push((src.name || "Nội dung") + ": trống"); continue }
    const r = impSplit(src.B); useH ||= r.useH; const v = impVols(r.segs, src.name, s, carry); carry = v.n; IMP.push(...r.segs);
    info.push(`${src.name ? src.name + ": " : ""}${r.segs.length} phần, ${v.vols.length ? v.vols.join(", ") + (v.src ? " (nhận từ " + v.src + ")" : "") : "chưa nhận ra tập"}`);
  }
  if (!IMP.length) throw new Error("Không tìm thấy nội dung để chia");
  $("#i_res").hidden = false; $("#i_tprog").textContent = ""; setTimeout(impTrSync, 0); $("#i_vols").innerHTML = [...new Set([...s.chapters.map(c => (c.vol || "").trim()), ...IMP.map(x => x.vol)].filter(Boolean))].map(v => `<option value="${esc(v)}">`).join(""); IMPINFO = info.join(". ") + "."; impRender();
  log(`✅ Đã chia thành ${IMP.length} phần (${useH ? "theo tiêu đề trong file" : "theo từ khóa"}). ${IMP.some(x => !x.vol) ? "Có phần chưa có tập, hãy điền ở cột Tập. " : ""}Hãy xem lại trước khi đăng.`);
  if (IMP.length === 1) log("Chỉ tìm thấy 1 phần. Thử đổi cách chia hoặc thêm từ khóa trong mục Cách chia chương.");
});
$("#i_list").addEventListener("input", e => { const t = e.target; if (t.dataset.it != null) IMP[+t.dataset.it].t = t.value; if (t.dataset.ivol != null) IMP[+t.dataset.ivol].vol = t.value });
$("#i_list").addEventListener("change", e => { const t = e.target; if (t.dataset.ion != null) { IMP[+t.dataset.ion].on = t.checked; t.closest(".irow").classList.toggle("off", !t.checked); $("#i_sum").textContent = `Tìm thấy ${IMP.length} phần, đã chọn ${IMP.filter(x => x.on).length} để đăng` } });
$("#i_list").addEventListener("click", e => { const b = e.target.closest("button[data-ipv]"); if (!b) return; const x = IMP[+b.dataset.ipv]; x.type === "img" ? preview({ title: x.t, vol: x.vol, imgs: x.imgs }) : preview({ title: x.t, vol: x.vol, text: x.body.map(l => l[0] === "\u0000" ? `[img:${x.imgs[+l.slice(4)]}]` : l).join("\n") }) });
$("#i_sort").onclick = () => { const L = chSort(IMP.map(x => ({ ...x, c0: x }))).map(x => x.c0); const same = L.every((x, j) => x === IMP[j]); IMP = L; impRender(); log(same ? "✅ Danh sách đã đúng thứ tự." : "✅ Đã sắp xếp lại danh sách. Kiểm tra rồi bấm Đăng.") };
$("#i_bulkgo").onclick = () => { const v = $("#i_bulk").value.trim(), L = IMP.filter(x => x.on); if (!L.length) return log("❌ Chưa chọn mục nào"); L.forEach(x => x.vol = v); impRender(); log(v ? `✅ Đã gán ${v} cho ${L.length} mục.` : `✅ Đã bỏ tập của ${L.length} mục.`) };
$("#i_all").onclick = () => { IMP.forEach(x => x.on = true); impRender() }; $("#i_none").onclick = () => { IMP.forEach(x => x.on = false); impRender() };
$("#i_pub").onclick = () => {
  const s = data.novels[+$("#i_ser").value]; if (!s) return log("❌ Hãy chọn bộ truyện");
  let L = IMP.filter(x => x.on && x.t.trim()); const dup = $("#i_dup").checked, have = new Set(s.chapters.map(c => (c.vol || "") + "|" + c.t)), skip = dup ? L.filter(x => have.has(x.vol.trim() + "|" + x.t.trim())).length : 0;
  if (dup) L = L.filter(x => !have.has(x.vol.trim() + "|" + x.t.trim()));
  if (!L.length) return log(skip ? "❌ Tất cả chương đã chọn đều đã có trong bộ" : "❌ Chưa chọn chương nào");
  if (!confirm(`Đăng ${L.length} chương vào "${s.title}"?${skip ? `\n(Bỏ qua ${skip} chương trùng tên đã có.)` : ""}`)) return;
  run(async () => {
    const date = $("#i_date").value, cz = $("#i_cz").checked; let n = 0, added = 0;
    try {
      for (const x of L) {
        n++; const id = `c${s.chapters.length + 1}_${rid()}`, ch = { t: x.t.trim(), date }; if (x.vol.trim()) ch.vol = x.vol.trim();
        if (x.type === "img") {
          ch.type = "img"; ch.pages = [];
          for (let j = 0; j < x.imgs.length; j++) {
            log(`Đang đăng ${n}/${L.length}: ${ch.t}, ảnh ${j + 1}/${x.imgs.length}...`);
            const blob = await (await fetch(x.imgs[j])).blob(); let b64 = null, ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
            if (cz) { const r = await squeeze(blob); if (r) { b64 = r.b64; ext = r.ext } }
            if (!b64) b64 = x.imgs[j].split(",")[1];
            const p = `novels/${s.slug}/${id}/${String(j + 1).padStart(3, "0")}.${ext}`; await put(p, b64, `${s.title} ${ch.t} ảnh ${j + 1}`); ch.pages.push(p);
          }
        } else {
          const lines = [];
          for (const l of x.body) {
            if (l[0] !== "\u0000") { lines.push(l); continue }
            const u = x.imgs[+l.slice(4)]; log(`Đang đăng ${n}/${L.length}: ${ch.t}, ảnh trong chương...`);
            const blob = await (await fetch(u)).blob(); let b64 = null, ext = (blob.type.split("/")[1] || "jpg").replace("jpeg", "jpg"); if (cz) { const r = await squeeze(blob); if (r) { b64 = r.b64; ext = r.ext } } if (!b64) b64 = u.split(",")[1];
            const ip = `novels/${s.slug}/img/${rid()}.${ext}`; await put(ip, b64, `${s.title} ${ch.t} ảnh`); lines.push(`[img:${ip}]`);
          }
          const text = lines.join("\n"); log(`Đang đăng ${n}/${L.length}: ${ch.t}...`);
          const p = `novels/${s.slug}/${id}.txt`; await put(p, b64t(text), "Chương: " + ch.t); ch.file = p; ch.words = trWords(text);
        }
        { const vs = s.chapters.map(c => (c.vol || "").trim()), at = ch.vol ? vs.lastIndexOf(ch.vol) : -1, k = ch.vol ? volNum(ch.vol) : null, nx = at < 0 && k != null ? vs.findIndex(v => v && volNum(v) != null && volNum(v) > k) : -1;
          if (at >= 0) s.chapters.splice(at + 1, 0, ch); else if (nx >= 0) s.chapters.splice(nx, 0, ch); else s.chapters.push(ch) }
        added++; x.on = false;
      }
    } finally { if (added) { if ($("#i_resort").checked) s.chapters = chSort(s.chapters); log("Đang lưu danh sách chương..."); await save(`Nhập ${added} chương: ${s.title}`); impFill() } }
    impRender(); done(`✅ Đã đăng ${L.length} chương vào "${s.title}". Web cập nhật sau 1–2 phút.`);
  });
};
