'use strict';
// 第 1 段 三眼的幻恋（28 秒）。照参考视频开头：桌面俯拍的一张纸，钢笔滴墨，墨团变成紧闭的觉之瞳（只有眼皮线和睫毛），
// 伸出一根越长越乱的线；切进书架走廊把书一本本吸进去；黑底上双生藤蔓缠成心形、开出蔷薇，一滴暗红落下又褪成灰；
// 黑底卡写两句售卖信息，写完左移，右侧三分之一放封面水墨版，颜色从觉之瞳处慢慢晕回彩色版；
// 最后一条紧闭的眼皮线拉成一道隙间，裂开，里面是第 2 段隙间月影的纸（#F7F6F4 满屏交接）。
// 除了封面不出现人物，不碰小说关键情节。字幕是小说原句。

const S1 = {
  A: 0, B: 5.2, C: 11.2, D: 16.6, E: 26.4, END: 28,     // 五个镜头的起点
  blot: [960, 565],                                         // 墨团落点
  vp: [960, 470], F: 520, wall: 1.15, speed: .85, zEnd: 15, // 走廊：灭点、焦距、墙距、镜头速度、尽头
  eye: [960, 805],                                          // 走廊里眼睛在屏上的位置
  sukima: SUKIMA_PAPER,
  sale: ['三眼的幻恋作为包子的处女作', '在现场cos恋恋签售的就是作者'],   // 用户定稿：片子就在摊位上放，不写时间地点
  cover: { x: 1585, y: 540, w: 590, eye: [.232, .564] },   // 右侧三分之一的封面；eye 是封面上觉之瞳的位置（比例）
};

// ===================== 道具 =====================
// s1Pen：钢笔。笔尖在 (x, y)，a 是笔杆朝向（从笔尖指向笔尾）
function s1Pen(c, x, y, a, seed) { const T = (u, v) => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)];
  block(c, M(T, [[58, -13], [150, -15], [168, -18], [520, -18], [548, -10], [552, 0], [548, 10], [520, 18], [168, 18], [150, 15], [58, 13]]), K.ink, { smooth: false, amp: 1.2, seed, grain: .5 });
  block(c, M(T, [[0, 0], [30, -7], [62, -12], [62, 12], [30, 7]]), K.paper, { smooth: false, amp: .8, seed: seed + 1, grain: .4 });
  outline(c, M(T, [[0, 0], [30, -7], [62, -12], [62, 12], [30, 7]]), { w: 2.2, seed: seed + 2, smooth: false });
  stroke(c, M(T, [[4, 0], [44, 0]]), { w: 2, seed: seed + 3, smooth: false }); fillPts(c, ellPts(...T(44, 0), 3.2, 3.2), K.ink);
  scratch(c, M(T, [[190, -8], [500, -9]]), { w: 3, seed: seed + 4, al: .8 });
  scratch(c, M(T, [[430, 20], [440, 26], [520, 25]]), { w: 3.4, seed: seed + 5, smooth: false }); }
// s1Inkwell：墨水瓶（左下角）
function s1Inkwell(c, x, y, seed) { block(c, [[x - 78, y + 62], [x - 84, y - 20], [x - 60, y - 52], [x - 34, y - 56], [x - 34, y - 90], [x + 34, y - 90], [x + 34, y - 56], [x + 60, y - 52], [x + 84, y - 20], [x + 78, y + 62]], K.ink, { smooth: false, amp: 1.8, seed, streaks: 2 });
  block(c, rectPts(x - 44, y - 12, 88, 46), K.paper, { smooth: false, amp: 1.2, seed: seed + 1 }); stroke(c, [[x - 30, y + 8], [x - 14, y], [x + 2, y + 12], [x + 18, y + 2], [x + 30, y + 10]], { w: 2.2, seed: seed + 2 }); }
