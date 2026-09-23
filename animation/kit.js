'use strict';
// 北交摊位短片的画具。画风照 kevin_t_ngo 的「What do you love?」：蜡笔质感的剪纸块、白色撕纸毛边、
// 横线笔记本纸上的蓝色手写字、纯色卡纸底，只有五官用黑线。坐标是引擎的逻辑单位（16:9 下 1920×1080）。
// 角色和电车用局部单位：脚底或轨面是 (0,0)，y 向下为正。

const ZH = 'Xiaolai';
_photoLoads.push(document.fonts.load(`80px ${ZH}`, '北京交通大学'), document.fonts.load('500 40px NSans', '隙间月影'),
  document.fonts.load('400 40px NSans', '隙间月影'), document.fonts.load('400 40px SMono', 'SUKIMA'), document.fonts.load('700 40px SMono', 'SUKIMA'));

const K = {
  ink: '#241e2c', paper: '#fbf8f0', note: '#fbf7ea', noteLine: '#9cbfe4', noteRed: '#e48c8c', marker: '#2b5bbf',
  navy: '#2e3c7e', navyDeep: '#232d66', mustard: '#f0c24c', sky: '#a9d2ee', tan: '#dcb27d', mint: '#c3e2cb', rose: '#f4c6cb', lilac: '#d3c4ea', cream: '#f3ead6',
  star: '#f7d65a', skin: '#f9d5b8', blush: '#f4939f', heart: '#ef6f8c', heart2: '#e2465f', heart3: '#f59ab0',
};

// ===================== 镜头登记 =====================
// 每个 scenes/*.js 调一次 scene({ order, key, name, dur, fn })，film.js 按 order 排成时间线。
// 镜头之间靠同向运镜衔接：开头 .45 秒镜头从左边甩进来，结尾 .4 秒甩出到右边（whip），电车一律从左往右开。
const SCENES = [];
function scene(o) { SCENES.push(o); }
// stubCard: 还没做的镜头先放一张写着镜头名的卡片，保证全片时长和顺序可以先跑通
function stubCard(c, tau, title, color = K.cream) { setView({ x: CX + whip(tau, 99, { inn: .45, out: 0, dist: 760 }), y: CY }); paperBg(c, color, { seed: 9 }); notebook(c, CX, CY, 900, 420, { rot: -.02, content: g => { zh(g, title, 0, -20, { size: 84, align: 'center', color: K.marker }); zh(g, '施工中', 0, 100, { size: 48, align: 'center', color: K.ink }); } }); }

// ===================== 几何 =====================
const M = (F, pts) => pts.map(p => F(p[0], p[1]));
function tf(x, y, s, rot = 0, dir = 1) { const ca = Math.cos(rot), sa = Math.sin(rot); return (u, v) => { const X = u * s * dir, Y = v * s; return [x + X * ca - Y * sa, y + X * sa + Y * ca]; }; }
function densify(pts, step = 4, close = true) { const out = [], n = pts.length, segs = close ? n : n - 1;
  for (let i = 0; i < segs; i++) { const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < m; k++) out.push([lerp(a[0], b[0], k / m), lerp(a[1], b[1], k / m)]); }
  if (!close) out.push(pts[n - 1].slice()); return out; }
function ringArea(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
// offsetRing: 闭合轮廓沿外法线推出 f(k, 弧长) 个单位（负数向内）
function offsetRing(q, f) { const n = q.length, sg = ringArea(q) > 0 ? 1 : -1, out = new Array(n); let s = 0;
  for (let k = 0; k < n; k++) { if (k) s += Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]); const a = q[(k + n - 1) % n], b = q[(k + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, d = f(k, s);
    out[k] = [q[k][0] + sg * ty / l * d, q[k][1] - sg * tx / l * d]; } return out; }
// capsule: 线段 a-b 外面包一圈半径 r（手臂、腿、伞柄）
function capsule(a, b, r, n = 8) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), pts = [];
  for (let k = 0; k <= n; k++) { const t = ang - Math.PI / 2 - k / n * Math.PI; pts.push([a[0] + Math.cos(t) * r, a[1] + Math.sin(t) * r]); }
  for (let k = 0; k <= n; k++) { const t = ang + Math.PI / 2 - k / n * Math.PI; pts.push([b[0] + Math.cos(t) * r, b[1] + Math.sin(t) * r]); } return pts; }
function heartPts(x, y, s, rot = 0) { const out = []; for (let k = 0; k < 28; k++) { const a = k / 28 * TAU, u = Math.pow(Math.sin(a), 3), v = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16; out.push([x + s * (u * Math.cos(rot) - v * Math.sin(rot)), y + s * (u * Math.sin(rot) + v * Math.cos(rot))]); } return out; }
function starPts(x, y, r, rot = 0, n = 4, inner = .38) { const out = []; for (let k = 0; k < n * 2; k++) { const a = rot - Math.PI / 2 + k / (n * 2) * TAU, rr = k % 2 ? r * inner : r; out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return out; }
function fillPts(c, pts, col, al = 1) { c.save(); c.globalAlpha *= al; c.fillStyle = col; c.fill(polyPath(pts)); c.restore(); }
// inkLine: 马克笔线，圆头，粗细一致（五官、轨道、电线）。p 0..1 画出一部分。
function inkLine(c, pts, w = 4, col = K.ink, o = {}) { const { p = 1, close = false, smooth = true, al = 1 } = o; if (p <= 0 || pts.length < 2) return; let q = smooth && pts.length > 2 ? spline(pts, 3, close) : pts;
  if (p < 1) { const L = pathLength(q); let acc = 0; for (let k = 1; k < q.length; k++) { const d = Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]); if (acc + d >= L * p) { const t = (L * p - acc) / (d || 1); q = [...q.slice(0, k), [lerp(q[k - 1][0], q[k][0], t), lerp(q[k - 1][1], q[k][1], t)]]; break; } acc += d; } }
  c.save(); c.globalAlpha *= al; c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); q.forEach((pt, k) => k ? c.lineTo(pt[0], pt[1]) : c.moveTo(pt[0], pt[1])); if (close && p >= 1) c.closePath(); c.stroke(); c.restore(); }

