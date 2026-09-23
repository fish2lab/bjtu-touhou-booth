'use strict';
// 第 2 段 隙间月影（21.95 秒）。版式照 sukima-ml 宣传册的纸页：纸 #F7F6F4、墨 #111111，紫只用于引言。
// 用户看过第一版后要求：分割线少、字少、字体和其他段一样是手写的。所以全段只用霞鹜文楷（zh，抖动调小），
// 每幅只留四行：作品名、原作、角色和画师、规格和价格；没有标签、页脚、台词和分割线，只有照片外一圈手画的框。
// 和其他段接上的：外圈画框（film.js 画）、左上角展签、纸纹，和一道木刻的隙间（黑色裂缝、白色刮痕唇线、两端系小蝴蝶结）。
//   0      只画第 1 段裂开后的满屏纸（handoffSukima），在这张纸上排出版面
//   0.2    右栏手写引言「如果维米尔生活在幻想乡，他会画谁？」，左框放上维米尔原作，隙间横扫过去露出八云紫版
//   4.15   四幅作品依次：原作 → 隙间横扫 → 东方版；右栏逐行写出作品名、原作、角色和画师、规格和价格
//   17.5   一道满屏的隙间裂开，里面是深色页：口号、QQ 群号和二维码、四幅的规格价格再列一次
//   21.55  深色页暗成墨底，最后 0.15 秒只画 handoffBlack，交给第 3 段
// 屏上文字全部抄自 docs/素材事实.md。

const S2 = {
  C: { paper: SUKIMA_PAPER, ink: '#111111', mute: '#777772', plum: K.plum, night: '#101018' },
  L: 152, R: 1770, COL: 830,                 // 版心左右边、右栏起点
  FR: { right: 750, top: 215, h: 700 },      // 作品框：右沿对齐右栏前的栏距；高 700（东方版 1404–2000 像素高，4K 下不放大）
  Q: .2,                                     // 引言出现
  GAP: 17.5, DARK: 18.2, DIM: 21.55, OUT: 21.8, END: 21.95,   // 满屏隙间、深色页、开始暗下去、只画交接墨底、段尾
  SW: { pop: .1, run0: .25, run1: .7, close0: .78, end: .9 },  // 作品框上的隙间：出现、停住、横扫、停住、合上（相对 sw 的秒数）
  WORKS: [
    { no: '01', title: '戴珍珠耳环的17岁少女', orig: '维米尔《戴珍珠耳环的少女》', role: '八云紫', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68',
      art: 'art1', og: 'orig1', t0: 4.15, show: .95, sw: 2.3 },
    { no: '02', title: '不动的大图书馆', orig: '斯皮茨韦格《书虫》', role: '帕秋莉·诺蕾姬', artist: '青未Q', spec: '16寸画芯', price: '¥70（A款）/ ¥78（B款）',
      art: 'art2', og: 'orig2', t0: 7.0 },
    { no: '03', title: '蓬莱宫娥', orig: '委拉斯开兹《宫娥》', role: '蓬莱山辉夜 & 永远亭众', artist: 'amibazh', spec: '14寸画芯', price: '¥69',
      art: 'art3', og: 'orig3', t0: 11.2 },
    { no: '04', title: '妖怪之山的秋千', orig: '弗拉戈纳尔《秋千》', role: '東風谷早苗 & 射命丸文', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68',
      art: 'art4', og: 'orig4', t0: 14.35 },
  ],
};
// 第 2–4 幅：一切过来就是原作，停 0.7 秒让人认出名画，隙间扫过
S2.WORKS.forEach(w => { if (w.show === undefined) w.show = w.t0; if (w.sw === undefined) w.sw = w.t0 + .7; });
const s2Idx = tau => { let k = 0; S2.WORKS.forEach((w, j) => { if (tau >= w.t0) k = j; }); return k; };
// s2Frame：这一幅在左框里的位置（宽按东方版的比例）
function s2Frame(w) { const ph = PHOTOS[w.art], h = S2.FR.h, fw = Math.round(h * ph.w / ph.h); return { x: S2.FR.right - fw, y: S2.FR.top, w: fw, h }; }