// s1Candy：一颗包着糖纸的糖（小说里的橘子味糖）
function s1Candy(c, x, y, rot, seed) { const T = tf(x, y, 1, rot); block(c, M(T, ellPts(0, 0, 40, 26, 0, 24)), K.ink, { seed, amp: 1.4 });
  for (const s of [-1, 1]) block(c, M(T, [[s * 36, -6], [s * 72, -26], [s * 64, 0], [s * 74, 24], [s * 36, 6]]), K.ink, { smooth: false, seed: seed + 3 + s, amp: 1.2 });
  scratch(c, M(T, [[-22, -12], [-6, -17], [10, -15]]), { w: 3, seed: seed + 7 }); }
// s1Slip：一张撕下来的日记纸，写着几行看不清的字
function s1Slip(c, x, y, rot, seed) { const T = tf(x, y, 1, rot), box = [[-110, -70], [110, -76], [104, 70], [-106, 74]];
  const top = []; for (let u = -110; u <= 110; u += 10) top.push([u, -72 + (hash(u + 200, seed) - .5) * 9]);
  block(c, M(T, [...top, [104, 70], [-106, 74]]), K.card, { smooth: false, amp: .8, seed, grain: .6 }); outline(c, M(T, box), { w: 2.4, seed: seed + 1, smooth: false });
  for (let k = 0; k < 4; k++) { const pts = []; for (let u = -84; u <= 60 + (k % 2) * 20; u += 12) pts.push([u, -36 + k * 28 + Math.sin(u * .2 + k) * 4]); stroke(c, M(T, pts), { w: 2, seed: seed + 5 + k, al: .8 }); } }
// s1Ring：茶杯留下的一圈印子
function s1Ring(c, x, y, r, seed) { stroke(c, ellPts(x, y, r, r * .97, 0, 60), { close: true, w: 8, dry: .55, seed, al: .75, taper: 0 }); stroke(c, ellPts(x + 6, y - 4, r * .93, r * .9, 0, 60).slice(8, 40), { w: 3, dry: .5, seed: seed + 1, al: .5 }); }

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
function s1Desk(c, tau) { const t = twos(tau), [bx, by] = S1.blot, splat = 1.55;
  const push = 1.04 + .04 * sm(0, 4.2, tau), dive = sm(4.2, 5.2, tau, easeIn), zoom = push * Math.pow(14, dive);
  setView({ x: lerp(CX, bx, sm(3.6, 4.6, tau)), y: lerp(CY, by + 4, sm(3.6, 4.6, tau)), zoom }); paperBg(c);
  s1Inkwell(c, 200, 880, 11); s1Ring(c, 1650, 860, 96, 21); s1Candy(c, 360, 250, -.35, 31); s1Slip(c, 1590, 250, .08, 41);
  // 笔：0.2–0.8 从右上角进来，3.0 起抬走
  const inn = sm(.15, .85, t, easeOutQuint), out = sm(3, 3.8, t, easeIn), nib = [lerp(1500, 1000, inn) + out * 500, lerp(-300, 372, inn) - out * 700], a = -.95;
  // 墨滴：在笔尖长大，1.2 起下落，1.55 落到纸上
  const grow = sm(.8, 1.2, t), fall = sm(1.2, splat, t, easeIn);
  if (t < splat && grow > 0) { const dy = fall * (by - nib[1] - 8), sy = 1 + fall * 1.2; fillPts(c, ellPts(lerp(nib[0], bx, fall), nib[1] + 8 + dy, 9 * grow, 9 * grow * sy, 0, 18), K.ink); }
  // 墨团：炸开 → 平静下来，长出管线
  if (t >= splat) { const u = t - splat, R = 118 * easeOutExpo(clamp(u / .35, 0, 1)) + 8 * sm(.4, 1.4, u), wild = sm(0, .12, u) * (1 - sm(.45, 1.5, u));
    s1Spatter(c, bx, by, 118, sm(0, .25, u, easeOutQuint), 71);
    stroke(c, S1DESKCORD, { w: 4.5, p: sm(2.5, 4.4, t, easeInOutSine), seed: 17 + tick(t, 8), taper: .08, smooth: false, rough: .25 });
    s1Blot(c, bx, by, R, { wild, seed: 5, t });
    const fade = 1 - sm(4.55, 4.95, tau); c.save(); c.globalAlpha *= fade;
    eyeLines(c, bx, by, R * .52, { lid: sm(2.75, 3.5, t), open: 0, seed: 81 + tick(t, 8) }); c.restore(); }
  s1Pen(c, nib[0], nib[1], a, 91 + tick(t, 8));
  caption(c, '姐姐，爱是什么？', tau, .35, { t1: 4.6 }); }

