'use strict';
// 第 3 镜 · 会赢的站（8 秒），芥末黄卡纸
// 0–1.5s   电车刹车进站（小伞驾驶，阿求坐车窗 0）；车窗前挂着两枚亚克力挂件，刹车时被甩起来，像钟摆一样晃。0.7s 起卡纸上写出大字「会赢的」。
// 1.8–3.2s 小伞从驾驶窗探出身，盯着摊宣 Vol.1 上的角色，学它眯眼坏笑，冒出剪纸对白泡泡「这就是答案。」。
// 3.45–3.8s 红色「赢」字印章从天而降砸在摊宣右上角：摊宣抖一下、溅出放射短线、镜头一震，挂件又晃起来。
// 4.2–5.5s 笔记本纸上写出「亚克力挂件 8元/套（包含两个单件）」，挂件旁边冒出小星星；之后停留，7.6s 起镜头甩出到右边。

const S3 = { dur: 8, rail: 1000, ts: 120, tx: 560, stop: 1.5, fx: 1500, fy: 506, fh: 860, frot: -.022, hit: 3.8, lean: 1.8, smug: 2.55, price: 4.2 };
const S3_RED = '#d8352f';
const S3_PRICE = '亚克力挂件 8元/套\n（包含两个单件）';

// 圆角矩形的点
function s3RRect(x, y, w, h, r, n = 5) { const out = [], cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of cs) for (let k = 0; k <= n; k++) { const a = a0 + k / n * Math.PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return out; }

// 亚克力挂件：挂绳、金属圈、圆角透明小牌（白色毛边 + 浅色半透明 + 印上去的图案 + 高光）。th = 偏离竖直的角度（正 = 下端往右）
function s3Charm(c, px, py, th, s, kind, seed) {
  const L = s * .18, w = s * .84, h = s * 1.04, top = L + s * .13;
  c.save(); c.translate(px, py); c.rotate(-th);
  inkLine(c, [[0, 0], [0, L]], Math.max(2, s * .028), '#5b4a66', { smooth: false });
  c.lineWidth = s * .04; c.strokeStyle = '#8f89a3'; c.beginPath(); c.arc(0, L + s * .07, s * .075, 0, TAU); c.stroke();
  const q = densify(s3RRect(-w / 2, top, w, h, s * .22), 3.2, true), rimW = s * .075;
  const outer = offsetRing(q, (k, d) => rimW * (.65 + .35 * noise1(d / 13, seed)) + rimW * 1.1 * Math.pow(hash(k, seed + 9), 9));
  c.save(); c.translate(3, 5); c.fillStyle = 'rgba(30,22,52,.16)'; c.fill(polyPath(outer)); c.restore();
  const ring = polyPath(outer); ring.addPath(polyPath(q)); c.fillStyle = '#fffdf8'; c.fill(ring, 'evenodd');
  const body = polyPath(q); c.fillStyle = 'rgba(206,232,248,.5)'; c.fill(body); texFill(c, body, .25, seed * 50, 0);
  // 印在亚克力上的图案：白色底印 + 彩色
  const cy = top + h * .56;
  if (kind === 0) { const pts = starPts(0, cy, w * .33, 0, 5, .46); cut(c, pts, '#f5c93c', { rim: s * .04, seed: seed + 1, shadow: 0, smooth: false, tex: .4 });
    for (const sd of [-1, 1]) fillPts(c, ellPts(sd * w * .08, cy + h * .02, s * .025, s * .035, 0, 10), K.ink); inkLine(c, [[-w * .05, cy + h * .1], [0, cy + h * .13], [w * .05, cy + h * .1]], s * .02, K.ink); }
  else { cut(c, heartPts(0, cy, w * .3), '#ef6f8c', { rim: s * .04, seed: seed + 1, shadow: 0, tex: .4 });
    for (const sd of [-1, 1]) fillPts(c, ellPts(sd * w * .09, cy - h * .01, s * .025, s * .035, 0, 10), K.ink); inkLine(c, [[-w * .05, cy + h * .08], [0, cy + h * .11], [w * .05, cy + h * .08]], s * .02, K.ink); }
  c.lineWidth = s * .03; c.strokeStyle = '#8f89a3'; c.beginPath(); c.arc(0, top + s * .1, s * .05, 0, TAU); c.stroke();
  inkLine(c, [[-w * .36, top + h * .5], [-w * .36, top + h * .2], [-w * .2, top + h * .1]], s * .04, 'rgba(255,255,255,.8)');
  inkLine(c, [[w * .3, top + h * .78], [w * .34, top + h * .64]], s * .03, 'rgba(255,255,255,.65)', { smooth: false });
  c.restore(); }