// ===================== 材质：蜡笔纹理与剪纸 =====================
// 一张 512 单位见方、可平铺的蜡笔笔触纹理：浅色和深色的短斜线叠在透明底上，盖到任何颜色上都像蜡笔涂过。
let _crayon = null, _crayonS = 0;
function crayonPat(c) {
  if (_crayon && _crayonS === S) return _crayon;
  const T = 512, px = Math.round(T * S), g0 = document.createElement('canvas'); g0.width = g0.height = px;
  const g = g0.getContext('2d'); g.scale(px / T, px / T); g.lineCap = 'round'; const r = rng(71);
  for (let k = 0; k < 4200; k++) { const x = r() * T, y = r() * T, cross = r() < .28, a = (cross ? .95 : -.4) + (r() - .5) * .55, L = 10 + r() * 34, light = r() < .56, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L;
    g.strokeStyle = light ? `rgba(255,255,255,${.035 + r() * .1})` : `rgba(35,18,8,${.02 + r() * .05})`; g.lineWidth = 1.2 + r() * 3;
    for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) { if (Math.max(x, ex) + dx < -4 || Math.min(x, ex) + dx > T + 4 || Math.max(y, ey) + dy < -4 || Math.min(y, ey) + dy > T + 4) continue; g.beginPath(); g.moveTo(x + dx, y + dy); g.lineTo(ex + dx, ey + dy); g.stroke(); } }
  for (let k = 0; k < 2600; k++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.2)' : 'rgba(35,18,8,.1)'; g.fillRect(r() * T, r() * T, .7 + r() * 1.3, .7 + r() * 1.3); }
  _crayon = c.createPattern(g0, 'repeat'); _crayonS = S; return _crayon;
}
function texFill(c, path, al, ox = 0, oy = 0) { if (al <= 0) return; const p = crayonPat(c); p.setTransform(new DOMMatrix().translate(ox, oy).scale(1 / S)); c.save(); c.globalAlpha *= al; c.fillStyle = p; c.fill(path); c.restore(); }
// cut: 一块剪纸。外圈是撕开的白色毛边，下面压一层投影，色块本身边缘有细小的不齐，表面盖蜡笔纹理。
//   rim 毛边宽度（0 = 剪刀剪的，无白边）  tex 纹理浓度  anchor 纹理跟着走的点（让纹理随物体移动）  inner(c) 在色块内部再画东西
function cut(c, pts, color, o = {}) {
  const { rim = 5, seed = 1, tex = .8, shadow = .16, rimCol = K.paper, smooth = true, anchor = null, al = 1, inner = null, jag = 1 } = o;
  if (!pts || pts.length < 3) return null;
  let base = smooth ? spline(pts, 5, true) : pts; if (base.length > 2 && Math.hypot(base[0][0] - base[base.length - 1][0], base[0][1] - base[base.length - 1][1]) < .01) base = base.slice(0, -1);
  const q = densify(base, 3.2, true), [ax, ay] = anchor || q[0];
  const body = polyPath(jag ? offsetRing(q, (k, s) => jag * noise1(s / 6, seed + 3)) : q);
  const outer = rim > 0 ? polyPath(offsetRing(q, (k, s) => rim * (.6 + .4 * noise1(s / 13, seed)) + rim * 1.3 * Math.pow(hash(k, seed + 9), 9))) : null;
  c.save(); c.globalAlpha *= al;
  if (shadow > 0) { c.save(); c.translate(2.2, 3.2); c.fillStyle = `rgba(30,22,52,${shadow})`; c.fill(outer || body); c.restore(); }
  if (outer) { c.fillStyle = rimCol; c.fill(outer); }
  c.fillStyle = color; c.fill(body);
  texFill(c, body, tex, ax + hash(seed, 1) * 512, ay + hash(seed, 2) * 512);
  if (inner) { c.save(); c.clip(body); inner(c); c.restore(); }
  c.restore(); return body;
}
// paperBg: 满屏一张有蜡笔涂痕的彩色卡纸。在 setView 之后调用，画完切到镜头坐标。
function paperBg(c, color, o = {}) { const { seed = 3, tex = .75, blotch = .4, par = .35 } = o; resetT(c); const vx = VIEW ? (VIEW.x - CX) * par : 0, vy = VIEW ? (VIEW.y - CY) * par : 0;
  c.fillStyle = color; c.fillRect(-10, -10, W + 20, H + 20); const r = rng(seed);
  for (let k = 0; k < 8; k++) { const x = r() * W * 1.4 - W * .2 - vx, y = r() * H - vy, R = 260 + r() * 460, col = r() < .55 ? tint(color, .2) : shade(color, .1), g = c.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, alpha(col, blotch)); g.addColorStop(1, alpha(col, 0)); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  texFill(c, rectPath(-10, -10, W + 20, H + 20), tex, hash(seed, 1) * 512 - vx, -vy);
  viewT(c); }
// strip: 一条横向撕开的纸（地面、站台、夜空的分层），上沿是毛边
function strip(c, x0, x1, yTop, yBot, color, o = {}) { const { seed = 1, amp = 9 } = o, top = []; for (let x = x0; x <= x1 + .1; x += 22) top.push([x, yTop + noise1(x / 230, seed) * amp + noise1(x / 60, seed + 4) * amp * .25]);
  return cut(c, [...top, [x1, yBot], [x0, yBot]], color, { rim: 6, seed, smooth: false, shadow: .12, ...o, anchor: [x0, yTop] }); }
// notebook: 横线笔记本纸，上沿撕开，左边红色竖线。content(c) 在纸的坐标里写字（原点是纸心）。
function notebook(c, x, y, w, h, o = {}) { const { rot = 0, seed = 5, sp = 46, al = 1, content = null, shadow = .24 } = o; c.save(); c.translate(x, y); c.rotate(rot);
  const top = []; for (let u = -w / 2; u <= w / 2 + .1; u += 9) top.push([u, -h / 2 + (hash(Math.round(u * 7), seed) - .5) * 5 + noise1(u / 45, seed) * 4]);
  cut(c, [...top, [w / 2, h / 2], [-w / 2, h / 2]], K.note, { rim: 0, smooth: false, shadow, tex: .22, seed, al, anchor: [-w / 2, -h / 2], jag: .5,
    inner: g => { g.lineWidth = 1.8; g.strokeStyle = alpha(K.noteLine, .95); for (let yy = -h / 2 + sp * 1.25; yy < h / 2 - 4; yy += sp) { g.beginPath(); g.moveTo(-w / 2, yy); g.lineTo(w / 2, yy); g.stroke(); }
      g.strokeStyle = alpha(K.noteRed, .85); g.beginPath(); g.moveTo(-w / 2 + w * .085, -h / 2); g.lineTo(-w / 2 + w * .085, h / 2); g.stroke(); } });
  if (content) { c.save(); c.globalAlpha *= al; content(c); c.restore(); }
  c.restore(); }
