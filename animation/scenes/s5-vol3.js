'use strict';
// 第 5 镜 · 炼金工坊站（9 秒），淡紫卡纸
// 0–1.8s  电车进站停在左边（小伞驾驶，阿求车窗 0、雏车窗 1）。帕秋莉坐在一摞书上读一本大书，摊宣 Vol.3 贴在右边。
// 0.6–1.9s 左上笔记本纸写出「猜猜魔药是由谁的 / 魔力构成的」。
// 1.9–2.7s 摊宣上三个问号药瓶旁边，各有一个剪纸药瓶从摊宣背后钻出来跳到左边，开始冒泡。
// 2.8–4.4s 三缕颜色不同的剪纸烟雾升起，汇进大圆底烧瓶，每缕在瓶里添一层颜色；4.7–5.1s 三层搅成紫色。
// 4.6–5.6s 帕秋莉抬手指一下烧瓶；5.0s 烧瓶里冒出星星和问号，飘在上方。5.4–5.9s 写出「猜对了有奖励！」。
// 7.0–7.7s 帕秋莉跳进车门，7.75s 起坐在车窗 2。8.2s 电车起步，8.6s 起镜头甩出到右边。

const S5 = { dur: 9, rail: 1010, ts: 84, tx: 310, stop: 1.8, fx: 1512, fy: 468, fh: 860, frot: .016, px: 690, seat: 800, ps: 80, kx: 930, ky: 592, kr: 112, bx: 1118, board: 7.72 };
const S5_POT = [{ col: '#ef6f86', v: .47, t: 1.9 }, { col: '#3fb3a3', v: .67, t: 2.1 }, { col: '#f0b030', v: .87, t: 2.3 }];   // 药瓶颜色、对应摊宣上药瓶的高度（v）、弹出时间
const S5_L1 = '猜猜魔药是由谁的\n魔力构成的', S5_L2 = '猜对了有奖励！';
const S5_POP = [[820, 300, 's', '#f7c948'], [880, 150, 'q', '#9a6ad8'], [965, 238, 's', '#ef6f86'], [1020, 92, 'q', '#3fb3a3'], [1090, 205, 's', '#f7c948'], [1150, 318, 'q', '#ef6f86'], [915, 58, 's', '#3fb3a3'], [1165, 110, 's', '#f7c948'], [790, 200, 'q', '#f0b030']];

// 剪纸药瓶（照摊宣上的瓶子：圆角瓶身、斜肩、细瓶颈、软木塞），(x, y) 是瓶底中心
function s5Bottle(c, x, y, h, col, seed, o = {}) { const { sq = 0, rot = 0, fill = .58 } = o, w = h * .64, nw = h * .26;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(1 + sq * .6, 1 - sq);
  const body = [[-w / 2 + h * .1, 0], [-w / 2, -h * .12], [-w / 2, -h * .5], [-nw / 2, -h * .7], [-nw / 2, -h * .86], [nw / 2, -h * .86], [nw / 2, -h * .7], [w / 2, -h * .5], [w / 2, -h * .12], [w / 2 - h * .1, 0]];
  cut(c, body, '#eef6f6', { rim: 5, seed, shadow: .18, smooth: false, anchor: [0, 0], inner: g => {
    cut(g, [[-w, -h * fill + Math.sin(seed) * 3], [w, -h * fill - 3], [w, h], [-w, h]], col, { rim: 0, seed: seed + 1, shadow: 0, smooth: false, tex: .6, jag: 0 });
    cut(g, rectPts(-w * .3, -h * .44, w * .6, h * .3), '#fffdf6', { rim: 0, seed: seed + 2, shadow: .1, smooth: false, tex: .2 });
    zh(g, '?', 0, -h * .19, { size: h * .26, color: K.ink, align: 'center', seed, tilt: 0 }); } });
  cut(c, rectPts(-nw * .62, -h * 1.0, nw * 1.24, h * .17), '#b07d4f', { rim: 3, seed: seed + 3, shadow: .12, smooth: false });
  inkLine(c, [[-w * .36, -h * .14], [-w * .36, -h * .42]], Math.max(2, h * .03), 'rgba(255,255,255,.85)', { smooth: false });
  c.restore(); }
