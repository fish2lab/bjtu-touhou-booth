'use strict';
// 第 4 段 雏 祭（12.2 秒）。流雏：把纸人偶放进河里带走厄运，键山雏在岸边把顺水漂来的厄收走。
// 画法是水墨淡彩：暖白纸上几层淡墨，水是几层淡墨加横向刷痕；唯一的颜色是雏的暗红缎带 K.vermil。
// 雏本人不出场：远岸上一条红缎带自己打着转，转成裙摆的样子，顶上一只蝴蝶结，就是她。
//
// 0–0.15    交接画面 handoffStream（第 3 段魔药流成的小溪线）
// 0.15–1.4  这条线就是远岸的水线：近岸从它身上剥下来往下滑，中间漫开淡墨；远山升起，芦苇长出来，缎带转着长高
// 0.85–6.7  纸人偶坐在小草船上漂过，头顶一缕灰墨「厄」，经过缎带时被一把卷走
// 2.6–11.8  三个漂流瓶依次漂来，在缎带前急刹停住：一号的厄被卷走；二号的木塞先被拔飞又落回去；
//           三号第一下没拽动、弹回去，停一拍，第二下拽走。卷完瓶子往后一缩，嗖地漂出画面
// 3.9–5.7   左上写出摊宣原话「留下想说的话 / 雏人偶会把厄运带走吧——」；1.4 起右边竖排日文作点缀
// 10.9–11.3 缎带缠满了厄，突然停住不转，裙摆往里收，蝴蝶结歪一下
// 11.3–11.8 猛地一转，攒下的厄炸成满屏黑墨；11.8 起只画 handoffBlack，交给第 5 段

const S4 = {
  END: 12.2, IN: .15, FREEZE: 10.9, BURST: 11.3, BLACK: 11.8,
  RX: 1090, RB: 612, RT: 330, TURNS: 3,        // 缎带：轴的 x、底 y（站在远岸上）、顶 y、圈数
  XS: 850, NEAR: 272,                          // 瓶子被定住的 x；近岸线在远岸线下多少
  L1: '留下想说的话', L2: '雏人偶会把厄运带走吧——', t1: 3.9, t2: 4.6,
  JA: ['川を流れて行く運命の雛人形を、', '拾ってしまいましたね'], tJa: 1.4,
};
const S4RED = { fb: mix(K.vermil, K.ink, .38), bf: mix(K.vermil, K.ink, .3), bb: mix(K.vermil, K.ink, .55), dk: mix(K.vermil, K.ink, .25) };
// 远岸水线就是交接的小溪线 STREAM（同一个公式，连续取值）；近岸线在它下面，e 是剥开的进度
const s4Far = x => { const k = (x + 40) / 42; return 640 + 16 * Math.sin(k * .55) + 8 * Math.sin(k * 1.3 + 1); };
const s4Near = (x, e) => s4Far(x) + e * (S4.NEAR + 16 * Math.sin(x / 300 + 2) + 8 * Math.sin(x / 97));

// ===================== 漂流物的时间表 =====================
// doll 匀速漂过，经过时厄被卷走；bottle 在 arr 急刹停在 XS，yank 里被拽走厄（第三个元素为 1 = 这一下没拽动），dep 起后缩一下嗖地漂走。
// 数组下标也是这缕厄缠到缎带上的位置（S4COIL）
const S4OBJ = [
  { kind: 'doll', lane: 792, t0: .85, v: 400, yank: [[3.3, 3.85]], seed: 11 },
  { kind: 'bottle', ph: 'bottle1', lane: 806, arr: 4.8, dep: 6.0, yank: [[5.1, 5.65]], seed: 21 },
  { kind: 'bottle', ph: 'bottle2', lane: 822, arr: 6.8, dep: 8.0, pop: 7.06, yank: [[7.16, 7.7]], seed: 31 },
  { kind: 'bottle', ph: 'bottle3', lane: 800, arr: 8.8, dep: 10.45, yank: [[9.05, 9.45, 1], [9.75, 10.3]], seed: 41 },
];
const S4COIL = [.03, .25, .45, .63];
// s4Yank：这一刻被拽的进度 u（0 悬着，1 缠到缎带上；没拽动的那一下拉到 .45 再弹回、略微过头），done = 已经被卷走
function s4Yank(o, t) { let done = false;
  for (const [a, b, fail] of o.yank) { if (t < a) break;
    if (t <= b) { if (!fail) return { u: sm(a, b, t, easeInOutSine), done: false }; const m = lerp(a, b, .55);
      return { u: t < m ? .45 * easeOut((t - a) / (m - a)) : .45 * (1 - easeOutBack((t - m) / (b - m), 2.2)), done: false }; }
    if (!fail) done = true; }
  return { u: 0, done }; }
