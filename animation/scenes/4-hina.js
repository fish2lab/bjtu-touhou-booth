'use strict';
// 第 4 段 雏 祭（19.4 秒）：一张手工说明书，最后展开成一条河。
// 讲清楚来摊位能做什么：做一个雏人偶、写上祝福、摆上台领奖、放进河里流走。
// 颜色：红绿两色和纸 K.vermil / K.moss（现场材料就是这两色），其余只用墨、纸、三级灰；摊宣、吧唧、头像按原样放。
//
//   0–0.15      只画 handoffStream（第 3 段魔药流成的小溪线）
//   0.15–0.95   小溪线拉直、长出刻度，变成一把尺子，跳到桌边。俯拍的手工桌，和第 1 段开头的桌面呼应
//   1.0–2.6     材料一样样滑进来，手写小字标名字；展签「雏 祭」
//   3.0–7.5     说明书三步，定格动画式地一格格跳着做（每秒 6 格），右上角标 ①②③：
//               ① 剪刀剪出红色外衣，绿色内衬垫到下面   ② 铁丝做支架、点白乳胶、白卡纸剪出头
//               ③ 马克笔涂头发、在衣服上写祝福语（看不清的手写线）；展签换成「把祝福语写在人偶上」
//   7.5–8.33    做好的人偶在桌上跳两下，蹦出画面
//   8.33–14.0   摊位上的阶梯陈列台：刚才那个人偶先落到台上，接着各式手作人偶一个个摆上来（剪的、画的、歪的、太大的、只有一个头的）；
//               最高一层转台上转转玩偶在转（左下角署名 FUMO_CREDIT）；台边立着雏祭摊宣；右边一只手接过吧唧和决策币
//   14.0–15.0   镜头往下摇：陈列台的台阶接上河岸的石阶，下面是水墨小溪
//   15.0–19.0   纸船载着人偶、三个装头像的漂流瓶从左往右漂；岸边红缎带打着转，把人偶头上灰色的「厄」卷走；
//               字幕是摊宣原话「留下想说的话 雏人偶会把厄运带走吧——」，左下小字「把流雏顺河水漂走」；最后镜头拉远，河走远
//   19.0–19.25  墨色顺着水流从左往右漫过来，暗下去；最后 0.15 秒只画 handoffBlack，交给第 5 段
// 屏上文字全部抄自 docs/素材事实.md「雏祭」一节。

const S4 = {
  END: 19.4, IN: .15, WIPE: 19.0, BLACK: 19.25,
  STEP: [3.0, 4.5, 6.0], DONE: 7.5, STAND: 50 / 6, PAN0: 14.0, PAN1: 15.0, FAR0: 18.1,
  DOLL: [980, 770], DS: 2,                    // 桌上做的人偶：下摆中点、倍数
  RULER: { y: 640, x0: 600, x1: 1400, h: 62, restY: 986, restRot: -.02 },
  D: 1120, SX: 1040, GROUND: 1062,            // 镜头往下摇的距离、陈列台中线、台脚
  FUMO: { y: 356, h: 262, per: 2.5 },         // 转转玩偶：转台面 y、画面里的高、转一圈的秒数
  RX: 1660, RB: 2128, RT: 1852, TURNS: 3,     // 红缎带（河段的世界坐标）：轴 x、底 y、顶 y、圈数。站在右下的近岸上
  PULL: 1250, PULLD: .85, T0: 14.1,           // 人偶漂到 x = PULL 时头上的厄被卷走；卷走的秒数；漂流物位置的起算时刻
};
const S4TXT = {
  title: '雏 祭', write: '把祝福语写在人偶上', show: '放在摊位上展示', prize: '奖品：吧唧、决策币',
  l1: '留下想说的话', l2: '雏人偶会把厄运带走吧——', flow: '把流雏顺河水漂走',
};
const S4RED = { dk: mix(K.vermil, K.ink, .3), bb: mix(K.vermil, K.ink, .55), fb: mix(K.vermil, K.ink, .38), bf: mix(K.vermil, K.ink, .3) };
const s4F = tau => Math.floor(tau * 6 + 1e-6);     // 定格动画的格号：每秒 6 格
const s4Lw = s => 1.3 + 1.1 * s;                    // 线宽跟着倍数走
const s4Screen = (c, fn) => { c.save(); resetT(c); fn(); c.restore(); viewT(c); };   // 在屏幕坐标里画（字幕、署名）

// ===================== 手工材料 =====================
// s4Washi：一张和纸，毛边，几丝浅色纤维
function s4Washi(c, x, y, w, h, rot, col, seed) { const T = tf(x, y, 1, rot);
  block(c, M(T, rectPts(-w / 2, -h / 2, w, h)), col, { smooth: false, amp: 1.8, freq: 7, seed, grain: .8, anchor: [x, y] });
  const r = rng(seed * 3 + 1), fib = mix(col, K.paper, .32);
  for (let k = 0; k < 9; k++) { const u = (r() - .5) * w * .8, v = (r() - .5) * h * .8, a = r() * TAU, L = 16 + r() * 30;
    stroke(c, M(T, [[u, v], [u + Math.cos(a) * L / 2 + 3, v + Math.sin(a) * L / 2 - 2], [u + Math.cos(a) * L, v + Math.sin(a) * L]]), { w: 1.2, color: fib, al: .85, seed: seed + 10 + k, taper: .5 }); } }
// s4Card：一张白卡纸。hole = [u, v, r]：剪掉头以后留下的圆洞（露出桌面）
function s4Card(c, x, y, w, h, rot, seed, hole = null, cutP = 0) { const T = tf(x, y, 1, rot), pts = M(T, rectPts(-w / 2, -h / 2, w, h));
  block(c, pts, K.card, { smooth: false, amp: .8, seed, grain: .5 }); outline(c, pts, { w: 2.4, seed: seed + 1, smooth: false });
  if (!hole) return; const [hx, hy] = T(hole[0], hole[1]), ring = ellPts(hx, hy, hole[2], hole[2], 0, 30);
  if (cutP >= 1) { block(c, ring, K.paper, { amp: .8, seed: seed + 2, grain: 1, anchor: [0, 0] }); outline(c, ring, { w: 2, seed: seed + 3 }); }
  else if (cutP > 0) stroke(c, ring, { close: true, w: 2, p: cutP, seed: seed + 3, taper: 0 }); }
// s4Scissors：俯拍的剪刀。(x, y) 是轴钉，rot 是刀尖的朝向，open 张开的角度
function s4Scissors(c, x, y, rot, open, seed) {
  for (const d of [-1, 1]) { const a = rot + d * open / 2, T = tf(x, y, 1, a);
    const h = tf(...T(-60, d * 20), 1, a);
    outline(c, M(h, ellPts(0, 0, 34, 21, d * .3, 26)), { w: 9, color: K.ink, seed: seed + 5 + d, rough: .15 });
    stroke(c, M(T, [[-4, d * 4], [-34, d * 14]]), { w: 10, seed: seed + 7 + d, smooth: false, taper: 0 });
    block(c, M(T, [[-12, d * -6], [70, d * -5], [148, d * -1], [156, 0], [148, d * 3], [70, d * 8], [-12, d * 8]]), K.ink, { smooth: false, amp: .6, seed: seed + d, grain: .4 });
    scratch(c, M(T, [[16, d * .5], [84, d * 1], [138, d * .5]]), { w: 1.5, seed: seed + 3 + d, al: .75 }); }
  fillPts(c, ellPts(x, y, 5, 5, 0, 12), K.paper); }
// s4Glue：躺着的白乳胶瓶，尖嘴朝 rot 方向
function s4Glue(c, x, y, rot, seed) { const T = tf(x, y, 1, rot), body = M(T, [[-82, -30], [48, -30], [60, -20], [60, 20], [48, 30], [-82, 30], [-88, 20], [-88, -20]]);
  block(c, body, K.card, { smooth: false, amp: .8, seed, grain: .5 });
  block(c, M(T, rectPts(-58, -30, 62, 60)), K.g1, { smooth: false, amp: .6, seed: seed + 1, grain: .4 });   // 瓶身的标签，不写字
  outline(c, body, { w: 2.6, seed: seed + 2, smooth: false });
  block(c, M(T, [[60, -16], [100, -6], [118, -2], [118, 2], [100, 6], [60, 16]]), K.ink, { smooth: false, amp: .6, seed: seed + 3, grain: .4 }); }
// s4Coil：一卷铁丝，甩出一截线头
function s4Coil(c, x, y, seed) { for (let k = 0; k < 6; k++) stroke(c, ellPts(x + k * 3 - 8, y + k * 2 - 5, 58 - k * 1.5, 50 - k, .3, 40), { close: true, w: 2.2, color: K.g3, seed: seed + k, taper: 0, rough: .15 });
  stroke(c, [[x + 48, y + 22], [x + 80, y + 40], [x + 96, y + 34], [x + 114, y + 58]], { w: 2.4, color: K.g3, seed: seed + 9, taper: .2 }); }
// s4Pens：三支彩笔（笔帽红、绿、黑）
function s4Pens(c, x, y, rot, seed) { [K.vermil, K.moss, K.ink].forEach((col, k) => { const T = tf(x + (k - 1) * 8, y + (k - 1) * 32, 1, rot + (k - 1) * .04), body = M(T, rectPts(-112, -11, 172, 22));
  block(c, body, K.card, { smooth: false, amp: .6, seed: seed + k * 5, grain: .4 }); outline(c, body, { w: 2.2, seed: seed + k * 5 + 1, smooth: false });
  block(c, M(T, [[60, -13], [112, -13], [118, -7], [118, 7], [112, 13], [60, 13]]), col, { smooth: false, amp: .6, seed: seed + k * 5 + 2, grain: .5 });
  block(c, M(T, [[-112, -8], [-126, -3], [-130, 0], [-126, 3], [-112, 8]]), col, { smooth: false, amp: .4, seed: seed + k * 5 + 3, grain: .3 }); }); }
