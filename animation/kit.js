'use strict';
// 北交摊位短片的画具（第二版）。画风照参考视频 x_2102495989194236158.mp4：木刻、刮画板一样的黑白，
// 墨块边缘粗糙，黑底上的细节用白色刮痕线；低饱和，每一段最多加一种压暗的颜色（K 里按段列出）。
// 坐标是引擎的逻辑单位（16:9 下 1920×1080，出 4K 时整体 ×2）。第一版的剪纸画具在 git 标签 legacy/v1-tram-film。

const ZH = 'WenKai';   // 霞鹜文楷（OFL），手写楷体：字幕、手写字
_photoLoads.push(document.fonts.load(`400 80px ${ZH}`, '北京交通大学'), document.fonts.load(`500 80px ${ZH}`, '北京交通大学'), document.fonts.load('500 40px NSans', '隙间月影'),
  document.fonts.load('400 40px NSans', '隙间月影'), document.fonts.load('400 40px SMono', 'SUKIMA'), document.fonts.load('700 40px SMono', 'SUKIMA'),
  document.fonts.load('80px Anton', 'WASTED'));

const K = {
  ink: '#161412', ink2: '#24211e', paper: '#ebe5d8', paper2: '#e2dbcc', card: '#f3efe6',
  g1: '#cdc6b8', g2: '#8e887d', g3: '#4b4741',
  rose: '#8a3a3d',                    // 1 三眼的幻恋：唯一的一朵蔷薇
  plum: '#4B2A63',                    // 2 隙间月影：引言紫（宣传册原色）
  teal: '#5b776e', ochre: '#a4894f',  // 3 炼金工坊：双色油印
  vermil: '#9c4637', moss: '#6e7a5a',  // 4 雏祭：红、绿和纸（活动材料就是红绿两色和纸），雏的缎带用 vermil
  dot: '#a8403a',                     // 6 红黑榜：小红点贴纸
  stamp: '#a3342c',                   // 7 笑话集：WASTED 印泥
};

// ===================== 镜头登记 =====================
// 每个 scenes/*.js 调一次 scene({ order, key, name, dur, fn })，film.js 按 order 排成时间线。
// fn(c, tau, i)：tau 本段内的秒数，i 是 12fps 网格上的帧号。frame: false 时 film.js 不在外圈画画框。
const SCENES = [];
function scene(o) { SCENES.push(o); }
// tick：手绘的「抖」。每秒换 fps 次随机种子，同一拍内不变。墨块、线条的 seed 加上它，边缘就会轻轻地抖。
const tick = (tau, fps = 8) => Math.floor(tau * fps + 1e-6) * 17;
// stubCard：还没做的段先放一张写着段名的黑卡，保证全片时长和顺序先跑通
function stubCard(c, tau, title) { inkBg(c); zh(c, title, CX, CY + 20, { size: 72, color: K.paper, align: 'center', p: 1 }); caption(c, '施工中', tau, 0); }

// ===================== 几何 =====================
const M = (F, pts) => pts.map(p => F(p[0], p[1]));
// tf：局部坐标 → 画面坐标。原点 (x, y)，缩放 s，旋转 rot，dir = -1 左右翻转
function tf(x, y, s, rot = 0, dir = 1) { const ca = Math.cos(rot), sa = Math.sin(rot); return (u, v) => { const X = u * s * dir, Y = v * s; return [x + X * ca - Y * sa, y + X * sa + Y * ca]; }; }
function densify(pts, step = 4, close = true) { const out = [], n = pts.length, segs = close ? n : n - 1;
  for (let i = 0; i < segs; i++) { const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < m; k++) out.push([lerp(a[0], b[0], k / m), lerp(a[1], b[1], k / m)]); }
  if (!close) out.push(pts[n - 1].slice()); return out; }
function ringArea(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
// offsetRing：闭合轮廓沿外法线推出 f(k, 弧长) 个单位（负数向内）
function offsetRing(q, f) { const n = q.length, sg = ringArea(q) > 0 ? 1 : -1, out = new Array(n); let s = 0;
  for (let k = 0; k < n; k++) { if (k) s += Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]); const a = q[(k + n - 1) % n], b = q[(k + 1) % n], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, d = f(k, s);
    out[k] = [q[k][0] + sg * ty / l * d, q[k][1] - sg * tx / l * d]; } return out; }