// s4Pos：水面上的位置 x、水线 y、倾斜 rot、被拽时往上一提 lift、速度 v（决定厄往后飘多少）
function s4Pos(o, t) { const ya = s4Yank(o, t), pull = Math.sin(Math.PI * clamp(Math.abs(ya.u), 0, 1));
  if (o.kind === 'doll') return { x: -220 + o.v * (t - o.t0), y: o.lane + 3 * Math.sin(t * 3 + o.seed), rot: .05 * Math.sin(t * 2.4 + o.seed) + .16 * pull, lift: -8 * pull, v: o.v, ...ya };
  const tr = o.arr - t, B = .45, V = 520; let x, v;
  if (tr > B) { x = S4.XS - V * (tr - B / 2); v = V; }                      // 顺水漂来
  else if (tr > 0) { x = S4.XS - V * tr * tr / (2 * B); v = V * tr / B; }   // 急刹
  else { const d = t - o.dep; if (d < 0) { x = S4.XS; v = 0; }             // 被定住
    else if (d < .14) { x = S4.XS - 16 * easeOut(d / .14); v = 0; }        // 往后一缩
    else { const q = d - .14; x = S4.XS - 16 + 360 * q + 460 * q * q; v = 360 + 920 * q; } }   // 嗖地漂走
  const rot = .035 * Math.sin(t * 2.2 + o.seed * 1.7) + settle(t, o.arr - .08, { amp: .15, freq: 1.3, decay: 3.2 })
    - .1 * sm(o.dep + .02, o.dep + .16, t) * (1 - sm(o.dep + .5, o.dep + 1.1, t)) + .12 * pull;
  return { x, y: o.lane + 4 * Math.sin(t * 3.1 + o.seed), rot, lift: -14 * pull, v, ...ya }; }
// s4Cork：二号瓶的木塞被拔飞、翻一圈落回瓶口再弹两下（瓶子局部坐标里的偏移）
function s4Cork(o, t) { if (!o.pop || t < o.pop) return { dx: 0, dy: 0, rot: 0, off: false }; const u = t - o.pop, D = .8;
  if (u < D) { const f = u / D; return { dx: 44 * Math.sin(Math.PI * f), dy: -760 * f * (1 - f), rot: f * TAU, off: f < .97 }; }
  return { dx: 0, dy: -Math.abs(settle(t, o.pop + D, { amp: 20, freq: 1.8, decay: 5 })), rot: 0, off: false }; }
// s4Phi：缎带转过的角度。平时慢慢转，每拽一下猛转一圈多，FREEZE 起停住，BURST 起猛转三圈
function s4Phi(t) { let p = 2.4 * Math.min(t, S4.FREEZE);
  for (const o of S4OBJ) for (const [a, b, fail] of o.yank) p += TAU * (fail ? .45 : 1.2) * sm(a - .08, b + .12, t, easeInOutQuint);
  return p + TAU * 3 * sm(S4.BURST, S4.BLACK, t, easeIn); }

// ===================== 远山、水、两岸 =====================
// 远山：淡墨的山影从远岸线上升起来，山腰用纸色横刷出几道雾
const S4HILLS = [
  { al: .42, pts: [[1100, 20], [1180, 62], [1260, 118], [1330, 148], [1392, 205], [1452, 188], [1520, 138], [1600, 160], [1680, 108], [1760, 84], [1850, 62], [1980, 40]] },
  { al: .6, pts: [[1340, 10], [1440, 56], [1540, 96], [1610, 86], [1700, 122], [1780, 96], [1860, 70], [1980, 48]] },
  { al: .45, pts: [[-60, 58], [40, 96], [140, 112], [230, 88], [330, 120], [420, 84], [520, 58], [640, 30], [760, 10]] },
];
function s4Hills(c, t, k) { if (k <= 0) return;
  S4HILLS.forEach((h, j) => { const top = h.pts.map(([x, hh]) => [x, s4Far(x) - hh * k]), bot = h.pts.slice().reverse().map(([x]) => [x, s4Far(x) + 8]);
    block(c, [...top, ...bot], K.g1, { al: h.al, amp: 1.6, freq: 22, grain: .6, seed: 60 + j, smooth: false }); });
  for (const [x0, x1, hh, j] of [[1230, 1520, 70, 0], [1560, 1880, 52, 1], [60, 380, 50, 2]]) scratch(c, [[x0, s4Far(x0) - hh * k], [lerp(x0, x1, .5), s4Far(lerp(x0, x1, .5)) - (hh + 6) * k], [x1, s4Far(x1) - (hh - 4) * k]], { w: 8, dry: .35, al: .85, seed: 70 + j + tick(t) }); }

// 水：一层淡墨打底，远岸下一道影子，几条更淡的长墨带，一层细横线，再是几十道横向刷痕顺水往右流
const S4BANDS = [[.22, 0, 820, 20, 110], [.5, 900, 1000, 26, 140], [.72, 300, 700, 16, 95], [.36, 1500, 900, 14, 125], [.86, 1900, 600, 12, 160]];
const S4STREAKS = (() => { const r = rng(404), out = [];
  for (let k = 0; k < 44; k++) { const v = .05 + r() * .9, mid = 1 - Math.min(1, Math.abs(v - .45) * 1.8);
    out.push({ v, x0: r() * 2800, len: 70 + r() * 300, w: 1.6 + r() * 5, col: r() < .62 ? K.g2 : K.g3, al: .3 + r() * .45, sp: 170 + 230 * mid + r() * 60, dry: .25 + r() * .4, k }); }
  return out; })();
