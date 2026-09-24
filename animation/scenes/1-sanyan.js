'use strict';
// 第 1 段 三眼的幻恋（28 秒）。照参考视频开头：桌面俯拍的一张纸，钢笔滴墨，墨团变成紧闭的觉之瞳（只有眼皮线和睫毛），
// 伸出一根越长越乱的线；切进书架走廊，觉之瞳把书一本本吸进去、越吃越大，最后胀满屏；黑底上双生藤蔓缠成心形、开出蔷薇，一滴暗红落下又褪成灰；
// 黑底卡写两句售卖信息，写完左移，右侧放封面水墨版，颜色从觉之瞳处慢慢晕回彩色版；
// 最后一条紧闭的眼皮线拉成一道隙间，裂开，里面是第 2 段隙间月影的纸（#F7F6F4 满屏交接）。
// 除了封面不出现人物，不碰小说关键情节。字幕是小说原句。

const S1 = {
  A: 0, B: 5.2, C: 11.0, D: 16.6, E: 26.4, END: 28,     // 五个镜头的起点
  blot: [960, 565],                                         // 墨团落点
  vp: [960, 470], F: 520, wall: 1.15, speed: .85, zEnd: 15, // 走廊：灭点、焦距、墙距、镜头速度、尽头
  eye: [960, 811],                                          // 走廊里眼睛（半径 60 时）在屏上的位置
  fly: [5.8, 10.2, 36, .9],                                 // 飞书：第一本、最后一本起飞的时刻，本数，每本飞几秒
  pull: [[-1, 3, 9.4, 12], [1, 2, 9.52, 13]],               // 整排被扯出来：哪一侧、哪一层、第一本起飞时刻、本数（一本接一本，间隔 0.03 秒）
  fill: [10.4, 10.9],                                       // 墨团胀满屏
  sukima: SUKIMA_PAPER,
  sale: ['三眼的幻恋是包子的处女作', '在现场cos恋恋签售的就是作者'],   // 用户定稿：片子就在摊位上放，不写时间地点
  saleL: 150,                                               // 售卖文字块左沿（蔷薇图标的左边），和封面右边距相同
  cover: { x: 1497.5, y: 540, w: 520, eye: [.232, .564] }, // 封面：宽 520，右沿连外圈描边在 x=1770；eye 是封面上觉之瞳的位置（比例）
};

// ===================== 道具 =====================
// s1Pen：钢笔。笔尖在 (x, y)，a 是笔杆朝向（从笔尖指向笔尾）
function s1Pen(c, x, y, a, seed) { const T = (u, v) => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)];
  block(c, M(T, [[58, -13], [150, -15], [168, -18], [520, -18], [548, -10], [552, 0], [548, 10], [520, 18], [168, 18], [150, 15], [58, 13]]), K.ink, { smooth: false, amp: 1.2, seed, grain: .5 });
  block(c, M(T, [[0, 0], [30, -7], [62, -12], [62, 12], [30, 7]]), K.paper, { smooth: false, amp: .8, seed: seed + 1, grain: .4 });
  outline(c, M(T, [[0, 0], [30, -7], [62, -12], [62, 12], [30, 7]]), { w: 4, seed: seed + 2, smooth: false });
  stroke(c, M(T, [[4, 0], [44, 0]]), { w: 3.5, seed: seed + 3, smooth: false }); fillPts(c, ellPts(...T(44, 0), 4.5, 4.5), K.ink);
  scratch(c, M(T, [[190, -8], [500, -9]]), { w: 5, seed: seed + 4, al: .8 });
  scratch(c, M(T, [[430, 20], [440, 26], [520, 25]]), { w: 5.5, seed: seed + 5, smooth: false }); }
// s1Inkwell：墨水瓶（左下角）
function s1Inkwell(c, x, y, seed) { block(c, [[x - 78, y + 62], [x - 84, y - 20], [x - 60, y - 52], [x - 34, y - 56], [x - 34, y - 90], [x + 34, y - 90], [x + 34, y - 56], [x + 60, y - 52], [x + 84, y - 20], [x + 78, y + 62]], K.ink, { smooth: false, amp: 1.8, seed, streaks: 2 });
  block(c, rectPts(x - 44, y - 12, 88, 46), K.paper, { smooth: false, amp: 1.2, seed: seed + 1 }); stroke(c, [[x - 30, y + 8], [x - 14, y], [x + 2, y + 12], [x + 18, y + 2], [x + 30, y + 10]], { w: 4.5, seed: seed + 2 }); }
// s1Candy：一颗包着糖纸的糖（小说里的橘子味糖）
function s1Candy(c, x, y, rot, seed) { const T = tf(x, y, 1, rot); block(c, M(T, ellPts(0, 0, 40, 26, 0, 24)), K.ink, { seed, amp: 1.4 });
  for (const s of [-1, 1]) block(c, M(T, [[s * 36, -6], [s * 72, -26], [s * 64, 0], [s * 74, 24], [s * 36, 6]]), K.ink, { smooth: false, seed: seed + 3 + s, amp: 1.2 });
  scratch(c, M(T, [[-22, -12], [-6, -17], [10, -15]]), { w: 5, seed: seed + 7 }); }
// s1Slip：一张撕下来的日记纸，写着几行看不清的字
function s1Slip(c, x, y, rot, seed) { const T = tf(x, y, 1, rot), box = [[-110, -70], [110, -76], [104, 70], [-106, 74]];
  const top = []; for (let u = -110; u <= 110; u += 10) top.push([u, -72 + (hash(u + 200, seed) - .5) * 9]);
  block(c, M(T, [...top, [104, 70], [-106, 74]]), K.card, { smooth: false, amp: .8, seed, grain: .6 }); outline(c, M(T, box), { w: 4.5, seed: seed + 1, smooth: false });
  for (let k = 0; k < 4; k++) { const pts = []; for (let u = -84; u <= 60 + (k % 2) * 20; u += 12) pts.push([u, -36 + k * 28 + Math.sin(u * .2 + k) * 4]); stroke(c, M(T, pts), { w: 3.5, seed: seed + 5 + k, al: .8 }); } }
// s1Ring：茶杯留下的一圈印子
function s1Ring(c, x, y, r, seed) { stroke(c, ellPts(x, y, r, r * .97, 0, 60), { close: true, w: 10, dry: .55, seed, al: .75, taper: 0 }); stroke(c, ellPts(x + 6, y - 4, r * .93, r * .9, 0, 60).slice(8, 40), { w: 5, dry: .5, seed: seed + 1, al: .5 }); }