// capsule：线段 a-b 外面包一圈半径 r
function capsule(a, b, r, n = 8) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), pts = [];
  for (let k = 0; k <= n; k++) { const t = ang - Math.PI / 2 - k / n * Math.PI; pts.push([a[0] + Math.cos(t) * r, a[1] + Math.sin(t) * r]); }
  for (let k = 0; k <= n; k++) { const t = ang + Math.PI / 2 - k / n * Math.PI; pts.push([b[0] + Math.cos(t) * r, b[1] + Math.sin(t) * r]); } return pts; }
// heartPts：心形，(x, y) 是心的中心，s 是半宽
function heartPts(x, y, s, rot = 0, n = 40) { const out = []; for (let k = 0; k < n; k++) { const a = k / n * TAU, u = Math.pow(Math.sin(a), 3), v = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16;
  out.push([x + s * (u * Math.cos(rot) - v * Math.sin(rot)), y + s * (u * Math.sin(rot) + v * Math.cos(rot))]); } return out; }
function starPts(x, y, r, rot = 0, n = 4, inner = .38) { const out = []; for (let k = 0; k < n * 2; k++) { const a = rot - Math.PI / 2 + k / (n * 2) * TAU, rr = k % 2 ? r * inner : r; out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return out; }
function fillPts(c, pts, col, al = 1) { c.save(); c.globalAlpha *= al; c.fillStyle = col; c.fill(polyPath(pts)); c.restore(); }
// pop：以 (x, y) 为中心缩放后画 fn（弹出、按下、盖章）
function pop(c, x, y, k, fn, ky = k) { if (k <= .001 && ky <= .001) return; c.save(); c.translate(x, y); c.scale(k, ky); c.translate(-x, -y); fn(); c.restore(); }
// pathAt：折线上弧长比例 u 处的点和切线角
function pathAt(pts, u) { const L = pathLength(pts); let acc = 0, target = clamp(u, 0, 1) * L;
  for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); if (acc + d >= target || k === pts.length - 1) { const t = d ? clamp((target - acc) / d, 0, 1) : 0;
    return { x: lerp(pts[k - 1][0], pts[k][0], t), y: lerp(pts[k - 1][1], pts[k][1], t), a: Math.atan2(pts[k][1] - pts[k - 1][1], pts[k][0] - pts[k - 1][0]) }; } acc += d; }
  return { x: pts[0][0], y: pts[0][1], a: 0 }; }
// viewRect：当前镜头下画面四角在世界坐标里的外接框 [x, y, w, h]（带 pad 余量）
function viewRect(pad = 40) { if (!VIEW) return [-pad, -pad, W + pad * 2, H + pad * 2]; const R = Math.hypot(W, H) / 2 / VIEW.zoom + pad, hw = VIEW.rot ? R : W / 2 / VIEW.zoom + pad, hh = VIEW.rot ? R : H / 2 / VIEW.zoom + pad;
  return [VIEW.x - hw, VIEW.y - hh, hw * 2, hh * 2]; }

