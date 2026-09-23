'use strict';
// 第 2 镜 · 吧唧站（12 秒）
// 远景 0–8s：电车进站，小伞跳下车，跳起来按红色 YES 吧唧，纸爱心涌出、飞进阿求的本子；阿求看着黑色 NO 吧唧学它摆手。
// 近景 8–12s：阿求举起一张笔记本纸，上面写出「请和大家分享 / 你对作品的喜欢吧！」，两枚吧唧在两边。

const S2 = { rail: 948, pl: 890, yes: [920, 650], no: [1320, 650], br: 170, aky: 1660, tramS: 90, tramX: 330, kog: 690, ks: 80, as: 90 };
const S2_HEARTS = Array.from({ length: 10 }, (_, j) => { const r = rng(900 + j); return { a: -2.6 + 2.1 * j / 9 + (r() - .5) * .2, d: 210 + r() * 150, s: 30 + r() * 18, col: [K.heart, K.heart2, K.heart3, '#f7b0c2'][j % 4], t0: 4.02 + j * .06, t1: 5.0 + j * .11, spin: (r() - .5) * .9 }; });

// 画一个木头小画架托着吧唧
function s2Stand(c, x, top, ground, seed) { const w = 12; inkLine(c, [[x - 70, ground], [x - 14, top]], w, '#8a5a36', { smooth: false }); inkLine(c, [[x + 70, ground], [x + 14, top]], w, '#8a5a36', { smooth: false });
  cut(c, rectPts(x - 120, top - 6, 240, 20), '#c89560', { rim: 4, seed, smooth: false, shadow: .16 }); }
function sHearts(c, tau, i) { if (tau < 8) s2Wide(c, tau, i); else s2Close(c, tau - 8, i); }

