'use strict';
// B 站封面（1920×1080，一张静帧）。和片子同一套画具：墨底木刻、白色刮痕线、手写楷体、觉之瞳。
//   左：睁开的觉之瞳（东方元素，也是全片主角），身后拖一根线；左下几行 Claude Code 的命令行（开发者元素）
//   右：大字「Opus 5.5 / 画了一部东方短片」，下面一行说明；暗红印章「0 张 AI 生图」
//   下：一条胶片，六格片中画面；右下 sukima-ml.club
// B 站信息流会把封面裁成 4:3，要紧的东西都放在中间 1440 宽（x 240–1680）里。
// 出图：node animation/tools/frames.mjs --film animation/cover.html --frames 0 --w 1920

const CV = {
  eye: [560, 420], R: 190,
  tx: 900,                                         // 标题左边
  strip: { y: 880, h: 150, gap: 18, rot: -.018 },  // 胶片条：中线、画格高、格距、倾斜
};

// 觉之瞳：墨团 + 纸色毛边描边 + 睁开的眼（照第 7 段片尾），左边三根连着画外的线（觉的第三只眼靠这几根线连在身上）
function cvEye(c) { const [x, y] = CV.eye, R = CV.R;
  [[150, 640, 30, .9], [172, 450, 40, 1.3], [196, 270, 26, 1.7]].forEach(([deg, ey, A, ph], i) => { const a = deg * Math.PI / 180, sx = x + Math.cos(a) * R * .96, sy = y + Math.sin(a) * R * .9;
    const pts = Array.from({ length: 40 }, (_, k) => { const t = k / 39; return [lerp(sx, -20, t), lerp(sy, ey, easeIO(t)) + A * Math.sin(t * Math.PI * 1.6 + ph) * Math.sin(t * Math.PI)]; });
    scratch(c, pts, { w: 6 - i * .8, seed: 11 + i, taper: .15, dry: .03 }); });
  block(c, ellPts(x, y, R, R * .95, .2, 64), K.ink, { amp: R * .04, freq: 11, seed: 12, grain: .6 });
  outline(c, rough(ellPts(x, y, R + 6, R * .95 + 6, .2, 64), { amp: R * .04, freq: 11, seed: 12 }), { w: 6, color: K.paper, seed: 13, smooth: false, rough: .3 });
  eyeLines(c, x, y, R * .58, { open: 1, lid: 1, look: [.55, .05], seed: 14, w: 9 }); }

// 标题：Anton 的 Opus 5.5 + 手写楷体的一句 + 一行说明
function cvTitle(c) { const x = CV.tx;
  printText(c, 'Opus 5.5', x - 6, 330, { size: 210, font: 'Anton', color: K.paper, spacing: 4 });
  zh(c, '画了一部东方短片', x, 490, { size: 96, weight: 500, color: K.paper, seed: 21, tilt: .012, jitter: .012 });
  zh(c, '每一帧都是代码画的 · 4K · 140 秒', x + 2, 572, { size: 42, color: K.g1, seed: 22, tilt: .01, jitter: .01 }); }

// 印章：暗红方框里写「0 张 AI 生图」，斜盖（照第 7 段 WASTED 印）
function cvStamp(c) { const T = tf(1360, 690, 1, -.14), w = 540, h = 132;
  outline(c, M(T, rectPts(-w / 2, -h / 2, w, h)), { w: 12, color: K.stamp, smooth: false, rough: .45, dry: .12, seed: 31 });
  c.save(); c.translate(...T(0, 0)); c.rotate(-.14); zh(c, '0 张 AI 生图', 0, 28, { size: 76, weight: 500, color: K.stamp, align: 'center', seed: 32, tilt: .01, jitter: .01 }); c.restore();
  texture(c, polyPath(M(T, rectPts(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20))), 'ink', .5); }

// 左下：Claude Code 命令行三行（等宽字）
function cvCode(c) { const x = 266, y0 = 668, lh = 44, col = K.g2;
  printText(c, '$ claude --model claude-opus-5-5', x, y0, { size: 30, font: 'SMono', color: K.g1 });
  printText(c, '  5 worktrees · 7 scenes · 3353 frames', x, y0 + lh, { size: 30, font: 'SMono', color: col });
  printText(c, '  ✓ merged · rendered 3840×2160', x, y0 + lh * 2, { size: 30, font: 'SMono', color: col }); }

// 胶片条：黑色片基、上下两排齿孔、六格画面
function cvStrip(c) { const { y, h, gap, rot } = CV.strip, fw = h * 16 / 9, n = 6, L = n * fw + (n + 1) * gap, x0 = CX - L / 2, band = h + 64;
  c.save(); c.translate(CX, y); c.rotate(rot); c.translate(-CX, -y);
  block(c, rectPts(x0 - 40, y - band / 2, L + 80, band), '#0b0a09', { smooth: false, amp: 1.4, seed: 41, grain: .5 });
  for (let k = 0; k * 34 < L + 40; k++) for (const s of [-1, 1]) block(c, rectPts(x0 - 20 + k * 34, y + s * (band / 2 - 16) - 7, 18, 14), K.g3, { smooth: false, amp: .6, seed: 50 + k * 2 + s, grain: 0 });
  for (let k = 0; k < n; k++) { const fx = x0 + gap + k * (fw + gap); img(c, 'cf' + (k + 1), fx, y - h / 2, fw, h, { fit: 'cover' }); outline(c, rectPts(fx, y - h / 2, fw, h), { w: 2.2, color: K.g3, smooth: false, seed: 60 + k }); }
  c.restore(); }

function cvCover(c) { setView(null); inkBg(c);
  cvStrip(c); cvEye(c); cvCode(c); cvTitle(c); cvStamp(c);
  caption(c, '北交东方 · 百校天则 2026', 1, 0, { per: 0, x: 250, y: 64, size: 44 });
  zh(c, '社团官网 sukima-ml.club', 1656, 1036, { size: 30, color: K.g2, align: 'right', seed: 71, tilt: .01, jitter: .01 }); }

scene({ order: 1, key: 'cover', name: 'B 站封面', dur: 1, fn: c => cvCover(c) });
defineFilm({ palette: makePalette({ paper: K.paper, ink: K.ink }), timeline: SCENES.map(s => ({ ...s, fn: (c, tau, i) => { c.save(); s.fn(c, tau, i); c.restore(); frameBorder(c, 0); } })), format: { ar: '16:9', width: 1920 }, fps: 24 });