// s1Blot：墨团。R 半径，wild 0..1 炸开时的毛刺（平静下来就是圆的觉之瞳）
function s1Blot(c, x, y, R, o = {}) { const { wild = 0, seed = 1, t = 0 } = o, sd = seed + tick(t, 8), r = rng(seed);
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + (r() - .5) * .45, L = R * (.2 + r() * 1.1) * wild, bw = R * (.16 + r() * .12), bend = (r() - .5) * .7; if (L < 2) continue;
    const pt = (s, side) => { const aa = a + bend * s * s, d = R * .7 + (L + R * .3) * s, hw = bw / 2 * Math.pow(1 - s, 1.3) * side; return [x + Math.cos(aa) * d - Math.sin(aa) * hw, y + Math.sin(aa) * d + Math.cos(aa) * hw]; };
    const pts = []; for (let s = 0; s <= 1.001; s += .1) pts.push(pt(s, 1)); for (let s = 1; s >= -.001; s -= .1) pts.push(pt(s, -1)); block(c, pts, K.ink, { smooth: false, amp: 1.3, seed: sd + k, grain: .5 }); }
  block(c, ellPts(x, y, R, R * .95, .2, 56), K.ink, { amp: R * .05, freq: 11, spike: .05 * wild, spikeLen: R * .3, seed: sd, streaks: 3, grain: .6 }); }
// s1CordPts：觉之瞳伸出的那一根线。从 (x, y) 朝 a 方向伸出，越往外越乱：转弯越来越急，远端打圈
function s1CordPts(x, y, a, Lmax, seed) { const pts = [[x, y]], step = 4; let px = x, py = y, h = a;
  for (let d = step; d <= Lmax; d += step) { const mess = Math.pow(d / Lmax, 1.5); h += noise1(d / 90, seed) * .05 + (noise1(d / 26, seed + 3) * .46 + Math.sin(d / 17 + seed) * .2) * mess + (a - h) * .015 * (1 - mess);
    px += Math.cos(h) * step; py += Math.sin(h) * step; pts.push([px, py]); } return pts; }
const S1DESKCORD = s1CordPts(960 - 118 * .72, 565 + 118 * .7, 2.35, 760, 13);
// s1Spatter：墨团周围溅出的小墨点
function s1Spatter(c, x, y, R, k, seed) { if (k <= 0) return; const r = rng(seed); for (let j = 0; j < 18; j++) { const a = r() * TAU, d = R * (1.25 + r() * 1.5) * (.6 + .4 * k), s = R * (.02 + r() * .07) * Math.min(1, k * 2);
  block(c, ellPts(x + Math.cos(a) * d, y + Math.sin(a) * d, s, s * (.7 + r() * .5), a, 12), K.ink, { amp: s * .15, seed: seed + j, grain: 0 }); } }

// ===================== 镜头 A：桌面 =====================
// s1DeskProps：桌上不动的道具。handoffDesk（7→1 的交接画面）也画这一组，改道具时两边一起变
function s1DeskProps(c) { s1Inkwell(c, 200, 880, 11); s1Ring(c, 1650, 860, 96, 21); s1Candy(c, 360, 250, -.35, 31); s1Slip(c, 1590, 250, .08, 41); }
function s1Desk(c, tau) { const t = twos(tau), [bx, by] = S1.blot, splat = 1.55;
  const push = 1.04 + .04 * sm(0, 4.2, tau), dive = sm(4.2, 5.2, tau, easeIn), zoom = push * Math.pow(14, dive);
  setView({ x: lerp(CX, bx, sm(3.6, 4.6, tau)), y: lerp(CY, by + 4, sm(3.6, 4.6, tau)), zoom }); paperBg(c); s1DeskProps(c);
  // 笔：0.2–0.8 从右上角进来，3.0 起抬走
  const inn = sm(.15, .85, t, easeOutQuint), out = sm(3, 3.8, t, easeIn), nib = [lerp(1500, 1000, inn) + out * 500, lerp(-300, 372, inn) - out * 700], a = -.95;
  // 墨滴：在笔尖长大，1.2 起下落，1.55 落到纸上
  const grow = sm(.8, 1.2, t), fall = sm(1.2, splat, t, easeIn);
  if (t < splat && grow > 0) { const dy = fall * (by - nib[1] - 8), sy = 1 + fall * 1.2; fillPts(c, ellPts(lerp(nib[0], bx, fall), nib[1] + 8 + dy, 9 * grow, 9 * grow * sy, 0, 18), K.ink); }
  // 墨团：炸开 → 平静下来，长出管线
  if (t >= splat) { const u = t - splat, R = 118 * easeOutExpo(clamp(u / .35, 0, 1)) + 8 * sm(.4, 1.4, u), wild = sm(0, .12, u) * (1 - sm(.45, 1.5, u));
    s1Spatter(c, bx, by, 118, sm(0, .25, u, easeOutQuint), 71);
    stroke(c, S1DESKCORD, { w: 9, p: sm(2.5, 4.4, t, easeInOutSine), seed: 17 + tick(t, 8), taper: .08, smooth: false, rough: .25 });
    s1Blot(c, bx, by, R, { wild, seed: 5, t });
    const fade = 1 - sm(4.55, 4.95, tau), er = R * .52; c.save(); c.globalAlpha *= fade;
    eyeLines(c, bx, by, er, { lid: sm(2.75, 3.5, t), open: 0, seed: 81 + tick(t, 8), w: Math.max(5, er * .14) }); c.restore(); }
  s1Pen(c, nib[0], nib[1], a, 91 + tick(t, 8));
  caption(c, '姐姐，爱是什么？', tau, .35, { t1: 4.6 }); }

// ===================== 镜头 B：书架走廊 =====================
// 世界坐标：x 横向（两侧墙在 ±S1.wall），y 竖直（地板 y=1，向下为正，y=0 是视平线），z 纵深（镜头在 s1Cam(tau)）。
// 书架格 bay 占 z∈[bay, bay+1]，立柱立在整数 z 处；立柱和搁板从墙面伸出 S1SH.d；每本书的书脊离墙 b.out（0–0.1）。
const S1SH = { d: .12, bt: .04, ut: .05 };   // 书架伸出墙面多深、搁板厚、立柱厚（世界单位）
const S1BOOKS = new Map();
// s1Books：一格书架一层上的书（按 z 从近到远）。空档里有时斜靠着一本（lean，dz 是书顶往远处歪出去的距离）
function s1Books(bay, side, row) { const key = `${bay}|${side}|${row}`; if (S1BOOKS.has(key)) return S1BOOKS.get(key);
  const r = rng(bay * 131 + side * 17 + row * 7 + 3), out = []; let z = bay + .04;
  while (z < bay + .96) { const th = .03 + r() * .05;
    if (r() < .2) { const gap = th * (1 + r() * 2), lt = .025 + r() * .025, lh = .45 + r() * .4, dz = Math.min(gap - lt - .012, lh * .37 * .42), lean = r() < .55;
      if (lean && dz > .02 && z + gap < bay + .96) out.push({ z0: z + .006, z1: z + .006 + lt, h: lh, dz, out: r() * .05, band: -1, cov: K.g3, j: .5, title: 0, ty: 0, lean: true });
      z += gap; continue; }
    const band = r() < .5 ? .12 + r() * .55 : -1;
    out.push({ z0: z, z1: Math.min(bay + .96, z + th * .82), h: .42 + r() * .45, dz: 0, out: r() * .1, band, cov: r() < .55 ? K.g2 : K.g3, j: r(), title: r() < .5 ? 1 : 2, ty: band > .4 ? .18 + r() * .1 : .64 + r() * .12, lean: false });
    z += th; }
  S1BOOKS.set(key, out); return out; }
