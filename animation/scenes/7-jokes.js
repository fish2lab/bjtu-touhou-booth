'use strict';
// 第 7 段 北交东方笑话集 发布（约 20.9 秒）。照 WASTED 方框印章 meme 的排布：四则笑话一则比一则好笑，
// 新的一则从右边进来，旧的一则同时退到左边、被盖上方框 WASTED 章、变灰变暗，下一则进来时被推出画面；
// 第四则单独停住 2.5 秒后也被盖章。然后聚光灯下亮出最好笑的一则（八云紫的用户资料卡，不盖章），
// 最后觉之瞳慢慢睁开，对着观众写出「你刚才在脑袋里笑了」，落款后黑场，循环回第 1 段。
// 盖章的手是古明地恋的：每次只从画面边缘伸进一只袖子和手，第四次才露出她的帽子和闭着的第三只眼。
// 屏上文字只来自 animation/data/jokes.js（逐字）和 docs/素材事实.md（「北交东方笑话集 发布」「北京交通大学」）。
//   0      只画 handoffBlack，接第 6 段
//   0.2    第 1 则从右边进来，停在正中
//   2.15   第 2 则进来，第 1 则退到左边、被盖章
//   4.85   第 3 则进来，第 1 则被推出，第 2 则退到左边、被盖章
//   8.05   第 4 则进来，第 3 则退到左边、被盖章
//   9.35   第 3 则被推出，第 4 则移到正中，单独停住 2.5 秒
//   12.3   恋的手伸进来，第 4 则被盖章，她的帽子和闭着的第三只眼从画面下沿露出来
//   13.3   一格黑场后聚光灯亮：八云紫的用户资料卡
//   18.5   觉之瞳睁开，片尾
//   20.85  只画 handoffBlack

const S7 = {
  P: 800, Y: 588, XL: 500, XR: 1420, XC: 960, OFFR: 2340, OFFL: -420,   // 方形面板边长、中心高度；左、右、正中三个位置，右边外、左边外
  MOVE: .34, PAD: 50, TW: 700,                                              // 面板移动一格的秒数；面板内边距、正文宽
  IN0: .2, T1: 2.15, T2: 4.85, T3: 8.05, T4: 9.35, HOLD: 2.5,               // 进场、三次换人、第 4 则移到正中；单独停住的秒数
  IMP: { w: 520, h: 190 },                                                  // 印面（方框）大小
};
S7.HIT4 = S7.T4 + S7.MOVE + S7.HOLD + .45;   // 停够 2.5 秒后手才伸进来，0.45 秒后落章
S7.C0 = S7.HIT4 + .55;                       // 冠军
S7.O0 = S7.C0 + 5.2;                         // 片尾
S7.OUT = S7.O0 + 2.35;                       // 只画 handoffBlack
S7.END = S7.OUT + .12;
// 每块面板的行程：[开始时刻, 从 x, 到 x]。像传送带，新的一则进来就把整排往左推一格
S7.LEGS = [
  [[S7.IN0, S7.OFFR, S7.XC], [S7.T1, S7.XC, S7.XL], [S7.T2, S7.XL, S7.OFFL]],
  [[S7.T1, S7.OFFR, S7.XR], [S7.T2, S7.XR, S7.XL], [S7.T3, S7.XL, S7.OFFL]],
  [[S7.T2, S7.OFFR, S7.XR], [S7.T3, S7.XR, S7.XL], [S7.T4, S7.XL, S7.OFFL]],
  [[S7.T3, S7.OFFR, S7.XR], [S7.T4, S7.XR, S7.XC]],
];
// 四次盖章：t 落章时刻，x 落在哪个位置，arm 手臂伸向哪边画面边缘（弧度，从章指向袖子），rot 印面斜角（约 −10°）
S7.STAMPS = [
  { t: S7.T1 + .5, x: S7.XL, arm: -1.2, rot: -.17 },
  { t: S7.T2 + .5, x: S7.XL, arm: 2.2, rot: -.19 },
  { t: S7.T3 + .5, x: S7.XL, arm: Math.PI - .1, rot: -.16 },
  { t: S7.HIT4, x: S7.XC, arm: .72, rot: -.175 },
];
// 每则的排字和配角。punch 从第几行起是包袱；ss / ps 铺垫和包袱的字号；beat 面板落定后隔多久写包袱；per 包袱每字秒数；gap 包袱行之间的停顿
// fig(c, 面板左上 x, y, 本段秒数, 落定时刻)：面板底部的木刻剪影
S7.J = [
  { punch: 1, ss: 48, ps: 66, beat: .3, per: .035, gap: .28, fig: (c, x, y, tau) => s7Suika(c, x + 620, y + 752, 1.08, twos(tau), 300) },
  { punch: 1, ss: 48, ps: 54, beat: .35, per: .02, gap: .1, fig: (c, x, y, tau, land) => s7Rin(c, x + 540, y + 752, 1.05, twos(tau), 330, 1 + Math.max(0, twos(tau) - land - .5) / .42) },
  { punch: 2, ss: 46, ps: 52, beat: .35, per: .02, gap: .1, fig: (c, x, y, tau) => s7Reimu(c, x + 560, y + 752, .92, twos(tau), 360) },
  { punch: 2, ss: 46, ps: 52, beat: .35, per: .02, gap: .1, fig: (c, x, y, tau) => { s7Satori(c, x + 190, y + 752, .88, twos(tau), 390); s7Remilia(c, x + 560, y + 752, .86, twos(tau), 420); } },
];
const s7Land = j => S7.LEGS[j][0][0] + S7.MOVE;
// 冠军那则：匿名用户的评论先慢慢打到「并非，紫」，停一下，后面的乱码一口气滚出来
S7.ANON = JOKE_CHAMPION.lines[3].text;
S7.ANON_H = [...S7.ANON.slice(0, S7.ANON.indexOf('“') + 1)].length;   // 名字到左引号：一下子出现
S7.ANON_Z = [...S7.ANON.slice(0, S7.ANON.indexOf('紫') + 1)].length;  // 打到「紫」为止：一个字一个字打
S7.ANON_N = [...S7.ANON].length;
S7.CH = { on: .12, name: .25, reg: .55, rule: .95, nitori: 1.15, anon: 1.95, slow: .13, pause: .16, fast: .016 };   // 相对冠军开始的秒数
S7.CH.mash = S7.CH.anon + .15 + (S7.ANON_Z - S7.ANON_H) * S7.CH.slow + S7.CH.pause;   // 脸滚键盘开始
S7.CH.note = S7.CH.mash + (S7.ANON_N - S7.ANON_Z) * S7.CH.fast + .1;
S7.CH.gap = S7.CH.note + .3;                                                           // 隙间张开
S7.CH.gone = S7.CH.gap + .62;                                                          // 「该用户已注销」

