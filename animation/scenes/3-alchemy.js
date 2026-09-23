'use strict';
// 第 3 段 帕秋莉的炼金工坊（11 秒）。双色油印：只用灰青 K.teal、赭 K.ochre，加墨、纸、灰。
// 0–0.15 交接黑场。黑暗里酒精灯点着，烧瓶用白色刮痕描出来、亮起，一圈毛边的纸从烧瓶处炸开，照亮工坊。
// 工坊：左边一架淡淡的书（灰青网点），右边墙上钉着黑白摊宣 Vol.3，中间桌上是烧瓶。背景只用淡线和网点，主体是墨色。
// 三个带问号的黑药瓶（? + ? + ?）落到桌上，依次跳到烧瓶口，倒进灰青、赭、灰三层药水；
// 烧瓶一抖，三层搅成一瓶魔药（灰青里一道赭色漩涡，油印叠色），冒出的烟聚成一个大问号。
// 字：「猜猜魔药是由谁的魔力构成的」「猜对了有奖励」（摊宣 Vol.3 原文）。
// 结尾烧瓶抖一下、跳一下、一歪，魔药倒出来；镜头往下摇，药水落到地上的纸上，沿 STREAM 流成横贯画面的小溪线，交给第 4 段（handoffStream）。
// 形状和动作沿用第一版第 5 镜（烧瓶、药瓶、烟、书），用新画具重画。

const S3 = {
  END: 11, IN: .15, OUT: .2,                          // 总长；开头交接黑场、结尾交接小溪线各占多久
  table: 860, floor: 1010, drop: 1024,                 // 桌面、墙脚线；drop 是结尾镜头往下摇的距离（512 的倍数，纸纹和交接画面对得上）
  F: { x: 1100, y: 648, r: 125, nw: 58, nh: 105 },     // 烧瓶：球心、半径、瓶颈宽、瓶颈长
  lit: [.72, 1.25],                                    // 纸从烧瓶处炸开、照亮工坊
  cap: [1.0, 9.4],                                     // 展签出现、收起
  bx: [250, 430, 610], bh: 175, land: 1.45,            // 三个药瓶：桌上的位置、高度、落到桌上的时间
  pours: [2.35, 3.25, 4.15],                           // 每个药瓶开始跳过去倒的时间
  cols: [K.teal, K.ochre, K.g3],                       // 三个瓶里倒出来的颜色
  lv: [.2, .41, .6],                                   // 每倒一瓶后液面的高度（占烧瓶直径的比例）
  L1: '猜猜魔药是由谁的魔力构成的', L2: '猜对了有奖励', JP: 'パチュリの錬金工房', w1: 2.15, w2: 6.55,
  shake: 5.05, mix: 5.45, smoke: [5.6, 6.75], lift: [6.75, 7.0], dot: 6.95,
  burp: 9.0, tip: [9.34, 9.62], pan: [9.6, 10.5],
  head: [9.62, 10.2], tail: [10.35, 10.78], spread: [10.2, 10.72], xImp: 1409,
  flyer: { x: 1640, y: 400, h: 440, rot: .025 },       // 墙上钉的摊宣（逻辑高 440，4K 上 880 像素）
  q: { x: 1100, y: 293, s: 260 },                      // 烟聚成的大问号：原点、大小
  shelf: { x0: 44, x1: 850, top: 175, planks: [335, 520, 705] },
};
S3.faint = mix(K.paper, K.teal, .3);                   // 背景线稿的颜色：纸上一层很淡的灰青

// ===================== 小工具 =====================
// s3Screen：灰青网点（油印的半色调），在 path 里铺一层。10 单位一格的 45° 点阵。
const S3SCR = new Map();
function s3Screen(c, path, color, al = 1) { if (al <= 0) return; const key = color + '@' + S; let p = S3SCR.get(key);
  if (!p) { const T = 10, px = Math.round(T * S), cv = document.createElement('canvas'); cv.width = cv.height = px; const g = cv.getContext('2d'); g.scale(px / T, px / T); g.fillStyle = color;
    for (const [x, y] of [[0, 0], [T, 0], [0, T], [T, T], [T / 2, T / 2]]) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
    p = c.createPattern(cv, 'repeat'); S3SCR.set(key, p); }
  p.setTransform(new DOMMatrix().scale(1 / S)); c.save(); c.globalAlpha *= al; c.fillStyle = p; c.fill(path); c.restore(); }
// s3Sub：折线上弧长比例 a..b 的一段
function s3Sub(pts, a, b) { const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const L = cum[cum.length - 1], A = clamp(a, 0, 1) * L, B = clamp(b, 0, 1) * L; if (B - A < 1) return [];
  const at = s => { let k = 1; while (k < pts.length - 1 && cum[k] < s) k++; const u = clamp((s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1), 0, 1); return [lerp(pts[k - 1][0], pts[k][0], u), lerp(pts[k - 1][1], pts[k][1], u)]; };
  const out = [at(A)]; for (let k = 0; k < pts.length; k++) if (cum[k] > A && cum[k] < B) out.push(pts[k]); out.push(at(B)); return out; }