// ===================== 镜头 B：书架走廊 =====================
const S1BOOKS = new Map();
function s1Books(bay, side, row) { const key = `${bay}|${side}|${row}`; if (S1BOOKS.has(key)) return S1BOOKS.get(key);
  const r = rng(bay * 131 + side * 17 + row * 7 + 3), out = []; let z = bay + .03, i = 0;
  while (z < bay + .97) { const th = .03 + r() * .05; if (r() < .2) { z += th * (1 + r() * 2); continue; } out.push({ i: i++, z0: z, z1: Math.min(bay + .97, z + th * .82), h: .42 + r() * .45, band: r() < .5 ? .12 + r() * .55 : -1, j: r(), hollow: r() < .3 }); z += th; }
  S1BOOKS.set(key, out); return out; }
const s1RowY = row => { const top = -1.46 + row * .41; return [top, top + .37]; };
const s1Cam = tau => (tau - S1.B) * S1.speed;
const s1P = (x, y, zr) => [S1.vp[0] + x * S1.F / zr, S1.vp[1] + y * S1.F / zr];
// 被吸走的书：时刻、哪一侧、哪一层
const S1FLY = Array.from({ length: 14 }, (_, k) => { const te = 5.95 + k * .3, side = k % 2 ? 1 : -1, row = [2, 1, 3, 4, 2, 0, 3, 1, 4, 2, 3, 1, 2, 4][k], bay = Math.floor(s1Cam(te) + 2.1 + (k % 3) * .4);
  const books = s1Books(bay, side, row), b = books[Math.floor(books.length * (.3 + .4 * hash(k, 5)))]; return { te, side, row, bay, b }; });
const s1Taken = (bay, side, row, b, t) => S1FLY.some(f => f.bay === bay && f.side === side && f.row === row && f.b === b && t >= f.te);
function s1BookQuad(side, row, b, cz) { const [top, bot] = s1RowY(row), yt = bot - b.h * (bot - top), x = side * S1.wall, z0 = b.z0 - cz, z1 = b.z1 - cz; if (z0 < .28) return null;
  return [s1P(x, bot, z0), s1P(x, yt, z0), s1P(x, yt, z1), s1P(x, bot, z1)]; }
// s1FloorCord：走廊里拖在觉之瞳身后的那根线，贴着地板。靠近眼睛的一段是直的，越往后（越靠近镜头）越乱，
// 线在世界里是固定的，镜头往前走时它往后退；近处线粗，远处线细。
const S1ZRE = S1.F / (S1.eye[1] - S1.vp[1]);
function s1FloorCord(c, tau, eyX, eyY, R) { const cz = s1Cam(tau), zE = cz + S1ZRE, pts = [[eyX - R * .62, eyY + R * .55]];
  for (let d = .04; d <= 1.6; d += .004) { const sig = zE - d, A = .34 * Math.pow(clamp(d / 1.25, 0, 1), 1.4), tb = S1.B + (sig - S1ZRE) / S1.speed, x0 = (Math.sin(tb * 1.3) * 10 - R * .62) * S1ZRE / S1.F;
    const x = x0 + A * (noise1(sig * 6, 21) + .8 * noise1(sig * 13, 22)), z = sig + A * .9 * (noise1(sig * 6 + 40, 23) + .8 * noise1(sig * 13 + 40, 24)), zr = z - cz;
    if (zr < .3) break; pts.push(s1P(x, 1, zr)); }
  if (pts.length > 2) stroke(c, pts, { w: 4, seed: 19 + tick(tau, 8), taper: .04, smooth: true, rough: .2, wfn: f => 1 + f * 1.6 }); }
