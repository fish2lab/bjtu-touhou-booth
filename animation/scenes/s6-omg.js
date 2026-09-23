'use strict';
// 第 6 镜 · 笑话站（6 秒）
// 0–1.45s   电车飞快冲进来急刹：速度线、车轮擦出火花、车身前倾再回弹、车窗里的乘客往前一晃。
// 1.5–3.0s  笑话图上两个人头顶弹出「!!」和汗滴；笔记本上写出「北交笑话大公开」「你能轻松绷住吗？」。
// 2.95–3.75s 字下面的红橡皮筋越绷越紧、越抖越厉害；3.75s 断开，断口甩出两截挂在图钉上。
// 3.9–6.0s  车窗里的乘客笑出来；5.25s 电车慢慢起步向右，5.6s 起镜头甩出。

const S6 = { dur: 6, rail: 1005, s: 135, stopX: 500, v: 1700, tb: .78, te: 1.45, snap: 3.75, laugh: 3.9, go: 5.25,
  pic: { x: 1430, y: 505, h: 940, rot: .02 }, note: { x: 560, y: 248, w: 940, h: 404, rot: -.012 }, pinX: 372, bandY: 150 };
const S6_L1 = '北交笑话大公开', S6_L2 = '你能轻松绷住吗？';
const S6_SPARKS = Array.from({ length: 72 }, (_, k) => { const r = rng(600 + k), a = -.25 - r() * 1.05, sp = 520 + r() * 620;
  return { t0: S6.tb + (k >> 1) * (S6.te - S6.tb - .02) / 36, w: k % 2 ? 1.9 : -1.95, vx: -Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .16 + r() * .14, len: .05 + r() * .04, wd: 4 + r() * 3, col: ['#ffd84f', '#ff8f3a', '#fff6c8', '#ff6a3d'][k % 4] }; });
const S6_STREAKS = Array.from({ length: 11 }, (_, k) => { const r = rng(640 + k); return { y: .15 + k * .34 + (r() - .5) * .12, x: r() * 1.1, L: 150 + r() * 260, w: 3.5 + r() * 2.5 }; });

// ---- 电车的运动：匀速冲进来，匀减速刹停，最后缓缓起步 ----
function s6TramX(t) { const { stopX, v, tb, te, go } = S6, a = v / (te - tb), xb = stopX - v * (te - tb) / 2;
  if (t < tb) return xb - v * (tb - t);
  if (t < te) { const u = t - tb; return xb + v * u - .5 * a * u * u; }
  return t < go ? stopX : stopX + 260 * (t - go) * (t - go); }
function s6TramV(t) { const { v, tb, te, go } = S6; return t < tb ? v : t < te ? v * (1 - (t - tb) / (te - tb)) : t < go ? 0 : 520 * (t - go); }
// 车身俯仰：刹车时车头往下栽，停住后往回弹几下
function s6Pitch(t) { const { tb, te, go } = S6; if (t < tb) return 0; if (t < te) return .055 * sm(tb, tb + .12, t);
  return .055 * settle(t, te, { amp: 1, freq: 1.5, decay: 3.2, phase: Math.PI / 2 }) - (t > go ? .018 * sm(go, go + .25, t) * (1 - sm(go + .45, go + .75, t)) : 0); }
// 乘客的惯性：刹车时往前冲，停住后前后晃
function s6Lurch(t) { const { tb, te } = S6; if (t < tb) return 0; if (t < te) return sm(tb, tb + .15, t); return settle(t, te, { amp: 1, freq: 2, decay: 4.5, phase: Math.PI / 2 }); }