const s1RowY = row => { const top = -1.46 + row * .41; return [top, top + .37]; };
const s1Cam = tau => (tau - S1.B) * S1.speed;
const s1P = (x, y, zr) => [S1.vp[0] + x * S1.F / zr, S1.vp[1] + y * S1.F / zr];
// 被吸走的书：书对象 → 起飞时刻。起飞后书架上那个位置就空了
const S1TAKE = new Map();
const s1Taken = (bay, side, row, b, t) => { const te = S1TAKE.get(b); return te !== undefined && t >= te; };
// s1BookQuad：书脊那一面在屏上的四个角（下近、上近、上远、下远）
function s1BookQuad(side, row, b, cz) { const [top, bot] = s1RowY(row), yt = bot - b.h * (bot - top), x = side * (S1.wall - b.out), z0 = b.z0 - cz, z1 = b.z1 - cz; if (z0 < .32) return null;
  return [s1P(x, bot, z0), s1P(x, yt, z0), s1P(x, yt, z1), s1P(x, bot, z1)]; }
// s1ShelfBook：书架上的一本书，长方体：朝镜头的书封（灰色窄条，伸出越多越宽）、视平线以下露出书顶、白色书脊（横带 + 一两道短横线当书名）
function s1ShelfBook(c, side, row, b, cz) { const z0 = b.z0 - cz, z1 = b.z1 - cz; if (z0 < .32) return;
  const [top, bot] = s1RowY(row), hh = b.h * (bot - top), yt = bot - Math.sqrt(hh * hh - b.dz * b.dz), xs = side * (S1.wall - b.out), xw = side * S1.wall, jx = (b.j - .5) * 1.5;
  const A = s1P(xs, bot, z0), B = s1P(xs, yt, z0 + b.dz), C = s1P(xs, yt, z1 + b.dz), D = s1P(xs, bot, z1); B[0] += jx; C[0] += jx;
  if (b.out > .003) { fillPts(c, [s1P(xw, bot, z0), s1P(xw, yt, z0 + b.dz), B, A], b.cov); if (yt > .01) fillPts(c, [B, s1P(xw, yt, z0 + b.dz), s1P(xw, yt, z1 + b.dz), C], K.g1); }
  fillPts(c, [A, B, C, D], K.paper); if (A[1] - B[1] < 12) return;
  const at = (uz, v) => { const p = [lerp(A[0], D[0], uz), lerp(A[1], D[1], uz)], q = [lerp(B[0], C[0], uz), lerp(B[1], C[1], uz)]; return [lerp(p[0], q[0], v), lerp(p[1], q[1], v)]; };
  if (b.band > 0) fillPts(c, [at(0, b.band), at(1, b.band), at(1, b.band + .08), at(0, b.band + .08)], K.ink);
  if (Math.abs(D[0] - A[0]) > 7) for (let k = 0; k < b.title; k++) { const v = b.ty + k * .07; fillPts(c, [at(.26, v), at(.74, v), at(.74, v + .024), at(.26, v + .024)], K.ink); } }
// s1Bay：一格书架（一侧）：搁板的顶面或底面 → 书（从远到近）→ 搁板前沿 → 近端立柱（朝镜头的端面 + 前沿）
function s1Bay(c, bay, side, cz, t) { const zA = bay - cz, zB = zA + 1; if (zB <= .34) return;
  const xw = side * S1.wall, xf = side * (S1.wall - S1SH.d), za = Math.max(zA, .32), ytop = s1RowY(0)[0] - S1SH.bt, boards = [];
  for (let r = -1; r < 6; r++) { const y0 = r < 0 ? ytop : s1RowY(r)[1]; boards.push([y0, y0 + S1SH.bt]); }
  for (const [y0, y1] of boards) { const yf = y0 > 0 ? y0 : y1; fillPts(c, [s1P(xw, yf, za), s1P(xf, yf, za), s1P(xf, yf, zB), s1P(xw, yf, zB)], K.g3); }
  for (let row = 0; row < 6; row++) { const bs = s1Books(bay, side, row); for (let k = bs.length - 1; k >= 0; k--) if (!s1Taken(bay, side, row, bs[k], t)) s1ShelfBook(c, side, row, bs[k], cz); }
  for (const [y0, y1] of boards) fillPts(c, [s1P(xf, y0, za), s1P(xf, y0, zB), s1P(xf, y1, zB), s1P(xf, y1, za)], K.g1);
  const zn = zA - S1SH.ut / 2, zb = zA + S1SH.ut / 2; if (zn < .32) return;
  fillPts(c, [s1P(xw, ytop, zn), s1P(xf, ytop, zn), s1P(xf, 1, zn), s1P(xw, 1, zn)], K.g3);
  fillPts(c, [s1P(xf, ytop, zn), s1P(xf, ytop, zb), s1P(xf, 1, zb), s1P(xf, 1, zn)], K.g1); }