// 大圆底烧瓶：(x, y) 是球心。bands 是从下往上叠的药水层 [颜色, 厚度(占直径的比例)]，最上面一层有波纹
function s5Flask(c, x, y, r, o = {}) { const { bands = [['#cfe6ee', .3]], t = 0, seed = 551, boil = 0 } = o, nw = r * .5, nh = r * 1.0, a0 = Math.asin(nw / 2 / r), pts = [[x - nw / 2, y - r - nh]];
  for (let k = 0; k <= 40; k++) { const th = -Math.PI / 2 - a0 - k / 40 * (2 * Math.PI - 2 * a0); pts.push([x + Math.cos(th) * r, y + Math.sin(th) * r]); }
  pts.push([x + nw / 2, y - r - nh]);
  cut(c, pts, 'rgba(232,245,248,.8)', { rim: 6, seed, shadow: .18, smooth: false, anchor: [x, y], tex: .3, inner: g => {
    const tops = []; let acc = 0; bands.forEach(([, h]) => { acc += h; tops.push(y + r - 2 * r * acc); }); const top = tops[tops.length - 1];
    for (let j = bands.length - 1; j >= 0; j--) { const amp = j === bands.length - 1 ? 4 + boil * 8 : 2.5, wave = [];
      for (let k = 0; k <= 16; k++) { const xx = x - r + k / 16 * 2 * r; wave.push([xx, tops[j] + Math.sin(k * 1.3 + t * (4 + boil * 6) + j * 1.7) * amp]); }
      cut(g, [...wave, [x + r, y + r + 10], [x - r, y + r + 10]], bands[j][0], { rim: 0, seed: seed + 1 + j, shadow: 0, smooth: false, tex: .6, jag: 0 }); }
    for (let k = 0; k < 6; k++) { const ph = (t * (.7 + boil) + k / 6) % 1, bx = x + Math.sin(k * 2.4) * r * .55, by = lerp(y + r * .85, top + 8, ph); if (by > top) fillPts(g, ellPts(bx, by, 5 + k % 3 * 2, 5 + k % 3 * 2, 0, 10), 'rgba(255,255,255,.7)'); } } });
  cut(c, rectPts(x - nw * .66, y - r - nh - 10, nw * 1.32, 20), 'rgba(232,245,248,.95)', { rim: 4, seed: seed + 3, shadow: .12, smooth: false });
  inkLine(c, [[x - r * .62, y - r * .1], [x - r * .5, y - r * .5], [x - r * .2, y - r * .72]], r * .07, 'rgba(255,255,255,.85)');
  inkLine(c, [[x - nw * .25, y - r - nh + 12], [x - nw * .25, y - r - 10]], r * .05, 'rgba(255,255,255,.7)', { smooth: false }); }
// 剪纸烟雾：沿路径长出来的一条带子，p0..p 是露出来的那一段（按长度），头部收尖
function s5Wisp(c, pts, p0, p, col, w0, seed, t) { if (p <= p0) return; const q = spline(pts, 6, false), L = [0];
  for (let k = 1; k < q.length; k++) L.push(L[k - 1] + Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]));
  const total = L[L.length - 1], a = total * clamp(p0, 0, 1), b = total * clamp(p, 0, 1), left = [], right = [];
  for (let k = 0; k < q.length; k++) { if (L[k] < a || L[k] > b) continue; const pa = q[Math.max(0, k - 1)], pb = q[Math.min(q.length - 1, k + 1)], tx = pb[0] - pa[0], ty = pb[1] - pa[1], l = Math.hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l;
    const f = L[k] / total, w = w0 * (.5 + .5 * Math.abs(Math.sin(L[k] / 17 + seed + t * 1.5))) * (1 - .35 * f) * Math.min(1, (b - L[k]) / 40 + .2) * Math.min(1, (L[k] - a) / 40 + .2), wob = Math.sin(t * 3 + L[k] / 45 + seed) * 5;
    left.push([q[k][0] + nx * (w + wob), q[k][1] + ny * (w + wob)]); right.push([q[k][0] - nx * (w - wob), q[k][1] - ny * (w - wob)]); }
  if (left.length < 3) return; cut(c, [...left, ...right.reverse()], col, { rim: 4, seed, shadow: .12, smooth: false, anchor: pts[0] });
  if (p < 1) { const tip = q[Math.min(q.length - 1, L.findIndex(v => v >= b))] || q[q.length - 1]; [[-18, -22, 9], [14, -30, 7], [-4, -44, 5]].forEach(([dx, dy, r], j) => cut(c, ellPts(tip[0] + dx, tip[1] + dy + Math.sin(t * 4 + j) * 3, r, r, 0, 12), col, { rim: 3, seed: seed + 20 + j, shadow: .1, tex: .4 })); } }
