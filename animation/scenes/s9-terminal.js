'use strict';
// 第 9 镜 · 终点站（10 秒）。主视觉当车站海报贴在墙上；电车进站，帕秋莉、雏、阿求、小伞一个个跳下车排成一排；
// 空电车开走；四个人举起一条长横幅，写出「北京交通大学欢迎您」（主视觉上的原话），挥手，纸屑落下。
const S9 = { rail: 950, s: 90, stop: 1590, cs: 84, row: [585, 835, 1085, 1335] };
const S9_CONF = Array.from({ length: 70 }, (_, k) => ({ x: hash(k, 21) * (W + 200) - 100, v: 170 + hash(k, 22) * 160, ph: hash(k, 23), w: 10 + hash(k, 24) * 12, col: ['#ef6f8c', '#3a67bf', '#f7d65a', '#6aae5e', '#8e63cb', '#fbf8f0'][k % 6], spin: (hash(k, 25) - .5) * 8 }));

function s9Scene(c, tau, i) {
  const t = twos(tau), { rail, s, cs, row } = S9;
  setView({ x: CX + whip(tau, 10, { inn: .45, out: .4, dist: 760 }), y: CY });
  paperBg(c, K.mustard, { seed: 51 });
  [[120, 120, 20], [1780, 90, 16], [1620, 330, 12], [260, 420, 14], [1840, 520, 12]].forEach(([x, y, r], k) => star(c, x, y, r * (pulse(i + k * 4, 16, 3) ? .6 : 1), { seed: 30 + k, color: '#fff3c4' }));
  // 纸屑（落在海报和人物后面，不挡脸）
  if (t > 6.6) S9_CONF.forEach(q => { const y = -60 + ((t - 6.6) * q.v + q.ph * 700) % (H + 120) - (q.ph * 700 > 0 ? 0 : 0), x = q.x + Math.sin(t * 2 + q.ph * 9) * 30; if ((t - 6.6) * q.v + q.ph * 700 < q.ph * 700) return; cut(c, [[x - q.w / 2, y - q.w * .3], [x + q.w / 2, y - q.w * .3], [x + q.w / 2, y + q.w * .3], [x - q.w / 2, y + q.w * .3]].map(([px, py]) => { const a = t * q.spin, dx = px - x, dy = py - y; return [x + dx * Math.cos(a) - dy * Math.sin(a), y + dx * Math.sin(a) + dy * Math.cos(a)]; }), q.col, { rim: 0, smooth: false, shadow: .12, tex: .3, seed: q.x | 0, jag: .3 }); });
  pasted(c, 'kv', 960, 335, 520, { rot: -.02, seed: 14, k: easeOutBack(clamp((t - .35) / .45, 0, 1)), tapes: [[.08, 0, -.25], [.92, 0, .25]] });
  strip(c, -300, W + 300, rail - 20, H + 60, '#e4b35c', { seed: 52, amp: 8 });
  rails(c, rail, -300, W + 300, { seed: 13, bed: '#c29450' });
  [[150, 0], [420, 1], [1780, 2]].forEach(([x, k]) => grass(c, x, rail - 16, 1.1, 90 + k));
  // 电车：0–1.8s 进站，4.3s 起空车开走
  const arrive = easeOutQuint(clamp(t / 1.8, 0, 1)), leave = easeIn(clamp((t - 4.3) / 1.3, 0, 1)), tx = lerp(-1300, S9.stop, arrive) + leave * 1300, moving = t < 1.75 || (t > 4.3 && t < 5.6);
  const hopT = [2.0, 2.45, 2.9, 3.4];   // 帕秋莉（车窗 2）、雏（1）、阿求（0）、小伞（驾驶座）依次下车
  if (moving) motionLinesAt(c, tx - 3.2 * s, rail - 1.3 * s, t > 4.3 ? leave : 1 - arrive);
  const seatFns = [(g, x, y, ss) => akyuu(g, x, y, ss, { headOnly: true, dir: -1 }), (g, x, y, ss) => hina(g, x, y, ss, { headOnly: true, dir: -1 }), (g, x, y, ss) => patchouli(g, x, y, ss, { headOnly: true, dir: -1 })];
  const seatOff = [hopT[2], hopT[1], hopT[0]];
  const tr = tram(c, tx, rail + (moving ? Math.sin(tx * .06) * 1.5 : 0), s, { roll: tx / (s * .33), lamp: moving ? 1 : 0, doorOpen: sm(1.8, 2.0, t) * (1 - sm(3.9, 4.2, t)),
    seats: seatFns.map((f, k) => t < seatOff[k] ? f : null), umbrella: t < hopT[3] ? { blink: pulse(i, 28, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .5 } : null,
    driver: t < hopT[3] ? (g, x, y, ss) => kogasa(g, x, y, ss, { headOnly: true, umbrella: false, look: [1, 0] }) : null });
  const door = tr.door, cab = tr.T(2.4, -.6);
  // 横幅：5.3s 举起，5.9s 起写字
  const banner = easeOutBack(clamp((t - 5.3) / .5, 0, 1)), bY = 918 + (1 - banner) * 260, done = t > 6.9, text = '北京交通大学欢迎您';
  const cast = [
    { f: patchouli, x: row[0], from: door, t0: hopT[0], o: {} },
    { f: hina, x: row[1], from: door, t0: hopT[1], o: {} },
    { f: akyuu, x: row[2], from: door, t0: hopT[2], o: {} },
    { f: kogasa, x: row[3], from: cab, t0: hopT[3], o: { umbrella: { blink: pulse(i, 26, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .6, tilt: .2 } } },
  ];
  const holding = t > 5.3;
  cast.forEach((m, k) => { if (t < m.t0) return; const h = hop(t, m.t0, m.t0 + .6, m.from, [m.x, rail], 200 + k * 20), wave = done && (k % 2 ? Math.sin((t - 6.9) * 9 + k) > -.2 : Math.sin((t - 6.9) * 9 + k) > .2);
    const bob = done ? -Math.abs(Math.sin((t - 6.9) * 5 + k * 1.3)) * 10 : idle(t, k, 2);
    const hand = side => [m.x + side * 42, bY - 66 + (holding ? 0 : 200)];
    const armR = holding ? (wave && k !== 3 ? 2.6 + Math.sin(t * 14) * .3 : hand(1)) : .3, armL = k === 3 ? 2.0 : holding ? hand(-1) : .3;
    m.f(c, h.x, h.y + (h.u >= 1 ? bob : 0), cs, { ...m.o, sq: h.sq, legs: h.air ? 'jump' : 'stand', dir: h.u < 1 ? -1 : 1, eyes: done ? 'happy' : (m.f === patchouli ? 'half' : 'open'), mouth: done ? 'open' : (m.f === patchouli ? 'flat' : 'smile'), armL, armR, look: h.u < 1 ? [1, 0] : [0, .3] });
  });
  if (t > 5.3) { notebook(c, 960, bY, 1060, 164, { rot: -.01, seed: 19, sp: 40, content: g => zh(g, text, 30, 34, { size: 92, align: 'center', color: K.marker, p: writeP(t, 5.9, text, .1), seed: 31 }) });
    cast.forEach((m, k) => { const wave = done && (k % 2 ? Math.sin((t - 6.9) * 9 + k) > -.2 : Math.sin((t - 6.9) * 9 + k) > .2); if (!(wave && k !== 3)) handDot(c, [m.x + 42, bY - 66], cs); if (k !== 3) handDot(c, [m.x - 42, bY - 66], cs); }); }
  if (done) dashes(c, 960, bY - 40, 590, 11, { len: 36, w: 5, spread: 2.6, rot: -Math.PI / 2, p: sm(6.9, 7.2, t), col: '#c2412f' });
}
scene({ order: 9, key: 'terminal', name: '9 终点站', dur: 10, fn: s9Scene });