// 一条剪纸细条（橡皮筋）：投影、白色毛边、色条、蜡笔纹理。圆头，粗细一致。
function s6Strip(c, pts, w, col, o = {}) { const { rim = 3.5, shadow = .16, tex = .6, al = 1 } = o; if (pts.length < 2) return;
  const path = new Path2D(); pts.forEach((p, k) => k ? path.lineTo(p[0], p[1]) : path.moveTo(p[0], p[1]));
  c.save(); c.globalAlpha *= al; c.lineCap = 'round'; c.lineJoin = 'round';
  if (shadow) { c.save(); c.translate(2.2, 3.2); c.strokeStyle = `rgba(30,22,52,${shadow})`; c.lineWidth = w + rim * 2; c.stroke(path); c.restore(); }
  if (rim) { c.strokeStyle = K.paper; c.lineWidth = w + rim * 2; c.stroke(path); }
  c.strokeStyle = col; c.lineWidth = w; c.stroke(path);
  if (tex) { const p = crayonPat(c); p.setTransform(new DOMMatrix().scale(1 / S)); c.globalAlpha *= tex; c.strokeStyle = p; c.stroke(path); }
  c.restore(); }
// 「!!」：两个剪纸感叹号，h 是总高，k 弹出缩放（从底部弹起）
function s6Bang(c, x, y, h, k, rot = 0, seed = 1) { if (k <= .01) return;
  pop(c, x, y + h / 2, k, () => { [[-.2, -.13], [.2, .1]].forEach(([dx, r], j) => { const T = tf(x + dx * h, y, h, rot + r);
    cut(c, M(T, [[-.15, -.5], [.15, -.5], [.075, .2], [-.075, .2]]), '#e2465f', { rim: 4.5, seed: seed + j * 3, anchor: [x, y], shadow: .2, smooth: false, jag: .5 });
    cut(c, ellPts(...T(0, .39), h * .105, h * .105, 0, 16), '#e2465f', { rim: 4.5, seed: seed + j * 3 + 1, anchor: [x, y], shadow: .2 }); }); }); }
// 汗滴：浅蓝剪纸水滴，尖头朝上
function s6Sweat(c, x, y, r, k, rot = 0, seed = 1) { if (k <= .01) return;
  pop(c, x, y, k, () => { const T = tf(x, y, r, rot), pts = [[0, -2.2]]; for (let j = 0; j <= 12; j++) { const a = -Math.PI / 6 + j / 12 * (Math.PI * 4 / 3); pts.push([Math.cos(a), Math.sin(a)]); }
    cut(c, M(T, pts), '#8fc8ec', { rim: 3.5, seed, anchor: [x, y], shadow: .18, jag: .4 });
    fillPts(c, M(T, ellPts(-.38, .05, .16, .34, .35, 12)), '#ffffff', .85); }); }
// 图钉：蓝色圆头
function s6Pin(c, x, y, lean = 0) { fillPts(c, ellPts(x + 5, y + 7, 15, 12, 0, 18), 'rgba(30,22,52,.2)');
  cut(c, ellPts(x + lean, y, 15, 15, 0, 20), '#3a67bf', { rim: 3, seed: 91 + x, shadow: .18, anchor: [x, y] });
  fillPts(c, ellPts(x + lean - 5, y - 5, 4.5, 3, -.6, 10), '#ffffff', .8); }

