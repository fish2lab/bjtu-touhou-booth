'use strict';
// 第 5 段 会赢的（12 秒）。黑白漫画分格，默片节奏：停住，抖包袱，再停住。
// 摊宣 Vol.1 玩的是「会赢的」梗：决战前放狠话、摆架势，这里把「答案」换成摊位上卖的亚克力挂件。
//   0      只画 handoffBlack，接第 4 段的黑场
//   0.2    左上角展签「会赢的」。墨底漫画页，三格依次砸下来：
//          ① 灵梦（左）和魔理沙（右）对峙，一团风滚草滚过去。魔理沙：「两者皆有可能……」
//          ② 灵梦特写，集中线，「这就是答案。」御币指向右边那一格
//          ③ 空格停一拍，一个亚克力挂件掉进来晃荡；魔理沙回头看了两次；挂件像抛硬币一样转一圈，
//             停在正面（两面印的都是灵梦）；魔理沙的帽尖垂了下来
//   4.3    第三格撑满全屏：「没错，是博丽灵梦赢了！」【最强的战绩，铭刻于神社！】，
//          第二个单件沿横杆滑进来并排，写价格「亚克力挂件 8元/套（包含两个单件）」
//   9.9    除了「赢」字，屏上的东西全掉下去；「赢」推到画面正中变大，墨底从四边收成摊宣上那个黑底白字的方块
//   11.5   方块连字缩成画面正中一个黑点（DOT_R），最后 0.15 秒只画 handoffDot，交给第 6 段
// 屏上文字全部抄自 docs/素材事实.md「北交摊宣 Vol.1」。颜色只用 K.ink、K.paper、K.g1..g3。

const S5 = {
  END: 12,
  CAP: [.2, 4.25],                                                   // 展签出现、收起
  P1: [60, 175, 860, 430], P2: [60, 635, 860, 385], P3: [960, 60, 900, 960],   // 三格：x, y, 宽, 高
  T1: .3, T2: 1.35, T3: 2.25,                                        // 三格砸下来的时刻
  B1: .5, B2: 1.55,                                                  // 两句对白开始写
  WEED: [.95, 2.75],                                                 // 风滚草滚过
  DROP: 2.4, LAND: 2.58,                                             // 挂件掉进第三格、链子绷直
  LOOK: [2.75, 2.88, 3.0],                                           // 魔理沙回头、转回去、再回头
  SPIN: [3.1, 3.22, 3.8, 3.9],                                       // 往回拧一下、转一圈、冲过头、停在正面
  DROOP: 3.95,                                                       // 魔理沙帽尖垂下来
  GROW: [4.3, 4.65],                                                 // 第三格撑满全屏
  SAY: 4.7, SMALL: 5.05, K2: [5.1, 5.45], PRICE: 5.35, UNDER: 6.2, GLINT: 7.3, PEEK: 7.9,   // PEEK 魔理沙从右下角探出耷拉的帽子
  FALL: 9.9, ZOOM: [10.2, 10.55], BOX: [10.55, 11.2], DOT: [11.5, 11.85], OUT: 11.85,
  TX: 110, ROD: 155, A1: 1225, A2: 1640, LC: 150, CS: 1.25,          // 全屏那一页：字的左边、横杆高度、两个挂件的吊点、链长、挂件缩放
  YING: 350, BOXR: 220, YC: .35,                                     // 收尾「赢」的字号、方块半宽、字的视觉中心在基线上方几个字号
  TXT: { cap: '会赢的', b1: '两者皆有可能……', b2: '这就是答案。', say: '没错，是博丽灵梦赢了！', small: '【最强的战绩，铭刻于神社！】',
    price1: '亚克力挂件 8元/套', price2: '（包含两个单件）' },
};
// 全屏那一页的四行字。价格照摊宣的排法在「（」前折行，字一个不改
S5.LINES = [
  { s: S5.TXT.say, y: 365, size: 72, weight: 500, color: K.paper, t0: S5.SAY, per: .038, seed: 500 },
  { s: S5.TXT.small, y: 450, size: 48, weight: 400, color: K.g1, t0: S5.SMALL, per: .035, seed: 600 },
  { s: S5.TXT.price1, y: 705, size: 104, weight: 500, color: K.paper, t0: S5.PRICE, per: .05, seed: 700 },
  { s: S5.TXT.price2, y: 815, size: 64, weight: 400, color: K.paper, t0: S5.PRICE + .5, per: .04, seed: 800 },
];
S5.YI = [...S5.TXT.say].indexOf('赢');

// ===================== 人物剪影 =====================
// s5Sil：木刻剪影。parts 是一组闭合轮廓（画面坐标），全部涂墨，外面一圈白边（刮痕描边）；部件重叠处没有接缝
function s5Sil(c, parts, o = {}) { const { rim = 3, seed = 1, amp = 1 } = o;
  const rings = parts.map((p, k) => rough(p.pts, { amp, freq: 9, seed: seed + k * 5, smooth: !p.sharp, step: 2 }));
  if (rim > 0) { c.save(); c.fillStyle = K.paper; for (const r of rings) c.fill(polyPath(offsetRing(r, () => rim))); c.restore(); }
  c.save(); c.fillStyle = K.ink; for (const r of rings) c.fill(polyPath(r)); c.restore(); }
