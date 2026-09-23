'use strict';
// 第 3 段 帕秋莉的炼金工坊（14.55 秒）。双色油印：只用灰青 K.teal、赭 K.ochre，加墨、纸、灰；墙面是纸加细网点。
// 一间只点一盏灯的魔药吧台。现场活动：同学「@」cos 帕秋莉当魔药师，六种饮料瓶上贴着对应角色，
// 他拿三种混在一起给人尝，猜是哪些角色，按猜对的数量给奖励（吧唧、决策币）。
//   0      只画 handoffBlack，接第 2 段
//   0.15   黑暗里刮出一盏吊灯；0.55 灯亮（闪一下再亮稳），照出吧台：墙上一排六瓶饮料、台后魔药师的木刻剪影、台上一只烧瓶
//   1.2    吧台正面写「@ 在现场当魔药师调制饮料」，剪影旁写「@」
//   1.8    包袱：太田顺也啤酒往前挤，飞来的魔导书把它拍回去；三瓶轮流跳下来倒进烧瓶（倒时瓶身转过去、标签朝后）；
//          第三次啤酒终于被选上，一倒就冒泡溢出来
//   7.95   烧瓶一抖搅成一瓶魔药，魔导书把它推到观众面前，冒出问号烟，写「猜是来自哪些角色」
//   9.55   三个空格依次打钩，写「根据猜对数量决定奖励」，台上出现吧唧和决策币
//   12.35  烧瓶打嗝、一歪，魔药倒出来；镜头往下摇，药水落到地上，沿 STREAM 流成横贯画面的小溪线
//   14.4   只画 handoffStream，交给第 4 段
// 屏上文字全部抄自 docs/素材事实.md。烧瓶、倒液、问号烟、流成小溪线的画法取自第一稿（分支 salvage/alchemy-v1）。

const S3 = {
  END: 14.55, IN: .15, OUT: .15,                       // 总长；开头交接黑场、结尾交接小溪线各占多久
  L: { x: 880, y: 160, hw: 130, slope: .22 },           // 吊灯：灯罩下沿中心、半宽；光锥边每横走 1 往下 slope
  on: [.55, .63, .72],                                 // 灯亮、闪灭、再亮
  ctr: 800, floor: 1100, drop: 1536,                   // 吧台台面、吧台底（地面）；drop 结尾镜头往下摇的距离（512 的倍数，纸纹和交接画面对得上）
  shelf: { x0: 64, x1: 1066, y: 600 },                 // 墙上放饮料的搁板
  F: { x: 1175, y: 700, r: 100, nw: 46, nh: 95 },      // 烧瓶：球心、半径、瓶颈宽、瓶颈长（台面上的位置）
  push: { x: 1175, y: 725, s: 1.35 }, pushT: [8.3, 8.55],   // 推到观众面前以后的位置和放大倍数
  mage: 1500,                                          // 魔药师剪影的中心线
  cap: [.8, 12.5],                                     // 展签出现、收起
  sig: { x: 1258, y: 566, t0: 1.0 },                   // 剪影旁的署名「@」
  sub: { text: '@ 在现场当魔药师调制饮料', x: 96, y: 958, t0: 1.2, t1: 8.3 },
  guess: { text: '猜是来自哪些角色', x: 96, y: 906, t0: 8.7 },
  prize: { text: '根据猜对数量决定奖励', x: 1330, y: 958, t0: 9.8 },
  boxes: { x: 100, y: 948, s: 56, gap: 92, t0: 9.55, ticks: [10.0, 10.25, 10.5] },
  badge: { x: 1578, y: 736, r: 56, t0: 10.65 }, coin: { x: 1762, y: 748, r: 48, t0: 10.85 },
  // 三次挑瓶：k 是第几瓶，a 开始转身，lv 倒完后液面高度（占烧瓶直径）
  picks: [{ k: 1, a: 2.6, lv: .2 }, { k: 3, a: 4.6, lv: .38 }, { k: 5, a: 6.55, lv: .56 }],
  // 啤酒三次往前挤：a 挤出来，hit 被书拍（最后一次是被书轻轻点中）
  nudges: [{ a: 1.8, hit: 2.25 }, { a: 4.0, hit: 4.4 }, { a: 5.95, hit: 6.45, yes: true }],
  // 魔导书四次飞出去：a 起飞，hit 拍下 / 点中 / 推烧瓶，b 回到胸前
  flights: [{ a: 1.98, hit: 2.25, b: 2.62 }, { a: 4.13, hit: 4.4, b: 4.78 }, { a: 6.08, hit: 6.45, b: 6.86, soft: true }, { a: 8.0, hit: 8.3, b: 8.95, push: true }],
  foam: [7.1, 7.32, 7.62, 7.78, 8.05],                 // 啤酒沫：往上冒、冒出瓶口、流到最低、开始退、退完
  mix: [7.95, 8.2],                                    // 烧瓶一抖，搅成一瓶魔药
  smoke: [8.6, 9.3], lift: [9.3, 9.55], dot: 9.45,     // 问号烟长出来、和瓶口断开、点弹出来
  q: { x: 1175, y: 346, s: 200 },                      // 问号：竖笔底、大小
  cheer: [11.35, 11.65],                              // 啤酒在搁板上蹦两下
  burp: 12.35, tip: [12.6, 12.85], pan: [13.15, 13.95],
  head: [12.82, 13.4], tail: [13.65, 14.05], spread: [13.5, 14.05], xImp: 660,
};
S3.faint = mix(K.paper, K.teal, .3);                   // 背景线稿的颜色：纸上一层很淡的灰青
const S3R = 2.2, S3NX = 70;                            // 倒饮料时瓶子的角度；啤酒往前挤的距离

// ===================== 六瓶饮料 =====================
// 瓶形：prof 是 [从瓶底往上的高度比例, 半宽比例]，从瓶底画到瓶颈顶；cap [起, 止, 半宽]；lab 标签中心的高度比例
const S3SHAPE = {
  juice: { prof: [[0, .45], [.03, .5], [.62, .5], [.7, .42], [.76, .24], [.86, .24]], cap: [.86, 1, .29], lab: .33 },
  cola: { prof: [[0, .44], [.03, .48], [.13, .5], [.33, .41], [.5, .47], [.6, .44], [.8, .2], [.91, .17]], cap: [.91, 1, .2], lab: .31 },
  soda: { prof: [[0, .46], [.03, .5], [.55, .5], [.78, .2], [.9, .18]], cap: [.9, 1, .21], lab: .3 },
  peach: { prof: [[0, .4], [.04, .47], [.15, .5], [.46, .5], [.62, .42], [.72, .25], [.8, .22], [.88, .22]], cap: [.88, 1, .27], lab: .33 },
  tea: { prof: [[0, .47], [.02, .5], [.1, .5], [.14, .45], [.18, .5], [.64, .5], [.73, .3], [.8, .22], [.88, .22]], cap: [.88, 1, .25], lab: .45 },
  beer: { prof: [[0, .46], [.03, .5], [.56, .5], [.66, .4], [.74, .2], [.94, .18]], cap: [.94, 1, .21], lab: .28 },
};
// 饮料名一字不改（lines 只是折行），标志是标签上的小角色标志
const S3B = [
  { lines: ['阿求', '热带', '风味'], kind: 'juice', mark: 'flower', w: 136, h: 330, col: K.ochre, capCol: K.teal, liq: K.ochre },
  { lines: ['赫卡', '可乐'], kind: 'cola', mark: 'planet', w: 104, h: 340, col: K.ink, capCol: K.ochre, liq: K.g3 },
  { lines: ['慧音', '雪碧'], kind: 'soda', mark: 'hat', w: 108, h: 350, col: K.teal, capCol: mix(K.teal, K.ink, .55), liq: K.teal },
  { lines: ['天子', '水蜜桃'], kind: 'peach', mark: 'peach', w: 140, h: 290, col: mix(K.ochre, K.paper, .4), capCol: K.ink, liq: mix(K.ochre, K.paper, .35) },
  { lines: ['早苗', '绿茶'], kind: 'tea', mark: 'frog', w: 116, h: 320, col: mix(K.teal, K.ink, .38), capCol: K.card, liq: K.teal },
  { lines: ['太田', '顺也', '啤酒'], kind: 'beer', mark: 'mug', w: 100, h: 370, col: mix(K.ochre, K.ink, .5), capCol: K.ochre, liq: K.ochre },
];
S3B.forEach((b, k) => { b.x = 170 + k * 162; b.seed = 600 + k * 40; });