// s3StreamY：交接小溪线 STREAM 在横坐标 x 处的高度
function s3StreamY(x) { const f = clamp((x + 40) / 42, 0, STREAM.length - 1.001), k = Math.floor(f); return lerp(STREAM[k][1], STREAM[k + 1][1], f - k); }
// s3Q：问号的形状。(x, y) 是问号竖笔的底，s 是大小。返回钩子（从左端画到竖笔底）和点
function s3Q(x, y, s) { const hook = [], cx = x, cy = y - .55 * s, r = .32 * s;
  for (let a = 200; a <= 400; a += 15) hook.push([cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r]);
  hook.push([x + .06 * s, y - .16 * s], [x, y - .1 * s], [x, y + .06 * s]); return { hook, dot: [x, y + .27 * s] }; }

// ===================== 背景：墙、书架、摊宣、桌子 =====================
const S3WALL = (() => { const p = new Path2D(); p.rect(-100, -100, 2120, S3.floor + 100); return p; })();
// 书架上的书和瓶罐（固定随机，每帧一样）
const S3BOOKS = (() => { const r = rng(303), out = [], { x0, x1, top, planks } = S3.shelf, ceil = [top, ...planks];
  planks.forEach((yb, k) => { let x = x0 + 14; const room = yb - ceil[k];
    while (x < x1 - 40) { const roll = r();
      if (roll < .08) { x += 24 + r() * 40; continue; }
      if (roll < .2) { const w = 40 + r() * 24, h = room * (.35 + r() * .25); out.push({ kind: 'jar', x, w, h, yb, fill: .3 + r() * .4 }); x += w + 10; continue; }
      const w = 15 + r() * 22, h = room * (.55 + r() * .38), lean = r() < .1 ? -(.08 + r() * .2) : 0; out.push({ kind: 'book', x, w, h, yb, lean, band: r() < .5 ? .12 + r() * .5 : -1, fill: r() < .45 });
      x += w + 2 + (r() < .12 ? 12 : 0); } });
  // 右边摊宣下面一块矮搁板：两个罐子和一摞横放的书
  const yb = 705; out.push({ kind: 'jar', x: 1470, w: 58, h: 88, yb, fill: .5 }, { kind: 'jar', x: 1540, w: 44, h: 64, yb, fill: .4 });
  [[1640, 150, 26], [1652, 128, 24], [1636, 140, 22]].reduce((y, [x, w, h]) => { out.push({ kind: 'flat', x, w, h, yb: y }); return y - h - 1; }, yb);
  out.push({ kind: 'jar', x: 1800, w: 50, h: 76, yb, fill: .35 });
  return out; })();
function s3Jar(w, h) { const nw = w * .5; return [[0, 0], [0, -h * .72], [w * .1, -h * .82], [w / 2 - nw / 2, -h * .86], [w / 2 - nw / 2, -h], [w / 2 + nw / 2, -h], [w / 2 + nw / 2, -h * .86], [w * .9, -h * .82], [w, -h * .72], [w, 0]]; }
function s3Shelves(c) { const { x0, x1, top, planks } = S3.shelf, col = S3.faint, o = { w: 2, color: col, smooth: false, taper: 0, rough: .15 };
  // 书架的框和搁板
  stroke(c, [[x0, top], [x0, S3.table]], { ...o, w: 3, seed: 311 }); stroke(c, [[x1, top], [x1, S3.table]], { ...o, w: 3, seed: 312 }); stroke(c, [[x0 - 8, top], [x1 + 8, top]], { ...o, w: 3, seed: 313 });
  planks.forEach((y, k) => { stroke(c, [[x0, y], [x1, y]], { ...o, w: 3, seed: 314 + k }); stroke(c, [[x0, y + 9], [x1, y + 9]], { ...o, w: 1.4, seed: 318 + k }); });
  stroke(c, [[1440, 705], [1880, 705]], { ...o, w: 3, seed: 321 }); stroke(c, [[1440, 714], [1880, 714]], { ...o, w: 1.4, seed: 322 });
  S3BOOKS.forEach((b, k) => { const sd = 330 + k * 3;
    if (b.kind === 'book') { const T = tf(b.x, b.yb, 1, b.lean), pts = M(T, rectPts(0, -b.h, b.w, b.h)); if (b.fill) s3Screen(c, polyPath(pts), K.teal, .32);
      outline(c, pts, { ...o, seed: sd }); if (b.band > 0) stroke(c, M(T, [[3, -b.h * (1 - b.band)], [b.w - 3, -b.h * (1 - b.band)]]), { ...o, w: 1.6, seed: sd + 1 }); }
    else if (b.kind === 'flat') { const pts = rectPts(b.x - b.w / 2, b.yb - b.h, b.w, b.h); s3Screen(c, polyPath(pts), K.teal, .25); outline(c, pts, { ...o, seed: sd }); stroke(c, [[b.x - b.w / 2 + 10, b.yb - b.h / 2], [b.x + b.w / 2 - 6, b.yb - b.h / 2]], { ...o, w: 1.4, seed: sd + 1 }); }
    else { const pts = s3Jar(b.w, b.h).map(([u, v]) => [b.x + u, b.yb + v]), lq = rectPts(b.x, b.yb - b.h * .72 * b.fill, b.w, b.h * .72 * b.fill);
      s3Screen(c, polyPath(lq), K.teal, .32); outline(c, pts, { ...o, smooth: true, seed: sd }); } }); }
