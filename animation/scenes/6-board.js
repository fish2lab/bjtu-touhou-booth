'use strict';
// 第 6 段 东方二创红黑榜（11.6 秒）。黑白木刻的表格，小红点 K.dot 是唯一的颜色；实体表照片是唯一的例外。
// 漫展上常见的红黑榜：现场有一张实体表，来的人用小红点、小黑点贴纸给十二部二创作品表态。片子拍一张被贴满点的表。
//   0      只画第 5 段交过来的 handoffDot（暖白纸正中一个黑点）
//   0.2    一只手伸进来按了它一下：压扁、回弹、亮出纸面高光，原来是一张黑点贴纸
//   0.8    镜头拉远，表格线从贴纸处刻出去，表头盖下来，图例和十二个作品名写出来
//   1.9    四面八方伸进来的手啪啪地贴点，越贴越快；东方夜雀食堂堆成红点山，恋恋的心跳大冒险红黑打架
//   6.08   最后一下：打架那格红手黑手同时拍下，两张点撞在一起
//   6.3    停住；一只手踮着脚进来，在红点山顶贴上一个小黑点
//   7.2    画的表缩到左上，右边拍下实体表照片，左下写两句号召；字写完后又有两只手从左边进来，给小表添两个红点
//   11.2   一张巨大的黑点贴纸扑满画面，最后 0.17 秒只画 handoffBlack，交给第 7 段
// 排法：左列作品名靠右、右列靠左，贴点的空白留在两侧外边。手从左右和上下伸进来，挡不住中间的字。
// 屏上文字全部抄自 docs/素材事实.md「东方二创红黑榜」一节。哪格堆山、哪格打架只在 S6.PLAN 里改。

const S6 = {
  END: 11.6,
  T: {
    dot: .2, press: .52,                  // 只画交接黑点、手按下开场那张贴纸
    pull0: .8, pull1: 1.75,               // 镜头拉远，表格线刻出来
    head: 1.25, legend: 1.5,              // 表头盖下、图例写出
    stick0: 1.9, stick1: 5.9, clash: 6.08, // 贴点：越贴越快，5.9 以后只剩打架那格的最后一下
    sneak0: 6.3, sneak: 6.8,              // 最后一只手踮着脚进来，6.8 按下
    move0: 7.2, move1: 7.55, photo: 7.4,  // 表缩到左上，实体表照片拍下
    line1: 7.55, line2: 7.9,              // 两句号召
    late: [9.3, 10.25],                   // 号召写完后，两只手给缩小的表添红点（只从左边来，不挡照片和字）
    black0: 11.2, black1: 11.42, out: 11.43,   // 巨大黑点扑满画面，之后只画 handoffBlack
  },
  R: 15,                                                   // 贴纸半径
  G: { x0: 110, xm: 960, x1: 1810, y0: 236, y1: 1042 },   // 表格外框和中线
  NAME: 44, INSET: 34, DOTW: 316,                          // 作品名字号、名字离中线的距离、贴点空白的宽
  TITLE: '东方二创红黑榜', CAP: '二创红黑榜',
  LEGEND: ['红色：这种二创再来点！！', '黑色：创死我了！！'],
  NAMES: [['Bad Apple!', '东方光耀夜', '东方幕华祭', '幻想万华镜', '秘封活动记录', '恋恋的心跳大冒险'],
    ['色は匂へど散りぬるを', '东方夜雀食堂', '东方冰之勇者记', '混响男孩', '失而复得', '琪露诺的完美算术教室']],
  LINES: ['用小红点和小黑点填表', '请和大家分享你对作品的喜欢吧！'],
  // 每格贴多少：red/black 散贴；heap 一行行往上堆的红点山（从底行起每行几个）；fight 红黑各几张，从两边挤到中间
  PLAN: [
    { red: 12, black: 1 },                       // Bad Apple!
    { red: 5, black: 2 },                        // 东方光耀夜
    { red: 4, black: 2 },                        // 东方幕华祭（另有开场那张黑点）
    { red: 6, black: 1 },                        // 幻想万华镜
    { red: 5, black: 1 },                        // 秘封活动记录
    { fight: 9 },                                // 恋恋的心跳大冒险：红黑打架
    { red: 7, black: 0 },                        // 色は匂へど散りぬるを（全红：山顶那张偷贴的黑点才显眼）
    { heap: [11, 10, 9, 8, 7, 5, 4, 2, 1] },     // 东方夜雀食堂：红点山，山顶冒出格子
    { red: 4, black: 2 },                        // 东方冰之勇者记
    { red: 5, black: 5 },                        // 混响男孩：红黑各半
    { red: 5, black: 1 },                        // 失而复得
    { heap: [7, 6, 4, 3, 1] },                   // 琪露诺的完美算术教室：小一点的红点山
  ],
  P0: [298, 571],                                          // 开场那张黑点贴纸，在东方幕华祭的空白里
  FIN: { zoom: .5, at: [590, 330], photo: { x: 1194, y: 90, h: 900 }, text: [120, 770, 872] },   // 收尾：表缩放和位置、照片、两句字
};
S6.RH = (S6.G.y1 - S6.G.y0) / 6;
S6.Z0 = DOT_R / S6.R;   // 开场镜头的放大倍数：贴纸在屏上正好是交接黑点那么大