// s3Mark：标签上的角色标志。(x, y) 中心，s 大小
//   flower 阿求的花发饰  planet 赫卡提亚头上的星球  hat 慧音的帽子  peach 天子帽上的桃子  frog 早苗的蛙和蛇发饰  mug ZUN 的啤酒杯
function s3Mark(c, kind, x, y, s, sd) { const ln = { w: 2.2, seed: sd, rough: .25 };
  if (kind === 'flower') { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k / 5 * TAU, pts = ellPts(x + Math.cos(a) * s * .25, y + Math.sin(a) * s * .25, s * .19, s * .15, a, 14);
      fillPts(c, pts, mix(K.ochre, K.paper, .55)); outline(c, pts, { ...ln, w: 1.8, seed: sd + k }); }
    block(c, ellPts(x, y, s * .11, s * .11, 0, 10), K.ochre, { amp: .4, seed: sd + 7, grain: 0 }); return; }
  if (kind === 'planet') { const ring = ellPts(x, y, s * .52, s * .15, -.32, 32), ball = ellPts(x, y, s * .28, s * .28, 0, 22);
    stroke(c, ring.slice(16).concat([ring[0]]), { ...ln, taper: .1 }); block(c, ball, K.teal, { amp: .5, seed: sd + 1, grain: .4 }); outline(c, ball, { ...ln, w: 1.8, seed: sd + 2 });
    stroke(c, [[x - s * .12, y - s * .1], [x + s * .06, y - s * .16]], { w: 1.6, color: K.paper, seed: sd + 4, al: .8 }); stroke(c, ring.slice(0, 17), { ...ln, seed: sd + 3, taper: .1 }); return; }
  if (kind === 'hat') { const hp = [[x - s * .32, y + s * .24], [x - s * .32, y - s * .06], [x, y - s * .38], [x + s * .32, y - s * .06], [x + s * .32, y + s * .24]];
    block(c, hp, K.teal, { smooth: false, amp: .5, seed: sd, grain: .4 }); outline(c, hp, { ...ln, w: 1.8, smooth: false });
    stroke(c, [[x - s * .46, y + s * .27], [x + s * .46, y + s * .26]], { w: 3, seed: sd + 2, smooth: false, taper: .1 });
    for (const d of [-1, 1]) block(c, [[x, y + s * .06], [x + d * s * .2, y - s * .05], [x + d * s * .2, y + s * .17]], K.ochre, { smooth: false, amp: .4, seed: sd + 3 + d, grain: 0 }); return; }
  if (kind === 'peach') { const pp = heartPts(x, y + s * .06, s * .3, Math.PI, 30);
    for (const d of [-1, 1]) block(c, ellPts(x + d * s * .16, y - s * .3, s * .15, s * .07, d * .5, 12), K.teal, { amp: .4, seed: sd + 5 + d, grain: 0 });
    block(c, pp, mix(K.ochre, K.paper, .2), { amp: .5, seed: sd, grain: .3 }); outline(c, pp, { ...ln, w: 1.8 });
    stroke(c, [[x, y - s * .24], [x - s * .08, y - s * .02], [x - s * .02, y + s * .22]], { w: 1.6, seed: sd + 2, taper: .5 }); return; }
  if (kind === 'frog') { const fx = x - s * .18, fb = ellPts(fx, y + s * .1, s * .24, s * .17, 0, 18);
    block(c, fb, K.teal, { amp: .5, seed: sd, grain: .3 }); outline(c, fb, { ...ln, w: 1.8 });
    for (const d of [-1, 1]) { const e = ellPts(fx + d * s * .12, y - s * .07, s * .085, s * .085, 0, 12); fillPts(c, e, K.card); outline(c, e, { ...ln, w: 1.5, seed: sd + 3 + d }); fillPts(c, ellPts(fx + d * s * .12, y - s * .06, s * .035, s * .035, 0, 8), K.ink); }
    stroke(c, [[x + s * .12, y + s * .32], [x + s * .36, y + s * .2], [x + s * .14, y + s * .04], [x + s * .34, y - s * .12], [x + s * .22, y - s * .28]], { w: 3.4, seed: sd + 6, taper: .45 });
    fillPts(c, ellPts(x + s * .22, y - s * .3, s * .07, s * .055, -.5, 10), K.ink); return; }
  if (kind === 'mug') { const mb = rectPts(x - s * .28, y - s * .06, s * .4, s * .4);
    stroke(c, [[x + s * .12, y + s * .02], [x + s * .3, y + s * .04], [x + s * .3, y + s * .22], [x + s * .12, y + s * .26]], { w: 2.6, seed: sd + 1, taper: .1 });
    block(c, mb, K.ochre, { smooth: false, amp: .5, seed: sd, grain: .3 }); outline(c, mb, { ...ln, w: 1.8, smooth: false });
    const puffs = [[-.2, -.1, .12], [-.06, -.15, .13], [.08, -.1, .11]];
    for (const [u, v, r] of puffs) fillPts(c, ellPts(x + u * s, y + v * s, r * s + 1.8, r * s + 1.8, 0, 12), K.ink);
    for (const [u, v, r] of puffs) fillPts(c, ellPts(x + u * s, y + v * s, r * s, r * s, 0, 12), K.card); } }

// s3Label：瓶身正面的标签：纸色方块、角色标志、手写饮料名（折行不改字）。画在标签中心为原点的局部坐标里
function s3Label(c, b, sd) { const fs = 36, lh = 40, em = b.kind === 'beer' ? 0 : 40, tw = Math.max(...b.lines.map(l => zhWidth(c, l, fs, ZH, 500)));
  const lw = Math.min(b.w - 6, tw + 22), hh = em + b.lines.length * lh + 16, y0 = -hh / 2, box = rectPts(-lw / 2, y0, lw, hh);
  block(c, box, K.card, { smooth: false, amp: .7, seed: sd, grain: .5, anchor: [0, 0] }); outline(c, box, { w: 2, seed: sd + 1, smooth: false, rough: .3 });
  if (em) s3Mark(c, b.mark, 0, y0 + 6 + em / 2, 32, sd + 3);
  b.lines.forEach((l, k) => zh(c, l, 0, y0 + em + 6 + k * lh + fs * .88, { size: fs, align: 'center', weight: 500, seed: 30 + k, tilt: .01, jitter: .01 })); }
// s3BackLabel：瓶身背面的小标签：只有几道看不清的线（转过去以后看不出是哪一瓶）
function s3BackLabel(c, b, sd) { const lw = b.w * .56, hh = 70, box = rectPts(-lw / 2, -hh / 2, lw, hh);
  block(c, box, K.card, { smooth: false, amp: .7, seed: sd, grain: .5, anchor: [0, 0] }); outline(c, box, { w: 2, seed: sd + 1, smooth: false, rough: .3 });
  for (let k = 0; k < 3; k++) { const pts = []; for (let u = -lw / 2 + 10; u <= lw / 2 - 10 - (k === 2 ? 18 : 0); u += 6) pts.push([u, -18 + k * 18 + Math.sin(u * .4 + k) * 2]); stroke(c, pts, { w: 1.8, color: K.g3, seed: sd + 3 + k }); } }
// s3Bottle：一瓶饮料。st：x, y 瓶子中心；rot 绕中心转；face 转身的角度（0 正面，π 背面）；sq 落地压扁（瓶底不动）；cap 盖子在不在
function s3Bottle(c, b, st, t) { const { w, h } = b, sh = S3SHAPE[b.kind], sd = b.seed + tick(t), th = st.face || 0, sq = st.sq || 0, dark = hsl(b.col)[2] < .4, deco = dark ? K.paper : K.ink;
  c.save(); c.translate(st.x, st.y); c.rotate(st.rot || 0); c.translate(0, h / 2); c.scale(1 + sq * .5, 1 - sq);
  const side = sh.prof.map(([v, u]) => [-u * w, -v * h]), body = [...side, ...side.slice().reverse().map(([u, v]) => [-u, v])];
  block(c, body, b.col, { smooth: false, amp: 1.1, seed: sd, grain: .6, anchor: [0, 0] });
  outline(c, body, { w: 2.4, color: K.ink, seed: sd + 1, smooth: false, rough: .25 });
  // 瓶身的棱：汽水瓶上下两圈，茶瓶腰上一圈握把
  const rib = (v, al = .5) => stroke(c, [[-w * .46, -v * h], [w * .46, -v * h]], { w: 1.8, color: deco, seed: sd + 3 + v * 100, al, smooth: false, dry: .2 });
  if (b.kind === 'soda') [.07, .1, .5].forEach(v => rib(v)); if (b.kind === 'tea') [.12, .16].forEach(v => rib(v, .6));
  if (st.cap !== false) { const [c0, c1, cu] = sh.cap, cp = rectPts(-cu * w, -c1 * h, cu * 2 * w, (c1 - c0) * h + 1); block(c, cp, b.capCol, { smooth: false, amp: .6, seed: sd + 5, grain: .4 }); outline(c, cp, { w: 2, seed: sd + 6, smooth: false }); }
  // 高光：左边一道竖的纸色刮痕（光从灯那边来，转身时不动）
  scratch(c, [[-w * .32, -h * .07], [-w * .33, -h * (sh.lab + .02)]], { w: 3.4, seed: sd + 7, al: dark ? .7 : .9 });
  const R = w * .42, a = Math.cos(th), sn = Math.sin(th), ly = -sh.lab * h;
  if (a > .03) { c.save(); c.translate(R * sn, ly); c.scale(a, 1); s3Label(c, b, sd + 10); c.restore();
    if (b.kind === 'beer') { c.save(); c.translate(R * .4 * sn, -h * .84); c.scale(a, 1); const nl = rectPts(-23, -24, 46, 48); block(c, nl, K.card, { smooth: false, amp: .6, seed: sd + 12, grain: .4, anchor: [0, 0] }); outline(c, nl, { w: 1.8, seed: sd + 13, smooth: false }); s3Mark(c, 'mug', 0, 2, 30, sd + 14); c.restore(); } }
  if (-a > .03) { c.save(); c.translate(-R * sn, ly); c.scale(-a, 1); s3BackLabel(c, b, sd + 20); c.restore(); }
  c.restore(); }