// s4Tape：一卷胶带，拉出来一截
function s4Tape(c, x, y, seed) { const outer = ellPts(x, y, 74, 70, 0, 44), inner = ellPts(x, y, 40, 38, 0, 32), tail = [[x + 66, y + 20], [x + 130, y + 42], [x + 124, y + 64], [x + 60, y + 42]];
  block(c, tail, K.g1, { smooth: false, amp: .8, seed: seed + 4, grain: .5 }); outline(c, tail, { w: 2, seed: seed + 5, smooth: false });
  block(c, outer, K.g1, { amp: 1, seed, grain: .6 }); outline(c, outer, { w: 2.6, seed: seed + 1 });
  for (const r of [60, 50]) stroke(c, ellPts(x, y, r, r * .95, 0, 36).slice(2, 26), { w: 1.2, color: K.g2, seed: seed + r, taper: .3, al: .8 });
  block(c, inner, K.paper, { amp: .8, seed: seed + 2, grain: 1, anchor: [0, 0] }); outline(c, inner, { w: 2.2, seed: seed + 3 }); }
// s4Marker：马克笔，(x, y) 是笔尖，rot 是笔杆朝向（从笔尖指向笔尾）
function s4Marker(c, x, y, rot, seed) { const T = tf(x, y, 1, rot);
  block(c, M(T, [[0, -3], [12, -9], [26, -14], [26, 14], [12, 9], [0, 3]]), K.ink, { smooth: false, amp: .4, seed, grain: .3 });
  block(c, M(T, [[26, -21], [196, -21], [206, -13], [206, 13], [196, 21], [26, 21]]), K.ink, { smooth: false, amp: .8, seed: seed + 1, grain: .4 });
  scratch(c, M(T, [[40, -9], [120, -11], [188, -10]]), { w: 2, seed: seed + 2, al: .8 }); scratch(c, M(T, [[112, -21], [112, 21]]), { w: 1.6, seed: seed + 3, al: .6, smooth: false }); }
// s4Ruler：尺子。(x0..x1) 底边，yb 底边的 y，hgt 宽，tp 刻度画出的进度
function s4Ruler(c, x0, x1, yb, hgt, rot, seed, tp = 1) { const L = x1 - x0, T = tf((x0 + x1) / 2, yb, 1, rot), body = M(T, rectPts(-L / 2, -hgt, L, hgt));
  block(c, body, K.card, { smooth: false, amp: .8, seed, grain: .5 }); outline(c, body, { w: 2.6, seed: seed + 1, smooth: false });
  const n = Math.floor(L / 20); for (let k = 1; k < n; k++) { if (k / n > tp) break; const u = -L / 2 + k * 20, h = (k % 5 ? 11 : 22) * hgt / 62;
    stroke(c, M(T, [[u, 0], [u, -h]]), { w: 1.8, seed: seed + k, smooth: false, taper: 0 }); } }

// 材料的位置：落点、从哪边滑进来、名字写在哪。t 是滑进来的时刻
const S4MAT = [
  { key: 'washi', t: 1.0, x: 330, y: 350, rot: -.08, from: [-320, 300], label: '红色 绿色和纸', lx: 196, ly: 526 },
  { key: 'scissors', t: 1.1, x: 1640, y: 840, rot: -2.45, from: [2250, 940], label: '剪刀', lx: 1690, ly: 1000 },
  { key: 'card', t: 1.4, x: 320, y: 740, rot: .06, from: [-320, 780], label: '白色卡纸', lx: 212, ly: 876 },
  { key: 'wire', t: 1.6, x: 1690, y: 590, rot: 0, from: [2250, 590], label: '铁丝', lx: 1650, ly: 714 },
  { key: 'glue', t: 1.8, x: 1650, y: 300, rot: -.3, from: [2250, 180], label: '白乳胶', lx: 1590, ly: 418 },
  { key: 'pens', t: 2.0, x: 930, y: 150, rot: .04, from: [930, -240], label: '彩笔', lx: 1090, ly: 170 },
  { key: 'tape', t: 2.2, x: 1330, y: 176, rot: 0, from: [1330, -240], label: '胶带', lx: 1292, ly: 306 },
  { key: 'marker', t: 2.4, x: 250, y: 986, rot: -.14, from: [-360, 1060], label: '马克笔', lx: 474, ly: 1000 },
];
function s4Mat(c, key, x, y, rot, sd, o = {}) {
  if (key === 'washi') { s4Washi(c, x + 40, y + 34, 250, 190, rot + .14, K.moss, 31 + sd); s4Washi(c, x, y, 250, 190, rot, K.vermil, 21 + sd); }
  else if (key === 'scissors') s4Scissors(c, x, y, rot, .16, 41 + sd);
  else if (key === 'card') s4Card(c, x, y, 240, 170, rot, 51 + sd, o.hole, o.cutP);
  else if (key === 'wire') s4Coil(c, x, y, 61 + sd);
  else if (key === 'glue') s4Glue(c, x, y, rot, 71 + sd);
  else if (key === 'pens') s4Pens(c, x, y, rot, 81 + sd);
  else if (key === 'tape') s4Tape(c, x, y, 91 + sd);
  else if (key === 'marker') s4Marker(c, x, y, rot, 101 + sd); }

// ===================== 雏人偶 =====================
// 局部坐标：原点是下摆中点，向上是负。外衣是和服的样子：V 字领、两只宽袖垂下来；内衬比外衣大一圈，下摆和袖口露出一道绿边
const S4ROBE = [[-14, -152], [14, -152], [40, -145], [66, -130], [72, -68], [42, -60], [50, 0], [-50, 0], [-42, -60], [-72, -68], [-66, -130], [-40, -145]];
const S4LINING = S4ROBE.map(([u, v]) => [u * 1.1, v < -140 ? v + 4 : v + 9]);
// 头发：雏人偶的齐刘海、两边直直垂到肩上（姬发式）
const S4HAIR = [[-26, -142], [-27, -182], [-20, -197], [-7, -203], [7, -203], [20, -197], [27, -182], [26, -142], [17, -142], [17, -179], [-17, -179], [-17, -142]];
const S4HEADV = -176, S4HEADR = 22;
// 铁丝支架：从头里伸下来，穿过衣服，底下盘成一圈当底座
const S4WIRE = (() => { const out = [[0, -178], [0, -100], [0, 4]]; for (let k = 0; k <= 26; k++) { const a = Math.PI / 2 + k / 26 * TAU * 1.3, r = 8 + k * 1.2; out.push([Math.cos(a) * r, 8 + Math.sin(a) * r * .22]); } return out; })();
// 祝福语：四行看不清的手写线（一串连笔的小圈），不写具体内容
const S4WISH = [[-30, 30, -98], [-34, 32, -74], [-36, 26, -50], [-38, 34, -26]];
function s4Wishes(c, T, p, seed, lw) { S4WISH.forEach(([a, b, v], k) => { const q = clamp(p * S4WISH.length - k, 0, 1); if (q <= 0) return; const pts = [];
  for (let j = 0; j <= 40; j++) { const f = j / 40, ph = f * 44 + k * 1.7, amp = .55 + .45 * Math.sin(f * 9 + k * 2); pts.push([lerp(a, b, f) - 3.2 * Math.cos(ph), v + 4.4 * Math.sin(ph) * amp - 2 * Math.sin(f * 5 + k)]); }
  stroke(c, M(T, pts), { w: lw * .7, color: K.ink, p: q, seed: seed + k, taper: .15, rough: .15 }); }); }
// s4ZigRing：剪得毛毛糙糙的轮廓（花边剪刀那样的锯齿）
function s4ZigRing(pts, amp, seed) { const q = densify(pts, 7, true); return q.map((p, k) => { const a = q[(k + q.length - 1) % q.length], b = q[(k + 1) % q.length], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, d = (k % 2 ? amp : -amp * .3) * (.6 + .8 * hash(k, seed));
  return [p[0] + ty / l * d, p[1] - tx / l * d]; }); }
// s4Head：白卡纸剪的头 + 马克笔涂的头发。hair 0..1 头发涂到哪（从上往下）
function s4Head(c, T, s, sd, hair = 1, o = {}) { const { du = 0, dv = 0, r = S4HEADR, square = false } = o, lw = s4Lw(s), V = (u, v) => T(u + du, v + dv);
  const face = square ? M(V, [[-20, -196], [21, -199], [23, -158], [-19, -154]]) : M(V, ellPts(0, S4HEADV, r, r * 1.04, 0, 30));
  block(c, face, K.card, { smooth: !square, amp: .6, seed: sd, grain: .3 }); outline(c, face, { w: lw * .9, seed: sd + 1, smooth: !square });
  if (hair <= 0) return; const hp = M(V, S4HAIR.map(([u, v]) => [u * r / S4HEADR, S4HEADV + (v - S4HEADV) * r / S4HEADR]));
  if (hair >= 1) { block(c, hp, K.ink, { smooth: false, amp: .7, seed: sd + 2, grain: .4 }); return; }
  const [, yTop] = V(0, S4HEADV - r * 1.2), [, yBot] = V(0, -142); c.save(); c.beginPath(); c.rect(-1e4, yTop - 20, 2e4, (yBot - yTop + 20) * hair + 20); c.clip(); block(c, hp, K.ink, { smooth: false, amp: .7, seed: sd + 2, grain: .4 }); c.restore(); }