// s5Shide：御币头上两条之字形的纸垂（白）。T 局部 → 画面，(x, y) 御币头，u1 每单位多少像素
function s5Shide(c, T, x, y, u1, sd, k = 1) { for (const d of [-1, 1]) stroke(c, M(T, [[x, y], [x + d * 5 * k, y + 3 * k], [x + d * 1 * k, y + 7 * k], [x + d * 6 * k, y + 11 * k], [x + d * 2 * k, y + 15 * k]]), { w: Math.max(1.6, u1 * 1.4 * k), color: K.paper, seed: sd + 40 + d, smooth: false, taper: .08 }); }
// s5BowLoop：蝴蝶结的一个圈（宽头、窄根，像领结的一半），从结 (x, y) 朝角度 a 伸出去，长 len，外头宽 wd
function s5BowLoop(x, y, a, len, wd) { const ca = Math.cos(a), sa = Math.sin(a), Q = (u, v) => [x + u * len * ca - v * wd * sa, y + u * len * sa + v * wd * ca];
  return [Q(0, -.14), Q(.42, -.36), Q(.8, -.52), Q(.97, -.44), Q(1.03, 0), Q(.97, .44), Q(.8, .5), Q(.42, .34), Q(0, .14)]; }
// s5BowLines：一个圈上的白刮痕：两道褶、外头一圈花边
function s5BowLines(c, T, x, y, a, len, wd, w, sd) { const ca = Math.cos(a), sa = Math.sin(a), Q = (u, v) => [x + u * len * ca - v * wd * sa, y + u * len * sa + v * wd * ca];
  scratch(c, M(T, [Q(.12, -.04), Q(.5, -.12), Q(.8, -.26)]), { w, seed: sd + 1 }); scratch(c, M(T, [Q(.12, .04), Q(.5, .1), Q(.78, .24)]), { w: w * .8, seed: sd + 2 });
  const fr = []; for (let k = 0; k <= 10; k++) fr.push(Q(.88 + (k % 2) * .06, lerp(-.36, .36, k / 10))); stroke(c, M(T, fr), { w: w * .75, color: K.paper, seed: sd + 3, smooth: false, taper: .1, al: .9 }); }
// 下面四个人物的局部坐标：脚底在原点，向上为负，身高约 110 单位，面朝 +x
// s5Skirt：裙子（下摆一圈波浪花边）
function s5Skirt(x0, x1, y0, h0, h1, y1) { const out = [[x0, y0], [x1, y0], [h1, y1]]; for (let k = 1; k < 12; k++) { const u = k / 12; out.push([lerp(h1, h0, u), y1 + 1.4 * Math.abs(Math.sin(u * 6 * Math.PI))]); } out.push([h0, y1]); return out; }
const S5LEGS = [[[-4, -25], [0, -25], [-.5, -4], [-4, -4]], [[1, -25], [5, -25], [5.5, -4], [1.5, -4]], [[-5.5, -5], [1, -5], [2, 0], [-5.5, 0]], [[1, -5], [8, -5], [9.5, 0], [1, 0]]];
const S5NECK = [[-1, -75], [5, -75], [5.5, -66], [-1.5, -66]];
const S5FACE = [[6, -86], [9.4, -82.5], [10.6, -80], [8.6, -79], [9.2, -76.5], [7.4, -73.5], [4, -72]];   // 侧脸的额头、鼻尖、下巴
// s5ReimuSide：灵梦侧身剪影，手臂前伸举着御币。标志物：脑后的大蝴蝶结、侧发的发管、大袖、御币
function s5ReimuSide(c, x, y, s, o = {}) { const { dir = 1, t = 0, rim = 2.6 } = o, T = tf(x, y, s, 0, dir), sd = tick(t, 8), P = pts => M(T, pts), bow = [[-2.25, 22], [2.85, 23]];
  s5Sil(c, [
    { pts: P([[-4, -88], [-10, -82], [-11, -68], [-7, -63], [-2, -68], [0, -78]]) },               // 后发
    ...bow.map(([a, l]) => ({ pts: P(s5BowLoop(-5, -89, a, l, 15)) })),                              // 蝴蝶结两个圈
    { pts: P([[-6, -87], [-11, -78], [-13, -71], [-10, -72], [-7, -80]]) },                         // 飘带
    { pts: P(ellPts(2, -80, 7.5, 8.8, 0, 22)) }, { pts: P(S5FACE) }, { pts: P(S5NECK) },             // 头、侧脸、脖子
    { pts: P([[6, -78], [8.5, -70], [8, -57], [6, -57], [5, -70]]) },                               // 侧发
    { pts: P([[-4, -68], [6, -68], [6, -54], [-5, -54]]) },                                         // 身
    { pts: P(s5Skirt(-6, 7, -56, -13, 14, -24)), sharp: true },                                     // 裙
    ...S5LEGS.map(p => ({ pts: P(p), sharp: true })),
    { pts: P(capsule([20, -58], [30, -99], 1, 4)) },                                                // 御币杆
    { pts: P([[-1, -67], [12, -64], [21, -61], [19, -48], [8, -46], [0, -56]]) },                   // 大袖（手臂前伸）
    { pts: P(ellPts(21.5, -61, 2.4, 2.2, 0, 10)) },                                                 // 手
  ], { rim, seed: 30 + sd, amp: .9 });
  const w = Math.max(1.2, s * .6); bow.forEach(([a, l], k) => s5BowLines(c, T, -5, -89, a, l, 15, w, 31 + k * 5 + sd));
  scratch(c, P([[5.5, -62], [8.5, -62]]), { w: w * 1.3, seed: 43 + sd, taper: .1 });              // 发管
  scratch(c, P([[1, -52], [3, -27]]), { w: w * .8, seed: 44 + sd, al: .7 }); scratch(c, P([[5, -52], [9, -27]]), { w: w * .8, seed: 45 + sd, al: .7 });
  s5Shide(c, T, 30, -99, s, sd); }