// s3Mouth：瓶子此刻的瓶口（瓶颈顶）在画面上的位置
function s3Mouth(b, st) { const dm = S3SHAPE[b.kind].cap[0] * b.h - b.h / 2; return [st.x + dm * Math.sin(st.rot), st.y - dm * Math.cos(st.rot)]; }
// s3PourPos：倒饮料时瓶子中心的位置：瓶口停在烧瓶口左上方
function s3PourPos(b) { const F = S3.F, dm = S3SHAPE[b.kind].cap[0] * b.h - b.h / 2, mx = F.x - 10, my = F.y - F.r - F.nh - 34; return [mx - dm * Math.sin(S3R), my + dm * Math.cos(S3R)]; }
// s3Nudge：啤酒往前挤、被书拍回去（最后一次被点中）
function s3Nudge(t) { let dx = 0, lift = 0, rot = 0, sq = 0;
  for (const n of S3.nudges) { if (t < n.a) break; const u = t - n.a; dx = 0; lift = 0; rot = 0; sq = 0;
    if (u < .15) { const p = sm(0, .15, u, easeOut); dx = S3NX * p; lift = 36 * Math.sin(Math.PI * p); rot = .16 * p; }
    else if (t < n.hit) { const v = u - .15; dx = S3NX; lift = 18 * Math.abs(Math.sin(v * 3 * Math.PI)); rot = .16 + .05 * Math.sin(v * 6 * Math.PI); }   // 蹦着：选我选我
    else if (n.yes) { if (t < n.hit + .3) { dx = S3NX; rot = .16; sq = .14 * Math.sin(Math.PI * sm(n.hit, n.hit + .1, t, v => v)); } }                  // 被轻轻点了一下：选上了（之后由挑瓶接手）
    else { const p = sm(n.hit + .08, n.hit + .34, t, easeOutQuint); dx = S3NX * (1 - p); sq = .34 * (1 - sm(n.hit + .04, n.hit + .3, t)); rot = .16 * (1 - p) + settle(t, n.hit + .34, { amp: .07, freq: 3, decay: 6 }); } }
  return { dx, lift, rot, sq }; }
// s3BottleState：第 k 瓶此刻的姿态。挑中的那瓶：原地转身（标签朝后）→ 跳到烧瓶口 → 倒 → 跳回搁板 → 转回正面
function s3BottleState(k, t) { const b = S3B[k], y0 = S3.shelf.y - b.h / 2; let st = { x: b.x, y: y0, rot: 0, face: 0, sq: 0, cap: true, moving: false };
  if (k === 5) { const n = s3Nudge(t); st = { ...st, x: b.x + n.dx, y: y0 - n.lift, rot: n.rot, sq: n.sq, moving: n.dx > .5 || n.lift > .5 };
    // 终于被选上了：停在搁板上得意地蹦两下
    for (const h of S3.cheer) { const u = sm(h, h + .2, t, v => v); if (u > 0 && u < 1) { st.y = y0 - 30 * Math.sin(Math.PI * u); st.rot = .08 * Math.sin(TAU * u); } else if (t >= h + .2 && t < h + .3) st.sq = .16 * Math.sin(Math.PI * (t - h - .2) / .1); } }
  const pk = S3.picks.find(p => p.k === k && t >= p.a && t < p.a + 1.4); if (!pk) return st;
  const n0 = k === 5 ? s3Nudge(pk.a) : { dx: 0, lift: 0, rot: 0 }, u = t - pk.a, from = [b.x + n0.dx, y0 - n0.lift], rot0 = n0.rot, to = s3PourPos(b), home = [b.x, y0];
  st = { ...st, x: from[0], y: from[1], rot: rot0, sq: 0, moving: true };
  if (u < .2) return { ...st, face: Math.PI * sm(0, .2, u, v => v) };
  if (u < .45) { const e = sm(.2, .45, u, easeInOutSine), [x, y] = arc(from, to, e, 170); return { ...st, x, y, sq: 0, face: Math.PI, rot: lerp(rot0, S3R, sm(.26, .45, u, easeOutBack)), cap: u < .3 }; }
  if (u < .95) return { ...st, x: to[0], y: to[1], sq: 0, face: Math.PI, rot: S3R + Math.sin(u * 34) * .04, cap: false, pour: [sm(.45, .55, u, easeIn), sm(.85, .95, u, easeIn)] };
  if (u < 1.2) { const e = sm(.95, 1.2, u, easeInOutSine), [x, y] = arc(to, home, e, 90); return { ...st, x, y, sq: 0, face: Math.PI, rot: S3R * (1 - sm(.95, 1.15, u, easeInOutQuint)), cap: false }; }
  return { ...st, x: home[0], y: home[1], rot: 0, sq: .22 * Math.sin(Math.PI * sm(1.2, 1.3, u, v => v)), cap: true, face: Math.PI + Math.PI * sm(1.24, 1.4, u, v => v) }; }

// ===================== 烧瓶 =====================
// 烧瓶轮廓（局部坐标，原点在球心）：瓶口左 → 瓶颈 → 绕球一圈 → 瓶口右
const S3FP = (() => { const { r, nw, nh } = S3.F, a0 = Math.asin(nw / 2 / r), pts = [[-nw / 2, -r - nh]];
  for (let k = 0; k <= 44; k++) { const th = -Math.PI / 2 - a0 - k / 44 * (TAU - 2 * a0); pts.push([Math.cos(th) * r, Math.sin(th) * r]); }
  pts.push([nw / 2, -r - nh]); return pts; })();
// s3FlaskState：烧瓶此刻的位置、放大、角度（挤沫时晃、搅匀时抖、被推到前面、打嗝、一歪）
function s3FlaskState(t) { const F = S3.F, P = S3.push, k = sm(S3.pushT[0], S3.pushT[1], t, easeOutBack);
  let x = lerp(F.x, P.x, k), y = lerp(F.y, P.y, k); const s = lerp(1, P.s, k);
  if ((t >= S3.mix[0] && t < S3.mix[1]) || (t >= S3.burp && t < S3.burp + .2)) x += (hash(Math.floor(t * 24), 7) - .5) * 14;
  if (t >= S3.foam[1] && t < S3.foam[3]) x += (hash(Math.floor(t * 24), 9) - .5) * 6;
  y -= 22 * Math.sin(Math.PI * sm(S3.burp + .2, S3.burp + .32, t, v => v));
  const rot = -1.3 * sm(S3.tip[0], S3.tip[1], t, easeInBack) - settle(t, S3.tip[1], { amp: .08, freq: 2.2, decay: 5 });
  return { x, y, s, rot }; }
// s3Flask：大圆底烧瓶。inner(T) 在玻璃里面画药水；返回局部 → 画面的变换
function s3Flask(c, t, st, inner) { const F = S3.F, s = st.s, T = tf(st.x, st.y, s, st.rot), sd = tick(t), pts = M(T, S3FP), glass = polyPath(pts);
  const arcPts = (r, a0, a1) => { const out = []; for (let a = a0; a <= a1; a += 5) out.push([Math.cos(a * Math.PI / 180) * r, Math.sin(a * Math.PI / 180) * r]); return out; };
  c.fillStyle = K.card; c.fill(glass); texture(c, glass, 'paper', .5, st.x, st.y);
  [[.9, -58, 52], [.83, -42, 38]].forEach(([k, a0, a1], j) => stroke(c, M(T, arcPts(F.r * k, a0, a1)), { w: (2.4 - j * .4) * s, seed: 379 + j + sd, al: .7, taper: .5 }));
  if (inner) { c.save(); c.clip(glass); inner(T); c.restore(); }
  stroke(c, pts, { w: 6.5 * s, color: K.ink, seed: 371 + sd, taper: .04, rough: .2 });
  block(c, M(T, rectPts(-F.nw * .74, -F.r - F.nh - 9, F.nw * 1.48, 15)), K.ink, { smooth: false, amp: .8, seed: 373 + sd, grain: .3 });
  scratch(c, M(T, arcPts(F.r * .8, 128, 168)), { w: 5 * s, seed: 375 + sd, al: .85 });
  stroke(c, M(T, arcPts(F.r * .74, 212, 232)), { w: 3.2 * s, seed: 376 + sd, al: .7 }); stroke(c, M(T, arcPts(F.r * .62, 238, 246)), { w: 2.6 * s, seed: 377 + sd, al: .7 });
  stroke(c, M(T, [[-F.nw * .22, -F.r - F.nh + 18], [-F.nw * .22, -F.r - 22]]), { w: 2.4 * s, seed: 378 + sd, al: .6, smooth: false });
  return T; }
