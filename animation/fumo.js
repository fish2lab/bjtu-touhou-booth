'use strict';
// 转转玩偶：雏祭摊位转台上坐着的键山雏。用 TouhouLittleMaid 的 MC 键山雏方块模型（animation/data/hina-model.js），
// 腿摆成坐姿，绕竖轴旋转。一个很小的软件渲染器：正交投影 + 深度缓冲，贴图按最近邻取样（保留 MC 的像素感），
// 颜色压到低饱和、按朝向加一点明暗，外面描一圈墨线，放进木刻画面里不跳。
//   hinaFumo(c, x, y, h, ang, o)：(x, y) 玩偶坐着的底部中心（放在转台面上），h 玩偶在画面里的高（逻辑单位），
//   ang 绕竖轴的转角（弧度，0 = 正面朝观众），o.pitch 俯视角（弧度，默认 .2），o.sat 饱和度（0..1，默认 .38），o.line 墨线粗（逻辑单位）
// 模型素材来自 TouhouLittleMaid（tartaric_acid）。玩偶出现的画面左下角写 FUMO_CREDIT 署名。

const FUMO_CREDIT = '@TLM·tartaric_acid';   // 玩偶出现的画面，左下角用小字写这一行（用户定：不写协议）
// 坐姿：覆盖这几根骨骼的旋转（度，[x, y, z]）。腿向前伸、略向外撇，手搭在腿上；整体下沉，让裙摆落在台面上。
const FUMO_POSE = { legRight: [-72, 12, 0], legLeft: [-72, -12, 0], armRight: [-34, 0, 4], armLeft: [-34, 0, -4], head: [-4, 0, 0] };
const FUMO_HIDE = new Set(['blink', 'sinFloat']);   // 眨眼贴片、背后漂着的厄运光斑
const FUMO_SINK = -4;
let FUMO_SIGN = [-1, 1, -1];   // Bedrock 旋转角到本渲染器的符号：Blockbench 读 Bedrock 用 [-x, -y, z]，再加上 Bedrock 的 x 镜像，y、z 各翻一次

const FUMO = { tex: null, tw: 0, th: 0, faces: null, H: 1, cv: null, sil: null, buf: null };
_photoLoads.push(new Promise(res => { const im = new Image();
  im.onload = () => { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
    FUMO.tex = g.getImageData(0, 0, im.width, im.height).data; FUMO.tw = im.width; FUMO.th = im.height; fumoBuild(); res(); };
  im.onerror = () => { console.error('fumo texture failed to load'); res(); }; im.src = HINA_TEX; }));

// ---- 3×4 仿射矩阵 [a b c tx; d e f ty; g h i tz] ----
const fumoMul = (A, B) => [A[0] * B[0] + A[1] * B[4] + A[2] * B[8], A[0] * B[1] + A[1] * B[5] + A[2] * B[9], A[0] * B[2] + A[1] * B[6] + A[2] * B[10], A[0] * B[3] + A[1] * B[7] + A[2] * B[11] + A[3],
  A[4] * B[0] + A[5] * B[4] + A[6] * B[8], A[4] * B[1] + A[5] * B[5] + A[6] * B[9], A[4] * B[2] + A[5] * B[6] + A[6] * B[10], A[4] * B[3] + A[5] * B[7] + A[6] * B[11] + A[7],
  A[8] * B[0] + A[9] * B[4] + A[10] * B[8], A[8] * B[1] + A[9] * B[5] + A[10] * B[9], A[8] * B[2] + A[9] * B[6] + A[10] * B[10], A[8] * B[3] + A[9] * B[7] + A[10] * B[11] + A[11]];
const fumoT = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z];
const fumoRx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]; };
const fumoRy = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]; };
const fumoRz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]; };
const fumoApply = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[3], M[4] * p[0] + M[5] * p[1] + M[6] * p[2] + M[7], M[8] * p[0] + M[9] * p[1] + M[10] * p[2] + M[11]];

