/* 东方弹幕 POC · 剪纸手绘美术。全部在启动时用 canvas 2D 程序化画一次，交给 Pixi 做纹理。
 * 画法照 kevin_t_ngo 的短片：彩色纸片 + 斜向蜡笔笔触，外面一圈不规则白色撕纸边，再外面一条很细的深色外缘。
 * 每个精灵画 NV 个轮廓略有不同的变体，渲染时按 8fps 轮换，产生手绘「线条抖动」。 */
(function () {
  'use strict';
  const G = window.BXG;
  const TAU = Math.PI * 2;
  const cos = Math.cos, sin = Math.sin;
  const PAPER = '#fbf7ec';
  const RIM = 'rgba(12,14,38,0.78)';
  const HAND = '"Xiaolai", sans-serif';
  const NV = 3;
  G.NV = NV;
  G.HAND = HAND;

  const A = (G.art = {});

  // ---------- 基础 ----------
  function cv(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  }
  A.cv = cv;
  function rgbOf(h) {
    if (h[0] === '#') {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = h.match(/[\d.]+/g);
    return [+m[0], +m[1], +m[2]];
  }
  function mix(a, b, t) {
    const x = rgbOf(a), y = rgbOf(b);
    return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * t) + ',' + Math.round(x[1] + (y[1] - x[1]) * t) + ',' + Math.round(x[2] + (y[2] - x[2]) * t) + ')';
  }
  A.mix = mix;
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // 圆周上的平滑噪声，返回 a -> [-1,1]
  function ringNoise(rng, oct) {
    oct = oct || 3;
    const ph = [], fr = [], am = [];
    let tot = 0;
    for (let k = 0; k < oct; k++) { ph.push(rng() * TAU); fr.push(2 + k * 2 + (rng() * 2 | 0)); am.push(1 / (k + 1)); tot += 1 / (k + 1); }
    return (a) => { let s = 0; for (let k = 0; k < oct; k++) s += am[k] * sin(fr[k] * a + ph[k]); return s / tot; };
  }

  // 蜡笔笔触：在 [x0,y0,w,h] 里画斜向短线，调用方负责裁剪（clip 或 source-atop）
  function crayon(ctx, x0, y0, w, h, base, rng, o) {
    o = o || {};
    const dens = o.density || 70;
    const n = o.n || Math.max(10, Math.round((w * h) / dens));
    const ang = o.ang !== undefined ? o.ang : -0.62;
    const len = o.len || Math.max(7, Math.min(60, Math.min(w, h) * 0.45));
    const lw = o.lw || 2.2;
    const lt = o.light !== undefined ? o.light : 0.55;
    ctx.save();
    ctx.lineCap = 'round';
    const light1 = mix(base, '#ffffff', 0.22), light2 = mix(base, '#ffffff', 0.4);
    const dark1 = mix(base, '#000000', 0.14), dark2 = mix(base, '#000000', 0.28);
    for (let i = 0; i < n; i++) {
      const x = x0 + rng() * w, y = y0 + rng() * h;
      const a = ang + (rng() - 0.5) * 0.22;
      const L = len * (0.45 + rng() * 1.1);
      const isL = rng() < lt;
      ctx.strokeStyle = isL ? (rng() < 0.6 ? light1 : light2) : (rng() < 0.6 ? dark1 : dark2);
      ctx.globalAlpha = (o.alpha || 1) * (0.14 + rng() * 0.3);
      ctx.lineWidth = lw * (0.55 + rng() * 0.9);
      const dx = cos(a) * L * 0.5, dy = sin(a) * L * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.quadraticCurveTo(x + (rng() - 0.5) * 2, y + (rng() - 0.5) * 2, x + dx, y + dy);
      ctx.stroke();
    }
    // 纸面颗粒
    const ng = Math.round(n * 0.5);
    for (let i = 0; i < ng; i++) {
      ctx.fillStyle = rng() < 0.5 ? '#ffffff' : '#000000';
      ctx.globalAlpha = 0.05 + rng() * 0.07;
      const s = 0.8 + rng() * 1.6;
      ctx.fillRect(x0 + rng() * w, y0 + rng() * h, s, s);
    }
    ctx.restore();
  }
  A.crayon = crayon;

  function smoothPath(pts, p) {
    p = p || new Path2D();
    const n = pts.length;
    let mx = (pts[n - 1][0] + pts[0][0]) / 2, my = (pts[n - 1][1] + pts[0][1]) / 2;
    p.moveTo(mx, my);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      p.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    }
    p.closePath();
    return p;
  }
  function polyPath(pts, p) {
    p = p || new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
    return p;
  }
  A.smoothPath = smoothPath;
  A.polyPath = polyPath;
  function blob(cx, cy, rx, ry, rng, j, n, rot) {
    n = n || 22; j = j === undefined ? 0.05 : j; rot = rot || 0;
    const nz = ringNoise(rng, 3), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + j * nz(a) + j * 0.35 * (rng() - 0.5);
      const x = cos(a) * rx * k, y = sin(a) * ry * k;
      pts.push([cx + x * cos(rot) - y * sin(rot), cy + x * sin(rot) + y * cos(rot)]);
    }
    return smoothPath(pts);
  }
  A.blob = blob;

  // 一块纸片：先盖一圈不规则白边（把路径在周围多次偏移盖白），再填色、蜡笔笔触
  function piece(ctx, path, color, rng, bb, o) {
    o = o || {};
    const e = o.edge === undefined ? 2.5 : o.edge;
    if (o.rim) stamp(ctx, path, o.rim, e + (o.rimW || 1.8), 14, 0, rng);
    if (e > 0) stamp(ctx, path, o.edgeColor || PAPER, e, o.stamps || 16, 0.55, rng);
    ctx.fillStyle = color;
    ctx.fill(path);
    if (o.crayon !== false) {
      ctx.save();
      ctx.clip(path);
      crayon(ctx, bb[0], bb[1], bb[2], bb[3], color, rng, o.cr);
      ctx.restore();
    }
  }
  A.piece = piece;
  function stamp(ctx, path, color, r, n, jit, rng) {
    ctx.save();
    ctx.fillStyle = color;
    const ph = rng() * TAU;
    for (let k = 0; k < n; k++) {
      const a = ph + (k / n) * TAU + (rng() - 0.5) * 0.3;
      const rr = jit ? r * (1 - jit + rng() * (jit * 1.5 + 0.1)) : r;
      ctx.setTransform(ctx.getTransform().translate(cos(a) * rr, sin(a) * rr));
      ctx.fill(path);
      ctx.setTransform(ctx.getTransform().translate(-cos(a) * rr, -sin(a) * rr));
    }
    ctx.restore();
  }
  // 把整张画布（已画好的形体）外面再包一圈白撕纸边和深色外缘
  function tint(src, color) {
    const c = cv(src.width, src.height), x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function outlined(src, e, rng, o) {
    o = o || {};
    const out = cv(src.width, src.height), c = out.getContext('2d');
    const w = tint(src, o.edgeColor || PAPER);
    if (o.rim !== false) {
      const d = tint(src, o.rim || RIM);
      const rr = e + (o.rimW || 2);
      for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; c.drawImage(d, cos(a) * rr, sin(a) * rr); }
    }
    const n = o.stamps || 26, ph = rng() * TAU;
    for (let k = 0; k < n; k++) {
      const a = ph + (k / n) * TAU;
      const r = e * (0.45 + rng() * 0.85);
      c.drawImage(w, cos(a) * r, sin(a) * r);
    }
    c.drawImage(src, 0, 0);
    return out;
  }
  A.outlined = outlined;

  // ---------- 子弹形状（中心在原点；需要朝向的形状朝 +x） ----------
  function shapePath(shape, R, rng) {
    const j = 0.045;
    switch (shape) {
      case 'orb': case 'mid': case 'big':
        return blob(0, 0, R, R, rng, j, 24);
      case 'rice':
        return blob(0, 0, R, R * 0.5, rng, j, 22);
      case 'drop': {
        const pts = [];
        for (let i = 0; i < 26; i++) {
          const t = (i / 26) * TAU;
          const s = Math.pow(Math.abs(sin(t / 2)), 1.1);
          pts.push([cos(t) * R + (rng() - 0.5) * 1.2, sin(t) * s * R * 0.72 + (rng() - 0.5) * 1.2]);
        }
        return smoothPath(pts);
      }
      case 'star': {
        const pts = [], ph = -Math.PI / 2;
        for (let i = 0; i < 10; i++) {
          const a = ph + (i / 10) * TAU;
          const r = (i % 2 ? R * 0.5 : R) * (1 + (rng() - 0.5) * 0.08);
          pts.push([cos(a) * r, sin(a) * r]);
        }
        return polyPath(pts);
      }
      case 'heart': {
        const pts = [];
        for (let i = 0; i < 30; i++) {
          const t = (i / 30) * TAU;
          const x = 16 * Math.pow(sin(t), 3);
          const y = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t));
          pts.push([x * R / 16 + (rng() - 0.5) * 1.4, (y + 2.5) * R / 16 + (rng() - 0.5) * 1.4]);
        }
        return smoothPath(pts);
      }
      case 'ribbon': {
        const p = new Path2D();
        const jr = () => (rng() - 0.5) * 2;
        // 左右两个蝴蝶结翼 + 结 + 两条飘带
        smoothPath([[-2, -2], [-R * 1.05 + jr(), -R * 0.62 + jr()], [-R * 1.15 + jr(), 0], [-R * 1.05 + jr(), R * 0.6 + jr()], [-2, 3]], p);
        smoothPath([[2, -2], [R * 1.05 + jr(), -R * 0.62 + jr()], [R * 1.15 + jr(), 0], [R * 1.05 + jr(), R * 0.6 + jr()], [2, 3]], p);
        smoothPath([[-R * 0.1, R * 0.1], [-R * 0.55 + jr(), R * 1.05 + jr()], [-R * 0.3, R * 1.0], [0, R * 0.2]], p);
        smoothPath([[R * 0.1, R * 0.1], [R * 0.55 + jr(), R * 1.05 + jr()], [R * 0.3, R * 1.0], [0, R * 0.2]], p);
        p.addPath(blob(0, 0, R * 0.3, R * 0.34, rng, 0.06, 12));
        return p;
      }
      case 'vial': {
        const p = blob(0, R * 0.22, R * 0.78, R * 0.74, rng, 0.04, 20);
        const jr = () => (rng() - 0.5) * 1.5;
        polyPath([[-R * 0.26 + jr(), -R * 0.45], [-R * 0.24 + jr(), -R * 0.92], [R * 0.24 + jr(), -R * 0.92], [R * 0.26 + jr(), -R * 0.45]], p);
        polyPath([[-R * 0.32, -R * 0.92], [-R * 0.3 + jr(), -R * 1.22], [R * 0.3 + jr(), -R * 1.22], [R * 0.32, -R * 0.92]], p);
        return p;
      }
    }
    throw new Error('shape ' + shape);
  }

  // 撕纸边：按角度量出形状轮廓半径，外扩 e（低频粗细变化 + 高频锯齿），得到一圈不规则多边形
  function tornAround(path, rMax, e, rng) {
    const S = Math.ceil(rMax * 2 + 10), m = cv(S, S), mx = m.getContext('2d');
    mx.translate(S / 2, S / 2); mx.fillStyle = '#000'; mx.fill(path);
    const d = mx.getImageData(0, 0, S, S).data;
    const inside = (x, y) => {
      const ix = Math.round(x + S / 2), iy = Math.round(y + S / 2);
      if (ix < 0 || iy < 0 || ix >= S || iy >= S) return false;
      return d[(iy * S + ix) * 4 + 3] > 100;
    };
    const N = Math.max(30, Math.round((TAU * rMax) / 2.6));
    const nz = ringNoise(rng, 3);
    const pts = [];
    for (let k = 0; k < N; k++) {
      const a = (k / N) * TAU;
      let r = rMax + 2;
      while (r > 0 && !inside(cos(a) * r, sin(a) * r)) r -= 0.5;
      let w = e * (0.8 + 0.4 * nz(a)) + (rng() - 0.5) * e * 0.75;
      if (rng() < 0.12) w += e * (0.4 + rng() * 0.5);   // 偶尔翘起的纸纤维
      if (w < e * 0.4) w = e * 0.4;
      pts.push([cos(a) * (r + w), sin(a) * (r + w)]);
    }
    return pts;
  }

  function bulletCanvas(def, v) {
    const S = G.SHAPES[def.shape], C = G.COLOR_DEFS[def.color];
    const R = S.R * def.scale;
    const e = S.edge * Math.max(0.8, Math.min(1.25, def.scale));
    const ext = def.shape === 'ribbon' ? 1.3 : def.shape === 'vial' ? 1.3 : 1.12;
    const size = Math.ceil(2 * (R * ext + e + 5));
    const c = cv(size, size), x = c.getContext('2d');
    const rng = G.rng(hash(def.key) + v * 7919);
    x.translate(size / 2, size / 2);
    const body = C.body;
    if (S.glyph && S.tag) {
      // 字签弹：黑色小方纸签上写白字（照摊宣 Vol.1 里黑底白字的「赢」）
      const path = blob(0, 0, R * 0.98, R * 0.98, rng, 0.03, 4, Math.PI / 4 + (rng() - 0.5) * 0.12);
      const sq = new Path2D();
      const k = R * 0.92, jr = () => (rng() - 0.5) * 2.2;
      A.polyPath([[-k + jr(), -k + jr()], [k + jr(), -k + jr()], [k + jr(), k + jr()], [-k + jr(), k + jr()]], sq);
      const torn = polyPath(tornAround(sq, R * 1.4, e, rng));
      stamp(x, torn, RIM, 1.7, 12, 0, rng);
      x.fillStyle = PAPER; x.fill(torn);
      piece(x, sq, body, rng, [-R, -R, 2 * R, 2 * R], { edge: 0, cr: { density: 30, len: R * 0.6, lw: 2, light: 0.8, alpha: 0.6 } });
      x.rotate((rng() - 0.5) * 0.1);
      x.fillStyle = C.core || PAPER;
      x.font = (R * 1.5) + 'px ' + HAND;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(S.glyph, 0, R * 0.06);
      return c;
    }
    if (S.glyph) {
      // 手写字弹：先在离屏画字，再包白边
      const g = cv(size, size), gx = g.getContext('2d');
      gx.translate(size / 2, size / 2);
      gx.rotate((rng() - 0.5) * 0.12);
      const fs = R * 1.85;
      gx.font = fs + 'px ' + HAND;
      gx.textAlign = 'center';
      gx.textBaseline = 'middle';
      gx.fillStyle = body;
      gx.strokeStyle = body;
      gx.lineWidth = fs * 0.1;
      gx.lineJoin = 'round';
      gx.strokeText(S.glyph, 0, fs * 0.04);
      gx.fillText(S.glyph, 0, fs * 0.04);
      gx.setTransform(1, 0, 0, 1, 0, 0);
      gx.globalCompositeOperation = 'source-atop';
      crayon(gx, 0, 0, size, size, body, rng, { density: 30, len: 12, lw: 2.4 });
      const o = outlined(g, e, rng, { stamps: 22, rimW: 1.8 });
      x.setTransform(1, 0, 0, 1, 0, 0);
      x.drawImage(o, 0, 0);
      return c;
    }
    const path = shapePath(def.shape, R, rng);
    const bb = [-R * ext, -R * ext, 2 * R * ext, 2 * R * ext];
    const torn = polyPath(tornAround(path, R * ext, e, rng));
    stamp(x, torn, RIM, 1.7, 12, 0, rng);
    x.fillStyle = PAPER; x.fill(torn);
    piece(x, path, body, rng, bb, {
      edge: 0,
      cr: { density: 26, len: Math.max(8, R * 0.7), lw: Math.max(1.6, R * 0.1), light: def.color === 'black' ? 0.8 : 0.55, alpha: def.color === 'black' ? 0.6 : 1 },
    });
    const core = C.core;
    x.save();
    x.clip(path);
    switch (def.shape) {
      case 'orb': case 'mid': case 'big': {
        if (core) {
          const cp = blob(-R * 0.08, -R * 0.08, R * 0.46, R * 0.46, rng, 0.08, 14);
          x.fillStyle = core; x.globalAlpha = 0.92; x.fill(cp);
          x.globalAlpha = 1;
          x.save(); x.clip(cp); crayon(x, -R, -R, 2 * R, 2 * R, core, rng, { density: 30, len: R * 0.5, lw: 1.6 }); x.restore();
        } else {
          x.strokeStyle = 'rgba(255,255,255,0.22)'; x.lineWidth = Math.max(2, R * 0.12); x.lineCap = 'round';
          x.beginPath(); x.arc(0, 0, R * 0.62, -2.6, -1.4); x.stroke();
        }
        break;
      }
      case 'rice': case 'drop': {
        x.fillStyle = core || '#ffffff'; x.globalAlpha = 0.85;
        x.fill(blob(def.shape === 'drop' ? -R * 0.15 : 0, 0, R * 0.55, R * 0.15, rng, 0.1, 12));
        break;
      }
      case 'heart': {
        x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = Math.max(2.2, R * 0.13); x.lineCap = 'round';
        x.beginPath(); x.arc(-R * 0.42, -R * 0.2, R * 0.28, 3.4, 4.5); x.stroke();
        break;
      }
      case 'star': {
        x.fillStyle = mix(body, '#ffffff', 0.35); x.globalAlpha = 0.8;
        x.fill(blob(0, 0, R * 0.2, R * 0.2, rng, 0.1, 10));
        break;
      }
      case 'ribbon': {
        x.fillStyle = mix(body, '#000000', 0.25); x.globalAlpha = 0.85;
        x.fill(blob(0, 0, R * 0.26, R * 0.3, rng, 0.08, 10));
        x.strokeStyle = mix(body, '#000000', 0.2); x.lineWidth = 1.6; x.globalAlpha = 0.6;
        x.beginPath(); x.moveTo(-R * 0.3, 0); x.lineTo(-R * 0.85, -R * 0.2); x.moveTo(R * 0.3, 0); x.lineTo(R * 0.85, -R * 0.2); x.stroke();
        break;
      }
      case 'vial': {
        // 瓶颈是浅色玻璃，木塞，瓶身贴一张写着问号的纸标签
        x.globalAlpha = 1;
        x.fillStyle = '#e9f1f4';
        x.fillRect(-R * 0.4, -R * 0.95, R * 0.8, R * 0.55);
        x.fillStyle = '#c99a5b';
        x.fillRect(-R * 0.4, -R * 1.3, R * 0.8, R * 0.38);
        const lab = blob(0, R * 0.25, R * 0.42, R * 0.44, rng, 0.06, 12);
        x.fillStyle = '#fbf7ec'; x.fill(lab);
        x.fillStyle = '#1b1b26';
        x.font = (R * 0.8) + 'px ' + HAND;
        x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('?', 0, R * 0.3);
        break;
      }
    }
    x.restore();
    return c;
  }

  // ---------- 特效精灵 ----------
  function fxCanvas(i, v) {
    const rng = G.rng(9001 + i * 131 + v * 7);
    const F = G.FXS;
    if (i < F.NSHRED) {
      const cols = ['#f3ead2', '#3a66c4', '#f3ead2', '#7e4fc2', '#f6c63f', '#f07ea4', '#fbf7ec', '#3a66c4', '#f3ead2', '#f08434', '#e2463c', '#7e4fc2'];
      const R = 10 + (i % 4) * 4;
      const size = R * 2 + 16, c = cv(size, size), x = c.getContext('2d');
      x.translate(size / 2, size / 2);
      const n = 4 + (i % 3), pts = [];
      for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rng() * 0.8; const r = R * (0.5 + rng() * 0.6); pts.push([cos(a) * r, sin(a) * r]); }
      piece(x, polyPath(pts), cols[i], rng, [-R, -R, 2 * R, 2 * R], { edge: 2.5, rim: RIM, rimW: 1.2, stamps: 10, cr: { density: 20, len: 8, lw: 1.6 } });
      return c;
    }
    if (i === F.star || (i >= F.bigstar && i < F.bigstar + F.NBIG)) {
      const big = i !== F.star;
      const cols = ['#e2463c', '#f08434', '#f6c63f', '#48a852', '#39b4c8', '#3f78d8', '#8a58cc'];
      const R = big ? 46 : 12;
      const col = big ? cols[i - F.bigstar] : '#f6c63f';
      const size = R * 2 + 24, c = cv(size, size), x = c.getContext('2d');
      x.translate(size / 2, size / 2);
      piece(x, shapePath('star', R, rng), col, rng, [-R, -R, 2 * R, 2 * R], { edge: big ? 5 : 3, rim: RIM, rimW: 1.5, stamps: 16, cr: { density: 24, len: R * 0.6, lw: big ? 3 : 1.6 } });
      return c;
    }
    if (i === F.spark) {
      const size = 34, c = cv(size, size), x = c.getContext('2d');
      x.translate(17, 17);
      x.strokeStyle = '#ffffff'; x.lineCap = 'round';
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * TAU + 0.3 + rng() * 0.2;
        x.lineWidth = 3.2 - (k % 2);
        x.beginPath(); x.moveTo(cos(a) * 4, sin(a) * 4); x.lineTo(cos(a) * (12 + rng() * 3), sin(a) * (12 + rng() * 3)); x.stroke();
      }
      return c;
    }
    if (i === F.ring) {
      const R = 110, size = 2 * R + 40, c = cv(size, size), x = c.getContext('2d');
      x.translate(size / 2, size / 2);
      x.strokeStyle = '#ffffff'; x.lineCap = 'round'; x.lineJoin = 'round';
      for (let pass = 0; pass < 2; pass++) {
        x.lineWidth = pass ? 5 : 10;
        x.globalAlpha = pass ? 1 : 0.55;
        x.beginPath();
        const nz = ringNoise(rng, 3);
        for (let k = 0; k <= 64; k++) {
          const a = (k / 64) * TAU; const r = R * (1 + 0.04 * nz(a)) + (rng() - 0.5) * 3;
          if (k) x.lineTo(cos(a) * r, sin(a) * r); else x.moveTo(cos(a) * r, sin(a) * r);
        }
        x.stroke();
      }
      return c;
    }
    if (i === F.puff) {
      const R = 30, size = 2 * R + 20, c = cv(size, size), x = c.getContext('2d');
      x.translate(size / 2, size / 2);
      piece(x, blob(0, 0, R, R, rng, 0.1, 16), '#fbf7ec', rng, [-R, -R, 2 * R, 2 * R], { edge: 0, cr: { density: 30, len: 12, lw: 2 } });
      return c;
    }
    if (i === F.ticket) {
      const c = cv(34, 64), x = c.getContext('2d');
      x.translate(17, 32);
      const p = polyPath([[-8 + (rng() - 0.5), -22], [8, -22 + (rng() - 0.5)], [8 + (rng() - 0.5), 22], [-8, 22]]);
      piece(x, p, '#f3ead2', rng, [-9, -23, 18, 46], { edge: 2.5, rim: 'rgba(12,14,38,0.55)', rimW: 1.2, stamps: 10, cr: { density: 14, len: 8, lw: 1.4 } });
      x.fillStyle = '#3a66c4'; x.fillRect(-8, 2, 16, 6);
      x.fillStyle = '#1b2150'; x.beginPath(); x.arc(0, -12, 2.6, 0, TAU); x.fill();
      return c;
    }
    if (i === F.raindrop) {
      const R = 13, c = cv(40, 40), x = c.getContext('2d');
      x.translate(20, 20);
      x.rotate(-Math.PI / 2);
      piece(x, shapePath('drop', R, rng), '#9a6ad6', rng, [-R, -R, 2 * R, 2 * R], { edge: 2.5, rim: 'rgba(12,14,38,0.5)', rimW: 1, stamps: 10, cr: { density: 16, len: 8, lw: 1.4 } });
      return c;
    }
    return cv(4, 4);
  }

  // ---------- 图集 ----------
  A.buildAtlas = function () {
    const items = [];
    for (let s = 0; s < G.SPRS.length; s++) for (let v = 0; v < NV; v++) items.push({ kind: 'b', s, v, c: bulletCanvas(G.SPRS[s], v) });
    for (let i = 0; i < G.NFX; i++) for (let v = 0; v < NV; v++) items.push({ kind: 'f', s: i, v, c: fxCanvas(i, v) });
    const AW = 2048;
    const order = items.slice().sort((a, b) => b.c.height - a.c.height);
    let x = 0, y = 0, rowH = 0;
    for (const it of order) {
      const w = it.c.width + 2, h = it.c.height + 2;
      if (x + w > AW) { x = 0; y += rowH; rowH = 0; }
      it.x = x + 1; it.y = y + 1;
      x += w;
      if (h > rowH) rowH = h;
    }
    const AH = y + rowH;
    const atlas = cv(AW, AH), ax = atlas.getContext('2d');
    const bFrames = [], fFrames = [];
    for (const it of items) {
      ax.drawImage(it.c, it.x, it.y);
      const fr = [it.x, it.y, it.c.width, it.c.height];
      const arr = it.kind === 'b' ? bFrames : fFrames;
      (arr[it.s] || (arr[it.s] = []))[it.v] = fr;
    }
    return { canvas: atlas, bFrames, fFrames, count: items.length };
  };

  // ---------- 自机：剪纸小电车「幻想乡交通大学号」（正面） ----------
  A.tram = function (v) {
    const rng = G.rng(501 + v * 17);
    const Wc = 190, Hc = 250;
    const src = cv(Wc, Hc), x = src.getContext('2d');
    x.translate(Wc / 2, Hc / 2 + 14);
    const j = () => (rng() - 0.5) * 2.2;
    const opt = { edge: 2, stamps: 10 };
    // 受电弓
    x.strokeStyle = '#2b2d44'; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath();
    x.moveTo(-22 + j(), -66); x.lineTo(-4 + j(), -92 + j()); x.lineTo(14 + j(), -66);
    x.moveTo(-36 + j(), -100 + j()); x.lineTo(36 + j(), -100 + j());
    x.moveTo(-4, -92); x.lineTo(0, -100);
    x.stroke();
    // 车顶
    piece(x, blob(0, -62, 46, 9, rng, 0.05, 14), '#c9c2ad', rng, [-50, -72, 100, 20], opt);
    // 车身
    const body = smoothPath([[-58 + j(), 70], [-60 + j(), 10], [-58 + j(), -42], [-44 + j(), -60 + j()], [0, -64 + j()], [44 + j(), -60 + j()], [58 + j(), -42], [60 + j(), 10], [58 + j(), 70], [0, 74 + j()]]);
    piece(x, body, '#f3ead2', rng, [-62, -66, 124, 142], { edge: 0, cr: { density: 40, len: 22, lw: 2.4 } });
    // 目的地牌
    piece(x, polyPath([[-32 + j(), -52], [32 + j(), -52], [32, -38 + j()], [-32, -38 + j()]]), '#23264a', rng, [-34, -54, 68, 18], { edge: 1.5, stamps: 8, cr: { density: 30, len: 8, lw: 1.2 } });
    x.fillStyle = '#f6c63f';
    for (let k = 0; k < 7; k++) x.fillRect(-26 + k * 7.6, -47 + (rng() - 0.5) * 1.5, 4.5, 4);
    // 前窗，里面是开车的多多良小伞
    const win = smoothPath([[-44 + j(), -30], [44 + j(), -30], [46 + j(), 8 + j()], [-46 + j(), 8 + j()]]);
    piece(x, win, '#ffe6a0', rng, [-46, -32, 92, 42], { edge: 2, stamps: 10, cr: { density: 30, len: 14, lw: 2 } });
    x.save(); x.clip(win);
    piece(x, blob(-2, -2, 14, 14, rng, 0.05, 14), '#f7dcc6', rng, [-16, -16, 30, 30], { edge: 0, crayon: false });
    piece(x, smoothPath([[-17, -2], [-15, -15], [-2, -21], [12, -15], [15, -2], [8, -8], [0, -11], [-8, -7]]), '#7fb3e6', rng, [-18, -22, 36, 22], { edge: 0, cr: { density: 20, len: 8, lw: 1.4 } });
    x.fillStyle = '#2a1f2e';
    x.fillRect(-8, -1, 3, 4); x.fillRect(4, -1, 3, 4);
    x.fillStyle = 'rgba(240,120,140,0.6)';
    x.beginPath(); x.arc(-10, 5, 3, 0, TAU); x.arc(9, 5, 3, 0, TAU); x.fill();
    x.restore();
    x.strokeStyle = '#f3ead2'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(-26, -30); x.lineTo(-26, 8); x.moveTo(26, -30); x.lineTo(26, 8); x.stroke();
    // 蓝色腰线
    const band = polyPath([[-60, 16 + j() * 0.5], [60, 16 + j() * 0.5], [60, 30 + j() * 0.5], [-60, 30 + j() * 0.5]]);
    x.save(); x.clip(body);
    piece(x, band, '#3a66c4', rng, [-60, 14, 120, 18], { edge: 0, cr: { density: 20, len: 14, lw: 1.8 } });
    x.fillStyle = 'rgba(251,247,236,0.9)'; x.fillRect(-60, 33, 120, 2.5);
    x.restore();
    // 车灯、保险杠
    for (const s of [-1, 1]) piece(x, blob(s * 38, 50, 8, 8, rng, 0.06, 12), '#f6c63f', rng, [s * 38 - 9, 41, 18, 18], { edge: 2, stamps: 8, cr: { density: 12, len: 5, lw: 1.2 } });
    x.fillStyle = '#23264a'; x.fillRect(-16, 44, 32, 12);
    x.fillStyle = '#f6c63f'; x.fillRect(-10, 48.5, 20, 3);
    piece(x, polyPath([[-60, 68], [60, 68], [56, 80 + j() * 0.5], [-56, 80 + j() * 0.5]]), '#2b2d44', rng, [-60, 66, 120, 16], { edge: 0, crayon: false });
    return outlined(src, 5, rng, { stamps: 24 });
  };

  // ---------- 多多良小伞的唐伞（一只大眼睛 + 吐出的舌头） ----------
  A.umbrella = function (v) {
    const rng = G.rng(777 + v * 23);
    const Wc = 150, Hc = 180;
    const src = cv(Wc, Hc), x = src.getContext('2d');
    x.translate(Wc / 2, 62);
    const j = () => (rng() - 0.5) * 2;
    // 伞柄
    x.strokeStyle = '#8a5a32'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, 10); x.quadraticCurveTo(2 + j(), 50, 0, 88 + j()); x.stroke();
    // 舌头
    const tongue = smoothPath([[-14, 16], [-6, 16], [-4 + j(), 40], [-8 + j(), 58], [-16 + j(), 60], [-20, 46], [-18, 28]]);
    piece(x, tongue, '#e2536d', rng, [-22, 14, 22, 50], { edge: 2, stamps: 8, cr: { density: 14, len: 8, lw: 1.4 } });
    // 伞面
    const pts = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI + (k / 12) * Math.PI; pts.push([cos(a) * 56 + j(), sin(a) * 48 + 10 + j()]); }
    // 伞面下沿：从右往左的波浪褶边
    for (let k = 0; k < 6; k++) { const x0 = 56 - k * (112 / 6); pts.push([x0 - 9 + j(), 24 + j()]); if (k < 5) pts.push([x0 - 18.7, 13]); }
    const canopy = smoothPath(pts);
    piece(x, canopy, '#7e4fc2', rng, [-58, -42, 116, 66], { edge: 2, stamps: 10, cr: { density: 22, len: 18, lw: 2.2 } });
    x.save(); x.clip(canopy);
    x.strokeStyle = mix('#7e4fc2', '#000000', 0.3); x.lineWidth = 2; x.globalAlpha = 0.6;
    for (const tx of [-36, -12, 12, 36]) { x.beginPath(); x.moveTo(0, -36); x.quadraticCurveTo(tx * 0.6, -10, tx, 22); x.stroke(); }
    x.restore();
    // 伞尖
    x.fillStyle = '#8a5a32'; x.fillRect(-3, -48, 6, 10);
    // 大眼睛
    piece(x, blob(8, -6, 17, 13, rng, 0.05, 16), '#fbf7ec', rng, [-10, -20, 36, 28], { edge: 1.5, rim: 'rgba(40,20,60,0.6)', rimW: 1, stamps: 8, cr: { density: 30, len: 8, lw: 1.2, light: 0.2 } });
    x.fillStyle = '#c0304a'; x.beginPath(); x.arc(11 + j() * 0.3, -5, 7.5, 0, TAU); x.fill();
    x.fillStyle = '#1b1022'; x.beginPath(); x.arc(12, -5, 4, 0, TAU); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(14, -8, 1.8, 0, TAU); x.fill();
    return outlined(src, 4, rng, { stamps: 20 });
  };

  // ---------- Boss：剪纸 Q 版八云紫 ----------
  A.yukari = function (v) {
    const rng = G.rng(1301 + v * 29);
    const Wc = 330, Hc = 360;
    const src = cv(Wc, Hc), x = src.getContext('2d');
    x.translate(Wc / 2, 188);
    const j = () => (rng() - 0.5) * 2.4;
    const o = { edge: 2.5, stamps: 12 };
    const GOLD = '#f1c24f', SKIN = '#fbe1cb', PURP = '#7a4cc0', WHITE = '#f8f5fb', RED = '#d4344a';
    // 后发
    piece(x, smoothPath([[-60, -90], [0, -118], [60, -90], [80 + j(), -20], [84 + j(), 50], [76 + j(), 104], [52, 118 + j()], [30, 100], [0, 110 + j()], [-30, 100], [-52, 118 + j()], [-76 + j(), 104], [-84 + j(), 50], [-80 + j(), -20]]), GOLD, rng, [-86, -120, 172, 240], { edge: 2.5, stamps: 12, cr: { density: 30, len: 30, lw: 2.6, ang: 1.3 } });
    // 裙子（紫色）+ 白色裙摆花边
    for (let k = -3; k <= 3; k++) piece(x, blob(k * 22, 142, 14, 10, rng, 0.08, 10), WHITE, rng, [k * 22 - 15, 131, 30, 22], { edge: 1.5, stamps: 6, crayon: false });
    const dress = smoothPath([[-26 + j(), 6], [26 + j(), 6], [50 + j(), 70], [76 + j(), 138], [40, 146 + j()], [0, 140 + j()], [-40, 146 + j()], [-76 + j(), 138], [-50 + j(), 70]]);
    piece(x, dress, PURP, rng, [-78, 4, 156, 146], { edge: 2.5, stamps: 12, cr: { density: 30, len: 26, lw: 2.6 } });
    // 八卦横线
    x.fillStyle = '#1d1426';
    for (let r = 0; r < 3; r++) {
      const yy = 70 + r * 16;
      if (r === 1) { x.fillRect(-16, yy, 12, 6); x.fillRect(4, yy, 12, 6); } else x.fillRect(-16, yy, 32, 6);
    }
    // 领口与胸前红蝴蝶结
    piece(x, polyPath([[-20, 6], [20, 6], [0, 30 + j()]]), WHITE, rng, [-20, 4, 40, 28], { edge: 1.5, stamps: 6, crayon: false });
    x.save(); x.translate(-22, 40); piece(x, shapePath('ribbon', 8, rng), RED, rng, [-12, -12, 24, 24], { edge: 1.5, stamps: 6, crayon: false }); x.restore();
    x.save(); x.translate(22, 40); piece(x, shapePath('ribbon', 8, rng), RED, rng, [-12, -12, 24, 24], { edge: 1.5, stamps: 6, crayon: false }); x.restore();
    // 袖子（白、红袖带）与手
    for (const s of [-1, 1]) {
      const sl = blob(s * 50, 46, 24, 30, rng, 0.07, 14, s * 0.3);
      piece(x, sl, WHITE, rng, [s * 50 - 26, 14, 52, 64], o);
      x.save(); x.clip(sl); x.fillStyle = RED; x.fillRect(s * 50 - 30, 50, 60, 6); x.restore();
      piece(x, blob(s * 56, 80, 9, 9, rng, 0.06, 10), SKIN, rng, [s * 56 - 10, 70, 20, 20], { edge: 1.5, stamps: 6, crayon: false });
    }
    // 脸
    piece(x, blob(0, -44, 56, 52, rng, 0.025, 26), SKIN, rng, [-58, -98, 116, 108], { edge: 2.5, stamps: 12, cr: { density: 60, len: 20, lw: 2, alpha: 0.6 } });
    // 两侧发束 + 发梢红蝴蝶结
    for (const s of [-1, 1]) {
      piece(x, smoothPath([[s * 44, -80], [s * 62 + j(), -50], [s * 64 + j(), -6], [s * 58 + j(), 22], [s * 48, 14], [s * 46 + j(), -30], [s * 38, -64]]), GOLD, rng, [-66, -82, 132, 106], { edge: 2, stamps: 10, cr: { density: 24, len: 20, lw: 2, ang: 1.4 } });
      x.save(); x.translate(s * 56, 24); x.rotate(s * 0.2); piece(x, shapePath('ribbon', 9, rng), RED, rng, [-12, -12, 24, 24], { edge: 1.5, stamps: 6, crayon: false }); x.restore();
    }
    // 刘海
    piece(x, smoothPath([[-58, -54], [-56, -86], [-30, -106], [0, -112], [30, -106], [56, -86], [58, -54], [46, -64 + j()], [34, -52 + j()], [22, -70 + j()], [8, -54 + j()], [-6, -72 + j()], [-20, -54 + j()], [-34, -70 + j()], [-46, -56 + j()]]), GOLD, rng, [-60, -114, 120, 64], { edge: 2, stamps: 10, cr: { density: 24, len: 22, lw: 2.2, ang: 1.2 } });
    // 帽子：白色 mob cap + 褶边 + 红缎带
    for (let k = -4; k <= 4; k++) piece(x, blob(k * 16, -86 + Math.abs(k) * 1.6, 11, 9, rng, 0.08, 10), '#ffffff', rng, [k * 16 - 12, -96, 24, 20], { edge: 1.2, stamps: 5, crayon: false });
    const cap = blob(0, -118, 72, 38, rng, 0.04, 22);
    piece(x, cap, '#fdfbf6', rng, [-74, -158, 148, 78], { edge: 2.5, stamps: 12, cr: { density: 40, len: 26, lw: 2, light: 0.2, alpha: 0.7 } });
    x.save(); x.clip(cap);
    x.strokeStyle = RED; x.lineWidth = 8; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-72, -104 + j()); x.quadraticCurveTo(0, -128 + j(), 72, -104 + j()); x.stroke();
    x.restore();
    x.save(); x.translate(34, -118); x.rotate(-0.2); piece(x, shapePath('ribbon', 17, rng), RED, rng, [-24, -20, 48, 40], { edge: 2, stamps: 8, cr: { density: 16, len: 10, lw: 1.6 } }); x.restore();
    // 五官：点眼、腮红、小嘴
    x.fillStyle = '#2a1f2e';
    x.beginPath(); x.ellipse(-20 + j() * 0.2, -40, 5, 7, 0, 0, TAU); x.ellipse(20 + j() * 0.2, -40, 5, 7, 0, 0, TAU); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(-18, -43, 1.8, 0, TAU); x.arc(22, -43, 1.8, 0, TAU); x.fill();
    x.fillStyle = 'rgba(240,120,140,0.55)';
    x.beginPath(); x.arc(-32, -24, 9, 0, TAU); x.arc(32, -24, 9, 0, TAU); x.fill();
    x.strokeStyle = '#6a2a3a'; x.lineWidth = 2.6; x.lineCap = 'round';
    x.beginPath(); x.arc(0, -26, 7, 0.35, Math.PI - 0.35); x.stroke();
    return outlined(src, 6, rng, { stamps: 26 });
  };
  // 阳伞（粉白，带褶边），单独一张，渲染时轻轻摇
  A.parasol = function (v) {
    const rng = G.rng(1601 + v * 31);
    const Wc = 260, Hc = 250;
    const src = cv(Wc, Hc), x = src.getContext('2d');
    x.translate(Wc / 2, 100);
    const j = () => (rng() - 0.5) * 2;
    x.strokeStyle = '#8a5a32'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(2 + j(), 136); x.stroke();
    for (let k = -5; k <= 5; k++) piece(x, blob(k * 20, 16 + j() * 0.5, 13, 10, rng, 0.1, 10), '#ffffff', rng, [k * 20 - 14, 4, 28, 24], { edge: 1.2, stamps: 5, crayon: false });
    const pts = [];
    for (let k = 0; k <= 14; k++) { const a = Math.PI + (k / 14) * Math.PI; pts.push([cos(a) * 112 + j(), sin(a) * 72 + 12 + j()]); }
    pts.push([0, 20]);
    const can = smoothPath(pts);
    piece(x, can, '#f4d4e2', rng, [-114, -64, 228, 88], { edge: 2.5, stamps: 12, cr: { density: 30, len: 30, lw: 2.4 } });
    x.save(); x.clip(can);
    x.strokeStyle = '#d99ab6'; x.lineWidth = 2.4; x.globalAlpha = 0.8;
    for (const tx of [-80, -40, 0, 40, 80]) { x.beginPath(); x.moveTo(0, -58); x.quadraticCurveTo(tx * 0.6, -20, tx, 20); x.stroke(); }
    x.restore();
    x.fillStyle = '#8a5a32'; x.fillRect(-3, -72, 6, 12);
    return outlined(src, 4, rng, { stamps: 20 });
  };

  // Boss 背后的手绘符卡圆阵（虚线圆 + 小星星），只画一张，渲染时旋转
  A.circle = function () {
    const rng = G.rng(4242);
    const R = 230, size = 2 * R + 40, c = cv(size, size), x = c.getContext('2d');
    x.translate(size / 2, size / 2);
    x.lineCap = 'round';
    x.strokeStyle = 'rgba(251,247,236,0.85)';
    x.setLineDash([22, 16]); x.lineWidth = 5;
    x.beginPath(); for (let k = 0; k <= 80; k++) { const a = (k / 80) * TAU, r = R - 8 + (rng() - 0.5) * 3; k ? x.lineTo(cos(a) * r, sin(a) * r) : x.moveTo(cos(a) * r, sin(a) * r); } x.stroke();
    x.setLineDash([]); x.lineWidth = 3; x.strokeStyle = 'rgba(251,247,236,0.5)';
    x.beginPath(); for (let k = 0; k <= 60; k++) { const a = (k / 60) * TAU, r = R * 0.72 + (rng() - 0.5) * 3; k ? x.lineTo(cos(a) * r, sin(a) * r) : x.moveTo(cos(a) * r, sin(a) * r); } x.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      x.save(); x.translate(cos(a) * R * 0.86, sin(a) * R * 0.86); x.rotate(a);
      piece(x, shapePath('star', 12, rng), k % 2 ? '#f6c63f' : '#f4d4e2', rng, [-12, -12, 24, 24], { edge: 2.5, stamps: 8, cr: { density: 14, len: 6, lw: 1.2 } });
      x.restore();
    }
    return c;
  };

  // ---------- 隙间：细长眼形裂缝，两端小红蝴蝶结（横向，渲染时旋转/按开合缩放 y） ----------
  A.gap = function (v) {
    const rng = G.rng(2201 + v * 37);
    const L = 230, Hh = 46;
    const Wc = 2 * L + 90, Hc = 2 * Hh + 70;
    const src = cv(Wc, Hc), x = src.getContext('2d');
    x.translate(Wc / 2, Hc / 2);
    const pts = [];
    for (let k = 0; k < 32; k++) {
      const t = (k / 32) * TAU;
      const px = cos(t) * L;
      const py = sin(t) * Hh * Math.pow(Math.abs(sin(t)), 0.25) * (1 + (rng() - 0.5) * 0.08);
      pts.push([px + (rng() - 0.5) * 2, py]);
    }
    const lens = smoothPath(pts);
    piece(x, lens, '#6d2f8e', rng, [-L, -Hh, 2 * L, 2 * Hh], { edge: 4, rim: RIM, rimW: 2, stamps: 18, cr: { density: 30, len: 30, lw: 2.4 } });
    const inner = [];
    for (let k = 0; k < 32; k++) {
      const t = (k / 32) * TAU;
      inner.push([cos(t) * (L - 16), sin(t) * (Hh - 9) * Math.pow(Math.abs(sin(t)), 0.25)]);
    }
    const inn = smoothPath(inner);
    x.fillStyle = '#1c0d2a'; x.fill(inn);
    x.save(); x.clip(inn);
    crayon(x, -L, -Hh, 2 * L, 2 * Hh, '#1c0d2a', rng, { density: 40, len: 30, lw: 2.4, light: 0.8 });
    // 隙间里的眼睛
    for (let k = 0; k < 5; k++) {
      const ex = -L * 0.7 + k * L * 0.35 + (rng() - 0.5) * 20, ey = (rng() - 0.5) * 18;
      x.fillStyle = 'rgba(251,247,236,0.8)'; x.beginPath(); x.ellipse(ex, ey, 10, 6, 0, 0, TAU); x.fill();
      x.fillStyle = '#c0304a'; x.beginPath(); x.arc(ex, ey, 4, 0, TAU); x.fill();
    }
    x.restore();
    for (const s of [-1, 1]) {
      x.save(); x.translate(s * (L + 4), 0); x.rotate(s * 0.15 + (rng() - 0.5) * 0.2);
      piece(x, shapePath('ribbon', 22, rng), '#d4344a', rng, [-30, -26, 60, 52], { edge: 3, rim: RIM, rimW: 1.5, stamps: 12, cr: { density: 16, len: 10, lw: 1.6 } });
      x.restore();
    }
    return src;
  };

  // ---------- 帕秋莉的问号药瓶发射口 ----------
  A.bottle = function (liquid, v) {
    const rng = G.rng(3301 + v * 41 + hash(liquid) % 1000);
    const Wc = 220, Hc = 290;
    const src = cv(Wc, Hc), x = src.getContext('2d');
    x.translate(Wc / 2, 170);
    const j = () => (rng() - 0.5) * 2.4;
    const glass = smoothPath([[-26 + j(), -120], [26 + j(), -120], [28, -64 + j()], [72 + j(), -20], [84 + j(), 30], [70 + j(), 82], [0, 100 + j()], [-70 + j(), 82], [-84 + j(), 30], [-72 + j(), -20], [-28, -64 + j()]]);
    piece(x, glass, '#e4eef2', rng, [-86, -122, 172, 224], { edge: 0, cr: { density: 50, len: 24, lw: 2, light: 0.4 } });
    x.save(); x.clip(glass);
    const liq = new Path2D();
    liq.moveTo(-100, -4 + j());
    for (let k = 0; k <= 8; k++) liq.lineTo(-100 + k * 25, -6 + sin(k * 1.3 + rng() * 2) * 5);
    liq.lineTo(100, 120); liq.lineTo(-100, 120); liq.closePath();
    piece(x, liq, liquid, rng, [-100, -14, 200, 134], { edge: 0, cr: { density: 30, len: 26, lw: 2.6 } });
    x.fillStyle = 'rgba(251,247,236,0.75)';
    for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(-50 + rng() * 100, 10 + rng() * 60, 3 + rng() * 6, 0, TAU); x.fill(); }
    x.restore();
    // 木塞
    piece(x, polyPath([[-30 + j(), -150], [30 + j(), -150], [26, -118], [-26, -118]]), '#c99a5b', rng, [-32, -152, 64, 36], { edge: 2, stamps: 8, cr: { density: 20, len: 10, lw: 1.6 } });
    // 纸标签 + 问号
    const lab = blob(0, 30, 40, 40, rng, 0.05, 16);
    piece(x, lab, '#fbf7ec', rng, [-42, -12, 84, 84], { edge: 0, cr: { density: 60, len: 12, lw: 1.4, light: 0.2, alpha: 0.6 } });
    x.fillStyle = '#1b1b26';
    x.font = '66px ' + HAND; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('?', 2 + j() * 0.5, 34);
    return outlined(src, 5, rng, { stamps: 24 });
  };

  // 低速时的判定点：白点 + 红圈
  A.hitbox = function () {
    const c = cv(44, 44), x = c.getContext('2d');
    x.translate(22, 22);
    x.fillStyle = 'rgba(12,14,38,0.8)'; x.beginPath(); x.arc(0, 0, 15, 0, TAU); x.fill();
    x.fillStyle = '#e2463c'; x.beginPath(); x.arc(0, 0, 13, 0, TAU); x.fill();
    x.fillStyle = '#fbf7ec'; x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.fill();
    return c;
  };

  // ---------- 场地背景：深蓝卡纸夜空 + 蜡笔斜笔触 + 撕纸夜空带 + 黄色纸星星 ----------
  A.sky = function (Wf, Hf) {
    const rng = G.rng(8080);
    const c = cv(Wf, Hf), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, Hf);
    g.addColorStop(0, '#262d6b'); g.addColorStop(1, '#1b2150');
    x.fillStyle = g; x.fillRect(0, 0, Wf, Hf);
    crayon(x, -40, -40, Wf + 80, Hf + 80, '#232a64', rng, { density: 110, len: 70, lw: 3.2, alpha: 0.75 });
    // 撕纸夜空带：浅一点的蓝，顶边一条不规则白撕边
    const bands = [[360, 120, '#2c357a'], [930, 150, '#2a3276'], [1500, 130, '#2e377e']];
    for (const [y0, hh, col] of bands) {
      const top = [], bot = [];
      const nz = ringNoise(rng, 3);
      for (let k = 0; k <= 60; k++) {
        const xx = (k / 60) * (Wf + 40) - 20;
        top.push([xx, y0 + nz(k * 0.09) * 26 + (rng() - 0.5) * 5]);
        bot.push([xx, y0 + hh + nz(k * 0.07 + 2) * 30 + (rng() - 0.5) * 4]);
      }
      const p = new Path2D();
      p.moveTo(top[0][0], top[0][1]);
      for (const q of top) p.lineTo(q[0], q[1]);
      for (let k = bot.length - 1; k >= 0; k--) p.lineTo(bot[k][0], bot[k][1]);
      p.closePath();
      x.fillStyle = col; x.fill(p);
      x.save(); x.clip(p); crayon(x, 0, y0 - 40, Wf, hh + 80, col, rng, { density: 90, len: 60, lw: 3, alpha: 0.8 }); x.restore();
      // 顶边白撕边
      x.save();
      x.strokeStyle = 'rgba(251,247,236,0.85)'; x.lineJoin = 'round'; x.lineCap = 'round';
      x.lineWidth = 3.2;
      x.beginPath();
      top.forEach((q, k) => { const yy = q[1] - 2 + (rng() - 0.5) * 2.5; k ? x.lineTo(q[0], yy) : x.moveTo(q[0], yy); });
      x.stroke();
      x.strokeStyle = 'rgba(8,10,30,0.35)'; x.lineWidth = 3;
      x.beginPath(); top.forEach((q, k) => { k ? x.lineTo(q[0], q[1] + 3) : x.moveTo(q[0], q[1] + 3); }); x.stroke();
      x.restore();
    }
    // 月牙
    x.save(); x.translate(150, 180);
    const moon = new Path2D(); moon.arc(0, 0, 58, 0, TAU);
    const cut = new Path2D(); cut.arc(26, -16, 54, 0, TAU);
    const mc = cv(160, 160), mx = mc.getContext('2d'); mx.translate(80, 80);
    mx.fillStyle = '#f7e7a6'; mx.fill(moon); mx.globalCompositeOperation = 'destination-out'; mx.fill(cut);
    mx.globalCompositeOperation = 'source-atop'; mx.setTransform(1, 0, 0, 1, 0, 0); crayon(mx, 0, 0, 160, 160, '#f7e7a6', rng, { density: 30, len: 14, lw: 2 });
    x.drawImage(mc, -80, -80);
    x.restore();
    // 星星：黄色纸星 + 小十字 + 小点
    for (let k = 0; k < 46; k++) {
      const sx = 30 + rng() * (Wf - 60), sy = 30 + rng() * (Hf - 60);
      const t = rng();
      if (t < 0.45) {
        const R = 6 + rng() * 9;
        x.save(); x.translate(sx, sy); x.rotate(rng() * TAU);
        piece(x, shapePath('star', R, rng), '#f4cf52', rng, [-R, -R, 2 * R, 2 * R], { edge: 0, cr: { density: 10, len: 5, lw: 1 } });
        x.restore();
      } else if (t < 0.75) {
        x.strokeStyle = 'rgba(247,231,166,0.7)'; x.lineWidth = 2.2; x.lineCap = 'round';
        const s = 5 + rng() * 5;
        x.beginPath(); x.moveTo(sx - s, sy); x.lineTo(sx + s, sy); x.moveTo(sx, sy - s); x.lineTo(sx, sy + s); x.stroke();
      } else {
        x.fillStyle = 'rgba(247,231,166,0.6)'; x.beginPath(); x.arc(sx, sy, 2 + rng() * 2.5, 0, TAU); x.fill();
      }
    }
    return c;
  };

  // ---------- 整个舞台的桌面底：更深的蓝卡纸，给场地和宣传栏留出位置 ----------
  A.desk = function (SW, SH) {
    const rng = G.rng(7070);
    const c = cv(SW, SH), x = c.getContext('2d');
    x.fillStyle = '#141838'; x.fillRect(0, 0, SW, SH);
    crayon(x, -40, -40, SW + 80, SH + 80, '#171c42', rng, { density: 260, len: 90, lw: 3.6, alpha: 0.8 });
    // 零星小星星
    for (let k = 0; k < 40; k++) {
      const sx = rng() * SW, sy = rng() * SH;
      x.fillStyle = 'rgba(247,231,166,0.35)'; x.beginPath(); x.arc(sx, sy, 2 + rng() * 2, 0, TAU); x.fill();
    }
    return c;
  };

  // 撕纸边框：矩形 (m,m,w,h) 四周一圈不规则白撕边（环形），返回环画布和外轮廓（给桌面画投影用）
  A.tornFrame = function (w, h, m, seed, o) {
    o = o || {};
    const rng = G.rng(seed);
    const c = cv(w + 2 * m, h + 2 * m), x = c.getContext('2d');
    const per = 2 * (w + h);
    const edgePts = (base, amp, step) => {
      const pts = [];
      const nz = ringNoise(rng, 5);
      const n = Math.round(per / step);
      for (let k = 0; k < n; k++) {
        let d = (k / n) * per, px, py, nx, ny;
        if (d < w) { px = d; py = 0; nx = 0; ny = -1; }
        else if ((d -= w) < h) { px = w; py = d; nx = 1; ny = 0; }
        else if ((d -= h) < w) { px = w - d; py = h; nx = 0; ny = 1; }
        else { d -= w; px = 0; py = h - d; nx = -1; ny = 0; }
        const off = base + amp * nz((k / n) * TAU * 6) + (rng() - 0.5) * amp * 0.8;
        pts.push([m + px + nx * off, m + py + ny * off]);
      }
      return pts;
    };
    const outer = edgePts(o.out || 7, o.amp || 3.5, 6);
    const inner = edgePts(o.inn || -4, (o.amp || 3.5) * 0.8, 9);
    const ring = new Path2D();
    polyPath(outer, ring);
    polyPath(inner.slice().reverse(), ring);
    x.fillStyle = o.color || PAPER;
    x.fill(ring, 'evenodd');
    // 白边内侧一条很淡的阴影，让纸有厚度
    x.strokeStyle = 'rgba(8,10,30,0.28)'; x.lineWidth = 2.5; x.lineJoin = 'round';
    x.stroke(polyPath(inner));
    return { canvas: c, outer, m };
  };
  // 在给定画布上沿轮廓画投影
  A.dropShadow = function (ctx, pts, dx, dy, blur, alpha) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,' + alpha + ')';
    ctx.shadowBlur = blur; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = dy;
    ctx.translate(dx, 0);
    ctx.fillStyle = '#10132f';
    ctx.fill(polyPath(pts));
    ctx.restore();
  };
})();
