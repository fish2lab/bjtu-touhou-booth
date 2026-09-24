'use strict';
// 第 2 段 隙间月影。拍成「逛画廊」：暖白纸墙上四个开间（每个一屏宽），镜头沿墙横移，一幅一幅看过去。
// 风格仍然克制：纸墙 SUKIMA_PAPER、墨、灰；暗紫只用在引言和隙间里的眼睛；字全用手写楷体（s2Hand）。
// 墙的底色画在屏幕坐标里（0 秒时和 handoffSukima 完全一样）；挂画轨、踢脚线、地板、画框、展签画在世界坐标里，用 setView 移镜头。
// 每一幅：镜头横移到位（easeIO，到位时 settle 过冲），画框在挂绳上晃一下 → 原作停 0.35 秒 → 画的上沿横着划一道细线、两端系小蝴蝶结，
//   张开成扁长的黑色隙间，缝里七只睁开的眼睛（紫瞳）各看各的 → 整道缝从上往下扫过，扫过的部分已是东方版，到下沿合上 →
//   展签卡片以左边为轴从墙上翻出来，四行字逐行写出 → 价格写完停 1.8 秒，镜头走向下一幅。
// 第 1 幅开头：挂画轨从左往右画出，画框带着维米尔原作从上方落到挂绳上，右边手写引言；隙间撕开后展签翻出来盖住引言。
// 结尾：镜头拉远看整面墙四幅并排，一道满屏的隙间撕开，里面是深色页（口号、QQ 群和二维码、四幅规格价格），暗成墨底交给第 3 段。
// 所有时刻由 S2.T 算出（文件中部的时刻表），改节奏只改 S2.T。按现在的 S2.T：
//   0–0.1   只画 handoffSukima        0.1–0.55 挂画轨画出      0.3–0.7 第 1 幅落下      0.5–1.54 引言写出
//   第 1 幅  隙间 3.14  换图 3.84  展签 4.14  价格写完 5.08  离开 7.28
//   第 2 幅  到位 8.18  隙间 8.78  换图 9.48  展签 9.78  价格写完 11.11  离开 13.31
//   第 3 幅  到位 14.21  隙间 14.81  换图 15.51  展签 15.81  价格写完 16.75  离开 18.95
//   第 4 幅  到位 19.85  隙间 20.45  换图 21.15  展签 21.45  价格写完 22.39  离开 24.59
//   24.59 拉远  26.09 满屏隙间  26.79 深色页  30.14 暗下去  30.39 只画 handoffBlack  30.54 段尾
// 屏上文字全部抄自 docs/素材事实.md。