// ===================== 小工具 =====================
const s7Ease = u => easeOutBack(u, .7);   // 面板移动：突然动，干脆停住，只多冲出去一点点
// s7Taper：沿中线的一条渐细的形（角、尾巴、手臂、辫子），w0 起点宽、w1 终点宽
function s7Taper(pts, w0, w1) { const q = spline(pts, 4, false), n = q.length, L = [], R = [];
  for (let k = 0; k < n; k++) { const a = q[Math.max(0, k - 1)], b = q[Math.min(n - 1, k + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, hw = lerp(w0, w1, k / Math.max(1, n - 1)) / 2;
    L.push([q[k][0] - ty / l * hw, q[k][1] + tx / l * hw]); R.push([q[k][0] + ty / l * hw, q[k][1] - tx / l * hw]); }
  return [...L, ...R.reverse()]; }
// s7Ink：局部坐标里的一块木刻墨块；s7W：一道白色刮痕。T 是 tf() 返回的变换
const s7Ink = (c, T, pts, seed, o = {}) => block(c, M(T, pts), K.ink, { amp: .9, freq: 9, seed, grain: .35, smooth: false, ...o });
const s7W = (c, T, pts, seed, w = 2.2, o = {}) => scratch(c, M(T, pts), { w, seed, dry: .08, taper: .4, ...o });
// s7Wrap：手写楷体折行，左引号不留在行尾
function s7Wrap(c, str, w, size, weight) { const rows = wrapText(c, str, w, size, ZH, weight);
  for (let k = 0; k < rows.length - 1; k++) if (rows[k].endsWith('“')) { rows[k] = rows[k].slice(0, -1); rows[k + 1] = '“' + rows[k + 1]; }
  return rows; }

// ===================== 面板：暖白卡纸、粗糙黑框、手写正文、木刻剪影 =====================
// s7Layout：一则笑话折好的行。rows[k] = { text, y（相对正文顶的基线）, size, punch, line（jokes.js 里第几行）, c0（在该行里从第几个字起）, n }
const S7LAY = {};
function s7Layout(c, j) { const key = j + '@' + S; if (S7LAY[key]) return S7LAY[key];
  const J = S7.J[j], rows = []; let y = 0;
  JOKES[j].lines.forEach((ln, k) => { const punch = k >= J.punch, size = punch ? J.ps : J.ss, wt = punch ? 500 : 400; if (k) y += size * .3; let c0 = 0;
    s7Wrap(c, ln.text, S7.TW, size, wt).forEach(r => { const n = [...r].length; rows.push({ text: r, y: y + size * .95, size, wt, punch, line: k, c0, n }); c0 += n; y += size * 1.32; }); });
  return (S7LAY[key] = { rows, h: y }); }
// s7LineP：第 j 则第 k 行写到多少（铺垫一直在卡上，包袱在面板落定后一行一行写出来）
function s7LineP(j, k, tau) { const J = S7.J[j], L = JOKES[j].lines; if (k < J.punch) return 1;
  let t0 = s7Land(j) + J.beat; for (let m = J.punch; m < k; m++) t0 += [...L[m].text].length * J.per + J.gap;
  return writeP(tau, t0, L[k].text, J.per); }
// s7X：第 j 块面板此刻的中心 x（还没进来或已经推出去返回 null）
function s7X(j, tau) { const legs = S7.LEGS[j]; if (tau < legs[0][0]) return null; let x = null;
  for (const [t0, a, b] of legs) if (tau >= t0) x = lerp(a, b, s7Ease(clamp((tau - t0) / S7.MOVE, 0, 1)));
  return x < -S7.P / 2 - 30 || x > W + S7.P / 2 + 30 ? null : x; }
function s7Panel(c, j, x, tau) { const P = S7.P, y = S7.Y, x0 = x - P / 2, y0 = y - P / 2, t = twos(tau), sd = 700 + j * 50 + tick(t, 6);
  const path = block(c, rectPts(x0, y0, P, P), K.paper, { smooth: false, amp: 1.8, freq: 26, seed: sd, grain: .9, anchor: [x0, y0] });
  outline(c, rectPts(x0 + 16, y0 + 16, P - 32, P - 32), { w: 11, color: K.ink, smooth: false, rough: .35, dry: .05, seed: sd + 1 });
  const L = s7Layout(c, j), ty = y0 + S7.PAD + 14;
  L.rows.forEach((r, k) => { const lp = s7LineP(j, r.line, tau), N = [...JOKES[j].lines[r.line].text].length, p = clamp((lp * N - r.c0) / r.n, 0, 1);
    zh(c, r.text, x0 + S7.PAD, ty + r.y, { size: r.size, weight: r.wt, color: r.punch ? K.ink : K.g3, p, seed: 30 + j * 20 + k, tilt: .01, jitter: .01 }); });
  S7.J[j].fig(c, x0, y0, tau, s7Land(j));
  // 盖过章：整块变灰变暗（像 GTA 的 wasted），章是唯一的颜色
  const st = S7.STAMPS[j], g = sm(st.t, st.t + .14, tau, easeOut);
  if (g > 0) { c.save(); c.globalAlpha *= .42 * g; c.fillStyle = K.ink; c.fill(path); c.restore(); s7Imprint(c, j, x, y + 12, tau); } }
// s7Speed：面板移动时，右沿后面拖几道白色刮痕速度线
function s7Speed(c, j, tau, x) { const x1 = s7X(j, tau - 1 / 24); if (x1 === null) return; const v = x1 - x; if (v < 14) return;
  for (let k = 0; k < 3; k++) { const yy = S7.Y - 230 + k * 230 + (k === 1 ? 40 : 0), L = v * (2.2 + k * .6); scratch(c, [[x + S7.P / 2 + 30, yy], [x + S7.P / 2 + 30 + L, yy + 3]], { w: 3, seed: 740 + j * 3 + k, al: .8, dry: .3 }); } }

// ===================== WASTED 印章 =====================
// s7ImpCanvas：第 k 个印面（离屏画一次）：方形实线框 + Anton 的 WASTED，印泥 K.stamp，着墨不均、边缘粗糙
const S7IMP = {};
function s7ImpCanvas(k) { const key = k + '@' + S; if (S7IMP[key]) return S7IMP[key];
  const { w: bw, h: bh } = S7.IMP, pad = 28, w = bw + pad * 2, h = bh + pad * 2, cv = document.createElement('canvas'); cv.width = Math.round(w * S); cv.height = Math.round(h * S);
  const g = cv.getContext('2d'), r = rng(900 + k * 13); g.scale(S, S); g.translate(pad, pad);
  g.font = '100px Anton'; const fs = Math.min(100 * (bw - 70) / g.measureText('WASTED').width, bh * 1.05);
  g.font = `${fs}px Anton`; g.fillStyle = K.stamp; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('WASTED', bw / 2, bh / 2 + fs * .36);
  outline(g, rectPts(0, 0, bw, bh), { w: 15, color: K.stamp, smooth: false, rough: .45, dry: .1, seed: 910 + k });
  // 着墨不均：擦掉细斑、几道干刮痕、几片压得轻的浅处
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
  for (let n = 0; n < 2400; n++) { const x = r() * (bw + 30) - 15, y = r() * (bh + 30) - 15, d = .5 + .5 * noise1(x / 70 + y / 50, 3 + k); if (r() > .2 + d * .7) continue;
    g.globalAlpha = .4 + r() * .6; const s = .6 + r() * 2.6; g.fillRect(x, y, s, s * (.5 + r())); }
  g.globalAlpha = 1; for (let n = 0; n < 10; n++) { const x = r() * bw - 20, y = r() * bh, L = 40 + r() * 190; stroke(g, [[x, y], [x + L, y + (r() - .5) * 10]], { w: 1 + r() * 2.4, color: '#000', al: .45 + r() * .45, dry: .45, seed: 920 + k * 11 + n, taper: .4 }); }
  for (let n = 0; n < 6; n++) { const x = r() * bw, y = r() * bh, R = 24 + r() * 60; g.globalAlpha = .12 + r() * .22; g.fill(polyPath(rough(ellPts(x, y, R, R * (.5 + r() * .5), r() * 3, 20), { amp: 6, freq: 12, seed: 930 + n + k * 7 }))); }
  const side = r() < .5; g.globalAlpha = .14; g.fill(polyPath(side ? [[bw * .6, -30], [bw + 30, -30], [bw + 30, bh + 30], [bw * .35, bh + 30]] : [[-30, -30], [bw * .4, -30], [bw * .65, bh + 30], [-30, bh + 30]]));
  return (S7IMP[key] = { cv, w, h }); }
// s7Imprint：盖在面板上的印。落章那一下压扁、回弹
function s7Imprint(c, k, x, y, tau) { const st = S7.STAMPS[k], im = s7ImpCanvas(k), q = settle(tau, st.t, { amp: .13, freq: 5, decay: 12, phase: Math.PI / 2 });
  c.save(); c.translate(x, y); c.rotate(st.rot); c.scale(1 + q * .6, 1 - q); c.globalAlpha *= .95; c.drawImage(im.cv, -im.w / 2, -im.h / 2, im.w, im.h); c.restore(); }

// ===================== 恋的手和印章 =====================
// s7Hand：从画面边缘伸进来的一只袖子和手，握着章把。(x, y) 章把中心，z 离纸的高度（越高越大），ang 手臂伸向哪边
function s7Hand(c, x, y, z, ang, sd) { const T = tf(x, y, z, ang), wl = (pts, k, w = 2.6, o = {}) => s7W(c, T, pts, sd + k, w, o);
  // 袖子：宽袖口带一圈荷叶边，一直伸到画面外
  const sleeve = [[96, -64], [170, -72], [1600, -98], [1600, 98], [170, 72], [96, 64]];
  s7Ink(c, T, sleeve, sd + 1, { amp: 1.4, freq: 14, grain: .5 });
  wl([[170, -70], [700, -84], [1500, -96]], 2, 3.2); wl([[170, 70], [700, 84], [1500, 96]], 3, 3.2);
  wl([[210, -20], [420, -30], [640, -22]], 4, 2.4, { al: .8 }); wl([[260, 28], [470, 36], [700, 30]], 5, 2.4, { al: .8 });
  const frill = []; for (let v = -66; v <= 66; v += 4) frill.push([96 - 9 * Math.abs(Math.sin(v / 11 * Math.PI / 2)), v]); wl(frill, 6, 2.8);
  wl([[122, -58], [126, 0], [122, 58]], 7, 2.2, { al: .7 });
  // 手腕和拳头：从上往下看，拳头握住章把，指节朝外
  s7Ink(c, T, [[36, -32], [104, -38], [104, 38], [36, 32]], sd + 8);
  const fist = [[-56, -20], [-46, -44], [-8, -54], [36, -46], [58, -18], [58, 22], [34, 48], [-8, 54], [-46, 44], [-60, 16]];
  s7Ink(c, T, fist, sd + 9, { smooth: true, amp: 1.2 });
  outline(c, M(T, fist), { w: 2.6, color: K.paper, seed: sd + 10, smooth: true, dry: .12 });
  for (let k = 0; k < 3; k++) wl([[-58, -26 + k * 22], [-40, -22 + k * 22], [-26, -25 + k * 22]], 11 + k, 2.4);
  wl([[20, -46], [-6, -40], [-24, -32]], 15, 2.6);   // 拇指
}
// s7Stamp：一次盖章。手从边缘伸进来 → 抬一下 → 砸下去（压扁回弹、画面一震）→ 抬起来撤走，露出印
function s7Stamp(c, st, tau) { const u = tau - st.t; if (u < -.5 || u > .56) return;
  const tx = st.x, ty = S7.Y + 12, dx = Math.cos(st.arm), dy = Math.sin(st.arm), bw = S7.IMP.w + 50, bh = S7.IMP.h + 46;
  const d = 1250 * (1 - sm(-.5, -.24, u, easeOutQuint)) + 1250 * sm(.16, .52, u, easeIn);
  const z = u < -.2 ? 1.28 : u < -.1 ? lerp(1.28, 1.4, easeOut((u + .2) / .1)) : u < 0 ? lerp(1.4, 1, easeIn((u + .1) / .1)) : 1 + .34 * sm(.06, .3, u, easeOut);
  const q = settle(tau, st.t, { amp: .12, freq: 6, decay: 14, phase: Math.PI / 2 }), x = tx + dx * d, y = ty + dy * d, sd = 800 + S7.STAMPS.indexOf(st) * 40 + tick(twos(tau), 8);
  // 影子：离纸越高，影子越偏、越大
  if (z > 1.01) { const off = (z - 1) * 170; c.save(); c.translate(x + off * .5, y + off * .75); c.rotate(st.rot); c.scale(1 + (z - 1) * .4, 1 + (z - 1) * .4); fillPts(c, rectPts(-bw / 2, -bh / 2, bw, bh), K.ink, .26); c.restore(); }
  // 砸下去那一瞬：章身四周几道短墨线
  if (u >= 0 && u < .13) { c.save(); c.translate(tx, ty); c.rotate(st.rot); for (let k = 0; k < 12; k++) { const side = k % 4, f = (Math.floor(k / 4) + .5) / 3, e = 18, L = 44;
      const [px, py, nx, ny] = side === 0 ? [lerp(-bw / 2, bw / 2, f), -bh / 2 - e, 0, -1] : side === 1 ? [bw / 2 + e, lerp(-bh / 2, bh / 2, f), 1, 0] : side === 2 ? [lerp(bw / 2, -bw / 2, f), bh / 2 + e, 0, 1] : [-bw / 2 - e, lerp(bh / 2, -bh / 2, f), -1, 0];
      stroke(c, [[px, py], [px + nx * L + (f - .5) * 20 * Math.abs(ny), py + ny * L + (f - .5) * 20 * Math.abs(nx)]], { w: 6, color: K.ink, seed: sd + k, taper: .5 }); } c.restore(); }
  // 章身：深色木块，白色刮痕描边和木纹，中间一个章把
  c.save(); c.translate(x, y); c.rotate(st.rot); c.scale(z * (1 + q * .5), z * (1 - q));
  block(c, rectPts(-bw / 2, -bh / 2, bw, bh), K.ink2, { smooth: false, amp: 1.4, freq: 20, seed: sd + 1, grain: .5, streaks: 3 });
  outline(c, rectPts(-bw / 2, -bh / 2, bw, bh), { w: 3, color: K.paper, smooth: false, seed: sd + 2, rough: .35, dry: .1 });
  outline(c, rectPts(-bw / 2 + 16, -bh / 2 + 16, bw - 32, bh - 32), { w: 2, color: K.paper, al: .55, smooth: false, seed: sd + 3, dry: .35 });
  block(c, ellPts(0, 0, 50, 50, 0, 30), K.ink, { amp: 1.2, seed: sd + 4, grain: .4 }); outline(c, ellPts(0, 0, 44, 44, 0, 30), { w: 2.4, color: K.paper, al: .75, seed: sd + 5 });
  c.restore();
  s7Hand(c, x, y, z * (1 + q * .3), st.arm, sd + 10); }

// ===================== 恋：第四次盖章时露出来的帽子和闭着的第三只眼 =====================
function s7Koishi(c, tau) { const st = S7.STAMPS[3], t = twos(tau), rise = easeOutBack(sm(st.t - .32, st.t - .06, t, x => x), 1.2); if (rise <= 0) return;
  const sd = 860 + tick(t, 8), T = tf(1660, H + 96 - rise * 170, 1, -.08), wl = (pts, k, w = 3, o = {}) => s7W(c, T, pts, sd + k, w, o);
  // 帽子：黑色剪影，白色刮痕描出帽顶、帽檐、帽带和侧边的蝴蝶结
  const crown = [[-74, -4], [-70, -60], [-46, -96], [0, -108], [46, -96], [70, -60], [74, -4]];
  s7Ink(c, T, crown, sd + 1, { smooth: true }); s7Ink(c, T, ellPts(0, 0, 156, 30, 0, 48), sd + 2, { smooth: true });
  outline(c, M(T, ellPts(0, 0, 156, 30, 0, 60)), { w: 3.2, color: K.paper, seed: sd + 3, dry: .1 });
  stroke(c, M(T, crown), { w: 3.2, color: K.paper, seed: sd + 4, taper: .05, dry: .1 });
  wl([[-72, -16], [0, -8], [72, -16]], 5, 2.6); wl([[-71, -34], [0, -26], [71, -34]], 6, 2.6);
  outline(c, M(T, [[60, -24], [96, -50], [108, -26], [94, -8]]), { w: 2.6, color: K.paper, seed: sd + 7 });
  outline(c, M(T, [[60, -24], [88, -2], [80, 18], [64, 4]]), { w: 2.6, color: K.paper, seed: sd + 8 });
  // 闭着的第三只眼：墨块、白色刮痕描边、只有眼皮线和睫毛；一根管线垂到画面外
  const [ex, ey] = [1790, H - 250 + (1 - rise) * 260];
  scratch(c, [[ex - 20, ey + 34], [ex - 44, ey + 110], [ex - 20, ey + 190], [ex - 60, ey + 290]], { w: 3, seed: sd + 9, taper: .1 });
  block(c, ellPts(ex, ey, 40, 38, .2, 36), K.ink, { amp: 1.6, freq: 10, seed: sd + 10, grain: .5 });
  outline(c, ellPts(ex, ey, 42, 40, .2, 40), { w: 2.8, color: K.paper, seed: sd + 11, dry: .12 });
  eyeLines(c, ex, ey, 22, { open: 0, lid: 1, w: 2.6, seed: sd + 12 }); }

// ===================== 木刻剪影角色（局部坐标：脚底中心为原点，向上为负，身高约 250） =====================
// 萃香：两只大角、举着葫芦往嘴里倒（戒酒打卡），醉得轻轻晃
function s7Suika(c, x, y, s, t, seed) { const sd = seed + tick(t, 8), T = tf(x, y, s, Math.sin(t * 4.2) * .05);
  s7Ink(c, T, s7Taper([[-12, -192], [-30, -222], [-52, -244], [-78, -254]], 18, 2), sd + 1);
  s7Ink(c, T, s7Taper([[12, -194], [28, -226], [48, -250], [74, -264]], 18, 2), sd + 2);
  s7Ink(c, T, [[-30, -176], [-34, -140], [-46, -100], [-40, -78], [-24, -100], [-8, -122], [14, -128], [30, -150], [31, -178], [16, -200], [-14, -200]], sd + 3, { smooth: true });
  s7Ink(c, T, [[-20, -146], [20, -146], [26, -112], [44, -46], [-44, -46], [-26, -112]], sd + 4);
  s7Ink(c, T, s7Taper([[-12, -50], [-14, -8]], 13, 11), sd + 5); s7Ink(c, T, s7Taper([[12, -50], [16, -8]], 13, 11), sd + 6);
  s7Ink(c, T, ellPts(-19, -5, 14, 6, 0, 16), sd + 7); s7Ink(c, T, ellPts(22, -5, 14, 6, 0, 16), sd + 8);
  const m0 = [36, -186], b0 = [94, -218], at = u => [lerp(m0[0], b0[0], u), lerp(m0[1], b0[1], u)];
  s7Ink(c, T, s7Taper([[16, -140], [42, -150], at(.55)], 15, 12), sd + 9);
  s7Ink(c, T, s7Taper([at(.12), at(.82)], 12, 12), sd + 10); s7Ink(c, T, ellPts(...at(.82), 22, 22, 0, 24), sd + 11); s7Ink(c, T, ellPts(...at(.38), 14, 14, 0, 20), sd + 12); s7Ink(c, T, ellPts(...at(.06), 7, 7, 0, 12), sd + 13);
  const [gx, gy] = at(.82); s7W(c, T, [[gx - 12, gy - 10], [gx - 15, gy + 1], [gx - 9, gy + 11]], sd + 14);
  const [wx, wy] = at(.58); s7W(c, T, [[wx - 6, wy - 9], [wx + 6, wy + 9]], sd + 15, 2.4);
  s7Ink(c, T, s7Taper([[-16, -140], [-30, -116], [-36, -92]], 14, 11), sd + 16);
  stroke(c, M(T, [[-36, -92], [-41, -74], [-38, -58]]), { w: 3, color: K.ink, seed: sd + 17, dry: .4, taper: 0 }); s7Ink(c, T, ellPts(-38, -52, 7, 7, 0, 12), sd + 18);
  s7W(c, T, [[-20, -170], [-26, -140], [-34, -108]], sd + 19); s7W(c, T, [[-10, -108], [-16, -78], [-22, -54]], sd + 20); s7W(c, T, [[8, -108], [12, -78], [18, -54]], sd + 21); }
// 燐：猫耳、两根麻花辫、两条尾巴，往左推着猫车；车里的乘客一个个冒出来，越坐越多（n 个）
const S7PAX = [[-146, -110], [-182, -112], [-216, -110], [-164, -138], [-200, -140], [-182, -166]];
function s7Rin(c, x, y, s, t, seed, n) { const sd = seed + tick(t, 8), T = tf(x, y, s);
  S7PAX.forEach(([u, v], k) => { const a = clamp(n - k, 0, 1); if (a <= 0) return; const [px, py] = T(u, v + 14);
    pop(c, px, py, easeOutBack(a, 2), () => { s7Ink(c, T, ellPts(u, v, 15, 15, 0, 18), sd + 40 + k); s7Ink(c, T, ellPts(u, v + 20, 21, 13, 0, 18), sd + 50 + k); }); });
  s7Ink(c, T, [[-104, -90], [-242, -102], [-230, -40], [-120, -38]], sd + 1);
  s7W(c, T, [[-114, -82], [-232, -93]], sd + 2, 2.2); s7W(c, T, [[-126, -52], [-222, -54]], sd + 3, 1.8, { al: .7 });
  s7Ink(c, T, ellPts(-212, -24, 25, 25, 0, 24), sd + 4); for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + .4; s7W(c, T, [[-212 + Math.cos(a) * 19, -24 + Math.sin(a) * 19], [-212 - Math.cos(a) * 19, -24 - Math.sin(a) * 19]], sd + 5 + k, 1.8); }
  stroke(c, M(T, [[-62, -100], [-126, -70]]), { w: 8, color: K.ink, seed: sd + 8, taper: 0 }); stroke(c, M(T, [[-130, -42], [-126, -4]]), { w: 7, color: K.ink, seed: sd + 9, taper: 0 });
  s7Ink(c, T, s7Taper([[30, -60], [56, -86], [66, -122], [54, -148]], 12, 3), sd + 10); s7Ink(c, T, s7Taper([[34, -50], [68, -62], [90, -96], [94, -126]], 12, 3), sd + 11);
  s7Ink(c, T, [[-36, -150], [4, -152], [12, -118], [40, -12], [-38, -12], [-42, -100]], sd + 12);
  s7Ink(c, T, ellPts(-22, -5, 14, 6, 0, 16), sd + 13); s7Ink(c, T, ellPts(18, -5, 14, 6, 0, 16), sd + 14);
  s7Ink(c, T, ellPts(-20, -176, 25, 25, 0, 24), sd + 15); s7Ink(c, T, [[-42, -190], [-48, -224], [-24, -200]], sd + 16); s7Ink(c, T, [[-10, -202], [0, -230], [4, -194]], sd + 17);
  s7Ink(c, T, s7Taper([[-40, -168], [-46, -146], [-44, -122], [-48, -104]], 14, 8), sd + 18); s7Ink(c, T, s7Taper([[0, -166], [6, -144], [4, -120], [10, -104]], 14, 8), sd + 19);
  for (let k = 0; k < 3; k++) { s7W(c, T, [[-50, -158 + k * 17], [-40, -150 + k * 17]], sd + 20 + k, 1.8); s7W(c, T, [[-4, -156 + k * 17], [8, -148 + k * 17]], sd + 23 + k, 1.8); }
  s7Ink(c, T, s7Taper([[-26, -140], [-48, -118], [-66, -102]], 14, 10), sd + 26); s7Ink(c, T, ellPts(-66, -100, 9, 9, 0, 12), sd + 27);
  s7W(c, T, [[-16, -110], [-20, -60], [-26, -22]], sd + 28); s7W(c, T, [[8, -100], [16, -56], [22, -22]], sd + 29); }
// 灵梦：大蝴蝶结、分离的大袖子，伸手要钱；身后竿子挑着一面幡，竖写「不灵不要钱」（原文引号里的字）
const S7SIGN = JOKES[2].lines[0].text.match(/“(.+?)”/)[1];
function s7Reimu(c, x, y, s, t, seed) { const sd = seed + tick(t, 8), T = tf(x, y, s);
  stroke(c, M(T, [[-150, 0], [-150, -286]]), { w: 7, color: K.ink, seed: sd + 1, taper: 0 }); stroke(c, M(T, [[-198, -274], [-106, -274]]), { w: 6, color: K.ink, seed: sd + 2, taper: 0 });
  const bx0 = -192, bw = 84, by0 = -268, bh = 236; block(c, M(T, rectPts(bx0, by0, bw, bh)), K.card, { smooth: false, amp: 1, seed: sd + 3, grain: .5 });
  outline(c, M(T, rectPts(bx0, by0, bw, bh)), { w: 3.2, color: K.ink, smooth: false, seed: sd + 4 });
  [...S7SIGN].forEach((ch, k) => { const [cx, cy] = T(bx0 + bw / 2, by0 + 52 + k * 43); zh(c, ch, cx, cy, { size: 38 * s, weight: 500, color: K.ink, align: 'center', seed: 70 + k, tilt: .01, jitter: .01 }); });
  const bow = d => [[d * 4, -204], [d * 26, -232], [d * 56, -242], [d * 70, -222], [d * 58, -198], [d * 24, -198]];
  s7Ink(c, T, bow(-1), sd + 5, { smooth: true }); s7Ink(c, T, bow(1), sd + 6, { smooth: true }); s7Ink(c, T, ellPts(0, -203, 11, 10, 0, 14), sd + 7);
  s7W(c, T, [[-12, -208], [-30, -226], [-54, -234], [-62, -220]], sd + 8); s7W(c, T, [[12, -208], [30, -226], [54, -234], [62, -220]], sd + 9);
  s7Ink(c, T, [[-27, -186], [-30, -150], [-22, -134], [22, -134], [30, -150], [27, -186], [0, -204]], sd + 10, { smooth: true });
  s7Ink(c, T, s7Taper([[-25, -160], [-29, -130], [-27, -110]], 12, 10), sd + 11); s7Ink(c, T, s7Taper([[25, -160], [29, -130], [27, -110]], 12, 10), sd + 12);
  s7W(c, T, [[-33, -126], [-22, -124]], sd + 13, 2.4); s7W(c, T, [[22, -124], [33, -126]], sd + 14, 2.4);
  s7Ink(c, T, [[-16, -150], [16, -150], [22, -118], [56, -40], [-56, -40], [-22, -118]], sd + 15);
  s7Ink(c, T, s7Taper([[-12, -44], [-14, -8]], 12, 11), sd + 16); s7Ink(c, T, s7Taper([[12, -44], [15, -8]], 12, 11), sd + 17);
  s7Ink(c, T, ellPts(-18, -5, 13, 6, 0, 16), sd + 18); s7Ink(c, T, ellPts(20, -5, 13, 6, 0, 16), sd + 19);
  const hem = []; for (let u = -50; u <= 50; u += 5) hem.push([u, -52 + 3 * Math.sin(u / 5)]); s7W(c, T, hem, sd + 20, 2);
  s7W(c, T, [[-6, -112], [-14, -78], [-22, -56]], sd + 21); s7W(c, T, [[8, -112], [16, -80], [24, -58]], sd + 22);
  s7Ink(c, T, s7Taper([[14, -142], [38, -130], [62, -122]], 13, 10), sd + 23);
  s7Ink(c, T, [[44, -140], [84, -152], [104, -120], [92, -96], [56, -106]], sd + 24, { smooth: true }); s7W(c, T, [[84, -150], [103, -120], [92, -98]], sd + 25, 2.4);
  s7Ink(c, T, ellPts(114, -122, 13, 7, -.2, 16), sd + 26);
  s7Ink(c, T, [[-16, -142], [-42, -128], [-68, -84], [-42, -72], [-24, -108]], sd + 27, { smooth: true }); s7W(c, T, [[-66, -86], [-42, -74]], sd + 28, 2.4); }
// 觉：波浪短发、发箍、胸前那只睁开的第三只眼和绕着身子的管线，伸手指着
function s7Satori(c, x, y, s, t, seed) { const sd = seed + tick(t, 8), T = tf(x, y, s);
  s7Ink(c, T, [[-30, -186], [-34, -160], [-40, -140], [-26, -136], [-16, -148], [16, -148], [26, -136], [40, -140], [34, -160], [30, -186], [0, -204]], sd + 1, { smooth: true });
  s7Ink(c, T, ellPts(0, -172, 25, 25, 0, 24), sd + 2); s7W(c, T, [[-27, -184], [-12, -196], [12, -196], [27, -184]], sd + 3, 3);
  s7Ink(c, T, [[-18, -146], [18, -146], [24, -112], [44, -40], [-44, -40], [-24, -112]], sd + 4);
  s7Ink(c, T, s7Taper([[-12, -44], [-14, -8]], 12, 11), sd + 5); s7Ink(c, T, s7Taper([[12, -44], [15, -8]], 12, 11), sd + 6);
  s7Ink(c, T, ellPts(-18, -5, 13, 6, 0, 16), sd + 7); s7Ink(c, T, ellPts(20, -5, 13, 6, 0, 16), sd + 8);
  s7Ink(c, T, s7Taper([[14, -138], [42, -134], [70, -140]], 13, 8), sd + 9); s7Ink(c, T, s7Taper([[-14, -138], [-28, -112], [-32, -86]], 13, 10), sd + 10);
  const hem = []; for (let u = -40; u <= 40; u += 5) hem.push([u, -50 + 3 * Math.sin(u / 4)]); s7W(c, T, hem, sd + 11, 2);
  s7W(c, T, [[-4, -86], [-26, -70], [-34, -48]], sd + 12); s7W(c, T, [[12, -110], [30, -126], [26, -146]], sd + 13);
  const [ex, ey] = T(-2, -106); block(c, ellPts(ex, ey, 19 * s, 19 * s, 0, 24), K.ink, { amp: .8, seed: sd + 14, grain: .3 });
  outline(c, ellPts(ex, ey, 20 * s, 20 * s, 0, 28), { w: 2.2, color: K.paper, seed: sd + 15 }); eyeLines(c, ex, ey, 13 * s, { open: 1, look: [.6, 0], w: 1.8, seed: sd + 16 }); }
// 蕾米莉亚：蝙蝠翼、软帽，斜握着冈格尼尔
function s7Remilia(c, x, y, s, t, seed) { const sd = seed + tick(t, 8), T = tf(x, y, s);
  const wing = d => [[d * 8, -132], [d * 40, -170], [d * 84, -194], [d * 124, -182], [d * 112, -160], [d * 96, -164], [d * 94, -140], [d * 76, -146], [d * 72, -122], [d * 50, -130], [d * 26, -112]];
  for (const d of [-1, 1]) { s7Ink(c, T, wing(d), sd + 1 + d); s7W(c, T, [[d * 12, -134], [d * 84, -190]], sd + 4 + d, 2); s7W(c, T, [[d * 40, -160], [d * 94, -160]], sd + 6 + d, 1.8); s7W(c, T, [[d * 30, -140], [d * 72, -142]], sd + 8 + d, 1.8); }
  stroke(c, M(T, [[-40, 0], [96, -272]]), { w: 8, color: K.ink, seed: sd + 10, taper: 0 });
  s7Ink(c, T, s7Taper([[92, -264], [104, -292], [116, -324]], 20, 1), sd + 11); s7Ink(c, T, s7Taper([[78, -262], [94, -268], [110, -262]], 8, 8), sd + 12);
  s7W(c, T, [[96, -276], [110, -310]], sd + 13, 1.8);
  s7Ink(c, T, [[-16, -136], [16, -136], [22, -106], [42, -34], [-42, -34], [-22, -106]], sd + 14);
  s7Ink(c, T, s7Taper([[-11, -38], [-13, -8]], 12, 11), sd + 15); s7Ink(c, T, s7Taper([[11, -38], [14, -8]], 12, 11), sd + 16);
  s7Ink(c, T, ellPts(-17, -5, 12, 6, 0, 16), sd + 17); s7Ink(c, T, ellPts(19, -5, 12, 6, 0, 16), sd + 18);
  s7Ink(c, T, [[-26, -164], [-28, -140], [-18, -132], [18, -132], [28, -140], [26, -164]], sd + 19, { smooth: true });
  s7Ink(c, T, ellPts(0, -158, 24, 24, 0, 24), sd + 20); s7Ink(c, T, ellPts(0, -178, 36, 20, 0, 28), sd + 21, { smooth: true });
  const ruff = []; for (let u = -34; u <= 34; u += 3) ruff.push([u, -166 + 3 * Math.abs(Math.sin(u / 5))]); s7W(c, T, ruff, sd + 22, 2);
  s7W(c, T, [[-30, -176], [0, -172], [30, -178]], sd + 23, 2.2); outline(c, M(T, [[28, -180], [42, -192], [46, -178]]), { w: 2, color: K.paper, seed: sd + 24 });
  s7Ink(c, T, s7Taper([[12, -128], [22, -124], [30, -130]], 12, 10), sd + 25);
  const hem = []; for (let u = -38; u <= 38; u += 5) hem.push([u, -44 + 3 * Math.sin(u / 4)]); s7W(c, T, hem, sd + 26, 2); }
// 紫的头像：大软帽、长发，发梢系小蝴蝶结（头像框左上 (x, y)，边长 sz）
function s7YukariBust(c, x, y, sz, seed) { const T = tf(x, y, sz / 180), sd = seed;
  s7Ink(c, T, [[46, 70], [40, 112], [28, 160], [54, 170], [66, 130], [114, 130], [126, 170], [152, 160], [140, 112], [134, 70], [90, 44]], sd + 1, { smooth: true });
  s7Ink(c, T, [[2, 184], [14, 150], [54, 128], [126, 128], [166, 150], [178, 184]], sd + 2, { smooth: true });
  s7Ink(c, T, ellPts(90, 94, 33, 37, 0, 24), sd + 3); s7Ink(c, T, ellPts(90, 60, 58, 30, 0, 32), sd + 4, { smooth: true });
  const ruff = []; for (let u = -52; u <= 52; u += 3) ruff.push([90 + u, 78 - 12 * (1 - (u / 52) ** 2) + 3 * Math.abs(Math.sin(u / 5))]); s7W(c, T, ruff, sd + 5, 2.2);
  s7W(c, T, [[42, 66], [90, 74], [138, 66]], sd + 6, 2); outline(c, M(T, [[90, 42], [74, 28], [70, 44]]), { w: 2, color: K.paper, seed: sd + 7 }); outline(c, M(T, [[90, 42], [106, 28], [110, 44]]), { w: 2, color: K.paper, seed: sd + 8 });
  for (const hx of [40, 140]) { outline(c, M(T, [[hx, 160], [hx - 12, 150], [hx - 12, 168]]), { w: 1.8, color: K.paper, seed: sd + hx }); outline(c, M(T, [[hx, 160], [hx + 12, 150], [hx + 12, 168]]), { w: 1.8, color: K.paper, seed: sd + hx + 1 }); } }

// ===================== 第一幕：四则淘汰赛 =====================
function s7Contest(c, tau) { let sx = 0, sy = 0;
  for (const st of S7.STAMPS) { sx += settle(tau, st.t, { amp: 12, freq: 11, decay: 15 }); sy += settle(tau, st.t, { amp: 18, freq: 8, decay: 15, phase: 1.2 }); }
  setView({ x: CX - sx, y: CY - sy, zoom: 1 }); inkBg(c);
  for (let j = 0; j < 4; j++) { const x = s7X(j, tau); if (x === null) continue; s7Speed(c, j, tau, x); s7Panel(c, j, x, tau); }
  s7Koishi(c, tau);
  for (const st of S7.STAMPS) s7Stamp(c, st, tau);
  caption(c, '北交东方笑话集', tau, .15, { t1: S7.HIT4 + .25 }); }

// ===================== 第二幕：聚光灯下的八云紫用户资料卡 =====================
// s7CrackPts：一道细长的隙间，从 a 到 b，hw 中间半宽。返回两侧唇线 L、R 和中线 mid
function s7CrackPts(a, b, hw, seed) { const n = 56, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, L = [], R = [], mid = [];
  for (let k = 0; k <= n; k++) { const v = k / n, s = Math.sin(v * Math.PI), w = hw * Math.pow(s, .7) * (1 + .16 * noise1(v * 7, seed)), off = 3 * noise1(v * 4, seed + 2) * s;
    const x = a[0] + dx * v + nx * off, y = a[1] + dy * v + ny * off; mid.push([x, y]); L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]); }
  return { L, R, mid }; }