function s2Wide(c, tau, i) {
  const t = twos(tau), { rail, pl, br } = S2;
  setView({ x: 1010 + whip(tau, 99, { inn: .45, out: 0, dist: 760 }), y: 575, zoom: 1.12 });
  paperBg(c, K.sky, { seed: 21 });
  cloud(c, 330, 190, 330, 120, 3); cloud(c, 1180, 130, 260, 96, 5); cloud(c, 1720, 260, 220, 80, 8);
  star(c, 760, 110, 16, { seed: 2 }); star(c, 1500, 330, 12, { seed: 3 }); star(c, 90, 380, 13, { seed: 4 });
  rails(c, rail, -200, W + 200, { seed: 7 });
  // 电车：0–1.9s 刹车进站
  const u = easeOutQuint(clamp(t / 1.9, 0, 1)), tx = lerp(-460, S2.tramX, u), moving = t < 1.85, driving = t < 2.2;
  if (moving) motionLinesAt(c, tx - 3.2 * S2.tramS, rail - 1.3 * S2.tramS, 1 - u);
  const tr = tram(c, tx, rail + (moving ? Math.sin(tx * .06) * 1.5 : 0), S2.tramS, { roll: tx / (S2.tramS * .33), doorOpen: sm(1.95, 2.15, t), lamp: moving ? 1 : 0,
    umbrella: driving ? { blink: pulse(i, 30, 2) ? 1 : 0, tongue: Math.sin(t * 7) * .6 } : null,
    driver: driving ? (g, x, y, s) => kogasa(g, x, y, s, { headOnly: true, umbrella: false, look: [1, 0] }) : null });
  if (t > 1.8 && t < 2.6) zh(c, '叮叮', tr.T(2.3, -4.2)[0], tr.T(2.3, -4.2)[1], { size: 50, mode: 'pop', p: sm(1.8, 2.1, t, x => x), color: K.ink, align: 'center', rot: -.08 });
  if (t > 1.8 && t < 2.6) dashes(c, ...tr.T(2.05, -3.55), 110, 5, { len: 26, w: 4, spread: 1.6, rot: -Math.PI / 2, p: sm(1.8, 2.0, t) });
  // 站台（在轨道前面）
  strip(c, 610, W + 260, pl, H + 40, '#e3c08f', { seed: 31, amp: 6 });
  for (let x = 700; x < W + 200; x += 180) inkLine(c, [[x, pl + 34], [x + 90, pl + 34]], 3, alpha('#8f6a45', .35), { smooth: false });
  [[1080, 0], [1500, 1], [1850, 2], [780, 3]].forEach(([x, k]) => grass(c, x, pl + 4, 1, 70 + k));
  // 两枚吧唧
  const press = settle(t, 4.0, { amp: .085, freq: 2.2, decay: 5, phase: Math.PI / 2 }), noWig = t > 6.6 && t < 8 ? Math.sin((t - 6.6) * 13) * .05 * (1 - sm(7.4, 8, t)) : 0;
  s2Stand(c, S2.yes[0], S2.yes[1] + br * .92, pl, 41); s2Stand(c, S2.no[0], S2.no[1] + br * .92, pl, 42);
  badge(c, 'badgeYes', S2.yes[0] + press * 30, S2.yes[1], br, { sx: 1 - press, sy: 1 + press * .5 });
  badge(c, 'badgeNo', S2.no[0], S2.no[1], br, { rot: noWig });
  // 阿求：拿着本子，爱心飞进来后开心；6.6s 起看着 NO 吧唧学它摆手
  const mimic = t > 6.6, ab0 = idle(t, 1, 2.5), wave = mimic ? [S2.aky - S2.as * (.66 + .2 * Math.sin((t - 6.6) * 13)), pl - S2.as * 1.3 + ab0] : null, arrived = S2_HEARTS.filter(h => t >= h.t1 + .7).length, glad = arrived > 0 && !mimic;
  const ab = idle(t, 1, 2.5), book = mimic ? [S2.aky + 36, 800 + ab] : [S2.aky, 792 + ab];
  akyuu(c, S2.aky, pl, S2.as, { dir: -1, bob: ab, look: mimic ? [1, -.2] : glad ? [0, 0] : [1, -.4], tilt: mimic ? .1 : 0, eyes: mimic ? 'closed' : glad ? 'happy' : 'open', mouth: mimic ? 'pout' : glad ? 'open' : 'smile',
    armL: [book[0] + 34, book[1] + 8], armR: mimic ? wave : [book[0] - 34, book[1] + 8], front: (g, R) => { s2Book(g, book[0], book[1], 112, arrived); if (!mimic) handDot(g, R.hands.r, S2.as); handDot(g, R.hands.l, S2.as); } });
  if (mimic) { const hx = S2.aky - S2.as * .86, hy = wave[1]; inkLine(c, [[hx - 24, hy - 30], [hx - 38, hy - 4], [hx - 26, hy + 22]], 4, K.ink, { al: .8 }); inkLine(c, [[hx - 46, hy - 40], [hx - 64, hy - 4], [hx - 48, hy + 32]], 4, K.ink, { al: .6 }); }
  // 小伞：2.2s 从车门跳下，3.7s 跳起来按 YES
  if (t >= 2.2) {
    const door = tr.door, land = [S2.kog, pl];
    let st = { x: land[0], y: land[1], sq: 0 }, arm = 1.9, legs = 'stand', eyes = 'open', mouth = 'tongue', look = [1, 0];
    if (t < 3.4) { st = hop(t, 2.2, 2.75, door, land, 140); legs = st.air ? 'jump' : 'stand'; }
    else if (t < 4.9) { const h = hop(t, 3.72, 4.32, land, [land[0] + 14, pl], 150); st = h; legs = h.air ? 'jump' : 'stand'; if (h.air) { mouth = 'open'; look = [1, -.5]; } }
    else { const b = Math.abs(Math.sin((t - 4.9) * 7)) * 14 * (t > 6.8 ? 1 : .5); st = { x: land[0], y: pl - b, sq: 0 }; eyes = t > 6.8 ? 'happy' : 'open'; mouth = t > 6.8 ? 'open' : 'tongue'; look = t > 6.8 ? [1, 0] : [1, -.8]; }
    const pressing = t > 3.85 && t < 4.2, reach = pressing ? [S2.yes[0] - 150, S2.yes[1] - 10] : 1.9 - (st.sq || 0) * 2;
    kogasa(c, st.x, st.y, S2.ks, { sq: st.sq, legs, eyes, mouth, look, armR: reach, armL: 2.0, umbrella: { blink: pulse(i, 26, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .6, tilt: -.16 } });
    if (pressing) dashes(c, S2.yes[0] - 150, S2.yes[1] - 10, 30, 5, { len: 24, w: 4, spread: 1.8, rot: Math.PI, p: sm(3.85, 3.95, t) });
  }
  // 纸爱心：从 YES 涌出，停一下，再一颗颗飞进阿求的本子
  for (const h of S2_HEARTS) { if (t < h.t0) continue; const u1 = easeOut(clamp((t - h.t0) / .55, 0, 1)), [cx, cy] = S2.yes, p1 = [cx + Math.cos(h.a) * h.d * u1, cy + Math.sin(h.a) * h.d * u1 - 40 * u1];
    const grow = easeOutBack(clamp((t - h.t0) / .3, 0, 1));
    if (t < h.t1) heart(c, p1[0], p1[1] + Math.sin(t * 5 + h.a * 3) * 5, h.s * grow, h.col, { rot: h.spin * Math.sin(t * 3 + h.a), seed: 50 + h.t0 * 100 });
    else { const u2 = easeInOutQuint(clamp((t - h.t1) / .7, 0, 1)); if (u2 >= 1) continue; const [x, y] = arc(p1, book, u2, 160); heart(c, x, y, h.s * (1 - .7 * u2), h.col, { rot: h.spin * (1 - u2), seed: 50 + h.t0 * 100 }); } }
  for (const h of S2_HEARTS) { const k = sm(h.t1 + .7, h.t1 + .9, t) * (1 - sm(h.t1 + .9, h.t1 + 1.2, t)); if (k > 0) dashes(c, book[0], book[1] - 20, 60, 6, { len: 18, w: 3.5, p: k, col: '#e7a820' }); }
}
// 摊开的小本子：左右两页，飞进来的爱心盖成小红心印在页面上
function s2Book(c, x, y, w, n = 0) { const h = w * .62;
  cut(c, [[x - w / 2 - 6, y - h / 2 + 4], [x + w / 2 + 6, y - h / 2 + 4], [x + w / 2 + 6, y + h / 2 + 8], [x - w / 2 - 6, y + h / 2 + 8]], '#a0633e', { rim: 3, seed: 81, smooth: false, shadow: .18 });
  for (const side of [-1, 1]) cut(c, [[x, y - h / 2 + 6], [x + side * w / 2, y - h / 2], [x + side * w / 2, y + h / 2], [x, y + h / 2 + 4]], '#fdf9ee', { rim: 0, seed: 82 + side, smooth: false, shadow: .06, tex: .15 });
  inkLine(c, [[x, y - h / 2 + 6], [x, y + h / 2 + 4]], 2, alpha(K.ink, .5), { smooth: false });
  for (let k = 0; k < n; k++) { const col = k % 5, row = k / 5 | 0; fillPts(c, heartPts(x - w * .42 + col * w * .17 + (col > 2 ? w * .08 : 0), y - h * .22 + row * h * .38, 7), K.heart2); } }
function s2Close(c, u, i) {
  const t = twos(u), line = '请和大家分享\n你对作品的喜欢吧！';
  setView({ x: CX + whip(u, 4, { inn: 0, out: .42, dist: 900 }), y: CY });
  paperBg(c, K.rose, { seed: 23 });
  [[190, 170, 34, 0], [1720, 150, 40, 1], [1560, 420, 26, 2], [330, 430, 28, 3], [120, 700, 22, 4], [1810, 640, 24, 5]].forEach(([x, y, s, k]) => heart(c, x + drift(u, k) * 10, y + drift(u, k + 9) * 12 - u * 10, s, [K.heart, K.heart3, K.heart2][k % 3], { rot: drift(u, k + 3) * .3, seed: 60 + k }));
  star(c, 560, 120, 18, { seed: 6 }); star(c, 1390, 90, 14, { seed: 7 });
  const kb = (d) => easeOutBack(clamp((u - d) / .45, 0, 1));
  pop(c, 330, 800, kb(.15), () => badge(c, 'badgeYes', 330, 800, 150, { rot: -.12 }));
  pop(c, 1590, 800, kb(.3), () => badge(c, 'badgeNo', 1590, 800, 150, { rot: .1 }));
  const rise = (1 - easeOutBack(clamp(u / .5, 0, 1))) * 420, done = u > .6 + 15 * .09, sheetY = 918 + rise;
  akyuu(c, 960, 1010 + rise * .4, 205, { dir: 1, bob: idle(u, 2, 3), eyes: done ? 'happy' : 'open', mouth: done ? 'open' : 'smile', look: done ? [0, 0] : [0, .6], tilt: done ? Math.sin(u * 3) * .04 : 0,
    armL: [812, 752 + rise], armR: [1108, 752 + rise],
    front: (g, R) => { notebook(g, 960, sheetY, 880, 380, { seed: 9, rot: -.012, content: g2 => zh(g2, line, 34, -62, { size: 80, color: K.marker, align: 'center', p: writeP(u, .6, line, .09), seed: 12 }) });
      handDot(g, R.hands.l, 205); handDot(g, R.hands.r, 205); } });
  if (done) dashes(c, 960, 690, 470, 9, { len: 34, w: 5, spread: 2.2, rot: -Math.PI / 2, p: sm(1.95, 2.2, u), col: '#e7a820' });
}

scene({ order: 2, key: 'hearts', name: '2 吧唧站', dur: 12, fn: sHearts });