const S2 = {
  C: { paper: SUKIMA_PAPER, ink: '#111111', mute: '#777772', dim: '#3a3833', plum: K.plum, night: '#101018',
    card: '#FCFBF9', shade: mix(SUKIMA_PAPER, K.g1, .55), floor: mix(SUKIMA_PAPER, K.g1, .3) },
  L: 152, R: 1770,                                           // 深色页的版心左右边
  BAY: 1920,                                                 // 开间宽：第 k 幅的开间中心 x = CX + k × BAY
  RAIL: 110, SKIRT: 1011, FLOOR: 1021,                       // 挂画轨、踢脚线中线、地板上沿
  FX: 540, PCY: 562, PH: 640, MAT: 30, FW: 26, HOOK: 150,    // 画框中心 x（开间内）、画心 y、画高、白卡纸衬、框宽、挂钩离画框中线
  CARD: { x: 950, y: 262, w: 770, h: 600, pad: 44 },         // 展签卡片（开间内坐标）；盖得住引言
  QX: 1000, QY: [430, 562, 694], QUOTE: ['如果维米尔', '生活在幻想乡，', '他会画谁？'],
  WIDE: { x: 3845, y: 562, zoom: .245 },                     // 结尾拉远：四幅画连同展签整面墙装进画面
  T: {
    hs: .1,                        // 开头只画交接画面
    rail0: .1, rail1: .55,         // 挂画轨从左往右画出
    drop: .3, fall: .4,            // 第 1 幅从上方落下
    q: .5, qGap: .38, qPer: .055, qHold: 1.2,   // 引言：起写、每行间隔、每字秒数、写完后停
    og: .35,                       // 镜头到位后原作停
    line: .2, open: .25, sweep: .7, close: .25,   // 隙间：在画的上沿划线、张开、从上往下扫过整幅画、在下沿合上
    lag: .15, card: .3,            // 隙间合上 lag 秒后展签开始翻出；翻出用时
    rows: [0, .2, .35, .45, .55], per: [.03, .018, .015, .03, .03],   // 展签四行（作品名、原作、角色画师、规格、价格）的起写时刻和每字秒数
    priceHold: 1.8, move: .7,      // 价格写完后停；镜头横移
    zoom: .9, wide: .4, gap: .7, dark: 3.0, dim: .25, black: .15,   // 拉远、整面墙停、满屏隙间、深色页、暗下去、墨底交接
  },
  WORKS: [
    { no: '01', title: '戴珍珠耳环的17岁少女', orig: '维米尔《戴珍珠耳环的少女》', role: '八云紫', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68', art: 'art1', og: 'orig1' },
    { no: '02', title: '不动的大图书馆', orig: '斯皮茨韦格《书虫》', role: '帕秋莉·诺蕾姬', artist: '青未Q', spec: '16寸画芯', price: '¥70（A款）/ ¥78（B款）', art: 'art2', og: 'orig2' },
    { no: '03', title: '蓬莱宫娥', orig: '委拉斯开兹《宫娥》', role: '蓬莱山辉夜 & 永远亭众', artist: 'amibazh', spec: '14寸画芯', price: '¥69', art: 'art3', og: 'orig3' },
    { no: '04', title: '妖怪之山的秋千', orig: '弗拉戈纳尔《秋千》', role: '東風谷早苗 & 射命丸文', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68', art: 'art4', og: 'orig4' },
  ],
};
// 隙间里的眼睛：沿缝的位置 u（占缝半长）、横穿缝的位置 v（占缝半宽）、眼的半宽。张满时都在缝里，互不重叠
const S2EYES = [[-.08, -.52, 70], [.40, -.18, 58], [-.46, -.06, 54], [.08, .22, 76], [-.28, .58, 50], [.46, .52, 46], [-.72, .28, 42]];

// ===================== 时刻表 =====================
// 每一幅：arrive 镜头到位（第 1 幅是画框落到挂绳上）、tear 隙间开始划线、full 张满、swap 缝里换图、close 开始合上、
// flip 展签开始翻出、write 开始写字、priceDone 价格写完、leave 镜头离开。之后 ZOOM 拉远、GAP 满屏隙间、DARK 深色页、DIM 暗下去、OUT 墨底、END 段尾
const s2N = s => [...String(s).replace(/\n/g, '')].length;
(() => { const T = S2.T, Ws = S2.WORKS, qDone = Math.max(...S2.QUOTE.map((l, j) => T.q + j * T.qGap + s2N(l) * T.qPer)); let arrive = T.drop + T.fall;
  Ws.forEach((w, k) => { const ph = PHOTOS[w.art]; w.pw = Math.round(S2.PH * ph.w / ph.h);   // 画高 640：东方版 1404–2000 像素高，4K 下不放大
    w.arrive = arrive; w.tear = k ? arrive + T.og : qDone + T.qHold; w.full = w.tear + T.line + T.open; w.sw0 = w.full; w.sw1 = w.full + T.sweep; w.close = w.sw1;
    w.flip = w.close + T.lag; w.write = w.flip + T.card; w.priceDone = w.write + T.rows[4] + s2N(w.price) * T.per[4]; w.leave = w.priceDone + T.priceHold; arrive = w.leave + T.move; });
  S2.ZOOM = Ws[Ws.length - 1].leave; S2.GAP = S2.ZOOM + T.zoom + T.wide; S2.DARK = S2.GAP + T.gap; S2.DIM = S2.DARK + T.dark; S2.OUT = S2.DIM + T.dim; S2.END = S2.OUT + T.black; })();

// ===================== 字 =====================
// s2Hand：手写楷体一行，抖动调小到读得清。p 0..1 逐字写出，返回字宽
function s2Hand(c, str, x, y, o = {}) { const { size = 40, color = S2.C.ink, weight = 400, align = 'left', p = 1, al = 1, seed = 3 } = o;
  zh(c, str, x, y, { size, color, weight, align, p, al, seed, tilt: .012, jitter: .012 }); return zhWidth(c, str, size, ZH, weight); }
// s2Fit：一行放不下 maxW 时拆成两行。只在字和字之间断：不拆英文数字、不让收尾标点落到行首；优先断在「的」、空格、斜杠后面，两行尽量一样长
function s2Fit(c, str, size, weight, maxW) { const wd = s => zhWidth(c, s, size, ZH, weight); if (wd(str) <= maxW) return [str];
  const ch = [...str], latin = /[A-Za-z0-9._@¥-]/, tail = '，。、）》」…/：；', head = '（《「', good = '的 /'; let best = null;
  for (let i = 1; i < ch.length; i++) { const p = ch[i - 1], n = ch[i]; if ((latin.test(p) && latin.test(n)) || tail.includes(n) || head.includes(p)) continue;
    const a = ch.slice(0, i).join('').trimEnd(), b = ch.slice(i).join('').trimStart(); if (!a || !b) continue;
    const cost = Math.max(wd(a), wd(b)) + (good.includes(p) ? 0 : 120); if (!best || cost < best.cost) best = { cost, a, b }; }
  return best ? [best.a, best.b] : [str]; }
// s2Rows：一幅展签上的各行（卡片内坐标）。作品名、原作、角色和画师从上往下排；规格和价格贴着卡片底边。每行的起写间隔照旧，折成两行时第二行接着第一行写
function s2Rows(c, w) { if (w.rows) return w.rows; const C = S2.C, cd = S2.CARD, T = S2.T, iw = cd.w - cd.pad * 2, rows = [];
  const add = (lines, size, weight, color, idx, y, step) => { let t0 = T.rows[idx]; lines.forEach((s, j) => { rows.push({ s, size, weight, color, y: y + j * step, t0, per: T.per[idx], seed: 11 + idx * 3 + j }); t0 += s2N(s) * T.per[idx]; }); };
  const one = `${w.role} · 画师 ${w.artist}`, title = s2Fit(c, w.title, 84, 500, iw), orig = s2Fit(c, w.orig, 44, 400, iw), price = s2Fit(c, w.price, 72, 500, iw);
  const who = zhWidth(c, one, 40) <= iw ? [one] : [w.role, `画师 ${w.artist}`];
  let y = 108; add(title, 84, 500, C.ink, 0, y, 94); y += (title.length - 1) * 94 + 80; add(orig, 44, 400, C.dim, 1, y, 56); y += (orig.length - 1) * 56 + 62; add(who, 40, 400, C.mute, 2, y, 52);
  const pl = cd.h - 50 - (price.length - 1) * 84; add([w.spec], 44, 400, C.dim, 3, pl - 88, 0); add(price, 72, 500, C.ink, 4, pl, 84);
  return (w.rows = rows); }

// ===================== 隙间 =====================
// s2CrackPts：一道透镜形的隙间，从尖 a 到尖 b。hw 中间的半宽，bend 中线的弯度；pow 越小两头越圆（盖画用 .45），wob 边缘起伏。
// 返回两侧唇线 L、R 和中线 mid（都从 a 到 b）
function s2CrackPts(a, b, hw, seed, bend = 0, o = {}) { const { pow = .7, wob = .16 } = o, n = 56, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, L = [], R = [], mid = [];
  for (let k = 0; k <= n; k++) { const v = k / n, s = Math.sin(v * Math.PI), w = hw * Math.pow(s, pow) * (1 + wob * noise1(v * 7, seed)), off = bend * s + 3 * noise1(v * 4, seed + 2) * s;
    const x = a[0] + dx * v + nx * off, y = a[1] + dy * v + ny * off; mid.push([x, y]); L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]); }
  return { L, R, mid }; }
