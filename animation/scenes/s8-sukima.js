'use strict';
// 第 8 镜 · 隙间月影（22 秒）
// 全片唯一换语气的一段：电车钻进八云紫的隙间，里面是一本照 sukima-ml 宣传册排的画册。
// 排版照 sukima-ml/scripts/brochure/build_sukima_moonlight_brochure.py：暖白纸、墨色细线、等宽大写标签、思源黑体，
// 西文走等宽、中文走思源（draw_mixed 的规则），紫色只给引言。作品上不涂鸦、不加剪纸毛边。
//
//   0–2.45s   天蓝卡纸上电车开来，前方裂开一道隙间（深色细缝、两端小红蝴蝶结、铅笔线边），电车钻进去，缝沿上下张开露出暖白纸
//   2.45–5s   开篇页 01：「如果维米尔生活在幻想乡，他会画谁？」「名画与东方的邂逅。」
//   5–16.15s  作品页 02–05：镜头沿纸面平移，一幅一停（每幅约 2 秒静止）；底边细线上一辆铅笔线小电车安静驶过
//   16.15–22s 结束页 06（深色页）：头像、隙间月影 Sukima Moonlight、口号、网站、QQ 群与二维码；17.0 起完整停留到 21.6，最后 0.4 秒甩出到右边

const S8 = {
  paper: '#F7F6F4', ink: '#111111', mist: '#F1F1EF', line: '#D9D9D5', muted: '#777772', violet: '#4B2A63', night: '#101018', qrBg: '#26262A',
  M: 96, R: 1824, PW: 1920, tx: 912, rail: 996, foot: 1040,     // 页边距、右边界、页宽、文字栏左边、底边细线、页脚基线
  top: 140, IH: 660, mat: 40, fr: 5,                             // 作品框：上沿、画芯高、白卡纸宽、黑框宽
  gate: 2.45, pans: [5.0, 7.8, 10.6, 13.4, 16.15], pan: .85, dur: 22,
};
// 隙间段：电车轨面、大小，隙间中心与半宽半高
const S8G = { rail: 880, s: 72, gx: 1200, gy: 742, A: 490, B: 168, vx: 1060, vy: 650, zoom: 1.28 };

// 作品信息一字不差照 docs/素材事实.md；引言按语气停顿手工分行，quote.join('') 就是原文
const S8_WORKS = [
  { no: '01', title: '戴珍珠耳环的17岁少女', original: '维米尔《戴珍珠耳环的少女》', character: '八云紫', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68', art: 'art1', orig: 'orig1',
    quote: ['「若你将其悬挂于心墙之上时刻注视，或许……', '也是一种对我‘存在’的供奉呢。」'] },
  { no: '02', title: '不动的大图书馆', original: '斯皮茨韦格《书虫》', character: '帕秋莉·诺蕾姬', artist: '青未Q', spec: '16寸画芯', price: '¥70（A款）/ ¥78（B款）', art: 'art2', orig: 'orig2',
    quote: ['「这就是所谓的‘知识的重量’吗？', '为了触及真理的高处，总有人需要成为基石。」'] },
  { no: '03', title: '蓬莱宫娥', original: '委拉斯开兹《宫娥》', character: '蓬莱山辉夜 & 永远亭众', artist: 'amibazh', spec: '14寸画芯', price: '¥69', art: 'art3', orig: 'orig3',
    quote: ['「比起原画中严肃的西班牙宫廷，', '这里的空气中弥漫着', '一种随时会爆发弹幕战的微妙‘核’平气息。」'] },
  { no: '04', title: '妖怪之山的秋千', original: '弗拉戈纳尔《秋千》', character: '東風谷早苗 & 射命丸文', artist: '真菌_isomer', spec: '14寸画芯', price: '¥68', art: 'art4', orig: 'orig4',
    quote: ['「这大概就是幻想乡版的‘狗仔摄影’吧？」'] },
];