// 「赢」字印章（印面朝下落下来，落地后留下红色印迹）
function s3Stamp(c, x, y, sz, rot, o = {}) { const { sc = 1, al = 1 } = o; if (al <= 0) return;
  c.save(); c.globalAlpha *= al; c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
  cut(c, s3RRect(-sz / 2, -sz / 2, sz, sz, sz * .13), S3_RED, { rim: 5, seed: 351, shadow: .22, smooth: false, jag: 1.5, tex: .7 });
  inkLine(c, s3RRect(-sz * .39, -sz * .39, sz * .78, sz * .78, sz * .09), sz * .035, 'rgba(255,246,236,.92)', { close: true, smooth: false });
  zh(c, '赢', 0, sz * .25, { size: sz * .64, color: '#fff6ec', align: 'center', tilt: 0, jitter: 0, seed: 7 });
  c.restore(); }

// 大字「会赢的」：「赢」用红色
function s3Big(c, x, y, size, p) { const chars = ['会', '赢', '的'], cols = [K.ink, S3_RED, K.ink], rots = [-.06, .05, -.03];
  c.save(); c.font = `400 ${size}px ${ZH}`; const ws = chars.map(ch => c.measureText(ch).width); c.restore();
  let cx = x; chars.forEach((ch, k) => { zh(c, ch, cx, y + (k === 1 ? -size * .06 : 0), { size: k === 1 ? size * 1.1 : size, color: cols[k], p: clamp(p * 3 - k, 0, 1), seed: 40 + k, rot: rots[k], tilt: 0 }); cx += ws[k] * (k === 1 ? 1.1 : 1); }); }

// 剪纸对白泡泡：tip 是尾巴尖，p 弹出进度，q 字的进度
function s3Bubble(c, x, y, w, h, tip, p, q, str) { const k = easeOutBack(clamp(p, 0, 1)); if (k <= .01) return;
  pop(c, tip[0], tip[1], k, () => {
    cut(c, [[x - w * .02, y + h / 2 - 8], tip, [x + w * .16, y + h / 2 - 8]], '#fffdf6', { rim: 5, seed: 361, shadow: .18, smooth: false });
    cut(c, s3RRect(x - w / 2, y - h / 2, w, h, h * .45), '#fffdf6', { rim: 6, seed: 362, shadow: .18, smooth: false, tex: .25 });
    zh(c, str, x, y + 23, { size: 64, align: 'center', color: K.ink, mode: 'pop', p: q, seed: 363 }); }); }

// 挂件的摆角：刹车时往前甩，停车后回摆衰减；印章砸下时再被震一下
function s3Swing(t, k) { const { stop, hit } = S3, f = 1.05 + k * .12;
  const brake = t < stop ? .3 * Math.pow(1 - t / stop, 2) * sm(0, .25, t) : 0;
  return brake + settle(t, stop - .12, { amp: .5, freq: f, decay: 1.0, phase: k * .3 }) + settle(t, hit, { amp: -.3, freq: f, decay: 1.1, phase: .2 + k * .5 }) + Math.sin(t * 2.2 + k * 2) * .05; }