// s2Lips：隙间两侧唇线内侧的白色刮痕
function s2Lips(c, q, seed, w = 2.2) { const n = q.mid.length - 1, k0 = Math.round(n * .07), k1 = n - k0;
  [q.L, q.R].forEach((side, j) => { const pts = []; for (let k = k0; k <= k1; k++) { const m = q.mid[k], e = side[k], d = Math.hypot(e[0] - m[0], e[1] - m[1]), f = d > 1 ? Math.max(0, d - 3.2) / d : 0; pts.push([lerp(m[0], e[0], f), lerp(m[1], e[1], f)]); }
    scratch(c, pts, { w, seed: seed + j * 7, dry: .12, taper: .4 }); }); }
// s2Bow：隙间一端系的小蝴蝶结（墨色，照第 1 段 s1Bow 的形：两个圈、两根飘带、一个结）。(x, y) 是结，s 是大小
function s2Bow(c, x, y, s, seed, rot = 0) { if (s < 1) return; const T = tf(x, y, s, rot);
  for (const d of [-1, 1]) { block(c, M(T, [[0, 0], [d * .5, -.58], [d * 1.05, -.64], [d * 1.22, -.22], [d * .98, .12], [d * .42, .14]]), K.ink, { amp: s * .025, freq: 8, seed: seed + d, grain: .4 });
    scratch(c, M(T, [[d * .3, -.16], [d * .7, -.42], [d * .98, -.32]]), { w: Math.max(1.2, s * .06), seed: seed + 4 + d, dry: .1 }); }
  stroke(c, M(T, [[-.05, .08], [-.3, .62], [-.52, 1.18]]), { w: s * .17, color: K.ink, seed: seed + 7, taper: .5 });
  stroke(c, M(T, [[.05, .08], [.26, .66], [.4, 1.22]]), { w: s * .17, color: K.ink, seed: seed + 8, taper: .5 });
  fillPts(c, M(T, ellPts(0, 0, .22, .2, 0, 14)), K.ink); }