// ===================== 排版小工具 =====================
// s8Mix: 中西混排，西文（码位 < U+2E80）走 SMono，中文走 NSans（宣传册 draw_mixed 的规则）。返回总宽。
function s8Mix(c, str, x, y, o = {}) {
  const { size = 30, color = S8.ink, weight = 400, align = 'left', al = 1 } = o; if (al <= 0) return 0;
  const runs = []; for (const ch of str) { const lat = ch.codePointAt(0) < 0x2E80; if (runs.length && runs[runs.length - 1][0] === lat) runs[runs.length - 1][1] += ch; else runs.push([lat, ch]); }
  c.save(); c.globalAlpha *= al; c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  const parts = runs.map(([lat, s]) => { c.font = lat ? `400 ${size}px SMono` : `${weight} ${size}px NSans`; return [c.font, s, c.measureText(s).width]; });
  const tw = parts.reduce((a, p) => a + p[2], 0); let cx = align === 'right' ? x - tw : align === 'center' ? x - tw / 2 : x;
  for (const [f, s, w] of parts) { c.font = f; c.fillText(s, cx, y); cx += w; }
  c.restore(); return tw;
}
// s8Label: 等宽大写小标签（宣传册 draw_label）
const s8Label = (c, str, x, y, o = {}) => printText(c, str, x, y, { size: 24, font: 'SMono', color: S8.muted, ...o });
// s8Rule: 细线（默认浅线 #D9D9D5，标题下用墨色粗一点）
function s8Rule(c, x0, y, x1, col = S8.line, w = 1.6, al = 1) { if (al <= 0) return; c.save(); c.globalAlpha *= al; c.fillStyle = col; c.fillRect(x0, y - w / 2, x1 - x0, w); c.restore(); }
function s8Img(c, name, x, y, w, h, al = 1) { if (al <= 0) return; c.save(); c.globalAlpha *= al; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(PHOTOS[name].img, x, y, w, h); c.restore(); }
// s8Pencil: 细铅笔线：一道实线加一道更淡、略错开的线，不发光、不抖动（同一 seed 每帧一样）
function s8Pencil(c, pts, o = {}) { const { w = 2, col = '#3b3b44', close = false, al = 1, seed = 1 } = o; if (al <= 0 || pts.length < 2) return; const base = c.globalAlpha;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col;
  for (let pass = 0; pass < 2; pass++) { const r = rng(seed + pass * 17); c.globalAlpha = base * al * (pass ? .4 : .85); c.lineWidth = pass ? w * .6 : w; c.beginPath();
    pts.forEach((p, k) => { const jx = pass ? (r() - .5) * w * 1.1 : 0, jy = pass ? (r() - .5) * w * .8 : 0; k ? c.lineTo(p[0] + jx, p[1] + jy) : c.moveTo(p[0] + jx, p[1] + jy); });
    if (close) c.closePath(); c.stroke(); }
  c.restore(); }

// ===================== 0–2.45s 隙间 =====================
// s8Lens: 隙间的形状随时间变化：先裂开一道细缝，再上下张开，最后整片张开到盖满画面（r 是里面露出暖白纸的比例）
function s8Lens(tau) {
  const G = S8G; let A = G.A * easeOut(clamp((tau - .4) / .35, 0, 1)), B = lerp(2.5, G.B, easeOut(clamp((tau - .75) / .35, 0, 1))), x = G.gx, y = G.gy, r = 0;
  const v = easeIO(clamp((tau - 1.8) / .65, 0, 1));
  if (v > 0) { A = G.A * Math.pow(2400 / G.A, v); B = G.B * Math.pow(950 / G.B, v); x = lerp(G.gx, G.vx, v); y = lerp(G.gy, G.vy, v); r = .94 * easeOut(clamp((tau - 1.8) / .42, 0, 1)); }
  return { x, y, A, B, r };
}
// 眼形：两端尖、中间满（上下两条 cos 曲线）
function s8LensPts(L, k = 1, n = 72) { const out = [], h = u => L.B * k * Math.pow(Math.cos(u * Math.PI / 2), 1.25);
  for (let j = 0; j <= n; j++) { const u = -1 + 2 * j / n; out.push([L.x + u * L.A * k, L.y - h(u)]); }
  for (let j = n - 1; j >= 1; j--) { const u = -1 + 2 * j / n; out.push([L.x + u * L.A * k, L.y + h(u)]); }
  return out; }