function s4Water(c, t, e) { if (e <= 0) return; const xs = []; for (let x = -60; x <= W + 60; x += 30) xs.push(x); const sd = tick(t);
  const top = xs.map(x => [x, s4Far(x)]), bot = xs.map(x => [x, s4Near(x, e)]).reverse();
  const path = block(c, [...top, ...bot], K.g1, { al: .62, amp: 1.5, grain: .5, seed: 401, smooth: false });
  c.save(); c.clip(path); texture(c, null, 'lines', .9);
  fillPts(c, [...top, ...xs.map(x => [x, s4Far(x) + 14 + 6 * Math.sin(x / 70)]).reverse()], K.g2, .3 * e);
  for (const [v, x0, len, h, sp] of S4BANDS) { const xa = ((x0 + sp * t) % 2900) - 500, n = 16, up = [], dn = [];
    for (let j = 0; j <= n; j++) { const f = j / n, x = xa + f * len, y = lerp(s4Far(x), s4Near(x, e), v), hh = h * e * Math.sin(Math.PI * f); up.push([x, y - hh / 2]); dn.push([x, y + hh / 2]); }
    fillPts(c, [...up, ...dn.reverse()], K.g2, .2); }
  for (const s of S4STREAKS) { const xa = ((s.x0 + s.sp * t) % 2800) - 440, pts = [];
    for (let j = 0; j <= 4; j++) { const x = xa + j / 4 * s.len; pts.push([x, lerp(s4Far(x), s4Near(x, e), s.v) + 2.5 * Math.sin(x / 40 + s.k)]); }
    stroke(c, pts, { w: s.w * (.4 + .6 * e), color: s.col, al: s.al * e, dry: s.dry, taper: .45, seed: s.k * 7 + 3 + sd }); }
  c.restore(); }

// 远岸：交接的那条线收细成岸线，岸上长出草丛和几株芦苇（缎带站的地方空着）
const S4TUFTS = (() => { const r = rng(77), out = []; for (let x = -20; x < 1960; x += 36 + r() * 50) { if (x > 950 && x < 1240) continue; out.push({ x, n: 2 + (r() * 3 | 0), h: 10 + r() * 22, k: out.length }); } return out; })();
const S4REEDS = [[70, 150], [250, 118], [1330, 165], [1398, 122], [1590, 150], [1690, 108]];
function s4FarBank(c, t, e, g) { const sd = tick(t);
  stroke(c, STREAM, { w: lerp(10, 6, e), color: K.g3, seed: 5 + (e > 0 ? sd : 0), taper: 0, rough: .25, dry: .12 * e });
  if (g <= 0) return;
  for (const q of S4TUFTS) { const y = s4Far(q.x) - 2; for (let j = 0; j < q.n; j++) { const a = -Math.PI / 2 + (j - (q.n - 1) / 2) * .35 + .06 * Math.sin(t * 2 + q.k), h = q.h * (.7 + .3 * hash(q.k * 5 + j, 3));
    stroke(c, [[q.x + j * 4, y], [q.x + j * 4 + Math.cos(a) * h * .5, y + Math.sin(a) * h * .55], [q.x + j * 4 + Math.cos(a) * h, y + Math.sin(a) * h]], { w: 2.4, color: K.g3, p: g, seed: q.k * 11 + j + sd, taper: .6 }); } }
  S4REEDS.forEach(([x, h], k) => { const y = s4Far(x) - 2, sw = 6 * Math.sin(t * 2.1 + k * 1.7), tip = [x + sw + 8, y - h * g];
    stroke(c, [[x, y], [x + sw * .4 + 3, y - h * g * .5], tip], { w: 2.6, color: K.g3, seed: 90 + k + sd, taper: .3 });
    stroke(c, [[x + 1, y - h * g * .3], [x + 22, y - h * g * .5], [x + 34, y - h * g * .42]], { w: 2, color: K.g3, p: g, seed: 96 + k + sd, taper: .7 });
    if (g > .8) block(c, ellPts(tip[0] + 9, tip[1] + 12, 7, 24, -.35 + sw * .02, 16), K.g3, { amp: 1.2, spike: .15, spikeLen: 5, seed: 100 + k + sd, grain: .5 }); }); }