// s3Ring：托着圆底的软木圈（不跟着烧瓶歪）
function s3Ring(c, t, st) { const F = S3.F, y = st.y + F.r * st.s * .95 + 4; block(c, ellPts(st.x, y, 50 * st.s, 11 * st.s, 0, 24), K.ink, { amp: 1, seed: 381 + tick(t), grain: .5 });
  scratch(c, [[st.x - 34 * st.s, y - 3 * st.s], [st.x + 20 * st.s, y - 5 * st.s]], { w: 2, seed: 382 + tick(t), al: .6 }); }
// s3Liquid：一层药水（水面有波纹），(x, top) 水面中心，返回 Path2D
function s3Liquid(c, t, x, top, color, o = {}) { const { amp = 3, seed = 1, ph = 0, streaks = 2, s = 1 } = o, x0 = x - 420 * s, x1 = x + 420 * s, pts = [];
  for (let u = x0; u <= x1; u += 18) pts.push([u, top + Math.sin(u * .045 / s + t * 7 + ph) * amp * s]);
  pts.push([x1, top + 800], [x0, top + 800]); return block(c, pts, color, { smooth: false, amp: 1.2, seed: seed + tick(t), streaks, grain: .7, dir: -.1, anchor: [x, top] }); }
// s3Bubbles：药水里往上冒的小泡（纸色小圈）
function s3Bubbles(c, t, st, top, n = 7, speed = .8) { const F = S3.F, base = st.y + F.r * st.s;
  for (let k = 0; k < n; k++) { const ph = (t * speed + k / n) % 1, x = st.x + Math.sin(k * 2.4 + 1) * F.r * st.s * .5, y = lerp(base - 14, top + 4, ph), rr = (4 + (k % 3) * 2.6) * st.s;
    if (y > top + 6) stroke(c, ellPts(x, y, rr, rr, 0, 12), { close: true, w: 2.2, color: K.paper, seed: 391 + k + tick(t), taper: 0, rough: .2 }); } }
// 液面：三次倒进去的饮料一层层叠上去；搅匀以后是一瓶灰青魔药，里面一道赭色漩涡（正片叠底，像油印两色套印）
function s3Levels(t) { const out = []; let prev = 0; for (const p of S3.picks) { const a = p.a + .5; if (t < a) break; out.push({ col: S3B[p.k].liq, lv: lerp(prev, p.lv, sm(a, a + .45, t, easeOut)) }); prev = p.lv; } return out; }
function s3Potion(c, t, T, st) { const F = S3.F, s = st.s, base = st.y + F.r * s, D = F.r * 2 * s;
  if (t < S3.mix[0] + .12) { const ls = s3Levels(t), fizz = t >= S3.foam[0] && t < S3.foam[4];
    for (let k = ls.length - 1; k >= 0; k--) s3Liquid(c, t, st.x, base - D * ls[k].lv, ls[k].col, { amp: fizz ? 7 : 2.5, seed: 411 + k * 5, ph: k * 1.7, s });
    if (fizz || t >= S3.mix[0]) s3Bubbles(c, t, st, base - D * (ls.length ? ls[ls.length - 1].lv : 0), 9, 1.6); return; }
  const top = lerp(base - D * S3.picks[2].lv, st.y + 50 * s, sm(S3.head[0], S3.tail[0], t)), boil = t < S3.mix[1] + .2 || (t >= S3.burp && t < S3.tip[0]) ? 8 : 3.5;
  const lp = s3Liquid(c, t, st.x, top, K.teal, { amp: boil, seed: 421, streaks: 3, s });
  c.save(); c.clip(lp); c.globalCompositeOperation = 'multiply'; const sw = [];
  for (let a = 0; a < TAU * 2.1; a += .14) { const rr = (10 + a * 10.5) * s; sw.push([st.x + Math.cos(a + t * 2.6) * rr * 1.25, st.y + 58 * s + Math.sin(a + t * 2.6) * rr * .5]); }
  stroke(c, sw, { w: 13 * s, color: K.ochre, dry: .22, seed: 425 + tick(t), taper: .35 }); c.globalCompositeOperation = 'source-over';
  s3Bubbles(c, t, st, top, 7, .9); c.restore();
  if (t >= S3.head[0] && t < S3.tail[0] + .08) stroke(c, M(T, [[F.nw * .16, -F.r * .7], [F.nw * .16, -F.r - F.nh - 6]]), { w: F.nw * .6 * s, color: K.teal, seed: 428 + tick(t), taper: .05, smooth: false }); }
// s3Puffs：一串圆团合成一个 Path2D（同一方向的多边形，nonzero 填充就是并集）
function s3Puffs(list, sd, amp = 1.6) { const P = new Path2D(); list.forEach(([x, y, r], k) => { if (r > 1) P.addPath(polyPath(rough(ellPts(x, y, r, r * .9, k, 18), { amp, freq: 9, seed: sd + k }))); }); return P; }
// s3Foam：啤酒一倒就冒泡：沫从瓶颈往上顶，冒出瓶口，顺着瓶身流下来，然后退掉，瓶身上留两道赭色的印子
function s3Foam(c, t, st) { const [f0, f1, f2, f3, f4] = S3.foam; if (t < f0) return; const F = S3.F, T = tf(st.x, st.y, st.s, st.rot), sd = 700 + tick(t);
  const rise = sm(f0, f1, t, easeOut), spill = sm(f1, f2, t, easeOut), back = sm(f3, f4, t, easeIn), mouth = -F.r - F.nh - 9;
  const drips = [[[-26, mouth + 6], [-34, -170], [-32, -125], [-58, -92], [-92, -52], [-104, 0], [-100, 38]], [[26, mouth + 6], [34, -165], [31, -120], [52, -96], [74, -74]]];
  if (spill > .3) drips.forEach((d, j) => { const seg = s3Sub(spline(d.map(p => T(...p)), 4, false), 0, spill * (j ? .8 : 1)); if (seg.length > 1) stroke(c, seg, { w: 7 * st.s, color: K.ochre, seed: 731 + j + sd, al: .75, taper: .5 }); });
  if (back >= 1) return; const k = 1 - back, list = [], neck0 = -F.r + 10, top = lerp(neck0, mouth, rise);
  for (let v = neck0; v >= top; v -= 12) list.push([...T(Math.sin(v * .3) * 3, v), 19 * k * st.s]);
  if (rise >= 1) [[-24, mouth - 8, 22], [0, mouth - 22, 28], [24, mouth - 10, 22], [-10, mouth - 40, 18], [14, mouth - 38, 16]].forEach(([u, v, r]) => list.push([...T(u, v), r * k * st.s * easeOutBack(clamp(spill * 3, 0, 1))]));
  drips.forEach((d, j) => { const path = spline(d, 4, false); for (let u = 0; u <= spill * (j ? .8 : 1); u += .06) { const q = pathAt(path, u); list.push([...T(q.x, q.y), (16 - u * 7) * k * st.s]); } });
  const ink = s3Puffs(list.map(([x, y, r]) => [x, y, r + 3.2]), sd), pap = s3Puffs(list, sd);
  c.fillStyle = K.ink; c.fill(ink); c.fillStyle = K.card; c.fill(pap); texture(c, pap, 'paper', .7, st.x, st.y);
  list.forEach(([x, y, r], j) => { if (j % 3 === 1 && r > 9) stroke(c, ellPts(x + r * .2, y - r * .1, r * .28, r * .28, 0, 10), { close: true, w: 1.6, seed: sd + j, taper: 0, al: .7 }); }); }