// ===================== 布局与贴点数据 =====================
// s6Cell：第 col 列第 row 行的格子。nx, ny 作品名的位置；dot 贴点的空白（在两侧外边）
function s6Cell(col, row) { const g = S6.G, x = col ? g.xm : g.x0, y = g.y0 + row * S6.RH;
  return { x, y, nx: col ? x + S6.INSET : g.xm - S6.INSET, ny: y + S6.RH / 2 + S6.NAME * .36, align: col ? 'left' : 'right',
    dot: { x0: col ? g.x1 - 30 - S6.DOTW : g.x0 + 30, x1: col ? g.x1 - 30 : g.x0 + 30 + S6.DOTW, y0: y, y1: y + S6.RH } }; }
// s6Times：n 张贴纸的时刻，从 t0 到 t1 越贴越快（速率按指数涨，开头每秒 r0 张）
function s6Times(n, t0, t1, r0 = 2.4) { const span = t1 - t0, count = q => r0 / q * (Math.exp(q * span) - 1); let lo = 1e-3, hi = 6;
  for (let k = 0; k < 60; k++) { const mid = (lo + hi) / 2; if (count(mid) > n) hi = mid; else lo = mid; } const q = (lo + hi) / 2;
  return Array.from({ length: n }, (_, k) => t0 + Math.log(1 + (k + .5) * q / r0) / q); }