// s5MarisaSide：魔理沙侧身剪影。标志物：尖帽（droop 0..1 帽尖从中间折下来，垂到帽檐前面）、身后立着的扫帚
function s5MarisaSide(c, x, y, s, o = {}) { const { dir = 1, t = 0, droop = 0, rim = 2.6 } = o, T = tf(x, y, s, 0, dir), sd = tick(t, 8), P = pts => M(T, pts);
  const piv = [5, -100], th = droop * 2.6 - .12 * (1 - droop), bend = p => { const dx = p[0] - piv[0], dy = p[1] - piv[1]; return [piv[0] + dx * Math.cos(th) - dy * Math.sin(th), piv[1] + dx * Math.sin(th) + dy * Math.cos(th)]; };
  const cone = [[-7, -88], [9, -88], [6, -101], [-2, -104]], tip = [[6, -101], [-2, -104], [-4, -113], [-7, -123], [0, -112]].map(bend);
  s5Sil(c, [
    { pts: P(capsule([-11, -95], [-10, -12], 1.2, 4)) },                                            // 扫帚杆
    { pts: P([[-15, -15], [-6, -15], [-1, 1], [-21, 1]]), sharp: true },                            // 扫帚头
    { pts: P([[-3, -86], [-10, -80], [-13, -64], [-11, -50], [-6, -55], [-3, -66], [0, -76]]) },   // 长发
    { pts: P(ellPts(2, -80, 7.2, 8.5, 0, 22)) }, { pts: P(S5FACE) }, { pts: P(S5NECK) },             // 头、侧脸、脖子
    { pts: P([[6, -78], [9, -68], [8, -58], [6, -60], [5, -70]]) },                                 // 前发
    { pts: P([[-20, -85], [-8, -88.5], [10, -88.5], [24, -85.5], [12, -83.5], [-8, -83]]) },       // 帽檐
    { pts: P(cone) }, { pts: P(tip) },                                                               // 帽子下半截、帽尖
    { pts: P([[-4, -68], [6, -68], [6, -54], [-5, -54]]) },                                         // 身
    { pts: P([[-7, -56], [8, -56], [15, -41], [16, -24], [-15, -24], [-14, -41]]) },               // 蓬蓬裙
    ...S5LEGS.map(p => ({ pts: P(p), sharp: true })),
    { pts: P([[0, -66], [9, -60], [12, -56], [9, -54], [-1, -60]]) },                               // 手臂
  ], { rim, seed: 50 + sd, amp: .9 });
  const w = Math.max(1.2, s * .6);
  scratch(c, P([[-6, -89.6], [9, -89.6]]), { w: w * 1.2, seed: 51 + sd, taper: .1 });             // 帽带
  scratch(c, P([[3, -54], [-2, -26]]), { w: w * .8, seed: 52 + sd, al: .7 }); scratch(c, P([[5, -54], [10, -26]]), { w: w * .8, seed: 53 + sd, al: .7 });   // 围裙
  for (let k = 0; k < 3; k++) scratch(c, P([[-13 + k * 3, -12], [-17 + k * 6, 0]]), { w: w * .7, seed: 54 + k + sd, al: .8 }); }
// s5ReimuFront：灵梦正面全身剪影（挂件上印的），右手举着御币。T 局部 → 画面，u1 每单位多少像素
function s5ReimuFront(c, T, u1, t, rim = 2.2) { const sd = tick(t, 8), P = pts => M(T, pts), mir = pts => pts.map(([u, v]) => [-u, v]);
  const lock = [[-8, -82], [-12, -72], [-12, -55], [-8, -54], [-8, -70]], leg = [[-6, -25], [-2, -25], [-2.5, -4], [-5.5, -4]], shoe = [[-7, -5], [-1.5, -5], [-1.5, 0], [-8, 0]];
  const bow = [[1.5, -.38], [-1.5, Math.PI + .38]];
  s5Sil(c, [
    { pts: P([[-11, -86], [-13, -72], [-11, -64], [11, -64], [13, -72], [11, -86], [0, -91]]) },   // 后发
    ...bow.map(([dx, a]) => ({ pts: P(s5BowLoop(dx, -90, a, 26, 17)) })), { pts: P(ellPts(0, -90, 3.6, 3.2, 0, 12)) },   // 蝴蝶结
    { pts: P(ellPts(0, -80, 8.5, 9.5, 0, 24)) },                                                    // 头
    { pts: P(lock) }, { pts: P(mir(lock)) },                                                        // 两边侧发
    { pts: P([[-2.5, -72], [2.5, -72], [3, -66], [-3, -66]]) }, { pts: P([[-7, -68], [7, -68], [6, -54], [-6, -54]]) },   // 脖子、身
    { pts: P([[-8, -66], [-14, -62], [-21, -44], [-16, -40], [-10, -42], [-9, -56]]) },             // 左袖（垂着）
    { pts: P(capsule([18, -80], [23, -113], 1.1, 4)) },                                             // 御币
    { pts: P(capsule([13, -73], [18, -85], 1.9, 4)) }, { pts: P(ellPts(18.5, -86, 2.4, 2.4, 0, 10)) },   // 右前臂、手
    { pts: P([[8, -67], [15, -76], [22, -78], [24, -64], [18, -58], [10, -62]]) },                   // 右袖（举御币）
    { pts: P(s5Skirt(-7, 7, -56, -16, 16, -24)), sharp: true },                                     // 裙
    { pts: P(leg), sharp: true }, { pts: P(mir(leg)), sharp: true }, { pts: P(shoe) }, { pts: P(mir(shoe)) },
  ], { rim, seed: 60 + sd, amp: .8 });
  const w = Math.max(1.2, u1 * .5); bow.forEach(([dx, a], k) => s5BowLines(c, T, dx, -90, a, 26, 17, w, 61 + k * 5 + sd));
  for (const d of [-1, 1]) scratch(c, P([[d * 12.4, -61], [d * 7.6, -61]]), { w: w * 1.3, seed: 72 + d + sd, taper: .1 });   // 发管
  scratch(c, P([[-2.5, -64], [0, -61], [2.5, -64]]), { w: w * .9, seed: 75 + sd, smooth: false });  // 领结
  scratch(c, P([[-3, -52], [-7, -27]]), { w: w * .8, seed: 76 + sd, al: .7 }); scratch(c, P([[3, -52], [7, -27]]), { w: w * .8, seed: 77 + sd, al: .7 });
  s5Shide(c, T, 23, -113, u1, sd); }