// s8Bow: 隙间两端的小红蝴蝶结（剪纸块，和外面的卡纸世界同一画风）
function s8Bow(c, x, y, k, dir, seed) { if (k <= .01) return; c.save(); c.translate(x, y); c.scale(k * dir, k);
  const red = '#c8323f', dark = '#a82431', q = { rim: 2.6, shadow: .14, anchor: [0, 0] };
  cut(c, [[-3, 2], [-10, 21], [-4, 24], [2, 5]], dark, { ...q, seed: seed + 2, smooth: false });
  cut(c, [[3, 2], [9, 22], [15, 18], [5, 3]], dark, { ...q, seed: seed + 3, smooth: false });
  cut(c, [[0, 0], [-15, -13], [-25, -8], [-25, 8], [-15, 13]], red, { ...q, seed });
  cut(c, [[0, 0], [15, -13], [25, -8], [25, 8], [15, 13]], red, { ...q, seed: seed + 1 });
  cut(c, ellPts(0, 0, 6.5, 8, 0, 14), dark, { rim: 0, seed: seed + 4, shadow: .1, anchor: [0, 0] });
  c.restore(); }

function s8Gate(c, tau, i) {
  const G = S8G, s = G.s, t = twos(tau), view = { x: G.vx + whip(tau, 99, { inn: .45, out: 0, dist: 760 }), y: G.vy, zoom: G.zoom };
  setView(view); paperBg(c, K.sky, { seed: 81 });
  cloud(c, 560, 350, 300, 108, 11); cloud(c, 1560, 320, 240, 88, 12);
  star(c, 980, 300, 14, { seed: 5 }); star(c, 1760, 470, 11, { seed: 6 }); star(c, 380, 520, 11, { seed: 7 });
  rails(c, G.rail, -900, W + 300, { seed: 17 });
  const L = s8Lens(tau), lens = L.A > 1 ? s8LensPts(L) : null, bowK = easeOutBack(clamp((t - .62) / .28, 0, 1)) * (L.r > 0 ? 1.25 : 1);
  if (lens) fillPts(c, lens, S8.night);
  // 缝张开后，里面露出暖白纸（宣传册的第一页）
  if (L.r > 0) { c.save(); c.clip(polyPath(s8LensPts(L, L.r))); s8Book(c, tau); c.restore(); setView(view); viewT(c); }
  if (lens) { s8Pencil(c, lens, { w: 2.6, col: '#34343e', close: true, seed: 3 }); s8Pencil(c, s8LensPts(L, 1.018), { w: 1.3, col: '#34343e', close: true, seed: 9, al: .55 }); }
  s8Bow(c, L.x - L.A - 6, L.y, bowK, -1, 61); s8Bow(c, L.x + L.A + 6, L.y, bowK, 1, 71);
  // 电车：一路加速，车头过了隙间中线就看不见了（钻进去了）
  const x = 330 + 220 * t + 330 * t * t, seen = t > .55;
  if (x - 3.3 * s < G.gx) {
    c.save(); c.beginPath(); c.rect(G.gx - 4000, -1000, 4000, 3200); c.clip();
    motionLinesAt(c, x - 3.2 * s, G.rail - 1.3 * s, .8);
    tram(c, x, G.rail, s, { roll: x / (s * .33), lamp: 1, umbrella: { blink: pulse(i, 30, 2) ? 1 : 0, tongue: Math.sin(t * 7) * .6 },
      driver: (g, X, Y, ss) => kogasa(g, X, Y, ss, { headOnly: true, umbrella: false, look: [1, 0], eyes: seen ? 'wide' : 'open', mouth: seen ? 'open' : 'tongue' }),
      seats: [(g, X, Y, ss) => akyuu(g, X, Y, ss, { headOnly: true, look: [1, -.2], eyes: seen ? 'wide' : 'open', mouth: seen ? 'o' : 'smile' }),
        (g, X, Y, ss) => hina(g, X, Y, ss, { headOnly: true, look: [1, -.2], eyes: seen ? 'wide' : 'open', mouth: seen ? 'o' : 'smile' }),
        (g, X, Y, ss) => patchouli(g, X, Y, ss, { headOnly: true, look: [1, -.2], eyes: seen ? 'open' : 'half', mouth: seen ? 'o' : 'flat' })] });
    if (lens) { c.clip(polyPath(lens)); const g = c.createLinearGradient(G.gx - 180, 0, G.gx, 0); g.addColorStop(0, alpha(S8.night, 0)); g.addColorStop(1, alpha(S8.night, .92)); c.fillStyle = g; c.fillRect(G.gx - 180, G.gy - 400, 180, 800); }
    c.restore();
  }
}