// 近岸：从画面底下升上来，灰墨的土坡，岸边一排墨线草；前景两角是木刻的墨色长草叶，把小溪框住
const S4NEARTUFTS = (() => { const r = rng(88), out = []; for (let x = -10; x < 1950; x += 26 + r() * 44) out.push({ x, n: 2 + (r() * 4 | 0), h: 16 + r() * 34, k: out.length }); return out; })();
function s4NearBank(c, t, g) { if (g <= 0) return; const sd = tick(t), lift = (1 - g) * 300, xs = []; for (let x = -60; x <= W + 60; x += 30) xs.push(x);
  const top = xs.map(x => [x, s4Near(x, 1) + lift]);
  block(c, [...top, [W + 60, H + 60], [-60, H + 60]], K.g2, { al: .55, amp: 1.5, grain: .9, seed: 501, smooth: false });
  for (let k = 0; k < 7; k++) { const x = 80 + k * 270 + 60 * Math.sin(k * 3), y = s4Near(x, 1) + lift + 50 + (k % 3) * 38; stroke(c, [[x, y], [x + 160, y + 4], [x + 260, y - 2]], { w: 3, color: K.g3, dry: .5, al: .7, seed: 510 + k + sd, taper: .5 }); }
  stroke(c, top, { w: 6, color: K.ink, dry: .15, taper: 0, seed: 520 + sd });
  for (const q of S4NEARTUFTS) { const y = s4Near(q.x, 1) + lift + 2; for (let j = 0; j < q.n; j++) { const a = -Math.PI / 2 + (j - (q.n - 1) / 2) * .3 + .08 * Math.sin(t * 2.3 + q.k), h = q.h * (.6 + .4 * hash(q.k * 7 + j, 5));
    stroke(c, [[q.x + j * 5, y + 4], [q.x + j * 5 + Math.cos(a) * h * .5, y + Math.sin(a) * h * .5], [q.x + j * 5 + Math.cos(a) * h, y + Math.sin(a) * h]], { w: 3.2, color: K.ink, seed: q.k * 13 + j + sd, taper: .6 }); } }
  for (const [x, dy, r] of [[330, 70, 16], [352, 78, 10], [1240, 96, 20], [1540, 60, 12]]) block(c, ellPts(x, s4Near(x, 1) + lift + dy, r, r * .62, 0, 16), K.ink, { amp: 1.2, seed: 530 + x + sd, grain: .6 }); }
const S4FG = (() => { const r = rng(91), out = [];
  for (let k = 0; k < 9; k++) out.push({ x: -30 + k * 30 + r() * 20, h: 240 + r() * 230, lean: 20 + r() * 80, w: 14 + r() * 12, k });
  for (let k = 0; k < 8; k++) out.push({ x: 1700 + k * 32 + r() * 20, h: 220 + r() * 230, lean: -(20 + r() * 80), w: 14 + r() * 12, k: k + 20 });
  return out; })();
function s4FgReeds(c, t, g) { if (g <= 0) return; const sd = tick(t);
  for (const b of S4FG) { const sway = 8 * Math.sin(t * 2.2 + b.k), h = b.h * g, B = [b.x, H + 30], C = [b.x + b.lean * .15, H + 30 - h * .6], T = [b.x + (b.lean + sway) * g, H + 30 - h], L = [], R = [];
    for (let j = 0; j <= 12; j++) { const f = j / 12, u = 1 - f, p = [u * u * B[0] + 2 * u * f * C[0] + f * f * T[0], u * u * B[1] + 2 * u * f * C[1] + f * f * T[1]],
      d = [2 * u * (C[0] - B[0]) + 2 * f * (T[0] - C[0]), 2 * u * (C[1] - B[1]) + 2 * f * (T[1] - C[1])], l = Math.hypot(d[0], d[1]) || 1, hw = b.w / 2 * Math.pow(1 - f, .8);
      L.push([p[0] - d[1] / l * hw, p[1] + d[0] / l * hw]); R.push([p[0] + d[1] / l * hw, p[1] - d[0] / l * hw]); }
    block(c, [...L, ...R.reverse()], K.ink, { amp: .8, freq: 10, grain: .5, seed: 900 + b.k + sd, smooth: false }); } }

// ===================== 雏的缎带 =====================
// 缎带绕着一根竖轴螺旋上升，下宽上窄像转开的裙摆。缎带本身还会翻面：正面 K.vermil，反面压暗；转到后面的半圈再暗一档。
// sq 是裙摆收紧的比例（停住蓄力时往里收）
const s4R = s => 20 + 100 * Math.pow(1 - s, 1.25);
function s4Helix(phi, grow, sq, n = 150) { const out = [];
  for (let i = 0; i <= n; i++) { const s = i / n * grow, r = s4R(s) * sq, th = s * TAU * S4.TURNS + phi, ps = s * TAU * 2.3 - phi * .4;
    out.push({ x: S4.RX + r * Math.cos(th), y: lerp(S4.RB, S4.RT, s) + r * .26 * Math.sin(th), front: Math.sin(th) > 0, w: (17 - 8 * s) * Math.cos(ps) }); }
  return out; }
// s4Runs：沿线切成一段段（前半圈 / 后半圈、正面 / 反面各一段），相邻两段共用切口上的点
function s4Runs(P, withW) { const runs = []; let cur = null;
  for (let i = 0; i < P.length; i++) { const p = P[i], key = (p.front ? 'f' : 'b') + (withW && p.w < 0 ? '-' : '+');
    let L = [p.x, p.y], R = null;
    if (withW) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, h = p.w / 2; L = [p.x - ty / l * h, p.y + tx / l * h]; R = [p.x + ty / l * h, p.y - tx / l * h]; }
    if (!cur || cur.key !== key) { const prev = cur; cur = { key, front: p.front, face: key[1] === '+', L: [], R: [] }; runs.push(cur); if (prev) { cur.L.push(prev.L[prev.L.length - 1]); if (withW) cur.R.push(prev.R[prev.R.length - 1]); } }
    cur.L.push(L); if (withW) cur.R.push(R); }
  return runs; }