// ===================== 魔药师和魔导书 =====================
// s3BookAt：魔导书此刻在哪（null = 抱在胸前）。拍啤酒、点中啤酒、把烧瓶推到前面
const S3CHEST = [S3.mage - 6, S3.ctr - 232];
function s3BookAt(t) { const f = S3.flights.find(g => t >= g.a && t < g.b); if (!f) return null; const flap = Math.sin(t * 26);
  const beer = S3B[5], n = s3Nudge(t), cap = [beer.x + n.dx + 6, S3.shelf.y - beer.h - n.lift - 40];
  if (f.push) { const F = S3.F, P = S3.push, side = [F.x + 150, F.y - 10], end = [P.x + 150 * P.s + 10, P.y - 10];
    if (t < f.hit - .05) { const [x, y] = arc(S3CHEST, side, sm(f.a, f.hit - .05, t, easeInOutSine), 70); return { x, y, rot: -.2, flap }; }
    if (t < S3.pushT[1]) { const k = sm(S3.pushT[0], S3.pushT[1], t, easeOutBack); return { x: lerp(side[0], end[0], k), y: lerp(side[1], end[1], k), rot: -.35, flap: 0 }; }
    const [x, y] = arc(end, S3CHEST, sm(S3.pushT[1] + .05, f.b, t, easeInOutSine), 60); return { x, y, rot: -.2 * (1 - sm(S3.pushT[1], f.b, t)), flap }; }
  const above = [cap[0] + 20, cap[1] - 50], arrive = f.hit - (f.soft ? .2 : .07);
  if (t < arrive) { const [x, y] = arc(S3CHEST, above, sm(f.a, arrive, t, easeInOutSine), 110); return { x, y, rot: -.15, flap }; }
  if (f.soft) { if (t < f.hit - .04) { const w = sm(arrive, arrive + .08, t, easeOut); return { x: above[0] + (hash(Math.floor(t * 24), 3) - .5) * 5 * w, y: above[1] - 34 * w, rot: -.35 * w, flap: 0 }; }   // 举起来，犹豫
    if (t < f.hit + .06) return { x: cap[0] + 8, y: cap[1] - 6, rot: -.08, flap: 0 };                                                                            // 轻轻一点
    const [x, y] = arc([cap[0] + 8, cap[1] - 6], S3CHEST, sm(f.hit + .06, f.b, t, easeInOutSine), 90); return { x, y, rot: -.1, flap }; }
  if (t < f.hit) { const k = sm(arrive, f.hit, t, easeIn); return { x: lerp(above[0], cap[0], k), y: lerp(above[1], cap[1] + 4, k), rot: lerp(-.15, .1, k), flap: 0 }; }   // 啪
  if (t < f.hit + .08) return { x: cap[0], y: cap[1] + 4, rot: .1, flap: 0 };
  const [x, y] = arc([cap[0], cap[1] + 4], S3CHEST, sm(f.hit + .08, f.b, t, easeInOutSine), 90); return { x, y, rot: .1, flap }; }
// s3Book：飞着的魔导书：墨色封皮、纸色书页，书页像翅膀一样扇
function s3Book(c, t, bk) { const sd = 560 + tick(t), T = tf(bk.x, bk.y, 1, bk.rot), f = bk.flap * 14;
  for (const d of [-1, 1]) { block(c, M(T, [[0, -36], [d * 72, -44 + f], [d * 74, 38 + f * .6], [0, 42]]), K.ink, { smooth: false, amp: .8, seed: sd + d, grain: .5 });
    const pg = M(T, [[0, -30], [d * 62, -38 + f], [d * 64, 30 + f * .6], [0, 34]]); block(c, pg, K.card, { smooth: false, amp: .6, seed: sd + 3 + d, grain: .5 });
    for (let k = 0; k < 3; k++) stroke(c, M(T, [[d * 12, -16 + k * 16], [d * 50, -22 + k * 16 + f * .8]]), { w: 1.6, color: K.g3, seed: sd + 5 + k * 2 + d, al: .8 }); }
  stroke(c, M(T, [[0, -34], [0, 40]]), { w: 3, seed: sd + 9, smooth: false }); }
// s3Mage：魔药师的木刻剪影：黑色实心块，白色刮痕线勾出月牙帽、长发、一本书。不画五官。腰以下在吧台后面
//   轮廓：蓬松的睡帽比头宽，帽檐下往里收一截（长发），肩膀再放宽成袍子
function s3Mage(c, t, bk) { const sd = 520 + tick(t), T = tf(S3.mage, S3.ctr, 1), ln = { color: K.paper, dry: .12 }, book = !bk;
  const dome = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + k / 20 * Math.PI; dome.push([Math.cos(a) * 146, -466 + Math.sin(a) * 78 - 8 * Math.sin(k / 20 * Math.PI) ** 4]); }
  const body = [...dome, [152, -452], [146, -436], [114, -430], [112, -384], [116, -344], [136, -322], [152, -294], [160, -200], [166, -100], [170, 30],
    [-170, 30], [-166, -100], [-160, -200], [-152, -294], [-136, -322], [-116, -344], [-112, -384], [-114, -430], [-146, -436], [-152, -452]];
  const path = block(c, M(T, body), K.ink, { smooth: false, amp: 1.5, freq: 12, seed: sd, grain: .7, streaks: 2, dir: 1.45 });
  outline(c, M(T, body), { w: 1.8, color: K.paper, al: .35, dry: .55, seed: sd + 1, smooth: false });   // 一圈断续的白边：进了暗处也看得出轮廓
  // 帽子：两道荷叶边、几道褶、月牙、两侧的小蝴蝶结
  // 荷叶边：一串往下鼓的小圆弧
  for (const [v, n, a] of [[-448, 11, 8], [-462, 13, 4]]) { const fr = [], du = 280 / n; for (let k = 0; k < n; k++) for (let j = 0; j <= 6; j++) { const u = -140 + (k + j / 6) * du; fr.push([u, v + Math.sin(j / 6 * Math.PI) * a]); }
    scratch(c, M(T, fr), { ...ln, w: a > 5 ? 2.8 : 1.8, seed: sd + 2 + n, smooth: false, al: a > 5 ? 1 : .6 }); }
  [[[-104, -484], [-74, -516], [-30, -530]], [[26, -532], [74, -518], [110, -490]], [[-10, -500], [8, -520], [30, -526]]].forEach((pts, k) => scratch(c, M(T, pts), { ...ln, w: 2.2, seed: sd + 5 + k, al: .6 }));
  const moon = []; for (let a = 50; a <= 310; a += 13) moon.push([-48 + Math.cos(a * Math.PI / 180) * 21, -494 + Math.sin(a * Math.PI / 180) * 21]);
  for (let a = 290; a >= 70; a -= 13) moon.push([-41 + Math.cos(a * Math.PI / 180) * 16, -496 + Math.sin(a * Math.PI / 180) * 16]);
  block(c, M(T, moon), K.paper, { amp: .5, seed: sd + 9, grain: .3 });
  const bow = (x, y, s, k) => { for (const d of [-1, 1]) scratch(c, M(T, [[x, y], [x + d * s, y - s * .7], [x + d * s, y + s * .7], [x, y]]), { ...ln, w: 2, seed: sd + k + d, smooth: false }); };
  bow(-114, -474, 13, 12); bow(114, -474, 13, 15);
  // 脸不画五官：刘海在上、两侧发丝、下面 V 字领口，围出中间一块实心的黑
  for (let k = 0; k < 7; k++) { const u = -48 + k * 16; scratch(c, M(T, [[u, -430], [u + (k - 3) * 1.5, -404 + (k % 2) * 8]]), { ...ln, w: 2.2, seed: sd + 20 + k }); }
  for (const d of [-1, 1]) {
    for (let j = 0; j < 5; j++) { const u0 = d * (60 + j * 12), end = j < 3 ? -324 + j * 6 : -150 + (j - 3) * 20;
      scratch(c, M(T, [[u0, -428], [u0 * 1.03, -380], [u0 * (j < 3 ? 1.06 : 1.12), j < 3 ? -350 : -300], [u0 * (j < 3 ? 1.08 : 1.2), end]]), { ...ln, w: j === 4 ? 2.6 : 1.8, seed: sd + 30 + j * 3 + d, al: j === 4 ? 1 : .75 }); }
    bow(d * 70, -322, 11, 40 + d * 3);
    scratch(c, M(T, [[d * 42, -350], [d * 20, -326], [0, -310]]), { ...ln, w: 2.4, seed: sd + 46 + d, smooth: false }); }
  // 睡衣一样的竖条纹（很淡）
  [-128, 128].forEach((u, k) => scratch(c, M(T, [[u * .95, -290], [u * 1.02, -150], [u * 1.08, 0]]), { ...ln, w: 1.6, seed: sd + 44 + k, al: .3, dry: .5 }));
  if (!book) { // 书飞出去了：左臂抬起来指着书（宽袖口），右臂垂着
    const f = S3.flights.find(g => t >= g.a && t < g.b), k = f ? Math.min(sm(f.a, f.a + .1, t, easeOut), 1 - sm(f.b - .12, f.b, t)) : 0, s0 = T(-128, -318);
    let a1 = Math.atan2(bk.y - s0[1], bk.x - s0[0]); if (a1 < 0) a1 += TAU; const a = lerp(Math.PI / 2 + .3, a1, k), L = 150 + 60 * k, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
    const at = (u, w) => [s0[0] + d[0] * u + n[0] * w, s0[1] + d[1] * u + n[1] * w];
    const arm = [at(0, 30), at(L * .5, 22), at(L * .8, 42), at(L * .88, 12), at(L + 20, 0), at(L * .88, -12), at(L * .8, -42), at(L * .5, -22), at(0, -30)];
    block(c, arm, K.ink, { smooth: false, amp: 1.2, seed: sd + 70, grain: .6 }); scratch(c, [at(L * .78, 36), at(L * .8, 0), at(L * .78, -36)], { ...ln, w: 2.2, seed: sd + 71 });
    scratch(c, M(T, [[142, -300], [162, -220], [156, -130]]), { ...ln, w: 2, seed: sd + 72, al: .55 }); return path; }
  // 两只袖子抱着书
  for (const d of [-1, 1]) scratch(c, M(T, [[d * 138, -312], [d * 158, -250], [d * 142, -200], [d * 100, -190]]), { ...ln, w: 2.4, seed: sd + 74 + d, al: .8 });
  // 抱在胸前的书：两页、书脊、几行字；书下面两道袖口
  for (const d of [-1, 1]) { scratch(c, M(T, [[d * 4, -262], [d * 48, -276], [d * 96, -268], [d * 96, -198], [d * 48, -206], [d * 4, -192]]), { ...ln, w: 2.8, seed: sd + 50 + d, smooth: false, dry: .05 });
    scratch(c, M(T, [[d * 96, -198], [d * 92, -188], [d * 4, -182]]), { ...ln, w: 2, seed: sd + 52 + d, smooth: false, al: .7 });
    for (let k = 0; k < 3; k++) scratch(c, M(T, [[d * 18, -246 + k * 16], [d * 80, -252 + k * 16]]), { ...ln, w: 1.5, seed: sd + 54 + k + d * 5, al: .6 });
    scratch(c, M(T, [[d * 150, -200], [d * 110, -168], [d * 60, -166]]), { ...ln, w: 2, seed: sd + 60 + d, al: .5 }); }
  scratch(c, M(T, [[0, -262], [0, -184]]), { ...ln, w: 2.4, seed: sd + 63, smooth: false });
  return path; }

