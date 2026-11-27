/* =====================================================================
   Kenrori: khu Sáng tác (tác giả tự đăng truyện), dùng Supabase.
   File này dùng chung các hàm của index.html ($, esc, app, sec, ic, I, ...).
   ===================================================================== */
(() => {
  const ST_ROUTES = ["sang-tac", "st", "tg", "viet", "kiem-duyet", "noi-quy"];
  const GENRES0 = ["Hành động", "Phiêu lưu", "Lãng mạn", "Học đường", "Fantasy", "Isekai", "Hài hước", "Kinh dị", "Slice of Life", "Drama", "Sci-fi", "Võ thuật", "Tu tiên", "Trinh thám", "Đời thường", "Bi kịch"];
  // Danh sách thể loại lấy từ sổ thể loại trong trang quản trị nếu có
  const GENRES = new Proxy([], { get: (t, k) => { const L = (() => { try { const R = (DATA.site.genres || []).filter(g => !g.hidden).map(g => g.name); return R.length ? R : GENRES0 } catch (e) { return GENRES0 } })(); const v = L[k]; return typeof v === "function" ? v.bind(L) : v } });
  const STS = { ongoing: ["Đang ra", "on"], completed: ["Hoàn thành", "done"], hiatus: ["Tạm ngưng", "pause"] };
  const WSEL = "id,title,summary,cover_url,genres,status,mature,updated_at,created_at,author_id,author:profiles(display_name),chapters(count)";
  const PG = 24, MAXC = 120000;
  let sb = null, me = null, prof = null, initP = null;

  const cfg = () => { try { return (DATA.site && DATA.site.sb) || {} } catch (e) { return {} } };
  const sbOk = () => /^https:\/\//.test(cfg().url || "") && !!cfg().key;
  const enabled = () => { try { return sbOk() && DATA.site.st === true } catch (e) { return false } };
  // Tài khoản dùng chung cho khu Sáng tác và hệ thống Tu luyện
  const acct = () => { try { return sbOk() && (DATA.site.st === true || DATA.site.game === true) } catch (e) { return false } };
  const kauth = () => setTimeout(() => dispatchEvent(new CustomEvent("kauth")), 0);
  const isMod = () => !!(prof && !prof.banned && (prof.role === "mod" || prof.role === "admin"));
  const ss = { get: k => { try { return sessionStorage.getItem(k) } catch (e) {} }, set: (k, v) => { try { sessionStorage.setItem(k, v) } catch (e) {} } };
  const day = t => lday(t);
  const stS = s => { const [l, c] = STS[s] || STS.ongoing; return `<span class="st ${c}">${l}</span>` };
  const cnt = w => (w.chapters && w.chapters[0] && w.chapters[0].count) || 0;
  const aName = w => (w.author && w.author.display_name) || "Tác giả";
  /* Ảnh minh họa trong chương: mỗi ảnh một dòng [img:đường-dẫn|chú thích]. Chỉ nhận ảnh tải lên kho ảnh Supabase của web. */
  const lines = t => String(t || "").normalize("NFC").split(/\n+/).map(x => x.trim()).filter(Boolean);
  const SBI = () => String(cfg().url || "").replace(/\/+$/, "") + "/storage/v1/object/public/covers/";
  const IMTOK = /^\[img:[^\]]*\]$/i, IMRE = /^\[img:\s*(https:\/\/[^\s|\]"'<>]+)\s*(?:\|\s*([^\]]*))?\]$/i;
  const imgOf = l => { const m = IMRE.exec(l); return m && m[1].startsWith(SBI()) && /\.(webp|jpe?g|png)$/i.test(m[1]) ? { u: m[1], c: (m[2] || "").trim() } : null };
  const imgsIn = t => lines(t).map(imgOf).filter(Boolean);
  const onlyImgs = t => { const L = lines(t); return L.length > 0 && L.every(imgOf) };
  const words = t => (lines(t).filter(l => !IMTOK.test(l)).join(" ").match(/\S+/g) || []).length;
  const paras = t => lines(t).map(x => `<p>${esc(x)}</p>`).join("");
  function rbody(t, prev) { // trả về { gal, html, n }; gal = chương chỉ có ảnh (hiện dạng lưới)
    const L = lines(t), IL = [];
    if (L.length && L.every(imgOf)) { const G = L.map(imgOf); window.RIMG = G.map(x => x.u); return { gal: true, n: G.length, html: G.map((x, j) => `<button class="gi" type="button" onclick="LBL=RIMG;lbShow(${j})" aria-label="Xem ảnh ${j + 1}"><img src="${esc(x.u)}" alt="${esc(x.c || "Ảnh minh họa " + (j + 1))}" loading="lazy"></button>`).join("") } }
    const html = L.map(l => { const m = imgOf(l); if (!m) return IMTOK.test(l) ? (prev ? '<p class="stbadimg">Ảnh này không hiện được: chỉ dùng ảnh tải lên bằng nút "Chèn ảnh minh họa".</p>' : "") : `<p>${esc(l)}</p>`; IL.push(m.u); return `<figure class="rimg"><button type="button" onclick="LBL=RIMG;lbShow(${IL.length - 1})" aria-label="Phóng to ảnh minh họa"><img src="${esc(m.u)}" alt="${esc(m.c || "Ảnh minh họa")}" loading="lazy"></button>${m.c ? `<figcaption>${esc(m.c)}</figcaption>` : ""}</figure>` }).join("");
    window.RIMG = IL; return { gal: false, n: IL.length, html };
  }
  const isCover = u => /^https:\/\//.test(u || "");
  const avHtml = (p, cls = "") => `<span class="avs ${cls}" style="--h:${hue((p && p.display_name) || "?")}" aria-hidden="true">${p && isCover(p.avatar_url) ? `<img src="${esc(p.avatar_url)}" alt="" loading="lazy">` : esc([...((p && p.display_name) || "?")][0] || "?")}</span>`;
  const LINKT = [["facebook", "Facebook"], ["discord", "Discord"], ["x", "X (Twitter)"], ["youtube", "YouTube"], ["tiktok", "TikTok"], ["web", "Trang web"], ["khac", "Khác"]];
  const linksOf = p => (Array.isArray(p && p.links) ? p.links : []).filter(l => l && /^https:\/\/[^\s"<>]{3,300}$/.test(l.u || ""));
  const linkLabel = l => (LINKT.find(x => x[0] === l.k) || [])[1] || l.t || "Liên kết";
  async function shrinkImg(f, w, h) { // cắt giữa theo tỉ lệ w:h rồi thu nhỏ
    const bm = await createImageBitmap(f), r = w / h, sw = Math.min(bm.width, bm.height * r), sh = sw / r, sx = (bm.width - sw) / 2, sy = (bm.height - sh) / 2, k = Math.min(1, w / sw), c = document.createElement("canvas");
    c.width = Math.round(sw * k); c.height = Math.round(sh * k); c.getContext("2d").drawImage(bm, sx, sy, sw, sh, 0, 0, c.width, c.height); bm.close?.();
    let b = await new Promise(z => c.toBlob(z, "image/webp", .86)); if (!b || b.type !== "image/webp") b = await new Promise(z => c.toBlob(z, "image/jpeg", .86)); return b;
  }
  const IMGOK = f => /^image\/(jpeg|png|webp|gif|avif|bmp)$/.test(f.type);
  async function fitImg(f, mw = 1280, mh = 1920) { // thu nhỏ ảnh minh họa, không cắt; giảm chất lượng đến khi dưới 1,9 MB
    const bm = await createImageBitmap(f), k = Math.min(1, mw / bm.width, mh / bm.height), c = document.createElement("canvas");
    c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height); bm.close?.();
    let b = null; for (const q of [.86, .76, .64, .5]) { b = await new Promise(z => c.toBlob(z, "image/webp", q)); if (!b || b.type !== "image/webp") b = await new Promise(z => c.toBlob(z, "image/jpeg", q)); if (b && b.size < 1.9e6) break }
    if (!b || b.size >= 2e6) throw new Error("Ảnh quá lớn, hãy chọn ảnh nhỏ hơn"); return b;
  }
  async function upIll(files, step) { const out = []; for (let i = 0; i < files.length; i++) { step && step(i + 1, files.length); out.push(await upImg(await fitImg(files[i]), "ill")) } return out }
  const VCMP = (a, b) => a.localeCompare(b, "vi", { numeric: true });
  const volsOf = ch => [...new Set(ch.map(c => (c.vol || "").trim()).filter(Boolean))];
  async function shiftOrd(wid, from, list) { // dời các chương có ord >= from xuống một bậc
    const r = await sb.rpc("shift_chapters", { wid, from_ord: from }); if (!r.error) return;
    for (const c of list.filter(c => (c.ord || 0) >= from).sort((a, b) => (b.ord || 0) - (a.ord || 0))) { const x = await sb.from("chapters").update({ ord: (c.ord || 0) + 1 }).eq("id", c.id); if (x.error) throw x.error }
  }
  async function upImg(blob, name) { const ext = blob.type === "image/webp" ? "webp" : "jpg", path = `${me.id}/${name}-${Date.now()}${Math.random().toString(36).slice(2, 6)}.${ext}`, up = await sb.storage.from("covers").upload(path, blob, { contentType: blob.type, upsert: false }); if (up.error) throw up.error; return sb.storage.from("covers").getPublicUrl(path).data.publicUrl }
  async function rmImg(url) { try { const m = /\/storage\/v1\/object\/public\/covers\/(.+)$/.exec(url || ""); if (m && m[1].startsWith(me.id + "/")) await sb.storage.from("covers").remove([decodeURIComponent(m[1])]) } catch (e) {} }
  const busy = (b, on) => { if (b) { b.disabled = on; b.dataset.l ??= b.textContent; b.textContent = on ? "Đang xử lý..." : b.dataset.l } };
  const go = h => { if (location.hash === h) route(); else location.hash = h };
  const viMsg = e => {
    const m = String((e && (e.message || e.error_description || e.msg)) || e || "");
    if (/Invalid login credentials/i.test(m)) return "Email hoặc mật khẩu không đúng.";
    if (/Email not confirmed/i.test(m)) return "Email chưa được xác nhận. Hãy mở thư xác nhận trong hộp thư của bạn.";
    if (/already registered|already been registered/i.test(m)) return "Email này đã có tài khoản. Hãy đăng nhập.";
    if (/rate limit|too many/i.test(m)) return "Thao tác quá nhiều lần. Đợi vài phút rồi thử lại.";
    if (/Password should be/i.test(m)) return "Mật khẩu quá ngắn hoặc quá đơn giản.";
    if (/row-level security/i.test(m)) return "Bạn không có quyền làm việc này (tài khoản có thể đã bị khóa).";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.";
    return m || "Đã có lỗi xảy ra.";
  };
  const errBox = e => `<p class="empty">${esc(viMsg(e))}</p>`;
  const notice = m => `<section class="sec"><p class="empty">${m}</p></section>`;

  /* ---------- Kết nối Supabase ---------- */
  function init() {
    if (initP) return initP;
    initP = (async () => {
      if (!(window.supabase && window.supabase.createClient)) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"; s.onload = res; s.onerror = () => rej(new Error("Không tải được thư viện Supabase. Kiểm tra mạng rồi thử lại.")); document.head.appendChild(s) });
      sb = window.supabase.createClient(cfg().url, cfg().key, { auth: { flowType: "implicit", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
      const { data } = await sb.auth.getSession(); me = (data.session && data.session.user) || null; await loadProf();
      sb.auth.onAuthStateChange((ev, s) => {
        const u = (s && s.user) || null;
        if ((u && u.id) !== (me && me.id)) { me = u; setTimeout(() => loadProf().then(authBtn).then(kauth), 0) }
        if (ev === "PASSWORD_RECOVERY") setTimeout(() => go("#viet/doi-mat-khau"), 0);
      });
      authBtn(); kauth();
    })().catch(e => { initP = null; throw e });
    return initP;
  }
  async function loadProf() { if (!me) { prof = null; return } const { data } = await sb.from("profiles").select("*").eq("id", me.id).maybeSingle(); prof = data || null }
  function authBtn() {
    const el = $("#stu"); if (!el) return; el.hidden = !acct();
    el.title = prof ? (enabled() ? "Góc tác giả: " : "Tài khoản: ") + prof.display_name : "Đăng nhập";
    el.innerHTML = prof ? avHtml(prof) : ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>');
  }

  /* ---------- Thẻ truyện ---------- */
  const wCard = w => `<a class="sc" href="#st/${esc(w.id)}"><div class="cover" style="--h:${hue(w.title)}">${isCover(w.cover_url) ? imgTag(w.cover_url) : ""}<b>${esc(w.title)}</b><i class="kd">Sáng tác</i>${w.mature ? '<i class="nwt m18">18+</i>' : ""}</div><div class="ct" title="${esc(w.title)}">${esc(w.title)}</div><small>${stS(w.status)}<span>${cnt(w)} chương</span></small></a>`;
  const gate = w => w.mature && !ss.get("st18") ? `<section class="sec stgate"><h2>Truyện dành cho người từ 18 tuổi</h2><p>"${esc(w.title)}" được tác giả đánh dấu có nội dung chỉ phù hợp với người từ 18 tuổi trở lên.</p><div class="acts"><button class="btn pri" onclick="ST.ok18()">Tôi đủ 18 tuổi, tiếp tục</button><a class="btn" href="#sang-tac">Quay lại</a></div></section>` : "";

  /* ---------- Danh sách Sáng tác ---------- */
  async function pList() {
    document.title = "Sáng tác | Kenrori";
    app.innerHTML = `<section class="sec"><div class="sh"><h2>Sáng tác</h2><a class="more all" href="#viet">${me ? "Góc tác giả" : "Đăng truyện của bạn"}</a></div><p class="lead">Truyện do các tác giả tự viết và đăng tại Kenrori. Trước khi đăng, hãy đọc <a class="al" href="#noi-quy">nội quy</a>.</p>
<div class="flt"><input id="sq" type="search" placeholder="Tìm theo tên truyện"><div class="frow"><span>Thể loại</span><div>${GENRES.map(g => `<button class="fc" data-g="${esc(g)}">${esc(g)}</button>`).join("")}</div></div><div class="frow"><span>Sắp xếp</span><div><select id="ssort"><option value="updated_at">Mới cập nhật</option><option value="created_at">Mới đăng</option><option value="title">Tên A đến Z</option></select></div></div></div>
<div id="slist"><p class="empty">Đang tải...</p></div><div class="acts" style="justify-content:center;margin-top:18px"><button class="btn" id="smore" hidden>Xem thêm</button></div></section>`;
    let page = 0, gs = [], q = "", tmr = null, all = [];
    const load = async more => {
      page = more ? page + 1 : 0; if (!more) all = [];
      let qy = sb.from("works").select(WSEL).eq("visibility", "published").eq("hidden", false);
      if (q) qy = qy.ilike("title", `%${q.replace(/[%_\\]/g, m => "\\" + m)}%`);
      if (gs.length) qy = qy.contains("genres", gs);
      const so = $("#ssort").value; qy = so === "title" ? qy.order("title", { ascending: true }) : qy.order(so, { ascending: false });
      const { data, error } = await qy.range(page * PG, page * PG + PG - 1);
      if (error) { $("#slist").innerHTML = errBox(error); return }
      all = all.concat(data || []);
      $("#slist").innerHTML = all.length ? `<div class="series">${all.map(wCard).join("")}</div>` : `<p class="empty">${q || gs.length ? "Không có truyện nào khớp bộ lọc." : "Chưa có truyện sáng tác nào. Hãy là người đầu tiên đăng truyện!"}</p>`;
      $("#smore").hidden = (data || []).length < PG;
    };
    $("#sq").oninput = e => { clearTimeout(tmr); tmr = setTimeout(() => { q = e.target.value.trim(); load() }, 350) };
    $("#ssort").onchange = () => load();
    $(".flt").onclick = e => { const b = e.target.closest(".fc"); if (!b) return; const g = b.dataset.g; gs = gs.includes(g) ? gs.filter(x => x !== g) : [...gs, g]; b.classList.toggle("on", gs.includes(g)); load() };
    $("#smore").onclick = () => load(true);
    await load();
  }

  /* ---------- Trang truyện ---------- */
  const readSet = id => { try { return JSON.parse(ls.get("str:" + id) || "[]") } catch (e) { return [] } };
  async function getChapters(wid) { const { data, error } = await sb.from("chapters").select("id,title,ord,vol,words,published,updated_at").eq("work_id", wid).order("ord").order("created_at"); if (error) throw error; return data || [] }
  async function illMap(ch) { // ảnh của các chương chỉ có ảnh (0 chữ): id -> [url]
    const ids = ch.filter(c => !c.words).map(c => c.id); if (!ids.length) return {};
    const { data } = await sb.from("chapters").select("id,content").in("id", ids); const M = {};
    (data || []).forEach(c => { if (onlyImgs(c.content)) M[c.id] = imgsIn(c.content).map(x => x.u) }); return M;
  }
  async function pWork(id) {
    const { data: w, error } = await sb.from("works").select(WSEL.replace(",chapters(count)", "") + ",visibility,hidden").eq("id", id).maybeSingle();
    if (error) { app.innerHTML = errBox(error); return } if (!w) { app.innerHTML = notice("Không tìm thấy truyện. Có thể truyện đã bị xóa, đang ở chế độ nháp hoặc đã bị ẩn."); return }
    document.title = `${w.title} | Kenrori`;
    if (gate(w)) { app.innerHTML = gate(w); return }
    const ch = await getChapters(id), own = me && me.id === w.author_id, pub = ch.filter(c => c.published), last = ls.get("st:" + id), rs = readSet(id);
    const IM = await illMap(ch);
    const row = c => `<div class="chr"><a class="ch${rs.includes(c.id) ? " done" : ""}${c.id === last ? " cur" : ""}" href="#st/${esc(id)}/${esc(c.id)}"><span class="eye"></span><span class="cht">${IM[c.id] ? `<span class="ill">${ic(I.img)}</span>` : ""}${esc(c.title)}${c.published ? "" : ' <em class="drf">Nháp</em>'}</span><small class="cw">${IM[c.id] ? IM[c.id].length + " ảnh" : fmtN(c.words) || ""}</small><small>${ago(day(c.updated_at))}</small></a></div>`;
    const chList = () => {
      if (!ch.some(c => (c.vol || "").trim())) return ch.map(row).join("");
      const g = new Map(); ch.forEach(c => { const v = (c.vol || "").trim() || "Chương lẻ"; if (!g.has(v)) g.set(v, []); g.get(v).push(c) });
      return [...g].map(([v, a]) => { const ic0 = a.find(c => IM[c.id]), cv = ic0 ? IM[ic0.id][0] : "", cut = a.length > 6;
        return `<section class="vblk"><div class="vhd">${cv ? `<img class="vmini" src="${esc(cv)}" alt="" loading="lazy" onerror="this.remove()">` : ""}<b>${esc(v)}</b><span>${a.length} chương</span></div><div class="vbd${cv ? "" : " nocv"}">${cv ? `<button class="vcv" style="--h:${hue(w.title + v)}" onclick="LBL=[this.querySelector('img').src];lbShow(0)" aria-label="Xem bìa ${esc(v)}"><img src="${esc(cv)}" alt="Bìa ${esc(v)}" loading="lazy"></button>` : ""}<div class="vlw"><div class="vls${cut ? " cut" : ""}">${a.map(row).join("")}</div>${cut ? `<button class="vmore" data-n="${a.length - 6}" onclick="const c=this.previousElementSibling.classList.toggle('cut');this.textContent=c?'Xem tiếp ('+this.dataset.n+' chương)':'Thu gọn'">Xem tiếp (${a.length - 6} chương)</button>` : ""}</div></div></section>` }).join("");
    };
    const lc = pub[pub.length - 1], fav = isFav("st", id), lu = (lc && lc.updated_at) || w.updated_at;
    const meta = { t: w.title, c: w.cover_url, a: aName(w), n: pub.length, s: pub.length, u: w.updated_at, l: lc ? ((lc.vol || "").trim() ? lc.vol.trim() + " - " : "") + lc.title : "" };
    ST._meta = [id, meta]; if (fav) ls.set("stm:" + id, JSON.stringify(meta));
    const upd = `<div class="cr cru${(Date.now() - new Date(lu)) / 864e5 < 3 ? " fresh" : ""}" title="Cập nhật ngày ${fmtD(day(lu))}"><span>Cập nhật</span><b>${ago(day(lu))}</b></div>`;
    const lastOk = last && pub.some(c => c.id === last), tw = pub.reduce((a, c) => a + (c.words || 0), 0), bg = isCover(w.cover_url) ? `;background-image:url(&quot;${esc(w.cover_url)}&quot;)` : "";
    app.innerHTML = `<div class="tpb"><div class="hb" style="--h:${hue(w.title)}${bg}"></div></div>
<div class="tp"><div class="tph"><div class="cover tpcv" style="--h:${hue(w.title)}">${isCover(w.cover_url) ? imgTag(w.cover_url) : ""}<b>${esc(w.title)}</b></div>
<div class="tpt"><h1>${esc(w.title)}</h1><div class="crs"><a class="cr" href="#tg/${esc(w.author_id)}"><span>Tác giả</span><b>${esc(aName(w))}</b></a>${upd}</div></div>
<div class="tpm"><div class="acts tpa2">${pub.length ? `<a class="btn pri big" href="#st/${esc(id)}/${esc(lastOk ? last : pub[0].id)}">${ic(I.play)}${lastOk ? "Đọc tiếp" : "Đọc từ đầu"}</a>` : ""}<button class="btn flw${fav ? " on" : ""}" id="fvb" title="${fav ? "Bỏ theo dõi" : "Theo dõi để biết khi có chương mới"}" aria-pressed="${fav}" onclick="ST.follow()">${favLabel(fav)}</button><button class="btn ico" title="Chia sẻ" aria-label="Chia sẻ" onclick="ST.share()">${ic(I.share)}</button>${pub.length > 1 ? `<span class="subl">${lastOk ? `<a href="#st/${esc(id)}/${esc(pub[0].id)}">Đọc từ đầu</a>` : ""}<a href="#st/${esc(id)}/${esc(pub[pub.length - 1].id)}">Chương mới nhất</a></span>` : ""}<span class="admb">${own ? `<a class="btn" href="#viet/w/${esc(id)}">${ic(I.edit)}Sửa truyện</a>` : me ? `<button class="btn" onclick="ST.report('${esc(id)}')">Báo cáo vi phạm</button>` : ""}</span></div>
<div class="tptg">${stS(w.status)}${w.mature ? '<span class="pill m18p">18+</span>' : ""}${(w.genres || []).map(g => `<span class="pill">${esc(g)}</span>`).join("")}</div>${own && (w.visibility !== "published" || w.hidden) ? `<div class="prog"><span><i>Trạng thái</i>${w.hidden ? "Đã bị ban kiểm duyệt ẩn" : "Bản nháp, chỉ bạn thấy được"}</span></div>` : ""}</div></div>
<div class="tpd"><p class="sum clamp" id="dsc">${esc(w.summary) || "Chưa có tóm tắt."}</p><button class="lnk" id="dmore" hidden>Xem thêm</button></div>
<div class="tpc"><div class="tpl"><div class="sh"><h2>Danh sách chương</h2></div><div id="cl">${ch.length ? chList() : '<p class="empty">Truyện chưa có chương nào.</p>'}</div></div>
<aside class="tpx"><div class="ibx"><h4>Tác giả</h4><div><a class="al" href="#tg/${esc(w.author_id)}">${esc(aName(w))}</a></div></div><div class="ibx"><h4>Loại</h4><div>Sáng tác</div></div><div class="ibx"><h4>Tình trạng</h4><div>${stS(w.status)}</div></div><div class="ibx"><h4>Số chương</h4><div>${pub.length}</div></div><div class="ibx"><h4>Tổng số chữ</h4><div>${fmtN(tw) || "Chưa có"}</div></div><div class="ibx"><h4>Ngày đăng</h4><div>${fmtD(day(w.created_at))}</div></div><div class="ibx"><h4>Cập nhật</h4><div>${fmtD(day(w.updated_at))}</div></div></aside></div></div>`;
    const dsc = $("#dsc"); if (dsc.scrollHeight > dsc.clientHeight + 2) { $("#dmore").hidden = false; $("#dmore").onclick = e => { const c = dsc.classList.toggle("clamp"); e.target.textContent = c ? "Xem thêm" : "Thu gọn" } }
  }

  /* ---------- Đọc chương ---------- */
  async function pRead(wid, cid) {
    const [{ data: w }, ch, { data: c, error }] = await Promise.all([sb.from("works").select("id,title,mature,genres,author_id,author:profiles(display_name)").eq("id", wid).maybeSingle(), getChapters(wid), sb.from("chapters").select("id,title,vol,content,words,updated_at,published").eq("id", cid).maybeSingle()]);
    if (error) { app.innerHTML = errBox(error); return } if (!w || !c) { app.innerHTML = notice("Không tìm thấy chương này."); return }
    if (gate(w)) { app.innerHTML = gate(w); return }
    document.title = `${c.title}, ${w.title} | Kenrori`;
    ls.set("st:" + wid, cid); const rs = readSet(wid); { const m = stMeta(wid), np = ch.filter(x => x.published).length; if (m && isFav("st", wid)) { m.n = Math.max(m.n || 0, np); m.s = m.n; ls.set("stm:" + wid, JSON.stringify(m)); navBadge() } } if (!rs.includes(cid)) { rs.push(cid); ls.set("str:" + wid, JSON.stringify(rs)) }
    const L = ch.filter(x => x.published || x.id === cid), i = L.findIndex(x => x.id === cid), base = `#st/${esc(wid)}`, prv = L[i - 1], nx = L[i + 1];
    RDKEY = d => { const t = L[i + d]; if (t) location.hash = `#st/${wid}/${t.id}` };
    const B = rbody(c.content), op = x => `<option value="${esc(x.id)}" ${x.id === cid ? "selected" : ""}>${esc(x.title)}</option>`;
    const opts = L.some(x => (x.vol || "").trim()) ? (() => { const g = new Map(); L.forEach(x => { const v = (x.vol || "").trim() || "Chương lẻ"; if (!g.has(v)) g.set(v, []); g.get(v).push(x) }); return [...g].map(([v, a]) => `<optgroup label="${esc(v)}">${a.map(op).join("")}</optgroup>`).join("") })() : L.map(op).join("");
    const nav = `<div class="nv"><a class="btn" ${prv ? `href="${base}/${esc(prv.id)}"` : "disabled"}>${ic(I.prev)}Chương trước</a><a class="btn pri" ${nx ? `href="${base}/${esc(nx.id)}"` : "disabled"}>Chương sau${ic(I.next)}</a></div>`;
    app.innerHTML = `<div class="rbar"><a class="t" href="${base}" title="Về trang truyện">${esc(w.title)}</a><select aria-label="Chọn chương" onchange="location.hash='${base}/'+this.value">${opts}</select>${me && me.id === w.author_id ? `<a class="btn" href="#viet/c/${esc(wid)}/${esc(cid)}">${ic(I.edit)}Sửa</a>` : ""}</div>
<header class="rh"><a class="rs" href="${base}">${esc(w.title)}</a>${(c.vol || "").trim() ? `<div class="rv">${esc(c.vol)}</div>` : ""}<h1>${esc(c.title)}</h1><p id="meta">${esc(aName(w))} · ${fmtD(day(c.updated_at))} · ${B.gal ? B.n + " ảnh" : (fmtN(c.words) || "0 chữ") + (B.n ? ", " + B.n + " ảnh" : "")}${c.published ? "" : " · Bản nháp"}</p></header>${nav}
<article id="rd" class="${B.gal ? "rd gal" : `rd novel ${RS.ff} ${RS.bg}`}">${B.html || '<p class="mu">Chương chưa có nội dung.</p>'}</article>
<section class="endc"><div class="endr">${prv ? `<a class="btn" href="${base}/${esc(prv.id)}">${ic(I.prev)}Chương trước</a>` : ""}${nx ? `<a class="nxc" href="${base}/${esc(nx.id)}"><span>Chương tiếp theo</span><b>${esc(nx.title)}</b>${ic(I.next)}</a>` : `<div class="nxc last"><span>Bạn đã đọc đến chương mới nhất</span><b>Hãy quay lại sau để đọc chương mới</b></div>`}</div><div class="endf"><a href="${base}">Danh sách chương</a><a href="#tg/${esc(w.author_id)}">Truyện khác của ${esc(aName(w))}</a>${me && me.id !== w.author_id ? `<a href="javascript:void 0" onclick="ST.report('${esc(wid)}','${esc(cid)}')">Báo cáo vi phạm</a>` : ""}</div></section>
<button class="fab" id="rsb" title="Tùy chỉnh đọc" aria-label="Tùy chỉnh đọc" aria-expanded="false" onclick="rsToggle()"><svg class="i" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg></button><div class="rsp" id="rsp" hidden data-kind="novel"></div>`;    if (window.KGP && c.published) KGP.read({ key: `st/${wid}/${cid}`, series: `st/${wid}`, genres: w.genres || [] });
    if (window.BM && $("#rd") && !B.gal) BM.init("st/" + wid, cid, $("#rd"));
    if (c.published && (DATA.site.cmt || "anon") === "anon") { const bx = document.createElement("section"); $("#rsb").before(bx); CMT.mount(bx, "st/" + cid) }
  }

  /* ---------- Trang tác giả ---------- */
  async function pWriter(uid) {
    const [{ data: p }, { data: ws, error }] = await Promise.all([sb.from("profiles").select("*").eq("id", uid).maybeSingle(), sb.from("works").select(WSEL).eq("author_id", uid).eq("visibility", "published").eq("hidden", false).order("updated_at", { ascending: false })]);
    if (error) { app.innerHTML = errBox(error); return } if (!p) { app.innerHTML = notice("Không tìm thấy tác giả."); return }
    document.title = `${p.display_name} | Kenrori`;
    const W = ws || [], nch = W.reduce((a, w) => a + ((w.chapters && w.chapters[0] && w.chapters[0].count) || 0), 0), joined = new Date(p.created_at), L = linksOf(p), mine = me && me.id === p.id;
    app.innerHTML = `<section class="tgp"><div class="tgb" style="--h:${hue(p.display_name)}">${isCover(p.banner_url) ? `<img src="${esc(p.banner_url)}" alt="">` : ""}</div>
<div class="tgh">${avHtml(p, "tga")}<div class="tgi"><h1>${esc(p.display_name)}</h1><p class="tgm">${W.length ? "Tác giả Sáng tác" : "Thành viên"}, tham gia từ tháng ${joined.getMonth() + 1}/${joined.getFullYear()}${p.banned ? ". Tài khoản đang bị khóa" : ""}</p></div>${mine ? `<a class="btn" href="#viet/ho-so">${ic(I.edit)}Sửa hồ sơ</a>` : ""}</div>
<div class="tgs"><span><b>${W.length}</b> truyện</span><span><b>${nch.toLocaleString("vi-VN")}</b> chương</span>${W.some(w => w.status === "completed") ? `<span><b>${W.filter(w => w.status === "completed").length}</b> đã hoàn thành</span>` : ""}</div>
<div id="tg_game"></div>${p.bio ? `<p class="tgbio">${esc(p.bio)}</p>` : mine ? '<p class="tgbio mu">Bạn chưa viết giới thiệu. Bấm Sửa hồ sơ để thêm vài dòng về mình.</p>' : ""}
${L.length ? `<div class="tgl">${L.map(l => `<a class="btn sm" href="${esc(l.u)}" target="_blank" rel="noopener nofollow ugc">${ic('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>')}${esc(linkLabel(l))}</a>`).join("")}</div>` : ""}</section>` + (!enabled() && !W.length ? "" : sec("Truyện đã đăng", null, W.length ? `<div class="series">${W.map(wCard).join("")}</div>` : `<p class="empty">${mine ? 'Bạn chưa đăng truyện công khai nào. <a class="al" href="#viet/moi">Viết truyện mới</a>' : "Tác giả chưa đăng truyện công khai nào."}</p>`));
  }

  /* ---------- Góc tác giả: đăng nhập, đăng ký ---------- */
  const afterWriter = uid => { if (window.KGP && KGP.on()) KGP.profile(uid, $("#tg_game"), $(".tgp")); else { const x = $("#tg_game"); if (x) x.remove() } };
  function pAuth(mode) {
    document.title = "Góc tác giả | Kenrori";
    const T = { login: "Đăng nhập", reg: "Tạo tài khoản", forgot: "Quên mật khẩu" }[mode] || "Đăng nhập", em = mode === "forgot";
    app.innerHTML = `<section class="authw"><div class="authc stf"><h2>${T}</h2>${mode === "reg" ? `<p class="mu">Một tài khoản dùng chung cho bình luận, Tu luyện và đăng truyện Sáng tác. Tên hiển thị sẽ hiện bên cạnh bình luận và trên truyện bạn đăng.</p>
<label for="a_name">Tên hiển thị</label><input id="a_name" maxlength="40" autocomplete="nickname">` : mode === "forgot" ? `<p class="mu">Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>` : `<p class="mu">Đăng nhập bằng email và mật khẩu bạn đã đăng ký.</p>`}
<label for="a_email">Email</label><input id="a_email" type="email" autocomplete="email">
${mode === "forgot" ? "" : `<label for="a_pw">Mật khẩu${mode === "reg" ? " <small>(ít nhất 8 ký tự)</small>" : ""}</label><input id="a_pw" type="password" autocomplete="${mode === "reg" ? "new-password" : "current-password"}">`}
${mode === "reg" ? `<label class="ck"><input type="checkbox" id="a_ok"> Tôi đã đọc và đồng ý với <a class="al" href="#noi-quy" target="_blank">nội quy</a></label>` : ""}
<p class="aerr" id="a_err" role="alert"></p><button class="btn pri wide" id="a_go">${mode === "reg" ? "Tạo tài khoản" : mode === "forgot" ? "Gửi link đặt lại" : "Đăng nhập"}</button>
<div class="alinks">${mode === "login" || !mode ? `<a href="#viet/dang-ky">Chưa có tài khoản? Tạo tài khoản</a><a href="#viet/quen-mat-khau">Quên mật khẩu?</a>` : `<a href="#viet/dang-nhap">Đã có tài khoản? Đăng nhập</a>`}</div></div></section>`;
    const err = m => { $("#a_err").textContent = m };
    $("#a_go").onclick = async e => {
      const b = e.currentTarget, email = $("#a_email").value.trim(), pw = $("#a_pw") ? $("#a_pw").value : "";
      if (!/^\S+@\S+\.\S+$/.test(email)) return err("Email không hợp lệ.");
      busy(b, true); err("");
      try {
        const redirectTo = location.origin + location.pathname;
        if (mode === "reg") {
          const name = $("#a_name").value.trim();
          if (name.length < 2) throw new Error("Tên hiển thị cần ít nhất 2 ký tự."); if (pw.length < 8) throw new Error("Mật khẩu cần ít nhất 8 ký tự."); if (!$("#a_ok").checked) throw new Error("Bạn cần đồng ý với nội quy.");
          const { data, error } = await sb.auth.signUp({ email, password: pw, options: { data: { display_name: name }, emailRedirectTo: redirectTo } }); if (error) throw error;
          if (data.session) { me = data.user; await loadProf(); authBtn(); go("#viet") }
          else app.innerHTML = notice(`Đã gửi email xác nhận tới <b>${esc(email)}</b>. Mở thư và bấm link xác nhận để kích hoạt tài khoản, sau đó quay lại đây đăng nhập.`);
        } else if (mode === "forgot") {
          const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo }); if (error) throw error;
          app.innerHTML = notice(`Nếu <b>${esc(email)}</b> có tài khoản, link đặt lại mật khẩu đã được gửi tới hộp thư.`);
        } else {
          const { data, error } = await sb.auth.signInWithPassword({ email, password: pw }); if (error) throw error;
          me = data.user; await loadProf(); authBtn(); route();
        }
      } catch (x) { err(viMsg(x)); busy(b, false) }
    };
    app.querySelectorAll("input").forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") $("#a_go").click() }));
  }
  function pNewPw() {
    if (!me) return pAuth("login");
    app.innerHTML = `<section class="authw"><div class="authc stf"><h2>Đặt mật khẩu mới</h2><label for="n_pw">Mật khẩu mới <small>(ít nhất 8 ký tự)</small></label><input id="n_pw" type="password" autocomplete="new-password"><p class="aerr" id="a_err" role="alert"></p><button class="btn pri wide" id="n_go">Lưu mật khẩu</button></div></section>`;
    $("#n_go").onclick = async e => { const pw = $("#n_pw").value; if (pw.length < 8) { $("#a_err").textContent = "Mật khẩu cần ít nhất 8 ký tự."; return } busy(e.currentTarget, true); const { error } = await sb.auth.updateUser({ password: pw }); if (error) { $("#a_err").textContent = viMsg(error); busy(e.currentTarget, false); return } toast("Đã đổi mật khẩu"); go("#viet") };
  }

  /* ---------- Góc tác giả: truyện của tôi ---------- */
  async function pMine() {
    document.title = "Góc tác giả | Kenrori"; await loadProf(); authBtn();
    const { data: ws, error } = await sb.from("works").select("id,title,cover_url,visibility,hidden,status,mature,updated_at,chapters(count)").eq("author_id", me.id).order("updated_at", { ascending: false });
    app.innerHTML = `<section class="sec"><div class="sh"><h2>Góc tác giả</h2><div class="acts" style="margin:0">${prof && !prof.banned ? `<a class="btn pri" href="#viet/moi">${ic(I.plus)}Viết truyện mới</a>` : ""}<a class="btn" href="#viet/ho-so">Hồ sơ</a>${isMod() ? `<a class="btn" href="#kiem-duyet">Kiểm duyệt</a>` : ""}<button class="btn" onclick="ST.logout()">Đăng xuất</button></div></div>
<p class="lead">Xin chào <b>${esc(prof ? prof.display_name : "")}</b>. Truyện ở chế độ nháp chỉ bạn thấy được; chuyển sang "Đăng công khai" để mọi người đọc.</p>
${prof && prof.banned ? '<p class="stwarn">Tài khoản của bạn đang bị khóa nên không thể đăng hoặc sửa truyện. Liên hệ ban quản trị nếu bạn nghĩ đây là nhầm lẫn.</p>' : ""}
${error ? errBox(error) : (ws || []).length ? `<div class="stl">${ws.map(w => `<div class="stli"><span class="th" style="--h:${hue(w.title)}">${isCover(w.cover_url) ? imgTag(w.cover_url) : ""}</span><span class="stb"><b>${esc(w.title)}</b><small>${w.hidden ? '<em class="bad">Bị ẩn bởi kiểm duyệt</em>' : w.visibility === "published" ? '<em class="okb">Đã đăng</em>' : '<em class="drf">Nháp</em>'} ${cnt(w)} chương, cập nhật ${ago(day(w.updated_at)).toLowerCase()}</small></span><a class="btn" href="#viet/w/${esc(w.id)}">Sửa</a><a class="btn" href="#st/${esc(w.id)}">Xem</a></div>`).join("")}</div>` : '<p class="empty">Bạn chưa có truyện nào. Bấm "Viết truyện mới" để bắt đầu.</p>'}</section>`;
  }

  /* ---------- Sửa truyện ---------- */
  async function resizeCover(f) {
    const bm = await createImageBitmap(f), k = Math.min(1, 600 / bm.width), c = document.createElement("canvas"); c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
    let b = await new Promise(r => c.toBlob(r, "image/webp", .85)); if (!b || b.type !== "image/webp") b = await new Promise(r => c.toBlob(r, "image/jpeg", .85)); return b;
  }
  async function pWorkEdit(id) {
    let w = { title: "", summary: "", genres: [], status: "ongoing", visibility: "draft", mature: false, cover_url: null }, ch = [];
    if (id) { const { data, error } = await sb.from("works").select("*").eq("id", id).maybeSingle(); if (error || !data) { app.innerHTML = notice("Không tìm thấy truyện."); return } if (data.author_id !== me.id && !isMod()) { app.innerHTML = notice("Bạn không phải tác giả của truyện này."); return } w = data; ch = await getChapters(id) }
    document.title = (id ? "Sửa truyện" : "Viết truyện mới") + " | Kenrori";
    const gsel = new Set(w.genres || []);
    app.innerHTML = `<section class="sec stf"><div class="sh"><h2>${id ? "Sửa truyện" : "Viết truyện mới"}</h2><a class="more all" href="#viet">Về Góc tác giả</a></div>
<div class="stg2"><div><label>Ảnh bìa</label><label class="stcv" for="w_cv"><img id="w_prev" alt="" onerror="this.hidden=true;document.getElementById('w_ph').hidden=false" ${isCover(w.cover_url) ? `src="${esc(w.cover_url)}"` : "hidden"}><span id="w_ph" ${isCover(w.cover_url) ? "hidden" : ""}>Bấm để chọn ảnh bìa</span></label><input id="w_cv" type="file" accept="image/png,image/jpeg,image/webp" hidden><p class="mu">Ảnh tự thu nhỏ khi lưu, tối đa 2 MB.</p></div>
<div><label for="w_t">Tên truyện</label><input id="w_t" maxlength="150" value="${esc(w.title)}">
<label for="w_s">Tóm tắt</label><textarea id="w_s" maxlength="3000" rows="6">${esc(w.summary)}</textarea>
<label>Thể loại <small>(chọn tối đa 10)</small></label><div class="stchips">${[...new Set([...GENRES, ...(w.genres || [])])].map(g => `<button type="button" class="fc${gsel.has(g) ? " on" : ""}" data-g="${esc(g)}">${esc(g)}</button>`).join("")}</div>
<div class="stg3"><div><label for="w_st">Tình trạng</label><select id="w_st">${Object.entries(STS).map(([k, [l]]) => `<option value="${k}" ${w.status === k ? "selected" : ""}>${l}</option>`).join("")}</select></div><div><label for="w_v">Hiển thị</label><select id="w_v"><option value="draft" ${w.visibility !== "published" ? "selected" : ""}>Bản nháp (chỉ mình tôi)</option><option value="published" ${w.visibility === "published" ? "selected" : ""}>Đăng công khai</option></select></div></div>
<label class="ck"><input type="checkbox" id="w_m" ${w.mature ? "checked" : ""}> Truyện có nội dung chỉ dành cho người từ 18 tuổi</label>
<label class="ck" id="w_okw" ${w.visibility === "published" ? "hidden" : ""}><input type="checkbox" id="w_ok"> Tôi xác nhận đây là truyện do tôi tự viết và tuân thủ <a class="al" href="#noi-quy" target="_blank">nội quy</a></label>
<p class="aerr" id="w_err" role="alert"></p><div class="acts"><button class="btn pri" id="w_save">${id ? "Lưu thay đổi" : "Tạo truyện"}</button>${id ? `<a class="btn" href="#st/${esc(id)}">Xem trang truyện</a><button class="btn dngb" id="w_del">Xóa truyện</button>` : ""}</div></div></div></section>
${id ? `<section class="sec"><div class="sh"><h2>Chương (${ch.length})</h2><a class="btn pri" href="#viet/c/${esc(id)}/moi">${ic(I.plus)}Thêm chương</a></div>${ch.length ? `<div class="stl">${ch.map((c, j) => `<div class="stli"><span class="stn">${j + 1}</span><span class="stb"><b>${(c.vol || "").trim() ? `<em class="vtag">${esc(c.vol)}</em>` : ""}${esc(c.title)}</b><small>${c.published ? '<em class="okb">Đã đăng</em>' : '<em class="drf">Nháp</em>'} ${fmtN(c.words) || "0 chữ"}, sửa ${ago(day(c.updated_at)).toLowerCase()}</small></span><button class="btn sm" onclick="ST.mv('${esc(id)}',${j},-1)" ${j ? "" : "disabled"} title="Chuyển lên">↑</button><button class="btn sm" onclick="ST.mv('${esc(id)}',${j},1)" ${j < ch.length - 1 ? "" : "disabled"} title="Chuyển xuống">↓</button><a class="btn sm" href="#viet/c/${esc(id)}/${esc(c.id)}">Sửa</a><button class="btn sm dngb" onclick="ST.delCh('${esc(c.id)}','${esc(id)}')">Xóa</button></div>`).join("")}</div>
<details class="stvd"><summary>Chia chương vào tập</summary><p class="mu">Gán một dãy chương vào cùng một tập. Để trống tên tập nếu muốn bỏ các chương đó ra khỏi tập.</p><div class="stg4"><div><label for="v_n">Tên tập</label><input id="v_n" list="w_vl" maxlength="100" placeholder="Tập 1"></div><div><label for="v_a">Từ chương số</label><input id="v_a" type="number" min="1" max="${ch.length}" value="1"></div><div><label for="v_b">Đến chương số</label><input id="v_b" type="number" min="1" max="${ch.length}" value="${ch.length}"></div><div><button class="btn" id="v_go">Gán tập</button></div></div></details>` : '<p class="empty">Chưa có chương nào. Bấm "Thêm chương" để viết chương đầu tiên.</p>'}</section>
<section class="sec stf" id="w_ill"><div class="sh"><h2>Ảnh minh họa theo tập</h2></div>
<p class="mu">Chọn tập rồi chọn ảnh (chọn được nhiều ảnh một lúc). Ảnh được đăng thành chương "Minh họa" đứng đầu tập đó, và ảnh đầu tiên làm ảnh bìa của tập. Muốn chèn ảnh vào giữa chương, mở chương đó và bấm "Chèn ảnh minh họa".</p>
<div class="stg4 stil2"><div><label for="i_v">Tập</label><input id="i_v" list="w_vl" maxlength="100" placeholder="Để trống nếu truyện không chia tập"></div><div><button class="btn pri" id="i_go">${ic(I.img)}Chọn ảnh và đăng</button><input id="i_f" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden></div></div>
<div id="i_ls"></div></section><datalist id="w_vl">${volsOf(ch).map(v => `<option value="${esc(v)}">`).join("")}</datalist>` : ""}`;
    ST._ch = ch;
    if (id) {
      const IM = await illMap(ch), IL = ch.filter(c => IM[c.id]);
      $("#i_ls").innerHTML = IL.length ? IL.map(c => `<div class="stil"><div class="stilh"><b>${esc((c.vol || "").trim() || "Không thuộc tập nào")}</b><small>${esc(c.title)}, ${IM[c.id].length} ảnh${c.published ? "" : ", bản nháp"}</small><a class="btn sm" href="#viet/c/${esc(id)}/${esc(c.id)}">Sửa, xếp lại ảnh</a></div><div class="stth">${IM[c.id].map(u => `<img src="${esc(u)}" alt="" loading="lazy">`).join("")}</div></div>`).join("") : '<p class="empty">Chưa có ảnh minh họa nào.</p>';
      $("#i_go").onclick = () => $("#i_f").click();
      $("#i_f").onchange = async e => {
        const fs = [...e.target.files].filter(IMGOK), b = $("#i_go"); e.target.value = ""; if (!fs.length) return toast("Hãy chọn ảnh JPG, PNG, WebP hoặc GIF"); if (fs.length > 30) return toast("Mỗi lần đăng tối đa 30 ảnh");
        const vol = $("#i_v").value.trim(); b.disabled = true;
        try {
          const urls = await upIll(fs, (i, n) => { b.textContent = `Đang tải ảnh ${i}/${n}...` }), add = urls.map(u => `[img:${u}]`).join("\n"), ex = IL.find(c => (c.vol || "").trim() === vol);
          let r;
          if (ex) { const { data: o } = await sb.from("chapters").select("content").eq("id", ex.id).maybeSingle(); r = await sb.from("chapters").update({ content: ((o && o.content) || "").trim() + "\n" + add }).eq("id", ex.id).select("id").single() }
          else {
            const inV = ch.filter(c => (c.vol || "").trim() === vol); let ord = ch.reduce((a, x) => Math.max(a, x.ord || 0), 0) + 1;
            if (vol && inV.length) { ord = Math.min(...inV.map(c => c.ord || 0)); await shiftOrd(id, ord, ch) }
            r = await sb.from("chapters").insert({ work_id: id, title: "Minh họa", vol, ord, content: add, published: true }).select("id").single();
          }
          if (r.error) throw r.error; toast(`Đã đăng ${urls.length} ảnh minh họa${vol ? " cho " + vol : ""}`); route();
        } catch (x) { toast(viMsg(x)); b.disabled = false; b.innerHTML = `${ic(I.img)}Chọn ảnh và đăng` }
      };
      if (ch.length) $("#v_go").onclick = async e => {
        const a = Math.max(1, +$("#v_a").value || 1), z = Math.min(ch.length, +$("#v_b").value || ch.length), vol = $("#v_n").value.trim();
        if (a > z) return toast("Số chương bắt đầu phải nhỏ hơn số chương kết thúc");
        busy(e.currentTarget, true); const { error } = await sb.from("chapters").update({ vol }).in("id", ch.slice(a - 1, z).map(c => c.id));
        if (error) { busy(e.currentTarget, false); return toast(viMsg(error)) } toast(vol ? `Đã gán chương ${a} đến ${z} vào ${vol}` : `Đã bỏ chương ${a} đến ${z} khỏi tập`); route();
      };
    }
    let cvFile = null;
    $("#w_cv").onchange = e => { const f = e.target.files[0]; if (!f) return; cvFile = f; $("#w_prev").src = URL.createObjectURL(f); $("#w_prev").hidden = false; $("#w_ph").hidden = true };
    $(".stchips").onclick = e => { const b = e.target.closest(".fc"); if (!b) return; const g = b.dataset.g; if (gsel.has(g)) gsel.delete(g); else if (gsel.size < 10) gsel.add(g); else return toast("Chọn tối đa 10 thể loại"); b.classList.toggle("on", gsel.has(g)) };
    $("#w_v").onchange = e => { $("#w_okw").hidden = e.target.value !== "published" || w.visibility === "published" };
    $("#w_save").onclick = async e => {
      const b = e.currentTarget, err = m => { $("#w_err").textContent = m }, title = $("#w_t").value.trim(), vis = $("#w_v").value;
      if (!title) return err("Hãy nhập tên truyện."); if (vis === "published" && w.visibility !== "published" && !$("#w_ok").checked) return err("Hãy xác nhận truyện do bạn tự viết và tuân thủ nội quy trước khi đăng công khai.");
      busy(b, true); err("");
      try {
        let cover_url = w.cover_url || null;
        if (cvFile) { const blob = await resizeCover(cvFile), ext = blob.type === "image/webp" ? "webp" : "jpg", path = `${me.id}/${Date.now()}.${ext}`; const up = await sb.storage.from("covers").upload(path, blob, { contentType: blob.type, upsert: false }); if (up.error) throw up.error; cover_url = sb.storage.from("covers").getPublicUrl(path).data.publicUrl }
        const row = { title, summary: $("#w_s").value.trim(), genres: [...gsel], status: $("#w_st").value, visibility: vis, mature: $("#w_m").checked, cover_url };
        const r = id ? await sb.from("works").update(row).eq("id", id).select("id").single() : await sb.from("works").insert(row).select("id").single();
        if (r.error) throw r.error; toast(id ? "Đã lưu thay đổi" : "Đã tạo truyện. Giờ hãy thêm chương đầu tiên."); id ? route() : go("#viet/w/" + r.data.id);
      } catch (x) { err(viMsg(x)); busy(b, false) }
    };
    if (id) $("#w_del").onclick = async () => { if (!confirm(`Xóa truyện "${w.title}" cùng toàn bộ ${ch.length} chương? Không thể khôi phục.`)) return; const { error } = await sb.from("works").delete().eq("id", id); if (error) return toast(viMsg(error)); toast("Đã xóa truyện"); go("#viet") };
  }

  /* ---------- Sửa chương ---------- */
  async function pChapEdit(wid, cid) {
    const { data: w } = await sb.from("works").select("id,title,author_id").eq("id", wid).maybeSingle();
    if (!w) { app.innerHTML = notice("Không tìm thấy truyện."); return } if (w.author_id !== me.id && !isMod()) { app.innerHTML = notice("Bạn không phải tác giả của truyện này."); return }
    let c = { title: "", content: "", published: true, vol: "" }, isNew = cid === "moi";
    const chs = await getChapters(wid);
    if (!isNew) { const { data } = await sb.from("chapters").select("*").eq("id", cid).maybeSingle(); if (!data) { app.innerHTML = notice("Không tìm thấy chương."); return } c = data }
    else if (chs.length) c.vol = chs[chs.length - 1].vol || "";
    const dk = `stdr:${wid}:${cid}`; let dr = null; try { dr = JSON.parse(ls.get(dk) || "null") } catch (e) {}
    const hasDr = dr && (dr.t !== c.title || dr.c !== c.content || (dr.v ?? c.vol ?? "") !== (c.vol || ""));
    document.title = (isNew ? "Thêm chương" : "Sửa chương") + " | Kenrori";
    app.innerHTML = `<section class="sec stf"><div class="sh"><h2>${isNew ? "Thêm chương" : "Sửa chương"}</h2><a class="more all" href="#viet/w/${esc(wid)}">Về truyện</a></div><p class="lead">${esc(w.title)}</p>
${hasDr ? `<p class="stwarn" id="c_dr">Có bản nháp chưa lưu trên máy này (${esc(new Date(dr.at).toLocaleString("vi-VN"))}). <button class="lnk" id="c_rs">Khôi phục</button> · <button class="lnk" id="c_rx">Bỏ qua</button></p>` : ""}
<div class="stg2b"><div><label for="c_t">Tên chương</label><input id="c_t" maxlength="200" value="${esc(c.title)}" placeholder="Chương 1: ..."></div><div><label for="c_v">Tập <small>(không bắt buộc)</small></label><input id="c_v" list="c_vl" maxlength="100" value="${esc(c.vol || "")}" placeholder="Tập 1"><datalist id="c_vl">${volsOf(chs).map(v => `<option value="${esc(v)}">`).join("")}</datalist></div></div>
<label for="c_c">Nội dung <small id="c_n"></small></label>
<div class="sttb"><button type="button" class="btn sm" id="c_img">${ic(I.img)}Chèn ảnh minh họa</button><input id="c_if" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden><small>Ảnh được chèn ngay sau đoạn có con trỏ. Có thể kéo thả hoặc dán ảnh vào ô nội dung. Thêm chú thích: <code>[img:...|chú thích]</code></small></div>
<textarea id="c_c" class="stbig" maxlength="${MAXC}" placeholder="Mỗi đoạn một dòng. Để một dòng trống hoặc xuống dòng giữa các đoạn.">${esc(c.content)}</textarea>
<div class="stims" id="c_ims" hidden></div>
<label class="ck"><input type="checkbox" id="c_p" ${c.published ? "checked" : ""}> Đăng công khai <small>(bỏ chọn để lưu nháp, chỉ bạn thấy)</small></label>
<p class="aerr" id="c_err" role="alert"></p><div class="acts"><button class="btn pri" id="c_save">Lưu chương</button><button class="btn" id="c_pv">Xem trước</button>${isNew ? "" : `<a class="btn" href="#st/${esc(wid)}/${esc(cid)}">Xem trên web</a>`}</div></section>
<section class="sec" id="c_pvw" hidden><div class="sh"><h2>Xem trước</h2></div><header class="rh"><h1 id="c_pvt"></h1></header><article class="rd novel ${RS.ff} ${RS.bg}" id="c_pvc"></article></section>`;
    const ta = $("#c_c"), fresh = new Set();
    const ims = () => { const L = imgsIn(ta.value), bx = $("#c_ims"); bx.hidden = !L.length; bx.innerHTML = L.length ? `<b>Ảnh trong chương (${L.length})</b><div>${L.map((x, j) => `<span class="stim"><button type="button" data-go="${j}" title="Tìm ảnh này trong nội dung"><img src="${esc(x.u)}" alt="" loading="lazy"></button><button type="button" class="x" data-rm="${j}" title="Gỡ ảnh khỏi chương" aria-label="Gỡ ảnh ${j + 1}">✕</button></span>`).join("")}</div>` : "" };
    const upd = () => { const n = ta.value.length, k = imgsIn(ta.value).length; $("#c_n").textContent = `(${words(ta.value).toLocaleString("vi-VN")} chữ${k ? `, ${k} ảnh` : ""}, ${n.toLocaleString("vi-VN")}/${MAXC.toLocaleString("vi-VN")} ký tự)`; ims() }; upd();
    let tmr = null; const keep = () => { clearTimeout(tmr); tmr = setTimeout(() => ls.set(dk, JSON.stringify({ t: $("#c_t").value, c: ta.value, v: $("#c_v").value, at: Date.now() })), 800) };
    ["c_t", "c_c", "c_v"].forEach(i => $("#" + i).addEventListener("input", () => { upd(); keep() }));
    if (hasDr) { $("#c_rs").onclick = () => { $("#c_t").value = dr.t; ta.value = dr.c; if (dr.v != null) $("#c_v").value = dr.v; upd(); $("#c_dr").remove() }; $("#c_rx").onclick = () => { ls.del(dk); $("#c_dr").remove() } }
    const lineAt = (v, j) => { const L = v.split("\n"); let n = -1, pos = 0; for (let i = 0; i < L.length; i++) { if (imgOf(L[i].trim()) && ++n === j) return [pos, pos + L[i].length]; pos += L[i].length + 1 } return null };
    const insImgs = urls => { // chèn sau dòng đang có con trỏ, mỗi ảnh một dòng riêng
      const v = ta.value; let p = ta.selectionStart ?? v.length; if (p > 0 && v[p - 1] !== "\n") { const e = v.indexOf("\n", p); p = e < 0 ? v.length : e }
      const pre = v.slice(0, p), post = v.slice(p), add = urls.map(u => `[img:${u}]`).join("\n"), A = (pre && !pre.endsWith("\n") ? "\n" : "") + add + (post && !post.startsWith("\n") ? "\n" : "");
      ta.value = pre + A + post; const q = pre.length + A.length; ta.focus(); ta.setSelectionRange(q, q); upd(); keep();
    };
    const doUp = async files => {
      files = [...files].filter(IMGOK); if (!files.length) return toast("Hãy chọn ảnh JPG, PNG, WebP hoặc GIF"); if (files.length > 20) return toast("Mỗi lần chèn tối đa 20 ảnh");
      const b = $("#c_img"); if (b.disabled) return; b.disabled = true;
      try { const urls = await upIll(files, (i, n) => { b.textContent = `Đang tải ảnh ${i}/${n}...` }); urls.forEach(u => fresh.add(u)); insImgs(urls); toast(`Đã chèn ${urls.length} ảnh. Nhớ bấm Lưu chương.`) } catch (x) { toast(viMsg(x)) }
      b.disabled = false; b.innerHTML = `${ic(I.img)}Chèn ảnh minh họa`;
    };
    $("#c_img").onclick = () => $("#c_if").click(); $("#c_if").onchange = e => { const f = [...e.target.files]; e.target.value = ""; doUp(f) };
    ta.addEventListener("paste", e => { const f = [...((e.clipboardData && e.clipboardData.files) || [])]; if (f.some(IMGOK)) { e.preventDefault(); doUp(f) } });
    ta.addEventListener("dragover", e => { if ([...e.dataTransfer.types].includes("Files")) { e.preventDefault(); ta.classList.add("drop") } });
    ta.addEventListener("dragleave", () => ta.classList.remove("drop"));
    ta.addEventListener("drop", e => { ta.classList.remove("drop"); const f = [...e.dataTransfer.files]; if (f.length) { e.preventDefault(); doUp(f) } });
    $("#c_ims").onclick = e => { const g = e.target.closest("[data-go]"), r = e.target.closest("[data-rm]"); const k = g ? +g.dataset.go : r ? +r.dataset.rm : -1; if (k < 0) return; const at = lineAt(ta.value, k); if (!at) return;
      if (g) { ta.focus(); ta.setSelectionRange(at[0], at[1]); const lh = parseFloat(getComputedStyle(ta).lineHeight) || 24; ta.scrollTop = Math.max(0, ta.value.slice(0, at[0]).split("\n").length * lh - ta.clientHeight / 2); return }
      ta.value = ta.value.slice(0, at[0]) + ta.value.slice(at[1] + (ta.value[at[1]] === "\n" ? 1 : 0)); upd(); keep() };
    $("#c_pv").onclick = () => { $("#c_pvw").hidden = false; $("#c_pvt").textContent = $("#c_t").value || "Chưa có tên chương"; const B = rbody(ta.value, true); $("#c_pvc").className = B.gal ? "rd gal" : `rd novel ${RS.ff} ${RS.bg}`; $("#c_pvc").innerHTML = B.html || '<p class="mu">Chưa có nội dung.</p>'; $("#c_pvw").scrollIntoView({ behavior: "smooth" }) };
    $("#c_save").onclick = async e => {
      const b = e.currentTarget, err = m => { $("#c_err").textContent = m }, title = $("#c_t").value.trim(), content = $("#c_c").value.normalize("NFC");
      if (!title) return err("Hãy nhập tên chương."); if (!content.trim()) return err("Chương chưa có nội dung.");
      busy(b, true); err("");
      try {
        const row = { title, content, vol: $("#c_v").value.trim(), published: $("#c_p").checked };
        let r;
        if (isNew) { const ch = await getChapters(wid); row.work_id = wid; row.ord = ch.reduce((a, x) => Math.max(a, x.ord || 0), 0) + 1; r = await sb.from("chapters").insert(row).select("id").single() }
        else r = await sb.from("chapters").update(row).eq("id", cid).select("id").single();
        if (r.error) throw r.error; ls.del(dk);
        const keepU = new Set(imgsIn(content).map(x => x.u)); [...fresh].filter(u => !keepU.has(u)).forEach(u => { fresh.delete(u); rmImg(u) }); // ảnh vừa tải rồi gỡ ra thì xóa khỏi kho
        toast(row.published ? "Đã lưu và đăng chương" : "Đã lưu nháp");
        if (isNew) { ls.del(dk); location.replace(`#viet/c/${wid}/${r.data.id}`) } else busy(b, false);
      } catch (x) { err(viMsg(x)); busy(b, false) }
    };
  }

  /* ---------- Hồ sơ ---------- */
  function pProfile() {
    document.title = "Hồ sơ | Kenrori";
    const P = prof || {}, L = linksOf(P).slice(), st = { av: null, bn: null, avDel: false, bnDel: false };
    const linkRow = (l, i) => `<div class="pfl" data-i="${i}"><select aria-label="Loại liên kết">${LINKT.map(([k, n]) => `<option value="${k}" ${k === (l.k || "khac") ? "selected" : ""}>${n}</option>`).join("")}</select><input type="url" placeholder="https://..." value="${esc(l.u || "")}" aria-label="Địa chỉ liên kết"><button type="button" class="btn sm" data-lx="${i}" aria-label="Bỏ liên kết này">✕</button></div>`;
    app.innerHTML = `<section class="sec stf pfw"><div class="sh"><h2>Hồ sơ tác giả</h2><a class="more all" href="#viet">Về Góc tác giả</a></div>
<div class="pfh"><label class="pfb" style="--h:${hue(P.display_name || "?")}" title="Đổi ảnh bìa"><img id="pf_bimg" alt="" ${isCover(P.banner_url) ? `src="${esc(P.banner_url)}"` : "hidden"}><span class="pfc">${ic('<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>')}Đổi ảnh bìa</span><input type="file" id="pf_bin" accept="image/jpeg,image/png,image/webp" hidden></label>
<label class="pfa" title="Đổi ảnh đại diện">${avHtml(P, "tga")}<span class="pfc">${ic('<path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/>')}</span><input type="file" id="pf_ain" accept="image/jpeg,image/png,image/webp" hidden></label></div>
<div class="pfx"><button type="button" class="lnk" id="pf_adel" ${isCover(P.avatar_url) ? "" : "hidden"}>Bỏ ảnh đại diện</button><button type="button" class="lnk" id="pf_bdel" ${isCover(P.banner_url) ? "" : "hidden"}>Bỏ ảnh bìa</button><small class="mu">Ảnh đại diện được cắt vuông, ảnh bìa cắt tỉ lệ 3:1. Ảnh JPG, PNG hoặc WebP.</small></div>
<label for="p_n">Tên hiển thị</label><input id="p_n" maxlength="40" value="${esc(P.display_name || "")}">
<label for="p_b">Giới thiệu bản thân <small id="p_bc">(hiện trên trang tác giả)</small></label><textarea id="p_b" maxlength="1000" rows="5" placeholder="Bạn thích viết thể loại gì, lịch đăng chương, lời nhắn cho người đọc...">${esc(P.bio || "")}</textarea>
<label>Liên kết <small>(Facebook, Discord, trang web... tối đa 6)</small></label><div id="pf_ls"></div><button type="button" class="btn sm" id="pf_ladd">Thêm liên kết</button>
<p class="aerr" id="p_err" role="alert"></p><div class="acts"><button class="btn pri" id="p_save">Lưu hồ sơ</button><a class="btn" href="#tg/${esc(me.id)}">Xem trang tác giả</a><a class="btn" href="#viet/doi-mat-khau">Đổi mật khẩu</a></div></section>`;
    const drawL = () => { $("#pf_ls").innerHTML = L.map(linkRow).join(""); $("#pf_ladd").hidden = L.length >= 6 };
    const syncL = () => document.querySelectorAll("#pf_ls .pfl").forEach(r => { const i = +r.dataset.i; L[i] = { k: r.querySelector("select").value, u: r.querySelector("input").value.trim() } });
    drawL();
    $("#pf_ladd").onclick = () => { syncL(); L.push({ k: "facebook", u: "" }); drawL(); document.querySelector("#pf_ls .pfl:last-child input").focus() };
    $("#pf_ls").onclick = e => { const b = e.target.closest("[data-lx]"); if (!b) return; syncL(); L.splice(+b.dataset.lx, 1); drawL() };
    const pick = (inp, key, show) => inp.onchange = () => { const f = inp.files[0]; inp.value = ""; if (!f) return; if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { $("#p_err").textContent = "Chỉ dùng ảnh JPG, PNG hoặc WebP."; return } st[key] = f; st[key + "Del"] = false; show(URL.createObjectURL(f)) };
    pick($("#pf_ain"), "av", u => { $(".pfa .avs").innerHTML = `<img src="${u}" alt="">`; $("#pf_adel").hidden = false });
    pick($("#pf_bin"), "bn", u => { const im = $("#pf_bimg"); im.src = u; im.hidden = false; $("#pf_bdel").hidden = false });
    $("#pf_adel").onclick = () => { st.av = null; st.avDel = true; $(".pfa .avs").textContent = [...($("#p_n").value.trim() || "?")][0]; $("#pf_adel").hidden = true };
    $("#pf_bdel").onclick = () => { st.bn = null; st.bnDel = true; $("#pf_bimg").hidden = true; $("#pf_bimg").removeAttribute("src"); $("#pf_bdel").hidden = true };
    $("#p_b").oninput = () => { const n = $("#p_b").value.length; $("#p_bc").textContent = n > 800 ? `(${n}/1000)` : "(hiện trên trang tác giả)" };
    $("#p_save").onclick = async e => {
      const n = $("#p_n").value.trim(), er = m => $("#p_err").textContent = m; if (n.length < 2) return er("Tên hiển thị cần ít nhất 2 ký tự.");
      syncL(); const links = L.filter(l => l.u).map(l => ({ k: l.k, u: l.u })); const bad = links.find(l => !/^https:\/\/[^\s"<>]{3,300}$/.test(l.u)); if (bad) return er("Liên kết phải bắt đầu bằng https://, ví dụ https://facebook.com/ten-ban");
      busy(e.currentTarget, true); er("");
      try {
        const row = { display_name: n, bio: $("#p_b").value.trim(), links }, old = { a: P.avatar_url, b: P.banner_url };
        if (st.av) row.avatar_url = await upImg(await shrinkImg(st.av, 320, 320), "avatar"); else if (st.avDel) row.avatar_url = null;
        if (st.bn) row.banner_url = await upImg(await shrinkImg(st.bn, 1500, 500), "banner"); else if (st.bnDel) row.banner_url = null;
        const { error } = await sb.from("profiles").update(row).eq("id", me.id); if (error) throw error;
        if ("avatar_url" in row && old.a) rmImg(old.a); if ("banner_url" in row && old.b) rmImg(old.b);
        await loadProf(); authBtn(); toast("Đã lưu hồ sơ"); go("#tg/" + me.id);
      } catch (x) { er(/column .* does not exist|schema cache/i.test(x.message || "") ? "Máy chủ chưa có chỗ lưu ảnh đại diện. Quản trị viên cần chạy lại file supabase-setup.sql mới." : viMsg(x)); busy(e.currentTarget, false) }
    };
  }


  /* ---------- Kiểm duyệt ---------- */
  const modTabs = cur => `<div class="utabs mtabs" role="tablist"><a role="tab" class="${cur === "bc" ? "on" : ""}" href="#kiem-duyet">Báo cáo và truyện bị ẩn</a><a role="tab" class="${cur === "tk" ? "on" : ""}" href="#kiem-duyet/tai-khoan">Tài khoản</a></div>`;
  const RL = { user: "Thành viên", mod: "Kiểm duyệt viên", admin: "Quản trị viên" };
  // Mọi thao tác kiểm duyệt đi qua hàm st_admin: mod/admin đã đăng nhập, hoặc chủ web có mật khẩu kiểm duyệt
  const A = async (act, a = {}) => { const r = await sb.rpc("st_admin", { p: modPw() || null, act, a }); if (r.error && /st_admin|function|schema cache/i.test(r.error.message || "")) r.error = { message: "Máy chủ chưa có bảng điều khiển kiểm duyệt. Hãy chạy lại file supabase-setup.sql mới trong Supabase." }; return r };
  const noMod = () => `<section class="sec"><div class="stmodg"><h2>Trang dành cho ban kiểm duyệt</h2>${ADM ? `<p>Bạn đang mở trang quản trị trên máy này nhưng chưa nhập mật khẩu kiểm duyệt, hoặc mật khẩu chưa đúng.</p><ol><li>Trong Supabase › SQL Editor, chạy <code>select public.set_comment_password('mật-khẩu-của-bạn');</code> (cần chạy binh-luan.sql trước).</li><li>Mở <a class="al" href="admin.html#site/mk">Quản trị › Cài đặt</a>, nhập đúng mật khẩu đó vào ô Mật khẩu kiểm duyệt và lưu.</li><li>Quay lại trang này.</li></ol>` : `<p>Đăng nhập bằng tài khoản đã được cấp quyền kiểm duyệt hoặc quản trị để tiếp tục.</p>`}<div class="acts">${me ? "" : '<a class="btn pri" href="#viet/dang-nhap">Đăng nhập</a>'}<a class="btn" href="#home">Về trang chủ</a></div></div></section>`;
  const relT = ts => { if (!ts) return "chưa đăng nhập lần nào"; const d = (Date.now() - new Date(ts)) / 864e5; return d < 1 ? "hoạt động hôm nay" : d < 2 ? "hoạt động hôm qua" : d < 30 ? `hoạt động ${Math.floor(d)} ngày trước` : `hoạt động ${new Date(ts).toLocaleDateString("vi-VN")}` };
  async function pAccounts() {
    document.title = "Quản lý tài khoản | Kenrori";
    await loadProf(); if (!isMod() && !modPw()) { app.innerHTML = noMod(); return }
    const who = await A("whoami"); if (who.error) { app.innerHTML = /mật khẩu|kiểm duyệt/i.test(who.error.message || "") ? noMod() : errBox(who.error); return }
    const adm = !!who.data.admin, ref = (/^https:\/\/([a-z0-9-]+)\.supabase\.(co|in)/.exec(cfg().url || "") || [])[1];
    let q = "", f = "all", page = 0, rows = [], total = 0, tmr = null;
    app.innerHTML = `<section class="sec"><div class="sh"><h2>Kiểm duyệt</h2><a class="more all" href="#viet">Về Góc tác giả</a></div>${modTabs("tk")}
<div class="acf"><input id="ac_q" type="search" placeholder="${adm ? "Tìm theo tên hoặc email" : "Tìm theo tên hiển thị"}" aria-label="Tìm tài khoản"><div class="acc" role="group" aria-label="Lọc">${[["all", "Tất cả"], ["writers", "Đã viết truyện"], ["new", "Mới 7 ngày"], ["mod", "Ban kiểm duyệt"], ["banned", "Bị khóa"]].map(([k, l]) => `<button type="button" class="fc${k === "all" ? " on" : ""}" data-af="${k}">${l}</button>`).join("")}</div></div>
<p class="mu" id="ac_n"></p>${adm && window.KGP && KGP.on() ? `<div class="acbulk"><span id="ac_sc">Chưa chọn tài khoản nào</span><button class="btn sm" id="ac_bk" disabled>Thao tác hàng loạt</button><button class="btn sm" id="ac_ball">Phát cho toàn bộ thành viên</button></div>` : ""}<div id="ac_l" class="acl"><p class="mu">Đang tải...</p></div><div class="acts" style="justify-content:center;margin-top:14px"><button class="btn" id="ac_more" hidden>Xem thêm</button></div>
<p class="mu acnote">${who.data.owner ? "Bạn đang quản lý bằng mật khẩu kiểm duyệt của chủ web: có toàn quyền, đổi được vai trò và thấy email. " : adm ? "Bạn là quản trị viên: đổi được vai trò và thấy email. " : "Kiểm duyệt viên khóa được tài khoản và ẩn truyện; chỉ quản trị viên đổi được vai trò. "}Muốn xóa hẳn một tài khoản, vào Supabase › Authentication › Users${ref ? ` (<a class="al" href="https://supabase.com/dashboard/project/${esc(ref)}/auth/users" target="_blank" rel="noopener">mở trang đó</a>)` : ""}.</p></section>`;
    const G = adm && window.KGP && KGP.on(), SEL = new Set();
    const row = u => { const self = !!me && u.id === me.id, isAdm = u.role === "admin"; return `<div class="acr${u.banned ? " ban" : ""}" data-u="${esc(u.id)}">${G ? `<input type="checkbox" class="acsel" data-asel aria-label="Chọn ${esc(u.display_name)}"${SEL.has(u.id) ? " checked" : ""}>` : ""}${avHtml(u, "acav")}<div class="acb"><div class="act"><a href="#tg/${esc(u.id)}"><b>${esc(u.display_name)}</b></a>${u.role !== "user" ? `<em class="okb">${RL[u.role]}</em>` : ""}${u.banned ? '<em class="bad">Bị khóa</em>' : ""}${self ? '<em class="drf">Bạn</em>' : ""}</div><small>${u.email ? esc(u.email) + ", " : ""}tham gia ${new Date(u.created_at).toLocaleDateString("vi-VN")}, ${relT(u.last_sign_in_at)}</small><small>${u.works} truyện (${u.published} công khai), ${u.chapters} chương</small></div>
<div class="aca">${adm && !self ? `<select data-arole aria-label="Vai trò của ${esc(u.display_name)}">${Object.entries(RL).map(([k, l]) => `<option value="${k}" ${k === u.role ? "selected" : ""}>${l}</option>`).join("")}</select>` : ""}${!self && (adm || !isAdm) ? `<button class="btn sm${u.banned ? "" : " dngb"}" data-aban="${u.banned ? 0 : 1}">${u.banned ? "Mở khóa" : "Khóa"}</button>` : ""}${!self && u.published ? `<button class="btn sm" data-ahide>Ẩn hết truyện</button>` : ""}${G ? `<button class="btn sm" data-agame>Tu luyện</button>` : ""}</div></div>` };
    const load = async more => {
      page = more ? page + 1 : 0; const { data, error } = await A("users", { q, f, lim: 30, off: page * 30 });
      if (error) { $("#ac_l").innerHTML = errBox(error); return }
      rows = more ? rows.concat(data || []) : (data || []); total = (data && data[0] && +data[0].total) || (more ? total : 0);
      $("#ac_n").textContent = total ? `${total.toLocaleString("vi-VN")} tài khoản` : ""; $("#ac_l").innerHTML = rows.map(row).join("") || '<p class="empty">Không có tài khoản nào khớp.</p>'; $("#ac_more").hidden = rows.length >= total;
    };
    $("#ac_q").oninput = e => { clearTimeout(tmr); tmr = setTimeout(() => { q = e.target.value.trim(); load(false) }, 400) };
    document.querySelector(".acc").onclick = e => { const b = e.target.closest("[data-af]"); if (!b) return; f = b.dataset.af; document.querySelectorAll(".acc .fc").forEach(x => x.classList.toggle("on", x === b)); load(false) };
    $("#ac_more").onclick = () => load(true);
    $("#ac_l").addEventListener("change", async e => { const s = e.target.closest("[data-arole]"); if (!s) return; const id = s.closest(".acr").dataset.u, u = rows.find(x => x.id === id), nr = s.value;
      if (!confirm(`Đổi vai trò của ${u.display_name} thành ${RL[nr]}?${nr === "admin" ? "\nQuản trị viên có toàn quyền, kể cả đổi vai trò của người khác." : ""}`)) { s.value = u.role; return }
      const { error } = await A("set_role", { id, role: nr }); if (error) { s.value = u.role; return toast(viMsg(error)) } u.role = nr; toast("Đã đổi vai trò"); s.closest(".acr").outerHTML = row(u) });
    const selUpd = () => { if (!$("#ac_sc")) return; $("#ac_sc").textContent = SEL.size ? `Đã chọn ${SEL.size} tài khoản` : "Chưa chọn tài khoản nào"; $("#ac_bk").disabled = !SEL.size };
    if ($("#ac_bk")) { $("#ac_bk").onclick = () => KGP.bulk([...SEL]); $("#ac_ball").onclick = () => KGP.bulk("all") }
    $("#ac_l").addEventListener("change", e => { const c = e.target.closest("[data-asel]"); if (!c) return; const id = c.closest(".acr").dataset.u; c.checked ? SEL.add(id) : SEL.delete(id); selUpd() });
    $("#ac_l").addEventListener("click", async e => {
      const gb = e.target.closest("[data-agame]"); if (gb) { const id = gb.closest(".acr").dataset.u, u = rows.find(x => x.id === id); return KGP.member(id, u ? u.display_name : "") }
      const b = e.target.closest("[data-aban],[data-ahide]"); if (!b) return; const id = b.closest(".acr").dataset.u, u = rows.find(x => x.id === id);
      if (b.dataset.aban != null) { const on = b.dataset.aban === "1"; if (on && !confirm(`Khóa tài khoản ${u.display_name}? Họ không đăng, sửa truyện hay bình luận được, và truyện của họ bị ẩn khỏi web.`)) return; const { error } = await A("set_ban", { id, on }); if (error) return toast(viMsg(error)); u.banned = on; toast(on ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản") }
      else { if (!confirm(`Ẩn toàn bộ ${u.published} truyện công khai của ${u.display_name}? Bạn bỏ ẩn lại được ở tab Báo cáo và truyện bị ẩn.`)) return; const { error } = await A("hide_author", { id }); if (error) return toast(viMsg(error)); u.published = 0; toast("Đã ẩn các truyện của tài khoản này") }
      b.closest(".acr").outerHTML = row(u);
    });
    await load(false);
  }
  async function pMod() {
    document.title = "Kiểm duyệt | Kenrori";
    await loadProf(); if (!isMod() && !modPw()) { app.innerHTML = noMod(); return }
    const rp = await A("queue"); if (rp.error && /mật khẩu|kiểm duyệt/i.test(rp.error.message || "") && !/Máy chủ/.test(rp.error.message)) { app.innerHTML = noMod(); return }
    const Q = rp.data || {}, R = (Q.reports || []).map(r => ({ ...r, reporter: { display_name: r.reporter }, work: r.work_id ? { id: r.work_id, title: r.work, hidden: r.work_hidden, author_id: r.author_id } : null, chapter: r.chapter_id ? { id: r.chapter_id, title: r.chapter } : null })), H = (Q.hidden || []).map(w => ({ ...w, author: { display_name: w.author } })), B = Q.banned || [];
    app.innerHTML = `<section class="sec"><div class="sh"><h2>Kiểm duyệt</h2><a class="more all" href="#viet">Về Góc tác giả</a></div>${modTabs("bc")}${rp.error ? errBox(rp.error) : ""}
<h3>Báo cáo chưa xử lý (${R.length})</h3>${R.length ? `<div class="stl">${R.map(r => `<div class="stli col"><span class="stb"><b>${r.work ? `<a class="al" href="#st/${esc(r.work.id)}${r.chapter ? "/" + esc(r.chapter.id) : ""}" target="_blank">${esc(r.work.title)}${r.chapter ? ", " + esc(r.chapter.title) : ""}</a>` : "Truyện đã bị xóa"}</b><small>${esc((r.reporter && r.reporter.display_name) || "Ẩn danh")} báo cáo ${ago(day(r.created_at)).toLowerCase()}: ${esc(r.reason)}</small></span><span class="acts" style="margin:0">${r.work ? (r.work.hidden ? `<button class="btn sm" onclick="ST.hide('${esc(r.work.id)}',false)">Bỏ ẩn truyện</button>` : `<button class="btn sm dngb" onclick="ST.hide('${esc(r.work.id)}',true)">Ẩn truyện</button>`) + `<button class="btn sm dngb" onclick="ST.ban('${esc(r.work.author_id)}',true)">Khóa tác giả</button>` : ""}<button class="btn sm" onclick="ST.resolve(${+r.id})">Đã xử lý</button></span></div>`).join("")}</div>` : '<p class="mu">Không có báo cáo nào.</p>'}
<h3>Truyện đang bị ẩn (${H.length})</h3>${H.length ? `<div class="stl">${H.map(w => `<div class="stli"><span class="stb"><b><a class="al" href="#st/${esc(w.id)}">${esc(w.title)}</a></b><small>${esc(aName(w))}</small></span><button class="btn sm" onclick="ST.hide('${esc(w.id)}',false)">Bỏ ẩn</button></div>`).join("")}</div>` : '<p class="mu">Không có truyện nào bị ẩn.</p>'}
<h3>Tài khoản bị khóa (${B.length})</h3>${B.length ? `<div class="stl">${B.map(p => `<div class="stli"><span class="stb"><b><a class="al" href="#tg/${esc(p.id)}">${esc(p.display_name)}</a></b></span><button class="btn sm" onclick="ST.ban('${esc(p.id)}',false)">Mở khóa</button></div>`).join("")}</div>` : '<p class="mu">Không có tài khoản nào bị khóa.</p>'}</section>`;
  }

  /* ---------- Nội quy ---------- */
  const RULES = `Chỉ đăng truyện do chính bạn viết. Không đăng lại truyện, bản dịch hay tác phẩm của người khác.
Không đăng nội dung tình dục liên quan đến người dưới 18 tuổi, nội dung kích động bạo lực, thù ghét hoặc vi phạm pháp luật.
Truyện có cảnh bạo lực mạnh hoặc nội dung tình dục giữa người trưởng thành phải bật đánh dấu 18+.
Không spam, không quảng cáo, không đăng thông tin cá nhân của người khác.
Tôn trọng độc giả và tác giả khác.
Ban quản trị có quyền ẩn truyện hoặc khóa tài khoản vi phạm mà không cần báo trước.`;
  function pRules() {
    document.title = "Nội quy Sáng tác | Kenrori";
    const t = ((DATA.site && DATA.site.rules) || RULES).split(/\n+/).map(x => x.trim()).filter(Boolean);
    app.innerHTML = sec("Nội quy Sáng tác", null, `<ol class="strules">${t.map(x => `<li>${esc(x)}</li>`).join("")}</ol><p class="lead">Thấy truyện vi phạm? Đăng nhập rồi bấm "Báo cáo vi phạm" trên trang truyện hoặc cuối chương.</p><div class="acts"><a class="btn pri" href="#viet">Vào Góc tác giả</a><a class="btn" href="#sang-tac">Xem truyện Sáng tác</a></div>`);
  }

  /* ---------- Định tuyến ---------- */
  async function route() {
    const parts = decodeURIComponent(location.hash.slice(1)).split("/"), a = parts[0];
    if (a === "noi-quy") return pRules();
    const stOnly = a === "sang-tac" || a === "st" || (a === "viet" && ["moi", "w", "c"].includes(parts[1]));
    if (!acct() || (stOnly && !enabled())) { document.title = "Sáng tác | Kenrori"; app.innerHTML = ADM ? `<section class="sec" style="max-width:640px"><h2>Khu Sáng tác chưa được bật</h2><p>Chỉ bạn (quản trị viên) thấy mục này. Người đọc sẽ thấy mục Sáng tác và nút đăng ký sau khi bạn làm xong. Bình luận ẩn danh không cần bật khu này.</p><ol style="line-height:1.8"><li>Chạy file supabase-setup.sql rồi binh-luan.sql trong SQL Editor của Supabase.</li><li>Vào <a class="al" href="admin.html">trang quản trị</a>, mục Cài đặt trang web, điền Project URL và Publishable key của Supabase, tích ô Bật khu Sáng tác, bấm Lưu cài đặt.</li><li>Đợi 1–2 phút rồi tải lại trang này bằng Ctrl+F5.</li></ol></section>` : notice("Khu Sáng tác chưa được bật."); return }
    app.innerHTML = '<p class="empty">Đang tải...</p>';
    try { await init() } catch (e) { app.innerHTML = errBox(e); return }
    try {
      if (/^(access_token|error|type)=|&access_token=/.test(location.hash.slice(1))) return authCallback();
      if (a === "sang-tac") return await pList();
      if (a === "st") return parts[2] ? await pRead(parts[1], parts[2]) : await pWork(parts[1]);
      if (a === "tg") { await pWriter(parts[1]); return afterWriter(parts[1]) }
      if (a === "kiem-duyet") return parts[1] === "tai-khoan" ? await pAccounts() : await pMod();
      if (a === "viet") {
        const sub = parts[1];
        if (!me) return pAuth(sub === "dang-ky" ? "reg" : sub === "quen-mat-khau" ? "forgot" : "login");
        if (sub === "doi-mat-khau") return pNewPw();
        if (sub === "moi") return await pWorkEdit(null);
        if (sub === "w") return await pWorkEdit(parts[2]);
        if (sub === "c") return await pChapEdit(parts[2], parts[3]);
        if (sub === "ho-so") return pProfile();
        if (!enabled()) { location.replace(DATA.site.game === true ? "#tu-luyen" : "#home"); return }
        return await pMine();
      }
    } catch (e) { app.innerHTML = errBox(e) }
  }
  // Quay về từ link trong email (xác nhận tài khoản, đặt lại mật khẩu): chờ đăng nhập xong rồi đưa người dùng về trang đang xem trước đó
  async function authCallback() {
    const h = location.hash.slice(1), err = /error_description=([^&]+)/.exec(h);
    let back = ""; try { back = sessionStorage.getItem("kret") || ""; sessionStorage.removeItem("kret") } catch (e) {}
    if (!back || /^#(viet\/(dang-nhap|dang-ky)|access_token|error)/.test(back)) back = enabled() ? "#viet" : DATA.site.game === true ? "#tu-luyen" : "#home";
    if (err) { history.replaceState(null, "", location.pathname + "#viet/dang-nhap"); app.innerHTML = notice("Đăng nhập không thành công: " + esc(decodeURIComponent(err[1].replace(/\+/g, " "))) + `. <a class="al" href="#viet/dang-nhap">Thử lại</a>`); return }
    await new Promise(r => setTimeout(r, 300)); const { data } = await sb.auth.getSession(); me = (data.session && data.session.user) || null; await loadProf(); authBtn(); kauth();
    if (me && prof) toast("Xin chào " + prof.display_name);
    location.replace(location.pathname + (/type=recovery/.test(h) ? "#viet/doi-mat-khau" : back));
  }


  /* ---------- Đưa truyện Sáng tác vào khung lớn đầu trang chủ ---------- */
  async function heroAdd(ws) {
    ws = (ws || []).filter(w => !w.mature).slice(0, 6); if (!ws.length) return;
    const { data: cs } = await sb.from("chapters").select("id,work_id,title,vol,ord").in("work_id", ws.map(w => w.id)).eq("published", true);
    const H0 = ws.map(w => { const L = (cs || []).filter(c => c.work_id === w.id).sort((a, b) => (a.ord || 0) - (b.ord || 0)); return L.length ? { w, L } : null }).filter(Boolean);
    if (!H0.length || !/^#?(home)?$/.test(location.hash)) return;
    let hero = $("#hero"), fresh = false;
    if (!hero) { app.insertAdjacentHTML("afterbegin", '<section class="hero" id="hero" aria-label="Truyện mới cập nhật"></section>'); hero = $("#hero"); fresh = true }
    let hn = hero.querySelector(".hn"); if (!hn) { hero.insertAdjacentHTML("beforeend", '<div class="hn" role="tablist" aria-label="Chọn truyện nổi bật"></div>'); hn = hero.querySelector(".hn") }
    const S0 = [...hero.querySelectorAll(".hs")], D0 = [...hn.querySelectorAll(".hdot")], dm = new Map(); S0.forEach((x, i) => { if (D0[i]) dm.set(x, D0[i]) });
    for (const { w, L } of H0) {
      const id = esc(w.id), t = esc(w.title), cov = isCover(w.cover_url) ? w.cover_url : "", lc = L[L.length - 1], cont = ls.get("st:" + w.id), goId = cont && L.some(c => c.id === cont) ? cont : L[0].id, u = day(w.updated_at);
      const sl = document.createElement("div"); sl.className = "hs"; sl.dataset.u = u;
      sl.innerHTML = `<div class="hb" style="--h:${hue(w.title)}${cov ? `;background-image:url(&quot;${esc(cov)}&quot;)` : ""}"></div><div class="hw"><a class="book" href="#st/${id}" aria-label="${t}"><span class="cover" style="--h:${hue(w.title)}">${cov ? imgTag(cov) : ""}<b>${t}</b></span><span class="obi"><small>Mới nhất</small><b>${esc(((lc.vol || "").trim() ? lc.vol.trim() + " - " : "") + lc.title)}</b></span></a><div class="hi"><a href="#st/${id}"><h2>${t}</h2></a><div class="hau"><span>Tác giả</span><b>${esc(aName(w))}</b></div><div class="htg"><span class="hst">Sáng tác</span>${(w.genres || []).slice(0, 5).map(g => `<span>${esc(g)}</span>`).join("")}</div><p>${esc(w.summary)}</p><div class="hcta"><a class="btn pri" href="#st/${id}/${esc(goId)}">${ic(I.play)}${cont ? "Đọc tiếp" : "Đọc ngay"}</a><a class="btn hsec" href="#st/${id}">Xem chi tiết</a></div></div></div>`;
      const dt = document.createElement("button"); dt.className = "hdot"; dt.setAttribute("role", "tab"); dt.setAttribute("aria-selected", "false"); dt.title = w.title; dt.setAttribute("aria-label", w.title); dt.style.setProperty("--h", hue(w.title)); dt.setAttribute("onclick", "heroTo([...this.parentNode.children].indexOf(this))"); dt.innerHTML = cov ? imgTag(cov) : "";
      const at = [...hero.querySelectorAll(".hs")].find(x => (x.dataset.u || "") < u); hero.insertBefore(sl, at || hn); dm.set(sl, dt);
    }
    let all = [...hero.querySelectorAll(".hs")];
    while (all.length > 10) { const x = [...all].reverse().find(y => !y.classList.contains("on")); x.remove(); dm.get(x)?.remove(); all = [...hero.querySelectorAll(".hs")] }
    all.forEach(x => { const d = dm.get(x); if (d) hn.appendChild(d) });
    if (!all.some(x => x.classList.contains("on"))) all[0].classList.add("on");
    HI = all.findIndex(x => x.classList.contains("on")); [...hn.children].forEach((d, i) => { d.classList.toggle("on", i === HI); d.setAttribute("aria-selected", i === HI) });
    hn.hidden = all.length < 2; if (all.length > 1) heroTo(HI); if (fresh && typeof setClear === "function") setClear();
  }

  /* ---------- Hành động gọi từ nút ---------- */
  window.ST = {
    enabled, acct, client: async () => { await init(); return sb }, me: () => me, prof: () => prof, modPw: () => modPw(), isMod: () => isMod(),
    handles: a => ST_ROUTES.includes(a) || /^(access_token|error|type)=/.test(a || ""), route,
    async homeShelf() {
      const el = $("#st_home"); if (!el) return; if (!enabled()) return el.remove();
      try { await init(); const { data } = await sb.from("works").select(WSEL).eq("visibility", "published").eq("hidden", false).order("updated_at", { ascending: false }).limit(18); if (!$("#st_home")) return; if (!(data || []).length) return el.remove(); el.outerHTML = shelfSec("Sáng tác mới", "sang-tac", data.map(wCard)); shArrows(); await heroAdd(data) } catch (e) { const x = $("#st_home"); if (x) x.remove() }
      if (stFavs().length) ST.libRefresh();
    },
    follow() { const [id, m] = ST._meta || []; if (id) toggleFav("st", id, m) },
    async libRefresh() { // cập nhật số chương của truyện Sáng tác đang theo dõi
      const F = stFavs(); if (!F.length || !enabled()) return;
      try {
        await init(); const ids = F.map(x => x.id);
        const [{ data: ws }, { data: cs }] = await Promise.all([sb.from("works").select("id,title,cover_url,updated_at,author:profiles(display_name)").in("id", ids), sb.from("chapters").select("work_id,title,vol,ord,published").in("work_id", ids).eq("published", true)]);
        let ch = false;
        for (const { id, m } of F) { const w = (ws || []).find(x => x.id === id); if (!w) continue; const L = (cs || []).filter(c => c.work_id === id).sort((a, b) => (a.ord || 0) - (b.ord || 0)), lc = L[L.length - 1];
          const nm = { ...m, t: w.title, c: w.cover_url, a: aName(w), n: L.length, u: w.updated_at, l: lc ? ((lc.vol || "").trim() ? lc.vol.trim() + " - " : "") + lc.title : "" };
          if (JSON.stringify(nm) !== JSON.stringify(m)) { ls.set("stm:" + id, JSON.stringify(nm)); ch = true } }
        if (ch) { navBadge(); if (location.hash === "#library") app.innerHTML = P.library() }
      } catch (e) {}
    },
    initBtn() { authBtn(); if (acct()) { try { if (Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) init().catch(() => {}) } catch (e) {} } },
    ok18() { ss.set("st18", "1"); route() },
    async share() { const url = location.href; if (navigator.share) { try { await navigator.share({ title: document.title, url }); return } catch (e) { if (e.name === "AbortError") return } } try { await navigator.clipboard.writeText(url); toast("Đã sao chép link") } catch (e) { prompt("Sao chép link này:", url) } },
    async report(wid, cid) {
      if (!me) return go("#viet"); const reason = prompt("Lý do báo cáo (ví dụ: đạo văn, nội dung 18+ không đánh dấu, spam):"); if (!reason || reason.trim().length < 3) return;
      const { error } = await sb.from("reports").insert({ work_id: wid, chapter_id: cid || null, reason: reason.trim().slice(0, 1000) }); toast(error ? viMsg(error) : "Đã gửi báo cáo. Cảm ơn bạn!");
    },
    async logout() { await sb.auth.signOut(); me = null; prof = null; authBtn(); toast("Đã đăng xuất"); go("#sang-tac") },
    async mv(wid, j, d) {
      const L = ST._ch || [], a = L[j], b = L[j + d]; if (!a || !b) return;
      const oa = a.ord === b.ord ? j + 1 : a.ord, ob = a.ord === b.ord ? j + 1 + d : b.ord;
      const r1 = await sb.from("chapters").update({ ord: ob }).eq("id", a.id), r2 = await sb.from("chapters").update({ ord: oa }).eq("id", b.id);
      if (r1.error || r2.error) return toast(viMsg(r1.error || r2.error)); route();
    },
    async delCh(cid, wid) { if (!confirm("Xóa chương này? Không thể khôi phục.")) return; const { error } = await sb.from("chapters").delete().eq("id", cid); if (error) return toast(viMsg(error)); toast("Đã xóa chương"); route() },
    async hide(wid, on) { const { error } = await A("set_hidden", { id: wid, on }); toast(error ? viMsg(error) : on ? "Đã ẩn truyện" : "Đã bỏ ẩn truyện"); if (!error) route() },
    async ban(uid, on) { if (on && !confirm("Khóa tài khoản này? Người dùng sẽ không đăng hoặc sửa được truyện, và truyện của họ bị ẩn khỏi web.")) return; const { error } = await A("set_ban", { id: uid, on }); toast(error ? viMsg(error) : on ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản"); if (!error) route() },
    async resolve(id) { const { error } = await A("resolve", { id }); toast(error ? viMsg(error) : "Đã đánh dấu đã xử lý"); if (!error) route() }
  };


  /* ---------- Bình luận ẩn danh ---------- */
  const CSEL = "id,parent_id,name,body,user_id,hidden,created_at", CPAGE = 20;
  const EMO = {
    "Mặt cười": "😀 😁 😂 🤣 😊 😍 🥰 😘 😎 🤩 🥳 😏 😴 🤔 🤨 😐 🙄 😮 😱 😭 😢 😤 😡 🤬 🥺 😳 🤯 😇 🤗 🤭 🫣 😅 😆 🙃 😋 😜 🤪 😬 🫠 🤡 💀 👻",
    "Cử chỉ": "👍 👎 👏 🙌 🙏 💪 👌 ✌️ 🤞 🫶 👀 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 💯 🔥 ✨ ⭐ 🎉 💢 💤 💦 🌸 🍿 ☕ 🍜 🐱 🐶",
    "Kaomoji": "(◕‿◕)|(｡♥‿♥｡)|(≧▽≦)|ヾ(≧▽≦*)o|(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧|(๑•̀ㅂ•́)و✧|(ง •̀_•́)ง|(￣▽￣)|(¬‿¬)|(⊙_⊙)|(・_・;)|(；一_一)|(╥﹏╥)|(ಥ﹏ಥ)|(｡•́︿•̀｡)|(*/ω＼*)|(´｡• ω •｡`)|ʕ•ᴥ•ʔ|(=^･ω･^=)|(っ˘ω˘ς )|ヽ(°〇°)ﾉ|¯\\_(ツ)_/¯|(╯°□°）╯︵ ┻━┻|┬─┬ノ( º _ ºノ)"
  };
  const emoList = k => k === "Kaomoji" ? EMO[k].split("|") : EMO[k].split(" ");
  const STK = "stickers\\/[A-Za-z0-9._-]+\\.(?:gif|png|webp|jpg|svg)|https:\\/\\/cdn\\.discordapp\\.com\\/emojis\\/\\d{15,21}\\.(?:png|gif|webp)";
  const stickers = () => { try { const re = new RegExp("^(?:" + STK + ")$"); return (DATA.site.stickers || []).filter(x => re.test(x.p || "")) } catch (e) { return [] } };
  const packs = () => { const m = new Map(); stickers().forEach(x => { const g = (x.g || "Nhãn dán").trim() || "Nhãn dán"; if (!m.has(g)) m.set(g, []); m.get(g).push(x) }); return m };
  const recent = () => { try { return JSON.parse(ls.get("cmtRecent") || "[]") } catch (e) { return [] } };
  const useRecent = (k, v) => { const L = [{ k, v }, ...recent().filter(x => !(x.k === k && x.v === v))].slice(0, 24); ls.set("cmtRecent", JSON.stringify(L)) };
  const gkey = () => { try { return (DATA.site.giphy || "").trim() } catch (e) { return "" } };
  const modPw = () => { try { return ADM ? ls.get("cmtMod") || "" : "" } catch (e) { return "" } };
  const MRE = /\[s:(stickers\/[A-Za-z0-9._-]+\.(?:gif|png|webp|jpg|svg)|https:\/\/cdn\.discordapp\.com\/emojis\/\d{15,21}\.(?:png|gif|webp))\]|(https:\/\/media\.giphy\.com\/media\/[A-Za-z0-9]+\/(?:200|giphy)\.gif|https:\/\/media\d*\.tenor\.com\/(?:m\/)?[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+\.gif)/g;
  const BIG = /^(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️|\s){1,24}$/u;
  function cBody(t) {
    let out = "", last = 0, n = 0, txt = ""; t = String(t);
    for (const m of t.matchAll(MRE)) {
      const seg = t.slice(last, m.index); out += esc(seg); txt += seg; last = m.index + m[0].length;
      if (n >= 4) { out += esc(m[0]); continue } n++;
      out += m[1] ? `<img class="cms" src="${esc(m[1])}" alt="Nhãn dán" loading="lazy">` : `<img class="cmg" src="${esc(m[2])}" alt="GIF" loading="lazy">`;
    }
    out += esc(t.slice(last)); txt += t.slice(last);
    return { html: out.replace(/\n{3,}/g, "\n\n"), big: !n && txt.trim().length > 0 && BIG.test(txt.trim()) };
  }
  // Đổi link GIF người dùng dán thành link chuẩn (chỉ nhận GIPHY, Tenor)
  function gifUrl(u) {
    u = String(u || "").trim().split(/[?#]/)[0];
    let m = /^https?:\/\/(?:www\.)?giphy\.com\/(?:gifs|embed)\/(?:[\w-]*-)?([A-Za-z0-9]+)\/?$/.exec(u) || /^https?:\/\/(?:media\d*|i)\.giphy\.com\/media\/(?:v1\.[^/]+\/)?([A-Za-z0-9]+)\/[\w.-]+\.(?:gif|webp|mp4)$/.exec(u);
    if (m) return `https://media.giphy.com/media/${m[1]}/200.gif`;
    m = /^https:\/\/(media\d*\.tenor\.com\/(?:m\/)?[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+\.gif)$/.exec(u);
    return m ? "https://" + m[1] : "";
  }
  const mine = () => { try { return JSON.parse(ls.get("cmtMine") || "{}") } catch (e) { return {} } };
  const rel = ts => { const d = new Date(ts), m = Math.round((Date.now() - d) / 6e4); return m < 1 ? "Vừa xong" : m < 60 ? m + " phút trước" : m < 1440 ? Math.floor(m / 60) + " giờ trước" : m < 10080 ? Math.floor(m / 1440) + " ngày trước" : d.toLocaleDateString("vi-VN") };
  const sha = async t => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, "0")).join("");
  const newTok = () => { const a = new Uint8Array(24); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)).replace(/[+/=]/g, c => ({ "+": "-", "/": "_", "=": "" })[c]) };
  const AVM = {};
  const cItem = (c, M, mod, reply) => { const b = cBody(c.body), u = c.user_id && AVM[c.user_id], g = c.user_id && window.KGP && KGP.card(c.user_id), eq = (g && g.eq) || {}, cf = g && window.KG ? KG.cframe(eq) : { cls: "", style: "" }, av = `<span class="cav" style="--h:${hue(c.name)}" aria-hidden="true">${u && isCover(u.avatar_url) ? `<img src="${esc(u.avatar_url)}" alt="" loading="lazy">` : esc([...c.name][0] || "?")}</span>`, nm = g && window.KG ? KG.name(c.name, eq) : esc(c.name); return `<article class="cmi${c.hidden ? " cmhid" : ""}" data-cid="${c.id}">${g && window.KG ? KG.avatar(av, eq, reply ? 30 : 36) : av}<div class="cmc${cf.cls}" style="${cf.style}"><div class="cmh">${u ? `<a href="#tg/${esc(c.user_id)}"><b>${nm}</b></a>` : `<b>${esc(c.name)}</b>`}${g ? `<em class="klvb" title="Cấp độ">Lv.${(+g.level || 1).toLocaleString("vi-VN")}</em>${eq.title && window.KG ? KG.title(eq.title) : ""}` : c.user_id ? '<em class="cmu" title="Đã đăng nhập tài khoản Kenrori">Thành viên</em>' : ""}<time datetime="${esc(c.created_at)}" title="${esc(new Date(c.created_at).toLocaleString("vi-VN"))}">${rel(c.created_at)}</time>${c.hidden ? '<em class="cmu cmx2">Đã ẩn</em>' : ""}</div><div class="cmt${b.big ? " big" : ""}">${b.html}</div><div class="cma">${reply ? "" : '<button type="button" data-crep>Trả lời</button>'}${M[c.id] && !mod ? '<button type="button" data-cdel>Xóa</button>' : ""}${mod ? `<button type="button" data-cmod="${c.hidden ? "show" : "hide"}">${c.hidden ? "Hiện lại" : "Ẩn"}</button><button type="button" data-cmod="delete">Xóa</button><button type="button" data-cmod="ban">Chặn người này</button>` : ""}</div>${reply ? "" : '<div class="cmrs"></div><div class="cmrf"></div>'}</div></article>` };
  const SMILE = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></svg>';
  const cForm = reply => `<form class="cmf${reply ? " cmf2" : ""}" novalidate><div class="cmr"><input name="n" maxlength="40" placeholder="Tên của bạn" aria-label="Tên của bạn" autocomplete="nickname" required><input name="w" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"></div><textarea name="b" maxlength="2000" rows="${reply ? 2 : 3}" placeholder="${reply ? "Viết câu trả lời" : "Viết bình luận của bạn"}" aria-label="Nội dung bình luận" required></textarea><div class="cmtb"><button type="button" class="cmtool" data-cpick="emo" aria-expanded="false" aria-label="Chèn biểu cảm">${SMILE}<span class="cmtl">Biểu cảm</span></button><button type="button" class="cmtool" data-cpick="gif" aria-expanded="false" aria-label="Chèn GIF"><b class="gifb">GIF</b></button><span class="cmk"></span>${reply ? '<button type="button" class="btn sm" data-ccancel>Hủy</button>' : ""}<button class="btn pri${reply ? " sm" : ""}">${reply ? "Trả lời" : "Gửi bình luận"}</button></div><div class="cmp" hidden></div>${reply ? "" : '<small class="cmhint">Không cần tài khoản. Hãy lịch sự và đừng tiết lộ nội dung chương sau.</small>'}<p class="cme" role="alert"></p></form>`;
  const insertAt = (ta, t, own) => { const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s, pre = ta.value.slice(0, s), post = ta.value.slice(e); const ins = own ? (pre && !/\n$/.test(pre) ? "\n" : "") + t + "\n" : t; ta.value = (pre + ins + post).slice(0, 2000); const p = Math.min(2000, pre.length + ins.length); ta.focus(); ta.setSelectionRange(p, p); ta.dispatchEvent(new Event("input", { bubbles: true })) };
  function emoPanel(pn) {
    const P = packs(), stOk = new Set(stickers().map(x => x.p)), R = recent().filter(x => x.k === "e" || stOk.has(x.v));
    const tabs = [...(R.length ? [{ id: "\u0001recent", l: "Hay dùng" }] : []), ...Object.keys(EMO).map(k => ({ id: k, l: k })), ...[...P].map(([g, a]) => ({ id: "\u0002" + g, l: g, ic: a[0].p }))];
    const cur = tabs.some(t => t.id === pn.dataset.tab) ? pn.dataset.tab : (tabs.find(t => t.id === ls.get("cmtTab")) || tabs[0]).id;
    pn.dataset.tab = cur; ls.set("cmtTab", cur);
    const stBtn = x => `<button type="button" data-cstk="${esc(x.p)}" title="${esc(x.n || "")}" aria-label="Emote ${esc(x.n || "")}"><img src="${esc(x.p)}" alt="" loading="lazy"></button>`, emBtn = x => `<button type="button" data-cemo="${esc(x)}">${esc(x)}</button>`;
    let body, cls;
    if (cur === "\u0001recent") { cls = "mix"; body = R.map(x => x.k === "e" ? emBtn(x.v) : stBtn(stickers().find(s => s.p === x.v))).join("") }
    else if (cur[0] === "\u0002") { cls = "stk"; body = (P.get(cur.slice(1)) || []).map(stBtn).join("") }
    else { cls = cur === "Kaomoji" ? "kao" : "emo"; body = emoList(cur).map(emBtn).join("") }
    pn.innerHTML = `<div class="cmpt" role="tablist">${tabs.map(t => `<button type="button" role="tab" aria-selected="${t.id === cur}" class="${t.id === cur ? "on" : ""}" data-ctab="${esc(t.id)}" title="${esc(t.l)}">${t.ic ? `<img src="${esc(t.ic)}" alt="">` : ""}<span>${esc(t.l)}</span></button>`).join("")}</div><div class="cmpg ${cls}">${body}</div>`;
  }
  const gcache = {};
  async function gifSearch(pn, q) {
    const g = $(".cmgg", pn); if (!g) return; const k = gkey(); if (!k) return;
    const key = q || "\u0000trend"; g.innerHTML = '<p class="mu">Đang tìm GIF...</p>';
    try {
      let L = gcache[key];
      if (!L) { const u = q ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(k)}&q=${encodeURIComponent(q)}&limit=18&rating=pg-13&lang=vi` : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(k)}&limit=18&rating=pg-13`; const r = await fetch(u); if (r.status === 429) throw new Error("Đã hết lượt tìm GIF trong giờ này. Bạn vẫn dán được link GIF bên dưới."); if (!r.ok) throw new Error("Không tìm được GIF lúc này. Bạn vẫn dán được link GIF bên dưới."); L = ((await r.json()).data || []).filter(x => /^[A-Za-z0-9]+$/.test(x.id)).map(x => ({ id: x.id, t: x.title || "GIF" })); gcache[key] = L }
      if (!g.isConnected) return;
      g.innerHTML = L.length ? L.map(x => `<button type="button" data-cgif="${esc(x.id)}" title="${esc(x.t)}" aria-label="${esc(x.t)}"><img src="https://media.giphy.com/media/${esc(x.id)}/200w.gif" alt="" loading="lazy"></button>`).join("") : '<p class="mu">Không có GIF nào khớp.</p>';
    } catch (e) { if (g.isConnected) g.innerHTML = `<p class="mu">${esc(e.message)}</p>` }
  }
  function gifPanel(pn) {
    const k = gkey();
    pn.innerHTML = `${k ? '<input type="search" class="cmgq" placeholder="Tìm GIF, ví dụ: anime, cười, khóc" aria-label="Tìm GIF"><div class="cmpg gif cmgg"></div><p class="cmpw">Powered by GIPHY</p>' : ""}<div class="cmgl"><input type="url" class="cmgu" placeholder="Dán link GIF từ giphy.com hoặc tenor.com" aria-label="Link GIF"><button type="button" class="btn sm" data-cgadd>Thêm GIF</button></div><small class="mu">Trên GIPHY hoặc Tenor, bấm chuột phải vào GIF rồi chọn Sao chép địa chỉ hình ảnh, rồi dán vào đây.</small>`;
    if (k) gifSearch(pn, "");
  }
  window.CMT = {
    enabled: sbOk,
    mount(box, thread, title) {
      box.classList.add("cmw"); box.innerHTML = `<div class="sh"><h2>${esc(title || "Bình luận")} <span class="cmn"></span></h2></div>${cForm(false)}<div class="cml"><p class="mu">Đang tải bình luận...</p></div><div class="acts cmmw"><button type="button" class="btn" data-cmore hidden>Xem thêm bình luận</button></div>`;
      let page = 0, last = 0, gt = null;
      const nameOf = () => (prof && prof.display_name) || ls.get("cmtName") || "";
      const isMd = () => isMod() || !!modPw();
      box.querySelectorAll('input[name="n"]').forEach(i => i.value = nameOf());
      const draw = async more => {
        await init(); if (!box.isConnected) return;
        page = more ? page + 1 : 0;
        const [{ data: top, error }, { count }] = await Promise.all([sb.from("comments").select(CSEL).eq("thread", thread).is("parent_id", null).order("created_at", { ascending: false }).range(page * CPAGE, page * CPAGE + CPAGE - 1), sb.from("comments").select("id", { count: "exact", head: true }).eq("thread", thread)]);
        if (error) { $(".cml", box).innerHTML = `<p class="mu">${esc(/comments|relation|schema cache/i.test(error.message || "") ? "Bình luận chưa được bật trên máy chủ. Quản trị viên cần chạy file binh-luan.sql trong Supabase." : viMsg(error))}</p>`; return }
        const ids = (top || []).map(c => c.id), { data: reps } = ids.length ? await sb.from("comments").select(CSEL).in("parent_id", ids).order("created_at", { ascending: true }) : { data: [] };
        const uids = [...new Set([...(top || []), ...(reps || [])].map(c => c.user_id).filter(Boolean))];
        if (uids.length) { try { const { data: ps } = await sb.from("profiles").select("id,display_name,avatar_url").in("id", uids); (ps || []).forEach(p => AVM[p.id] = p) } catch (e) {} if (window.KGP) await KGP.cards(uids) }
        const M = mine(), mod = isMd(), html = (top || []).map(c => cItem(c, M, mod, false)).join("");
        if (!box.isConnected) return; const L = $(".cml", box);
        if (more) L.insertAdjacentHTML("beforeend", html); else L.innerHTML = html || '<p class="mu cm0">Chưa có bình luận nào. Hãy là người đầu tiên.</p>';
        (reps || []).forEach(r => { const host = L.querySelector(`.cmi[data-cid="${r.parent_id}"] .cmrs`); if (host) host.insertAdjacentHTML("beforeend", cItem(r, M, mod, true)) });
        $(".cmn", box).textContent = count ? `(${count})` : ""; $("[data-cmore]", box).hidden = (top || []).length < CPAGE;
        box.querySelectorAll('input[name="n"]').forEach(i => { if (!i.value) i.value = nameOf() });
      };
      const closePick = f => { const pn = $(".cmp", f); if (pn) { pn.hidden = true; pn.dataset.kind = "" } f.querySelectorAll("[data-cpick]").forEach(b => b.setAttribute("aria-expanded", "false")) };
      const send = async (f, parent) => {
        const n = f.n.value.trim().replace(/\s+/g, " "), b = f.b.value.trim(), er = $(".cme", f), btn = f.querySelector("button.pri");
        er.textContent = "";
        if (f.w.value) { f.reset(); return }
        if (!n) { er.textContent = "Hãy nhập tên để bình luận."; f.n.focus(); return }
        if (!b) { er.textContent = "Hãy viết nội dung, chọn biểu cảm hoặc GIF."; f.b.focus(); return }
        if (Date.now() - last < 8000) { er.textContent = "Bạn gửi hơi nhanh, đợi vài giây rồi thử lại."; return }
        btn.disabled = true;
        try {
          await init(); const tok = newTok(), row = { thread, name: n, body: b, token_hash: await sha(tok) }; if (parent) row.parent_id = parent;
          const { data, error } = await sb.from("comments").insert(row).select("id").single();
          if (error) { er.textContent = viMsg(error); return }
          last = Date.now(); ls.set("cmtName", n); const M = mine(); M[data.id] = tok; const k = Object.keys(M); if (k.length > 300) k.slice(0, k.length - 300).forEach(x => delete M[x]); ls.set("cmtMine", JSON.stringify(M));
          f.b.value = ""; $(".cmk", f).textContent = ""; closePick(f); toast(parent ? "Đã gửi câu trả lời" : "Đã gửi bình luận"); await draw(false);
        } catch (e) { er.textContent = viMsg(e) } finally { btn.disabled = false }
      };
      box.addEventListener("submit", e => { e.preventDefault(); const f = e.target, it = f.closest(".cmi"); send(f, it ? +it.dataset.cid : null) });
      box.addEventListener("input", e => {
        if (e.target.name === "b") { const k = $(".cmk", e.target.form), n = e.target.value.length; k.textContent = n > 1500 ? `${n}/2000` : "" }
        if (e.target.classList.contains("cmgq")) { const pn = e.target.closest(".cmp"), q = e.target.value.trim(); clearTimeout(gt); gt = setTimeout(() => gifSearch(pn, q), 600) }
      });
      box.addEventListener("keydown", e => { if (e.key === "Escape") { const f = e.target.closest && e.target.closest(".cmf"); if (f && !$(".cmp", f).hidden) { closePick(f); f.b.focus() } } if (e.key === "Enter" && e.target.classList.contains("cmgu")) { e.preventDefault(); e.target.closest(".cmp").querySelector("[data-cgadd]").click() } });
      box.addEventListener("click", async e => {
        const t = e.target, it = t.closest(".cmi"), id = it && +it.dataset.cid, f = t.closest(".cmf");
        if (t.closest("[data-cmore]")) return draw(true).catch(err => toast(viMsg(err)));
        if (t.closest("[data-ccancel]")) { t.closest(".cmrf").innerHTML = ""; return }
        const pk = t.closest("[data-cpick]");
        if (pk) { const pn = $(".cmp", f), kind = pk.dataset.cpick, open = !pn.hidden && pn.dataset.kind === kind; closePick(f); if (open) return; pn.dataset.kind = kind; kind === "emo" ? emoPanel(pn) : gifPanel(pn); pn.hidden = false; pk.setAttribute("aria-expanded", "true"); return }
        const tb = t.closest("[data-ctab]"); if (tb) { const pn = tb.closest(".cmp"); pn.dataset.tab = tb.dataset.ctab; emoPanel(pn); return }
        const em = t.closest("[data-cemo]"); if (em) { useRecent("e", em.dataset.cemo); return insertAt(f.b, em.dataset.cemo, false) }
        const sk = t.closest("[data-cstk]"); if (sk) { useRecent("s", sk.dataset.cstk); insertAt(f.b, `[s:${sk.dataset.cstk}]`, true); return closePick(f) }
        const gf = t.closest("[data-cgif]"); if (gf) { insertAt(f.b, `https://media.giphy.com/media/${gf.dataset.cgif}/200.gif`, true); return closePick(f) }
        if (t.closest("[data-cgadd]")) { const pn = t.closest(".cmp"), u = gifUrl($(".cmgu", pn).value); if (!u) { $(".cme", f).textContent = "Chỉ nhận link GIF từ GIPHY hoặc Tenor (link kết thúc bằng .gif, hoặc link trang giphy.com/gifs/...)."; return } $(".cme", f).textContent = ""; insertAt(f.b, u, true); return closePick(f) }
        if (t.closest("[data-crep]")) { const h = $(".cmrf", it); if (!h.innerHTML) { h.innerHTML = cForm(true); h.querySelector('input[name="n"]').value = nameOf() || ($('input[name="n"]', box) || {}).value || "" } h.querySelector("textarea").focus(); return }
        if (t.closest("[data-cdel]")) { if (!confirm("Xóa bình luận này?")) return; const M = mine(), { data, error } = await sb.rpc("delete_my_comment", { cid: id, tok: M[id] }); if (error || !data) return toast(error ? viMsg(error) : "Không xóa được bình luận này"); delete M[id]; ls.set("cmtMine", JSON.stringify(M)); toast("Đã xóa bình luận"); return draw(false) }
        const md = t.closest("[data-cmod]");
        if (md) {
          const act = md.dataset.cmod, ask = { delete: "Xóa hẳn bình luận này (và các câu trả lời của nó)?", ban: "Chặn người viết bình luận này? Mọi bình luận của họ sẽ bị ẩn và họ không bình luận được nữa." }[act];
          if (ask && !confirm(ask)) return;
          const { data, error } = await sb.rpc("mod_comment", { cid: id, p: modPw(), act });
          toast(error ? viMsg(error) : { hide: "Đã ẩn bình luận", show: "Đã hiện lại bình luận", delete: "Đã xóa bình luận", ban: `Đã chặn, ẩn ${data} bình luận` }[act]); return draw(false);
        }
      });
      const io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io.disconnect(); draw(false).catch(err => { if (box.isConnected) $(".cml", box).innerHTML = `<p class="mu">${esc(viMsg(err))}</p>` }) } }, { rootMargin: "600px" });
      io.observe(box);
    }
  };

  /* ---------- Giao diện riêng ---------- */
  const css = document.createElement("style");
  css.textContent = `.avs{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;font-size:.9rem;background:linear-gradient(160deg,hsl(var(--h) 55% 50%),hsl(calc(var(--h) + 50) 55% 32%))}
.m18{left:auto;right:6px;background:#d93636}
.mu.sm{font-size:.82rem;margin:0 0 6px}

.acbulk{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:var(--s1);margin-bottom:10px}.acbulk span{margin-right:auto;font-size:.88rem;color:var(--mu)}.acsel{width:auto;flex:none;margin:0 4px 0 0;accent-color:var(--ac)}
.htg span.hst{background:var(--ac);color:#fff}
.stmodg{max-width:640px;border:1px solid var(--bd);border-radius:12px;padding:22px 24px;background:var(--s1)}.stmodg h2{margin:0 0 8px}.stmodg ol{padding-left:20px;line-height:1.7}.stmodg code{background:var(--bg);padding:1px 6px;border-radius:4px;font-size:.85em}
.sttb{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:0 0 8px}.sttb small{color:var(--mu);font-size:.82rem}.sttb code{font-size:.8rem;background:var(--s1);padding:0 4px;border-radius:3px}
.stbig.drop{outline:2px dashed var(--ac);outline-offset:2px}
.stims{margin-top:10px;background:var(--s1);border-radius:8px;padding:10px 12px}.stims>b{display:block;font-size:.85rem;margin-bottom:8px}.stims>div{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.stim{position:relative;flex:none}.stim button{border:0;padding:0;background:none;cursor:pointer;display:block}.stim img{display:block;height:84px;width:auto;max-width:120px;object-fit:cover;border-radius:4px}
.stim .x{position:absolute;top:3px;right:3px;width:22px;height:22px;border-radius:50%;background:#000000b0;color:#fff;font-size:.7rem;display:grid;place-items:center}.stim .x:hover{background:#d93636}
.stbadimg{color:#d93636;font-size:.9rem;border-left:3px solid #d93636;padding-left:10px}
.stg2b{display:grid;grid-template-columns:minmax(0,1fr) 220px;gap:0 14px}.stg4{display:grid;grid-template-columns:minmax(0,1.4fr) repeat(2,minmax(0,1fr)) auto;gap:0 12px;align-items:end}.stg4.stil2{grid-template-columns:minmax(0,1fr) auto}.stg4 .btn{margin-bottom:1px}
.stvd{margin-top:14px;background:var(--s1);border-radius:8px;padding:10px 14px}.stvd summary{cursor:pointer;font-weight:500}.stvd input{background:var(--bg)}
em.vtag{font-style:normal;font-size:.75rem;background:var(--acs);color:var(--ac);padding:1px 7px;border-radius:4px;margin-right:6px}
.stil{border:1px solid var(--bd);border-radius:8px;padding:10px 12px;margin-top:12px}.stilh{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-bottom:8px}.stilh small{color:var(--mu);flex:1}
.stth{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}.stth img{height:110px;width:auto;border-radius:4px;flex:none}
@media(max-width:700px){.stg2b,.stg4,.stg4.stil2{grid-template-columns:minmax(0,1fr)}.stg4 .btn{margin-top:12px}}.m18p{background:#d93636;color:#fff}
.stgate{max-width:560px;margin:60px auto;text-align:center}.stgate .acts{justify-content:center}
.stf label{display:block;margin:14px 0 5px;font-weight:600;font-size:.9rem}.stf label small{font-weight:400;color:var(--mu)}
.stf input:not([type=checkbox]):not([type=file]),.stf textarea,.stf select{width:100%;font:inherit;color:var(--tx);background:var(--s1);border:1px solid transparent;border-radius:6px;padding:9px 12px;outline:none}
.stf input:focus,.stf textarea:focus,.stf select:focus{border-color:var(--ac);background:var(--bg)}
.stf textarea{resize:vertical;line-height:1.6}.stf .stbig{min-height:55vh;font-size:16px;line-height:1.8}
.stf .ck{display:flex;align-items:center;gap:8px;font-weight:500}.stf .ck input{accent-color:var(--ac)}
.authw{display:grid;place-items:center;padding:40px 0}.authc{width:min(420px,100%);border:1px solid var(--bd);border-radius:12px;padding:26px}.authc h2{margin:0 0 4px}
.btn.wide{width:100%;justify-content:center;margin-top:16px}.aerr{color:#d93636;font-size:.9rem;margin:10px 0 0;min-height:1px}
.alinks{display:flex;justify-content:space-between;gap:10px;margin-top:16px;font-size:.9rem}.alinks a{color:var(--ac);font-weight:600}
.stl{display:flex;flex-direction:column;gap:6px}.stli{display:flex;align-items:center;gap:10px;padding:10px;background:var(--s1);border-radius:6px}.stli.col{flex-wrap:wrap}.stli .th{width:40px}
.stb{flex:1;min-width:0;display:flex;flex-direction:column}.stb b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stb small{color:var(--mu);font-size:.82rem}
.stn{color:var(--mu);width:24px;text-align:right;font-size:.85rem}.btn.sm{padding:5px 11px;font-size:.85rem}.btn.dngb{color:#d93636}.btn.dngb:hover{background:#d93636;color:#fff}
em.okb,em.drf,em.bad{font-style:normal;font-weight:700;font-size:.75rem;padding:1px 7px;border-radius:4px;margin-right:4px}em.okb{background:#04a74b22;color:#04a74b}em.drf{background:var(--s2);color:var(--mu)}em.bad{background:#d9363622;color:#d93636}
.stwarn{background:#e89a0022;border-radius:8px;padding:10px 14px;font-size:.92rem}
.stg2{display:grid;grid-template-columns:180px minmax(0,1fr);gap:24px}.stg3{display:grid;grid-template-columns:1fr 1fr;gap:0 16px}
.stcv{display:grid;place-items:center;aspect-ratio:7/10;border:2px dashed var(--s2);border-radius:6px;background:var(--s1);overflow:hidden;position:relative;cursor:pointer;color:var(--mu);font-size:.85rem;text-align:center;padding:8px;margin:0!important;font-weight:500!important}
.stcv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.stcv:hover{border-color:var(--ac)}
.stchips{display:flex;flex-wrap:wrap;gap:6px}.stchips .fc{background:var(--s1)}.stchips .fc.on{background:var(--ac)}
.strules{max-width:72ch;line-height:1.8;padding-left:22px}.strules li{margin-bottom:8px}
#stu{text-decoration:none}.mtabs{margin:0 0 18px;width:max-content}.mtabs a{padding:6px 14px;border-radius:6px;font-weight:600;font-size:.9rem;color:var(--mu)}.mtabs a.on{background:var(--bg);color:var(--tx);box-shadow:0 1px 3px #0002}
.acf{display:flex;flex-direction:column;gap:10px;margin-bottom:8px}.acf input{width:min(420px,100%);border:0;background:var(--s1);border-radius:8px;padding:9px 12px;color:var(--tx);font:inherit;outline:none}.acf input:focus{box-shadow:0 0 0 2px var(--ac)}.acc{display:flex;flex-wrap:wrap;gap:6px}.acc .fc{background:var(--s1)}.acc .fc.on{background:var(--ac);color:#fff}
.acl{display:flex;flex-direction:column;gap:6px}.acr{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--s1);border-radius:10px}.acr.ban{opacity:.7}.avs.acav{width:44px;height:44px;font-size:1.1rem}
.acb{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}.act{display:flex;flex-wrap:wrap;align-items:center;gap:6px}.act a:hover b{color:var(--ac)}.acb small{color:var(--mu);font-size:.82rem;overflow-wrap:anywhere}
.aca{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:flex-end}.aca select{border:0;background:var(--bg);color:var(--tx);border-radius:6px;padding:6px 8px;font:inherit;font-size:.85rem}.acnote{margin-top:18px;font-size:.85rem}
@media(max-width:700px){.acr{flex-wrap:wrap}.aca{width:100%;justify-content:flex-start;padding-left:56px}}.avs{overflow:hidden;flex:none}.avs img{width:100%;height:100%;object-fit:cover;display:block}.cav{overflow:hidden}.cav img{width:100%;height:100%;object-fit:cover;display:block}.cmh a:hover b{color:var(--ac)}
.tgp{margin:0 0 10px}.tgb{position:relative;aspect-ratio:3/1;max-height:300px;width:100%;border-radius:14px;overflow:hidden;background:linear-gradient(120deg,hsl(var(--h) 60% 42%),hsl(calc(var(--h) + 60) 60% 26%))}.tgb img{width:100%;height:100%;object-fit:cover;display:block}
.tgh{display:flex;align-items:flex-start;gap:18px;padding:0 20px;margin-top:-52px;position:relative}.tgh .btn{margin-left:auto;margin-top:62px}
.avs.tga{width:116px;height:116px;font-size:2.8rem;border:5px solid var(--bg);box-shadow:0 8px 24px -10px #0008}
.tgi{min-width:0;padding-top:60px}.tgi h1{margin:0;font-family:var(--fd,inherit);font-size:clamp(1.5rem,3vw,2.2rem);font-weight:800;line-height:1.15;overflow-wrap:anywhere}.tgm{margin:4px 0 0;color:var(--mu);font-size:.9rem}
.tgs{display:flex;flex-wrap:wrap;gap:8px;margin:16px 20px 0}.tgs span{background:var(--s1);border-radius:999px;padding:5px 14px;font-size:.88rem;color:var(--mu)}.tgs b{color:var(--tx);margin-right:3px}
.tgbio{margin:14px 20px 0;max-width:72ch;white-space:pre-line;line-height:1.7}.tgl{display:flex;flex-wrap:wrap;gap:8px;margin:14px 20px 0}.tgl svg{width:16px;height:16px}
.pfw{max-width:720px}.pfh{position:relative;margin:6px 0 64px}.pfb{position:relative;display:block;aspect-ratio:3/1;border-radius:12px;overflow:hidden;cursor:pointer;background:linear-gradient(120deg,hsl(var(--h) 60% 42%),hsl(calc(var(--h) + 60) 60% 26%));margin:0!important}.pfb img{width:100%;height:100%;object-fit:cover;display:block}
.pfc{position:absolute;display:inline-flex;align-items:center;gap:6px;background:#000000a6;color:#fff;font-size:.82rem;font-weight:600;padding:6px 11px;border-radius:999px;pointer-events:none}.pfc svg{width:16px;height:16px}.pfb .pfc{right:12px;bottom:12px}
.pfa{position:absolute;left:20px;bottom:-56px;cursor:pointer;margin:0!important;border-radius:50%}.pfa .pfc{right:2px;bottom:4px;padding:7px;border-radius:50%}.pfa:hover .avs,.pfb:hover img{filter:brightness(.88)}
.pfx{display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;margin:0 0 4px 156px;min-height:24px}.pfx small{flex-basis:100%}.lnk{border:0;background:none;color:var(--ac);font-weight:600;padding:0;cursor:pointer}
.pfl{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:8px;margin-bottom:8px}.pfl .btn{margin:0}
@media(max-width:700px){.tgh{flex-direction:column;align-items:flex-start;padding:0 12px;margin-top:-44px;gap:10px}.avs.tga{width:88px;height:88px;font-size:2.1rem}.tgi{padding-top:0}.tgh .btn{margin:0}.tgs,.tgbio,.tgl{margin-left:12px;margin-right:12px}.pfx{margin-left:0;margin-top:8px}.pfl{grid-template-columns:110px minmax(0,1fr) auto}}
.cmw{max-width:var(--rw,760px);margin:40px auto 10px}.cmw .sh h2 .cmn{color:var(--mu);font-weight:600;font-size:1rem}
.cmf{position:relative;display:flex;flex-direction:column;gap:8px;background:var(--s1);border-radius:12px;padding:12px}
.cmf input,.cmf textarea{width:100%;font:inherit;color:var(--tx);background:var(--bg);border:1px solid transparent;border-radius:8px;padding:8px 11px;outline:none}.cmf input:focus,.cmf textarea:focus{border-color:var(--ac)}
.cmf textarea{resize:vertical;min-height:44px;line-height:1.55}.cmr{display:flex;gap:8px}.cmr input{max-width:260px}
.cmf .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.cmtb{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.cmk{margin-left:auto;color:var(--mu);font-size:.8rem}
.cmtool{display:inline-flex;align-items:center;gap:6px;border:0;background:var(--bg);color:var(--tx);border-radius:8px;padding:6px 10px;font-weight:600;font-size:.85rem;cursor:pointer}.cmtool:hover,.cmtool[aria-expanded=true]{background:var(--acs);color:var(--ac)}.cmtool svg{width:18px;height:18px}
.gifb{font-size:.66rem;font-weight:800;border:1.6px solid currentColor;border-radius:4px;padding:1px 4px;line-height:1.3}
.cmhint{color:var(--mu);font-size:.8rem}
.cmp{background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:8px}
.cmpt{display:flex;gap:4px;overflow-x:auto;margin-bottom:6px;scrollbar-width:none}.cmpt button{border:0;background:none;color:var(--mu);font-weight:700;font-size:.82rem;padding:5px 10px;border-radius:999px;white-space:nowrap;cursor:pointer}.cmpt button.on{background:var(--acs);color:var(--ac)}.cmpt button{display:inline-flex;align-items:center;gap:5px}.cmpt img{width:20px;height:20px;object-fit:contain}
.cmpg{display:grid;gap:2px;max-height:216px;overflow-y:auto}.cmpg button{border:0;background:none;border-radius:8px;cursor:pointer;color:var(--tx)}.cmpg button:hover{background:var(--s1)}
.cmpg.emo{grid-template-columns:repeat(auto-fill,minmax(40px,1fr))}.cmpg.emo button{font-size:1.45rem;height:42px}
.cmpg.kao{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}.cmpg.kao button{font-size:.92rem;padding:8px 6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cmpg.stk,.cmpg.mix{grid-template-columns:repeat(auto-fill,minmax(68px,1fr))}.cmpg.mix button{font-size:1.6rem;height:72px;display:grid;place-items:center}.cmpg.mix img{max-width:60px;max-height:60px}.cmpg.stk button{height:72px;display:grid;place-items:center}.cmpg.stk img{max-width:60px;max-height:60px}
.cmpg.gif{grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:6px;margin-top:8px}.cmpg.gif button{padding:0;height:90px;overflow:hidden;background:var(--s1)}.cmpg.gif img{width:100%;height:100%;object-fit:cover;display:block}
.cmpw{margin:6px 0 0;text-align:right;font-size:.7rem;font-weight:700;color:var(--mu)}
.cmgl{display:flex;gap:6px;margin:8px 0 4px}.cmgl input{flex:1;background:var(--s1)!important}.cmp small{font-size:.78rem}
.cme{margin:0;color:#d93636;font-size:.88rem}.cme:empty{display:none}
.cml{display:flex;flex-direction:column;gap:18px;margin-top:20px}
.cmi{display:flex;gap:12px}.cav{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:800;background:linear-gradient(160deg,hsl(var(--h) 55% 50%),hsl(calc(var(--h) + 50) 55% 32%))}
.cmc{flex:1;min-width:0}.cmh{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 8px}.cmh time{color:var(--mu);font-size:.8rem}
.cmu{font-style:normal;font-size:.7rem;font-weight:700;background:var(--acs);color:var(--ac);padding:1px 7px;border-radius:999px}.cmx2{background:#d9363622;color:#d93636}
.cmt{margin:3px 0 4px;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.6}.cmt.big{font-size:2.1rem;line-height:1.25}
.cmg{display:block;max-width:min(260px,100%);max-height:220px;border-radius:8px;margin:6px 0;background:var(--s1)}.cms{display:inline-block;width:80px;height:80px;object-fit:contain;vertical-align:bottom;margin:2px 2px 2px 0}
.cma{display:flex;gap:14px;flex-wrap:wrap}.cma button{border:0;background:none;padding:4px 0;color:var(--mu);font-weight:600;font-size:.84rem;cursor:pointer}.cma button:hover{color:var(--ac)}
.cmrs{display:flex;flex-direction:column;gap:14px;margin-top:10px}.cmrs .cav{width:28px;height:28px;font-size:.8rem}.cmrf .cmf{margin-top:10px}
.cmhid{opacity:.55}.cmmw{justify-content:center;margin-top:16px}
@media(max-width:700px){.cmr input{max-width:none}.cmtl{display:none}}
@media(max-width:700px){.stg2,.stg3{grid-template-columns:1fr}.stcv{width:140px}.stli{flex-wrap:wrap}.authc{padding:20px}}`;
  document.head.appendChild(css);
})();