// ===================== 字 =====================
// s2Hand：手写楷体一行，抖动调小到读得清。p 0..1 逐字写出，返回字宽
function s2Hand(c, str, x, y, o = {}) { const { size = 40, color = S2.C.ink, weight = 400, align = 'left', p = 1, al = 1, seed = 3 } = o;
  zh(c, str, x, y, { size, color, weight, align, p, al, seed, tilt: .012, jitter: .012 }); return zhWidth(c, str, size, ZH, weight); }

// ===================== 隙间 =====================
// s2CrackPts：一道细长透镜形的隙间，从尖 a 到尖 b。hw 中间的半宽，bend 中线的弯度。返回两侧唇线 L、R 和中线 mid（都从 a 到 b）
function s2CrackPts(a, b, hw, seed, bend = 0) { const n = 56, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, L = [], R = [], mid = [];
  for (let k = 0; k <= n; k++) { const v = k / n, s = Math.sin(v * Math.PI), w = hw * Math.pow(s, .7) * (1 + .16 * noise1(v * 7, seed)), off = bend * s + 3 * noise1(v * 4, seed + 2) * s;
    const x = a[0] + dx * v + nx * off, y = a[1] + dy * v + ny * off; mid.push([x, y]); L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]); }
  return { L, R, mid }; }
// s2Lips：隙间两侧唇线内侧的白色刮痕
function s2Lips(c, q, seed, w = 2.2) { const n = q.mid.length - 1, k0 = Math.round(n * .07), k1 = n - k0;
  [q.L, q.R].forEach((side, j) => { const pts = []; for (let k = k0; k <= k1; k++) { const m = q.mid[k], e = side[k], d = Math.hypot(e[0] - m[0], e[1] - m[1]), f = d > 1 ? Math.max(0, d - 3.2) / d : 0; pts.push([lerp(m[0], e[0], f), lerp(m[1], e[1], f)]); }
    scratch(c, pts, { w, seed: seed + j * 7, dry: .12, taper: .4 }); }); }
// s2Crack：木刻的黑色裂缝 + 白色刮痕唇线
function s2Crack(c, q, seed) { block(c, [...q.L, ...q.R.slice().reverse()], K.ink, { amp: 1.1, freq: 9, seed, grain: .5, smooth: false }); s2Lips(c, q, seed + 3); }
// s2Bow：隙间一端系的小蝴蝶结（墨色，照第 1 段 s1Bow 的形：两个圈、两根飘带、一个结）。(x, y) 是结，s 是大小
function s2Bow(c, x, y, s, seed, rot = 0) { if (s < 1) return; const T = tf(x, y, s, rot);
  for (const d of [-1, 1]) { block(c, M(T, [[0, 0], [d * .5, -.58], [d * 1.05, -.64], [d * 1.22, -.22], [d * .98, .12], [d * .42, .14]]), K.ink, { amp: s * .025, freq: 8, seed: seed + d, grain: .4 });
    scratch(c, M(T, [[d * .3, -.16], [d * .7, -.42], [d * .98, -.32]]), { w: Math.max(1.2, s * .06), seed: seed + 4 + d, dry: .1 }); }
  stroke(c, M(T, [[-.05, .08], [-.3, .62], [-.52, 1.18]]), { w: s * .17, color: K.ink, seed: seed + 7, taper: .5 });
  stroke(c, M(T, [[.05, .08], [.26, .66], [.4, 1.22]]), { w: s * .17, color: K.ink, seed: seed + 8, taper: .5 });
  fillPts(c, M(T, ellPts(0, 0, .22, .2, 0, 14)), K.ink); }