// ===================== 墙、灯、搁板、吧台 =====================
const S3WALL = (() => { const p = new Path2D(); p.rect(-100, -800, 2120, S3.floor + 800); return p; })();
// s3Screen：灰青网点（油印的半色调），在 path 里铺一层。10 单位一格的 45° 点阵
const S3SCR = new Map();
function s3Screen(c, path, color, al = 1) { if (al <= 0) return; const key = color + '@' + S; let p = S3SCR.get(key);
  if (!p) { const g0 = 10, px = Math.round(g0 * S), cv = document.createElement('canvas'); cv.width = cv.height = px; const g = cv.getContext('2d'); g.scale(px / g0, px / g0); g.fillStyle = color;
    for (const [x, y] of [[0, 0], [g0, 0], [0, g0], [g0, g0], [g0 / 2, g0 / 2]]) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); }
    p = c.createPattern(cv, 'repeat'); S3SCR.set(key, p); }
  p.setTransform(new DOMMatrix().scale(1 / S)); c.save(); c.globalAlpha *= al; c.fillStyle = p; c.fill(path); c.restore(); }
// 背景：吧台后面一排淡淡的书和罐子（淡灰青线稿 + 网点），不抢主体
const S3BACK = (() => { const r = rng(303), out = []; let x = 84; const yb = S3.ctr - 12;
  while (x < 1010) { const roll = r(); if (roll < .1) { x += 30 + r() * 40; continue; }
    if (roll < .3) { const w = 40 + r() * 26, h = 60 + r() * 50; out.push({ kind: 'jar', x, w, h, yb, fill: .3 + r() * .4 }); x += w + 12; continue; }
    const w = 16 + r() * 20, h = 80 + r() * 70, lean = r() < .12 ? -(.08 + r() * .2) : 0; out.push({ kind: 'book', x, w, h, yb, lean, band: r() < .5 ? .15 + r() * .5 : -1, fill: r() < .45 }); x += w + 3; }
  for (const [x2, w, h] of [[1700, 50, 80], [1770, 40, 60], [1830, 44, 96]]) out.push({ kind: 'jar', x: x2, w, h, yb, fill: .4 });
  return out; })();
function s3Jar(w, h) { const nw = w * .5; return [[0, 0], [0, -h * .72], [w * .1, -h * .82], [w / 2 - nw / 2, -h * .86], [w / 2 - nw / 2, -h], [w / 2 + nw / 2, -h], [w / 2 + nw / 2, -h * .86], [w * .9, -h * .82], [w, -h * .72], [w, 0]]; }
function s3Backdrop(c) { const o = { w: 2, color: S3.faint, smooth: false, taper: 0, rough: .15 };
  stroke(c, [[70, S3.ctr - 12], [1040, S3.ctr - 12]], { ...o, w: 3, seed: 311 }); stroke(c, [[1680, S3.ctr - 12], [1890, S3.ctr - 12]], { ...o, w: 3, seed: 312 });
  S3BACK.forEach((b, k) => { const sd = 330 + k * 3;
    if (b.kind === 'book') { const T = tf(b.x, b.yb, 1, b.lean), pts = M(T, rectPts(0, -b.h, b.w, b.h)); if (b.fill) s3Screen(c, polyPath(pts), K.teal, .3);
      outline(c, pts, { ...o, seed: sd }); if (b.band > 0) stroke(c, M(T, [[3, -b.h * (1 - b.band)], [b.w - 3, -b.h * (1 - b.band)]]), { ...o, w: 1.6, seed: sd + 1 }); }
    else { const pts = s3Jar(b.w, b.h).map(([u, v]) => [b.x + u, b.yb + v]), lq = rectPts(b.x, b.yb - b.h * .72 * b.fill, b.w, b.h * .72 * b.fill);
      s3Screen(c, polyPath(lq), K.teal, .3); outline(c, pts, { ...o, smooth: true, seed: sd }); } });
  // 墙上钉着的黑白摊宣 Vol.3（原样放），后面一块灰影子，两条赭色胶带
  const x = 1800, y = 488, h = 250, rot = .03, w = h * PHOTOS.vol3.w / PHOTOS.vol3.h; c.save(); c.translate(x, y); c.rotate(rot);
  block(c, rectPts(-w / 2 + 7, -h / 2 + 9, w, h), K.g1, { smooth: false, amp: 1, seed: 341, grain: .5 });
  img(c, 'vol3', -w / 2, -h / 2, w, h); outline(c, rectPts(-w / 2, -h / 2, w, h), { w: 2, color: K.g3, seed: 342, smooth: false, al: .8 });
  [[-w / 2 + 14, -.55], [w / 2 - 14, .5]].forEach(([u, a], k) => block(c, M(tf(u, -h / 2 + 4, 1, a), rectPts(-30, -10, 60, 20)), K.ochre, { smooth: false, amp: 1.1, seed: 343 + k, al: .85, grain: .8 }));
  c.restore(); }
// s3Ceiling：灯照不到的上半截：光锥两条边以上是墨，边上一串断续的白刮痕（参考片的光锥）
function s3Ceiling(c, t) { const { x, y, hw, slope } = S3.L, xl = -80, xr = 2000, sd = 551 + tick(t), yl = y + slope * (x - hw - xl), yr = y + slope * (xr - x - hw);
  block(c, [[xl, -800], [xr, -800], [xr, yr], [x + hw, y], [x - hw, y], [xl, yl]], K.ink, { smooth: false, amp: 3, freq: 22, spike: .05, spikeLen: 12, seed: sd, grain: 1, anchor: [0, 0] });
  scratch(c, [[x - hw - 6, y - 8], [xl, yl - 8]], { w: 2.6, dry: .6, al: .75, seed: sd + 1, smooth: false, taper: .1 }); scratch(c, [[x + hw + 6, y - 8], [xr, yr - 8]], { w: 2.6, dry: .6, al: .75, seed: sd + 2, smooth: false, taper: .1 }); }
// s3Lamp：吊灯。暗着时只有白色刮痕描出的灯罩（0.15 起一笔笔刮出来），亮了灯泡是赭色
function s3Lamp(c, t, lit) { const { x, y } = S3.L, sd = 540 + tick(t), p = sm(.15, .45, t, easeOut);
  scratch(c, [[x, -760], [x, y - 74]], { w: 2.6, seed: sd, dry: .1, al: .9, smooth: false, p: lit ? 1 : clamp(p * 1.6, 0, 1) });
  const shade = [[x - 46, y - 74], [x + 46, y - 74], [x + 84, y - 38], [x + 130, y], [x - 130, y], [x - 84, y - 38]];
  block(c, shade, K.ink, { smooth: false, amp: 1.2, seed: sd + 1, grain: .5 }); outline(c, shade, { w: 3, color: K.paper, seed: sd + 2, smooth: false, p });
  scratch(c, [[x - 34, y - 60], [x - 78, y - 16]], { w: 2.4, seed: sd + 3, al: .8 * p });
  const bulb = []; for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI; bulb.push([x + Math.cos(a) * 40, y + Math.sin(a) * 28]); }
  if (lit) block(c, bulb, K.ochre, { amp: .8, seed: sd + 4, grain: .3 }); else if (p >= 1) stroke(c, bulb, { w: 2, color: K.paper, seed: sd + 5, al: .6 }); }