// 橡皮筋：绷紧时按两帧一换的正反位移抖动；断开后两截缩回、甩过图钉、挂下来卷着晃
function s6Band(c, t, i) {
  const { pinX, bandY, snap, tb, te } = S6, tension = sm(2.95, snap, t, x => x);
  if (t < snap) {
    const A = 1.5 + (t > tb ? 6 * Math.exp(-Math.max(0, t - te) * 4) : 0) + 15 * tension * tension, sgn = i % 2 ? 1 : -1, pts = [];
    for (let k = 0; k <= 40; k++) { const s = k / 40; pts.push([lerp(-pinX, pinX, s), bandY + sgn * A * Math.sin(Math.PI * s) * (1 + .18 * Math.sin(3 * Math.PI * s + i))]); }
    s6Strip(c, pts, 11 - 3.5 * tension, '#e0343f');
    inkLine(c, pts.map(([x, y]) => [x, y + .5]), 1.6, alpha('#8e1624', .55), { smooth: false });
    if (tension > .05) for (const side of [-1, 1]) for (let j = -1; j <= 1; j++) { const x = j * 90 + sgn * 6, y = bandY + side * (30 + A * .7);
      inkLine(c, [[x - 18, y + side * 5], [x, y], [x + 18, y + side * 5]], 3.5, K.ink, { al: .75 * Math.min(1, tension * 3) }); }
  } else {
    const u = t - snap;
    for (const side of [-1, 1]) {
      const Lh = pinX * (.29 + .71 * Math.exp(-(u + .04) * 20)), th = key(u, [[0, -.22], [.083, -2.75], [.25, -4.3], [.45, -5.05], [.7, -4.45], [1.0, -4.85], [1.4, -4.65], [2.0, -4.71]]);
      const curl = (1.9 + 1.4 * Math.exp(-u * 3) * Math.sin(u * 19)) * sm(0, .1, u, x => x), pts = [[side * pinX, bandY]], N = 24;
      for (let k = 1; k <= N; k++) { const s = k / N, a = th + curl * s * s, [px, py] = pts[k - 1], d = Lh / N; pts.push([px - side * Math.cos(a) * d, py + Math.sin(a) * d]); }
      s6Strip(c, pts, 9.5, '#e0343f');
      inkLine(c, pts.map(([x, y]) => [x, y + .5]), 1.6, alpha('#8e1624', .5));
    }
    // 断口：一朵弹开的剪纸爆炸星和放射短线
    const kb = key(u, [[0, .85], [.083, 1.12], [.2, .9], [.45, 0]]);
    if (kb > .01) { pop(c, 0, bandY, kb, () => cut(c, starPts(0, bandY, 74, .3, 8, .42), '#fff3b0', { rim: 4, seed: 97, shadow: .14, smooth: false, jag: .8 }));
      pop(c, 0, bandY, kb * .55, () => cut(c, starPts(0, bandY, 64, .1, 7, .45), '#ff8f3a', { rim: 0, seed: 98, shadow: 0, smooth: false, jag: .6 })); }
    dashes(c, 0, bandY + 10, 84, 7, { len: 46, w: 5, p: 1 - sm(.25, .45, u), rot: Math.PI / 2, spread: 3.0 });
  }
  const lean = 5 * tension * (t < snap ? 1 : 0);
  s6Pin(c, -pinX, bandY, lean); s6Pin(c, pinX, bandY, -lean);
}

// 车上的人：驾驶窗小伞，车窗 0 阿求、1 雏、2 帕秋莉
function s6Cast(t, i) {
  const { tb, te, laugh } = S6, L = s6Lurch(t), brace = t >= tb && t < te + .3, tense = t >= 2.95 && t < laugh, lol = t >= laugh;
  const face = (k, holdBack = 0) => { const o = { headOnly: true, look: [1, 0], rot: L * .18, dx: L * .32, bob: 0 };
    if (brace) { o.eyes = t < te ? 'closed' : 'wide'; o.mouth = 'o'; }
    else if (tense) { o.eyes = 'wide'; o.mouth = 'o'; o.look = [-.3, -1]; }
    else if (lol && t - laugh >= holdBack) { const lt = t - laugh - holdBack; o.eyes = 'happy'; o.mouth = 'open'; o.bob = -Math.abs(Math.sin(lt * 15 + k)) * .24; o.tilt = Math.sin(lt * 8 + k * 1.7) * .14; }
    else if (lol) { o.eyes = 'half'; o.mouth = 'pout'; o.look = [0, -.4]; o.bob = Math.sin(t * 40) * .03; }
    else o.look = [.1, -.9];
    return o; };
  const seat = (fn, k, hold) => (g, x, y, s) => { const f = face(k, hold); fn(g, x + f.dx * s, y + f.bob * s, s, { ...f, bob: 0 }); };
  const fK = face(3);
  return { driver: (g, x, y, s) => kogasa(g, x + fK.dx * s, y + fK.bob * s, s, { ...fK, bob: 0, umbrella: false, look: fK.eyes ? fK.look : [1, 0] }),
    seats: [seat(akyuu, 0, 0), seat(hina, 1, 0), seat(patchouli, 2, .35)],
    umbrella: { blink: brace || pulse(i, 28, 2) ? 1 : 0, tongue: lol ? Math.sin(t * 16) : Math.sin(t * 6) * .6, look: tense ? -1 : 0 } };
}