function s1Corridor(c, tau) { const t = twos(tau), cz = s1Cam(tau), [ex, ey] = S1.eye; setView(null); inkBg(c);
  // 地板：暖白纸，横向的地板缝跟着镜头往后退
  const zn = .3, zf = S1.zEnd - cz, fl = [s1P(-S1.wall, 1, zn), s1P(-S1.wall, 1, zf), s1P(S1.wall, 1, zf), s1P(S1.wall, 1, zn)];
  block(c, fl, K.paper, { smooth: false, amp: 1, seed: 3, grain: .9 });
  for (let z = Math.ceil(cz * 2) / 2; z < S1.zEnd; z += .5) { const zr = z - cz; if (zr < zn) continue; const [x0, y0] = s1P(-S1.wall, 1, zr), [x1] = s1P(S1.wall, 1, zr);
    stroke(c, [[x0, y0], [x1, y0]], { w: clamp(9 / zr, .8, 9), seed: Math.round(z * 2), smooth: false, dry: .3, al: .9 }); }
  // 尽头：一扇亮着的门，几道光
  const [dx0, dy0] = s1P(-.34, -.35, zf), [dx1, dy1] = s1P(.34, 1, zf);
  for (let k = 0; k < 13; k++) { const a = -Math.PI / 2 + (k - 6) * .2, L = 70 + hash(k, 3) * 90; scratch(c, [[CX + Math.cos(a) * 30, dy0 - 14 + Math.sin(a) * 30], [CX + Math.cos(a) * L, dy0 - 14 + Math.sin(a) * L]], { w: 1.6, al: .55, seed: k + tick(t, 6) }); }
  block(c, rectPts(dx0, dy0, dx1 - dx0, dy1 - dy0), K.paper, { smooth: false, amp: .8, seed: 9 });
  // 两侧书架：从远到近画，书是白色的书脊
  for (let bay = Math.floor(cz) + 13; bay >= Math.floor(cz); bay--) { if (bay >= S1.zEnd) continue;
    for (const side of [-1, 1]) for (let row = 0; row < 6; row++) for (const b of s1Books(bay, side, row)) { if (s1Taken(bay, side, row, b, t)) continue; const q = s1BookQuad(side, row, b, cz); if (!q) continue;
      const jx = (b.j - .5) * 1.5; q[1][0] += jx; q[2][0] += jx; if (b.hollow) { c.strokeStyle = K.paper; c.lineWidth = Math.max(.7, 4.5 / (b.z0 - cz)); c.stroke(polyPath(q)); continue; } fillPts(c, q, K.paper);
      if (b.band > 0 && Math.abs(q[3][0] - q[0][0]) > 4) { const u = b.band, v = u + .08; fillPts(c, [[q[0][0], lerp(q[0][1], q[1][1], u)], [q[0][0], lerp(q[0][1], q[1][1], v)], [q[3][0], lerp(q[3][1], q[2][1], v)], [q[3][0], lerp(q[3][1], q[2][1], u)]], K.ink); } }
    // 每隔两格一盏吊灯
    if (bay % 2 === 0) { const zr = bay + .5 - cz; if (zr > .6) { const [lx, ly] = s1P(0, -1.2, zr), s = S1.F / zr * .16;
      stroke(c, [[lx, ly - s * 3], [lx, ly]], { w: Math.max(1, s * .08), color: K.paper, seed: bay, smooth: false, al: .7 });
      block(c, [[lx - s * .45, ly], [lx + s * .45, ly], [lx + s, ly + s * .7], [lx - s, ly + s * .7]], K.paper, { smooth: false, amp: .6, seed: bay + 1, grain: 0 });
      for (let k = 0; k < 5; k++) { const a = Math.PI / 2 + (k - 2) * .32; scratch(c, [[lx + Math.cos(a) * s * 1.1, ly + s * .7 + Math.sin(a) * s * .5], [lx + Math.cos(a) * s * 2.6, ly + s * .7 + Math.sin(a) * s * 1.8]], { w: Math.max(.8, s * .06), al: .5, seed: bay * 7 + k }); } } } }
  // 眼睛：墨团贴着地板往前滑，身后拖一道墨迹
  const absorbed = S1FLY.filter(f => t >= f.te + .55).length, last = Math.max(-9, ...S1FLY.filter(f => t >= f.te + .55).map(f => f.te + .55));
  const R = 62 + absorbed * 2.6 + 10 * Math.exp(-(t - last) * 7) * (t > last ? 1 : 0), bob = Math.sin(t * 5) * 3, eyX = ex + Math.sin(t * 1.3) * 10, eyY = ey + bob;
  const endGrow = sm(10.35, 11.15, tau, easeIn), Rb = R * (1 + endGrow * 26);
  s1FloorCord(c, tau, eyX, eyY, R);
  s1Blot(c, eyX, eyY, Rb, { wild: .05, seed: 7, t });
  c.save(); c.globalAlpha *= 1 - sm(10.3, 10.6, tau); eyeLines(c, eyX, eyY, R * .52, { open: 0, seed: 83 + tick(t, 8) }); c.restore();
  // 飞过来的书
  for (const f of S1FLY) { const u = (t - f.te) / .55; if (u < 0 || u >= 1) continue; const q = s1BookQuad(f.side, f.row, f.b, s1Cam(f.te)); if (!q) continue;
    const p0 = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], hh = Math.abs(q[0][1] - q[1][1]), ww = Math.max(8, hh * .28), e = easeIn(u), [x, y] = arc(p0, [eyX, eyY], e, 140), k = lerp(1, .15, e);
    c.save(); c.translate(x, y); c.rotate(f.side * e * 2.4 * Math.PI); c.scale(k, k); block(c, rectPts(-ww / 2, -hh / 2, ww, hh), K.paper, { smooth: false, amp: .8, seed: f.bay, grain: 0 });
    outline(c, rectPts(-ww / 2, -hh / 2, ww, hh), { w: 2.4, seed: f.bay + 1, smooth: false }); stroke(c, [[-ww / 2, -hh * .2], [ww / 2, -hh * .2]], { w: 3, seed: f.bay + 2, smooth: false }); c.restore(); }
  caption(c, '不知道。', tau, 5.5, { t1: 10.5 }); }