// ---- 飞书：约 36 本陆续起飞，起飞间隔从 0.35 秒缩到 0.06 秒；9.4 起左右各有一整排被一本接一本扯出来 ----
// s1Launch：第 u（0..1）本的起飞进度。F'(0) : F'(1) = 0.35 : 0.06，F(1) = 1
const s1Launch = u => .4773 * u + .5227 * (1 - Math.pow(1 - u, 4.414));
function s1MakeFly(te, dur, side, row, bay, b, k, pull) { S1TAKE.set(b, te); const r = rng(k * 37 + 11), cz = s1Cam(te), [top, bot] = s1RowY(row), q = s1BookQuad(side, row, b, cz), sc = S1.F / ((b.z0 + b.z1) / 2 - cz), h = b.h * (bot - top) * sc;
  return { te, dur, ta: te + dur, side, row, bay, b, pull, wt: pull ? .5 : 1, p0: [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], h, w: h * .7, th: Math.max((b.z1 - b.z0) * sc, h * .12), cov: b.cov, band: b.band > 0 ? 1 - b.band - .08 : .22,
    spin: pull ? Math.PI * (.95 + (r() - .5) * .2) : TAU * (.35 + r() * .5),                   // 绕眼睛转多少（弧度，最多不到一圈，顺时针）
    flip: (r() < .5 ? -1 : 1) * Math.PI * (pull ? 2 : 1.2 + r() * 1.6), rot: (r() - .5) * (pull ? 1.2 : 4),   // 翻面、平面内的翻滚
    trails: r() < .5 ? 2 : 3, seed: 700 + k * 13 }; }
const S1FLY = (() => { const out = [], used = new Set(); let k = 0;
  for (const [side, row, t0, n] of S1.pull) { const bay0 = Math.floor(s1Cam(t0) + 1.5), run = [];
    for (let bay = bay0; run.length < n && bay < bay0 + 3; bay++) for (const b of s1Books(bay, side, row)) if (!b.lean && b.z0 - s1Cam(t0) > 1.2 && run.length < n) run.push([bay, b]);
    run.forEach(([bay, b], j) => { used.add(b); out.push(s1MakeFly(t0 + j * .03, .65, side, row, bay, b, k++, true)); }); }
  const [f0, f1, n, dur] = S1.fly;
  for (let j = 0; j < n; j++) { const te = f0 + (f1 - f0) * s1Launch(j / (n - 1)), r = rng(j * 7 + 5), side = (j % 2 ? 1 : -1) * (r() < .15 ? -1 : 1), cz = s1Cam(te);
    for (let tries = 0; tries < 16; tries++) { const row = 1 + Math.floor(r() * 5), bay = Math.floor(cz + 1.5 + r() * 1.4), bs = s1Books(bay, side, row).filter(b => !b.lean && !used.has(b) && b.z0 - cz > 1.3);
      if (!bs.length) continue; const b = bs[Math.floor(r() * bs.length)]; used.add(b); out.push(s1MakeFly(te, dur, side, row, bay, b, k++, false)); break; } }
  return out; })();
// 眼睛的大小：胀满屏前 0.1 秒以内吞下的书（整排扯出来的每本算半本）让半径从 60 平滑长到 240
const S1ABS = S1FLY.filter(f => f.ta < S1.fill[0] - .1).sort((a, b) => a.ta - b.ta);
const S1N = S1ABS.reduce((a, f) => a + f.wt, 0);
const s1Rt = n => 60 + 180 * Math.pow(clamp(n / S1N, 0, 1), .85);
// 咕咚：书落进眼睛的那一拍压扁，下一拍弹大到 1.08，再回落（共 0.25 秒）；书来得太密时最多每 0.25 秒一次
const S1GULP = (() => { const out = []; let last = -9; for (const f of S1ABS) { const g = Math.ceil(f.ta * 12 - 1e-6) / 12; if (g - last > .24) { out.push(g); last = g; } } return out; })();
function s1Gulp(t) { let g = null; for (const x of S1GULP) { if (x > t + 1e-6) break; g = x; } if (g === null) return [1, 1]; const v = Math.round((t - g) * 12);
  return v === 0 ? [1.12, .82] : v === 1 ? [1.08, 1.08] : v === 2 ? [1.03, 1.03] : [1, 1]; }
function s1EyeR(t) { let R = 60, n = 0; for (const f of S1ABS) { if (t <= f.ta) break; R += (s1Rt(n + f.wt) - s1Rt(n)) * spring(t - f.ta, { freq: 3, damp: .9 }); n += f.wt; } return R; }
// s1Eye：眼睛此刻的样子。底边 by 贴着地板往前滑（868 → 930，加毛刺也不低于 y=1000），越大中心越往上
function s1Eye(t) { const R = s1EyeR(t), g = clamp((R - 60) / 180, 0, 1), by = lerp(868, 930, g) + Math.sin(t * 5) * 3; return { x: S1.eye[0] + Math.sin(t * 1.3) * 10, y: by - R * .95, by, R, g }; }
// s1FlyAt：飞行进度 u 时书在屏上的位置。绕眼睛顺时针的螺旋，半径逐渐收紧，越飞越快（纵向压成 0.72，免得绕出画面）
function s1FlyAt(f, u, eye) { const E0 = f.E0 || (f.E0 = s1Eye(twos(f.te))), e = Math.pow(u, 2.2), dx = f.p0[0] - E0.x, dy = (f.p0[1] - E0.y) / .72, r = Math.hypot(dx, dy) * Math.pow(1 - e, 1.15), a = Math.atan2(dy, dx) + f.spin * e;
  return [lerp(E0.x, eye.x, e) + Math.cos(a) * r, lerp(E0.y, eye.y, e) + Math.sin(a) * r * .72]; }
