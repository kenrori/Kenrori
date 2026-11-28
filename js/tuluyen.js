/* Kenrori: Tu luyện phía người đọc — tính giờ đọc, Linh Thạch rơi, trang Tu luyện, Cửa hàng, Kho đồ, Bảng xếp hạng,
   danh hiệu trong bình luận và hồ sơ, bảng điều chỉnh thành viên cho Admin. Cần sangtac.js (tài khoản) và game.js (hiệu ứng). */
(() => {
  const $ = s => document.querySelector(s), esc = KG.esc, app = document.getElementById("app");
  const ROUTES = ["tu-luyen", "cua-hang", "kho-do", "bang-xep-hang"];
  const on = () => { try { return DATA.site.game === true && !!window.ST && ST.acct() } catch (e) { return false } };
  let sb = null, S = null, ITEMS = null, ACH = null;
  const CARDS = {};
  const cur = () => (S && S.cfg && S.cfg.currency) || "Linh Thạch";
  const n0 = v => (+v || 0).toLocaleString("vi-VN");
  const hrs = s => { s = +s || 0; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${n0(h)} giờ ${m} phút` : `${m} phút` };
  const STONE = '<svg class="kst" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5 19.5 7.5 17 20 12 22.5 7 20 4.5 7.5z" fill="url(#kstg)"/><path d="M12 1.5 9 7.5h6z" fill="#ffffff66"/><path d="M4.5 7.5h15M12 1.5 9 7.5l3 15 3-15z" fill="none" stroke="#ffffffa8" stroke-width=".8" stroke-linejoin="round"/><path class="kst-s" d="M19.5 1.5c.2 1.3.5 1.6 1.8 1.8-1.3.2-1.6.5-1.8 1.8-.2-1.3-.5-1.6-1.8-1.8 1.3-.2 1.6-.5 1.8-1.8z" fill="#fff"/></svg>';
  /* Bộ gradient dùng chung cho mọi biểu tượng, khai báo một lần để không trùng id */
  if (!document.getElementById("tl-defs")) document.body.insertAdjacentHTML("beforeend", `<svg id="tl-defs" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>
<linearGradient id="kstg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#c4fcff"/><stop offset=".45" stop-color="#6aa8ff"/><stop offset="1" stop-color="#c06bff"/></linearGradient>
<linearGradient id="tlg" gradientUnits="userSpaceOnUse" x1="8" y1="4" x2="40" y2="44"><stop offset="0" stop-color="#fff3b8"/><stop offset=".45" stop-color="#ffd84d"/><stop offset="1" stop-color="#d0901a"/></linearGradient>
<linearGradient id="tlgb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3b8"/><stop offset=".45" stop-color="#ffd84d"/><stop offset="1" stop-color="#d0901a"/></linearGradient>
<linearGradient id="tlv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb8ff"/><stop offset=".5" stop-color="#ff2bff"/><stop offset="1" stop-color="#8a2be2"/></linearGradient>
<clipPath id="tlcup"><path d="M15 7.5h18v9.5c0 6-4 11-9 11s-9-5-9-11z"/></clipPath><linearGradient id="tlf" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff00ff"/><stop offset=".6" stop-color="#ffb3ff"/><stop offset="1" stop-color="#fff"/></linearGradient></defs></svg>`);
  async function client() { if (!sb) sb = await ST.client(); return sb }
  async function rpc(fn, args) { await client(); const r = await sb.rpc(fn, args || {}); if (r.error) throw r.error; return r.data }
  const msg = e => { const m = String((e && (e.message || e.error_description)) || e || ""); return /function .* does not exist|schema cache|404/i.test(m) ? "Máy chủ chưa có hệ thống Tu luyện. Hãy chạy file tu-luyen.sql trong Supabase." : m || "Có lỗi xảy ra, hãy thử lại." };
  const me = () => window.ST && ST.me && ST.me();

  /* ---------- Trạng thái của tôi ---------- */
  async function boot() {
    if (!on()) { chip(); return }
    try { await client() } catch (e) { return }
    if (!me()) { S = null; chip(); return }
    try { S = await rpc("player_init"); KG.setDefault(S.cfg && S.cfg.fx_default); chip(); events(S.events || []) } catch (e) { S = null; chip() }
  }
  function set(st) { if (!st) return; S = { ...(S || {}), ...st }; chip() }
  function chip() {
    let c = $("#kchip");
    if (!on() || !S) { if (c) c.remove(); return }
    if (!c) { c = document.createElement("a"); c.id = "kchip"; c.href = "#tu-luyen"; const ref = $("#stu"); if (!ref) return; ref.before(c) }
    const p = Math.min(100, (S.exp / Math.max(1, S.need)) * 100);
    c.title = `Cấp ${S.level}, ${n0(S.exp)}/${n0(S.need)} EXP, ${n0(S.stones)} ${cur()}`;
    c.innerHTML = `<b>Lv.${n0(S.level)}</b><span class="kcb"><i style="width:${p.toFixed(1)}%"></i></span><span class="kcs">${STONE}${n0(S.stones)}</span>`;
  }

  /* ---------- Thông báo nhỏ ở góc, không chặn việc đọc ---------- */
  function pop(html, cls = "") {
    let box = $("#kpop"); if (!box) { box = document.createElement("div"); box.id = "kpop"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box) }
    const el = document.createElement("div"); el.className = "kpo " + cls; el.innerHTML = html; box.appendChild(el);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => el.classList.add("out"), cls.includes("big") ? 6500 : 4200); setTimeout(() => el.remove(), cls.includes("big") ? 7200 : 4900);
  }
  function events(ev) {
    for (const e of ev || []) {
      if (e.t === "level") pop(`<span class="kpi kpl">${n0(e.to)}</span><div><b>Thăng cấp!</b><span>Bạn đã đạt cấp ${n0(e.to)}</span></div>`, "lv big");
      else if (e.t === "drop") pop(`<span class="kpi kpc">${STONE}</span><div><b>+${n0(e.n)} ${esc(cur())}</b><span>${e.tier && e.tier !== "Thường" ? esc(e.tier) + ", " : ""}nhặt được khi đang đọc</span></div>`, "drop" + (e.n >= 50 ? " rare" : ""));
      else if (e.t === "stones") pop(`<span class="kpi kpc">${STONE}</span><div><b>+${n0(e.n)} ${esc(cur())}</b><span>${esc(e.why || "")}</span></div>`, "drop");
      else if (e.t === "ach") pop(`<span class="kpi kpa">${achIc(e.id, e.icon)}</span><div><b>Thành tựu: ${esc(e.name)}</b><span>Đã mở khóa, xem phần thưởng trong Tu luyện</span></div>`, "ach big");
      else if (e.t === "encounter") pop(`<span class="kpi kpe">${KG.icon("comet")}</span><div><b>Kỳ ngộ!</b><span>+${n0(e.n)} ${esc(cur())}, +${n0(e.exp)} EXP${e.item ? `, nhận danh hiệu bí mật ${esc(e.item.name)}` : ""}</span></div>`, "enc big");
      else if (e.t === "item") pop(`<span class="kpi kpa">${KG.icon("gem")}</span><div><b>Nhận vật phẩm</b><span>${esc(e.why || "")}</span></div>`, "ach");
    }
  }

  /* ---------- Tính giờ đọc ---------- */
  const SID = (() => { try { let s = sessionStorage.getItem("ksid"); if (!s) { s = crypto.getRandomValues(new Uint32Array(3)).join("").slice(0, 24); sessionStorage.setItem("ksid", s) } return s } catch (e) { return String(Math.random()).slice(2, 18) + "x" } })();
  let TR = null, warned = false;
  function prog() {
    const rd = document.getElementById("rd"); if (!rd) return 0;
    const pg = rd.querySelector(".pgn"); if (pg) { const m = /(\d+)\s*\/\s*(\d+)/.exec(pg.textContent); if (m) return +m[1] / +m[2] }
    const r = rd.getBoundingClientRect(); if (r.height < 50) return 1;
    return Math.max(0, Math.min(1, (innerHeight - r.top) / r.height));
  }
  const act = () => { if (TR) TR.acts++ };
  let lastS = 0; const onScroll = () => { const t = Date.now(); if (t - lastS > 1500) { lastS = t; act() } };
  async function send(final) {
    if (!TR || !S) return; const t = TR; const p = Math.max(t.prog, prog()); t.prog = p;
    if (t.active < (final ? 10 : 5)) return;
    const body = { k: t.key, series: t.series, genres: t.genres, sid: SID, active: Math.min(t.active, 90), acts: t.acts, prog: +p.toFixed(3), done: p >= .9 };
    t.active = 0; t.acts = 0;
    try { const r = await rpc("reader_tick", body); if (r.other_tab) { if (!warned) { warned = true; pop(`<span class="kpi">${KG.icon("clock")}</span><div><b>Đang tính giờ ở tab khác</b><span>Mỗi lúc chỉ tính giờ đọc ở một tab.</span></div>`) } return } set(r); events(r.events) } catch (e) {}
  }
  function read(o) {
    stop();
    if (!on() || !me() || !o || !o.key) return;
    TR = { ...o, genres: (o.genres || []).slice(0, 20), active: 0, acts: 1, prog: 0, iv: null };
    TR.iv = setInterval(() => { if (!TR) return; if (document.visibilityState === "visible") TR.active++; TR.prog = Math.max(TR.prog, prog()); if (TR.active >= 30) send() }, 1000);
    addEventListener("scroll", onScroll, { passive: true }); addEventListener("keydown", act); addEventListener("pointerdown", act); addEventListener("wheel", onScroll, { passive: true }); addEventListener("touchmove", onScroll, { passive: true });
  }
  function stop() {
    if (!TR) return; send(true); clearInterval(TR.iv); TR = null;
    removeEventListener("scroll", onScroll); removeEventListener("keydown", act); removeEventListener("pointerdown", act); removeEventListener("wheel", onScroll); removeEventListener("touchmove", onScroll);
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && TR) send(true) });

  /* ---------- Thẻ người dùng (danh hiệu, khung, màu tên) dùng trong bình luận ---------- */
  async function cards(ids) {
    if (!on()) return; ids = [...new Set(ids)].filter(x => x && !(x in CARDS)); if (!ids.length) return;
    try { const r = await rpc("player_public", { ids }); ids.forEach(i => CARDS[i] = (r && r[i]) || null) } catch (e) { ids.forEach(i => CARDS[i] = null) }
  }
  const card = id => CARDS[id] || null;

  /* ---------- Điều kiện nhận vật phẩm ---------- */
  function cond(it) {
    const o = it.obtain || [], L = [];
    if (it.secret) return ["Danh hiệu bí mật"];
    if (o.includes("achievement")) L.push(it.ach_name ? `Thành tựu: ${it.ach_name}` : "Nhận từ thành tựu");
    if (o.includes("level")) L.push("Thưởng mốc cấp độ");
    if (o.includes("event")) L.push("Vật phẩm sự kiện");
    if (o.includes("admin")) L.push("Chỉ được trao tặng");
    if (o.includes("encounter")) L.push("Có thể nhận khi gặp kỳ ngộ");
    if (o.includes("shop") && it.level_req > 1) L.push(`Cần cấp ${it.level_req}`);
    if (o.includes("shop") && it.ach_req) L.push(`Cần thành tựu ${it.ach_name || it.ach_req}`);
    if (it.limit_count) L.push(`Giới hạn ${n0(it.limit_count)} người, còn ${n0(Math.max(0, it.limit_count - it.owners))}`);
    if (it.sell_until) L.push(`Mở bán tới ${new Date(it.sell_until).toLocaleDateString("vi-VN")}`);
    if (it.sell_from && new Date(it.sell_from) > new Date()) L.push(`Mở bán từ ${new Date(it.sell_from).toLocaleString("vi-VN")}`);
    if (it.duration_days) L.push(`Sở hữu ${it.duration_days} ngày`);
    if (it.status === "off") L.push("Đã ngừng bán");
    return L;
  }
  const priceOf = it => it.sale != null ? it.sale : it.price;
  const buyable = it => !it.secret && (it.obtain || []).includes("shop") && ["on", "limited"].includes(it.status) && !(it.sell_from && new Date(it.sell_from) > new Date()) && !(it.sell_until && new Date(it.sell_until) <= new Date());
  const QB = it => `<span class="kqb" style="--q:${KG.QC[(it.q || 1) - 1]}">${KG.QN[(it.q || 1) - 1]}${it.ex ? ", độc quyền" : ""}</span>`;
  async function items(force) { if (!ITEMS || force) ITEMS = await rpc("shop_items"); return ITEMS }

  /* ---------- Khung chung ---------- */
  const head = (t, sub) => `<div class="sh"><h2>${t}</h2>${sub || ""}</div>`;
  const nav = cur => `<nav class="ktabs" aria-label="Tu luyện">${[["tu-luyen", "Tu luyện"], ["cua-hang", "Cửa hàng"], ["kho-do", "Kho đồ"], ["bang-xep-hang", "Bảng xếp hạng"]].map(([h, l]) => `<a href="#${h}"${h === cur ? ' class="on" aria-current="page"' : ""}>${l}</a>`).join("")}</nav>`;
  const gate = () => `<section class="sec kgate">${KG.icon("crown")}<h2>Tu luyện cùng Kenrori</h2><p>Đăng nhập để tích EXP khi đọc, nhặt ${esc(cur())}, mở khóa danh hiệu và trang trí hồ sơ. Không cần làm nhiệm vụ, cứ đọc truyện như bình thường.</p><div class="acts"><a class="btn pri" href="#viet/dang-nhap">Đăng nhập</a><a class="btn" href="#viet/dang-ky">Tạo tài khoản</a><a class="btn" href="#bang-xep-hang">Xem bảng xếp hạng</a></div></section>`;
  const errbox = e => `<section class="sec"><p class="empty">${esc(msg(e))}</p></section>`;
  const loading = () => { app.innerHTML = '<section class="sec"><p class="empty">Đang tải...</p></section>' };
  const avOf = (c, size = 56) => KG.avatar(`<span class="kav" style="--s:${size}px">${c.avatar && /^https:\/\//.test(c.avatar) ? `<img src="${esc(c.avatar)}" alt="">` : esc([...(c.name || "?")][0])}</span>`, c.eq, size);

  /* ---------- Biểu tượng động của trang Tu luyện (SVG tự vẽ, màu lấy từ bộ gradient chung) ---------- */
  const SPK = (x, y, s = 1, d = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><path class="tl-spk" style="animation-delay:${d}s" d="M0-6C.7-1.2 1.2-.7 6 0 1.2.7.7 1.2 0 6-.7 1.2-1.2.7-6 0-1.2-.7-.7-1.2 0-6z"/></g>`;
  const TLI = {
    hourglass: `<g class="tl-flip"><path d="M14 7c0 9 7 12 9 17-2 5-9 8-9 17h20c0-9-7-12-9-17 2-5 9-8 9-17z" class="tl-gl"/><path class="tl-st" d="M17.5 12h13c-1 4-4.5 7-6.5 9.5-2-2.5-5.5-5.5-6.5-9.5z"/><path class="tl-sb" d="M16.5 39.5c1-5.5 4.5-7.5 7.5-8.5 3 1 6.5 3 7.5 8.5z"/><path class="tl-fl" d="M24 22v16"/><path d="M11 6.5h26M11 41.5h26" class="tl-ln"/></g>${SPK(41, 9, .8, 1.2)}`,
    book: `<path d="M24 13c-5-3.5-12-4.5-19-3.5v27c7-1 14 0 19 3.5 5-3.5 12-4.5 19-3.5v-27c-7-1-14 0-19 3.5z" class="tl-gl"/><path d="M9 16.5c4-.5 8 0 11 1.5M9 21.5c4-.5 8 0 11 1.5M9 26.5c4-.5 8 0 11 1.5M28 18c3-1.5 7-2 11-1.5M28 23c3-1.5 7-2 11-1.5M28 28c3-1.5 7-2 11-1.5" class="tl-tx"/><path class="tl-pg" d="M24 13c4.5-3 9.5-3.6 15-3.2v27c-5.5-.4-10.5.2-15 3.2z"/><path d="M24 13v27" class="tl-ln"/>${SPK(42, 7, .8, .4)}`,
    books: `<rect x="7" y="31" width="33" height="8.5" rx="2" class="tl-gf"/><rect x="10" y="22" width="30" height="8.5" rx="2" class="tl-vf"/><g class="tl-bob"><rect x="8" y="12.5" width="30" height="8.5" rx="2" class="tl-gf" transform="rotate(-7 23 17)"/></g><path d="M12 35.2h24M15 26.2h21" class="tl-tx"/>${SPK(42, 8, .8, 2)}`,
    calendar: `<rect x="7" y="10" width="34" height="31" rx="5" class="tl-gl"/><path d="M7.5 18h33" class="tl-ln"/><path d="M15.5 6v8M32.5 6v8" class="tl-ln"/><path class="tl-ck" d="M16 29.5l6 6 11-12"/>${SPK(41, 37, .7, .8)}`,
    crown: `<path d="M7 17l9 8 8-13 8 13 9-8-4 21H11z" class="tl-gf"/><path d="M11 38.5h26" class="tl-ln"/><circle class="tl-gm" cx="16.5" cy="31" r="2.3"/><circle class="tl-gm" cx="24" cy="28.5" r="2.7" style="animation-delay:.6s"/><circle class="tl-gm" cx="31.5" cy="31" r="2.3" style="animation-delay:1.2s"/>${SPK(24, 6, .85, 1.6)}`,
    trophy: `<path d="M15 11H8.5c0 6 3 9 8 9.5M33 11h6.5c0 6-3 9-8 9.5" class="tl-ln"/><path d="M15 7.5h18v9.5c0 6-4 11-9 11s-9-5-9-11z" class="tl-gf"/><path d="M24 28v6M16.5 41h15l-2-6.5h-11z" class="tl-gf"/><g clip-path="url(#tlcup)"><path class="tl-sh" d="M14 6h5l-9 26H5z"/></g><path d="M19.5 13.5l2 2 4-4.5" class="tl-tx"/>${SPK(40, 6, .8, .3)}`
  };
  const tli = (k, cls = "") => `<svg class="tli tli-${k} ${cls}" viewBox="0 0 48 48" aria-hidden="true">${TLI[k]}</svg>`;
  const BAGUA = [7, 0, 3, 6, 5, 2, 4, 1];
  const SEAL = `<svg class="tl-sl" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="77" class="tl-s0"/>
<g class="tl-s1"><circle cx="80" cy="80" r="73" class="tl-sr" stroke-dasharray="1.5 5.5"/><circle cx="80" cy="80" r="60" class="tl-sr"/>${BAGUA.map((b, i) => `<g transform="rotate(${i * 45} 80 80)">${[0, 1, 2].map(l => (b >> l) & 1 ? `<path d="M72 ${10 + l * 3.6}h16"/>` : `<path d="M72 ${10 + l * 3.6}h6.5M81.5 ${10 + l * 3.6}h6.5"/>`).join("")}</g>`).join("")}</g>
<g class="tl-s2"><rect x="48" y="48" width="64" height="64"/><rect x="48" y="48" width="64" height="64" transform="rotate(45 80 80)"/><circle cx="80" cy="80" r="45"/></g></svg>`;
  const RING = `<svg class="tl-rg" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="64" class="tl-r1"/><g class="tl-r2w"><circle cx="70" cy="70" r="68.5" class="tl-r2" stroke-dasharray="46 10 3 10"/></g>${[0, 90, 180, 270].map(a => `<path class="tl-r3" d="M70 0l4.5 6.5L70 13l-4.5-6.5z" transform="rotate(${a} 70 70)"/>`).join("")}</svg><i class="tl-orb"></i><i class="tl-orb b"></i>`;
  const EMBLEM = `<svg class="tl-emb" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="36" r="24" class="tl-eh"/><path class="tl-lot" d="M32 55c-9.5 0-18-4-21-11.5 6-1 11.5 1 14.5 4.2-3-8.5 0-16.5 6.5-21.7 6.5 5.2 9.5 13.2 6.5 21.7 3-3.2 8.5-5.2 14.5-4.2C50 51 41.5 55 32 55z"/><path class="tl-flm" d="M32 31c-5 0-8.5-3.6-8.5-8.2 0-6.3 6.3-8.4 6.3-15.6 4.4 3 10.7 8.4 10.7 14.8 0 5.3-3.4 9-8.5 9z"/>${SPK(50, 14, .9, .5)}${SPK(13, 22, .6, 1.7)}</svg>`;
  const SCENE = `<svg class="tl-mt" viewBox="0 0 1000 260" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
<path class="tl-m1" d="M0 260V178l70-34 55 22 80-62 62 40 58-24 85-66 66 52 74-30 90 56 62-38 84 32 72-48 82 40 60-18 100 62v98z"/>
<path class="tl-m2" d="M300 260l95-82 52 26 74-70 44 32 66-62 58 46 42-12 52 52 34-46 38 30 48-58 34 30 62 46 0 0 0 68z"/>
<g class="tl-m2"><path d="M762 106h40v30h-40z"/><path d="M748 110q20-4 34-16 14 12 34 16z"/><path d="M752 92q16-3 30-13 14 10 30 13z"/><path d="M758 77q12-3 24-12 12 9 24 12z"/><path d="M780 66v-12h4v12z"/></g>
<path class="tl-m3" d="M520 260l70-48 46 18 60-34 48 28 52-22 66 36 58-24 80 46v0z"/></svg>
<div class="tl-mc"><svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="96"/><circle cx="100" cy="100" r="84" stroke-dasharray="2 7"/><circle cx="100" cy="100" r="62"/><path d="M100 4 183 148H17zM100 196 17 52h166z"/></svg></div>
${[[6, 0, 15, 1], [22, 5, 18, .8], [41, 2.5, 16, 1.1], [58, 8, 20, .7], [73, 1, 14, .9], [86, 6, 17, 1.2], [95, 10, 19, .8]].map(([x, d, t, s]) => `<i class="tl-pt" style="--x:${x}%;--d:-${d}s;--t:${t}s;--s:${s}"></i>`).join("")}`;
  // Thành tựu có sẵn: biểu tượng hợp nghĩa hơn trong bộ biểu tượng mới; thành tựu tự thêm dùng biểu tượng đã chọn
  const ACHI = { "so-nhap-giang-ho": "sword", "tieu-thanh-doc-gia": "book", "bach-chuong-doc-gia": "bookopen", "thien-chuong-hanh-gia": "scroll", "van-quyen-thu-sinh": "crown", "nhat-khac-tu-hanh": "hourglass", "thap-thoi-tinh-tu": "clock", "bach-thoi-nhap-dinh": "lotus", "thien-thoi-dai-dinh": "taiji", "truong-da-tu-hanh": "crescent", "that-nhat-tu-dao": "sun", "nguyet-vien": "moon", "bach-nhat-tu-dao": "mountain", "nhat-nien-luan-hoi": "phoenix", "van-phap-quy-tong": "magic", "bach-gia-chu-tu": "brush", "suu-tam-gia": "medal", "tang-bao-cac": "pagoda", "thien-kim-tan-tan": "coin", "ky-ngo-dau-tien": "comet", "khai-son-nguyen-lao": "seal" };
  const achIc = (id, ic) => KG.icon(ACHI[id] || ic || "star");
  const medal = (ic, st, id) => `<span class="tl-md ${st}"><svg class="tl-mdr" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30.5"/><circle class="tl-tk" cx="32" cy="32" r="26.5"/></svg>${st === "hid" ? KG.icon(ic || "star") : achIc(id, ic)}${st === "got" ? `<svg class="tl-mds" viewBox="-7 -7 14 14" aria-hidden="true"><path class="tl-spk" d="M0-6C.7-1.2 1.2-.7 6 0 1.2.7.7 1.2 0 6-.7 1.2-1.2.7-6 0-1.2-.7-.7-1.2 0-6z"/></svg>` : ""}</span>`;
  const dmy = s => { const d = new Date(s), z = v => String(v).padStart(2, "0"); return `${z(d.getDate())}/${z(d.getMonth() + 1)}/${d.getFullYear()}` };
  const hm2 = s => { const d = new Date(s), z = v => String(v).padStart(2, "0"); return `${z(d.getHours())}:${z(d.getMinutes())}` };

  /* ---------- Trang Tu luyện ---------- */
  async function pHome() {
    document.title = "Tu luyện | Kenrori";
    if (!me()) { app.innerHTML = nav("tu-luyen") + gate(); return }
    loading();
    try { S = { ...S, ...(await rpc("my_state")) }; chip() } catch (e) { app.innerHTML = errbox(e); return }
    const [cd, ach, led] = await Promise.all([rpc("player_public", { ids: [me().id] }).then(r => r[me().id]).catch(() => null), rpc("ach_list").catch(() => []), rpc("my_ledger", { lim: 60 }).catch(() => [])]);
    ACH = ach; const c = cd || { name: (ST.prof() || {}).display_name || "Bạn", eq: {} }, p = Math.min(100, S.exp / Math.max(1, S.need) * 100), got = ach.filter(a => a.at).length;
    const prv = a => { if (!a.rule) return null; const v = { chapters: S.chapters, read_hours: S.read_seconds / 3600, night_min: S.night_seconds / 60, days: S.days, genres: S.genres, series: S.series, level: S.level, titles: S.titles, spent: S.spent, encounters: S.encounters }[a.rule.t]; return v == null ? null : [Math.min(v, a.rule.v), a.rule.v] };
    const maxed = S.cfg && +S.cfg.max_level && S.level >= +S.cfg.max_level;
    const capE = S.cfg && +S.cfg.daily_exp_cap, capS = S.cfg && +S.cfg.daily_stone_cap;
    const bf = (S.buffs || []).map(b => `<span class="tl-bf">${{ exp: "EXP", stones: esc(cur()), drop: "Tỷ lệ rơi", encounter: "Kỳ ngộ" }[b.kind]} x${+(+b.mult).toFixed(2)}<small>${b.ends_at ? `tới ${new Date(b.ends_at).toLocaleDateString("vi-VN")}` : "vĩnh viễn"}${b.note ? `, ${esc(b.note)}` : ""}</small></span>`).join("");
    const u = (v, w) => `${v}<small>${w}</small>`;
    const hm = s => { s = +s || 0; const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${n0(h)}<small>giờ</small> ${m}<small>phút</small>` : `${m}<small>phút</small>` };
    const stats = [["hourglass", "Thời gian đọc", hm(S.read_seconds)], ["book", "Chương đã đọc xong", u(n0(S.chapters), "chương")], ["books", "Bộ đã đọc", u(n0(S.series), "bộ")],
      ["calendar", "Ngày ghé Kenrori", u(n0(S.days), "ngày")], ["crown", "Danh hiệu sở hữu", u(n0(S.titles), "danh hiệu")], ["trophy", "Thành tựu", `${got}<small>/ ${ach.length}</small>`]];
    const rw = r => [r.exp ? n0(r.exp) + " EXP" : "", r.stones ? n0(r.stones) + " " + esc(cur()) : "", (r.items || []).length ? "vật phẩm" : ""].filter(Boolean).join(", ");
    const achCard = a => {
      const st = a.at ? "got" : a.hidden ? "hid" : "run", pr = !a.at && prv(a);
      return `<article class="tl-ac ${st}">${medal(a.icon, st, a.id)}<div class="tl-acb"><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p>
${a.at ? `<span class="tl-done">${KG.icon("shield")}Hoàn thành ngày ${dmy(a.at)}</span>` : pr ? `<div class="tl-pr"><span class="tl-bar"><i style="width:${(pr[0] / pr[1] * 100).toFixed(1)}%"></i></span><span class="tl-num"><b>${n0(Math.floor(pr[0]))}</b> / ${n0(pr[1])}</span></div>` : ""}
${a.reward && !a.at && rw(a.reward) ? `<small class="tl-rw">Thưởng ${rw(a.reward)}</small>` : ""}</div></article>` };
    const rec = ach.filter(a => a.at).sort((x, y) => new Date(y.at) - new Date(x.at));
    const run = ach.filter(a => !a.at).map(a => { const pr = prv(a); return { a, r: pr ? pr[0] / pr[1] : -1 } }).sort((x, y) => y.r - x.r).map(x => x.a);
    const pick = [...rec.slice(0, 2), ...run, ...rec.slice(2)].slice(0, 6);
    let allA = false;

    app.innerHTML = nav("tu-luyen") + `<section class="tl-scene">
<div class="tl-bgs" aria-hidden="true">${SCENE}</div>
<header class="tl-hd">${EMBLEM}<div><h1>Tu luyện</h1><p>Đọc truyện để tích EXP, nhặt ${esc(cur())} và mở khóa thành tựu. Không cần làm nhiệm vụ.</p></div></header>
<div class="tl-card">
<div class="tl-av">${RING}${avOf(c, 104)}</div>
<div class="tl-who"><div class="tl-nm">${KG.name(c.name, c.eq)}</div>${c.eq && c.eq.title ? `<div class="tl-tt">${KG.title(c.eq.title, { size: "md" })}</div>` : '<a class="tl-not" href="#kho-do">Chọn danh hiệu để đeo trong Kho đồ</a>'}</div>
<div class="tl-seal" title="Cấp độ hiện tại">${SEAL}<div><small>Cấp</small><b>${n0(S.level)}</b></div></div>
<a class="tl-bal" href="#cua-hang" title="Mở cửa hàng"><span class="tl-gem">${STONE}</span><span class="tl-bv"><small>${esc(cur())}</small><b>${n0(S.stones)}</b></span><em>Cửa hàng</em></a>
<div class="tl-xp"><div class="tl-xpb" role="progressbar" aria-valuemin="0" aria-valuemax="${S.need}" aria-valuenow="${S.exp}" aria-label="Kinh nghiệm"><i style="width:${p.toFixed(2)}%"></i></div>
<div class="tl-xpt"><span>${maxed ? "Đã đạt cấp tối đa" : `Còn ${n0(Math.max(0, S.need - S.exp))} EXP để lên cấp ${n0(S.level + 1)}`}</span><span><b>${n0(S.exp)}</b> / ${n0(S.need)} EXP (${p.toLocaleString("vi-VN", { maximumFractionDigits: 2 })}%)</span></div>
${capE || bf ? `<div class="tl-meta">${capE ? `<span>Hôm nay ${n0(S.daily_exp)}/${n0(capE)} EXP${capS ? `, ${n0(S.daily_stones)}/${n0(capS)} ${esc(cur())} nhặt khi đọc` : ""}</span>` : ""}${bf}</div>` : ""}</div>
</div></section>
<section class="tl-stats" aria-label="Thống kê">${stats.map(([k, l, v]) => `<div class="tl-sc">${tli(k)}<div><span>${l}</span><b>${v}</b></div></div>`).join("")}</section>
<section class="sec tl-sec"><div class="tl-sh"><h2>${tli("trophy", "sm")}Thành tựu</h2><span class="tl-cnt">${got}/${ach.length} đã mở khóa</span>${ach.length > 6 ? `<button class="tl-more" id="tlall">Xem tất cả</button>` : ""}</div><div class="tl-ach" id="tlach">${pick.map(achCard).join("")}</div></section>
<section class="sec tl-sec"><div class="tl-sh"><h2>${tli("hourglass", "sm")}Lịch sử</h2></div>
<div class="tl-tabs" role="tablist"><button role="tab" data-lf="in" aria-selected="true" class="on">${KG.icon("star4")}Lịch sử nhận</button><button role="tab" data-lf="out" aria-selected="false">${KG.icon("gem")}Lịch sử tiêu</button></div><div id="kled"></div></section>
<details class="sec tl-set"><summary>Cài đặt hiển thị và riêng tư</summary><div class="kset"><label>Hiệu ứng danh hiệu và trang Tu luyện<select id="kfx">${[["full", "Đầy đủ"], ["simple", "Đơn giản"], ["off", "Tắt hiệu ứng"]].map(([v, l]) => `<option value="${v}"${KG.fxMode() === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
<label class="ck"><input type="checkbox" id="kopt"${S.lb_opt_out ? " checked" : ""}> Không hiện tôi trên bảng xếp hạng</label><label class="ck"><input type="checkbox" id="kpub"${S.public_stats ? " checked" : ""}> Công khai thời gian đọc và số chương trên hồ sơ</label>
<p class="mu">${esc(cur())} và lịch sử nhận, tiêu chỉ bạn và quản trị viên thấy. Thời gian đọc chỉ tính khi tab đang mở và bạn có cuộn hoặc chuyển trang; mỗi chương chỉ tính hoàn thành một lần.</p></div></details>`;

    const allBtn = $("#tlall"); if (allBtn) allBtn.onclick = () => { allA = !allA; $("#tlach").innerHTML = (allA ? ach : pick).map(achCard).join(""); allBtn.textContent = allA ? "Thu gọn" : "Xem tất cả" };
    const SRC = { read: "Đọc truyện", complete: "Hoàn thành chương", series: "Bộ mới", daily: "Đăng nhập", drop: "Rơi khi đọc", encounter: "Kỳ ngộ", level: "Thưởng lên cấp", achievement: "Thành tựu", shop: "Cửa hàng", admin: "Quản trị viên", event: "Sự kiện" };
    const SIC = { read: "book", complete: "scroll", series: "book", daily: "sun", drop: "gem", encounter: "comet", level: "star4", achievement: "crown", shop: "gem", admin: "shield", event: "sakura" };
    const amt = l => l.kind === "item" || l.kind === "achievement" ? `<span class="tl-am it">${KG.icon(l.kind === "item" ? "gem" : "crown")}${l.kind === "item" ? "Vật phẩm" : "Mở khóa"}</span>`
      : `<span class="tl-am${l.delta < 0 ? " neg" : ""}">${l.delta > 0 ? "+" : ""}${n0(l.delta)}${l.kind === "stones" ? STONE : `<small>${l.kind === "level" ? "cấp" : "EXP"}</small>`}</span>`;
    let LF = "in", LN = 10;
    const drawL = () => {
      const L = led.filter(l => LF === "in" ? !(l.delta < 0) : l.delta < 0), box = $("#kled");
      if (!L.length) { box.innerHTML = LF === "in" ? '<p class="empty">Chưa có gì. Cứ đọc truyện, phần thưởng sẽ hiện ở đây.</p>' : `<p class="empty">Bạn chưa tiêu ${esc(cur())} nào. <a href="#cua-hang">Ghé Cửa hàng</a> để đổi danh hiệu, khung và màu tên.</p>`; return }
      box.innerHTML = `<div class="tl-tb" role="table" aria-label="${LF === "in" ? "Lịch sử nhận" : "Lịch sử tiêu"}"><div class="tl-tr tl-th" role="row"><span role="columnheader">Thời gian</span><span role="columnheader">Nội dung</span><span role="columnheader">Số lượng</span></div>
${L.slice(0, LN).map(l => `<div class="tl-tr" role="row"><time role="cell" datetime="${esc(l.at)}">${dmy(l.at)} <span>${hm2(l.at)}</span></time><span class="tl-ct" role="cell"><i>${KG.icon(SIC[l.source] || "star")}</i><span><b>${esc(l.reason || SRC[l.source] || l.source)}</b><small>${SRC[l.source] || esc(l.source)}${l.before_v != null && l.kind === "stones" ? `, số dư ${n0(l.before_v)} → ${n0(l.after_v)}` : ""}</small></span></span><span role="cell">${amt(l)}</span></div>`).join("")}</div>
${L.length > LN ? `<button class="tl-more wide" id="tlmore">Xem thêm ${n0(Math.min(10, L.length - LN))} dòng</button>` : ""}`;
      const m = $("#tlmore"); if (m) m.onclick = () => { LN += 10; drawL() };
    };
    drawL();
    app.querySelector(".tl-tabs").onclick = e => { const b = e.target.closest("[data-lf]"); if (!b) return; app.querySelectorAll(".tl-tabs [data-lf]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-selected", x === b) }); LF = b.dataset.lf; LN = 10; drawL() };
    $("#kfx").onchange = e => { KG.fxMode(e.target.value); toast("Đã đổi chế độ hiệu ứng") };
    const sv = async () => { try { set(await rpc("player_settings", { opt_out: $("#kopt").checked, pub: $("#kpub").checked })); toast("Đã lưu cài đặt") } catch (e) { toast(msg(e)) } };
    $("#kopt").onchange = sv; $("#kpub").onchange = sv;
  }

  /* ---------- Cửa hàng ---------- */
  const F = { q: "", kind: "title", th: [], ql: [], own: "all", sort: "rare", min: "", max: "" };
  async function pShop() {
    document.title = "Cửa hàng " + cur() + " | Kenrori"; loading();
    let L; try { L = await items(true) } catch (e) { app.innerHTML = nav("cua-hang") + errbox(e); return }
    if (me()) { if (!S) await boot(); else try { set(await rpc("my_state")) } catch (e) {} }
    const kinds = Object.entries(KG.KINDS).filter(([k]) => L.some(x => x.kind === k));
    app.innerHTML = nav("cua-hang") + `<section class="sec">${head("Cửa hàng " + esc(cur()), S ? `<span class="kbal sm">${STONE}<b id="kbl">${n0(S.stones)}</b></span>` : `<a class="btn sm" href="#viet/dang-nhap">Đăng nhập để mua</a>`)}
<p class="lead">Mọi vật phẩm chỉ để trang trí, không ảnh hưởng tới việc đọc truyện hay quyền kiểm duyệt.</p>
<div class="kflt"><input id="kq" type="search" placeholder="Tìm vật phẩm" value="${esc(F.q)}"><div class="utabs kkinds" role="tablist">${kinds.map(([k, l]) => `<button data-k="${k}" class="${k === F.kind ? "on" : ""}">${l}</button>`).join("")}</div>
<div class="frow"><span>Chủ đề</span><div>${Object.entries(KG.THEMES).map(([k, l]) => `<button class="fc${F.th.includes(k) ? " on" : ""}" data-th="${k}">${l}</button>`).join("")}</div></div>
<div class="frow"><span>Phẩm chất</span><div>${KG.QN.map((l, i) => `<button class="fc kfq${F.ql.includes(i + 1) ? " on" : ""}" data-ql="${i + 1}" style="--q:${KG.QC[i]}">${l}</button>`).join("")}</div></div>
<div class="frow"><span>Giá</span><div><input id="kmin" type="number" min="0" placeholder="Từ" value="${esc(F.min)}"><input id="kmax" type="number" min="0" placeholder="Đến" value="${esc(F.max)}"><select id="kown"><option value="all">Tất cả</option><option value="no">Chưa sở hữu</option><option value="yes">Đã sở hữu</option><option value="buy">Mua được ngay</option></select><select id="ksort"><option value="rare">Hiếm nhất trước</option><option value="cheap">Giá thấp trước</option><option value="exp">Giá cao trước</option><option value="new">Mới phát hành</option></select></div></div></div>
<div id="kgrid" class="kgrid"></div></section>`;
    $("#kown").value = F.own; $("#ksort").value = F.sort;
    const draw = () => {
      let R = L.filter(x => x.kind === F.kind && (!F.th.length || F.th.includes(x.theme)) && (!F.ql.length || F.ql.includes(x.q)) && (!F.q || (x.name + " " + x.description).toLowerCase().includes(F.q.toLowerCase())));
      if (F.min !== "") R = R.filter(x => priceOf(x) >= +F.min); if (F.max !== "") R = R.filter(x => priceOf(x) <= +F.max);
      if (F.own === "yes") R = R.filter(x => x.mine); if (F.own === "no") R = R.filter(x => !x.mine); if (F.own === "buy") R = R.filter(x => !x.mine && buyable(x) && S && S.stones >= priceOf(x) && S.level >= x.level_req);
      R.sort({ rare: (a, b) => b.q - a.q || priceOf(b) - priceOf(a), cheap: (a, b) => priceOf(a) - priceOf(b), exp: (a, b) => priceOf(b) - priceOf(a), new: (a, b) => new Date(b.created_at) - new Date(a.created_at) }[F.sort]);
      $("#kgrid").innerHTML = R.length ? R.map(x => `<button class="kit${x.mine ? " own" : ""}" data-id="${esc(x.id)}" style="--q:${KG.QC[x.q - 1]}">${KG.preview({ ...x, ex: x.ex }, (ST.prof() || {}).display_name || "Đạo hữu")}<span class="kin"><b>${esc(x.name)}</b>${QB(x)}<small>${esc(KG.THEMES[x.theme] || "")}</small></span><span class="kpr">${x.mine ? '<em class="kow">Đã sở hữu</em>' : buyable(x) ? `${x.sale != null ? `<s>${n0(x.price)}</s>` : ""}${STONE}<b>${n0(priceOf(x))}</b>` : `<em>${esc(cond(x)[0] || "Không bán")}</em>`}</span></button>`).join("") : '<p class="empty">Không có vật phẩm nào khớp bộ lọc.</p>';
    };
    draw();
    $("#kq").oninput = e => { F.q = e.target.value.trim(); draw() };
    app.querySelector(".kkinds").onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; F.kind = b.dataset.k; app.querySelectorAll(".kkinds button").forEach(x => x.classList.toggle("on", x === b)); draw() };
    app.querySelector(".kflt").addEventListener("click", e => { const b = e.target.closest("[data-th],[data-ql]"); if (!b) return; const k = b.dataset.th ? "th" : "ql", v = b.dataset.th || +b.dataset.ql; F[k] = F[k].includes(v) ? F[k].filter(x => x !== v) : [...F[k], v]; b.classList.toggle("on"); draw() });
    $("#kmin").oninput = e => { F.min = e.target.value; draw() }; $("#kmax").oninput = e => { F.max = e.target.value; draw() };
    $("#kown").onchange = e => { F.own = e.target.value; draw() }; $("#ksort").onchange = e => { F.sort = e.target.value; draw() };
    $("#kgrid").onclick = e => { const b = e.target.closest(".kit"); if (b) detail(L.find(x => x.id === b.dataset.id), draw) };
  }
  // Hộp chi tiết (người dùng tự mở nên không làm phiền việc đọc)
  function modal(html, cls = "") {
    const m = document.createElement("div"); m.className = "kmod"; m.innerHTML = `<div class="kmb ${cls}" role="dialog" aria-modal="true">${html}<button class="kmx" aria-label="Đóng">✕</button></div>`;
    const close = () => { m.remove(); removeEventListener("keydown", esc_) }, esc_ = e => { if (e.key === "Escape") close() };
    m.addEventListener("click", e => { if (e.target === m || e.target.closest(".kmx")) close() }); addEventListener("keydown", esc_); document.body.appendChild(m); m.querySelector(".kmb").focus?.(); return { m, close };
  }
  function detail(it, redraw) {
    if (!it) return; const who = (ST.prof() || {}).display_name || "Đạo hữu", pr = priceOf(it), can = buyable(it) && !it.mine, art = it.kind === "title" && it.style && it.style.art && !it.secret ? KG.art(it.style.art, 150) : "";
    const C = cond(it), bundle = it.kind === "bundle" ? (ITEMS || []).filter(x => (it.bundle || []).includes(x.id)) : [];
    const { m, close } = modal(`<div class="kdt">${art ? `<div class="kda">${art}</div>` : ""}<div class="kdm"><span class="kdk">${esc(KG.KINDS[it.kind])}, ${esc(KG.THEMES[it.theme] || "")}</span><h3>${esc(it.name)}</h3>${QB(it)}
<div class="kdp"><div class="kdpd">${KG.preview(it, who)}</div><div class="kdpl">${it.kind === "title" ? `<div class="kg-pv kg-pvl">${KG.title(it, { size: "md" })}</div>` : ""}</div></div>
${it.description ? `<p>${esc(it.description)}</p>` : ""}${it.quote ? `<blockquote>${esc(it.quote)}</blockquote>` : ""}
${bundle.length ? `<div class="kbdl">${bundle.map(x => `<span>${esc(x.name)}<small>${esc(KG.KINDS[x.kind])}</small></span>`).join("")}</div>` : ""}
${C.length ? `<ul class="kcond">${C.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}<p class="mu">${n0(it.owners)} người đang sở hữu</p>
<div class="kdb">${it.mine ? `<em class="kow">Bạn đã sở hữu${it.mine.exp ? ` tới ${new Date(it.mine.exp).toLocaleDateString("vi-VN")}` : ""}</em>${it.kind !== "bundle" ? `<button class="btn pri" id="keq">Trang bị ngay</button>` : ""}<a class="btn" href="#kho-do">Mở kho đồ</a>` : can ? (me() ? `<span class="kdpp">${it.sale != null ? `<s>${n0(it.price)}</s>` : ""}${STONE}<b>${n0(pr)}</b> ${esc(cur())}</span><button class="btn pri" id="kbuy">Mua</button>` : '<a class="btn pri" href="#viet/dang-nhap">Đăng nhập để mua</a>') : ""}</div><p class="aerr" id="kerr" role="alert"></p></div></div>`, "wide");
    const eq = m.querySelector("#keq"); if (eq) eq.onclick = async () => { try { set(it.kind === "badge" ? await rpc("equip_badges", { ids: [...new Set([...((S.equipped || {}).badges || []), it.id])].slice(-3) }) : await rpc("equip", { slot: it.kind, iid: it.id })); toast("Đã trang bị " + it.name); close() } catch (e) { m.querySelector("#kerr").textContent = msg(e) } };
    const b = m.querySelector("#kbuy"); if (b) b.onclick = () => {
      if (S.stones < pr) { m.querySelector("#kerr").textContent = `Bạn còn thiếu ${n0(pr - S.stones)} ${cur()}. Đọc thêm truyện để nhặt thêm nhé.`; return }
      if (S.level < it.level_req) { m.querySelector("#kerr").textContent = `Cần đạt cấp ${it.level_req}.`; return }
      b.outerHTML = `<span class="kcf2">Mua ${esc(it.name)} với giá ${n0(pr)} ${esc(cur())}? Số dư còn ${n0(S.stones - pr)}.</span><button class="btn pri" id="kok">Xác nhận mua</button><button class="btn" id="kno">Thôi</button>`;
      m.querySelector("#kno").onclick = close;
      m.querySelector("#kok").onclick = async e => { e.target.disabled = true; e.target.textContent = "Đang mua..."; try { const r = await rpc("shop_buy", { iid: it.id, seen: pr }); set(r); events(r.events); it.mine = { at: new Date().toISOString() }; it.owners++; ITEMS = null; toast("Đã mua " + it.name); close(); detail(it, redraw); if ($("#kbl")) $("#kbl").textContent = n0(S.stones); redraw && redraw() } catch (x) { e.target.disabled = false; e.target.textContent = "Xác nhận mua"; m.querySelector("#kerr").textContent = msg(x) } };
    };
  }

  /* ---------- Kho đồ ---------- */
  const SLOTS = [["title", "Danh hiệu chính"], ["frame", "Khung ảnh đại diện"], ["avatar_fx", "Hiệu ứng ảnh đại diện"], ["name_color", "Màu tên"], ["name_fx", "Hiệu ứng tên"], ["profile_bg", "Nền hồ sơ"], ["banner", "Biểu ngữ hồ sơ"], ["comment_frame", "Khung bình luận"], ["card_fx", "Hiệu ứng thẻ thành viên"]];
  async function pInv() {
    document.title = "Kho đồ | Kenrori";
    if (!me()) { app.innerHTML = nav("kho-do") + gate(); return }
    loading(); let L; try { L = await items(true); S = { ...S, ...(await rpc("my_state")) } } catch (e) { app.innerHTML = nav("kho-do") + errbox(e); return }
    const own = L.filter(x => x.mine), byId = Object.fromEntries(L.map(x => [x.id, x])), E = S.equipped || {}, who = (ST.prof() || {}).display_name || "Bạn";
    const eqObj = () => { const o = {}; for (const [k] of SLOTS) if (E[k] && byId[E[k]]) o[k] = byId[E[k]]; return o };
    const look = () => { const o = eqObj(), cf = KG.cframe(o), av = (ST.prof() || {}).avatar_url;
      return `<div class="klook ${o.profile_bg ? KG.bgStyle(o.profile_bg) : ""}"><div class="kcd${o.card_fx ? " kcd-" + KG.resolve(o.card_fx.style, "card_fx").th : ""}" style="${o.card_fx ? `--a:${KG.resolve(o.card_fx.style, "card_fx").a};--b:${KG.resolve(o.card_fx.style, "card_fx").b}` : ""}">${KG.avatar(`<span class="kav" style="--s:64px">${av ? `<img src="${esc(av)}" alt="">` : esc([...who][0])}</span>`, o, 64)}<div><b class="klk">${KG.name(who, o)}</b><div>${o.title ? KG.title(o.title, { size: "md" }) : '<span class="mu">Chưa trang bị danh hiệu</span>'}</div><div class="kbdg">${(E.badges || []).map(b => KG.badge(byId[b], 30)).join("")}</div></div><span class="klv">Lv.${n0(S.level)}</span></div>
<div class="kcmt${cf.cls}" style="${cf.style}"><div class="kcmh">${KG.avatar(`<span class="kav" style="--s:34px">${av ? `<img src="${esc(av)}" alt="">` : esc([...who][0])}</span>`, o, 34)}<b>${KG.name(who, o)}</b>${o.title ? KG.title(o.title) : ""}</div><p>Chương này hay quá, mong chương mới sớm ra!</p></div></div>` };
    const tabs = Object.entries(KG.KINDS).filter(([k]) => k !== "bundle");
    let tk = "title", showLocked = true;
    app.innerHTML = nav("kho-do") + `<section class="sec">${head("Kho đồ", `<span class="shn">${own.length} vật phẩm</span>`)}<div class="kinv"><div class="kinl"><h3>Diện mạo hiện tại</h3><div id="klook">${look()}</div>
<h3>Bộ trang trí đã lưu</h3><div id="kout"></div><div class="acts"><input id="koutn" maxlength="30" placeholder="Tên bộ, ví dụ Ma đạo đêm khuya"><button class="btn" id="kouts">Lưu bộ hiện tại</button></div></div>
<div class="kinr"><div class="utabs" role="tablist" id="kitab">${tabs.map(([k, l]) => `<button data-k="${k}" class="${k === tk ? "on" : ""}">${l}</button>`).join("")}</div><label class="ck"><input type="checkbox" id="klock" checked> Hiện cả vật phẩm chưa sở hữu và điều kiện mở khóa</label><div id="kil" class="kil"></div></div></div></section>`;
    const drawO = () => { $("#kout").innerHTML = (S.outfits || []).length ? S.outfits.map((o, i) => `<div class="kot"><b>${esc(o.n)}</b><span>${Object.keys(o.e || {}).length} món</span><button class="btn sm" data-oa="${i}">Mặc bộ này</button><button class="btn sm dngb" data-od="${i}">Xóa</button></div>`).join("") : '<p class="mu">Chưa lưu bộ nào.</p>' };
    const drawI = () => {
      const R = L.filter(x => x.kind === tk && (x.mine || (showLocked && x.status !== "hidden"))).sort((a, b) => (!!b.mine - !!a.mine) || b.q - a.q);
      const isEq = x => tk === "badge" ? (E.badges || []).includes(x.id) : E[tk] === x.id;
      $("#kil").innerHTML = R.length ? R.map(x => `<div class="kii${x.mine ? "" : " lock"}${isEq(x) ? " eq" : ""}" style="--q:${KG.QC[x.q - 1]}">${tk === "title" ? `<div class="kiip">${KG.title(x, { size: "md" })}</div>` : KG.preview(x, who)}<div class="kiim"><b>${esc(x.name)}</b>${QB(x)}${x.mine ? (x.mine.exp ? `<small>Hết hạn ${new Date(x.mine.exp).toLocaleDateString("vi-VN")}</small>` : "") : `<small>${esc(cond(x).join(". ") || (buyable(x) ? `Mua với ${n0(priceOf(x))} ${cur()}` : "Chưa sở hữu"))}</small>`}</div>${x.mine ? `<button class="btn sm${isEq(x) ? "" : " pri"}" data-eq="${esc(x.id)}">${isEq(x) ? "Tháo" : tk === "badge" ? "Trưng bày" : "Trang bị"}</button>` : buyable(x) ? `<a class="btn sm" href="#cua-hang" data-go="${esc(x.id)}">Xem trong cửa hàng</a>` : ""}</div>`).join("") : '<p class="empty">Chưa có vật phẩm loại này. Ghé Cửa hàng hoặc đọc truyện để mở khóa.</p>';
    };
    drawO(); drawI();
    $("#kitab").onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; tk = b.dataset.k; $("#kitab").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); drawI() };
    $("#klock").onchange = e => { showLocked = e.target.checked; drawI() };
    $("#kil").onclick = async e => { const b = e.target.closest("[data-eq]"); if (!b) return; const id = b.dataset.eq; b.disabled = true;
      try { let r; if (tk === "badge") { const cur2 = E.badges || []; const nb = cur2.includes(id) ? cur2.filter(x => x !== id) : [...cur2, id]; if (nb.length > 3) { toast("Trưng bày tối đa 3 huy hiệu"); b.disabled = false; return } r = await rpc("equip_badges", { ids: nb }) } else r = await rpc("equip", { slot: tk, iid: E[tk] === id ? null : id });
        set(r); Object.keys(E).forEach(k => delete E[k]); Object.assign(E, S.equipped || {}); $("#klook").innerHTML = look(); drawI(); delete CARDS[me().id] } catch (x) { toast(msg(x)); b.disabled = false } };
    $("#kouts").onclick = async () => { try { set(await rpc("outfit", { act: "save", idx: null, nm: $("#koutn").value })); $("#koutn").value = ""; drawO(); toast("Đã lưu bộ trang trí") } catch (x) { toast(msg(x)) } };
    $("#kout").onclick = async e => { const a = e.target.closest("[data-oa],[data-od]"); if (!a) return; try { set(await rpc("outfit", { act: a.dataset.oa != null ? "apply" : "delete", idx: +(a.dataset.oa ?? a.dataset.od), nm: null })); Object.keys(E).forEach(k => delete E[k]); Object.assign(E, S.equipped || {}); $("#klook").innerHTML = look(); drawO(); drawI(); toast(a.dataset.oa != null ? "Đã mặc bộ trang trí (bỏ qua món đã hết hạn)" : "Đã xóa") } catch (x) { toast(msg(x)) } };
  }

  /* ---------- Bảng xếp hạng ---------- */
  const LB = [["level", "Cấp độ", v => "Cấp " + n0(v)], ["time", "Thời gian đọc", hrs], ["chapters", "Số chương", v => n0(v) + " chương"], ["titles", "Danh hiệu", v => n0(v) + " danh hiệu"], ["week", "Tuần này", v => n0(v) + " EXP"], ["month", "Tháng này", v => n0(v) + " EXP"]];
  async function pBoard(kind) {
    kind = LB.some(x => x[0] === kind) ? kind : "level"; document.title = "Bảng xếp hạng | Kenrori";
    app.innerHTML = nav("bang-xep-hang") + `<section class="sec">${head("Bảng xếp hạng")}<div class="utabs" role="tablist">${LB.map(([k, l]) => `<a role="tab" href="#bang-xep-hang/${k}" class="${k === kind ? "on" : ""}">${l}</a>`).join("")}</div><div id="klb"><p class="empty">Đang tải...</p></div><p class="mu">Không muốn xuất hiện ở đây? Tắt trong Tu luyện › Cài đặt.</p></section>`;
    let R; try { R = await rpc("leaderboard", { kind, lim: 50 }) } catch (e) { $("#klb").innerHTML = `<p class="empty">${esc(msg(e))}</p>`; return }
    const fmt = LB.find(x => x[0] === kind)[2];
    $("#klb").innerHTML = R.length ? `${R.length >= 1 ? `<div class="kpod">${[1, 0, 2].map(i => R[i] ? `<a class="kpd p${R[i].rank}" href="#tg/${esc(R[i].id)}">${avOf(R[i], i === 0 ? 84 : 64)}<b>${KG.name(R[i].name, R[i].eq)}</b>${R[i].eq && R[i].eq.title ? KG.title(R[i].eq.title) : ""}<span>${fmt(R[i].v)}</span><i>${R[i].rank}</i></a>` : "").join("")}</div>` : ""}
<ol class="klbl">${R.slice(3).map(r => `<li><span class="krk">${r.rank}</span><a href="#tg/${esc(r.id)}" class="klbu">${avOf(r, 40)}<span><b>${KG.name(r.name, r.eq)}</b>${r.eq && r.eq.title ? KG.title(r.eq.title) : ""}</span></a><span class="klv">Lv.${n0(r.level)}</span><span class="kvv">${fmt(r.v)}</span></li>`).join("")}</ol>` : '<p class="empty">Chưa có ai trên bảng này. Hãy là người đầu tiên!</p>';
  }

  /* ---------- Khối Tu luyện trên trang hồ sơ ---------- */
  async function profile(uid, box, page) {
    if (!on() || !box) return;
    let P; try { P = await rpc("player_profile", { uid }) } catch (e) { box.remove(); return }
    if (!P) { box.remove(); return }
    CARDS[uid] = P; const eq = P.eq || {}, p = Math.min(100, (P.exp || 0) / Math.max(1, P.need) * 100);
    if (page && P.bg) page.className += " kprof " + KG.bgStyle(P.bg).split('"')[0], page.setAttribute("style", KG.bgStyle(P.bg).split('style="')[1] || "");
    if (P.banner_item && page) { const b = page.querySelector(".tgb"); if (b) b.innerHTML = `<div class="kbnr ${KG.bgStyle(P.banner_item)}"></div>` }
    if (page) { const a = page.querySelector(".tga"); if (a && (eq.frame || eq.avatar_fx)) a.outerHTML = KG.avatar(a.outerHTML, eq, 120); const h = page.querySelector(".tgi h1"); if (h && (eq.name_color || eq.name_fx)) h.innerHTML = KG.name(P.name, eq) }
    box.innerHTML = `<div class="kpro${eq.card_fx ? " kcd kcd-" + KG.resolve(eq.card_fx.style, "card_fx").th : ""}" style="${eq.card_fx ? `--a:${KG.resolve(eq.card_fx.style, "card_fx").a};--b:${KG.resolve(eq.card_fx.style, "card_fx").b}` : ""}">
<div class="kprt">${eq.title ? KG.title(eq.title, { size: "lg" }) : ""}<div class="kbdg">${(P.badges || []).map(b => KG.badge(b, 34)).join("")}</div></div>
<div class="klvl"><span class="klb">Cấp</span><b>${n0(P.level)}</b><div class="kxp"><div class="kxb"><i style="width:${p.toFixed(1)}%"></i></div><small>${n0(P.exp)} / ${n0(P.need)} EXP</small></div></div>
<div class="kstats sm">${[["Danh hiệu", n0(P.titles)], ["Thành tựu", n0(P.achievements)], ["Tham gia", new Date(P.joined).toLocaleDateString("vi-VN")], ...(P.stats ? [["Thời gian đọc", hrs(P.stats.read_seconds)], ["Chương đã đọc", n0(P.stats.chapters)]] : []), ...(P.stones != null ? [[cur(), n0(P.stones)]] : [])].map(([l, v]) => `<div><b>${v}</b><span>${esc(l)}</span></div>`).join("")}</div>
${P.private ? '<p class="mu">Người này giữ riêng thời gian đọc và số chương.</p>' : ""}
${(P.ach || []).length ? `<div class="kpach">${P.ach.slice(0, 24).map(a => `<span title="${esc(a.name)}, ${new Date(a.at).toLocaleDateString("vi-VN")}">${achIc(a.id, a.icon)}<b>${esc(a.name)}</b></span>`).join("")}</div>` : ""}</div>`;
  }

  /* ---------- Bảng điều chỉnh thành viên (Kiểm duyệt › Tài khoản) ---------- */
  const A = async (act, a = {}) => { await client(); const r = await sb.rpc("game_admin", { p: (ST.modPw && ST.modPw()) || null, act, a }); if (r.error) throw r.error; return r.data };
  async function member(uid, name) {
    const { m, close } = modal(`<div id="kmem"><p class="empty">Đang tải...</p></div>`, "wide");
    let U, IT, AC; try { [U, IT, AC] = await Promise.all([A("user", { id: uid }), A("items"), A("achs")]) } catch (e) { m.querySelector("#kmem").innerHTML = `<p class="empty">${esc(msg(e))}</p>`; return }
    const st = U.stats || {}, own = new Set((U.inventory || []).filter(x => x.live).map(x => x.id)), AN = Object.fromEntries(AC.map(a => [a.id, a.name]));
    const SRC = { read: "Đọc", complete: "Hoàn thành chương", series: "Bộ mới", daily: "Đăng nhập", drop: "Rơi khi đọc", encounter: "Kỳ ngộ", level: "Thưởng cấp", achievement: "Thành tựu", shop: "Cửa hàng", admin: "Quản trị", event: "Sự kiện" };
    m.querySelector("#kmem").innerHTML = `<div class="kmh">${avOf(U, 64)}<div><h3>${KG.name(U.name, U.eq)}</h3>${U.eq && U.eq.title ? KG.title(U.eq.title, { size: "md" }) : ""}<p class="mu">Cấp ${n0(st.level)}, ${n0(st.exp)}/${n0(U.need)} EXP, tổng ${n0(st.total_exp)} EXP. ${n0(st.stones)} ${esc(cur())}. Đọc ${hrs(st.read_seconds)}, ${n0(st.chapters_done)} chương, ${n0(st.days_active)} ngày.${st.excluded ? " Đang bị loại khỏi bảng xếp hạng." : ""}</p></div></div>
<div class="kmg"><form id="kadj" class="kmf"><h4>Điều chỉnh tài nguyên</h4><div class="kmr"><label>EXP<input name="exp" type="number" placeholder="+100 hoặc -50"></label><label>Đặt EXP trong cấp<input name="set_exp" type="number" min="0"></label></div>
<div class="kmr"><label>Cấp<input name="level" type="number" placeholder="+1 hoặc -1"></label><label>Đặt cấp<input name="set_level" type="number" min="1"></label></div>
<div class="kmr"><label>${esc(cur())}<input name="stones" type="number" placeholder="+500 hoặc -100"></label><label>Đặt số dư<input name="set_stones" type="number" min="0"></label></div>
<label>Lý do (bắt buộc, lưu vào nhật ký)<input name="reason" maxlength="300" required></label><button class="btn pri">Áp dụng</button></form>
<form id="kgr" class="kmf"><h4>Trao tặng hoặc thu hồi vật phẩm</h4><label>Vật phẩm</label><div class="kgp-pick"><span id="kgr_cs">${KG.chosen(null)}</span><button type="button" class="btn sm" id="kgr_pk">Chọn vật phẩm</button></div><input type="hidden" name="item">
<label>Số ngày sở hữu (để trống = vĩnh viễn)<input name="days" type="number" min="1"></label><label>Lý do<input name="reason" maxlength="300"></label><div class="acts"><button class="btn pri" name="go" value="grant">Trao tặng</button><button class="btn dngb" name="go" value="revoke">Thu hồi</button></div>
<h4>Mở khóa thành tựu</h4><div class="kmr"><select name="ach">${AC.map(a => `<option value="${esc(a.id)}">${(U.achievements || []).some(x => x.id === a.id) ? "✓ " : ""}${esc(a.name)}</option>`).join("")}</select><button class="btn" name="go" value="unlock">Mở khóa</button></div></form>
<form id="kbf" class="kmf"><h4>Cấp Buff</h4><div class="kmr"><label>Loại<select name="kind"><option value="exp">EXP</option><option value="stones">Lượng ${esc(cur())}</option><option value="drop">Tỷ lệ rơi</option><option value="encounter">Tỷ lệ kỳ ngộ</option></select></label><label>Hệ số<input name="mult" type="number" step="0.1" min="0.1" max="100" value="2"></label></div>
<div class="kmr"><label>Bắt đầu<input name="starts_at" type="datetime-local"></label><label>Kết thúc (trống = vĩnh viễn)<input name="ends_at" type="datetime-local"></label></div><label>Cộng dồn<select name="stack"><option value="add">Cộng phần tăng</option><option value="mult">Nhân với nhau</option><option value="max">Lấy mức cao nhất</option></select></label><label>Ghi chú<input name="note" maxlength="100"></label><button class="btn pri">Cấp Buff</button>
<label class="ck"><input type="checkbox" id="kexc"${st.excluded ? " checked" : ""}> Loại khỏi bảng xếp hạng</label></form></div>
<h4>Kho đồ (${(U.inventory || []).length})</h4><div class="kmi">${(U.inventory || []).map(x => `<span class="${x.live ? "" : "dead"}">${x.kind === "title" ? KG.title(x) : esc(x.name)}<small>${esc(KG.KINDS[x.kind])}, ${esc(x.source)}${x.exp ? `, hết hạn ${new Date(x.exp).toLocaleDateString("vi-VN")}` : ""}</small></span>`).join("") || '<p class="mu">Trống.</p>'}</div>
<h4>Thành tựu (${(U.achievements || []).length})</h4><p>${(U.achievements || []).map(a => esc(AN[a.id] || a.id)).join(", ") || '<span class="mu">Chưa có.</span>'}</p>
<h4>Buff đang có</h4><p>${(U.buffs || []).map(b => `${b.kind} x${b.mult}${b.ends_at ? " tới " + new Date(b.ends_at).toLocaleString("vi-VN") : " vĩnh viễn"}`).join("; ") || '<span class="mu">Không có.</span>'}</p>
<h4>Nhật ký (100 dòng gần nhất)</h4><div class="kled sm">${(U.ledger || []).map(l => `<div class="kle"><span class="kld ${l.delta < 0 ? "neg" : ""}">${l.kind}: ${l.delta > 0 ? "+" : ""}${n0(l.delta)}</span><span class="klt"><b>${esc(l.reason || "")}</b><small>${SRC[l.source] || esc(l.source)}${l.before_v != null ? `, ${n0(l.before_v)} → ${n0(l.after_v)}` : ""}${l.actor_label ? `, bởi ${esc(l.actor_label)}` : ""}</small></span><time>${new Date(l.at).toLocaleString("vi-VN")}</time></div>`).join("") || '<p class="mu">Trống.</p>'}</div>`;
    const refresh = () => { close(); member(uid, name) };
    const num = v => v === "" ? undefined : +v;
    m.querySelector("#kadj").onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), a = { ids: [uid], reason: f.get("reason") }; ["exp", "set_exp", "level", "set_level", "stones", "set_stones"].forEach(k => { const v = num(f.get(k)); if (v !== undefined && !isNaN(v)) a[k] = v });
      if (Object.keys(a).length < 3) return toast("Hãy nhập ít nhất một giá trị"); if (!confirm(`Áp dụng điều chỉnh cho ${name}?\n${Object.entries(a).filter(([k]) => !["ids", "reason"].includes(k)).map(([k, v]) => k + ": " + v).join("\n")}`)) return;
      try { await A("adjust", a); toast("Đã điều chỉnh và ghi nhật ký"); refresh() } catch (x) { toast(msg(x)) } };
    const pickTo = (pid, form, o) => { m.querySelector(`#${pid}_pk`).onclick = async () => { const id = await KG.pickItem({ items: IT, ...o, selected: [form.item.value].filter(Boolean) }); if (!id) return; form.item.value = id; m.querySelector(`#${pid}_cs`).innerHTML = KG.chosen(IT.find(x => x.id === id)) } };
    pickTo("kgr", m.querySelector("#kgr"), { title: `Chọn vật phẩm để trao tặng hoặc thu hồi cho ${name}`, owned: own });
    m.querySelector("#kgr").onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), go = e.submitter && e.submitter.value;
      if (go !== "unlock" && !f.get("item")) return toast("Hãy bấm Chọn vật phẩm trước");
      try { if (go === "unlock") { if (!confirm("Mở khóa thành tựu này (kèm phần thưởng)?")) return; await A("unlock", { ids: [uid], ach: f.get("ach") }) } else { const it = IT.find(x => x.id === f.get("item")); if (!confirm(`${go === "grant" ? "Trao tặng" : "Thu hồi"} "${it ? it.name : f.get("item")}" ${go === "grant" ? "cho" : "của"} ${name}?`)) return; await A(go, { ids: [uid], item: f.get("item"), days: f.get("days") || null, reason: f.get("reason") }) } toast("Đã thực hiện và ghi nhật ký"); refresh() } catch (x) { toast(msg(x)) } };
    m.querySelector("#kbf").onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), iso = v => v ? new Date(v).toISOString() : "";
      if (!confirm("Cấp Buff này?")) return; try { await A("buff_add", { ids: [uid], kind: f.get("kind"), mult: +f.get("mult"), stack: f.get("stack"), starts_at: iso(f.get("starts_at")), ends_at: iso(f.get("ends_at")), note: f.get("note"), reason: f.get("note") || "Cấp Buff" }); toast("Đã cấp Buff"); refresh() } catch (x) { toast(msg(x)) } };
    m.querySelector("#kexc").onchange = async e => { try { await A("exclude", { ids: [uid], on: e.target.checked }); toast(e.target.checked ? "Đã loại khỏi bảng xếp hạng" : "Đã đưa lại vào bảng xếp hạng") } catch (x) { toast(msg(x)) } };
  }
  // Thao tác hàng loạt cho nhiều tài khoản (hoặc tất cả)
  async function bulk(ids) {
    const all = ids === "all"; let IT; try { IT = await A("items") } catch (e) { toast(msg(e)); return }
    const { m, close } = modal(`<h3>Thao tác hàng loạt cho ${all ? "toàn bộ thành viên" : ids.length + " tài khoản"}</h3><form class="kmf" id="kbk"><label>Việc cần làm<select name="act"><option value="stones">Phát ${esc(cur())}</option><option value="exp">Phát EXP</option><option value="grant">Trao tặng vật phẩm hoặc danh hiệu</option><option value="buff">Kích hoạt Buff</option></select></label>
<label>Số lượng / hệ số<input name="v" type="number" step="0.1" value="100"></label><label>Vật phẩm</label><div class="kgp-pick"><span id="kbk_cs">${KG.chosen(null)}</span><button type="button" class="btn sm" id="kbk_pk">Chọn vật phẩm</button></div><input type="hidden" name="item">
<div class="kmr"><label>Số ngày (vật phẩm, Buff)<input name="days" type="number" min="1"></label><label>Loại Buff<select name="bk"><option value="exp">EXP</option><option value="stones">${esc(cur())}</option><option value="drop">Tỷ lệ rơi</option><option value="encounter">Kỳ ngộ</option></select></label></div>
<label>Lý do (bắt buộc)<input name="reason" required maxlength="300"></label><button class="btn pri">Thực hiện</button><p class="aerr" role="alert"></p></form>`);
    m.querySelector("#kbk_pk").onclick = async () => { const f = m.querySelector("#kbk"), id = await KG.pickItem({ items: IT, title: "Chọn vật phẩm để phát", selected: [f.item.value].filter(Boolean) }); if (!id) return; f.item.value = id; m.querySelector("#kbk_cs").innerHTML = KG.chosen(IT.find(x => x.id === id)); f.act.value = "grant" };
    m.querySelector("#kbk").onsubmit = async e => { e.preventDefault(); const f = new FormData(e.target), act = f.get("act"), v = +f.get("v"), base = all ? { all: true } : { ids }, why = f.get("reason"), d = f.get("days");
      if (act === "grant" && !f.get("item")) { m.querySelector(".aerr").textContent = "Hãy bấm Chọn vật phẩm trước"; return }
      const itn = act === "grant" ? ` "${(IT.find(x => x.id === f.get("item")) || {}).name}"` : "";
      if (!confirm(`Xác nhận ${m.querySelector("[name=act]").selectedOptions[0].textContent.toLowerCase()}${itn} cho ${all ? "toàn bộ thành viên" : ids.length + " tài khoản"}? Thao tác sẽ được ghi nhật ký.`)) return;
      try { let r; if (act === "stones") r = await A("adjust", { ...base, stones: v, reason: why }); else if (act === "exp") r = await A("adjust", { ...base, exp: v, reason: why }); else if (act === "grant") r = await A("grant", { ...base, item: f.get("item"), days: d || null, reason: why }); else r = await A("buff_add", { ...base, everyone: all, kind: f.get("bk"), mult: v, ends_at: d ? new Date(Date.now() + d * 864e5).toISOString() : "", note: why, reason: why });
        toast(`Đã thực hiện cho ${n0(r.n)} tài khoản`); close() } catch (x) { m.querySelector(".aerr").textContent = msg(x) } };
  }

  /* ---------- Định tuyến ---------- */
  async function route(a, b) {
    if (!on()) { app.innerHTML = `<section class="sec"><p class="empty">Hệ thống Tu luyện chưa được bật.</p></section>`; return }
    try { await client() } catch (e) { app.innerHTML = errbox(e); return }
    if (me() && !S) await boot();
    if (a === "tu-luyen") return pHome(); if (a === "cua-hang") return pShop(); if (a === "kho-do") return pInv(); if (a === "bang-xep-hang") return pBoard(b);
  }

  /* ---------- Giao diện ---------- */
  const css = document.createElement("style");
  css.textContent = `
#kchip{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 12px;border-radius:18px;background:var(--s1);color:var(--tx);font-size:.82rem;white-space:nowrap}#kchip:hover{background:var(--s2)}
#kchip b{font-weight:700}.kcb{width:46px;height:5px;border-radius:3px;background:var(--s2);overflow:hidden}.kcb i{display:block;height:100%;background:linear-gradient(90deg,var(--ac),#ffd84d)}
.kcs{display:inline-flex;align-items:center;gap:3px}.kst{width:15px;height:15px;flex:none;vertical-align:-2px}
body.clear #kchip{background:#ffffff26;color:#fff}
@media(max-width:700px){#kchip .kcb{display:none}#kchip{padding:0 9px;gap:5px}}
@media(max-width:420px){#kchip{padding:0 7px;gap:4px;font-size:.76rem;height:32px}#kchip .kst{width:13px;height:13px}}
#kpop{position:fixed;right:16px;bottom:84px;z-index:95;display:flex;flex-direction:column;gap:8px;align-items:flex-end;pointer-events:none}
.kpo{display:flex;align-items:center;gap:10px;max-width:320px;padding:9px 14px 9px 9px;border-radius:12px;background:#1b1630f2;color:#fff;box-shadow:0 8px 24px -8px #0008;animation:kpo-in .35s ease-out;font-size:.86rem}
.kpo div{display:flex;flex-direction:column;line-height:1.3}.kpo span{opacity:.85;font-size:.8rem}.kpo.out{opacity:0;transform:translateY(6px);transition:.5s}
.kpi{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#ffffff14;opacity:1!important}.kpi .kst{width:24px;height:24px}.kpi .kg-i{width:20px;height:20px}
.kpo.drop .kpc{animation:kpo-gem 1.2s ease-out}.kpo.rare{box-shadow:0 0 0 1px #9ff3ff80,0 8px 24px -8px #5b8cff}
.kpo.lv{background:linear-gradient(120deg,#2a0f3d,#4a1450)}.kpl{background:conic-gradient(var(--ac),#ffd84d,var(--ac));color:#1b1630;font-weight:800;font-size:.9rem}
.kpo.ach .kpa{background:#ffd84d;color:#1b1630}.kpo.enc{background:linear-gradient(120deg,#0b1b3a,#3a1460)}.kpe{background:#7c6cff}
@keyframes kpo-in{from{opacity:0;transform:translateX(20px) scale(.95)}to{opacity:1;transform:none}}
@keyframes kpo-gem{0%{transform:scale(.4) rotate(-20deg);filter:drop-shadow(0 0 0 #9ff3ff)}50%{transform:scale(1.15);filter:drop-shadow(0 0 8px #9ff3ff)}100%{transform:none}}
@media(prefers-reduced-motion:reduce){.kpo,.kpo.drop .kpc{animation:none}}
#klb~*,.sec>.utabs{overflow-x:auto;max-width:100%}.sec>.utabs a,.sec>.utabs button{white-space:nowrap}.sec .utabs a{padding:5px 12px;border-radius:6px;font-weight:500;font-size:.88rem;color:var(--mu)}.sec .utabs a:hover{color:var(--tx)}.sec .utabs a.on{background:var(--bg);color:var(--tx);box-shadow:0 1px 3px #0002}
.ktabs{display:flex;gap:4px;margin:24px 0 0;border-bottom:1px solid var(--bd);overflow-x:auto}.ktabs a{padding:10px 16px;font-weight:500;color:var(--mu);border-bottom:2px solid transparent;white-space:nowrap}.ktabs a.on{color:var(--tx);border-color:var(--ac)}.ktabs a:hover{color:var(--tx)}
.kgate{text-align:center;max-width:640px;margin:40px auto}.kgate>.kg-i{width:48px;height:48px;color:var(--ac)}.kgate p{color:var(--mu)}.kgate .acts{justify-content:center}
.kav{display:grid;place-items:center;width:var(--s);height:var(--s);border-radius:50%;overflow:hidden;background:linear-gradient(160deg,var(--ac),#5b1a6b);color:#fff;font-weight:700;font-size:calc(var(--s) * .4);flex:none}.kav img{width:100%;height:100%;object-fit:cover}
.khero{background:var(--s1);border-radius:16px;padding:22px 24px}
.khc{display:flex;align-items:center;gap:22px;flex-wrap:wrap}.khi{flex:1;min-width:240px}.khn{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:1.25rem}.kno{font-size:.85rem;color:var(--mu)}
.klvl{display:flex;align-items:center;gap:12px;margin-top:10px}.klb{font-size:.8rem;color:var(--mu)}.klvl>b{font-size:2.2rem;line-height:1;font-family:var(--fd)}
.kxp{flex:1;min-width:160px}.kxb{height:10px;border-radius:5px;background:var(--s2);overflow:hidden}.kxb i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,var(--ac),#ffd84d);transition:width .6s}
.kxp small{color:var(--mu);font-size:.8rem}
.kbal{display:flex;align-items:center;gap:8px;padding:12px 16px;border-radius:12px;background:var(--bg)}.kbal .kst{width:26px;height:26px}.kbal b{font-size:1.4rem}.kbal span{color:var(--mu);font-size:.85rem}
.kbal.sm{padding:6px 12px;background:var(--s1)}.kbal.sm .kst{width:18px;height:18px}.kbal.sm b{font-size:1rem}
.kstats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:18px}.kstats div{background:var(--bg);border-radius:10px;padding:10px 14px}.kstats b{display:block;font-size:1.15rem}.kstats span{color:var(--mu);font-size:.8rem}
.kstats.sm div{background:var(--s1)}
.kcap{margin:12px 0 0;color:var(--mu);font-size:.85rem}
.kbfs{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:12px}.kbfs b{font-size:.85rem;margin-right:4px}.kbf{font-size:.8rem;background:var(--acs);color:var(--ac);padding:2px 9px;border-radius:999px}
.kach{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.kac{display:flex;gap:12px;padding:12px;border-radius:10px;background:var(--s1);opacity:.75}.kac.got{opacity:1;box-shadow:inset 3px 0 0 #ffd84d}.kac div{display:flex;flex-direction:column;gap:2px;min-width:0}.kac small{color:var(--mu);font-size:.8rem}
.kai{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:var(--s2);color:var(--mu)}.kac.got .kai{background:#ffd84d;color:#1b1630}.kai .kg-i{width:22px;height:22px}
.kap{display:block;height:5px;border-radius:3px;background:var(--s2);overflow:hidden;margin-top:4px}.kap i{display:block;height:100%;background:var(--ac)}.kat{color:var(--on)!important}.krw{color:var(--ac)!important}
.kled{display:flex;flex-direction:column;gap:4px}.kle{display:grid;grid-template-columns:110px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 12px;border-radius:8px;background:var(--s1)}
.kld{font-weight:700;color:var(--on);display:inline-flex;align-items:center;gap:3px}.kld.neg{color:#e5484d}.kld .kg-i{width:16px;height:16px}.klt{display:flex;flex-direction:column;min-width:0}.klt b{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.klt small,.kle time{color:var(--mu);font-size:.78rem}
.kled.sm .kle{grid-template-columns:130px minmax(0,1fr) auto;padding:6px 10px;font-size:.88rem}
@media(max-width:700px){.kle{grid-template-columns:84px minmax(0,1fr)}.kle time{grid-column:2}}
.kset{display:flex;flex-direction:column;gap:10px;max-width:640px}.kset label{display:flex;flex-direction:column;gap:4px;font-size:.9rem}.kset label.ck{flex-direction:row;align-items:center;gap:8px}.kset select{max-width:260px}
.kflt input,.kflt select,.kset select,.kmf input,.kmf select,#koutn{background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:7px 10px;font:inherit;width:auto}.kflt #kq{width:100%}.kmf input,.kmf select{width:100%;min-width:0}
.kflt{display:flex;flex-direction:column;gap:10px;background:var(--s1);border-radius:12px;padding:14px;margin-bottom:16px}.kflt input[type=number]{width:96px}.kflt .frow>div{gap:8px}
.kfq.on{background:var(--q)!important;color:#fff}.kfq{box-shadow:inset 0 -2px 0 var(--q)}
.kgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
.kit{display:flex;flex-direction:column;gap:8px;text-align:left;border:0;padding:8px;border-radius:12px;background:var(--s1);color:var(--tx);box-shadow:inset 0 2px 0 var(--q);cursor:pointer}.kit:hover{background:var(--s2)}.kit:focus-visible{outline:2px solid var(--ac)}
.kit .kg-pv{min-height:84px}.kin{display:flex;flex-direction:column;gap:3px;padding:0 4px}.kin small{color:var(--mu);font-size:.78rem}
.kpr{display:flex;align-items:center;gap:4px;padding:0 4px 4px;font-size:.9rem}.kpr s{color:var(--mu);font-size:.8rem;margin-right:2px}.kpr em{font-style:normal;color:var(--mu);font-size:.8rem}.kow{font-style:normal;color:var(--on)!important;font-weight:500}
.kit.own{box-shadow:inset 0 2px 0 var(--q),inset 0 0 0 1px color-mix(in srgb,var(--on) 50%,transparent)}
.kqb{align-self:flex-start;font-size:.72rem;font-weight:700;color:var(--q);border:1px solid color-mix(in srgb,var(--q) 60%,transparent);border-radius:4px;padding:0 6px}
.kmod{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:16px;background:#0009}
.kmb{position:relative;width:min(560px,100%);max-height:90vh;overflow:auto;background:var(--bg);color:var(--tx);border-radius:16px;padding:22px;box-shadow:0 20px 60px #0008}.kmb.wide{width:min(880px,100%)}
.kmx{position:absolute;top:10px;right:10px;width:34px;height:34px;border:0;border-radius:50%;background:var(--s1);color:var(--tx)}
.kdt{display:flex;gap:20px;align-items:flex-start}.kda{flex:none;width:150px;border-radius:12px;overflow:hidden;background:linear-gradient(160deg,#ffd6ea,#c9d6ff)}.kdm{flex:1;min-width:0;display:flex;flex-direction:column;gap:8px}.kdm h3{margin:0;font-size:1.4rem}.kdk{font-size:.8rem;color:var(--mu)}
.kdp{display:grid;grid-template-columns:1fr 1fr;gap:8px}.kg-pvl{background:#fbfaff}.kdm blockquote{margin:0;padding:6px 12px;border-left:3px solid var(--ac);color:var(--mu);font-style:italic}
.kcond{margin:0;padding-left:18px;color:var(--mu);font-size:.88rem}.kdb{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.kdpp{display:inline-flex;align-items:center;gap:4px;font-size:1.05rem}.kdpp s{color:var(--mu);font-size:.85rem}.kcf2{flex-basis:100%;font-size:.92rem}
.kbdl{display:flex;flex-wrap:wrap;gap:6px}.kbdl span{display:flex;flex-direction:column;background:var(--s1);border-radius:8px;padding:4px 10px;font-size:.85rem}.kbdl small{color:var(--mu);font-size:.72rem}
@media(max-width:700px){.kdt{flex-direction:column}.kda{width:120px}.kdp{grid-template-columns:1fr}}
.kinv{display:grid;grid-template-columns:360px minmax(0,1fr);gap:24px;align-items:start}.kinl{position:sticky;top:76px}.kinl h3,.kinr h3{margin:0 0 10px;font-size:1rem}.kinl h3+div{margin-bottom:18px}
@media(max-width:960px){.kinv{grid-template-columns:minmax(0,1fr)}.kinl{position:static}}
.klook{padding:14px;border-radius:14px;background:var(--s1);display:flex;flex-direction:column;gap:12px}
.klook .kcd{background:#1b1630e6;color:#fff}.klook .kcd::after{background:#1b1630}.klook .kcd>div{display:flex;flex-direction:column;gap:6px;min-width:0}.klook .klv{margin-left:auto;align-self:flex-start;font-size:.8rem;color:#ffd84d}
.klk{font-size:1.1rem}.kbdg{display:flex;gap:6px}
.kcmt{background:var(--bg);border-radius:10px;padding:10px 12px}.kcmt p{margin:6px 0 0;font-size:.9rem}.kcmh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.kot{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;background:var(--s1);margin-bottom:6px}.kot span{color:var(--mu);font-size:.8rem;margin-right:auto}
#koutn{flex:1;min-width:160px}
.kil{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;margin-top:12px}
.kii{display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:12px;background:var(--s1);box-shadow:inset 0 2px 0 var(--q)}.kii.lock{opacity:.6}.kii.eq{box-shadow:inset 0 2px 0 var(--q),0 0 0 2px var(--ac)}
.kiip{display:grid;place-items:center;min-height:64px;border-radius:10px;background:#15131f}.kiim{display:flex;flex-direction:column;gap:3px}.kiim small{color:var(--mu);font-size:.78rem}.kii .btn{align-self:flex-start}
.kpod{display:flex;justify-content:center;align-items:flex-end;gap:14px;margin:10px 0 24px;flex-wrap:wrap}
.kpd{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;width:210px;padding:18px 12px 14px;border-radius:16px;background:var(--s1);text-align:center;color:var(--tx)}
.kpd>span{color:var(--mu);font-size:.85rem}.kpd>i{position:absolute;top:-14px;left:50%;transform:translateX(-50%);font-style:normal;font-weight:800;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#1b1630}
.kpd.p1{padding-top:26px;background:linear-gradient(180deg,#ffd84d33,var(--s1) 60%);box-shadow:0 0 0 1.5px #ffd84d}.kpd.p1 i{background:#ffd84d;box-shadow:0 0 14px #ffd84d}
.kpd.p2{box-shadow:0 0 0 1.5px #c8d0e0}.kpd.p2 i{background:#c8d0e0}.kpd.p3{box-shadow:0 0 0 1.5px #d08a4f}.kpd.p3 i{background:#d08a4f}
.klbl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}.klbl li{display:grid;grid-template-columns:40px minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:8px 12px;border-radius:10px;background:var(--s1)}
.krk{font-weight:700;color:var(--mu);text-align:center}.klbu{display:flex;align-items:center;gap:10px;min-width:0;color:var(--tx)}.klbu>span:last-child{display:flex;flex-direction:column;gap:3px;min-width:0}.klv{font-size:.85rem;color:var(--mu)}.kvv{font-weight:700}
@media(max-width:700px){.klbl li{grid-template-columns:30px minmax(0,1fr) auto}.klbl .klv{display:none}}
.kprof{border-radius:16px;padding:0 16px 16px;margin-top:16px}
.kbnr{width:100%;height:100%}
.kpro{margin:14px 0 4px;padding:16px;border-radius:14px;background:var(--s1);display:flex;flex-direction:column;gap:12px}
.kpro.kcd{flex-direction:column;align-items:stretch;padding:16px;gap:12px}
.kpro .kstats.sm div{background:color-mix(in srgb,var(--bg) 72%,transparent)}
.tgh>.kfr.dz{margin-right:22px}.kprt{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.kpach{display:flex;flex-wrap:wrap;gap:6px}.kpach span{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:var(--bg);font-size:.8rem}.kpach .kg-i{width:14px;height:14px;color:#e0a100}.kpach b{font-weight:500}
.kmh{display:flex;gap:16px;align-items:center;margin-bottom:12px}.kmh h3{margin:0 0 4px}.kmh p{margin:6px 0 0}
.kmg{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.kmf{display:flex;flex-direction:column;gap:8px;background:var(--s1);border-radius:12px;padding:12px}.kmf h4{margin:4px 0}.kmf label{display:flex;flex-direction:column;gap:3px;font-size:.82rem;color:var(--mu)}.kmf label.ck{flex-direction:row;align-items:center;color:var(--tx)}.kmf input,.kmf select{background:var(--bg)}
.kmr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:end}
.kmi{display:flex;flex-wrap:wrap;gap:6px}.kmi>span{display:flex;flex-direction:column;gap:2px;background:var(--s1);border-radius:8px;padding:6px 10px;font-size:.85rem}.kmi>span.dead{opacity:.5}.kmi small{color:var(--mu);font-size:.72rem}
.cmi .klvb{font-size:.72rem;font-weight:700;color:var(--ac);background:var(--acs);border-radius:4px;padding:0 5px}
.cmh .kt{margin:0 2px}
/* ===== Trang Tu luyện: thẻ đạo, ô thống kê có biểu tượng động, thành tựu dạng huy chương ===== */
.tl-scene,.tl-stats,.tl-sec,.tl-set{--gold:#ffd84d;--gt:#8a5c00;--gbd:#e6cf8f;--tile:linear-gradient(160deg,#fff,#fbf5ff);--tl-glass:#fff6d6;--tl-ol:#9a6400;--tl-ink:#9a6a00;--vio:#b42fd6;--run:#c026d3}
:root[data-theme=dark] :is(.tl-scene,.tl-stats,.tl-sec,.tl-set){--gt:#ffd84d;--gbd:#6b5222;--tile:linear-gradient(160deg,#2a1c3d,#1c1729 70%);--tl-glass:#ffffff10;--tl-ol:#ffe7a1;--tl-ink:#ffe7a1;--vio:#e27bff;--run:#f472ff}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) :is(.tl-scene,.tl-stats,.tl-sec,.tl-set){--gt:#ffd84d;--gbd:#6b5222;--tile:linear-gradient(160deg,#2a1c3d,#1c1729 70%);--tl-glass:#ffffff10;--tl-ol:#ffe7a1;--tl-ink:#ffe7a1;--vio:#e27bff;--run:#f472ff}}
/* Biểu tượng */
.tli{width:52px;height:52px;flex:none;overflow:visible}.tli.sm{width:28px;height:28px}
.tli .tl-gl{fill:var(--tl-glass);stroke:url(#tlg);stroke-width:2.2;stroke-linejoin:round}
.tli .tl-ln{fill:none;stroke:url(#tlg);stroke-width:2.6;stroke-linecap:round}
.tli .tl-tx{fill:none;stroke:var(--tl-ink);stroke-width:1.5;stroke-linecap:round;opacity:.65}
.tli .tl-gf{fill:url(#tlg);stroke:var(--tl-ol);stroke-width:1;stroke-linejoin:round;stroke-opacity:.6}
.tli .tl-vf{fill:url(#tlv);stroke:var(--tl-ol);stroke-width:1;stroke-opacity:.5}
.tli .tl-st,.tli .tl-sb,.tli .tl-pg{fill:url(#tlg)}
.tli .tl-fl{stroke:#f5b82e;stroke-width:1.7;stroke-dasharray:2 3}
.tli .tl-ck{fill:none;stroke:url(#tlv);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:30;stroke-dashoffset:0}
.tli .tl-gm{fill:#fff;stroke:#ff6bf0;stroke-width:1.2}
.tli .tl-sh{fill:#fff;opacity:0}
.tl-spk{fill:#fff;transform-box:fill-box;transform-origin:center;filter:drop-shadow(0 0 2px #ffd84d) drop-shadow(0 0 4px #ff8af5)}
.tl-flip{transform-box:view-box;transform-origin:50% 50%}.tl-st,.tl-sb{transform-box:fill-box;transform-origin:50% 100%}
.tl-pg{transform-box:view-box;transform-origin:24px 24px}.tl-bob{transform-box:view-box}
@media(prefers-reduced-motion:no-preference){
.tl-spk{animation:tl-tw 2.8s ease-in-out infinite}
.tli-hourglass .tl-flip{animation:tl-flip 9s ease-in-out infinite}.tli-hourglass .tl-st{animation:tl-sdt 9s linear infinite}.tli-hourglass .tl-sb{animation:tl-sdb 9s linear infinite}.tli-hourglass .tl-fl{animation:tl-flow .7s linear infinite,tl-flo 9s linear infinite}
.tli-book .tl-pg{animation:tl-page 5s ease-in-out infinite}
.tli-books .tl-bob{animation:tl-bob 3.2s ease-in-out infinite}
.tli-calendar .tl-ck{animation:tl-draw 5s ease-out infinite}
.tli-crown .tl-gm{animation:tl-gem 1.8s ease-in-out infinite}
.tli-trophy .tl-sh{animation:tl-shine 4.5s ease-in-out infinite}
}
@keyframes tl-tw{0%,100%{opacity:0;transform:scale(.3) rotate(0)}45%,55%{opacity:1;transform:scale(1) rotate(45deg)}}
@keyframes tl-flip{0%,88%{transform:rotate(0)}100%{transform:rotate(180deg)}}
@keyframes tl-sdt{0%{transform:scaleY(1)}86%,100%{transform:scaleY(.08)}}
@keyframes tl-sdb{0%{transform:scaleY(.15)}86%,100%{transform:scaleY(1)}}
@keyframes tl-flow{to{stroke-dashoffset:-5}}@keyframes tl-flo{0%,84%{opacity:1}86%,100%{opacity:0}}
@keyframes tl-page{0%,40%{transform:scaleX(1);opacity:0}45%{opacity:.95}75%{transform:scaleX(-1);opacity:.95}82%,100%{transform:scaleX(-1);opacity:0}}
@keyframes tl-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes tl-draw{0%{stroke-dashoffset:30}30%,85%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes tl-gem{0%,100%{fill:#fff}50%{fill:#ffb3fb}}
@keyframes tl-shine{0%,55%{opacity:0;transform:translateX(0)}65%{opacity:.75}85%,100%{opacity:0;transform:translateX(34px)}}
/* Thẻ đạo (luôn là cảnh đêm, ở cả giao diện sáng) */
.tl-scene{position:relative;isolation:isolate;overflow:hidden;margin:20px 0 0;padding:26px 28px 24px;border-radius:20px;color:#f6f1ff;
  background:radial-gradient(120% 90% at 85% 0%,#4a1f63 0%,transparent 55%),linear-gradient(170deg,#241536 0%,#17122a 60%,#120e1f 100%);box-shadow:0 18px 40px -24px #2a0a3f}
.tl-scene::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(130deg,#ffd84d99,#ff00ff40 40%,#ffd84d26 70%,#ffd84d80);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
.tl-bgs{position:absolute;inset:0;z-index:-1;pointer-events:none}
.tl-mt{position:absolute;right:0;bottom:0;width:100%;height:78%}
.tl-m1{fill:#2b1c45;opacity:.85}.tl-m2{fill:#22153a}.tl-m3{fill:#1a1129}
.tl-mc{position:absolute;right:9%;top:-30px;width:230px;height:230px;transform:perspective(500px) rotateX(64deg);opacity:.55;border-radius:50%;background:radial-gradient(circle,#ff00ff30,transparent 65%)}
.tl-mc svg{width:100%;height:100%;fill:none;stroke:#ffd84d;stroke-width:1;filter:drop-shadow(0 0 4px #ff8af5)}
.tl-pt{position:absolute;top:-12px;left:var(--x);width:9px;height:7px;border-radius:80% 0 80% 0;background:linear-gradient(135deg,#ffe0f3,#ff79c6);opacity:0;transform:scale(var(--s))}
@media(prefers-reduced-motion:no-preference){
.tl-mc svg{animation:tl-spin 60s linear infinite}
.tl-pt{animation:tl-fall var(--t) linear var(--d) infinite}
}
@keyframes tl-spin{to{transform:rotate(360deg)}}
@keyframes tl-fall{0%{opacity:0;transform:translate(0,0) rotate(0) scale(var(--s))}8%{opacity:.85}50%{transform:translate(-40px,190px) rotate(260deg) scale(var(--s))}90%{opacity:.7}100%{opacity:0;transform:translate(-14px,400px) rotate(540deg) scale(var(--s))}}
.tl-hd{display:flex;align-items:center;gap:14px;margin-bottom:20px}
.tl-hd h1{margin:0;font-family:var(--fd);font-weight:700;font-size:clamp(1.9rem,3.4vw,2.6rem);line-height:1.05;letter-spacing:.01em;background:linear-gradient(180deg,#fff7d6 10%,#ffd84d 60%,#e0a526);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 10px #ff00ff40)}
.tl-hd p{margin:4px 0 0;color:#d9cdea;font-size:.9rem;max-width:60ch}
.tl-emb{width:58px;height:58px;flex:none;overflow:visible}.tl-eh{fill:#ff00ff;opacity:.16;filter:blur(6px)}.tl-lot{fill:url(#tlv)}.tl-flm{fill:url(#tlf);transform-box:fill-box;transform-origin:50% 100%}
@media(prefers-reduced-motion:no-preference){.tl-flm{animation:tl-flk 2.4s ease-in-out infinite}.tl-eh{animation:tl-br 3.6s ease-in-out infinite}}
@keyframes tl-flk{0%,100%{transform:scale(1,1) skewX(0)}30%{transform:scale(.96,1.06) skewX(-3deg)}60%{transform:scale(1.03,.97) skewX(2deg)}}
@keyframes tl-br{0%,100%{opacity:.12}50%{opacity:.3}}
.tl-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;grid-template-areas:"av who seal bal" "av xp xp bal";column-gap:24px;row-gap:14px;align-items:center;padding:20px 22px;border-radius:16px;background:linear-gradient(120deg,#ffffff0d,#ffffff05);border:1px solid #ffd84d40;backdrop-filter:blur(3px);box-shadow:inset 0 1px 0 #ffffff14}
.tl-av{grid-area:av;position:relative;display:grid;place-items:center;width:140px;height:140px}
.tl-av>.kfr,.tl-av>.kav{position:relative;z-index:1}
.tl-rg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}.tl-r1{fill:none;stroke:url(#tlgb);stroke-width:3;filter:drop-shadow(0 0 5px #ffd84d80)}.tl-r2{fill:none;stroke:#ffd84d;stroke-width:1.2;opacity:.7}.tl-r3{fill:url(#tlgb);stroke:#fff6cc;stroke-width:.6}
.tl-r2w{transform-box:view-box;transform-origin:50% 50%}
.tl-orb{position:absolute;inset:-2px;border-radius:50%;pointer-events:none}.tl-orb::after{content:"";position:absolute;top:-3px;left:50%;width:7px;height:7px;margin-left:-3.5px;border-radius:50%;background:#fff;box-shadow:0 0 8px 2px #ff8af5,0 0 2px #fff}
.tl-orb.b{inset:12px}.tl-orb.b::after{width:5px;height:5px;box-shadow:0 0 6px 2px #ffd84d}
@media(prefers-reduced-motion:no-preference){.tl-r2w{animation:tl-spin 40s linear infinite}.tl-orb{animation:tl-spin 9s linear infinite}.tl-orb.b{animation:tl-spin 13s linear infinite reverse}}
.tl-who{grid-area:who;min-width:0;display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.tl-nm{font-family:var(--fd);font-weight:700;font-size:clamp(1.4rem,2.4vw,1.9rem);line-height:1.15;overflow-wrap:anywhere}
.tl-not{font-size:.85rem;color:#e6d8ff;border:1px dashed #ffffff40;border-radius:999px;padding:4px 12px}.tl-not:hover{border-color:#ffd84d;color:#fff}
.tl-seal{grid-area:seal;position:relative;width:128px;height:128px;display:grid;place-items:center}
.tl-sl{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.tl-s0{fill:#ff00ff12;stroke:#ffd84d55;stroke-width:1}
.tl-s1,.tl-s2{transform-box:view-box;transform-origin:50% 50%}.tl-s1{fill:none;stroke:#ffd84d;stroke-width:1.6;stroke-linecap:round}.tl-sr{stroke-width:1}
.tl-s2{fill:none;stroke:#ff6bf0;stroke-width:1;opacity:.55}
@media(prefers-reduced-motion:no-preference){.tl-s1{animation:tl-spin 48s linear infinite}.tl-s2{animation:tl-spin 30s linear infinite reverse}}
.tl-seal>div{position:relative;display:flex;flex-direction:column;align-items:center;line-height:1}
.tl-seal small{font-size:.75rem;color:#e9dcff;letter-spacing:.04em}
.tl-seal b{font-family:var(--fd);font-weight:700;font-size:2.6rem;background:linear-gradient(180deg,#fffbe8 5%,#ffd84d 55%,#d89416);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 10px #ff00ff66)}
.tl-bal{grid-area:bal;display:flex;align-items:center;gap:12px;align-self:center;padding:14px 16px;border-radius:14px;background:linear-gradient(150deg,#2b1745,#1a1430);border:1px solid #ffd84d55;color:#fff;min-width:210px;box-shadow:inset 0 0 22px #9ff3ff10}
.tl-bal:hover{border-color:#ffd84d;color:#fff}.tl-bal:focus-visible{outline:2px solid #ffd84d;outline-offset:2px}
.tl-gem{position:relative;display:grid;place-items:center;width:52px;height:52px;flex:none}.tl-gem .kst{width:46px;height:46px;filter:drop-shadow(0 0 8px #9ff3ff80)}
.tl-bv{display:flex;flex-direction:column;line-height:1.15}.tl-bv small{font-size:.8rem;color:#d9cdea}.tl-bv b{font-family:var(--fd);font-weight:700;font-size:1.65rem;color:#ffd84d}
.tl-bal em{margin-left:auto;font-style:normal;font-size:.78rem;color:#ffd84d;border:1px solid #ffd84d80;border-radius:999px;padding:3px 10px;white-space:nowrap}
.tl-xp{grid-area:xp;min-width:0}
.tl-xpb{position:relative;height:14px;border-radius:999px;background:#0d0a18;box-shadow:inset 0 0 0 1px #ffffff1f;overflow:hidden}
.tl-xpb i{position:relative;display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9b1fd6,#ff00ff 70%,#ff8af5);box-shadow:0 0 12px #ff00ffaa;transition:width .8s}
.tl-xpb i::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,#ffffff70 50%,transparent 70%) 0 0/200% 100% no-repeat;border-radius:inherit}
@media(prefers-reduced-motion:no-preference){.tl-xpb i::after{animation:tl-run 3.4s ease-in-out infinite}}
@keyframes tl-run{0%{background-position:150% 0}70%,100%{background-position:-60% 0}}
.tl-xpt{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:6px;font-size:.82rem;color:#d9cdea}.tl-xpt b{color:#fff}
.tl-meta{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin-top:10px;font-size:.8rem;color:#cbbfe0}
.tl-bf{display:inline-flex;align-items:baseline;gap:5px;padding:2px 10px;border-radius:999px;background:#ff00ff26;color:#ffc4fb;font-weight:700}.tl-bf small{font-weight:500;opacity:.85}
/* Ô thống kê */
.tl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:16px}
.tl-sc{position:relative;overflow:hidden;display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:14px;background:var(--tile);border:1px solid var(--gbd)}
.tl-sc::after{content:"";position:absolute;right:-6px;bottom:-8px;width:120px;height:56px;opacity:.09;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 56'%3E%3Cpath fill='%23ff00ff' d='M0 56l26-22 14 8 22-26 12 10 18-14 28 28v16z'/%3E%3Cpath fill='%23ff00ff' d='M66 18h12v8H66zM62 19q6-1 10-5 4 4 10 5zM64 13q5-1 8-4 3 3 8 4z'/%3E%3C/svg%3E") no-repeat right bottom/contain;pointer-events:none}
.tl-sc>div{display:flex;flex-direction:column;gap:2px;min-width:0}.tl-sc span{font-size:.85rem;color:var(--mu)}
.tl-sc b{font-family:var(--fd);font-weight:700;font-size:1.55rem;line-height:1.15;color:var(--gt)}.tl-sc b small{font-size:.62em;font-weight:500;margin:0 .25em 0 .2em}
/* Tiêu đề mục */
.tl-sec{margin-top:28px}
.tl-sh{display:flex;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}.tl-sh h2{display:flex;align-items:center;gap:10px;margin:0;font-family:var(--fd);font-weight:700;font-size:1.45rem}
.tl-cnt{color:var(--mu);font-size:.88rem}
.tl-more{margin-left:auto;border:1px solid var(--gbd);background:transparent;color:var(--gt);border-radius:999px;padding:5px 14px;font:inherit;font-size:.85rem;cursor:pointer}.tl-more:hover{background:color-mix(in srgb,var(--gold) 14%,transparent)}
.tl-more.wide{display:block;margin:12px auto 0}
/* Thành tựu */
.tl-ach{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.tl-ac{display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:14px;background:var(--tile);border:1px solid color-mix(in srgb,var(--run) 35%,transparent)}
.tl-ac.got{border-color:var(--gbd);background:linear-gradient(160deg,color-mix(in srgb,var(--gold) 16%,transparent),transparent 60%),var(--tile);box-shadow:0 0 0 1px color-mix(in srgb,var(--gold) 30%,transparent)}
.tl-ac.hid{border-style:dashed;border-color:var(--bd)}
.tl-acb{display:flex;flex-direction:column;gap:4px;min-width:0;flex:1}.tl-acb h3{margin:0;font-family:var(--fd);font-weight:700;font-size:1.05rem}.tl-acb p{margin:0;color:var(--mu);font-size:.84rem;line-height:1.45}
.tl-md{--mc:var(--run);position:relative;flex:none;display:grid;place-items:center;width:58px;height:58px;border-radius:50%;color:var(--mc);background:radial-gradient(circle at 50% 35%,color-mix(in srgb,var(--mc) 30%,transparent),color-mix(in srgb,var(--mc) 6%,transparent) 70%)}
.tl-md.got{--mc:#e0a526;color:var(--gt)}.tl-md.hid{--mc:var(--mu)}
.tl-md .kg-i{width:34px;height:34px;position:relative;z-index:1;filter:drop-shadow(0 2px 3px #0005)}
.tl-mdr{position:absolute;inset:0;width:100%;height:100%;fill:none;stroke:var(--mc);stroke-width:2}.tl-tk{stroke-width:2.4;stroke-dasharray:1 4.2;opacity:.8;transform-box:view-box;transform-origin:50% 50%}
.tl-md.got .tl-mdr circle:first-child{stroke:url(#tlgb);stroke-width:2.6}
.tl-mds{position:absolute;top:-4px;right:-4px;width:18px;height:18px;overflow:visible}
@media(prefers-reduced-motion:no-preference){.tl-md.got .tl-tk{animation:tl-spin 20s linear infinite}}
.tl-pr{display:flex;align-items:center;gap:10px;margin-top:6px}.tl-bar{flex:1;height:8px;border-radius:999px;background:color-mix(in srgb,var(--run) 14%,transparent);overflow:hidden}.tl-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9b1fd6,#ff00ff);box-shadow:0 0 8px #ff00ff80}
.tl-num{font-size:.82rem;color:var(--mu);white-space:nowrap}.tl-num b{color:var(--tx)}
.tl-done{display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-size:.82rem;font-weight:700;color:var(--gt)}.tl-done .kg-i{width:16px;height:16px}
.tl-rw{color:var(--vio);font-size:.8rem}
/* Lịch sử */
.tl-tabs{display:grid;grid-template-columns:1fr 1fr;padding:4px;border-radius:12px;background:var(--s1);gap:4px;margin-bottom:12px}
.tl-tabs button{display:flex;align-items:center;justify-content:center;gap:8px;padding:10px;border:0;border-radius:9px;background:transparent;color:var(--mu);font:inherit;font-weight:500;cursor:pointer}
.tl-tabs button .kg-i{width:17px;height:17px}.tl-tabs button:hover{color:var(--tx)}
.tl-tabs button.on{background:linear-gradient(180deg,color-mix(in srgb,#ff00ff 22%,var(--bg)),var(--bg));color:var(--tx);box-shadow:inset 0 0 0 1px #ff00ff80,0 4px 14px -6px #ff00ff}
.tl-tabs button:focus-visible{outline:2px solid var(--ac);outline-offset:2px}
.tl-tb{border-radius:12px;background:var(--s1);overflow:hidden}
.tl-tr{display:grid;grid-template-columns:170px minmax(0,1fr) auto;gap:14px;align-items:center;padding:11px 16px;border-top:1px solid var(--bd)}
.tl-th{border-top:0;font-size:.8rem;color:var(--mu);padding-block:9px;background:color-mix(in srgb,var(--s2) 50%,transparent)}.tl-th span:last-child{text-align:right}
.tl-tr time{font-size:.85rem;color:var(--mu);font-variant-numeric:tabular-nums}.tl-tr time span{margin-left:6px}
.tl-ct{display:flex;align-items:center;gap:10px;min-width:0}.tl-ct>i{flex:none;display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:var(--bg);color:var(--vio)}.tl-ct>i .kg-i{width:17px;height:17px}
.tl-ct>span{display:flex;flex-direction:column;min-width:0}.tl-ct b{font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tl-ct small{color:var(--mu);font-size:.76rem}
.tl-am{display:inline-flex;align-items:center;gap:4px;justify-content:flex-end;font-weight:700;color:var(--on);font-variant-numeric:tabular-nums;white-space:nowrap}.tl-am.neg{color:#e5484d}.tl-am small{font-size:.78em;font-weight:500}.tl-am .kst{width:17px;height:17px}
.tl-am.it{color:var(--vio);font-weight:500;font-size:.85rem}.tl-am.it .kg-i{width:15px;height:15px}
/* Cài đặt gọn lại */
.tl-set{border:1px solid var(--bd);border-radius:12px;padding:0 16px}.tl-set summary{cursor:pointer;padding:12px 0;font-weight:500}.tl-set .kset{padding-bottom:16px}
/* Thẻ chuyển trang Tu luyện / Cửa hàng / Kho đồ / Bảng xếp hạng */
.ktabs a.on{border-image:linear-gradient(90deg,#ff00ff,#ffd84d) 1}
/* Màn hình vừa và nhỏ */
@media(max-width:1100px){.tl-card{grid-template-columns:auto minmax(0,1fr) auto;grid-template-areas:"av who who" "av seal bal" "xp xp xp"}.tl-bal{min-width:0}.tl-ach{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){
.tl-scene{padding:18px 14px;border-radius:16px}.tl-hd{gap:10px;margin-bottom:14px}.tl-emb{width:46px;height:46px}.tl-hd p{font-size:.84rem}
.tl-card{grid-template-columns:auto minmax(0,1fr);grid-template-areas:"av who" "seal bal" "xp xp";column-gap:14px;padding:14px}
.tl-av{zoom:.72}.tl-seal{width:104px;height:104px;justify-self:center}.tl-seal b{font-size:2.1rem}
.tl-bal{flex-wrap:wrap;gap:8px;padding:12px}.tl-gem{width:40px;height:40px}.tl-gem .kst{width:36px;height:36px}.tl-bv b{font-size:1.35rem}.tl-bal em{margin-left:0}
.tl-mc{width:150px;height:150px;right:-10px}
.tl-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tl-sc{flex-direction:column;align-items:flex-start;gap:8px;padding:12px 14px}.tl-sc .tli{width:40px;height:40px}.tl-sc b{font-size:1.25rem}
.tl-ach{grid-template-columns:minmax(0,1fr)}.tl-ac{padding:12px}
.tl-tr{grid-template-columns:minmax(0,1fr) auto;row-gap:2px;padding:10px 12px}.tl-th{display:none}.tl-tr time{grid-row:2;grid-column:1/-1;font-size:.76rem;padding-left:40px}.tl-ct{grid-row:1}
}
.kst-s{transform-box:fill-box;transform-origin:center;opacity:0}
@media(prefers-reduced-motion:no-preference){.kst-s{animation:tl-tw 3.2s ease-in-out infinite}}
`;
  document.head.appendChild(css);

  addEventListener("kauth", boot);
  window.KGP = { handles: a => ROUTES.includes(a), route, read, stop, cards, card, profile, member, bulk, boot, state: () => S, on };
})();