// 帕秋莉的大书：紫色封皮、两页写满字
function s5Book(c, x, y, w, rot = 0) { const h = w * .62; c.save(); c.translate(x, y); c.rotate(rot);
  cut(c, [[-w / 2 - 8, -h / 2 + 4], [w / 2 + 8, -h / 2 + 4], [w / 2 + 8, h / 2 + 10], [-w / 2 - 8, h / 2 + 10]], '#6b4a9e', { rim: 4, seed: 561, smooth: false, shadow: .2 });
  for (const sd of [-1, 1]) cut(c, [[0, -h / 2 + 8], [sd * w / 2, -h / 2], [sd * w / 2, h / 2], [0, h / 2 + 6]], '#fdf8ea', { rim: 0, seed: 562 + sd, smooth: false, shadow: .06, tex: .15, inner: g => squiggleText(g, sd < 0 ? -w / 2 + 10 : 10, -h / 2 + 22, w / 2 - 20, 4, { color: 'rgba(60,50,80,.45)', lineH: h * .2, amp: 3, seed: 563 + sd }) });
  inkLine(c, [[0, -h / 2 + 8], [0, h / 2 + 6]], 2, alpha(K.ink, .5), { smooth: false }); c.restore(); }
// 书堆：几本横放的书，书脊上两条线
function s5Stack(c, x, yb, books) { let y = yb; books.forEach(([w, h, col, dx, rot], k) => { c.save(); c.translate(x + dx, y - h / 2); c.rotate(rot);
  cut(c, rectPts(-w / 2, -h / 2, w, h), col, { rim: 4, seed: 570 + k, smooth: false, shadow: .16 }); cut(c, rectPts(-w / 2 + 6, -h / 2 + 5, w - 18, h - 10), '#f6efdc', { rim: 0, seed: 580 + k, smooth: false, shadow: 0, tex: .2 });
  cut(c, rectPts(-w / 2, -h / 2, 14, h), shade(col, .15), { rim: 0, seed: 590 + k, smooth: false, shadow: 0 }); inkLine(c, [[-w / 2 + 3, -h * .22], [-w / 2 + 11, -h * .22]], 2, '#f2d27a', { smooth: false }); inkLine(c, [[-w / 2 + 3, h * .22], [-w / 2 + 11, h * .22]], 2, '#f2d27a', { smooth: false });
  c.restore(); y -= h; }); return y; }
// 墙上的书架：一块木板，上面站着一排书
function s5Shelf(c, x0, x1, y) { const r = rng(533); let x = x0 + 16;
  while (x < x1 - 30) { const w = 20 + r() * 20, h = 80 + r() * 42, col = ['#8a5a8e', '#4c6ea8', '#b8584f', '#5f9a78', '#d0a049', '#7a6aa8'][Math.floor(r() * 6)], lean = r() < .15 ? (r() - .5) * .3 : 0;
    c.save(); c.translate(x + w / 2, y); c.rotate(lean); cut(c, rectPts(-w / 2, -h, w, h), col, { rim: 3, seed: 540 + x, smooth: false, shadow: .12, tex: .6 }); inkLine(c, [[-w / 2 + 4, -h * .78], [w / 2 - 4, -h * .78]], 2, 'rgba(255,240,200,.7)', { smooth: false }); c.restore(); x += w + 3 + (r() < .2 ? 14 : 0); }
  cut(c, rectPts(x0, y, x1 - x0, 18), '#a57a52', { rim: 4, seed: 531, smooth: false, shadow: .18 }); }