// s4Doll：一个手作雏人偶。(x, y) 下摆中点，s 倍数。kind 是样子：
//   neat 规规矩矩的（红外衣、绿内衬、白卡纸头、铁丝底座）  inv 红绿反过来  cut 剪得毛糙、头是方的  drawn 在白卡纸上用彩笔画的
//   wire 只做了铁丝支架和头，忘了穿衣服  head 只有一个头  twins 一件衣服两个头  tape 胶带缠得太多  tilt 歪的（配 rot）
//   parts 控制各部件（桌上一步步做时用）：{ wire, lining, robe, head, hair, wishes, glue }
function s4Doll(c, x, y, s, o = {}) { const { rot = 0, seed = 1, kind = 'neat', parts = null } = o, T = tf(x, y, s, rot), lw = s4Lw(s), sd = seed;
  const P = { wire: 1, lining: 1, robe: 1, head: 1, hair: 1, wishes: 1, glue: 0, ...(parts || {}) };
  let red = K.vermil, green = K.moss; if (kind === 'inv') [red, green] = [green, red];
  if (kind === 'head') { stroke(c, M(T, [[0, 0], [0, -40], [-4, -60]]), { w: lw * .9, color: K.g3, seed: sd + 1, taper: .1 }); s4Head(c, T, s, sd + 40, 1, { dv: 118 }); return; }
  if (kind === 'drawn') { const card = M(T, [[-66, 4], [66, 4], [64, -214], [-64, -212]]); block(c, card, K.card, { smooth: false, amp: .6, seed: sd, grain: .4 }); outline(c, card, { w: lw * .9, seed: sd + 1, smooth: false });
    outline(c, M(T, S4ROBE.map(([u, v]) => [u * .82, v * .82 - 12])), { w: lw * 1.1, color: K.vermil, seed: sd + 2, smooth: false, dry: .15 });
    stroke(c, M(T, [[-12, -136], [0, -100], [12, -136]]), { w: lw * 1.1, color: K.moss, seed: sd + 3, smooth: false });
    outline(c, M(T, ellPts(0, -160, 18, 19, 0, 24)), { w: lw * .9, seed: sd + 4 });
    stroke(c, M(T, [[-20, -140], [-18, -170], [-8, -181], [8, -181], [18, -170], [20, -140], [14, -150], [14, -168], [-14, -168], [-14, -150]]), { w: lw * 1.3, seed: sd + 5, smooth: false, taper: .1 });
    for (let k = 0; k < 3; k++) stroke(c, M(T, [[-24 + k * 5, -70 + k * 14], [-6 + k * 5, -74 + k * 14], [10 + k * 5, -70 + k * 14]]), { w: lw * .8, color: K.moss, seed: sd + 6 + k }); return; }
  if (P.wire > 0) { const wp = kind === 'wire' ? [[0, -178], [0, -60], [0, 4], ...S4WIRE.slice(3)] : S4WIRE; stroke(c, M(T, wp), { w: lw * (s > 1.5 ? 1.3 : .85), color: K.g3, seed: sd + 1, p: P.wire, taper: .05, rough: .15 }); }
  if (kind === 'wire') { stroke(c, M(T, [[-52, -96], [-24, -128], [0, -134], [24, -128], [50, -92]]), { w: lw * .85, color: K.g3, seed: sd + 2, taper: .05 });
    stroke(c, M(T, [[0, -60], [-26, -4]]), { w: lw * .85, color: K.g3, seed: sd + 3, taper: .05 }); stroke(c, M(T, [[0, -60], [24, -2]]), { w: lw * .85, color: K.g3, seed: sd + 4, taper: .05 });
    s4Head(c, T, s, sd + 40); return; }
  const twin = kind === 'twins', RB = twin ? S4ROBE.map(([u, v]) => [u * 1.25, v]) : S4ROBE, LN = twin ? S4LINING.map(([u, v]) => [u * 1.25, v]) : S4LINING;
  if (P.lining > 0 && kind !== 'cut') { block(c, M(T, LN), green, { smooth: false, amp: .8, seed: sd + 5, grain: .6 }); outline(c, M(T, LN), { w: lw * .8, seed: sd + 6, smooth: false }); }
  if (P.robe > 0) { const rp = kind === 'cut' ? s4ZigRing(RB, 5, sd) : RB; block(c, M(T, rp), red, { smooth: false, amp: kind === 'cut' ? .3 : .8, seed: sd + 7, grain: .6 });
    if (kind !== 'cut') { block(c, M(T, [[-14, -152], [14, -152], [0, -106]]), green, { smooth: false, amp: .5, seed: sd + 8, grain: .4 }); stroke(c, M(T, [[-14, -152], [0, -106], [14, -152]]), { w: lw * .7, seed: sd + 9, smooth: false }); }
    outline(c, M(T, rp), { w: lw * .9, seed: sd + 10, smooth: false }); stroke(c, M(T, [[-42, -60], [-44, -118]]), { w: lw * .6, seed: sd + 11, al: .7 }); stroke(c, M(T, [[42, -60], [44, -118]]), { w: lw * .6, seed: sd + 12, al: .7 }); }
  if (P.wishes > 0) s4Wishes(c, T, P.wishes, sd + 20, lw);
  if (kind === 'tape') for (let k = 0; k < 4; k++) { const v = -128 + k * 34, a = (k % 2 ? .22 : -.18), tp = M(tf(...T(0, v), s, rot + a), rectPts(-70, -8, 140, 16)); block(c, tp, K.g1, { smooth: false, amp: .5, seed: sd + 30 + k, grain: .5, al: .92 }); outline(c, tp, { w: lw * .6, seed: sd + 34 + k, smooth: false }); }
  if (P.glue > 0) block(c, M(T, ellPts(2, -158, 9, 7, .3, 14)), K.card, { amp: 1.2, seed: sd + 38, grain: .2 });
  if (P.head > 0) { if (twin) { s4Head(c, T, s, sd + 40, P.hair, { du: -19, r: 19 }); s4Head(c, T, s, sd + 44, P.hair, { du: 19, r: 19 }); }
    else s4Head(c, T, s, sd + 40, P.hair, { square: kind === 'cut' }); } }

// ===================== 镜头 A、B：手工桌 =====================
// 尺子：小溪线拉直、收短，长出尺身和刻度，再跳到桌子下边
function s4RulerNow(c, tau, sd) { const t = twos(tau), R = S4.RULER, a = sm(S4.IN, .55, t, easeInOutSine), grow = sm(.5, .72, t, easeOutBack), drop = sm(.8, .95, t, easeOutQuint);
  if (t < .5) { const pts = STREAM.map(([x, y], k) => [lerp(x, lerp(R.x0, R.x1, k / (STREAM.length - 1)), a), lerp(y, R.y, a)]); stroke(c, pts, { w: 10, color: K.g3, seed: 5, taper: 0, rough: .25 }); return; }
  const y = lerp(R.y, R.restY, drop), rot = lerp(0, R.restRot, drop);
  s4Ruler(c, R.x0, R.x1, y, R.h * grow, rot, 111 + sd, sm(.55, .8, t));
  if (drop <= 0) stroke(c, [[R.x0, R.y], [R.x1, R.y]], { w: lerp(10, 2.6, grow), color: K.g3, seed: 5, taper: 0, rough: .25, al: 1 - grow * .7 }); }
// 右上角的步骤号：手画的圈 + 数字
function s4No(c, n, tau, t0, sd) { const k = sm(t0, t0 + .12, twos(tau), easeOutBack); if (k <= 0) return; const x = 1790, y = 112;
  pop(c, x, y, k, () => { outline(c, ellPts(x, y, 50, 48, .2, 36), { w: 4.2, seed: 131 + n + sd, rough: .3 }); zh(c, String(n), x, y + 24, { size: 70, weight: 500, align: 'center', seed: 5 + n, tilt: .01, jitter: 0 }); }); }