// S6DOTS：所有贴纸，按贴下的时刻排好。每张带着贴它的那只手：从哪边伸进来（ang 是手指的朝向）、大小、袖子样式、快慢
const S6DOTS = (() => {
  const R = S6.R, T6 = S6.T, PI = Math.PI, all = [];
  const near = (x, y, gap, pool) => pool.every(o => Math.hypot(o.x - x, o.y - y) >= gap);
  const pick = (rr, box, ok) => { let x = 0, y = 0; for (let k = 0; k < 400; k++) { x = lerp(box[0], box[1], rr()); y = lerp(box[2], box[3], rr()); if (ok(x, y)) break; } return [x, y]; };
  const shuffle = (arr, rr) => { for (let k = arr.length - 1; k > 0; k--) { const j = Math.floor(rr() * (k + 1)); [arr[k], arr[j]] = [arr[j], arr[k]]; } return arr; };
  // 先放开场的黑点和两座红点山，散贴的点再绕开它们
  for (const idx of [2, 7, 11, 0, 1, 3, 4, 5, 6, 8, 9, 10]) {
    const col = idx < 6 ? 0 : 1, row = idx % 6, pl = S6.PLAN[idx], a = s6Cell(col, row).dot, rr = rng(600 + idx * 37), mine = [];
    const box = [a.x0 + R + 4, a.x1 - R - 4, a.y0 + R + 12, a.y1 - R - 12];
    if (pl.heap) { const base = a.y1 - R - 6, cx = (a.x0 + a.x1) / 2, step = R * 1.82, rise = R * 1.5;
      pl.heap.forEach((n, j) => shuffle([...Array(n).keys()], rr).forEach(k => mine.push({ x: cx + (k - (n - 1) / 2) * step + (rr() - .5) * 6, y: base - j * rise + (rr() - .5) * 5, c: 'r' }))); }
    else if (pl.fight) { const mid = (a.x0 + a.x1) / 2;
      for (let k = 0; k < pl.fight; k++) for (const cc of ['r', 'b']) { const bx = cc === 'r' ? [box[0], mid + 24] : [mid - 24, box[1]], same = mine.filter(o => o.c === cc);
        const [x, y] = pick(rr, [bx[0], bx[1], box[2], box[3]], (x, y) => near(x, y, R * 2 + 2, same) && near(x, y, R * .9, mine)); mine.push({ x, y, c: cc }); }
      const cy = (a.y0 + a.y1) / 2; mine.push({ x: mid - R * .55, y: cy, c: 'r', clash: true }, { x: mid + R * .55, y: cy + 3, c: 'b', clash: true }); }
    else { if (idx === 2) mine.push({ x: S6.P0[0], y: S6.P0[1], c: 'b', pre: true });
      shuffle([...Array(pl.red).fill('r'), ...Array(pl.black).fill('b')], rr).forEach(cc => { const [x, y] = pick(rr, box, (x, y) => near(x, y, R * 2 + 3, all.concat(mine))); mine.push({ x, y, c: cc }); }); }
    // 排队的先后：f 0..1。红点山往后压一点，大半在最快的那一阵里长出来
    const queue = mine.filter(o => !o.pre && !o.clash); queue.forEach((o, k) => { o.f = Math.pow(clamp((k + .5 + (rr() - .5) * .6) / queue.length, 0, 1), pl.heap ? .8 : 1); });
    mine.forEach(o => { o.cell = idx; o.col = col; o.row = row; o.fight = !!pl.fight; all.push(o); });
  }
  const queue = all.filter(o => !o.pre && !o.clash).sort((p, q) => p.f - q.f), times = s6Times(queue.length, T6.stick0, T6.stick1);
  queue.forEach((o, k) => { o.ts = times[k]; });
  all.forEach(o => { if (o.clash) o.ts = T6.clash; }); all.find(o => o.pre).ts = T6.press;
  const peak = all.filter(o => o.cell === 7).reduce((p, q) => (q.y < p.y ? q : p));
  all.push({ x: peak.x + 2, y: peak.y - R * 1.15, c: 'b', ts: T6.sneak, sneak: true, cell: 7, col: 1, row: 1 });
  [[1, T6.late[0]], [4, T6.late[1]]].forEach(([row, ts], j) => { const a = s6Cell(0, row).dot, rr = rng(700 + j), [x, y] = pick(rr, [a.x0 + R + 4, a.x1 - R - 4, a.y0 + R + 12, a.y1 - R - 12], (x, y) => near(x, y, R * 2 + 3, all));
    all.push({ x, y, c: 'r', ts, late: true, cell: row, col: 0, row }); });
  all.sort((p, q) => p.ts - q.ts);
  all.forEach((o, id) => { const rr = rng(900 + id * 7), prog = clamp((o.ts - T6.stick0) / (T6.stick1 - T6.stick0), 0, 1);
    o.id = id; o.s = 1.12 + rr() * .22; o.dv = rr() < .5 ? 1 : -1; o.style = Math.floor(rr() * 4);
    // out：手从哪边伸进来。左列从左、右列从右，顶行和底行常从上、下来；打架的格子红从左、黑从下
    let out;
    if (o.pre) { out = PI / 4; o.style = 0; o.s = 1.2; }
    else if (o.sneak) { out = -PI / 2 + .3; o.style = 2; o.s = 1.15; }
    else if (o.late) { out = PI + (rr() - .5) * .5; o.style = 3; }
    else if (o.clash) { out = o.c === 'r' ? PI - .15 : PI / 2 + .1; o.s = 1.25; o.style = o.c === 'r' ? 0 : 1; }
    else if (o.fight) out = (o.c === 'r' ? PI : PI / 2) + (rr() - .5) * .7;
    else { const q = rr(); out = (o.row === 0 && q < .45) ? -PI / 2 : (o.row === 5 && q < .45) ? PI / 2 : (o.col ? 0 : PI); out += (rr() - .5) * .9; }
    o.ang = out + PI;
    o.tin = o.pre || o.late ? .26 : o.clash ? .18 : lerp(.3, .1, Math.sqrt(prog)); o.tp = o.pre || o.clash || o.late ? .1 : o.sneak ? .08 : lerp(.1, .04, prog); o.tout = o.pre || o.clash || o.late ? .22 : o.sneak ? .12 : lerp(.24, .1, Math.sqrt(prog)); });
  return all; })();