// ===================== 纸纹、墨纹、细横线、网点 =====================
// 四种 512 单位见方、可平铺的底纹（照 texture.fayaz.workers.dev 的 Paper / Ink Wash / Linepress / Stipple）。
// 明暗起伏都压在 5% 以内：背景有细节，但不抢主体。
//   paper 暖白纸上的细斑和纤维   ink 黑底上的浅色细斑和干刷痕   lines 极细的横线   dots 45° 网点
const _tiles = {};
function tile(c, kind) {
  const key = kind + '@' + S; if (_tiles[key]) return _tiles[key];
  const T = 512, px = Math.round(T * S), cv = document.createElement('canvas'); cv.width = cv.height = px;
  const g = cv.getContext('2d'); g.scale(px / T, px / T); g.lineCap = 'round'; const r = rng(kind.charCodeAt(0) * 97 + kind.length);
  const wrap = (x, y, ext, fn) => { for (const dx of [-T, 0, T]) for (const dy of [-T, 0, T]) { if (x + dx < -ext || x + dx > T + ext || y + dy < -ext || y + dy > T + ext) continue; fn(x + dx, y + dy); } };
  const blotches = (n, col, a0, a1) => { for (let k = 0; k < n; k++) { const x = r() * T, y = r() * T, R = 60 + r() * 140, a = a0 + r() * (a1 - a0);
    wrap(x, y, R, (X, Y) => { const gr = g.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(X - R, Y - R, R * 2, R * 2); }); } };
  const specks = (n, col, a0, a1, s0, s1) => { for (let k = 0; k < n; k++) { const x = r() * T, y = r() * T, s = s0 + r() * (s1 - s0); g.fillStyle = `rgba(${col},${a0 + r() * (a1 - a0)})`; g.fillRect(x, y, s, s * (.6 + r() * .8)); } };
  const hairs = (n, col, a0, a1, l0, l1, w, ang = null) => { for (let k = 0; k < n; k++) { const x = r() * T, y = r() * T, a = ang === null ? r() * TAU : ang + (r() - .5) * .5, L = l0 + r() * (l1 - l0), bend = (r() - .5) * L * .3;
    g.strokeStyle = `rgba(${col},${a0 + r() * (a1 - a0)})`; g.lineWidth = w * (.6 + r() * .8);
    wrap(x, y, L, (X, Y) => { const ex = X + Math.cos(a) * L, ey = Y + Math.sin(a) * L; g.beginPath(); g.moveTo(X, Y); g.quadraticCurveTo((X + ex) / 2 - Math.sin(a) * bend, (Y + ey) / 2 + Math.cos(a) * bend, ex, ey); g.stroke(); }); } };
  if (kind === 'paper') { blotches(20, '60,45,25', .006, .014); blotches(10, '255,255,255', .015, .03); specks(5200, '50,38,22', .02, .07, .5, 1.5); specks(1600, '255,255,255', .05, .13, .5, 1.3); hairs(300, '60,45,25', .025, .05, 6, 24, .5); }
  else if (kind === 'ink') { blotches(12, '235,229,216', .004, .01); specks(3600, '235,229,216', .025, .07, .5, 1.4); hairs(50, '235,229,216', .025, .05, 10, 40, .8, -.12); }
  else if (kind === 'lines') { for (let y = 1.5; y < T; y += 4) { g.strokeStyle = `rgba(40,30,20,${.03 + r() * .025})`; g.lineWidth = .55; g.beginPath(); for (let x = 0; x <= T; x += 16) { const yy = y + Math.sin(x / T * TAU * 2 + y * .07) * .5; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); } }
  else if (kind === 'dots') { const sp = 8; g.save(); g.translate(T / 2, T / 2); g.rotate(Math.PI / 4); for (let y = -T; y < T; y += sp) for (let x = -T; x < T; x += sp) { g.fillStyle = `rgba(40,30,20,${.05 + r() * .04})`; g.beginPath(); g.arc(x, y, .7 + r() * .55, 0, TAU); g.fill(); } g.restore(); }
  else throw new Error('unknown tile: ' + kind);
  return (_tiles[key] = c.createPattern(cv, 'repeat'));
}
// texture：在 path 里（省略 = 当前镜头下的整个画面）铺一层底纹。ox, oy 是纹理的偏移（跟着物体走时传物体坐标）。
function texture(c, path, kind, al = 1, ox = 0, oy = 0) { if (al <= 0) return; const p = tile(c, kind); p.setTransform(new DOMMatrix().translate(ox, oy).scale(1 / S));
  c.save(); c.globalAlpha *= al; c.fillStyle = p; if (path) c.fill(path); else { const [x, y, w, h] = viewRect(); c.fillRect(x, y, w, h); } c.restore(); }
// paperBg / inkBg：满屏的纸或墨。在 setView 之后调用；纹理画在世界坐标里，镜头推近时纸纹跟着放大，像真的纸。
//   extra: 'lines' | 'dots' 再叠一层细横线或网点，extraAl 它的浓度
function paperBg(c, color = K.paper, o = {}) { const { grain = 1, extra = null, extraAl = 1 } = o; resetT(c); c.fillStyle = color; c.fillRect(-10, -10, W + 20, H + 20); viewT(c);
  texture(c, null, 'paper', grain); if (extra) texture(c, null, extra, extraAl); }
function inkBg(c, color = K.ink, o = {}) { const { grain = 1 } = o; resetT(c); c.fillStyle = color; c.fillRect(-10, -10, W + 20, H + 20); viewT(c); texture(c, null, 'ink', grain); }

