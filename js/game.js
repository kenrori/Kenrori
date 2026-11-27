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
  // Bộ biểu tượng hai tông tự vẽ: .nb nền nhạt, .nm màu chính, .nw lớp sáng, .nh điểm sáng, .nx khoét tối, .ns nét màu, .nk nét sáng
  const IC = (() => {
    const f = n => +n.toFixed(2);
    const sp = (x, y, r, c = "m") => `<path class="n${c}" d="M${x} ${f(y - r)}C${f(x + r * .14)} ${f(y - r * .14)} ${f(x + r * .14)} ${f(y - r * .14)} ${f(x + r)} ${y}C${f(x + r * .14)} ${f(y + r * .14)} ${f(x + r * .14)} ${f(y + r * .14)} ${x} ${f(y + r)}C${f(x - r * .14)} ${f(y + r * .14)} ${f(x - r * .14)} ${f(y + r * .14)} ${f(x - r)} ${y}C${f(x - r * .14)} ${f(y - r * .14)} ${f(x - r * .14)} ${f(y - r * .14)} ${x} ${f(y - r)}Z"/>`;
    const rot = (n, inner, a0 = 0) => Array.from({ length: n }, (_, i) => `<g transform="rotate(${a0 + i * 360 / n} 12 12)">${inner}</g>`).join("");
    const arc = (rx, ry, deg, t0, t1, steps = 18) => { const r = deg * Math.PI / 180, p = []; for (let i = 0; i <= steps; i++) { const t = t0 + (t1 - t0) * i / steps, x = rx * Math.cos(t), y = ry * Math.sin(t); p.push(`${f(12 + x * Math.cos(r) - y * Math.sin(r))} ${f(12 + x * Math.sin(r) + y * Math.cos(r))}`) } return "M" + p.join("L") };
    const star5 = (cx, cy, R, r) => "M" + Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; return `${f(cx + q * Math.cos(a))} ${f(cy + q * Math.sin(a))}` }).join("L") + "Z";
    const mir = s => `<g transform="matrix(-1 0 0 1 24 0)">${s}</g>`;
    return {
      /* ----- Tu tiên ----- */
      sword: `<path class="nm" d="M20.8 3.2 19.9 6.4 9.5 16.8 7.2 14.5 17.6 4.1Z"/><path class="nk" d="M19.5 4.5 8.9 15.1"/><path class="nm" d="M5.1 13.3 6.6 11.8 12.2 17.4 10.7 18.9Z"/><path class="nb" d="M8.1 16.6 9.4 17.9 5.7 21.6 4.4 20.3Z"/><circle class="nm" cx="4.1" cy="21.9" r="1.2"/>`,
      swords: `<path class="nm" d="M20.9 3.1 20.1 5.9 10.1 15.9 8.1 13.9 18.1 3.9Z"/><path class="nm" d="M3.1 3.1 5.9 3.9 15.9 13.9 13.9 15.9 3.9 5.9Z"/><path class="nk" d="M19.6 4.4 9.6 14.4M4.4 4.4l10 10"/><path class="nm" d="M6.4 12 7.6 10.8 11.6 14.8 10.4 16ZM17.6 12 16.4 10.8 12.4 14.8 13.6 16Z"/><path class="nb" d="M8.7 16.1 9.9 17.3 6.4 20.8 5.2 19.6ZM15.3 16.1 14.1 17.3 17.6 20.8 18.8 19.6Z"/><circle class="nm" cx="4.9" cy="21.1" r="1.15"/><circle class="nm" cx="19.1" cy="21.1" r="1.15"/>`,
      lotus: `<path class="nb" d="M12 16.6C7.4 17.6 3.6 16.2 1.8 13 5.6 11.8 9.2 13 12 16.6ZM12 16.6C16.6 17.6 20.4 16.2 22.2 13 18.4 11.8 14.8 13 12 16.6Z"/><path class="nm" d="M12 15C8 15 4.6 12.6 3.4 8.8 7 8.6 10 10.8 12 15ZM12 15C16 15 19.4 12.6 20.6 8.8 17 8.6 14 10.8 12 15Z"/><path class="nm" d="M12 3.4C14.8 6.2 15.2 10.6 12 15 8.8 10.6 9.2 6.2 12 3.4Z"/><path class="nw" d="M12 3.4C14.8 6.2 15.2 10.6 12 15Z"/><path class="nk" d="M12 6.2C12.9 7.6 13.1 9.6 12.6 11.4"/><path class="ns" d="M5.5 20.2H18.5"/>`,
      cloud: `<path class="nb" d="M13.4 10.2C13.6 7.4 16.4 5.6 19 6.6 21.2 7.4 21.8 10 20.6 11.8 19.2 10.9 17 10.9 15.6 12 15.2 11.1 14.4 10.5 13.4 10.2Z"/><path class="nm" d="M5.6 18C3 18 1.8 16 2.4 14.2 3 12.6 4.8 12 6 12.6 6.4 9.6 9 7.8 11.8 8.4 14 8.9 15.2 10.6 15.4 12.2 16.6 10.8 19.6 11 20.8 13.1 22 15.2 20.6 18 18 18Z"/><path class="nk" d="M7.8 15.6C7.8 14 9.8 13.5 10.5 14.7 11.1 15.8 9.6 16.4 9.2 15.6M14.6 15.8C14.8 14.6 16.4 14.4 16.8 15.4"/>`,
      gourd: `<path class="nb" d="M12 3.6C13.2 2 15.2 2 16 3.2 14.8 4.4 13.2 4.4 12 3.6Z"/><path class="ns" d="M12 4.6V2.6"/><circle class="nm" cx="12" cy="7.8" r="3.3"/><circle class="nm" cx="12" cy="15.6" r="5.8"/><rect class="nw" x="9.2" y="10.3" width="5.6" height="1.5" rx=".75"/><path class="nk" d="M8.4 14.4C8.6 12.8 9.6 12 10.7 11.8"/><circle class="nh" cx="10.6" cy="6.7" r=".8"/>`,
      talisman: `<path class="nm" d="M6.8 2.5H17.2V19L12 21.6 6.8 19Z"/><path class="nw" d="M6.8 2.5H17.2V5H6.8Z"/><path class="nk" d="M12 6.8V15M9.4 9H14.6M9.8 12.2C11 13.2 13 13.2 14.2 12.2"/><circle class="nh" cx="12" cy="17.4" r="1.3"/>`,
      taiji: `<circle class="nb" cx="12" cy="12" r="9.6"/><path class="nm" d="M12 2.4A9.6 9.6 0 0 1 12 21.6 4.8 4.8 0 0 1 12 12 4.8 4.8 0 0 0 12 2.4Z"/><circle class="nm" cx="12" cy="7.2" r="1.5"/><circle class="nh" cx="12" cy="16.8" r="1.5"/><circle class="ns" cx="12" cy="12" r="9.6"/>`,
      mountain: `<circle class="nb" cx="18.6" cy="5.4" r="2.2"/><path class="nb" d="M9 20.5 15.6 7.4 22.6 20.5Z"/><path class="nm" d="M1.4 20.5 8.6 6.6 15.8 20.5Z"/><path class="nh" d="M8.6 6.6 10.8 10.8 9.6 10.2 8.6 11.4 7.5 10.1 6.5 10.6Z"/><path class="nw" d="M15.6 7.4 17.2 10.4 16.2 10 15.4 10.8 14.7 9.8Z"/><path class="nw" d="M8.6 6.6 15.8 20.5H8.6Z"/>`,
      crane: `<path class="nb" d="M4.6 14.4C6.6 10.4 9.4 8.2 13.4 7.6 12.6 10.8 10.2 13.6 4.6 14.4Z"/><path class="nm" d="M2.8 15.4C6.4 16.4 10.4 15.6 12.8 12.8 14.4 10.8 15 8.4 15.2 6L16.8 4.6 19.8 5.2 17 6.4 16.6 9.6C16.4 13.4 13.6 17.6 7.6 18.2 5.6 18.4 4 17.2 2.8 15.4Z"/><path class="nk" d="M6.4 16.6C9.8 16.4 12.6 14.8 14.2 12"/><circle class="nh" cx="17.2" cy="4.8" r="1"/><path class="ns" d="M10.8 17.6 11.6 21.6M8.6 18 8.2 21.6"/>`,
      cauldron: `<path class="nb" d="M9.6 6.4C8.6 5 10.2 4.2 9.6 2.6M14.4 6.4C13.4 5 15 4.2 14.4 2.6"/><path class="ns" d="M4.6 10.4C2.6 10.4 2.6 13.8 4.8 13.8M19.4 10.4C21.4 10.4 21.4 13.8 19.2 13.8M7.4 17.4 6.4 21.2M16.6 17.4 17.6 21.2"/><path class="nm" d="M4.6 9.4H19.4V12C19.4 16.2 16.4 18.8 12 18.8 7.6 18.8 4.6 16.2 4.6 12Z"/><rect class="nm" x="3" y="7.4" width="18" height="2.6" rx="1.3"/><path class="nw" d="M12 9.4H19.4V12C19.4 16.2 16.4 18.8 12 18.8Z"/><path class="nk" d="M8.2 13.2H15.8"/><path class="nkd" d="M3 10H21" /><circle class="nh" cx="12" cy="13.2" r="1.1"/>`.replace('class="nb" d="M9.6', 'class="nsb" d="M9.6'),
      pill: `<circle class="nb" cx="12" cy="12.6" r="9.4"/><circle class="nm" cx="12" cy="12.6" r="6.6"/><path class="nw" d="M12 6A6.6 6.6 0 0 1 12 19.2 3.3 3.3 0 0 1 12 12.6 3.3 3.3 0 0 0 12 6Z"/><ellipse class="nh" cx="9.6" cy="10" rx="1.8" ry="1.1" transform="rotate(-35 9.6 10)"/>${sp(19.4, 4.2, 2.2, "m")}`,
      peach: `<path class="nb" d="M12 9.6C11 6.6 8.4 5 5.4 5.6 6.6 8.2 9.2 9.8 12 9.6ZM12.4 9.4C13.4 6.4 15.8 5 18.8 5.4 17.6 8 15.2 9.6 12.4 9.4Z"/><path class="nm" d="M12 20.8C6.8 20.8 3.8 17 4.6 13 5.4 9 9.4 7.8 12 10 14.6 7.8 18.6 9 19.4 13 20.2 17 17.2 20.8 12 20.8Z"/><path class="nw" d="M12 10C14.6 7.8 18.6 9 19.4 13 20.2 17 17.2 20.8 12 20.8 11.2 17.8 11 13.4 12 10Z"/><path class="nk" d="M12 10.2C11 13.2 11.2 16.8 12.6 19.4"/><ellipse class="nh" cx="8.2" cy="13.4" rx="1.3" ry="2.2" transform="rotate(20 8.2 13.4)"/>`,
      fan: `<path class="nm" d="M12 20.4 2.4 10.4A13.4 13.4 0 0 1 21.6 10.4Z"/><path class="nw" d="M12 20.4 7.2 15.4A6.8 6.8 0 0 1 16.8 15.4Z"/><path class="nk" d="M12 20.4 4.8 8.8M12 20.4 8.2 6.4M12 20.4V5.6M12 20.4 15.8 6.4M12 20.4 19.2 8.8"/><path class="ns" d="M2.4 10.4A13.4 13.4 0 0 1 21.6 10.4"/><circle class="nh" cx="12" cy="20.2" r="1.2"/>`,
      bamboo: `<path class="nb" d="M10 8C13 6 16 6.4 18.6 4.2 17 8 13.6 9.2 10 8ZM16.4 11.2C19 11.6 21 13.2 22 15.6 19.4 15.2 17.6 13.8 16.4 11.2Z"/><rect class="nm" x="6.8" y="2" width="3.2" height="20" rx="1.6"/><rect class="nm" x="13.4" y="5" width="3.2" height="17" rx="1.6"/><path class="nkd" d="M6.8 8H10M6.8 14.4H10M13.4 11H16.6M13.4 17.2H16.6"/><path class="nk" d="M7.9 3.6V6.6M7.9 9.6V12.8M14.5 6.6V9.6"/>`,
      bell: `<circle class="ns" cx="12" cy="4.4" r="1.6"/><path class="nm" d="M5.8 17.2C5.8 12 6.8 6.4 12 6.4 17.2 6.4 18.2 12 18.2 17.2Z"/><path class="nw" d="M12 6.4C17.2 6.4 18.2 12 18.2 17.2H12Z"/><rect class="nm" x="4.2" y="16.6" width="15.6" height="2.6" rx="1.3"/><circle class="nm" cx="12" cy="20.8" r="1.5"/><path class="nk" d="M8.6 15C8.6 12 9.2 9.6 10.6 8.8"/><path class="nsb" d="M2.4 9.6C1.6 11.4 1.6 13.4 2.4 15.2M21.6 9.6C22.4 11.4 22.4 13.4 21.6 15.2"/>`,
      jade: `<path class="ns" d="M12 4.2V1.8M12 17.8V18.6M12 20.2V22.4M10.8 20 10.2 22.2M13.2 20 13.8 22.2"/><path class="nm" fill-rule="evenodd" d="M12 4.2A6.8 6.8 0 1 1 11.99 4.2ZM12 8.8A2.2 2.2 0 1 0 12.01 8.8Z"/><path class="nw" fill-rule="evenodd" d="M12 4.2A6.8 6.8 0 0 1 12 17.8V13.2A2.2 2.2 0 0 0 12 8.8Z"/><path class="nk" d="M7.6 9.2A4.8 4.8 0 0 1 12 6.4"/><circle class="nm" cx="12" cy="19.2" r="1.1"/>`,
      pagoda: `<path class="ns" d="M12 4.4V1.4"/><rect class="nb" x="8.2" y="8.6" width="7.6" height="2.8"/><rect class="nb" x="7.4" y="13.8" width="9.2" height="6.6"/><path class="nm" d="M2.6 9.6 12 4.4 21.4 9.6C17.6 8.8 6.4 8.8 2.6 9.6ZM4.2 14.6 12 10.8 19.8 14.6C16.4 13.8 7.6 13.8 4.2 14.6Z"/><rect class="nm" x="10.6" y="16.2" width="2.8" height="4.2" rx="1.4"/><rect class="nm" x="4.6" y="20.2" width="14.8" height="1.8" rx=".9"/><circle class="nh" cx="12" cy="7.2" r=".9"/>`,
      feather: `<path class="nm" d="M20 2.6C12.2 3.4 6.2 9.4 5.2 18.8 14 17.8 20 11.6 20 2.6Z"/><path class="nw" d="M20 2.6C20 11.6 14 17.8 5.2 18.8Z"/><path class="nk" d="M5 19.2 16.6 7.4M9.6 14.6H13.2M12 12.2H15.6"/><path class="ns" d="M5.6 18.4 2.8 21.4"/>`,
      brush: `<path class="nm" d="M17.8 2.2 21.8 6.2 11.4 16.6 7.4 12.6Z"/><path class="nw" d="M19.8 4.2 21.8 6.2 11.4 16.6 9.4 14.6Z"/><rect class="nh" x="9.9" y="11.9" width="1.4" height="5.6" rx=".7" transform="rotate(-45 10.6 14.7)"/><path class="nb" d="M7.4 12.6 11.4 16.6C10 19.2 6.6 21.4 2.2 21.8 2.4 17.6 4.8 14 7.4 12.6Z"/><path class="nm" d="M7.4 12.6 9.4 14.6C8 17.2 5.4 19.6 2.2 21.8 3.4 18 5.2 14.6 7.4 12.6Z"/>`,
      scroll: `<rect class="nb" x="5" y="5.8" width="14" height="12.4"/><path class="ns" d="M8 10H16M8 13H14.4"/><rect class="nm" x="3" y="3.2" width="18" height="3.4" rx="1.7"/><rect class="nm" x="3" y="17.4" width="18" height="3.4" rx="1.7"/><path class="nk" d="M4.8 4.4H19.2M4.8 18.6H19.2"/>`,
      seal: `<rect class="nb" x="7.6" y="2" width="8.8" height="6" rx="2.4"/><rect class="nm" x="3.6" y="7" width="16.8" height="15" rx="2.2"/><path class="nw" d="M12 7H18.2A2.2 2.2 0 0 1 20.4 9.2V19.8A2.2 2.2 0 0 1 18.2 22H12Z"/><path class="nk" d="M7.2 11H11M9.1 11V18.6M7.2 14.6H11M13.4 11.2H16.8V14.6H13.4ZM13.4 16.8H16.8M15.1 14.6V18.6"/>`,
      lantern: `<rect class="nm" x="9" y="2.8" width="6" height="2.2" rx=".8"/><rect class="nm" x="9" y="18.8" width="6" height="2.2" rx=".8"/><path class="ns" d="M12 21V23"/><path class="nm" d="M12 4.6C16.6 4.6 19.2 8 19.2 12 19.2 16 16.6 19.4 12 19.4 7.4 19.4 4.8 16 4.8 12 4.8 8 7.4 4.6 12 4.6Z"/><ellipse class="nw" cx="12" cy="12" rx="4" ry="6"/><path class="nkd" d="M12 4.6V19.4M8.4 5.6C6.8 9 6.8 15 8.4 18.4M15.6 5.6C17.2 9 17.2 15 15.6 18.4"/><ellipse class="nh" cx="12" cy="11" rx="1.4" ry="2.2"/>`,
      potion: `<rect class="nm" x="9.2" y="1.6" width="5.6" height="2.4" rx=".8"/><path class="nb" d="M9.6 3.8H14.4V8.2C17.6 9.4 19.6 12.2 19.6 15.6 19.6 19.6 16.2 22.2 12 22.2 7.8 22.2 4.4 19.6 4.4 15.6 4.4 12.2 6.4 9.4 9.6 8.2Z"/><path class="nm" d="M4.8 14.8C7.2 13.4 9.6 15.8 12 14.8 14.4 13.8 16.6 13.4 19.2 14.8 19.4 19.2 16 21.6 12 21.6 8 21.6 4.6 19.2 4.8 14.8Z"/><circle class="nh" cx="9.4" cy="17.6" r="1"/><circle class="nh" cx="13.6" cy="18.8" r=".7"/><circle class="nw" cx="11.8" cy="11.4" r=".9"/><path class="nk" d="M7.2 11.6C7.8 10.6 8.6 10 9.6 9.6"/>`,
      /* ----- Ma tu ----- */
      skull: `<path class="nm" d="M12 2.8C7 2.8 4 6.4 4 10.6 4 13.4 5.4 15.4 7.2 16.4V19.2C7.2 20 7.8 20.6 8.6 20.6H15.4C16.2 20.6 16.8 20 16.8 19.2V16.4C18.6 15.4 20 13.4 20 10.6 20 6.4 17 2.8 12 2.8Z"/><path class="nw" d="M12 2.8C17 2.8 20 6.4 20 10.6 20 13.4 18.6 15.4 16.8 16.4V19.2C16.8 20 16.2 20.6 15.4 20.6H12Z"/><ellipse class="nx" cx="8.9" cy="11.2" rx="2.2" ry="2.4"/><ellipse class="nx" cx="15.1" cy="11.2" rx="2.2" ry="2.4"/><path class="nx" d="M12 13.4 10.9 15.6H13.1Z"/><path class="nkd" d="M10.3 18V20.6M13.7 18V20.6"/><path class="nk" d="M6.8 7.4C7.6 5.8 9.2 4.8 10.8 4.6"/>`,
      flame: `<path class="nm" d="M12 22C7.4 22 4.8 18.8 4.8 15 4.8 10.6 9.2 8.6 9.6 3 12.8 4.8 15.4 8.4 14.8 11.6 16.2 10.8 16.8 9.6 16.8 8 18.8 10 19.2 12.6 19.2 15 19.2 18.8 16.6 22 12 22Z"/><path class="nw" d="M12 22C9.6 22 8.2 20.4 8.2 18.4 8.2 15.6 10.6 14.2 11.2 11.4 13.6 12.8 15.8 15.4 15.8 18.2 15.8 20.4 14.2 22 12 22Z"/><path class="nh" d="M12 22C10.8 22 10.2 21.2 10.2 20.2 10.2 18.8 11.4 18 11.8 16.6 13 17.4 13.8 18.6 13.8 20 13.8 21.2 13 22 12 22Z"/>`,
      eye: `<path class="ns" d="M5 7 3.6 5.2M8.2 5.4 7.4 3.4M12 4.8V2.6M15.8 5.4 16.6 3.4M19 7 20.4 5.2"/><path class="nb" d="M1.8 12C4.6 7 8 4.8 12 4.8 16 4.8 19.4 7 22.2 12 19.4 17 16 19.2 12 19.2 8 19.2 4.6 17 1.8 12Z"/><circle class="nm" cx="12" cy="12" r="4.6"/><path class="nx" d="M12 8.2C13 10 13 14 12 15.8 11 14 11 10 12 8.2Z"/><circle class="nh" cx="13.8" cy="10.2" r="1"/><path class="ns" d="M1.8 12C4.6 7 8 4.8 12 4.8 16 4.8 19.4 7 22.2 12 19.4 17 16 19.2 12 19.2 8 19.2 4.6 17 1.8 12Z"/>`,
      horn: `<path class="nm" d="M3.4 21C3.2 13.2 5.4 7 10.2 3.4 9.2 7.4 9.6 10.6 11.2 13 8.4 14.6 6.6 17.4 6.2 21ZM20.6 21C20.8 13.2 18.6 7 13.8 3.4 14.8 7.4 14.4 10.6 12.8 13 15.6 14.6 17.4 17.4 17.8 21Z"/><path class="nw" d="M10.2 3.4C9.2 7.4 9.6 10.6 11.2 13 8.4 14.6 6.6 17.4 6.2 21H5.2C5.4 14.4 7 8.4 10.2 3.4Z"/><path class="nk" d="M4.6 17 7.4 17.6M5.2 13.6 8.2 14.6M6.6 10.2 9.4 11.4M19.4 17 16.6 17.6M18.8 13.6 15.8 14.6M17.4 10.2 14.6 11.4"/>`,
      blood: `<path class="nb" d="M19.6 3.4S21.8 6 21.8 7.4A2.2 2.2 0 0 1 17.4 7.4C17.4 6 19.6 3.4 19.6 3.4Z"/><path class="nm" d="M12 2.6S18.6 10 18.6 14.6C18.6 18.4 15.6 21.4 12 21.4 8.4 21.4 5.4 18.4 5.4 14.6 5.4 10 12 2.6 12 2.6Z"/><path class="nw" d="M12 2.6S18.6 10 18.6 14.6C18.6 18.4 15.6 21.4 12 21.4Z"/><path class="nk" d="M8.6 15.6C8.6 13.6 9.6 11.8 10.8 10.6"/><circle class="nh" cx="9.2" cy="17.8" r=".8"/>`,
      scythe: `<path class="nm" d="M14.4 5C17.2 1.8 21.8 2 23 5 20 4.4 17 5.6 15.4 8.6Z"/><path class="nw" d="M23 5C20 4.4 17 5.6 15.4 8.6L14.8 7.2C17.2 5 20 4.2 23 5Z"/><path class="ns" d="M4.6 21.6 15.6 4.4" style="stroke-width:2"/><path class="nb" d="M5.6 18.2 7.6 19.4 6.4 21.4 4.4 20.2Z"/>`,
      moon: `<circle class="nb" cx="12" cy="12" r="10.4"/><path class="nm" d="M15.6 3.2A9 9 0 1 0 20.8 16.8 7.2 7.2 0 1 1 15.6 3.2Z"/><circle class="nx" cx="8" cy="13.6" r="1.3"/><circle class="nx" cx="10.6" cy="17.8" r=".9"/><path class="nk" d="M6 8.6C6.8 7 8 6 9.4 5.4"/>`,
      chain: `<path class="nb" fill-rule="evenodd" d="M13.4 8.6H17.8A3.4 3.4 0 0 1 17.8 15.4H13.4A3.4 3.4 0 0 1 13.4 8.6ZM13.8 10.6H17.4A1.4 1.4 0 0 1 17.4 13.4H13.8A1.4 1.4 0 0 1 13.8 10.6Z"/><path class="nm" fill-rule="evenodd" d="M6.2 8.6H10.6A3.4 3.4 0 0 1 10.6 15.4H6.2A3.4 3.4 0 0 1 6.2 8.6ZM6.6 10.6H10.2A1.4 1.4 0 0 1 10.2 13.4H6.6A1.4 1.4 0 0 1 6.6 10.6Z"/><path class="nm" d="M13.2 8.6H14.6V10.6H13.2ZM13.2 13.4H14.6V15.4H13.2Z"/><path class="ns" d="M1.4 12H2.8M21.2 12H22.6"/><path class="nk" d="M5.4 9.8H9.6"/>`,
      bat: `<path class="nm" d="M12 17.2C10.8 15.6 9 15 7.4 15.8 7.2 13.8 5.2 12.8 3.4 13.6 3.6 10.2 1.8 8.6 1 8.2 5.2 7.6 8.8 8.8 10.4 10.6L10.6 7.6 11.4 9.2H12.6L13.4 7.6 13.6 10.6C15.2 8.8 18.8 7.6 23 8.2 22.2 8.6 20.4 10.2 20.6 13.6 18.8 12.8 16.8 13.8 16.6 15.8 15 15 13.2 15.6 12 17.2Z"/><path class="nw" d="M13.6 10.6C15.2 8.8 18.8 7.6 23 8.2 22.2 8.6 20.4 10.2 20.6 13.6 18.8 12.8 16.8 13.8 16.6 15.8 15 15 13.2 15.6 12 17.2V9.2H12.6L13.4 7.6Z"/><circle class="nh" cx="11.2" cy="11.4" r=".5"/><circle class="nh" cx="12.8" cy="11.4" r=".5"/>`,
      mask: `<path class="nm" d="M6.6 5.2 5.2 1.6 8.8 4.2ZM17.4 5.2 18.8 1.6 15.2 4.2Z"/><path class="nm" d="M4 5C8 3.4 16 3.4 20 5 20.4 12.6 17.6 19.6 12 21 6.4 19.6 3.6 12.6 4 5Z"/><path class="nw" d="M12 3.8C14.8 3.8 17.8 4.2 20 5 20.4 12.6 17.6 19.6 12 21Z"/><path class="nx" d="M6.6 10.4C7.6 9 9.6 9 10.6 10.6 9.4 11.6 7.8 11.6 6.6 10.4ZM17.4 10.4C16.4 9 14.4 9 13.4 10.6 14.6 11.6 16.2 11.6 17.4 10.4Z"/><path class="nk" d="M12 5.4V8.8M6.2 13.6 8.4 14.4M17.8 13.6 15.6 14.4"/><path class="nkd" d="M9.4 16.4C10.8 17.6 13.2 17.6 14.6 16.4"/>`,
      claw: `<path class="nm" d="M5.4 3.2C9.6 10.2 9.8 15 6.6 21 7.2 14.6 6 9.4 3.2 4.2ZM11.6 2.4C15.4 9.6 15.4 14.6 12 21.6 12.8 15 12 9.4 9.4 3.4ZM17.8 3.2C21.6 9.6 21.4 14.4 18.2 20.4 18.8 14.4 18 9.4 15.6 4.2Z"/><path class="nh" d="M4.4 4.6C6.4 7.6 7.2 10 7.4 12.2 6.8 10.4 5.8 8 4.4 4.6Z"/>`,
      rose: `<path class="nb" d="M12 18.4C9.6 16.6 7 17 5.6 18.6 8 20 10.2 20 12 18.4ZM12 20.2C14.4 18.4 17 18.8 18.4 20.4 16 21.8 13.8 21.8 12 20.2Z"/><path class="ns" d="M12 15V22.4"/><path class="nm" d="M12 3.4C15.6 3.4 18.2 5.8 18.2 9.2 18.2 12.6 15.4 15.2 12 15.2 8.6 15.2 5.8 12.6 5.8 9.2 5.8 5.8 8.4 3.4 12 3.4Z"/><path class="nw" d="M12 3.4C15.6 3.4 18.2 5.8 18.2 9.2 18.2 12.6 15.4 15.2 12 15.2Z"/><path class="nk" d="M12 6.4C14 6.4 15 8 14.4 9.4 13.6 11 11 11 10.4 9.4 9.8 8 11 7.4 11.8 8M8.2 11.8C9.8 13 12.4 13.2 14.4 12.2"/>`,
      dagger: `<path class="nm" d="M12 1.6 14.2 5.8V14.4H9.8V5.8Z"/><path class="nw" d="M12 1.6 14.2 5.8V14.4H12Z"/><path class="nk" d="M12 4V13"/><rect class="nm" x="6.4" y="14.2" width="11.2" height="2.2" rx="1.1"/><rect class="nb" x="10.8" y="16.4" width="2.4" height="4.2"/><circle class="nm" cx="12" cy="21.4" r="1.4"/>`,
      /* ----- Tinh không ----- */
      star: `<path class="nm" d="${star5(12, 12.6, 10.2, 4.3)}"/><path class="nw" d="M12 2.4 14.53 9.12 21.7 9.45 16.09 13.93 18 20.85 12 16.9Z"/><circle class="nh" cx="9.6" cy="10.2" r=".9"/>`,
      star4: `${sp(19.2, 4.6, 2.6, "b")}<path class="nm" d="M12 1.6C12.9 7.6 16.4 11.1 22.4 12 16.4 12.9 12.9 16.4 12 22.4 11.1 16.4 7.6 12.9 1.6 12 7.6 11.1 11.1 7.6 12 1.6Z"/><path class="nw" d="M12 1.6C12.9 7.6 16.4 11.1 22.4 12H12Z"/><circle class="nh" cx="12" cy="12" r="1.3"/>`,
      planet: `<path class="ns" d="${arc(10.6, 3.4, -22, Math.PI, 2 * Math.PI)}"/><circle class="nm" cx="12" cy="12" r="6.2"/><path class="nw" d="M12 5.8A6.2 6.2 0 0 1 12 18.2Z"/><path class="nkd" d="${arc(6, 1.6, -22, 0, Math.PI, 10).replace(/M/, "M")}" style="opacity:.25"/><path class="ns" d="${arc(10.6, 3.4, -22, 0, Math.PI)}" style="stroke-width:1.8"/><circle class="nh" cx="9.6" cy="9.4" r="1.1"/>${sp(20.6, 3.4, 1.8, "m")}`,
      comet: `<path class="nb" d="M13.8 4.6 2.2 21.8 19.4 10.2Z"/><path class="nw" d="M14.8 7 5.6 18.4 17 9.2Z"/><circle class="nm" cx="16.6" cy="7.4" r="3.8"/><circle class="nh" cx="15.4" cy="6.2" r="1.2"/>${sp(6, 5, 1.6, "m")}`,
      orbit: `<ellipse class="ns" cx="12" cy="12" rx="10" ry="3.8" style="stroke-width:1.3"/><ellipse class="ns" cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)" style="stroke-width:1.3"/><ellipse class="ns" cx="12" cy="12" rx="10" ry="3.8" transform="rotate(-60 12 12)" style="stroke-width:1.3"/><circle class="nb" cx="12" cy="12" r="4.4"/><circle class="nm" cx="12" cy="12" r="2.8"/><circle class="nh" cx="11.2" cy="11.2" r=".8"/><circle class="nm" cx="22" cy="12" r="1.3"/><circle class="nm" cx="7" cy="3.3" r="1.1"/>`,
      galaxy: `${rot(2, `<path class="nm" d="M12 12C11.6 8.6 14.6 6.4 17.8 7.4 20.6 8.4 21.4 11.8 19.6 14.2 20.2 11.4 18 9.4 15.4 10.2 13.6 10.8 12.8 11.6 12 12Z"/>`)}${rot(2, `<path class="nb" d="M12 12C11.6 8.6 14.6 6.4 17.8 7.4 20.6 8.4 21.4 11.8 19.6 14.2 20.2 11.4 18 9.4 15.4 10.2 13.6 10.8 12.8 11.6 12 12Z"/>`, 90)}<circle class="nw" cx="12" cy="12" r="2.6"/><circle class="nh" cx="12" cy="12" r="1.5"/><circle class="nh" cx="4" cy="5" r=".6"/><circle class="nh" cx="20.4" cy="19.4" r=".6"/>`,
      sun: `<circle class="nb" cx="12" cy="12" r="7.6"/>${rot(8, `<path class="nm" d="M12 .9 13.4 4.6H10.6Z"/>`)}<circle class="nm" cx="12" cy="12" r="5.4"/><path class="nw" d="M12 6.6A5.4 5.4 0 0 1 12 17.4Z"/><ellipse class="nh" cx="10" cy="9.8" rx="1.5" ry="1" transform="rotate(-35 10 9.8)"/>`,
      constel: `<path class="ns" d="M4.6 18 9.4 9.4 16.4 12.8 19.4 4.6" style="stroke-width:1.1;opacity:.75"/>${sp(4.6, 18, 2.6)}${sp(9.4, 9.4, 3.2)}${sp(16.4, 12.8, 2.8)}${sp(19.4, 4.6, 2.4)}<circle class="nh" cx="9.4" cy="9.4" r=".7"/>`,
      crescent: `${sp(17.8, 6, 2.4, "m")}${sp(20.4, 11.6, 1.3, "b")}<path class="nm" d="M13 2.6A9.6 9.6 0 1 0 21.2 16.4 7.8 7.8 0 1 1 13 2.6Z"/><path class="nw" d="M13 2.6A7.8 7.8 0 0 0 21.2 16.4 9.6 9.6 0 0 1 4.8 19 10 10 0 0 0 13 2.6Z" style="opacity:.25"/><path class="nk" d="M5.4 9.4C6 7.2 7.4 5.4 9.2 4.4"/>`,
      blackhole: `<path class="nb" d="${arc(10.8, 3.8, -16, 0, 2 * Math.PI, 36)}Z"/><circle class="ns" cx="12" cy="12" r="5.4" style="stroke-width:1.6"/><circle class="nx2" cx="12" cy="12" r="4.4"/><path class="nm" d="${arc(10.8, 3.8, -16, 0, Math.PI)}${arc(7.2, 2.2, -16, Math.PI, 0).replace("M", "L")}Z"/><path class="nk" d="${arc(9, 3, -16, .5, 1.6, 6)}"/>${sp(4, 4, 1.4, "h")}`,
      compass: `<circle class="nb" cx="12" cy="12" r="9.8"/><path class="nm" fill-rule="evenodd" d="M12 2.2A9.8 9.8 0 1 1 11.99 2.2ZM12 4.4A7.6 7.6 0 1 0 12.01 4.4Z"/><path class="nm" d="M12 5 14.4 12H9.6Z"/><path class="nw" d="M12 19 9.6 12H14.4Z"/><path class="nkd" d="M12 19 9.6 12H14.4Z" style="opacity:.3"/><circle class="nh" cx="12" cy="12" r="1.2"/><path class="nk" d="M12 2.6V4M21.4 12H20M12 21.4V20M2.6 12H4"/>`,
      hourglass: `<path class="nb" d="M7 4.6H17C17 8.6 13.6 10.4 12.8 12 13.6 13.6 17 15.4 17 19.4H7C7 15.4 10.4 13.6 11.2 12 10.4 10.4 7 8.6 7 4.6Z"/><path class="nm" d="M8.8 6.4H15.2C14.6 8.6 12.8 9.8 12 11 11.2 9.8 9.4 8.6 8.8 6.4ZM8.4 19.4C9 16.8 10.8 15.6 12 15.4 13.2 15.6 15 16.8 15.6 19.4Z"/><path class="ns" d="M12 11V15.4" style="stroke-width:.9"/><rect class="nm" x="4.8" y="2.4" width="14.4" height="2.4" rx="1.2"/><rect class="nm" x="4.8" y="19.2" width="14.4" height="2.4" rx="1.2"/><path class="nk" d="M6.4 3.6H17.6"/>`,
      lighthouse: `<path class="nb" d="M15 6.4 23 3.6V9.4ZM9 6.4 1 3.6V9.4Z"/><path class="nm" d="M8.4 4.8 12 1.8 15.6 4.8Z"/><rect class="nw" x="9" y="4.6" width="6" height="3.4"/><circle class="nh" cx="12" cy="6.3" r="1.2"/><path class="nm" d="M9.4 8H14.6L16 21H8Z"/><path class="nw" d="M9 12H15L15.3 14.8H8.7Z"/><path class="nw" d="M8.4 17.4H15.6L15.8 19.4H8.2Z"/><rect class="nm" x="5.4" y="20.6" width="13.2" height="1.8" rx=".9"/>`,
      crystal: `<path class="nb" d="M6.2 9.4 3.4 12.8 6.6 18.8 8.4 13ZM17.8 9.4 20.6 12.8 17.4 18.8 15.6 13Z"/><path class="nm" d="M12 1.8 17.2 8 12 22.2 6.8 8Z"/><path class="nw" d="M12 1.8 17.2 8 12 22.2Z"/><path class="nk" d="M6.8 8H17.2M12 1.8 9.6 8 12 22.2"/><circle class="nh" cx="9.4" cy="5.6" r=".8"/>`,
      halo: `<ellipse class="nb" cx="12" cy="9" rx="10" ry="4.6"/><ellipse class="ns" cx="12" cy="9" rx="8.4" ry="3.4" style="stroke-width:2.4"/><ellipse class="nk" cx="12" cy="8.6" rx="8.4" ry="3.4" style="opacity:.6"/>${sp(12, 17.6, 4.2)}${sp(5.4, 17, 1.8, "b")}${sp(18.6, 17, 1.8, "b")}`,
      wing: `${mir(`<path class="nb" d="M12 12.6C9 8.6 5 7 1.6 7.2 2.6 9 3.6 10 5 10.4 3.8 11 3.4 12 3.6 13.2 5 12.6 6.4 12.8 7.6 13.4 6.8 14.4 6.8 15.6 7.4 16.6 9.4 15.2 11 14.2 12 12.6Z"/>`)}<path class="nm" d="M12 12.6C9 8.6 5 7 1.6 7.2 2.6 9 3.6 10 5 10.4 3.8 11 3.4 12 3.6 13.2 5 12.6 6.4 12.8 7.6 13.4 6.8 14.4 6.8 15.6 7.4 16.6 9.4 15.2 11 14.2 12 12.6Z"/><path class="nk" d="M10.4 12.2C8.2 10.2 6 9.4 4 9.4M9.6 13.6C8 13 6.6 12.8 5.4 13"/>${sp(12, 13, 2.4, "h")}`,
      /* ----- Anime ----- */
      katana: `<path class="nm" d="M21.8 2.2C20 7.6 14.6 13.6 8.6 16.4L7.6 15.4C12.8 12.2 17.6 7.2 21.8 2.2Z"/><path class="nk" d="M20.4 4.4C18 8.4 14 12.6 9.6 15.2"/><ellipse class="nm" cx="7.4" cy="16.6" rx="2.6" ry="1.2" transform="rotate(-45 7.4 16.6)"/><path class="nb" d="M7.4 18.2 6 16.8 2.2 20.6 3.6 22Z"/><path class="nkd" d="M4.2 19.6 5.2 20.6M5.4 18.4 6.4 19.4"/>`,
      bolt: `${sp(19.6, 18.6, 2, "b")}${sp(5, 5, 1.6, "b")}<path class="nm" d="M13.8 1.6 4.4 13.4H10.8L9.4 22.4 19.6 10H13.2Z"/><path class="nw" d="M13.8 1.6 9.6 11.2H12.2Z"/><path class="nh" d="M13.2 10H19.6L9.4 22.4 14.2 12Z" style="opacity:.25"/>`,
      sakura: `${rot(5, `<path class="nm" d="M12 12.2C8.6 10.8 7.6 6.6 9.4 3.2L12 4.9 14.6 3.2C16.4 6.6 15.4 10.8 12 12.2Z"/><path class="nw" d="M12 12.2C15.4 10.8 16.4 6.6 14.6 3.2L12 4.9Z"/><path class="nk" d="M12 10.4V7"/>`)}<circle class="nm" cx="12" cy="12" r="2.6"/><circle class="nh" cx="12" cy="12" r="1.6"/>${rot(5, `<circle class="nh" cx="12" cy="8.8" r=".6"/>`, 36)}`,
      heart: `<path class="nm" d="M12 21S2.6 15.2 2.6 8.8C2.6 5.6 5 3.4 7.8 3.4 9.6 3.4 11.2 4.4 12 6 12.8 4.4 14.4 3.4 16.2 3.4 19 3.4 21.4 5.6 21.4 8.8 21.4 15.2 12 21 12 21Z"/><path class="nw" d="M12 6C12.8 4.4 14.4 3.4 16.2 3.4 19 3.4 21.4 5.6 21.4 8.8 21.4 15.2 12 21 12 21Z"/><ellipse class="nh" cx="7.4" cy="8.2" rx="1.4" ry="2.2" transform="rotate(35 7.4 8.2)"/>`,
      crown: `<path class="nm" d="M3 8 7.4 12.2 12 4.6 16.6 12.2 21 8 19.2 18H4.8Z"/><path class="nw" d="M12 4.6 16.6 12.2 21 8 19.2 18H12Z"/><rect class="nm" x="4.4" y="18.2" width="15.2" height="2.6" rx="1.3"/><circle class="nm" cx="3" cy="7.6" r="1.5"/><circle class="nm" cx="12" cy="4.2" r="1.6"/><circle class="nm" cx="21" cy="7.6" r="1.5"/><circle class="nh" cx="8" cy="19.5" r=".8"/><circle class="nh" cx="12" cy="19.5" r=".8"/><circle class="nh" cx="16" cy="19.5" r=".8"/>`,
      shield: `<path class="nm" d="M12 2.2 20.2 5.4V11.4C20.2 16.4 16.8 20.4 12 21.8 7.2 20.4 3.8 16.4 3.8 11.4V5.4Z"/><path class="nw" d="M12 2.2 20.2 5.4V11.4C20.2 16.4 16.8 20.4 12 21.8Z"/><path class="nh" d="${star5(12, 11.6, 4.2, 1.8)}"/><path class="nk" d="M6 6.8 12 4.6"/>`,
      wand: `<path class="ns" d="M3.6 20.8 13.6 10.8" style="stroke-width:2.4"/><path class="nm" d="${star5(16.4, 7.6, 5.4, 2.4)}"/><path class="nw" d="M16.4 2.2 17.81 5.66 21.53 5.93 18.68 8.34 19.57 11.97 16.4 10Z"/><circle class="nh" cx="15.2" cy="6.6" r=".8"/>${sp(5.6, 5.4, 1.8, "b")}${sp(21, 17.4, 1.6, "b")}`,
      cat: `<path class="nm" d="M4.4 9.6 4.6 3.2 9.2 6.4C11 6 13 6 14.8 6.4L19.4 3.2 19.6 9.6C20.6 11 21 12.6 21 14 21 18.6 17 21 12 21 7 21 3 18.6 3 14 3 12.6 3.4 11 4.4 9.6Z"/><path class="nw" d="M6 5.6 6.2 8.6 8.2 7ZM18 5.6 17.8 8.6 15.8 7Z"/><ellipse class="nx" cx="8.8" cy="13.6" rx="1.3" ry="1.7"/><ellipse class="nx" cx="15.2" cy="13.6" rx="1.3" ry="1.7"/><circle class="nh" cx="9.2" cy="13" r=".45"/><circle class="nh" cx="15.6" cy="13" r=".45"/><path class="nh" d="M11 16.2H13L12 17.2Z"/><path class="nk" d="M1.4 15.2 6 15.8M1.8 18 6.2 17M22.6 15.2 18 15.8M22.2 18 17.8 17"/>`,
      paw: `<ellipse class="nm" cx="5" cy="11.2" rx="2" ry="2.6" transform="rotate(-20 5 11.2)"/><ellipse class="nm" cx="9.4" cy="6.6" rx="2.2" ry="2.8"/><ellipse class="nm" cx="14.6" cy="6.6" rx="2.2" ry="2.8"/><ellipse class="nm" cx="19" cy="11.2" rx="2" ry="2.6" transform="rotate(20 19 11.2)"/><path class="nm" d="M12 12.4C15.4 12.4 18 15 18 17.6 18 19.8 16.4 21 14.6 21 13.4 21 12.8 20.4 12 20.4 11.2 20.4 10.6 21 9.4 21 7.6 21 6 19.8 6 17.6 6 15 8.6 12.4 12 12.4Z"/><path class="nw" d="M12 12.4C15.4 12.4 18 15 18 17.6 18 19.8 16.4 21 14.6 21 13.4 21 12.8 20.4 12 20.4Z"/><circle class="nh" cx="9" cy="5.6" r=".7"/><circle class="nh" cx="9.6" cy="15.2" r=".8"/>`,
      ribbon: `<path class="nb" d="M11 13.4 8.2 20.6 10.6 19.6 11.8 21.4 12.8 13.4ZM13 13.4 15.8 20.6 13.4 19.6 12.2 21.4 11.2 13.4Z"/><path class="nm" d="M12 11C9 7 4 5.6 3 8 2 10.6 3.4 14.6 12 13ZM12 11C15 7 20 5.6 21 8 22 10.6 20.6 14.6 12 13Z"/><path class="nw" d="M12 11C15 7 20 5.6 21 8 22 10.6 20.6 14.6 12 13Z"/><path class="nk" d="M5 9.2C6.6 9.2 9 10.2 10.6 11.6M19 9.2C17.4 9.2 15 10.2 13.4 11.6"/><rect class="nm" x="10.2" y="9.6" width="3.6" height="4.6" rx="1.6"/><rect class="nh" x="10.9" y="10.4" width="1" height="2.6" rx=".5"/>`,
      note: `<path class="nm" d="M9.6 5.4 20.6 3.2V6.6L9.6 8.8Z"/><path class="ns" d="M9.6 17.4V5.6M20.6 15.4V3.4" style="stroke-width:1.8"/><ellipse class="nm" cx="7" cy="18" rx="3" ry="2.2" transform="rotate(-20 7 18)"/><ellipse class="nm" cx="18" cy="16" rx="3" ry="2.2" transform="rotate(-20 18 16)"/><ellipse class="nh" cx="6" cy="17.4" rx=".9" ry=".5" transform="rotate(-20 6 17.4)"/><ellipse class="nh" cx="17" cy="15.4" rx=".9" ry=".5" transform="rotate(-20 17 15.4)"/>${sp(4, 5, 1.8, "b")}`,
      magic: `<circle class="nb" cx="12" cy="12" r="10"/><circle class="ns" cx="12" cy="12" r="9.6" style="stroke-width:1.3"/><circle class="ns" cx="12" cy="12" r="7" style="stroke-width:.9"/><path class="ns" d="M12 5 18.06 15.5H5.94ZM12 19 5.94 8.5H18.06Z" style="stroke-width:1.1"/>${rot(6, `<circle class="nm" cx="12" cy="2.4" r="1"/>`, 30)}<circle class="nm" cx="12" cy="12" r="2.2"/><circle class="nh" cx="11.4" cy="11.4" r=".7"/>`,
      dragon: `<path class="nb" d="M8.6 7.2C6.6 4.6 3.8 4 2 4.8 3.6 6 4.4 7.6 4.4 9.6Z"/><path class="nm" d="M3 13C4 9 7.6 6.4 11.6 6.4L13 3.2 14.6 6.6 17.2 5 16.8 8C19 8.8 21 10.6 21.4 12.6L18.6 13 21 15C18.6 16.4 15.8 16.2 14 15.2 12.4 18 9.4 20.4 5.4 20.8 6.8 19.2 7.4 17.6 7.2 16 5.4 16 3.8 14.8 3 13Z"/><path class="nw" d="M16.8 8C19 8.8 21 10.6 21.4 12.6L18.6 13 21 15C18.6 16.4 15.8 16.2 14 15.2 14.6 12.6 15.6 10 16.8 8Z"/><circle class="nh" cx="15" cy="10.2" r="1"/><circle class="nx" cx="15.2" cy="10.3" r=".45"/><path class="ns" d="M19.4 13.6C21.6 14.6 22.6 16.8 22 19M10.4 10.4C9 11.6 8.6 13.4 9 15"/>`,
      phoenix: `<path class="nb" d="M12 18.4C10 20.4 7.4 21.8 4.2 21.8 7.2 20 8.6 18.2 9.4 16ZM12 18.4C14 20.4 16.6 21.8 19.8 21.8 16.8 20 15.4 18.2 14.6 16Z"/><path class="nm" d="M10.2 11.4C7 10.6 4 8.4 2.2 4.4 5.6 5.4 7.4 5.6 9 5.2 8.4 7 9 9 10.6 10.2ZM13.8 11.4C17 10.6 20 8.4 21.8 4.4 18.4 5.4 16.6 5.6 15 5.2 15.6 7 15 9 13.4 10.2Z"/><path class="nw" d="M13.8 11.4C17 10.6 20 8.4 21.8 4.4 18.4 5.4 16.6 5.6 15 5.2 15.6 7 15 9 13.4 10.2Z"/><path class="nm" d="M12 9C13.6 9 14.6 10.4 14.4 12.2L13.6 16C13.4 17.2 12.6 18 12 19.2 11.4 18 10.6 17.2 10.4 16L9.6 12.2C9.4 10.4 10.4 9 12 9Z"/><circle class="nm" cx="12" cy="7" r="1.9"/><path class="ns" d="M12 5.2C11.4 3.6 12.6 2.4 13.6 2.2"/><path class="nm" d="M11.2 19 12 23 12.8 19Z"/><circle class="nh" cx="12.6" cy="6.6" r=".55"/>`,
      /* ----- Chung ----- */
      book: `<path class="nm" d="M5 3H18.2A1.4 1.4 0 0 1 19.6 4.4V20.6H6.6A1.6 1.6 0 0 1 5 19Z"/><path class="nh" d="M6.6 17.6H19.6V20.6H6.6A1.5 1.5 0 0 1 6.6 17.6Z" style="opacity:.75"/><path class="nw" d="M12 3H18.2A1.4 1.4 0 0 1 19.6 4.4V17.6H12Z"/><path class="nkd" d="M6.6 3V17.6"/>${sp(12.6, 10.2, 3.2, "h")}`,
      bookopen: `<path class="nm" d="M2.4 5.4C5.6 4.2 9 4.4 11.4 6.4V20.2C9 18.6 5.6 18.4 2.4 19.4Z"/><path class="nw" d="M21.6 5.4C18.4 4.2 15 4.4 12.6 6.4V20.2C15 18.6 18.4 18.4 21.6 19.4Z"/><path class="nm" d="M21.6 5.4C18.4 4.2 15 4.4 12.6 6.4V20.2C15 18.6 18.4 18.4 21.6 19.4Z" style="opacity:.55"/><path class="nk" d="M4.6 8.8C6.4 8.4 8.2 8.6 9.6 9.4M4.6 11.8C6.4 11.4 8.2 11.6 9.6 12.4M14.4 9.4C15.8 8.6 17.6 8.4 19.4 8.8M14.4 12.4C15.8 11.6 17.6 11.4 19.4 11.8"/>${sp(12, 2.6, 1.8, "m")}`,
      clock: `<circle class="nm" cx="12" cy="12" r="9.6"/><circle class="nw" cx="12" cy="12" r="7.4"/><path class="nk" d="M12 4.6V6M19.4 12H18M12 19.4V18M4.6 12H6"/><path class="nkd" d="M12 7.2V12L15.4 14.2" style="stroke-width:1.8;opacity:.55"/><circle class="nh" cx="12" cy="12" r="1.2"/>`,
      gem: `<path class="nm" d="M6 3.4H18L22.2 9 12 21.6 1.8 9Z"/><path class="nw" d="M15 9H22.2L12 21.6Z"/><path class="nx" d="M1.8 9H9L12 21.6Z" style="opacity:.18"/><path class="nh" d="M9 9 10.6 3.4H13.4L15 9Z" style="opacity:.45"/><path class="nk" d="M1.8 9H22.2M9 9 12 21.6 15 9"/><path class="nh" d="M7.2 5 8.6 5 7.4 7.4Z"/>`,
      key: `<path class="nm" fill-rule="evenodd" d="M7.4 2.8A4.6 4.6 0 1 1 7.39 2.8ZM7.4 5.6A1.8 1.8 0 1 0 7.41 5.6Z"/><path class="nm" d="M9.2 11 11 9.2 20.8 19 19 20.8Z"/><path class="nm" d="M15.2 15 17.4 12.8 18.8 14.2 16.6 16.4ZM17.8 17.6 19.6 15.8 20.6 16.8 18.8 18.6Z"/><path class="nw" d="M7.4 2.8A4.6 4.6 0 0 1 10.65 10.65L8.67 8.67A1.8 1.8 0 0 0 7.4 5.6Z"/><path class="nk" d="M10.6 11.8 18.6 19.8"/>`,
      trophy: `<path class="ns" d="M6 5H3.4C3.4 8.6 4.8 10.4 7 10.6M18 5H20.6C20.6 8.6 19.2 10.4 17 10.6"/><path class="nm" d="M6 3H18V8.6C18 12.2 15.4 14.6 12 14.6 8.6 14.6 6 12.2 6 8.6Z"/><path class="nw" d="M12 3H18V8.6C18 12.2 15.4 14.6 12 14.6Z"/><rect class="nm" x="10.8" y="14.2" width="2.4" height="3.6"/><rect class="nm" x="7" y="17.8" width="10" height="3.6" rx="1.1"/><path class="nk" d="M8.4 4.6V8.6C8.4 10.4 9.2 11.8 10.4 12.6"/>${sp(12, 7.8, 2.4, "h")}`,
      medal: `<path class="nb" d="M7 1.8H11L13.6 8H9.6ZM17 1.8H13L10.4 8H14.4Z"/><circle class="nm" cx="12" cy="15" r="6.6"/><path class="nw" d="M12 8.4A6.6 6.6 0 0 1 12 21.6Z"/><circle class="nk" cx="12" cy="15" r="4.8"/><path class="nh" d="${star5(12, 15.2, 3, 1.3)}"/>`,
      coin: `<circle class="nm" cx="12" cy="12" r="9.6"/><path class="nw" d="M12 2.4A9.6 9.6 0 0 1 12 21.6Z"/><circle class="nk" cx="12" cy="12" r="7.6"/><rect class="nx" x="9.6" y="9.6" width="4.8" height="4.8" rx=".6"/><path class="nh" d="M6.4 8.2C7 6.8 8.2 5.6 9.6 5"/>`,
      snowflake: `${rot(6, `<path class="ns" d="M12 2V12M9.6 4 12 6.4 14.4 4M10.4 7.4 12 9 13.6 7.4" style="stroke-width:1.6"/>`)}<circle class="nm" cx="12" cy="12" r="2.4"/><circle class="nh" cx="12" cy="12" r=".9"/>`,
      ginkgo: `<path class="ns" d="M12 21.6V13.4"/><path class="nm" d="M12 13.6C8.6 13.6 4 11 3 5.4 6.4 4.4 9.6 5 12 7.6 14.4 5 17.6 4.4 21 5.4 20 11 15.4 13.6 12 13.6Z"/><path class="nw" d="M12 7.6C14.4 5 17.6 4.4 21 5.4 20 11 15.4 13.6 12 13.6Z"/><path class="nx" d="M12 7.6 11 5.6 13 5.6Z" style="opacity:.5"/><path class="nk" d="M12 13.4 7 7.4M12 13.4 9.4 6.6M12 13.4 14.6 6.6M12 13.4 17 7.4"/>`,
      wave: `<path class="nb" d="M1.6 18.2C4 17.2 6 19.2 8.4 18.2 10.8 17.2 12.8 19.2 15.2 18.2 17.6 17.2 19.6 19.2 22.4 18.2V21.8H1.6Z"/><path class="nm" d="M2.4 18.6C2.4 11 7.4 5.6 13.4 5.6 18 5.6 21 8.8 21 12.4 21 15 19 16.8 16.6 16.8 14.8 16.8 13.4 15.6 13.4 14 13.4 12.6 14.4 11.6 15.8 11.6 15 10.2 13.6 9.6 12.2 9.6 8.8 9.6 6.2 13 6.2 18.6Z"/><path class="nw" d="M13.4 5.6C18 5.6 21 8.8 21 12.4 21 15 19 16.8 16.6 16.8 18.4 15.6 19.2 14.2 19.2 12.4 19.2 9 16.6 6.4 13.4 5.6Z"/><path class="nk" d="M4.4 15.4C5 11.4 8 8 12 7.4"/><circle class="nh" cx="15.8" cy="13.8" r=".9"/>${sp(20, 4, 1.6, "b")}`,
      torii: `<path class="nm" d="M1.6 5.2C7 6.2 17 6.2 22.4 5.2L21.4 8H2.6Z"/><rect class="nm" x="4" y="9.6" width="16" height="1.9" rx=".5"/><rect class="nm" x="5.8" y="7.6" width="2.4" height="14.2" rx=".5"/><rect class="nm" x="15.8" y="7.6" width="2.4" height="14.2" rx=".5"/><rect class="nw" x="10.9" y="7.8" width="2.2" height="1.8"/><path class="nk" d="M3.4 6.6C9 7.4 15 7.4 20.6 6.6"/>`,
      spider: `<path class="ns" d="M12 1.6V7" style="stroke-width:1"/><path class="ns" d="M9.4 9.6 4.4 6.4 2.4 8.4M9.4 12 3.6 11.4 2 13.6M9.6 14 5 16.6 4.6 19.6M14.6 9.6 19.6 6.4 21.6 8.4M14.6 12 20.4 11.4 22 13.6M14.4 14 19 16.6 19.4 19.6" style="stroke-width:1.5"/><ellipse class="nm" cx="12" cy="9" rx="2.6" ry="2.2"/><ellipse class="nm" cx="12" cy="15" rx="3.6" ry="4.4"/><path class="nw" d="M12 10.6C14 10.6 15.6 12.6 15.6 15 15.6 17.4 14 19.4 12 19.4Z"/><path class="nh" d="M12 13.4 13.2 15 12 16.6 10.8 15Z"/>`
    };
  })();
  const icon = (id, cls = "") => IC[id] ? `<svg class="kg-i kg-d ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[id]}</svg>` : "";

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
  const ICW = [ // từ khóa trong tên (đã bỏ dấu) -> biểu tượng, cụm dài xét trước
    ["dao tri", "peach"], ["truong sinh", "peach"], ["hai thuoc", "potion"], ["duoc", "potion"], ["dan lo", "cauldron"], ["kim dan", "pill"], ["phu luc", "talisman"], ["cam tien", "note"], ["truc co", "bamboo"], ["thanh van", "cloud"], ["ngu kiem", "swords"],
    ["thanh nhan", "halo"], ["hong tran", "lotus"], ["thien menh", "star"], ["tan tien", "feather"], ["lao to", "pagoda"], ["son", "mountain"], ["con lon", "mountain"], ["loi", "bolt"], ["tien de", "crown"], ["tien vuong", "crown"], ["tien tu", "lotus"], ["dao to", "taiji"], ["dao ton", "taiji"], ["dao nhan", "taiji"], ["dao", "taiji"], ["chan quan", "seal"],
    ["thich khach", "dagger"], ["bach cot", "skull"], ["cot dich", "skull"], ["u minh", "lantern"], ["am phong", "bat"], ["hac phong", "bat"], ["quy", "mask"], ["da xoa", "mask"], ["thuc hon", "eye"], ["vuc ngoai", "eye"], ["phe tam", "rose"], ["vo tam", "rose"], ["luyen thi", "seal"], ["nghiep hoa", "flame"], ["hong lien", "flame"], ["cuu u", "chain"], ["vo gian", "chain"],
    ["van kiep", "scythe"], ["thi than", "scythe"], ["tu la", "claw"], ["doa tien", "wing"], ["diet the", "blackhole"], ["hon don", "blackhole"], ["huyet hai", "wave"], ["huyet", "blood"], ["vinh da", "crescent"], ["nguyet", "moon"], ["ma de", "crown"], ["ma", "horn"],
    ["hai dang", "lighthouse"], ["tinh hai", "compass"], ["thuy thu", "compass"], ["truy tinh", "comet"], ["sao choi", "comet"], ["dem sao", "constel"], ["ngan ha", "galaxy"], ["tinh ha", "galaxy"], ["tinh van", "galaxy"], ["hu khong", "orbit"], ["vu tru", "orbit"], ["hac dong", "blackhole"], ["tinh vuc", "planet"], ["nguyet than", "moon"], ["bat hu", "halo"],
    ["vo tan", "star4"], ["thoi khong", "hourglass"], ["ky nguyen", "hourglass"], ["tinh hon", "crystal"], ["khai sang", "sun"], ["nhat nguyet", "sun"], ["sieu thoat", "wing"], ["tinh than", "star"],
    ["di gioi", "magic"], ["chuyen truong", "ribbon"], ["hoc sinh", "ribbon"], ["mao hiem", "shield"], ["tho san", "dagger"], ["anh hung", "shield"], ["hac kiem", "katana"], ["long", "dragon"], ["phuong", "phoenix"], ["than linh", "bolt"], ["ma vuong", "horn"], ["gioi han", "wing"], ["chien binh", "shield"],
    ["nhan vat chinh", "star4"], ["dinh menh", "bolt"], ["dung gia", "sword"], ["vi vua", "crown"], ["kich ban", "bookopen"], ["trum cuoi", "crown"], ["tac gia", "brush"], ["giu lua", "flame"], ["hoang nu", "crown"], ["meo", "cat"], ["kiem", "sword"],
    ["vuong", "crown"], ["de", "crown"], ["chu", "crown"], ["tien", "lotus"], ["thien", "cloud"]
  ].map(([k, v]) => [" " + k + " ", v]);
  const THI = { tutien: "lotus", matu: "horn", tinhkhong: "star4", anime: "star4" };
  function autoIcon(name, th, fb) {
    const n = " " + String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, " ").trim() + " ";
    let m = ICW.find(([k]) => n.includes(k)); if (m && th === "anime" && m[1] === "sword") m = [0, "katana"];
    return m ? m[1] : IC[fb] ? fb : THI[th] || "star4";
  }
  function title(item, opt = {}) {
    if (!item || !item.name) return "";
    const th = ok(item.theme, Object.keys(THEMES), "tutien"), q = Math.round(num(item.q ?? item.quality, 1, 7, 1)), st0 = item.style || {};
    // Danh hiệu kiểu mặc định: tự chọn biểu tượng hợp với tên; danh hiệu đã tự chỉnh kiểu thì giữ biểu tượng đã chọn
    const dflt = !Object.keys(st0).some(k => !["preset", "icon", "v"].includes(k)), s = resolve({ ...st0, preset: st0.preset || `${th}-${q}`, ...(dflt ? { icon: autoIcon(item.name, th, st0.icon), isz: 1.32 } : {}) });
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
.kt-ic>.kg-i{width:100%;height:100%}
.kg-d .nb{fill:currentColor;opacity:.3;stroke:none}.kg-d .nm{fill:currentColor;stroke:none}.kg-d .nw{fill:#fff;opacity:.32;stroke:none}.kg-d .nh{fill:#fff;opacity:.9;stroke:none}.kg-d .nx{fill:#000;opacity:.45;stroke:none}.kg-d .nx2{fill:#0b0612;opacity:.92;stroke:none}
.kg-d .ns,.kg-d .nsb{fill:none;stroke:currentColor;stroke-width:1.5}.kg-d .nsb{opacity:.45}.kg-d .nk{fill:none;stroke:#fff;stroke-width:1.1;opacity:.75}.kg-d .nkd{fill:none;stroke:#000;stroke-width:1.1;opacity:.35}
.kt{--sp:1;position:relative;isolation:isolate;display:inline-flex;align-items:center;gap:.32em;height:1.6em;padding:0 .6em;font:700 .78em/1 var(--ff);letter-spacing:.01em;white-space:nowrap;vertical-align:middle;border-radius:.4em;max-width:100%;contain:layout style}
.kt.kt-md{font-size:1em}.kt.kt-lg{font-size:1.35em}
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