// 缠在缎带上的厄：比缎带略外一圈的灰墨螺旋
function s4CoilPts(k, phi, sq, n = 40) { const out = [];
  for (let i = 0; i <= n; i++) { const s = S4COIL[k] + i / n * .26, r = s4R(s) * sq * 1.14 + 5, th = s * TAU * 2.4 + phi + k * 1.9;
    out.push({ x: S4.RX + r * Math.cos(th), y: lerp(S4.RB, S4.RT, s) + r * .26 * Math.sin(th) - 6, front: Math.sin(th) > 0 }); }
  return out; }
// s4Smoke：一缕灰墨，粗的一笔 g2 加一根细的 g3 缠在旁边
function s4Smoke(c, pts, sd, al = 1, w = 7) { if (pts.length < 2) return;
  stroke(c, pts, { w, color: K.g2, dry: .28, taper: .55, seed: sd, al });
  stroke(c, pts.map(([x, y], j) => [x + 5 * Math.sin(j * 1.7 + sd), y + 3 * Math.cos(j * 1.3)]), { w: w * .34, color: K.g3, dry: .2, taper: .5, seed: sd + 1, al }); }
// 蝴蝶结：两只圈、两条短飘带、中间一个结
function s4Bow(c, x, y, s, rot, sd) { const T = tf(x, y, s, rot);
  for (const d of [-1, 1]) { block(c, M(T, [[d * .12, .12], [d * .38, .95], [d * .6, 1.25], [d * .72, 1.1], [d * .5, .8], [d * .22, .05]]), S4RED.dk, { amp: .8, seed: sd + 5 + d, grain: .4, smooth: false });
    block(c, M(T, [[0, 0], [d * .45, -.6], [d * 1.05, -.66], [d * 1.2, -.2], [d * .98, .3], [d * .42, .22]]), K.vermil, { amp: 1, seed: sd + d, grain: .4 });
    stroke(c, M(T, [[d * .18, -.04], [d * .62, -.34], [d * .98, -.36]]), { w: 2.2, color: K.ink, seed: sd + 3 + d, al: .75 });
    stroke(c, M(T, [[d * .2, .06], [d * .7, .12], [d * .96, .06]]), { w: 1.8, color: K.ink, seed: sd + 7 + d, al: .6 }); }
  block(c, M(T, ellPts(0, 0, .2, .25, 0, 14)), S4RED.dk, { amp: .6, seed: sd + 9, grain: .4 }); }
function s4Ribbon(c, t, phi, grow, sq, sd) { if (grow <= 0) return;
  const col = r => r.front ? (r.face ? K.vermil : S4RED.fb) : (r.face ? S4RED.bf : S4RED.bb);
  const runs = s4Runs(s4Helix(phi, grow, sq), true), coils = S4OBJ.map((o, k) => s4Yank(o, t).done ? s4Runs(s4CoilPts(k, phi, sq), false) : []);
  const ribbonPass = front => runs.forEach((r, j) => { if (r.front !== front) return; const poly = [...r.L, ...r.R.slice().reverse()]; if (poly.length >= 4) block(c, poly, col(r), { smooth: false, amp: .8, freq: 9, grain: .45, seed: sd + j }); });
  const coilPass = front => coils.forEach((cr, k) => cr.forEach((r, j) => { if (r.front === front && r.L.length > 1) s4Smoke(c, r.L, sd + k * 17 + j, front ? 1 : .7, 6); }));
  // 脚下转起来的两道弧
  const [gx, gy] = [S4.RX, S4.RB + 22]; for (let k = 0; k < 2; k++) { const a0 = phi * 1.3 + k * Math.PI, pts = []; for (let j = 0; j <= 10; j++) { const a = a0 + j / 10 * 1.9; pts.push([gx + Math.cos(a) * 138 * sq, gy + Math.sin(a) * 15]); } stroke(c, pts, { w: 2.6, color: K.g3, al: .8 * grow, dry: .3, seed: 40 + k + sd, taper: .6 }); }
  coilPass(false); ribbonPass(false); ribbonPass(true); coilPass(true);
  // 转得快的时候，裙摆前面多几道速度弧
  const spd = (s4Phi(t + 1 / 12) - s4Phi(t - 1 / 12)) * 6, sa = clamp((spd - 5) / 6, 0, 1);
  if (sa > 0) for (const [s, k] of [[.12, 0], [.42, 1], [.7, 2]]) { const r = s4R(s) * sq * 1.4 + 10, y = lerp(S4.RB, S4.RT, s), pts = []; for (let j = 0; j <= 10; j++) { const a = .5 + k * .3 + j / 10 * 1.4; pts.push([S4.RX + Math.cos(a) * r, y + Math.sin(a) * r * .3]); } stroke(c, pts, { w: 2.4, color: K.g3, al: sa, dry: .25, seed: 60 + k + sd, taper: .7 }); }
  const bow = easeOutBack(clamp((grow - .9) / .1, 0, 1)); if (bow > .01) s4Bow(c, S4.RX + 2, S4.RT - 14, 38 * bow, .12 * Math.sin(t * 5) - .32 * sm(S4.FREEZE, S4.FREEZE + .15, t), 80 + sd); }