// ===================== 画具：贴纸、手 =====================
const s6Arc = (x, y, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, k) => { const a = lerp(a0, a1, k / n); return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
// s6Exit：从 (x, y) 沿 (dx, dy) 走多远出矩形 rc = [x, y, w, h]
function s6Exit(x, y, dx, dy, rc) { const [rx, ry, rw, rh] = rc; let d = 1e5;
  if (dx > 1e-6) d = Math.min(d, (rx + rw - x) / dx); if (dx < -1e-6) d = Math.min(d, (rx - x) / dx);
  if (dy > 1e-6) d = Math.min(d, (ry + rh - y) / dy); if (dy < -1e-6) d = Math.min(d, (ry - y) / dy); return Math.max(0, d); }
// s6Squash：落下、压扁、回弹。u 是落到纸上后的秒数（负数 = 还在往下落，越近越小），hold 期间被手指按扁。返回 [kx, ky]
function s6Squash(u, o = {}) { const { fall = .12, from = 1.3, amp = .22, hold = 0 } = o;
  if (u < 0) { const k = lerp(from, 1, easeIn(clamp(1 + u / fall, 0, 1))); return [k, k]; }
  if (u < hold) return [1 + amp, 1 - amp * .8];
  const w = settle(u - hold + .02, 0, { amp, freq: 3.2, decay: 9, phase: Math.PI / 2 }); return [1 + w, 1 - w * .8]; }
// s6Sticker：一张圆贴纸。边缘略毛，右下一道浅灰的纸边，左上一弯纸面高光（glint 0 时两样都没有：开场它还只是个黑点）
function s6Sticker(c, x, y, r, col, o = {}) { const { kx = 1, ky = 1, glint = 1, sd = 1 } = o;
  pop(c, x, y, kx, () => {
    if (glint > 0) fillPts(c, ellPts(x + r * .08, y + r * .12, r, r, 0, 20), K.g2, .3);
    block(c, ellPts(x, y, r, r, 0, 24), col, { amp: r * .05, freq: r * .9, seed: sd, grain: .45, step: Math.max(2.5, r / 6) });
    if (glint > 0) stroke(c, s6Arc(x, y, r * .6, 3.65, 4.55, 6), { w: r * .2, color: K.paper, al: .6, seed: sd + 3, taper: .5, rough: .15 }); }, ky); }
// s6Hand：一只木刻剪影的手，手背朝上，食指伸直按在 (x, y)，另外三指蜷着，大拇指朝前。ang 是食指的朝向，s 大小，
//   dv = -1 换成另一只手；style 0 普通袖口、1 条纹袖、2 荷叶边宽袖、3 光胳膊戴护腕。手臂一直伸到画面外
function s6Hand(c, x, y, ang, s, o = {}) { const { dv = 1, style = 0, sd = 1 } = o, ca = Math.cos(ang), sa = Math.sin(ang);
  const P = (u, v) => [x + (u * ca - v * dv * sa) * s, y + (u * sa + v * dv * ca) * s];
  const reach = Math.max(300, (s6Exit(x, y, -ca, -sa, viewRect(40)) + 160) / s), cuff = -178;
  const parts = [
    [capsule(P(-66, 0), P(-5, 0), 9.5 * s), true],                                                  // 食指
    [capsule(P(-68, 20), P(-48, 21), 9.5 * s), true], [capsule(P(-70, 38), P(-52, 38), 9 * s), true], [capsule(P(-72, 54), P(-58, 53), 8 * s), true],   // 蜷着的三指
    [M(P, [[-62, -10], [-60, 10], [-64, 62], [-88, 68], [-126, 58], [-136, 22], [-130, -8], [-102, -15]]), true],   // 手背
    [capsule(P(-122, -6), P(-90, -26), 10 * s), true],                                             // 大拇指
    [M(P, [[-128, 0], [-126, 56], [-reach, 64], [-reach, -8]]), false],                             // 小臂
  ];
  if (style !== 3) parts.push([M(P, style === 2 ? [[cuff, -36], [cuff + 8, 86], [-reach, 98], [-reach, -46]] : [[cuff, -22], [cuff + 4, 74], [-reach, 82], [-reach, -30]]), false]);   // 袖子
  const path = new Path2D();
  parts.forEach(([pts, smooth], k) => { let q = rough(pts, { amp: 1.1, freq: 9, seed: sd + k * 5, step: smooth ? 3 : 7, smooth }); if (ringArea(q) < 0) q = q.slice().reverse(); path.addPath(polyPath(q)); });
  c.save(); c.fillStyle = K.ink; c.fill(path); texture(c, path, 'ink', .6, x, y); c.restore();
  // 白色刮痕：指节、食指关节、袖口
  const sw = 2.4 * s;
  scratch(c, [P(-60, 14), P(-63, 38), P(-67, 60)], { w: sw * .9, seed: sd + 50, al: .75 });
  scratch(c, [P(-36, -5), P(-35, 5)], { w: sw * .8, seed: sd + 51, al: .8, smooth: false });
  if (style === 3) for (const u of [-142, -154]) scratch(c, [P(u, 0), P(u - 2, 28), P(u - 3, 56)], { w: sw, seed: sd + 60 - u });
  else if (style === 2) { const pts = []; for (let v = -32; v <= 82; v += 4) pts.push(P(cuff - 6 + 6 * Math.abs(Math.sin(v / 9)), v)); scratch(c, pts, { w: sw, seed: sd + 55, dry: .05 }); }
  else { scratch(c, [P(cuff - 3, -18), P(cuff, 26), P(cuff + 2, 70)], { w: sw * 1.1, seed: sd + 56 });
    if (style === 1) for (const v of [10, 44]) scratch(c, [P(cuff - 40, v), P(-reach, v + 4)], { w: sw, seed: sd + 57 + v, dry: .3 }); } }
// s6Burst：贴下去那一下，四周几道短短的墨线（啪）
//   big 1.8 是打架那格两张点撞在一起的那一下
function s6Burst(c, x, y, u, sd, big = 1) { if (u < 0 || u >= .17 * big) return; const R = S6.R * big, k = u / (.17 * big), r = rng(sd), n = big > 1 ? 11 : 7;
  for (let j = 0; j < n; j++) { const a = j / n * TAU + r() * .5, r0 = R * (1.55 + k * .6), r1 = r0 + R * (.55 + r() * .35) * (1 - k * .4);
    stroke(c, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], { w: 3.2 * Math.sqrt(big), seed: sd + j, smooth: false, taper: .4 }); } }