// s2Eyes：隙间里的眼睛。跟着缝张开一只只睁开，每 0.28 秒各自换一个方向看，两只各眨一下；缝开始合上时先闭眼
function s2Eyes(c, cx, cy, hl, hw, g, t, seed) { const T = S2.T, full = T.line + T.open, shut = full + T.sweep;
  S2EYES.forEach(([u, v, r], j) => { let op = sm(T.line + .08 + j * .03, full + .02 + j * .03, g, easeOut) * (1 - sm(shut - .04, shut + .1, g));
    if ((j === 1 && g > full + .06 && g < full + .15) || (j === 4 && g > full + .18 && g < full + .27)) op = .06;
    if (op <= .02) return; const a = hash(Math.floor((g + j * .11) / .28), seed + j) * TAU;
    eyeLines(c, cx + u * hl, cy + v * hw, r * .5, { open: op, look: [Math.cos(a) * .9, Math.sin(a) * .9], color: K.paper, iris: K.plum, seed: seed + j * 5 + tick(t, 8), rot: (hash(j, seed) - .5) * .24 }); }); }
// s2SweepY：隙间扫到的高度。从画的上沿外一点扫到下沿外一点；扫过的部分已经换成东方版（s2Frame 按同一个高度裁开两张图，分界线始终藏在缝里）
const s2SweepY = (w, tau, py) => lerp(py - 30, py + S2.PH + 30, easeIO(clamp((tau - w.sw0) / S2.T.sweep, 0, 1)));
// s2Tear：画上的隙间。在画的上沿横着划一道细线、两端系蝴蝶结，张开成一道扁长的裂缝（长约画宽 1.6 倍、高 220），缝里的眼睛睁开，
//   整道缝从上往下扫过整幅画，扫到下沿合上
function s2Tear(c, w, px, py, tau, seed) { const T = S2.T, t = twos(tau), g = t - w.tear, end = T.line + T.open + T.sweep + T.close; if (g < 0 || g >= end) return;
  const sd = tick(t, 8), cx = px + w.pw / 2, cy = s2SweepY(w, tau, py), hl = w.pw * .8, HW = 110;
  const len = sm(0, T.line, g, easeOutQuint), open = sm(T.line, T.line + T.open, g, easeOut), shut = sm(end - T.close, end, g, easeIn), hw = HW * open * (1 - shut);
  const a = [cx - hl * len, cy + 6 * len], b = [cx + hl * len, cy - 6 * len];
  if (hw < 3) stroke(c, [a, b], { w: 4, color: K.ink, seed: seed + sd, taper: .25, rough: .2 });
  else { const q = s2CrackPts(a, b, hw, seed + sd, 0, { pow: .7, wob: .1 }), path = block(c, [...q.L, ...q.R.slice().reverse()], K.ink, { amp: 1.1, freq: 9, seed: seed + 1 + sd, grain: .5, smooth: false });
    c.save(); c.clip(path); s2Eyes(c, cx, cy, hl, hw, g, t, seed + 30); c.restore();
    s2Lips(c, q, seed + 3 + sd, lerp(3, 5, open * (1 - shut))); }
  const bk = 22 * sm(.06, .24, g, easeOutBack) * (1 - sm(end - .12, end, g)); s2Bow(c, a[0], a[1], bk, seed + 40 + sd, -.1); s2Bow(c, b[0], b[1], bk, seed + 50 + sd, .1); }