// ===================== 木刻墨块与刮痕线 =====================
// rough：闭合轮廓变成木刻刀口一样的毛边。amp 边缘起伏，freq 起伏的长度，spike 长刺的概率，spikeLen 刺长。
//   seed 加上 tick(tau) 边缘就会抖；smooth: false 保留尖角（方框、书脊）
function rough(pts, o = {}) { const { amp = 2.2, freq = 14, spike = 0, spikeLen = 10, seed = 1, step = 3, smooth = true } = o;
  let base = smooth && pts.length > 3 ? spline(pts, 4, true) : pts; if (base.length > 2 && Math.hypot(base[0][0] - base[base.length - 1][0], base[0][1] - base[base.length - 1][1]) < .01) base = base.slice(0, -1);
  const q = densify(base, step, true);
  return offsetRing(q, (k, s) => amp * (.8 * noise1(s / freq, seed) + .35 * noise1(s / (freq * .27), seed + 5)) + (spike && hash(k, seed + 11) < spike ? spikeLen * (.3 + .7 * hash(k, seed + 12)) : 0)); }
// block：一块木刻墨块（或任何颜色的块）。返回 Path2D，可以拿去 clip。
//   grain 在块上铺底纹（深色块铺 ink，浅色块铺 paper），streaks 块里的白色干刷痕条数，dir 刷痕方向
function block(c, pts, color = K.ink, o = {}) { const { al = 1, grain = .8, streaks = 0, dir = -.15, streakCol = K.paper, anchor = null } = o;
  const path = polyPath(rough(pts, o)); c.save(); c.globalAlpha *= al; c.fillStyle = color; c.fill(path);
  const dark = hsl(color)[2] < .4, [ax, ay] = anchor || pts[0]; texture(c, path, dark ? 'ink' : 'paper', grain, ax, ay);
  if (streaks) drybrush(c, path, pts, { n: streaks, dir, color: streakCol, seed: (o.seed || 1) + 31 });
  c.restore(); return path; }
// drybrush：在 path 里刷几道断续的浅色干刷痕（木刻刀留下的白线）
function drybrush(c, path, pts, o = {}) { const { n = 6, dir = -.15, color = K.paper, seed = 1, w = 1.6, al = .75 } = o; const r = rng(seed);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  c.save(); c.clip(path); for (let k = 0; k < n; k++) { const cx = lerp(x0, x1, r()), cy = lerp(y0, y1, r()), L = (x1 - x0) * (.15 + r() * .35), a = dir + (r() - .5) * .3;
    stroke(c, [[cx - Math.cos(a) * L / 2, cy - Math.sin(a) * L / 2], [cx + Math.sin(a) * 4 * (r() - .5), cy], [cx + Math.cos(a) * L / 2, cy + Math.sin(a) * L / 2]], { w: w * (.5 + r()), color, dry: .45, seed: seed + k * 7, al, taper: .5 }); }
  c.restore(); }
// stroke：一笔。填充成多边形：两头收尖、两侧边缘各自粗糙，p 0..1 画出一部分（笔头也收尖，像正在写），
//   dry 0..1 飞白（断续的空隙），rough 线宽起伏，taper 两头收尖的长度占全长的比例，wfn(弧长比例 0..1) 沿线的线宽倍数（近大远小）
function stroke(c, pts, o = {}) { const { w = 4, color = K.ink, p = 1, seed = 1, taper = .3, rough: rg = .22, dry = 0, smooth = true, close = false, al = 1, wfn = null } = o;
  if (p <= 0 || pts.length < 2) return; const q = smooth && pts.length > 2 ? spline(pts, 3, close) : densify(pts, 3, close);
  const s = [0]; for (let i = 1; i < q.length; i++) s.push(s[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1])); const L = s[s.length - 1]; if (L < .5) return;
  const end = L * clamp(p, 0, 1), tl = Math.max(w, L * taper / 2), polys = []; let left = [], right = [];
  const flush = () => { if (left.length > 1) polys.push(left.concat(right.reverse())); left = []; right = []; };
  for (let i = 0; i < q.length && s[i] <= end + 1e-6; i++) { const m = s[i], a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
    if (dry && noise1(m / 22, seed + 3) + .45 * noise1(m / 6, seed + 4) > 1.05 - dry * 1.3) { flush(); continue; }
    const prof = close && p >= 1 ? 1 : Math.sqrt(clamp(Math.min(m / tl, (end - m) / tl), 0, 1)) * .88 + .12, hw = w / 2 * prof * (wfn ? wfn(m / L) : 1);
    left.push([q[i][0] + nx * hw * (1 + rg * noise1(m / 7, seed)), q[i][1] + ny * hw * (1 + rg * noise1(m / 7, seed))]);
    right.push([q[i][0] - nx * hw * (1 + rg * noise1(m / 7, seed + 9)), q[i][1] - ny * hw * (1 + rg * noise1(m / 7, seed + 9))]); }
  flush(); if (!polys.length) return; c.save(); c.globalAlpha *= al; c.fillStyle = color; for (const poly of polys) c.fill(polyPath(poly)); c.restore(); }