// s5ReimuBust：灵梦侧脸胸像（第二格特写、第二个挂件上印的）。局部单位约等于像素，头的中心在原点，面朝 +x。arm: 前伸的大袖和御币
function s5ReimuBust(c, T, u1, t, arm = true, rim = 3.2) { const sd = tick(t, 8), P = pts => M(T, pts), bow = [[-2.2, 118], [2.95, 124]];
  const parts = [
    ...bow.map(([a, l]) => ({ pts: P(s5BowLoop(-46, -42, a, l, 88)) })),                            // 蝴蝶结两个圈
    { pts: P([[-50, -34], [-78, 20], [-92, 70], [-76, 66], [-60, 16]]) }, { pts: P([[-42, -30], [-58, 30], [-60, 84], [-46, 78], [-44, 26]]) },   // 两条飘带
    { pts: P([[-30, -56], [-62, -30], [-74, 20], [-80, 90], [-70, 140], [-40, 120], [-20, 60], [-10, 10]]) },   // 后发
    { pts: P(ellPts(-46, -42, 14, 13, .3, 14)) },                                                    // 结
    { pts: P([[-54, 0], [-50, -30], [-30, -55], [0, -62], [30, -55], [48, -38], [52, -18], [58, -6], [66, 4], [57, 11], [59, 18], [55, 22], [57, 28], [52, 34], [51, 44], [40, 52], [20, 58], [-10, 50], [-40, 30]]) },   // 头和侧脸
    { pts: P([[18, -56], [46, -44], [60, -30], [53, -26], [56, -16], [47, -20], [40, -40]]) },         // 刘海
    { pts: P([[-46, 6], [12, 40], [14, 104], [-48, 116]]) },                                         // 后颈
    { pts: P([[8, 46], [34, 46], [38, 100], [4, 104]]) },                                            // 脖子
    { pts: P([[26, -8], [40, 10], [46, 60], [50, 140], [40, 150], [34, 100], [28, 40]]) },           // 侧发
    { pts: P([[-70, 124], [-20, 98], [40, 96], [90, 118], [112, 210], [-104, 210]]) },               // 肩和身
  ];
  if (arm) parts.push({ pts: P(capsule([172, 64], [262, -104], 4.5, 4)) }, { pts: P([[60, 110], [150, 56], [186, 70], [190, 150], [110, 190]]) }, { pts: P(ellPts(180, 54, 15, 13, 0, 14)) });
  s5Sil(c, parts, { rim, seed: 70 + sd, amp: 1.1 });
  const w = Math.max(1.4, u1 * 2.6); bow.forEach(([a, l], k) => s5BowLines(c, T, -46, -42, a, l, 88, w, 81 + k * 5 + sd));
  scratch(c, P([[38, 106], [52, 104]]), { w: w * 1.2, seed: 91 + sd, taper: .1 }); scratch(c, P([[39, 122], [53, 120]]), { w: w * 1.2, seed: 92 + sd, taper: .1 });   // 发管
  if (arm) { scratch(c, P([[80, 126], [172, 76]]), { w: w * .7, seed: 94 + sd, al: .7 }); s5Shide(c, T, 262, -104, u1, sd, 5); } }

// ===================== 亚克力挂件 =====================
// 挂件平面上的局部坐标：钥匙圈圆心为原点，板子 250×340，顶边 y=44，挂孔在 (0, 66)
const S5PLATE = (() => { const x0 = -125, x1 = 125, y0 = 44, y1 = 384, r = 36, out = [];
  const corner = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + k / 6 * Math.PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x1 - r, y0 + r, -Math.PI / 2); corner(x1 - r, y1 - r, 0); corner(x0 + r, y1 - r, Math.PI / 2); corner(x0 + r, y0 + r, Math.PI); return out; })();