// ===================== 墙：挂画轨、踢脚线、地板 =====================
// 世界坐标里一条贯穿的挂画轨和踢脚线。开头从画面左边往右画出来（p 换算成画面内 -40..1960 这一段），之后整条都在
function s2Wall(c, tau) { const T = S2.T, t = twos(tau), sd = tick(t, 8), X0 = -3600, X1 = 4 * S2.BAY + 3600, span = X1 - X0, head = u => clamp((-40 - X0 + u * 2000) / span, 0, 1);
  const pr = tau >= T.rail1 + .1 ? 1 : head(sm(T.rail0, T.rail1, t, easeOut)), ps = tau >= T.rail1 + .2 ? 1 : head(sm(T.rail0 + .08, T.rail1 + .08, t, easeOut));
  const fl = polyPath(rectPts(X0, S2.FLOOR, span * ps, 3200)); c.save(); c.fillStyle = S2.C.floor; c.fill(fl); c.restore(); texture(c, fl, 'lines', 1);
  stroke(c, [[X0, S2.SKIRT], [X1, S2.SKIRT]], { w: 22, p: ps, color: K.ink, seed: 7 + sd, taper: .001, rough: .1, smooth: false });
  stroke(c, [[X0, S2.RAIL], [X1, S2.RAIL]], { w: 7, p: pr, color: K.ink, seed: 3 + sd, taper: .001, rough: .18, smooth: false });
  stroke(c, [[X0, S2.RAIL + 14], [X1, S2.RAIL + 14]], { w: 2, p: pr, color: K.ink, seed: 5 + sd, taper: .001, rough: .3, dry: .3, smooth: false }); }

// ===================== 画框 =====================
// s2Hang：画框在挂绳上的晃动（绕挂画轨上的一点转 th，±1.5° 衰减）和第 1 幅落下的位移 dy
function s2Hang(k, tau) { const T = S2.T, w = S2.WORKS[k]; let dy = 0;
  if (!k) dy = tau < w.arrive ? -1000 * (1 - easeIn(clamp((tau - T.drop) / T.fall, 0, 1))) : settle(tau, w.arrive, { amp: 26, freq: 2.6, decay: 7 });
  return { dy, th: settle(tau, k ? w.arrive - .1 : w.arrive, { amp: -.044, freq: 1.1, decay: 2.6 }) }; }
