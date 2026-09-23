'use strict';
// 第 2 段 隙间月影（21.9 秒）。版式照 sukima-ml 宣传册：纸 #F7F6F4、墨 #111111，紫只用于引言和台词；
// 标题思源黑体 Medium、正文 Regular、标签 Space Mono 大写。和其他段接上的只有几样：外圈画框（film.js 画）、左上角展签、
// 纸纹，和一道木刻的隙间（黑色裂缝、白色刮痕唇线、两端系小蝴蝶结）。作品照片上不涂鸦。
//   0      只画第 1 段裂开后的满屏纸（handoffSukima），在这张纸上排出版面
//   0.2    右栏引言「如果维米尔生活在幻想乡，他会画谁？」，左框放上维米尔原作，隙间横扫过去露出八云紫版
//   4.15   四幅作品依次：原作 → 隙间横扫 → 东方版；右栏排编号、作品名、原作、角色、画师、原作小图、台词、规格价格
//   17.5   一道满屏的隙间裂开，里面是深色页：口号、QQ 群号和二维码、四幅的规格价格再列一次
//   21.55  深色页暗成墨底，最后 0.15 秒只画 handoffBlack，交给第 3 段
// 屏上文字全部抄自 docs/素材事实.md。

const S2 = {
  C: { paper: SUKIMA_PAPER, ink: '#111111', line: '#D9D9D5', mute: '#777772', plum: K.plum, night: '#101018' },
  L: 152, R: 1770, COL: 830,                 // 版心左右边、右栏起点
  FR: { right: 750, top: 215, h: 700 },      // 作品框：右沿对齐右栏前的栏距；高 700（东方版 1404–2000 像素高，4K 下不放大）
  Q: .2,                                     // 引言出现
  GAP: 17.5, DARK: 18.2, DIM: 21.55, OUT: 21.8, END: 21.95,   // 满屏隙间、深色页、开始暗下去、只画交接墨底、段尾
  SW: { pop: .1, run0: .25, run1: .7, close0: .78, end: .9 },  // 作品框上的隙间：出现、停住、横扫、停住、合上（相对 sw 的秒数）
  WORKS: [
    { no: '01', title: '戴珍珠耳环的17岁少女', orig: '维米尔《戴珍珠耳环的少女》', role: '八云紫', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68',
      art: 'art1', og: 'orig1', t0: 4.15, show: .95, sw: 2.3,
      quote: '「若你将其悬挂于心墙之上时刻注视，或许……也是一种对我‘存在’的供奉呢。」' },
    { no: '02', title: '不动的大图书馆', orig: '斯皮茨韦格《书虫》', role: '帕秋莉·诺蕾姬', artist: '青未Q', spec: '16寸画芯', price: '¥70（A款）/ ¥78（B款）',
      art: 'art2', og: 'orig2', t0: 7.0,
      quote: '「这就是所谓的‘知识的重量’吗？为了触及真理的高处，总有人需要成为基石。」' },
    { no: '03', title: '蓬莱宫娥', orig: '委拉斯开兹《宫娥》', role: '蓬莱山辉夜 & 永远亭众', artist: 'amibazh', spec: '14寸画芯', price: '¥69',
      art: 'art3', og: 'orig3', t0: 11.2,
      quote: '「比起原画中严肃的西班牙宫廷，这里的空气中弥漫着一种随时会爆发弹幕战的微妙‘核’平气息。」' },
    { no: '04', title: '妖怪之山的秋千', orig: '弗拉戈纳尔《秋千》', role: '東風谷早苗 & 射命丸文', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68',
      art: 'art4', og: 'orig4', t0: 14.35,
      quote: '「这大概就是幻想乡版的‘狗仔摄影’吧？」' },
  ],
};
// 第 2–4 幅：一切过来就是原作，停 0.7 秒让人认出名画，隙间扫过；原作小图在隙间合上后弹进右栏
S2.WORKS.forEach(w => { if (w.show === undefined) w.show = w.t0; if (w.sw === undefined) w.sw = w.t0 + .7; w.thumb = Math.max(w.sw + S2.SW.end, w.t0 + .1); });
const s2Idx = tau => { let k = 0; S2.WORKS.forEach((w, j) => { if (tau >= w.t0) k = j; }); return k; };
// s2Frame：这一幅在左框里的位置（宽按东方版的比例）
function s2Frame(w) { const ph = PHOTOS[w.art], h = S2.FR.h, fw = Math.round(h * ph.w / ph.h); return { x: S2.FR.right - fw, y: S2.FR.top, w: fw, h }; }