// ===================== 镜头 C：藤蔓、心形与蔷薇 =====================
// s1Rose：白线蔷薇。open 0..1 开的程度，fill 填色（null 不填），al 整朵的透明度
function s1Rose(c, x, y, r, o = {}) { const { open = 1, fill = null, fillAl = 1, seed = 1, t = 0, w = 2.6, rot = 0, al = 1 } = o; if (open <= 0 || al <= 0) return; c.save(); c.globalAlpha *= al; const sd = seed + tick(t, 8), R = r * (.3 + .7 * easeOutBack(clamp(open, 0, 1)));
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
const S1ROSES = [{ side: -1, u: .74, r: 84, at: 13.1 }, { side: 1, u: .7, r: 76, at: 13.35 }, { side: 1, u: .3, r: 56, at: 12.7 }, { side: -1, u: .18, r: 50, at: 12.4 }, { side: 1, u: .92, r: 60, at: 13.6 }];
function s1Vines(c, tau) { const t = twos(tau), sd = tick(t, 8); setView({ x: CX, y: CY - 20 * sm(11.2, 16.6, tau), zoom: 1.02 + .05 * sm(11.2, 16.6, tau) }); inkBg(c);
  const grow = sm(11.35, 13.9, t, easeInOutSine);
  S1VINES.forEach((pts, j) => { const L = pathLength(pts); scratch(c, pts, { w: 7, p: grow, seed: 100 + j * 9 + sd, dry: .05, taper: .12 });
    for (let k = 1; k < 26; k++) { const u = k / 26; if (u > grow - .02) break; const q = pathAt(pts, u), side = k % 2 ? 1 : -1, n = [Math.cos(q.a + side * Math.PI / 2), Math.sin(q.a + side * Math.PI / 2)];
      if (k % 4 === 1) { const lf = [q.x + n[0] * 34 + Math.cos(q.a) * 10, q.y + n[1] * 34 + Math.sin(q.a) * 10], m = [(q.x + lf[0]) / 2, (q.y + lf[1]) / 2], off = [Math.cos(q.a) * 12, Math.sin(q.a) * 12];
        scratch(c, [[q.x, q.y], [m[0] + off[0], m[1] + off[1]], lf], { w: 2.4, seed: sd + k * 3 + j }); scratch(c, [[q.x, q.y], [m[0] - off[0], m[1] - off[1]], lf], { w: 2.4, seed: sd + k * 3 + j + 1 }); scratch(c, [[q.x, q.y], lf], { w: 1.4, seed: sd + k * 5, al: .7 }); }
      else fillPts(c, [[q.x + n[0] * 3 - Math.cos(q.a) * 5, q.y + n[1] * 3 - Math.sin(q.a) * 5], [q.x + n[0] * 15, q.y + n[1] * 15], [q.x + n[0] * 3 + Math.cos(q.a) * 5, q.y + n[1] * 3 + Math.sin(q.a) * 5]], K.paper); } });
  // 蔷薇：沿藤蔓开，中间一朵最大，接住那滴暗红
  S1ROSES.forEach((ro, k) => { const q = pathAt(S1VINES[ro.side > 0 ? 0 : 1], ro.u); s1Rose(c, q.x, q.y, ro.r, { open: sm(ro.at, ro.at + .7, t), seed: 200 + k * 13, t, rot: k }); });
  const hit = 15.25, red = sm(hit, hit + .2, t), grey = sm(15.8, 16.5, t), fillCol = mix(K.rose, '#6a655e', grey);
  s1Rose(c, S1H.x, S1H.y + 100, 118, { open: sm(13.7, 14.6, t), fill: red > 0 ? fillCol : null, fillAl: red, seed: 300, t, w: 4 });
  if (t >= 14.85 && t < hit) { const u = sm(14.85, hit, t, easeIn), y = lerp(-30, S1H.y + 100, u); fillPts(c, ellPts(S1H.x, y, 11, 11 * (1 + u * 1.4), 0, 18), K.rose); }
  if (t >= hit && t < hit + .5) { const u = (t - hit) / .5; stroke(c, ellPts(S1H.x, S1H.y + 100, 120 + u * 110, (120 + u * 110) * .9, 0, 50), { close: true, w: 3 * (1 - u), color: K.rose, dry: .4, seed: 7 + tick(t, 12), al: 1 - u }); }
  caption(c, '那我们一起找！', tau, 11.45, { t1: 16.1 }); }

// ===================== 镜头 D：售卖信息，然后封面从水墨晕回彩色 =====================
// 字先居中写出；19.9 起整块左移，排进左边三分之二；右边三分之一墨迹晕开露出封面水墨版，22.4 起颜色从封面上的觉之瞳慢慢晕开。
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
  c.restore(); outline(c, rectPts(x0 - 10, y0 - 10, w + 20, h + 20), { w: 3, color: K.paper, al: .8 * reveal, seed: 9 + tick(t, 6), smooth: false, dry: .2 }); c.restore(); }