// s3Flyer：钉在墙上的黑白摊宣 Vol.3（原样放），后面一块平的灰影子，两条赭色胶带
function s3Flyer(c) { const { x, y, h, rot } = S3.flyer, ph = PHOTOS.vol3, w = h * ph.w / ph.h; c.save(); c.translate(x, y); c.rotate(rot);
  block(c, rectPts(-w / 2 + 9, -h / 2 + 11, w, h), K.g1, { smooth: false, amp: 1, seed: 341, grain: .5 });
  c.drawImage(ph.img, -w / 2, -h / 2, w, h); outline(c, rectPts(-w / 2, -h / 2, w, h), { w: 2, color: K.g3, seed: 342, smooth: false, al: .8 });
  [[-w / 2 + 16, -.55], [w / 2 - 16, .5]].forEach(([u, a], k) => block(c, M(tf(u, -h / 2 + 4, 1, a), rectPts(-36, -12, 72, 24)), K.ochre, { smooth: false, amp: 1.1, seed: 343 + k, al: .85, grain: .8 }));
  c.restore(); }
// s3Table：木刻的长桌（墨块 + 干刷痕）、两条腿、墙脚线
function s3Table(c) { const y = S3.table;
  block(c, [[-60, y], [1980, y - 4], [1980, y + 62], [-60, y + 66]], K.ink, { smooth: false, amp: 1.6, seed: 351, streaks: 6, dir: 0 });
  for (const x of [150, 1760]) block(c, rectPts(x - 22, y + 58, 44, S3.floor - y - 54), K.ink, { smooth: false, amp: 1.4, seed: 352 + x, grain: .6 });
  stroke(c, [[-60, S3.floor], [1980, S3.floor + 3]], { w: 3, seed: 355, taper: 0, smooth: false });
  scratch(c, [[40, y + 11], [1880, y + 8]], { w: 2.2, seed: 356, al: .55, dry: .4 }); }

// ===================== 酒精灯、烧瓶、药瓶 =====================
function s3Lamp(c, t, dark) { const x = S3.F.x, y = S3.table, sd = tick(t), col = dark ? K.paper : K.ink;
  const body = [[x - 50, y], [x - 56, y - 16], [x - 42, y - 34], [x - 14, y - 38], [x - 10, y - 46], [x + 10, y - 46], [x + 14, y - 38], [x + 42, y - 34], [x + 56, y - 16], [x + 50, y]];
  if (dark) outline(c, body, { w: 3, color: K.paper, seed: 361 + sd, smooth: false });
  else { block(c, body, K.ink, { smooth: false, amp: 1.2, seed: 361 + sd, grain: .6 }); scratch(c, [[x - 30, y - 18], [x + 30, y - 19]], { w: 2.4, seed: 362 + sd, al: .8 }); }
  stroke(c, [[x, y - 46], [x, y - 53]], { w: 3, color: col, seed: 363, smooth: false }); }
// s3Flame：酒精灯的火苗（赭色，每秒换 8 次形）
function s3Flame(c, t, k = 1) { if (k <= 0) return; const x = S3.F.x, y = S3.table - 52, sd = tick(t), r = rng(sd + 5), h = (32 + r() * 9) * k, w = 11 * k, lean = (r() - .5) * 7;
  block(c, [[x - w, y], [x - w * .75, y - h * .45], [x + lean, y - h], [x + w * .75, y - h * .45], [x + w, y]], K.ochre, { amp: 1.1, seed: 365 + sd, grain: .3 });
  block(c, [[x - w * .4, y], [x + lean * .4, y - h * .5], [x + w * .4, y]], K.paper, { amp: .6, seed: 366 + sd, grain: 0 }); }