// s2Hung：在第 k 幅画框晃动后的坐标里画 fn
function s2Hung(c, k, tau, fn) { const fx = k * S2.BAY + S2.FX, { dy, th } = s2Hang(k, tau); c.save(); c.translate(fx, S2.RAIL + dy); c.rotate(th); c.translate(-fx, -S2.RAIL); fn(); c.restore(); }
// s2Frame：墙上的投影（平的灰块）、木刻粗黑框（内侧一道白刻线、四角斜接缝）、白卡纸衬、画。缝盖满画之后换成东方版
function s2Frame(c, w, px, py, tau, seed, sd) { const C = S2.C, pw = w.pw, ph = S2.PH, m = S2.MAT, fw = S2.FW, o = m + fw, t = twos(tau);
  block(c, rectPts(px - o + 9, py - o + 11, pw + o * 2, ph + o * 2), C.shade, { smooth: false, amp: 1, freq: 24, seed: seed + sd, grain: .4 });
  block(c, rectPts(px - o, py - o, pw + o * 2, ph + o * 2), K.ink, { smooth: false, amp: 1.5, freq: 16, seed: seed + 1 + sd, grain: .6 });
  outline(c, rectPts(px - o + 9, py - o + 9, pw + o * 2 - 18, ph + o * 2 - 18), { w: 1.6, color: K.paper, al: .55, dry: .5, seed: seed + 2 + sd, smooth: false, rough: .4 });
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy], j) => { const x0 = sx < 0 ? px - o : px + pw + o, y0 = sy < 0 ? py - o : py + ph + o;
    scratch(c, [[x0 - sx * 4, y0 - sy * 4], [x0 - sx * (fw - 3), y0 - sy * (fw - 3)]], { w: 1.8, al: .7, dry: 0, taper: .2, seed: seed + 10 + j + sd, smooth: false }); });
  block(c, rectPts(px - m, py - m, pw + m * 2, ph + m * 2), C.card, { smooth: false, amp: .7, freq: 26, seed: seed + 3 + sd, grain: .5 });
  if (tau < w.sw0 || tau >= w.sw1) img(c, tau >= w.sw1 ? w.art : w.og, px, py, pw, ph);
  else { img(c, w.og, px, py, pw, ph); c.save(); c.beginPath(); c.rect(px - 4, py - 4, pw + 8, s2SweepY(w, tau, py) - py + 4); c.clip(); img(c, w.art, px, py, pw, ph); c.restore(); }
  outline(c, rectPts(px - 1, py - 1, pw + 2, ph + 2), { w: 1.6, color: K.g3, seed: seed + 4 + sd, smooth: false, rough: .3 }); }

// ===================== 引言与展签 =====================
// 引言：第 1 幅右边，展签的位置。展签翻出来盖住它，翻完就不再画
function s2Quote(c, tau) { const T = S2.T, w = S2.WORKS[0], t = twos(tau); if (tau >= w.flip + T.card) return;
  S2.QUOTE.forEach((l, j) => s2Hand(c, l, S2.QX, S2.QY[j], { size: 100, weight: 500, color: S2.C.plum, p: writeP(t, T.q + j * T.qGap, l, T.qPer), seed: 20 + j })); }
// 展签：白卡片、细墨描边、墙上一块平的灰投影。以左边为轴横向缩放 0→1（easeOutBack 带一点过冲），翻完逐行写字
function s2Card(c, k, tau) { const w = S2.WORKS[k], C = S2.C, cd = S2.CARD, t = twos(tau), sd = tick(t, 8), seed = 400 + k * 30, x0 = k * S2.BAY + cd.x, y0 = cd.y;
  const kx = sm(w.flip, w.flip + S2.T.card, tau, easeOutBack); if (kx <= .005) return;
  c.save(); c.translate(x0, 0); c.scale(kx, 1); c.translate(-x0, 0);
  block(c, rectPts(x0 + 7, y0 + 9, cd.w, cd.h), C.shade, { smooth: false, amp: .8, freq: 28, seed: seed + sd, grain: .4 });
  block(c, rectPts(x0, y0, cd.w, cd.h), C.card, { smooth: false, amp: .8, freq: 30, seed: seed + 1 + sd, grain: .5 });
  outline(c, rectPts(x0, y0, cd.w, cd.h), { w: 2.4, color: K.ink, seed: seed + 2 + sd, smooth: false, rough: .3 });
  for (const r of s2Rows(c, w)) s2Hand(c, r.s, x0 + cd.pad, y0 + r.y, { size: r.size, weight: r.weight, color: r.color, p: writeP(t, w.write + r.t0, r.s, r.per), seed: r.seed });
  c.restore(); }