const S5PLATE_IN = offsetRing(densify(S5PLATE, 6), () => -10);
// s5Charm：透明亚克力挂件。(ax, ay) 链子顶端，L 链长（到钥匙圈圆心），s 缩放，spin 绕竖轴转的角度（0 = 正面），swing 摆角，
//   print 'full' 正面全身 | 'bust' 侧脸胸像，glint 0..1 一道扫光（负数没有）。点逐个投影，线宽不随转动变细，转到侧面时看得见厚度
function s5Charm(c, ax, ay, o = {}) { const { L = S5.LC, s = 1, spin = 0, swing = 0, print = 'full', t = 0, glint = -1 } = o, sd = tick(t, 8);
  const cs = Math.cos(spin), sn = Math.sin(spin), ca = Math.cos(swing), sa = Math.sin(swing), lw = w => w * Math.sqrt(s);
  const R = (X, Y) => [ax + s * (X * ca - Y * sa), ay + s * (X * sa + Y * ca)];
  const P = (u, v, z = 0) => R(u * cs + z * sn, v + L), Pm = pts => pts.map(([u, v]) => P(u, v, 4));
  // 链子：一节平放、一节侧着
  for (let v = 2, k = 0; v < L - 34; v += 17, k++) { if (k % 2) stroke(c, [R(0, v - 2), R(0, v + 19)], { w: lw(3.2), color: K.paper, seed: 200 + k + sd, taper: .1, smooth: false });
    else outline(c, M(R, ellPts(0, v + 8, 5.5, 10.5, 0, 16)), { w: lw(2.2), color: K.paper, seed: 200 + k + sd }); }
  // 连着钥匙圈和挂孔的小圈
  outline(c, M(R, ellPts(0, L + 45, 6, 23, 0, 20)), { w: lw(2.6), color: K.paper, seed: 230 + sd });
  // 板子：一层很淡的灰（亚克力），印的剪影，前后两圈白边线，转到侧面时两圈白线之间就是厚度
  const front = Pm(S5PLATE), back = S5PLATE.map(([u, v]) => P(u, v, -4));
  fillPts(c, front, K.g3, .5);
  if (Math.abs(sn) > .03) for (const u of [-125, 125]) fillPts(c, [P(u, 82, 4), P(u, 346, 4), P(u, 346, -4), P(u, 82, -4)], K.paper, .55);
  if (Math.abs(cs) > .08) { c.save(); c.clip(polyPath(Pm(S5PLATE_IN))); if (print === 'full') s5ReimuFront(c, (u, v) => P(u * 2.5, 364 + v * 2.5), 2.5 * s, t, 2.2);
    else s5ReimuBust(c, (u, v) => P(u * .72 + 25, 214 + (v - 35) * .72), .72 * s, t, false, 2.4); c.restore(); }
  outline(c, back, { w: lw(1.4), color: K.paper, al: .35, seed: 240 + sd, smooth: false });
  outline(c, front, { w: lw(2.8), color: K.paper, seed: 241 + sd, smooth: false, rough: .2 });
  outline(c, Pm(S5PLATE_IN), { w: lw(1.2), color: K.paper, al: .4, seed: 242 + sd, smooth: false });
  outline(c, Pm(ellPts(0, 66, 8, 8, 0, 14)), { w: lw(1.8), color: K.paper, seed: 243 + sd });
  // 两道斜高光
  stroke(c, [P(-100, 124, 4), P(-58, 80, 4)], { w: lw(7), color: K.paper, al: .5, seed: 244 + sd, smooth: false });
  stroke(c, [P(-102, 160, 4), P(-40, 94, 4)], { w: lw(3), color: K.paper, al: .35, seed: 245 + sd, smooth: false });
  if (glint >= 0 && glint <= 1 && Math.abs(cs) > .3) { const g = lerp(-260, 260, glint); c.save(); c.clip(polyPath(front));
    stroke(c, [P(g - 120, 420, 4), P(g + 120, 20, 4)], { w: lw(40), color: K.paper, al: .12, seed: 246, smooth: false, taper: 0 });
    stroke(c, [P(g - 60, 420, 4), P(g + 180, 20, 4)], { w: lw(14), color: K.paper, al: .1, seed: 247, smooth: false, taper: 0 }); c.restore(); }
  // 钥匙圈（金属，双圈）
  outline(c, M(P, ellPts(0, 0, 24, 24, 0, 36)), { w: lw(4.4), color: K.paper, seed: 250 + sd });
  outline(c, M(P, ellPts(0, 0, 18.5, 18.5, 0, 30)), { w: lw(2), color: K.paper, al: .7, seed: 251 + sd });
  return P(0, 214); }
// s5Spin：第三格里挂件转的角度。先往回拧一下，一口气转一圈，冲过头一点，弹回正面
function s5Spin(t) { const [a, b, e, d] = S5.SPIN; if (t < a) return 0; if (t < b) return -.4 * easeOut((t - a) / (b - a));
  if (t < e) return lerp(-.4, TAU + .35, easeOut((t - b) / (e - b))); if (t < d) return TAU + .35 * (1 - easeOutBack((t - e) / (d - e))); return TAU; }

// ===================== 字 =====================
// s5Mids：一行手写字里每个字的中心 x（和 zh 一样：左对齐，逐字量宽）
function s5Mids(c, str, size, weight, x) { c.save(); c.font = `${weight} ${size}px ${ZH}`; let cx = x; const out = [...str].map(ch => { const w = c.measureText(ch).width, m = cx + w / 2; cx += w; return m; }); c.restore(); return out; }
// s5Line：全屏那一页的一行字，逐字写出，每个字单独画；S5.FALL 之后一个个往下掉。skip 这个字不画（「赢」另画）
function s5Line(c, L, t, skip = -1) { const chars = [...L.s], n = chars.length, mids = s5Mids(c, L.s, L.size, L.weight, S5.TX), p = writeP(t, L.t0, L.s, L.per);
  chars.forEach((ch, k) => { if (k === skip || ch === ' ') return; const pk = clamp(p * n - k, 0, 1); if (pk <= 0) return;
    const u = t - S5.FALL - hash(k, L.seed) * .1; let dx = 0, dy = 0, rot = 0;
    if (u > 0) { dy = s5Drop(u); dx = (hash(k, L.seed + 1) - .5) * 260 * u; rot = (hash(k, L.seed + 2) - .5) * 5 * u; if (dy > 1000) return; }
    zh(c, ch, mids[k] + dx, L.y + dy, { size: L.size, weight: L.weight, color: L.color, p: pk, seed: L.seed + k * 7, align: 'center', tilt: .01, jitter: .01, rot }); }); }
// s5YingAt：「赢」字，(x, y) 是字的视觉中心。和第一行里那个「赢」同一个种子，放大时姿势不变
function s5YingAt(c, x, y, size, p = 1) { const L = S5.LINES[0]; zh(c, '赢', x, y + S5.YC * size, { size, weight: 500, color: K.paper, p, seed: L.seed + S5.YI * 7, align: 'center', tilt: .01, jitter: .01 }); }
// s5Bubble：对白气泡（白纸，圆角方形，一个尖指向说话的人），字是墨色手写
function s5BalloonPts(cx, cy, rx, ry, tip, n = 4.5, half = .17) { const at = Math.atan2((tip[1] - cy) / ry, (tip[0] - cx) / rx), out = []; let done = false;
  const on = a => { const ca = Math.cos(a), sa = Math.sin(a); return [cx + rx * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n), cy + ry * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / n)]; };
  for (let k = 0; k < 72; k++) { const a = -Math.PI + k / 72 * TAU, d = Math.atan2(Math.sin(a - at), Math.cos(a - at));
    if (Math.abs(d) < half) { if (!done) { out.push(on(at - half), tip, on(at + half)); done = true; } continue; } out.push(on(a)); }
  return out; }