// ===================== 2.45–22s 画册 =====================
// 六页横排成一条：0 开篇、1–4 作品、5 结束页（深色）。页眉品牌、页脚和页码固定在画面上，镜头平移时只有内容滑过。
function s8CamX(tau) { return S8.pans.reduce((a, p) => a + S8.PW * easeIO(clamp((tau - p) / S8.pan, 0, 1)), 0); }

function s8Book(c, tau) {
  const PW = S8.PW, cam = s8CamX(tau), off = cam + whip(tau, S8.dur, { inn: 0, out: .4, dist: 760 }), hud = sm(2.3, 2.8, tau, easeOut);
  setView({ x: CX + off, y: CY });
  resetT(c); c.fillStyle = S8.paper; c.fillRect(-10, -10, W + 20, H + 20);
  viewT(c);
  c.fillStyle = S8.night; c.fillRect(5 * PW, -10, PW + 2400, H + 20);
  s8Rule(c, 0, S8.rail, 5 * PW, S8.line, 2, hud);   // 底边一条细线，铅笔小电车的轨道
  const pages = [s8Opening, ...S8_WORKS.map(w => (g, tt) => s8Work(g, w)), s8End];
  pages.forEach((fn, k) => { const sx = k * PW - off; if (sx > W + 20 || sx < -PW - 20) return; c.save(); c.translate(k * PW, 0); fn(c, tau); c.restore(); });
  // 固定在画面上的页眉页脚：深色页滑进来时被它盖住
  const darkX = 5 * PW - off; if (darkX <= 0) return;
  resetT(c); c.save(); c.beginPath(); c.rect(-10, -10, Math.min(W + 20, darkX + 10), H + 20); c.clip();
  s8Brand(c, S8.M, 48, hud);
  s8Label(c, 'TOUHOU PROJECT × CLASSIC ART', S8.M, S8.foot, { al: hud });
  const f = cam / PW, k = Math.round(f), fr = f - Math.floor(f);
  s8Label(c, `0${k + 1} / 06`, S8.R, S8.foot, { align: 'right', al: hud * clamp(Math.abs(fr - .5) * 3, 0, 1) });
  // 铅笔线小电车：3s 从左边出来，16s 前开出右边
  const tx = -150 + (tau - 3) * 170; if (tx > -200 && tx < W + 200) s8Sketch(c, tx, S8.rail - 1, 22, tx);
  c.restore();
}

function s8Brand(c, x, y, al, color = S8.ink) { if (al <= 0) return; s8Img(c, 'avatar', x, y, 64, 64, al); printText(c, 'SUKIMA MOONLIGHT', x + 88, y + 41, { size: 26, font: 'SMono', color, al }); }

// 开篇页：品牌、问句、口号（宣传册的引言页）
function s8Opening(c, tau) {
  const { M, R } = S8, f = a => easeOut(clamp((tau - a) / .5, 0, 1)), a0 = f(2.4), a1 = f(2.5), a2 = f(2.85), rise = a => 14 * (1 - a);
  s8Label(c, 'EST. 2025.11 / BEIJING', R, 89, { align: 'right', al: a0 });
  s8Label(c, 'ABOUT THE CIRCLE', M, 352, { al: a1 });
  printText(c, '如果维米尔生活在幻想乡，', M, 474 + rise(a1), { size: 96, weight: 500, color: S8.ink, al: a1 });
  printText(c, '他会画谁？', M, 604 + rise(a1), { size: 96, weight: 500, color: S8.ink, al: a1 });
  printText(c, '名画与东方的邂逅。', M, 716 + rise(a2), { size: 44, weight: 500, color: S8.ink, al: a2 });
  s8Label(c, 'WHERE CLASSIC ART MEETS TOUHOU', M, 768 + rise(a2), { al: a2 });
}

