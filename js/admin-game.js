/* Kenrori quản trị: Tu luyện (cấu hình, trình tạo danh hiệu, thành tựu, Buff, phát thưởng, nhật ký) và Quản lý thể loại.
   Chạy trong admin.html, sau script chính và game.js. Mọi thay đổi kinh tế đi qua hàm game_admin trên Supabase,
   được xác thực bằng mật khẩu kiểm duyệt của chủ web. */
(() => {
  const Q = s => document.querySelector(s), QA = (s, r = document) => [...r.querySelectorAll(s)];
  const sbc = () => (data && data.site && data.site.sb) || {}, pw = () => localStorage.getItem("cmtMod") || "";
  async function GA(act, a = {}) {
    const c = sbc(); if (!/^https:\/\//.test(c.url || "") || !c.key) throw new Error("Chưa kết nối Supabase. Điền Project URL và key trong Cài đặt trang web.");
    if (!pw()) throw new Error("Chưa nhập mật khẩu kiểm duyệt. Vào Cài đặt trang web › Bình luận để nhập.");
    const r = await fetch(c.url.replace(/\/+$/, "") + "/rest/v1/rpc/game_admin", { method: "POST", headers: { apikey: c.key, "Content-Type": "application/json" }, body: JSON.stringify({ p: pw(), act, a }) });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error(r.status === 404 ? "Máy chủ chưa có hệ thống Tu luyện. Hãy chạy file tu-luyen.sql trong Supabase." : (j && j.message) || "Supabase báo lỗi " + r.status);
    return j;
  }
  const slug = s => String(s || "").replace(/đ/g, "d").replace(/Đ/g, "D").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const n0 = v => (+v || 0).toLocaleString("vi-VN");
  const opt = (o, v) => Object.entries(o).map(([k, l]) => `<option value="${esc(k)}"${k === v ? " selected" : ""}>${esc(l)}</option>`).join("");
  const err = e => log("❌ " + (e && e.message || e));

  /* =================== TU LUYỆN =================== */
  let G = { tab: "cfg", items: null, achs: null, cfg: null, edit: null };
  function gmOpen() {
    const el = Q("#gm"); if (!el || el.dataset.ready) return; el.dataset.ready = 1;
    el.innerHTML = `<p class="mu">Hệ thống cấp độ, ${esc("Linh Thạch")}, danh hiệu và cửa hàng cho người đọc có tài khoản. Cần chạy <b>tu-luyen.sql</b> trong Supabase và nhập mật khẩu kiểm duyệt ở Cài đặt trang web.</p>
<label class="ck"><input type="checkbox" id="gm_on"${data.site && data.site.game ? " checked" : ""}> Hiện hệ thống Tu luyện trên web (menu, cấp độ trong bình luận, cửa hàng)</label>
<div class="gtabs" role="tablist">${[["cfg", "Cấu hình"], ["items", "Danh hiệu và vật phẩm"], ["ach", "Thành tựu"], ["buff", "Buff và sự kiện"], ["give", "Phát thưởng"], ["log", "Nhật ký"]].map(([k, l]) => `<button type="button" data-g="${k}" class="chip${k === G.tab ? " on" : ""}">${l}</button>`).join("")}</div><div id="gmb"></div>`;
    Q("#gm_on").onchange = e => run(async () => { data.site.game = e.target.checked; await save(e.target.checked ? "Bật hệ thống Tu luyện" : "Tắt hệ thống Tu luyện"); log("✅ Đã lưu. Web cập nhật sau ít phút.") });
    el.querySelector(".gtabs").onclick = e => { const b = e.target.closest("[data-g]"); if (!b) return; G.tab = b.dataset.g; QA(".gtabs .chip").forEach(x => x.classList.toggle("on", x === b)); draw() };
    draw();
  }
  async function draw() {
    const b = Q("#gmb"); b.innerHTML = '<p class="mu">Đang tải...</p>';
    try { ({ cfg: dCfg, items: dItems, ach: dAch, buff: dBuff, give: dGive, log: dLog })[G.tab](b) } catch (e) { b.innerHTML = `<p class="aerr">${esc(e.message)}</p>` }
  }
  const fail = (b, e) => { b.innerHTML = `<p class="aerr">${esc(e.message)}</p>` };

  /* ---------- Cấu hình ---------- */
  async function dCfg(b) {
    let R; try { R = await GA("get_config") } catch (e) { return fail(b, e) }
    const c = R.cfg; G.cfg = c;
    const f = (k, l, v, t = "number", x = "") => `<div><label>${l}</label><input data-c="${k}" type="${t}" value="${esc(v)}" ${x}></div>`;
    const need = lv => Math.max(10, Math.round(c.curve.base * Math.pow(lv, c.curve.growth) + c.curve.flat));
    const sum = to => { let s = 0; for (let i = 1; i < to; i++) s += need(i); return s };
    const perH = c.exp_per_min * 60 + c.exp_complete * 5;
    b.innerHTML = `<h4>Bật / tắt</h4><div class="g4">${[["on.level", "Cấp độ và EXP"], ["on.stones", c.currency], ["on.shop", "Cửa hàng"], ["on.encounter", "Kỳ ngộ"]].map(([k, l]) => `<label class="ck"><input type="checkbox" data-c="${k}"${k.split(".").reduce((o, x) => o[x], c) ? " checked" : ""}> ${esc(l)}</label>`).join("")}</div>
<h4>Tiền tệ và hiệu ứng</h4><div class="g4">${f("currency", "Tên tiền tệ", c.currency, "text")}<div><label>Mức hiệu ứng mặc định</label><select data-c="fx_default">${opt({ full: "Đầy đủ", simple: "Đơn giản", off: "Tắt" }, c.fx_default)}</select></div>${f("tz", "Múi giờ tính ngày", c.tz, "text")}</div>
<h4>Kinh nghiệm</h4><div class="g4">${f("exp_per_min", "EXP mỗi phút đọc", c.exp_per_min, "number", 'step="0.1" min="0"')}${f("exp_complete", "EXP hoàn thành chương", c.exp_complete)}${f("exp_new_series", "EXP đọc bộ mới", c.exp_new_series)}${f("exp_daily", "EXP đăng nhập mỗi ngày", c.exp_daily)}
${f("min_complete_sec", "Giây tối thiểu để tính hoàn thành", c.min_complete_sec)}${f("min_complete_ratio", "Phải đọc tới (0–1)", c.min_complete_ratio, "number", 'step="0.05" min="0" max="1"')}${f("idle_ticks", "Số nhịp 30 giây không tương tác vẫn tính", c.idle_ticks)}${f("tick_max", "Giây tối đa mỗi nhịp", c.tick_max)}
${f("daily_exp_cap", "Giới hạn EXP mỗi ngày (0 = không giới hạn)", c.daily_exp_cap)}${f("max_level", "Cấp tối đa", c.max_level)}</div>
<h4>Công thức lên cấp</h4><p class="mu">EXP cần để lên cấp tiếp = gốc × cấp<sup>hệ số</sup> + cộng thêm.</p><div class="g4">${f("curve.base", "Gốc", c.curve.base, "number", 'step="1"')}${f("curve.growth", "Hệ số", c.curve.growth, "number", 'step="0.05"')}${f("curve.flat", "Cộng thêm", c.curve.flat)}</div>
<div class="lst" id="gm_curve">${[1, 10, 20, 50, 100, 500].map(l => `<div class="li"><span class="lt">Cấp ${l} → ${l + 1}: <b>${n0(need(l))}</b> EXP</span><small>Từ cấp 1 tới cấp ${l}: ${n0(sum(l))} EXP, khoảng ${n0(Math.round(sum(l) / perH))} giờ đọc</small></div>`).join("")}</div>
<h4>${esc(c.currency)} rơi khi đọc</h4><div class="g4">${f("drop.chance", "Xác suất mỗi nhịp 30 giây (0–1)", c.drop.chance, "number", 'step="0.01" min="0" max="1"')}${f("drop.cooldown", "Giây chờ giữa hai lần rơi", c.drop.cooldown)}${f("stones_daily", "Quà đăng nhập mỗi ngày", c.stones_daily)}${f("daily_stone_cap", "Giới hạn nhặt mỗi ngày (0 = không)", c.daily_stone_cap)}</div>
<table class="gtb"><thead><tr><th>Mức</th><th>Trọng số</th><th>Từ</th><th>Đến</th><th></th></tr></thead><tbody id="gm_tiers">${c.drop.tiers.map(t => `<tr><td><input value="${esc(t.n)}"></td><td><input type="number" step="0.1" value="${t.w}"></td><td><input type="number" value="${t.min}"></td><td><input type="number" value="${t.max}"></td><td><button type="button" class="sec sm" data-rm>Xóa</button></td></tr>`).join("")}</tbody></table><button type="button" class="sec sm" id="gm_taddt">Thêm mức rơi</button>
<h4>Kỳ ngộ</h4><div class="g4">${f("encounter.chance", "Xác suất mỗi nhịp", c.encounter.chance, "number", 'step="0.001" min="0" max="1"')}${f("encounter.cooldown_h", "Giờ chờ giữa hai lần", c.encounter.cooldown_h)}${f("encounter.secret_chance", "Xác suất kèm danh hiệu bí mật", c.encounter.secret_chance, "number", 'step="0.05" min="0" max="1"')}<div><label>${esc(c.currency)} (từ, đến)</label><div class="kmr2"><input data-c="encounter.stones.0" type="number" value="${c.encounter.stones[0]}"><input data-c="encounter.stones.1" type="number" value="${c.encounter.stones[1]}"></div></div><div><label>EXP (từ, đến)</label><div class="kmr2"><input data-c="encounter.exp.0" type="number" value="${c.encounter.exp[0]}"><input data-c="encounter.exp.1" type="number" value="${c.encounter.exp[1]}"></div></div></div>
<h4>Phần thưởng lên cấp</h4><div class="g4">${f("level_reward.stones", `${esc(c.currency)} mỗi cấp`, c.level_reward.stones)}${f("level_reward.per10", "Cộng thêm mỗi 10 cấp", c.level_reward.per10)}${f("level_reward.after100_every", "Sau cấp 100, thưởng mỗi N cấp", c.level_reward.after100_every)}${f("level_reward.after100_stones", "Số thưởng đó", c.level_reward.after100_stones)}</div>
<table class="gtb"><thead><tr><th>Cấp</th><th>${esc(c.currency)}</th><th>Vật phẩm (mã)</th><th></th></tr></thead><tbody id="gm_ms">${c.level_reward.milestones.map(m => `<tr><td><input type="number" value="${m.lv}"></td><td><input type="number" value="${m.stones || 0}"></td><td><input value="${esc(m.item || "")}" placeholder="vd: frame-tutien"></td><td><button type="button" class="sec sm" data-rm>Xóa</button></td></tr>`).join("")}</tbody></table><button type="button" class="sec sm" id="gm_madd">Thêm mốc</button>
<h4>Bảng xếp hạng</h4><label class="ck"><input type="checkbox" data-c="lb.exclude_admins"${c.lb.exclude_admins ? " checked" : ""}> Không xếp hạng tài khoản quản trị viên</label><label class="ck"><input type="checkbox" data-c="lb.exclude_granted"${c.lb.exclude_granted ? " checked" : ""}> Không xếp hạng tài khoản từng được cấp tài nguyên thủ công</label>
<h4>Tên chủ đề và phẩm chất</h4><div class="g4">${Object.entries(c.themes).map(([k, v]) => f("themes." + k, k, v, "text")).join("")}</div><div class="g4">${c.qualities.map((v, i) => f("qualities." + i, "Phẩm " + (i + 1), v, "text")).join("")}</div>
<div class="acts"><button type="button" id="gm_save">Lưu cấu hình</button><button type="button" class="sec" id="gm_reset">Khôi phục mặc định</button></div>`;
    b.addEventListener("click", e => { if (e.target.closest("[data-rm]")) e.target.closest("tr").remove() });
    Q("#gm_taddt").onclick = () => Q("#gm_tiers").insertAdjacentHTML("beforeend", '<tr><td><input value="Mới"></td><td><input type="number" value="1"></td><td><input type="number" value="1"></td><td><input type="number" value="10"></td><td><button type="button" class="sec sm" data-rm>Xóa</button></td></tr>');
    Q("#gm_madd").onclick = () => Q("#gm_ms").insertAdjacentHTML("beforeend", '<tr><td><input type="number" value="150"></td><td><input type="number" value="1000"></td><td><input></td><td><button type="button" class="sec sm" data-rm>Xóa</button></td></tr>');
    Q("#gm_save").onclick = () => run(async () => {
      const o = JSON.parse(JSON.stringify(c));
      QA("[data-c]", b).forEach(i => { const p = i.dataset.c.split("."); let t = o; for (const k of p.slice(0, -1)) t = t[k]; const k = p[p.length - 1]; t[k] = i.type === "checkbox" ? i.checked : i.type === "number" ? +i.value : i.value });
      o.drop.tiers = QA("#gm_tiers tr").map(r => { const v = QA("input", r).map(x => x.value); return { n: v[0], w: +v[1], min: +v[2], max: Math.max(+v[2], +v[3]) } });
      o.level_reward.milestones = QA("#gm_ms tr").map(r => { const v = QA("input", r).map(x => x.value); const m = { lv: +v[0], stones: +v[1] }; if (v[2].trim()) m.item = v[2].trim(); return m }).filter(m => m.lv > 0);
      await GA("set_config", { cfg: o }); log("✅ Đã lưu cấu hình Tu luyện. Có hiệu lực ngay, không cần đăng lại web."); draw();
    });
    Q("#gm_reset").onclick = () => run(async () => { if (!confirm("Xóa mọi chỉnh sửa và dùng lại cấu hình mặc định?")) return; await GA("set_config", { cfg: {} }); log("✅ Đã khôi phục cấu hình mặc định."); draw() });
  }

  /* ---------- Danh sách vật phẩm ---------- */
  const STL = { draft: "Nháp", on: "Đang bán", off: "Ngừng bán", limited: "Giới hạn", hidden: "Ẩn" };
  const OBT = { shop: "Cửa hàng", level: "Mốc cấp độ", achievement: "Thành tựu", event: "Sự kiện", admin: "Admin trao tặng", encounter: "Kỳ ngộ", secret: "Bí mật" };
  const F = { q: "", kind: "title", th: "", ql: "", st: "" };
  async function dItems(b) {
    try { [G.items, G.achs] = await Promise.all([GA("items"), GA("achs")]) } catch (e) { return fail(b, e) }
    b.innerHTML = `<div class="gfl"><input id="gi_q" placeholder="Tìm theo tên hoặc mã" value="${esc(F.q)}"><select id="gi_k">${opt(KG.KINDS, F.kind)}</select><select id="gi_t"><option value="">Mọi chủ đề</option>${opt(KG.THEMES, F.th)}</select><select id="gi_ql"><option value="">Mọi phẩm chất</option>${KG.QN.map((l, i) => `<option value="${i + 1}"${+F.ql === i + 1 ? " selected" : ""}>${l}</option>`).join("")}</select><select id="gi_s"><option value="">Mọi trạng thái</option>${opt(STL, F.st)}</select><button type="button" id="gi_new">Tạo mới</button></div><div id="gi_l" class="gil"></div>`;
    const L = () => G.items.filter(x => x.kind === F.kind && (!F.th || x.theme === F.th) && (!F.ql || x.quality === +F.ql) && (!F.st || x.status === F.st) && (!F.q || (x.name + x.id).toLowerCase().includes(F.q.toLowerCase())));
    const list = () => { const R = L(); Q("#gi_l").innerHTML = R.length ? R.map(x => `<div class="gii"><div class="gpv">${x.kind === "title" ? KG.title({ ...x, q: x.quality, ex: x.exclusive }) : KG.preview({ ...x, q: x.quality })}</div><div class="gim"><b>${esc(x.name)}</b><small>${esc(x.id)} · ${KG.QN[x.quality - 1]} · ${esc(KG.THEMES[x.theme] || x.theme)} · ${n0(x.price)} · ${(x.obtain || []).map(o => OBT[o] || o).join(", ")} · ${n0(x.owners)} người có</small></div><span class="lc${x.status === "on" ? " ok" : ""}">${STL[x.status]}</span><button type="button" class="sec sm" data-e="${esc(x.id)}">Sửa</button><button type="button" class="sec sm" data-d="${esc(x.id)}">Nhân bản</button></div>`).join("") : '<p class="mu">Không có vật phẩm nào khớp.</p>' };
    list();
    Q("#gi_q").oninput = e => { F.q = e.target.value; list() }; Q("#gi_k").onchange = e => { F.kind = e.target.value; list() }; Q("#gi_t").onchange = e => { F.th = e.target.value; list() }; Q("#gi_ql").onchange = e => { F.ql = e.target.value; list() }; Q("#gi_s").onchange = e => { F.st = e.target.value; list() };
    Q("#gi_new").onclick = () => editor({ id: "", kind: F.kind, name: "", description: "", quote: "", theme: F.th || "tutien", quality: +F.ql || 3, exclusive: false, style: { preset: F.kind === "title" ? `${F.th || "tutien"}-${+F.ql || 3}` : `${F.kind}-${F.th || "tutien"}` }, price: 500, level_req: 1, obtain: ["shop"], status: "draft", bundle: [], sort: 0 }, true);
    Q("#gi_l").onclick = e => { const x = e.target.closest("[data-e],[data-d]"); if (!x) return; const it = G.items.find(i => i.id === (x.dataset.e || x.dataset.d)); if (x.dataset.e) editor(JSON.parse(JSON.stringify(it)), false); else { const c = JSON.parse(JSON.stringify(it)); c.id = it.id + "-ban-sao"; c.name = it.name + " (bản sao)"; c.status = "draft"; editor(c, true) } };
  }

  /* ---------- Trình tạo danh hiệu / vật phẩm ---------- */
  const dt = v => v ? new Date(v).toISOString().slice(0, 16) : "";
  function editor(it, isNew) {
    const b = Q("#gmb"), T = it.kind === "title";
    let st = T ? KG.resolve(it.style, "title") : { ...KG.resolve(it.style, it.kind), preset: (it.style || {}).preset || "" };
    if (T) st.preset = (it.style || {}).preset || `${it.theme}-${it.quality}`;
    const iconPick = (cur, name) => `<div class="gic" data-name="${name}"><button type="button" data-ic="" class="${cur ? "" : "on"}" title="Không biểu tượng">∅</button>${Object.keys(KG.IC).map(k => `<button type="button" data-ic="${k}" class="${k === cur ? "on" : ""}" title="${k}">${KG.icon(k)}</button>`).join("")}</div>`;
    const colors = (arr, id) => `<div class="ggr" id="${id}">${arr.map(c => `<span><input type="color" value="${c.length === 4 ? "#" + [...c.slice(1)].map(x => x + x).join("") : c.slice(0, 7)}"><button type="button" class="sec sm" data-gx>✕</button></span>`).join("")}<button type="button" class="sec sm" data-ga>Thêm màu</button></div>`;
    const partRow = p => `<div class="gpt"><select data-p="t">${opt(KG.PARTS, p.t)}</select><label>Số hạt<input data-p="n" type="range" min="0" max="16" value="${p.n}"></label><select data-p="dir">${opt(KG.DIRS, p.dir)}</select><label>Tốc độ<input data-p="spd" type="range" min="0.3" max="3" step="0.1" value="${p.spd}"></label><label>Cỡ<input data-p="sz" type="range" min="0.4" max="2.5" step="0.1" value="${p.sz}"></label><input data-p="c" type="color" value="${p.c.slice(0, 7)}"><button type="button" class="sec sm" data-px>✕</button></div>`;
    const presetOpts = T ? Object.keys(KG.THEMES).flatMap(th => KG.QN.map((q, i) => [`${th}-${i + 1}`, `${KG.THEMES[th]}, ${q}`])) : Object.keys(KG.THEMES).map(th => [`${it.kind}-${th}`, `${KG.KINDS[it.kind]} ${KG.THEMES[th]}`]);
    b.innerHTML = `<div class="ged"><div class="gef">
<div class="acts" style="margin-top:0"><button type="button" class="sec" id="ge_back">← Danh sách</button></div>
<h4>${isNew ? "Tạo" : "Sửa"} ${esc(KG.KINDS[it.kind].toLowerCase())}</h4>
<div class="g2"><div><label>Tên</label><input id="ge_name" maxlength="60" value="${esc(it.name)}"></div><div><label>Mã (không dấu, gạch ngang)</label><input id="ge_id" value="${esc(it.id)}" ${isNew ? "" : "readonly"}></div>
<div class="full"><label>Mô tả</label><textarea id="ge_desc" rows="2" maxlength="500">${esc(it.description)}</textarea></div><div class="full"><label>Câu trích dẫn</label><input id="ge_quote" maxlength="200" value="${esc(it.quote)}"></div>
<div><label>Loại</label><select id="ge_kind" ${isNew ? "" : "disabled"}>${opt(KG.KINDS, it.kind)}</select></div><div><label>Chủ đề</label><select id="ge_theme">${opt(KG.THEMES, it.theme)}</select></div>
<div><label>Phẩm chất</label><select id="ge_q">${KG.QN.map((l, i) => `<option value="${i + 1}"${it.quality === i + 1 ? " selected" : ""}>${l}</option>`).join("")}</select></div><div><label class="ck" style="margin-top:34px"><input type="checkbox" id="ge_ex"${it.exclusive ? " checked" : ""}> Độc quyền</label></div></div>
<h4>Thư viện hiệu ứng mẫu</h4><div class="g2"><div><label>Mẫu</label><select id="ge_pre">${presetOpts.map(([k, l]) => `<option value="${k}"${k === st.preset ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></div><div><label>Hoặc chép hiệu ứng từ</label><select id="ge_copy"><option value="">Chọn vật phẩm</option>${G.items.filter(x => x.kind === it.kind).map(x => `<option value="${esc(x.id)}">${esc(x.name)}</option>`).join("")}</select></div></div><button type="button" class="sec sm" id="ge_apply">Áp dụng mẫu (ghi đè các ô hiệu ứng bên dưới)</button>
${T ? `<h4>Chữ</h4><div class="g2"><div><label>Phông chữ (đều hỗ trợ tiếng Việt)</label><select id="ge_font">${opt(Object.fromEntries(Object.entries(KG.FONTS).map(([k, v]) => [k, v[0]])), st.font)}</select></div><div><label>Màu chữ chính</label><input type="color" id="ge_color" value="${st.color.slice(0, 7)}"></div>
<div class="full"><label>Chuyển sắc (nhiều điểm màu)</label>${colors(st.grad, "ge_grad")}<label class="ck"><input type="checkbox" id="ge_gm"${st.gmove ? " checked" : ""}> Chữ chuyển sắc động</label></div>
<div><label>Viền chữ (px)</label><input type="range" id="ge_sw" min="0" max="3" step="0.1" value="${st.stroke.w}"></div><div><label>Màu viền chữ</label><input type="color" id="ge_sc" value="${st.stroke.c.slice(0, 7)}"></div>
<div><label>Phát sáng</label><input type="range" id="ge_gi" min="0" max="1" step="0.05" value="${st.glow.i}"></div><div><label>Màu phát sáng</label><input type="color" id="ge_gc" value="${st.glow.c.slice(0, 7)}"></div></div>
<h4>Biểu tượng</h4>${iconPick(st.icon, "icon")}<div class="g2"><div><label>Cỡ biểu tượng</label><input type="range" id="ge_isz" min="0.6" max="1.8" step="0.05" value="${st.isz}"></div><div><label>Màu biểu tượng</label><input type="color" id="ge_icc" value="${(st.iconc || "#ffffff").slice(0, 7)}"></div>
<div><label>Ảnh biểu tượng riêng (PNG, WebP, GIF, tối đa 300 KB)</label><input type="file" id="ge_img" accept="image/png,image/webp,image/gif,image/jpeg"><small class="mu" id="ge_imgv">${esc(st.img || "Chưa có")}</small> <button type="button" class="sec sm" id="ge_imgx">Bỏ ảnh</button></div>
<div><label>Nhân vật đi kèm</label><select id="ge_art"><option value="">Không</option>${[1, 2, 3, 4].map(n => `<option value="girl:${n}"${st.art === "girl:" + n ? " selected" : ""}>Nhân vật gốc ${n}</option>`).join("")}${st.art && !/^girl:/.test(st.art) ? `<option value="${esc(st.art)}" selected>Ảnh đã tải</option>` : ""}</select><input type="file" id="ge_artf" accept="image/png,image/webp,image/jpeg"></div></div>
<h4>Nền và đường viền</h4><div class="g2"><div><label>Kiểu nền</label><select id="ge_bg">${opt(KG.BGS, st.bg)}</select></div><div><label>Màu nền (2 màu)</label><div class="kmr2"><input type="color" id="ge_b1" value="${(st.bgc[0] || "#1b1630").slice(0, 7)}"><input type="color" id="ge_b2" value="${(st.bgc[1] || st.bgc[0] || "#2b2448").slice(0, 7)}"></div></div>
<div><label>Kiểu viền</label><select id="ge_bd">${opt(KG.BORDERS, st.border)}</select></div><div><label>Màu viền</label><input type="color" id="ge_bc" value="${st.bc.slice(0, 7)}"></div></div>
<h4>Lớp hiệu ứng (kết hợp nhiều lớp)</h4><div class="glay">${Object.entries(KG.LAYERS).filter(([k]) => k !== "gmove").map(([k, l]) => `<label class="ck"><input type="checkbox" data-ly="${k}"${st.layers.includes(k) ? " checked" : ""}> ${l}</label>`).join("")}</div>
<h4>Hạt hiệu ứng</h4><div id="ge_parts">${st.parts.map(partRow).join("")}</div><button type="button" class="sec sm" id="ge_padd">Thêm loại hạt</button>
<div class="g2"><div><label>Tốc độ chuyển động</label><input type="range" id="ge_spd" min="0.3" max="3" step="0.1" value="${st.spd}"></div><div><label>Độ đậm hiệu ứng</label><input type="range" id="ge_op" min="0.1" max="1" step="0.05" value="${st.op}"></div></div>`
      : `<h4>Màu và hiệu ứng</h4><div class="g2"><div class="full"><label>Màu chuyển sắc</label>${colors(st.grad || [], "ge_grad")}</div><div><label>Màu A</label><input type="color" id="ge_a" value="${st.a.slice(0, 7)}"></div><div><label>Màu B</label><input type="color" id="ge_b" value="${st.b.slice(0, 7)}"></div><div><label>Màu C</label><input type="color" id="ge_c" value="${st.c.slice(0, 7)}"></div>
<div><label>Hiệu ứng</label><select id="ge_fx">${opt({ glow: "Phát sáng", qi: "Linh khí", flame: "Lửa", stars: "Sao", cel: "Nét hoạt hình", sweep: "Ánh sáng chạy" }, st.fx)}</select></div><div><label>Chủ đề hiển thị</label><select id="ge_th2">${opt(KG.THEMES, st.th)}</select></div><div><label>Chữ trên huy hiệu</label><input id="ge_n" maxlength="4" value="${esc(st.n || "")}"></div></div>${iconPick(st.icon, "icon")}
<div><label>Ảnh riêng (huy hiệu)</label><input type="file" id="ge_img" accept="image/png,image/webp,image/gif,image/jpeg"><small class="mu" id="ge_imgv">${esc(st.img || "Chưa có")}</small> <button type="button" class="sec sm" id="ge_imgx">Bỏ ảnh</button></div>
${it.kind === "bundle" ? `<label>Các món trong gói</label><select id="ge_bundle" multiple size="8">${G.items.filter(x => x.kind !== "bundle").map(x => `<option value="${esc(x.id)}"${(it.bundle || []).includes(x.id) ? " selected" : ""}>${esc(KG.KINDS[x.kind])}: ${esc(x.name)}</option>`).join("")}</select>` : ""}`}
<h4>Bán và cách nhận</h4><div class="g2"><div><label>Giá (${esc((G.cfg && G.cfg.currency) || "Linh Thạch")})</label><input type="number" id="ge_price" min="0" value="${it.price}"></div><div><label>Cần cấp</label><input type="number" id="ge_lv" min="1" value="${it.level_req}"></div>
<div><label>Giá khuyến mãi</label><input type="number" id="ge_sp" min="0" value="${it.sale_price ?? ""}"></div><div><label>Khuyến mãi tới</label><input type="datetime-local" id="ge_su" value="${dt(it.sale_until)}"></div>
<div><label>Mở bán từ</label><input type="datetime-local" id="ge_sf" value="${dt(it.sell_from)}"></div><div><label>Mở bán tới</label><input type="datetime-local" id="ge_st" value="${dt(it.sell_until)}"></div>
<div><label>Giới hạn số người sở hữu</label><input type="number" id="ge_lim" min="1" value="${it.limit_count ?? ""}"></div><div><label>Số ngày sở hữu (trống = vĩnh viễn)</label><input type="number" id="ge_dur" min="1" value="${it.duration_days ?? ""}"></div>
<div><label>Cần thành tựu</label><select id="ge_ach"><option value="">Không</option>${G.achs.map(a => `<option value="${esc(a.id)}"${it.ach_req === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</select></div><div><label>Thứ tự hiển thị</label><input type="number" id="ge_sort" value="${it.sort || 0}"></div>
<div class="full"><label>Cách nhận</label><div class="glay">${Object.entries(OBT).map(([k, l]) => `<label class="ck"><input type="checkbox" data-ob="${k}"${(it.obtain || []).includes(k) ? " checked" : ""}> ${l}</label>`).join("")}</div></div>
<div><label>Trạng thái</label><select id="ge_status">${opt(STL, it.status)}</select></div></div>
<div class="acts"><button type="button" id="ge_pub">Lưu và mở bán</button><button type="button" class="sec" id="ge_draft">Lưu nháp</button>${isNew ? "" : `<button type="button" class="sec" id="ge_off">Ngừng phát hành</button><button type="button" class="sec" id="ge_del">Xóa</button>`}</div><p class="aerr" id="ge_err"></p></div>
<div class="gep"><div class="gepb"><h4>Xem trước</h4><div class="gpn dark" id="pv_d"></div><div class="gpn light" id="pv_l"></div><div class="gpn dark" id="pv_c"></div><div class="gpn dark" id="pv_p"></div><div class="gpn mob" id="pv_m"></div><div id="pv_art"></div></div></div></div>`;
    const v = id => (Q(id) || {}).value;
    const grad = () => QA("#ge_grad input[type=color]").map(i => i.value);
    function collect() {
      const s = { preset: Q("#ge_pre").value };
      if (T) Object.assign(s, { font: v("#ge_font"), color: v("#ge_color"), grad: grad(), gmove: Q("#ge_gm").checked, stroke: { w: +v("#ge_sw"), c: v("#ge_sc") }, glow: { i: +v("#ge_gi"), c: v("#ge_gc") },
        icon: (Q(".gic .on") || {}).dataset?.ic || "", isz: +v("#ge_isz"), iconc: v("#ge_icc"), img: st.img || "", art: v("#ge_art"), bg: v("#ge_bg"), bgc: [v("#ge_b1"), v("#ge_b2")], border: v("#ge_bd"), bc: v("#ge_bc"),
        layers: QA("[data-ly]").filter(x => x.checked).map(x => x.dataset.ly).concat(Q("#ge_gm").checked ? [] : []), parts: QA(".gpt").map(r => ({ t: r.querySelector("[data-p=t]").value, n: +r.querySelector("[data-p=n]").value, dir: r.querySelector("[data-p=dir]").value, spd: +r.querySelector("[data-p=spd]").value, sz: +r.querySelector("[data-p=sz]").value, c: r.querySelector("[data-p=c]").value })),
        spd: +v("#ge_spd"), op: +v("#ge_op") });
      else Object.assign(s, { grad: grad(), a: v("#ge_a"), b: v("#ge_b"), c: v("#ge_c"), fx: v("#ge_fx"), th: v("#ge_th2"), n: v("#ge_n"), icon: (Q(".gic .on") || {}).dataset?.ic || "", img: st.img || "" });
      return { ...it, id: v("#ge_id").trim(), kind: v("#ge_kind"), name: v("#ge_name").trim(), description: v("#ge_desc").trim(), quote: v("#ge_quote").trim(), theme: v("#ge_theme"), quality: +v("#ge_q"), exclusive: Q("#ge_ex").checked, style: s,
        price: +v("#ge_price") || 0, level_req: +v("#ge_lv") || 1, sale_price: v("#ge_sp") === "" ? null : +v("#ge_sp"), sale_until: v("#ge_su") ? new Date(v("#ge_su")).toISOString() : "", sell_from: v("#ge_sf") ? new Date(v("#ge_sf")).toISOString() : "", sell_until: v("#ge_st") ? new Date(v("#ge_st")).toISOString() : "",
        limit_count: v("#ge_lim") || "", duration_days: v("#ge_dur") || "", ach_req: v("#ge_ach"), sort: +v("#ge_sort") || 0, obtain: QA("[data-ob]").filter(x => x.checked).map(x => x.dataset.ob), status: v("#ge_status"),
        bundle: Q("#ge_bundle") ? [...Q("#ge_bundle").selectedOptions].map(o => o.value) : it.bundle || [] };
    }
    function pv() {
      const x = collect(), I = { ...x, q: x.quality, ex: x.exclusive }, who = "Đạo hữu Kenrori";
      const tt = T ? KG.title(I, { size: "md" }) : KG.preview(I, who), sm = T ? KG.title(I) : "";
      Q("#pv_d").innerHTML = `<small>Nền tối</small>${tt}`; Q("#pv_l").innerHTML = `<small>Nền sáng</small>${tt}`;
      const eq = T ? { title: I } : { [x.kind]: I }, cf = KG.cframe(eq);
      Q("#pv_c").innerHTML = `<small>Trong bình luận</small><div class="gcm${cf.cls}" style="${cf.style}">${KG.avatar('<span class="kav" style="--s:34px">Đ</span>', eq, 34)}<div><div class="gch"><b>${KG.name(who, eq)}</b><em class="klvb">Lv.42</em>${T ? sm : ""}</div><p>Chương này hay quá, mong chương mới!</p></div></div>`;
      Q("#pv_p").innerHTML = `<small>Trang hồ sơ</small><div class="gpp ${x.kind === "profile_bg" || x.kind === "banner" ? KG.bgStyle(I) : ""}">${KG.avatar('<span class="kav" style="--s:64px">Đ</span>', eq, 64)}<div><b class="gpn2">${KG.name(who, eq)}</b>${T ? KG.title(I, { size: "lg" }) : x.kind === "badge" ? KG.badge(I, 34) : ""}</div></div>`;
      Q("#pv_m").innerHTML = `<small>Điện thoại</small><div class="gmob"><div class="gch">${KG.avatar('<span class="kav" style="--s:28px">Đ</span>', eq, 28)}<b>${KG.name(who, eq)}</b>${sm}</div><p>Danh hiệu dài có bị tràn không?</p></div>`;
      Q("#pv_art").innerHTML = T && x.style.art ? `<small>Nhân vật đi kèm</small><div class="gart">${KG.art(x.style.art, 140)}</div>` : "";
    }
    pv();
    b.querySelector(".gef").addEventListener("input", pv); b.querySelector(".gef").addEventListener("change", pv);
    b.addEventListener("click", e => {
      const ic = e.target.closest("[data-ic]"); if (ic) { QA(".gic button").forEach(x => x.classList.toggle("on", x === ic)); pv() }
      if (e.target.closest("[data-gx]")) { e.target.closest("span").remove(); pv() }
      if (e.target.closest("[data-ga]")) { if (QA("#ge_grad input").length >= 6) return; e.target.insertAdjacentHTML("beforebegin", '<span><input type="color" value="#ffffff"><button type="button" class="sec sm" data-gx>✕</button></span>'); pv() }
      if (e.target.closest("[data-px]")) { e.target.closest(".gpt").remove(); pv() }
    });
    if (Q("#ge_padd")) Q("#ge_padd").onclick = () => { if (QA(".gpt").length >= 4) return log("Tối đa 4 loại hạt"); Q("#ge_parts").insertAdjacentHTML("beforeend", partRow({ t: "spark", n: 5, dir: "up", spd: 1, sz: 1, c: "#ffffff" })); pv() };
    Q("#ge_name").oninput = e => { if (isNew && !Q("#ge_id").dataset.touched) Q("#ge_id").value = (T ? "t-" : it.kind + "-") + slug(e.target.value).slice(0, 50) };
    Q("#ge_id").oninput = e => e.target.dataset.touched = 1;
    Q("#ge_back").onclick = draw;
    Q("#ge_apply").onclick = () => { const src = Q("#ge_copy").value ? G.items.find(x => x.id === Q("#ge_copy").value).style : { preset: Q("#ge_pre").value }; it = { ...collect(), style: { ...src, preset: src.preset || Q("#ge_pre").value } }; editor(it, isNew) };
    // Tải ảnh lên GitHub (images/fx/), vẽ lại qua canvas để loại bỏ mọi thứ ngoài điểm ảnh
    const upload = async (f, max) => {
      if (!/^image\/(png|webp|gif|jpeg)$/.test(f.type)) throw new Error("Chỉ nhận PNG, WebP, GIF hoặc JPG");
      if (f.size > 300 * 1024 && f.type === "image/gif") throw new Error("Ảnh GIF tối đa 300 KB");
      let blob = f, ext = "gif";
      if (f.type !== "image/gif") { const bm = await createImageBitmap(f), k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement("canvas"); c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k); c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height); blob = await new Promise(r => c.toBlob(r, "image/webp", .9)); ext = "webp"; if (!blob || blob.size > 300 * 1024) throw new Error("Ảnh sau khi nén vẫn lớn hơn 300 KB") }
      const path = `images/fx/${slug(v("#ge_id") || "fx")}-${rid()}.${ext}`, b64 = await new Promise(r => { const x = new FileReader(); x.onload = () => r(x.result.split(",")[1]); x.readAsDataURL(blob) });
      await put(path, b64, "Ảnh hiệu ứng: " + v("#ge_name")); return path;
    };
    Q("#ge_img").onchange = e => run(async () => { const f = e.target.files[0]; if (!f) return; st.img = await upload(f, 128); Q("#ge_imgv").textContent = st.img; pv(); log("✅ Đã tải ảnh lên. Ảnh hiện trên web sau 1–2 phút.") });
    Q("#ge_imgx").onclick = () => { st.img = ""; Q("#ge_imgv").textContent = "Chưa có"; pv() };
    if (Q("#ge_artf")) Q("#ge_artf").onchange = e => run(async () => { const f = e.target.files[0]; if (!f) return; const p = await upload(f, 480); Q("#ge_art").insertAdjacentHTML("beforeend", `<option value="${esc(p)}" selected>Ảnh đã tải</option>`); Q("#ge_art").value = p; pv(); log("✅ Đã tải ảnh nhân vật lên.") });
    const saveIt = status => run(async () => {
      const x = collect(); if (status) x.status = status;
      if (!x.name) return Q("#ge_err").textContent = "Hãy nhập tên.";
      if (!/^[a-z0-9][a-z0-9-]{1,60}$/.test(x.id)) return Q("#ge_err").textContent = "Mã chỉ gồm chữ thường không dấu, số và gạch ngang.";
      if (x.status !== "draft" && !x.obtain.length) return Q("#ge_err").textContent = "Hãy chọn ít nhất một cách nhận.";
      if (isNew && G.items.some(i => i.id === x.id)) return Q("#ge_err").textContent = "Mã này đã có. Hãy đổi mã khác.";
      await GA("item_save", { item: x }); log(`✅ Đã lưu ${x.name} (${STL[x.status]}).`); G.items = await GA("items"); it = G.items.find(i => i.id === x.id); isNew = false; editor(JSON.parse(JSON.stringify(it)), false);
    });
    Q("#ge_pub").onclick = () => saveIt(Q("#ge_status").value === "draft" ? "on" : null); Q("#ge_draft").onclick = () => saveIt("draft");
    if (Q("#ge_off")) Q("#ge_off").onclick = () => saveIt("off");
    if (Q("#ge_del")) Q("#ge_del").onclick = () => run(async () => { if (!confirm(`Xóa ${it.name}? Nếu đã có người sở hữu, hãy chọn Ngừng phát hành thay vì xóa.`)) return; await GA("item_delete", { id: it.id }); log("✅ Đã xóa."); draw() });
  }

  /* ---------- Thành tựu ---------- */
  const RULE = { chapters: "Số chương đã đọc", read_hours: "Số giờ đọc", night_min: "Số phút đọc lúc 0–5 giờ", days: "Số ngày ghé web", genres: "Số thể loại đã đọc", series: "Số bộ đã đọc", level: "Đạt cấp", titles: "Số danh hiệu sở hữu", spent: "Linh Thạch đã tiêu", encounters: "Số lần gặp kỳ ngộ", joined_before: "Tham gia trước ngày", manual: "Admin tự trao" };
  async function dAch(b) {
    try { [G.achs, G.items] = await Promise.all([GA("achs"), GA("items")]) } catch (e) { return fail(b, e) }
    const row = a => `<div class="gii"><span class="kai2">${KG.icon(a.icon)}</span><div class="gim"><b>${esc(a.name)}</b><small>${esc(a.description)} · ${RULE[a.rule.t] || a.rule.t}${a.rule.v != null ? " " + n0(a.rule.v) : ""} · ${n0(a.owners)} người đạt${a.hidden ? " · ẩn" : ""}${a.active ? "" : " · đang tắt"}</small></div><button type="button" class="sec sm" data-a="${esc(a.id)}">Sửa</button></div>`;
    b.innerHTML = `<div class="acts" style="margin-top:0"><button type="button" id="ga_new">Thêm thành tựu</button></div><div class="gil">${G.achs.map(row).join("")}</div>`;
    const ed = (a, isNew) => {
      b.innerHTML = `<button type="button" class="sec" id="ga_back">← Danh sách</button><div class="g2"><div><label>Tên</label><input id="ga_n" value="${esc(a.name)}"></div><div><label>Mã</label><input id="ga_id" value="${esc(a.id)}" ${isNew ? "" : "readonly"}></div><div class="full"><label>Mô tả</label><input id="ga_d" value="${esc(a.description)}"></div>
<div><label>Điều kiện</label><select id="ga_t">${opt(RULE, a.rule.t)}</select></div><div><label>Giá trị</label><input id="ga_v" type="number" value="${a.rule.v ?? 1}"></div><div><label>Ngày (với điều kiện tham gia trước)</label><input id="ga_date" type="date" value="${(a.rule.date || "").slice(0, 10)}"></div><div><label>Biểu tượng</label><select id="ga_ic">${Object.keys(KG.IC).map(k => `<option${k === a.icon ? " selected" : ""}>${k}</option>`).join("")}</select></div>
<div><label>Thưởng EXP</label><input id="ga_e" type="number" value="${(a.reward || {}).exp || 0}"></div><div><label>Thưởng ${esc((G.cfg && G.cfg.currency) || "Linh Thạch")}</label><input id="ga_s" type="number" value="${(a.reward || {}).stones || 0}"></div>
<div class="full"><label>Thưởng vật phẩm (giữ Ctrl để chọn nhiều)</label><select id="ga_it" multiple size="6">${G.items.map(x => `<option value="${esc(x.id)}"${((a.reward || {}).items || []).includes(x.id) ? " selected" : ""}>${esc(KG.KINDS[x.kind])}: ${esc(x.name)}</option>`).join("")}</select></div>
<div><label class="ck"><input type="checkbox" id="ga_h"${a.hidden ? " checked" : ""}> Ẩn điều kiện tới khi mở khóa</label></div><div><label class="ck"><input type="checkbox" id="ga_on"${a.active ? " checked" : ""}> Đang bật</label></div><div><label>Thứ tự</label><input id="ga_so" type="number" value="${a.sort || 0}"></div></div>
<div class="acts"><button type="button" id="ga_save">Lưu thành tựu</button>${isNew ? "" : '<button type="button" class="sec" id="ga_del">Xóa</button>'}</div>`;
      Q("#ga_back").onclick = draw; Q("#ga_n").oninput = e => { if (isNew) Q("#ga_id").value = slug(e.target.value).slice(0, 50) };
      Q("#ga_save").onclick = () => run(async () => { const r = { t: Q("#ga_t").value, v: +Q("#ga_v").value }; if (Q("#ga_date").value) r.date = Q("#ga_date").value + "T00:00:00+07:00";
        const rw = { exp: +Q("#ga_e").value || 0, stones: +Q("#ga_s").value || 0, items: [...Q("#ga_it").selectedOptions].map(o => o.value) };
        await GA("ach_save", { ach: { id: Q("#ga_id").value.trim(), name: Q("#ga_n").value.trim(), description: Q("#ga_d").value.trim(), icon: Q("#ga_ic").value, hidden: Q("#ga_h").checked, active: Q("#ga_on").checked, sort: +Q("#ga_so").value || 0, rule: r, reward: rw } }); log("✅ Đã lưu thành tựu."); draw() });
      if (Q("#ga_del")) Q("#ga_del").onclick = () => run(async () => { if (!confirm("Xóa thành tựu này? Người đã đạt sẽ mất thành tựu (phần thưởng đã nhận vẫn giữ).")) return; await GA("ach_delete", { id: a.id }); log("✅ Đã xóa."); draw() });
    };
    Q("#ga_new").onclick = () => ed({ id: "", name: "", description: "", icon: "star", hidden: false, active: true, sort: G.achs.length, rule: { t: "chapters", v: 50 }, reward: { stones: 100 } }, true);
    b.querySelector(".gil").onclick = e => { const x = e.target.closest("[data-a]"); if (x) ed(JSON.parse(JSON.stringify(G.achs.find(a => a.id === x.dataset.a))), false) };
  }

  /* ---------- Buff và sự kiện ---------- */
  const BK = { exp: "EXP", stones: "Lượng Linh Thạch", drop: "Tỷ lệ rơi", encounter: "Tỷ lệ kỳ ngộ" }, SK = { add: "Cộng phần tăng", mult: "Nhân với nhau", max: "Lấy mức cao nhất" };
  async function dBuff(b) {
    let L; try { L = await GA("buffs") } catch (e) { return fail(b, e) }
    b.innerHTML = `<p class="mu">Buff cho cả web dùng làm sự kiện (ví dụ nhân đôi EXP cuối tuần). Buff cho từng người cấp trong Kiểm duyệt › Tài khoản › Tu luyện.</p>
<div class="g4"><div><label>Loại</label><select id="gb_k">${opt(BK)}</select></div><div><label>Hệ số</label><input id="gb_m" type="number" step="0.1" min="0.1" max="100" value="2"></div><div><label>Cộng dồn</label><select id="gb_s">${opt(SK)}</select></div><div><label>Ghi chú (tên sự kiện)</label><input id="gb_n" maxlength="100" placeholder="Nhân đôi EXP cuối tuần"></div>
<div><label>Bắt đầu</label><input id="gb_a" type="datetime-local"></div><div><label>Kết thúc (trống = vĩnh viễn)</label><input id="gb_b" type="datetime-local"></div></div><div class="acts"><button type="button" id="gb_go">Bật Buff cho cả web</button></div>
<h4>Buff đang có và gần đây</h4><div class="lst">${L.length ? L.map(x => `<div class="li"><span class="lt">${x.user_id ? esc(x.who || "Một người") : "<b>Cả web</b>"}: ${BK[x.kind]} x${x.mult} <em>${esc(x.note || "")}</em></span><small>${x.live ? "Đang chạy" : "Chưa tới hoặc đã hết"}, ${x.ends_at ? "tới " + new Date(x.ends_at).toLocaleString("vi-VN") : "vĩnh viễn"}</small><button type="button" class="sec sm" data-bx="${x.id}">Gỡ</button></div>`).join("") : '<p class="mu">Chưa có Buff nào.</p>'}</div>`;
    Q("#gb_go").onclick = () => run(async () => { const iso = x => x ? new Date(x).toISOString() : ""; if (!confirm("Bật Buff này cho toàn bộ người đọc?")) return;
      await GA("buff_add", { everyone: true, kind: Q("#gb_k").value, mult: +Q("#gb_m").value, stack: Q("#gb_s").value, starts_at: iso(Q("#gb_a").value), ends_at: iso(Q("#gb_b").value), note: Q("#gb_n").value }); log("✅ Đã bật Buff."); draw() });
    b.querySelector(".lst").onclick = e => { const x = e.target.closest("[data-bx]"); if (x) run(async () => { if (!confirm("Gỡ Buff này?")) return; await GA("buff_delete", { id: +x.dataset.bx }); log("✅ Đã gỡ."); draw() }) };
  }

  /* ---------- Phát thưởng cho toàn bộ thành viên ---------- */
  async function dGive(b) {
    try { G.items = G.items || await GA("items") } catch (e) { return fail(b, e) }
    b.innerHTML = `<p class="mu">Phát cho mọi tài khoản đang hoạt động. Muốn phát cho vài người, vào Kiểm duyệt › Tài khoản, tick chọn rồi bấm Thao tác hàng loạt. Mọi lần phát đều ghi nhật ký.</p>
<div class="g4"><div><label>Phát gì</label><select id="gv_a"><option value="stones">${esc((G.cfg && G.cfg.currency) || "Linh Thạch")}</option><option value="exp">EXP</option><option value="grant">Vật phẩm hoặc danh hiệu</option></select></div><div><label>Số lượng</label><input id="gv_v" type="number" value="100"></div><div><label>Vật phẩm</label><select id="gv_i">${G.items.map(x => `<option value="${esc(x.id)}">${esc(KG.KINDS[x.kind])}: ${esc(x.name)}</option>`).join("")}</select></div><div><label>Số ngày sở hữu</label><input id="gv_d" type="number" min="1" placeholder="trống = vĩnh viễn"></div></div>
<label>Lý do (bắt buộc)</label><input id="gv_r" maxlength="300" placeholder="Quà sự kiện Tết"><div class="acts"><button type="button" id="gv_go">Phát cho toàn bộ thành viên</button></div>`;
    Q("#gv_go").onclick = () => run(async () => { const a = Q("#gv_a").value, why = Q("#gv_r").value.trim(); if (!why) return log("❌ Hãy ghi lý do"); if (!confirm("Phát cho TOÀN BỘ thành viên? Không hoàn tác tự động được.")) return;
      const r = a === "grant" ? await GA("grant", { all: true, item: Q("#gv_i").value, days: Q("#gv_d").value || null, reason: why }) : await GA("adjust", { all: true, [a]: +Q("#gv_v").value, reason: why }); log(`✅ Đã phát cho ${n0(r.n)} tài khoản.`) });
  }

  /* ---------- Nhật ký ---------- */
  async function dLog(b) {
    const SRC = { "": "Mọi nguồn", admin: "Quản trị", shop: "Cửa hàng", drop: "Rơi khi đọc", encounter: "Kỳ ngộ", level: "Thưởng cấp", achievement: "Thành tựu", daily: "Đăng nhập", complete: "Hoàn thành chương" };
    b.innerHTML = `<div class="gfl"><select id="gl_s">${opt(SRC, "admin")}</select><button type="button" class="sec" id="gl_go">Xem</button></div><div id="gl_l" class="lst"></div>`;
    const go = async () => { Q("#gl_l").innerHTML = '<p class="mu">Đang tải...</p>'; try { const L = await GA("logs", { source: Q("#gl_s").value, lim: 300 });
      Q("#gl_l").innerHTML = L.length ? L.map(l => `<div class="li"><span class="lt"><b>${esc(l.who)}</b> ${esc(l.kind)} ${l.delta > 0 ? "+" : ""}${n0(l.delta)} <em>${esc(l.reason)}</em></span><small>${esc(SRC[l.source] || l.source)}${l.before_v != null ? `, ${n0(l.before_v)} → ${n0(l.after_v)}` : ""}${l.actor_label ? `, bởi ${esc(l.actor_label)}` : ""}, ${new Date(l.at).toLocaleString("vi-VN")}</small></div>`).join("") : '<p class="mu">Không có dòng nào.</p>' } catch (e) { Q("#gl_l").innerHTML = `<p class="aerr">${esc(e.message)}</p>` } };
    Q("#gl_go").onclick = go; go();
  }

  /* =================== QUẢN LÝ THỂ LOẠI =================== */
  // Sổ thể loại lưu trong data.json (site.genres). Đổi tên, gộp, xóa sẽ cập nhật mọi bộ truyện dịch và truyện Sáng tác.
  const ser = () => [...data.novels.map((s, i) => ["novels", s, i]), ...data.manga.map((s, i) => ["manga", s, i])];
  function reg() {
    const R = (data.site.genres || []).map(g => ({ ...g })), have = new Set(R.map(g => g.name));
    ser().forEach(([, s]) => (s.genres || []).forEach(g => { if (g && !have.has(g)) { have.add(g); R.push({ name: g, slug: slug(g), desc: "", color: "", icon: "", parent: "", hidden: false, _new: 1 }) } }));
    return R.map((g, i) => ({ ...g, order: g.order ?? i })).sort((a, b) => a.order - b.order);
  }
  let GN = null, ST_COUNT = {};
  async function stCounts() {
    const c = sbc(); if (!/^https:\/\//.test(c.url || "") || !c.key) return {};
    try { const r = await fetch(c.url.replace(/\/+$/, "") + "/rest/v1/works?select=genres&visibility=eq.published&hidden=eq.false&limit=5000", { headers: { apikey: c.key } }); const L = await r.json(); const m = {}; (L || []).forEach(w => (w.genres || []).forEach(g => m[g] = (m[g] || 0) + 1)); return m } catch (e) { return {} }
  }
  async function gnOpen(force) {
    const el = Q("#gn"); if (!el || !data) return; if (el.dataset.ready && !force) return; el.dataset.ready = 1;
    GN = reg(); ST_COUNT = await stCounts(); const renames = [];
    const cnt = n => ser().filter(([, s]) => (s.genres || []).includes(n)).length;
    const draw2 = () => {
      const top = GN.filter(g => !g.parent || !GN.some(p => p.name === g.parent)), kids = p => GN.filter(g => g.parent === p.name);
      const row = (g, lvl) => `<tr data-n="${esc(g.name)}" class="${lvl ? "kid" : ""}${g.hidden ? " hid" : ""}"><td><input type="checkbox" data-sel></td><td><button type="button" class="sec sm" data-up>↑</button><button type="button" class="sec sm" data-dn>↓</button></td>
<td>${lvl ? "↳ " : ""}<input data-f="name" value="${esc(g.name)}"></td><td><input data-f="slug" value="${esc(g.slug || slug(g.name))}"></td><td><input data-f="desc" value="${esc(g.desc || "")}" placeholder="Mô tả ngắn"></td>
<td><input type="color" data-f="color" value="${g.color || "#8a8a99"}"></td><td><select data-f="icon"><option value="">Không</option>${Object.keys(KG.IC).map(k => `<option${k === g.icon ? " selected" : ""}>${k}</option>`).join("")}</select></td>
<td><select data-f="parent"><option value="">Thể loại chính</option>${GN.filter(p => p.name !== g.name && !p.parent).map(p => `<option${p.name === g.parent ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></td>
<td><label class="ck"><input type="checkbox" data-f="hidden"${g.hidden ? " checked" : ""}> Ẩn</label></td><td>${cnt(g.name)}${ST_COUNT[g.name] ? ` + ${ST_COUNT[g.name]} Sáng tác` : ""}${g._new ? ' <span class="lc" title="Thể loại có trong truyện nhưng chưa có trong sổ thể loại">chưa lưu</span>' : ""}</td><td><button type="button" class="sec sm" data-del>Xóa</button></td></tr>`;
      el.innerHTML = `<p class="mu">Thứ tự, màu, biểu tượng và thể loại cha ở đây quyết định cách thể loại hiện trên trang chủ, bộ lọc tìm kiếm và trang đăng truyện Sáng tác. Đổi tên hoặc gộp sẽ cập nhật mọi bộ truyện đang dùng${sbc().url ? ", kể cả truyện Sáng tác (cần mật khẩu kiểm duyệt)" : ""}.</p>
<div class="gfl"><input id="gn_add" placeholder="Tên thể loại mới"><button type="button" id="gn_addb">Thêm</button><button type="button" class="sec" id="gn_merge">Gộp các thể loại đã chọn</button><button type="button" class="sec" id="gn_bulk">Gán cho nhiều bộ</button></div>
<div class="gtw"><table class="gtb gn"><thead><tr><th></th><th>Thứ tự</th><th>Tên</th><th>Đường dẫn</th><th>Mô tả</th><th>Màu</th><th>Biểu tượng</th><th>Thuộc</th><th>Hiển thị</th><th>Số truyện</th><th></th></tr></thead><tbody>${top.map(g => row(g, 0) + kids(g).map(k => row(k, 1)).join("")).join("")}</tbody></table></div>
<div class="acts"><button type="button" id="gn_save">Lưu thể loại</button></div><div id="gn_bk"></div>`;
    };
    const sync = () => QA("#gn tbody tr").forEach(tr => { const g = GN.find(x => x.name === tr.dataset.n); if (!g) return; QA("[data-f]", tr).forEach(i => { g["_" + i.dataset.f] = i.type === "checkbox" ? i.checked : i.value.trim() }) });
    draw2();
    el.onclick = e => {
      h2(e);
      const tr = e.target.closest("tr[data-n]"), g = tr && GN.find(x => x.name === tr.dataset.n);
      if (e.target.closest("[data-up],[data-dn]") && g) { sync(); const i = GN.indexOf(g), j = i + (e.target.closest("[data-up]") ? -1 : 1); if (j < 0 || j >= GN.length) return; [GN[i], GN[j]] = [GN[j], GN[i]]; GN.forEach((x, k) => x.order = k); apply(false); draw2() }
      if (e.target.closest("[data-del]") && g) { sync(); apply(false); draw2(); const n = cnt(g.name) + (ST_COUNT[g.name] || 0); let to = "";
        if (n) { to = prompt(`"${g.name}" đang có ${n} truyện. Nhập tên thể loại để chuyển các truyện đó sang (để trống để chỉ gỡ thể loại khỏi truyện):`, ""); if (to === null) return }
        else if (!confirm(`Xóa thể loại "${g.name}"?`)) return;
        g._delete = true; g._to = (to || "").trim(); renames.push({ from: [g.name], to: g._to }); GN = GN.filter(x => x !== g); if (g._to && !GN.some(x => x.name === g._to)) GN.push({ name: g._to, slug: slug(g._to), order: GN.length }); draw2(); log(`Đã đánh dấu xóa "${g.name}". Bấm Lưu thể loại để áp dụng.`) }
    };
    const h2 = e => {
      if (e.target.id === "gn_addb") { sync(); const n = Q("#gn_add").value.trim(); if (!n || GN.some(x => x.name.toLowerCase() === n.toLowerCase())) return log("❌ Tên trống hoặc đã có"); GN.push({ name: n, slug: slug(n), desc: "", color: "", icon: "", parent: "", hidden: false, order: GN.length }); apply(false); draw2() }
      if (e.target.id === "gn_merge") { sync(); const selO = QA("#gn tbody tr").filter(tr => tr.querySelector("[data-sel]").checked).map(tr => GN.find(x => x.name === tr.dataset.n)).filter(Boolean); apply(false); const sel = selO.map(g => g.name); if (sel.length < 2) return log("❌ Hãy chọn ít nhất 2 thể loại để gộp");
        const to = prompt(`Gộp ${sel.join(", ")} thành thể loại nào? (nhập một trong các tên trên hoặc tên mới)`, sel[0]); if (!to) return; renames.push({ from: sel.filter(x => x !== to.trim()), to: to.trim() });
        GN = GN.filter(x => !sel.includes(x.name) || x.name === to.trim()); if (!GN.some(x => x.name === to.trim())) GN.push({ name: to.trim(), slug: slug(to), order: GN.length }); draw2(); log("Đã gộp trong bảng. Bấm Lưu thể loại để áp dụng cho mọi bộ truyện.") }
      if (e.target.id === "gn_bulk") { sync(); const selO = QA("#gn tbody tr").filter(tr => tr.querySelector("[data-sel]").checked).map(tr => GN.find(x => x.name === tr.dataset.n)).filter(Boolean); apply(false); draw2(); const sel = selO.map(g => g.name); if (!sel.length) return log("❌ Tick chọn thể loại muốn gán trước");
        Q("#gn_bk").innerHTML = `<h4>Gán ${esc(sel.join(", "))} cho các bộ</h4><select id="gn_bs" multiple size="10">${ser().map(([k, s, i]) => `<option value="${k}|${i}">${esc(s.title)}</option>`).join("")}</select><div class="acts"><button type="button" id="gn_ba">Thêm vào các bộ đã chọn</button><button type="button" class="sec" id="gn_br">Gỡ khỏi các bộ đã chọn</button></div>`;
        const go = add => run(async () => { const S = [...Q("#gn_bs").selectedOptions].map(o => o.value.split("|")); if (!S.length) return log("❌ Chọn ít nhất một bộ"); S.forEach(([k, i]) => { const s = data[k][+i]; s.genres = add ? [...new Set([...(s.genres || []), ...sel])] : (s.genres || []).filter(g => !sel.includes(g)) }); await save(`Gán thể loại cho ${S.length} bộ`); log(`✅ Đã ${add ? "gán" : "gỡ"} thể loại cho ${S.length} bộ.`); gnOpen(true) });
        Q("#gn_ba").onclick = () => go(true); Q("#gn_br").onclick = () => go(false) }
      if (e.target.id === "gn_save") run(async () => { sync(); await apply(true); renames.length = 0; gnOpen(true) });
    };
    // Áp dụng: đổi tên trong mọi bộ, lưu sổ thể loại
    async function apply(persist, rn = renames) {
      sync();
      GN.forEach(g => { if (g._name && g._name !== g.name) { rn.push({ from: [g.name], to: g._name }); GN.forEach(x => { if (x.parent === g.name) x.parent = g._name }) } });
      GN.forEach((g, i) => { const n = { name: g._name || g.name, slug: slug(g._slug ?? g.slug ?? g.name) || slug(g.name), desc: g._desc ?? g.desc ?? "", color: (g._color ?? g.color ?? "") === "#8a8a99" ? "" : g._color ?? g.color ?? "", icon: g._icon ?? g.icon ?? "", parent: g._parent ?? g.parent ?? "", hidden: g._hidden ?? !!g.hidden, order: i };
        Object.keys(g).forEach(k => delete g[k]); Object.assign(g, n) });
      if (!persist) return;
      const slugs = GN.map(g => g.slug); if (new Set(slugs).size !== slugs.length) throw new Error("Có hai thể loại trùng đường dẫn. Hãy sửa cho khác nhau.");
      for (const r of rn) ser().forEach(([, s]) => { if ((s.genres || []).some(g => r.from.includes(g))) s.genres = [...new Set(s.genres.map(g => r.from.includes(g) ? r.to : g).filter(Boolean))] });
      data.site.genres = GN;
      await save("Cập nhật thể loại");
      let nst = 0; for (const r of rn) { try { nst += (await GA("genre_rename", { from: r.from, to: r.to })).n } catch (e) { log("⚠️ Chưa cập nhật được truyện Sáng tác: " + e.message) } }
      log(`✅ Đã lưu ${GN.length} thể loại${rn.length ? `, cập nhật tên trong các bộ truyện${nst ? ` và ${nst} truyện Sáng tác` : ""}` : ""}. Web cập nhật sau 1–2 phút.`);
    }
  }

  /* ---------- Gắn vào trang quản trị ---------- */
  const css = document.createElement("style");
  css.textContent = `.gtabs{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}.gtabs .chip{margin:0}
.gfl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}.gfl input,.gfl select{width:auto;flex:1 1 150px}.gfl button{margin:0}
.gil{display:flex;flex-direction:column;gap:6px}.gii{display:flex;align-items:center;gap:12px;padding:8px 10px;border-radius:8px;background:var(--s1)}.gii button{margin:0}
.gpv{width:240px;flex:none;display:grid;place-items:center;min-height:44px;border-radius:8px;background:#15131f;overflow:hidden}.gpv .kg-pv{min-height:60px;width:100%;padding:6px}
.gim{flex:1;min-width:0;display:flex;flex-direction:column}.gim small{color:var(--mu);font-size:.78rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kai2{display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:var(--s2)}.kai2 .kg-i{width:20px;height:20px}
.ged{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:22px;align-items:start}.gep{position:sticky;top:12px}.gepb{display:flex;flex-direction:column;gap:8px}.gepb h4{margin:0}
@media(max-width:1100px){.ged{grid-template-columns:minmax(0,1fr)}.gep{position:static}}
.gpn{border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start}.gpn small{font-size:.72rem;opacity:.7}.gpn.dark{background:#15131f;color:#f3f2f8;--s1:#201d2d;--bg:#15131f;--mu:#a6a3b4}.gpn.light{background:#fbfaff;color:#14131a;--s1:#f0eef8;--bg:#fff;--mu:#6c6a7a}
.gpn.mob{background:#15131f;color:#f3f2f8;width:320px;max-width:100%;border:6px solid #2a2738;border-radius:22px}
.gcm{display:flex;gap:10px;width:100%}.gcm p{margin:4px 0 0;font-size:.88rem}.gch{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.gpp{display:flex;align-items:center;gap:12px;width:100%;padding:14px;border-radius:10px}.gpp>div{display:flex;flex-direction:column;gap:6px}.gpn2{font-size:1.2rem}
.gmob{width:100%}.gmob p{margin:4px 0 0;font-size:.85rem}.gart{width:140px;border-radius:10px;overflow:hidden;background:linear-gradient(160deg,#ffd6ea,#c9d6ff)}
.kav{display:grid;place-items:center;width:var(--s);height:var(--s);border-radius:50%;background:linear-gradient(160deg,#ff00ff,#5b1a6b);color:#fff;font-weight:700;font-size:calc(var(--s) * .4)}
.klvb{font-style:normal;font-size:.72rem;font-weight:700;color:#ff4dff;background:#3d1440;border-radius:4px;padding:0 5px}
.ggr{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ggr span{display:inline-flex;align-items:center;gap:2px}.ggr input[type=color],.kmr2 input[type=color],input[type=color]{width:46px;height:34px;padding:2px}.ggr button{margin:0}
.kmr2{display:flex;gap:6px}
.gic{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.gic button{margin:0;width:36px;height:36px;padding:0;justify-content:center;background:var(--s1);color:var(--tx)}.gic button.on{background:var(--ac);color:#fff}.gic .kg-i{width:20px;height:20px}
.glay{display:flex;flex-wrap:wrap;gap:4px 16px}.glay .ck{margin:4px 0}
.gpt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px;border-radius:8px;background:var(--s1);margin-bottom:6px}.gpt label{display:flex;flex-direction:column;margin:0;font-size:.75rem}.gpt select{width:auto}.gpt button{margin:0}
.gtw{overflow-x:auto}.gtb{width:100%;border-collapse:collapse;margin:8px 0;font-size:.88rem}.gtb th{text-align:left;font-weight:500;color:var(--mu);padding:4px 6px}.gtb td{padding:3px 4px;vertical-align:middle}.gtb input,.gtb select{padding:5px 8px;min-width:60px}
.gtb.gn td:nth-child(2){white-space:nowrap}.gtb.gn button{margin:0 2px}.gtb tr.kid td:nth-child(3){padding-left:22px}.gtb tr.hid{opacity:.55}.gtb input[type=checkbox]{width:auto;min-width:0}
.gtb.gn td:nth-child(3) input{min-width:140px}.gtb.gn td:nth-child(5) input{min-width:160px}`;
  document.head.appendChild(css);
  const watch = (id, fn) => { const el = Q(id); if (el) new MutationObserver(() => { if (el.classList.contains("on")) fn() }).observe(el, { attributes: true, attributeFilter: ["class"] }) };
  watch("#p-game", gmOpen); watch("#p-genre", () => gnOpen(true));
})();