// 桌上做人偶的三步。f 是定格动画的格号（每秒 6 格）：18 = 3.0 秒
const S4SHEET = { x: 980, y: 616, w: 330, h: 360, rot: .03 };
function s4Make(c, tau, sd) { const f = s4F(tau), t = twos(tau), [ox, oy] = S4.DOLL, s = S4.DS, T = tf(ox, oy, s), lw = s4Lw(s), home = m => S4MAT.find(q => q.key === m);
  const robeOn = f >= 24, liningOn = f >= 26, parts = { wire: f >= 29 ? 1 : 0, lining: liningOn ? 1 : 0, robe: robeOn ? 1 : 0, head: f >= 33 ? 1 : 0, hair: f >= 38 ? 1 : f >= 37 ? .5 : 0,
    wishes: clamp((t - 6.5) / .8, 0, 1), glue: f >= 31 ? 1 : 0 };
  // ② 铁丝：先是一截直的（线圈旁边），再弯成支架的样子，最后贴到人偶背后
  if (f === 27) stroke(c, [[1580, 540], [1480, 470], [1360, 400]], { w: lw * 1.3, color: K.g3, seed: 150 + sd, taper: .05 });
  if (f === 28) stroke(c, M(tf(1270, 720, s * .9, -.35), S4WIRE), { w: lw * 1.3, color: K.g3, seed: 151 + sd, taper: .05 });
  // ① 红纸：滑到桌子中间；剪刀沿外衣的轮廓剪；剩下的纸框跳开
  if (f >= 18 && f < 26) { const k = f === 18 ? .5 : 1, w0 = home('washi'), sx = lerp(w0.x, S4SHEET.x, k), sy = lerp(w0.y, S4SHEET.y, k), rot = lerp(w0.rot, S4SHEET.rot, k);
    if (f < 24) { s4Washi(c, sx, sy, S4SHEET.w, S4SHEET.h, rot, K.vermil, 160 + sd);
      // 说明书式的剪切虚线：沿外衣轮廓一段段的浅色短划
      if (f >= 19) { const ring = densify(M(T, S4ROBE), 3, true); let acc = 0, seg = []; for (let j = 1; j <= ring.length; j++) { const a = ring[j - 1], b = ring[j % ring.length]; acc += Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (acc % 26 < 15) seg.push(b); else if (seg.length) { if (seg.length > 1) stroke(c, seg, { w: 3.2, color: K.card, seed: 165 + j, taper: .2, smooth: false, al: .9 }); seg = []; } }
        if (seg.length > 1) stroke(c, seg, { w: 3.2, color: K.card, seed: 166, taper: .2, smooth: false, al: .9 }); } }
    else { const far = f === 25, Tw = tf(S4SHEET.x - (far ? 520 : 260), S4SHEET.y - (far ? 60 : 120), 1, far ? -1.1 : -.5), frame = new Path2D(); frame.addPath(polyPath(rough(M(Tw, rectPts(-S4SHEET.w / 2, -S4SHEET.h / 2, S4SHEET.w, S4SHEET.h)), { amp: 1.8, seed: 161 + sd, smooth: false })));
      frame.addPath(polyPath(M(Tw, S4ROBE.map(([u, v]) => [(u) * s, (v + 76) * s])).reverse())); c.save(); c.fillStyle = K.vermil; c.fill(frame, 'evenodd'); texture(c, frame, 'ink', .6); c.restore(); } }
  // 绿内衬：先剪好了放在一边（定格动画跳过了剪的过程），下一格垫到外衣下面
  if (f === 25) s4Doll(c, 1300, 640, s * .9, { rot: .25, seed: 170, parts: { wire: 0, robe: 0, head: 0, wishes: 0, lining: 1 } });
  // 人偶本体（外衣剪出来以后）
  const lift = f === 26 ? 1.05 : 1;
  if (robeOn || parts.wire) pop(c, ox, oy - 76 * s, lift, () => s4Doll(c, ox, oy, s, { seed: 180 + sd % 5, parts }));
  // 剪的时候：轮廓上的剪口一格格往前走，剪刀跟着
  if (f >= 19 && f < 24) { const ring = M(T, S4ROBE), path = [...ring, ring[0]], cp = (f - 19) / 4; if (cp > 0) stroke(c, path, { w: 3.6, p: cp, seed: 190 + sd, taper: 0, smooth: false });
    const at = pathAt(path, cp); s4Scissors(c, at.x - Math.cos(at.a) * 150, at.y - Math.sin(at.a) * 150, at.a, f % 2 ? .08 : .42, 200 + sd); }
  // ② 白乳胶：跳到脖子旁边挤一点，再跳回去
  if (f === 30) s4Glue(c, ox + 150, oy - 152 * s - 60, 2.76, 210 + sd);
  // ② 头：卡纸上先剪出一个圈，下一格头飞在半空，再下一格落到脖子上
  if (f === 32) { const [hx, hy] = T(0, S4HEADV); s4Head(c, tf(lerp(330, hx, .55), lerp(740, hy, .55) - 120 - S4HEADV * s * 1.15, s * 1.15), s * 1.15, 220, 0); }
  // ③ 马克笔：先到头上涂头发，再到衣服上写祝福语
  if (f >= 36 && f < 39) { const [hx, hy] = T(10, -190 + (f - 36) * 16); s4Marker(c, hx, hy, -.75, 230 + sd); }
  if (f >= 39 && f < 44) { const p = parts.wishes, k = Math.min(S4WISH.length - 1, Math.floor(p * S4WISH.length)), [a, b, v] = S4WISH[k], u = clamp(p * S4WISH.length - k, 0, 1), [mx, my] = T(lerp(a, b, u), v);
    s4Marker(c, mx, my, -.8 + .06 * Math.sin(t * 20), 240 + sd); } }
// 桌面（镜头 A 和 B）。材料在四周，人偶在中间做
function s4Table(c, tau) { const t = twos(tau), f = s4F(tau), sd = tick(t); setView(null); paperBg(c);
  // 桌上一圈茶杯印：和第 1 段开头的桌面同一个位置，同一张桌子
  if (tau >= .8) { stroke(c, ellPts(1650, 860, 96, 93, 0, 60), { close: true, w: 8, dry: .55, seed: 21, al: .6, taper: 0 }); stroke(c, ellPts(1656, 856, 89, 86, 0, 60).slice(8, 40), { w: 3, dry: .5, seed: 22, al: .4 }); }
  s4RulerNow(c, tau, sd);
  if (tau >= .9) zh(c, '尺子', 1430, 990, { size: 34, color: K.g3, p: writeP(t, 1.0, '尺子', .05), seed: 9, tilt: .01, jitter: .01, al: tau < S4.STEP[2] ? 1 : 0 });
  const away = { scissors: f >= 19 && f < 24, glue: f === 30, marker: f >= 36 && f < 44 };
  for (const m of S4MAT) { if (away[m.key]) continue; const u = sm(m.t, m.t + .25, t, easeOutQuint); if (u <= 0) continue;
    s4Mat(c, m.key, lerp(m.from[0], m.x, u), lerp(m.from[1], m.y, u), m.rot, sd, m.key === 'card' ? { hole: [8, -6, S4HEADR * S4.DS], cutP: f >= 32 ? 1 : f === 31 ? 1 - 1e-3 : 0 } : {});
    if (tau < S4.STEP[2]) zh(c, m.label, m.lx, m.ly, { size: 34, color: K.g3, p: writeP(t, m.t + .15, m.label, .05), seed: 11 + m.t * 10, tilt: .01, jitter: .01 }); }
  if (tau >= S4.STEP[0]) {
    // 做好以后：跳两下，蹦出画面（f 45–49）
    if (f >= 45) { const [ox, oy] = S4.DOLL, s = S4.DS, k = [1.12, 1, 1.12, 1.5, 2.3][f - 45] || 0, dy = [-10, 0, -10, -240, -800][f - 45] || 0;
      // 跳起来时桌上留一块外衣形状的淡影子；最后一格蹦出画面，影子也没了
      if (k > 1 && f < 49) block(c, M(tf(ox + 16 * k, oy + 14 * k, s), S4ROBE), K.g1, { smooth: false, amp: 1, seed: 250, grain: .4, al: .55 });
      if (k > 0) pop(c, ox, oy - 76 * s, k, () => s4Doll(c, ox, oy + dy, s, { seed: 180 + sd % 5 })); }
    else s4Make(c, tau, sd);
    const n = tau < S4.STEP[1] ? 1 : tau < S4.STEP[2] ? 2 : 3; if (tau < S4.DONE) s4No(c, n, tau, S4.STEP[n - 1], sd); } }

// ===================== 镜头 C：阶梯陈列台 =====================
// 五层台阶（最上一层是转台）：台面 y、半宽。台面铺一条红毡，台身是木刻的墨块
const S4TIER = [{ y: 372, hw: 150 }, { y: 505, hw: 250 }, { y: 638, hw: 345 }, { y: 771, hw: 430 }, { y: 904, hw: 505 }];
// 台上的手作人偶：层、x、样子、倍数、摆上来的时刻。第一个是桌上刚做好的那个
const S4SHELF = [
  { k: 1, x: 930, kind: 'neat', s: .8, t: 8.4, seed: 180, first: true },
  { k: 2, x: 820, kind: 'drawn', s: .78, t: 8.75, seed: 300 },
  { k: 3, x: 700, kind: 'cut', s: .8, t: 9.05, seed: 310 },
  { k: 1, x: 1150, kind: 'inv', s: .78, t: 9.35, seed: 320 },
  { k: 2, x: 1265, kind: 'wire', s: .78, t: 9.65, seed: 330 },
  { k: 3, x: 1110, kind: 'twins', s: .78, t: 9.95, seed: 340 },
  { k: 4, x: 800, kind: 'neat', s: .82, t: 10.25, seed: 350 },
  { k: 3, x: 905, kind: 'tilt', s: .8, t: 10.55, seed: 360, rot: .42 },
  { k: 2, x: 1040, kind: 'tape', s: .78, t: 10.85, seed: 370 },
  { k: 4, x: 1440, kind: 'neat', s: .38, t: 11.15, seed: 380 },
  { k: 3, x: 1340, kind: 'cut', s: .78, t: 11.45, seed: 390 },
  { k: 4, x: 1140, kind: 'neat', s: 1.62, t: 11.8, seed: 400, big: true },
  { k: 4, x: 630, kind: 'head', s: .8, t: 12.3, seed: 410 },
];
function s4Tiers(c, sd) { const x = S4.SX;
  // 屏风：最上层后面四扇折起来的屏风（照雏坛的样子）
  for (let j = 0; j < 4; j++) { const x0 = x - 196 + j * 98, pts = [[x0, 170 + (j % 2) * 8], [x0 + 98, 170 + ((j + 1) % 2) * 8], [x0 + 98, 380], [x0, 380]];
    block(c, pts, j % 2 ? K.paper2 : K.g1, { smooth: false, amp: .8, seed: 690 + j + sd, grain: .6 }); outline(c, pts, { w: 2.6, seed: 695 + j + sd, smooth: false }); }
  S4TIER.forEach((tr, k) => { const x0 = x - tr.hw, x1 = x + tr.hw, y = tr.y;
    block(c, [[x0, y + 16], [x1, y + 16], [x1, S4.GROUND + 14], [x0, S4.GROUND + 14]], K.ink, { smooth: false, amp: 1.2, seed: 700 + k + sd, grain: .6 });
    block(c, [[x0 + 14, y - 4], [x1 - 14, y - 4], [x1 + 3, y + 18], [x0 - 3, y + 18]], K.vermil, { smooth: false, amp: 1, seed: 710 + k + sd, grain: .6 });
    stroke(c, [[x0 - 3, y + 18], [x1 + 3, y + 18]], { w: 2.4, seed: 715 + k + sd, smooth: false, taper: 0 });
    // 台身上的木纹：几道断续的白色刮痕（木刻刀留下的）
    const yb = k < 4 ? S4TIER[k + 1].y - 4 : S4.GROUND, r = rng(725 + k);
    scratch(c, [[x0 + 10, y + 30], [x1 - 10, y + 30]], { w: 2, seed: 720 + k + sd, al: .6, dry: .35 });
    for (let j = 0; j < 4; j++) { const v = lerp(y + 48, yb - 12, (j + r()) / 4), a = x0 + 20 + r() * tr.hw * .6, b = x1 - 20 - r() * tr.hw * .6;
      scratch(c, [[a, v], [lerp(a, b, .5), v + (r() - .5) * 6], [b, v + (r() - .5) * 4]], { w: 1.3, seed: 726 + k * 7 + j + sd, al: .38, dry: .55, taper: .5 }); } }); }