// 作品页：左边细黑框 + 白卡纸装裱的大图，右边文字栏（编号、标题、原作/角色/画师、原作小图、引言、规格价格）
function s8Work(c, w) {
  const { M, R, tx, top, IH, mat, fr } = S8, ph = PHOTOS[w.art], IW = IH * ph.w / ph.h, OW = IW + 2 * (mat + fr), OH = IH + 2 * (mat + fr), bot = top + OH;
  c.save(); c.shadowColor = 'rgba(17,17,17,.13)'; c.shadowBlur = 26 * S; c.shadowOffsetY = 9 * S; c.fillStyle = S8.ink; c.fillRect(M, top, OW, OH); c.restore();
  c.fillStyle = '#FFFFFF'; c.fillRect(M + fr, top + fr, OW - 2 * fr, OH - 2 * fr);
  s8Img(c, w.art, M + fr + mat, top + fr + mat, IW, IH);
  c.save(); c.strokeStyle = 'rgba(17,17,17,.10)'; c.lineWidth = 1.2; c.strokeRect(M + fr + mat - .6, top + fr + mat - .6, IW + 1.2, IH + 1.2); c.restore();
  // 文字栏
  s8Label(c, `${w.no} / WORK`, tx, top + 20);
  printText(c, w.title, tx, top + 104, { size: 64, weight: 500, color: S8.ink });
  s8Rule(c, tx, top + 140, R, S8.ink, 2.4);
  [['原作', w.original], ['角色', w.character], ['画师', w.artist]].forEach(([k, v], j) => { const y = top + 186 + j * 60;
    s8Mix(c, k, tx, y, { size: 26, color: S8.muted }); s8Mix(c, v, tx + 118, y, { size: 30 }); s8Rule(c, tx, y + 16, R); });
  const th = 200, tw = th * PHOTOS[w.orig].w / PHOTOS[w.orig].h, ty = top + 354;
  s8Img(c, w.orig, tx, ty, tw, th);
  s8Label(c, 'ORIGINAL', tx, ty + th + 34);
  w.quote.forEach((l, j) => printText(c, l, tx + tw + 40, ty + 24 + j * 44, { size: 26, weight: 500, color: S8.violet }));
  // 供奉规格：底线和画框下沿对齐
  s8Mix(c, 'OFFERINGS / 供奉规格', tx, bot - 78, { size: 24 });
  s8Label(c, 'DONATION · CNY', R, bot - 78, { align: 'right' });
  s8Rule(c, tx, bot - 60, R, S8.ink, 2.4);
  s8Mix(c, w.spec, tx, bot - 17, { size: 32 });
  s8Mix(c, w.price, R + (w.price.endsWith('）') ? 15 : 0), bot - 17, { size: 32, weight: 500, align: 'right' });   // 全角右括号字身右半是空的，往右补齐到线头
  s8Rule(c, tx, bot, R);
}

