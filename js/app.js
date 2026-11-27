/* Kenrori: phần chính của web đọc */
const VER = (() => { try { return new URL(document.currentScript.src).searchParams.get("v") || "" } catch (e) { return "" } })();
/* ============ DATA: CHỈ CẦN SỬA PHẦN NÀY ============ */
const DATA = { tips: [], links: [], guides: [], novels: [], manga: [], videos: [], projects: [], site: {} };
/* Nội dung thật nằm trong data.json và được sửa qua trang quản trị (admin.html). */
/* ============ CÔNG CỤ TÍCH HỢP ============ */
const W = x => x.trim() ? x.trim().split(/\s+/).length : 0;
const TOOLS = [
 { t: "Sửa lỗi chữ tách dấu tiếng Việt", h: "Chuẩn hóa dấu về dạng chuẩn (NFC), xóa ký tự vô hình và khoảng trắng lạ.", fn: x => x.normalize("NFC").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\u00A0/g, " ") },
 { t: "Đếm chữ & ký tự", fn: x => `${W(x)} chữ · ${x.length} ký tự · ${x.split("\n").filter(l => l.trim()).length} đoạn` },
 { t: "Dọn văn bản", h: "Xóa khoảng trắng thừa, gộp dòng trống.", fn: x => x.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").trim() },
 { t: "Nối dòng bị ngắt (PDF/OCR)", h: "Nối các dòng bị ngắt giữa câu, giữ dòng trống giữa đoạn.", fn: x => x.replace(/\r/g, "").replace(/([^\n])\n(?!\n)/g, "$1 ") },
 { t: "Tìm & thay hàng loạt (tên riêng)", h: "Ô dưới: mỗi dòng một cặp từ cũ=từ mới.", x: "từ cũ=từ mới", fn: (x, g) => g.split("\n").filter(l => l.includes("=")).reduce((s, l) => { const [a, ...b] = l.split("="); return a.trim() ? s.split(a.trim()).join(b.join("=").trim()) : s }, x) },
 { t: "Bỏ dấu & tạo slug", h: "Dùng đặt tên thư mục/file.", fn: x => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") },
 { t: "SRT → VTT (phụ đề Vietsub)", h: "Chuyển phụ đề .srt sang .vtt để dùng với video HTML.", fn: x => "WEBVTT\n\n" + x.replace(/\r/g, "").replace(/(\d\d:\d\d:\d\d),(\d{3})/g, "$1.$2").trim() },
 { t: "Tách chương → JSON", h: "Dán cả truyện; dòng bắt đầu bằng từ khóa (ô dưới, mặc định “Chương”) là chương mới. Kết quả dán vào chapters:[...].", x: "Chương", fn: (x, k) => { k = k.trim() || "Chương"; const d = new Date().toISOString().slice(0, 10), o = []; let c; x.replace(/\r/g, "").split("\n").forEach(l => { if (l.trim().startsWith(k)) { c = { t: l.trim(), date: d, w: [] }; o.push(c) } else if (c) c.w.push(l) }); return JSON.stringify(o.map(c => { const tx = c.w.join("\n").trim(); return { t: c.t, date: c.date, words: W(tx), text: tx } }), null, 1) } },
 { t: "Tạo danh sách trang manga", h: "Ô trên để trống. Ô dưới: thư mục|số trang|đuôi file", x: "manga/ten/c1/|20|jpg", fn: (_, p) => { const [d, n, e] = p.split("|").map(s => s.trim()); return JSON.stringify(Array.from({ length: +n }, (_, i) => d + String(i + 1).padStart(2, "0") + "." + (e || "jpg")), null, 1) } }
];
/* ============ CODE ============ */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").normalize("NFC").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtD = d => d ? d.split("-").reverse().join("/") : "";
const fmtN = n => n ? Number(n).toLocaleString("vi-VN") + " chữ" : "";
const TC0 = new Map(); // tên đã viết hoa -> tên gốc, để màu bìa tạm không đổi
const hue = t => [...(TC0.get(t) ?? t)].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
/* Viết hoa chữ cái đầu của mỗi chữ (chỉ khi hiển thị, không sửa dữ liệu gốc). */
const tcap = t => typeof t === "string" ? t.split(/(\s+)/).map(w => w.replace(/^([^\p{L}\p{N}]*)(\p{Ll})/u, (m, a, b) => a + b.toLocaleUpperCase("vi"))).join("") : t;
const applyTcap = () => { if (DATA.site.tcap === false) return; for (const k of Object.values(KEY)) for (const s of DATA[k] || []) { const t = tcap(s.title); if (t !== s.title) { TC0.set(t, s.title); s._t0 = s.title; s.title = t } for (const c of s.chapters || []) c.t = tcap(c.t) } };
const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) {} }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} }, del: k => { try { localStorage.removeItem(k) } catch (e) {} } };
const ADM = !!ls.get("cfg2");
const imgTag = s => s ? `<img src="${esc(s)}" alt="" loading="lazy" onerror="this.remove()">` : "";
const ic = p => `<svg class="i" viewBox="0 0 24 24">${p}</svg>`;
const I = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', bmark: '<path d="M6 3h12v18l-6-4.5L6 21z"/>', check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>', box: '<path d="m3 7.5 9-4.5 9 4.5v9L12 21l-9-4.5z"/><path d="m3 7.5 9 4.5 9-4.5M12 12v9"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>', tool: '<path d="M14.5 6.5a4 4 0 0 1 5.3-3.8L17 5.5l1.5 1.5 2.8-2.8a4 4 0 0 1-5.3 5.3L7 18.5a2.1 2.1 0 0 1-3-3z"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>', gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/>',
  box2: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>', rank: '<path d="M8 21V11H3v10zM15 21V4H9v17zM21 21v-7h-5v7z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  home: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5zM20 19v3H6"/>',
  game: '<rect x="2" y="7" width="20" height="12" rx="4"/><path d="M7 11v4M5 13h4M15 12h.01M18 14h.01"/>',
  more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  next: '<path d="m9 18 6-6-6-6"/>', prev: '<path d="m15 18-6-6 6-6"/>',
  star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  play: '<path d="M7 4v16l13-8z"/>', img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>', share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>', dl: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>', plus: '<path d="M12 5v14M5 12h14"/>'
};
DATA.projects ??= [];
DATA.site ??= {};
const KEY = { novel: "novels", manga: "manga" }, app = $("#app"), EMPTY = '<p class="empty">Chưa có nội dung.</p>';
const NAV = [["home", "home", "Trang chủ"], ["tim-kiem", "search", "Tìm truyện"], ["library", "bmark", "Thư viện"],
  ["—", "", "Kệ truyện"], ["novels", "#ff00ff", "Light Novel"], ["webnovel", "#ffd84d", "Web Novel"], ["manga", "#2bb6a3", "Manga"], ["sang-tac", "#8b6cff", "Sáng tác"], ["the-loai", "tag", "Thể loại"],
  ["—", "", "Tu luyện"], ["tu-luyen", "crown", "Tu luyện của tôi"], ["cua-hang", "gem", "Cửa hàng"], ["kho-do", "box2", "Kho đồ"], ["bang-xep-hang", "rank", "Bảng xếp hạng"],
  ["—", "", "Game"], ["projects", "box", "Dự án"], ["tips", "bulb", "Mẹo game"], ["tools", "tool", "Công cụ"],
  ["—", "", "Kenrori"], ["videos", "video", "Video Vietsub"], ["links", "link", "Liên kết"], ["about", "info", "Giới thiệu"]];
function toast(m) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t) } t.textContent = m; t.className = "on"; clearTimeout(toast.t); toast.t = setTimeout(() => t.className = "", 3500) }
async function shareS(k, slug) {
  const s = (DATA[KEY[k]] || []).find(x => x.slug === slug); if (!s) return;
  const url = new URL(`truyen/${k === "manga" ? "manga-" : ""}${slug}.html`, location.href).href;
  if (navigator.share) { try { await navigator.share({ title: s.title, url }); return } catch (e) { if (e.name === "AbortError") return } }
  try { await navigator.clipboard.writeText(url); toast("Đã sao chép link chia sẻ") } catch (e) { prompt("Sao chép link này:", url) }
}
let installEv = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEv = e; renderSide() });
addEventListener("appinstalled", () => { installEv = null; renderSide(); toast("Đã cài Kenrori") });
function doInstall() { if (installEv) { installEv.prompt(); installEv.userChoice.finally(() => { installEv = null; renderSide() }) } }
addEventListener("offline", () => toast("Bạn đang ngoại tuyến. Các chương đã mở trước đó vẫn đọc được."));
addEventListener("online", () => toast("Đã có mạng trở lại"));
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
function gcInit() { const c = (DATA.site.gc || "").trim(); if (ADM || !/^[a-z0-9-]+$/i.test(c) || window.goatcounter) return; window.goatcounter = { no_onload: true }; const sc = document.createElement("script"); sc.async = true; sc.src = "//gc.zgo.at/count.js"; sc.dataset.goatcounter = `https://${c}.goatcounter.com/count`; document.head.appendChild(sc) }
function gcCount() { if (!window.goatcounter) return; const path = location.pathname.replace(/index\.html$/, "") + (location.hash.slice(1) || ""), title = document.title; let n = 0; const go = () => { if (window.goatcounter.count) window.goatcounter.count({ path, title }); else if (n++ < 40) setTimeout(go, 250) }; go() }
function setTitle(a, b, c, s) {
  let t = "";
  if (s) t = c !== undefined && s.chapters[+c] ? `${s.chapters[+c].t}, ${s.title}` : s.title;
  else if (a === "tac-gia") t = b || ""; else if (a === "tim-kiem" && b === "g") t = "Thể loại " + (c || ""); else { const n = NAV.find(x => x[0] === a); if (n && a !== "home") t = n[2] }
  document.title = t ? `${t} | Kenrori` : "Kenrori";
}
function renderSide() {
  const cnt = { novels: DATA.novels.filter(x => !isWN(x)).length, webnovel: DATA.novels.filter(isWN).length, manga: DATA.manga.length }, cur = (document.querySelector("#nv a.on") || {}).dataset?.k;
  const gOn = !!(window.KGP && KGP.on()), GK = ["tu-luyen", "cua-hang", "kho-do", "bang-xep-hang"];
  $("#nv").innerHTML = NAV.filter(([k, , l], j) => (k !== "sang-tac" || (window.ST && ST.enabled())) && (gOn || (!GK.includes(k) && !(k === "—" && l === "Tu luyện")))).map(([k, icn, l]) => k === "—" ? `<div class="sg">${l}</div>` : `<a href="#${k}" data-k="${k}"${k === cur ? ' class="on"' : ""}>${icn[0] === "#" ? `<i class="spn" style="--c:${icn}" aria-hidden="true"></i>` : ic(I[icn])}<span>${l}</span>${cnt[k] ? `<small>${cnt[k]}</small>` : ""}${k === "library" ? '<b class="bd" hidden></b>' : ""}</a>`).join("");
  navBadge();
  const dc = (DATA.site.about || {}).discord;
  $("#sfoot").innerHTML = (/^https?:\/\//.test(dc || "") ? `<a class="dcb" href="${esc(dc)}" target="_blank" rel="noopener">Tham gia Discord</a>` : "") + (installEv ? `<a class="dcb ins" href="javascript:void 0" onclick="doInstall()">${ic(I.dl)}Cài ứng dụng</a>` : "") + `<a href="feed.xml">Theo dõi qua RSS</a><a href="admin.html">Quản trị</a><span>© Kenrori</span>`;
}
const STC = t => /sắp/i.test(t || "") ? "soon" : /hoàn/i.test(t || "") ? "done" : /tạm|ngưng|dừng|drop/i.test(t || "") ? "pause" : "on";
const stDot = s => s.status ? `<span class="st ${STC(s.status)}">${esc(s.status)}</span>` : "";
const ago = d => { if (!d) return ""; const t = new Date(), n = Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.parse(d)) / 864e5); return n <= 0 ? "Hôm nay" : n === 1 ? "Hôm qua" : n < 7 ? n + " ngày trước" : n < 30 ? Math.floor(n / 7) + " tuần trước" : fmtD(d) };
const bgStyle = s => `style="--h:${hue(s.title)}${s.cover ? `;background-image:url(&quot;${esc(s.cover)}&quot;)` : ""}"`;
/* Thể loại: thứ tự, màu, biểu tượng, ẩn/hiện và thể loại cha lấy từ sổ thể loại trong trang quản trị (site.genres) */
const GREG = () => Array.isArray(DATA.site.genres) ? DATA.site.genres : [];
const gMeta = g => GREG().find(x => x.name === g);
const gHid = g => !!(gMeta(g) || {}).hidden;
const gOrd = g => { const i = GREG().findIndex(x => x.name === g); return i < 0 ? 1e6 : i };
const allG = (k = "all") => { const m = new Map(); for (const x of (k === "all" ? ["novel", "manga"] : [k])) DATA[KEY[x]].forEach(s => (s.genres || []).forEach(g => { if (!gHid(g)) m.set(g, (m.get(g) || 0) + 1) })); return [...m].sort((a, b) => (GREG().length ? gOrd(a[0]) - gOrd(b[0]) : 0) || b[1] - a[1] || a[0].localeCompare(b[0], "vi")) };
const gHref = g => `#tim-kiem/g/${encodeURIComponent((gMeta(g) || {}).slug || g)}`;
const gTag = (g, n) => { const m = gMeta(g) || {}; return `<a class="tag" href="${gHref(g)}"${m.color ? ` style="--gc:${esc(m.color)}"` : ""}${m.desc ? ` title="${esc(m.desc)}"` : ""}>${m.icon && window.KG ? KG.icon(m.icon) : ""}${esc(g)}${n != null ? `<small>${n}</small>` : ""}</a>` };
const gChips = k => { const a = allG(k); if (!a.length) return ""; const cnt = new Map(a), par = g => (gMeta(g) || {}).parent, top = a.filter(([g]) => !par(g) || !cnt.has(par(g)));
  if (!GREG().some(x => x.parent)) return `<div class="gc">${a.map(([g, n]) => gTag(g, n)).join("")}</div>`;
  return top.map(([g, n]) => { const kids = a.filter(([x]) => par(x) === g); return kids.length ? `<div class="gcg"><div class="gc">${gTag(g, n)}</div><div class="gc gck">${kids.map(([x, m]) => gTag(x, m)).join("")}</div></div>` : "" }).join("") + `<div class="gc">${top.filter(([g]) => !a.some(([x]) => par(x) === g)).map(([g, n]) => gTag(g, n)).join("")}</div>` };
