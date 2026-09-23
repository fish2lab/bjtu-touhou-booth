'use strict';
// 第 1 镜 · 发车（8 秒）。夜里的站台，主视觉海报贴在墙上；铅笔轨道画出来，电车「幻想乡交通大学号」开进站，
// 小伞摇铃「叮叮」；镜头推到车顶的目的地牌，牌子从「幻想乡交通大学」翻成「北京交通大学」；拉回全景，
// 左上角一张撕纸条上写出大字「北京交通大学」；电车起步往右开出画。
const S1 = { rail: 962, s: 95, stop: 560 };
const S1_STARS = Array.from({ length: 16 }, (_, k) => [hash(k, 11) * W, 40 + hash(k, 12) * 480, 8 + hash(k, 13) * 12]);

function s1Scene(c, tau, i) {
  const t = twos(tau), { rail, s } = S1;
  const [vx, vy, vz] = key(tau, [[0, 960, 540, 1], [3.1, 960, 540, 1], [3.9, 640, 700, 2.1], [4.8, 640, 700, 2.1], [5.5, 960, 540, 1]]);
  setView({ x: vx + whip(tau, 8, { inn: .45, out: .4, dist: 760 }), y: vy, zoom: vz });
  paperBg(c, K.navy, { seed: 31 });
  // 夜空：月亮、星星、两层撕开的深蓝纸
  const moon = []; for (let k = 0; k <= 16; k++) { const a = -2.2 + k / 16 * 4.4; moon.push([1850 + Math.cos(a) * 48, 78 + Math.sin(a) * 48]); } for (let k = 16; k >= 0; k--) { const a = -1.75 + k / 16 * 3.5; moon.push([1870 + Math.cos(a) * 39, 70 + Math.sin(a) * 39]); }
  cut(c, moon, K.star, { rim: 0, seed: 5, smooth: false, shadow: 0, tex: .4 });
  S1_STARS.forEach(([x, y, r], k) => star(c, x, y, r * (pulse(i + k * 5, 18, 3) ? .6 : 1), { seed: k }));
  strip(c, -300, W + 300, 560, H + 60, '#34448c', { seed: 41, amp: 14, rim: 5 });
  // 远处的楼：深蓝方块，亮着黄窗
  [[40, 640, 120, 150], [170, 600, 90, 190], [1760, 610, 130, 180], [1650, 660, 90, 130]].forEach(([x, y, w, h], k) => { cut(c, rectPts(x, y, w, h + 300), '#26306a', { rim: 3, seed: 60 + k, smooth: false, shadow: .1 });
    for (let yy = y + 22; yy < y + h + 200; yy += 40) for (let xx = x + 16; xx < x + w - 20; xx += 34) if (hash(xx * 7 + yy, k) > .35) fillPts(c, rectPts(xx, yy, 16, 20), '#ffd76a', .9); });
  // 主视觉海报
  pasted(c, 'kv', 1395, 430, 560, { rot: .025, seed: 12, k: easeOutBack(clamp((t - .5) / .45, 0, 1)), tapes: [[.1, 0, -.2], [.9, 0, .2]] });
  // 铅笔轨道从左往右画出来
  const reveal = lerp(-200, W + 300, easeInOutSine(clamp((tau - .15) / 1.0, 0, 1)));
  c.save(); c.beginPath(); c.rect(-400, 0, reveal + 400, H + 200); c.clip(); rails(c, rail, -300, W + 400, { seed: 9, bed: '#4b4466' }); c.restore();
  // 电车：0.9–2.9s 进站，6.8s 起步出画
  const arrive = easeOutQuint(clamp((t - .9) / 2.0, 0, 1)), leave = easeIn(clamp((t - 6.8) / 1.6, 0, 1)), tx = lerp(-1500, S1.stop, arrive) + leave * 900, moving = (t > .9 && t < 2.85) || t > 6.8;
  if (moving) motionLinesAt(c, tx - 3.2 * s, rail - 1.3 * s, t > 6.8 ? leave : 1 - arrive);
  const bell = t > 2.7 && t < 3.5;
  const tr = tram(c, tx, rail + (moving ? Math.sin(tx * .06) * 1.5 : 0), s, { roll: tx / (s * .33), lamp: 1, glass: '#ffe29a', boardFrom: '幻想乡交通大学', board: '北京交通大学', flip: sm(4.0, 4.5, t),
    umbrella: { blink: pulse(i, 28, 2) ? 1 : 0, tongue: bell ? Math.sin(t * 30) * .8 : Math.sin(t * 6) * .5 },
    driver: (g, x, y, ss) => kogasa(g, x, y, ss, { headOnly: true, umbrella: false, look: [1, 0], mouth: bell ? 'open' : 'tongue', eyes: bell ? 'happy' : 'open' }) });
  if (bell) { const [bx, by] = tr.T(2.05, -4.3); zh(c, '叮叮', bx + 40, by - 10, { size: 58, mode: 'pop', p: sm(2.7, 3.0, t, x => x), color: '#fbf3dc', align: 'center', rot: -.1 }); dashes(c, ...tr.T(2.05, -3.55), 96, 5, { len: 26, w: 4, spread: 1.7, rot: -Math.PI / 2, p: sm(2.7, 2.9, t), col: '#fbf3dc' }); }
  if (t > 4.45 && t < 5.0) { const [bx, by] = tr.T(0, -2.675); dashes(c, bx, by - 10, 120, 7, { len: 30, w: 4, spread: 2.6, rot: -Math.PI / 2, p: sm(4.45, 4.6, t) * (1 - sm(4.8, 5.0, t)), col: K.star }); }
  // 大字：北京交通大学
  const lp = writeP(t, 5.2, '北京交通大学', .1);
  if (t > 5.0) { pop(c, 520, 250, easeOutBack(clamp((t - 5.0) / .3, 0, 1)), () => { cut(c, rectPts(90, 150, 860, 210), K.note, { rim: 7, seed: 71, smooth: false, shadow: .3, tex: .25, anchor: [90, 150] }); tape(c, 120, 160, 120, 36, -.5, 3); tape(c, 920, 350, 120, 36, -.5, 4);
    zh(c, '北京交通大学', 520, 305, { size: 138, align: 'center', color: '#1e2b63', p: lp, seed: 21 }); }); }
}
scene({ order: 1, key: 'depart', name: '1 发车', dur: 8, fn: s1Scene });