function s5Scene(c, tau, i) {
  const t = twos(tau), { rail, ts, px, seat, ps, kx, ky, kr, bx } = S5;
  setView({ x: CX + whip(tau, S5.dur, { inn: .45, out: .4, dist: 760 }), y: CY, zoom: 1 });
  paperBg(c, K.lilac, { seed: 51 });
  [[1880, 420, 14, 1], [760, 470, 13, 2], [40, 420, 12, 3], [1880, 980, 13, 4]].forEach(([x, y, r, k]) => star(c, x, y, r, { seed: 500 + k, color: '#fff7d6' }));
  s5Shelf(c, 30, 590, 610);
  wire(c, rail - 3.36 * ts, -900, 2900);
  rails(c, rail, -900, 2900, { seed: 53, bed: '#b99472' });

  // 摊宣 Vol.3
  const pl = place('vol3', { x: S5.fx, y: S5.fy, h: S5.fh, rot: S5.frot });
  // 剪纸药瓶：从摊宣背后、问号药瓶的同一高度钻出来，跳到摊宣左边（先画，摊宣盖在它们上面）
  S5_POT.forEach((pt, k) => { if (t < pt.t) return; const yb = on(pl, 0, pt.v + .04)[1] + 4, from = [bx + 150, yb], to = [bx, yb], h = hop(t, pt.t, pt.t + .4, from, to, 70), sc = .6 + .4 * easeOutBack(clamp((t - pt.t) / .3, 0, 1));
    const bub = t > pt.t + .5; if (bub) for (let j = 0; j < 4; j++) { const ph = (t * .9 + j / 4 + k * .13) % 1, yy = to[1] - 128 - ph * 90, xx = bx + Math.sin(ph * 8 + j * 2 + k) * 14, rr = (6 + j % 2 * 4) * (1 - ph * .5); cut(c, ellPts(xx, yy, rr, rr, 0, 12), tint(pt.col, .45), { rim: 2, seed: 610 + j + k * 5, shadow: .08, tex: .3, al: 1 - ph }); }
    s5Bottle(c, h.x, h.y, 124 * sc, pt.col, 620 + k * 7, { sq: h.sq, rot: Math.sin(t * 5 + k) * (bub ? .04 : 0) }); });
  pasted(c, 'vol3', S5.fx, S5.fy, S5.fh, { rot: S5.frot, seed: 54, tapes: [[.5, .004, .02], [0, .55, 1.52]] });

  // 电车：0–1.8s 进站；8.2s 起步
  const u = easeOut(clamp(t / S5.stop, 0, 1)), go = t > 8.2 ? 80 * Math.pow(t - 8.2, 2) : 0, tx = lerp(-900, S5.tx, u) + go, moving = t < S5.stop - .1 || go > 0;
  if (moving && t < S5.stop) motionLinesAt(c, tx - 3.2 * ts, rail - 1.3 * ts, 1 - u);
  const inCar = t >= S5.board, doorP = sm(6.75, 7.0, t) * (1 - sm(7.85, 8.1, t)), wow = t > 5.0 && t < 6.6;
  const tr = tram(c, tx, rail + (moving ? Math.sin(tx * .05) * 1.5 : 0), ts, { roll: tx / (ts * .33), lamp: moving ? 1 : 0, doorOpen: doorP,
    umbrella: { blink: pulse(i, 26, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .6, look: wow ? .8 : 0 },
    driver: (g, x, y, s) => kogasa(g, x, y, s, { headOnly: true, umbrella: false, look: [1, wow ? -.6 : 0], eyes: wow ? 'wide' : 'open', mouth: wow ? 'open' : 'tongue' }),
    seats: [(g, x, y, s) => akyuu(g, x, y, s, { headOnly: true, look: [1, wow ? -.6 : 0], eyes: wow ? 'happy' : 'open', mouth: wow ? 'open' : 'smile' }),
      (g, x, y, s) => hina(g, x, y, s, { headOnly: true, look: [1, wow ? -.6 : 0], eyes: wow ? 'wide' : 'open', mouth: wow ? 'o' : 'smile' }),
      inCar ? (g, x, y, s) => patchouli(g, x, y, s, { headOnly: true, look: [1, 0], eyes: 'half', mouth: 'smile' }) : null] });

  // 书堆和帕秋莉
  const top = s5Stack(c, px, rail, [[196, 44, '#7a3b52', 0, 0], [176, 40, '#3f5a96', 8, .02], [188, 42, '#4f8a64', -6, -.015], [164, 38, '#b8793c', 4, .02], [178, 36, '#8e63cb', -2, 0]]);
  const pointing = t >= 4.6 && t < 5.7, onStack = t < 7.05;
  if (onStack) { const kick = Math.sin(t * 3.2) * .06, hipY = top + 4;
    for (const sd of [-1, 1]) { const hip = [px + sd * ps * .22, hipY], foot = [px + sd * ps * (.3 + (sd > 0 ? kick : -kick)), hipY + ps * .55];
      cut(c, capsule(hip, foot, ps * .1), '#f7f2e8', { rim: 0, seed: 600 + sd, shadow: .1, tex: .3 }); cut(c, ellPts(foot[0], foot[1] + ps * .04, ps * .17, ps * .1, 0, 16), '#4b3a55', { rim: 0, seed: 602 + sd, shadow: .1, tex: .5 }); }
    const bw = 136, bk = [px + (pointing ? -34 : -4), top - 42 + idle(t, 3, 1.5)], bRot = pointing ? -.16 : -.03, rise = t > 6.8 ? sm(6.8, 7.0, t) : 0;
    patchouli(c, px, top + ps * .46 - rise * 20, ps, { legs: 'none', bob: idle(t, 2, 1.5), look: pointing ? [1, -.6] : t > 5.7 && t < 6.8 ? [.6, -.2] : [0, .9], eyes: pointing && t < 5.0 ? 'open' : 'half', mouth: t > 5.1 && t < 6.6 ? 'smile' : pointing ? 'o' : 'flat', tilt: pointing ? .08 : -.05,
      armL: [bk[0] - bw * .42, bk[1] + 6], armR: pointing ? .25 : [bk[0] + bw * .42, bk[1] + 6],
      front: (g, R) => { s5Book(g, bk[0], bk[1], bw, bRot); handDot(g, R.hands.l, ps); if (!pointing) handDot(g, R.hands.r, ps);
        else { const raise = easeOutBack(sm(4.6, 4.78, t, x => x)), sh = R.T(.5, -1.38), hd = R.T(lerp(.75, 1.32, raise), lerp(-1.3, -1.98, raise)), fg = [hd[0] + ps * .22, hd[1] - ps * .14];
          cut(g, capsule(sh, hd, ps * .15), '#eecbe0', { rim: 4, seed: 673, shadow: .12, anchor: sh }); cut(g, capsule(hd, fg, ps * .05), K.skin, { rim: 0, seed: 675, shadow: .08 }); cut(g, ellPts(hd[0], hd[1], ps * .14, ps * .14, 0, 14), K.skin, { rim: 0, seed: 674, shadow: .1, tex: .3 });
          const [fx, fy] = fg, k = sm(4.7, 4.85, t) * (1 - sm(5.45, 5.6, t)); if (k > 0) { star(g, fx + 18, fy - 12, 16 * k, { color: '#f7c948', seed: 671 }); dashes(g, fx + 4, fy - 2, 30, 3, { len: 18, w: 4, spread: .9, rot: -.62, p: k, col: '#e7a820' }); } } } }); }
  else if (t < S5.board + .05) { const door = tr.door, h = hop(t, 7.05, 7.6, [px, top + ps * .46], [door[0], door[1]], 170), sc = lerp(ps, 30, easeIn(h.u)), inDoor = t >= 7.6;
    const draw = () => patchouli(c, inDoor ? door[0] - (t - 7.6) * 160 : h.x, h.y, sc, { legs: h.air ? 'jump' : 'stand', sq: h.sq, dir: -1, look: [-1, 0], eyes: 'half', mouth: 'smile', armL: 1.3, armR: 1.3,
      front: (g, R) => s5Book(g, R.T(0, -1.0)[0], R.T(0, -1.0)[1], sc * 1.1, 0) });
    if (inDoor) { c.save(); c.clip(polyPath(M(tr.T, [[.72, -1.96], [1.42, -1.96], [1.42, -.62], [.72, -.62]]))); draw(); c.restore(); } else draw(); }

  // 烧瓶（放在小木凳上）
  inkLine(c, [[kx - 70, rail], [kx - 52, ky + kr + 10]], 11, '#8a5a36', { smooth: false }); inkLine(c, [[kx + 70, rail], [kx + 52, ky + kr + 10]], 11, '#8a5a36', { smooth: false }); inkLine(c, [[kx, rail], [kx, ky + kr + 10]], 10, '#7a4e2e', { smooth: false });
  cut(c, rectPts(kx - 96, ky + kr - 4, 192, 22), '#c89560', { rim: 4, seed: 556, smooth: false, shadow: .16 });
  // 三缕烟各自在瓶里添一层颜色，4.7–5.1s 搅成一瓶紫色
  const blend = sm(4.7, 5.1, t), boil = sm(4.5, 4.9, t) * (1 - sm(5.8, 6.6, t)), PURPLE = '#a86ad0';
  s5Flask(c, kx, ky, kr, { t, boil, bands: [[mix('#cfe6ee', PURPLE, blend), .26], ...S5_POT.map((pt, k) => { const arr = 2.8 + k * .22 + 1.1; return [mix(tint(pt.col, .15), PURPLE, blend), .1 * sm(arr - .15, arr + .45, t)]; })] });

  // 三缕烟雾升起，汇进烧瓶
  const mouth = [kx, ky - kr * 2.0 - 12];
  const paths = [[[bx, 330], [bx - 4, 268], [1070, 228], [1010, 222], [962, 262], [mouth[0] + 6, mouth[1] - 4]],
    [[bx - 8, 506], [1078, 500], [1054, 470], [1048, 400], [1042, 330], [1012, 282], [966, 284], [mouth[0] + 10, mouth[1]]],
    [[bx - 8, 680], [1078, 674], [1054, 642], [1050, 560], [1056, 480], [1050, 380], [1028, 300], [982, 262], [mouth[0] + 2, mouth[1] - 2]]];
  paths.forEach((pp, k) => { const t0 = 2.8 + k * .22; s5Wisp(c, pp, sm(4.4 + k * .1, 5.0 + k * .1, t), sm(t0, t0 + 1.1, t, easeInOutSine), tint(S5_POT[k].col, .25), [28, 21, 21][k], 640 + k * 9, t); });

  // 星星和问号从烧瓶里冒出来
  S5_POP.forEach(([x, y, kind, col], k) => { const t0 = 5.0 + k * .08; if (t < t0) return; const uu = clamp((t - t0) / .6, 0, 1), [ax, ay] = arc(mouth, [x, y], easeOut(uu), 60), sc = easeOutBack(clamp((t - t0) / .4, 0, 1)), bob = uu >= 1 ? Math.sin(t * 2.4 + k) * 6 : 0;
    if (kind === 's') star(c, ax, ay + bob, 30 * sc, { color: col, seed: 650 + k, rot: Math.sin(t * 2 + k) * .3 });
    else zh(c, '?', ax, ay + bob + 24 * sc, { size: 72 * sc, color: col, outline: '#fffdf6', ow: .22, align: 'center', seed: 660 + k, rot: Math.sin(t * 2 + k) * .2 }); });
  if (t > 4.95 && t < 5.5) dashes(c, mouth[0], mouth[1], 36, 7, { len: 26, w: 5, spread: 2.4, rot: -Math.PI / 2, p: sm(4.95, 5.05, t) * (1 - sm(5.3, 5.5, t)), col: '#e7a820' });

  // 笔记本纸：猜猜魔药是由谁的 / 魔力构成的 / 猜对了有奖励！
  const nb = easeOutBack(clamp((t - .6) / .35, 0, 1));
  if (nb > 0) pop(c, 398, 192, nb, () => notebook(c, 398, 192, 744, 334, { seed: 58, rot: -.015, content: g => {
    zh(g, S5_L1, -300, -64, { size: 76, color: K.marker, p: writeP(t, .95, S5_L1, .075), seed: 581, lh: 1.2 });
    zh(g, S5_L2, -300, 128, { size: 82, color: '#d8453b', p: writeP(t, 5.4, S5_L2, .075), seed: 582 }); } }));
}
scene({ order: 5, key: 'vol3', name: '5 炼金工坊站', dur: 9, fn: s5Scene });