// 烧瓶轮廓（局部坐标，原点在球心）：瓶口左 → 瓶颈 → 绕球一圈 → 瓶口右
const S3FP = (() => { const { r, nw, nh } = S3.F, a0 = Math.asin(nw / 2 / r), pts = [[-nw / 2, -r - nh]];
  for (let k = 0; k <= 44; k++) { const th = -Math.PI / 2 - a0 - k / 44 * (TAU - 2 * a0); pts.push([Math.cos(th) * r, Math.sin(th) * r]); }
  pts.push([nw / 2, -r - nh]); return pts; })();
// s3Flask：大圆底烧瓶。rot 绕球心转，dark 时是黑底上的白线，p 轮廓画出的进度，lit 玻璃亮着（纸色），inner(T) 在玻璃里面画药水
function s3Flask(c, t, o = {}) { const { rot = 0, dx = 0, dy = 0, dark = false, p = 1, lit = true, inner = null } = o, F = S3.F, T = tf(F.x + dx, F.y + dy, 1, rot), sd = tick(t), line = dark ? K.paper : K.ink;
  const pts = M(T, S3FP), glass = polyPath(pts);
  const arcPts = (r, a0, a1) => { const out = []; for (let a = a0; a <= a1; a += 5) out.push([Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r]); return out; };
  if (lit) { c.fillStyle = K.card; c.fill(glass); texture(c, glass, 'paper', .5, F.x, F.y);
    if (!dark) { [[.9, -58, 52], [.83, -42, 38], [.76, -24, 22]].forEach(([k, a0, a1], j) => stroke(c, M(T, arcPts(F.r * k, a0, a1)), { w: 2.4 - j * .4, seed: 379 + j + sd, al: .8, taper: .5 }));
      stroke(c, M(T, [[F.nw * .28, -F.r - F.nh + 16], [F.nw * .28, -F.r - 14]]), { w: 2, seed: 382 + sd, al: .7, smooth: false }); } }
  if (inner) { c.save(); c.clip(glass); inner(T); c.restore(); }
  stroke(c, pts, { w: 6.5, color: line, p, seed: 371 + sd, taper: .04, rough: .2 });
  if (p < 1) return T;
  block(c, M(T, rectPts(-F.nw * .74, -F.r - F.nh - 9, F.nw * 1.48, 15)), line, { smooth: false, amp: .8, seed: 373 + sd, grain: .3 });
  // 高光：球的左下一道纸色刮痕（落在药水上），左上两道短墨线（玻璃的反光）
  scratch(c, M(T, arcPts(F.r * .8, 128, 168)), { w: 5, seed: 375 + sd, al: .85 });
  if (!dark) { stroke(c, M(T, arcPts(F.r * .74, 212, 232)), { w: 3.2, seed: 376 + sd, al: .7 }); stroke(c, M(T, arcPts(F.r * .62, 238, 246)), { w: 2.6, seed: 377 + sd, al: .7 });
    stroke(c, M(T, [[-F.nw * .22, -F.r - F.nh + 18], [-F.nw * .22, -F.r - 22]]), { w: 2.4, seed: 378 + sd, al: .6, smooth: false }); }
  return T; }
// s3Ring：铁架的圈（托着烧瓶）和两条腿
function s3Ring(c, t, dark, p = 1) { const F = S3.F, y = F.y + Math.sqrt(F.r * F.r - 66 * 66), col = dark ? K.paper : K.ink, sd = tick(t);
  stroke(c, ellPts(F.x, y, 68, 11, 0, 32), { close: true, w: 4.5, color: col, p, seed: 381 + sd, taper: 0 });
  for (const s of [-1, 1]) stroke(c, [[F.x + s * 66, y + 4], [F.x + s * 96, S3.table]], { w: 5, color: col, p, seed: 383 + s + sd, smooth: false }); }
// s3Liquid：一层药水（水面有波纹），返回 Path2D
function s3Liquid(c, t, top, color, o = {}) { const { amp = 3, seed = 1, ph = 0, streaks = 2 } = o, x0 = S3.F.x - 420, x1 = S3.F.x + 420, pts = [];
  for (let x = x0; x <= x1; x += 18) pts.push([x, top + Math.sin(x * .045 + t * 7 + ph) * amp]);
  pts.push([x1, top + 700], [x0, top + 700]); return block(c, pts, color, { smooth: false, amp: 1.2, seed: seed + tick(t), streaks, grain: .7, dir: -.1, anchor: [S3.F.x, S3.F.y] }); }
// s3Bubbles：药水里往上冒的小泡（纸色小圈）
function s3Bubbles(c, t, top, n = 7, speed = .8) { const F = S3.F, base = F.y + F.r;
  for (let k = 0; k < n; k++) { const ph = (t * speed + k / n) % 1, x = F.x + Math.sin(k * 2.4 + 1) * F.r * .5, y = lerp(base - 14, top + 4, ph), rr = 4 + (k % 3) * 2.6;
    if (y > top + 6) stroke(c, ellPts(x, y, rr, rr, 0, 12), { close: true, w: 2.2, color: K.paper, seed: 391 + k + tick(t), taper: 0, rough: .2 }); } }