// ===================== 纸人偶与漂流瓶 =====================
// 纸人（形代）：圆头、平伸的袖子、梯形的身子，白纸墨边，不画五官。top: 'hat' 戴乌帽子，'hair' 披发
function s4Paper(c, U, sd, top) { const body = [[-9, -84], [-34, -80], [-36, -68], [-13, -66], [-24, 0], [24, 0], [13, -66], [36, -68], [34, -80], [9, -84]];
  block(c, M(U, body), K.card, { smooth: false, amp: .7, seed: sd, grain: .4 }); outline(c, M(U, body), { w: 2.4, seed: sd + 1, smooth: false });
  stroke(c, M(U, [[-8, -82], [0, -62], [8, -82]]), { w: 2, seed: sd + 2, smooth: false }); stroke(c, M(U, [[-16, -40], [16, -40]]), { w: 5, seed: sd + 3, smooth: false });
  stroke(c, M(U, [[2, -36], [4, -2]]), { w: 1.4, color: K.g2, seed: sd + 4 });
  block(c, M(U, ellPts(0, -99, 13, 14, 0, 20)), K.card, { amp: .6, seed: sd + 5, grain: .3 }); outline(c, M(U, ellPts(0, -99, 13, 14, 0, 20)), { w: 2.2, seed: sd + 6 });
  if (top === 'hat') block(c, M(U, [[-11, -106], [-9, -124], [-2, -134], [7, -128], [11, -107]]), K.ink, { smooth: false, amp: .6, seed: sd + 7, grain: .4 });
  else block(c, M(U, [[-15, -80], [-15, -100], [-11, -110], [-4, -114], [5, -114], [11, -110], [15, -100], [15, -80], [10, -80], [10, -99], [0, -104], [-10, -99], [-10, -80]]), K.ink, { smooth: false, amp: .6, seed: sd + 7, grain: .4 }); }
// s4Doll：小草船上站着一对纸人，船头靠着一张折起来的字条。(x, y) 船在水面的中点，返回头顶的位置（厄从这里冒出来）
function s4Doll(c, x, y, rot, sd) { const T = tf(x, y, 1.15, rot);
  const hull = [[-94, -8], [-60, -3], [0, -1], [60, -3], [94, -8], [82, 10], [50, 21], [0, 25], [-50, 21], [-82, 10]];
  block(c, M(T, hull), K.g3, { amp: 1.1, seed: sd + 40, grain: .7 });
  for (let k = -7; k <= 7; k++) scratch(c, M(T, [[k * 11 - 3, 0], [k * 11 + 4, 18]]), { w: 1.6, seed: sd + 50 + k, al: .65 });
  const rim = ellPts(0, -8, 94, 12, 0, 36); block(c, M(T, rim), K.g1, { amp: .8, seed: sd + 41, grain: .6 });
  for (const r of [.55, .8]) stroke(c, M(T, ellPts(0, -8, 94 * r, 12 * r, 0, 30).slice(0, 16)), { w: 1.4, color: K.g2, seed: sd + 44 + r * 10 });
  outline(c, M(T, rim), { w: 2.6, seed: sd + 42 });
  s4Paper(c, (u, v) => T(-24 + u, -8 + v), sd + 60, 'hat'); s4Paper(c, (u, v) => T(22 + u * .9, -6 + v * .9), sd + 70, 'hair');
  const SL = tf(...T(62, -18), 1.15, rot + .38), slip = [[-13, -19], [13, -19], [13, 16], [-13, 16]];
  block(c, M(SL, slip), K.card, { smooth: false, amp: .6, seed: sd + 80, grain: .3 }); outline(c, M(SL, slip), { w: 2, seed: sd + 81, smooth: false });
  stroke(c, M(SL, [[-13, -19], [0, -6], [13, -19]]), { w: 1.4, seed: sd + 82, smooth: false, color: K.g3 });
  for (const v of [2, 9]) stroke(c, M(SL, [[-8, v], [-3, v - 2], [2, v], [7, v - 2]]), { w: 1.6, color: K.g3, seed: sd + 83 + v });
  return T(-24, -148); }
// 漂流瓶的轮廓（局部坐标，原点在瓶肚中心）：圆肚、瓶肩、瓶颈、外翻的瓶口
const S4GLASS = (() => { const out = [], R = 116, a0 = .25;
  for (let k = 0; k <= 40; k++) { const a = -Math.PI / 2 + a0 + k / 40 * (TAU - 2 * a0); out.push([Math.cos(a) * R, Math.sin(a) * R * .97]); }
  out.push([-24, -150], [-23, -168], [-30, -172], [-30, -184], [30, -184], [30, -172], [23, -168], [24, -150]); return out; })();