function s3Scene(c, tau, i) {
  const t = twos(tau), { rail, ts, hit } = S3, jolt = settle(tau, hit, { amp: 9, freq: 5, decay: 7 });
  setView({ x: CX + whip(tau, S3.dur, { inn: .45, out: .4, dist: 760 }), y: CY + jolt, zoom: 1 });
  paperBg(c, K.mustard, { seed: 31 });
  [[860, 120, 20, 1], [1080, 250, 14, 2], [60, 560, 16, 3], [1870, 980, 14, 4], [990, 60, 12, 5], [1870, 300, 13, 6]].forEach(([x, y, r, k]) => star(c, x, y, r, { seed: 300 + k, color: '#fff3c4', rot: drift(t, k) * .3 }));
  wire(c, rail - 3.36 * ts, -900, 2900);
  rails(c, rail, -900, 2900, { seed: 33 });
  [[80, 0], [1010, 1], [1300, 2], [1760, 3], [-300, 4], [2200, 5]].forEach(([x, k]) => grass(c, x, rail + 30, 1.1, 330 + k));

  // 摊宣 Vol.1：印章砸下时抖一下
  const shake = settle(t, hit, { amp: .028, freq: 3.2, decay: 5 }), pl = pasted(c, 'vol1', S3.fx + shake * 120, S3.fy - Math.abs(shake) * 60, S3.fh, { rot: S3.frot + shake, seed: 34, tapes: [[.035, .01, -.7], [1, .715, 1.52]] });

  // 电车：0–1.7s 刹车进站
  const u = easeOut(clamp(t / S3.stop, 0, 1)), tx = lerp(-900, S3.tx, u), moving = t < S3.stop - .05, leaning = t >= S3.lean;
  if (moving) motionLinesAt(c, tx - 3.2 * ts, rail - 1.3 * ts, 1 - u);
  const startled = t >= hit && t < hit + .5, aky = { headOnly: true, look: startled ? [1, -.4] : t > S3.smug ? [1, -.3] : [1, 0], eyes: startled ? 'wide' : t > hit + .5 ? 'happy' : 'open', mouth: startled ? 'o' : t > hit + .5 ? 'open' : 'smile' };
  const tr = tram(c, tx, rail + (moving ? Math.sin(tx * .05) * 1.5 : 0), ts, { roll: tx / (ts * .33), lamp: moving ? 1 : 0,
    umbrella: { blink: pulse(i, 28, 2) ? 1 : 0, tongue: Math.sin(t * 6) * .6, look: leaning ? .8 : 0 },
    seats: [(g, x, y, s) => akyuu(g, x, y, s, aky)],
    driver: leaning ? null : (g, x, y, s) => kogasa(g, x, y, s, { headOnly: true, umbrella: false, look: [1, 0] }) });

  // 两枚亚克力挂件，挂在车窗 1、2 前面的屋檐下
  [[-1.05, 0], [.05, 1]].forEach(([uu, k]) => { const [hx, hy] = tr.T(uu, -1.99); s3Charm(c, hx, hy, s3Swing(t, k), 92, k, 370 + k * 7); });

  // 小伞从驾驶窗探出身，学摊宣上的表情；伞往后仰让出位置
  if (leaning) { const L = easeOutBack(clamp((t - S3.lean) / .3, 0, 1)), smug = t >= S3.smug, flinch = t >= hit && t < hit + .25;
    const kg = s3Kogasa(c, tr, ts, L, smug ? { eyes: flinch ? 'closed' : 'half', mouth: 'none', tilt: -.1 + Math.sin(t * 3) * .03, look: [1, -.25], front: s3Smirk }
      : { eyes: 'wide', mouth: 'o', look: [1, -.8] });
    if (t > 2.05 && t < 2.5) dashes(c, kg.head[0] + 20, kg.head[1] - 40, 80, 5, { len: 30, w: 5, spread: 1.4, rot: -Math.PI / 2 + .45, p: sm(2.05, 2.2, t) }); }
  // 对白泡泡「这就是答案。」
  s3Bubble(c, 948, 462, 440, 136, tr.T(3.08, -2.55), (t - 2.65) / .3, writeP(t, 2.75, '这就是答案。', .07), '这就是答案。');

  // 「赢」字印章：3.45s 从上方落下，3.8s 砸在摊宣右上角
  const corner = on(pl, 1, 0), sx = corner[0] + 12, sy = corner[1] + 26, sRot = -.2;
  if (t >= 3.45) { const f = clamp((t - 3.45) / (hit - 3.45), 0, 1), fall = easeIn(f), land = settle(t, hit, { amp: .12, freq: 3, decay: 7, phase: Math.PI / 2 });
    if (f < 1) { c.save(); c.fillStyle = `rgba(40,20,20,${.25 * fall})`; c.translate(sx + 30 * (1 - fall), sy + 40 * (1 - fall)); c.rotate(sRot); const z = 150 * (1 + .5 * (1 - fall)); c.fill(roundRectPath(-z / 2, -z / 2, z, z, 20)); c.restore(); }
    s3Stamp(c, sx - 160 * (1 - fall), sy - 260 * (1 - fall), 150, sRot - .5 * (1 - fall), { sc: f < 1 ? lerp(2.5, 1, fall) : 1 - land, al: sm(3.45, 3.55, t) });
    const d = sm(hit, hit + .1, t) * (1 - sm(hit + .35, hit + .6, t));
    if (d > 0) { dashes(c, sx, sy, 118, 9, { len: 46, w: 6, p: d, col: S3_RED, rot: -.62, spread: 3.9 }); dashes(c, sx, sy, 185, 6, { len: 26, w: 4, p: d, rot: -.5, spread: 3.3, col: K.ink }); } }

  // 大字「会赢的」
  s3Big(c, 120, 262, 200, clamp((t - .7) / .5, 0, 1));
  // 价格：笔记本纸 + 指向挂件的箭头
  const nb = clamp((t - 3.95) / .3, 0, 1);
  if (nb > 0) { const k = easeOutBack(nb); pop(c, 380, 430, k, () => notebook(c, 380, 432, 690, 212, { seed: 37, rot: -.02,
    content: g => zh(g, S3_PRICE, -300, -12, { size: 66, color: K.marker, p: writeP(t, S3.price, S3_PRICE, .072), seed: 38, lh: 1.24 }) })); }
  const sp = sm(5.55, 5.8, t);
  if (sp > 0) [[-1.62, -1.78, 24], [-.52, -1.62, 18], [.58, -1.84, 22], [-.5, -1.0, 15], [.62, -.95, 17]].forEach(([uu, vv, r], k) => { const [x, y] = tr.T(uu, vv); star(c, x, y, r * easeOutBack(sp) * (1 + .15 * Math.sin(t * 5 + k)), { seed: 390 + k, color: '#f5b62a' }); });
}