// ===================== 一个开间 =====================
// 挂钩和两根挂绳（从轨上斜拉到画框上角）→ 画框 → 引言、展签 → 画上的隙间（压在最上面，可以盖出画框、盖到墙上）
function s2Bay(c, k, tau) { const w = S2.WORKS[k], T = S2.T, sd = tick(twos(tau), 8), seed = 200 + k * 40, fx = k * S2.BAY + S2.FX, o = S2.MAT + S2.FW, px = fx - w.pw / 2, py = S2.PCY - S2.PH / 2, hung = k || tau >= T.drop;
  if (hung) { const { dy, th } = s2Hang(k, tau), ca = Math.cos(th), sa = Math.sin(th), P = (x, y) => { const u = x - fx, v = y - S2.RAIL; return [fx + u * ca - v * sa, S2.RAIL + dy + u * sa + v * ca]; };
    for (const s of [-1, 1]) { const hx = fx + s * S2.HOOK, cn = P(fx + s * (w.pw / 2 + o - 16), py - o + 4);
      if (cn[1] > S2.RAIL + 14) stroke(c, [[hx, S2.RAIL + 6], cn], { w: 2.2, color: K.ink, seed: seed + 4 + s + sd, taper: .04, rough: .25, smooth: false });
      block(c, [[hx - 6, S2.RAIL - 9], [hx + 6, S2.RAIL - 9], [hx + 5, S2.RAIL + 10], [hx - 5, S2.RAIL + 10]], K.ink, { smooth: false, amp: .6, seed: seed + 7 + s + sd, grain: .3 }); }
    s2Hung(c, k, tau, () => s2Frame(c, w, px, py, tau, seed, sd)); }
  if (!k) s2Quote(c, tau);
  s2Card(c, k, tau);
  if (hung) s2Hung(c, k, tau, () => s2Tear(c, w, px, py, tau, seed + 60)); }

// ===================== 镜头与整面墙 =====================
// s2Cam：停在开间中心；价格停够后横移到下一个开间（easeIO），到位时 settle 过冲一点；最后拉远看整面墙
function s2Cam(tau) { const T = S2.T, Ws = S2.WORKS, n = Ws.length, bc = k => CX + k * S2.BAY; let x = bc(0), y = CY, zoom = 1;
  for (let k = 1; k < n; k++) if (tau >= Ws[k - 1].leave) x = lerp(bc(k - 1), bc(k), sm(Ws[k - 1].leave, Ws[k].arrive, tau, easeIO)) + settle(tau, Ws[k].arrive, { amp: 28, freq: 1.6, decay: 6 });
  if (tau >= S2.ZOOM) { const e = sm(S2.ZOOM, S2.ZOOM + T.zoom, tau, easeIO), V = S2.WIDE; x = lerp(bc(n - 1), V.x, e); y = lerp(CY, V.y, e);
    zoom = Math.exp(Math.log(V.zoom) * e) * (1 + settle(tau, S2.ZOOM + T.zoom, { amp: -.03, freq: 1.4, decay: 5 })); }
  return { x, y, zoom }; }
// s2Gallery：墙底色（屏幕坐标，和 handoffSukima 一样）→ 镜头里的墙和开间 → 左上角展签字幕（屏幕坐标）
function s2Gallery(c, tau) { handoffSukima(c); setView(s2Cam(tau)); viewT(c); s2Wall(c, tau);
  const [vx, , vw] = viewRect(60); S2.WORKS.forEach((w, k) => { const b0 = k * S2.BAY; if (b0 + 1780 < vx || b0 + 60 > vx + vw) return; s2Bay(c, k, tau); });
  setView(null); resetT(c); caption(c, '隙间月影', tau, .25, { t1: S2.GAP - .1 }); }