function sOmg(c, tau, i) {
  const t = twos(tau), { rail, s, tb, te, snap, laugh } = S6;
  const shake = settle(tau, te, { amp: 9, freq: 6, decay: 9 }), shakeX = settle(tau, snap, { amp: 8, freq: 7, decay: 10 });
  setView({ x: CX + whip(tau, S6.dur, { inn: .45, out: .4, dist: 760 }) + shakeX, y: CY + shake });
  paperBg(c, K.mustard, { seed: 61 });
  // 卡纸上的小星星和胶带
  [[1830, 150, 20, 1], [1790, 470, 14, 2], [1860, 760, 17, 3], [60, 560, 15, 4], [1060, 560, 13, 5]].forEach(([x, y, r, k]) => star(c, x, y, r, { seed: 60 + k, color: '#fffaf0', rot: drift(t, k) * .2 }));
  // 笑话图：贴在右边，电车刹停时被震得晃一下
  const P = S6.pic, pl = pasted(c, 'omg', P.x, P.y, P.h, { rot: P.rot + settle(t, te + .02, { amp: .014, freq: 2.8, decay: 5 }), seed: 7, tapes: [[.5, 0, -.04]] });
  // 图上两个人：头顶弹出「!!」，冒汗滴（都在头顶和太阳穴外面，不压脸和字）
  const re = t > snap ? 1 + .22 * settle(t, snap, { amp: 1, freq: 3, decay: 6, phase: Math.PI / 2 }) : 1;
  const kL = easeOutBack(clamp((t - 1.5) / .25, 0, 1)) * re, kR = easeOutBack(clamp((t - 1.62) / .25, 0, 1)) * re;
  s6Bang(c, ...on(pl, .065, .44), 118, kL, -.1 + settle(t, 1.75, { amp: .08, freq: 2.5, decay: 4 }), 71);
  s6Bang(c, ...on(pl, .885, .355), 118, kR, .08 + settle(t, 1.87, { amp: .08, freq: 2.5, decay: 4 }), 75);
  const drip = 22 * sm(1.9, 3.7, t);
  s6Sweat(c, on(pl, .315, .635)[0], on(pl, .315, .635)[1] + drip, 15, easeOutBack(clamp((t - 1.8) / .2, 0, 1)), .15, 81);
  s6Sweat(c, on(pl, .975, .39)[0], on(pl, .975, .39)[1] + drip * .7, 15, easeOutBack(clamp((t - 1.92) / .2, 0, 1)), -.2, 82);
  s6Sweat(c, on(pl, -.035, .6)[0], on(pl, -.035, .6)[1] + drip * .5, 12, easeOutBack(clamp((t - 3.05) / .2, 0, 1)), -.1, 83);
  s6Sweat(c, on(pl, .78, .3)[0], on(pl, .78, .3)[1] + drip * .5, 11, easeOutBack(clamp((t - 3.18) / .2, 0, 1)), .25, 84);
  // 笔记本：两行手写字，下面一根红橡皮筋
  const N = S6.note, nRot = N.rot + settle(t, snap, { amp: .02, freq: 3, decay: 6 });
  notebook(c, N.x, N.y, N.w, N.h, { rot: nRot, seed: 63, content: g => {
    zh(g, S6_L1, 22, -62, { size: 92, color: K.marker, align: 'center', p: writeP(t, 1.55, S6_L1, .09), seed: 61 });
    zh(g, S6_L2, 22, 70, { size: 92, color: K.marker, align: 'center', p: writeP(t, 2.25, S6_L2, .09), seed: 62 });
    s6Band(g, t, i); } });
  // 轨道
  rails(c, rail, -300, W + 300, { seed: 67 });
  // 电车
  const X = s6TramX(t), V = s6TramV(t), pitch = s6Pitch(t), front = pitch >= 0, pv = front ? X + 1.9 * s : X - 1.95 * s, arm = front ? 1.9 : -1.95;
  const lolJig = t >= laugh && t < S6.go ? Math.sin(t * 34) * 1.6 : 0, ox = pv - arm * s * Math.cos(pitch), oy = rail - arm * s * Math.sin(pitch) + lolJig;
  const k = V / S6.v, rear = X - 3.2 * s;
  // 速度线：车身高度范围内的横向短线，车跑多快线就多长；画在车后面，所以只从车顶上方、车底下和车尾后面露出来
  if (k > .03 && t < te) for (const st of S6_STREAKS) { const y = rail - st.y * s, x1 = rear + st.x * 5.4 * s - 40, L = st.L * (.35 + .65 * k) * 1.4; if (x1 - L > W) continue;
    inkLine(c, [[x1, y], [x1 - L, y]], st.w, K.ink, { smooth: false, al: .8 * Math.min(1, k * 1.6) }); }
  const roll = Math.min(X, s6TramX(tb)) / (s * .33) + (t > S6.go ? (X - S6.stopX) / (s * .33) : 0);
  const cast = s6Cast(t, i), tr = tram(c, ox, oy, s, { rot: pitch, roll, lamp: t < te ? 1 : 0, umbrella: cast.umbrella, driver: cast.driver, seats: cast.seats });
  // 车轮擦出的火花：从轮子和钢轨接触的地方往后上方甩出去的短线
  for (const sp of S6_SPARKS) { const u = t - sp.t0; if (u < 0 || u > sp.life) continue; const bx = s6TramX(sp.t0) + sp.w * s - 10, by = rail - 4;
    const P0 = uu => [bx + sp.vx * uu, by + sp.vy * uu + 1100 * uu * uu], fade = 1 - u / sp.life;
    inkLine(c, [P0(Math.max(0, u - sp.len)), P0(u)], sp.wd * (.5 + .5 * fade), sp.col, { smooth: false }); }
  if (t >= tb && t < te) for (const w of [-1.95, 1.9]) { const [wx, wy] = tr.T(w, 0), f = 1 - .4 * sm(te - .25, te, t);
    star(c, wx - 8, wy - 6, (34 + (i % 2) * 12) * f, { color: '#fff1a8', seed: 88 + (i % 3), rot: i * .4 }); star(c, wx - 8, wy - 6, (16 + (i % 2) * 6) * f, { color: '#ff8f3a', seed: 90, rot: -i * .3 }); }
  // 笑：每个车窗上方冒两三根短线，两帧一换位置
  if (t >= laugh) [[-2.06, 0], [-.94, 0], [.18, .35], [2.42, 0]].forEach(([wx, hold], k) => { if (t - laugh < hold) return; const [hx, hy] = tr.T(wx, -2.02);
    dashes(c, hx, hy, 14, 3, { len: 20 + (i % 2) * 8, w: 4, rot: -Math.PI / 2 + ((i + k) % 2 ? .25 : -.25), spread: 1.5 }); });
  // 起步：车头的小灯和后面几条短速度线
  if (t > S6.go) motionLinesAt(c, X - 3.25 * s, rail - 1.7 * s, sm(S6.go, S6.go + .5, t) * .6);
}

scene({ order: 6, key: 'omg', name: '6 笑话站', dur: 6, fn: sOmg });