// s7Bow：隙间一端系的小蝴蝶结（纸上用墨画）
function s7Bow(c, x, y, s, seed, rot = 0) { if (s < 1) return; const T = tf(x, y, s, rot);
  for (const d of [-1, 1]) { block(c, M(T, [[0, 0], [d * .5, -.58], [d * 1.05, -.64], [d * 1.22, -.22], [d * .98, .12], [d * .42, .14]]), K.ink, { amp: s * .025, freq: 8, seed: seed + d, grain: .4 });
    scratch(c, M(T, [[d * .3, -.16], [d * .7, -.42], [d * .98, -.32]]), { w: Math.max(1.2, s * .06), seed: seed + 4 + d, dry: .1 }); }
  stroke(c, M(T, [[-.05, .08], [-.3, .62], [-.52, 1.18]]), { w: s * .17, color: K.ink, seed: seed + 7, taper: .5 });
  stroke(c, M(T, [[.05, .08], [.26, .66], [.4, 1.22]]), { w: s * .17, color: K.ink, seed: seed + 8, taper: .5 });
  fillPts(c, M(T, ellPts(0, 0, .22, .2, 0, 14)), K.ink); }
// s7Spot：顶上一盏灯，一道硬边的光锥（不发光、不渐变），灯边几道白色刮痕
function s7Spot(c, t) { const sd = 600 + tick(t, 6);
  block(c, [[930, 96], [990, 96], [1720, 1100], [200, 1100]], mix(K.ink, K.paper, .13), { smooth: false, amp: 2.5, freq: 30, seed: sd, grain: .6 });
  stroke(c, [[960, -20], [960, 60]], { w: 3, color: K.paper, seed: sd + 1, taper: 0, al: .8 });
  block(c, [[924, 98], [996, 98], [982, 58], [938, 58]], K.ink, { smooth: false, amp: .8, seed: sd + 2 }); outline(c, [[924, 98], [996, 98], [982, 58], [938, 58]], { w: 2.6, color: K.paper, smooth: false, seed: sd + 3 });
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .38; scratch(c, [[960 + Math.cos(a) * 58, 78 + Math.sin(a) * 40], [960 + Math.cos(a) * 96, 78 + Math.sin(a) * 66]], { w: 2, al: .7, seed: sd + 4 + k }); } }
function s7Champion(c, tau) { const ct = tau - S7.C0, CH = S7.CH, t = twos(tau), sd = 500 + tick(t, 8), A = JOKE_CHAMPION.lines;
  if (ct < CH.on) { handoffBlack(c); return; }   // 一格黑场，然后灯一下子亮
  setView({ x: CX, y: CY + 20, zoom: 1 + .06 * sm(CH.on, S7.O0 - S7.C0, ct, easeInOutSine) }); inkBg(c); s7Spot(c, t);
  const cw = 1180, chh = 660, fi = Math.floor(ct * 12), mash = ct > CH.mash && ct < CH.note ? [(hash(fi, 1) - .5) * 12, (hash(fi, 2) - .5) * 9] : [0, 0];
  const x0 = CX - cw / 2 + mash[0], y0 = 262 + mash[1], k = .9 + .1 * easeOutBack(sm(CH.on, CH.on + .22, ct, x => x), 1.4), lx = x0 + 64, tw = cw - 128;
  pop(c, CX, y0 + chh / 2, k, () => {
    block(c, rectPts(x0, y0, cw, chh), K.paper, { smooth: false, amp: 1.8, freq: 26, seed: sd, grain: .9, anchor: [x0, y0] });
    outline(c, rectPts(x0 + 16, y0 + 16, cw - 32, chh - 32), { w: 11, color: K.ink, smooth: false, rough: .35, dry: .05, seed: sd + 1 });
    // 头像、用户名、注册时间
    const av = 172; block(c, rectPts(lx, y0 + 58, av, av), K.card, { smooth: false, amp: 1, seed: sd + 2, grain: .4 }); c.save(); c.beginPath(); c.rect(lx, y0 + 58, av, av); c.clip(); s7YukariBust(c, lx, y0 + 58, av, sd + 3); c.restore();
    outline(c, rectPts(lx, y0 + 58, av, av), { w: 3.4, color: K.ink, smooth: false, seed: sd + 4 });
    zh(c, A[0].text, lx + av + 44, y0 + 130, { size: 64, weight: 500, p: writeP(ct, CH.name, A[0].text, .035), seed: 71, tilt: .01, jitter: .01 });
    zh(c, A[1].text, lx + av + 44, y0 + 208, { size: 48, color: K.g3, p: writeP(ct, CH.reg, A[1].text, .028), seed: 72, tilt: .01, jitter: .01 });
    stroke(c, [[lx, y0 + 272], [x0 + cw - 64, y0 + 270]], { w: 3, color: K.ink, p: sm(CH.rule, CH.rule + .25, ct, easeOut), seed: sd + 5, dry: .2, taper: .05 });
    // 河城荷取的评论
    const sz = 44, lh = 60, nit = s7Wrap(c, A[2].text, tw, sz, 400), np = writeP(ct, CH.nitori, A[2].text, .016); let c0 = 0;
    nit.forEach((r, i) => { const n = [...r].length; zh(c, r, lx, y0 + 340 + i * lh, { size: sz, p: clamp((np * [...A[2].text].length - c0) / n, 0, 1), seed: 73 + i, tilt: .01, jitter: .01 }); c0 += n; });
    // 匿名用户的评论：逐字打出来，打到「并非，紫」之后变成脸滚键盘的乱码；然后被隙间吞掉
    const ay = y0 + 340 + nit.length * lh + 26, an = s7Wrap(c, S7.ANON, tw, sz, 400), shown = s7Typed(ct), g = ct - CH.gap;
    const swallow = sm(.12, .3, g, easeIn), yc = ay + (an.length - 1) * lh / 2 - sz * .35;
    if (g < .3) { c0 = 0; let cur = null;
      pop(c, CX, yc, 1, () => an.forEach((r, i) => { const n = [...r].length, m = clamp(shown - c0, 0, n); if (m > 0) zh(c, [...r].slice(0, m).join(''), lx, ay + i * lh, { size: sz, seed: 80 + i, tilt: .01, jitter: .01 }); if (shown > c0 && shown <= c0 + n) cur = [lx + zhWidth(c, [...r].slice(0, m).join(''), sz), ay + i * lh]; c0 += n; }), 1 - swallow);
      if (cur && ct < CH.note + .2 && (ct < CH.note || Math.floor(ct * 5) % 2 === 0)) stroke(c, [[cur[0] + 6, cur[1] + 8], [cur[0] + 6, cur[1] - sz * .82]], { w: 4, color: K.ink, seed: sd + 6, taper: 0, smooth: false }); }
    if (ct >= CH.note) zh(c, A[3].note, lx, ay + an.length * lh - 4, { size: 30, color: K.g2, p: writeP(ct, CH.note, A[3].note, .012), seed: 90, tilt: .01, jitter: .01 });
    if (g >= 0 && g < .62) s7Swallow(c, lx - 30, x0 + cw - 34, yc, g, sd + 7);
    if (ct >= CH.gone) zh(c, A[4].text, lx, ay, { size: sz, weight: 500, color: K.g3, p: writeP(ct, CH.gone, A[4].text, .05), seed: 91, tilt: .01, jitter: .01 });
  }); }
