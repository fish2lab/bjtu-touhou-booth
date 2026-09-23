/* 东方弹幕 POC · 常量与工具。经典脚本，所有模块挂在全局 BXG 上。 */
(function () {
  'use strict';
  const G = (window.BXG = window.BXG || {});

  G.STAGE_W = 3840;
  G.STAGE_H = 2160;
  // 弹幕场地：舞台坐标 (140,60) 起，1648×1920，约 6:7 竖版
  G.FX0 = 140;
  G.FY0 = 60;
  G.W = 1648;
  G.H = 1920;
  // 宣传栏：舞台坐标 (1860,60) 起，1900×1920
  G.PX0 = 1860;
  G.PY0 = 60;
  G.PW = 1900;
  G.PH = 1920;
  G.TAU = Math.PI * 2;
  G.FPS = 60;

  const qs = new URLSearchParams(location.search);
  G.qs = qs;
  G.qnum = function (k, d) {
    const v = qs.get(k);
    if (v === null || v === '') return d;
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  };
  G.qflag = function (k, d) {
    const v = qs.get(k);
    if (v === null) return !!d;
    return v !== '0' && v !== 'false';
  };

  // mulberry32：小而快的种子随机数，返回 [0,1)
  G.rng = function (seed) {
    let a = seed >>> 0;
    const f = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + (hi - lo) * f();
    f.int = (n) => Math.floor(f() * n);
    f.sign = () => (f() < 0.5 ? -1 : 1);
    return f;
  };

  G.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  G.lerp = (a, b, t) => a + (b - a) * t;
  G.sat = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  G.smooth = (t) => { t = G.sat(t); return t * t * (3 - 2 * t); };
  G.easeOut = (t) => { t = G.sat(t); return 1 - (1 - t) * (1 - t) * (1 - t); };
  G.easeIn = (t) => { t = G.sat(t); return t * t * t; };
  G.easeInOut = (t) => { t = G.sat(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  G.backOut = (t) => { t = G.sat(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  G.span = (x, a, b) => G.sat((x - a) / (b - a));

  // 蜡笔配色：body 纸的颜色，core 弹芯（浅），fx 消弹碎纸的颜色
  G.COLOR_DEFS = {
    red:    { body: '#e2463c', core: '#ffe2d8', fx: 0xe2463c },
    black:  { body: '#16161d', core: null,      fx: 0xf4efe2 },
    hred:   { body: '#cf2440', core: '#ffd9df', fx: 0xcf2440 },
    hgreen: { body: '#2c6a4d', core: '#cdeedb', fx: 0x3d8a64 },
    pink:   { body: '#f07ea4', core: '#fff0f5', fx: 0xf07ea4 },
    yellow: { body: '#f6c63f', core: '#fff8dc', fx: 0xf6c63f },
    orange: { body: '#f08434', core: '#ffecd6', fx: 0xf08434 },
    blue:   { body: '#3f78d8', core: '#e0ecff', fx: 0x4f84dc },
    cyan:   { body: '#39b4c8', core: '#dff9fc', fx: 0x39b4c8 },
    purple: { body: '#8a58cc', core: '#f0e6ff', fx: 0x9a6ad6 },
    cream:  { body: '#f3ead2', core: '#ffffff', fx: 0xf3ead2 },
    gray:   { body: '#5d5f72', core: '#d9dae4', fx: 0x8c8ea0 },
    green:  { body: '#48a852', core: '#e3f8e2', fx: 0x48a852 },
    brown:  { body: '#a8662f', core: '#ffe9cf', fx: 0xa8662f },
  };

  // 子弹外形（4K 实际像素）：R 纸片半径，r 判定半径，edge 白边宽，orient 按速度方向，spin 自转，sway 竖直小幅摇摆
  G.SHAPES = {
    orb:    { R: 17, r: 11, edge: 4 },
    mid:    { R: 25, r: 17, edge: 4.5 },
    big:    { R: 44, r: 33, edge: 5.5 },
    rice:   { R: 22, r: 8, edge: 3.5, orient: 1 },
    drop:   { R: 20, r: 10, edge: 3.5, orient: 1 },
    star:   { R: 24, r: 12, edge: 4, spin: 1 },
    heart:  { R: 24, r: 13, edge: 4, sway: 1 },
    ribbon: { R: 26, r: 12, edge: 4, spin: 1 },
    vial:   { R: 26, r: 14, edge: 4, sway: 1 },
    yaku:   { R: 34, r: 18, edge: 4.5, sway: 1, glyph: '厄' },
    win:    { R: 30, r: 18, edge: 4.5, sway: 1, glyph: '赢', tag: 1 },
  };

  // 按需注册：符卡脚本在加载时调用 G.spr(shape,color)，图集只画用到的组合
  G.SPRS = [];
  G.SPR_R = [];
  G.SPR_FLAG = [];   // 2=按方向旋转 4=自转 8=摇摆
  G.SPR_FX = [];     // 消弹碎纸颜色
  const sprIndex = {};
  G.spr = function (shape, color, scale) {
    scale = scale || 1;
    const key = shape + '/' + color + '/' + scale;
    if (sprIndex[key] !== undefined) return sprIndex[key];
    const s = G.SHAPES[shape], c = G.COLOR_DEFS[color];
    if (!s || !c) throw new Error('bad sprite ' + key);
    const i = G.SPRS.length;
    G.SPRS.push({ shape, color, scale, key });
    G.SPR_R.push(s.r * scale);
    G.SPR_FLAG.push((s.orient ? 2 : 0) | (s.spin ? 4 : 0) | (s.sway ? 8 : 0));
    G.SPR_FX.push(c.fx);
    sprIndex[key] = i;
    return i;
  };

  // 特效精灵（与子弹同一张图集）：碎纸片、小纸星、擦弹火花、撕纸圆环、车票、紫雨滴
  G.FXS = { shred: 0, NSHRED: 12, star: 12, spark: 13, ring: 14, puff: 15, ticket: 16, raindrop: 17, bigstar: 18, NBIG: 7 };
  G.NFX = 25;
})();