// ===================== 作品框：原作 → 隙间横扫 → 东方版 =====================
function s2Picture(c, w, tau) { const t = twos(tau), f = s2Frame(w), sd = tick(t, 6), first = w === S2.WORKS[0];
  // 画框外一圈手画的细墨线（离照片 12 单位，不碰照片）。第一幅开头时画出来，之后一直在
  const m = 12, box = [[f.x - m, f.y - m], [f.x + f.w + m, f.y - m], [f.x + f.w + m, f.y + f.h + m], [f.x - m, f.y + f.h + m], [f.x - m, f.y - m]];
  stroke(c, box, { w: 2.2, color: S2.C.ink, seed: 5 + sd, p: first ? sm(.4, .85, tau, easeOut) : 1, taper: .01, rough: .3, smooth: false });
  if (tau < w.show) return;
  const s = t - w.sw, SW = S2.SW;
  if (s >= SW.end) { img(c, w.art, f.x, f.y, f.w, f.h); return; }
  img(c, w.og, f.x, f.y, f.w, f.h); if (s < 0) return;
  // 隙间：先在画框左边冒出来、停一下，一口气扫过去（左边就换成了东方版），在右边停住、合上
  const pop = sm(0, SW.pop, s, easeOutQuint), run = sm(SW.run0, SW.run1, s, easeInOutSine), close = sm(SW.close0, SW.end, s, easeIn), sl = 34, hw = 15 * pop * (1 - close);
  // 两端只伸出画框 34 单位：上面的蝴蝶结碰不到左上角展签
  // 裂缝和蝴蝶结是手画的，和第 1 段一样每秒抖 8 次（画框线、尺线跟外圈画框一样每秒 6 次）
  const sc = tick(t, 8), X = lerp(f.x - sl - 26, f.x + f.w + sl + 26, run), a = [X + sl, f.y - 34], b = [X - sl, f.y + f.h + 34], q = s2CrackPts(a, b, hw, 5 + sc, 9);
  if (run > 0) { c.save(); c.beginPath(); c.rect(f.x, f.y, f.w, f.h); c.clip(); c.clip(polyPath([[f.x - 400, a[1]], ...q.mid, [f.x - 400, b[1]]])); img(c, w.art, f.x, f.y, f.w, f.h); c.restore(); }
  if (hw > .5) s2Crack(c, q, 40 + sc);
  const bk = 24 * pop * (1 - close); s2Bow(c, a[0], a[1], bk, 60 + sc); s2Bow(c, b[0], b[1], bk, 70 + sc, .08); }

// ===================== 右栏 =====================
// 引言：和维米尔原作并排，隙间扫过、露出八云紫，就是答案
function s2Intro(c, tau) { const t = twos(tau);
  ['如果维米尔', '生活在幻想乡，', '他会画谁？'].forEach((l, j) => s2Hand(c, l, S2.COL, 450 + j * 132, { size: 100, weight: 500, color: S2.C.plum, p: writeP(t, S2.Q + j * .38, l, .055), seed: 20 + j })); }
// 作品栏：四行，换作品时逐行写出来。价格照素材事实一字不差，不写「起」
function s2Column(c, w, tau) { const C = S2.C, x = S2.COL, t = twos(tau), t0 = w.t0, who = `${w.role} · 画师 ${w.artist}`;
  s2Hand(c, w.title, x, 330, { size: 84, weight: 500, p: writeP(t, t0, w.title, .03), seed: 11 });
  s2Hand(c, w.orig, x, 440, { size: 44, color: '#3a3833', p: writeP(t, t0 + .2, w.orig, .018), seed: 12 });
  s2Hand(c, who, x, 510, { size: 36, color: C.mute, p: writeP(t, t0 + .35, who, .015), seed: 13 });
  s2Hand(c, w.spec, x, 880, { size: 44, color: '#3a3833', p: writeP(t, t0 + .45, w.spec, .03), seed: 14 });
  s2Hand(c, w.price, x, 975, { size: 72, weight: 500, p: writeP(t, t0 + .55, w.price, .03), seed: 15 }); }