function s5Bubble(c, cx, cy, tip, text, o = {}) { const { size = 54, t = 0, t0 = 0, per = .07, seed = 1 } = o; if (t < t0) return;
  const tw = zhWidth(c, text, size, ZH, 500), rx = tw / 2 + size * 1.1, ry = size * 1.02, k = .6 + .4 * easeOutBack(clamp((t - t0) / .12, 0, 1)), sd = tick(t, 8);
  pop(c, cx, cy, k, () => { block(c, s5BalloonPts(cx, cy, rx, ry, tip), K.paper, { smooth: false, amp: 1.2, freq: 18, seed: seed + sd, grain: .6 });
    zh(c, text, cx, cy + size * .36, { size, weight: 500, color: K.ink, align: 'center', p: writeP(t, t0 + .1, text, per), seed, tilt: .012, jitter: .012 }); }); }

// ===================== 漫画格 =====================
// s5Panel：一格砸下来（放大一点再落定），里面的东西裁在格子里，外面一圈白色刮痕框
function s5Panel(c, r, tau, t0, seed, draw) { if (tau < t0) return; const [x, y, w, h] = r, k = 1 + .07 * (1 - easeOutQuint(clamp((tau - t0) / .14, 0, 1)));
  pop(c, x + w / 2, y + h / 2, k, () => { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); draw(); c.restore();
    outline(c, rectPts(x, y, w, h), { w: 4.4, color: K.paper, seed: seed + tick(tau, 6), smooth: false, rough: .3, dry: .06 }); }); }
// s5Weed：一团风滚草（墨线乱团）
function s5Weed(c, x, y, r, rot, sd) { const rr = rng(77), pts = []; for (let k = 0; k < 46; k++) { const a = k * 2.1 + rr() * .6 + rot, d = r * (.3 + .7 * rr()); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); }
  stroke(c, pts, { w: 2.4, color: K.ink, seed: 90 + sd, taper: .05, rough: .3 }); }
// 第一格：对峙。白色的地，灵梦在左，魔理沙在右，风滚草从右往左滚过去
function s5P1(c, tau, t) { const [x, y, w, h] = S5.P1, sd = tick(t, 8), gy = y + h - 70, fy = gy + 30;
  // 风：几道横向白刮痕往左飘
  if (t > S5.WEED[0] - .2 && t < S5.WEED[1] + .3) for (let k = 0; k < 4; k++) { const u = ((t - S5.WEED[0]) * 1.1 + k * .27) % 1, wx = lerp(x + w + 80, x - 160, u), wy = y + 150 + k * 52 + (k % 2) * 14;
    scratch(c, [[wx, wy], [wx + 60 + k * 18, wy - 3]], { w: 1.8, al: .55, seed: 95 + k + sd }); }
  block(c, [[x - 20, gy + 4], [x + w * .5, gy - 3], [x + w + 20, gy + 2], [x + w + 20, y + h + 20], [x - 20, y + h + 20]], K.paper, { smooth: false, amp: 1.6, freq: 16, seed: 3 + sd, grain: .8 });
  for (let k = 0; k < 5; k++) { const sx = x + 60 + k * 170 + hash(k, 4) * 60, sy = gy + 18 + (k % 2) * 30; stroke(c, [[sx, sy], [sx + 40 + hash(k, 5) * 50, sy + 1]], { w: 2, color: K.ink, dry: .35, al: .6, seed: 80 + k, smooth: false }); }
  // 影子
  fillPts(c, ellPts(x + 160, fy + 1, 30, 4.5, 0, 16), K.ink, .55); fillPts(c, ellPts(x + 720, fy + 1, 30, 4.5, 0, 16), K.ink, .55);
  // 风滚草
  const wu = sm(S5.WEED[0], S5.WEED[1], t, v => v); if (wu > 0 && wu < 1) { const wx = lerp(x + w + 40, x - 60, wu), hop = Math.abs(Math.sin(wu * 11)) * 18;
    fillPts(c, ellPts(wx, fy + 1, 16, 3, 0, 12), K.ink, .35); s5Weed(c, wx, fy - 20 - hop, 20, -wu * 40, sd); }
  // 魔理沙：2.75 猛回头看第三格，转回来，再回头；3.95 帽尖垂下来
  const [l0, l1, l2] = S5.LOOK, dir = t < l0 ? -1 : t < l1 ? 1 : t < l2 ? -1 : 1, droop = easeOutBack(clamp((t - S5.DROOP) / .2, 0, 1));
  s5ReimuSide(c, x + 160, fy, 2.4, { dir: 1, t });
  s5MarisaSide(c, x + 720, fy, 2.4, { dir, t, droop });
  if (t >= l1 && t < l2 + .35) for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * .5, hx = x + 720, hy = fy - 236; scratch(c, [[hx + Math.cos(a) * 30, hy + Math.sin(a) * 30], [hx + Math.cos(a) * 54, hy + Math.sin(a) * 54]], { w: 3, seed: 97 + k + sd }); }
  s5Bubble(c, x + 420, y + 65, [x + 668, y + 150], S5.TXT.b1, { size: 50, t, t0: S5.B1, per: .075, seed: 110 }); }
