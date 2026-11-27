/* Kenrori: bộ vẽ danh hiệu, khung, màu tên và hiệu ứng (dùng chung cho web và trang quản trị).
   Không chạy mã hay HTML do người dùng nhập: mọi hiệu ứng được dựng từ cấu hình đã kiểm tra. */
(() => {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const HEX = /^#[0-9a-f]{3,8}$/i, col = (c, d) => (HEX.test(c || "") ? c : d), num = (v, a, b, d) => { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d };
  const ok = (v, list, d) => (list.includes(v) ? v : d);
  const IMGOK = u => /^(images\/fx\/[\w.-]+\.(png|webp|gif|jpe?g)|https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/covers\/[\w/.-]+\.(png|webp|jpe?g))$/i.test(u || "");

  const THEMES = { tutien: "Tu Tiên", matu: "Ma Tu", tinhkhong: "Tinh Không", anime: "Anime" };
  const QN = ["Phàm Phẩm", "Linh Phẩm", "Huyền Phẩm", "Thiên Phẩm", "Tiên Phẩm", "Thần Phẩm", "Vô Thượng"];
  const QC = ["#9a9aa8", "#22b46a", "#3b8cff", "#a259ff", "#f5b400", "#ff5a2b", "#ff00ff"];
  const KINDS = { title: "Danh hiệu", frame: "Khung ảnh đại diện", avatar_fx: "Hiệu ứng ảnh đại diện", name_color: "Màu tên", name_fx: "Hiệu ứng tên", profile_bg: "Nền hồ sơ", banner: "Biểu ngữ hồ sơ", badge: "Huy hiệu", comment_frame: "Khung bình luận", card_fx: "Hiệu ứng thẻ thành viên", bundle: "Gói trang trí" };
  const FONTS = { beaufort: ["Beaufort", '"Beaufort","Be Vietnam Pro",sans-serif'], serif: ["Noto Serif", '"Noto Serif",Georgia,serif'], sans: ["Be Vietnam Pro", '"Be Vietnam Pro",system-ui,sans-serif'], bold: ["Be Vietnam Pro nghiêng", '"Be Vietnam Pro",system-ui,sans-serif'] };
  const PARTS = { qi: "Linh khí", petal: "Cánh hoa", spark: "Đốm sáng", ember: "Tàn lửa", smoke: "Ma khí", star: "Sao lấp lánh", dust: "Bụi sao", square: "Lấp lánh hoạt hình", rune: "Phù văn", bolt: "Tia sét nhỏ" };
  const DIRS = { up: "Bay lên", down: "Rơi xuống", left: "Sang trái", right: "Sang phải", float: "Lơ lửng", around: "Xoay quanh" };
  const LAYERS = { aura: "Hào quang phía sau", ring: "Vòng pháp trận", sweep: "Ánh sáng chạy dọc chữ", gmove: "Chữ chuyển sắc", breathe: "Ánh sáng thở", bolt: "Sấm sét thoáng qua", slash: "Vệt kiếm", aurora: "Cực quang", mist: "Sương khí", flame: "Lửa bùng" };
  const BGS = { none: "Không nền", plate: "Thẻ ngọc", scroll: "Cuộn thư", seal: "Ấn đá", ribbon: "Dải lụa", void: "Hư không", cel: "Cel hoạt hình" };
  const BORDERS = { none: "Không viền", thin: "Viền mảnh", double: "Viền kép", rune: "Viền phù văn", spike: "Viền gai", orbit: "Viền quỹ đạo", cel: "Viền nét đậm" };

  /* ---------- Biểu tượng (SVG nét) ---------- */
  const IC = {
    sword: '<path d="M14.5 3.5 20.5 3.5 20.5 9.5 10 20 7.5 20 4 16.5 4 14z"/><path d="m6 13 5 5M3 21l3-3"/>',
    lotus: '<path d="M12 20c-4 0-8-2-9-6 3 0 5 1 6 2-1-4 1-8 3-10 2 2 4 6 3 10 1-1 3-2 6-2-1 4-5 6-9 6z"/>',
    cloud: '<path d="M6 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.5A4.5 4.5 0 1 1 17.5 17z"/><path d="M8 13a2 2 0 0 1 4 0"/>',
    gourd: '<path d="M12 3v2M10 5h4M12 5a3 3 0 0 0-1.8 5.4A5.5 5.5 0 1 0 13.8 10.4 3 3 0 0 0 12 5z"/>',
    talisman: '<path d="M7 3h10v18l-5-3-5 3z"/><path d="M10 8h4M12 6v8M10 12l2 2 2-2"/>',
    taiji: '<circle cx="12" cy="12" r="9"/><path d="M12 3a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9"/><circle cx="12" cy="7.5" r="1"/><circle cx="12" cy="16.5" r="1"/>',
    mountain: '<path d="m2 20 7-12 4 6 3-4 6 10z"/><path d="m7.5 11 1.5 1.5L11 10"/>',
    crane: '<path d="M4 14c4 1 7-1 9-5l2-4 3 1-3 2-1 5c-1 4-5 6-10 5M13 13l1 7M11 14l-1 6"/>',
    skull: '<path d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 20v-2M14 20v-2M12 14v2"/>',
    flame: '<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-10 2 1 5 4 5 7 1-1 1-2 1-3 2 2 2 4 2 6 0 3-2 6-6 6z"/><path d="M12 21c-1.5 0-2.5-1-2.5-2.5S12 15 12 15s2.5 2 2.5 3.5S13.5 21 12 21z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M12 9v6"/>',
    horn: '<path d="M5 20c0-8 2-13 6-16-1 4 0 7 2 9M19 20c0-8-2-13-6-16 1 4 0 7-2 9"/><path d="M8 20h8"/>',
    blood: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/><path d="M10 15a2 2 0 0 0 2 2"/>',
    scythe: '<path d="M6 21 15 6M15 6c3-3 6-2 7 0-4-1-7 1-9 4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    chain: '<rect x="3" y="9" width="9" height="6" rx="3"/><rect x="12" y="9" width="9" height="6" rx="3"/>',
    star: '<path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    planet: '<circle cx="12" cy="12" r="5"/><path d="M4 16c-2 2-1 3 2 2.5 4-.7 9-3.5 12.5-7 2.5-2.5 2-4-1-3"/>',
    comet: '<circle cx="16" cy="8" r="3"/><path d="M13.5 10.5 4 20M12 8 5 13M16 11l-5 7"/>',
    orbit: '<circle cx="12" cy="12" r="2.5"/><ellipse cx="12" cy="12" rx="9.5" ry="4.5"/><circle cx="20" cy="10" r="1"/>',
    galaxy: '<path d="M12 12c0-3 3-5 6-4M12 12c3 0 5 3 4 6M12 12c0 3-3 5-6 4M12 12c-3 0-5-3-4-6"/><circle cx="12" cy="12" r="1.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    constel: '<circle cx="5" cy="17" r="1.5"/><circle cx="10" cy="9" r="1.5"/><circle cx="17" cy="13" r="1.5"/><circle cx="19" cy="5" r="1.5"/><path d="m6 16 3-6M11 10l5 2.5M18 11.5l1-5"/>',
    katana: '<path d="M21 3 8 16M7 17l-2 2M5.5 14.5l4 4M3 21l2-2"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    sakura: '<path d="M12 12c-1-3-1-6 0-8 1 2 1 5 0 8zM12 12c3-1 6-1 8 0-2 1-5 1-8 0zM12 12c1 3 1 6 0 8-1-2-1-5 0-8zM12 12c-3 1-6 1-8 0 2-1 5-1 8 0z"/><circle cx="12" cy="12" r="1.2"/>',
    heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    crown: '<path d="m3 8 4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M5 19h14"/>',
    star4: '<path d="M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10z"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    wand: '<path d="m4 20 11-11M15 4v3M18.5 5.5l-2 2M20 9h-3M13 6l5 5"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2.5zM20 19v3H6"/>',
    scroll: '<path d="M7 4h11a2 2 0 0 1 0 4H7M7 4a2 2 0 0 0 0 4v10a2 2 0 0 0 2 2h9a2 2 0 0 0 0-4H9"/><path d="M11 12h5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3 7 9l5 12 5-12-2-6"/>'
  };
  const icon = (id, cls = "") => IC[id] ? `<svg class="kg-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[id]}</svg>` : "";

  /* ---------- Nhân vật gốc (SVG tự vẽ, không lấy từ tác phẩm nào) ---------- */
  const GIRLS = [null, { h: "#ff7ab6", h2: "#d44a8c", e: "#7a3cff", acc: "ribbon", ac: "#ffe066" }, { h: "#ffd34d", h2: "#e0a100", e: "#ff4f6d", acc: "star", ac: "#62e3ff" },
    { h: "#5a4bd1", h2: "#2f2687", e: "#3fd1ff", acc: "horn", ac: "#ff4fa3" }, { h: "#f2f2ff", h2: "#b9b9e6", e: "#22c55e", acc: "flower", ac: "#ff8fb8" }];
  function girl(n, size = 120) {
    const g = GIRLS[n] || GIRLS[1], id = "kgg" + n;
    const acc = { ribbon: `<path d="M64 22c6-8 16-8 16 0s-10 8-16 2c-6 6-16 6-16-2s10-8 16 0z" fill="${g.ac}" stroke="#2a1838" stroke-width="1.5"/>`,
      star: `<path d="m72 14 3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="${g.ac}" stroke="#2a1838" stroke-width="1.5"/>`,
      horn: `<path d="M30 26c-6-8-6-16-2-20 2 6 6 10 10 12zM70 26c6-8 6-16 2-20-2 6-6 10-10 12z" fill="${g.ac}" stroke="#2a1838" stroke-width="1.5"/>`,
      flower: `<circle cx="70" cy="22" r="5" fill="${g.ac}"/><circle cx="76" cy="18" r="4" fill="${g.ac}"/><circle cx="74" cy="26" r="4" fill="${g.ac}"/><circle cx="72" cy="22" r="2.5" fill="#fff6a8"/>` }[g.acc];
    return `<svg class="kg-girl" viewBox="0 0 100 120" width="${size}" height="${size * 1.2}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${g.h}"/><stop offset="1" stop-color="${g.h2}"/></linearGradient></defs>
<path d="M18 120c2-18 14-26 32-26s30 8 32 26z" fill="#2a2140"/><path d="M38 96l12 10 12-10" fill="#fff" stroke="#2a1838" stroke-width="1.5"/><path d="M47 101h6l-3 9z" fill="${g.ac}"/>
<path d="M16 56c-2-26 12-44 34-44s36 18 34 44c-1 14 2 28 6 36-10 2-18-4-20-12H30c-2 8-10 14-20 12 4-8 7-22 6-36z" fill="url(#${id})" stroke="#2a1838" stroke-width="1.5"/>
<ellipse cx="50" cy="60" rx="25" ry="27" fill="#ffe7da" stroke="#2a1838" stroke-width="1.5"/>
<path d="M24 52c4-18 16-26 26-26 4 6 12 10 26 12 2 4 2 10 1 14-6-6-14-8-20-14-4 6-14 10-22 10-4 0-8 2-11 4z" fill="url(#${id})" stroke="#2a1838" stroke-width="1.5"/>
<path d="M50 26c-4-10 0-16 8-18-4 4-4 10-8 18z" fill="url(#${id})" stroke="#2a1838" stroke-width="1.2"/>
<g><ellipse cx="39" cy="63" rx="6" ry="8" fill="#fff" stroke="#2a1838" stroke-width="1.4"/><ellipse cx="39.5" cy="64.5" rx="4.2" ry="6" fill="${g.e}"/><circle cx="41" cy="61" r="2" fill="#fff"/><circle cx="37.6" cy="67" r="1" fill="#fff"/>
<ellipse cx="61" cy="63" rx="6" ry="8" fill="#fff" stroke="#2a1838" stroke-width="1.4"/><ellipse cx="60.5" cy="64.5" rx="4.2" ry="6" fill="${g.e}"/><circle cx="62" cy="61" r="2" fill="#fff"/><circle cx="58.6" cy="67" r="1" fill="#fff"/>
<path d="M32 54c3-2 7-3 11-2M68 54c-3-2-7-3-11-2" stroke="#2a1838" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
<ellipse cx="33" cy="73" rx="4" ry="2" fill="#ff9db5" opacity=".6"/><ellipse cx="67" cy="73" rx="4" ry="2" fill="#ff9db5" opacity=".6"/>
<path d="M46 76c2 2 6 2 8 0" stroke="#2a1838" stroke-width="1.6" fill="none" stroke-linecap="round"/>${acc}</svg>`;
  }
  const artHtml = (a, size) => { if (!a) return ""; const m = /^girl:(\d)$/.exec(a); if (m) return girl(+m[1], size); return IMGOK(a) ? `<img class="kg-art" src="${esc(a)}" alt="" loading="lazy" width="${size}">` : "" };

  /* ---------- Bảng màu và cấu hình mẫu ---------- */
  const QG = [["#d4d4de", "#9a9aa8"], ["#c8ffe0", "#3ddc84", "#1f9d5c"], ["#dff1ff", "#5fb0ff", "#2563eb"], ["#f3e3ff", "#c084fc", "#7c3aed"], ["#fff6cc", "#ffd24a", "#e09a00"], ["#ffe6cc", "#ff7a2b", "#e0162b"]];
  const TH = {
    tutien: { acc: ["#7fe3d4", "#bdf4ff", "#ffe9a8"], top: ["#ffffff", "#9ff3ff", "#ffe28a", "#b7ffcf"], font: "serif", parts: ["qi", "petal"], ring: true, bg: ["#0b2830", "#14424c"], bd: "#7fe3d4", layers5: ["sweep", "aura"], layers6: ["slash", "breathe", "ring"], tb: "scroll" },
    matu: { acc: ["#ff3b5c", "#a855f7", "#ff2d2d"], top: ["#ff9bd2", "#ff3b3b", "#b10f3e", "#7c2cff"], font: "beaufort", parts: ["ember", "smoke"], ring: true, bg: ["#14050b", "#2c0a1a"], bd: "#b10f3e", layers5: ["mist", "aura"], layers6: ["bolt", "flame", "ring"], tb: "seal" },
    tinhkhong: { acc: ["#a5b4ff", "#7dd3fc", "#f0abfc"], top: ["#a5f3ff", "#7c6cff", "#ff8bd8", "#fff4a8"], font: "sans", parts: ["star", "dust"], ring: true, bg: ["#080a26", "#1b1452"], bd: "#7c6cff", layers5: ["aurora", "aura"], layers6: ["ring", "sweep", "breathe"], tb: "void" },
    anime: { acc: ["#ff4fa3", "#62e3ff", "#ffe066"], top: ["#ffe066", "#ff4fa3", "#62e3ff", "#ffffff"], font: "bold", parts: ["square", "spark"], ring: false, bg: ["#ffffff", "#fff0f8"], bd: "#1b1033", layers5: ["slash", "sweep"], layers6: ["bolt", "flame", "aura"], tb: "cel" }
  };
  const BORDER_Q = ["none", "thin", "thin", "double", "double", "rune", "rune"];
  function preset(key) {
    let m = /^(tutien|matu|tinhkhong|anime)-([1-7])$/.exec(key || "");
    if (m) {
      const th = m[1], q = +m[2], T = TH[th], an = th === "anime";
      const base = q === 7 ? T.top : q <= 2 ? QG[q - 1] : [QG[q - 1][0], QG[q - 1][1], T.acc[q % 3]];
      const s = { font: T.font, color: QC[q - 1], grad: q >= 3 ? base : [], gmove: q >= 5, stroke: an && q >= 3 ? { w: 1.2, c: "#1b1033" } : { w: 0, c: "#000000" },
        glow: { c: q >= 3 ? (q === 7 ? T.top[1] : QG[q - 1][1]) : "#000000", i: [0, 0, .25, .45, .6, .75, .9][q - 1] }, icon: "", isz: 1, iconc: q <= 2 ? QC[q - 1] : (q === 7 ? T.top[1] : base[1]),
        bg: q <= 2 ? "none" : q >= 5 ? T.tb : an ? "cel" : "plate", bgc: T.bg, border: an && q >= 3 ? "cel" : (th === "matu" && q >= 5 ? "spike" : th === "tinhkhong" && q >= 5 ? "orbit" : BORDER_Q[q - 1]), bc: q <= 2 ? QC[q - 1] : (q === 7 ? T.top[1] : base[1]),
        layers: [], parts: [], spd: 1, op: 1, art: "" };
      if (q >= 3) s.layers.push("sweep");
      if (q >= 4) s.layers.push("aura");
      if (q >= 5) s.layers.push(...T.layers5);
      if (q >= 6) s.layers.push(...T.layers6);
      if (q === 7) s.layers.push("breathe", "gmove");
      if (q >= 5 && T.ring) s.layers.push("ring");
      s.layers = [...new Set(s.layers)].filter(x => x !== "gmove");
      const pc = q === 7 ? T.top[2] : T.acc[0];
      if (q >= 3) s.parts.push({ t: T.parts[0], n: [0, 0, 3, 5, 7, 9, 11][q - 1], dir: { qi: "up", ember: "up", star: "float", square: "float" }[T.parts[0]], spd: 1, sz: 1, c: th === "tinhkhong" ? "#ffffff" : pc });
      if (q >= 5) s.parts.push({ t: T.parts[1], n: q - 2, dir: { petal: "down", smoke: "up", dust: "left", spark: "right" }[T.parts[1]], spd: 1, sz: 1, c: th === "matu" ? "#7c2cff" : th === "anime" ? "#ffe066" : "#ffd1e6" });
      if (q === 7 && th === "tutien") s.parts.push({ t: "rune", n: 4, dir: "around", spd: .7, sz: 1, c: "#ffe28a" });
      if (q === 7 && th === "matu") s.parts.push({ t: "rune", n: 4, dir: "around", spd: .8, sz: 1, c: "#ff3b3b" });
      return s;
    }
    m = /^(frame|avatar_fx|name_color|name_fx|profile_bg|banner|badge|comment_frame|card_fx|bundle)-(tutien|matu|tinhkhong|anime)$/.exec(key || "");
    if (m) { const T = TH[m[2]], NC = { tutien: ["#0ea5a4", "#2f80ed"], matu: ["#c0143c", "#7b2cbf"], tinhkhong: ["#5b5bf5", "#d946ef"], anime: ["#ff2d87", "#ff8a00"] }[m[2]];
      return { th: m[2], grad: NC, a: T.top[1], b: T.top[2], c: T.acc[0], fx: { tutien: "qi", matu: "flame", tinhkhong: "stars", anime: "cel" }[m[2]], icon: { tutien: "lotus", matu: "flame", tinhkhong: "comet", anime: "star4" }[m[2]] } }
    if (key === "badge-lv") return { th: "tutien", a: "#ffd24a", b: "#e09a00", c: "#fff6cc", icon: "crown" };
    return {};
  }
  // Gộp cấu hình mẫu với phần đã chỉnh, và lọc mọi giá trị về dạng an toàn
  function resolve(style, kind = "title") {
    const st = style || {}, p = preset(st.preset), s = { ...p, ...st };
    if (kind !== "title") {
      return { th: ok(s.th, Object.keys(THEMES), "tutien"), grad: (Array.isArray(s.grad) ? s.grad : []).map(c => col(c, "")).filter(Boolean).slice(0, 5), a: col(s.a, "#ff00ff"), b: col(s.b, "#7c3aed"), c: col(s.c, "#ffffff"),
        fx: ok(s.fx, ["qi", "flame", "stars", "cel", "glow", "sweep"], "glow"), icon: IC[s.icon] ? s.icon : "", n: String(s.n || "").replace(/[^0-9A-Za-zÀ-ỹ]/g, "").slice(0, 4), img: IMGOK(s.img) ? s.img : "" };
    }
    return {
      font: ok(s.font, Object.keys(FONTS), "beaufort"), color: col(s.color, "#9a9aa8"), grad: (Array.isArray(s.grad) ? s.grad : []).map(c => col(c, "")).filter(Boolean).slice(0, 6), gmove: !!s.gmove,
      stroke: { w: num(s.stroke && s.stroke.w, 0, 3, 0), c: col(s.stroke && s.stroke.c, "#000000") }, glow: { c: col(s.glow && s.glow.c, "#ffffff"), i: num(s.glow && s.glow.i, 0, 1, 0) },
      icon: IC[s.icon] ? s.icon : "", isz: num(s.isz, .6, 1.8, 1), iconc: col(s.iconc, ""), img: IMGOK(s.img) ? s.img : "", art: /^girl:[1-4]$/.test(s.art || "") || IMGOK(s.art) ? s.art : "",
      bg: ok(s.bg, Object.keys(BGS), "none"), bgc: (Array.isArray(s.bgc) ? s.bgc : []).map(c => col(c, "")).filter(Boolean).slice(0, 2), border: ok(s.border, Object.keys(BORDERS), "none"), bc: col(s.bc, "#ffffff"),
      layers: (Array.isArray(s.layers) ? s.layers : []).filter(x => LAYERS[x]).slice(0, 8),
      parts: (Array.isArray(s.parts) ? s.parts : []).slice(0, 4).map(x => ({ t: ok(x.t, Object.keys(PARTS), "spark"), n: Math.round(num(x.n, 0, 16, 4)), dir: ok(x.dir, Object.keys(DIRS), "up"), spd: num(x.spd, .3, 3, 1), sz: num(x.sz, .4, 2.5, 1), c: col(x.c, "#ffffff") })),
      spd: num(s.spd, .3, 3, 1), op: num(s.op, .1, 1, 1), th: ok(s.th, Object.keys(THEMES), "")
    };
  }
  // Số ngẫu nhiên cố định theo mã danh hiệu, để mỗi lần vẽ hạt nằm cùng chỗ
  const rng = seed => { let h = 2166136261; for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296 };
  const gradCss = g => g.length > 1 ? `linear-gradient(90deg,${g.join(",")}${g.length > 2 ? "," + g[0] : ""})` : g[0] || "";
  const RING = {
    tutien: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 5"/><circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="1"/><path d="M50 14 81 68H19z M50 86 19 32h62z" fill="none" stroke="currentColor" stroke-width="1"/></svg>',
    matu: '<svg viewBox="0 0 100 100"><path d="M50 2 58 30 88 22 66 44 98 50 66 56 88 78 58 70 50 98 42 70 12 78 34 56 2 50 34 44 12 22 42 30z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="6 3"/></svg>',
    tinhkhong: '<svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="46" ry="18" fill="none" stroke="currentColor" stroke-width="1.2"/><ellipse cx="50" cy="50" rx="18" ry="46" fill="none" stroke="currentColor" stroke-width=".8" opacity=".6"/><circle cx="96" cy="50" r="3.5" fill="currentColor"/></svg>',
    anime: '<svg viewBox="0 0 100 100"><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M50 4v14M50 82v14M4 50h14M82 50h14M17 17l10 10M73 73l10 10M17 83l10-10M73 27l10-10"/></g></svg>'
  };

  /* ---------- Vẽ danh hiệu ---------- */
  // Khung ảnh cho danh hiệu kiểu mặc định (theo hệ và phẩm): [tâm vùng chữ theo chiều cao, tỉ lệ cao/rộng]
  const FRM = {"tutien-1":[0.655,0.451],"tutien-2":[0.624,0.381],"tutien-3":[0.692,0.465],"tutien-4":[0.686,0.44],"tutien-5":[0.605,0.479],"tutien-6":[0.678,0.487],"tutien-7":[0.526,0.572],"matu-1":[0.614,0.402],"matu-2":[0.625,0.44],"matu-3":[0.616,0.454],"matu-4":[0.539,0.527],"matu-5":[0.609,0.4],"matu-6":[0.567,0.503],"matu-7":[0.543,0.481],"tinhkhong-1":[0.631,0.481],"tinhkhong-2":[0.629,0.379],"tinhkhong-3":[0.527,0.535],"tinhkhong-4":[0.664,0.49],"tinhkhong-5":[0.627,0.48],"tinhkhong-6":[0.584,0.411],"tinhkhong-7":[0.625,0.415],"anime-1":[0.585,0.396],"anime-2":[0.665,0.442],"anime-3":[0.645,0.416],"anime-4":[0.695,0.44],"anime-5":[0.652,0.423],"anime-6":[0.611,0.411],"anime-7":[0.519,0.367]};
  function frameTitle(item, th, q, opt) {
    const st = item.style || {}, pk = st.preset || `${th}-${q}`, F = FRM[pk];
    if (!F || opt.css || Object.keys(st).some(k => !["preset", "icon", "v"].includes(k))) return ""; // danh hiệu đã tự chỉnh kiểu thì giữ kiểu CSS
    const n = String(item.name), fz = Math.min(1.08, 11.6 / ([...n].length * .56)).toFixed(3), ex = item.ex ?? item.exclusive;
    return `<span class="kt kt-fr kt-f-${pk.split("-")[0]} kt-${opt.size || "sm"}${ex ? " kt-ex" : ""}" style="--ty:${F[0]};--ar:${F[1]};--fz:${fz}" title="${esc(n)}, ${QN[q - 1]}${ex ? ", độc quyền" : ""}"><img class="kt-fi" src="img/dh/${pk}.webp" alt="" loading="lazy" decoding="async" draggable="false"><span class="kt-t">${esc(n)}</span></span>`;
  }
  function title(item, opt = {}) {
    if (!item || !item.name) return "";
    const th0 = ok(item.theme, Object.keys(THEMES), "tutien"), q0 = Math.round(num(item.q ?? item.quality, 1, 7, 1)), fr = frameTitle(item, th0, q0, opt); if (fr) return fr;
    const th = th0, q = q0, s = resolve({ ...(item.style || {}), preset: (item.style && item.style.preset) || `${th}-${q}` });
    const r = rng(item.id || item.name), L = new Set(s.layers), g = s.grad.length ? s.grad : [s.color];
    const vars = [`--tc:${s.color}`, `--g:${gradCss(g.length > 1 ? g : [g[0], g[0]])}`, `--gl:${s.glow.c}`, `--gi:${s.glow.i}`, `--sk:${s.stroke.w}px`, `--skc:${s.stroke.c}`, `--sp:${(1 / s.spd).toFixed(2)}`, `--op:${s.op}`,
      `--b1:${s.bgc[0] || "#1b1630"}`, `--b2:${s.bgc[1] || s.bgc[0] || "#2b2448"}`, `--bc:${s.bc}`, `--ic:${s.iconc || g[Math.min(1, g.length - 1)]}`, `--isz:${s.isz}em`, `--ff:${FONTS[s.font][1]}`].join(";");
    let fx = "";
    if (L.has("aura")) fx += '<i class="kt-aura"></i>';
    if (L.has("aurora")) fx += '<i class="kt-aurora"></i>';
    if (L.has("mist")) fx += '<i class="kt-mist"></i><i class="kt-mist m2"></i>';
    if (L.has("flame")) fx += '<i class="kt-flame"></i>';
    if (L.has("slash")) fx += '<i class="kt-slash"></i>';
    if (L.has("bolt")) fx += `<i class="kt-bolt"><svg viewBox="0 0 40 20"><path d="M2 8 12 6 9 12 22 9 18 15 38 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg></i>`;
    let ps = "";
    for (const p of s.parts) for (let i = 0; i < p.n; i++) ps += `<i class="kt-pt t-${p.t} d-${p.dir}" style="--x:${(r() * 100).toFixed(1)}%;--y:${(r() * 100).toFixed(1)}%;--dl:-${(r() * 6).toFixed(2)}s;--du:${((2.4 + r() * 2.6) / p.spd).toFixed(2)}s;--s:${(p.sz * (2 + r() * 2.2)).toFixed(1)}px;--pc:${p.c};--rt:${Math.round(r() * 360)}deg"></i>`;
    const ring = L.has("ring") ? `<i class="kt-ring">${RING[th]}</i>` : "";
    const art = opt.noart ? "" : s.art ? `<span class="kt-av">${artHtml(s.art, 40)}</span>` : "";
    const ic = art || (s.img ? `<span class="kt-ic"><img src="${esc(s.img)}" alt=""></span>` : s.icon ? `<span class="kt-ic">${ring}${icon(s.icon)}</span>` : ring ? `<span class="kt-ic">${ring}</span>` : "");
    const cls = `kt kt-q${q} kt-${th} kt-bg-${s.bg} kt-bd-${s.border}${s.gmove ? " kt-gm" : ""}${L.has("sweep") ? " kt-sw" : ""}${L.has("breathe") ? " kt-br" : ""}${item.ex ?? item.exclusive ? " kt-ex" : ""} kt-${opt.size || "sm"}${s.font === "bold" ? " kt-it" : ""}`;
    return `<span class="${cls}" style="${vars}" title="${esc(item.name)}, ${QN[q - 1]}${item.ex ?? item.exclusive ? ", độc quyền" : ""}">${fx || ps ? `<span class="kt-fx" aria-hidden="true">${fx}${ps ? `<span class="kt-ps">${ps}</span>` : ""}</span>` : ""}${ic}<span class="kt-t" data-t="${esc(item.name)}">${esc(item.name)}</span></span>`;
  }

  /* ---------- Tên, khung ảnh đại diện, khung bình luận, nền hồ sơ, huy hiệu ---------- */
  function name(n, eq) {
    eq = eq || {}; const c = eq.name_color && resolve(eq.name_color.style, "name_color"), f = eq.name_fx && resolve(eq.name_fx.style, "name_fx");
    if (!c && !f) return esc(n);
    const g = c && c.grad.length ? c.grad : f ? [f.a, f.b] : [];
    return `<span class="kn${f ? " kn-" + f.fx : ""}" style="--g:${gradCss(g.length > 1 ? g : [g[0], g[0]])};--a:${f ? f.a : g[0]};--b:${f ? f.b : g[1] || g[0]}" data-t="${esc(n)}">${esc(n)}</span>`;
  }
  function avatar(inner, eq, size = 40) {
    eq = eq || {}; const f = eq.frame && resolve(eq.frame.style, "frame"), x = eq.avatar_fx && resolve(eq.avatar_fx.style, "avatar_fx");
    if (!f && !x) return inner;
    const deco = f ? { tutien: `<i class="kf-dec">${icon("lotus")}</i>`, matu: '<i class="kf-dec kf-horn"><svg viewBox="0 0 40 14"><path d="M4 14C4 6 8 2 13 0c-2 4-1 8 2 11M36 14c0-8-4-12-9-14 2 4 1 8-2 11" fill="currentColor"/></svg></i>', tinhkhong: '<i class="kf-orb"></i>', anime: '<i class="kf-dec kf-burst">' + icon("star4") + "</i>" }[f.th] : "";
    return `<span class="kfr${f ? " kf-" + f.th : ""}${x ? " kx kx-" + x.th : ""}" style="--fs:${size}px;--a:${(f || x).a};--b:${(f || x).b};--c:${(f || x).c}">${x ? '<i class="kx-aura"></i>' : ""}${inner}${f ? '<i class="kf-ring"></i>' + deco : ""}</span>`;
  }
  const cframe = eq => { const f = eq && eq.comment_frame && resolve(eq.comment_frame.style, "comment_frame"); return f ? { cls: " kcf kcf-" + f.th, style: `--a:${f.a};--b:${f.b};--c:${f.c}` } : { cls: "", style: "" } };
  const bgStyle = it => { const f = it && resolve(it.style, "profile_bg"); return f ? `kbg kbg-${f.th}" style="--a:${f.a};--b:${f.b};--c:${f.c}` : "" };
  function badge(it, size = 34) {
    if (!it) return ""; const f = resolve(it.style, "badge"), q = num(it.q ?? it.quality, 1, 7, 2);
    return `<span class="kbd kbd-${f.th}" style="--a:${f.a};--b:${f.b};--q:${QC[q - 1]};--bs:${size}px" title="${esc(it.name)}">${f.img ? `<img src="${esc(f.img)}" alt="">` : icon(f.icon || "star")}${f.n ? `<b>${esc(f.n)}</b>` : ""}</span>`;
  }
  // Ô xem trước cho mọi loại vật phẩm (cửa hàng, kho đồ, trình tạo)
  function preview(it, who = "Đạo hữu") {
    if (!it) return "";
    const k = it.kind, s = resolve(it.style, k), av = `<span class="kg-av">${esc([...who][0])}</span>`;
    if (k === "title") return `<div class="kg-pv kg-pv-title">${title(it, { size: "md" })}</div>`;
    if (k === "frame" || k === "avatar_fx") return `<div class="kg-pv">${avatar(av, { [k]: it }, 64)}</div>`;
    if (k === "name_color" || k === "name_fx") return `<div class="kg-pv"><b class="kg-pvn">${name(who, { [k]: it })}</b></div>`;
    if (k === "profile_bg" || k === "banner") return `<div class="kg-pv kg-pvbg ${bgStyle(it)}"></div>`;
    if (k === "badge") return `<div class="kg-pv">${badge(it, 54)}</div>`;
    if (k === "comment_frame") { const c = cframe({ comment_frame: it }); return `<div class="kg-pv"><div class="kg-pvc${c.cls}" style="${c.style}"><b>${esc(who)}</b><span>Chương này hay quá, mong chương mới!</span></div></div>` }
    if (k === "card_fx") return `<div class="kg-pv"><div class="kcd kcd-${s.th}" style="--a:${s.a};--b:${s.b}"><span class="kg-av">${esc([...who][0])}</span><b>${esc(who)}</b></div></div>`;
    if (k === "bundle") return `<div class="kg-pv kg-pvbg ${bgStyle({ style: { preset: "profile_bg-" + (s.th || "tutien") } })}"><span class="kg-bdl">${icon("gem")}</span></div>`;
    return "";
  }


  /* ---------- Hộp chọn vật phẩm có hình xem trước (dùng khi Admin trao tặng, đặt phần thưởng, tạo gói) ----------
     o: { items, title, multi, selected: [id], owned: Set(id), kind } → Promise trả về id (hoặc mảng id), hoặc null nếu đóng */
  const STN = { draft: "Nháp", on: "Đang bán", off: "Ngừng bán", limited: "Giới hạn", hidden: "Ẩn" };
  const OBN = { shop: "Cửa hàng", level: "Mốc cấp", achievement: "Thành tựu", event: "Sự kiện", admin: "Admin trao", encounter: "Kỳ ngộ", secret: "Bí mật" };
  const qOf = it => Math.round(num(it.q ?? it.quality, 1, 7, 1));
  function pickItem(o) {
    return new Promise(done => {
      const L = (o.items || []).map(it => ({ ...it, q: qOf(it), ex: it.ex ?? it.exclusive })), multi = !!o.multi, owned = o.owned || new Set();
      const sel = new Set(o.selected || []), F = { q: "", k: o.kind || "", th: "", ql: 0 };
      const m = document.createElement("div"); m.className = "kgp-m";
      m.innerHTML = `<div class="kgp" role="dialog" aria-modal="true" aria-label="${esc(o.title || "Chọn vật phẩm")}"><div class="kgp-h"><b>${esc(o.title || "Chọn vật phẩm")}</b><button type="button" class="kgp-x" aria-label="Đóng">✕</button></div>
<div class="kgp-f"><input type="search" placeholder="Tìm theo tên hoặc mã" aria-label="Tìm"><select data-f="k" aria-label="Loại"><option value="">Mọi loại</option>${Object.entries(KINDS).map(([k, l]) => `<option value="${k}"${k === F.k ? " selected" : ""}>${l}</option>`).join("")}</select>
<select data-f="th" aria-label="Chủ đề"><option value="">Mọi chủ đề</option>${Object.entries(THEMES).map(([k, l]) => `<option value="${k}">${l}</option>`).join("")}</select><select data-f="ql" aria-label="Phẩm chất"><option value="0">Mọi phẩm chất</option>${QN.map((l, i) => `<option value="${i + 1}">${l}</option>`).join("")}</select></div>
<div class="kgp-g" role="listbox"${multi ? ' aria-multiselectable="true"' : ""}></div><div class="kgp-b"><span class="kgp-n"></span><button type="button" class="kgp-no">Hủy</button><button type="button" class="kgp-ok">${multi ? "Xong" : "Chọn món này"}</button></div></div>`;
      const g = m.querySelector(".kgp-g"), byId = Object.fromEntries(L.map(x => [x.id, x]));
      const foot = () => { const S = [...sel].map(i => byId[i]).filter(Boolean); m.querySelector(".kgp-n").innerHTML = S.length ? (multi ? `Đã chọn ${S.length}: ` : "Đã chọn: ") + S.map(x => `<b>${esc(x.name)}</b>`).join(", ") : '<span class="kgp-mu">Chưa chọn món nào</span>'; m.querySelector(".kgp-ok").disabled = !multi && !S.length };
      const draw = () => {
        const R = L.filter(x => (!F.k || x.kind === F.k) && (!F.th || x.theme === F.th) && (!F.ql || x.q === F.ql) && (!F.q || (x.name + " " + x.id).toLowerCase().includes(F.q)));
        g.innerHTML = R.length ? R.map(x => `<button type="button" class="kgp-i${sel.has(x.id) ? " on" : ""}" role="option" aria-selected="${sel.has(x.id)}" data-id="${esc(x.id)}" style="--q:${QC[x.q - 1]}">
<span class="kgp-p">${x.kind === "title" ? title(x, { size: "md" }) : preview(x)}</span><span class="kgp-t"><b>${esc(x.name)}</b><small>${KINDS[x.kind] || x.kind}, ${THEMES[x.theme] || ""}</small>
<span class="kgp-tags"><em class="kgp-q">${QN[x.q - 1]}${x.ex ? ", độc quyền" : ""}</em>${x.status && x.status !== "on" ? `<em>${STN[x.status] || x.status}</em>` : ""}${(x.obtain || []).filter(k => k !== "shop").map(k => `<em>${OBN[k] || k}</em>`).join("")}${owned.has(x.id) ? '<em class="kgp-own">Đã có</em>' : ""}</span></span><i class="kgp-ck" aria-hidden="true">✓</i></button>`).join("") : '<p class="kgp-mu">Không có vật phẩm nào khớp.</p>';
      };
      const close = v => { m.remove(); removeEventListener("keydown", key); done(v) }, key = e => { if (e.key === "Escape") close(null) };
      m.addEventListener("click", e => {
        if (e.target === m || e.target.closest(".kgp-x,.kgp-no")) return close(null);
        if (e.target.closest(".kgp-ok")) return close(multi ? [...sel] : [...sel][0] || null);
        const b = e.target.closest(".kgp-i"); if (!b) return; const id = b.dataset.id;
        if (multi) sel.has(id) ? sel.delete(id) : sel.add(id); else { sel.clear(); sel.add(id) }
        g.querySelectorAll(".kgp-i").forEach(x => { const on = sel.has(x.dataset.id); x.classList.toggle("on", on); x.setAttribute("aria-selected", on) }); foot();
      });
      g.addEventListener("dblclick", e => { const b = e.target.closest(".kgp-i"); if (b && !multi) close(b.dataset.id) });
      m.querySelector("input").oninput = e => { F.q = e.target.value.trim().toLowerCase(); draw() };
      m.querySelectorAll("select").forEach(x => x.onchange = () => { F[x.dataset.f] = x.dataset.f === "ql" ? +x.value : x.value; draw() });
      addEventListener("keydown", key); document.body.appendChild(m); draw(); foot(); m.querySelector("input").focus();
    });
  }
  // Thẻ nhỏ cho món đã chọn, đặt cạnh nút "Chọn vật phẩm"
  const chosen = it => it ? `<span class="kgp-cs" style="--q:${QC[qOf(it) - 1]}"><span class="kgp-p">${it.kind === "title" ? title({ ...it, q: qOf(it), ex: it.ex ?? it.exclusive }) : preview({ ...it, q: qOf(it) })}</span><span><b>${esc(it.name)}</b><small>${KINDS[it.kind]}, ${QN[qOf(it) - 1]}</small></span></span>` : '<span class="kgp-mu">Chưa chọn</span>';

  /* ---------- Chế độ hiệu ứng và tạm dừng khi ra khỏi màn hình ---------- */
  const LS = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) {} } };
  let DEF = "full";
  function fxMode(v) {
    if (v) LS.set("ktfx", v);
    const m = ok(LS.get("ktfx") || DEF, ["full", "simple", "off"], "full");
    document.documentElement.dataset.ktfx = m; return m;
  }
  const setDefault = v => { DEF = ok(v, ["full", "simple", "off"], "full"); fxMode() };
  let IO = null;
  function watch() {
    if (!("IntersectionObserver" in window)) { document.querySelectorAll(".kt,.kfr,.kn,.kcd").forEach(x => x.classList.add("kg-on")); return }
    IO = IO || new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle("kg-on", e.isIntersecting)), { rootMargin: "60px" });
    document.querySelectorAll(".kt:not([data-kw]),.kfr:not([data-kw]),.kn:not([data-kw]),.kcd:not([data-kw]),.kbg:not([data-kw])").forEach(x => { x.dataset.kw = 1; IO.observe(x) });
  }
  let pend = false;
  new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; watch() }) }).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- CSS ---------- */
  const css = document.createElement("style"); css.id = "kg-css";
  css.textContent = `
.kg-i{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.kt{--sp:1;position:relative;isolation:isolate;display:inline-flex;align-items:center;gap:.32em;height:1.6em;padding:0 .6em;font:700 .78em/1 var(--ff);letter-spacing:.01em;white-space:nowrap;vertical-align:middle;border-radius:.4em;max-width:100%;contain:layout style}
.kt.kt-md{font-size:1em}.kt.kt-lg{font-size:1.35em}
.kt.kt-fr{display:inline-block;position:relative;width:12em;height:2.2em;padding:0;margin:.45em .1em;border:0;border-radius:0;background:none;box-shadow:none;overflow:visible;vertical-align:middle;contain:none;isolation:isolate}
.kt.kt-fr::before,.kt.kt-fr::after{display:none}
.kt-fr .kt-fi{position:absolute;left:0;top:calc(1.1em - var(--ty) * var(--ar) * 12em);width:100%;height:auto;max-width:none;pointer-events:none;user-select:none;-webkit-user-drag:none}
.kt.kt-fr .kt-t{position:absolute;left:50%;top:50%;z-index:1;transform:translate(-50%,-50%);overflow:visible;max-width:none;font:italic 700 calc(var(--fz) * 1em)/1.25 "Noto Serif",Georgia,serif;letter-spacing:.01em;white-space:nowrap;-webkit-text-stroke:0;color:transparent;-webkit-text-fill-color:transparent;background:var(--tg);background-size:100% 100%;-webkit-background-clip:text;background-clip:text;animation:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.95)) drop-shadow(0 0 3px rgba(0,0,0,.85))}
.kt.kt-fr .kt-t::after{display:none}
.kt-f-tutien{--tg:linear-gradient(180deg,#fff8dc 15%,#ffd36b 55%,#d0912a 92%)}
.kt-f-matu{--tg:linear-gradient(180deg,#ffe6e1 15%,#ff8a74 55%,#e0393a 92%)}
.kt-f-tinhkhong{--tg:linear-gradient(180deg,#f4f9ff 15%,#b3dbff 55%,#64aefc 92%)}
.kt-f-anime{--tg:linear-gradient(180deg,#fff5fb 15%,#ffb8e8 55%,#ff63c6 92%)}
.kt.kt-fr.kt-sm{font-size:.82em;margin:1.05em .15em}.kt.kt-fr.kt-md{font-size:.86em}.kt.kt-fr.kt-lg{font-size:1.2em}
.kt-t{position:relative;min-width:0;color:var(--tc);background:var(--g);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;-webkit-text-stroke:var(--sk) var(--skc);paint-order:stroke fill;background-size:200% 100%;overflow:hidden;text-overflow:ellipsis}
.kt-q1 .kt-t{-webkit-text-fill-color:var(--tc);background:none}
.kt-q3 .kt-t,.kt-q4 .kt-t,.kt-q5 .kt-t,.kt-q6 .kt-t,.kt-q7 .kt-t,.kt-ex .kt-t{filter:drop-shadow(0 0 calc(5px * var(--gi)) var(--gl))}
.kt-it .kt-t{font-weight:800;font-style:italic;font-family:"Be Vietnam Pro",system-ui,sans-serif;letter-spacing:.02em}
.kt::before{content:"";position:absolute;inset:0;z-index:-2;border-radius:inherit;pointer-events:none}
.kt-bg-plate::before{background:linear-gradient(135deg,var(--b1),var(--b2))}
.kt-bg-scroll::before{background:radial-gradient(circle at 0 50%,var(--b2) 0 .45em,transparent .46em),radial-gradient(circle at 100% 50%,var(--b2) 0 .45em,transparent .46em),linear-gradient(180deg,var(--b2),var(--b1) 50%,var(--b2));border-radius:.8em}
.kt-bg-seal::before{background:radial-gradient(120% 140% at 50% 120%,color-mix(in srgb,var(--bc) 35%,transparent),transparent 60%),linear-gradient(135deg,var(--b1),var(--b2))}
.kt-bg-ribbon::before{background:linear-gradient(90deg,var(--b2),var(--b1),var(--b2));clip-path:polygon(0 0,100% 0,calc(100% - .45em) 50%,100% 100%,0 100%,.45em 50%);border-radius:0}
.kt-bg-void::before{background:radial-gradient(1px 1px at 20% 30%,#fff 50%,transparent),radial-gradient(1px 1px at 70% 70%,#fff 50%,transparent),radial-gradient(1px 1px at 85% 25%,#fffa 50%,transparent),radial-gradient(1px 1px at 40% 80%,#fff8 50%,transparent),radial-gradient(80% 120% at 50% 50%,var(--b2),var(--b1))}
.kt-bg-cel::before{background:radial-gradient(circle,#0000000f 1px,transparent 1.2px) 0 0/5px 5px,linear-gradient(135deg,var(--b1),var(--b2));box-shadow:2px 2px 0 var(--bc)}
.kt-bd-thin::before{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--bc) 70%,transparent)}
.kt-bd-double::before{box-shadow:inset 0 0 0 1px var(--bc),inset 0 0 0 3px transparent,inset 0 0 0 4px color-mix(in srgb,var(--bc) 45%,transparent)}
.kt-bd-rune::before{box-shadow:inset 0 0 0 1px var(--bc),0 0 0 1px color-mix(in srgb,var(--bc) 35%,transparent)}
.kt-bd-rune::after{content:"";position:absolute;inset:-3px;z-index:-1;border-radius:.55em;pointer-events:none;border:1.5px solid var(--bc);-webkit-mask:conic-gradient(at 9px 9px,transparent 75%,#000 0) 0 0/calc(100% - 9px) calc(100% - 9px);mask:conic-gradient(at 9px 9px,transparent 75%,#000 0) 0 0/calc(100% - 9px) calc(100% - 9px)}
.kt-bd-spike::before{background:var(--bc)!important;box-shadow:none;clip-path:polygon(.5em 0,calc(100% - .5em) 0,100% 50%,calc(100% - .5em) 100%,.5em 100%,0 50%);border-radius:0}
.kt-bd-spike::after{content:"";position:absolute;inset:1.5px;z-index:-2;clip-path:polygon(.5em 0,calc(100% - .5em) 0,100% 50%,calc(100% - .5em) 100%,.5em 100%,0 50%);background:radial-gradient(120% 140% at 50% 130%,color-mix(in srgb,var(--bc) 30%,transparent),transparent 60%),linear-gradient(135deg,var(--b1),var(--b2));pointer-events:none}
.kt-bd-spike{padding:0 .9em}
.kt-bd-orbit::before{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--bc) 80%,transparent);border-radius:1em}
.kt-bd-orbit::after{content:"";position:absolute;width:5px;height:5px;border-radius:50%;background:var(--bc);box-shadow:0 0 6px var(--bc);offset-path:inset(0 round 1em);animation:kt-orb calc(6s * var(--sp)) linear infinite;z-index:1;pointer-events:none}
.kt-bd-cel::before{box-shadow:inset 0 0 0 1.5px var(--bc),2px 2px 0 var(--bc)}
.kt-bd-cel{transform:skewX(-6deg)}.kt-bd-cel>*{transform:skewX(6deg)}
.kt-ex{outline:1px dashed color-mix(in srgb,var(--gl) 60%,transparent);outline-offset:2px}
.kt-ic,.kt-av{position:relative;display:inline-grid;place-items:center;width:var(--isz);height:var(--isz);color:var(--ic);flex:none}
.kt-ic img{width:100%;height:100%;object-fit:contain}
.kt-av{width:1.5em;height:1.5em;margin:0 .05em 0 -.35em;border-radius:50%;overflow:hidden;background:color-mix(in srgb,var(--ic) 30%,#fff);box-shadow:0 0 0 1.5px var(--bc)}.kt-av svg,.kt-av img{width:160%;height:auto;margin-top:22%}
.kt-ring{position:absolute;inset:-.45em;color:var(--ic);opacity:calc(.7 * var(--op));pointer-events:none}.kt-ring svg{width:100%;height:100%;display:block}
.kt-fx{position:absolute;inset:-4px -6px;z-index:-1;pointer-events:none;opacity:var(--op);overflow:hidden;border-radius:.6em}
.kt-aura{position:absolute;inset:-30% -10%;background:radial-gradient(50% 60% at 50% 50%,color-mix(in srgb,var(--gl) 55%,transparent),transparent 70%)}
.kt-aurora{position:absolute;inset:0 -50%;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--ic) 45%,transparent),color-mix(in srgb,var(--gl) 40%,transparent),transparent);mix-blend-mode:screen}
.kt-mist{position:absolute;width:70%;height:160%;top:-30%;left:-20%;background:radial-gradient(closest-side,color-mix(in srgb,var(--bc) 55%,transparent),transparent);opacity:.8}.kt-mist.m2{left:50%;top:-10%}
.kt-flame{position:absolute;left:0;right:0;bottom:-10%;height:70%;background:radial-gradient(40% 90% at 20% 100%,color-mix(in srgb,var(--gl) 70%,transparent),transparent),radial-gradient(35% 80% at 55% 100%,color-mix(in srgb,var(--ic) 70%,transparent),transparent),radial-gradient(40% 90% at 85% 100%,color-mix(in srgb,var(--gl) 60%,transparent),transparent)}
.kt-slash{position:absolute;top:-20%;bottom:-20%;width:18%;left:-30%;background:linear-gradient(100deg,transparent 30%,#ffffffd9 48%,color-mix(in srgb,var(--gl) 80%,#fff) 52%,transparent 70%);transform:skewX(-25deg);opacity:0}
.kt-bolt{position:absolute;left:8%;right:8%;top:10%;height:80%;color:color-mix(in srgb,var(--gl) 70%,#fff);opacity:0}.kt-bolt svg{width:100%;height:100%}
.kt-ps{position:absolute;inset:0}
.kt-pt{position:absolute;left:var(--x);top:var(--y);width:var(--s);height:var(--s);background:var(--pc);border-radius:50%;opacity:0}
.t-spark{box-shadow:0 0 4px var(--pc)}
.t-qi{width:calc(var(--s) * .7);height:calc(var(--s) * 2.4);border-radius:50%;background:linear-gradient(transparent,var(--pc));filter:blur(.4px)}
.t-petal{border-radius:80% 0 80% 0;background:linear-gradient(135deg,var(--pc),#fff)}
.t-ember{box-shadow:0 0 5px var(--pc),0 0 2px #fff}
.t-smoke{width:calc(var(--s) * 3);height:calc(var(--s) * 3);background:radial-gradient(closest-side,color-mix(in srgb,var(--pc) 60%,transparent),transparent)}
.t-star,.t-square{border-radius:0;clip-path:polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%);background:var(--pc)}
.t-square{width:calc(var(--s) * 1.4);height:calc(var(--s) * 1.4)}
.t-dust{width:calc(var(--s) * .5);height:calc(var(--s) * .5)}
.t-rune{border-radius:1px;background:none;border:1px solid var(--pc);transform:rotate(45deg)}
.t-bolt{border-radius:0;clip-path:polygon(40% 0,100% 0,60% 45%,90% 45%,20% 100%,40% 55%,10% 55%);width:calc(var(--s) * 1.4);height:calc(var(--s) * 2)}
/* Chỉ chạy hiệu ứng khi danh hiệu đang hiện trên màn hình */
.kg-on.kt-gm .kt-t{animation:kt-gm calc(5s * var(--sp)) linear infinite}
.kg-on.kt-sw .kt-t::after{content:attr(data-t);position:absolute;inset:0;background:linear-gradient(100deg,transparent 40%,#ffffffe6 50%,transparent 60%) 0 0/300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;-webkit-text-stroke:0;animation:kt-sweep calc(3.6s * var(--sp)) ease-in-out infinite}
.kg-on .kt-aura{animation:kt-aura calc(4s * var(--sp)) ease-in-out infinite}
.kg-on.kt-br .kt-fx{animation:kt-breathe calc(3.2s * var(--sp)) ease-in-out infinite}
.kg-on .kt-ring{animation:kt-spin calc(14s * var(--sp)) linear infinite}
.kg-on .kt-aurora{animation:kt-aurora calc(7s * var(--sp)) ease-in-out infinite alternate}
.kg-on .kt-mist{animation:kt-mist calc(6s * var(--sp)) ease-in-out infinite alternate}.kg-on .kt-mist.m2{animation-duration:calc(8s * var(--sp))}
.kg-on .kt-flame{animation:kt-flame calc(1.6s * var(--sp)) ease-in-out infinite alternate}
.kg-on .kt-slash{animation:kt-slash calc(4.5s * var(--sp)) ease-in infinite}
.kg-on .kt-bolt{animation:kt-bolt calc(5.5s * var(--sp)) linear infinite}
.kg-on .kt-pt{animation:kt-up var(--du) linear var(--dl) infinite}
.kg-on .kt-pt.d-down{animation-name:kt-down}.kg-on .kt-pt.d-left{animation-name:kt-left}.kg-on .kt-pt.d-right{animation-name:kt-right}.kg-on .kt-pt.d-float{animation-name:kt-twinkle}.kg-on .kt-pt.d-around{animation-name:kt-around}
@keyframes kt-gm{to{background-position:-200% 0}}
@keyframes kt-sweep{0%,30%{background-position:150% 0}70%,100%{background-position:-150% 0}}
@keyframes kt-aura{0%,100%{transform:scale(.92);opacity:.7}50%{transform:scale(1.06);opacity:1}}
@keyframes kt-breathe{0%,100%{opacity:calc(.55 * var(--op))}50%{opacity:var(--op)}}
@keyframes kt-spin{to{transform:rotate(360deg)}}
@keyframes kt-aurora{from{transform:translateX(-18%)}to{transform:translateX(18%)}}
@keyframes kt-mist{from{transform:translate(-10%,5%) scale(1)}to{transform:translate(25%,-5%) scale(1.2)}}
@keyframes kt-flame{from{transform:scaleY(.85);opacity:.75}to{transform:scaleY(1.1);opacity:1}}
@keyframes kt-slash{0%,70%{left:-30%;opacity:0}74%{opacity:1}88%{left:110%;opacity:.9}100%{left:110%;opacity:0}}
@keyframes kt-bolt{0%,86%,100%{opacity:0}88%{opacity:.85}90%{opacity:.2}92%{opacity:.7}95%{opacity:0}}
@keyframes kt-up{0%{transform:translateY(60%) rotate(var(--rt));opacity:0}20%{opacity:.9}100%{transform:translateY(-260%) rotate(var(--rt));opacity:0}}
@keyframes kt-down{0%{transform:translate(0,-200%) rotate(var(--rt));opacity:0}20%{opacity:.9}100%{transform:translate(60%,180%) rotate(calc(var(--rt) + 180deg));opacity:0}}
@keyframes kt-left{0%{transform:translateX(200%);opacity:0}25%{opacity:.9}100%{transform:translateX(-400%);opacity:0}}
@keyframes kt-right{0%{transform:translateX(-200%) scaleX(1.6);opacity:0}25%{opacity:.9}100%{transform:translateX(400%) scaleX(1.6);opacity:0}}
@keyframes kt-twinkle{0%,100%{opacity:0;transform:scale(.4) rotate(var(--rt))}50%{opacity:1;transform:scale(1) rotate(var(--rt))}}
@keyframes kt-around{from{transform:rotate(0) translateX(120%) rotate(45deg);opacity:.85}to{transform:rotate(360deg) translateX(120%) rotate(45deg);opacity:.85}}
@keyframes kt-orb{from{offset-distance:0%}to{offset-distance:100%}}
/* Tên */
.kn{position:relative;background:var(--g);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;background-size:200% 100%}
.kg-on.kn{animation:kt-gm 6s linear infinite}
.kn-glow,.kn-qi{filter:drop-shadow(0 0 3px color-mix(in srgb,var(--a) 60%,transparent))}
.kn-flame{filter:drop-shadow(0 -1px 1px color-mix(in srgb,var(--a) 70%,transparent)) drop-shadow(0 0 2px color-mix(in srgb,var(--b) 50%,transparent))}
.kn-stars::after{content:"✦";position:absolute;right:-.7em;top:-.45em;font-size:.6em;-webkit-text-fill-color:var(--a);opacity:.9}
.kg-on.kn-stars::after{animation:kt-twinkle 2.6s ease-in-out infinite}
.kn-cel{-webkit-text-stroke:.6px #1b1033;paint-order:stroke fill;filter:drop-shadow(1.5px 1.5px 0 #1b103399)}
/* Khung ảnh đại diện */
.kfr{position:relative;display:inline-grid;place-items:center;flex:none;width:var(--fs);height:var(--fs);isolation:isolate;border-radius:50%}.kfr>:not(i){width:100%!important;height:100%!important}
.kfr>:not(i){border-radius:50%}.cmi>.kfr{align-self:flex-start}
.kf-ring{position:absolute;inset:-3px;border-radius:50%;padding:3px;background:conic-gradient(from 0deg,var(--a),var(--b),var(--c),var(--a));-webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);pointer-events:none}
.kg-on .kf-ring{animation:kt-spin 10s linear infinite}
.kf-dec{position:absolute;left:50%;bottom:-24%;width:46%;transform:translateX(-50%);color:var(--a);filter:drop-shadow(0 0 2px var(--b));pointer-events:none;display:grid}.kf-dec svg,.kf-dec .kg-i{width:100%;height:auto;fill:color-mix(in srgb,var(--a) 50%,transparent)}
.kf-horn{bottom:auto;top:-20%;width:70%;color:var(--a)}
.kf-burst{bottom:auto;top:-14%;left:auto;right:-16%;width:38%;transform:none;color:var(--c)}.kf-burst .kg-i{fill:var(--c)}
.kf-orb{position:absolute;inset:-14%;border:1px solid color-mix(in srgb,var(--a) 70%,transparent);border-radius:50%;transform:rotateX(70deg) rotate(0);pointer-events:none}
.kf-orb::after{content:"";position:absolute;top:-3px;left:50%;width:6px;height:6px;border-radius:50%;background:var(--c);box-shadow:0 0 6px var(--c)}
.kg-on .kf-orb{animation:kf-orb 6s linear infinite}@keyframes kf-orb{to{transform:rotateX(70deg) rotate(360deg)}}
.kx-aura{position:absolute;inset:-22%;z-index:-1;border-radius:50%;background:radial-gradient(closest-side,color-mix(in srgb,var(--a) 65%,transparent),transparent);pointer-events:none}
.kg-on .kx-aura{animation:kt-aura 3s ease-in-out infinite}
/* Khung bình luận */
.kcf{border-radius:10px;padding:10px 12px!important;background:linear-gradient(135deg,color-mix(in srgb,var(--a) 12%,transparent),transparent 60%);box-shadow:inset 3px 0 0 var(--a),inset 0 0 0 1px color-mix(in srgb,var(--a) 25%,transparent)}
.kcf-matu{box-shadow:inset 3px 0 0 var(--b),inset 0 0 0 1px color-mix(in srgb,var(--b) 30%,transparent);background:linear-gradient(135deg,color-mix(in srgb,var(--b) 14%,transparent),transparent 65%)}
.kcf-tinhkhong{background:radial-gradient(1px 1px at 92% 20%,var(--c),transparent),radial-gradient(1px 1px at 80% 70%,var(--c),transparent),linear-gradient(135deg,color-mix(in srgb,var(--a) 14%,transparent),transparent 60%)}
.kcf-anime{box-shadow:inset 0 0 0 1.5px var(--a),3px 3px 0 color-mix(in srgb,var(--a) 40%,transparent)}
/* Thẻ thành viên */
.kcd{position:relative;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:12px;background:var(--s1,#2221);isolation:isolate}
.kcd::before{content:"";position:absolute;inset:-1.5px;z-index:-1;border-radius:13px;background:conic-gradient(from var(--kang,0deg),var(--a),var(--b),var(--a))}
.kcd::after{content:"";position:absolute;inset:1px;z-index:-1;border-radius:11px;background:var(--s1,#1b1630)}
.kg-on.kcd::before{animation:kt-spin2 6s linear infinite}@property --kang{syntax:"<angle>";inherits:false;initial-value:0deg}@keyframes kt-spin2{to{--kang:360deg}}
/* Nền hồ sơ */
.kbg.kbg-tutien{background:radial-gradient(60% 40% at 20% 100%,color-mix(in srgb,var(--c) 35%,transparent),transparent),radial-gradient(50% 35% at 80% 100%,color-mix(in srgb,var(--a) 30%,transparent),transparent),linear-gradient(180deg,#0b2830,#123a44 60%,#1d5560)}
.kbg.kbg-matu{background:radial-gradient(50% 60% at 70% 30%,color-mix(in srgb,var(--b) 45%,transparent),transparent),radial-gradient(40% 50% at 15% 80%,#7c2cff40,transparent),linear-gradient(160deg,#120409,#2a0716 60%,#14050b)}
.kbg.kbg-tinhkhong{background:radial-gradient(1.5px 1.5px at 10% 20%,#fff,transparent),radial-gradient(1px 1px at 30% 70%,#fff,transparent),radial-gradient(1.5px 1.5px at 55% 35%,#fffc,transparent),radial-gradient(1px 1px at 75% 15%,#fff,transparent),radial-gradient(1px 1px at 90% 60%,#fff,transparent),radial-gradient(45% 55% at 70% 60%,color-mix(in srgb,var(--b) 45%,transparent),transparent),radial-gradient(40% 50% at 25% 40%,color-mix(in srgb,var(--a) 40%,transparent),transparent),#070822}
.kbg.kbg-anime{background:radial-gradient(circle,#ffffff22 1px,transparent 1.4px) 0 0/8px 8px,linear-gradient(180deg,#ff9ec9,#ffb27a 55%,#6a5cff)}
/* Huy hiệu */
.kbd{position:relative;display:inline-grid;place-items:center;width:var(--bs);height:calc(var(--bs) * 1.1);color:#fff;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:linear-gradient(160deg,var(--a),var(--b));flex:none}
.kbd::before{content:"";position:absolute;inset:2px;clip-path:inherit;background:linear-gradient(160deg,color-mix(in srgb,var(--a) 60%,#000),color-mix(in srgb,var(--b) 70%,#000));z-index:0}
.kbd>*{position:relative;z-index:1}.kbd .kg-i{width:48%;height:48%;color:var(--a)}.kbd img{width:62%;height:62%;object-fit:contain}
.kbd b{position:absolute;bottom:14%;font:800 calc(var(--bs) * .26)/1 "Be Vietnam Pro",sans-serif;color:#fff;text-shadow:0 1px 2px #000}
/* Xem trước */
.kg-pv{display:grid;place-items:center;min-height:96px;padding:14px;border-radius:10px;background:radial-gradient(120% 90% at 50% 0,#ffffff12,transparent),#15131f;color:#f3f2f8;overflow:hidden}
.kg-pv-title{font-size:1.05rem}
.kg-pvbg{min-height:96px}.kg-pvn{font-size:1.25rem}
.kg-av{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:linear-gradient(160deg,#ff00ff,#5b1a6b);color:#fff;font-weight:700;font-size:1.6rem}
.kcd .kg-av{width:40px;height:40px;font-size:1rem;flex:none}
.kg-pvc{display:flex;flex-direction:column;gap:3px;min-width:220px;font-size:.88rem}.kg-pvc span{color:#cfcde0}
.kg-bdl{width:46px;height:46px;color:#fff;display:grid}.kg-bdl .kg-i{width:100%;height:100%}
.kg-girl{display:block}
/* Hộp chọn vật phẩm */
.kgp-m{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;background:#000a}
.kgp{display:flex;flex-direction:column;width:min(980px,100%);max-height:92vh;background:var(--bg,#fff);color:var(--tx,#14131a);border-radius:16px;box-shadow:0 24px 70px #0009;overflow:hidden}
.kgp-h{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--bd,#ddd)}.kgp-h b{font-size:1.1rem}
.kgp-x{width:34px;height:34px;margin:0;padding:0;border:0;border-radius:50%;background:var(--s1,#eee);color:var(--tx,#111);justify-content:center}
.kgp-f{display:flex;flex-wrap:wrap;gap:8px;padding:12px 18px}.kgp-f input{flex:2 1 200px}.kgp-f select{flex:1 1 140px;width:auto}
.kgp-f input,.kgp-f select{background:var(--s1,#f2f1f7);color:var(--tx,#111);border:1px solid var(--bd,#ddd);border-radius:8px;padding:8px 10px;font:inherit}
.kgp-g{flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px;padding:4px 18px 16px;align-content:start}
.kgp-i{position:relative;display:flex;flex-direction:column;gap:8px;margin:0;padding:8px;border:0;border-radius:12px;background:var(--s1,#f2f1f7);color:inherit;text-align:left;cursor:pointer;box-shadow:inset 0 3px 0 var(--q);font:inherit;justify-content:flex-start;align-items:stretch}
.kgp-i:hover{background:var(--s2,#e6e4ef)}.kgp-i:focus-visible{outline:2px solid var(--ac,#f0f)}
.kgp-i.on{box-shadow:inset 0 3px 0 var(--q),0 0 0 2px var(--ac,#f0f)}
.kgp-p{display:grid;place-items:center;min-height:70px;border-radius:9px;background:#15131f;color:#f3f2f8;overflow:hidden;padding:6px}.kgp-p .kg-pv{min-height:58px;width:100%;padding:4px;background:none}
.kgp-t{display:flex;flex-direction:column;gap:2px;padding:0 2px}.kgp-t small{color:var(--mu,#777);font-size:.78rem}
.kgp-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}.kgp-tags em{font-style:normal;font-size:.7rem;padding:1px 6px;border-radius:4px;background:var(--bg,#fff);color:var(--mu,#666)}
.kgp-tags .kgp-q{color:var(--q);box-shadow:inset 0 0 0 1px var(--q);background:none;font-weight:700}.kgp-tags .kgp-own{background:var(--ok,#04a74b);color:#fff}
.kgp-ck{position:absolute;top:12px;right:12px;display:none;width:24px;height:24px;border-radius:50%;background:var(--ac,#f0f);color:#fff;font-style:normal;font-weight:800;place-items:center}.kgp-i.on .kgp-ck{display:grid}
.kgp-b{display:flex;align-items:center;gap:8px;padding:12px 18px;border-top:1px solid var(--bd,#ddd)}.kgp-n{flex:1;min-width:0;font-size:.88rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kgp-b button{margin:0}
.kgp-no{background:var(--s1,#eee)!important;color:var(--tx,#111)!important}.kgp-mu{color:var(--mu,#777)}
.kgp-cs{display:flex;flex-wrap:wrap;max-width:100%;overflow:hidden;align-items:center;gap:6px 10px;padding:6px;border-radius:10px;background:var(--bg,#fff);box-shadow:inset 3px 0 0 var(--q);min-width:0}.kgp-cs .kgp-p{min-height:44px;padding:6px 12px;max-width:100%}.kgp-cs>span:last-child{display:flex;flex-direction:column;min-width:0}.kgp-cs small{color:var(--mu,#777);font-size:.75rem}
.kgp-pick{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.kgp-pick>button{margin:0}
@media(max-width:600px){.kgp-g{grid-template-columns:1fr 1fr}.kgp-p{min-height:56px}}
/* Chế độ hiệu ứng: đầy đủ / đơn giản / tắt, và tôn trọng thiết lập giảm chuyển động */
[data-ktfx=simple] .kt-fx,[data-ktfx=simple] .kt-ring,[data-ktfx=off] .kt-fx,[data-ktfx=off] .kt-ring,[data-ktfx=off] .kf-dec,[data-ktfx=off] .kf-orb,[data-ktfx=off] .kx-aura{display:none}
[data-ktfx=simple] *,[data-ktfx=off] *{animation-play-state:paused!important}
[data-ktfx=simple] .kt-sw .kt-t::after,[data-ktfx=off] .kt-sw .kt-t::after{display:none}
[data-ktfx=off] .kt-t{filter:none!important}
@media (prefers-reduced-motion:reduce){.kt *,.kt,.kfr *,.kn,.kcd::before{animation:none!important}.kt-fx{display:none}.kt-sw .kt-t::after{display:none}}
`;
  (document.head || document.documentElement).appendChild(css);
  fxMode();

  window.KG = { THEMES, QN, QC, KINDS, FONTS, PARTS, DIRS, LAYERS, BGS, BORDERS, IC, esc, icon, girl, art: artHtml, preset, resolve, title, name, avatar, cframe, bgStyle, badge, preview, fxMode, setDefault, watch, IMGOK, pickItem, chosen };
})();