// s7Typed：匿名用户的评论此刻打出了几个字
function s7Typed(ct) { const CH = S7.CH; if (ct < CH.anon) return 0; const u = ct - CH.anon - .15; if (u < 0) return S7.ANON_H;
  const slowN = S7.ANON_Z - S7.ANON_H, slowT = slowN * CH.slow; if (u < slowT) return S7.ANON_H + Math.min(slowN, Math.floor(u / CH.slow) + 1);
  const v = u - slowT - CH.pause; if (v < 0) return S7.ANON_Z; return Math.min(S7.ANON_N, S7.ANON_Z + Math.floor(v / CH.fast) + 1); }
// s7Swallow：评论那一栏裂开一道隙间：从中间往两头拉长 → 两端系上蝴蝶结 → 张开吞掉这条评论 → 合上
function s7Swallow(c, xa, xb, yc, g, sd) { const len = sm(0, .12, g, easeOutQuint), open = sm(.1, .3, g, easeIn) * (1 - sm(.42, .58, g, easeInOutSine)), mx = (xa + xb) / 2, half = (xb - xa) / 2 * len;
  const a = [mx - half, yc + 4], b = [mx + half, yc - 4], hw = 4 + open * 74, q = s7CrackPts(a, b, hw, 40 + tick(g, 8));
  block(c, [...q.L, ...q.R.slice().reverse()], K.ink, { amp: 1.1, freq: 9, seed: sd, grain: .5, smooth: false });
  [q.L, q.R].forEach((side, j) => { const pts = side.slice(4, -4).map((e, k) => { const m = q.mid[k + 4], d = Math.hypot(e[0] - m[0], e[1] - m[1]), f = d > 1 ? Math.max(0, d - 3) / d : 0; return [lerp(m[0], e[0], f), lerp(m[1], e[1], f)]; });
    scratch(c, pts, { w: lerp(2, 3.4, open), seed: sd + 3 + j * 7, dry: .12, taper: .4 }); });
  const bk = 30 * sm(.06, .16, g, easeOutBack) * (1 - sm(.5, .6, g)); s7Bow(c, a[0], a[1], bk, sd + 20, -.06); s7Bow(c, b[0], b[1], bk, sd + 30, .06); }