// s3Bottle：照摊宣画的黑药瓶（圆角瓶身、斜肩、细瓶颈、赭色软木塞），白色刮出来的问号。
//   (x, y) 瓶身中心，rot 绕中心转，sq 落地时压扁（瓶底不动），返回瓶口的画面坐标
function s3Bottle(c, x, y, h, rot, o = {}) { const { sq = 0, cork = true, seed = 1, t = 0 } = o, w = h * .62, nw = h * .25, sd = seed + tick(t), ca = Math.cos(rot), sa = Math.sin(rot);
  const B = (u, vb) => { const U = u * (1 + sq * .6), V = h / 2 + vb * (1 - sq); return [x + U * ca - V * sa, y + U * sa + V * ca]; };   // vb：从瓶底往上（负数）
  const body = [[-w / 2 + h * .07, 0], [-w / 2, -h * .07], [-w / 2, -h * .48], [-nw / 2, -h * .66], [-nw / 2, -h * .84], [nw / 2, -h * .84], [nw / 2, -h * .66], [w / 2, -h * .48], [w / 2, -h * .07], [w / 2 - h * .07, 0]];
  block(c, body.map(p => B(...p)), K.ink, { smooth: false, amp: 1.3, seed: sd, grain: .6, anchor: [x, y] });
  block(c, [[-nw * .64, -h * .82], [nw * .64, -h * .82], [nw * .64, -h * .88], [-nw * .64, -h * .88]].map(p => B(...p)), K.ink, { smooth: false, amp: .8, seed: sd + 1, grain: 0 });
  if (cork) block(c, rectPts(-nw * .42, -h * .99, nw * .84, h * .12).map(p => B(...p)), K.ochre, { smooth: false, amp: .9, seed: sd + 2, grain: .6 });
  const q = s3Q(0, -h * .28, h * .3); scratch(c, q.hook.map(p => B(...p)), { w: h * .042, seed: sd + 3, dry: .05, taper: .2 });
  fillPts(c, ellPts(...B(...q.dot), h * .03, h * .03, 0, 10), K.paper);
  scratch(c, [B(-w * .33, -h * .12), B(-w * .34, -h * .4)], { w: 2.6, seed: sd + 4, al: .7, smooth: false });
  return B(0, -h * .87); }
// s3BottleState：第 k 个药瓶此刻的位置、角度、压扁、塞子，以及倒药水的进度
const S3POUR = { x: 1086, y: 372, rot: 2.15 };        // 倒药水时瓶口的位置、瓶子的角度
function s3BottleState(k, t) { const h = S3.bh, rest = [S3.bx[k], S3.table - h / 2], a = h * .87 - h / 2, R = S3POUR.rot, at = [S3POUR.x - a * Math.sin(R), S3POUR.y + a * Math.cos(R)];
  const tin = S3.land + k * .15, t0 = S3.pours[k];
  if (t < tin + .25) { const u = sm(tin, tin + .25, t, easeIn); return { x: rest[0], y: lerp(-260, rest[1], u), rot: 0, sq: 0, cork: true, on: t >= tin }; }
  if (t < t0) return { x: rest[0], y: rest[1], rot: 0, sq: .22 * Math.sin(Math.PI * sm(tin + .25, tin + .4, t, x => x)), cork: true, on: true };
  if (t < t0 + .72) { const u = sm(t0, t0 + .28, t, easeOutQuint), [x, y] = arc(rest, at, u, 150), rot = R * sm(t0 + .04, t0 + .3, t, easeOutBack) + (t > t0 + .3 ? Math.sin((t - t0) * 30) * .05 : 0);
    return { x, y, rot, sq: 0, cork: false, on: true, pour: [sm(t0 + .28, t0 + .4, t, easeIn), 0] }; }
  const u = sm(t0 + .72, t0 + .92, t, easeInOutQuint), [x, y] = arc(at, rest, u, 90);
  return { x, y, rot: R * (1 - u), sq: .2 * Math.sin(Math.PI * sm(t0 + .92, t0 + 1.05, t, x => x)), cork: u >= 1, on: true, pour: t < t0 + .84 ? [1, sm(t0 + .72, t0 + .84, t, easeIn)] : null }; }
// s3Plus：药瓶之间的加号
function s3Plus(c, t, x, y, p) { if (p <= 0) return; const sd = tick(t); stroke(c, [[x - 20, y], [x + 20, y + 1]], { w: 6, p: clamp(p * 2, 0, 1), seed: 401 + x + sd, smooth: false }); stroke(c, [[x, y - 20], [x - 1, y + 20]], { w: 6, p: clamp(p * 2 - 1, 0, 1), seed: 402 + x + sd, smooth: false }); }