function s1Sale(c, tau, fade = 1) { const t = twos(tau); setView(null); inkBg(c); c.save(); c.globalAlpha *= fade;
  const move = sm(19.9, 20.75, tau, easeInOutQuint), sizes = [132, 58, 58], lines = ['三眼的幻恋', ...S1.sale], ws = lines.map((l, k) => zhWidth(c, l, sizes[k], ZH, k ? 400 : 500));
  const bw = Math.max(...ws), left = 660 - bw / 2 + 40, ys = [[430, 390], [600, 560], [690, 652]];
  lines.forEach((l, k) => { const x = lerp(CX - ws[k] / 2, left, move), y = lerp(ys[k][0], ys[k][1], move), p = k ? writeP(t, 17.55 + (k - 1) * .55, l, .03) : writeP(t, 16.75, l, .16);
    zh(c, l, x, y, { size: sizes[k], weight: k ? 400 : 500, color: K.paper, p, seed: 7 + k, tilt: k ? .015 : .02, jitter: .015 });
    if (k === 0) s1Rose(c, x - 90, y - 48, 44, { open: 1, fill: '#6a655e', fillAl: 1, seed: 300, t, w: 2.6, al: p });
    if (k === 2) { const u0 = x + zhWidth(c, '在现场', 58), u1 = u0 + zhWidth(c, 'cos恋恋签售', 58); stroke(c, [[u0, y + 22], [lerp(u0, u1, .5), y + 28], [u1, y + 21]], { w: 5, color: K.rose, p: sm(18.75, 19.25, t), seed: 31 + tick(t, 8), dry: .15 }); } });
  s1Cover(c, tau); c.restore(); }