// ===================== 第三幕：觉之瞳睁开，片尾 =====================
const S7CORD = Array.from({ length: 61 }, (_, k) => { const u = k / 60; return [lerp(852, -40, u) + 26 * Math.sin(u * 7) * u, lerp(500, 780, u) + 44 * Math.sin(u * 5 + 1) * u]; });
function s7Outro(c, tau) { const ot = tau - S7.O0, t = twos(tau), sd = 950 + tick(t, 8); setView(null); inkBg(c); if (ot < .1) return;
  const ex = CX, ey = 380, R = 150, open = sm(.2, 1.05, ot, easeInOutSine);
  scratch(c, S7CORD, { w: 4, seed: sd, taper: .08 });
  block(c, ellPts(ex, ey, R, R * .95, .2, 56), K.ink, { amp: R * .04, freq: 11, seed: sd + 1, streaks: 3, grain: .6 });
  outline(c, ellPts(ex, ey, R + 4, R * .95 + 4, .2, 60), { w: 3.2, color: K.paper, seed: sd + 2, dry: .15 });
  eyeLines(c, ex, ey, R * .56, { open, lid: 1, seed: sd + 3 });
  zh(c, JOKE_OUTRO, CX, 730, { size: 88, weight: 500, color: K.paper, align: 'center', p: writeP(ot, .45, JOKE_OUTRO, .045), seed: 960, tilt: .012, jitter: .012 });
  zh(c, '北交东方笑话集 发布', CX, 872, { size: 48, color: K.g1, align: 'center', p: writeP(ot, 1.0, '北交东方笑话集 发布', .03), seed: 961, tilt: .012, jitter: .012 });
  zh(c, '北京交通大学', CX, 944, { size: 44, color: K.g1, align: 'center', p: writeP(ot, 1.2, '北京交通大学', .03), seed: 962, tilt: .012, jitter: .012 }); }

scene({ order: 7, key: 'jokes', name: '北交东方笑话集', dur: S7.END, fn: (c, tau) => {
  if (tau < .12 || tau >= S7.OUT) handoffBlack(c);
  else if (tau < S7.C0) s7Contest(c, tau);
  else if (tau < S7.O0) s7Champion(c, tau);
  else s7Outro(c, tau);
} });