// ===================== 表 =====================
// s6Line：一条木刻表格线，从 a 画到 b（p 0..1 画出一部分），中间有几处手抖的起伏
function s6Line(c, a, b, o = {}) { const { w = 6, p = 1, seed = 1 } = o, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, n = Math.max(2, Math.round(L / 120));
  const pts = Array.from({ length: n + 1 }, (_, k) => { const f = k / n, off = k && k < n ? noise1(k * .9, seed) * 1.8 : 0; return [a[0] + dx * f + nx * off, a[1] + dy * f + ny * off]; });
  stroke(c, pts, { w, p, seed, taper: .01, rough: .32 }); }
// s6Grid：表格线。拉远时从开场那张贴纸的位置往外刻出去，离它越远的线越晚出来
function s6Grid(c, t) { const g = S6.G, [px, py] = S6.P0, t0 = S6.T.pull0, v = 2600, sd = tick(t);
  const seg = (a, b, w, k) => { const d0 = Math.hypot(a[0] - px, a[1] - py), len = Math.hypot(b[0] - a[0], b[1] - a[1]), s0 = t0 + d0 / v, p = sm(s0, s0 + .08 + len / v, t, easeOut);
    if (p > 0) s6Line(c, a, b, { w, p, seed: 40 + k * 3 + sd }); };
  // 每条线分两半从贴纸那里往两头刻；两半各多起 12 个单位压住对方收尖的线头，接缝处不细
  for (let k = 0; k <= 6; k++) { const y = g.y0 + k * S6.RH, edge = k % 6 === 0, w = edge ? 10 : 6, ext = edge ? 5 : 0; seg([px + 12, y], [g.x0 - ext, y], w, k * 2); seg([px - 12, y], [g.x1 + ext, y], w, k * 2 + 1); }
  [g.x0, g.xm, g.x1].forEach((x, j) => { const w = j === 1 ? 7 : 10; seg([x, py + 12], [x, g.y0 - 5], w, 20 + j * 2); seg([x, py - 12], [x, g.y1 + 5], w, 21 + j * 2); }); }