// ===================== 深色页：口号、QQ 群、四幅的规格价格 =====================
// s2DarkCols：深色页价格表的列。价格 72 号右对齐，规格放在最长的作品名和最长的价格之间
function s2DarkCols(c) { if (S2.DCOLS) return S2.DCOLS; const Ws = S2.WORKS, mx = f => Math.max(...Ws.map(f)), sw = mx(w => zhWidth(c, w.spec, 44)), pw = mx(w => zhWidth(c, w.price, 72, ZH, 500)), room = S2.R - S2.L - sw - pw;
  let ts = 52; while (ts > 44 && mx(w => zhWidth(c, w.title, ts)) > room - 96) ts -= 2;
  const tw = mx(w => zhWidth(c, w.title, ts)); return (S2.DCOLS = { ts, sx: S2.L + tw + Math.max(40, (room - tw) / 2) }); }
// dim 0..1：暗下去。dim = 1 时底色和纹理正好等于 handoffBlack
function s2DarkPage(c, tau, dim = 0) { const C = S2.C, L = S2.L, R = S2.R, fg = C.paper, faint = alpha(C.paper, .6); setView(null);
  resetT(c); c.fillStyle = mix(C.night, K.ink, dim); c.fillRect(-10, -10, W + 20, H + 20); texture(c, null, 'ink', lerp(.45, 1, dim));
  const al = 1 - dim; if (al <= 0) return; c.save(); c.globalAlpha *= al;
  img(c, 'avatar', L, 150, 64, 64); s2Hand(c, '隙间月影', L + 84, 200, { size: 44, color: fg, seed: 40 });
  s2Hand(c, '名画与东方的邂逅。', L, 340, { size: 88, weight: 500, color: fg, seed: 41 });
  s2Hand(c, 'QQ群 917948669', L, 450, { size: 60, color: fg, seed: 42 });
  img(c, 'qr', R - 340, 150, 340, 340);
  const col = s2DarkCols(c);
  S2.WORKS.forEach((w, j) => { const y = 650 + j * 96;
    s2Hand(c, w.title, L, y, { size: col.ts, color: fg, seed: 50 + j }); s2Hand(c, w.spec, col.sx, y, { size: 44, color: faint, seed: 60 + j });
    s2Hand(c, w.price, R, y, { size: 72, weight: 500, color: fg, align: 'right', seed: 70 + j }); });
  c.restore(); }

// ===================== 满屏隙间：整面墙上裂开一道缝，里面是深色页 =====================
// 和第 1 段结尾同一个动作：一条线从中间往两头拉长，两端系上蝴蝶结，停一下，裂开到满屏
function s2BigGap(c, tau) { const g = tau - S2.GAP, t = twos(tau), sd = tick(t, 8); s2Gallery(c, tau);
  const len = sm(0, .22, twos(g), easeOutQuint), bow = sm(.12, .3, twos(g), easeOutBack), open = sm(.4, S2.DARK - S2.GAP, g, easeIn); if (len <= 0) return;
  const half = 830 * len + open * 1900, hh = 7 + open * 1700, a = [CX - half, CY + 8], b = [CX + half, CY - 8];
  const q = s2CrackPts(a, b, hh, 90 + sd), rim = s2CrackPts(a, b, hh + 5 + 12 * open, 90 + sd);
  block(c, [...rim.L, ...rim.R.slice().reverse()], K.ink, { amp: 1.3, freq: 10, seed: 91 + sd, grain: .5, smooth: false });
  c.save(); c.clip(polyPath(rough([...q.L, ...q.R.slice().reverse()], { amp: 1.2, freq: 10, seed: 93 + sd, smooth: false }))); s2DarkPage(c, tau); c.restore();
  s2Lips(c, q, 95 + sd, lerp(2.4, 5, open));
  const bk = 34 * bow * (1 - open); s2Bow(c, a[0], a[1], bk, 100 + sd, -.06); s2Bow(c, b[0], b[1], bk, 110 + sd, .06); }

scene({ order: 2, key: 'sukima', name: '隙间月影', dur: S2.END, fn: (c, tau) => {
  if (tau < S2.T.hs) handoffSukima(c);
  else if (tau < S2.GAP) s2Gallery(c, tau);
  else if (tau < S2.DARK) s2BigGap(c, tau);
  else if (tau < S2.OUT) s2DarkPage(c, tau, sm(S2.DIM, S2.OUT, tau, easeInOutSine));
  else handoffBlack(c);
} });