// 第二格：灵梦特写，集中线，御币指向右边那一格
function s5P2(c, tau, t) { const [x, y, w, h] = S5.P2, sd = tick(t, 8), fx = x + 610, fy = y + 215, burst = sm(S5.T2, S5.T2 + .16, tau, easeOutQuint), r = rng(40 + sd);
  for (let k = 0; k < 64; k++) { const a = k / 64 * TAU + (r() - .5) * .08, r0 = 200 + r() * 110, ww = 3 + r() * 7;
    stroke(c, [[fx + Math.cos(a) * r0, fy + Math.sin(a) * r0], [fx + Math.cos(a) * 760, fy + Math.sin(a) * 760]], { w: ww, color: K.paper, p: burst, taper: .02, wfn: f => .08 + .92 * f, smooth: false, al: .85, seed: k + sd }); }
  s5ReimuBust(c, tf(fx, fy, .9), .9, t, true);
  s5Bubble(c, x + 230, y + 72, [x + 445, y + 145], S5.TXT.b2, { size: 56, t, t0: S5.B2, per: .07, seed: 120 }); }
// 第三格（和撑满全屏之后的挂件）。g 0..1 撑开的进度
function s5P3(c, tau, t, g) { if (t < S5.DROP) return; const [x, y, w] = S5.P3, sd = tick(t, 8);
  const Ld = t < S5.LAND ? lerp(-400, 300, sm(S5.DROP, S5.LAND, t, v => v * v)) : 300 + settle(t, S5.LAND, { amp: 26, freq: 3, decay: 6 });
  const sw = t < S5.LAND ? 0 : settle(t, S5.LAND, { amp: .07, freq: 1.1, decay: 2.2, phase: .4 }), sp = s5Spin(t);
  const ax = lerp(x + w / 2, S5.A1, g), ay = lerp(y, S5.ROD, g), L = lerp(Ld, S5.LC, g), s = lerp(1.1, S5.CS, g), cy0 = ay + (L + 214) * s;
  if (g > 0) s5Rod(c, t, g);
  // 停下后背后几道光（刮痕线），撑开时收掉
  if (t >= S5.SPIN[3] && g <= 0) { const u = sm(S5.SPIN[3], S5.SPIN[3] + .2, t, easeOutQuint); for (let k = 0; k < 20; k++) { const a = k / 20 * TAU + .08, r0 = 250 + (k % 2) * 30;
    scratch(c, [[ax + Math.cos(a) * r0, cy0 + Math.sin(a) * r0], [ax + Math.cos(a) * (r0 + 260 * u), cy0 + Math.sin(a) * (r0 + 260 * u)]], { w: 2.2, al: .6, seed: 130 + k + sd }); } }
  // 转得快时两边的弧形速度线
  const om = Math.abs(s5Spin(t + 1 / 24) - s5Spin(t - 1 / 24)) * 12; if (om > 5 && g <= 0) { const al = clamp((om - 5) / 10, 0, .85);
    for (const d of [-1, 1]) for (let j = 0; j < 2; j++) { const rr = 175 + j * 26, pts = []; for (let k = 0; k <= 12; k++) { const a = (d > 0 ? 0 : Math.PI) + (k / 12 - .5) * .9; pts.push([ax + Math.cos(a) * rr * s, cy0 + Math.sin(a) * rr * 1.25 * s]); }
      scratch(c, pts, { w: 3 - j, al: al * (1 - j * .3), seed: 140 + j + d + sd }); } }
  s5Charm(c, ax, ay, { L, s, spin: sp, swing: sw * (1 - g), print: 'full', t });
  // 停下的一瞬：几道短的冲击线
  const iu = (t - S5.SPIN[3]) / .25; if (iu >= 0 && iu < 1 && g <= 0) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + .2, r0 = 200 * s + 40 * iu;
    scratch(c, [[ax + Math.cos(a) * r0, cy0 + Math.sin(a) * r0 * 1.2], [ax + Math.cos(a) * (r0 + 60 * (1 - iu)), cy0 + Math.sin(a) * (r0 + 60 * (1 - iu)) * 1.2]], { w: 4, seed: 150 + k + sd }); } }
// s5Rod：全屏那一页挂挂件的横杆（从右往左画出来）
function s5Rod(c, t, p) { const sd = tick(t, 8); stroke(c, [[W + 40, S5.ROD], [1020, S5.ROD]], { w: 7, color: K.paper, p, seed: 160 + sd, taper: .02, rough: .2, smooth: false });
  if (p >= 1) fillPts(c, ellPts(1020, S5.ROD, 10, 10, 0, 14), K.paper); }

// ===================== 一页漫画 → 全屏挂件和价格 =====================
function s5Page(c, tau, t) { const g = sm(S5.GROW[0], S5.GROW[1], tau, easeInOutQuint), off = -1200 * sm(S5.GROW[0], S5.GROW[0] + .3, tau, easeIn);
  c.save(); c.translate(off, 0);
  s5Panel(c, S5.P1, tau, S5.T1, 11, () => s5P1(c, tau, t));
  s5Panel(c, S5.P2, tau, S5.T2, 13, () => s5P2(c, tau, t));
  c.restore();
  const r = S5.P3.map((v, k) => lerp(v, [-40, -40, W + 80, H + 80][k], g)); s5Panel(c, r, tau, S5.T3, 15, () => s5P3(c, tau, t, g)); }