// s1FlyBook：一本飞着的书，长方体：封面、封底（灰）、白书脊（带横带）、书口书顶书根（K.g1 加细线表示书页）。
//   半途封面像翅膀一样张开到 60°，中间的书页扇开；翻滚 = 绕竖轴翻面 + 平面内旋转。k 缩放
function s1FlyBook(c, x, y, k, f, u, sd) { const hw = f.w / 2, hh = f.h / 2, ht = f.th / 2, pe = hw * .95, ph = hh * .96, L = pe + hw;
  const phi = Math.PI / 3 * clamp(sm(.22, .55, u) * (1 + .12 * Math.sin(u * 40 + f.seed)), 0, 1.12), psi = Math.PI / 2 + f.flip * u, tl = -.55 * sm(0, .3, u), rho = f.rot * u;
  const cp = Math.cos(psi), sp = Math.sin(psi), ct = Math.cos(tl), st = Math.sin(tl), cr = Math.cos(rho), sr = Math.sin(rho);
  const P = (px, py, pz) => { const x1 = px * cp + pz * sp, z1 = -px * sp + pz * cp, y2 = py * ct - z1 * st, z2 = py * st + z1 * ct; return [x + k * (x1 * cr - y2 * sr), y + k * (x1 * sr + y2 * cr), z2]; };
  const faces = [], face = (col, kind, pts) => { const q = pts.map(p => P(p[0], p[1], p[2])); faces.push({ col, kind, q, z: q.reduce((a, p) => a + p[2], 0) / q.length }); };
  face(f.cov, 'cover', [[-hw, -hh, -ht], [hw, -hh, -ht], [hw, hh, -ht], [-hw, hh, -ht]]);           // 封底
  face(K.paper, 'spine', [[-hw, -hh, -ht], [-hw, -hh, ht], [-hw, hh, ht], [-hw, hh, -ht]]);        // 书脊
  face(K.g1, 'pages', [[pe, -ph, -ht], [pe, -ph, ht], [pe, ph, ht], [pe, ph, -ht]]);                // 书口
  face(K.g1, 'pages', [[-hw, -ph, -ht], [-hw, -ph, ht], [pe, -ph, ht], [pe, -ph, -ht]]);            // 书顶
  face(K.g1, 'pages', [[-hw, ph, -ht], [-hw, ph, ht], [pe, ph, ht], [pe, ph, -ht]]);                // 书根
  for (let j = 0; j < 4; j++) { const a = phi * j / 4, zc = ht * .92, lx = -hw + L * Math.cos(a), lz = zc + L * Math.sin(a); face(K.paper, 'leaf', [[-hw, -ph, zc], [lx, -ph, lz], [lx, ph, lz], [-hw, ph, zc]]); }   // 扇开的书页
  const ex = -hw + 2 * hw * Math.cos(phi), ez = ht + 2 * hw * Math.sin(phi); face(f.cov, 'cover', [[-hw, -hh, ht], [ex, -hh, ez], [ex, hh, ez], [-hw, hh, ht]]);   // 封面
  faces.sort((a, b) => a.z - b.z); const big = k * f.h > 34, lw = Math.max(1.6, k * 2.8);
  for (const F of faces) { const q = F.q.map(p => [p[0], p[1]]); fillPts(c, q, F.col);
    if (big && F.kind === 'spine') { const v = f.band; fillPts(c, [s1L2(q[0], q[3], v), s1L2(q[1], q[2], v), s1L2(q[1], q[2], v + .1), s1L2(q[0], q[3], v + .1)], K.ink); }
    if (big && F.kind === 'pages') for (const s of [.28, .52, .76]) stroke(c, [s1L2(q[0], q[1], s), s1L2(q[3], q[2], s)], { w: Math.max(1.4, k * 1.8), color: K.g2, seed: sd + s * 10, smooth: false, taper: .15 });
    if (big) outline(c, q, { w: lw, color: K.ink, seed: sd + 3, smooth: false, rough: .15 });
    else { c.save(); c.strokeStyle = K.ink; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(polyPath(q)); c.restore(); } } }
const s1L2 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
// 走廊地板的轮廓（本帧）。白色刮痕落在白地板上看不见，那一段改用墨色
let S1FLOOR = null;
function s1Streak(c, pts, o = {}) { scratch(c, pts, o); if (!S1FLOOR) return; c.save(); c.clip(S1FLOOR); stroke(c, pts, { dry: .18, taper: .45, ...o, color: K.ink }); c.restore(); }
// s1DrawFlyer：飞书 + 身后 2–3 道指向眼睛的短刮痕（运动方向和朝眼睛方向的中间）
function s1DrawFlyer(c, f, u, P, eye, t) { const k = lerp(1, .25, Math.pow(u, 2.2)), sd = f.seed + tick(t, 8);
  if (u > .04) { const Q = s1FlyAt(f, Math.max(0, u - .06), eye), vx = P[0] - Q[0], vy = P[1] - Q[1], vl = Math.hypot(vx, vy), rx = eye.x - P[0], ry = eye.y - P[1], rl = Math.hypot(rx, ry) || 1;
    if (vl > 2) { let dx = vx / vl + rx / rl, dy = vy / vl + ry / rl; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl; const sz = f.h * k, Lt = clamp(vl * 2.2, 18, 150);
      for (let j = 0; j < f.trails; j++) { const o = (j - (f.trails - 1) / 2) * sz * .38, b0 = sz * (.55 + .3 * hash(j, f.seed));
        s1Streak(c, [[P[0] - dx * (b0 + Lt) - dy * o, P[1] - dy * (b0 + Lt) + dx * o], [P[0] - dx * b0 - dy * o, P[1] - dy * b0 + dx * o]], { w: 4.5, seed: sd + j, al: .8, taper: .5 }); } } }
  s1FlyBook(c, P[0], P[1], k, f, u, sd); }
// s1Swirl：黑洞的吸力。6–10 道刮痕弧线绕着墨团顺时针往里旋，一直在转；眼睛越大，道数越多、弧越长
function s1Swirl(c, eye, t, al) { if (al <= 0) return; const n = Math.round(lerp(6, 10, eye.g)), rot = t * 1.3;
  for (let k = 0; k < n; k++) { const a0 = k / n * TAU + rot + hash(k, 61) * .6, r1 = eye.R * (1.3 + .6 * hash(k, 62)) + 30, span = lerp(.6, 1.25, eye.g) * (.7 + .6 * hash(k, 63)), pts = [];
    for (let s = 0; s <= 1.001; s += .08) { const a = a0 + span * s, rr = r1 * (1 - .4 * s); pts.push([eye.x + Math.cos(a) * rr, eye.y + Math.sin(a) * rr * .8]); }
    s1Streak(c, pts, { w: Math.max(5, eye.R * .03), seed: 500 + k * 3 + tick(t, 8), taper: .6, dry: .22, al: .8 * al }); } }
// s1FloorCord：走廊里拖在觉之瞳身后的那根线，贴着地板。靠近眼睛的一段是直的，越往后（越靠近镜头）越乱，
// 线在世界里是固定的，镜头往前走时它往后退；近处线粗，远处线细。
function s1FloorCord(c, tau, eye) { const cz = s1Cam(tau), zrE = S1.F / (eye.by - S1.vp[1]), zE = cz + zrE, R = eye.R, pts = [[eye.x - R * .62, eye.y + R * .55]];
  for (let d = .04; d <= 1.6; d += .004) { const sig = zE - d, A = .34 * Math.pow(clamp(d / 1.25, 0, 1), 1.4), tb = S1.B + (sig - zrE) / S1.speed, x0 = (Math.sin(tb * 1.3) * 10 - R * .62) * zrE / S1.F;
    const x = x0 + A * (noise1(sig * 6, 21) + .8 * noise1(sig * 13, 22)), z = sig + A * .9 * (noise1(sig * 6 + 40, 23) + .8 * noise1(sig * 13 + 40, 24)), zr = z - cz;
    if (zr < .3) break; pts.push(s1P(x, 1, zr)); }
  if (pts.length > 2) stroke(c, pts, { w: 9, seed: 19 + tick(tau, 8), taper: .04, smooth: true, rough: .2, wfn: f => 1 + f * 1.6 }); }