// ===================== 药水 =====================
// 液面：三层按倒进去的顺序往上叠；搅匀以后是一瓶灰青魔药，里面一道赭色漩涡（正片叠底，像油印两色套印）
function s3Level(k, t) { const t0 = S3.pours[k] + .32; return lerp(k ? S3.lv[k - 1] : 0, S3.lv[k], sm(t0, t0 + .45, t, easeOut)); }
function s3Potion(c, t, T) { const F = S3.F, base = F.y + F.r, D = F.r * 2;
  if (t < S3.mix) { const shaking = t >= S3.shake;
    for (let k = 2; k >= 0; k--) { if (t < S3.pours[k] + .32) continue; s3Liquid(c, t, base - D * s3Level(k, t), S3.cols[k], { amp: shaking ? 9 : 2.5, seed: 411 + k * 5, ph: k * 1.7 }); }
    if (shaking) s3Bubbles(c, t, base - D * S3.lv[2], 9, 1.6); return; }
  const top = lerp(base - D * S3.lv[2], F.y + 50, sm(S3.head[0], S3.tail[0], t)), boil = t < S3.mix + .3 || (t >= S3.burp && t < S3.tip[0]) ? 8 : 3.5, lp = s3Liquid(c, t, top, K.teal, { amp: boil, seed: 421, streaks: 3 });
  c.save(); c.clip(lp); c.globalCompositeOperation = 'multiply'; const sw = [];
  for (let a = 0; a < TAU * 2.1; a += .14) { const rr = 10 + a * 10.5; sw.push([F.x + Math.cos(a + t * 2.6) * rr * 1.25, F.y + 58 + Math.sin(a + t * 2.6) * rr * .5]); }
  stroke(c, sw, { w: 13, color: K.ochre, dry: .22, seed: 425 + tick(t), taper: .35 }); c.globalCompositeOperation = 'source-over';
  s3Bubbles(c, t, top, 7, .9); c.restore();
  if (t >= S3.head[0] && t < S3.tail[0] + .08) stroke(c, M(T, [[F.nw * .16, -F.r * .7], [F.nw * .16, -F.r - F.nh - 6]]), { w: F.nw * .6, color: K.teal, seed: 428 + tick(t), taper: .05, smooth: false }); }

// ===================== 烟聚成的大问号 =====================
// 烟从瓶口升起，沿「瓶口 → 问号的点 → 竖笔 → 钩子」这条路长出来；长满以后瓶口到竖笔底这一段断开，点单独弹出来。
const S3QPATH = (() => { const { x, y, s } = S3.q, q = s3Q(x, y, s), m = [S3.F.x, S3.F.y - S3.F.r - S3.F.nh - 6];
  const pts = spline([m, q.dot, ...q.hook.slice().reverse()], 4, false), cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  let stem = 0; for (let k = 0; k < pts.length; k++) if (pts[k][1] > y + .06 * s - 1) stem = cum[k];
  return { pts, cum, L: cum[cum.length - 1], stem, dot: q.dot }; })();
function s3QAt(s) { const { pts, cum } = S3QPATH; let k = 1; while (k < pts.length - 1 && cum[k] < s) k++; const u = clamp((s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1), 0, 1), a = pts[k - 1], b = pts[k];
  return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), a: Math.atan2(b[1] - a[1], b[0] - a[0]) }; }
// s3Puffs：一串烟团合成一个 Path2D（同一方向的多边形，nonzero 填充就是并集）
function s3Puffs(list, sd) { const P = new Path2D(); list.forEach(([x, y, r], k) => { if (r > 1) P.addPath(polyPath(rough(ellPts(x, y, r, r * .9, k, 18), { amp: 1.6, freq: 9, seed: sd + k }))); }); return P; }
function s3Smoke(c, t) { const { L, stem, dot } = S3QPATH, head = sm(S3.smoke[0], S3.smoke[1], t, easeInOutSine) * L; if (head <= 0) return;
  const tail = sm(S3.lift[0], S3.lift[1], t, easeIn) * stem, sd = 431 + tick(t), bob = t > S3.smoke[1] ? Math.sin(t * 2.2) * 4 : 0, list = [];
  for (let s = tail; s <= head; s += 13) { const q = s3QAt(s), wob = noise1(s / 40 + t * 1.5, 7) * 7 * (1 - sm(S3.smoke[1], S3.smoke[1] + .4, t)), n = q.a + Math.PI / 2;
    const r = (26 + 6 * noise1(s / 28, 3)) * clamp((head - s) / 70 + .3, .3, 1) * clamp((s - tail) / 36 + .45, .45, 1);
    list.push([q.x + Math.cos(n) * wob, q.y + Math.sin(n) * wob + bob, r]); }
  const dk = easeOutBack(sm(S3.dot, S3.dot + .22, t, x => x)); if (dk > 0) [[0, 0, 30], [-12, 6, 20], [12, 5, 20]].forEach(([u, v, r]) => list.push([dot[0] + u * dk, dot[1] + v * dk + bob, r * dk]));
  const P = s3Puffs(list, sd); c.save(); c.globalCompositeOperation = 'multiply';
  c.fillStyle = mix(K.paper, K.teal, .8); c.fill(P); c.save(); c.translate(9, 7); s3Screen(c, P, K.ochre, 1); c.restore(); c.restore();
  texture(c, P, 'paper', .7, S3.q.x, S3.q.y);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y, r] of list) { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); }
  drybrush(c, P, [[x0, y0], [x1, y1]], { n: 7, dir: -.6, seed: sd + 50, w: 2, al: .8 }); }