function s5Card(c, tau, t) { const fu = d => Math.max(0, t - S5.FALL - d), drop = s5Drop;
  // 横杆和两个挂件：9.9 一起掉下去
  const u0 = fu(0), u1 = fu(.03), u2 = fu(.07);
  c.save(); c.translate(0, drop(u0)); if (u0 > 0) { c.translate(1020, S5.ROD); c.rotate(u0 * .6); c.translate(-1020, -S5.ROD); } s5Rod(c, t, 1); c.restore();
  const idle = ph => .018 * Math.sin((t - S5.GROW[1]) * 2.2 + ph) * Math.min(1, (t - S5.GROW[1]) * 2);
  s5Charm(c, S5.A1, S5.ROD + drop(u1), { s: S5.CS, spin: TAU, swing: idle(0) + u1 * 1.5, print: 'full', t, glint: sm(S5.GLINT, S5.GLINT + .5, t, v => v) * (t < S5.GLINT + .5 ? 1 : -1) });
  if (t >= S5.K2[0]) { const k = sm(S5.K2[0], S5.K2[1], tau, easeOutQuint), ax = lerp(W + 330, S5.A2, k), sw = t < S5.K2[1] ? -.22 * Math.sin(Math.PI * k) : settle(t, S5.K2[1], { amp: .16, freq: 1.1, decay: 3 });
    s5Charm(c, ax, S5.ROD + drop(u2), { s: S5.CS, spin: 0, swing: sw + idle(1.3) - u2 * 1.2, print: 'bust', t, glint: sm(S5.GLINT + .15, S5.GLINT + .65, t, v => v) * (t < S5.GLINT + .65 ? 1 : -1) }); }
  // 输了的魔理沙从右下角画框边探出头来，帽尖还耷拉着；8.9 叹一口气（帽尖晃一下）
  const pk = easeOutBack(sm(S5.PEEK, S5.PEEK + .25, t, v => v)), sigh = settle(t, S5.PEEK + 1, { amp: .12, freq: 2, decay: 5 });
  if (pk > 0) s5MarisaSide(c, 1610, lerp(1500, 1250, pk) + drop(fu(.1)), 3, { dir: -1, t, droop: 1 + sigh });
  // 字：「赢」另画（收尾时它留下来）
  S5.LINES.forEach((L, j) => s5Line(c, L, t, j === 0 ? S5.YI : -1));
  // 「8元/套」下面一道手画的线
  const P1L = S5.LINES[2], x0 = S5.TX + zhWidth(c, '亚克力挂件 ', P1L.size, ZH, 500), x1 = S5.TX + zhWidth(c, P1L.s, P1L.size, ZH, 500), uu = fu(.05);
  if (s5DropOk(uu)) stroke(c, [[x0 - 4, P1L.y + 28 + drop(uu)], [lerp(x0, x1, .5), P1L.y + 33 + drop(uu)], [x1 + 8, P1L.y + 26 + drop(uu)]], { w: 6, color: K.paper, p: sm(S5.UNDER, S5.UNDER + .25, t, easeOut), seed: 170 + tick(t, 8), dry: .12 }); }
// s5Drop：9.9 之后掉下去的距离（先往上一跳，再重重落下，0.5 秒内全部掉出画面）
const s5Drop = u => 4200 * u * u - 110 * u, s5DropOk = u => s5Drop(u) < 1100;
function s5Ying(c, tau, t) { const L = S5.LINES[0], m = s5Mids(c, L.s, L.size, L.weight, S5.TX)[S5.YI], pk = clamp(writeP(t, L.t0, L.s, L.per) * [...L.s].length - S5.YI, 0, 1); if (pk <= 0) return;
  const u = sm(S5.ZOOM[0], S5.ZOOM[1], tau, easeInOutQuint), size = L.size * Math.pow(S5.YING / L.size, u);
  s5YingAt(c, lerp(m, CX, u), lerp(L.y - S5.YC * L.size, CY, u), size, pk); }
function s5Main(c, tau) { const t = twos(tau); setView(null); inkBg(c);
  if (tau < S5.GROW[1]) s5Page(c, tau, t); else { s5Card(c, tau, t); s5Ying(c, tau, t); }
  caption(c, S5.TXT.cap, tau, S5.CAP[0], { t1: S5.CAP[1] }); }

// ===================== 收尾：黑底白字的「赢」→ 黑点 =====================
// 墨底从四边慢慢收成方块（先慢后快再慢，纸从四边一点点露出来，不闪；纹理锚在画面原点，和 inkBg 一样）；停住；方块连字缩成画面正中的黑点
function s5End(c, tau) { const t = twos(tau), sd = tick(t, 8); setView(null); paperBg(c);
  if (tau < S5.DOT[0]) { const u = sm(S5.BOX[0], S5.BOX[1], tau, easeIO), R = S5.BOXR, x0 = lerp(-60, CX - R, u), x1 = lerp(W + 60, CX + R, u), y0 = lerp(-60, CY - R, u), y1 = lerp(H + 60, CY + R, u);
    block(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], K.ink, { smooth: false, amp: 2.4, freq: 26, seed: 20 + sd, grain: 1, anchor: [0, 0] });
    s5YingAt(c, CX, CY, S5.YING); return; }
  // 先鼓一下，一口气缩下去，最后弹到正好 DOT_R（最后几帧的形、种子、纹理和 handoffDot 一样）
  const [d0, d1] = S5.DOT, u1 = sm(d0, d0 + .1, tau, easeOut), u2 = sm(d0 + .1, d1 - .09, tau, easeIn), u3 = sm(d1 - .09, d1, tau, easeOut);
  const r = u2 < 1 ? lerp(lerp(S5.BOXR, S5.BOXR * 1.08, u1), DOT_R * .8, u2) : lerp(DOT_R * .8, DOT_R, u3), n = lerp(16, 2, u2), done = u2 >= 1;
  const pts = Array.from({ length: 40 }, (_, k) => { const a = k / 40 * TAU, ca = Math.cos(a), sa = Math.sin(a); return [CX + r * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n), CY + r * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / n)]; });
  block(c, pts, K.ink, done ? { amp: 1.2, seed: 7, grain: .4 } : { amp: lerp(2.4, 1.2, u2), seed: 20 + sd, grain: lerp(1, .4, u2) });
  const gs = S5.YING * r / S5.BOXR * (1 - u2); if (gs > 24) s5YingAt(c, CX, CY, gs); }

scene({ order: 5, key: 'win', name: '会赢的', dur: S5.END, fn: (c, tau) => {
  if (tau < .15) handoffBlack(c);
  else if (tau < S5.ZOOM[1]) s5Main(c, tau);
  else if (tau < S5.OUT) s5End(c, tau);
  else handoffDot(c);
} });