function s1Corridor(c, tau) { const t = twos(tau), cz = s1Cam(tau); setView(null); inkBg(c);
  // 地板：暖白纸，横向的地板缝跟着镜头往后退
  const zn = .3, zf = S1.zEnd - cz, fl = [s1P(-S1.wall, 1, zn), s1P(-S1.wall, 1, zf), s1P(S1.wall, 1, zf), s1P(S1.wall, 1, zn)];
  block(c, fl, K.paper, { smooth: false, amp: 1, seed: 3, grain: .9 });
  for (let z = Math.ceil(cz * 2) / 2; z < S1.zEnd; z += .5) { const zr = z - cz; if (zr < zn) continue; const [x0, y0] = s1P(-S1.wall, 1, zr), [x1] = s1P(S1.wall, 1, zr);
    stroke(c, [[x0, y0], [x1, y0]], { w: clamp(12 / zr, 1.5, 12), seed: Math.round(z * 2), smooth: false, dry: .3, al: .9 }); }
  // 尽头：一扇亮着的门，几道光
  const [dx0, dy0] = s1P(-.34, -.35, zf), [dx1, dy1] = s1P(.34, 1, zf);
  for (let k = 0; k < 13; k++) { const a = -Math.PI / 2 + (k - 6) * .2, L = 70 + hash(k, 3) * 90; scratch(c, [[CX + Math.cos(a) * 30, dy0 - 14 + Math.sin(a) * 30], [CX + Math.cos(a) * L, dy0 - 14 + Math.sin(a) * L]], { w: 3, al: .55, seed: k + tick(t, 6) }); }
  block(c, rectPts(dx0, dy0, dx1 - dx0, dy1 - dy0), K.paper, { smooth: false, amp: .8, seed: 9 });
  // 两侧书架：从远到近画
  for (let bay = Math.floor(cz) + 13; bay >= Math.floor(cz); bay--) { if (bay >= S1.zEnd) continue;
    for (const side of [-1, 1]) s1Bay(c, bay, side, cz, t);
    // 每隔两格一盏吊灯
    if (bay % 2 === 0) { const zr = bay + .5 - cz; if (zr > .6) { const [lx, ly] = s1P(0, -1.2, zr), s = S1.F / zr * .16;
      stroke(c, [[lx, ly - s * 3], [lx, ly]], { w: Math.max(2.5, s * .08), color: K.paper, seed: bay, smooth: false, al: .7 });
      block(c, [[lx - s * .45, ly], [lx + s * .45, ly], [lx + s, ly + s * .7], [lx - s, ly + s * .7]], K.paper, { smooth: false, amp: .6, seed: bay + 1, grain: 0 });
      for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k - 2) * .32; scratch(c, [[lx + Math.cos(a) * s * 1.1, ly + s * .7 + Math.sin(a) * s * .5], [lx + Math.cos(a) * s * 2.6, ly + s * .7 + Math.sin(a) * s * 1.8]], { w: Math.max(2, s * .06), al: .5, seed: bay * 7 + k }); } } } }
  // 眼睛：墨团贴着地板往前滑，身后拖一道墨迹；周围一圈往里旋的吸力；书绕着它飞进去，最后 10% 画在墨团后面
  S1FLOOR = polyPath(fl);
  const eye = s1Eye(t), fill = sm(S1.fill[0], S1.fill[1], tau, easeInOutSine), bx = lerp(eye.x, CX, fill), byy = lerp(eye.y, 600, fill), Rb = lerp(eye.R, 1300, fill);
  s1FloorCord(c, tau, eye);
  s1Swirl(c, eye, t, 1 - sm(S1.fill[0], S1.fill[0] + .3, tau));
  const front = [];
  for (const f of S1FLY) { const u = (t - f.te) / f.dur; if (u < 0 || u >= 1) continue; const P = s1FlyAt(f, u, eye);
    if (u >= .9 || fill > .8 || (fill > 0 && Math.hypot(P[0] - bx, P[1] - byy) < Rb * .9)) s1DrawFlyer(c, f, u, P, eye, t); else front.push([f, u, P]); }
  const [gx, gy] = s1Gulp(t), er = eye.R * .52;
  pop(c, eye.x, eye.by, gx, () => { s1Blot(c, bx, byy, Rb, { wild: .06 * eye.g, seed: 7, t });
    c.save(); c.globalAlpha *= 1 - sm(S1.fill[0], S1.fill[0] + .25, tau); eyeLines(c, bx, byy, er, { open: 0, seed: 83 + tick(t, 8), w: Math.max(5, er * .14) }); c.restore(); }, gy);
  for (const [f, u, P] of front) s1DrawFlyer(c, f, u, P, eye, t);
  S1FLOOR = null;
  caption(c, '不知道。', tau, 5.5, { t1: 10.5 }); }

// ===================== 镜头 C：藤蔓、心形与蔷薇 =====================
// s1Rose：白线蔷薇。open 0..1 开的程度，fill 填色（null 不填），al 整朵的透明度
function s1Rose(c, x, y, r, o = {}) { const { open = 1, fill = null, fillAl = 1, seed = 1, t = 0, w = 4.5, rot = 0, al = 1 } = o; if (open <= 0 || al <= 0) return; c.save(); c.globalAlpha *= al; const sd = seed + tick(t, 8), R = r * (.3 + .7 * easeOutBack(clamp(open, 0, 1)));
  if (fill && fillAl > 0) block(c, ellPts(x, y, R * 1.02, R * .96, rot, 30), fill, { amp: R * .06, seed: sd, al: fillAl, grain: .4 });
  [[3, .34, .5], [4, .64, .62], [5, .95, .7]].forEach(([n, rr, span], ring) => { for (let k = 0; k < n; k++) { const a0 = rot + k / n * TAU + ring * .7 + (1 - open) * 1.2, a1 = a0 + span * TAU / n * 1.25, pts = [];
    for (let s = 0; s <= 1.001; s += .125) { const a = lerp(a0, a1, s), bulge = rr * R * (1 + .12 * Math.sin(s * Math.PI)); pts.push([x + Math.cos(a) * bulge, y + Math.sin(a) * bulge * .92]); }
    pts.push([x + Math.cos(a1 - .25) * rr * R * .78, y + Math.sin(a1 - .25) * rr * R * .72]); scratch(c, pts, { w: w * (ring ? 1 : .85), p: clamp(open * 1.6 - ring * .25, 0, 1), seed: sd + ring * 10 + k, dry: .08 }); } });
  const sp = []; for (let s = 0; s <= 1.001; s += .05) { const a = rot + s * TAU * 1.5, d = s * R * .26; sp.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); } scratch(c, sp, { w: w * .8, p: open, seed: sd + 50, taper: .2 }); c.restore(); }