const S4PR = 86, S4PY = -12;   // 头像圆的半径和圆心（瓶肚里偏上，水线碰不到它）
const s4Arc = (x, y, r, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, j) => { const a = lerp(a0, a1, j / n); return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
// s4Bottle：墨线漂流瓶。头像裁成圆形放在瓶肚里（按原样），玻璃高光轻轻压住一点头像边。(x, y) 瓶肚中心；cork 是木塞的偏移。返回厄冒出来的位置
function s4Bottle(c, x, y, rot, ph, sd, cork) { const T = tf(x, y, 1, rot), glass = M(T, S4GLASS);
  block(c, glass, K.paper2, { smooth: false, amp: 1, grain: .6, seed: sd });
  const [px, py] = T(0, S4PY); c.save(); c.beginPath(); c.arc(px, py, S4PR, 0, TAU); c.clip(); c.translate(px, py); c.rotate(rot); c.drawImage(PHOTOS[ph].img, -S4PR, -S4PR, S4PR * 2, S4PR * 2); c.restore();
  outline(c, ellPts(px, py, S4PR + 1.5, S4PR + 1.5, 0, 48), { w: 2.4, color: K.g3, seed: sd + 1, rough: .2 });
  for (let k = 0; k < 3; k++) stroke(c, M(T, s4Arc(0, 0, 100 + k * 5, .15 + k * .12, .95 + k * .1)), { w: 2, color: K.g2, seed: sd + 10 + k, taper: .6, dry: .2 });   // 玻璃暗面的刻线
  stroke(c, M(T, s4Arc(0, S4PY * .5, S4PR + 2, Math.PI + .5, Math.PI + 1.15)), { w: 11, color: K.card, al: .92, seed: sd + 20, taper: .7 });   // 高光，压住头像边一点
  stroke(c, M(T, s4Arc(0, 0, 105, Math.PI + .45, Math.PI + .8, 6)), { w: 4.5, color: K.card, seed: sd + 21, taper: .6 });
  stroke(c, M(T, [[-15, -150], [-14, -170]]), { w: 4, color: K.card, seed: sd + 22, taper: .5 });
  outline(c, glass, { w: 4.4, color: K.ink, seed: sd + 2, smooth: false, rough: .3 });
  stroke(c, M(T, [[-30, -172], [30, -172]]), { w: 2.4, seed: sd + 3, smooth: false });
  stroke(c, M(T, [[-25, -155], [0, -159], [25, -160]]), { w: 3.4, seed: sd + 4 });   // 麻绳
  stroke(c, M(T, [[24, -160], [40, -150], [36, -128], [24, -138]]), { w: 2.2, seed: sd + 5 }); stroke(c, M(T, [[30, -152], [46, -126]]), { w: 2, seed: sd + 6 });
  const C = tf(...T(cork.dx, -184 + cork.dy), 1, rot + cork.rot), plug = [[-19, 4], [-21, -38], [-16, -44], [16, -44], [21, -38], [19, 4]];
  block(c, M(C, plug), K.g2, { smooth: false, amp: .8, seed: sd + 7, grain: .8 }); outline(c, M(C, plug), { w: 3, seed: sd + 8, smooth: false });
  stroke(c, M(C, [[-18, -36], [0, -33], [18, -36]]), { w: 1.8, seed: sd + 9 });
  for (const [u, v] of [[-8, -20], [6, -12], [9, -28], [-4, -6]]) fillPts(c, ellPts(...C(u, v), 2, 1.6, 0, 8), K.g3);
  return cork.off ? T(0, -184) : C(0, -46); }
// s4Wet：水线。挡住没进水里的一截（淡墨盖一层），两边几道墨线波纹
function s4Wet(c, x, wl, hw, depth, t, sd) { const s = sd + tick(t);
  block(c, [[x - hw - 10, wl], [x + hw + 10, wl], [x + hw * .82, wl + depth], [x - hw * .82, wl + depth]], K.g1, { al: .72, amp: 2, grain: .5, seed: s, smooth: false });
  stroke(c, [[x - hw * .7, wl + depth * .5], [x + hw * .6, wl + depth * .55]], { w: 2.4, color: K.g2, dry: .4, seed: s + 1 });
  for (const d of [-1, 1]) { stroke(c, [[x + d * (hw - 16), wl + 1], [x + d * (hw + 26), wl - 2], [x + d * (hw + 70), wl + 2]], { w: 3.2, color: K.ink, seed: s + 3 + d, taper: .6 });
    stroke(c, [[x + d * (hw + 20), wl + 14], [x + d * (hw + 60), wl + 12], [x + d * (hw + 96), wl + 15]], { w: 2, color: K.g3, seed: s + 5 + d, taper: .6, dry: .3 }); } }
// 悬着的厄：从 (bx, by) 往上飘的一缕，速度越快越往后拖
function s4WispPts(bx, by, t, seed, lean, L, amp = 16, ph = 0, n = 12) { const out = [];
  for (let j = 0; j <= n; j++) { const f = j / n; out.push([bx + lean * f * L + amp * f * Math.sin(f * 5.5 + t * 3.4 + seed + ph), by - f * L]); } return out; }
// s4Pulled：被拽的厄。缕尖先走，根最后离开，沿一道弧缠到缎带上
function s4Pulled(H, k, u, phi, sq) { const V = s4CoilPts(k, phi, sq, H.length - 1), n = H.length - 1;
  return H.map((h, j) => { const a = easeInOutSine(clamp(u * 1.7 - (1 - j / n) * .7, 0, 1)); return [lerp(h[0], V[j].x, a), lerp(h[1], V[j].y, a) - 70 * Math.sin(Math.PI * a)]; }); }

// ===================== 字 =====================
// s4Vert：竖排日文（小字点缀），逗号挪到格子右上，促音稍往右上
function s4Vert(c, str, x, y, size, p, seed) { const ch = [...str], shown = p * ch.length;
  ch.forEach((q, i) => { const a = clamp(shown - i, 0, 1); if (a <= 0) return; let dx = 0, dy = 0;
    if ('、。'.includes(q)) { dx = size * .55; dy = -size * .62; } else if ('っゃゅょ'.includes(q)) { dx = size * .1; dy = -size * .12; }
    zh(c, q, x + dx, y + (i + 1) * size * 1.08 + dy, { size, color: K.g3, align: 'center', p: a, seed: seed + i, tilt: .015, jitter: .01 }); }); }

// ===================== 结尾：攒下的厄炸成满屏黑墨 =====================
function s4Burst(c, t, u) { if (u <= 0) return; const R = 30 + 1500 * u, x = S4.RX, y = 470, sd = tick(t, 12);
  for (let k = 0; k < 7; k++) { const a0 = k / 7 * TAU + u * 3, pts = []; for (let j = 0; j <= 12; j++) { const f = j / 12, a = a0 + f * 1.6, d = R * (.55 + f * .9); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * .9]); }
    stroke(c, pts, { w: R * .22, color: K.ink, seed: sd + k, taper: .6, dry: .08 }); }
  block(c, ellPts(x, y, R, R * .92, u * 4, 64), K.ink, { amp: R * .05, freq: 30, spike: .12, spikeLen: R * .3, seed: sd, streaks: 3 }); }