// ===================== 字 =====================
// Space Mono 没有中文字形：等宽标签里的中文改用思源黑体（照宣传册的 draw_mixed）
const S2CJK = /[⺀-鿿　-〿＀-￯]/u;
function s2Runs(str, font) { if (font !== 'SMono') return [[str, font]]; const out = [];
  for (const ch of str) { const f = S2CJK.test(ch) ? 'NSans' : 'SMono'; if (out.length && out[out.length - 1][1] === f) out[out.length - 1][0] += ch; else out.push([ch, f]); } return out; }
// s2Text：印刷体一行（不抖、不倾斜）。p 0..1 从左往右露出来（排版时的「印上去」），返回字宽
function s2Text(c, str, x, y, o = {}) { const { size = 40, color = S2.C.ink, font = 'NSans', weight = 400, align = 'left', al = 1, p = 1, spacing = 0 } = o;
  c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.letterSpacing = `${spacing}px`;
  const runs = s2Runs(str, font).map(([s, f]) => { c.font = `${weight} ${size}px ${f}`; return [s, f, c.measureText(s).width]; }), tw = runs.reduce((a, r) => a + r[2], 0);
  if (p > 0 && al > 0) { let x0 = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x; c.globalAlpha *= al; c.fillStyle = color;
    if (p < 1) { c.beginPath(); c.rect(x0 - 6, y - size * 1.2, (tw + 12) * p, size * 1.7); c.clip(); }
    for (const [s, f, w] of runs) { c.font = `${weight} ${size}px ${f}`; c.fillText(s, x0, y); x0 += w; } }
  c.restore(); return tw; }
// s2Wrap：台词折行。优先在行尾 45% 以内的标点后断开，收尾标点不放行首
function s2Wrap(c, str, maxW, size, weight = 400) { c.save(); c.font = `${weight} ${size}px NSans`; const out = []; let line = '';
  for (const ch of str) { const next = line + ch; if (!line || c.measureText(next).width <= maxW || '，。、？！」’…'.includes(ch)) { line = next; continue; }
    const cut = Math.max(...['，', '。', '？', '！', '、', '…'].map(p => line.lastIndexOf(p)));
    if (cut >= [...line].length * .55 && cut < line.length - 1) { out.push(line.slice(0, cut + 1)); line = line.slice(cut + 1) + ch; } else { out.push(line); line = ch; } }
  if (line) out.push(line); c.restore(); return out; }
// s2Rule：手画的直尺线（细线抖得很轻）
function s2Rule(c, x0, x1, y, o = {}) { const { w = 1.4, color = S2.C.line, seed = 1, p = 1 } = o;
  stroke(c, [[x0, y], [lerp(x0, x1, .5), y + .4], [x1, y]], { w, color, seed, p, taper: .03, rough: .18, smooth: false }); }

// ===================== 图 =====================
// s2Img：照片铺满 (x, y, w, h)，比例不同就居中裁掉多的一边。照片原样放，不调色、不涂鸦
function s2Img(c, name, x, y, w, h, al = 1) { const ph = PHOTOS[name], ar = w / h, sar = ph.w / ph.h; let sw = ph.w, sh = ph.h, sx = 0, sy = 0;
  if (sar > ar) { sw = ph.h * ar; sx = (ph.w - sw) / 2; } else { sh = ph.w / ar; sy = (ph.h - sh) / 2; }
  c.save(); c.globalAlpha *= al; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(ph.img, sx, sy, sw, sh, x, y, w, h); c.restore(); }