// scratch：黑底上的白色刮痕线（stroke 的浅色版，默认带一点飞白）
function scratch(c, pts, o = {}) { stroke(c, pts, { w: 3, color: K.paper, dry: .18, taper: .45, ...o }); }
// outline：闭合轮廓描一圈粗糙的线
function outline(c, pts, o = {}) { stroke(c, pts, { close: true, taper: 0, ...o }); }

// ===================== 字 =====================
// zh：手写体逐字写出。p 0..1 是进度。mode 'write' 每个字从左往右擦出来，'pop' 每个字弹出来。每个字有固定的小倾斜和上下错位。
function zh(c, str, x, y, o = {}) {
  const { size = 72, color = K.ink, p = 1, align = 'left', seed = 3, rot = 0, lh = 1.3, font = ZH, weight = 400, tilt = .04, jitter = .03, mode = 'write', outline: ol = null, ow = .2, al = 1 } = o;
  const lines = String(str).split('\n'), total = lines.reduce((a, l) => a + [...l].length, 0), shown = clamp(p, 0, 1) * total; let idx = 0; if (shown <= 0 || al <= 0) return;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.font = `${weight} ${size}px ${font}`; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; const r = rng(seed);
  lines.forEach((line, li) => { const chars = [...line], ws = chars.map(ch => c.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0); let cx = align === 'center' ? -tw / 2 : align === 'right' ? -tw : 0; const cy = li * size * lh;
    chars.forEach((ch, k) => { const a = clamp(shown - idx, 0, 1), jr = (r() - .5) * 2 * tilt, jy = (r() - .5) * 2 * jitter * size; idx++;
      if (a > 0) { c.save(); c.translate(cx + ws[k] / 2, cy + jy); c.rotate(jr);
        if (mode === 'pop') { const sc = .3 + .7 * easeOutBack(a); c.scale(sc, sc); c.globalAlpha *= Math.min(1, a * 2.5); }
        else if (a < 1) { c.beginPath(); c.rect(-ws[k] / 2 - size * .1, -size * 1.1, (ws[k] + size * .2) * a, size * 1.6); c.clip(); }
        if (ol) { c.lineWidth = size * ow; c.strokeStyle = ol; c.strokeText(ch, -ws[k] / 2, 0); }
        c.fillStyle = color; c.fillText(ch, -ws[k] / 2, 0); c.restore(); }
      cx += ws[k]; }); });
  c.restore(); }