// ===================== 纸页（开头 + 四幅作品） =====================
function s2Paper(c, tau) { const w = S2.WORKS[s2Idx(tau)]; handoffSukima(c);
  s2Picture(c, w, tau);
  if (tau < S2.WORKS[0].t0) s2Intro(c, tau); else s2Column(c, w, tau);
  caption(c, '隙间月影', tau, .25, { t1: S2.GAP - .1 }); }

// ===================== 深色页：口号、QQ 群、四幅的规格价格 =====================
// dim 0..1：暗下去。dim = 1 时底色和纹理正好等于 handoffBlack
function s2DarkPage(c, tau, dim = 0) { const C = S2.C, L = S2.L, R = S2.R, fg = C.paper, faint = alpha(C.paper, .6); setView(null);
  resetT(c); c.fillStyle = mix(C.night, K.ink, dim); c.fillRect(-10, -10, W + 20, H + 20); texture(c, null, 'ink', lerp(.45, 1, dim));
  const al = 1 - dim; if (al <= 0) return; c.save(); c.globalAlpha *= al;
  img(c, 'avatar', L, 150, 64, 64); s2Hand(c, '隙间月影', L + 84, 200, { size: 44, color: fg, seed: 40 });
  s2Hand(c, '名画与东方的邂逅。', L, 340, { size: 88, weight: 500, color: fg, seed: 41 });
  s2Hand(c, 'QQ群 917948669', L, 450, { size: 60, color: fg, seed: 42 });
  img(c, 'qr', R - 340, 150, 340, 340);
  S2.WORKS.forEach((w, j) => { const y = 650 + j * 96;
    s2Hand(c, w.title, L, y, { size: 52, color: fg, seed: 50 + j }); s2Hand(c, w.spec, 800, y, { size: 44, color: faint, seed: 60 + j });
    s2Hand(c, w.price, R, y, { size: 54, weight: 500, color: fg, align: 'right', seed: 70 + j }); });
  c.restore(); }

// ===================== 满屏隙间：纸页上裂开一道缝，里面是深色页 =====================
// 和第 1 段结尾同一个动作：一条线从中间往两头拉长，两端系上蝴蝶结，停一下，裂开到满屏
function s2BigGap(c, tau) { const g = tau - S2.GAP, t = twos(tau), sd = tick(t, 8); s2Paper(c, tau);
  const len = sm(0, .22, twos(g), easeOutQuint), bow = sm(.12, .3, twos(g), easeOutBack), open = sm(.4, S2.DARK - S2.GAP, g, easeIn); if (len <= 0) return;
  const half = 830 * len + open * 1900, hh = 7 + open * 1700, a = [CX - half, CY + 8], b = [CX + half, CY - 8];
  const q = s2CrackPts(a, b, hh, 90 + sd), rim = s2CrackPts(a, b, hh + 5 + 12 * open, 90 + sd);
  block(c, [...rim.L, ...rim.R.slice().reverse()], K.ink, { amp: 1.3, freq: 10, seed: 91 + sd, grain: .5, smooth: false });
  c.save(); c.clip(polyPath(rough([...q.L, ...q.R.slice().reverse()], { amp: 1.2, freq: 10, seed: 93 + sd, smooth: false }))); s2DarkPage(c, tau); c.restore();
  s2Lips(c, q, 95 + sd, lerp(2.4, 5, open));
  const bk = 34 * bow * (1 - open); s2Bow(c, a[0], a[1], bk, 100 + sd, -.06); s2Bow(c, b[0], b[1], bk, 110 + sd, .06); }

scene({ order: 2, key: 'sukima', name: '隙间月影', dur: S2.END, fn: (c, tau) => {
  if (tau < .15) handoffSukima(c);
  else if (tau < S2.GAP) s2Paper(c, tau);
  else if (tau < S2.DARK) s2BigGap(c, tau);
  else if (tau < S2.OUT) s2DarkPage(c, tau, sm(S2.DIM, S2.OUT, tau, easeInOutSine));
  else handoffBlack(c);
} });