// tape: 半透明纸胶带
function tape(c, x, y, w, h = 34, rot = 0, seed = 1, color = 'rgba(238,226,190,.86)') { const r = rng(seed), pts = [];
  for (let k = 0; k <= 5; k++) pts.push([-w / 2 + (r() - .5) * 6, -h / 2 + h * k / 5]); for (let k = 5; k >= 0; k--) pts.push([w / 2 + (r() - .5) * 6, -h / 2 + h * k / 5]);
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = color; c.fill(polyPath(pts)); texFill(c, polyPath(pts), .5, seed * 40, 0); c.restore(); }
// star / dashes / heart: 小装饰（黄色四角星、放射短线、剪纸爱心）
function star(c, x, y, r, o = {}) { cut(c, starPts(x, y, r, o.rot || 0), o.color || K.star, { rim: 0, shadow: 0, tex: .3, seed: o.seed || 1, jag: .4, smooth: false, al: o.al ?? 1 }); }
function dashes(c, x, y, R, n, o = {}) { const { len = 22, w = 4, col = K.ink, p = 1, rot = 0, spread = TAU, al = 1 } = o; if (p <= 0) return;
  for (let k = 0; k < n; k++) { const a = rot + (spread >= TAU ? k / n * TAU : -spread / 2 + spread * k / Math.max(1, n - 1)), r1 = R + len * p; inkLine(c, [[x + Math.cos(a) * R, y + Math.sin(a) * R], [x + Math.cos(a) * r1, y + Math.sin(a) * r1]], w, col, { smooth: false, al }); } }
function heart(c, x, y, s, col = K.heart, o = {}) { return cut(c, heartPts(x, y, s, o.rot || 0), col, { rim: o.rim ?? Math.max(3, s * .12), seed: o.seed || 1, shadow: .16, anchor: [x, y], al: o.al ?? 1 }); }
// grass: 一小丛剪纸草，偶尔带一朵小花
function grass(c, x, y, k = 1, seed = 1) { const r = rng(seed), n = 3 + (r() * 3 | 0);
  for (let j = 0; j < n; j++) { const bx = x + (j - n / 2) * 11 * k, h = (26 + r() * 26) * k, lean = (r() - .5) * 18 * k; cut(c, [[bx - 6 * k, y], [bx + lean, y - h], [bx + 6 * k, y]], j % 2 ? '#6aae5e' : '#83c070', { rim: 0, seed: seed * 10 + j, smooth: false, shadow: .12, tex: .5, jag: .4 }); }
  if (r() < .6) { const fx = x + (r() - .5) * 20 * k, fy = y - (40 + r() * 12) * k; for (let q = 0; q < 5; q++) { const a = q / 5 * TAU; fillPts(c, ellPts(fx + Math.cos(a) * 6 * k, fy + Math.sin(a) * 6 * k, 5 * k, 5 * k, 0, 10), '#fff6f0'); } fillPts(c, ellPts(fx, fy, 3.5 * k, 3.5 * k, 0, 8), '#f2b93b'); } }
// cloud: 报纸拼贴的云
function cloud(c, x, y, w, h, seed) { const r = rng(seed), n = 3 + (r() * 2 | 0), pts = [[x + w / 2, y + h / 2], [x - w / 2, y + h / 2]];
  for (let j = 0; j < n; j++) { const cx = x - w / 2 + w * (j + .5) / n, rr = w / n * (.62 + r() * .25), cy = y + h / 2 - rr * (.45 + (j === 0 || j === n - 1 ? 0 : .5) * (.6 + r() * .6)); for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; pts.push([cx + Math.cos(a) * rr, Math.min(y + h / 2, cy + Math.sin(a) * rr)]); } }
  cut(c, pts, '#f4f1ea', { rim: 5, rimCol: '#ffffff', seed, smooth: false, shadow: .08, tex: .4, inner: g => squiggleText(g, x - w / 2 + 12, y - h * .9, w - 20, 12, { color: 'rgba(70,70,90,.28)', lineH: 16, amp: 3, seed }) }); }

function handDot(c, p, s) { cut(c, ellPts(p[0], p[1], s * .14, s * .14, 0, 14), K.skin, { rim: 0, seed: 77, shadow: .12, tex: .3 }); }
function motionLinesAt(c, x, y, k) { if (k <= .02) return; for (let j = 0; j < 4; j++) inkLine(c, [[x - 10, y + j * 34], [x - 10 - (90 + j * 25) * k, y + j * 34]], 4, K.ink, { smooth: false, al: .8 }); }

// pop: 以 (x, y) 为中心缩放后画 fn，用于弹出、按下、落地
function pop(c, x, y, k, fn, ky = k) { if (k <= .001 && ky <= .001) return; c.save(); c.translate(x, y); c.scale(k, ky); c.translate(-x, -y); fn(); c.restore(); }

// ===================== 真实素材 =====================
// badge: 吧唧（马口铁徽章）：投影、图、一圈金属边的高光
function badge(c, name, x, y, r, o = {}) { const { sx = 1, sy = 1, rot = 0, shadow = .3, al = 1 } = o, img = PHOTOS[name].img; c.save(); c.globalAlpha *= al;
  c.save(); c.translate(x + r * .05, y + r * .09); c.rotate(rot); c.scale(sx, sy); c.fillStyle = `rgba(30,20,45,${shadow})`; c.beginPath(); c.arc(0, 0, r * 1.01, 0, TAU); c.fill(); c.restore();
  c.translate(x, y); c.rotate(rot); c.scale(sx, sy); c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip(); c.imageSmoothingQuality = 'high'; c.drawImage(img, -r, -r, 2 * r, 2 * r);
  const g = c.createLinearGradient(-r, -r, r * .3, r * .3); g.addColorStop(0, 'rgba(255,255,255,.30)'); g.addColorStop(.55, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-r, -r, 2 * r, 2 * r); c.restore();
  c.lineWidth = Math.max(2, r * .03); c.strokeStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, r * .985, 0, TAU); c.stroke(); c.restore(); }
// pasted: 一张印出来的素材，白边卡纸、投影、纸胶带。k 是弹出缩放。
function pasted(c, name, x, y, h, o = {}) { const { rot = 0, border = 12, shadow = .26, al = 1, seed = 1, tapes = [[.5, 0, .02]], k = 1 } = o, pl = place(name, { x, y, h, rot });
  pop(c, x, y, k, () => { c.save(); c.globalAlpha *= al; c.save(); c.translate(x, y); c.rotate(rot);
    cut(c, rectPts(-pl.w / 2 - border, -pl.h / 2 - border, pl.w + border * 2, pl.h + border * 2), '#fdfcf7', { rim: 0, smooth: false, shadow, tex: .15, seed, jag: .6, anchor: [x, y] }); c.restore();
    photo(c, pl, { shadow: 0 });
    tapes.forEach(([u, v, tr], j) => { const [tx, ty] = on(pl, u, v); tape(c, tx, ty, Math.min(150, pl.w * .3), 36, rot + tr, seed + j * 7); }); c.restore(); });
  return pl; }