// 小伞探出驾驶窗：趴在窗台上，腰以下藏在窗框下沿后面。L = 0 时和驾驶座的位置重合。返回头的位置。
function s3Kogasa(c, tr, s, L, mood) {
  const T = tr.T, [wl, wb] = T(2.02, -1.3), [wr] = T(2.9, -1.3), [cx, cy] = T(2.4, -1.58), s0 = s * .3, s1 = s * .5;
  const ks = lerp(s0, s1, L), rot = .2 * L, fx = lerp(cx, T(2.45, 0)[0], L), fy = lerp(cy + 2.3 * s0, wb + .32 * s1, L);
  c.save(); c.beginPath(); c.rect(-4000, -4000, 8000, wb + 10 + 4000); c.clip();
  const R = kogasa(c, fx, fy, ks, { legs: 'none', umbrella: false, rot, armL: [wl + 22, wb - 4], armR: [wr - 22, wb - 4], ...mood });
  c.restore(); return R; }
// 学来的坏笑：八字眉、歪嘴笑、额角的青筋
function s3Smirk(g, R) { const lw = Math.max(2.5, R.s * .07);
  inkLine(g, M(R.Hd, [[-.58, -2.56], [-.2, -2.44]]), lw, K.ink, { smooth: false }); inkLine(g, M(R.Hd, [[.2, -2.44], [.58, -2.56]]), lw, K.ink, { smooth: false });
  inkLine(g, M(R.Hd, [[-.18, -1.84], [.02, -1.8], [.22, -1.94]]), lw);
  const [vx, vy] = R.Hd(.62, -2.9), r = R.s * .13; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; inkLine(g, [[vx + Math.cos(a - .5) * r, vy + Math.sin(a - .5) * r], [vx + Math.cos(a) * r * .45, vy + Math.sin(a) * r * .45], [vx + Math.cos(a + .5) * r, vy + Math.sin(a + .5) * r]], lw * .8, S3_RED); } }

scene({ order: 3, key: 'vol1', name: '3 会赢的站', dur: 8, fn: s3Scene });