// 藤蔓：两根从底下缠着长上来，到心尖分开，各自沿心形的一侧长到心顶
const S1H = { x: 960, y: 478, s: 300 }, S1TIP = S1H.y + S1H.s * 17 / 16;
function s1Vine(side, n = 90) { const pts = []; for (let k = 0; k <= 40; k++) { const s = k / 40, y = lerp(H + 40, S1TIP, s), A = 70 * (1 - s) * (1 - s * .3); pts.push([S1H.x + side * A * Math.sin(s * 3.1 * Math.PI), y]); }
  for (let k = 1; k <= n; k++) { const a = Math.PI + side * -1 * (k / n) * Math.PI, u = Math.pow(Math.sin(a), 3), v = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16; pts.push([S1H.x + S1H.s * u, S1H.y + S1H.s * v]); }
  return pts; }
const S1VINES = [s1Vine(1), s1Vine(-1)];
// S1V0：镜头 C 第一帧藤已经长到哪（藤尖在 y≈990，画框里看得见），走廊胀满屏之后不留长黑
const S1V0 = (() => { for (let u = 0; u < .4; u += .002) if (pathAt(S1VINES[0], u).y < 990) return u; return .15; })();
const S1ROSES = [{ side: -1, u: .74, r: 84, at: 13.1 }, { side: 1, u: .7, r: 76, at: 13.35 }, { side: 1, u: .3, r: 56, at: 12.7 }, { side: -1, u: .18, r: 50, at: 12.4 }, { side: 1, u: .92, r: 60, at: 13.6 }];
function s1Vines(c, tau) { const t = twos(tau), sd = tick(t, 8); setView({ x: CX, y: CY - 20 * sm(S1.C, S1.D, tau), zoom: 1.02 + .05 * sm(S1.C, S1.D, tau) }); inkBg(c);
  const gx = sm(S1.C, 13.9, t, v => v), grow = S1V0 + (1 - S1V0) * lerp(gx, easeInOutSine(gx), .5);
  S1VINES.forEach((pts, j) => { scratch(c, pts, { w: 11, p: grow, seed: 100 + j * 9 + sd, dry: .05, taper: .12 });
    for (let k = 1; k < 26; k++) { const u = k / 26; if (u > grow - .02) break; const q = pathAt(pts, u), side = k % 2 ? 1 : -1, n = [Math.cos(q.a + side * Math.PI / 2), Math.sin(q.a + side * Math.PI / 2)];
      if (k % 4 === 1) { const lf = [q.x + n[0] * 38 + Math.cos(q.a) * 10, q.y + n[1] * 38 + Math.sin(q.a) * 10], m = [(q.x + lf[0]) / 2, (q.y + lf[1]) / 2], off = [Math.cos(q.a) * 13, Math.sin(q.a) * 13];
        scratch(c, [[q.x, q.y], [m[0] + off[0], m[1] + off[1]], lf], { w: 4.5, seed: sd + k * 3 + j }); scratch(c, [[q.x, q.y], [m[0] - off[0], m[1] - off[1]], lf], { w: 4.5, seed: sd + k * 3 + j + 1 }); scratch(c, [[q.x, q.y], lf], { w: 2.6, seed: sd + k * 5, al: .7 }); }
      else fillPts(c, [[q.x + n[0] * 5 - Math.cos(q.a) * 7, q.y + n[1] * 5 - Math.sin(q.a) * 7], [q.x + n[0] * 20, q.y + n[1] * 20], [q.x + n[0] * 5 + Math.cos(q.a) * 7, q.y + n[1] * 5 + Math.sin(q.a) * 7]], K.paper); } });
  // 蔷薇：沿藤蔓开，中间一朵最大，接住那滴暗红
  S1ROSES.forEach((ro, k) => { const q = pathAt(S1VINES[ro.side > 0 ? 0 : 1], ro.u); s1Rose(c, q.x, q.y, ro.r, { open: sm(ro.at, ro.at + .7, t), seed: 200 + k * 13, t, rot: k }); });
  const hit = 15.25, red = sm(hit, hit + .2, t), grey = sm(15.8, 16.5, t), fillCol = mix(K.rose, '#6a655e', grey);
  s1Rose(c, S1H.x, S1H.y + 100, 118, { open: sm(13.7, 14.6, t), fill: red > 0 ? fillCol : null, fillAl: red, seed: 300, t, w: 6.5 });
  if (t >= 14.85 && t < hit) { const u = sm(14.85, hit, t, easeIn), y = lerp(-30, S1H.y + 100, u); fillPts(c, ellPts(S1H.x, y, 11, 11 * (1 + u * 1.4), 0, 18), K.rose); }
  if (t >= hit && t < hit + .5) { const u = (t - hit) / .5; stroke(c, ellPts(S1H.x, S1H.y + 100, 120 + u * 110, (120 + u * 110) * .9, 0, 50), { close: true, w: 6 * (1 - u), color: K.rose, dry: .4, seed: 7 + tick(t, 12), al: 1 - u }); }
  caption(c, '那我们一起找！', tau, S1.C + .25, { t1: 16.1 }); }

// ===================== 镜头 D：售卖信息，然后封面从水墨晕回彩色 =====================
// 字先居中写出；19.9 起整块左移：蔷薇图标左沿到 x=150，标题字顶到末行字底的中点在 y=540；
// 右边墨迹晕开露出封面水墨版（右沿连描边在 x=1770），22.4 起颜色从封面上的觉之瞳慢慢晕开。
let S1MASK = null;
function s1Cover(c, tau, al = 1) { const { x, y, w, eye } = S1.cover, ph = PHOTOS.sanyanInk, h = w * ph.h / ph.w, x0 = x - w / 2, y0 = y - h / 2, t = twos(tau);
  const reveal = sm(20.35, 21.3, t, easeOut); if (reveal <= 0) return; c.save(); c.globalAlpha *= al;
  const R = reveal * Math.hypot(w, h) * .62, clip = polyPath(rough(ellPts(x, y, R, R * 1.05, .3, 64), { amp: 6 + 30 * (1 - reveal), freq: 16, spike: .08 * (1 - reveal), spikeLen: 40, seed: 5 + tick(t, 8) }));
  c.save(); c.clip(clip); c.drawImage(ph.img, x0, y0, w, h);
  // 颜色：彩色版画进一张离屏画布，用径向渐变从觉之瞳往外擦出来（边缘是软的）
  const col = sm(22.4, 24.3, tau, easeInOutSine); if (col > 0) { const pw = Math.round(w * S), phh = Math.round(h * S); if (!S1MASK || S1MASK.width !== pw) { S1MASK = document.createElement('canvas'); S1MASK.width = pw; S1MASK.height = phh; }
    const g = S1MASK.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, pw, phh); g.drawImage(PHOTOS.sanyanColor.img, 0, 0, pw, phh);
    const ex = eye[0] * pw, ey = eye[1] * phh, Rm = col * Math.hypot(pw, phh) * 1.05, feather = pw * .35, gr = g.createRadialGradient(ex, ey, Math.max(0, Rm - feather), ex, ey, Rm + 1);
    gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, pw, phh); c.drawImage(S1MASK, x0, y0, w, h); }
  // 外圈描边：离图 10，线宽 5，外沿 = 图右沿 + 12.5 = 1770
  c.restore(); outline(c, rectPts(x0 - 10, y0 - 10, w + 20, h + 20), { w: 5, color: K.paper, al: .8 * reveal, seed: 9 + tick(t, 6), smooth: false, dry: .2 }); c.restore(); }
