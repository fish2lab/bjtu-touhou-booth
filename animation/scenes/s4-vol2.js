'use strict';
// 第 4 镜 · 流し雛站（9 秒），薄荷绿卡纸
// 轨道在这里变成一座红色剪纸小桥，桥下是一条剪纸的河（白色波纹线），摊宣 Vol.2 贴在左边。
// 0–2.0s  电车从摊宣后面开出来，刹车停在桥上（小伞驾驶，阿求坐车窗 0）。河上已经漂着纸雏人偶：小草船上站着三角和服、圆头的小人偶，每只带一张折好的白纸条。
// 0–6.2s  键山雏在右岸转圈，四朵灰色的「厄」字小云绕着她转。
// 0.8–3.0s 右上的笔记本纸上写出「留下想说的话」「雏人偶会把厄运带走吧——」。
// 2.7/3.7/4.7/5.7s 雏把「厄」云一朵朵甩到路过的纸雏身上，纸雏载着它顺流漂出画面。
// 6.3–7.7s 雏停下，两跳跳进车门；7.7s 起她出现在车窗 1。8.15s 电车起步，8.6s 起镜头甩出到右边。

const S4 = { dur: 9, rail: 715, ts: 95, tx: 1130, stop: 2.0, fx: 420, fy: 432, fh: 820, frot: -.018, river: 848, bx0: 560, bx1: 1540, hx: 1700, hy: 772, hs: 72, land: 1480, board: 7.62 };
const S4_RED = '#d95b43';
// 纸雏分两条水道：A 远（小、慢），B 近（大、快）。t0 是它经过 x = -180 的时间；yaku 是它载走的「厄」云编号（落在 x = S4.land）
const S4_LANE = { A: { dy: 58, v: 210, s: 70 }, B: { dy: 165, v: 262, s: 86 } };
const S4_DOLLS = [['A', 2.7, '#e0566b', 0], ['B', 3.7, '#8e6ccb', 1], ['A', 4.7, '#f59ab0', 2], ['B', 5.7, '#f2a33a', 3],
  ['A', -.9, '#5aa6d6', -1], ['A', 2.4, '#e0566b', -1], ['A', 5.0, '#f2a33a', -1], ['A', 7.5, '#8e6ccb', -1], ['B', -5.2, '#f59ab0', -1], ['B', 1.6, '#5aa6d6', -1], ['B', 4.2, '#e0566b', -1]]
  .map(([lane, tt, col, yaku], k) => { const L = S4_LANE[lane]; return { lane, col, yaku, k, ...L, t0: yaku >= 0 ? tt - (S4.land + 180) / L.v : tt, tl: yaku >= 0 ? tt : null }; });
const S4_L1 = '留下想说的话', S4_L2 = '雏人偶会把厄运带走吧——';