// ===================== 中文手写字 =====================
// zh: 逐字写出。p 0..1 是进度。mode 'write' 每个字从左往右擦出来，'pop' 每个字弹出来。每个字有固定的小倾斜和上下错位。
function zh(c, str, x, y, o = {}) {
  const { size = 72, color = K.ink, p = 1, align = 'left', seed = 3, rot = 0, lh = 1.3, font = ZH, weight = 400, tilt = .05, jitter = .035, mode = 'write', outline = null, ow = .2, al = 1 } = o;
  const lines = String(str).split('\n'), total = lines.reduce((a, l) => a + [...l].length, 0), shown = clamp(p, 0, 1) * total; let idx = 0; if (shown <= 0) return;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.font = `${weight} ${size}px ${font}`; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; const r = rng(seed);
  lines.forEach((line, li) => { const chars = [...line], ws = chars.map(ch => c.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0); let cx = align === 'center' ? -tw / 2 : align === 'right' ? -tw : 0; const cy = li * size * lh;
    chars.forEach((ch, k) => { const a = clamp(shown - idx, 0, 1), jr = (r() - .5) * 2 * tilt, jy = (r() - .5) * 2 * jitter * size; idx++;
      if (a > 0) { c.save(); c.translate(cx + ws[k] / 2, cy + jy); c.rotate(jr);
        if (mode === 'pop') { const sc = .3 + .7 * easeOutBack(a); c.scale(sc, sc); c.globalAlpha *= Math.min(1, a * 2.5); }
        else if (a < 1) { c.beginPath(); c.rect(-ws[k] / 2 - size * .1, -size * 1.1, (ws[k] + size * .2) * a, size * 1.6); c.clip(); }
        if (outline) { c.lineWidth = size * ow; c.strokeStyle = outline; c.strokeText(ch, -ws[k] / 2, 0); }
        c.fillStyle = color; c.fillText(ch, -ws[k] / 2, 0); c.restore(); }
      cx += ws[k]; }); });
  c.restore(); }