// ===================== 这一段 =====================
function s4Scene(c, tau) { const t = twos(tau), sd = tick(t); setView(null); paperBg(c);
  const e = sm(S4.IN, .8, t, easeOutQuint), phi = s4Phi(t), sq = 1 - .3 * sm(S4.FREEZE, S4.BURST, t, easeInOutSine) - .4 * sm(S4.BURST, S4.BLACK, t, easeIn);
  s4Hills(c, t, sm(.3, 1.0, t, easeOutQuint));
  s4Water(c, t, e);
  s4FarBank(c, t, e, sm(.45, 1.05, t));
  s4Ribbon(c, t, phi, sm(.7, 1.3, t, easeOut), sq, 300 + sd);
  // 漂流物：远的先画；悬着的厄跟着物件画，正在被拽的厄最后画在最前面
  const pulled = [];
  S4OBJ.map((o, k) => ({ o, k, p: s4Pos(o, t) })).sort((a, b) => a.o.lane - b.o.lane).forEach(({ o, k, p }) => {
    if (p.x < -300 || p.x > W + 300) return; let top;
    if (o.kind === 'doll') { top = s4Doll(c, p.x, p.y + p.lift, p.rot, o.seed * 10 + sd); s4Wet(c, p.x, p.y, 104, 26, t, o.seed); }
    else { top = s4Bottle(c, p.x, p.y - 86 + p.lift, p.rot, o.ph, o.seed * 10 + sd, s4Cork(o, t)); s4Wet(c, p.x, p.y, 118, 34, t, o.seed); }
    if (p.done) return; const lean = -clamp(p.v / 900, 0, .5), L = o.kind === 'doll' ? 105 : 100;
    const H1 = s4WispPts(top[0], top[1], t, o.seed, lean, L), H2 = s4WispPts(top[0] + 6, top[1] - 4, t, o.seed + 3, lean, L * .78, 11, 2.3);
    if (p.u === 0) { s4Smoke(c, H1, o.seed * 7 + sd); s4Smoke(c, H2, o.seed * 7 + 3 + sd, .8, 4.5); }
    else pulled.push([s4Pulled(H1, k, p.u, phi, sq), s4Pulled(H2, k, p.u, phi, sq), o.seed]); });
  s4NearBank(c, t, sm(.4, .95, t, easeOutQuint));
  s4FgReeds(c, t, sm(.6, 1.15, t, easeOutQuint));
  for (const [a, b, s] of pulled) { s4Smoke(c, a, s * 7 + sd); s4Smoke(c, b, s * 7 + 3 + sd, .8, 4.5); }
  // 字：左上摊宣原话，右边竖排日文
  zh(c, S4.L1, 112, 262, { size: 84, weight: 500, p: writeP(t, S4.t1, S4.L1, .1), seed: 41 });
  zh(c, S4.L2, 116, 352, { size: 60, p: writeP(t, S4.t2, S4.L2, .09), seed: 42 });
  S4.JA.forEach((s, j) => s4Vert(c, s, 1838 - j * 40, 78, 27, writeP(t, S4.tJa + j * .8, s, .05), 50 + j * 20));
  caption(c, '雏 祭', tau, .35);
  s4Burst(c, t, sm(S4.BURST, S4.BLACK - .05, t, easeIn)); }

scene({ order: 4, key: 'hina', name: '雏 祭', dur: S4.END, fn: (c, tau) => {
  if (tau < S4.IN) handoffStream(c);
  else if (tau < S4.BLACK) s4Scene(c, tau);
  else handoffBlack(c);
} });