// ===================== 结尾：魔药倒出来，流成小溪线 =====================
const S3STREAM = STREAM.map(([x, y]) => [x, y + S3.drop]);   // 镜头往下摇 drop 以后，小溪线在世界里的位置
function s3FlaskState(t) { let dx = 0, dy = 0; if ((t >= S3.shake && t < S3.mix) || (t >= S3.burp && t < S3.burp + .2)) dx = (hash(Math.floor(t * 24), 7) - .5) * 12;
  dy = -18 * Math.sin(Math.PI * sm(S3.burp + .22, S3.burp + .34, t, x => x));
  const rot = 1.3 * sm(S3.tip[0], S3.tip[1], t, easeInBack) + settle(t, S3.tip[1], { amp: .08, freq: 2.2, decay: 5 }); return { dx, dy, rot }; }
function s3Outflow(c, t, st) { const F = S3.F, headP = sm(S3.head[0], S3.head[1], t, easeIn), tailP = sm(S3.tail[0], S3.tail[1], t, easeIn); if (headP <= 0 || tailP >= 1) return;
  const T = tf(F.x + st.dx, F.y + st.dy, 1, st.rot), m = T(0, -F.r - F.nh - 4), d = [Math.sin(st.rot), -Math.cos(st.rot)], xf = S3.xImp, yI = S3.drop + s3StreamY(xf), sd = tick(t);
  const path = spline([m, [m[0] + d[0] * 34, m[1] + d[1] * 34 + 6], [lerp(m[0], xf, .82), m[1] + 44], [xf, m[1] + 120], [xf, lerp(m[1] + 120, yI, .5)], [xf, yI]], 5, false), seg = s3Sub(path, tailP, headP);
  if (seg.length < 2) return; stroke(c, seg, { w: 15, color: K.teal, seed: 451 + sd, taper: .06, rough: .25, wfn: f => 1 - .25 * f });
  scratch(c, seg.map(([x, y]) => [x - 3, y]), { w: 2, seed: 452 + sd, al: .6, dry: .5 }); }
function s3Spread(c, t) { const k = sm(S3.spread[0], S3.spread[1], t, easeOut), xI = S3.xImp, yI = S3.drop + s3StreamY(xI), sd = tick(t); if (k <= 0) return;
  const xl = lerp(xI, -90, k), xr = lerp(xI, 2010, k), col = mix(K.teal, K.g3, sm(S3.spread[0] + .05, S3.spread[1], t));
  c.save(); c.beginPath(); c.rect(xl, S3.drop - 200, xr - xl, 1500); c.clip(); stroke(c, S3STREAM, { w: 10, color: col, seed: 5, taper: 0, rough: .25 }); c.restore();
  for (const x of [xl, xr]) if (x > 0 && x < W) block(c, ellPts(x, S3.drop + s3StreamY(x), 8, 6.5, 0, 14), col, { amp: .8, seed: 461 + sd, grain: 0 });
  // 落点：一小摊药水，溅起几滴，然后缩回线里
  const pool = sm(S3.spread[0], S3.spread[0] + .1, t, easeOut) * (1 - sm(S3.spread[0] + .2, S3.tail[1] - .02, t)); if (pool > 0) block(c, ellPts(xI, yI, 34 * pool, 12 * pool, 0, 20), K.teal, { amp: 1.4, seed: 462 + sd, grain: .4 });
  const sp = sm(S3.spread[0], S3.spread[0] + .24, t, x => x); if (sp > 0 && sp < 1) [[-70, 60], [-34, 90], [20, 100], [58, 70], [96, 40]].forEach(([dx, h], j) => { const [x, y] = arc([xI, yI], [xI + dx, yI + 6], sp, h), r = 6 * (1 - sp * .5); fillPts(c, ellPts(x, y, r, r, 0, 10), K.teal); }); }

