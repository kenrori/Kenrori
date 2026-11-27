/* Kiku: trợ lý nhỏ ở góc web. Trò chuyện, tìm truyện, hướng dẫn dùng web và thay đồ.
   Không cần cài gì thêm. Chế độ AI là tùy chọn (xem file kiku-ai.md). */
(() => {
  if (window.KIKU) return;
  const CFG = () => Object.assign({ on: true, name: "Kiku", ai: false, outfits: [] }, (DATA.site && DATA.site.kiku) || {});
  const NAME = () => String(CFG().name || "Kiku").slice(0, 20);
  const ss = { get: k => { try { return sessionStorage.getItem(k) } catch (e) {} }, set: (k, v) => { try { sessionStorage.setItem(k, v) } catch (e) {} } };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const N = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const has = (t, L) => L.some(w => (" " + t + " ").includes(" " + w + " "));
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() };
  const motionOk = () => matchMedia("(prefers-reduced-motion: no-preference)").matches && !/simple|off/.test(document.documentElement.dataset.ktfx || "");
  const mobile = () => matchMedia("(max-width: 700px)").matches;

  /* ---------- Tủ đồ ---------- */
  const MOODS = ["idle", "thinking", "working", "happy", "error", "rest"];
  const BASE = [
    { id: "goc", n: "Thủ thư mùa thu", d: "Bộ váy kem nơ đen, mặc lúc đi tìm sách" },
    { id: "anhdao", n: "Anh đào", d: "Hồng phấn, hợp đọc romcom" },
    { id: "lam", n: "Trăng lam", d: "Xanh trăng, hợp đọc khuya" },
    { id: "bacha", n: "Bạc hà", d: "Xanh mát, hợp đọc slice of life" },
    { id: "oaihuong", n: "Oải hương", d: "Tím nhạt, hợp truyện kỳ ảo" },
    { id: "kenrori", n: "Đồng phục Kenrori", d: "Màu hồng tím của nhóm dịch" }
  ].map(o => ({ ...o, src: `img/kiku/${o.id}.webp`, acc: true }));
  BASE.unshift({ id: "cu", n: "Thủ thư cú đêm", d: "Có đủ 6 biểu cảm theo lúc trò chuyện", src: "img/kiku/cu-idle.webp", acc: false, moods: true });
  const OUT = () => [...BASE, ...(CFG().outfits || []).filter(o => o && o.src && o.n).map(o => ({ id: "c-" + o.id, n: o.n, d: o.d || "Bộ đồ nhóm dịch tặng Kiku", src: o.src, acc: !!o.acc }))];
  const ACCS = [["", "Không đội"], ["meo", "Tai mèo"], ["phuthuy", "Mũ phù thủy"], ["noel", "Mũ Noel"], ["hoa", "Vòng hoa"], ["haoquang", "Hào quang"]];
  const ACC = {
  meo: `<g transform="translate(4 18)" stroke="#6b2a12" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
  <path d="M168 92 L150 -6 Q156 -18 168 -12 L250 34 Z" fill="#e5743a" stroke="none"/><path d="M168 92 L150 -6 Q156 -18 168 -12 L250 34" fill="none"/>
  <path d="M176 64 L166 6 L222 38 Z" fill="#ffb8a6" stroke="none"/>
  <path d="M330 30 L414 -16 Q426 -22 430 -8 L418 86 Z" fill="#e5743a" stroke="none"/><path d="M330 30 L414 -16 Q426 -22 430 -8 L418 86" fill="none"/>
  <path d="M360 34 L414 4 L408 62 Z" fill="#ffb8a6" stroke="none"/></g>`,
  phuthuy: `<g transform="translate(0 52) rotate(-4 290 60)" stroke="#1c1030" stroke-width="6" stroke-linejoin="round">
  <path d="M196 52 C214 -6 236 -70 286 -128 Q318 -164 356 -140 Q330 -136 322 -108 C320 -50 352 6 384 50 Z" fill="#4a2c72"/>
  <path d="M206 30 C268 18 330 18 378 34 L388 58 C320 44 262 44 198 58 Z" fill="#ff8a3d"/>
  <rect x="276" y="22" width="34" height="30" rx="5" fill="#ffd36b"/><rect x="285" y="30" width="16" height="14" rx="2" fill="#4a2c72" stroke="none"/>
  <ellipse cx="290" cy="62" rx="214" ry="40" transform="rotate(-6 290 62)" fill="#3a2160"/>
  <path d="M250 -40 l6 14 15 2-11 10 3 15-13-8-13 8 3-15-11-10 15-2z" fill="#ffd36b" stroke="none"/></g>`,
  noel: `<g transform="translate(0 46) rotate(-3 300 60)" stroke-linejoin="round">
  <path d="M152 56 C150 -40 276 -96 380 -76 C452 -62 498 -14 500 52 L470 60 C462 10 440 -16 404 -22 C430 6 432 30 422 50 Z" fill="#d6303c" stroke="#7a1019" stroke-width="6"/>
  <path d="M200 -30 C240 -60 300 -72 340 -66" fill="none" stroke="#ff6b74" stroke-width="10" stroke-linecap="round" opacity=".6"/>
  <path d="M132 62 C190 18 382 10 446 48 Q462 70 444 88 C380 58 200 62 150 96 Q120 86 132 62 Z" fill="#fff" stroke="#c7c3d6" stroke-width="5"/>
  <circle cx="490" cy="70" r="30" fill="#fff" stroke="#c7c3d6" stroke-width="5"/></g>`,
  hoa: (() => { const P = [[132,118,"#fff"],[168,66,"#ffb3c7"],[222,34,"#ffe27a"],[286,24,"#fff"],[348,36,"#ffb3c7"],[456,128,"#ffe27a"]], L = [[150,92,-50],[196,48,-30],[254,26,-8],[318,26,12]];
    return `<g transform="translate(0 16)" stroke="#5b3a2a" stroke-width="3">${L.map(([x,y,r]) => `<ellipse cx="${x}" cy="${y}" rx="20" ry="9" transform="rotate(${r} ${x} ${y})" fill="#7cc576"/>`).join("")}${P.map(([x,y,c]) => `<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a => `<ellipse cx="0" cy="-14" rx="10" ry="15" transform="rotate(${a})" fill="${c}"/>`).join("")}<circle r="8" fill="#ffb347"/></g>`).join("")}</g>` })(),
  haoquang: `<g class="kk-halo"><ellipse cx="292" cy="-34" rx="128" ry="30" fill="none" stroke="#ffe28a" stroke-width="22" opacity=".35"/><ellipse cx="292" cy="-34" rx="128" ry="30" fill="none" stroke="#ffd04d" stroke-width="10"/><ellipse cx="292" cy="-36" rx="128" ry="30" fill="none" stroke="#fff6cf" stroke-width="3"/></g>`
  };
  const curO = () => { const L = OUT(); return L.find(o => o.id === ls.get("kk_o")) || L[0] };
  const curA = () => (ACCS.find(a => a[0] === ls.get("kk_a")) || ACCS[0])[0];
  let mood = "idle", moodT = 0, lastAct = Date.now();
  const srcOf = (o, m = mood) => o.moods ? `img/kiku/cu-${MOODS.includes(m) ? m : "idle"}.webp` : o.src;
  const figHtml = (o = curO(), a = curA(), m) => `<span class="kk-in"><img src="${esc(srcOf(o, m))}" alt="" draggable="false" onerror="this.onerror=null;this.src='img/kiku/goc.webp'">${a && o.acc ? `<svg class="kk-acc" viewBox="0 0 576 640" aria-hidden="true">${ACC[a]}</svg>` : ""}</span>`;

  /* ---------- Giao diện ---------- */
  const css = `
.kk{position:fixed;right:12px;bottom:4px;z-index:60;-webkit-tap-highlight-color:transparent}
.kk-btn{display:block;position:relative;padding:0;border:0;background:none;cursor:pointer;color:inherit;border-radius:20px}
.kk-btn:focus-visible{outline:2px solid var(--ac);outline-offset:3px}
.kk-fig{display:block;position:relative;width:104px;aspect-ratio:576/640;transform-origin:50% 100%;transition:transform .35s cubic-bezier(.3,1.5,.5,1),opacity .3s}
.kk-in{position:absolute;inset:0;display:block}
.kk-in img{width:100%;height:100%;display:block;object-fit:contain;object-position:50% 100%;filter:drop-shadow(0 5px 8px #0006);user-select:none;-webkit-user-drag:none}
.kk-acc{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;filter:drop-shadow(0 2px 3px #0004)}
.kk-btn::after{content:"";position:absolute;left:24%;right:24%;bottom:3px;height:9px;border-radius:50%;background:#000;opacity:.28;filter:blur(4px);z-index:-1}
.kk-btn:hover .kk-fig{transform:rotate(-4deg) scale(1.04)}
.kk-sp{position:absolute;left:24%;top:27%;width:16px;height:16px;pointer-events:none;opacity:0}
.kk-sp::before,.kk-sp::after{content:"";position:absolute;inset:0;background:#fff;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);filter:drop-shadow(0 0 3px #ffd27a)}
.kk-sp::after{transform:scale(.45) rotate(45deg)}
.kk-name{position:absolute;left:50%;bottom:-2px;transform:translate(-50%,4px);font-size:.7rem;font-weight:700;padding:1px 8px;border-radius:999px;background:var(--ac);color:#fff;opacity:0;transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap}
.kk-btn:hover .kk-name,.kk-btn:focus-visible .kk-name{opacity:1;transform:translate(-50%,0)}
.kk-dot{position:absolute;right:6px;top:8px;width:12px;height:12px;border-radius:50%;background:var(--ac);border:2px solid var(--bg);display:none}
.kk.new .kk-dot{display:block}
/* thu nhỏ: chỉ còn gương mặt tròn */
.kk.sm{right:18px;bottom:18px}
body.rdg .kk.sm{right:130px}
.kk.sm .kk-fig{width:46px;height:46px;aspect-ratio:auto;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#ffe9d9,#f6b98f);box-shadow:0 6px 18px #0004,0 0 0 2px var(--bg),0 0 0 4px color-mix(in srgb,var(--ac) 70%,transparent)}
.kk.sm .kk-in{inset:auto;left:-21px;top:-11px;width:88px;aspect-ratio:576/640}
.kk.sm .kk-in img{filter:none}
.kk.sm .kk-btn::after,.kk.sm .kk-sp,.kk.sm .kk-name{display:none}
.kk.sm .kk-dot{right:-1px;top:-1px}
.kk.sm .kk-btn:hover .kk-fig{transform:scale(1.08)}
body.kk-on:not(.rdg):not(.kk-min) #up{right:128px}
body.kk-on.kk-min:not(.rdg) #up{right:74px}
body.kk-on:not(.rdg):not(.kk-min) #kpop{bottom:140px}
/* lời nhắn */
.kk-say{position:absolute;right:86%;bottom:64%;width:max-content;max-width:min(250px,calc(100vw - 120px));padding:10px 30px 10px 13px;border-radius:16px 16px 4px 16px;background:var(--bg);color:var(--tx);border:1px solid var(--bd);box-shadow:0 14px 34px -12px #0007;font-size:.88rem;line-height:1.45;cursor:pointer;text-align:left}
.kk-say b{display:block;font-size:.74rem;color:var(--ac);margin-bottom:2px}
.kk.sm .kk-say{right:0;bottom:58px;border-radius:16px 16px 4px 16px}
.kk-sayx{position:absolute;right:4px;top:4px;width:24px;height:24px;border:0;background:none;color:var(--mu);font-size:1.05rem;line-height:1;cursor:pointer;border-radius:50%}
.kk-sayx:hover{background:var(--s2);color:var(--tx)}
/* khung trò chuyện */
.kk-p{position:fixed;right:128px;bottom:14px;z-index:96;width:368px;height:min(570px,calc(100vh - 86px));display:flex;flex-direction:column;background:var(--bg);color:var(--tx);border:1px solid var(--bd);border-radius:20px;box-shadow:0 30px 70px -24px #000b;overflow:hidden;font-size:.92rem}
body.rdg .kk-p,body.kk-min .kk-p{right:18px;bottom:74px}
.kk-p[hidden]{display:none}
.kk-h{display:flex;align-items:center;gap:10px;padding:10px 8px 10px 12px;background:linear-gradient(120deg,color-mix(in srgb,var(--ac) 16%,var(--s1)),var(--s1) 70%);border-bottom:1px solid var(--bd)}
.kk-av{position:relative;flex:none;width:42px;height:42px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#ffe9d9,#f6b98f);box-shadow:0 0 0 2px var(--bg)}
.kk-av .kk-in{inset:auto;left:-19px;top:-10px;width:80px;aspect-ratio:576/640}
.kk-av .kk-in img{filter:none}
.kk-ht{flex:1;min-width:0;line-height:1.25}.kk-ht b{display:block;font-size:1rem}.kk-ht small{color:var(--mu);font-size:.76rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kk-hb{flex:none;width:36px;height:36px;border:0;border-radius:10px;background:none;color:var(--tx);display:grid;place-items:center;cursor:pointer}
.kk-hb:hover,.kk-hb[aria-pressed=true]{background:color-mix(in srgb,var(--ac) 14%,transparent);color:var(--ac)}
.kk-hb svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.kk-log{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:14px 12px 8px;display:flex;flex-direction:column;gap:9px;scrollbar-width:thin}
.kk-m{max-width:86%;padding:9px 12px;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere}
.kk-m.b{align-self:flex-start;background:var(--s1);border-radius:4px 16px 16px 16px}
.kk-m.u{align-self:flex-end;background:var(--ac);color:#fff;border-radius:16px 4px 16px 16px}
.kk-m p{margin:0}.kk-m p+p{margin-top:6px}
.kk-m a{color:var(--ac);font-weight:600;text-decoration:underline;text-underline-offset:2px}
.kk-m ul{margin:4px 0 0;padding-left:18px}.kk-m li{margin:2px 0}
.kk-sl{display:grid;gap:6px;margin-top:8px}
a.kk-s{display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:center;padding:5px;border-radius:10px;background:var(--bg);text-decoration:none;color:var(--tx);font-weight:400;border:1px solid var(--bd)}
a.kk-s:hover{border-color:var(--ac)}
.kk-s i{width:38px;height:52px;border-radius:5px;overflow:hidden;background:hsl(var(--h) 45% 55%);display:block}
.kk-s i img{width:100%;height:100%;object-fit:cover;display:block}
.kk-s b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:.86rem;line-height:1.3}
.kk-s small{display:block;color:var(--mu);font-size:.75rem;margin-top:2px}
.kk-ty{display:inline-flex;gap:4px;padding:4px 2px}.kk-ty i{width:7px;height:7px;border-radius:50%;background:var(--mu);opacity:.5}
.kk-ch{display:flex;gap:6px;overflow-x:auto;padding:8px 12px;border-top:1px solid var(--bd);scrollbar-width:none;flex:none}
.kk-ch::-webkit-scrollbar{display:none}.kk-ch.empty{display:none}
.kk-c{flex:none;border:1px solid var(--bd);background:var(--bg);color:var(--tx);border-radius:999px;padding:6px 12px;font:inherit;font-size:.82rem;cursor:pointer;white-space:nowrap}
.kk-c:hover{border-color:var(--ac);color:var(--ac)}
.kk-f{display:flex;gap:8px;padding:4px 12px 12px;flex:none}
.kk-f input{flex:1;min-width:0;border:1px solid transparent;background:var(--s1);color:var(--tx);border-radius:999px;padding:10px 15px;font:inherit;font-size:.92rem}
.kk-f input:focus{outline:none;border-color:var(--ac)}
.kk-f button{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:var(--ac);color:#fff;display:grid;place-items:center;cursor:pointer}
.kk-f button svg{width:19px;height:19px;fill:currentColor}
/* tủ đồ */
.kk-w{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:0 14px 14px}
.kk-w[hidden],.kk-log[hidden],.kk-ch[hidden],.kk-f[hidden]{display:none}
.kk-st{position:sticky;top:0;z-index:3;height:172px;margin:0 -14px 4px;border-bottom:1px solid var(--bd);display:grid;place-items:end end;padding-right:34px;overflow:hidden;background:radial-gradient(ellipse 45% 60% at 72% 62%,color-mix(in srgb,var(--ac) 22%,transparent),transparent 70%),linear-gradient(var(--s1),var(--bg))}
.kk-st .kk-fig{width:132px;margin-bottom:6px}
.kk-st::after{content:"";position:absolute;bottom:8px;right:40px;width:110px;height:14px;border-radius:50%;background:#000;opacity:.22;filter:blur(5px)}
.kk-st .kk-fig{z-index:1}
.kk-wn{position:absolute;left:14px;top:14px;z-index:2;max-width:48%;line-height:1.3}.kk-wn b{display:block}.kk-wn small{color:var(--mu);font-size:.78rem}
.kk-w h4{margin:14px 0 8px;font-size:.84rem;color:var(--mu);font-weight:600}
.kk-og{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.kk-o{position:relative;border:1px solid var(--bd);background:var(--s1);border-radius:12px;padding:6px 4px 6px;cursor:pointer;color:var(--tx);font:inherit;font-size:.74rem;line-height:1.25;text-align:center}
.kk-o span{display:block;height:84px;overflow:hidden;margin-bottom:4px}
.kk-o img{height:100%;width:auto;max-width:none;margin:0 auto;display:block}
.kk-o[aria-pressed=true]{border-color:var(--ac);box-shadow:0 0 0 2px color-mix(in srgb,var(--ac) 45%,transparent);background:color-mix(in srgb,var(--ac) 8%,var(--s1))}
.kk-o[aria-pressed=true]::after{content:"";position:absolute;right:6px;top:6px;width:16px;height:16px;border-radius:50%;background:var(--ac) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='m6 12.5 4 4 8-9' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E") center/12px no-repeat}
.kk-ag{display:flex;flex-wrap:wrap;gap:6px}
.kk-ag .kk-c[aria-pressed=true]{background:var(--ac);border-color:var(--ac);color:#fff}
.kk-ag .kk-c:disabled{opacity:.45;cursor:not-allowed}
.kk-wb{display:flex;justify-content:flex-end;margin-top:14px}
.kk-wb button{border:0;border-radius:999px;background:var(--ac);color:#fff;padding:9px 18px;font:inherit;font-weight:600;cursor:pointer}
@media(max-width:700px){
.kk{right:6px;bottom:2px}.kk-fig{width:76px}
body.kk-on:not(.rdg):not(.kk-min) #up{right:92px}
body.kk-on:not(.rdg):not(.kk-min) #kpop{bottom:112px}
.kk-say{right:78%;bottom:60%}
.kk.peek:not(.sm) .kk-fig{transform:translateX(52%) rotate(-8deg);opacity:.75}
.kk-p,body.rdg .kk-p,body.kk-min .kk-p{left:0;right:0;bottom:0;width:auto;height:min(84vh,640px);height:min(84dvh,640px);border-radius:20px 20px 0 0;border-bottom:0}
body.kk-open .kk{visibility:hidden}
.kk-f input{font-size:16px}
}
@media(prefers-reduced-motion:no-preference){
html:not([data-ktfx=simple]):not([data-ktfx=off]) .kk:not(.sm) .kk-in{animation:kkbob 4.2s ease-in-out infinite}
html:not([data-ktfx=simple]):not([data-ktfx=off]) .kk:not(.sm) .kk-sp{animation:kktw 6.5s ease-in-out 2s infinite}
html:not([data-ktfx=simple]):not([data-ktfx=off]) .kk-halo{animation:kkhalo 3.2s ease-in-out infinite}
.kk-say{animation:kkpop .35s cubic-bezier(.3,1.4,.5,1) both;transform-origin:100% 100%}
.kk-fig.hop{animation:kkhop .55s cubic-bezier(.3,1.5,.5,1)}
.kk-p:not([hidden]){animation:kkup .28s cubic-bezier(.2,.9,.3,1) both}
.kk-m{animation:kkm .25s ease-out both}
.kk-ty i{animation:kkty 1s ease-in-out infinite}.kk-ty i:nth-child(2){animation-delay:.15s}.kk-ty i:nth-child(3){animation-delay:.3s}
.kk-st .kk-fig.poof{animation:kkpoof .5s cubic-bezier(.3,1.5,.5,1)}
.kk-st .kk-fig.poof~.kk-burst i{animation:kkburst .7s ease-out both}
}
.kk-burst{position:absolute;right:100px;top:52%;width:0;height:0;z-index:2;pointer-events:none}
.kk-burst i{position:absolute;width:12px;height:12px;margin:-6px;background:#fff;opacity:0;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);filter:drop-shadow(0 0 4px var(--ac))}
@keyframes kkbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes kktw{0%,84%,100%{opacity:0;transform:scale(.2) rotate(0)}90%{opacity:1;transform:scale(1) rotate(45deg)}95%{opacity:.8;transform:scale(.6) rotate(90deg)}}
@keyframes kkhalo{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes kkpop{from{opacity:0;transform:translateY(6px) scale(.9)}}
@keyframes kkhop{0%{transform:none}35%{transform:translateY(-10px) scale(1.03,.97)}70%{transform:translateY(0) scale(1.04,.95)}100%{transform:none}}
@keyframes kkup{from{opacity:0;transform:translateY(16px) scale(.98)}}
@keyframes kkm{from{opacity:0;transform:translateY(4px)}}
@keyframes kkty{0%,100%{transform:translateY(0);opacity:.4}50%{transform:translateY(-3px);opacity:1}}
@keyframes kkpoof{0%{transform:scale(1)}30%{transform:scale(.86,1.08)}65%{transform:scale(1.06,.95)}100%{transform:scale(1)}}
@keyframes kkburst{0%{opacity:1;transform:translate(0,0) scale(.4)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1.1) rotate(90deg)}}
`;
  const IC = {
    send: '<svg viewBox="0 0 24 24"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2z"/></svg>',
    ward: '<svg viewBox="0 0 24 24"><path d="M12 6.5a2 2 0 1 1 2-2M12 6.5V8l9 6.2a1.6 1.6 0 0 1-.9 2.8H3.9a1.6 1.6 0 0 1-.9-2.8L12 8"/></svg>',
    min: '<svg viewBox="0 0 24 24"><path d="M6 13h12"/></svg>',
    big: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>'
  };

  let root, panel, log, ward, chips, form, inp, open = false, wardOn = false, game = null, busy = false, aiLeft = null, aiHint = false;
  const HIST = []; // lịch sử ngắn gửi cho AI

  function mount() {
    const st = document.createElement("style"); st.id = "kk-css"; st.textContent = css; document.head.appendChild(st);
    root = document.createElement("div"); root.className = "kk"; root.id = "kk";
    root.innerHTML = `<button class="kk-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-label="Trò chuyện với ${esc(NAME())}"><span class="kk-fig">${figHtml()}</span><i class="kk-sp" aria-hidden="true"></i><b class="kk-name">${esc(NAME())}</b><i class="kk-dot" aria-hidden="true"></i></button>`;
    document.body.appendChild(root);
    panel = document.createElement("section"); panel.className = "kk-p"; panel.hidden = true; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Trò chuyện với " + NAME());
    panel.innerHTML = `<header class="kk-h"><span class="kk-av">${figHtml()}</span><div class="kk-ht"><b>${esc(NAME())}</b><small class="kk-sub">Trợ lý nhỏ của ${esc((DATA.site.about || {}).name || "Kenrori")}</small></div><button class="kk-hb" type="button" data-k="ward" aria-pressed="false" title="Thay đồ cho ${esc(NAME())}" aria-label="Thay đồ">${IC.ward}</button><button class="kk-hb" type="button" data-k="min" title="Thu nhỏ ${esc(NAME())} vào góc" aria-label="Thu nhỏ">${IC.min}</button><button class="kk-hb" type="button" data-k="x" title="Đóng" aria-label="Đóng">${IC.x}</button></header>
<div class="kk-log" aria-live="polite"></div><div class="kk-w" hidden></div><div class="kk-ch"></div>
<form class="kk-f"><input maxlength="300" autocomplete="off" placeholder="Nhắn cho ${esc(NAME())}..." aria-label="Tin nhắn cho ${esc(NAME())}"><button type="submit" aria-label="Gửi">${IC.send}</button></form>`;
    document.body.appendChild(panel);
    log = panel.querySelector(".kk-log"); ward = panel.querySelector(".kk-w"); chips = panel.querySelector(".kk-ch"); form = panel.querySelector(".kk-f"); inp = form.querySelector("input");
    root.querySelector(".kk-btn").onclick = () => toggle();
    panel.querySelector("[data-k=x]").onclick = () => toggle(false);
    panel.querySelector("[data-k=min]").onclick = () => { setMin(!ls.get("kk_min")); toggle(false) };
    panel.querySelector("[data-k=ward]").onclick = () => showWard(!wardOn);
    form.onsubmit = e => { e.preventDefault(); const t = inp.value.trim(); if (!t || busy) return; inp.value = ""; ask(t) };
    panel.addEventListener("click", e => {
      const c = e.target.closest("[data-q],[data-do]"); if (c) { e.preventDefault(); if (c.dataset.q) ask(c.dataset.q, c.textContent); else act(c.dataset.do); return }
      const a = e.target.closest("a[href^='#']"); if (a && mobile()) setTimeout(() => toggle(false), 60);
    });
    addEventListener("keydown", e => { if (e.key === "Escape" && open) { toggle(false); root.querySelector(".kk-btn").focus() } });
    addEventListener("click", e => { if (!open || mobile()) return; const p = e.composedPath(); if (!p.includes(panel) && !p.includes(root)) toggle(false) });
    let pt; addEventListener("scroll", () => { if (!mobile() || open) return; root.classList.add("peek"); clearTimeout(pt); pt = setTimeout(() => root.classList.remove("peek"), 900) }, { passive: true });
    document.body.classList.add("kk-on"); setMin(!!ls.get("kk_min"), true);
    try { const h = ss.get("kk_log"); if (h) { log.innerHTML = h; HIST.push(...JSON.parse(ss.get("kk_hist") || "[]")) } } catch (e) {}
    setChips(); greetLater();
  }
  function setMin(v, quiet) {
    v ? ls.set("kk_min", "1") : ls.del("kk_min");
    root.classList.toggle("sm", v || document.body.classList.contains("rdg")); document.body.classList.toggle("kk-min", v);
    const b = panel && panel.querySelector("[data-k=min]"); if (b) { b.title = v ? `Hiện ${NAME()} cỡ lớn` : `Thu nhỏ ${NAME()} vào góc`; b.setAttribute("aria-label", b.title); b.innerHTML = v ? IC.big : IC.min }
    if (!quiet && v) toast(`${NAME()} đã thu nhỏ vào góc. Bấm vào để gọi lại nha.`);
    if (!quiet) setMood(baseMood());
  }
  const syncMode = () => root && root.classList.toggle("sm", !!ls.get("kk_min") || document.body.classList.contains("rdg"));
  function refreshFig() {
    document.querySelectorAll(".kk-fig:not(.kk-st .kk-fig), .kk-av").forEach(f => { const w = f.querySelector(".kk-in"); if (w) w.outerHTML = figHtml() });
  }
  // Biểu cảm: chỉ bộ có ảnh biểu cảm mới đổi; tự về trạng thái nền sau vài giây
  const baseMood = () => (ls.get("kk_min") && !open) ? "rest" : "idle";
  function setMood(m, hold = 4000) {
    clearTimeout(moodT); if (!curO().moods) { mood = "idle"; return }
    if (m !== mood) { mood = m; document.querySelectorAll(".kk .kk-in img, .kk-av .kk-in img").forEach(i => { i.src = srcOf(curO()) }); if ((m === "happy" || m === "error") && root && motionOk()) hop() }
    if (m !== baseMood()) moodT = setTimeout(() => setMood(baseMood()), hold);
  }
  const preload = () => { if (curO().moods && !preload.d) { preload.d = 1; MOODS.forEach(m => { new Image().src = `img/kiku/cu-${m}.webp` }) } };
  function feel(r) { setMood(r.mood || (/kk-sl/.test(r.h || "") ? "happy" : "idle")) }
  function hop() { const f = root.querySelector(".kk-fig"); f.classList.remove("hop"); void f.offsetWidth; f.classList.add("hop") }
  function toggle(v = !open) {
    open = v; panel.hidden = !v; root.querySelector(".kk-btn").setAttribute("aria-expanded", v); document.body.classList.toggle("kk-open", v); hideSay();
    root.classList.remove("new");
    lastAct = Date.now();
    if (v) {
      preload(); setMood(mood === "rest" ? "happy" : "idle", 2500);
      hop();
      if (!log.children.length) hello();
      if (!mobile()) setTimeout(() => inp.focus({ preventScroll: true }), 50);
      scrollLog();
    } else { if (wardOn) showWard(false, true); setMood(baseMood()) }
  }

  /* ---------- Lời nhắn nhỏ (không làm phiền) ---------- */
  let sayT;
  function say(text, q) {
    hideSay(); const b = document.createElement("div"); b.className = "kk-say"; b.setAttribute("role", "status");
    b.innerHTML = `<b>${esc(NAME())}</b>${text}<button class="kk-sayx" type="button" aria-label="Ẩn lời nhắn">×</button>`;
    b.onclick = e => { if (e.target.closest(".kk-sayx")) { hideSay(); return } hideSay(); toggle(true); if (q) ask(q) };
    root.appendChild(b); sayT = setTimeout(hideSay, 9000); setMood("happy", 3500);
  }
  function hideSay() { clearTimeout(sayT); const b = root && root.querySelector(".kk-say"); if (b) b.remove() }
  function greetLater() {
    if (ls.get("kk_day") === today()) return;
    setTimeout(() => {
      if (open || document.body.classList.contains("rdg") || ls.get("kk_day") === today()) return;
      ls.set("kk_day", today()); const C = cont(), first = !ls.get("kk_seen"); ls.set("kk_seen", "1");
      if (first) say(`Chào bạn, mình là ${esc(NAME())}! Cần tìm truyện hay muốn tán gẫu thì bấm vào mình nha.`);
      else if (C.length) say(`${hiWord()}! Đọc tiếp <i>${esc(C[0].s.title)}</i> không?`, "đọc tiếp");
      else { root.classList.add("new"); }
    }, 3500);
  }
  const hiWord = () => { const h = new Date().getHours(); return h < 5 ? "Khuya rồi đó" : h < 11 ? "Chào buổi sáng" : h < 13 ? "Chào buổi trưa" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối" };

  /* ---------- Tin nhắn ---------- */
  function add(cls, html) {
    const m = document.createElement("div"); m.className = "kk-m " + cls; m.innerHTML = html; log.appendChild(m);
    while (log.children.length > 60) log.firstElementChild.remove();
    scrollLog(); save(); return m;
  }
  const scrollLog = () => requestAnimationFrame(() => { log.scrollTop = log.scrollHeight });
  const save = () => { ss.set("kk_log", log.innerHTML); ss.set("kk_hist", JSON.stringify(HIST.slice(-10))) };
  const P = t => `<p>${t}</p>`;
  function bot(r) {
    if (typeof r === "string") r = { h: r };
    add("b", r.h); HIST.push({ r: "b", t: r.t || r.h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) });
    setChips(r.c); save();
  }
  async function typing(ms) {
    const m = add("b kk-tyw", '<span class="kk-ty" aria-label="Đang trả lời"><i></i><i></i><i></i></span>');
    if (ms) await new Promise(z => setTimeout(z, ms)); return m;
  }
  function hello() {
    const C = cont();
    bot({ h: P(`${hiWord()}! Mình là <b>${esc(NAME())}</b>, thủ thư nhỏ của web này.`) + P(C.length ? `Lần trước bạn đang đọc dở <a href="#${C[0].k}/${C[0].s.slug}/${C[0].l}">${esc(C[0].s.title)}</a> đó. Hôm nay mình giúp gì được nè?` : "Mình tìm truyện, gợi ý truyện, chỉ cách dùng web, kể chuyện cười hay chơi trò chơi nhỏ với bạn được. Cứ nhắn tự nhiên nha."), c: DEF_CHIPS() });
  }
  const DEF_CHIPS = () => [cont().length && ["Đọc tiếp", "đọc tiếp"], ["Truyện mới", "truyện mới"], ["Gợi ý cho mình", "gợi ý truyện"], ["Hướng dẫn", "hướng dẫn"], ["Bói hôm nay", "bói hôm nay"], ["Kể chuyện cười", "kể chuyện cười"], ["Chơi trò chơi", "chơi trò chơi"], ["Thay đồ", null, "ward"]].filter(Boolean);
  function setChips(c) { c = c || DEF_CHIPS(); chips.classList.toggle("empty", !c.length); chips.innerHTML = c.map(([l, q, d]) => `<button class="kk-c" type="button" ${q ? `data-q="${esc(q)}"` : `data-do="${esc(d)}"`}>${esc(l)}</button>`).join(""); chips.scrollLeft = 0 }
  function act(d) {
    if (d === "ward") return showWard(true);
    if (d === "theme") { $("#th").click(); bot(P(pick(["Xong! Mắt bạn thấy dễ chịu hơn chưa?", "Đổi rồi đó. Muốn đổi lại thì bấm lần nữa nha."]))); return }
    if (d === "min") { setMin(true); toggle(false) }
  }

  /* ---------- Dữ liệu web ---------- */
  const seriesAll = () => allS().filter(x => x.s && x.s.chapters);
  function cont() {
    const L = [];
    for (const { k, s } of seriesAll()) { const l = ls.get(k + ":" + s.slug); if (l == null || !s.chapters[+l]) continue; let t = 0; try { t = (JSON.parse(ls.get("bm:" + k + "/" + s.slug) || "{}").t) || 0 } catch (e) {} L.push({ k, s, l: +l, t }) }
    return L.sort((a, b) => b.t - a.t);
  }
  const fmtOfK = (k, s) => k === "manga" ? "Manga" : s.format || "Light Novel";
  function sCard(k, s, meta, ci) {
    const href = ci != null ? `#${k}/${s.slug}/${ci}` : `#${k}/${s.slug}`;
    return `<a class="kk-s" href="${href}"><i style="--h:${hue(s.title)}">${s.cover ? `<img src="${esc(s.cover)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</i><span><b>${esc(s.title)}</b><small>${meta}</small></span></a>`;
  }
  const sList = items => `<div class="kk-sl">${items.join("")}</div>`;
  const genresOf = () => { const S = new Set(); seriesAll().forEach(({ s }) => (s.genres || []).forEach(g => S.add(g))); GREG().forEach(g => g.name && S.add(g.name)); return [...S] };
  function findGenre(t) { const G = genresOf().map(g => [g, N(g)]).filter(([, n]) => n.length > 2).sort((a, b) => b[1].length - a[1].length); const m = G.find(([, n]) => (" " + t + " ").includes(" " + n + " ")); return m && m[0] }
  function searchS(q) {
    const t = N(q).replace(/\b(truyen|bo|tim|kiem|giup|minh|voi|cho|co|khong|ko|nao|ten|la|doc|di|nhe|nha|ban|oi|kiku|cuon|light novel|manga|web novel)\b/g, " ").replace(/\s+/g, " ").trim();
    if (t.length < 2) return [];
    const T = t.split(" ");
    return seriesAll().map(x => { const tt = N(x.s.title + " " + (x.s.orig || "") + " " + (x.s.alt || "")), au = N((x.s.author || "") + " " + (x.s.artist || "")); let sc = tt.includes(t) ? 10 : 0; sc += T.filter(w => w.length > 1 && (" " + tt + " ").includes(" " + w + " ")).length * 2; if (au.includes(t)) sc += 6; return { ...x, sc: sc / Math.max(1, T.length) } }).filter(x => x.sc >= 1.4).sort((a, b) => b.sc - a.sc).slice(0, 4);
  }

  /* ---------- Bộ não ---------- */
  const JOKES = [
    "“Chỉ đọc một chương nữa thôi” là câu nói dối phổ biến nhất của độc giả, đứng trên cả “mình đã đọc điều khoản sử dụng”.",
    "Vì sao nhân vật phản diện hay thất bại? Vì cứ đứng giải thích kế hoạch suốt ba trang cho nhân vật chính kịp nghĩ cách.",
    "Kiku hỏi cuốn từ điển: “Cậu có biết mình là ai không?” Nó đáp: “Đợi tớ tra đã.”",
    "Người ta đếm cừu để ngủ. Độc giả đếm “chương sau” để thức tới ba giờ sáng.",
    "Tác giả: “Chương sau sẽ có bất ngờ lớn!” Chương sau: hồi tưởng về tuổi thơ của bác bán bánh mì.",
    "Sao main isekai hay bị xe tải tông vậy? Vì xe buýt còn bận chở nhân vật phụ đi học.",
    "Kiku cầm kính lúp cả ngày để làm gì á? Để soi lỗi chính tả trong bản dịch đó. Đùa thôi, nhóm dịch làm kỹ lắm.",
    "Thư viện là nơi duy nhất mà muốn nói “im lặng” cũng phải nói thật nhỏ.",
    "Cuốn sách toán lúc nào cũng buồn, vì nó có quá nhiều vấn đề.",
    "Tên light novel dài tới mức đọc xong tên là biết luôn cái kết.",
    "Main harem có mười cô theo đuổi mà vẫn hỏi “Hả? Cậu vừa nói gì cơ?”. Kiku nghĩ bạn ấy cần đi khám tai."
  ];
  const ADV = ["Hôm nay hợp để mở một bộ chưa đọc bao giờ.", "Đọc chậm lại một chút, chi tiết hay hay nằm ở đoạn đầu.", "Nhớ uống nước rồi hẵng đọc tiếp nha.", "Để lại một bình luận cảm ơn nhóm dịch, vận may tăng gấp đôi.", "Đừng thức khuya quá, truyện không chạy mất đâu.", "Đọc xong nhớ kể cho một người bạn nghe, vui gấp đôi."];
  function fortune() {
    let sd = [...(today() + (ls.get("kk_id") || (ls.set("kk_id", Math.random().toString(36).slice(2)), ls.get("kk_id"))))].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const r = n => { sd = (sd * 1103515245 + 12345) >>> 0; return sd % n };
    const LV = [["Đại cát", "Vận đọc truyện cực tốt, chương nào cũng cuốn."], ["Cát", "Hôm nay dễ gặp truyện hợp gu."], ["Trung cát", "Bình yên, hợp đọc thư giãn."], ["Tiểu cát", "Có chút bất ngờ dễ thương đang chờ."], ["Hơi xui một xíu", "Nhưng một chương truyện hay sẽ gỡ lại hết."]];
    const lv = LV[r(LV.length)], G = genresOf(), S = seriesAll().filter(x => x.s.chapters.length), sx = S.length ? S[r(S.length)] : null, hr = 18 + r(5);
    return P(`Quẻ hôm nay của bạn: <b>${lv[0]}</b>. ${lv[1]}`) + `<ul>${G.length ? `<li>Thể loại may mắn: <b>${esc(G[r(G.length)])}</b></li>` : ""}<li>Giờ đọc may mắn: <b>${hr}h đến ${hr + 1}h</b></li><li>Lời khuyên: ${ADV[r(ADV.length)]}</li></ul>` + (sx ? P("Truyện hợp vía hôm nay:") + sList([sCard(sx.k, sx.s, `${fmtOfK(sx.k, sx.s)}, ${sx.s.chapters.length} chương`)]) : "");
  }
  function recommend(t) {
    const g = findGenre(t);
    let L = seriesAll().filter(x => x.s.chapters.length && (!g || (x.s.genres || []).some(y => N(y) === N(g))));
    if (!L.length) return g ? { h: P(`Hiện chưa có truyện thể loại <b>${esc(g)}</b>. Bạn thử thể loại khác nha.`), c: genreChips() } : { h: P("Web chưa có truyện nào để gợi ý. Bạn quay lại sau nha.") };
    const unread = L.filter(x => ls.get(x.k + ":" + x.s.slug) == null); if (unread.length) L = unread;
    L = L.sort(() => Math.random() - .5).slice(0, 3);
    return { h: P(g ? `Truyện <b>${esc(g)}</b> mình thấy đáng đọc nè:` : pick(["Thử mấy bộ này xem, mình chọn kỹ rồi đó:", "Kiku bốc thăm được mấy bộ này cho bạn:", "Mấy bộ này đang chờ bạn mở ra nè:"])) + sList(L.map(({ k, s }) => sCard(k, s, `${fmtOfK(k, s)}${(s.genres || []).length ? ", " + esc(s.genres.slice(0, 2).join(", ")) : ""}`))), c: [["Gợi ý bộ khác", g ? "gợi ý " + g : "gợi ý truyện"], ["Theo thể loại", "thể loại"], ["Truyện mới", "truyện mới"]] };
  }
  const genreChips = () => genresOf().sort(() => Math.random() - .5).slice(0, 7).map(g => [g, "gợi ý truyện " + g]);
  function latestR() {
    const L = seriesAll().filter(x => x.s.chapters.length).sort((a, b) => latest(b.s).localeCompare(latest(a.s))).slice(0, 4);
    if (!L.length) return P("Chưa có chương nào được đăng.");
    return P("Mới cập nhật gần đây nè:") + sList(L.map(({ k, s }) => { const c = newest(s), i = s.chapters.indexOf(c); return sCard(k, s, `${esc(c.t)}, ${esc((ago(c.date) || "").toLowerCase())}`, i) })) + P(`Xem hết ở <a href="#home">Trang chủ</a> nha.`);
  }
  function contR() {
    const C = cont().slice(0, 3);
    if (!C.length) return { h: P("Trên máy này bạn chưa đọc dở bộ nào cả. Bắt đầu một bộ mới nhé?"), c: [["Gợi ý cho mình", "gợi ý truyện"], ["Truyện mới", "truyện mới"]] };
    return P(C.length > 1 ? "Mấy bộ bạn đang đọc dở:" : "Bạn đang đọc dở bộ này:") + sList(C.map(({ k, s, l }) => { const p = window.BM && BM.pct(k + "/" + s.slug, l); return sCard(k, s, `${esc(s.chapters[l].t)}${p ? `, đã đọc ${p}%` : ""}`, l) })) + P("Bấm vào là mình đưa bạn về đúng đoạn đang đọc.");
  }
  const acct = () => !!(window.ST && ST.acct && ST.acct());
  const gameOn = () => DATA.site.game === true;
  const FAQ = [
    [["danh dau", "bookmark", "luu cho", "nho cho", "luu doan", "dang doc toi dau"], () => P("Web tự nhớ đoạn bạn đang đọc ở từng bộ, không cần bấm gì. Mở lại chương đó là web cuộn về đúng đoạn, đoạn đó sáng nhẹ lên.") + P("Ở trang truyện, nút <b>Đọc tiếp</b> ghi rõ chương và phần trăm đã đọc. Chỗ đánh dấu lưu trên trình duyệt của máy này, nên đổi máy thì không theo sang.")],
    [["thu vien", "theo doi", "follow", "luu truyen", "yeu thich"], () => P(`Bấm <b>Theo dõi</b> ở trang truyện để thêm vào <a href="#library">Thư viện</a>. Khi bộ đó có chương mới, mục Thư viện bên trái hiện chấm báo cho bạn.`)],
    [["dang ky", "dang nhap", "tai khoan", "mat khau", "login", "dang xuat"], () => acct() ? P(`Tài khoản dùng email và mật khẩu, một tài khoản dùng chung cho bình luận${gameOn() ? ", Tu luyện" : ""} và Sáng tác.`) + `<ul><li><a href="#viet/dang-ky">Tạo tài khoản</a></li><li><a href="#viet/dang-nhap">Đăng nhập</a></li><li><a href="#viet/quen-mat-khau">Quên mật khẩu</a></li></ul>` : P("Web hiện chưa mở tài khoản cho người đọc. Bạn vẫn đọc truyện, theo dõi truyện và dùng mọi thứ khác bình thường.")],
    [["binh luan", "comment", "cmt"], () => P(DATA.site.cmt === "giscus" ? "Kéo xuống cuối mỗi chương sẽ thấy khung bình luận. Bình luận cần đăng nhập bằng tài khoản GitHub." : "Kéo xuống cuối mỗi chương sẽ thấy khung bình luận. Chỉ cần nhập tên là bình luận được, có biểu cảm, emote và GIF.") + P("Nhớ cư xử dễ thương và đừng tiết lộ nội dung chương sau nha.")],
    [["tu luyen", "linh thach", "len cap", "exp", "cua hang", "kho do", "danh hieu", "xep hang", "bang xep hang"], () => gameOn() ? P("Tu luyện là trò chơi nhỏ đi kèm việc đọc truyện: đọc để nhận EXP và linh thạch, lên cấp, mở thành tựu.") + `<ul><li><a href="#tu-luyen">Tu luyện của tôi</a>: cấp, EXP, thành tựu</li><li><a href="#cua-hang">Cửa hàng</a>: dùng linh thạch mua đồ</li><li><a href="#kho-do">Kho đồ</a>: đeo danh hiệu, khung ảnh</li><li><a href="#bang-xep-hang">Bảng xếp hạng</a></li></ul>` + (acct() ? P("Cần đăng nhập để lưu tiến độ.") : "") : P("Web hiện chưa bật Tu luyện.")],
    [["co chu", "font", "phong chu", "chu to", "chu nho", "mau nen", "gian dong", "tuy chinh doc", "kieu chu", "do rong"], () => P("Khi đang đọc truyện chữ, bấm nút tròn có hình thanh trượt ở góc dưới bên phải. Ở đó bạn đổi được cỡ chữ, giãn dòng, kiểu chữ, màu nền (Mặc định, Giấy cũ, Đen) và độ rộng khung đọc.")],
    [["che do toi", "dark mode", "light mode", "nen toi", "giao dien toi", "che do sang", "doi mau", "doi giao dien", "toi mat"], () => ({ h: P("Bấm nút mặt trăng hoặc mặt trời ở góc trên bên phải để đổi giao diện sáng và tối. Hoặc để mình đổi giúp:"), c: [["Đổi giao diện ngay", null, "theme"]] })],
    [["sang tac", "viet truyen", "dang truyen", "tu viet", "truyen tu sang tac"], () => window.ST && ST.enabled() ? P(`Ở khu <a href="#sang-tac">Sáng tác</a>, ai có tài khoản cũng tự đăng truyện của mình được. Bắt đầu ở <a href="#viet/moi">Viết truyện mới</a>, nhớ đọc <a href="#noi-quy">nội quy</a> trước nha.`) : P("Khu Sáng tác hiện chưa mở.")],
    [["doc manga", "lat trang", "cuon doc", "kieu doc", "cach doc manga", "doc kieu"], () => P("Manga có hai cách đọc: <b>Cuộn dọc</b> và <b>Lật trang</b>. Khi đang đọc, bấm nút tròn ở góc dưới bên phải để đổi. Ở kiểu lật trang, bấm hai bên ảnh hoặc dùng phím mũi tên để chuyển trang.")],
    [["bao loi", "sai chinh ta", "bug", "lien he", "discord", "nhom dich", "gop y", "loi dich"], () => { const A = DATA.site.about || {}, r = DATA.site.report || A.discord; return P(`Thấy lỗi trong chương thì báo cho nhóm dịch nha, mình chuyển lời giúp không được nhưng chỉ đường được nè.`) + `<ul>${r ? `<li><a href="${esc(r)}" target="_blank" rel="noopener">Báo lỗi chương</a></li>` : ""}<li><a href="#about">Giới thiệu và liên hệ nhóm</a></li></ul>` }],
    [["cai app", "tai app", "ung dung", "man hinh chinh", "cai dat web", "app dien thoai"], () => P("Web cài như ứng dụng được nè. Trên điện thoại, mở menu của trình duyệt rồi chọn <b>Thêm vào màn hình chính</b> (Safari thì bấm nút Chia sẻ trước). Trên máy tính, Chrome và Edge có biểu tượng cài đặt ở cuối thanh địa chỉ.")],
    [["tim kiem", "loc truyen", "tim truyen", "tim theo"], () => ({ h: P(`Gõ tên truyện vào ô tìm kiếm trên cùng, hoặc vào <a href="#tim-kiem">Tìm truyện</a> để lọc theo thể loại và trạng thái. Bạn cũng có thể nhắn cho mình, ví dụ: <i>tìm ${esc((seriesAll()[0] || { s: { title: "tên truyện" } }).s.title)}</i>.`), c: [["Theo thể loại", "thể loại"], ["Gợi ý cho mình", "gợi ý truyện"]] })]
  ];
  function helpR() {
    return { h: P(`Mình làm được mấy việc này nè:`) + `<ul><li>Tìm truyện: nhắn <i>tìm</i> kèm tên truyện</li><li>Gợi ý truyện, có thể theo thể loại</li><li>Chỉ các chương mới và truyện bạn đang đọc dở</li><li>Hướng dẫn: đánh dấu chỗ đọc, Thư viện, bình luận, cỡ chữ${acct() ? ", tài khoản" : ""}${gameOn() ? ", Tu luyện" : ""}</li><li>Bói vui, kể chuyện cười, oẳn tù tì, đoán số</li><li>Thay đồ cho mình (bấm biểu tượng móc áo)</li></ul>`, c: [["Cách đánh dấu chỗ đọc", "đánh dấu"], ["Thư viện", "thư viện"], ["Đổi cỡ chữ", "cỡ chữ"], ["Bình luận", "bình luận"], acct() && ["Tài khoản", "tài khoản"], gameOn() && ["Tu luyện", "tu luyện"], ["Báo lỗi", "báo lỗi"]].filter(Boolean) };
  }
  const RPS = [["keo", "Kéo"], ["bua", "Búa"], ["bao", "Bao"]];
  function playGame(t) {
    if (has(t, ["thoi", "dung", "stop", "nghi", "khong choi", "thoat"])) { game = null; return { h: P("Ok, nghỉ chơi. Lúc nào muốn chơi tiếp cứ gọi mình nha."), c: DEF_CHIPS() } }
    if (game.g === "rps") {
      const u = RPS.findIndex(([k]) => has(t, [k])); if (u < 0) return { h: P("Bạn chọn Kéo, Búa hay Bao nè?"), c: rpsChips() };
      const k = Math.floor(Math.random() * 3), d = (u - k + 3) % 3;
      game.s = game.s || [0, 0]; if (d === 1) game.s[0]++; if (d === 2) game.s[1]++;
      return { mood: d === 0 ? "thinking" : d === 1 ? "error" : "happy", h: P(`Bạn ra <b>${RPS[u][1]}</b>, mình ra <b>${RPS[k][1]}</b>. ` + (d === 0 ? pick(["Hòa rồi! Tâm đầu ý hợp ghê.", "Hòa! Làm ván nữa không?"]) : d === 1 ? pick(["Bạn thắng rồi, mình phục!", "Á, thua mất tiêu.", "Bạn giỏi ghê!"]) : pick(["Mình thắng nha! Hihi.", "Kiku thắng! Ván sau nhường bạn... chắc vậy."]))) + P(`Tỷ số: bạn ${game.s[0]}, ${esc(NAME())} ${game.s[1]}.`), c: [...rpsChips(), ["Thôi không chơi", "thôi"]] };
    }
    if (game.g === "num") {
      const m = /\d+/.exec(t); if (!m) return { h: P("Nhắn một số từ 1 đến 100 nha. Muốn dừng thì nhắn <i>thôi</i>."), c: [["Thôi không chơi", "thôi"]] };
      const x = +m[0]; game.n++;
      if (x === game.v) { const n = game.n; game = null; return { mood: "happy", h: P(`Đúng rồi, là <b>${x}</b>! Bạn đoán ${n} lần. ${n <= 5 ? "Đỉnh thật đó!" : n <= 8 ? "Giỏi lắm!" : "Kiên trì ghê!"}`), c: [["Chơi lại", "đoán số"], ["Oẳn tù tì", "oẳn tù tì"]] } }
      return { mood: "thinking", h: P(`${x} hả? Số của mình <b>${x < game.v ? "lớn hơn" : "nhỏ hơn"}</b> nha. ` + (game.n >= 7 ? `Gợi ý: số đó ${game.v % 2 ? "lẻ" : "chẵn"}.` : "")), c: [["Thôi không chơi", "thôi"]] };
    }
  }
  const rpsChips = () => RPS.map(([k, l]) => [l, l.toLowerCase()]);
  const SMALL = [
    [["muon chet", "tu tu", "khong muon song", "tu sat", "ket lieu", "chan song", "tu hai"], () => ({ strong: 1, h: P("Nghe bạn nói vậy mình lo lắm. Mình chỉ là trợ lý nhỏ của một web truyện nên không giúp được nhiều, nhưng bạn không phải chịu một mình đâu.") + P("Hãy nói chuyện ngay với một người bạn tin tưởng: người nhà, bạn bè hoặc thầy cô. Nếu bạn đang gặp nguy hiểm, hãy gọi cấp cứu <b>115</b> ngay nhé."), c: [] })],
    [["ban la ai", "ten gi", "ten ban", "la ai vay", "gioi thieu ban than", "ban ten"], () => P(`Mình là <b>${esc(NAME())}</b>, thủ thư nhỏ của web này. Mình thích sách, hoa cúc và kính lúp, nhiệm vụ là giúp bạn tìm truyện hay và đọc vui hơn.`) + P("Mình không phải người thật đâu, nên chuyện quan trọng bạn nhớ hỏi người thật nha.")],
    [["bao nhieu tuoi", "may tuoi"], () => P("Tuổi của thủ thư là bí mật! Chỉ biết là mình đã đọc nhiều hơn số trang mà bạn tưởng.")],
    [["so thich", "thich gi", "thich doc gi", "thich mau gi", "thich an gi"], () => P(pick(["Mình thích đọc light novel buổi tối, uống trà gừng và sắp sách theo màu bìa.", "Mình thích hoa cúc, mùi giấy mới, và mấy chương có plot twist."]))],
    [["cam on", "thank", "thanks", "tks", "camon", "cam on nha", "cam on ban"], () => P(pick(["Không có chi! Đọc vui nha.", "Hihi, giúp được bạn là mình vui rồi.", "Có gì cứ gọi mình nha."]))],
    [["de thuong", "cute", "xinh", "dang yeu", "gioi qua", "thong minh", "dep qua", "kute"], () => P(pick(["Ơ... được khen ngại quá đi. Cảm ơn bạn nha!", "Hihi, bạn cũng dễ thương lắm đó.", "Khen nữa là mình đỏ mặt luôn đó."]))],
    [["yeu ban", "yeu kiku", "nguoi yeu", "crush", "lay kiku", "cuoi kiku", "thich ban", "yeu em"], () => P(pick(["Mình quý bạn lắm, nhưng tình yêu đích thực của mình là... sách! Để mình tìm cho bạn một bộ romcom thay nha.", "Ơ kìa, mình chỉ là thủ thư thôi mà. Nhưng mình luôn ở đây khi bạn cần tìm truyện đó."])), [["Gợi ý romcom", "gợi ý truyện tình cảm"]]],
    [["ngu ngoc", "do ngu", "ngu the", "dot qua", "do ngoc", "im di", "vo dung", "phien qua"], () => P(pick(["Hu, mình sẽ cố gắng hơn. Bạn nói rõ hơn một chút được không?", "Mình còn đang học mà. Bạn thử hỏi cách khác xem nha."]))],
    [["buon", "chan", "met", "stress", "co don", "khoc", "that tinh", "ap luc", "so qua"], () => ({ h: P(pick(["Ôm bạn một cái nè. Hôm nay vất vả rồi.", "Mệt thì nghỉ một chút nha, không sao đâu.", "Có mình ở đây nghe bạn nè."])) + P("Muốn mình kể chuyện cười, hay tìm một bộ truyện nhẹ nhàng để đọc cho thư giãn?"), c: [["Kể chuyện cười", "kể chuyện cười"], ["Truyện nhẹ nhàng", "gợi ý truyện slice of life"], ["Chơi trò chơi", "chơi trò chơi"]] })],
    [["tam biet", "bye", "di ngu", "ngu ngon", "bai bai", "gap lai sau", "pp", "di ngu day"], () => P(pick(["Tạm biệt nha! Đọc vui và ngủ ngon.", "Bye bye, mai gặp lại nha!", "Đi ngủ sớm nha, truyện vẫn ở đây chờ bạn."]))],
    [["may gio", "bay gio la", "hom nay ngay", "ngay may", "thu may", "hom nay la"], () => { const d = new Date(); return P(`Bây giờ là ${d.getHours()} giờ ${String(d.getMinutes()).padStart(2, "0")}, ${["Chủ nhật", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy"][d.getDay()]} ngày ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}.` + (d.getHours() >= 23 || d.getHours() < 5 ? " Khuya rồi, đọc thêm một chương rồi ngủ nha." : "")) }],
    [["chao", "hello", "hi", "xin chao", "alo", "helo", "hey", "yo", "chao ban", "chao kiku", "hii"], () => P(pick([`${hiWord()}! Hôm nay đọc gì nè?`, "Chào bạn! Mình giúp gì được nè?", "Hế lô! Mình đang chờ bạn đó."]))]
  ];
  const SMM = { "ban la ai": "happy", "bao nhieu tuoi": "happy", "so thich": "happy", "cam on": "happy", "de thuong": "happy", "yeu ban": "happy", "ngu ngoc": "error", "buon": "thinking", "tam biet": "rest", "chao": "happy" };
  function local(raw) {
    const t = N(raw), nm = N(NAME());
    if (game) { const r = playGame(t); if (r) return { ...r, strong: 1 } }
    const R = (h, c, strong = 1) => typeof h === "object" ? { strong, ...h } : { h, c, strong };
    if (has(t, ["thay do", "doi do", "trang phuc", "quan ao", "dong phuc", "mac do", "mac gi", "tu do", "phu kien", "doi vay"])) return { h: P("Mở tủ đồ nè! Chọn giúp mình bộ nào đẹp nha."), strong: 1, ward: 1, mood: "happy" };
    for (const [k, f] of SMALL.slice(0, 1)) if (has(t, k)) return { ...R(f(t)), mood: "idle" };
    // Gõ đúng tên một bộ truyện thì đưa bộ đó ra trước
    const ex = seriesAll().filter(x => { const n = N(x.s.title); return n.length >= 4 && (" " + t + " ").includes(" " + n + " ") });
    if (ex.length) return R({ work: 1, h: P("Bộ này phải không?") + sList(ex.slice(0, 3).map(({ k, s }) => sCard(k, s, `${fmtOfK(k, s)}, ${s.chapters.length} chương${s.status ? ", " + esc(s.status.toLowerCase()) : ""}`))) });
    if (has(t, FAQ[0][0])) return R(FAQ[0][1](t));
    if (has(t, ["doc tiep", "dang doc", "doc do", "lan truoc", "cho cu", "doc toi dau"])) return R({ h: contR(), work: 1 });
    if (has(t, ["truyen moi", "chuong moi", "moi cap nhat", "cap nhat", "moi ra", "update", "co gi moi", "moi nhat", "ra chuong"])) return R({ h: latestR(), c: [["Gợi ý cho mình", "gợi ý truyện"], ["Đọc tiếp", "đọc tiếp"]], work: 1 });
    if (has(t, ["oan tu ti", "keo bua bao", "bua bao", "keo bua"])) { game = { g: "rps" }; return R({ h: P("Oẳn tù tì, ra cái gì ra cái này! Bạn chọn đi:"), c: rpsChips() }) }
    if (has(t, ["doan so"])) { game = { g: "num", v: 1 + Math.floor(Math.random() * 100), n: 0 }; return R({ h: P("Mình đã nghĩ một số từ 1 đến 100. Bạn đoán đi!"), c: [["50", "50"], ["Thôi không chơi", "thôi"]] }) }
    if (has(t, ["choi tro choi", "choi game", "choi gi", "tro choi", "choi voi", "minigame", "choi di"])) return R({ h: P("Chơi gì đây ta?"), c: [["Oẳn tù tì", "oẳn tù tì"], ["Đoán số", "đoán số"], ["Bói hôm nay", "bói hôm nay"]] });
    if (has(t, ["boi", "tu vi", "van may", "may man", "que", "xem boi"])) return R({ h: fortune(), c: [["Kể chuyện cười", "kể chuyện cười"], ["Gợi ý cho mình", "gợi ý truyện"]], work: 1, mood: "happy" });
    if (has(t, ["chuyen cuoi", "ke chuyen", "joke", "cuoi di", "chuyen vui", "hai huoc", "ke gi"])) { let i = +(ss.get("kk_j") || -1); i = (i + 1 + Math.floor(Math.random() * 3)) % JOKES.length; ss.set("kk_j", i); return R({ h: P(JOKES[i]), c: [["Thêm chuyện nữa", "kể chuyện cười"], ["Chơi trò chơi", "chơi trò chơi"]], mood: "happy" }) }
    if (has(t, ["huong dan", "giup do", "help", "lam duoc gi", "biet lam gi", "co the lam gi", "chuc nang"]) || t === "giup") return R(helpR());
    if (has(t, ["the loai"]) && !findGenre(t)) return R({ h: P("Bạn thích thể loại nào? Chọn một cái nè:"), c: genreChips() });
    if (has(t, ["bao nhieu truyen", "co bao nhieu", "may bo", "tong so"])) { const n = DATA.novels.length, m = DATA.manga.length, c = seriesAll().reduce((a, x) => a + x.s.chapters.length, 0); return { ...R(P(`Web đang có <b>${n}</b> bộ truyện chữ và <b>${m}</b> bộ manga, tổng cộng <b>${c.toLocaleString("vi-VN")}</b> chương. Nhóm dịch chăm ghê!`)), work: 1, mood: "happy" } }
    for (const [k, f] of FAQ) if (has(t, k)) return R(f(t));
    if (has(t, ["goi y", "de xuat", "doc gi", "nen doc", "random", "ngau nhien", "truyen hay", "recommend", "chon giup", "bo nao hay"]) || (findGenre(t) && t.split(" ").length <= 5)) return R({ ...recommend(t), work: 1 });
    if (!/^(tim|kiem|tra)\b/.test(t)) for (const [k, f, c] of SMALL) if (has(t, k)) return { mood: SMM[k[0]], ...R(f(t), c, 0) };
    const m = /^(tim|kiem|tra|co bo|co truyen|truyen)\b/.test(t) || t.split(" ").length <= 6 ? searchS(raw) : [];
    if (m.length) return R({ work: 1, h: P(m.length > 1 ? "Mình tìm được mấy bộ này:" : "Có phải bộ này không?") + sList(m.map(({ k, s }) => sCard(k, s, `${fmtOfK(k, s)}, ${s.chapters.length} chương${s.status ? ", " + esc(s.status.toLowerCase()) : ""}`))) });
    if (/^(tim|kiem)\b/.test(t)) return R({ h: P(`Mình chưa thấy bộ nào tên như vậy. Bạn thử gõ ít chữ hơn, hoặc vào <a href="#tim-kiem">Tìm truyện</a> để lọc nha.`), c: [["Gợi ý cho mình", "gợi ý truyện"]], work: 1, mood: "error" });
    for (const [k, f, c] of SMALL) if (has(t, k)) return { mood: SMM[k[0]], ...R(f(t), c, 0) };
    if (t === nm || t === "kiku") return R(P(pick(["Dạ, mình đây!", "Gọi mình hả? Có mình nè!"])), null, 0);
    return null;
  }
  function fallback(raw) {
    const ai = aiCan() === "login" && !aiHint ? (aiHint = true, P(`Đăng nhập thì mình trả lời được nhiều chuyện hơn đó. <a href="#viet/dang-nhap">Đăng nhập</a>`)) : "";
    return { h: P(pick(["Ơ, câu này khó quá, mình chưa hiểu lắm.", "Hmm, mình chưa hiểu ý bạn. Bạn hỏi cách khác xem?", "Câu này vượt quá kệ sách của mình rồi."])) + P("Mình giỏi nhất là tìm truyện, gợi ý truyện và chỉ cách dùng web. Thử mấy cái dưới đây nha:") + ai, c: DEF_CHIPS() };
  }

  /* ---------- Chế độ AI (tùy chọn) ---------- */
  const aiCan = () => { if (!CFG().ai || !(window.ST && ST.acct && ST.acct())) return ""; return ST.me && ST.me() ? "ok" : "login" };
  function md(s) {
    return String(s || "").trim().split(/\n{2,}/).map(par => `<p>${esc(par).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\[([^\]]{1,80})\]\((#[\w\-\/%.]{1,120})\)/g, '<a href="$2">$1</a>').replace(/\n/g, "<br>")}</p>`).join("");
  }
  function ctx() {
    const C = cont().slice(0, 3).map(({ s, l }) => `${s.title} (${s.chapters[l].t})`).join("; ");
    const cat = seriesAll().slice(0, 80).map(({ k, s }) => `${s.title} | ${fmtOfK(k, s)} | ${(s.genres || []).slice(0, 4).join(", ")} | ${s.status || ""} | ${s.chapters.length} chương | #${k}/${s.slug}`).join("\n");
    return `Trang đang xem: ${document.title} (${location.hash || "#home"})\nĐang đọc dở: ${C || "chưa có"}\nTính năng đang bật: ${[acct() && "tài khoản", gameOn() && "Tu luyện (#tu-luyen, #cua-hang, #kho-do, #bang-xep-hang)", window.ST && ST.enabled() && "Sáng tác (#sang-tac)"].filter(Boolean).join(", ") || "đọc truyện cơ bản"}\nDanh sách truyện (tên | loại | thể loại | trạng thái | số chương | link):\n${cat}`.slice(0, 7000);
  }
  async function aiAsk(text) {
    const sb = await ST.client();
    const { data, error } = await sb.functions.invoke("kiku", { body: { m: text, h: HIST.slice(-9, -1), ctx: ctx(), name: NAME() } });
    if (error) { let j = null; try { j = await error.context.json() } catch (e) {} if (j && j.error) return j; throw error }
    return data;
  }

  async function ask(text, shown) {
    if (busy) return; busy = true; hideSay();
    if (wardOn) showWard(false, true);
    add("u", esc(shown || text)); HIST.push({ r: "u", t: text.slice(0, 300) }); lastAct = Date.now(); setMood("thinking", 15000);
    try {
      let r = local(text);
      const can = aiCan();
      if (r && r.strong) {
        let tm = await typing(350 + Math.random() * 300);
        if (r.work) { setMood("working", 15000); await new Promise(z => setTimeout(z, 550 + Math.random() * 350)) }
        tm.remove(); bot(r); feel(r); if (r.ward) setTimeout(() => showWard(true), 350); return
      }
      if (can === "ok") {
        const tm = await typing(); setMood("working", 30000); let x;
        try { x = await aiAsk(text) } catch (e) { x = { error: "net" } }
        tm.remove();
        if (x && x.reply) { aiLeft = x.left; sub(); const h = md(x.reply); bot({ h, t: x.reply.slice(0, 400) }); setMood(/<a /.test(h) ? "happy" : "idle"); return }
        const why = { limit: `Hôm nay bạn trò chuyện với mình nhiều quá rồi, mình hơi mệt. Mai nói tiếp nha!`, busy: "Hôm nay nhiều người hỏi mình quá, mình tạm trả lời kiểu đơn giản thôi nha.", banned: "Tài khoản của bạn đang bị khóa nên mình không trả lời bằng AI được.", login: "" }[x && x.error];
        const fb = r || fallback(text); if (why) fb.h = P(why) + fb.h; bot(fb); setMood(r ? (r.mood || "idle") : "error"); return;
      }
      const tm = await typing(350 + Math.random() * 400); tm.remove(); bot(r || fallback(text)); r ? feel(r) : setMood("error");
    } finally { busy = false }
  }
  function sub() { const s = panel.querySelector(".kk-sub"); if (s && aiLeft != null) s.textContent = `Còn ${aiLeft} lượt trò chuyện AI hôm nay` }

  /* ---------- Tủ đồ ---------- */
  function showWard(v, quiet) {
    wardOn = v; panel.querySelector("[data-k=ward]").setAttribute("aria-pressed", v);
    log.hidden = v; chips.hidden = v; form.hidden = v; ward.hidden = !v;
    if (v) { preload(); const o0 = curO().id, a0 = curA(); ward.dataset.o0 = o0; ward.dataset.a0 = a0; drawWard(); ward.scrollTop = 0 }
    else if (!quiet && (ward.dataset.o0 !== curO().id || ward.dataset.a0 !== curA())) bot(P(pick([`Bộ <b>${esc(curO().n)}</b> này đẹp ghê! Cảm ơn bạn đã chọn cho mình.`, `Mặc <b>${esc(curO().n)}</b> nè, hợp không bạn?`, "Thay đồ xong rồi! Giờ đi đọc truyện tiếp thôi."]))), setTimeout(() => setMood("happy"), 30);
    else scrollLog();
  }
  function drawWard() {
    const o = curO(), a = curA(), L = OUT();
    ward.innerHTML = `<div class="kk-st"><div class="kk-wn"><b>${esc(o.n)}</b><small>${esc(o.d || "")}</small></div><span class="kk-fig">${figHtml(o, a)}</span><span class="kk-burst">${Array.from({ length: 8 }, (_, i) => { const g = i / 8 * 6.283; return `<i style="--x:${Math.round(Math.cos(g) * 80)}px;--y:${Math.round(Math.sin(g) * 70)}px"></i>` }).join("")}</span></div>
<h4>Bộ đồ</h4><div class="kk-og">${L.map(x => `<button type="button" class="kk-o" data-o="${esc(x.id)}" aria-pressed="${x.id === o.id}"><span><img src="${esc(x.src)}" alt="" loading="lazy"></span>${esc(x.n)}</button>`).join("")}</div>
<h4>Phụ kiện</h4><div class="kk-ag">${ACCS.map(([k, n]) => `<button type="button" class="kk-c" data-a="${k}" aria-pressed="${k === a}"${o.acc || !k ? "" : " disabled title=\"Bộ đồ này không đội phụ kiện được\""}>${n}</button>`).join("")}</div>
<div class="kk-wb"><button type="button" data-done>Xong</button></div>`;
    ward.onclick = e => {
      const b = e.target.closest("[data-o],[data-a],[data-done]"); if (!b || b.disabled) return;
      if (b.dataset.done != null) return showWard(false);
      if (b.dataset.o) ls.set("kk_o", b.dataset.o); else b.dataset.a ? ls.set("kk_a", b.dataset.a) : ls.del("kk_a");
      const y = ward.scrollTop; drawWard(); ward.scrollTop = y; mood = "idle"; preload(); refreshFig();
      const f = ward.querySelector(".kk-st .kk-fig"); if (motionOk()) { f.classList.add("poof") }
    };
  }

  /* ---------- Khởi động ---------- */
  window.KIKU = { open: () => toggle(true), ask: t => { toggle(true); ask(t) }, sync: syncMode, refresh: () => { refreshFig() } };
  if (!CFG().on) return;
  mount(); setMood(baseMood());
  // Đêm khuya (23 giờ tới 5 giờ), để yên hơn 2 phút thì Kiku ngủ gật
  ["pointerdown", "keydown", "scroll"].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); if (mood === "rest" && !ls.get("kk_min")) setMood("idle") }, { passive: true }));
  setInterval(() => { const h = new Date().getHours(); if ((h >= 23 || h < 5) && !open && mood === "idle" && Date.now() - lastAct > 120000) setMood("rest", 2e9) }, 30000);
  new MutationObserver(syncMode).observe(document.body, { attributes: true, attributeFilter: ["class"] });
})();