function s3Shelf(c, t) { const { x0, x1, y } = S3.shelf, sd = 571;
  block(c, [[x0, y], [x1, y - 2], [x1, y + 18], [x0, y + 20]], K.ink, { smooth: false, amp: 1.2, seed: sd, streaks: 2, dir: 0 });
  scratch(c, [[x0 + 12, y + 6], [x1 - 14, y + 5]], { w: 1.8, seed: sd + 1, al: .5, dry: .45 });
  for (const bx of [210, 920]) block(c, [[bx - 10, y + 18], [bx + 10, y + 18], [bx + 10, y + 34], [bx - 4, y + 64], [bx - 10, y + 64]], K.ink, { smooth: false, amp: .8, seed: sd + bx, grain: .5 }); }
// s3Counter：吧台：赭色的台面，墨色的正面（木刻的板缝和踢脚），主文案写在正面
function s3Counter(c, t) { const y = S3.ctr, sd = 581;
  block(c, [[-60, y + 4], [1980, y], [1980, S3.floor], [-60, S3.floor]], K.ink, { smooth: false, amp: 1.6, seed: sd, streaks: 5, dir: 0, anchor: [0, 0] });
  block(c, [[-60, y - 14], [1980, y - 18], [1980, y + 4], [-60, y + 6]], K.ochre, { smooth: false, amp: 1.2, seed: sd + 1, grain: .8 });
  scratch(c, [[-40, y + 22], [1960, y + 19]], { w: 2.2, seed: sd + 2, al: .45, dry: .4 });
  scratch(c, [[-40, S3.floor - 34], [1960, S3.floor - 36]], { w: 2, seed: sd + 3, al: .35, dry: .5 });
  for (const x of [1120, 1840]) scratch(c, [[x, y + 30], [x + 2, S3.floor - 44]], { w: 1.8, seed: sd + x, al: .3, dry: .5, smooth: false }); }

// ===================== 字、打钩、奖品 =====================
const s3Hand = (c, str, x, y, o = {}) => zh(c, str, x, y, { size: 60, color: K.paper, tilt: .01, jitter: .01, weight: 500, ...o });
function s3Words(c, t) { const { sub, guess, prize, boxes: bx } = S3, sd = tick(t);
  if (t >= sub.t0 && t < sub.t1) s3Hand(c, sub.text, sub.x, sub.y, { size: 58, p: writeP(t, sub.t0, sub.text, .045), seed: 41 });
  if (t >= guess.t0) s3Hand(c, guess.text, guess.x, guess.y, { size: 64, p: writeP(t, guess.t0, guess.text, .05), seed: 42 });
  if (t >= prize.t0) s3Hand(c, prize.text, prize.x, prize.y, { size: 54, p: writeP(t, prize.t0, prize.text, .045), seed: 43 });
  // 三个空格，依次打钩
  for (let k = 0; k < 3; k++) { const x = bx.x + k * bx.gap, y = bx.y, p = sm(bx.t0 + k * .08, bx.t0 + k * .08 + .2, t, easeOut); if (p <= 0) continue;
    outline(c, rectPts(x, y, bx.s, bx.s), { w: 4, color: K.paper, p, seed: 45 + k + sd, smooth: false, rough: .3 });
    const q = sm(bx.ticks[k], bx.ticks[k] + .14, t, easeOut); if (q > 0) stroke(c, [[x + 8, y + 28], [x + 23, y + 46], [x + 58, y - 4]], { w: 8, color: K.ochre, p: q, seed: 48 + k + sd, smooth: false, taper: .35 }); } }
// s3Coin：决策币（不写字）：赭色硬币，一圈边、一颗刮出来的星。spin 翻转的角度
function s3Coin(c, t, x, y, r, spin) { const sx = Math.max(.08, Math.abs(Math.cos(spin))), sd = 590 + tick(t); c.save(); c.translate(x, y); c.scale(sx, 1);
  block(c, ellPts(0, 0, r + 4, r + 4, 0, 30), K.ink, { amp: .6, seed: sd, grain: .4 }); block(c, ellPts(0, 0, r, r, 0, 30), K.ochre, { amp: .6, seed: sd + 1, grain: .6 });
  outline(c, ellPts(0, 0, r * .78, r * .78, 0, 30), { w: 2.2, seed: sd + 2 }); outline(c, starPts(0, 2, r * .42, 0, 5, .45), { w: 2.4, seed: sd + 3, smooth: false });
  scratch(c, [[-r * .62, -r * .2], [-r * .4, -r * .56]], { w: 3, seed: sd + 4, al: .8 }); c.restore(); }
function s3Prizes(c, t) { const { badge: bg, coin: cn } = S3, sd = tick(t);
  const k = easeOutBack(sm(bg.t0, bg.t0 + .22, t, v => v)); if (k > .01) pop(c, bg.x, bg.y + bg.r, k, () => {
    block(c, ellPts(bg.x, bg.y, bg.r + 4, bg.r + 4, 0, 36), K.ink, { amp: .7, seed: 593 + sd, grain: .4 });
    c.save(); c.beginPath(); c.arc(bg.x, bg.y, bg.r, 0, TAU); c.clip(); img(c, 'badgeYes', bg.x - bg.r, bg.y - bg.r, bg.r * 2, bg.r * 2); c.restore();
    scratch(c, [[bg.x - bg.r * .7, bg.y - bg.r * .35], [bg.x - bg.r * .45, bg.y - bg.r * .68]], { w: 3, seed: 594 + sd, al: .7 }); });
  if (t < cn.t0) return; const u = t - cn.t0, fall = sm(0, .28, u, easeIn), y = lerp(cn.y - 260, cn.y, fall) - (u > .28 ? 26 * Math.sin(Math.PI * sm(.28, .44, u, v => v)) : 0);
  s3Coin(c, t, cn.x, y, cn.r, u < .5 ? u * 26 : 0); }
// s3Sig：剪影旁的署名「@」
function s3Sig(c, t) { const { x, y, t0 } = S3.sig; if (t < t0) return; zh(c, '@', x, y, { size: 96, align: 'center', weight: 500, p: writeP(t, t0, '@', .25), seed: 51, tilt: .01, jitter: .01 });
}
function s3Caption(c, tau) { caption(c, '帕秋莉的炼金工坊', tau, S3.cap[0], { t1: S3.cap[1] }); const t0 = S3.cap[0] + .5;
  if (tau > t0 && tau < S3.cap[1] + .1) { c.save(); resetT(c); zh(c, 'パチュリの錬金工房', 58, 196, { size: 32, color: K.g1, p: writeP(tau, t0, 'パチュリの錬金工房', .04), seed: 9, tilt: .01, jitter: .01 }); c.restore(); viewT(c); } }

// ===================== 问号烟 =====================
// s3Q：问号的形状。(x, y) 是问号竖笔的底，s 是大小。返回钩子（从左端画到竖笔底）和点
function s3Q(x, y, s) { const hook = [], cx = x, cy = y - .55 * s, r = .32 * s;
  for (let a = 200; a <= 400; a += 15) hook.push([cx + Math.cos(a * Math.PI / 180) * r, cy + Math.sin(a * Math.PI / 180) * r]);
  hook.push([x + .06 * s, y - .16 * s], [x, y - .1 * s], [x, y + .06 * s]); return { hook, dot: [x, y + .27 * s] }; }
// 烟从推到前面的烧瓶口升起，沿「瓶口 → 问号的点 → 竖笔 → 钩子」长出来；长满以后瓶口到竖笔底这一段断开，点单独弹出来
const S3QPATH = (() => { const { x, y, s } = S3.q, q = s3Q(x, y, s), P = S3.push, F = S3.F, m = [P.x, P.y - (F.r + F.nh + 9) * P.s];
  const pts = spline([m, q.dot, ...q.hook.slice().reverse()], 4, false), cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  let stem = 0; for (let k = 0; k < pts.length; k++) if (pts[k][1] > y + .06 * s - 1) stem = cum[k];
  return { pts, cum, L: cum[cum.length - 1], stem, dot: q.dot }; })();
function s3QAt(s) { const { pts, cum } = S3QPATH; let k = 1; while (k < pts.length - 1 && cum[k] < s) k++; const u = clamp((s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1), 0, 1), a = pts[k - 1], b = pts[k];
  return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), a: Math.atan2(b[1] - a[1], b[0] - a[0]) }; }
