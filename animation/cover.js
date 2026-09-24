'use strict';
// B 站封面（1920×1080，一张静帧）。和片子同一套画具：墨底木刻、白色刮痕线、手写楷体、觉之瞳。
//   左：大字「Opus 5.5 / 帮我画了一部东方短片」，下面暗红印章「纯JS，无AI生图」
//   右：闭着的觉之瞳（照第 7 段片尾），一根线连到画外
//   下：一条胶片，六格片中画面；右下社团官网
// B 站信息流会把封面裁成 4:3，要紧的东西都放在中间 1440 宽（x 240–1680）里。
// 出图：node animation/tools/frames.mjs --film animation/cover.html --frames 0 --w 1920

const CV = {
  eye: [1462, 420], R: 190,
  tx: 262,                                         // 左边文字的左边
  strip: { y: 880, h: 150, gap: 18, rot: -.018 },  // 胶片条：中线、画格高、格距、倾斜
};

// 觉之瞳：墨团 + 纸色毛边描边 + 闭着的眼，下方一根线向右下拐出画外
function cvEye(c) { const [x, y] = CV.eye, R = CV.R, a = 1.2, sx = x + Math.cos(a) * R * .96, sy = y + Math.sin(a) * R * .9;
  const cord = Array.from({ length: 48 }, (_, k) => { const t = k / 47; return [lerp(sx, 1960, easeIn(t) * .6 + t * .4), lerp(sy, 690, easeOut(t)) + 34 * Math.sin(t * Math.PI * 1.5 + .4) * Math.sin(t * Math.PI)]; });
  scratch(c, cord, { w: 6, seed: 11, taper: .15, dry: 0 });
  block(c, ellPts(x, y, R, R * .95, .2, 64), K.ink, { amp: R * .04, freq: 11, seed: 12, grain: .6 });
  outline(c, rough(ellPts(x, y, R + 6, R * .95 + 6, .2, 64), { amp: R * .04, freq: 11, seed: 12 }), { w: 6, color: K.paper, seed: 13, smooth: false, rough: .3 });
  eyeLines(c, x, y + 14, R * .68, { open: 0, lid: 1, seed: 14, w: 9 }); }

// 标题：Anton 的 Opus 5.5 + 手写楷体的一句
function cvTitle(c) { const x = CV.tx;
  printText(c, 'Opus 5.5', x - 6, 352, { size: 210, font: 'Anton', color: K.paper, spacing: 4 });
  zh(c, '帮我画了一部东方短片', x, 512, { size: 92, weight: 500, color: K.paper, seed: 21, tilt: .012, jitter: .012 }); }

// 印章：暗红方框里写「纯JS，无AI生图」，斜盖（照第 7 段 WASTED 印）
function cvStamp(c) { const w = 600, h = 128, T = tf(CV.tx + w / 2 + 6, 658, 1, -.07);
  outline(c, M(T, rectPts(-w / 2, -h / 2, w, h)), { w: 12, color: K.stamp, smooth: false, rough: .45, dry: .12, seed: 31 });
  c.save(); c.translate(...T(0, 0)); c.rotate(-.07); zh(c, '纯JS，无AI生图', 0, 27, { size: 74, weight: 500, color: K.stamp, align: 'center', seed: 32, tilt: .01, jitter: .01 }); c.restore();
  texture(c, polyPath(M(T, rectPts(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20))), 'ink', .5); }

// 胶片条：黑色片基、上下两排齿孔、六格画面
function cvStrip(c) { const { y, h, gap, rot } = CV.strip, fw = h * 16 / 9, n = 6, L = n * fw + (n + 1) * gap, x0 = CX - L / 2, band = h + 64;
  c.save(); c.translate(CX, y); c.rotate(rot); c.translate(-CX, -y);
  block(c, rectPts(x0 - 40, y - band / 2, L + 80, band), '#0b0a09', { smooth: false, amp: 1.4, seed: 41, grain: .5 });
  for (let k = 0; k * 34 < L + 40; k++) for (const s of [-1, 1]) block(c, rectPts(x0 - 20 + k * 34, y + s * (band / 2 - 16) - 7, 18, 14), K.g3, { smooth: false, amp: .6, seed: 50 + k * 2 + s, grain: 0 });
  for (let k = 0; k < n; k++) { const fx = x0 + gap + k * (fw + gap); img(c, 'cf' + (k + 1), fx, y - h / 2, fw, h, { fit: 'cover' }); outline(c, rectPts(fx, y - h / 2, fw, h), { w: 2.2, color: K.g3, smooth: false, seed: 60 + k }); }
  c.restore(); }

function cvCover(c) { setView(null); inkBg(c);
  cvStrip(c); cvEye(c); cvTitle(c); cvStamp(c);
  caption(c, '东方Project · 百校天则2026', 1, 0, { per: 0, x: 250, y: 64, size: 44 });
  const url = 'sukima-ml.club', uw = zhWidth(c, url, 46);
  zh(c, url, 1656, 1040, { size: 46, color: K.paper, align: 'right', seed: 71, tilt: .01, jitter: .01 });
  zh(c, '社团官网', 1656 - uw - 18, 1040, { size: 34, color: K.g2, align: 'right', seed: 72, tilt: .01, jitter: .01 }); }

scene({ order: 1, key: 'cover', name: 'B 站封面', dur: 1, fn: c => cvCover(c) });
defineFilm({ palette: makePalette({ paper: K.paper, ink: K.ink }), timeline: SCENES.map(s => ({ ...s, fn: (c, tau, i) => { c.save(); s.fn(c, tau, i); c.restore(); frameBorder(c, 0); } })), format: { ar: '16:9', width: 1920 }, fps: 24 });