// s6Head：表头。黑色木刻块盖下来，白字写出「东方二创红黑榜」
function s6Head(c, t) { const u = t - S6.T.head; if (u < 0) return; const size = 70, bw = zhWidth(c, S6.TITLE, size, ZH, 500) + 96, bh = 104, x = S6.G.xm, y = 100, sd = tick(t);
  const [kx, ky] = s6Squash(u - .1, { fall: .1, from: 1.4, amp: .07 });
  pop(c, x, y, kx, () => { block(c, rectPts(x - bw / 2, y - bh / 2, bw, bh), K.ink, { smooth: false, amp: 1.8, freq: 18, seed: 60 + sd, grain: .7 });
    zh(c, S6.TITLE, x, y + size * .36, { size, weight: 500, color: K.paper, align: 'center', p: writeP(t, S6.T.head + .12, S6.TITLE, .045), tilt: .012, jitter: .01, seed: 61 }); }, ky); }
// s6Legend：图例一行：红点「红色：这种二创再来点！！」，黑点「黑色：创死我了！！」
function s6Legend(c, t) { const t0 = S6.T.legend; if (t < t0) return; const size = 34, R = S6.R, gap = 64, y = 207, sd = tick(t), ws = S6.LEGEND.map(str => zhWidth(c, str, size, ZH, 500));
  let x = S6.G.xm - (R * 4 + 24 + ws[0] + ws[1] + gap) / 2;
  [[K.dot, 0], [K.ink, .25]].forEach(([col, dl], j) => { const u = t - t0 - dl, str = S6.LEGEND[j];
    if (u >= 0) { const [kx, ky] = s6Squash(u - .1, { fall: .1 }); s6Sticker(c, x + R, y - size * .32, R, col, { kx, ky, sd: 70 + j * 3 + sd }); }
    zh(c, str, x + R * 2 + 12, y, { size, weight: 500, p: writeP(t, t0 + dl + .08, str, .035), tilt: .01, jitter: .01, seed: 72 + j }); x += R * 2 + 12 + ws[j] + gap; }); }
// s6Names：十二个作品名，离开场贴纸近的格子先写
function s6Names(c, t) { const [px, py] = S6.P0;
  for (let col = 0; col < 2; col++) for (let row = 0; row < 6; row++) { const cl = s6Cell(col, row), str = S6.NAMES[col][row], t0 = S6.T.pull0 + .3 + Math.hypot(cl.nx - px, cl.ny - py) / 2000;
    zh(c, str, cl.nx, cl.ny, { size: S6.NAME, weight: 500, align: cl.align, p: writeP(t, t0, str, .03), tilt: .01, jitter: .01, seed: 80 + col * 6 + row }); } }
