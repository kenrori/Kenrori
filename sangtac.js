/* =====================================================================
   Kenrori: khu Sáng tác (tác giả tự đăng truyện), dùng Supabase.
   File này dùng chung các hàm của index.html ($, esc, app, sec, ic, I, ...).
   ===================================================================== */
(() => {
  const ST_ROUTES = ["sang-tac", "st", "tg", "viet", "kiem-duyet", "noi-quy"];
  const GENRES = ["Hành động", "Phiêu lưu", "Lãng mạn", "Học đường", "Fantasy", "Isekai", "Hài hước", "Kinh dị", "Slice of Life", "Drama", "Sci-fi", "Võ thuật", "Tu tiên", "Trinh thám", "Đời thường", "Bi kịch"];
  const STS = { ongoing: ["Đang ra", "on"], completed: ["Hoàn thành", "done"], hiatus: ["Tạm ngưng", "pause"] };
  const WSEL = "id,title,summary,cover_url,genres,status,mature,updated_at,created_at,author_id,author:profiles(display_name),chapters(count)";
  const PG = 24, MAXC = 120000;
  let sb = null, me = null, prof = null, initP = null;

  const cfg = () => { try { return (DATA.site && DATA.site.sb) || {} } catch (e) { return {} } };
  const sbOk = () => /^https:\/\//.test(cfg().url || "") && !!cfg().key;
  const enabled = () => { try { return sbOk() && DATA.site.st === true } catch (e) { return false } };
  const isMod = () => !!(prof && !prof.banned && (prof.role === "mod" || prof.role === "admin"));
  const ss = { get: k => { try { return sessionStorage.getItem(k) } catch (e) {} }, set: (k, v) => { try { sessionStorage.setItem(k, v) } catch (e) {} } };
  const day = t => t ? String(t).slice(0, 10) : "";
  const stS = s => { const [l, c] = STS[s] || STS.ongoing; return `<span class="st ${c}">${l}</span>` };
  const cnt = w => (w.chapters && w.chapters[0] && w.chapters[0].count) || 0;
  const aName = w => (w.author && w.author.display_name) || "Tác giả";
  const words = t => (String(t || "").trim().match(/\S+/g) || []).length;
  const paras = t => String(t || "").normalize("NFC").split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join("");
  const isCover = u => /^https:\/\//.test(u || "");
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
        if ((u && u.id) !== (me && me.id)) { me = u; setTimeout(() => loadProf().then(authBtn), 0) }
        if (ev === "PASSWORD_RECOVERY") setTimeout(() => go("#viet/doi-mat-khau"), 0);
      });
      authBtn();
    })().catch(e => { initP = null; throw e });
    return initP;
  }
  async function loadProf() { if (!me) { prof = null; return } const { data } = await sb.from("profiles").select("*").eq("id", me.id).maybeSingle(); prof = data || null }
  function authBtn() {
    const el = $("#stu"); if (!el) return; el.hidden = !enabled();
    el.title = prof ? "Góc tác giả: " + prof.display_name : "Đăng nhập Góc tác giả";
    el.innerHTML = prof ? `<span class="avs" style="--h:${hue(prof.display_name)}">${esc([...prof.display_name][0] || "?")}</span>` : ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>');
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
  async function getChapters(wid) { const { data, error } = await sb.from("chapters").select("id,title,ord,words,published,updated_at").eq("work_id", wid).order("ord").order("created_at"); if (error) throw error; return data || [] }
  async function pWork(id) {
    const { data: w, error } = await sb.from("works").select(WSEL.replace(",chapters(count)", "") + ",visibility,hidden").eq("id", id).maybeSingle();
    if (error) { app.innerHTML = errBox(error); return } if (!w) { app.innerHTML = notice("Không tìm thấy truyện. Có thể truyện đã bị xóa, đang ở chế độ nháp hoặc đã bị ẩn."); return }
    document.title = `${w.title} | Kenrori`;
    if (gate(w)) { app.innerHTML = gate(w); return }
    const ch = await getChapters(id), own = me && me.id === w.author_id, pub = ch.filter(c => c.published), last = ls.get("st:" + id), rs = readSet(id);
    const lastOk = last && pub.some(c => c.id === last), tw = pub.reduce((a, c) => a + (c.words || 0), 0), bg = isCover(w.cover_url) ? `;background-image:url(&quot;${esc(w.cover_url)}&quot;)` : "";
    app.innerHTML = `<div class="tpb"><div class="hb" style="--h:${hue(w.title)}${bg}"></div></div>
<div class="tp"><div class="tph"><div class="cover tpcv" style="--h:${hue(w.title)}">${isCover(w.cover_url) ? imgTag(w.cover_url) : ""}<b>${esc(w.title)}</b></div>
<div class="tpt"><h1>${esc(w.title)}</h1><div class="crs"><a class="cr" href="#tg/${esc(w.author_id)}"><span>Tác giả</span><b>${esc(aName(w))}</b></a></div></div>
<div class="tpm"><div class="acts tpa2">${pub.length ? `<a class="btn pri big" href="#st/${esc(id)}/${esc(lastOk ? last : pub[0].id)}">${ic(I.play)}${lastOk ? "Đọc tiếp" : "Đọc từ đầu"}</a>` : ""}<button class="btn ico" title="Chia sẻ" aria-label="Chia sẻ" onclick="ST.share()">${ic(I.share)}</button>${pub.length > 1 ? `<span class="subl">${lastOk ? `<a href="#st/${esc(id)}/${esc(pub[0].id)}">Đọc từ đầu</a>` : ""}<a href="#st/${esc(id)}/${esc(pub[pub.length - 1].id)}">Chương mới nhất</a></span>` : ""}<span class="admb">${own ? `<a class="btn" href="#viet/w/${esc(id)}">${ic(I.edit)}Sửa truyện</a>` : me ? `<button class="btn" onclick="ST.report('${esc(id)}')">Báo cáo vi phạm</button>` : ""}</span></div>
<div class="tptg">${stS(w.status)}${w.mature ? '<span class="pill m18p">18+</span>' : ""}${(w.genres || []).map(g => `<span class="pill">${esc(g)}</span>`).join("")}</div>${own && (w.visibility !== "published" || w.hidden) ? `<div class="prog"><span><i>Trạng thái</i>${w.hidden ? "Đã bị ban kiểm duyệt ẩn" : "Bản nháp, chỉ bạn thấy được"}</span></div>` : ""}</div></div>
<div class="tpd"><p class="sum clamp" id="dsc">${esc(w.summary) || "Chưa có tóm tắt."}</p><button class="lnk" id="dmore" hidden>Xem thêm</button></div>
<div class="tpc"><div class="tpl"><div class="sh"><h2>Danh sách chương</h2></div><div id="cl">${ch.length ? ch.map(c => `<div class="chr"><a class="ch${rs.includes(c.id) ? " done" : ""}${c.id === last ? " cur" : ""}" href="#st/${esc(id)}/${esc(c.id)}"><span class="eye"></span><span class="cht">${esc(c.title)}${c.published ? "" : ' <em class="drf">Nháp</em>'}</span><small class="cw">${fmtN(c.words) || ""}</small><small>${ago(day(c.updated_at))}</small></a></div>`).join("") : '<p class="empty">Truyện chưa có chương nào.</p>'}</div></div>
<aside class="tpx"><div class="ibx"><h4>Tác giả</h4><div><a class="al" href="#tg/${esc(w.author_id)}">${esc(aName(w))}</a></div></div><div class="ibx"><h4>Loại</h4><div>Sáng tác</div></div><div class="ibx"><h4>Tình trạng</h4><div>${stS(w.status)}</div></div><div class="ibx"><h4>Số chương</h4><div>${pub.length}</div></div><div class="ibx"><h4>Tổng số chữ</h4><div>${fmtN(tw) || "Chưa có"}</div></div><div class="ibx"><h4>Ngày đăng</h4><div>${fmtD(day(w.created_at))}</div></div><div class="ibx"><h4>Cập nhật</h4><div>${fmtD(day(w.updated_at))}</div></div></aside></div></div>`;
    const dsc = $("#dsc"); if (dsc.scrollHeight > dsc.clientHeight + 2) { $("#dmore").hidden = false; $("#dmore").onclick = e => { const c = dsc.classList.toggle("clamp"); e.target.textContent = c ? "Xem thêm" : "Thu gọn" } }
  }

  /* ---------- Đọc chương ---------- */
  async function pRead(wid, cid) {
    const [{ data: w }, ch, { data: c, error }] = await Promise.all([sb.from("works").select("id,title,mature,author_id,author:profiles(display_name)").eq("id", wid).maybeSingle(), getChapters(wid), sb.from("chapters").select("id,title,content,words,updated_at,published").eq("id", cid).maybeSingle()]);
    if (error) { app.innerHTML = errBox(error); return } if (!w || !c) { app.innerHTML = notice("Không tìm thấy chương này."); return }
    if (gate(w)) { app.innerHTML = gate(w); return }
    document.title = `${c.title}, ${w.title} | Kenrori`;
    ls.set("st:" + wid, cid); const rs = readSet(wid); if (!rs.includes(cid)) { rs.push(cid); ls.set("str:" + wid, JSON.stringify(rs)) }
    const L = ch.filter(x => x.published || x.id === cid), i = L.findIndex(x => x.id === cid), base = `#st/${esc(wid)}`, prv = L[i - 1], nx = L[i + 1];
    RDKEY = d => { const t = L[i + d]; if (t) location.hash = `#st/${wid}/${t.id}` };
    const nav = `<div class="nv"><a class="btn" ${prv ? `href="${base}/${esc(prv.id)}"` : "disabled"}>${ic(I.prev)}Chương trước</a><a class="btn pri" ${nx ? `href="${base}/${esc(nx.id)}"` : "disabled"}>Chương sau${ic(I.next)}</a></div>`;
    app.innerHTML = `<div class="rbar"><a class="t" href="${base}" title="Về trang truyện">${esc(w.title)}</a><select aria-label="Chọn chương" onchange="location.hash='${base}/'+this.value">${L.map(x => `<option value="${esc(x.id)}" ${x.id === cid ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select>${me && me.id === w.author_id ? `<a class="btn" href="#viet/c/${esc(wid)}/${esc(cid)}">${ic(I.edit)}Sửa</a>` : ""}</div>
<header class="rh"><a class="rs" href="${base}">${esc(w.title)}</a><h1>${esc(c.title)}</h1><p id="meta">${esc(aName(w))} · ${fmtD(day(c.updated_at))} · ${fmtN(c.words) || "0 chữ"}${c.published ? "" : " · Bản nháp"}</p></header>${nav}
<article id="rd" class="rd novel ${RS.ff} ${RS.bg}">${paras(c.content) || '<p class="mu">Chương chưa có nội dung.</p>'}</article>
<section class="endc"><div class="endr">${prv ? `<a class="btn" href="${base}/${esc(prv.id)}">${ic(I.prev)}Chương trước</a>` : ""}${nx ? `<a class="nxc" href="${base}/${esc(nx.id)}"><span>Chương tiếp theo</span><b>${esc(nx.title)}</b>${ic(I.next)}</a>` : `<div class="nxc last"><span>Bạn đã đọc đến chương mới nhất</span><b>Hãy quay lại sau để đọc chương mới</b></div>`}</div><div class="endf"><a href="${base}">Danh sách chương</a><a href="#tg/${esc(w.author_id)}">Truyện khác của ${esc(aName(w))}</a>${me && me.id !== w.author_id ? `<a href="javascript:void 0" onclick="ST.report('${esc(wid)}','${esc(cid)}')">Báo cáo vi phạm</a>` : ""}</div></section>
<button class="fab" id="rsb" title="Tùy chỉnh đọc" aria-label="Tùy chỉnh đọc" aria-expanded="false" onclick="rsToggle()"><svg class="i" viewBox="0 0 24 24"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg></button><div class="rsp" id="rsp" hidden data-kind="novel"></div>`;    if (c.published && (DATA.site.cmt || "anon") === "anon") { const bx = document.createElement("section"); $("#rsb").before(bx); CMT.mount(bx, "st/" + cid) }
  }

  /* ---------- Trang tác giả ---------- */
  async function pWriter(uid) {
    const [{ data: p }, { data: ws, error }] = await Promise.all([sb.from("profiles").select("id,display_name,bio,banned,created_at").eq("id", uid).maybeSingle(), sb.from("works").select(WSEL).eq("author_id", uid).eq("visibility", "published").eq("hidden", false).order("updated_at", { ascending: false })]);
    if (error) { app.innerHTML = errBox(error); return } if (!p) { app.innerHTML = notice("Không tìm thấy tác giả."); return }
    document.title = `${p.display_name} | Kenrori`;
    app.innerHTML = `<section class="ap"><div class="av" style="--h:${hue(p.display_name)}">${esc([...p.display_name][0] || "?")}</div><div><h1>${esc(p.display_name)}</h1><p>Tác giả Sáng tác, tham gia từ ${fmtD(day(p.created_at))}${p.banned ? ". Tài khoản đang bị khóa" : ""}</p></div></section>${p.bio ? `<p class="sum" style="max-width:72ch;color:var(--mu)">${esc(p.bio)}</p>` : ""}` + sec("Truyện đã đăng", null, (ws || []).length ? `<div class="series">${ws.map(wCard).join("")}</div>` : '<p class="empty">Tác giả chưa đăng truyện công khai nào.</p>');
  }

  /* ---------- Góc tác giả: đăng nhập, đăng ký ---------- */
  function pAuth(mode) {
    document.title = "Góc tác giả | Kenrori";
    const T = { login: "Đăng nhập", reg: "Tạo tài khoản tác giả", forgot: "Quên mật khẩu" }[mode] || "Đăng nhập";
    app.innerHTML = `<section class="authw"><div class="authc stf"><h2>${T}</h2>${mode === "reg" ? `<p class="mu">Tài khoản dùng để đăng và quản lý truyện sáng tác của bạn. Tên hiển thị sẽ được ghi là tác giả trên truyện.</p>
<label for="a_name">Tên hiển thị</label><input id="a_name" maxlength="40" autocomplete="nickname">` : mode === "forgot" ? `<p class="mu">Nhập email tài khoản, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>` : `<p class="mu">Đăng nhập để viết và đăng truyện của bạn.</p>`}
<label for="a_email">Email</label><input id="a_email" type="email" autocomplete="email">
${mode === "forgot" ? "" : `<label for="a_pw">Mật khẩu${mode === "reg" ? " <small>(ít nhất 8 ký tự)</small>" : ""}</label><input id="a_pw" type="password" autocomplete="${mode === "reg" ? "new-password" : "current-password"}">`}
${mode === "reg" ? `<label class="ck"><input type="checkbox" id="a_ok"> Tôi đã đọc và đồng ý với <a class="al" href="#noi-quy" target="_blank">nội quy</a></label>` : ""}
<p class="aerr" id="a_err" role="alert"></p><button class="btn pri wide" id="a_go">${mode === "reg" ? "Tạo tài khoản" : mode === "forgot" ? "Gửi link đặt lại" : "Đăng nhập"}</button>
<div class="alinks">${mode === "login" || !mode ? `<a href="#viet/dang-ky">Tạo tài khoản mới</a><a href="#viet/quen-mat-khau">Quên mật khẩu?</a>` : `<a href="#viet">Đã có tài khoản? Đăng nhập</a>`}</div></div></section>`;
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
${id ? `<section class="sec"><div class="sh"><h2>Chương (${ch.length})</h2><a class="btn pri" href="#viet/c/${esc(id)}/moi">${ic(I.plus)}Thêm chương</a></div>${ch.length ? `<div class="stl">${ch.map((c, j) => `<div class="stli"><span class="stn">${j + 1}</span><span class="stb"><b>${esc(c.title)}</b><small>${c.published ? '<em class="okb">Đã đăng</em>' : '<em class="drf">Nháp</em>'} ${fmtN(c.words) || "0 chữ"}, sửa ${ago(day(c.updated_at)).toLowerCase()}</small></span><button class="btn sm" onclick="ST.mv('${esc(id)}',${j},-1)" ${j ? "" : "disabled"} title="Chuyển lên">↑</button><button class="btn sm" onclick="ST.mv('${esc(id)}',${j},1)" ${j < ch.length - 1 ? "" : "disabled"} title="Chuyển xuống">↓</button><a class="btn sm" href="#viet/c/${esc(id)}/${esc(c.id)}">Sửa</a><button class="btn sm dngb" onclick="ST.delCh('${esc(c.id)}','${esc(id)}')">Xóa</button></div>`).join("")}</div>` : '<p class="empty">Chưa có chương nào. Bấm "Thêm chương" để viết chương đầu tiên.</p>'}</section>` : ""}`;
    ST._ch = ch;
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
    let c = { title: "", content: "", published: true }, isNew = cid === "moi";
    if (!isNew) { const { data } = await sb.from("chapters").select("*").eq("id", cid).maybeSingle(); if (!data) { app.innerHTML = notice("Không tìm thấy chương."); return } c = data }
    const dk = `stdr:${wid}:${cid}`; let dr = null; try { dr = JSON.parse(ls.get(dk) || "null") } catch (e) {}
    const hasDr = dr && (dr.t !== c.title || dr.c !== c.content);
    document.title = (isNew ? "Thêm chương" : "Sửa chương") + " | Kenrori";
    app.innerHTML = `<section class="sec stf"><div class="sh"><h2>${isNew ? "Thêm chương" : "Sửa chương"}</h2><a class="more all" href="#viet/w/${esc(wid)}">Về truyện</a></div><p class="lead">${esc(w.title)}</p>
${hasDr ? `<p class="stwarn" id="c_dr">Có bản nháp chưa lưu trên máy này (${esc(new Date(dr.at).toLocaleString("vi-VN"))}). <button class="lnk" id="c_rs">Khôi phục</button> · <button class="lnk" id="c_rx">Bỏ qua</button></p>` : ""}
<label for="c_t">Tên chương</label><input id="c_t" maxlength="200" value="${esc(c.title)}" placeholder="Chương 1: ...">
<label for="c_c">Nội dung <small id="c_n"></small></label><textarea id="c_c" class="stbig" maxlength="${MAXC}" placeholder="Mỗi đoạn một dòng. Để một dòng trống hoặc xuống dòng giữa các đoạn.">${esc(c.content)}</textarea>
<label class="ck"><input type="checkbox" id="c_p" ${c.published ? "checked" : ""}> Đăng công khai <small>(bỏ chọn để lưu nháp, chỉ bạn thấy)</small></label>
<p class="aerr" id="c_err" role="alert"></p><div class="acts"><button class="btn pri" id="c_save">Lưu chương</button><button class="btn" id="c_pv">Xem trước</button>${isNew ? "" : `<a class="btn" href="#st/${esc(wid)}/${esc(cid)}">Xem trên web</a>`}</div></section>
<section class="sec" id="c_pvw" hidden><div class="sh"><h2>Xem trước</h2></div><header class="rh"><h1 id="c_pvt"></h1></header><article class="rd novel ${RS.ff} ${RS.bg}" id="c_pvc"></article></section>`;
    const upd = () => { const n = $("#c_c").value.length; $("#c_n").textContent = `(${words($("#c_c").value).toLocaleString("vi-VN")} chữ, ${n.toLocaleString("vi-VN")}/${MAXC.toLocaleString("vi-VN")} ký tự)` }; upd();
    let tmr = null; const keep = () => { clearTimeout(tmr); tmr = setTimeout(() => ls.set(dk, JSON.stringify({ t: $("#c_t").value, c: $("#c_c").value, at: Date.now() })), 800) };
    ["c_t", "c_c"].forEach(i => $("#" + i).addEventListener("input", () => { upd(); keep() }));
    if (hasDr) { $("#c_rs").onclick = () => { $("#c_t").value = dr.t; $("#c_c").value = dr.c; upd(); $("#c_dr").remove() }; $("#c_rx").onclick = () => { ls.del(dk); $("#c_dr").remove() } }
    $("#c_pv").onclick = () => { $("#c_pvw").hidden = false; $("#c_pvt").textContent = $("#c_t").value || "Chưa có tên chương"; $("#c_pvc").innerHTML = paras($("#c_c").value) || '<p class="mu">Chưa có nội dung.</p>'; $("#c_pvw").scrollIntoView({ behavior: "smooth" }) };
    $("#c_save").onclick = async e => {
      const b = e.currentTarget, err = m => { $("#c_err").textContent = m }, title = $("#c_t").value.trim(), content = $("#c_c").value.normalize("NFC");
      if (!title) return err("Hãy nhập tên chương."); if (!content.trim()) return err("Chương chưa có nội dung.");
      busy(b, true); err("");
      try {
        const row = { title, content, published: $("#c_p").checked };
        let r;
        if (isNew) { const ch = await getChapters(wid); row.work_id = wid; row.ord = ch.reduce((a, x) => Math.max(a, x.ord || 0), 0) + 1; r = await sb.from("chapters").insert(row).select("id").single() }
        else r = await sb.from("chapters").update(row).eq("id", cid).select("id").single();
        if (r.error) throw r.error; ls.del(dk); toast(row.published ? "Đã lưu và đăng chương" : "Đã lưu nháp");
        if (isNew) { ls.del(dk); location.replace(`#viet/c/${wid}/${r.data.id}`) } else busy(b, false);
      } catch (x) { err(viMsg(x)); busy(b, false) }
    };
  }

  /* ---------- Hồ sơ ---------- */
  function pProfile() {
    document.title = "Hồ sơ | Kenrori";
    app.innerHTML = `<section class="sec stf" style="max-width:640px"><div class="sh"><h2>Hồ sơ tác giả</h2><a class="more all" href="#viet">Về Góc tác giả</a></div>
<label for="p_n">Tên hiển thị</label><input id="p_n" maxlength="40" value="${esc(prof ? prof.display_name : "")}">
<label for="p_b">Giới thiệu bản thân <small>(hiện trên trang tác giả)</small></label><textarea id="p_b" maxlength="1000" rows="5">${esc(prof ? prof.bio : "")}</textarea>
<p class="aerr" id="p_err" role="alert"></p><div class="acts"><button class="btn pri" id="p_save">Lưu hồ sơ</button><a class="btn" href="#tg/${esc(me.id)}">Xem trang tác giả</a><a class="btn" href="#viet/doi-mat-khau">Đổi mật khẩu</a></div></section>`;
    $("#p_save").onclick = async e => { const n = $("#p_n").value.trim(); if (n.length < 2) { $("#p_err").textContent = "Tên hiển thị cần ít nhất 2 ký tự."; return } busy(e.currentTarget, true); const { error } = await sb.from("profiles").update({ display_name: n, bio: $("#p_b").value.trim() }).eq("id", me.id); if (error) { $("#p_err").textContent = viMsg(error); busy(e.currentTarget, false); return } await loadProf(); authBtn(); toast("Đã lưu hồ sơ"); busy(e.currentTarget, false) };
  }

  /* ---------- Kiểm duyệt ---------- */
  async function pMod() {
    document.title = "Kiểm duyệt | Kenrori";
    if (!me) return pAuth("login"); await loadProf(); if (!isMod()) { app.innerHTML = notice("Chỉ ban kiểm duyệt mới vào được trang này."); return }
    const [rp, hw, bu] = await Promise.all([
      sb.from("reports").select("id,reason,created_at,work_id,chapter_id,reporter:profiles(display_name),work:works(id,title,hidden,author_id),chapter:chapters(id,title)").eq("resolved", false).order("created_at", { ascending: false }).limit(100),
      sb.from("works").select("id,title,author_id,author:profiles(display_name)").eq("hidden", true).limit(100),
      sb.from("profiles").select("id,display_name").eq("banned", true).limit(100)]);
    const R = rp.data || [], H = hw.data || [], B = bu.data || [];
    app.innerHTML = `<section class="sec"><div class="sh"><h2>Kiểm duyệt</h2><a class="more all" href="#viet">Về Góc tác giả</a></div>${rp.error ? errBox(rp.error) : ""}
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
    if (!enabled()) { document.title = "Sáng tác | Kenrori"; app.innerHTML = ADM ? `<section class="sec" style="max-width:640px"><h2>Khu Sáng tác chưa được bật</h2><p>Chỉ bạn (quản trị viên) thấy mục này. Người đọc sẽ thấy mục Sáng tác và nút đăng ký sau khi bạn làm xong. Bình luận ẩn danh không cần bật khu này.</p><ol style="line-height:1.8"><li>Chạy file supabase-setup.sql rồi binh-luan.sql trong SQL Editor của Supabase.</li><li>Vào <a class="al" href="admin.html">trang quản trị</a>, mục Cài đặt trang web, điền Project URL và Publishable key của Supabase, tích ô Bật khu Sáng tác, bấm Lưu cài đặt.</li><li>Đợi 1–2 phút rồi tải lại trang này bằng Ctrl+F5.</li></ol></section>` : notice("Khu Sáng tác chưa được bật."); return }
    app.innerHTML = '<p class="empty">Đang tải...</p>';
    try { await init() } catch (e) { app.innerHTML = errBox(e); return }
    try {
      if (/^(access_token|error|type)=|&access_token=/.test(location.hash.slice(1))) return authCallback();
      if (a === "sang-tac") return await pList();
      if (a === "st") return parts[2] ? await pRead(parts[1], parts[2]) : await pWork(parts[1]);
      if (a === "tg") return await pWriter(parts[1]);
      if (a === "kiem-duyet") return await pMod();
      if (a === "viet") {
        const sub = parts[1];
        if (!me) return pAuth(sub === "dang-ky" ? "reg" : sub === "quen-mat-khau" ? "forgot" : "login");
        if (sub === "doi-mat-khau") return pNewPw();
        if (sub === "moi") return await pWorkEdit(null);
        if (sub === "w") return await pWorkEdit(parts[2]);
        if (sub === "c") return await pChapEdit(parts[2], parts[3]);
        if (sub === "ho-so") return pProfile();
        return await pMine();
      }
    } catch (e) { app.innerHTML = errBox(e) }
  }
  async function authCallback() {
    const h = location.hash.slice(1), err = /error_description=([^&]+)/.exec(h);
    if (err) { history.replaceState(null, "", location.pathname + "#viet"); app.innerHTML = notice("Link không hợp lệ hoặc đã hết hạn: " + esc(decodeURIComponent(err[1].replace(/\+/g, " "))) + `. <a class="al" href="#viet">Thử lại</a>`); return }
    await new Promise(r => setTimeout(r, 300)); const { data } = await sb.auth.getSession(); me = (data.session && data.session.user) || null; await loadProf(); authBtn();
    location.replace(location.pathname + (/type=recovery/.test(h) ? "#viet/doi-mat-khau" : "#viet"));
  }

  /* ---------- Hành động gọi từ nút ---------- */
  window.ST = {
    enabled, handles: a => ST_ROUTES.includes(a) || /^(access_token|error|type)=/.test(a || ""), route,
    async homeShelf() {
      const el = $("#st_home"); if (!el) return; if (!enabled()) return el.remove();
      try { await init(); const { data } = await sb.from("works").select(WSEL).eq("visibility", "published").eq("hidden", false).order("updated_at", { ascending: false }).limit(18); if (!$("#st_home")) return; if (!(data || []).length) return el.remove(); el.outerHTML = shelfSec("Sáng tác mới", "sang-tac", data.map(wCard)); shArrows() } catch (e) { el.remove() }
    },
    initBtn() { authBtn(); if (enabled()) { try { if (Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k))) init().catch(() => {}) } catch (e) {} } },
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
    async hide(wid, on) { const { error } = await sb.from("works").update({ hidden: on }).eq("id", wid); toast(error ? viMsg(error) : on ? "Đã ẩn truyện" : "Đã bỏ ẩn truyện"); if (!error) route() },
    async ban(uid, on) { if (on && !confirm("Khóa tài khoản này? Người dùng sẽ không đăng hoặc sửa được truyện, và truyện của họ bị ẩn khỏi web.")) return; const { error } = await sb.from("profiles").update({ banned: on }).eq("id", uid); toast(error ? viMsg(error) : on ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản"); if (!error) route() },
    async resolve(id) { const { error } = await sb.from("reports").update({ resolved: true }).eq("id", id); toast(error ? viMsg(error) : "Đã đánh dấu đã xử lý"); if (!error) route() }
  };


  /* ---------- Bình luận ẩn danh ---------- */
  const CSEL = "id,parent_id,name,body,user_id,hidden,created_at", CPAGE = 20;
  const EMO = {
    "Mặt cười": "😀 😁 😂 🤣 😊 😍 🥰 😘 😎 🤩 🥳 😏 😴 🤔 🤨 😐 🙄 😮 😱 😭 😢 😤 😡 🤬 🥺 😳 🤯 😇 🤗 🤭 🫣 😅 😆 🙃 😋 😜 🤪 😬 🫠 🤡 💀 👻",
    "Cử chỉ": "👍 👎 👏 🙌 🙏 💪 👌 ✌️ 🤞 🫶 👀 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 💯 🔥 ✨ ⭐ 🎉 💢 💤 💦 🌸 🍿 ☕ 🍜 🐱 🐶",
    "Kaomoji": "(◕‿◕)|(｡♥‿♥｡)|(≧▽≦)|ヾ(≧▽≦*)o|(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧|(๑•̀ㅂ•́)و✧|(ง •̀_•́)ง|(￣▽￣)|(¬‿¬)|(⊙_⊙)|(・_・;)|(；一_一)|(╥﹏╥)|(ಥ﹏ಥ)|(｡•́︿•̀｡)|(*/ω＼*)|(´｡• ω •｡`)|ʕ•ᴥ•ʔ|(=^･ω･^=)|(っ˘ω˘ς )|ヽ(°〇°)ﾉ|¯\\_(ツ)_/¯|(╯°□°）╯︵ ┻━┻|┬─┬ノ( º _ ºノ)"
  };
  const emoList = k => k === "Kaomoji" ? EMO[k].split("|") : EMO[k].split(" ");
  const stickers = () => { try { return (DATA.site.stickers || []).filter(x => /^stickers\/[A-Za-z0-9._-]+\.(gif|png|webp|jpg)$/.test(x.p || "")) } catch (e) { return [] } };
  const gkey = () => { try { return (DATA.site.giphy || "").trim() } catch (e) { return "" } };
  const modPw = () => { try { return ADM ? ls.get("cmtMod") || "" : "" } catch (e) { return "" } };
  const MRE = /\[s:(stickers\/[A-Za-z0-9._-]+\.(?:gif|png|webp|jpg))\]|(https:\/\/media\.giphy\.com\/media\/[A-Za-z0-9]+\/(?:200|giphy)\.gif|https:\/\/media\d*\.tenor\.com\/(?:m\/)?[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+\.gif)/g;
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
  const cItem = (c, M, mod, reply) => { const b = cBody(c.body); return `<article class="cmi${c.hidden ? " cmhid" : ""}" data-cid="${c.id}"><span class="cav" style="--h:${hue(c.name)}" aria-hidden="true">${esc([...c.name][0] || "?")}</span><div class="cmc"><div class="cmh"><b>${esc(c.name)}</b>${c.user_id ? '<em class="cmu" title="Đã đăng nhập tài khoản Kenrori">Thành viên</em>' : ""}<time datetime="${esc(c.created_at)}" title="${esc(new Date(c.created_at).toLocaleString("vi-VN"))}">${rel(c.created_at)}</time>${c.hidden ? '<em class="cmu cmx2">Đã ẩn</em>' : ""}</div><div class="cmt${b.big ? " big" : ""}">${b.html}</div><div class="cma">${reply ? "" : '<button type="button" data-crep>Trả lời</button>'}${M[c.id] && !mod ? '<button type="button" data-cdel>Xóa</button>' : ""}${mod ? `<button type="button" data-cmod="${c.hidden ? "show" : "hide"}">${c.hidden ? "Hiện lại" : "Ẩn"}</button><button type="button" data-cmod="delete">Xóa</button><button type="button" data-cmod="ban">Chặn người này</button>` : ""}</div>${reply ? "" : '<div class="cmrs"></div><div class="cmrf"></div>'}</div></article>` };
  const SMILE = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/></svg>';
  const cForm = reply => `<form class="cmf${reply ? " cmf2" : ""}" novalidate><div class="cmr"><input name="n" maxlength="40" placeholder="Tên của bạn" aria-label="Tên của bạn" autocomplete="nickname" required><input name="w" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"></div><textarea name="b" maxlength="2000" rows="${reply ? 2 : 3}" placeholder="${reply ? "Viết câu trả lời" : "Viết bình luận của bạn"}" aria-label="Nội dung bình luận" required></textarea><div class="cmtb"><button type="button" class="cmtool" data-cpick="emo" aria-expanded="false" aria-label="Chèn biểu cảm">${SMILE}<span class="cmtl">Biểu cảm</span></button><button type="button" class="cmtool" data-cpick="gif" aria-expanded="false" aria-label="Chèn GIF"><b class="gifb">GIF</b></button><span class="cmk"></span>${reply ? '<button type="button" class="btn sm" data-ccancel>Hủy</button>' : ""}<button class="btn pri${reply ? " sm" : ""}">${reply ? "Trả lời" : "Gửi bình luận"}</button></div><div class="cmp" hidden></div>${reply ? "" : '<small class="cmhint">Không cần tài khoản. Hãy lịch sự và đừng tiết lộ nội dung chương sau.</small>'}<p class="cme" role="alert"></p></form>`;
  const insertAt = (ta, t, own) => { const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? s, pre = ta.value.slice(0, s), post = ta.value.slice(e); const ins = own ? (pre && !/\n$/.test(pre) ? "\n" : "") + t + "\n" : t; ta.value = (pre + ins + post).slice(0, 2000); const p = Math.min(2000, pre.length + ins.length); ta.focus(); ta.setSelectionRange(p, p); ta.dispatchEvent(new Event("input", { bubbles: true })) };
  function emoPanel(pn) {
    const st = stickers(), tabs = [...Object.keys(EMO), ...(st.length ? ["Nhãn dán"] : [])], cur = pn.dataset.tab && tabs.includes(pn.dataset.tab) ? pn.dataset.tab : tabs[0];
    pn.dataset.tab = cur;
    pn.innerHTML = `<div class="cmpt" role="tablist">${tabs.map(t => `<button type="button" role="tab" aria-selected="${t === cur}" class="${t === cur ? "on" : ""}" data-ctab="${esc(t)}">${esc(t)}</button>`).join("")}</div><div class="cmpg ${cur === "Kaomoji" ? "kao" : cur === "Nhãn dán" ? "stk" : "emo"}">${cur === "Nhãn dán" ? st.map(x => `<button type="button" data-cstk="${esc(x.p)}" title="${esc(x.n || "")}" aria-label="Nhãn dán ${esc(x.n || "")}"><img src="${esc(x.p)}" alt="" loading="lazy"></button>`).join("") : emoList(cur).map(x => `<button type="button" data-cemo="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
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
        const em = t.closest("[data-cemo]"); if (em) return insertAt(f.b, em.dataset.cemo, false);
        const sk = t.closest("[data-cstk]"); if (sk) { insertAt(f.b, `[s:${sk.dataset.cstk}]`, true); return closePick(f) }
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
.m18{left:auto;right:6px;background:#d93636}.m18p{background:#d93636;color:#fff}
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
#stu{text-decoration:none}
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
.cmpt{display:flex;gap:4px;overflow-x:auto;margin-bottom:6px;scrollbar-width:none}.cmpt button{border:0;background:none;color:var(--mu);font-weight:700;font-size:.82rem;padding:5px 10px;border-radius:999px;white-space:nowrap;cursor:pointer}.cmpt button.on{background:var(--acs);color:var(--ac)}
.cmpg{display:grid;gap:2px;max-height:216px;overflow-y:auto}.cmpg button{border:0;background:none;border-radius:8px;cursor:pointer;color:var(--tx)}.cmpg button:hover{background:var(--s1)}
.cmpg.emo{grid-template-columns:repeat(auto-fill,minmax(40px,1fr))}.cmpg.emo button{font-size:1.45rem;height:42px}
.cmpg.kao{grid-template-columns:repeat(auto-fill,minmax(130px,1fr))}.cmpg.kao button{font-size:.92rem;padding:8px 6px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cmpg.stk{grid-template-columns:repeat(auto-fill,minmax(68px,1fr))}.cmpg.stk button{height:72px;display:grid;place-items:center}.cmpg.stk img{max-width:60px;max-height:60px}
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