function s4DollPos(d, t) { const x = -180 + d.v * (t - d.t0); return { x, y: S4.river + d.dy + Math.sin(t * 2.4 + d.k * 1.7) * 6, rot: Math.sin(t * 1.9 + d.k * 2.3) * .06 }; }
// 纸雏人偶：小草船 + 三角和服身体 + 圆头 + 一张折好的白纸条。(x, y) 是船在水面的中心，s 约等于船的半宽
function s4Doll(c, x, y, s, col, seed, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  cut(c, [[-s * .44, -s * .12], [-s * .04, -s * 1.02], [s * .04, -s * 1.02], [s * .44, -s * .12]], col, { rim: 4, seed, shadow: .14, smooth: false, anchor: [0, 0] });
  cut(c, [[-s * .16, -s * .92], [0, -s * .7], [s * .16, -s * .92], [0, -s * 1.0]], '#fff8f0', { rim: 0, seed: seed + 1, shadow: 0, smooth: false });
  cut(c, [[-s * .27, -s * .52], [s * .27, -s * .52], [s * .31, -s * .38], [-s * .31, -s * .38]], '#f2c14e', { rim: 0, seed: seed + 2, shadow: .08, smooth: false });
  cut(c, ellPts(0, -s * 1.2, s * .21, s * .21, 0, 22), K.skin, { rim: 3, seed: seed + 3, shadow: .12, tex: .3 });
  const hair = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; hair.push([Math.cos(a) * s * .23, -s * 1.2 + Math.sin(a) * s * .23]); } hair.push([s * .23, -s * 1.1], [s * .12, -s * 1.17], [-s * .12, -s * 1.17], [-s * .23, -s * 1.1]);
  cut(c, hair, '#2d2433', { rim: 0, seed: seed + 4, shadow: 0, smooth: false, tex: .4 });
  fillPts(c, ellPts(-s * .07, -s * 1.12, s * .022, s * .03, 0, 8), K.ink); fillPts(c, ellPts(s * .07, -s * 1.12, s * .022, s * .03, 0, 8), K.ink);
  fillPts(c, ellPts(-s * .13, -s * 1.06, s * .04, s * .025, 0, 10), K.blush, .8); fillPts(c, ellPts(s * .13, -s * 1.06, s * .04, s * .025, 0, 10), K.blush, .8);
  // 折好的白纸条（上面写着话），斜靠在船头
  c.save(); c.translate(s * .6, -s * .36); c.rotate(.42);
  cut(c, [[-s * .2, -s * .3], [s * .2, -s * .3], [s * .2, s * .24], [-s * .2, s * .24]], '#ffffff', { rim: 0, seed: seed + 6, shadow: .18, smooth: false, tex: .15 });
  fillPts(c, [[-s * .2, -s * .3], [s * .2, -s * .3], [0, -s * .06]], '#e8e2d6'); inkLine(c, [[-s * .2, -s * .3], [0, -s * .06], [s * .2, -s * .3]], 1.5, alpha(K.ink, .4), { smooth: false });
  for (const yy of [.02, .12]) inkLine(c, [[-s * .13, s * yy], [-s * .06, s * (yy - .03)], [0, s * yy], [s * .06, s * (yy - .03)], [s * .13, s * yy]], 2, alpha(K.marker, .8));
  fillPts(c, ellPts(0, -s * .08, s * .05, s * .05, 0, 10), '#d33a47');
  c.restore();
  // 小草船
  const boat = [[-s * 1.08, -s * .34], [-s * .6, -s * .16], [0, -s * .12], [s * .6, -s * .16], [s * 1.08, -s * .34], [s * .8, s * .06], [s * .3, s * .16], [-s * .3, s * .16], [-s * .8, s * .06]];
  cut(c, boat, '#d9b56b', { rim: 4, seed: seed + 5, shadow: .14, anchor: [0, 0], inner: g => { for (let k = -5; k <= 5; k++) inkLine(g, [[k * s * .19 - s * .08, -s * .3], [k * s * .19 + s * .06, s * .2]], 2, alpha('#9c7a3a', .55), { smooth: false }); } });
  inkLine(c, [[-s * .95, s * .1], [-s * .5, s * .06], [0, s * .12], [s * .5, s * .06], [s * .95, s * .1]], 4, 'rgba(255,255,255,.9)');
  c.restore(); }
// 灰色的「厄」字小云
function s4Yaku(c, x, y, s, seed, al = 1) { if (al <= 0) return; const w = s * 2.3, h = s * 1.2, pts = [[x + w / 2, y + h / 2], [x - w / 2, y + h / 2]];
  [[-.3, .42], [.02, .55], [.33, .4]].forEach(([u, rr]) => { const cx = x + u * w, R = rr * w * .62, cy = y + h / 2 - R * .72; for (let k = 0; k <= 8; k++) { const a = Math.PI + k / 8 * Math.PI; pts.push([cx + Math.cos(a) * R, Math.min(y + h / 2, cy + Math.sin(a) * R)]); } });
  c.save(); c.globalAlpha *= al; cut(c, pts, '#8f8c9c', { rim: 4, rimCol: '#f3f1f6', seed, shadow: .14, smooth: false, anchor: [x, y] });
  zh(c, '厄', x, y + s * .5, { size: s * .92, color: '#34313f', align: 'center', seed, tilt: .02 }); c.restore(); }
// 红色剪纸小桥：桥面、拱洞、后面一排栏杆
function s4Bridge(c, x0, x1, top, seed) { const { rail } = S4, base = S4.river + 60, deck = top + 62, pw = 30, piers = [x0 + pw, x0 + (x1 - x0) / 3, x0 + 2 * (x1 - x0) / 3, x1 - pw];
  for (let x = x0 + 20; x <= x1 - 10; x += 64) cut(c, rectPts(x - 7, top - 44, 14, 46), shade(S4_RED, .12), { rim: 3, seed: seed + x, shadow: .1, smooth: false, tex: .5 });
  cut(c, rectPts(x0 - 6, top - 52, x1 - x0 + 12, 14), shade(S4_RED, .08), { rim: 3, seed: seed + 1, shadow: .12, smooth: false });
  const pts = [[x0, top], [x1, top], [x1, base]];
  for (let k = piers.length - 1; k > 0; k--) { const a = piers[k] - pw, b = piers[k - 1] + pw; pts.push([a, base]); for (let j = 0; j <= 14; j++) { const ang = j / 14 * Math.PI; pts.push([a - (a - b) * (1 - Math.cos(ang)) / 2, base - (base - deck) * Math.sin(ang)]); } pts.push([b, base]); }
  pts.push([x0, base]);
  cut(c, pts, S4_RED, { rim: 5, seed: seed + 2, shadow: .16, smooth: false, anchor: [x0, top] });
  inkLine(c, [[x0 + 8, top + 18], [x1 - 8, top + 18]], 3, alpha('#8e2a1e', .45), { smooth: false });
  for (let x = Math.ceil(x0 / 64) * 64; x < x1; x += 64) cut(c, rectPts(x - 18, rail + 4, 36, 14), '#6e5647', { rim: 0, seed: seed + x, shadow: .1, smooth: false, tex: .5, jag: .6 });
  inkLine(c, [[x0, rail], [x1, rail]], 7, '#4a4458', { smooth: false }); inkLine(c, [[x0, rail - 2.5], [x1, rail - 2.5]], 2, '#9d98ae', { smooth: false }); }