// s6Sheet：整张表的纸边和投影（只在最后表缩小时看得见；纸面和底纸一样，所以拉远前看不出接缝）
function s6Sheet(c, t) { const pts = rectPts(0, 0, W, H);
  block(c, pts.map(([x, y]) => [x + 18, y + 22]), K.g1, { smooth: false, amp: 2, seed: 130, grain: .3, al: .8 });
  const path = polyPath(rough(pts, { amp: 1.6, freq: 40, seed: 131, smooth: false, step: 6 })); c.save(); c.fillStyle = K.paper; c.fill(path); texture(c, path, 'paper', 1); c.restore();
  outline(c, pts, { w: 3, color: K.g3, seed: 132 + tick(t, 6), smooth: false, rough: .3 }); }
// s6Dots：已经贴在纸上的点（按贴下的先后叠），和刚贴下那一下的墨线
function s6Dots(c, t) {
  for (const d of S6DOTS) { if (d.ts > t && !d.pre) break; const u = t - d.ts, [kx, ky] = u < 0 ? [1, 1] : s6Squash(u, { hold: d.tp, amp: .24 });
    s6Sticker(c, d.x, d.y, S6.R, d.c === 'r' ? K.dot : K.ink, { kx, ky, glint: d.pre && u < 0 ? 0 : 1, sd: d.id * 3 + tick(t) }); }
  for (const d of S6DOTS) { if (d.ts > t) break; if (d.clash && d.c === 'b') s6Burst(c, d.x - S6.R * .55, d.y, t - d.ts, d.id * 7 + 5, 1.8); else if (!d.clash) s6Burst(c, d.x, d.y, t - d.ts, d.id * 7 + 5); } }
// s6Reach：t 时刻手指尖还离贴点多远，按「伸到画面外」的距离算比例（0 = 按在纸上）；null = 手不在画面里
function s6Reach(d, t) { const u = t - d.ts, T6 = S6.T; if (u >= d.tp + d.tout) return null;
  if (d.sneak) { if (t < T6.sneak0) return null; if (u < 0) return 1 - key(t - T6.sneak0, [[0, 0], [.14, .45], [.24, .45], [.38, .82], [.43, .82], [T6.sneak - T6.sneak0, 1]]); }   // 走两步停一下，再走两步
  else if (u < -d.tin) return null;
  else if (u < 0) { const e = 1 + u / d.tin; return 1 - e * e; }
  if (u < d.tp) return 0;
  return easeIn((u - d.tp) / d.tout); }
// s6Hands：正在伸进来、按着、缩回去的手。伸进来时手里捏着贴纸，离纸越远（离镜头越近）画得越大
function s6Hands(c, t) { for (const d of S6DOTS) { const f = s6Reach(d, t); if (f === null) continue; const out = d.ang + Math.PI, ox = Math.cos(out), oy = Math.sin(out);
  const D0 = s6Exit(d.x, d.y, ox, oy, viewRect(20)) + 40 * d.s, x = d.x + ox * D0 * f, y = d.y + oy * D0 * f;
  if (t < d.ts && !d.pre) s6Sticker(c, x, y, S6.R * (1 + .3 * f), d.c === 'r' ? K.dot : K.ink, { sd: d.id * 3 + tick(t) });
  s6Hand(c, x, y, d.ang, d.s * (1 + .14 * f), { dv: d.dv, style: d.style, sd: d.id * 11 + tick(t) }); } }

// ===================== 镜头 =====================
// s6Shake：贴得密的时候镜头跟着轻轻颤（最多 4 个单位）
function s6Shake(tau) { let n = 0; for (const d of S6DOTS) { if (d.ts > tau) break; if (tau - d.ts < .1) n++; } const a = Math.min(4, n * .6); return [noise1(tau * 40, 3) * a, noise1(tau * 44, 8) * a]; }
// s6View：开场对准那张贴纸（放大到和交接黑点一样大），拉远到整张表；最后表缩到左上角
function s6View(tau) { const T6 = S6.T, at = (anchor, scr, z) => ({ x: anchor[0] - (scr[0] - CX) / z, y: anchor[1] - (scr[1] - CY) / z, zoom: z });
  if (tau < T6.move0) { const e = sm(T6.pull0, T6.pull1, tau, easeInOutQuint), v = at(S6.P0, [lerp(CX, S6.P0[0], e), lerp(CY, S6.P0[1], e)], Math.pow(S6.Z0, 1 - e)), sh = s6Shake(tau);
    v.x += sh[0]; v.y += sh[1]; return v; }
  const e = sm(T6.move0, T6.move1, tau, easeInOutQuint); return at([CX, CY], [lerp(CX, S6.FIN.at[0], e), lerp(CY, S6.FIN.at[1], e)], Math.pow(S6.FIN.zoom, e)); }