// writeP：从 t0 起每字 per 秒，返回 zh 的进度
const writeP = (t, t0, str, per = .09) => clamp((t - t0) / (per * Math.max(1, [...String(str).replace(/\n/g, '')].length)), 0, 1);
// zhWidth：一行手写字的宽度
function zhWidth(c, str, size, font = ZH, weight = 400) { c.save(); c.font = `${weight} ${size}px ${font}`; const w = c.measureText(str).width; c.restore(); return w; }
// printText：印刷体（隙间月影、笑话正文）：不抖、不倾斜。spacing 是字距（像素）
function printText(c, str, x, y, o = {}) { const { size = 40, color = K.ink, font = 'NSans', weight = 400, align = 'left', al = 1, spacing = 0 } = o; if (al <= 0) return; c.save(); c.globalAlpha *= al; c.font = `${weight} ${size}px ${font}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'alphabetic'; if (spacing) c.letterSpacing = `${spacing}px`; c.fillText(str, x, y); c.restore(); }
// wrapText：按宽度 maxW 把一段印刷体折成多行（中文逐字折，不拆英文单词）
//   句末标点（，。、？！」’”）…）不放到行首：挤进上一行
function wrapText(c, str, maxW, size, font = 'NSans', weight = 400) { c.save(); c.font = `${weight} ${size}px ${font}`; const out = [], tail = '，。、？！」’”）…：；,.!?)';
  for (const para of String(str).split('\n')) { const tokens = para.match(/[A-Za-z0-9.@_\-]+|\s+|./gu) || ['']; let line = '';
    for (const tk of tokens) { if (c.measureText(line + tk).width > maxW && line.trim() && !tail.includes(tk)) { out.push(line.trimEnd()); line = tk.trimStart(); } else line += tk; } out.push(line); }
  c.restore(); return out; }

// img：画一张素材照片（photos.js 里的名字），铺满 (x, y, w, h) 的框，多出来的一边居中裁掉；缩小时用高质量平滑，不起锯齿
function img(c, name, x, y, w, h, o = {}) { const { al = 1, fit = 'cover' } = o, ph = PHOTOS[name]; if (!ph) throw new Error('unknown photo: ' + name); if (al <= 0) return;
  let sx = 0, sy = 0, sw = ph.w, sh = ph.h; const ar = w / h, sar = ph.w / ph.h;
  if (fit === 'cover') { if (sar > ar) { sw = ph.h * ar; sx = (ph.w - sw) / 2; } else { sh = ph.w / ar; sy = (ph.h - sh) / 2; } }
  else if (sar > ar) { const hh = w / sar; y += (h - hh) / 2; h = hh; } else { const ww = h * sar; x += (w - ww) / 2; w = ww; }
  c.save(); c.globalAlpha *= al; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(ph.img, sx, sy, sw, sh, x, y, w, h); c.restore(); return [x, y, w, h]; }

// ===================== 展签字幕与画框 =====================
// caption：左上角的展签小字幕（参考视频的「day 0」）：白底黑框，手写字逐字打出。画在屏幕坐标里，与镜头无关。
//   t 本段时间，t0 出现，t1 开始收起（省略 = 一直在），per 每字秒数
function caption(c, text, t, t0 = 0, o = {}) { const { t1 = Infinity, per = .06, x = 52, y = 46, size = 68, seed = 3 } = o; if (t < t0 || t > t1 + .22) return;
  const pad = size * .42, tw = zhWidth(c, text, size), bw = tw + pad * 2, bh = size * 1.5, k = Math.min(easeOutQuint(clamp((t - t0) / .2, 0, 1)), 1 - easeIn(clamp((t - t1) / .22, 0, 1)));
  if (k <= .01) return; c.save(); resetT(c); const sd = seed + tick(t, 6), box = rectPts(x, y, bw * k, bh);
  c.fillStyle = K.card; c.fill(polyPath(rough(box, { amp: 1, freq: 30, seed: sd, smooth: false })));
  outline(c, box, { w: 4.6, color: K.ink, seed: sd + 1, smooth: false, rough: .3 });
  c.beginPath(); c.rect(x, y - 4, bw * k, bh + 8); c.clip(); zh(c, text, x + pad, y + bh * .72, { size, color: K.ink, p: writeP(t, t0 + .12, text, per), seed, tilt: .02, jitter: .015 });
  c.restore(); viewT(c); }
// frameBorder：整片外圈手画的粗黑框（像画框）。内侧一条断续的细白线，只在黑底画面上看得见。film.js 每帧最后画。
function frameBorder(c, tau) { c.save(); resetT(c); const sd = tick(tau, 6), m = 18, inner = rough(rectPts(m, m, W - m * 2, H - m * 2), { amp: 2.6, freq: 38, seed: sd, step: 5, smooth: false });
  const p = new Path2D(); p.rect(-40, -40, W + 80, H + 80); p.addPath(polyPath(inner.slice().reverse())); c.fillStyle = K.ink; c.fill(p, 'evenodd');
  outline(c, rectPts(m + 9, m + 9, W - m * 2 - 18, H - m * 2 - 18), { w: 1.7, color: K.paper, al: .5, dry: .55, seed: sd + 3, smooth: false, rough: .4 });
  c.restore(); }

// ===================== 觉之瞳 =====================
// eyeLines：在墨块上用白色刮痕画觉之瞳：只有眼皮线和睫毛，没有眉毛。(x, y) 墨块中心，r 眼的半宽。
//   lid 0..1 眼皮线画出的进度；open 0 紧闭（下弯的眼皮线和睫毛）、.4 半睁、1 全睁；look [-1..1, -1..1] 瞳孔方向
//   iris 瞳孔颜色；w 线宽；seed 配 tick(tau)；color 线色（可以带透明度）
function eyeLines(c, x, y, r, o = {}) { const { lid = 1, open = 0, look = [0, 0], iris = K.ink, w = r * .08, seed = 1, rot = 0, color = K.paper } = o; const T = tf(x, y - r * .14, r, rot);
  const up = u => lerp(.2, -.42, open) * (1 - u * u), lo = u => .2 * (1 - u * u), xs = Array.from({ length: 13 }, (_, k) => -1 + k / 6);
  if (open > .02) { const sclera = [...xs.map(u => [u, up(u)]), ...xs.slice().reverse().map(u => [u, lo(u)])]; const path = polyPath(M(T, sclera)); c.save(); c.fillStyle = color; c.fill(path); c.clip(path);
    const [ix, iy] = T(look[0] * .32, .02 + look[1] * .08); c.fillStyle = iris; c.beginPath(); c.arc(ix, iy, r * .3, 0, TAU); c.fill(); c.fillStyle = color; c.beginPath(); c.arc(ix + r * .08, iy - r * .09, r * .07, 0, TAU); c.fill();
    stroke(c, M(T, xs.map(u => [u, up(u) + .03])), { w: w * 1.5, color: K.ink, seed: seed + 2, taper: .2 }); c.restore(); }
  stroke(c, M(T, xs.map(u => [u, open > .02 ? up(u) : lo(u)])), { w: w * (1.2 + (1 - open) * .3), color, p: lid, seed: seed + 3, taper: .35 });
  if (open < .5) for (let k = 0; k < 5; k++) { const u = -.62 + k * .31, a = lid * 5 - k; if (a <= 0) continue; const b = [u, lo(u)], d = [u * 1.25, lo(u) + .26 * (1 - Math.abs(u) * .4)];
    stroke(c, M(T, [b, d]), { w: w * .75, color, p: clamp(a, 0, 1) * (1 - open * 2), seed: seed + 10 + k, taper: .6, smooth: false }); } }

// ===================== 段与段的交接画面 =====================
// 相邻两段用同一张静止画面交接：前一段最后至少 0.1 秒、后一段最前至少 0.1 秒都只画这一张，拼起来看不出接缝。
//   handoffBlack    纯墨底：2→3、4→5、6→7
//   handoffSukima   隙间月影的纸 #F7F6F4：1→2（三眼的隙间裂开后满屏是这张纸）
//   handoffStream   暖白纸上一条横贯画面的灰墨小溪线，在画面下三分之一（y≈720）：3→4（魔药流下来摊开成小溪，雏祭从这条线开始）
//   handoffDot      暖白纸正中一个黑色圆点（半径 DOT_R）：5→6（会赢的收成一个黑点，红黑榜把它当第一张黑点贴纸）
//   handoffDesk     第 1 段开头的空桌面（镜头 zoom 1.04，墨水瓶、茶杯印、糖、日记纸，笔还在画面外）：7→1（片尾的墨被钢笔吸回去，片头再滴下来）。
//                   道具画在 1-sanyan.js 的 s1DeskProps 里；运行时所有脚本都已载入，所以这里可以直接调用
const SUKIMA_PAPER = '#F7F6F4';
const STREAM = Array.from({ length: 49 }, (_, k) => [-40 + k * 42, 720 + 16 * Math.sin(k * .55) + 8 * Math.sin(k * 1.3 + 1)]);
function handoffBlack(c) { setView(null); inkBg(c); }
function handoffSukima(c) { setView(null); resetT(c); c.fillStyle = SUKIMA_PAPER; c.fillRect(-10, -10, W + 20, H + 20); texture(c, null, 'paper', .35); }
function handoffStream(c) { setView(null); paperBg(c); stroke(c, STREAM, { w: 10, color: K.g3, seed: 5, taper: 0, rough: .25 }); }
const DOT_R = 34;
function handoffDot(c) { setView(null); paperBg(c); block(c, ellPts(CX, CY, DOT_R, DOT_R, 0, 40), K.ink, { amp: 1.2, seed: 7, grain: .4 }); }
const DESK_VIEW = { x: CX, y: CY, zoom: 1.04 };
function handoffDesk(c) { setView(DESK_VIEW); paperBg(c); s1DeskProps(c); }