// fumoBuild：把每个方块摆好姿势，拆成带贴图矩形的面。
function fumoBuild() { const byName = {}, mats = {}, D = Math.PI / 180; HINA_MODEL.bones.forEach(b => byName[b.name] = b);
  const mat = name => { if (mats[name]) return mats[name]; const b = byName[name], r = FUMO_POSE[name] || b.rotation || [0, 0, 0], p = b.pivot || [0, 0, 0];
    const sg = FUMO_SIGN, local = fumoMul(fumoT(p[0], p[1], p[2]), fumoMul(fumoRz(sg[2] * r[2] * D), fumoMul(fumoRy(sg[1] * r[1] * D), fumoMul(fumoRx(sg[0] * r[0] * D), fumoT(-p[0], -p[1], -p[2])))));
    return (mats[name] = b.parent ? fumoMul(mat(b.parent), local) : fumoMul(fumoT(0, FUMO_SINK, 0), local)); };
  const hidden = name => { for (let n = name; n; n = byName[n].parent) if (FUMO_HIDE.has(n)) return true; return false; };
  const faces = []; let top = 0;
  for (const b of HINA_MODEL.bones) { if (hidden(b.name)) continue; const M = mat(b.name);
    for (const cu of b.cubes) { const [ox, oy, oz] = cu.origin, [sx, sy, sz] = cu.size, f = cu.inflate || 0, [u, v] = cu.uv, w = Math.floor(sx), h = Math.floor(sy), d = Math.floor(sz);
      const x0 = ox - f, x1 = ox + sx + f, y0 = oy - f, y1 = oy + sy + f, z0 = oz - f, z1 = oz + sz + f, P = (x, y, z) => fumoApply(M, [x, y, z]);
      const ctr = P((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      // 每个面：四个角（顺序对应贴图的 左上、右上、右下、左下）和贴图矩形 [u0, v0, u1, v1]。正面朝 -z。
      const add = (pts, uv, flat) => { if (flat) return; const q = pts.map(p => P(...p)), n = [0, 1, 2].map(k => (q[0][k] + q[2][k]) / 2 - ctr[k]); faces.push({ q, uv, n }); for (const p of q) top = Math.max(top, p[1]); };
      add([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], [u + d, v + d, u + d + w, v + d + h], sx === 0 || sy === 0);              // 前
      add([[x1, y1, z1], [x0, y1, z1], [x0, y0, z1], [x1, y0, z1]], [u + 2 * d + w, v + d, u + 2 * d + 2 * w, v + d + h], sx === 0 || sy === 0);  // 后
      add([[x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [x0, y0, z1]], [u, v + d, u + d, v + d + h], sz === 0 || sy === 0);                      // 右（-x）
      add([[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], [u + d + w, v + d, u + 2 * d + w, v + d + h], sz === 0 || sy === 0);      // 左（+x）
      add([[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]], [u + d, v, u + d + w, v + d], sx === 0 || sz === 0);                      // 顶
      add([[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [u + d + w, v, u + d + 2 * w, v + d], sx === 0 || sz === 0);              // 底
    } }
  FUMO.faces = faces; FUMO.H = top; }

function hinaFumo(c, x, y, h, ang = 0, o = {}) { if (!FUMO.faces || !FUMO.tex) return; const { pitch = .2, sat = .38, line = 1.3, al = 1 } = o;
  const m = c.getTransform(), ppl = Math.hypot(m.a, m.b), k = h * ppl / FUMO.H;   // 输出像素 / 模型单位
  const R = fumoMul(fumoRx(-pitch), fumoRy(ang)), L = (() => { const v = [-.45, .75, -.5], n = Math.hypot(...v); return v.map(t => t / n); })();
  // 投影所有面：屏幕 x 向右，y 向下；Bedrock 的 x 是镜像的，取负后左右才对
  const proj = FUMO.faces.map(f => ({ q: f.q.map(p => { const r = fumoApply(R, p); return [-r[0] * k, -r[1] * k, r[2]]; }), uv: f.uv, n: fumoApply(R, f.n).map((t, i) => i === 0 ? -t : t) }));
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity; for (const f of proj) for (const p of f.q) { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); }
  const pad = Math.ceil(line * ppl) + 2, ox = Math.floor(mnx) - pad, oy = Math.floor(mny) - pad, bw = Math.ceil(mxx) - ox + pad, bh = Math.ceil(mxy) - oy + pad;
  if (!FUMO.cv || FUMO.cv.width < bw || FUMO.cv.height < bh) { FUMO.cv = document.createElement('canvas'); FUMO.cv.width = bw; FUMO.cv.height = bh; FUMO.sil = document.createElement('canvas'); FUMO.sil.width = bw; FUMO.sil.height = bh; }
  const W2 = FUMO.cv.width, H2 = FUMO.cv.height, g = FUMO.cv.getContext('2d'), img = g.createImageData(W2, H2), px = img.data, zb = new Float32Array(W2 * H2).fill(Infinity), T = FUMO.tex, tw = FUMO.tw, th = FUMO.th;
  for (const f of proj) { const [p0, p1, , p3] = f.q, e1 = [p1[0] - p0[0], p1[1] - p0[1]], e2 = [p3[0] - p0[0], p3[1] - p0[1]], det = e1[0] * e2[1] - e1[1] * e2[0]; if (Math.abs(det) < 1e-6) continue;
    const nl = Math.hypot(...f.n) || 1, shade = .66 + .34 * Math.max(0, (f.n[0] * L[0] + f.n[1] * L[1] + f.n[2] * L[2]) / nl), [u0, v0, u1, v1] = f.uv, dz1 = p1[2] - p0[2], dz2 = p3[2] - p0[2];
    let fx0 = Infinity, fy0 = Infinity, fx1 = -Infinity, fy1 = -Infinity; for (const p of f.q) { fx0 = Math.min(fx0, p[0]); fx1 = Math.max(fx1, p[0]); fy0 = Math.min(fy0, p[1]); fy1 = Math.max(fy1, p[1]); }
    for (let yy = Math.max(0, Math.floor(fy0 - oy)); yy <= Math.min(H2 - 1, Math.ceil(fy1 - oy)); yy++) for (let xx = Math.max(0, Math.floor(fx0 - ox)); xx <= Math.min(W2 - 1, Math.ceil(fx1 - ox)); xx++) {
      const qx = xx + ox + .5 - p0[0], qy = yy + oy + .5 - p0[1], s = (qx * e2[1] - qy * e2[0]) / det, t = (e1[0] * qy - e1[1] * qx) / det; if (s < 0 || s > 1 || t < 0 || t > 1) continue;
      const z = p0[2] + s * dz1 + t * dz2, id = yy * W2 + xx; if (z >= zb[id]) continue;
      const tu = clamp(Math.floor(u0 + s * (u1 - u0) - (u1 > u0 ? 0 : 1e-6)), 0, tw - 1), tv = clamp(Math.floor(v0 + t * (v1 - v0)), 0, th - 1), ti = (tv * tw + tu) * 4; if (T[ti + 3] < 128) continue;
      const r = T[ti], gg = T[ti + 1], b = T[ti + 2], lum = .3 * r + .59 * gg + .11 * b;
      zb[id] = z; const o4 = id * 4; px[o4] = (lum + (r - lum) * sat) * shade * .96 + 6; px[o4 + 1] = (lum + (gg - lum) * sat) * shade * .94 + 5; px[o4 + 2] = (lum + (b - lum) * sat) * shade * .9 + 3; px[o4 + 3] = 255; } }
  g.clearRect(0, 0, W2, H2); g.putImageData(img, 0, 0);
  const sg = FUMO.sil.getContext('2d'); sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, W2, H2); sg.drawImage(FUMO.cv, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = K.ink; sg.fillRect(0, 0, W2, H2);
  c.save(); c.globalAlpha *= al; c.imageSmoothingEnabled = false; const dx = x + ox / ppl, dy = y + oy / ppl, dw = W2 / ppl, dh = H2 / ppl;
  for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; c.drawImage(FUMO.sil, dx + Math.cos(a) * line, dy + Math.sin(a) * line, dw, dh); }
  c.drawImage(FUMO.cv, dx, dy, dw, dh); c.restore(); }