// ===================== 字 =====================
function s3Words(c, t) { const p1 = writeP(t, S3.w1, S3.L1, .07), p2 = writeP(t, S3.w2, S3.L2, .09), sd = tick(t);
  zh(c, S3.L1, 96, 300, { size: 56, p: p1, seed: 31, tilt: .02, jitter: .015 });
  zh(c, S3.L2, 96, 420, { size: 80, weight: 500, p: p2, seed: 32, tilt: .025, jitter: .015 });
  const u = sm(S3.w2 + .6, S3.w2 + .9, t); if (u > 0) stroke(c, [[92, 446], [300, 452], [560, 444]], { w: 7, color: K.ochre, p: u, seed: 33 + sd, dry: .15 }); }
function s3Caption(c, tau) { caption(c, '帕秋莉的炼金工坊', tau, S3.cap[0], { t1: S3.cap[1] }); const t0 = S3.cap[0] + .65;
  if (tau > t0 && tau < S3.cap[1]) { c.save(); resetT(c); zh(c, S3.JP, 58, 196, { size: 32, color: K.g3, p: writeP(tau, t0, S3.JP, .04), seed: 9, tilt: .01, jitter: .01 }); c.restore(); viewT(c); } }

// ===================== 两个画面：黑暗里的烧瓶、亮起来的工坊 =====================
function s3Dark(c, t) { inkBg(c); const F = S3.F;
  s3Lamp(c, t, true); s3Flame(c, t, easeOutBack(sm(S3.IN, S3.IN + .15, t, x => x)));
  const p = sm(.22, .55, t, easeInOutSine), lit = t >= .55; s3Flask(c, t, { dark: true, p, lit }); s3Ring(c, t, true, p);
  const ray = sm(.55, .75, t, easeOut); if (ray > 0) for (let k = 0; k < 20; k++) { const a = k / 20 * TAU + .08; if (Math.abs(Math.sin(a) + 1) < .12) continue; const r0 = F.r + 34, L = r0 + (60 + hash(k, 5) * 120) * ray;
    scratch(c, [[F.x + Math.cos(a) * r0, F.y + Math.sin(a) * r0], [F.x + Math.cos(a) * L, F.y + Math.sin(a) * L]], { w: 2.4, seed: 470 + k + tick(t), al: .85, smooth: false }); } }
function s3World(c, t) { paperBg(c); texture(c, S3WALL, 'dots', 1);
  s3Shelves(c); s3Flyer(c); s3Table(c); s3Lamp(c, t, false); s3Flame(c, t);
  const st = s3FlaskState(t); s3Flask(c, t, { ...st, inner: T => s3Potion(c, t, T) }); s3Ring(c, t, false);
  s3Plus(c, t, (S3.bx[0] + S3.bx[1]) / 2, S3.table - S3.bh * .42, sm(S3.land + .5, S3.land + .7, t)); s3Plus(c, t, (S3.bx[1] + S3.bx[2]) / 2, S3.table - S3.bh * .42, sm(S3.land + .6, S3.land + .8, t));
  const bs = [0, 1, 2].map(k => s3BottleState(k, t)), order = [0, 1, 2].sort((a, b) => (bs[a].pour ? 1 : 0) - (bs[b].pour ? 1 : 0));
  for (const k of order) { const b = bs[k]; if (!b.on) continue; const mouth = s3Bottle(c, b.x, b.y, S3.bh, b.rot, { sq: b.sq, cork: b.cork, seed: 481 + k * 7, t });
    if (b.pour) { const top = S3.F.y + S3.F.r - S3.F.r * 2 * (k ? S3.lv[k - 1] : 0), path = spline([mouth, [mouth[0] + 8, mouth[1] + 20], [S3.F.x, S3.F.y - S3.F.r - S3.F.nh + 10], [S3.F.x, top]], 5, false), seg = s3Sub(path, b.pour[1], b.pour[0]);
      if (seg.length > 1) stroke(c, seg, { w: 9, color: S3.cols[k], seed: 491 + k + tick(t), taper: .1 }); } }
  s3Smoke(c, t); s3Outflow(c, t, st); s3Spread(c, t); s3Words(c, t); }

scene({ order: 3, key: 'alchemy', name: '帕秋莉的炼金工坊', dur: S3.END, fn: (c, tau) => {
  if (tau < S3.IN) return handoffBlack(c);
  if (tau >= S3.END - S3.OUT) return handoffStream(c);
  const t = twos(tau); setView({ x: CX, y: CY + S3.drop * sm(S3.pan[0], S3.pan[1], tau, easeInOutSine), zoom: 1 });
  if (tau < S3.lit[1]) { s3Dark(c, t); const k = sm(S3.lit[0], S3.lit[1], tau, easeOutQuint);
    if (k > 0) { const R = lerp(150, 1550, k), disc = polyPath(rough(ellPts(S3.F.x, S3.F.y, R, R, 0, 96), { amp: 6 + R * .012, freq: 18, spike: .12, spikeLen: 30 + R * .04, seed: 499 + tick(tau) }));
      c.save(); c.clip(disc); s3World(c, t); c.restore(); } }
  else s3World(c, t);
  s3Caption(c, tau);
} });
