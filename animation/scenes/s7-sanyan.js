'use strict';
// 第 7 镜 · 三眼站（7 秒）
// 0–2.0s   电车从左边开进来，停在插画右边；0.9s 起笔记本上写出标题「三眼的幻恋」。
// 1.95–2.4s 插画里恋手指上的红线顺着画面延长到图边（细墨线）。
// 2.4–4.0s  红线从图边伸出来变成剪纸红线，在空中绕出一颗心，再落下来系到电车的受电弓上；4.0s 打结。
// 4.0–7.0s  心像气球一样在受电弓上晃；5.0s 电车起步向右开，红线从图里抽出来，心被拖着往后飘；6.6s 起镜头甩出。
// 全程有几片剪纸玫瑰花瓣飘落，只走插画左右两边的空白，不经过插画上的标题和两张脸。

const S7 = { dur: 7, rail: 1000, s: 125, stopX: 1480, arrive: 2.0, go: 5.0, grow0: 2.4, grow1: 4.0, pic: { x: 535, y: 520, h: 900, rot: -.015 },
  note: { x: 1430, y: 118, w: 820, h: 196, rot: .015 }, hs: 140, str: 86, red: '#d8232f' };
const S7_TITLE = '三眼的幻恋';
// 花瓣：[起始 x, 出现时间, 下落时长, 大小, 摆幅, 颜色序号]
const S7_PETALS = [[70, .1, 4.4, 34, 30, 0], [1000, .7, 4.0, 30, 40, 1], [1700, 1.3, 4.6, 36, 60, 2], [60, 2.0, 4.2, 30, 28, 1], [1330, 2.6, 4.4, 33, 55, 0],
  [1060, 3.3, 4.0, 28, 40, 2], [1870, 3.8, 4.3, 32, 50, 0], [80, 4.3, 4.5, 36, 30, 2], [1560, 4.9, 4.2, 30, 45, 1], [1010, 5.4, 4.0, 34, 36, 0]];

function s7TramX(t) { const { stopX, arrive, go } = S7; if (t < arrive) return lerp(-440, stopX, easeOut(t / arrive)); return t < go ? stopX : stopX + 135 * (t - go) * (t - go); }
function s7TramV(t) { const { stopX, arrive, go } = S7; if (t < arrive) return (stopX + 440) * 3 * Math.pow(1 - t / arrive, 2) / arrive; return t < go ? 0 : 270 * (t - go); }

// 剪纸红线：按段描边（投影、白毛边、红色、蜡笔纹理），wf(离起点的距离) 给粗细，所以线头可以从细变粗
function s7Thread(c, pts, wf, o = {}) { const { col = S7.red, rim = 3.5, shadow = .16, tex = .55 } = o; if (pts.length < 2) return;
  const segs = []; let acc = 0, cur = null;
  for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k], w = Math.round(wf(acc) * 2) / 2; acc += Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (!cur || cur.w !== w) { cur = { w, path: new Path2D() }; cur.path.moveTo(a[0], a[1]); segs.push(cur); } cur.path.lineTo(b[0], b[1]); }
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  if (shadow) { c.save(); c.translate(2.2, 3.2); c.strokeStyle = `rgba(30,22,52,${shadow})`; segs.forEach(g => { c.lineWidth = g.w + rim * 2; c.stroke(g.path); }); c.restore(); }
  c.strokeStyle = K.paper; segs.forEach(g => { c.lineWidth = g.w + rim * 2; c.stroke(g.path); });
  c.strokeStyle = col; segs.forEach(g => { c.lineWidth = g.w; c.stroke(g.path); });
  if (tex) { const p = crayonPat(c); p.setTransform(new DOMMatrix().scale(1 / S)); c.globalAlpha *= tex; c.strokeStyle = p; segs.forEach(g => { c.lineWidth = g.w; c.stroke(g.path); }); }
  c.restore(); }
// 折线的前 f（0..1）部分
function s7Prefix(pts, f) { if (f >= 1) return pts; if (f <= 0) return []; const L = pathLength(pts) * f, out = [pts[0]]; let acc = 0;
  for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k], d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (acc + d >= L) { const u = (L - acc) / (d || 1); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); return out; } out.push(b); acc += d; }
  return out; }