function s1Sale(c, tau, fade = 1) { const t = twos(tau); setView(null); inkBg(c); c.save(); c.globalAlpha *= fade;
  const move = sm(19.9, 20.75, tau, easeInOutQuint), sizes = [132, 58, 58], lines = ['三眼的幻恋', ...S1.sale], ws = lines.map((l, k) => zhWidth(c, l, sizes[k], ZH, k ? 400 : 500));
  // 左移后的位置：三行左对齐在 left；蔷薇图标中心在标题左 90、半径约 50，所以图标左沿 = left − 140 = S1.saleL。
  // 竖直：标题字顶约在基线上 0.86 字号，末行字底约在基线下 0.1 字号，两者中点放在 y=540
  const left = S1.saleL + 140, gaps = [0, 170, 262], yT = 540 - (-.86 * sizes[0] + gaps[2] + .1 * sizes[2]) / 2, ys = [[430, yT], [600, yT + gaps[1]], [690, yT + gaps[2]]];
  lines.forEach((l, k) => { const x = lerp(CX - ws[k] / 2, left, move), y = lerp(ys[k][0], ys[k][1], move), p = k ? writeP(t, 17.55 + (k - 1) * .55, l, .03) : writeP(t, 16.75, l, .16);
    zh(c, l, x, y, { size: sizes[k], weight: k ? 400 : 500, color: K.paper, p, seed: 7 + k, tilt: k ? .015 : .02, jitter: .015 });
    if (k === 0) s1Rose(c, x - 90, y - 48, 44, { open: 1, fill: '#6a655e', fillAl: 1, seed: 300, t, w: 4.5, al: p });
    if (k === 2) { const u0 = x + zhWidth(c, '在现场', 58), u1 = u0 + zhWidth(c, 'cos恋恋签售', 58); stroke(c, [[u0, y + 22], [lerp(u0, u1, .5), y + 28], [u1, y + 21]], { w: 8, color: K.rose, p: sm(18.75, 19.25, t), seed: 31 + tick(t, 8), dry: .15 }); } });
  s1Cover(c, tau); c.restore(); }

// ===================== 镜头 E：一条紧闭的眼皮线拉成隙间，裂开 =====================
function s1Bow(c, x, y, s, dir, seed) { const T = tf(x, y, s, 0, dir);
  for (const v of [-1, 1]) outline(c, M(T, [[0, 0], [.9, v * .75], [1.25, v * .35], [1.1, v * .05]]), { w: 5, color: K.paper, seed: seed + v, rough: .3 });
  scratch(c, M(T, [[0, 0], [.55, .5], [.7, 1.25]]), { w: 5, seed: seed + 3 }); scratch(c, M(T, [[0, 0], [.2, .6], [.1, 1.35]]), { w: 5, seed: seed + 4 });
  fillPts(c, M(T, ellPts(0, 0, .16, .16, 0, 12)), K.paper); }
function s1Gap(c, tau) { const t = twos(tau), E = S1.E, dark = sm(E, E + .35, tau), lid = sm(E + .15, E + .55, t), u = sm(E + .55, E + .95, tau, easeInOutSine), open = sm(E + .95, S1.END - .04, tau, easeIn), sd = tick(t, 8);
  s1Sale(c, tau, 1 - dark); const cy = CY, r0 = 90, half = lerp(r0, 760, u) + open * 1900, h = open * 1700;
  const dep = r0 * .2 * lerp(1, .35, u) * (1 - open), lift = r0 * .14 * (1 - u), xs = Array.from({ length: 41 }, (_, k) => -1 + k / 20), curve = sgn => xs.map(v => [CX + v * half, cy - lift + (sgn * h + dep) * (1 - v * v)]);
  if (open > 0) { const lens = [...curve(-1), ...curve(1).reverse()]; fillPts(c, lens, S1.sukima); c.save(); c.clip(polyPath(lens)); texture(c, null, 'paper', .35); c.restore(); }
  if (u <= 0) eyeLines(c, CX, cy, r0, { lid, open: 0, seed: 83 + sd, w: Math.max(5, r0 * .14) });
  else { scratch(c, curve(-1), { w: lerp(19, 12, u), seed: 400 + sd, taper: .15 }); if (open > 0) scratch(c, curve(1), { w: 12, seed: 410 + sd, taper: .15 });
    if (u < .5) for (let k = 0; k < 5; k++) { const v = -.62 + k * .31, b = [CX + v * half, cy - lift + dep * (1 - v * v)]; stroke(c, [b, [b[0] + v * r0 * .3, b[1] + r0 * .24]], { w: 9, color: alpha(K.paper, 1 - u * 2), seed: 90 + k + sd, taper: .6, smooth: false }); } }
  const bow = sm(.55, 1, u, easeOutBack) * (1 - open); if (bow > .01) { s1Bow(c, CX - half, cy - lift, 46 * bow, -1, 420 + sd); s1Bow(c, CX + half, cy - lift, 46 * bow, 1, 430 + sd); } }

scene({ order: 1, key: 'sanyan', name: '三眼的幻恋', dur: S1.END, fn: (c, tau) => {
  if (tau < .1) handoffDesk(c);
  else if (tau < S1.B) s1Desk(c, tau);
  else if (tau < S1.C) s1Corridor(c, tau);
  else if (tau < S1.D) s1Vines(c, tau);
  else if (tau < S1.D + 1 / 12) { setView(null); inkBg(c); }
  else if (tau < S1.E) s1Sale(c, tau);
  else if (tau < S1.END - .1) s1Gap(c, tau);
  else handoffSukima(c);
} });