// s4Turntable：转台。(x, y) 台面中心，ang 转角：侧面的白刻痕跟着转
function s4Turntable(c, x, y, ang, sd) { const rx = 132, ry = 21, th = 15;
  block(c, [[x - 70, y + th - 2], [x + 70, y + th - 2], [x + 78, y + th + 16], [x - 78, y + th + 16]], K.ink, { smooth: false, amp: .8, seed: 730 + sd, grain: .5 });
  const side = []; for (let j = 0; j <= 20; j++) { const a = j / 20 * Math.PI; side.push([x + rx * Math.cos(a), y + ry * Math.sin(a) + th]); } for (let j = 20; j >= 0; j--) { const a = j / 20 * Math.PI; side.push([x + rx * Math.cos(a), y + ry * Math.sin(a)]); }
  block(c, side, K.g3, { smooth: false, amp: .6, seed: 731 + sd, grain: .5 });
  for (let j = 0; j < 14; j++) { const a = ang + j / 14 * TAU; if (Math.sin(a) < .12) continue; const px = x + rx * Math.cos(a), py = y + ry * Math.sin(a); scratch(c, [[px, py + 3], [px, py + th - 2]], { w: 2.4, seed: 735 + j, smooth: false, al: .85 }); }
  const top = ellPts(x, y, rx, ry, 0, 48); block(c, top, K.g1, { amp: .6, seed: 732 + sd, grain: .5 }); outline(c, top, { w: 2.6, seed: 733 + sd });
  for (let j = 0; j < 3; j++) { const a0 = ang * 1 + j * TAU / 3, pts = []; for (let i = 0; i <= 8; i++) { const a = a0 + i / 8 * .9; pts.push([x + rx * .8 * Math.cos(a), y + ry * .8 * Math.sin(a)]); } stroke(c, pts, { w: 1.8, color: K.g2, seed: 736 + j, taper: .5 }); } }
// s4Flyer：台边画架上立着新版雏祭摊宣（原样放，外面一圈墨线）
function s4Flyer(c, sd) { const x = 96, y = 232, w = 420, h = Math.round(w * PHOTOS.hinaFlyer.h / PHOTOS.hinaFlyer.w);
  // 画架站得比陈列台靠后一点，脚落在 996，给左下角的署名让出位置
  stroke(c, [[x + 70, y + 20], [x + 24, 996]], { w: 13, seed: 760 + sd, taper: 0, rough: .15, smooth: false }); stroke(c, [[x + w - 70, y + 20], [x + w - 24, 996]], { w: 13, seed: 761 + sd, taper: 0, rough: .15, smooth: false });
  stroke(c, [[x + w / 2, y - 30], [x + w / 2, y + 10]], { w: 11, seed: 762 + sd, taper: 0, smooth: false });
  img(c, 'hinaFlyer', x, y, w, h); outline(c, rectPts(x - 2, y - 2, w + 4, h + 4), { w: 3.2, seed: 763 + sd, smooth: false, rough: .3 });
  block(c, rectPts(x - 18, y + h, w + 36, 20), K.ink, { smooth: false, amp: 1, seed: 764 + sd, grain: .5 }); }
// s4Hand：木刻剪影的一只手，手心朝上，从右边伸进来。(x, y) 是手心中间，手指朝左
const S4HANDP = [[120, -24], [80, -14], [62, -16], [48, -34], [36, -56], [26, -70], [15, -70], [11, -60], [18, -40], [24, -16], [0, -8], [-50, -10], [-92, -14], [-116, -28], [-128, -31], [-135, -22], [-131, -7], [-112, 6], [-70, 16], [-20, 22], [40, 26], [120, 24]];
function s4Hand(c, x, y, sd, s = 1.2) { const T = tf(x, y, s);
  block(c, M(T, [[112, -40], [460, -46], [460, 50], [112, 42]]), K.ink, { smooth: false, amp: 1.2, seed: 770 + sd, grain: .5 });
  block(c, M(T, S4HANDP), K.ink, { smooth: false, amp: .9, seed: 771 + sd, grain: .5 });
  scratch(c, M(T, [[118, -38], [124, 0], [118, 40]]), { w: 3.2, seed: 772 + sd });                // 袖口
  scratch(c, M(T, [[140, -26], [300, -30], [440, -26]]), { w: 1.6, seed: 778 + sd, al: .5, dry: .4 });
  for (let k = 0; k < 3; k++) scratch(c, M(T, [[-126 + k * 3, -16 + k * 8], [-96, -6 + k * 7], [-62, -1 + k * 6]]), { w: 1.8, seed: 773 + k + sd, al: .85, taper: .6 });   // 指缝
  scratch(c, M(T, [[20, -56], [26, -34], [30, -18]]), { w: 1.8, seed: 777 + sd, al: .85 }); }                                // 拇指
// 决策币：画成一枚硬币，不写字。spin 翻转的角度（落稳后 0）
function s4Coin(c, x, y, r, spin, sd) { const k = Math.max(.08, Math.abs(Math.cos(spin))), rim = ellPts(x, y, r * k, r, 0, 36);
  block(c, rim, K.g1, { amp: .5, seed: 780 + sd, grain: .5 }); outline(c, rim, { w: 3, seed: 781 + sd });
  if (k > .3) { outline(c, ellPts(x, y, r * .74 * k, r * .74, 0, 30), { w: 1.6, seed: 782 + sd, color: K.g3 }); block(c, starPts(x, y, r * .36, 0, 5, .45).map(([u, v]) => [x + (u - x) * k, v]), K.g2, { smooth: false, amp: .3, seed: 783 + sd, grain: .3 }); } }
// 奖品：手伸进来，吧唧和决策币一格格落到手心
function s4Prize(c, tau, sd) { const t = twos(tau), hx = 1690, hy = 610, inn = sm(10.35, 10.6, t, easeOutQuint); if (inn <= 0) return;
  const x = lerp(2340, hx, inn), bob = 2 * Math.sin(t * 3);
  s4Hand(c, x, hy + bob, sd);
  const drop = (t0, yEnd) => { const u = t - t0; if (u < 0) return null; if (u < 1 / 12) return yEnd - 300; if (u < 2 / 12) return yEnd - 110; return yEnd + settle(t, t0 + 2 / 12, { amp: -8, freq: 3, decay: 7 }); };
  const by = drop(10.65, hy - 70 + bob); if (by !== null) { const r = 60, bx = x - 104; img(c, 'badgeYes', bx - r, by - r, r * 2, r * 2); outline(c, ellPts(bx, by, r + 1, r + 1, 0, 40), { w: 2.6, seed: 790 + sd, color: K.ink }); }
  const cy = drop(10.95, hy - 52 + bob); if (cy !== null) s4Coin(c, x - 18, cy, 42, Math.max(0, 11.2 - t) * 16, sd);
  zh(c, S4TXT.prize, 1884, 404, { size: 58, weight: 500, align: 'right', p: writeP(t, 10.7, S4TXT.prize, .045), seed: 23, tilt: .01, jitter: .01 }); }
// 台上的人偶：落下来的两格（先悬在上面、再压扁一下），太大的那个落下时整个台子震一下，旁边的人偶往外歪
function s4Shelf(c, tau, sd) { const t = twos(tau), bigT = S4SHELF.find(d => d.big).t;
  for (const d of S4SHELF) { const u = t - d.t; if (u < 0) continue; const y = S4TIER[d.k].y + 10;
    let dy = 0, sx = 1, sy = 1; if (d.first && u < 2 / 12) dy = u < 1 / 12 ? -700 : -260; else if (u < 1 / 12) { dy = -48; sx = .94; sy = 1.08; } else if (u < 2 / 12) { sx = 1.08; sy = .9; }
    const jolt = d.big ? 0 : settle(t, bigT + 1 / 12, { amp: .16, freq: 2.2, decay: 5 }) * Math.sign(d.x - 1140) * (d.k >= 3 ? 1 : .3);
    pop(c, d.x, y, sx, () => s4Doll(c, d.x, y + dy, d.s, { kind: d.kind === 'tilt' ? 'neat' : d.kind, seed: d.seed + (d.first ? 0 : sd % 7), rot: (d.rot || 0) + jolt }), sy); } }