// s2Brand：头像 + SUKIMA MOONLIGHT，右端对齐 right
function s2Brand(c, right, y, dark = false, p = 1) { if (p <= 0) return; const sz = 44, tw = s2Text(c, 'SUKIMA MOONLIGHT', right, y, { font: 'SMono', size: 22, color: dark ? S2.C.paper : S2.C.ink, spacing: 1, align: 'right', p });
  s2Img(c, 'avatar', right - tw - 16 - sz, y - 31, sz, sz, clamp(p * 3, 0, 1)); }

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
  if (s >= SW.end) { s2Img(c, w.art, f.x, f.y, f.w, f.h); return; }
  s2Img(c, w.og, f.x, f.y, f.w, f.h); if (s < 0) return;
  // 隙间：先在画框左边冒出来、停一下，一口气扫过去（左边就换成了东方版），在右边停住、合上
  const pop = sm(0, SW.pop, s, easeOutQuint), run = sm(SW.run0, SW.run1, s, easeInOutSine), close = sm(SW.close0, SW.end, s, easeIn), sl = 34, hw = 15 * pop * (1 - close);
  // 两端只伸出画框 34 单位：上面的蝴蝶结碰不到左上角展签，下面的碰不到页脚
  // 裂缝和蝴蝶结是手画的，和第 1 段一样每秒抖 8 次（画框线、尺线跟外圈画框一样每秒 6 次）
  const sc = tick(t, 8), X = lerp(f.x - sl - 26, f.x + f.w + sl + 26, run), a = [X + sl, f.y - 34], b = [X - sl, f.y + f.h + 34], q = s2CrackPts(a, b, hw, 5 + sc, 9);
  if (run > 0) { c.save(); c.beginPath(); c.rect(f.x, f.y, f.w, f.h); c.clip(); c.clip(polyPath([[f.x - 400, a[1]], ...q.mid, [f.x - 400, b[1]]])); s2Img(c, w.art, f.x, f.y, f.w, f.h); c.restore(); }
  if (hw > .5) s2Crack(c, q, 40 + sc);
  const bk = 24 * pop * (1 - close); s2Bow(c, a[0], a[1], bk, 60 + sc); s2Bow(c, b[0], b[1], bk, 70 + sc, .08); }

// ===================== 右栏 =====================
// 引言：和维米尔原作并排，隙间扫过、露出八云紫，就是答案
function s2Intro(c, tau) { const C = S2.C, x = S2.COL, Q = S2.Q;
  s2Text(c, 'WHERE CLASSIC ART MEETS TOUHOU', x, 330, { font: 'SMono', size: 24, color: C.mute, spacing: 1, p: sm(Q, Q + .2, tau) });
  s2Rule(c, x, x + 120, 358, { w: 2.6, color: C.ink, seed: 3, p: sm(Q + .05, Q + .3, tau) });
  ['如果维米尔', '生活在幻想乡，', '他会画谁？'].forEach((l, j) => s2Text(c, l, x, 478 + j * 122, { size: 92, weight: 500, color: C.plum, p: sm(Q + j * .07, Q + .2 + j * .07, tau, easeOut) })); }
// 作品栏：编号标签、作品名、原作/角色/画师、原作小图 + 紫色台词、规格价格。换作品时整栏直接切（字一次出齐，停留时间从切过来算）
function s2Column(c, w, tau) { const C = S2.C, x = S2.COL, R = S2.R, t = twos(tau), sd = tick(t, 6);
  s2Text(c, `${w.no} / WORK`, x, 234, { font: 'SMono', size: 24, color: C.mute, spacing: 1 });
  s2Text(c, w.title, x, 316, { size: 72, weight: 500, color: C.ink });
  s2Rule(c, x, R, 350, { w: 2.6, color: C.ink, seed: 3 + sd });
  [['原作', w.orig], ['角色', w.role], ['画师', w.artist]].forEach(([k, v], j) => { const y = 408 + j * 62;
    s2Text(c, k, x, y, { size: 26, color: C.mute }); s2Text(c, v, x + 96, y, { size: 40, color: C.ink }); s2Rule(c, x, R, y + 22, { seed: 20 + j }); });
  // ORIGINAL：原作缩成小图弹进右栏（675×900 的原图缩到 216 高，4K 下不发软），旁边是紫色台词
  const tw = 162, th = 216, ty = 592, pk = sm(w.thumb, w.thumb + .25, t, easeOutBack);
  if (pk > 0) pop(c, x + tw / 2, ty + th / 2, pk, () => s2Img(c, w.og, x, ty, tw, th));
  s2Text(c, 'ORIGINAL', x, ty + th + 30, { font: 'SMono', size: 18, color: C.mute, spacing: 1, p: sm(w.thumb, w.thumb + .2, tau) });
  const qx = x + tw + 36, lines = s2Wrap(c, w.quote, R - qx, 30, 500);
  lines.forEach((l, j) => s2Text(c, l, qx, ty + 30 + j * 46, { size: 30, weight: 500, color: C.plum, p: sm(w.thumb + .2 + j * .12, w.thumb + .5 + j * .12, tau) }));
  // 规格价格：照素材事实一字不差，不写「起」
  s2Text(c, 'OFFERINGS / 供奉规格', x, 900, { font: 'SMono', size: 20, color: C.ink, spacing: 1 });
  s2Text(c, 'DONATION · CNY', R, 900, { font: 'SMono', size: 20, color: C.mute, spacing: 1, align: 'right' });
  s2Rule(c, x, R, 918, { w: 2, color: C.ink, seed: 30 + sd });
  s2Text(c, w.spec, x, 982, { size: 48, color: C.ink }); s2Text(c, w.price, R, 982, { size: 56, weight: 500, color: C.ink, align: 'right' }); }