// ===================== 镜头 E：一条紧闭的眼皮线拉成隙间，裂开 =====================
function s1Bow(c, x, y, s, dir, seed) { const T = tf(x, y, s, 0, dir);
  for (const v of [-1, 1]) outline(c, M(T, [[0, 0], [.9, v * .75], [1.25, v * .35], [1.1, v * .05]]), { w: 3, color: K.paper, seed: seed + v, rough: .3 });
  scratch(c, M(T, [[0, 0], [.55, .5], [.7, 1.25]]), { w: 3, seed: seed + 3 }); scratch(c, M(T, [[0, 0], [.2, .6], [.1, 1.35]]), { w: 3, seed: seed + 4 });
  fillPts(c, M(T, ellPts(0, 0, .16, .16, 0, 12)), K.paper); }
function s1Gap(c, tau) { const t = twos(tau), E = S1.E, dark = sm(E, E + .35, tau), lid = sm(E + .15, E + .55, t), u = sm(E + .55, E + .95, tau, easeInOutSine), open = sm(E + .95, S1.END - .04, tau, easeIn), sd = tick(t, 8);
  s1Sale(c, tau, 1 - dark); const cy = CY, r0 = 90, half = lerp(r0, 760, u) + open * 1900, h = open * 1700;
  const dep = r0 * .2 * lerp(1, .35, u) * (1 - open), lift = r0 * .14 * (1 - u), xs = Array.from({ length: 41 }, (_, k) => -1 + k / 20), curve = sgn => xs.map(v => [CX + v * half, cy - lift + (sgn * h + dep) * (1 - v * v)]);
  if (open > 0) { const lens = [...curve(-1), ...curve(1).reverse()]; fillPts(c, lens, S1.sukima); c.save(); c.clip(polyPath(lens)); texture(c, null, 'paper', .35); c.restore(); }
  if (u <= 0) eyeLines(c, CX, cy, r0, { lid, open: 0, seed: 83 + sd });
  else { scratch(c, curve(-1), { w: lerp(10, 7, u), seed: 400 + sd, taper: .15 }); if (open > 0) scratch(c, curve(1), { w: 7, seed: 410 + sd, taper: .15 });
    if (u < .5) for (let k = 0; k < 5; k++) { const v = -.62 + k * .31, b = [CX + v * half, cy - lift + dep * (1 - v * v)]; stroke(c, [b, [b[0] + v * r0 * .3, b[1] + r0 * .24]], { w: 5, color: alpha(K.paper, 1 - u * 2), seed: 90 + k + sd, taper: .6, smooth: false }); } }
  const bow = sm(.55, 1, u, easeOutBack) * (1 - open); if (bow > .01) { s1Bow(c, CX - half, cy - lift, 46 * bow, -1, 420 + sd); s1Bow(c, CX + half, cy - lift, 46 * bow, 1, 430 + sd); } }

scene({ order: 1, key: 'sanyan', name: '三眼的幻恋', dur: S1.END, fn: (c, tau) => {
  if (tau < S1.B) s1Desk(c, tau);
  else if (tau < S1.C) s1Corridor(c, tau);
  else if (tau < S1.D) s1Vines(c, tau);
  else if (tau < S1.D + 1 / 12) { setView(null); inkBg(c); }
  else if (tau < S1.E) s1Sale(c, tau);
  else if (tau < S1.END - .1) s1Gap(c, tau);
  else handoffSukima(c);
} });