// writeP: 从 t0 起每字 per 秒，返回 zh 的进度
const writeP = (t, t0, str, per = .09) => clamp((t - t0) / (per * [...str.replace(/\n/g, '')].length), 0, 1);
// printText: 印刷体（隙间月影段）：不抖、不倾斜
function printText(c, str, x, y, o = {}) { const { size = 40, color = '#111111', font = 'NSans', weight = 400, align = 'left', al = 1, spacing = 0 } = o; if (al <= 0) return; c.save(); c.globalAlpha *= al; c.font = `${weight} ${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; if (spacing) c.letterSpacing = `${spacing}px`; c.fillText(str, x, y); c.restore(); }

// ===================== 动作 =====================
// hop: 从 a 跳到 b。返回位置、身体压扁量（起跳前蹲、空中拉长、落地压扁回弹）
function hop(t, t0, t1, a, b, lift = 90) { const u = clamp((t - t0) / (t1 - t0), 0, 1), [x, y] = arc(a, b, u, lift), air = u > 0 && u < 1;
  const sq = t < t0 ? -.14 * sm(t0 - .16, t0, t) : air ? .1 * Math.sin(u * Math.PI) : -settle(t, t1, { amp: .16, freq: 2.6, decay: 7, phase: Math.PI / 2 });
  return { x, y, sq, air, u }; }
const idle = (t, seed = 1, amp = 2) => Math.sin(t * 2.6 + seed) * amp;   // 站着时身体的轻微起伏

// ===================== Q 版角色 =====================
// chibi: 剪纸小人。头半径 s，脚底在 (x, y)。
//   dir 朝向（1 右 / -1 左）  sq 压扁（hop 给）  tilt 歪头  look [x, y] 视线  eyes open|wide|closed|happy|half  mouth smile|open|o|pout|flat|tongue|cat
//   armL / armR 手臂：数字 = 从下垂开始向外抬的角度（弧度），[x, y] = 手伸向画面上的点
//   legs stand|walk|jump|none，step 走路相位  headOnly 只画头（车窗里的乘客）
//   back / mid / hat / front(c, R) 各角色自己的物件，R 里有 T、Hd（身体和头的局部坐标）和两只手的位置
function chibi(c, x, y, s, o = {}) {
  const { dir = 1, rot = 0, bob = 0, sq = 0, tilt = 0, hair = '#8d6bc9', hairEnd = -1.62, long = false, locks = true, dress = '#9fcbee', sleeve = null, wide = false, skin = K.skin, eyes = 'open', eyeCol = null, look = [0, 0], mouth = 'smile', armL = .2, armR = .2, legs = 'stand', step = 0, blush = 1, seed = 1, headOnly = false, back = null, dressIn = null, mid = null, hat = null, front = null, al = 1, legCol = '#f7f2e8', shoe = '#4b3a55' } = o;
  const [sx, sy] = squash(sq), ca = Math.cos(rot), sa = Math.sin(rot), ct = Math.cos(tilt), st = Math.sin(tilt);
  const T = (u, v) => { const X = u * s * sx * dir, Y = v * s * sy; return [x + X * ca - Y * sa, y + bob + X * sa + Y * ca]; };
  const Hd = (u, v) => { const dv = v + 1.5; return T(u * ct - dv * st, u * st + dv * ct - 1.5); };
  const R = { T, Hd, s, x, y, dir, head: Hd(0, -2.35), top: Hd(0, -3.42), hands: {} }, sd = seed * 37;
  const rimW = clamp(s * .055, 2.5, 8), piece = (pts, col, q = {}) => cut(c, pts, col, { rim: rimW, seed: sd + (q.k || 0), anchor: R.head, shadow: .14, ...q });
  const arm = (side, a) => { const sh = T(side * .34, -1.36); let hand;
    if (Array.isArray(a)) { const dx = a[0] - sh[0], dy = a[1] - sh[1], L = Math.hypot(dx, dy), mx = .95 * s; hand = L > mx ? [sh[0] + dx / L * mx, sh[1] + dy / L * mx] : a; }
    else hand = T(side * (.34 + Math.sin(a) * .78), -1.36 + Math.cos(a) * .78);
    return { sh, hand }; };
  const AL = arm(-1, armL), AR = arm(1, armR); R.hands = { l: AL.hand, r: AR.hand };
  c.save(); c.globalAlpha *= al;
  if (back) back(c, R);
  const hb = long ? [[-1.1, -2.5], [-1.22, -1.6], [-1.2, -.72], [-1.04, -.44], [-.5, -.52], [0, -.46], [.5, -.52], [1.04, -.44], [1.2, -.72], [1.22, -1.6], [1.1, -2.5], [.96, -3.0], [.5, -3.34], [0, -3.43], [-.5, -3.34], [-.96, -3.0]]
    : [[-1.13, -2.35], [-1.13, -1.95], [-1.05, hairEnd + .06], [-.72, hairEnd], [.72, hairEnd], [1.05, hairEnd + .06], [1.13, -1.95], [1.13, -2.35], [.98, -2.98], [.52, -3.34], [0, -3.43], [-.52, -3.34], [-.98, -2.98]];
  piece(M(Hd, hb), hair, { k: 1 });
  if (!headOnly) {
    if (legs !== 'none') for (const side of [-1, 1]) { const ph = step * TAU + (side > 0 ? Math.PI : 0), fx = legs === 'walk' ? Math.sin(ph) * .17 : 0, lift = legs === 'walk' ? Math.max(0, Math.cos(ph)) * .12 : legs === 'jump' ? .16 : 0;
      const hip = T(side * .24, -.5), foot = T(side * (legs === 'jump' ? .32 : .25) + fx, -.1 - lift);
      cut(c, capsule(hip, foot, s * .1), legCol, { rim: 0, seed: sd + 5 + side, shadow: .1, tex: .3, anchor: R.head });
      cut(c, ellPts(foot[0] + dir * s * .05, foot[1] + s * .03, s * .17, s * .1, rot, 16), shoe, { rim: 0, seed: sd + 7 + side, shadow: .1, tex: .5, anchor: R.head }); }
    const dr = [[-.4, -1.52], [.4, -1.52], [.53, -1.15], [.8, -.46], [.4, -.36], [0, -.34], [-.4, -.36], [-.8, -.46], [-.53, -1.15]];
    piece(M(T, dr), dress, { k: 3, inner: dressIn ? g => dressIn(g, R) : null });
    if (mid) mid(c, R);
    for (const [side, A] of [[-1, AL], [1, AR]]) { const col = sleeve || dress;
      if (wide) piece([[A.sh[0], A.sh[1] - s * .12], [A.hand[0], A.hand[1] - s * .12], [A.hand[0] + side * dir * s * .04, A.hand[1] + s * .34], [A.sh[0], A.sh[1] + s * .5]], col, { k: 14 + side, smooth: false });
      else piece(capsule(A.sh, A.hand, s * .15), col, { k: 14 + side });
      cut(c, ellPts(A.hand[0], A.hand[1], s * .14, s * .14, 0, 14), skin, { rim: 0, seed: sd + 16 + side, shadow: .1, tex: .3, anchor: R.head }); }
  }
  piece(M(Hd, ellPts(0, -2.35, 1.0, .9, 0, 40)), skin, { k: 9, tex: .35 });
  const bang = [[-1.06, -2.28], [-.96, -2.6], [-.74, -2.46], [-.5, -2.64], [-.25, -2.48], [0, -2.66], [.25, -2.48], [.5, -2.64], [.74, -2.46], [.96, -2.6], [1.06, -2.28], [1.1, -2.78], [.84, -3.16], [.4, -3.37], [0, -3.43], [-.4, -3.37], [-.84, -3.16], [-1.1, -2.78]];
  piece(M(Hd, bang), hair, { k: 11 });
  if (locks) for (const side of [-1, 1]) piece(M(Hd, [[-1.04, -2.58], [-.9, -2.42], [-.87, -1.95], [-.94, long ? -1.3 : -1.58], [-1.03, -1.9]].map(([u, v]) => [u * side, v])), hair, { k: 12 + side, rim: rimW * .5 });
  // 五官
  const lw = Math.max(2, s * .065), lx = look[0] * .1, ly = look[1] * .07, ey = -2.17 + ly;
  [-1, 1].forEach((side, k) => { const ex = side * .36 + lx, col = eyeCol ? eyeCol[k] : K.ink;
    if (eyes === 'open' || eyes === 'wide') { const r = eyes === 'wide' ? .15 : .115; fillPts(c, M(Hd, ellPts(ex, ey, r * .86, r * 1.1, 0, 16)), col); fillPts(c, M(Hd, ellPts(ex + .035, ey - .05, r * .34, r * .34, 0, 10)), '#ffffff'); }
    else if (eyes === 'closed') inkLine(c, M(Hd, [[ex - .13, ey - .01], [ex, ey + .06], [ex + .13, ey - .01]]), lw);
    else if (eyes === 'happy') inkLine(c, M(Hd, [[ex - .13, ey + .05], [ex, ey - .06], [ex + .13, ey + .05]]), lw);
    else if (eyes === 'half') { fillPts(c, M(Hd, [[ex - .1, ey - .01], [ex + .1, ey - .01], [ex + .08, ey + .09], [ex, ey + .12], [ex - .08, ey + .09]]), col); inkLine(c, M(Hd, [[ex - .15, ey - .03], [ex + .15, ey - .03]]), lw); } });
  const mx = lx * .6, my = -1.86 + ly * .5;
  if (mouth === 'smile') inkLine(c, M(Hd, [[mx - .12, my - .02], [mx, my + .05], [mx + .12, my - .02]]), lw);
  else if (mouth === 'open') { fillPts(c, M(Hd, [[mx - .15, my - .05], [mx + .15, my - .05], [mx + .1, my + .1], [mx, my + .15], [mx - .1, my + .1]]), '#a8313b'); fillPts(c, M(Hd, ellPts(mx, my + .09, .07, .04, 0, 10)), '#f48da0'); }
  else if (mouth === 'o') fillPts(c, M(Hd, ellPts(mx, my + .02, .06, .075, 0, 12)), '#7d2733');
  else if (mouth === 'pout') inkLine(c, M(Hd, [[mx - .1, my + .04], [mx, my - .02], [mx + .1, my + .04]]), lw);
  else if (mouth === 'flat') inkLine(c, M(Hd, [[mx - .08, my + .01], [mx + .08, my + .01]]), lw);
  else if (mouth === 'tongue') { fillPts(c, M(Hd, [[mx + .01, my + .03], [mx + .13, my + .02], [mx + .12, my + .13], [mx + .06, my + .15], [mx + .02, my + .11]]), '#f07a92'); inkLine(c, M(Hd, [[mx - .13, my - .02], [mx, my + .05], [mx + .13, my - .02]]), lw); }
  else if (mouth === 'cat') inkLine(c, M(Hd, [[mx - .14, my - .02], [mx - .07, my + .04], [mx, my - .01], [mx + .07, my + .04], [mx + .14, my - .02]]), lw);
  if (blush > 0) for (const side of [-1, 1]) fillPts(c, M(Hd, ellPts(side * .6 + lx * .3, -1.95, .16, .1, 0, 16)), K.blush, .85 * blush);
  if (hat) hat(c, R);
  if (front) front(c, R);
  c.restore(); return R;
}

// 多多良小伞的唐伞：紫色伞面、一只大眼睛、伸出来的长舌头。top 是伞顶，hand 是握柄的位置，r 是伞面半宽。
function umbrellaK(c, top, hand, r, o = {}) { const { blink = 0, tongue = 0, look = 0, seed = 60, al = 1 } = o, dx = hand[0] - top[0], dy = hand[1] - top[1], rot = -Math.atan2(dx, dy), u = r / 1.5, T = tf(top[0], top[1], u, rot);
  c.save(); c.globalAlpha *= al;
  cut(c, capsule(T(0, .5), [hand[0], hand[1]], u * .09), '#8a5a36', { rim: 0, seed: seed + 1, shadow: .12, tex: .5, anchor: top, smooth: false });
  const dome = []; for (let k = 0; k <= 18; k++) { const a = Math.PI + k / 18 * Math.PI; dome.push([Math.cos(a) * 1.5, .95 + Math.sin(a) * 1.2]); }
  const hem = []; for (let k = 6; k >= 1; k--) { const x0 = -1.5 + 3 * k / 6; hem.push([x0 - .25, 1.08]); hem.push([x0 - .5, .95]); }
  cut(c, M(T, [...dome, ...hem]), '#8e63cb', { rim: Math.max(3, u * .07), seed, anchor: top, shadow: .16 });
  for (const x0 of [-.95, 0, .95]) inkLine(c, M(T, [[0, -.22], [x0 * .7, .3], [x0, .98]]), Math.max(1.5, u * .035), alpha('#3c2466', .45));
  const ex = -.4, eyy = .42, eh = .3 * (1 - blink);
  if (blink < .85) { cut(c, M(T, [[ex - .5, eyy], [ex, eyy - eh], [ex + .5, eyy], [ex, eyy + eh * .85]]), '#fffdf7', { rim: 0, seed: seed + 3, shadow: 0, tex: .15, anchor: top });
    const [ix, iy] = T(ex + look * .18, eyy); fillPts(c, ellPts(ix, iy, u * .17, u * .17 * Math.min(1, (1 - blink) * 1.4), rot, 16), '#d7343e'); fillPts(c, ellPts(ix, iy, u * .075, u * .075, 0, 12), K.ink); fillPts(c, ellPts(ix + u * .05, iy - u * .06, u * .04, u * .04, 0, 8), '#ffffff'); }
  inkLine(c, M(T, [[ex - .52, eyy], [ex, eyy - eh - .02], [ex + .52, eyy]]), Math.max(2, u * .06));
  const tl = 1.0 + tongue * .25;
  cut(c, M(T, [[.35, .98], [.4, .98 + tl * .55], [.58 + tongue * .05, .98 + tl], [.8, .98 + tl * .6], [.84, .98]]), '#f07896', { rim: Math.max(2.5, u * .05), seed: seed + 5, anchor: top, shadow: .12 });
  inkLine(c, M(T, [[.6, 1.06], [.6, .98 + tl * .62]]), Math.max(1.5, u * .03), alpha('#8e2440', .7));
  fillPts(c, ellPts(...T(0, -.28), u * .1, u * .1, 0, 10), '#6b4a9e');
  c.restore(); return { T, rot }; }

// ---- 角色 ----
function kogasa(c, x, y, s, o = {}) { const um = o.umbrella === false ? null : (o.umbrella || {});
  return chibi(c, x, y, s, { hair: '#89b6e6', hairEnd: -1.72, dress: '#9ccbee', eyeCol: ['#d7343e', '#3765c3'], mouth: 'tongue', seed: 21, ...o,
    back: um ? (c2, R) => { const h = R.hands.l, tl = um.tilt ?? -.18; umbrellaK(c2, [h[0] + Math.sin(tl) * s * 2.2, h[1] - Math.cos(tl) * s * 2.2], h, s * (um.size ?? 1.45), um); } : null,
    mid: (c2, R) => { cut(c2, M(R.T, [[-.2, -1.52], [.2, -1.52], [.12, -1.05], [-.12, -1.05]]), '#fbfaf5', { rim: 0, seed: 211, shadow: .08, tex: .2, smooth: false }); fillPts(c2, M(R.T, [[-.14, -1.5], [0, -1.38], [.14, -1.5], [0, -1.44]]), '#d7343e'); } }); }
function akyuu(c, x, y, s, o = {}) {
  return chibi(c, x, y, s, { hair: '#8e6ccb', hairEnd: -1.64, dress: '#86b36f', sleeve: '#f2cf58', wide: true, seed: 11, ...o,
    mid: (c2, R) => { cut(c2, M(R.T, [[-.34, -1.53], [0, -1.16], [.34, -1.53]]), '#fbfaf3', { rim: 0, seed: 111, shadow: .08, tex: .15, smooth: false });
      cut(c2, M(R.T, [[-.58, -1.07], [.58, -1.07], [.63, -.88], [-.63, -.88]]), '#d4463f', { rim: 0, seed: 112, shadow: .1, tex: .5, smooth: false }); if (o.mid) o.mid(c2, R); },
    hat: (c2, R) => { const [fx, fy] = R.Hd(.74, -3.02), r = s * .2; cut(c2, ellPts(fx - r * 1.3, fy + r * .9, r * .9, r * .45, -.5, 14), '#6fae5f', { rim: 0, seed: 113, shadow: .1 });
      for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; cut(c2, ellPts(fx + Math.cos(a) * r * 1.05, fy + Math.sin(a) * r * 1.05, r * .95, r * .95, 0, 14), '#fbe5ec', { rim: 0, seed: 114 + k, shadow: .1, tex: .25 }); }
      fillPts(c2, ellPts(fx, fy, r * .62, r * .62, 0, 14), '#e25670'); fillPts(c2, ellPts(fx, fy, r * .25, r * .25, 0, 10), '#f6d35c'); if (o.hat) o.hat(c2, R); } }); }
function hina(c, x, y, s, o = {}) {
  return chibi(c, x, y, s, { hair: '#4e9c70', long: true, dress: '#d33a47', seed: 31, legCol: '#fbeff0', ...o,
    dressIn: (g, R) => inkLine(g, M(R.T, [[-.9, -.5], [-.6, -.42], [-.3, -.5], [0, -.42], [.3, -.5], [.6, -.42], [.9, -.5]]), s * .09, '#fbe9ea'),
    mid: (c2, R) => cut(c2, M(R.T, [[-.5, -1.2], [.5, -1.2], [.55, -1.05], [-.55, -1.05]]), '#9e1b2a', { rim: 0, seed: 311, shadow: .08, smooth: false }),
    hat: (c2, R) => { for (const side of [-1, 1]) cut(c2, M(R.Hd, [[-.08, -3.28], [-.52, -3.78], [-1.0, -3.7], [-1.1, -3.3], [-.62, -3.08]].map(([u, v]) => [u * side, v])), '#dc3141', { rim: clamp(s * .05, 2.5, 7), seed: 312 + side, shadow: .14 });
      fillPts(c2, ellPts(...R.Hd(0, -3.3), s * .16, s * .16, 0, 12), '#a8182a');
      for (const side of [-1, 1]) { const [bx, by] = R.Hd(side * .98, -1.5); cut(c2, [[bx - s * .16, by - s * .1], [bx + s * .16, by - s * .1], [bx + s * .1, by + s * .12], [bx - s * .1, by + s * .12]], '#dc3141', { rim: 2, seed: 315 + side, shadow: .1, smooth: false }); } } }); }
function patchouli(c, x, y, s, o = {}) {
  return chibi(c, x, y, s, { hair: '#a37fd1', long: true, dress: '#eecbe0', eyes: 'half', eyeCol: ['#7a4e9e', '#7a4e9e'], mouth: 'flat', seed: 41, ...o,
    dressIn: (g, R) => { for (let u = -.8; u <= .81; u += .2) inkLine(g, M(R.T, [[u * .6, -1.6], [u, -.3]]), s * .05, '#b98bc0', { smooth: false }); },
    hat: (c2, R) => { const cap = [[-1.2, -2.58], [-1.28, -2.98], [-1.02, -3.42], [-.5, -3.72], [0, -3.8], [.5, -3.72], [1.02, -3.42], [1.28, -2.98], [1.2, -2.58], [.9, -2.72], [.6, -2.62], [.3, -2.74], [0, -2.64], [-.3, -2.74], [-.6, -2.62], [-.9, -2.72]];
      cut(c2, M(R.Hd, cap), '#f7dde9', { rim: clamp(s * .05, 2.5, 7), seed: 411, shadow: .14 });
      const [mx2, my2] = R.Hd(.5, -3.25), mr = s * .3, moon = []; for (let k = 0; k <= 14; k++) { const a = -2.3 + k / 14 * 4.6; moon.push([mx2 + Math.cos(a) * mr, my2 + Math.sin(a) * mr]); } for (let k = 14; k >= 0; k--) { const a = -1.9 + k / 14 * 3.8; moon.push([mx2 + mr * .42 + Math.cos(a) * mr * .78, my2 + Math.sin(a) * mr * .78]); }
      cut(c2, moon, '#f4cf55', { rim: 0, seed: 412, shadow: .12, smooth: false });
      for (const [side, col] of [[-1, '#d8414b'], [1, '#4a6fcf']]) { const [bx, by] = R.Hd(side * 1.08, -1.0); cut(c2, [[bx - s * .14, by - s * .09], [bx + s * .14, by - s * .09], [bx + s * .09, by + s * .1], [bx - s * .09, by + s * .1]], col, { rim: 2, seed: 413 + side, shadow: .1, smooth: false }); }
      if (o.hat) o.hat(c2, R); } }); }

// ===================== 电车「幻想乡交通大学号」 =====================
// 侧视，车头朝右。局部单位：车长 6（x -3..3），车顶 y=-2.36，车底 y=-.6，轨面 y=0。s 约 80–100。
const TR = { body: '#f7edd3', band: '#3a67bf', roof: '#b4abcc', glass: '#cfe6f4', lamp: '#ffd84f', wheel: '#3e3853', board: '#fffdf5', door: '#eadbb6' };
//   o.seats[k](c, x, y, s)  第 k 个车窗里的乘客：脚底 (x, y)、头半径 s 的 headOnly chibi，头正好落在窗里  o.driver 同上，驾驶窗
//   o.umbrella {blink, tongue} 小伞在驾驶座时从车顶撑出来的伞  o.roll 车轮转角  o.pole 受电弓升起 0..1  o.board 目的地牌  o.doorOpen 0..1
function tram(c, x, y, s, o = {}) {
  const { roll = 0, board = '北京交通大学', boardP = 1, boardFrom = null, flip = 1, pole = 1, seats = [], driver = null, umbrella = null, lamp = 0, seed = 40, rot = 0, name = true, al = 1, doorOpen = 0, glass = TR.glass } = o;
  const T = tf(x, y, s, rot), lw = Math.max(2.5, s * .045), rim = clamp(s * .05, 3, 7), P = pts => M(T, pts);
  const part = (pts, col, q = {}) => cut(c, P(pts), col, { rim, seed: seed + (q.k || 0), anchor: T(0, 0), smooth: false, shadow: .14, ...q });
  c.save(); c.globalAlpha *= al;
  const pz = -2.36 - 1.0 * pole;   // 受电弓
  const pm = (pz - 2.36) / 2; inkLine(c, P([[-2.0, -2.3], [-2.34, pm], [-2.0, pz], [-1.66, pm], [-2.0, -2.3]]), lw * 1.1, K.ink, { smooth: false }); inkLine(c, P([[-2.42, pz], [-1.58, pz]]), lw * 1.5, K.ink, { smooth: false });
  fillPts(c, P([[-2.14, -2.36], [-1.86, -2.36], [-1.9, -2.46], [-2.1, -2.46]]), '#4a435c');
  if (umbrella) umbrellaK(c, T(2.05, -3.55), T(2.3, -2.3), s * .95, umbrella);
  part([[-2.95, -2.12], [-2.72, -2.36], [2.42, -2.36], [2.84, -2.1], [2.84, -1.98], [-2.95, -1.98]], TR.roof, { k: 1 });
  part([[-3, -2.06], [2.74, -2.06], [2.96, -1.74], [3.03, -1.1], [3.03, -.6], [-3, -.6]], TR.body, { k: 2 });
  part([[-3, -1.08], [3.03, -1.08], [3.03, -.6], [-3, -.6]], TR.band, { k: 3, rim: 0, shadow: 0 });
  inkLine(c, P([[-3, -1.2], [3.0, -1.2]]), lw * .9, TR.band, { smooth: false });
  [[-2.62, -1.72], [-1.5, -.6], [-.38, .52]].forEach(([a, b], k) => { const wp = part([[a, -1.92], [b, -1.92], [b, -1.3], [a, -1.3]], glass, { k: 5 + k, rim: 0, shadow: 0, tex: .3, jag: .4 });
    if (seats[k]) { c.save(); c.clip(wp); const [cx, cy] = T((a + b) / 2, -1.58), ss = s * .3; seats[k](c, cx, cy + 2.3 * ss, ss); c.restore(); }
    inkLine(c, P([[a + .1, -1.84], [a + .32, -1.84]]), lw * .8, 'rgba(255,255,255,.8)', { smooth: false }); });
  part([[.72, -1.96], [1.42, -1.96], [1.42, -.62], [.72, -.62]], doorOpen > 0 ? '#5a5070' : TR.door, { k: 9, rim: 0, shadow: .1 });
  if (doorOpen < 1) part([[.72 + .7 * doorOpen, -1.96], [1.42, -1.96], [1.42, -.62], [.72 + .7 * doorOpen, -.62]], TR.door, { k: 10, rim: 0, shadow: .12 });
  const cp = part([[1.95, -1.94], [2.7, -1.94], [2.9, -1.64], [2.95, -1.3], [1.95, -1.3]], glass, { k: 11, rim: 0, shadow: 0, tex: .3, jag: .4 });
  if (driver) { c.save(); c.clip(cp); const [cx, cy] = T(2.4, -1.58), ss = s * .3; driver(c, cx, cy + 2.3 * ss, ss); c.restore(); }
  // 目的地牌：boardFrom 给出时，flip 0→1 让牌子上下翻一圈，从 boardFrom 翻成 board
  const fk = boardFrom ? Math.abs(Math.cos(Math.PI * clamp(flip, 0, 1))) : 1, bText = boardFrom && flip < .5 ? boardFrom : board, bv = v => -2.675 + (v + 2.675) * Math.max(.02, fk);
  part([[-1.02, bv(-2.95)], [1.02, bv(-2.95)], [1.02, bv(-2.4)], [-1.02, bv(-2.4)]], TR.board, { k: 12, rim: 0, shadow: .16, tex: .15 });
  inkLine(c, P([[-.7, -2.4], [-.7, -2.36]]), lw, K.ink, { smooth: false }); inkLine(c, P([[.7, -2.4], [.7, -2.36]]), lw, K.ink, { smooth: false });
  const [bx, by] = T(0, -2.675), bsz = s * Math.min(.36, 1.8 / [...bText].length); c.save(); c.translate(bx, by); c.rotate(rot); c.scale(1, Math.max(.02, fk)); zh(c, bText, 0, bsz * .36, { size: bsz, align: 'center', color: '#1e2b63', p: boardP, tilt: .02, jitter: .01, seed: 9 }); c.restore();
  if (name) { const [nx, ny] = T(-2.8, -.72); zh(c, '幻想乡交通大学号', nx, ny, { size: s * .27, color: '#fffaf0', rot, tilt: .03, jitter: .02, seed: 5 }); }
  const [ex, ey] = T(.1, -.84); cut(c, ellPts(ex, ey, s * .17, s * .17, 0, 18), '#ffffff', { rim: 0, seed: seed + 13, shadow: .1, tex: .1 }); inkLine(c, ellPts(ex, ey, s * .12, s * .12, 0, 18), lw * .6, TR.band, { close: true, smooth: false });
  const [lx, ly] = T(2.96, -.86); cut(c, ellPts(lx, ly, s * .13, s * .13, 0, 14), TR.lamp, { rim: 0, seed: seed + 14, shadow: .1 });
  if (lamp > 0) dashes(c, lx, ly, s * .26, 3, { len: s * .3, w: lw, col: '#e7a820', rot, spread: 1.0, al: lamp });
  part([[3.0, -.8], [3.2, -.8], [3.2, -.66], [3.0, -.66]], '#4a435c', { k: 15, rim: 0 }); part([[-3.2, -.8], [-3.0, -.8], [-3.0, -.66], [-3.2, -.66]], '#4a435c', { k: 16, rim: 0 });
  for (const u of [-1.95, 1.9]) { const [cx, cy] = T(u, -.34), r = s * .33; cut(c, ellPts(cx, cy, r, r, 0, 24), TR.wheel, { rim: rim * .8, seed: seed + 20 + u, shadow: .16, anchor: [cx, cy] });
    for (let j = 0; j < 3; j++) { const a = roll + j * Math.PI / 3; inkLine(c, [[cx - Math.cos(a) * r * .72, cy - Math.sin(a) * r * .72], [cx + Math.cos(a) * r * .72, cy + Math.sin(a) * r * .72]], lw * .8, '#cfc6e0', { smooth: false }); }
    fillPts(c, ellPts(cx, cy, r * .2, r * .2, 0, 12), '#cfc6e0'); }
  c.restore(); return { T, door: T(1.07, -.6), cab: T(2.42, -1.6), wire: y - (2.36 + 1.0) * s, top: T(0, -2.95) };
}
// wire: 架空电线和电线杆
function wire(c, y, x0, x1, o = {}) { const { poles = 760, off = 120, lw = 3, groundY = null } = o; inkLine(c, [[x0, y], [x1, y]], lw, K.ink, { smooth: false });
  if (groundY !== null) for (let x = Math.floor((x0 - off) / poles) * poles + off; x <= x1; x += poles) { inkLine(c, [[x, groundY], [x, y - 60]], lw * 2.2, '#5b4a66', { smooth: false }); inkLine(c, [[x - 4, y - 30], [x + 70, y - 30]], lw * 1.4, '#5b4a66', { smooth: false }); } }
// rails: 轨道（侧视）：碎石路基是一条撕纸，上面一排枕木和一条钢轨
function rails(c, y, x0, x1, o = {}) { const { bed = '#b9a07e', seed = 7, depth = 200 } = o; strip(c, x0, x1, y + 6, y + depth, bed, { seed, rim: 5, amp: 5 });
  for (let x = Math.ceil(x0 / 64) * 64; x < x1; x += 64) cut(c, rectPts(x - 18, y + 4, 36, 14), '#6e5647', { rim: 0, seed: seed + x, shadow: .1, smooth: false, tex: .5, jag: .6 });
  inkLine(c, [[x0, y], [x1, y]], 7, '#4a4458', { smooth: false }); inkLine(c, [[x0, y - 2.5], [x1, y - 2.5]], 2, '#9d98ae', { smooth: false }); }