// ===================== 镜头 D、E：河岸与水墨小溪（和陈列台在同一张纸上，往下摇） =====================
const S4STONE = [{ y: 1060, hw: 760 }, { y: 1150, hw: 1150 }, { y: 1236, hw: 1600 }];
const S4WT = x => 1322 + 6 * Math.sin(x / 260 + 1) + 3 * Math.sin(x / 83);    // 远岸水线（石阶脚下）
const S4WB = x => 2024 + 10 * Math.sin(x / 300 + 2) + 5 * Math.sin(x / 97);   // 近岸水线
function s4Stones(c, sd) { S4STONE.forEach((st, k) => { const x0 = S4.SX - st.hw, x1 = S4.SX + st.hw, yb = k < 2 ? S4STONE[k + 1].y + 18 : 1340;
  const face = block(c, [[x0, st.y + 16], [x1, st.y + 16], [x1, yb], [x0, yb]], K.g1, { smooth: false, amp: 1.2, seed: 740 + k + sd, grain: .8 }); texture(c, face, 'lines', .8);
  block(c, [[x0 + 16, st.y - 2], [x1 - 16, st.y - 2], [x1, st.y + 18], [x0, st.y + 18]], K.paper2, { smooth: false, amp: 1, seed: 750 + k + sd, grain: .6 });
  stroke(c, [[x0, st.y + 18], [x1, st.y + 18]], { w: 3, seed: 755 + k + sd, smooth: false, taper: 0 });
  const r = rng(760 + k); for (let x = x0 + 40 + r() * 80; x < x1 - 30; x += 110 + r() * 90) stroke(c, [[x, st.y + 22], [x + 3, yb - 6]], { w: 2, color: K.g2, seed: 770 + k + Math.round(x), smooth: false, al: .8, taper: .2 }); }); }
// 水：一层淡墨打底，远岸下一道影子，几条更淡的长墨带，一层细横线，再是几十道横向刷痕顺水往右流。字幕那一片（左上）刷痕少
const S4BANDS = [[.3, 0, 820, 20, 110], [.52, 900, 1000, 26, 140], [.74, 300, 700, 16, 95], [.4, 1500, 900, 14, 125], [.88, 1900, 600, 12, 160]];
const S4STREAKS = (() => { const r = rng(404), out = []; for (let k = 0; k < 60; k++) { const top = k < 8, v = top ? .02 + r() * .22 : .3 + r() * .68;
  out.push({ v, x0: r() * 3200, len: 70 + r() * 320, w: 1.6 + r() * 5, col: r() < .62 ? K.g2 : K.g3, al: (top ? .25 : .3) + r() * .4, sp: 150 + 230 * r(), dry: .25 + r() * .4, k }); } return out; })();
function s4Water(c, t) { const xs = []; for (let x = -400; x <= 2320; x += 40) xs.push(x); const sd = tick(t);
  const top = xs.map(x => [x, S4WT(x)]), bot = xs.map(x => [x, S4WB(x)]).reverse();
  const path = block(c, [...top, ...bot], K.g1, { al: .62, amp: 1.5, grain: .5, seed: 401, smooth: false });
  c.save(); c.clip(path); texture(c, null, 'lines', .9);
  fillPts(c, [...top, ...xs.map(x => [x, S4WT(x) + 20 + 6 * Math.sin(x / 70)]).reverse()], K.g2, .35);
  for (const [v, x0, len, h, sp] of S4BANDS) { const xa = ((x0 + sp * t) % 3400) - 700, n = 16, up = [], dn = [];
    for (let j = 0; j <= n; j++) { const f = j / n, x = xa + f * len, y = lerp(S4WT(x), S4WB(x), v), hh = h * Math.sin(Math.PI * f); up.push([x, y - hh / 2]); dn.push([x, y + hh / 2]); }
    fillPts(c, [...up, ...dn.reverse()], K.g2, .2); }
  for (const s of S4STREAKS) { const xa = ((s.x0 + s.sp * t) % 3200) - 600, pts = []; if (s.v < .28 && xa < 1000) continue;
    for (let j = 0; j <= 4; j++) { const x = xa + j / 4 * s.len; pts.push([x, lerp(S4WT(x), S4WB(x), s.v) + 2.5 * Math.sin(x / 40 + s.k)]); }
    stroke(c, pts, { w: s.w, color: s.col, al: s.al, dry: s.dry, taper: .45, seed: s.k * 7 + 3 + sd }); }
  c.restore(); }
// 近岸：灰墨的土坡，岸边一排墨线草；左下角几片木刻的长草叶
const S4NEARTUFTS = (() => { const r = rng(88), out = []; for (let x = -300; x < 2250; x += 26 + r() * 44) out.push({ x, n: 2 + (r() * 4 | 0), h: 16 + r() * 34, k: out.length }); return out; })();
function s4NearBank(c, t) { const sd = tick(t), xs = []; for (let x = -400; x <= 2320; x += 40) xs.push(x); const top = xs.map(x => [x, S4WB(x)]);
  block(c, [...top, [2320, 2600], [-400, 2600]], K.g2, { al: .55, amp: 1.5, grain: .9, seed: 501, smooth: false });
  for (let k = 0; k < 9; k++) { if (k === 1) continue; const x = -120 + k * 270 + 60 * Math.sin(k * 3), y = S4WB(x) + 50 + (k % 3) * 38; stroke(c, [[x, y], [x + 160, y + 4], [x + 260, y - 2]], { w: 3, color: K.g3, dry: .5, al: .7, seed: 510 + k + sd, taper: .5 }); }
  stroke(c, top, { w: 6, color: K.ink, dry: .15, taper: 0, seed: 520 + sd });
  for (const q of S4NEARTUFTS) { const y = S4WB(q.x) + 2; for (let j = 0; j < q.n; j++) { const a = -Math.PI / 2 + (j - (q.n - 1) / 2) * .3 + .08 * Math.sin(t * 2.3 + q.k), h = q.h * (.6 + .4 * hash(q.k * 7 + j, 5));
    stroke(c, [[q.x + j * 5, y + 4], [q.x + j * 5 + Math.cos(a) * h * .5, y + Math.sin(a) * h * .5], [q.x + j * 5 + Math.cos(a) * h, y + Math.sin(a) * h]], { w: 3.2, color: K.ink, seed: q.k * 13 + j + sd, taper: .6 }); } } }
const S4FG = (() => { const r = rng(91), out = []; for (let k = 0; k < 6; k++) out.push({ x: -40 + k * 18 + r() * 12, h: 200 + r() * 200, lean: 10 + r() * 50, w: 13 + r() * 10, k }); return out; })();
function s4FgReeds(c, t, baseY) { const sd = tick(t);
  for (const b of S4FG) { const sway = 8 * Math.sin(t * 2.2 + b.k), B = [b.x, baseY], C = [b.x + b.lean * .15, baseY - b.h * .6], E = [b.x + b.lean + sway, baseY - b.h], L = [], R = [];
    for (let j = 0; j <= 12; j++) { const f = j / 12, u = 1 - f, p = [u * u * B[0] + 2 * u * f * C[0] + f * f * E[0], u * u * B[1] + 2 * u * f * C[1] + f * f * E[1]],
      d = [2 * u * (C[0] - B[0]) + 2 * f * (E[0] - C[0]), 2 * u * (C[1] - B[1]) + 2 * f * (E[1] - C[1])], l = Math.hypot(d[0], d[1]) || 1, hw = b.w / 2 * Math.pow(1 - f, .8);
      L.push([p[0] - d[1] / l * hw, p[1] + d[0] / l * hw]); R.push([p[0] + d[1] / l * hw, p[1] - d[0] / l * hw]); }
    block(c, [...L, ...R.reverse()], K.ink, { amp: .8, freq: 10, grain: .5, seed: 900 + b.k + sd, smooth: false }); } }

// ---- 漂流物：纸船上的人偶、装头像的漂流瓶。x = x0 + v·(t − T0)；人偶漂到 PULL 时，头上的厄被缎带卷走 ----
const S4FLOAT = [
  { doll: 'neat', lane: 1745, x0: 960, v: 360, seed: 11 },
  { doll: 'neat', big: true, lane: 1748, x0: 730, v: 300, seed: 15 },
  { doll: 'cut', lane: 1745, x0: 145, v: 350, seed: 12 },
  { doll: 'twins', lane: 1745, x0: -220, v: 380, seed: 13 },
  { ph: 'bottle1', lane: 1862, x0: 650, v: 350, seed: 21 },
  { doll: 'head', lane: 1860, x0: 338, v: 370, seed: 14 },
  { ph: 'bottle3', lane: 1862, x0: -600, v: 400, seed: 23 },
  { ph: 'bottle2', lane: 1970, x0: -150, v: 360, seed: 22 },
  { doll: 'drawn', lane: 1860, x0: -800, v: 370, seed: 16 },
  { doll: 'inv', lane: 1968, x0: -1000, v: 350, seed: 17 },
];
S4FLOAT.forEach(o => { if (o.doll) o.tp = S4.T0 + (S4.PULL - o.x0) / o.v; });
const S4PULLS = S4FLOAT.filter(o => o.doll).sort((a, b) => a.tp - b.tp);
const s4X = (o, t) => o.x0 + o.v * (t - S4.T0);
// s4Boat：折纸小船（船身在水线 y 以上）。先画船里的东西，再画船身
function s4Boat(c, x, y, s, rot, sd, inside) { const T = tf(x, y, s, rot); if (inside) inside(T);
  const hull = M(T, [[-88, -38], [-58, -22], [58, -22], [88, -38], [62, 4], [-62, 4]]);
  block(c, hull, K.card, { smooth: false, amp: .8, seed: sd, grain: .5 }); outline(c, hull, { w: 2.6, seed: sd + 1, smooth: false });
  stroke(c, M(T, [[-58, -22], [-40, 2]]), { w: 1.8, seed: sd + 2, smooth: false, color: K.g3 }); stroke(c, M(T, [[58, -22], [40, 2]]), { w: 1.8, seed: sd + 3, smooth: false, color: K.g3 });
  stroke(c, M(T, [[-40, -12], [40, -12]]), { w: 1.4, seed: sd + 4, smooth: false, color: K.g2 }); }