// 按弧长均匀取 n 个点
function s7Resample(pts, n) { const L = pathLength(pts), out = []; let k = 1, acc = 0;
  for (let j = 0; j < n; j++) { const target = L * j / (n - 1); while (k < pts.length - 1 && acc + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]) < target) { acc += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); k++; }
    const a = pts[k - 1], b = pts[k], d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, u = clamp((target - acc) / d, 0, 1); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); }
  return out; }
// 一颗心的轮廓，从底尖开始，先上左边、过凹口、再下右边回到底尖。tip 是底尖的位置，rot 绕底尖转。
function s7HeartLoop(tip, hs, rot = 0, n = 72) { const out = [], ca = Math.cos(rot), sa = Math.sin(rot);
  for (let k = 0; k <= n; k++) { const a = Math.PI + k / n * TAU, u = Math.pow(Math.sin(a), 3) * hs, v = (-(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 16 - 1.0625) * hs;
    out.push([tip[0] + u * ca - v * sa, tip[1] + u * sa + v * ca]); }
  return out; }
// 受电弓上的小蝴蝶结
function s7Bow(c, x, y, k) { if (k <= .01) return; pop(c, x, y, k, () => {
  for (const side of [-1, 1]) { cut(c, [[x, y], [x + side * 16, y + 34], [x + side * 26, y + 30], [x + side * 8, y]], S7.red, { rim: 3, seed: 740 + side, shadow: .16, smooth: false });
    cut(c, [[x, y], [x + side * 34, y - 22], [x + side * 42, y - 2], [x + side * 34, y + 16]], S7.red, { rim: 3.5, seed: 742 + side, shadow: .16 }); }
  cut(c, ellPts(x, y, 9, 9, 0, 14), '#b3131f', { rim: 2.5, seed: 745, shadow: .12 }); }); }
// 一片玫瑰花瓣：flip 是翻转时的横向压缩（-1..1），模拟在空中翻滚
function s7Petal(c, x, y, r, rot, flip, col, seed) { const f = Math.sign(flip || 1) * Math.max(.18, Math.abs(flip)), ca = Math.cos(rot), sa = Math.sin(rot), T = (u, v) => { const X = u * r * f, Y = v * r; return [x + X * ca - Y * sa, y + X * sa + Y * ca]; };
  cut(c, M(T, [[0, -.74], [.3, -1.0], [.72, -.74], [.88, -.06], [.56, .62], [0, 1.0], [-.56, .62], [-.88, -.06], [-.72, -.74], [-.3, -1.0]]), col, { rim: 3, seed, anchor: [x, y], shadow: .2 });
  inkLine(c, M(T, [[0, .78], [.06, .12], [0, -.52]]), 2.2, alpha('#5e0c1a', .45)); }

// 纸月亮：奶油色月牙
function s7Moon(c, x, y, r) { const pts = []; for (let k = 0; k <= 16; k++) { const a = -2.35 + k / 16 * 4.7; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  for (let k = 16; k >= 0; k--) { const a = -2.0 + k / 16 * 4.0; pts.push([x + r * .42 + Math.cos(a) * r * .78, y - r * .12 + Math.sin(a) * r * .78]); }
  cut(c, pts, '#f6e3a6', { rim: 5, seed: 790, shadow: .18, smooth: false }); }

// 车上的人：驾驶窗小伞，车窗 0 阿求、1 雏、2 帕秋莉。红线出来后都抬头看，打结后开心。
function s7Cast(t, i) {
  const watch = t > 2.3 && t < S7.grow1 + .05, happy = t >= S7.grow1 + .05;
  const face = (k, base = {}) => { const o = { headOnly: true, look: [1, 0], ...base };
    if (watch) { o.look = [-.8, -1]; o.eyes = 'wide'; o.mouth = 'o'; }
    else if (happy) { const u = t - S7.grow1; o.look = [-.5, -.8]; o.eyes = 'happy'; o.mouth = k === 2 ? 'smile' : 'open'; o.tilt = Math.sin(u * 3 + k) * .1; o.bob = -Math.abs(Math.sin(u * 5 + k)) * .1; }
    return o; };
  const seat = (fn, k) => (g, x, y, s) => { const f = face(k); fn(g, x, y + (f.bob || 0) * s, s, { ...f, bob: 0 }); };
  const fk = face(3, { mouth: 'tongue' });
  return { driver: (g, x, y, s) => kogasa(g, x, y + (fk.bob || 0) * s, s, { ...fk, bob: 0, umbrella: false, mouth: happy ? 'tongue' : fk.mouth }),
    seats: [seat(akyuu, 0), seat(hina, 1), seat(patchouli, 2)], umbrella: { blink: pulse(i, 30, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .6, look: watch || happy ? -1 : 0 } };
}

function sSanyan(c, tau, i) {
  const t = twos(tau), { rail, s, go, grow0, grow1, hs } = S7;
  setView({ x: CX + whip(tau, S7.dur, { inn: .45, out: .4, dist: 760 }), y: CY });
  paperBg(c, K.navy, { seed: 71, blotch: .3 });
  [[70, 150, 16, 1], [96, 860, 13, 2], [1015, 390, 12, 3], [1890, 330, 15, 4], [1030, 820, 14, 5], [1880, 600, 11, 6], [980, 36, 10, 7]].forEach(([x, y, r, k]) => star(c, x, y, r * (1 + .18 * Math.sin(t * 3 + k)), { seed: 70 + k, rot: drift(t, k) * .3 }));
  // 插画：贴在左边
  const P = S7.pic, pl = pasted(c, 'sanyan', P.x, P.y, P.h, { rot: P.rot, seed: 17, tapes: [[.5, 0, .03]] });
  // 插画里的红线：从恋的手指顺着画面延长到图边
  const inkPts = onAll(pl, [[.783, .568], [.803, .598], [.84, .621], [.9, .631], [.96, .623], [1.0, .615]]);
  inkLine(c, inkPts, 3.2, '#c81e28', { p: sm(1.95, 2.4, t, x => x) });
  const E = on(pl, 1.0, .615);
  s7Moon(c, 1800, 330, 60);
  // 花瓣：画在笔记本、红线和电车后面，只在插画边上的玫瑰和空白处飘过
  S7_PETALS.forEach(([x0, t0, dur, r, sway, ci], k) => { const u = (t - t0) / dur; if (u < 0 || u > 1) return; const y = -70 + u * 1220, x = x0 + Math.sin((t - t0) * 1.7 + k) * sway + u * 60;
    s7Petal(c, x, y, r, Math.sin((t - t0) * 1.3 + k * 2) * .9 + k, Math.cos((t - t0) * (2.2 + k * .2) + k), ['#c8283c', '#e0485a', '#a81c30'][ci], 760 + k); });
  // 标题
  const N = S7.note; notebook(c, N.x, N.y, N.w, N.h, { rot: N.rot, seed: 73, content: g => zh(g, S7_TITLE, 0, 42, { size: 124, color: K.marker, align: 'center', p: writeP(t, .9, S7_TITLE, .13), seed: 71 }) });
  // 轨道和电车
  rails(c, rail, -300, W + 300, { seed: 77, bed: '#5d5296' });
  const X = s7TramX(t), V = s7TramV(t), pitch = t < S7.arrive ? 0 : .02 * settle(t, S7.arrive, { amp: 1, freq: 1.6, decay: 4, phase: Math.PI / 2 });
  if (V > 200 && t < S7.arrive) motionLinesAt(c, X - 3.25 * s, rail - 1.7 * s, Math.min(1, V / 2000));
  if (t > go) motionLinesAt(c, X - 3.25 * s, rail - 1.7 * s, sm(go, go + .6, t) * .6);
  const cast = s7Cast(t, i), tr = tram(c, X, rail, s, { rot: pitch, roll: X / (s * .33), lamp: V > 50 ? 1 : 0, umbrella: cast.umbrella, driver: cast.driver, seats: cast.seats });
  // 红线：A 段（图边 → 心的底尖）、心形一圈、B 段（底尖 → 受电弓）。心像气球：静止时轻轻晃，电车开走时往后飘。
  const panto = tr.T(-2.0, -3.36), u4 = t - grow1;
  const phi = (u4 > 0 ? .06 * Math.sin(u4 * 2.4) : 0) - (t > go ? Math.min(.5, 270 * (t - go) * .0014) + .08 * settle(t, go, { amp: 1, freq: 1.2, decay: 2 }) : 0);
  const Ls = S7.str + (u4 > 0 ? 5 * Math.sin(u4 * 3.1) : 0), tip = [panto[0] + Math.sin(phi) * Ls, panto[1] - Math.cos(phi) * Ls];
  const heartPts = s7HeartLoop(tip, hs * (1 + .07 * settle(t, grow1, { amp: 1, freq: 2.2, decay: 4.5, phase: Math.PI / 2 })), phi * .75), sag = 14 + (t > go ? 10 : 0);
  const Bpts = Array.from({ length: 14 }, (_, k) => { const u = k / 13, px = lerp(tip[0], panto[0], u), py = lerp(tip[1], panto[1], u), dx = panto[0] - tip[0], dy = panto[1] - tip[1], l = Math.hypot(dx, dy) || 1; return [px - dy / l * sag * Math.sin(Math.PI * u), py + dx / l * sag * Math.sin(Math.PI * u)]; });
  const restA = spline([E, [E[0] + 62, E[1] + 50], [lerp(E[0], tip[0], .55), lerp(E[1], tip[1], .55) + 44], [tip[0] - 46, tip[1] + 48], tip], 4, false);
  let Apts = restA;
  const rel = sm(go + .06, go + .5, t, easeInOutSine);
  if (rel > 0) { const back = s7Resample(restA.slice().reverse(), 36), ang = Math.PI / 2 + .8 + phi * .6, dir = [Math.cos(ang), Math.sin(ang)], nrm = [-dir[1], dir[0]];
    const tail = back.map((_, k) => { const u = k / 35, w = 12 * Math.sin(u * 5.5 - t * 11) * u; return [tip[0] + dir[0] * 118 * u + nrm[0] * w, tip[1] + dir[1] * 118 * u + nrm[1] * w]; });
    Apts = back.map((p, k) => [lerp(p[0], tail[k][0], rel), lerp(p[1], tail[k][1], rel)]).reverse(); }
  const LA = pathLength(Apts), LH = pathLength(heartPts), LB = pathLength(Bpts), grown = sm(grow0, grow1, t, easeInOutSine) * (LA + LH + LB);
  const wA = d => Math.min(10, 3.5 + d * .12);
  if (grown > 0) {
    const pa = clamp(grown / LA, 0, 1), ph = clamp((grown - LA) / LH, 0, 1), pb = clamp((grown - LA - LH) / LB, 0, 1);
    s7Thread(c, s7Prefix(Apts, pa), wA);
    if (ph > 0) s7Thread(c, s7Prefix(heartPts, ph), () => 10);
    if (pb > 0) s7Thread(c, s7Prefix(Bpts, pb), () => 9);
    if (grown < LA + LH + LB) { const lead = pa < 1 ? s7Prefix(Apts, pa) : ph < 1 ? s7Prefix(heartPts, ph) : s7Prefix(Bpts, pb), q = lead[lead.length - 1];
      if (q) star(c, q[0], q[1], 17 + (i % 2) * 5, { color: '#ffe36e', seed: 79, rot: i * .5 }); }
  }
  // 打结：受电弓上弹出蝴蝶结和一圈短线
  s7Bow(c, panto[0], panto[1] - 4, easeOutBack(clamp((t - grow1) / .22, 0, 1)));
  if (t > grow1 && t < grow1 + .5) dashes(c, panto[0], panto[1], 46, 7, { len: 24, w: 4, col: '#ffe36e', p: sm(grow1, grow1 + .12, t) * (1 - sm(grow1 + .3, grow1 + .5, t)), rot: -Math.PI / 2, spread: 3.4 });
}

scene({ order: 7, key: 'sanyan', name: '7 三眼站', dur: 7, fn: sSanyan });
