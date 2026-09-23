/* 东方弹幕 POC · 宣传栏与舞台的纸张、涂鸦。页面里的 <canvas data-art="种类:参数..."> 在启动时按种类画好。 */
(function () {
  'use strict';
  const G = window.BXG;
  const A = G.art;
  const TAU = Math.PI * 2;
  const cos = Math.cos, sin = Math.sin;
  const PAPER = '#fbf7ec';

  // 手绘蜡笔线：同一条折线画三遍，每遍轻微抖动
  function crayonLine(x, pts, color, w, rng, o) {
    o = o || {};
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = color;
    for (let pass = 0; pass < 3; pass++) {
      x.globalAlpha = pass === 0 ? 0.95 : 0.35;
      x.lineWidth = w * (pass === 0 ? 1 : 0.6);
      x.beginPath();
      pts.forEach((p, k) => {
        const jx = (rng() - 0.5) * w * 0.35, jy = (rng() - 0.5) * w * 0.35;
        k ? x.lineTo(p[0] + jx, p[1] + jy) : x.moveTo(p[0] + jx, p[1] + jy);
      });
      if (o.close) x.closePath();
      x.stroke();
    }
    x.restore();
  }

  // 纸张：不规则撕边 + 纸色 + 淡蜡笔纹理
  function tornSheet(c, color, seed, o) {
    o = o || {};
    const x = c.getContext('2d'), w = c.width, h = c.height, rng = G.rng(seed);
    const m = o.m || 18;
    const pts = [];
    const step = 8;
    const edge = (x0, y0, x1, y1) => {
      const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / step);
      const nx = (y1 - y0) / L, ny = -(x1 - x0) / L;
      let drift = 0;
      for (let k = 0; k < n; k++) {
        const t = k / n;
        drift = drift * 0.85 + (rng() - 0.5) * 3.2;
        const off = drift + (rng() - 0.5) * 2.2;
        pts.push([x0 + (x1 - x0) * t + nx * off, y0 + (y1 - y0) * t + ny * off]);
      }
    };
    edge(m, m, w - m, m); edge(w - m, m, w - m, h - m); edge(w - m, h - m, m, h - m); edge(m, h - m, m, m);
    const path = A.polyPath(pts);
    // 撕边露出的白纸芯
    x.save();
    x.fillStyle = PAPER;
    for (let k = 0; k < 14; k++) { const a = (k / 14) * TAU; x.setTransform(1, 0, 0, 1, cos(a) * 4.5, sin(a) * 4.5); x.fill(path); }
    x.restore();
    const inner = [];
    pts.forEach((p, k) => { const q = pts[(k + 1) % pts.length]; inner.push([p[0] + (w / 2 - p[0]) * 0.004 + (rng() - 0.5) * 3, p[1] + (h / 2 - p[1]) * 0.004 + (rng() - 0.5) * 3]); });
    const ip = A.polyPath(inner);
    x.fillStyle = color; x.fill(ip);
    x.save(); x.clip(ip);
    A.crayon(x, 0, 0, w, h, color, rng, { density: 320, len: 80, lw: 3, alpha: 0.35, light: 0.4 });
    x.restore();
    return { x, rng, clip: ip };
  }

  const makers = {
    // 横线笔记本纸（kevin 片里写字的那种）
    note(c, seed) {
      const { x, rng, clip } = tornSheet(c, '#f6f0de', +seed || 11);
      x.save(); x.clip(clip);
      x.strokeStyle = 'rgba(120,150,210,0.45)'; x.lineWidth = 3;
      for (let y = 250; y < c.height - 40; y += 118) { x.beginPath(); x.moveTo(0, y + (rng() - 0.5) * 2); x.lineTo(c.width, y + (rng() - 0.5) * 2); x.stroke(); }
      x.strokeStyle = 'rgba(226,110,110,0.55)'; x.lineWidth = 3.5;
      x.beginPath(); x.moveTo(150, 0); x.lineTo(152, c.height); x.stroke();
      x.restore();
    },
    // 漫画摊宣用的白纸，角落一块网点
    manga(c, seed) {
      const { x, rng, clip } = tornSheet(c, '#fbfaf5', +seed || 21);
      x.save(); x.clip(clip);
      x.fillStyle = 'rgba(17,17,17,0.13)';
      for (let yy = 0; yy < 360; yy += 16) for (let xx = 0; xx < 360; xx += 16) {
        const d = Math.hypot(xx, yy) / 360;
        if (d > 1) continue;
        const r = 5.5 * (1 - d);
        x.beginPath(); x.arc(c.width - 40 - xx + (yy % 32 ? 8 : 0), c.height - 40 - yy, r, 0, TAU); x.fill();
      }
      x.restore();
    },
    // cut-in 用的撕纸色带
    band(c, seed) {
      const { x } = tornSheet(c, '#d7c6ee', +seed || 31, { m: 14 });
      x.fillStyle = 'rgba(122,76,192,0.18)';
      x.fillRect(0, c.height * 0.72, c.width, 10);
    },
    // 符卡名、结算字的深色纸条
    label(c, seed, color) {
      tornSheet(c, color || '#f3ead2', +seed || 41, { m: 10 });
    },
    heart(c, seed, color) {
      const x = c.getContext('2d'), rng = G.rng(+seed || 51), w = c.width, h = c.height;
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const t = (k / 40) * TAU;
        const px = 16 * Math.pow(sin(t), 3), py = -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t));
        pts.push([w / 2 + (px * w) / 38, h / 2 + ((py + 2) * h) / 38]);
      }
      x.save(); x.fillStyle = color; x.globalAlpha = 0.28; x.fill(A.smoothPath(pts)); x.restore();
      crayonLine(x, pts, color, Math.max(5, w * 0.06), rng);
    },
    star(c, seed, color) {
      const x = c.getContext('2d'), rng = G.rng(+seed || 61), w = c.width, h = c.height;
      const pts = [];
      for (let k = 0; k <= 10; k++) { const a = -Math.PI / 2 + (k / 10) * TAU; const r = (k % 2 ? 0.2 : 0.44) * w; pts.push([w / 2 + cos(a) * r, h / 2 + sin(a) * r]); }
      x.save(); x.fillStyle = color; x.globalAlpha = 0.9; x.fill(A.polyPath(pts)); x.restore();
      crayonLine(x, pts, A.mix(color, '#000000', 0.15), Math.max(3, w * 0.04), rng);
    },
    // 从左往右的弯箭头（参数 flip=1 时从右往左）
    arrow(c, seed, color, flip) {
      const x = c.getContext('2d'), rng = G.rng(+seed || 71), w = c.width, h = c.height;
      if (flip === '1') { x.translate(w, 0); x.scale(-1, 1); }
      const pts = [];
      for (let k = 0; k <= 24; k++) { const t = k / 24; pts.push([w * 0.06 + t * w * 0.84, h * 0.75 - sin(t * Math.PI) * h * 0.5]); }
      const lw = Math.max(6, h * 0.07);
      crayonLine(x, pts, color, lw, rng);
      const e = pts[pts.length - 1], p = pts[pts.length - 4];
      const a = Math.atan2(e[1] - p[1], e[0] - p[0]);
      const L = h * 0.3;
      crayonLine(x, [[e[0] - cos(a - 0.5) * L, e[1] - sin(a - 0.5) * L], e, [e[0] - cos(a + 0.5) * L, e[1] - sin(a + 0.5) * L]], color, lw, rng);
    },
    // 手绘圈
    ring(c, seed, color) {
      const x = c.getContext('2d'), rng = G.rng(+seed || 81), w = c.width, h = c.height;
      const pts = [];
      for (let k = 0; k <= 46; k++) { const a = -2.2 + (k / 40) * TAU; const r = 1 + (rng() - 0.5) * 0.03; pts.push([w / 2 + cos(a) * w * 0.46 * r, h / 2 + sin(a) * h * 0.42 * r]); }
      crayonLine(x, pts, color, Math.max(6, h * 0.045), rng);
    },
    wave(c, seed, color) {
      const x = c.getContext('2d'), rng = G.rng(+seed || 91), w = c.width, h = c.height;
      const pts = [];
      for (let k = 0; k <= 60; k++) { const t = k / 60; pts.push([w * 0.02 + t * w * 0.96, h / 2 + sin(t * TAU * 5) * h * 0.25]); }
      crayonLine(x, pts, color, Math.max(5, h * 0.18), rng);
    },
    // 漫画对白泡泡（白底黑线，带尾巴）
    bubble(c, seed, tail) {
      const x = c.getContext('2d'), rng = G.rng(+seed || 101), w = c.width, h = c.height;
      const pts = [];
      for (let k = 0; k < 36; k++) { const a = (k / 36) * TAU; pts.push([w / 2 + cos(a) * w * 0.44 * (1 + (rng() - 0.5) * 0.02), h * 0.44 + sin(a) * h * 0.38]); }
      const tx = tail === 'r' ? w * 0.7 : w * 0.3;
      const p = A.smoothPath(pts);
      x.fillStyle = '#ffffff'; x.fill(p);
      x.beginPath(); x.moveTo(tx - 30, h * 0.76); x.lineTo(tx + (tail === 'r' ? 60 : -60), h * 0.98); x.lineTo(tx + 30, h * 0.78); x.closePath(); x.fill();
      x.lineWidth = 6; x.strokeStyle = '#111111'; x.stroke(p);
      x.beginPath(); x.moveTo(tx - 30, h * 0.8); x.lineTo(tx + (tail === 'r' ? 60 : -60), h * 0.98); x.lineTo(tx + 30, h * 0.8); x.stroke();
    },
    // 与场地里同款的问号药瓶
    bottle(c, seed, color) {
      const b = A.bottle(color, +seed || 0);
      const x = c.getContext('2d');
      const s = Math.min(c.width / b.width, c.height / b.height);
      x.drawImage(b, (c.width - b.width * s) / 2, (c.height - b.height * s) / 2, b.width * s, b.height * s);
    },
    // 底栏签名旁的小电车
    tram(c) {
      const b = A.tram(0), x = c.getContext('2d');
      const s = Math.min(c.width / b.width, c.height / b.height);
      x.drawImage(b, (c.width - b.width * s) / 2, (c.height - b.height * s) / 2, b.width * s, b.height * s);
    },
  };

  G.drawPanelArt = function () {
    for (const c of document.querySelectorAll('canvas[data-art]')) {
      const [kind, ...args] = c.dataset.art.split(':');
      const fn = makers[kind];
      if (!fn) throw new Error('no art maker ' + kind);
      fn(c, ...args);
    }
  };

  // 舞台桌面 + 场地撕纸白边
  G.drawDesk = function () {
    const desk = document.getElementById('desk');
    const d = A.desk(G.STAGE_W, G.STAGE_H);
    const x = desk.getContext('2d');
    x.drawImage(d, 0, 0);
    const m = 24;
    const fr = A.tornFrame(G.W, G.H, m, 555, { out: 8, amp: 3.5, inn: -5 });
    x.save(); x.translate(G.FX0 - m, G.FY0 - m);
    A.dropShadow(x, fr.outer, 0, 16, 40, 0.55);
    x.restore();
    const f = document.getElementById('frame');
    f.width = fr.canvas.width; f.height = fr.canvas.height;
    f.style.left = G.FX0 - m + 'px'; f.style.top = G.FY0 - m + 'px';
    f.getContext('2d').drawImage(fr.canvas, 0, 0);
  };
})();
