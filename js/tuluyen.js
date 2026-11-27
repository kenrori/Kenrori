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
  const STONE = '<svg class="kst" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 19 8 16 21H8L5 8z" fill="url(#kstg)"/><path d="M5 8h14M12 2 9.5 8 12 21 14.5 8z" fill="none" stroke="#fff8" stroke-width="1"/><defs><linearGradient id="kstg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#9ff3ff"/><stop offset=".5" stop-color="#5b8cff"/><stop offset="1" stop-color="#c06bff"/></linearGradient></defs></svg>';
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
      else if (e.t === "ach") pop(`<span class="kpi kpa">${KG.icon(e.icon || "star")}</span><div><b>Thành tựu: ${esc(e.name)}</b><span>Đã mở khóa, xem phần thưởng trong Tu luyện</span></div>`, "ach big");
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

  /* ---------- Trang Tu luyện ---------- */
  async function pHome() {
    document.title = "Tu luyện | Kenrori";
    if (!me()) { app.innerHTML = nav("tu-luyen") + gate(); return }
    loading();
    try { S = { ...S, ...(await rpc("my_state")) }; chip() } catch (e) { app.innerHTML = errbox(e); return }
    const [cd, ach, led] = await Promise.all([rpc("player_public", { ids: [me().id] }).then(r => r[me().id]).catch(() => null), rpc("ach_list").catch(() => []), rpc("my_ledger", { lim: 60 }).catch(() => [])]);
    ACH = ach; const c = cd || { name: (ST.prof() || {}).display_name || "Bạn", eq: {} }, p = Math.min(100, S.exp / Math.max(1, S.need) * 100), got = ach.filter(a => a.at).length;
    const prv = a => { if (!a.rule) return null; const v = { chapters: S.chapters, read_hours: S.read_seconds / 3600, night_min: S.night_seconds / 60, days: S.days, genres: S.genres, series: S.series, level: S.level, titles: S.titles, spent: S.spent, encounters: S.encounters }[a.rule.t]; return v == null ? null : [Math.min(v, a.rule.v), a.rule.v] };
    const bf = (S.buffs || []).map(b => `<span class="kbf">${{ exp: "EXP", stones: cur(), drop: "Tỷ lệ rơi", encounter: "Kỳ ngộ" }[b.kind]} x${+(+b.mult).toFixed(2)}${b.ends_at ? `, tới ${new Date(b.ends_at).toLocaleDateString("vi-VN")}` : ", vĩnh viễn"}${b.note ? ` (${esc(b.note)})` : ""}</span>`).join("");
    const capE = S.cfg && +S.cfg.daily_exp_cap, capS = S.cfg && +S.cfg.daily_stone_cap;
    app.innerHTML = nav("tu-luyen") + `<section class="sec khero">
<div class="khc">${avOf(c, 84)}<div class="khi"><div class="khn"><b>${KG.name(c.name, c.eq)}</b>${c.eq && c.eq.title ? KG.title(c.eq.title, { size: "md" }) : '<a class="kno" href="#kho-do">Chưa trang bị danh hiệu</a>'}</div>
<div class="klvl"><span class="klb">Cấp</span><b>${n0(S.level)}</b><div class="kxp"><div class="kxb" role="progressbar" aria-valuemin="0" aria-valuemax="${S.need}" aria-valuenow="${S.exp}" aria-label="Kinh nghiệm"><i style="width:${p.toFixed(2)}%"></i></div><small>${n0(S.exp)} / ${n0(S.need)} EXP để lên cấp ${n0(S.level + 1)}</small></div></div></div>
<div class="kbal">${STONE}<b>${n0(S.stones)}</b><span>${esc(cur())}</span><a class="btn pri sm" href="#cua-hang">Cửa hàng</a></div></div>
<div class="kstats">${[["Thời gian đọc", hrs(S.read_seconds)], ["Chương đã đọc xong", n0(S.chapters)], ["Bộ đã đọc", n0(S.series)], ["Ngày ghé Kenrori", n0(S.days)], ["Danh hiệu sở hữu", n0(S.titles)], ["Thành tựu", `${got}/${ach.length}`]].map(([l, v]) => `<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>
${capE ? `<p class="kcap">Hôm nay: ${n0(S.daily_exp)}/${n0(capE)} EXP${capS ? `, ${n0(S.daily_stones)}/${n0(capS)} ${esc(cur())} nhặt khi đọc` : ""}. Giới hạn này đặt lại mỗi ngày, không có hình phạt khi nghỉ đọc.</p>` : ""}
${bf ? `<div class="kbfs"><b>Đang được tăng thưởng</b>${bf}</div>` : ""}</section>
<section class="sec">${head("Thành tựu", `<span class="shn">${got} đã mở khóa</span>`)}<div class="kach">${ach.map(a => { const pr = !a.at && prv(a); return `<div class="kac${a.at ? " got" : ""}${a.hidden && !a.at ? " hid" : ""}"><span class="kai">${KG.icon(a.icon || "star")}</span><div><b>${esc(a.name)}</b><small>${esc(a.description)}</small>${pr ? `<span class="kap"><i style="width:${(pr[0] / pr[1] * 100).toFixed(1)}%"></i></span><small>${n0(Math.floor(pr[0]))}/${n0(pr[1])}</small>` : ""}${a.at ? `<small class="kat">Mở khóa ${new Date(a.at).toLocaleDateString("vi-VN")}</small>` : ""}${a.reward && !a.at ? `<small class="krw">Thưởng: ${[a.reward.exp ? n0(a.reward.exp) + " EXP" : "", a.reward.stones ? n0(a.reward.stones) + " " + esc(cur()) : "", (a.reward.items || []).length ? "vật phẩm" : ""].filter(Boolean).join(", ")}</small>` : ""}</div></div>` }).join("")}</div></section>
<section class="sec">${head("Lịch sử nhận và tiêu", `<div class="utabs" role="tablist">${[["all", "Tất cả"], ["stones", cur()], ["exp", "EXP"], ["item", "Vật phẩm"]].map(([k, l], i) => `<button data-lf="${k}" class="${i ? "" : "on"}">${esc(l)}</button>`).join("")}</div>`)}<div id="kled"></div></section>
<section class="sec">${head("Cài đặt")}<div class="kset"><label>Hiệu ứng danh hiệu<select id="kfx">${[["full", "Đầy đủ"], ["simple", "Đơn giản"], ["off", "Tắt hiệu ứng"]].map(([v, l]) => `<option value="${v}"${KG.fxMode() === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
<label class="ck"><input type="checkbox" id="kopt"${S.lb_opt_out ? " checked" : ""}> Không hiện tôi trên bảng xếp hạng</label><label class="ck"><input type="checkbox" id="kpub"${S.public_stats ? " checked" : ""}> Công khai thời gian đọc và số chương trên hồ sơ</label>
<p class="mu">${esc(cur())} và lịch sử nhận, tiêu chỉ bạn và quản trị viên thấy. Cách tính: thời gian đọc thực tế khi tab đang mở và bạn có cuộn hoặc chuyển trang; mỗi chương chỉ tính hoàn thành một lần.</p></div></section>`;
    const SRC = { read: "Đọc truyện", complete: "Hoàn thành chương", series: "Bộ mới", daily: "Đăng nhập", drop: "Rơi khi đọc", encounter: "Kỳ ngộ", level: "Thưởng lên cấp", achievement: "Thành tựu", shop: "Cửa hàng", admin: "Quản trị viên", event: "Sự kiện" };
    const drawL = f => { const L = led.filter(l => f === "all" || l.kind === f || (f === "exp" && l.kind === "level")); $("#kled").innerHTML = L.length ? `<div class="kled">${L.map(l => `<div class="kle"><span class="kld ${l.delta < 0 ? "neg" : ""}">${l.kind === "item" ? KG.icon("gem") : l.kind === "achievement" ? KG.icon("star") : (l.delta > 0 ? "+" : "") + n0(l.delta)}${l.kind === "stones" ? STONE : l.kind === "exp" ? " EXP" : l.kind === "level" ? " cấp" : ""}</span><span class="klt"><b>${esc(l.reason || SRC[l.source] || l.source)}</b><small>${SRC[l.source] || esc(l.source)}${l.before_v != null && l.kind === "stones" ? `, số dư ${n0(l.before_v)} → ${n0(l.after_v)}` : ""}</small></span><time>${new Date(l.at).toLocaleString("vi-VN")}</time></div>`).join("")}</div>` : '<p class="empty">Chưa có gì. Cứ đọc truyện, lịch sử sẽ hiện ở đây.</p>' };
    drawL("all");
    app.querySelector(".utabs").onclick = e => { const b = e.target.closest("[data-lf]"); if (!b) return; app.querySelectorAll("[data-lf]").forEach(x => x.classList.toggle("on", x === b)); drawL(b.dataset.lf) };
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
${(P.ach || []).length ? `<div class="kpach">${P.ach.slice(0, 24).map(a => `<span title="${esc(a.name)}, ${new Date(a.at).toLocaleDateString("vi-VN")}">${KG.icon(a.icon || "star")}<b>${esc(a.name)}</b></span>`).join("")}</div>` : ""}</div>`;
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
.kpro{margin:14px 0 4px;padding:16px;border-radius:14px;background:var(--s1);display:flex;flex-direction:column;gap:12px}.kprt{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.kpach{display:flex;flex-wrap:wrap;gap:6px}.kpach span{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:var(--bg);font-size:.8rem}.kpach .kg-i{width:14px;height:14px;color:#e0a100}.kpach b{font-weight:500}
.kmh{display:flex;gap:16px;align-items:center;margin-bottom:12px}.kmh h3{margin:0 0 4px}.kmh p{margin:6px 0 0}
.kmg{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}
.kmf{display:flex;flex-direction:column;gap:8px;background:var(--s1);border-radius:12px;padding:12px}.kmf h4{margin:4px 0}.kmf label{display:flex;flex-direction:column;gap:3px;font-size:.82rem;color:var(--mu)}.kmf label.ck{flex-direction:row;align-items:center;color:var(--tx)}.kmf input,.kmf select{background:var(--bg)}
.kmr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:end}
.kmi{display:flex;flex-wrap:wrap;gap:6px}.kmi>span{display:flex;flex-direction:column;gap:2px;background:var(--s1);border-radius:8px;padding:6px 10px;font-size:.85rem}.kmi>span.dead{opacity:.5}.kmi small{color:var(--mu);font-size:.72rem}
.cmi .klvb{font-size:.72rem;font-weight:700;color:var(--ac);background:var(--acs);border-radius:4px;padding:0 5px}
.cmh .kt{margin:0 2px}
`;
  document.head.appendChild(css);

  addEventListener("kauth", boot);
  window.KGP = { handles: a => ROUTES.includes(a), route, read, stop, cards, card, profile, member, bulk, boot, state: () => S, on };
})();