// 河：一条蓝色撕纸，白色波纹线顺流往右漂
function s4River(c, t) { const y0 = S4.river; strip(c, -900, 2900, y0, 1300, '#72acdc', { seed: 47, amp: 6 });
  [[892, 0], [948, 130], [1004, 60], [1058, 190]].forEach(([y, off], row) => { const sp = 250, sh = ((t * 38 + off) % sp + sp) % sp;
    for (let x = -1000 + sh; x < 2900; x += sp) { const pts = []; for (let k = 0; k <= 12; k++) pts.push([x + k * 6, y - Math.abs(Math.sin(k / 12 * Math.PI * 3)) * 8]); inkLine(c, pts, 4, 'rgba(255,255,255,.85)'); } }); }

function s4Scene(c, tau, i) {
  const t = twos(tau), { rail, ts, hx, hy, hs } = S4;
  setView({ x: CX + whip(tau, S4.dur, { inn: .45, out: .4, dist: 760 }), y: CY, zoom: 1 });
  paperBg(c, K.mint, { seed: 41 });
  cloud(c, 820, 470, 230, 80, 42); cloud(c, -420, 200, 260, 90, 43); cloud(c, 2250, 420, 240, 84, 44);
  star(c, 760, 380, 14, { seed: 401 }); star(c, 1870, 440, 13, { seed: 402 }); star(c, 60, 900, 12, { seed: 403 });
  wire(c, rail - 3.36 * ts, -900, 2900);
  rails(c, rail, -900, S4.bx0 + 10, { seed: 45, bed: '#c7ad80' }); rails(c, rail, S4.bx1 - 10, 2900, { seed: 46, bed: '#c7ad80' });
  [[1600, 0], [1880, 1], [2150, 2], [-120, 3]].forEach(([x, k]) => grass(c, x, rail + 16, 1.1, 410 + k));
  s4Bridge(c, S4.bx0, S4.bx1, rail + 5, 480);

  // 电车：0–2.0s 从摊宣后面开出来，停在桥上；8.15s 起步
  const u = easeOut(clamp(t / S4.stop, 0, 1)), go = t > 8.15 ? 70 * Math.pow(t - 8.15, 2) : 0, tx = lerp(-760, S4.tx, u) + go, moving = t < S4.stop - .1 || go > 0;
  if (moving && t < S4.stop) motionLinesAt(c, tx - 3.2 * ts, rail - 1.3 * ts, 1 - u);
  const inCar = t >= S4.board, doorP = sm(6.2, 6.5, t) * (1 - sm(7.75, 8.0, t));
  const tr = tram(c, tx, rail + (moving ? Math.sin(tx * .05) * 1.5 : 0), ts, { roll: tx / (ts * .33), lamp: moving ? 1 : 0, doorOpen: doorP,
    umbrella: { blink: pulse(i, 30, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .6 },
    driver: (g, x, y, s) => kogasa(g, x, y, s, { headOnly: true, umbrella: false, look: [1, 0] }),
    seats: [(g, x, y, s) => akyuu(g, x, y, s, { headOnly: true, look: t < 6.3 ? [1, .2] : [1, 0], eyes: t > 2.7 && t < 6.3 ? 'happy' : 'open', mouth: 'smile' }),
      inCar ? (g, x, y, s) => hina(g, x, y, s, { headOnly: true, look: [1, 0], eyes: 'happy', mouth: 'open' }) : null] });

  pasted(c, 'vol2', S4.fx, S4.fy, S4.fh, { rot: S4.frot, seed: 49, tapes: [[.04, .012, -.6], [.96, .012, .6]] });

  // 河和纸雏
  s4River(c, t);
  const dolls = S4_DOLLS.map(d => ({ d, ...s4DollPos(d, t) }));
  for (const lane of ['A', 'B']) for (const { d, x, y, rot } of dolls) if (d.lane === lane && x > -900 && x < 2900) s4Doll(c, x, y, d.s, d.col, 490 + d.k * 11, rot);

  // 「厄」云：先绕着转圈的雏，launch 时被甩出去，落到路过的纸雏头上，跟着漂走
  const orb = (tt, k) => { const a = tt * 2.6 + k * Math.PI / 2; return { x: hx + Math.cos(a) * 150, y: hy - 356 + Math.sin(a) * 28, front: Math.sin(a) > 0 }; };
  const yakuAt = k => { const d = S4_DOLLS.find(q => q.yaku === k), t1 = d.tl - .7, up = 1.42 * d.s + 28; if (t < t1) return { ...orb(t, k), mode: 0 };
    if (t < d.tl) { const fr = orb(t1, k), dp = s4DollPos(d, d.tl), [x, y] = arc([fr.x, fr.y], [dp.x - 6, dp.y - up], (t - t1) / .7, 120); return { x, y, front: true, mode: 1 }; }
    const dn = s4DollPos(d, t); return { x: dn.x - 6, y: dn.y - up - settle(t, d.tl, { amp: 14, freq: 2.5, decay: 5, phase: Math.PI / 2 }), front: true, mode: 2 }; };
  const yk = [0, 1, 2, 3].map(k => ({ k, ...yakuAt(k) }));
  const drawYaku = q => s4Yaku(c, q.x, q.y + Math.sin(t * 3 + q.k) * 4, 52, 470 + q.k * 3, 1);
  yk.filter(q => q.mode === 0 && !q.front && t < 6.3).forEach(drawYaku);

  // 键山雏：0–6.2s 在右岸转圈，然后两跳跳进车门
  const spinning = t < 6.25;
  if (t < 7.7) {
    let st = { x: hx, y: hy, sq: 0 }, sc = hs, dir = -1, rot = 0, legs = 'stand', eyes = 'happy', mouth = 'smile', armL = 1.25, armR = 1.25, clipDoor = false;
    if (spinning) { dir = Math.floor(t * 6) % 2 ? 1 : -1; rot = Math.sin(t * 7) * .1; st.y = hy - Math.abs(Math.sin(t * 6 * Math.PI)) * 5; }
    else if (t < 6.95) { const h = hop(t, 6.5, 6.9, [hx, hy], [1575, hy], 90); st = h; legs = h.air ? 'jump' : 'stand'; eyes = 'open'; mouth = 'open'; armL = .6; armR = .6; }
    else { const door = tr.door, h = hop(t, 7.0, 7.5, [1575, hy], [door[0], door[1]], 150); st = h; legs = h.air ? 'jump' : 'stand'; eyes = 'happy'; mouth = 'open'; armL = 1.6; armR = 1.6; sc = lerp(hs, 34, easeIn(h.u)); clipDoor = t >= 7.5; if (clipDoor) st = { x: door[0] - (t - 7.5) * 160, y: door[1], sq: 0 }; }
    if (spinning) { const [cx, cy] = [hx, hy - 6]; for (const [rx, ry, a0, a1, w] of [[118, 22, .2, 2.9, 5], [96, 17, 3.6, 5.6, 4]]) { const pts = []; for (let k = 0; k <= 20; k++) { const a = a0 + (a1 - a0) * k / 20 + t * 5; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } inkLine(c, pts, w, K.ink, { al: .75 }); }
      dashes(c, hx, hy - 120, 150, 6, { len: 28, w: 4, spread: 1.1, rot: Math.PI, p: .8 + .2 * Math.sin(t * 9), al: .8 }); dashes(c, hx, hy - 120, 150, 6, { len: 28, w: 4, spread: 1.1, rot: 0, p: .8 + .2 * Math.sin(t * 9 + 1), al: .8 }); }
    const draw = () => hina(c, st.x, st.y, sc, { dir, rot, sq: st.sq || 0, legs, eyes, mouth, armL, armR, look: spinning ? [0, 0] : [-1, 0] });
    if (clipDoor) { const dp = M(tr.T, [[.72, -1.96], [1.42, -1.96], [1.42, -.62], [.72, -.62]]); c.save(); c.clip(polyPath(dp)); draw(); c.restore(); } else draw();
  }
  yk.filter(q => q.mode !== 0 || (q.front && t < 6.3)).forEach(drawYaku);
  // 雏停下后，还没被带走的「厄」云会在 6.3s 前全部被带走（最后一朵 5.0s 起飞）

  // 笔记本纸：留下想说的话 / 雏人偶会把厄运带走吧——
  const nb = easeOutBack(clamp((t - .6) / .35, 0, 1));
  if (nb > 0) pop(c, 1330, 176, nb, () => notebook(c, 1330, 176, 1070, 290, { seed: 48, rot: .012, content: g => {
    zh(g, S4_L1, -455, -26, { size: 86, color: K.marker, p: writeP(t, .95, S4_L1, .11), seed: 481 });
    zh(g, S4_L2, -455, 86, { size: 72, color: K.marker, p: writeP(t, 1.85, S4_L2, .09), seed: 482 }); } }));
}

scene({ order: 4, key: 'vol2', name: '4 流し雛站', dur: 9, fn: s4Scene });