// ===================== 纸页（开头 + 四幅作品） =====================
function s2Paper(c, tau) { const C = S2.C, w = S2.WORKS[s2Idx(tau)]; handoffSukima(c);
  s2Brand(c, S2.R, 100, false, sm(.2, .4, tau));
  s2Text(c, 'TOUHOU PROJECT × CLASSIC ART', S2.L, 1000, { font: 'SMono', size: 18, color: C.mute, spacing: 1, p: sm(.3, .5, tau) });
  s2Picture(c, w, tau);
  if (tau < S2.WORKS[0].t0) s2Intro(c, tau); else s2Column(c, w, tau);
  caption(c, '隙间月影', tau, .25, { t1: S2.GAP - .1 }); }

// ===================== 深色页：口号、QQ 群、四幅的规格价格 =====================
// dim 0..1：暗下去。dim = 1 时底色和纹理正好等于 handoffBlack
function s2DarkPage(c, tau, dim = 0) { const C = S2.C, L = S2.L, R = S2.R, fg = C.paper, faint = alpha(C.paper, .55), hair = alpha(C.paper, .16); setView(null);
  resetT(c); c.fillStyle = mix(C.night, K.ink, dim); c.fillRect(-10, -10, W + 20, H + 20); texture(c, null, 'ink', lerp(.45, 1, dim));
  const al = 1 - dim; if (al <= 0) return; c.save(); c.globalAlpha *= al;
  s2Brand(c, R, 100, true);
  s2Text(c, 'WHERE CLASSIC ART MEETS TOUHOU', L, 236, { font: 'SMono', size: 22, color: faint, spacing: 1 });
  s2Text(c, '名画与东方的邂逅。', L, 332, { size: 84, weight: 500, color: fg });
  const qw = s2Text(c, 'QQ 群', L, 452, { size: 40, color: faint }); s2Text(c, '917948669', L + qw + 22, 452, { size: 64, weight: 500, color: fg });
  s2Img(c, 'qr', R - 340, 166, 340, 340);
  s2Text(c, 'OFFERINGS / 供奉规格', L, 600, { font: 'SMono', size: 22, color: fg, spacing: 1 });
  s2Text(c, 'DONATION · CNY', R, 600, { font: 'SMono', size: 22, color: faint, spacing: 1, align: 'right' });
  s2Rule(c, L, R, 620, { w: 2, color: alpha(fg, .85), seed: 50 });
  S2.WORKS.forEach((w, j) => { const y = 692 + j * 70;
    s2Text(c, w.no, L, y, { font: 'SMono', size: 26, color: faint }); s2Text(c, w.title, L + 80, y, { size: 48, color: fg });
    s2Text(c, w.spec, 960, y, { size: 48, color: alpha(C.paper, .78) }); s2Text(c, w.price, R, y, { size: 48, weight: 500, color: fg, align: 'right' });
    if (j < 3) s2Rule(c, L, R, y + 25, { w: 1.2, color: hair, seed: 60 + j }); });
  s2Text(c, '数字典藏 ¥6.48；购买实物版免费附赠数字典藏。', L, 978, { size: 28, color: faint });
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