const latest = s => s.chapters.map(c => c.date || "").sort().pop() || "";
const first = s => s.chapters.map(c => c.date || "").filter(Boolean).sort()[0] || "";
const sum = s => s.chapters.reduce((a, c) => a + (c.words || (c.text ? W(c.text) : 0)), 0);
const allS = () => [...DATA.novels.map(s => ({ k: "novel", s })), ...DATA.manga.map(s => ({ k: "manga", s }))];
const byNew = a => [...a].sort((x, y) => latest(y.s || y).localeCompare(latest(x.s || x)));
const sec = (t, more, body) => `<section class="sec"><div class="sh"><h2>${t}</h2>${more ? `<a class="more all" href="#${more}">Xem tất cả</a>` : ""}</div>${body}</section>`;
const fmtOf = (k, s) => k === "manga" ? "Manga" : s.format === "Web Novel" ? "Web Novel" : "Light Novel";
const isWN = s => s.format === "Web Novel";
const people = t => String(t || "").split(/\s*[,、&;]\s*|\s+\/\s+/).map(x => x.trim()).filter(Boolean);
/* Tên khác: đoán loại tên để gắn nhãn (Nhật, Việt, Anh, Romaji, viết tắt...), bấm để sao chép */
const altKind = (x, jp) => /[\u3040-\u30ff]/.test(x) ? ["Nhật", "ja", 330] : /[\uac00-\ud7af]/.test(x) ? ["Hàn", "ko", 200] : /[\u3400-\u9fff]/.test(x) ? (jp && !/[们这来国为说时对会发经么过实现问还进让欢迎义样关开见长车门东语书无马鸟鱼级战爱乐师当头动种气]/.test(x) ? ["Nhật", "ja", 330] : ["Trung", "zh", 10]) : /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(x) ? ["Việt", "vi", 150] : /[āīūēō]/i.test(x) ? ["Romaji", "ja-Latn", 40] : !/\s/.test(x.trim()) && x.trim().length <= 14 ? ["Viết tắt", "", 260] : ["Anh", "en", 215];
const altHtml = (L, jp) => `<div class="alts">${L.map(x => { const [l, lg, h] = altKind(x, jp); return `<button type="button" class="alt" style="--ah:${h}" title="Bấm để sao chép" onclick="altCopy(this)"><i>${l}</i><span${lg ? ` lang="${lg}"` : ""}>${esc(x)}</span></button>` }).join("")}</div>`;
function altCopy(b) { const t = b.querySelector("span").textContent; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast("Đã sao chép: " + t), () => prompt("Sao chép tên này:", t)) }
const aHref = n => "#tac-gia/" + encodeURIComponent(n);
const credit = (lbl, t) => people(t).map(n => `<a class="cr" href="${aHref(n)}"><span>${lbl}</span><b>${esc(n)}</b></a>`).join("");
const pLinks = t => people(t).map(n => `<a class="al" href="${aHref(n)}">${esc(n)}</a>`).join(", ");
const isNew = s => { const d = first(s); if (!d) return false; const t = new Date(); return (Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.parse(d)) / 864e5 <= 14 };
const isImgCh = c => c.type === "img";
const obi = s => s.chapters.length ? `<i class="obi"><span>${s.chapters.length} chương</span>${isNew(s) ? "<em>Mới</em>" : ""}</i>` : '<i class="obi soon">Sắp ra mắt</i>';
const newest = s => s.chapters.reduce((m, c) => (c.date || "") >= (m.date || "") ? c : m, s.chapters[0]);
const hasJP = t => /[\u3040-\u30ff\u3400-\u9fff]/.test(t || "");
const card = (k, s) => `<a class="sc" href="#${k}/${s.slug}"><div class="cover" style="--h:${hue(s.title)}">${imgTag(s.cover)}<b>${esc(s.title)}</b>${obi(s)}</div><div class="ct" title="${esc(s.title)}${s.orig ? "\n" + esc(s.orig) : ""}">${esc(s.title)}</div><small>${stDot(s)}<span>${fmtOf(k, s)}</span></small></a>`;
const gridOf = (k, a) => a.length ? `<div class="series">${byNew(a).map(s => card(k, s)).join("")}</div>` : EMPTY;
const recent = n => { const a = []; for (const { k, s } of allS()) s.chapters.forEach((c, i) => a.push({ k, s, c, i })); return a.sort((x, y) => (y.c.date || "").localeCompare(x.c.date || "") || y.i - x.i).slice(0, n) };
const rdSet = (k, s) => { try { return JSON.parse(ls.get("r:" + k + ":" + s.slug) || "[]") } catch (e) { return [] } };
function latestUpdates(f = "all") {
  const m = new Map();
  for (const r of recent(400).filter(r => f === "all" || fKey(r.k, r.s) === f)) { const id = r.k + ":" + r.s.slug; if (!m.has(id)) m.set(id, { k: r.k, s: r.s, c: [] }); const g = m.get(id); if (g.c.length < 3) g.c.push(r) }
  const G = [...m.values()].slice(0, 12); if (!G.length) return EMPTY;
  return `<div class="lu">${G.map(g => { const rs = rdSet(g.k, g.s); return `<div class="lui"><a class="th" href="#${g.k}/${g.s.slug}" style="--h:${hue(g.s.title)}">${imgTag(g.s.cover)}</a><div class="lub"><a class="lut" href="#${g.k}/${g.s.slug}" title="${esc(g.s.title)}">${esc(g.s.title)}</a>${g.c.map(r => `<a class="luc${rs.includes(r.i) ? " rd" : ""}" href="#${r.k}/${r.s.slug}/${r.i}"><span>${r.c.vol ? esc(r.c.vol) + ", " : ""}${esc(r.c.t)}</span><small>${ago(r.c.date)}</small></a>`).join("")}</div></div>` }).join("")}</div>`;
}
let HI = 0, HT = null;
function heroHtml() {
  const byU = (x, y) => latest(y.s).localeCompare(latest(x.s)), L = allS().filter(x => x.s.chapters.length).sort(byU).slice(0, 10); if (!L.length) return "";
  return `<section class="hero" id="hero" aria-label="Truyện mới cập nhật">${L.map(({ k, s }, i) => `<div class="hs${i ? "" : " on"}" data-u="${latest(s)}"><div class="hb" ${bgStyle(s)}></div>${hasJP(s.orig) ? `<div class="hv" lang="ja" aria-hidden="true">${esc(s.orig)}</div>` : ""}<div class="hw"><a class="book" href="#${k}/${s.slug}" aria-label="${esc(s.title)}"><span class="cover" style="--h:${hue(s.title)}">${imgTag(s.cover)}<b>${esc(s.title)}</b></span>${s.chapters.length ? `<span class="obi"><small>Mới nhất</small><b>${(c => esc((c.vol ? c.vol.trim() + " - " : "") + c.t))(newest(s))}</b></span>` : '<span class="obi soon"><b>Sắp ra mắt</b></span>'}</a><div class="hi"><a href="#${k}/${s.slug}"><h2>${esc(s.title)}</h2></a>${s.orig ? `<div class="hor" lang="ja">${esc(s.orig)}</div>` : ""}<div class="hau">${s.author ? `<span>Tác giả</span><b>${esc(s.author)}</b>` : ""}${s.artist && s.artist !== s.author ? `<span>Minh họa</span><b>${esc(s.artist)}</b>` : ""}</div><div class="htg">${(s.genres || []).slice(0, 6).map(g => `<span>${esc(g)}</span>`).join("")}</div><p>${esc(s.desc)}</p><div class="hcta">${s.chapters.length ? (l => `<a class="btn pri" href="#${k}/${s.slug}/${l ?? 0}">${ic(I.play)}${l != null ? "Đọc tiếp" : "Đọc ngay"}</a>`)(ls.get(k + ":" + s.slug)) : ""}<a class="btn hsec" href="#${k}/${s.slug}">Xem chi tiết</a></div></div></div></div>`).join("")}${L.length > 1 ? `<div class="hn" role="tablist" aria-label="Chọn truyện nổi bật">${L.map(({ s }, i) => `<button class="hdot${i ? "" : " on"}" role="tab" aria-selected="${!i}" data-u="${latest(s)}" style="--h:${hue(s.title)}" onclick="heroTo([...this.parentNode.children].indexOf(this))" title="${esc(s.title)}" aria-label="${esc(s.title)}">${imgTag(s.cover)}</button>`).join("")}</div>` : ""}</section>`;
}
function heroTo(n) { const ss = document.querySelectorAll(".hs"), ds = document.querySelectorAll(".hdot"); if (ss.length < 2) return; ss[HI].classList.remove("on"); HI = (n + ss.length) % ss.length; ss[HI].classList.add("on"); ds.forEach((d, i) => { d.classList.toggle("on", i === HI); d.setAttribute("aria-selected", i === HI) }); clearInterval(HT); HT = setInterval(() => heroGo(1), 8000) }
function heroGo(d) { heroTo(HI + d) }
const projCard = d => `<div class="card pj">${d.img ? `<img class="pi" src="${esc(d.img)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<h3>${esc(d.title)}</h3><div class="meta">${d.status ? `<span class="st ${STC(d.status)}">${esc(d.status)}</span>` : ""}${d.type ? `<span class="pill">${esc(d.type)}</span>` : ""}${d.version ? `<span>v${esc(d.version)}</span>` : ""}${d.date ? `<span>Cập nhật ${fmtD(d.date)}</span>` : ""}</div><p>${esc(d.desc)}</p><div class="acts">${(d.links || []).filter(l => /^https?:\/\//.test(l.url)).map((l, i) => `<a class="btn${i ? "" : " pri"}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div>${d.howto ? `<details><summary>Hướng dẫn sử dụng</summary><p class="sum">${esc(d.howto)}</p></details>` : ""}</div>`;
const reading = (n = 8) => { const a = []; for (const { k, s } of allS()) { const l = ls.get(k + ":" + s.slug); if (l != null && s.chapters[+l]) a.push({ k, s, l: +l, t: +(ls.get("t:" + k + ":" + s.slug) || 0) }) } return a.sort((x, y) => y.t - x.t).slice(0, n) };
const rdCard = r => { const n = r.s.chapters.length, nw = n - 1 - r.l, pct = Math.round(rdSet(r.k, r.s).length / n * 100); return `<div class="rcs"><a class="sc" href="#${r.k}/${r.s.slug}/${r.l}"><div class="cover" style="--h:${hue(r.s.title)}">${imgTag(r.s.cover)}<b>${esc(r.s.title)}</b>${nw > 0 ? `<i class="obi"><span>Chương mới</span><em>+${nw}</em></i>` : ""}</div><div class="ct">${esc(r.s.title)}</div><small><span>${esc(r.s.chapters[r.l].t)}</span></small><i class="pb"><i style="width:${pct}%"></i></i></a><button class="fg" title="Bỏ khỏi danh sách đang đọc" onclick="forget('${r.k}','${esc(r.s.slug)}')">✕</button></div>` };
function forget(k, slug) { ["", "t:", "r:"].forEach(p => ls.del(p + k + ":" + slug)); route() }
let RDKEY = null;
const favs = () => { try { return JSON.parse(ls.get("favs") || "[]") } catch (e) { return [] } };
const isFav = (k, slug) => favs().includes(k + ":" + slug);
const favLabel = on => on ? `${ic(I.check)}<span>Đang theo dõi</span>` : `${ic(I.bmark)}<span>Theo dõi</span>`;
/* Theo dõi: ai cũng dùng được, lưu trên trình duyệt. "seen" = số chương lúc người đọc ghé trang bộ đó lần cuối */
const seenK = (k, slug) => `seen:${k}:${slug}`;
const newOf = (k, s) => { const v = ls.get(seenK(k, s.slug)); return v == null ? 0 : Math.max(0, s.chapters.length - +v) };
const markSeen = (k, s) => { if (isFav(k, s.slug)) ls.set(seenK(k, s.slug), s.chapters.length) };
const lday = t => { if (!t) return ""; const d = new Date(t); if (isNaN(d) || /^\d{4}-\d\d-\d\d$/.test(t)) return String(t).slice(0, 10); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` }; // ngày theo giờ máy người đọc
const stMeta = id => { try { return JSON.parse(ls.get("stm:" + id) || "null") } catch (e) { return null } };
const stFavs = () => favs().filter(x => x.startsWith("st:")).map(x => ({ id: x.slice(3), m: stMeta(x.slice(3)) })).filter(x => x.m);
function navBadge() { const b = $("#nv .bd"); if (!b) return; const n = favList().filter(({ k, s }) => newOf(k, s) > 0).length + stFavs().filter(({ m }) => (m.n || 0) > (m.s || 0)).length; b.hidden = !n; b.textContent = n; b.title = n + " bộ có chương mới" }
function toggleFav(k, slug, meta) {
  const f = favs(), id = k + ":" + slug, n = f.includes(id) ? f.filter(x => x !== id) : [...f, id]; ls.set("favs", JSON.stringify(n)); const on = n.includes(id);
  if (k === "st") { if (on && meta) ls.set("stm:" + slug, JSON.stringify(meta)); if (!on) ls.del("stm:" + slug) }
  else { const s = (DATA[KEY[k]] || []).find(x => x.slug === slug); if (on && s) ls.set(seenK(k, slug), s.chapters.length); if (!on) ls.del(seenK(k, slug)) }
  const b = $("#fvb"); if (b) { b.classList.toggle("on", on); b.innerHTML = favLabel(on); b.title = on ? "Bỏ theo dõi" : "Theo dõi để biết khi có chương mới"; b.setAttribute("aria-pressed", on) }
  const e = $("#fve"); if (e) e.innerHTML = on ? `${ic(I.check)}Đang theo dõi` : `${ic(I.bmark)}Theo dõi bộ này`;
  toast(on ? "Đã theo dõi. Bộ này nằm trong Thư viện của bạn." : "Đã bỏ theo dõi"); navBadge();
}
function unfollow(k, slug) { toggleFav(k, slug); route() }
const flwCard = ({ k, s }) => { const nw = newOf(k, s), c = s.chapters.length ? newest(s) : null; return `<div class="rcs"><a class="sc" href="#${k}/${s.slug}"><div class="cover" style="--h:${hue(s.title)}">${imgTag(s.cover)}<b>${esc(s.title)}</b>${nw ? `<i class="obi"><span>Chương mới</span><em>+${nw}</em></i>` : ""}</div><div class="ct" title="${esc(s.title)}">${esc(s.title)}</div><small><span>${c ? esc((c.vol ? c.vol.trim() + " - " : "") + c.t) : "Sắp ra mắt"}</span></small>${c ? `<small class="fu">Cập nhật ${ago(latest(s)).toLowerCase()}</small>` : ""}</a><button class="fg" title="Bỏ theo dõi" aria-label="Bỏ theo dõi ${esc(s.title)}" onclick="unfollow('${k}','${esc(s.slug)}')">✕</button></div>` };
const stCard = ({ id, m }) => { const nw = Math.max(0, (m.n || 0) - (m.s || 0)); return `<div class="rcs"><a class="sc" href="#st/${esc(id)}"><div class="cover" style="--h:${hue(m.t || "")}">${/^https:\/\//.test(m.c || "") ? imgTag(m.c) : ""}<b>${esc(m.t)}</b>${nw ? `<i class="obi"><span>Chương mới</span><em>+${nw}</em></i>` : ""}</div><div class="ct" title="${esc(m.t)}">${esc(m.t)}</div><small><span>${m.l ? esc(m.l) : "Sáng tác của " + esc(m.a || "tác giả")}</span></small>${m.u ? `<small class="fu">Cập nhật ${ago(lday(m.u)).toLowerCase()}</small>` : ""}</a><button class="fg" title="Bỏ theo dõi" aria-label="Bỏ theo dõi ${esc(m.t)}" onclick="unfollow('st','${esc(id)}')">✕</button></div>` };
const follows = () => [...favList().map(x => ({ n: newOf(x.k, x.s), u: latest(x.s), h: flwCard(x) })), ...stFavs().map(x => ({ n: Math.max(0, (x.m.n || 0) - (x.m.s || 0)), u: lday(x.m.u), h: stCard(x) }))].sort((a, b) => (b.n > 0) - (a.n > 0) || b.u.localeCompare(a.u));
const favList = () => favs().map(id => { const [k, slug] = id.split(":"); const s = (DATA[KEY[k]] || []).find(x => x.slug === slug); return s && { k, s } }).filter(Boolean);
const favGrid = a => `<div class="series">${a.map(({ k, s }) => card(k, s)).join("")}</div>`;
function renderAnn() {
  const a = DATA.site.announce, el = $("#ann"); if (!a || !a.text) { el.hidden = true; return }
  const key = "ann:" + a.text; if (ls.get(key)) { el.hidden = true; return }
  el.hidden = false; el.innerHTML = `${esc(a.text)}${/^https?:\/\//.test(a.url || "") ? ` <a href="${esc(a.url)}" target="_blank" rel="noopener">Xem thêm</a>` : ""}<button title="Đóng thông báo">✕</button>`;
  el.querySelector("button").onclick = () => { ls.set(key, "1"); el.hidden = true };
}
const R = {
  tips: d => `<details class="it"><summary>${esc(d.title)} <span class="pill">${esc(d.game)}</span></summary><p>${esc(d.text)}</p>${imgTag(d.img)}</details>`,
  links: d => `<div class="card"><h3><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.title)}</a></h3><p>${esc(d.desc)}</p><div class="acts">${(d.tags || []).map(t => `<span class="pill">${esc(t)}</span>`).join("")}</div></div>`,
  guides: d => `<details class="it"><summary>${esc(d.title)}</summary><p>${esc(d.text)}</p>${imgTag(d.img)}${d.embed ? `<iframe class="tool" src="${esc(d.embed)}" loading="lazy"></iframe>` : ""}</details>`,
  videos: d => `<div class="card vd">` + (d.youtube ? `<button class="yt" style="background-image:url(&quot;https://i.ytimg.com/vi/${esc(d.youtube)}/hqdefault.jpg&quot;)" onclick="ytPlay(this,'${esc(d.youtube)}')" aria-label="Phát video ${esc(d.title)}"><span class="pl">${ic(I.play)}</span></button>` : `<video controls preload="none" src="${esc(d.mp4)}">${d.vtt ? `<track kind="subtitles" srclang="vi" label="Tiếng Việt" src="${esc(d.vtt)}" default>` : ""}</video>`) + `<h3>${esc(d.title)}</h3>${d.desc ? `<p>${esc(d.desc)}</p>` : ""}</div>`
};
const toolUI = (t, i) => `<details class="it tb"><summary>${esc(t.t)}</summary>${t.h ? `<p>${esc(t.h)}</p>` : ""}<textarea class="i" placeholder="Dán nội dung vào đây"></textarea>${t.x ? `<textarea class="x" placeholder="${esc(t.x)}"></textarea>` : ""}<button onclick="runTool(${i},this)">Chạy</button><button onclick="copyOut(this)">Sao chép kết quả</button><textarea class="o" readonly placeholder="Kết quả"></textarea></details>`;
function runTool(i, b) { const d = b.closest(".tb"), o = $(".o", d); try { o.value = TOOLS[i].fn($(".i", d).value, $(".x", d)?.value || "") } catch (e) { o.value = "Lỗi: " + e.message } }
function copyOut(b) { const o = $(".o", b.closest(".tb")); o.select(); navigator.clipboard?.writeText(o.value) }
const FS0 = { q: "", k: [], st: [], g: [], sort: "upd" };
let FS = { ...FS0 }; try { Object.assign(FS, JSON.parse(ls.get("fs") || "{}")) } catch (e) {}
const fKey = (k, s) => k === "manga" ? "manga" : isWN(s) ? "wn" : "ln";
function searchRes() {
  const q = FS.q.trim().toLowerCase();
  let L = allS().filter(({ k, s }) => (!q || JSON.stringify([s.title, s.orig, s.alts, s.author, s.artist]).toLowerCase().includes(q)) && (!FS.k.length || FS.k.includes(fKey(k, s))) && (!FS.st.length || FS.st.includes(STC(s.status))) && FS.g.every(g => (s.genres || []).includes(g)));
  const srt = { upd: (x, y) => latest(y.s).localeCompare(latest(x.s)), new: (x, y) => first(y.s).localeCompare(first(x.s)), az: (x, y) => x.s.title.localeCompare(y.s.title, "vi"), ch: (x, y) => y.s.chapters.length - x.s.chapters.length }[FS.sort] || (() => 0);
  L.sort(srt); ls.set("fs", JSON.stringify(FS));
  $("#fres").innerHTML = `<p class="lead">${L.length} bộ phù hợp</p>` + (L.length ? `<div class="series">${L.map(({ k, s }) => card(k, s)).join("")}</div>` : '<p class="empty">Không có bộ nào khớp. Bỏ bớt bộ lọc hoặc thử từ khóa khác.</p>');
  document.querySelectorAll(".fc").forEach(b => b.classList.toggle("on", FS[b.dataset.f].includes(b.dataset.v)));
}
function searchInit() {
  $("#fq").value = FS.q; $("#fsort").value = FS.sort;
  $("#fq").oninput = e => { FS.q = e.target.value; searchRes() }; $("#fsort").onchange = e => { FS.sort = e.target.value; searchRes() };
  $(".flt").onclick = e => { const b = e.target.closest(".fc"); if (!b) return; const a = FS[b.dataset.f], v = b.dataset.v; FS[b.dataset.f] = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; searchRes() };
  $("#frs").onclick = () => { FS = { ...FS0, k: [], st: [], g: [] }; searchInit() };
  searchRes();
}
function schedSec() {
  const L = allS().filter(({ s }) => s.sched && s.chapters.length && STC(s.status) === "on").sort((x, y) => latest(y.s).localeCompare(latest(x.s))); if (!L.length) return "";
  return sec("Lịch ra chương", null, `<div class="sch">${L.map(({ k, s }) => `<a class="sci" href="#${k}/${s.slug}"><span class="th" style="--h:${hue(s.title)}">${imgTag(s.cover)}</span><span class="scb"><b>${esc(s.title)}</b><span class="scs">${esc(s.sched)}</span><small>Chương mới nhất ${ago(latest(s)).toLowerCase()}</small></span></a>`).join("")}</div>`);
}
function discordCta() {
  const A = DATA.site.about || {}; if (!/^https?:\/\//.test(A.discord || "")) return "";
  return `<section class="dcta"><div><h2>Tham gia cộng đồng ${esc(A.name || "Kenrori")}</h2><p>${esc((A.intro || "Nhận thông báo chương mới, góp ý bản dịch và trò chuyện cùng nhóm dịch.").slice(0, 220))}</p></div><div class="acts"><a class="btn dcbtn" href="${esc(A.discord)}" target="_blank" rel="noopener">Tham gia Discord</a><a class="btn" href="#about">Giới thiệu nhóm</a></div></section>`;
}
function shelfSec(t, more, items) { return `<section class="sec"><div class="sh"><h2>${t}</h2><div class="sha"><button class="more arw" onclick="shScroll(this,-1)" title="Cuộn sang trái" aria-label="Cuộn sang trái">${ic(I.prev)}</button><button class="more arw" onclick="shScroll(this,1)" title="Cuộn sang phải" aria-label="Cuộn sang phải">${ic(I.next)}</button>${more ? `<a class="more all" href="#${more}">Xem tất cả</a>` : ""}</div></div><div class="shelf">${items.join("")}</div></section>` }
function shArrows() { document.querySelectorAll(".shelf").forEach(sh => sh.closest("section").querySelectorAll(".arw").forEach(a => a.hidden = sh.scrollWidth <= sh.clientWidth + 4)) }
addEventListener("resize", () => shArrows());
function shScroll(b, d) { const sh = b.closest("section").querySelector(".shelf"); sh.scrollBy({ left: d * sh.clientWidth * .85, behavior: "smooth" }) }
function luTab(f) { ls.set("lut", f); $("#lu").innerHTML = latestUpdates(f); document.querySelectorAll(".utabs button").forEach(b => b.classList.toggle("on", b.dataset.f === f)) }
function ytPlay(b, id) { const f = document.createElement("iframe"); f.className = "ytf"; f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`; f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen"; f.allowFullscreen = true; b.replaceWith(f) }
const P = {
  home: () => {
    const rd = reading(), fl = follows(), lt = ls.get("lut") || "all", byU = (x, y) => latest(y.s).localeCompare(latest(x.s));
    const soon = allS().filter(({ s }) => !s.chapters.length || STC(s.status) === "soon").sort((x, y) => x.s.title.localeCompare(y.s.title, "vi")), fin = allS().filter(({ s }) => s.chapters.length && STC(s.status) === "done").sort(byU).slice(0, 18);
    const cat = f => allS().filter(({ k, s }) => fKey(k, s) === f && s.chapters.length).sort((x, y) => latest(y.s).localeCompare(latest(x.s))).slice(0, 18);
    const tabs = [["all", "Tất cả"], ["ln", "Light Novel"], ["wn", "Web Novel"], ["manga", "Manga"]].filter(([f]) => f === "all" || cat(f).length);
    return heroHtml()
      + (rd.length ? shelfSec("Đọc tiếp", "library", rd.map(rdCard)) : "")
      + (fl.length ? shelfSec("Đang theo dõi", "library", fl.slice(0, 18).map(x => x.h)) : "")
      + `<section class="sec"><div class="sh"><h2>Mới cập nhật</h2>${tabs.length > 2 ? `<div class="utabs" role="tablist">${tabs.map(([f, l]) => `<button role="tab" data-f="${f}" class="${f === lt ? "on" : ""}" onclick="luTab('${f}')">${l}</button>`).join("")}</div>` : ""}</div><div id="lu">${latestUpdates(tabs.some(([f]) => f === lt) ? lt : "all")}</div></section>`
      + schedSec()
      + [["ln", "Light Novel", "novels"], ["wn", "Web Novel", "webnovel"], ["manga", "Manga", "manga"]].map(([f, l, h]) => { const L = cat(f); return L.length ? shelfSec(l, h, L.map(({ k, s }) => card(k, s))) : "" }).join("")
      + (window.ST && ST.enabled() ? '<div id="st_home"></div>' : "")
      + (soon.length ? shelfSec("Sắp ra mắt", null, soon.map(({ k, s }) => card(k, s))) : "")
      + (fin.length ? shelfSec("Đã hoàn thành", null, fin.map(({ k, s }) => card(k, s))) : "")
      + (DATA.videos.length ? sec("Video Vietsub", "videos", `<div class="vgrid">${DATA.videos.slice(0, 4).map(R.videos).join("")}</div>`) : "")
      + (DATA.projects.length ? sec("Dự án", "projects", `<div class="grid">${DATA.projects.slice(0, 3).map(projCard).join("")}</div>`) : "")
      + (allG().length ? sec("Thể loại", "the-loai", gChips("all")) : "")
      + discordCta();
  },
  "tim-kiem": () => { const ch = (f, opts) => opts.map(([v, l]) => `<button class="fc" data-f="${f}" data-v="${esc(v)}">${esc(l)}</button>`).join(""); return `<section class="sec"><div class="sh"><h2>Tìm truyện</h2></div><div class="flt"><input id="fq" type="search" placeholder="Tên truyện, tên khác, tác giả, họa sĩ"><div class="frow"><span>Loại</span><div>${ch("k", [["ln", "Light Novel"], ["wn", "Web Novel"], ["manga", "Manga"]])}</div></div><div class="frow"><span>Tình trạng</span><div>${ch("st", [["on", "Đang dịch"], ["done", "Hoàn thành"], ["pause", "Tạm ngưng"], ["soon", "Sắp ra mắt"]])}</div></div>${allG().length ? `<div class="frow"><span>Thể loại</span><div>${ch("g", allG().map(([g]) => [g, g]))}</div></div>` : ""}<div class="frow"><span>Sắp xếp</span><div><select id="fsort"><option value="upd">Mới cập nhật</option><option value="new">Mới thêm</option><option value="az">Tên A đến Z</option><option value="ch">Nhiều chương nhất</option></select><button class="lnk" id="frs">Xóa bộ lọc</button></div></div></div><div id="fres"></div></section>` },
  novels: () => sec("Light Novel", null, gridOf("novel", DATA.novels.filter(s => !isWN(s)))),
  webnovel: () => sec("Web Novel", null, gridOf("novel", DATA.novels.filter(isWN))),
  author: n => { const W = allS().filter(({ s }) => people(s.author).includes(n) || people(s.artist).includes(n)), wa = W.filter(({ s }) => people(s.author).includes(n)).length, wi = W.filter(({ s }) => people(s.artist).includes(n)).length, src = W.map(({ s }) => s.src).filter(u => /^https?:\/\//.test(u || "")); return `<section class="ap"><div class="av" style="--h:${hue(n)}">${esc([...n][0] || "?")}</div><div><h1>${esc(n)}</h1><p>${[wa ? `Tác giả của ${wa} bộ` : "", wi ? `Minh họa ${wi} bộ` : ""].filter(Boolean).join(", ")} được dịch tại Kenrori.</p></div></section>` + sec("Tác phẩm", null, W.length ? `<div class="series">${W.map(({ k, s }) => card(k, s)).join("")}</div>` : EMPTY) + (src.length ? `<p class="lead">Tác phẩm gốc: ${[...new Set(src)].map(u => `<a class="al" href="${esc(u)}" target="_blank" rel="noopener">${esc(u.replace(/^https?:\/\//, "").slice(0, 50))}</a>`).join(", ")}</p>` : "") },
  manga: () => sec("Manga", null, gChips("manga") + gridOf("manga", DATA.manga)),
  library: () => { const rd = reading(100), F = follows(), nn = F.filter(f => f.n > 0).length;
    return `<section class="sec lib"><div class="sh"><h2>Đang theo dõi</h2>${F.length ? `<span class="shn${nn ? " hot" : ""}">${nn ? nn + " bộ có chương mới" : "Bạn đã xem hết chương mới"}</span>` : ""}</div>${F.length ? `<div class="series" id="flw">${F.map(f => f.h).join("")}</div>` : `<div class="lbe">${ic(I.bmark)}<div><b>Chưa theo dõi bộ nào</b><p>Bấm Theo dõi trên trang của bất kỳ bộ truyện nào, kể cả truyện Sáng tác. Khi bộ đó ra chương mới, bạn sẽ thấy ngay ở đây và trên menu.</p></div><a class="btn pri" href="#tim-kiem">Tìm truyện</a></div>`}</section>`
      + sec("Lịch sử đọc", null, rd.length ? `<div class="series">${rd.map(rdCard).join("")}</div>` : '<p class="empty">Bạn chưa đọc bộ nào.</p>') + `<p class="lead">Thư viện lưu ngay trên trình duyệt này, không cần tài khoản. Nếu xóa dữ liệu trình duyệt hoặc đổi sang máy khác, thư viện sẽ trống.</p>` },
  tips: () => sec("Mẹo game", null, DATA.tips.map(R.tips).join("") || EMPTY),
  links: () => sec("Liên kết hữu ích", null, DATA.links.length ? `<div class="grid">${DATA.links.map(R.links).join("")}</div>` : EMPTY),
  videos: () => sec("Video nhạc Vietsub", null, DATA.videos.length ? `<div class="vgrid">${DATA.videos.map(R.videos).join("")}</div>` : EMPTY),
  projects: () => sec("Dự án", null, `<p class="lead">Script, mod và công cụ do Kenrori làm.</p>` + (DATA.projects.length ? `<div class="grid">${DATA.projects.map(projCard).join("")}</div>` : EMPTY)),
  about: () => {
    const A = DATA.site.about || {}, isU = u => /^https?:\/\//.test(u || "");
    const ct = (A.contacts || []).map(c => { const u = c.url || "", href = isU(u) ? u : (/@/.test(u) && !/\s/.test(u) ? "mailto:" + u : ""); return href ? `<a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${esc(c.label)}</a>` : `<span class="pill">${esc(c.label)}${u ? ": " + esc(u) : ""}</span>` }).join("");
    const dc = isU(A.discord) ? `<a class="btn dc" href="${esc(A.discord)}" target="_blank" rel="noopener">Tham gia Discord</a>` : "";
    return sec(esc(A.name || "Giới thiệu"), null, (A.name || A.intro || dc || ct) ? `<div class="about"><p class="sum" style="max-width:72ch">${esc(A.intro)}</p>${dc ? `<div class="acts" style="margin-top:16px">${dc}</div>` : ""}${ct ? `<h3>Liên hệ</h3><div class="acts">${ct}</div>` : ""}</div>` : '<p class="empty">Chưa có thông tin giới thiệu. Điền trong trang quản trị, mục Trang web.</p>');
  },
  genre: (k, g) => {
    if (!g) return sec("Thể loại", null, gChips("all") || '<p class="empty">Chưa có thể loại nào. Thêm thể loại cho truyện trong trang quản trị.</p>');
    const items = (k === "novel" || k === "manga" ? [k] : ["novel", "manga"]).flatMap(x => DATA[KEY[x]].filter(s => (s.genres || []).includes(g)).map(s => card(x, s)));
    return sec(`Thể loại: ${esc(g)}`, "the-loai", items.length ? `<div class="series">${items.join("")}</div>` : EMPTY);
  },
  tools: () => sec("Công cụ", null, `<p class="lead">Dán nội dung, bấm Chạy rồi sao chép kết quả.</p>` + DATA.guides.map(R.guides).join("") + TOOLS.map(toolUI).join(""))
};
let RS = { fs: 18, lh: 1.9, ff: "sans", bg: "", w: "m" }; try { Object.assign(RS, JSON.parse(ls.get("rs") || "{}")) } catch (e) {}
function applyRS() { const st = document.documentElement.style; st.setProperty("--fs", RS.fs + "px"); st.setProperty("--lh", RS.lh); st.setProperty("--rw", { n: "640px", m: "760px", w: "960px" }[RS.w] || "760px"); const r = $("#rd.novel"); if (r) r.className = `rd novel ${RS.ff} ${RS.bg}`; ls.set("rs", JSON.stringify(RS)); rsPanel() }
function rsetv(k, v) { RS[k] = v; applyRS() }
function rsToggle(open) { const p = $("#rsp"), b = $("#rsb"); if (!p) return; const o = open ?? p.hidden; p.hidden = !o; b.setAttribute("aria-expanded", o); if (o) rsPanel() }
function rsPanel() {
  const p = $("#rsp"); if (!p || p.hidden) return;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${RS[k] === v ? "on" : ""}" onclick="rsetv('${k}','${v}')">${l}</button>`).join("")}</div>`;
  const step = (k, val, unit) => `<div class="stp"><button onclick="rset('${k}',-1)" aria-label="Giảm">−</button><b>${val}${unit}</b><button onclick="rset('${k}',1)" aria-label="Tăng">+</button></div>`;
  p.innerHTML = `<div class="rsh"><b>Tùy chỉnh đọc</b><button class="x" onclick="rsToggle(false)" aria-label="Đóng">✕</button></div>` + (p.dataset.kind === "novel"
    ? `<label>Cỡ chữ</label>${step("fs", RS.fs, "px")}<label>Giãn dòng</label>${step("lh", RS.lh, "")}<label>Kiểu chữ</label>${seg("ff", [["sans", "Không chân"], ["serif", "Có chân"], ["bfort", "Beaufort"]])}<label>Màu nền</label>${seg("bg", [["", "Mặc định"], ["sepia", "Giấy cũ"], ["night", "Đen"]])}<label>Độ rộng khung đọc</label>${seg("w", [["n", "Hẹp"], ["m", "Vừa"], ["w", "Rộng"]])}`
    : `<label>Cách đọc</label><div class="seg"><button class="${ls.get("mm") === "page" ? "" : "on"}" onclick="ls.set('mm','scroll');route()">Cuộn dọc</button><button class="${ls.get("mm") === "page" ? "on" : ""}" onclick="ls.set('mm','page');route()">Lật trang</button></div><label>Độ rộng khung đọc</label>${seg("w", [["n", "Hẹp"], ["m", "Vừa"], ["w", "Rộng"]])}`);
}
function rset(k, d) {
  if (k === "fs") RS.fs = Math.min(32, Math.max(14, RS.fs + d * 2));
  if (k === "lh") RS.lh = Math.min(2.4, Math.max(1.4, +(RS.lh + d * .1).toFixed(1)));
  if (k === "ff") { const o = ["sans", "serif", "bfort"]; RS.ff = o[(o.indexOf(RS.ff) + 1) % 3] }
  if (k === "bg") { const o = ["", "sepia", "night"]; RS.bg = o[(o.indexOf(RS.bg) + 1) % 3] }
  applyRS();
}
function detail(kind, s) {
  const last = ls.get(kind + ":" + s.slug), rs = rdSet(kind, s), n = s.chapters.length, nv = new Set(s.chapters.map(c => (c.vol || "").trim()).filter(Boolean)).size; let desc = ls.get("cdesc") === "1", allOpen = false;
  const tags = (s.genres || []).filter(g => !gHid(g)).map(g => `<a class="pill" href="${gHref(g)}"${(gMeta(g) || {}).color ? ` style="box-shadow:inset 3px 0 0 ${esc(gMeta(g).color)}"` : ""}>${esc(g)}</a>`).join("");
  const shownAlt = s.orig || (s.alts || [])[0], alt = [s.orig, ...(s.alts || [])].filter(x => x && x !== shownAlt);
  const team = (s.team || []).filter(t => t.n), vc = s.vc || {};
  const info = [["Tác giả", pLinks(s.author) || "Chưa rõ"], s.artist ? ["Họa sĩ minh họa", pLinks(s.artist)] : null, /^https?:\/\//.test(s.src || "") ? ["Tác phẩm gốc", `<a class="al" href="${esc(s.src)}" target="_blank" rel="noopener">${esc(s.src.replace(/^https?:\/\//, "").slice(0, 40))}</a>`] : null, team.length ? ["Nhóm thực hiện", team.map(t => `<div><span class="tr">${esc(t.r || "Thành viên")}</span> ${esc(t.n)}</div>`).join("")] : null, alt.length ? ["Tên khác", altHtml(alt, hasJP(s.orig))] : null, ["Loại", fmtOf(kind, s)], ["Tình trạng", stDot(s) || "Chưa rõ"], ["Số chương", n], nv ? ["Số tập", nv] : null, kind === "novel" ? ["Tổng số chữ", fmtN(sum(s)) || "Chưa rõ"] : null, ["Cập nhật", fmtD(latest(s)) || "Chưa có"]].filter(Boolean);
  const fav = isFav(kind, s.slug), lu = latest(s); markSeen(kind, s);
  const upd = lu ? `<div class="cr cru${(Date.now() - Date.parse(lu)) / 864e5 < 3 ? " fresh" : ""}" title="Cập nhật ngày ${fmtD(lu)}"><span>Cập nhật</span><b>${ago(lu)}</b></div>` : "";
  app.innerHTML = `<div class="tpb"><div class="hb" ${bgStyle(s)}></div>${hasJP(s.orig) ? `<div class="hv" lang="ja" aria-hidden="true">${esc(s.orig)}</div>` : ""}</div>
<div class="tp"><div class="tph"><div class="cover tpcv" style="--h:${hue(s.title)}">${imgTag(s.cover)}<b>${esc(s.title)}</b></div>
<div class="tpt"><h1>${esc(s.title)}</h1>${s.orig || (s.alts || [])[0] ? `<div class="tpo" lang="${s.orig ? "ja" : "vi"}">${esc(s.orig || s.alts[0])}</div>` : ""}${s.author || s.artist || upd ? `<div class="crs">${credit("Tác giả", s.author)}${s.artist && s.artist !== s.author ? credit("Minh họa", s.artist) : ""}${upd}</div>` : ""}</div>
<div class="tpm"><div class="acts tpa2">${n ? `<a class="btn pri big" href="#${kind}/${s.slug}/${last ?? 0}">${ic(I.play)}${last != null && s.chapters[last] ? `<span class="bmw"><span>Đọc tiếp</span><small>${esc(s.chapters[last].t)}${BM.pct(kind + "/" + s.slug, last) ? `, đã đọc ${BM.pct(kind + "/" + s.slug, last)}%` : ""}</small></span>` : last != null ? "Đọc tiếp" : "Đọc từ đầu"}</a>` : ""}<button class="btn flw${fav ? " on" : ""}" id="fvb" title="${fav ? "Bỏ theo dõi" : "Theo dõi để biết khi có chương mới"}" aria-pressed="${fav}" onclick="toggleFav('${kind}','${esc(s.slug)}')">${favLabel(fav)}</button><button class="btn ico" title="Chia sẻ" aria-label="Chia sẻ" onclick="shareS('${kind}','${esc(s.slug)}')">${ic(I.share)}</button>${n ? `<span class="subl">${last != null ? `<a href="#${kind}/${s.slug}/0">Đọc từ đầu</a>` : ""}<a href="#${kind}/${s.slug}/${n - 1}">Chương mới nhất</a></span>` : ""}${ADM ? `<span class="admb"><a class="btn ico sm" title="Thêm chương" href="admin.html#chap/${kind}/${s.slug}">${ic(I.plus)}</a><a class="btn ico sm" title="Quản lý bộ này" href="admin.html#bo/${kind}/${s.slug}">${ic(I.edit)}</a></span>` : ""}</div><div class="tptg">${stDot(s)}${tags}</div>${s.prog || s.sched ? `<div class="prog">${s.prog ? `<span><i>Tiến độ</i>${esc(s.prog)}</span>` : ""}${s.sched ? `<span><i>Lịch ra chương</i>${esc(s.sched)}</span>` : ""}</div>` : ""}</div></div>
<div class="tpd"><p class="sum clamp" id="dsc">${esc(s.desc) || "Chưa có tóm tắt."}</p><button class="lnk" id="dmore" hidden>Xem thêm</button></div>
<div class="tpc"><div class="tpl"><div class="sh"><h2>Danh sách chương</h2></div><div class="bar2"><input id="cq" type="search" placeholder="Tìm chương theo tên hoặc số"><button id="cs" title="Đổi thứ tự">${ls.get("cdesc") === "1" ? "Mới nhất trước" : "Từ chương đầu"}</button>${nv ? `<button id="cx">Hiện tất cả chương</button>` : ""}</div><div id="cl"></div></div>
<aside class="tpx">${info.map(([a, b]) => `<div class="ibx"><h4>${a}</h4><div>${b}</div></div>`).join("")}</aside></div></div>`;
  const dsc = $("#dsc"); if (dsc.scrollHeight > dsc.clientHeight + 2) { $("#dmore").hidden = false; $("#dmore").onclick = e => { const c = dsc.classList.toggle("clamp"); e.target.textContent = c ? "Xem thêm" : "Thu gọn" } }
  const volOf = c => (c.vol || "").trim();
  const rowHtml = ({ c, i }) => { const w = isImgCh(c) ? c.pages.length + " ảnh" : kind === "novel" ? fmtN(c.words || (c.text ? W(c.text) : 0)) : (c.pages ? c.pages.length : c.n) + " trang"; return `<div class="chr"><a class="ch${rs.includes(i) ? " done" : ""}${i == last ? " cur" : ""}" href="#${kind}/${s.slug}/${i}" title="${rs.includes(i) ? "Đã đọc" : "Chưa đọc"}"><span class="eye"></span><span class="cht">${isImgCh(c) ? `<span class="ill">${ic(I.img)}</span>` : ""}${esc(c.t)}</span><small class="cw">${w || ""}</small><small>${ago(c.date)}</small></a>${ADM ? `<a class="ed" href="admin.html#editchap/${kind}/${s.slug}/${i}" title="Sửa chương">${ic(I.edit)}</a>` : ""}</div>` };
  const draw = () => {
    const q = $("#cq").value.trim().toLowerCase(), L = s.chapters.map((c, i) => ({ c, i })).filter(({ c }) => !q || c.t.toLowerCase().includes(q) || volOf(c).toLowerCase().includes(q));
    let h;
    if (!nv) h = (desc ? [...L].reverse() : L).map(rowHtml).join("");
    else {
      const g = new Map(); L.forEach(x => { const v = volOf(x.c) || "Chương lẻ"; if (!g.has(v)) g.set(v, []); g.get(v).push(x) });
      const G = [...g]; if (desc) G.reverse();
      const LIM = 6;
      h = G.map(([v, a]) => {
        if (desc) a = [...a].reverse();
        const cv = vc[v] || (v !== "Chương lẻ" ? s.cover : ""), cut = !q && !allOpen && a.length > LIM;
        return `<section class="vblk"><div class="vhd">${cv ? `<img class="vmini" src="${esc(cv)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<b>${esc(v)}</b><span>${a.length} chương</span></div><div class="vbd${cv ? "" : " nocv"}">${cv ? `<button class="vcv" style="--h:${hue((s._t0 || s.title) + v)}" data-src="${esc(cv)}" onclick="LBL=[this.dataset.src];lbShow(0)" aria-label="Xem bìa ${esc(v)}"><img src="${esc(cv)}" alt="Bìa ${esc(v)}" loading="lazy" onerror="this.remove()"></button>` : ""}<div class="vlw"><div class="vls${cut ? " cut" : ""}">${a.map(rowHtml).join("")}</div>${cut ? `<button class="vmore" data-n="${a.length - LIM}" onclick="const c=this.previousElementSibling.classList.toggle('cut');this.textContent=c?'Xem tiếp ('+this.dataset.n+' chương)':'Thu gọn';if(c)this.closest('.vblk').scrollIntoView({block:'nearest'})">Xem tiếp (${a.length - LIM} chương)</button>` : ""}</div></div></section>`;
      }).join("");
    }
    $("#cl").innerHTML = h || `<p class="empty">Không có chương nào khớp với từ khóa.</p>`;
  };
  $("#cq").oninput = draw; $("#cs").onclick = e => { desc = !desc; ls.set("cdesc", desc ? 1 : 0); e.target.textContent = desc ? "Mới nhất trước" : "Từ chương đầu"; draw() };
  if (nv) $("#cx").onclick = e => { allOpen = !allOpen; e.target.textContent = allOpen ? "Thu gọn danh sách" : "Hiện tất cả chương"; draw() };
  draw();
  if (cmtMode() === "anon") { const bx = document.createElement("section"); bx.className = "cmside"; $(".tpl").appendChild(bx); CMT.mount(bx, `${kind}/${s.slug}`, "Bình luận về bộ truyện") }
}
const cmtMode = () => { const ok = !!(window.CMT && CMT.enabled()), m = DATA.site.cmt || (ok ? "anon" : "giscus"); return m === "anon" ? (ok ? "anon" : "") : m };
/* ---------- Trình đọc manga: khung xem toàn màn hình + bảng điều khiển bên phải ---------- */
const MRI = {
  x: '<path d="M6 6l12 12M18 6 6 18"/>', pin: '<path d="M9 4h6l-1 6 4 3H6l4-3zM12 13v8"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  book: '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>', page: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  l: '<path d="m15 6-6 6 6 6"/>', r: '<path d="m9 6 6 6-6 6"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', flag: '<path d="M5 21V4h11l-2 4 2 4H5"/>',
  team: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M18 15c2 1 3 3 3 5"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  single: '<rect x="7" y="3" width="10" height="18" rx="1.5"/>', double: '<rect x="2.5" y="4" width="9" height="16" rx="1.5"/><rect x="12.5" y="4" width="9" height="16" rx="1.5"/>', strip: '<rect x="7" y="2" width="10" height="8" rx="1"/><rect x="7" y="13" width="10" height="9" rx="1"/>',
  both: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', width: '<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>', height: '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/>', none: '<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9 9h6v6H9z"/>',
  ltr: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M13 9l3 3-3 3"/>', rtl: '<circle cx="12" cy="12" r="9"/><path d="M16 12H8M11 9l-3 3 3 3"/>',
  head: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>', headoff: '<rect x="3" y="4" width="18" height="16" rx="2"/>',
  prog: '<path d="M3 17h18M3 17v-3M21 17v-3M8 17v-2M13 17v-2"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', key: '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M6 10h1M10 10h1M14 10h1M18 10h1M7 15h10"/>'
};
const mri = k => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${MRI[k]}</svg>`;
const MRO = {
  mode: [["single", "Từng trang"], ["double", "Hai trang"], ["strip", "Cuộn dọc"]],
  fit: [["both", "Vừa màn hình"], ["width", "Vừa chiều ngang"], ["height", "Vừa chiều cao"], ["none", "Kích thước gốc"]],
  dir: [["ltr", "Trái sang phải"], ["rtl", "Phải sang trái"]],
  head: [["on", "Hiện thanh trên"], ["off", "Ẩn thanh trên"]],
  prog: [["normal", "Thanh tiến độ"], ["light", "Thanh tiến độ mảnh"], ["off", "Ẩn thanh tiến độ"]]
};
function mrCfg() {
  let o = {}; try { o = JSON.parse(ls.get("mr") || "{}") || {} } catch (e) {}
  const small = innerWidth < 800, d = { mode: small ? "strip" : ls.get("mm") === "page" ? "single" : "single", fit: small ? "width" : "both", dir: "ltr", head: "on", prog: "normal", pin: small ? 0 : 1 };
  for (const k of Object.keys(MRO)) if (!MRO[k].some(([v]) => v === o[k])) delete o[k];
  return { ...d, ...o };
}
function mangaRead(kind, s, i, c, pg, base, repU) {
  const n = s.chapters.length, key = `${kind}/${s.slug}`, N = pg.length, C = mrCfg(), small = () => innerWidth < 800;
  const goto = j => { if (j >= 0 && j < n) location.hash = `${base}/${j}`; else if (j >= n) toast("Đây là chương mới nhất") };
  const team = (s.team || []).filter(t => t.n), copts = s.chapters.map((x, j) => `<option value="${j}"${j === i ? " selected" : ""}>${esc((x.vol ? x.vol + " · " : "") + x.t)}</option>`).join("");
  const cyc = k => { const L = MRO[k], j = L.findIndex(([v]) => v === C[k]), [v, l] = L[j < 0 ? 0 : j]; return `<button type="button" class="mro" data-k="${k}" title="Bấm để đổi">${mri(k === "head" ? (v === "on" ? "head" : "headoff") : k === "prog" ? "prog" : v)}<span>${l}</span></button>` };
  document.body.classList.add("mrx");
  app.innerHTML = `<div class="mr" id="mr" tabindex="-1">
<header class="mrh"><a class="mrb" href="${base}" title="Về trang truyện" aria-label="Về trang truyện">${mri("l")}</a><div class="mrt"><a href="${base}">${esc(s.title)}</a><span>${c.vol ? esc(c.vol) + " · " : ""}${esc(c.t)}</span></div><b class="mrn" id="mrn"></b><button type="button" class="mrk" id="mrk" aria-label="Mở bảng điều khiển" title="Bảng điều khiển (M)">${mri("menu")}</button></header>
<div class="mrw"><div class="mrv" id="mrv" aria-live="polite"></div><div class="mrq" id="mrq" role="navigation" aria-label="Các trang"></div></div>
<button type="button" class="mrk mrkf" id="mrkf" aria-label="Mở bảng điều khiển" title="Bảng điều khiển (M)">${mri("menu")}</button>
<aside class="mrp" id="mrp" aria-label="Bảng điều khiển đọc truyện">
<div class="mrp0"><button type="button" class="mri" id="mrpx" aria-label="Đóng bảng điều khiển" title="Đóng">${mri("x")}</button><button type="button" class="mri mrpin" id="mrpin" aria-label="Ghim bảng điều khiển" title="Ghim bảng bên cạnh trang truyện">${mri("pin")}</button></div>
<a class="mrl mrs" href="${base}">${mri("book")}<span>${esc(s.title)}</span></a>
<div class="mrl">${mri("page")}<span>${c.vol ? esc(c.vol) + " · " : ""}${esc(c.t)}</span></div>
<div class="mrsel"><button type="button" class="mra" id="mrpp" aria-label="Trang trước">${mri("l")}</button><label><small>Trang</small><select id="mrps" aria-label="Chọn trang"></select></label><button type="button" class="mra" id="mrpn" aria-label="Trang sau">${mri("r")}</button></div>
<div class="mrsel"><button type="button" class="mra" id="mrcp" aria-label="Chương trước"${i > 0 ? "" : " disabled"}>${mri("l")}</button><label><small>Chương</small><select id="mrcs" aria-label="Chọn chương">${copts}</select></label><button type="button" class="mra" id="mrcn" aria-label="Chương sau"${i < n - 1 ? "" : " disabled"}>${mri("r")}</button></div>
${/^https?:\/\//.test(repU || "") ? `<a class="mrbtn" href="${esc(repU)}" target="_blank" rel="noopener">${mri("flag")}Báo lỗi chương</a>` : ""}
<hr>
${cmtMode() === "anon" || (cmtMode() === "giscus" && (DATA.site.giscus || {}).repoId) ? `<button type="button" class="mrbtn" id="mrcm">${mri("chat")}Bình luận</button>` : ""}
${team.length ? `<div class="mrg"><small>Nhóm thực hiện</small>${team.map(t => `<div class="mrl">${mri(/nhóm|team/i.test(t.r || "") ? "team" : "user")}<span>${esc(t.n)}${t.r ? `<em>${esc(t.r)}</em>` : ""}</span></div>`).join("")}</div>` : ""}
<hr>
<div class="mrset">${Object.keys(MRO).map(cyc).join("")}</div>
${ADM ? `<a class="mrbtn" href="admin.html#editchap/${kind}/${s.slug}/${i}">${mri("edit")}Sửa chương</a>` : ""}
<p class="mrhint">${mri("key")}<span>Phím ← → để lật trang, M để mở hoặc đóng bảng này. Bấm nửa trái hoặc nửa phải ảnh để lật.</span></p>
</aside>
<aside class="mrc" id="mrc" hidden aria-label="Bình luận"><div class="mrc0"><b>Bình luận</b><button type="button" class="mri" id="mrcx" aria-label="Đóng bình luận">${mri("x")}</button></div><div class="mrcb" id="mrcb"></div></aside>
</div>`;
  const mr = $("#mr"), V = $("#mrv"), Q = $("#mrq"), PS = $("#mrps");
  let pi = 0, open = C.pin && !small();
  let back = false; try { back = sessionStorage.getItem("mrlast") === "1"; sessionStorage.removeItem("mrlast") } catch (e) {}
  if (back) pi = N - 1; // lùi từ trang đầu chương sau: mở ở trang cuối
  else { const b = BM.get(key); if (b && String(b.c) === String(i) && b.p > 0 && b.p < N) { pi = b.p; setTimeout(() => toast(`Đã mở lại trang ${pi + 1}/${N} bạn đọc dở`), 300) } }
  const spreads = () => { const L = [[0]]; for (let k = 1; k < N; k += 2) L.push(k + 1 < N ? [k, k + 1] : [k]); return L };
  const spOf = p => spreads().findIndex(a => a.includes(p));
  const save = () => { ls.set("mr", JSON.stringify(C)) };
  const apply = () => {
    Object.entries(C).forEach(([k, v]) => mr.dataset[k] = v); mr.classList.toggle("open", open); mr.classList.toggle("pinned", open && !!C.pin && !small());
    $("#mrpin").classList.toggle("on", !!C.pin); $("#mrpin").setAttribute("aria-pressed", !!C.pin);
    mr.querySelectorAll(".mro").forEach(b => b.outerHTML = cyc(b.dataset.k)); mr.querySelectorAll(".mro").forEach(b => b.onclick = () => { const L = MRO[b.dataset.k], j = L.findIndex(([v]) => v === C[b.dataset.k]); C[b.dataset.k] = L[(j + 1) % L.length][0]; save(); apply(); draw() });
  };
  const img = (p, cls = "") => `<img class="mrimg${cls}" src="${esc(pg[p])}" alt="Trang ${p + 1}" data-p="${p}" draggable="false"${C.mode === "strip" && Math.abs(p - pi) > 2 ? ' loading="lazy"' : ""}>`;
  const mark = () => {
    const cur = C.mode === "double" ? spreads()[spOf(pi)] : [pi], last = cur[cur.length - 1];
    $("#mrn").textContent = `${cur.map(x => x + 1).join("–")} / ${N}`; PS.value = cur[0];
    Q.querySelectorAll("button").forEach((b, k) => { b.classList.toggle("on", cur.includes(k)); b.classList.toggle("rd", k < cur[0]) });
    BM.page(key, i, last, N); $("#mrpp").disabled = pi <= 0 && i <= 0; $("#mrpn").disabled = last >= N - 1 && i >= n - 1;
  };
  const pre = p => { for (const k of [p + 1, p + 2, p + 3]) if (pg[k]) new Image().src = pg[k] };
  function draw() {
    if (C.mode === "strip") {
      V.innerHTML = `<div class="mrst">${pg.map((_, p) => img(p)).join("")}<div class="mrend">${endHtml()}</div></div>`;
      const t = V.querySelector(`[data-p="${pi}"]`); if (t && pi > 0) requestAnimationFrame(() => t.scrollIntoView({ block: "start" })); else V.scrollTop = 0;
      watchStrip();
    } else {
      const sp = C.mode === "double" ? spreads()[spOf(pi)] : [pi];
      V.innerHTML = `<div class="mrpg${sp.length > 1 ? " two" : ""}">${sp.map(p => img(p)).join("")}</div>`; V.scrollTop = 0; V.scrollLeft = C.dir === "rtl" ? V.scrollWidth : 0; pre(sp[sp.length - 1]);
    }
    mark();
  }
  const endHtml = () => i < n - 1 ? `<p>Hết chương</p><button type="button" class="mrbtn pri" onclick="location.hash='${base}/${i + 1}'">Đọc chương tiếp: ${esc(s.chapters[i + 1].t)}</button>` : `<p>Bạn đã đọc tới chương mới nhất</p><a class="mrbtn" href="${base}">Về trang truyện</a>`;
  let io = null;
  function watchStrip() {
    io?.disconnect(); io = new IntersectionObserver(E => { const vis = E.filter(e => e.isIntersecting).map(e => +e.target.dataset.p); if (!vis.length) return; const top = [...V.querySelectorAll(".mrimg")].find(el => el.getBoundingClientRect().bottom > V.getBoundingClientRect().top + 40); if (top) { pi = +top.dataset.p; mark() } }, { root: V, threshold: [0, .5] });
    V.querySelectorAll(".mrimg").forEach(el => io.observe(el));
  }
  const prevCh = () => { if (i > 0) { try { sessionStorage.setItem("mrlast", "1") } catch (e) {} } goto(i - 1) };
  const step = d => {
    if (C.mode === "strip") { V.scrollBy({ top: d * V.clientHeight * .85, behavior: "smooth" }); return }
    if (C.mode === "double") { const L = spreads(), j = spOf(pi) + d; if (j < 0) return prevCh(); if (j >= L.length) return goto(i + 1); pi = L[j][0] }
    else { const x = pi + d; if (x < 0) return prevCh(); if (x >= N) return goto(i + 1); pi = x }
    draw();
  };
  const jump = p => { pi = Math.max(0, Math.min(N - 1, p)); if (C.mode === "strip") { V.querySelector(`[data-p="${pi}"]`)?.scrollIntoView({ block: "start" }); mark() } else draw() };
  PS.innerHTML = pg.map((_, p) => `<option value="${p}">${p + 1}</option>`).join("");
  Q.innerHTML = pg.map((_, p) => `<button type="button" aria-label="Trang ${p + 1}" data-n="${p + 1}"></button>`).join("");
  Q.onclick = e => { const b = e.target.closest("button"); if (b) jump([...Q.children].indexOf(b)) };
  PS.onchange = () => { jump(+PS.value); PS.blur() };
  $("#mrcs").onchange = e => goto(+e.target.value);
  $("#mrpp").onclick = () => C.mode === "strip" ? (pi > 0 ? jump(pi - 1) : prevCh()) : step(-1); $("#mrpn").onclick = () => C.mode === "strip" ? (pi < N - 1 ? jump(pi + 1) : goto(i + 1)) : step(1);
  $("#mrcp").onclick = () => goto(i - 1); $("#mrcn").onclick = () => goto(i + 1);
  const panel = v => { open = v ?? !open; apply() };
  $("#mrk").onclick = $("#mrkf").onclick = () => panel(); $("#mrpx").onclick = () => panel(false);
  $("#mrpin").onclick = () => { C.pin = C.pin ? 0 : 1; save(); apply() };
  V.onclick = e => {
    if (open && !(C.pin && !small())) { panel(false); return }
    if (C.mode === "strip" || e.target.closest("button,a")) return;
    const r = V.getBoundingClientRect(), left = e.clientX < r.left + r.width / 2; step((left ? -1 : 1) * (C.dir === "rtl" ? -1 : 1));
  };
  if ($("#mrcm")) {
    let mounted = false; const cm = $("#mrc");
    $("#mrcm").onclick = () => { cm.hidden = !cm.hidden; if (!cm.hidden && !mounted) { mounted = true; mountCmt($("#mrcb"), `${kind}/${s.slug}/${c.file || (c.pages && c.pages[0]) || c.t}`) } };
    $("#mrcx").onclick = () => { cm.hidden = true };
  }
  RDKEY = d => step(C.dir === "rtl" && C.mode !== "strip" ? -d : d);
  const onKey = e => {
    if (!mr.isConnected) return removeEventListener("keydown", onKey);
    if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) return;
    if (e.key === "m" || e.key === "M") panel(); else if (e.key === "Escape") { if (!$("#mrc").hidden) $("#mrc").hidden = true; else if (open) panel(false) }
    else if (e.key === " " && C.mode !== "strip") { e.preventDefault(); step(e.shiftKey ? -1 : 1) }
  };
  addEventListener("keydown", onKey);
  const onR = () => { if (!mr.isConnected) return removeEventListener("resize", onR); apply() }; addEventListener("resize", onR);
  apply(); draw(); mr.focus({ preventScroll: true });
}
function mountCmt(box, term) { // gắn khung bình luận (ẩn danh hoặc giscus) vào một phần tử bất kỳ
  if (cmtMode() === "anon") return CMT.mount(box, term);
  const G = DATA.site.giscus; if (cmtMode() !== "giscus" || !G || !G.repo || !G.repoId || !G.category || !G.categoryId) return;
  const sc = document.createElement("script"); sc.src = "https://giscus.app/client.js";
  Object.entries({ "data-repo": G.repo, "data-repo-id": G.repoId, "data-category": G.category, "data-category-id": G.categoryId, "data-mapping": "specific", "data-term": term, "data-strict": "0", "data-reactions-enabled": "1", "data-emit-metadata": "0", "data-input-position": "top", "data-theme": "preferred_color_scheme", "data-lang": "vi", crossorigin: "anonymous" }).forEach(([k, v]) => sc.setAttribute(k, v));
  sc.async = true; box.appendChild(sc);
}
async function read(kind, s, i) {
  const c = s.chapters[i]; if (!c) { location.hash = `#${kind}/${s.slug}`; return }
  ls.set(kind + ":" + s.slug, i); ls.set("t:" + kind + ":" + s.slug, Date.now()); const rs = rdSet(kind, s); if (!rs.includes(i)) { rs.push(i); ls.set("r:" + kind + ":" + s.slug, JSON.stringify(rs)) }
  const base = `#${kind}/${s.slug}`, n = s.chapters.length;
  const goto = j => { if (j >= 0 && j < n) location.hash = `${base}/${j}` }; RDKEY = d => goto(i + d);
  const nav = `<div class="nv"><a class="btn" ${i > 0 ? `href="${base}/${i - 1}"` : "disabled"}>${ic(I.prev)}Chương trước</a><a class="btn pri" ${i < n - 1 ? `href="${base}/${i + 1}"` : "disabled"}>Chương sau${ic(I.next)}</a></div>`;
  const nx = s.chapters[i + 1], repU = DATA.site.report || (DATA.site.about || {}).discord, isU = u => /^https?:\/\//.test(u || "");
  const endc = `<section class="endc"><div class="endr">${i > 0 ? `<a class="btn" href="${base}/${i - 1}">${ic(I.prev)}Chương trước</a>` : ""}${nx ? `<a class="nxc" href="${base}/${i + 1}"><span>Chương tiếp theo${nx.vol && nx.vol !== c.vol ? ", " + esc(nx.vol) : ""}</span><b>${esc(nx.t)}</b>${ic(I.next)}</a>` : `<div class="nxc last"><span>Bạn đã đọc đến chương mới nhất</span><b>Chương mới sẽ hiện ở đây khi được đăng</b>${isFav(kind, s.slug) ? "" : `<button class="btn pri" id="fve" onclick="toggleFav('${kind}','${esc(s.slug)}')">${ic(I.bmark)}Theo dõi bộ này</button>`}</div>`}</div><div class="endf"><a href="${base}">Danh sách chương</a>${isU(repU) ? `<a href="${esc(repU)}" target="_blank" rel="noopener">Báo lỗi chương này</a>` : ""}</div></section>`;
  const opts = (() => { const o = j => `<option value="${j}" ${j == i ? "selected" : ""}>${esc(s.chapters[j].t)}</option>`; if (!s.chapters.some(x => (x.vol || "").trim())) return s.chapters.map((_, j) => o(j)).join(""); const g = new Map(); s.chapters.forEach((x, j) => { const v = (x.vol || "").trim() || "Chương lẻ"; if (!g.has(v)) g.set(v, []); g.get(v).push(j) }); return [...g].map(([v, a]) => `<optgroup label="${esc(v)}">${a.map(o).join("")}</optgroup>`).join("") })();
  app.innerHTML = `<div class="rbar"><a class="t" href="${base}" title="Về trang truyện">${esc(s.title)}</a><select aria-label="Chọn chương" onchange="location.hash='${base}/'+this.value">${opts}</select>${ADM ? `<a class="btn" href="admin.html#editchap/${kind}/${s.slug}/${i}">${ic(I.edit)}Sửa</a>` : ""}</div>
<header class="rh"><a class="rs" href="${base}">${esc(s.title)}</a>${c.vol ? `<div class="rv">${esc(c.vol)}</div>` : ""}<h1>${esc(c.t)}</h1><p id="meta">${fmtD(c.date)}</p></header>${nav}<article id="rd" class="rd ${isImgCh(c) ? "gal" : kind} ${kind === "novel" && !isImgCh(c) ? RS.ff + " " + RS.bg : ""}"></article>${endc}
${isImgCh(c) ? "" : `<button class="fab" id="rsb" title="Tùy chỉnh đọc" aria-label="Tùy chỉnh đọc" aria-expanded="false" onclick="rsToggle()"><svg class="i" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg></button>
<div class="rsp" id="rsp" hidden data-kind="${kind}"></div>`}`;
  if (kind === "manga" && !isImgCh(c)) { const pg = c.pages || Array.from({ length: c.n }, (_, k) => c.dir + String(k + 1).padStart(c.pad || 2, "0") + "." + (c.ext || "jpg")); if (pg.length) { mangaRead(kind, s, i, c, pg, base, repU); if (window.KGP) KGP.read({ key: `${kind}/${s.slug}/${i}`, series: `${kind}/${s.slug}`, genres: s.genres || [] }); return } }
  const rd = $("#rd");
  if (isImgCh(c)) {
    rd.innerHTML = c.pages.map((u, j) => `<button class="gi" onclick="lbShow(${j})" aria-label="Xem ảnh ${j + 1}"><img src="${esc(u)}" alt="Ảnh minh họa ${j + 1}" loading="lazy"></button>`).join("");
    LBL = c.pages; $("#meta").textContent += " · " + c.pages.length + " ảnh";
  } else if (kind === "novel") {
    let t = c.text; if (t == null) { rd.textContent = "Đang tải chương..."; try { const r = await fetch(c.file); if (!r.ok) throw 0; t = await r.text() } catch (e) { rd.innerHTML = "<p>Không tải được chương. Hãy mở web qua GitHub Pages (không mở file trực tiếp từ máy).</p>"; return } }
    const IL = [], IMR = /^\[img:\s*((?:novels|images)\/[\w./%-]+\.(?:webp|jpe?g|png|gif|avif)|https:\/\/[^\s|\]"'<>]+\.(?:webp|jpe?g|png|gif|avif)(?:\?[^\s|\]"'<>]*)?)\s*(?:\|\s*([^\]]*))?\]$/i;
    rd.innerHTML = t.split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => { const m = IMR.exec(l); if (!m) return `<p>${esc(l)}</p>`; IL.push(m[1]); return `<figure class="rimg"><button type="button" onclick="LBL=RIMG;lbShow(${IL.length - 1})" aria-label="Phóng to ảnh minh họa"><img src="${esc(m[1])}" alt="${esc(m[2] || "Ảnh minh họa")}" loading="lazy"></button>${m[2] ? `<figcaption>${esc(m[2])}</figcaption>` : ""}</figure>` }).join(""); window.RIMG = IL;
    $("#meta").textContent += " · " + fmtN(c.words || W(t.replace(/^\[img:[^\]\n]*\]$/gm, "")));
  } else {
    const pg = c.pages || Array.from({ length: c.n }, (_, k) => c.dir + String(k + 1).padStart(c.pad || 2, "0") + "." + (c.ext || "jpg"));
    if (ls.get("mm") === "page") {
      let pi = 0; { const b = BM.get(`${kind}/${s.slug}`); if (b && String(b.c) === String(i) && b.p > 0 && b.p < pg.length) { pi = b.p; toast(`Đã mở lại trang ${pi + 1}/${pg.length} bạn đọc dở`) } } rd.innerHTML = `<div class="pgv"><img id="pgimg" alt=""><div class="pgn"></div></div>`;
      const show = () => { BM.page(`${kind}/${s.slug}`, i, pi, pg.length); $("#pgimg").src = pg[pi]; $(".pgn").textContent = `Trang ${pi + 1} / ${pg.length}`; if (pg[pi + 1]) new Image().src = pg[pi + 1]; scrollTo({ top: Math.max(0, rd.offsetTop - 120) }) };
      const step = d => { const x = pi + d; if (x < 0) goto(i - 1); else if (x >= pg.length) goto(i + 1); else { pi = x; show() } };
      $(".pgv").onclick = e => { const r = e.currentTarget.getBoundingClientRect(); step(e.clientX < r.left + r.width / 2 ? -1 : 1) };
      RDKEY = step; if (pg.length) show();
    } else rd.innerHTML = pg.map(u => `<img src="${esc(u)}" alt="" loading="lazy">`).join("");
  }
  if (rd.isConnected && !$(".pgv")) BM.init(`${kind}/${s.slug}`, i, rd, isImgCh(c) ? "ảnh" : kind === "manga" ? "trang" : "đoạn");
  if (window.KGP && rd.isConnected) KGP.read({ key: `${kind}/${s.slug}/${i}`, series: `${kind}/${s.slug}`, genres: s.genres || [] });
  if (cmtMode() === "anon" && rd.isConnected) { const bx = document.createElement("section"); app.appendChild(bx); CMT.mount(bx, `${kind}/${s.slug}/${c.file || (c.pages && c.pages[0]) || c.t}`) }
  const G = DATA.site.giscus;
  if (cmtMode() === "giscus" && G && G.repo && G.repoId && G.category && G.categoryId && rd.isConnected) {
    const box = document.createElement("section"); box.className = "sec rh"; box.innerHTML = '<div class="sh"><h2>Bình luận</h2></div>'; app.appendChild(box);
    const sc = document.createElement("script"); sc.src = "https://giscus.app/client.js";
    Object.entries({ "data-repo": G.repo, "data-repo-id": G.repoId, "data-category": G.category, "data-category-id": G.categoryId, "data-mapping": "specific", "data-term": `${kind}/${s.slug}/${c.file || (c.pages && c.pages[0]) || c.t}`, "data-strict": "0", "data-reactions-enabled": "1", "data-emit-metadata": "0", "data-input-position": "top", "data-theme": "preferred_color_scheme", "data-lang": "vi", crossorigin: "anonymous" }).forEach(([k, v]) => sc.setAttribute(k, v));
    sc.async = true; box.appendChild(sc);
  }
}
/* ---------- Sidebar mode & top bar ---------- */
let reading_ = false;
function sideMode() { const ov = innerWidth < 1100 || reading_ || ls.get("sc") === "1"; document.body.classList.toggle("ov", ov); if (!ov) document.body.classList.remove("so") }
function setClear() { document.body.classList.toggle("clear", !!$("#hero, .tpb") && scrollY < 40) }
$("#hb").onclick = () => { if (innerWidth >= 1100 && !reading_) { ls.set("sc", ls.get("sc") === "1" ? "0" : "1"); sideMode() } else document.body.classList.toggle("so") };
$("#sx").onclick = $("#scrim").onclick = () => document.body.classList.remove("so");
addEventListener("resize", sideMode);

/* ---------- Đánh dấu chỗ đọc: tự nhớ đoạn đang đọc của mỗi bộ, lần sau mở lại đúng chỗ ---------- */
const BM = (() => {
  let cur = null, T = 0;
  const K = k => "bm:" + k;
  const get = k => { try { return JSON.parse(ls.get(K(k)) || "null") } catch (e) { return null } };
  const top = () => { let h = $("#top") ? $("#top").offsetHeight : 56; const rb = $(".rbar"); if (rb && /sticky|fixed/.test(getComputedStyle(rb).position)) h += rb.offsetHeight; return h + 14 };
  function pos(rd) {
    const L = rd.children, n = L.length; if (!n) return null;
    const r = rd.getBoundingClientRect();
    if (r.bottom <= innerHeight + 4) return n; // đã đọc tới cuối chương
    if (r.top > top()) return 0;
    for (let j = 0; j < n; j++) if (L[j].getBoundingClientRect().bottom > top() + 8) return j;
    return n - 1;
  }
  function save() {
    if (!cur) return; if (!cur.rd.isConnected) return off();
    const p = pos(cur.rd); if (p == null || p === cur.p) return; cur.p = p;
    ls.set(K(cur.key), JSON.stringify({ c: cur.c, p, n: cur.rd.children.length, t: Date.now() }));
  }
  const onS = () => { clearTimeout(T); T = setTimeout(save, 350) };
  const onV = () => { if (document.visibilityState !== "visible") save() };
  const manual = () => { if (cur) cur.user = true };
  function bar(txt, back) {
    $("#bmbar")?.remove();
    const b = document.createElement("div"); b.id = "bmbar"; b.setAttribute("role", "status");
    b.innerHTML = `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg><span>${txt}</span><button type="button" class="bmb">Đọc từ đầu</button><button type="button" class="bmx" aria-label="Đóng">×</button>`;
    document.body.appendChild(b); requestAnimationFrame(() => b.classList.add("on"));
    const hide = () => { b.classList.remove("on"); setTimeout(() => b.remove(), 300) };
    b.querySelector(".bmb").onclick = () => { back(); hide() }; b.querySelector(".bmx").onclick = hide; setTimeout(hide, 9000);
  }
  function jump(p, unit) {
    if (!cur) return; const el = cur.rd.children[p]; if (!el) return;
    const go = () => scrollTo(0, Math.max(0, el.getBoundingClientRect().top + scrollY - top()));
    go(); el.classList.add("bmhit"); setTimeout(() => el.classList.remove("bmhit"), 2600);
    // Ảnh phía trên tải xong có thể đẩy chữ xuống: giữ đúng chỗ trong vài giây đầu, trừ khi người đọc tự cuộn
    const c0 = cur, t0 = Date.now(), fix = () => { if (cur === c0 && !c0.user && Date.now() - t0 < 4000) go() };
    cur.rd.addEventListener("load", fix, true); setTimeout(() => c0.rd.removeEventListener("load", fix, true), 4200);
    bar(`Đã mở lại chỗ bạn đọc dở, ${unit} ${p + 1}/${cur.rd.children.length}`, () => { scrollTo(0, 0); el.classList.remove("bmhit") });
  }
  function init(key, c, rd, unit = "đoạn") {
    off(); if (!rd || !rd.children.length) return;
    cur = { key, c: String(c), rd, p: null, user: false };
    addEventListener("scroll", onS, { passive: true }); document.addEventListener("visibilitychange", onV); addEventListener("pagehide", save);
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => addEventListener(e, manual, { passive: true }));
    const b = get(key);
    if (b && String(b.c) === cur.c && b.p > 0 && b.p < rd.children.length) { cur.p = b.p; setTimeout(() => jump(b.p, unit), 80) }
  }
  function off() {
    if (!cur) return; clearTimeout(T); if (cur.rd.isConnected) save();
    removeEventListener("scroll", onS); document.removeEventListener("visibilitychange", onV); removeEventListener("pagehide", save);
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => removeEventListener(e, manual)); cur = null; $("#bmbar")?.remove();
  }
  // Chế độ lật từng trang của manga: lưu số trang thay cho vị trí cuộn
  const page = (key, c, p, n) => ls.set(K(key), JSON.stringify({ c: String(c), p: p >= n - 1 ? n : p, n, t: Date.now() }));
  // Phần trăm đã đọc của chương đang dở, để hiện trên nút Đọc tiếp
  const pct = (key, c) => { const b = get(key); return b && String(b.c) === String(c) && b.p > 0 && b.p < b.n ? Math.max(1, Math.round(b.p / b.n * 100)) : null };
  return { init, off, get, page, pct };
})();
window.BM = BM;
function route() {
  BM.off();
  try { if (location.hash && !/^#(viet\/(dang-nhap|dang-ky|quen-mat-khau)|viet$|access_token|error)/.test(location.hash)) sessionStorage.setItem("klast", location.hash) } catch (e) {}
  RDKEY = null; clearInterval(HT); HI = 0; document.body.classList.remove("so", "mrx"); if (window.KGP) KGP.stop();
  const [a, b, c] = decodeURIComponent(location.hash.slice(1)).split("/");
  if (window.KGP && KGP.handles(a)) {
    reading_ = false; sideMode(); document.body.classList.remove("rdg");
    document.querySelectorAll("#nv a").forEach(x => x.classList.toggle("on", x.dataset.k === a));
    scrollTo(0, 0); setClear(); setTitle(a);
    KGP.route(a, b).then(() => { setClear(); gcCount() });
    return;
  }
  if (!window.ST && ["sang-tac", "viet", "st", "tg", "noi-quy", "kiem-duyet"].includes(a)) { app.innerHTML = `<section class="sec"><p class="empty">${sbOn() ? "Chưa tải được file js/sangtac.js. Hãy tải thư mục js lên GitHub rồi tải lại trang." : "Khu Sáng tác và tài khoản chưa được bật. Quản trị viên cần kết nối Supabase trong trang quản trị."}</p></section>`; return }
  if (window.ST && ST.handles(a)) {
    reading_ = a === "st" && !!c; sideMode(); document.body.classList.toggle("rdg", reading_);
    document.querySelectorAll("#nv a").forEach(x => x.classList.toggle("on", x.dataset.k === "sang-tac" && (a === "sang-tac" || a === "st")));
    scrollTo(0, 0); setClear();
    ST.route().then(() => { scrollTo(0, 0); setClear(); shArrows(); gcCount() });
    return;
  }
  const s = b && ({ novel: DATA.novels, manga: DATA.manga }[a] || []).find(x => x.slug === b);
  const k = a === "novel" ? (s && isWN(s) ? "webnovel" : "novels") : a === "fav" ? "library" : a || "home";
  document.querySelectorAll("#nv a").forEach(x => x.classList.toggle("on", x.dataset.k === k));
  reading_ = !!s && c !== undefined; sideMode(); document.body.classList.toggle("rdg", reading_);
  if (a === "tim-kiem") { if (b === "g" && c) FS = { ...FS0, k: [], st: [], g: [(GREG().find(x => x.slug === c) || {}).name || c] }; app.innerHTML = P["tim-kiem"](); searchInit() }
  else if (a === "the-loai") app.innerHTML = P.genre(b, c);
  else if (a === "tac-gia") app.innerHTML = P.author(b || "");
  else if (s) c !== undefined ? read(a, s, +c) : detail(a, s);
  else app.innerHTML = (P[k] || P.home)();
  scrollTo(0, 0); setClear(); shArrows(); setTitle(a, b, c, s); gcCount();
  if ($("#st_home") && window.ST) ST.homeShelf();
  if (k === "library" && window.ST && ST.libRefresh && stFavs().length) ST.libRefresh();
  navBadge();
  if (document.querySelectorAll(".hs").length > 1) HT = setInterval(() => heroGo(1), 8000);
}
$("#q").addEventListener("input", e => {
  const f = e.target.value.trim().toLowerCase(); if (!f) return route();
  clearInterval(HT); reading_ = false; sideMode();
  const m = d => JSON.stringify(d).toLowerCase().includes(f);
  const ss = allS().filter(x => m(x.s)).map(({ k, s }) => card(k, s)), pj = DATA.projects.filter(m).map(projCard), oth = [...DATA.links.filter(m).map(R.links), ...DATA.videos.filter(m).map(R.videos)];
  const tl = DATA.tips.filter(m).map(R.tips).join("") + TOOLS.map((t, i) => [t, i]).filter(([t]) => t.t.toLowerCase().includes(f)).map(([t, i]) => toolUI(t, i)).join("");
  const body = (ss.length ? sec("Truyện", null, `<div class="series">${ss.join("")}</div>`) : "") + (pj.length ? sec("Dự án", null, `<div class="grid">${pj.join("")}</div>`) : "") + (tl ? sec("Mẹo và công cụ", null, tl) : "") + (oth.length ? sec("Liên kết và video", null, `<div class="grid">${oth.join("")}</div>`) : "");
  app.innerHTML = `<section class="sec"><div class="sh"><h2>Kết quả cho “${esc(e.target.value)}”</h2><a class="lnk" href="#tim-kiem" onclick="FS = { ...FS0, k: [], st: [], g: [], q: $('#q').value }; ls.set('fs', JSON.stringify(FS))">Lọc nâng cao</a></div></section>` + (body || '<p class="empty">Không tìm thấy kết quả. Thử từ khóa ngắn hơn hoặc tên khác của bộ truyện.</p>');
  setClear();
});
let LBL = [], LBI = 0;
const lbOpen = () => $("#lb").style.display === "flex";
function lbShow(j) { LBI = (j + LBL.length) % LBL.length; $("#lb img").src = LBL[LBI]; $("#lb .lbc").textContent = LBL.length > 1 ? `${LBI + 1} / ${LBL.length}` : ""; $("#lb").classList.toggle("one", LBL.length < 2); $("#lb").style.display = "flex"; if (LBL[LBI + 1]) new Image().src = LBL[LBI + 1] }
const lbClose = () => $("#lb").style.display = "none";
app.addEventListener("click", e => { if (e.target.matches("details img")) { LBL = [e.target.src]; lbShow(0) } });
$("#lb").onclick = e => { if (e.target.closest(".lbp")) lbShow(LBI - 1); else if (e.target.closest(".lbn")) lbShow(LBI + 1); else if (e.target.closest(".lbx") || e.target.id === "lb") lbClose() };
let lbX = null; $("#lb").addEventListener("touchstart", e => lbX = e.touches[0].clientX, { passive: true });
$("#lb").addEventListener("touchend", e => { if (lbX == null) return; const dx = e.changedTouches[0].clientX - lbX; lbX = null; if (Math.abs(dx) > 50 && LBL.length > 1) lbShow(LBI + (dx < 0 ? 1 : -1)) });
const root = document.documentElement; if (ls.get("theme")) root.dataset.theme = ls.get("theme");
$("#th").onclick = () => { const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), n = cur === "dark" ? "light" : "dark"; root.dataset.theme = n; ls.set("theme", n) };
addEventListener("scroll", () => { const h = document.documentElement.scrollHeight - innerHeight; $("#pg").style.width = (h > 0 ? scrollY / h * 100 : 0) + "%"; $("#pg").style.opacity = $("#rd") ? 1 : 0; $("#up").hidden = scrollY < 600; setClear() }, { passive: true });
$("#up").onclick = () => scrollTo({ top: 0, behavior: "smooth" });
addEventListener("click", e => { const p = $("#rsp"), path = e.composedPath(); if (p && !p.hidden && !path.includes(p) && !path.includes($("#rsb"))) rsToggle(false) });
addEventListener("keydown", e => { if (lbOpen()) { if (e.key === "Escape") lbClose(); else if (e.key === "ArrowRight") lbShow(LBI + 1); else if (e.key === "ArrowLeft") lbShow(LBI - 1); return } if (e.key === "Escape" && $("#rsp") && !$("#rsp").hidden) { rsToggle(false); return } if (!RDKEY || e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) return; if (e.key === "ArrowRight") RDKEY(1); else if (e.key === "ArrowLeft") RDKEY(-1) });
addEventListener("hashchange", () => { $("#q").value = ""; route() });
applyRS(); renderSide(); sideMode();
/* Phần Sáng tác, bình luận và Tu luyện chỉ tải khi đã kết nối Supabase.
   Lần sau ghé lại thì tải song song với data.json cho nhanh. */
const EXTRAS = ["js/sangtac.js", "js/game.js", "js/tuluyen.js"], sbOn = () => /^https:\/\//.test((DATA.site.sb || {}).url || "") && !!(DATA.site.sb || {}).key;
const loadJs = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src + (VER ? "?v=" + VER : ""); s.async = false; s.onload = ok; s.onerror = () => no(new Error("Không tải được " + src)); document.body.appendChild(s) });
let extrasP = null;
const loadExtras = () => extrasP ??= Promise.all(EXTRAS.map(f => loadJs(f).catch(e => console.warn(e.message))));
if (ls.get("kx")) loadExtras();
(async () => {
  try { const r = await fetch("data.json?v=" + Date.now()); if (r.ok) Object.assign(DATA, await r.json()) } catch (e) {}
  DATA.site ??= {}; DATA.projects ??= []; applyTcap(); if (window.KG && KG.addFonts) KG.addFonts(DATA.site.fonts);
  if (sbOn()) { ls.set("kx", "1"); await loadExtras() } else ls.del("kx");
  gcInit(); renderSide(); renderAnn(); if (window.ST) ST.initBtn();
  route();
  if ((DATA.site.kiku || {}).on !== false) setTimeout(() => loadJs("js/kiku.js").catch(() => {}), 500); // trợ lý Kiku ở góc web
})();