// 漂流瓶（墨线画）：头像裁成圆放在瓶肚里（按原样），玻璃高光压住一点头像边。(x, y) 瓶肚中心
const S4GLASS = (() => { const out = [], R = 116, a0 = .25; for (let k = 0; k <= 40; k++) { const a = -Math.PI / 2 + a0 + k / 40 * (TAU - 2 * a0); out.push([Math.cos(a) * R, Math.sin(a) * R * .97]); }
  out.push([-24, -150], [-23, -168], [-30, -172], [-30, -184], [30, -184], [30, -172], [23, -168], [24, -150]); return out; })();
const S4PR = 86, S4PY = -12;
const s4Arc = (x, y, r, a0, a1, n = 10) => Array.from({ length: n + 1 }, (_, j) => { const a = lerp(a0, a1, j / n); return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
function s4Bottle(c, x, y, s, rot, ph, sd) { const T = tf(x, y, s, rot), glass = M(T, S4GLASS), lw = s;
  block(c, glass, K.paper2, { smooth: false, amp: 1, grain: .6, seed: sd });
  const [px, py] = T(0, S4PY), pr = S4PR * s; c.save(); c.beginPath(); c.arc(px, py, pr, 0, TAU); c.clip(); c.translate(px, py); c.rotate(rot); c.drawImage(PHOTOS[ph].img, -pr, -pr, pr * 2, pr * 2); c.restore();
  outline(c, ellPts(px, py, pr + 1.5, pr + 1.5, 0, 48), { w: 2.4 * lw, color: K.g3, seed: sd + 1, rough: .2 });
  for (let k = 0; k < 3; k++) stroke(c, M(T, s4Arc(0, 0, 100 + k * 5, .15 + k * .12, .95 + k * .1)), { w: 2 * lw, color: K.g2, seed: sd + 10 + k, taper: .6, dry: .2 });
  // 玻璃高光画在头像圈外面，不压照片
  stroke(c, M(T, s4Arc(0, S4PY * .6, S4PR + 13, Math.PI + .55, Math.PI + 1.2)), { w: 9 * lw, color: K.card, al: .92, seed: sd + 20, taper: .7 });
  stroke(c, M(T, s4Arc(0, 0, 107, Math.PI + .45, Math.PI + .8, 6)), { w: 4 * lw, color: K.card, seed: sd + 21, taper: .6 });
  outline(c, glass, { w: 4.4 * lw, color: K.ink, seed: sd + 2, smooth: false, rough: .3 });
  stroke(c, M(T, [[-30, -172], [30, -172]]), { w: 2.4 * lw, seed: sd + 3, smooth: false });
  stroke(c, M(T, [[-25, -155], [0, -159], [25, -160]]), { w: 3.4 * lw, seed: sd + 4 });
  stroke(c, M(T, [[24, -160], [40, -150], [36, -128], [24, -138]]), { w: 2.2 * lw, seed: sd + 5 });
  const plug = M(T, [[-19, -180], [-21, -222], [-16, -228], [16, -228], [21, -222], [19, -180]]);
  block(c, plug, K.g2, { smooth: false, amp: .8, seed: sd + 7, grain: .8 }); outline(c, plug, { w: 3 * lw, seed: sd + 8, smooth: false }); }
// s4Wet：水线。盖住没进水里的一截（淡墨），两边几道墨线波纹
function s4Wet(c, x, wl, hw, depth, t, sd) { const s = sd + tick(t);
  block(c, [[x - hw - 10, wl], [x + hw + 10, wl], [x + hw * .82, wl + depth], [x - hw * .82, wl + depth]], K.g1, { al: .72, amp: 2, grain: .5, seed: s, smooth: false });
  stroke(c, [[x - hw * .7, wl + depth * .5], [x + hw * .6, wl + depth * .55]], { w: 2.4, color: K.g2, dry: .4, seed: s + 1 });
  for (const d of [-1, 1]) { stroke(c, [[x + d * (hw - 16), wl + 1], [x + d * (hw + 26), wl - 2], [x + d * (hw + 70), wl + 2]], { w: 3.2, color: K.ink, seed: s + 3 + d, taper: .6 });
    stroke(c, [[x + d * (hw + 20), wl + 14], [x + d * (hw + 60), wl + 12], [x + d * (hw + 96), wl + 15]], { w: 2, color: K.g3, seed: s + 5 + d, taper: .6, dry: .3 }); } }
// s4Smoke：一缕灰墨（厄的尾巴）
function s4Smoke(c, pts, sd, al = 1, w = 6) { if (pts.length < 2) return;
  stroke(c, pts, { w, color: K.g2, dry: .28, taper: .55, seed: sd, al });
  stroke(c, pts.map(([x, y], j) => [x + 5 * Math.sin(j * 1.7 + sd), y + 3 * Math.cos(j * 1.3)]), { w: w * .34, color: K.g3, dry: .2, taper: .5, seed: sd + 1, al }); }
// 厄：人偶头上飘着一个灰色的「厄」字，下面拖一缕灰墨。u 0..1 被缎带卷走的进度
function s4Yaku(c, hx, hy, t, u, seed, target) { if (u >= 1) return; const sd = seed + tick(t);
  // 先被拽得一歪（往后缩一下），再沿一道弧被卷过去，边飞边打转、变小
  const e = u < .18 ? -.06 * Math.sin(u / .18 * Math.PI) : easeInOutSine((u - .18) / .82), [x, y] = arc([hx, hy - 48], target, Math.max(0, e), 180), sc = lerp(1, .5, Math.max(0, e)), rot = Math.max(0, e) * 6 + .12 * Math.sin(t * 3 + seed) - (u < .18 ? .3 * Math.sin(u / .18 * Math.PI) : 0);
  const x2 = x + (e < 0 ? e * 400 : 0), tail = []; for (let j = 0; j <= 10; j++) { const f = j / 10; tail.push([lerp(hx, x2, f) + 8 * Math.sin(f * 5 + t * 4 + seed) * (1 - Math.max(0, e)), lerp(hy - 6, y + 10, f) - 50 * Math.sin(Math.PI * f) * Math.max(0, e)]); }
  s4Smoke(c, tail, sd, 1 - Math.max(0, e) * .4, 6 * sc);
  zh(c, '厄', x2, y + 20 * sc, { size: 56 * sc, weight: 500, color: K.g2, align: 'center', rot, seed, tilt: .02, jitter: 0, al: 1 - sm(.85, 1, u) }); }
// ---- 雏的红缎带：绕竖轴螺旋上升，下宽上窄像转开的裙摆。正面 K.vermil，反面压暗；转到后面的半圈再暗一档 ----
const s4R = s => 18 + 92 * Math.pow(1 - s, 1.25);
function s4Helix(phi, grow, n = 150) { const out = [];
  for (let i = 0; i <= n; i++) { const s = i / n * grow, r = s4R(s), th = s * TAU * S4.TURNS + phi, ps = s * TAU * 2.3 - phi * .4;
    out.push({ x: S4.RX + r * Math.cos(th), y: lerp(S4.RB, S4.RT, s) + r * .26 * Math.sin(th), front: Math.sin(th) > 0, w: (16 - 7 * s) * Math.cos(ps) }); }
  return out; }
function s4Runs(P, withW) { const runs = []; let cur = null;
  for (let i = 0; i < P.length; i++) { const p = P[i], key = (p.front ? 'f' : 'b') + (withW && p.w < 0 ? '-' : '+'); let L = [p.x, p.y], R = null;
    if (withW) { const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1, h = p.w / 2; L = [p.x - ty / l * h, p.y + tx / l * h]; R = [p.x + ty / l * h, p.y - tx / l * h]; }
    if (!cur || cur.key !== key) { const prev = cur; cur = { key, front: p.front, face: key[1] === '+', L: [], R: [] }; runs.push(cur); if (prev) { cur.L.push(prev.L[prev.L.length - 1]); if (withW) cur.R.push(prev.R[prev.R.length - 1]); } }
    cur.L.push(L); if (withW) cur.R.push(R); }
  return runs; }
const S4COIL = [.04, .22, .4, .56, .7];
function s4CoilPts(k, phi, n = 40) { const out = [];
  for (let i = 0; i <= n; i++) { const s = S4COIL[k % S4COIL.length] + i / n * .24, r = s4R(s) * 1.14 + 5, th = s * TAU * 2.4 + phi + k * 1.9;
    out.push({ x: S4.RX + r * Math.cos(th), y: lerp(S4.RB, S4.RT, s) + r * .26 * Math.sin(th) - 6, front: Math.sin(th) > 0 }); }
  return out; }
// s4Phi：缎带转过的角度。平时慢慢转，每卷走一个厄猛转一圈多
function s4Phi(t) { let p = 2.4 * t; for (const o of S4PULLS) p += TAU * 1.2 * sm(o.tp - .05, o.tp + S4.PULLD + .1, t, easeInOutQuint); return p; }
function s4Bow(c, x, y, s, rot, sd) { const T = tf(x, y, s, rot);
  for (const d of [-1, 1]) { block(c, M(T, [[d * .12, .12], [d * .38, .95], [d * .6, 1.25], [d * .72, 1.1], [d * .5, .8], [d * .22, .05]]), S4RED.dk, { amp: .8, seed: sd + 5 + d, grain: .4, smooth: false });
    block(c, M(T, [[0, 0], [d * .45, -.6], [d * 1.05, -.66], [d * 1.2, -.2], [d * .98, .3], [d * .42, .22]]), K.vermil, { amp: 1, seed: sd + d, grain: .4 });
    stroke(c, M(T, [[d * .18, -.04], [d * .62, -.34], [d * .98, -.36]]), { w: 2.2, color: K.ink, seed: sd + 3 + d, al: .75 }); }
  block(c, M(T, ellPts(0, 0, .2, .25, 0, 14)), S4RED.dk, { amp: .6, seed: sd + 9, grain: .4 }); }
function s4Ribbon(c, t, grow, sd) { if (grow <= 0) return; const phi = s4Phi(t);
  const col = r => r.front ? (r.face ? K.vermil : S4RED.fb) : (r.face ? S4RED.bf : S4RED.bb);
  const runs = s4Runs(s4Helix(phi, grow), true), coils = S4PULLS.map((o, k) => t > o.tp + S4.PULLD ? s4Runs(s4CoilPts(k, phi), false) : []);
  const ribbonPass = front => runs.forEach((r, j) => { if (r.front !== front) return; const poly = [...r.L, ...r.R.slice().reverse()]; if (poly.length >= 4) block(c, poly, col(r), { smooth: false, amp: .8, freq: 9, grain: .45, seed: sd + j }); });
  const coilPass = front => coils.forEach((cr, k) => cr.forEach((r, j) => { if (r.front === front && r.L.length > 1) s4Smoke(c, r.L, sd + k * 17 + j, front ? 1 : .7, 5); }));
  for (let k = 0; k < 2; k++) { const a0 = phi * 1.3 + k * Math.PI, pts = []; for (let j = 0; j <= 10; j++) { const a = a0 + j / 10 * 1.9; pts.push([S4.RX + Math.cos(a) * 128, S4.RB + 20 + Math.sin(a) * 14]); } stroke(c, pts, { w: 2.6, color: K.g3, al: .8 * grow, dry: .3, seed: 40 + k + sd, taper: .6 }); }
  coilPass(false); ribbonPass(false); ribbonPass(true); coilPass(true);
  const spd = (s4Phi(t + 1 / 12) - s4Phi(t - 1 / 12)) * 6, sa = clamp((spd - 5) / 6, 0, 1);
  if (sa > 0) for (const [s, k] of [[.12, 0], [.42, 1], [.7, 2]]) { const r = s4R(s) * 1.4 + 10, y = lerp(S4.RB, S4.RT, s), pts = []; for (let j = 0; j <= 10; j++) { const a = .5 + k * .3 + j / 10 * 1.4; pts.push([S4.RX + Math.cos(a) * r, y + Math.sin(a) * r * .3]); } stroke(c, pts, { w: 2.4, color: K.g3, al: sa, dry: .25, seed: 60 + k + sd, taper: .7 }); }
  const bow = easeOutBack(clamp((grow - .9) / .1, 0, 1)); if (bow > .01) s4Bow(c, S4.RX + 2, S4.RT - 14, 36 * bow, .12 * Math.sin(t * 5), 80 + sd); }
// 河：漂流物按远近画，缎带在右下的近岸上
function s4River(c, t, sd) { s4Water(c, t);
  const items = S4FLOAT.map(o => ({ o, x: s4X(o, t) })).filter(q => q.x > -320 && q.x < 2300).sort((a, b) => a.o.lane - b.o.lane), yaku = [];
  const drawItem = ({ o, x }) => { const y = o.lane + 3 * Math.sin(t * 3 + o.seed), rot = .05 * Math.sin(t * 2.4 + o.seed);
    if (o.ph) { s4Bottle(c, x, y - 64, .72, rot * .7, o.ph, o.seed * 10 + sd); s4Wet(c, x, y, 86, 26, t, o.seed); return; }
    const big = !!o.big, ds = big ? 1.05 : .62, sink = big ? 26 : 0, hs = big ? 1 : .9;
    s4Boat(c, x, y + sink * .5, hs, rot, o.seed * 10 + sd, T => s4Doll(c, ...T(0, -18 + sink), ds, { kind: o.doll, seed: 180 + o.seed, rot }));
    s4Wet(c, x, y + sink * .5, 90 * hs, 18, t, o.seed);
    const top = o.doll === 'head' ? y - 18 + sink - 80 * ds : y - 18 + sink - 205 * ds; yaku.push([x, top, o]); };
  items.filter(q => q.o.lane < 1920).forEach(drawItem);
  const pullT = [S4.RX - 20, S4.RB - 150];
  const drawYaku = () => { for (const [x, y, o] of yaku) s4Yaku(c, x, y, t, clamp((t - o.tp) / S4.PULLD, 0, 1), o.seed, pullT); yaku.length = 0; };
  drawYaku();
  items.filter(q => q.o.lane >= 1920).forEach(drawItem); drawYaku();
  s4NearBank(c, t);
  s4Ribbon(c, t, sm(14.35, 15.0, t, easeOut), 300 + sd);
  s4FgReeds(c, t, S4.GROUND + S4.D + 40); }

// 陈列台 + 河（一张纸，镜头往下摇）
function s4World(c, tau) { const t = twos(tau), sd = tick(t), pan = sm(S4.PAN0, S4.PAN1, tau, easeInOutSine), far = sm(S4.FAR0, S4.WIPE, tau, easeInOutSine), bigT = S4SHELF.find(d => d.big).t;
  const shake = settle(t, bigT + 1 / 12, { amp: 7, freq: 5, decay: 9 });
  setView({ x: CX + 40 * far, y: CY + S4.D * pan + shake, zoom: 1 - .14 * far }); paperBg(c);
  const [, vy, , vh] = viewRect(0);
  if (vy < S4.GROUND + 40) { s4Stones(c, sd); s4Tiers(c, sd); s4Turntable(c, S4.SX, S4.FUMO.y, tau * TAU / S4.FUMO.per, sd);
    hinaFumo(c, S4.SX, S4.FUMO.y + 4, S4.FUMO.h, tau * TAU / S4.FUMO.per);
    s4Shelf(c, tau, sd); s4Flyer(c, sd); s4Prize(c, tau, sd); }
  else s4Stones(c, sd);
  if (vy + vh > 1300) s4River(c, t, sd);
  // 玩偶在画面里时，左下角写署名
  if (vy < S4.FUMO.y + 10) s4Screen(c, () => zh(c, FUMO_CREDIT, 48, 1038, { size: 24, color: K.g3, tilt: .01, jitter: .01, outline: K.paper, ow: .22 }));
  // 河段的字：摊宣原话，左下小字
  s4Screen(c, () => { zh(c, S4TXT.l1, 104, 286, { size: 76, weight: 500, p: writeP(t, 14.45, S4TXT.l1, .045), seed: 41, tilt: .01, jitter: .01 });
    zh(c, S4TXT.l2, 108, 372, { size: 58, weight: 500, p: writeP(t, 14.75, S4TXT.l2, .045), seed: 42, tilt: .01, jitter: .01 });
    zh(c, S4TXT.flow, 230, 1014, { size: 48, color: K.ink, p: writeP(t, 15.4, S4TXT.flow, .045), seed: 43, tilt: .01, jitter: .01 }); }); }
// 收尾：墨色顺着水流从左往右漫过来
function s4Wipe(c, tau) { const u = sm(S4.WIPE, S4.BLACK, tau, easeIn); if (u <= 0) return; s4Screen(c, () => { const X = lerp(-120, W + 220, u), sd = tick(tau, 12), edge = [];
  for (let y = -40; y <= H + 40; y += 40) edge.push([X + 70 * noise1(y / 160, sd) + 40 * Math.sin(y / 90 + u * 6), y]);
  block(c, [[-200, -40], ...edge, [-200, H + 40]], K.ink, { smooth: false, amp: 6, freq: 20, spike: .1, spikeLen: 40, seed: sd, grain: 1 }); }); }

scene({ order: 4, key: 'hina', name: '雏 祭', dur: S4.END, fn: (c, tau) => {
  if (tau < S4.IN) return handoffStream(c);
  if (tau >= S4.BLACK) return handoffBlack(c);
  if (tau < S4.STAND) s4Table(c, tau); else s4World(c, tau);
  s4Wipe(c, tau);
  caption(c, S4TXT.title, tau, .35, { t1: 2.8 });
  caption(c, S4TXT.write, tau, 5.9, { t1: 9.1, per: .05 });
  caption(c, S4TXT.show, tau, 9.35, { t1: 12.2, per: .05 });
} });