function s3Smoke(c, t) { const { L, stem, dot } = S3QPATH, head = sm(S3.smoke[0], S3.smoke[1], t, easeInOutSine) * L; if (head <= 0) return;
  const tail = sm(S3.lift[0], S3.lift[1], t, easeIn) * stem, sd = 431 + tick(t), bob = t > S3.smoke[1] ? Math.sin(t * 2.2) * 4 : 0, list = [];
  for (let s = tail; s <= head; s += 12) { const q = s3QAt(s), wob = noise1(s / 40 + t * 1.5, 7) * 7 * (1 - sm(S3.smoke[1], S3.smoke[1] + .4, t)), n = q.a + Math.PI / 2;
    const r = (22 + 5 * noise1(s / 28, 3)) * clamp((head - s) / 70 + .3, .3, 1) * clamp((s - tail) / 36 + .45, .45, 1);
    list.push([q.x + Math.cos(n) * wob, q.y + Math.sin(n) * wob + bob, r]); }
  const dk = easeOutBack(sm(S3.dot, S3.dot + .22, t, v => v)); if (dk > 0) [[0, 0, 26], [-10, 5, 17], [10, 4, 17]].forEach(([u, v, r]) => list.push([dot[0] + u * dk, dot[1] + v * dk + bob, r * dk]));
  const P = s3Puffs(list, sd); c.save(); c.fillStyle = mix(K.paper, K.teal, .78); c.fill(P); c.globalCompositeOperation = 'multiply'; c.translate(8, 6); s3Screen(c, P, K.ochre, 1); c.restore();
  texture(c, P, 'paper', .7, S3.q.x, S3.q.y);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const [x, y, r] of list) { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); }
  drybrush(c, P, [[x0, y0], [x1, y1]], { n: 7, dir: -.6, seed: sd + 50, w: 2, al: .8 }); }

// ===================== 结尾：魔药倒出来，流成小溪线 =====================
// s3Sub：折线上弧长比例 a..b 的一段
function s3Sub(pts, a, b) { const cum = [0]; for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const L = cum[cum.length - 1], A = clamp(a, 0, 1) * L, B = clamp(b, 0, 1) * L; if (B - A < 1) return [];
  const at = s => { let k = 1; while (k < pts.length - 1 && cum[k] < s) k++; const u = clamp((s - cum[k - 1]) / ((cum[k] - cum[k - 1]) || 1), 0, 1); return [lerp(pts[k - 1][0], pts[k][0], u), lerp(pts[k - 1][1], pts[k][1], u)]; };
  const out = [at(A)]; for (let k = 0; k < pts.length; k++) if (cum[k] > A && cum[k] < B) out.push(pts[k]); out.push(at(B)); return out; }
// s3StreamY：交接小溪线 STREAM 在横坐标 x 处的高度
function s3StreamY(x) { const f = clamp((x + 40) / 42, 0, STREAM.length - 1.001), k = Math.floor(f); return lerp(STREAM[k][1], STREAM[k + 1][1], f - k); }
const S3STREAM = STREAM.map(([x, y]) => [x, y + S3.drop]);   // 镜头往下摇 drop 以后，小溪线在世界里的位置
function s3Outflow(c, t, st) { const F = S3.F, headP = sm(S3.head[0], S3.head[1], t, easeIn), tailP = sm(S3.tail[0], S3.tail[1], t, easeIn); if (headP <= 0 || tailP >= 1) return;
  const T = tf(st.x, st.y, st.s, st.rot), m = T(0, -F.r - F.nh - 4), d = [Math.sin(st.rot), -Math.cos(st.rot)], xf = S3.xImp, yI = S3.drop + s3StreamY(xf), sd = tick(t);
  const path = spline([m, [m[0] + d[0] * 34, m[1] + d[1] * 34 + 6], [lerp(m[0], xf, .82), m[1] + 44], [xf, m[1] + 120], [xf, lerp(m[1] + 120, yI, .5)], [xf, yI]], 5, false), seg = s3Sub(path, tailP, headP);
  if (seg.length < 2) return; stroke(c, seg, { w: 15, color: K.teal, seed: 451 + sd, taper: .06, rough: .25, wfn: f => 1 - .25 * f });
  scratch(c, seg.map(([x, y]) => [x - 3, y]), { w: 2, seed: 452 + sd, al: .6, dry: .5 }); }
function s3Spread(c, t) { const k = sm(S3.spread[0], S3.spread[1], t, easeOut), xI = S3.xImp, yI = S3.drop + s3StreamY(xI), sd = tick(t); if (k <= 0) return;
  const xl = lerp(xI, -90, k), xr = lerp(xI, 2010, k), col = mix(K.teal, K.g3, sm(S3.spread[0] + .05, S3.spread[1], t));
  c.save(); c.beginPath(); c.rect(xl, S3.drop - 200, xr - xl, 1500); c.clip(); stroke(c, S3STREAM, { w: 10, color: col, seed: 5, taper: 0, rough: .25 }); c.restore();
  for (const x of [xl, xr]) if (x > 0 && x < W) block(c, ellPts(x, S3.drop + s3StreamY(x), 8, 6.5, 0, 14), col, { amp: .8, seed: 461 + sd, grain: 0 });
  // 落点：一小摊药水，溅起几滴，然后缩回线里
  const pool = sm(S3.spread[0], S3.spread[0] + .1, t, easeOut) * (1 - sm(S3.spread[0] + .2, S3.tail[1] - .02, t)); if (pool > 0) block(c, ellPts(xI, yI, 34 * pool, 12 * pool, 0, 20), K.teal, { amp: 1.4, seed: 462 + sd, grain: .4 });
  const sp = sm(S3.spread[0], S3.spread[0] + .24, t, v => v); if (sp > 0 && sp < 1) [[-70, 60], [-34, 90], [20, 100], [58, 70], [96, 40]].forEach(([dx, h], j) => { const [x, y] = arc([xI, yI], [xI + dx, yI + 6], sp, h), r = 6 * (1 - sp * .5); fillPts(c, ellPts(x, y, r, r, 0, 10), K.teal); }); }

// ===================== 整个画面 =====================
// 灯下的光锥：油印的做法，光照到的地方不印网点、纸色亮一档（明暗差 3%，不用渐变）
const S3CONE = (() => { const { x, y, hw } = S3.L; return [[x - hw, y], [x + hw, y], [x + hw + 330, S3.ctr - 14], [x - hw - 330, S3.ctr - 14]]; })();
function s3Wall(c, t) { paperBg(c); const cone = polyPath(rough(S3CONE, { amp: 2.5, freq: 24, seed: 531 + tick(t), smooth: false }));
  c.save(); c.fillStyle = K.card; c.globalAlpha = .75; c.fill(cone); c.restore();
  const dots = new Path2D(S3WALL); dots.addPath(cone); c.save(); c.clip(dots, 'evenodd'); texture(c, S3WALL, 'dots', .9); c.restore(); }
function s3World(c, t) { s3Wall(c, t);
  s3Backdrop(c); s3Shelf(c, t);
  const bs = S3B.map((b, k) => s3BottleState(k, t)); bs.forEach((st, k) => { if (!st.moving) s3Bottle(c, S3B[k], st, t); });
  s3Ceiling(c, t); s3Lamp(c, t, true);
  const bk = s3BookAt(t); s3Mage(c, t, bk); s3Sig(c, t);
  s3Counter(c, t); s3Words(c, t);
  const fs = s3FlaskState(t), pushed = t >= S3.pushT[0];
  if (!pushed) { s3Ring(c, t, fs); s3Flask(c, t, fs, T => s3Potion(c, t, T, fs)); }
  bs.forEach((st, k) => { if (!st.moving) return; const b = S3B[k]; s3Bottle(c, b, st, t);
    if (st.pour) { const F = S3.F, m = s3Mouth(b, st), ls = s3Levels(t), top = F.y + F.r - F.r * 2 * (ls.length ? ls[ls.length - 1].lv : 0);
      const seg = s3Sub(spline([m, [m[0] + 6, m[1] + 18], [F.x, F.y - F.r - F.nh + 8], [F.x, top]], 5, false), st.pour[1], st.pour[0]);
      if (seg.length > 1) stroke(c, seg, { w: 9, color: b.liq, seed: 491 + k + tick(t), taper: .1 }); } });
  if (!pushed) s3Foam(c, t, fs);
  s3Prizes(c, t);
  if (pushed) { s3Ring(c, t, { ...fs, rot: 0 }); s3Flask(c, t, fs, T => s3Potion(c, t, T, fs)); }
  if (bk) s3Book(c, t, bk);
  s3Smoke(c, t); s3Outflow(c, t, fs); s3Spread(c, t); }

scene({ order: 3, key: 'alchemy', name: '帕秋莉的炼金工坊', dur: S3.END, fn: (c, tau) => {
  if (tau < S3.IN) return handoffBlack(c);
  if (tau >= S3.END - S3.OUT) return handoffStream(c);
  const t = twos(tau); setView({ x: CX, y: CY + S3.drop * sm(S3.pan[0], S3.pan[1], tau, easeInOutSine), zoom: 1 });
  const lit = tau >= S3.on[0] && !(tau >= S3.on[1] && tau < S3.on[2]);
  if (lit) s3World(c, t); else { inkBg(c); s3Lamp(c, t, false); }
  s3Caption(c, tau);
} });