// 结束页（深色，宣传册封底那一页）：头像、名字、口号、网站和 QQ 群，右边二维码
function s8End(c) {
  const { M, R } = S8, faint = 'rgba(255,255,255,.6)', soft = 'rgba(255,255,255,.72)', white = '#FFFFFF';
  s8Label(c, 'CONTACT & CONNECT', M, 89, { color: faint });
  s8Label(c, 'EST. 2025.11 / BEIJING', R, 89, { color: faint, align: 'right' });
  const av = 168, ay = 250;
  s8Img(c, 'avatar', M, ay, av, av);
  printText(c, '隙间月影', M + av + 44, ay + 92, { size: 84, weight: 500, color: white });
  printText(c, 'Sukima Moonlight', M + av + 48, ay + 150, { size: 36, font: 'SMono', color: soft });
  printText(c, '名画与东方的邂逅。', M, 562, { size: 52, weight: 500, color: white });
  s8Label(c, 'WHERE CLASSIC ART MEETS TOUHOU', M, 612, { color: faint });
  [['WEBSITE', 'sukima-ml.club'], ['QQ GROUP', '917948669']].forEach(([k, v], j) => { const y = 712 + j * 84;
    s8Label(c, k, M, y, { color: faint }); printText(c, v, M + 300, y + 2, { size: 38, font: 'SMono', color: white }); s8Rule(c, M, y + 26, 1180, 'rgba(255,255,255,.18)', 1.6); });
  // 二维码：原图 840px 画成 440 见方（4K 上 880px），外面同色卡片再留 32，四周静区约 4 个模块
  const q = 440, pad = 32, cw = q + 2 * pad, qx = R - cw, qy = 240;
  c.fillStyle = S8.qrBg; c.beginPath(); c.roundRect(qx, qy, cw, cw, 26); c.fill();
  s8Img(c, 'qr', qx + pad, qy + pad, q, q);
  s8Label(c, 'QQ GROUP', qx, qy + cw + 44, { color: faint });
  s8Label(c, 'TOUHOU PROJECT × CLASSIC ART', M, S8.foot, { color: soft });
  s8Label(c, '06 / 06', R, S8.foot, { color: soft, align: 'right' });
}

// 铅笔线小电车：只有轮廓，车窗里四个小圆头，驾驶座上方撑着唐伞。x 车身中心，y 轨面，u 单位长（车长 6u）。
function s8Sketch(c, x, y, u, dist) {
  const col = '#77776f', w = 1.8, P = pts => pts.map(([a, b]) => [x + a * u, y + b * u]);
  const L = (pts, close, seed) => s8Pencil(c, P(pts), { w, col, close, seed }), O = (a, b, r, seed) => L(ellPts(a, b, r, r, 0, 26), true, seed);
  L([[-3, -2.06], [2.74, -2.06], [2.96, -1.74], [3.03, -1.1], [3.03, -.6], [-3, -.6]], true, 1);
  L([[-2.95, -2.06], [-2.72, -2.36], [2.42, -2.36], [2.8, -2.06]], false, 2);
  L([[-3, -1.08], [3.03, -1.08]], false, 3);
  [[-2.62, -1.72], [-1.5, -.6], [-.38, .52]].forEach(([a, b], k) => { L([[a, -1.92], [b, -1.92], [b, -1.3], [a, -1.3]], true, 4 + k); O((a + b) / 2, -1.52, .19, 8 + k); });
  L([[.72, -1.96], [1.42, -1.96], [1.42, -.62], [.72, -.62]], true, 12);
  L([[1.95, -1.94], [2.7, -1.94], [2.9, -1.64], [2.95, -1.3], [1.95, -1.3]], true, 13);
  O(2.35, -1.52, .19, 14);
  L([[-2.35, -2.36], [-1.85, -2.72], [-2.12, -3.02]], false, 15); L([[-2.5, -3.02], [-1.72, -3.02]], false, 16);
  const dome = []; for (let k = 0; k <= 16; k++) { const a = Math.PI + k / 16 * Math.PI; dome.push([2.1 + Math.cos(a) * .8, -2.66 + Math.sin(a) * .6]); }
  L(dome, true, 17); L([[2.1, -2.66], [2.22, -2.36]], false, 18); O(1.86, -2.86, .07, 19); L([[2.46, -2.66], [2.52, -2.46], [2.64, -2.48], [2.66, -2.66]], false, 20);
  for (const a of [-1.95, 1.9]) { O(a, -.34, .33, 21); const ang = dist / (.33 * u), dx = Math.cos(ang) * .24, dy = Math.sin(ang) * .24; L([[a - dx, -.34 - dy], [a + dx, -.34 + dy]], false, 22); }
}

function s8Scene(c, tau, i) { if (tau < S8.gate) s8Gate(c, tau, i); else s8Book(c, tau); }

scene({ order: 8, key: 'sukima', name: '8 隙间月影', dur: 22, fn: s8Scene });