// ===================== 收尾：实体表照片、号召、黑点扑满画面 =====================
function s6Final(c, tau) { const T6 = S6.T, t = twos(tau); if (tau < T6.photo) return; c.save(); resetT(c);
  const ph = PHOTOS.board, { x, y, h } = S6.FIN.photo, w = h * ph.w / ph.h, [kx, ky] = s6Squash(t - T6.photo - .1, { fall: .1, from: 1.1, amp: .05 });
  pop(c, x + w / 2, y + h / 2, kx, () => { block(c, rectPts(x + 14, y + 16, w, h), K.g1, { smooth: false, amp: 1.5, seed: 90, grain: .3, al: .8 });
    img(c, 'board', x, y, w, h); outline(c, rectPts(x - 9, y - 9, w + 18, h + 18), { w: 3.2, seed: 91 + tick(t, 6), smooth: false, dry: .15 }); }, ky);
  const [l1, l2] = S6.LINES, [tx, y1, y2] = S6.FIN.text;
  zh(c, l1, tx, y1, { size: 60, weight: 500, p: writeP(t, T6.line1, l1, .035), tilt: .01, jitter: .01, seed: 95 });
  zh(c, l2, tx, y2, { size: 54, weight: 500, p: writeP(t, T6.line2, l2, .035), tilt: .01, jitter: .01, seed: 96 });
  // 「小红点」下一道红线，「小黑点」下一道墨线
  const u0 = T6.line1 + .4; [['小红点', K.dot], ['小黑点', K.ink]].forEach(([str, col], j) => { const a = tx + zhWidth(c, l1.slice(0, l1.indexOf(str)), 60, ZH, 500), b = a + zhWidth(c, str, 60, ZH, 500);
    stroke(c, [[a, y1 + 20], [lerp(a, b, .5), y1 + 25], [b, y1 + 19]], { w: 6, color: col, p: sm(u0 + j * .25, u0 + j * .25 + .25, t), seed: 97 + j + tick(t), dry: .04 }); });
  c.restore(); }
// s6Black：一张巨大的黑点贴纸从画面正中扑过来盖满画面。里面画的就是 inkBg，盖满时和 handoffBlack 一模一样
function s6Black(c, tau) { const T6 = S6.T, u = sm(T6.black0, T6.black1, tau, easeIn); if (u <= 0) return; const R = 16 + u * 1160, sd = tick(tau);
  setView(null); c.save(); resetT(c); c.clip(polyPath(rough(ellPts(CX, CY, R, R, 0, 90), { amp: 1 + R * .01, freq: 26, seed: 120 + sd, step: 5 }))); inkBg(c); c.restore();
  const gl = .55 * (1 - sm(.55, .9, u)); if (gl > 0) { c.save(); resetT(c); stroke(c, s6Arc(CX, CY, R * .6, 3.65, 4.55, 12), { w: R * .12, color: K.paper, al: gl, seed: 121 + sd, taper: .5, rough: .15 }); c.restore(); } }

function s6Frame(c, tau) { const t = twos(tau); setView(s6View(tau)); paperBg(c);
  if (tau >= S6.T.move0) s6Sheet(c, t);
  s6Grid(c, t); s6Head(c, t); s6Legend(c, t); s6Names(c, t); s6Dots(c, t); s6Hands(c, t);
  s6Final(c, tau); caption(c, S6.CAP, tau, .3, { t1: S6.T.move0 - .05 }); s6Black(c, tau); }

scene({ order: 6, key: 'board', name: '东方二创红黑榜', dur: S6.END, fn: (c, tau) => {
  if (tau < S6.T.dot) handoffDot(c);
  else if (tau >= S6.T.out) handoffBlack(c);
  else s6Frame(c, tau);
} });
