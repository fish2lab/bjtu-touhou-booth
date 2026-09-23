/* 东方弹幕 POC · 渲染。Pixi 画场地里的一切（纹理全部来自 art.js 的 canvas），DOM 画 HUD、cut-in、宣传栏。
 * 所有动画都从 sim 的帧号推导，不用 CSS 动画，所以 ?t= 快进和 &pause=1 截图与实时播放一致。 */
(function () {
  'use strict';
  const G = window.BXG;
  const W = G.W, H = G.H, TAU = G.TAU;
  const sin = Math.sin, cos = Math.cos;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  function Renderer(sim, opt) {
    this.sim = sim;
    this.opt = opt;
    this.jitter = opt.jitter;
    this.debug = opt.debug;
    this.cache = {};
  }
  G.Renderer = Renderer;
  const R = Renderer.prototype;

  R.init = async function (res) {
    const A = G.art, sim = this.sim;
    const t0 = performance.now();
    const atlas = A.buildAtlas();
    this.atlasInfo = { w: atlas.canvas.width, h: atlas.canvas.height, sprites: atlas.count };

    const app = new PIXI.Application();
    await app.init({
      width: W, height: H, resolution: res, autoDensity: true, antialias: false,
      background: '#1b2150', autoStart: false, preference: 'webgl', powerPreference: 'high-performance',
    });
    this.app = app;
    app.canvas.id = 'gl';
    $('#field').prepend(app.canvas);

    const src = PIXI.Texture.from(atlas.canvas).source;
    const mk = (fr) => new PIXI.Texture({ source: src, frame: new PIXI.Rectangle(fr[0], fr[1], fr[2], fr[3]) });
    this.bTex = atlas.bFrames.map((vs) => vs.map(mk));
    this.fTex = atlas.fFrames.map((vs) => vs.map(mk));
    const TX = (c) => PIXI.Texture.from(c);
    const NV = G.NV;
    const vars = (fn) => { const a = []; for (let v = 0; v < NV; v++) a.push(TX(fn(v))); return a; };
    this.tram = vars((v) => A.tram(v));
    this.umb = vars((v) => A.umbrella(v));
    this.yk = vars((v) => A.yukari(v));
    this.para = vars((v) => A.parasol(v));
    this.gapT = vars((v) => A.gap(v));
    const liquids = ['#ef6a3a', '#3f86d8', '#48a852'];
    this.bottleT = liquids.map((c) => vars((v) => A.bottle(c, v)));
    this.circleT = TX(A.circle());
    this.hitT = TX(A.hitbox());

    const stage = app.stage;
    const sky = new PIXI.Sprite(TX(A.sky(W, H)));
    stage.addChild(sky);
    this.emitC = new PIXI.Container(); stage.addChild(this.emitC);
    this.emitPool = [];

    // Boss
    const bc = (this.bossC = new PIXI.Container());
    this.circle = new PIXI.Sprite(this.circleT); this.circle.anchor.set(0.5);
    this.para1 = new PIXI.Sprite(this.para[0]); this.para1.anchor.set(0.5, 0.4);
    this.yks = new PIXI.Sprite(this.yk[0]); this.yks.anchor.set(0.5, 188 / 360);
    bc.addChild(this.circle, this.para1, this.yks);
    stage.addChild(bc);

    const PC = (dyn) => new PIXI.ParticleContainer({
      dynamicProperties: Object.assign({ position: true, rotation: true, uvs: true, vertex: true, color: true }, dyn || {}),
      boundsArea: new PIXI.Rectangle(-200, -200, W + 400, H + 400),
    });
    this.shotPC = PC({ color: false, rotation: false }); this.shotPool = []; stage.addChild(this.shotPC);
    this.shotPC.alpha = 0.8;

    // 自机
    const pc = (this.playerC = new PIXI.Container());
    this.opts = [0, 1].map(() => { const s = new PIXI.Sprite(this.umb[0]); s.anchor.set(0.5, 62 / 180); s.scale.set(0.78); return s; });
    this.tramS = new PIXI.Sprite(this.tram[0]); this.tramS.anchor.set(0.5, 139 / 250);
    pc.addChild(this.opts[0], this.opts[1], this.tramS);
    stage.addChild(pc);

    this.bulPC = PC(); this.bulPool = []; stage.addChild(this.bulPC);
    this.bombC = new PIXI.Container(); stage.addChild(this.bombC);
    this.bombS = [];
    for (let k = 0; k < 7; k++) { const s = new PIXI.Sprite(this.fTex[G.FXS.bigstar + k][0]); s.anchor.set(0.5); s.visible = false; this.bombC.addChild(s); this.bombS.push(s); }
    this.fxPC = PC(); this.fxPool = []; stage.addChild(this.fxPC);
    this.hitS = new PIXI.Sprite(this.hitT); this.hitS.anchor.set(0.5); stage.addChild(this.hitS);
    if (this.debug) { this.dbgG = new PIXI.Graphics(); stage.addChild(this.dbgG); }

    this.initDom();
    this.buildMs = Math.round(performance.now() - t0);
  };

  R.resize = function (res) {
    const r = this.app.renderer;
    r.resolution = res;
    r.resize(W, H);
  };

  function sync(pc, pool, n, tex) {
    const ch = pc.particleChildren;
    if (ch.length === n) return;
    while (pool.length < n) pool.push(new PIXI.Particle({ texture: tex, anchorX: 0.5, anchorY: 0.5 }));
    ch.length = n;
    for (let i = 0; i < n; i++) ch[i] = pool[i];
  }

  // ---------- 每帧 ----------
  R.render = function () {
    const sim = this.sim, fr = sim.frame;
    const v = this.jitter ? Math.floor(fr / 7.5) % G.NV : 0;   // 8fps 轮换手绘变体
    this.v = v;
    this.drawEmitters(v);
    this.drawBoss(v);
    this.drawShots();
    this.drawPlayer(v);
    this.drawBullets();
    this.drawBomb(v);
    this.drawFx();
    if (this.debug) this.drawDebug();
    this.app.render();
    this.dom();
  };

  R.drawEmitters = function (v) {
    const E = this.sim.emitters, pool = this.emitPool;
    while (pool.length < E.length) { const s = new PIXI.Sprite(this.gapT[0]); s.anchor.set(0.5); this.emitC.addChild(s); pool.push(s); }
    for (let i = 0; i < pool.length; i++) {
      const s = pool[i];
      if (i >= E.length) { s.visible = false; continue; }
      const e = E[i];
      s.visible = e.open > 0.01;
      s.position.set(e.x, e.y);
      if (e.kind === 'gap') {
        s.texture = this.gapT[v];
        s.rotation = e.rot;
        const o = G.easeOut(e.open);
        s.scale.set(0.55 + 0.45 * o, o);
      } else {
        s.texture = this.bottleT[e.el][v];
        const o = e.target ? G.backOut(e.open) : e.open;
        s.scale.set(o);
        s.rotation = 0.06 * sin(e.age * 0.05 + e.el * 2);
      }
    }
  };

  R.drawBoss = function (v) {
    const sim = this.sim, b = sim.boss, fr = sim.frame;
    const bob = sin(fr * 0.035) * 7;
    this.bossC.position.set(b.x, b.y + bob);
    const br = sin(fr * 0.07);
    this.yks.texture = this.yk[v];
    this.yks.scale.set(1 - 0.01 * br, 1 + 0.02 * br);
    this.yks.tint = b.hitT > 0 && (fr & 2) ? 0xffd6e0 : 0xffffff;
    this.para1.texture = this.para[v];
    this.para1.position.set(92, -120 + br * 3);
    this.para1.rotation = 0.38 + 0.05 * sin(fr * 0.03);
    const atk = sim.phase === 'attack' ? 1 : sim.phase === 'decl' ? G.span(sim.cf, 60, 140) : 1 - G.span(sim.cf - sim.endAt, 0, 40);
    this.circle.alpha = 0.75 * atk;
    this.circle.rotation = fr * 0.012;
    this.circle.scale.set(0.8 + 0.2 * atk + 0.03 * sin(fr * 0.05));
  };

  R.drawShots = function () {
    const Sh = this.sim.shots, n = Sh.n, pool = this.shotPool;
    const tk = this.fTex[G.FXS.ticket][0], td = this.fTex[G.FXS.raindrop][0];
    sync(this.shotPC, pool, n, tk);
    for (let i = 0; i < n; i++) {
      const p = pool[i];
      p.texture = Sh.kind[i] === 0 ? tk : td;
      p.x = Sh.x[i]; p.y = Sh.y[i];
    }
  };

  R.drawPlayer = function (v) {
    const sim = this.sim, p = sim.player, fr = sim.frame;
    const vis = p.alive;
    this.playerC.visible = vis;
    this.hitS.visible = vis && p.foc > 0.05;
    if (!vis) return;
    const blink = p.inv > 0 && (fr >> 2) & 1;
    this.playerC.alpha = blink ? 0.45 : 1;
    this.tramS.texture = this.tram[v];
    this.tramS.position.set(p.x, p.y);
    this.cache.tilt = G.lerp(this.cache.tilt || 0, p.vx * 0.1, 0.2);
    this.tramS.rotation = this.cache.tilt;
    const f = p.foc;
    for (let s = -1, k = 0; s <= 1; s += 2, k++) {
      const o = this.opts[k];
      o.texture = this.umb[(v + k) % G.NV];
      o.position.set(p.x + s * G.lerp(96, 44, f), p.y + G.lerp(10, -64, f) + sin(fr * 0.08 + k * 2) * 5);
      o.rotation = s * 0.12 + sin(fr * 0.06 + k) * 0.08;
    }
    this.hitS.position.set(p.x, p.y);
    this.hitS.alpha = f;
  };

  R.drawBullets = function () {
    const B = this.sim.b, n = B.n, pool = this.bulPool, bt = this.bTex;
    sync(this.bulPC, pool, n, bt[0][0]);
    const tick = this.jitter ? Math.floor(this.sim.frame / 7.5) : 0;
    const NV = G.NV;
    for (let i = 0; i < n; i++) {
      const p = pool[i];
      const fl = B.flag[i], vs = B.vs[i], age = B.age[i];
      p.texture = bt[B.spr[i]][this.jitter ? (tick + vs) % NV : 0];
      p.x = B.x[i]; p.y = B.y[i];
      p.rotation = fl & 8 ? 0.22 * sin(age * 0.06 + vs) : fl & 6 ? B.rot[i] : 0;
      const sc = (age < 10 ? 0.45 + age * 0.055 : 1) * B.sc[i];
      p.scaleX = sc; p.scaleY = sc;
    }
  };

  R.drawBomb = function (v) {
    const bm = this.sim.bomb, S = this.bombS;
    for (let k = 0; k < 7; k++) {
      const s = S[k], o = bm && bm.orbs[k];
      if (!o || !o.alive) { s.visible = false; continue; }
      s.visible = true;
      s.texture = this.fTex[G.FXS.bigstar + k][v];
      s.position.set(o.x, o.y);
      s.rotation = o.age * 0.08;
      s.scale.set(1.1 + 0.1 * sin(o.age * 0.3));
    }
  };

  R.drawFx = function () {
    const F = this.sim.fx, n = F.n, pool = this.fxPool, ft = this.fTex;
    sync(this.fxPC, pool, n, ft[0][0]);
    const v = this.v;
    for (let i = 0; i < n; i++) {
      const p = pool[i];
      const age = F.age[i];
      if (age < 0) { p.alpha = 0; continue; }
      const t = age / F.life[i];
      p.texture = ft[F.spr[i]][v];
      p.x = F.x[i]; p.y = F.y[i];
      p.rotation = F.rot[i];
      const s = F.s0[i] + (F.s1[i] - F.s0[i]) * t;
      p.scaleX = s; p.scaleY = s;
      p.tint = F.tint[i];
      const a = F.a0[i] + (F.a1[i] - F.a0[i]) * t * t;
      p.alpha = a < 0 ? 0 : a;
    }
  };

  R.drawDebug = function () {
    const g = this.dbgG, sim = this.sim, B = sim.b, p = sim.player;
    g.clear();
    for (let i = 0; i < B.n; i++) g.circle(B.x[i], B.y[i], B.r[i]);
    g.stroke({ width: 2, color: 0x00ff88, alpha: 0.8 });
    if (p.alive) { g.circle(p.x, p.y, G.PR).fill({ color: 0xff0044 }); }
    const inf = sim.ai.info;
    if (inf.prefX !== undefined) g.circle(inf.prefX, inf.prefY, 16).stroke({ width: 3, color: 0xffff00 });
  };

  // ---------- DOM：HUD、cut-in、宣传栏、底栏 ----------
  R.initDom = function () {
    const sim = this.sim;
    this.el = {
      hpFill: $('#hp-fill'), timer: $('#timer'), spell: $('#spell'), spellTxt: $('#spell b'),
      lives: $('#lives'), bombs: $('#bombs'),
      cutin: $('#cutin'), cutBand: $('#cutin .band'), cutImg: $('#cutin img'),
      msg: $('#msg'), msgTxt: $('#msg b'),
      hint: $('#hint'), hintTxt: $('#hint b'),
      dbg: $('#dbg'),
    };
    this.panels = {};
    for (const p of $$('.panel')) this.panels[p.dataset.panel] = p;
    this.works = $$('#p-sukima .work');
    // 残机、Bomb 小图标：直接把电车和唐伞的画布缩小放进 DOM
    const icon = (c, w) => { const im = document.createElement('canvas'); im.width = c.width; im.height = c.height; im.getContext('2d').drawImage(c, 0, 0); im.style.width = w + 'px'; return im; };
    const tramC = G.art.tram(0), umbC = G.art.umbrella(0);
    for (let k = 0; k < 6; k++) this.el.lives.appendChild(icon(tramC, 64));
    for (let k = 0; k < 6; k++) this.el.bombs.appendChild(icon(umbC, 52));
    this.el.dbg.hidden = !this.debug;
  };

  function setStyle(el, key, val, cache, ck) {
    if (cache[ck] === val) return;
    cache[ck] = val;
    el.style[key] = val;
  }

  R.dom = function () {
    const sim = this.sim, el = this.el, c = this.cache;
    const card = sim.card, b = sim.boss, p = sim.player;
    // 血条与计时
    const hp = card.survival ? (sim.phase === 'attack' ? 1 - sim.af / card.limit : sim.phase === 'end' ? 0 : 1) : G.sat(b.hp / b.hpMax);
    setStyle(el.hpFill, 'transform', 'scaleX(' + hp.toFixed(3) + ')', c, 'hp');
    let left = 0;
    if (sim.phase === 'attack') left = (card.limit - sim.af) / 60;
    else if (sim.phase === 'decl') left = card.limit / 60;
    const tt = left.toFixed(1);
    if (c.tt !== tt) { c.tt = tt; el.timer.textContent = tt; }
    // 残机 / Bomb
    const lv = Math.max(0, Math.min(6, p.lives)), bm = Math.max(0, Math.min(6, p.bombs));
    if (c.lv !== lv) { c.lv = lv; el.lives.querySelectorAll('canvas').forEach((x, i) => { x.style.display = i < lv ? '' : 'none'; }); }
    if (c.bm !== bm) { c.bm = bm; el.bombs.querySelectorAll('canvas').forEach((x, i) => { x.style.display = i < bm ? '' : 'none'; }); }

    // 符卡名：宣言时从场地中央落下，之后停在右上角
    if (c.ci !== sim.ci) { c.ci = sim.ci; el.spellTxt.textContent = card.name; }
    const cf = sim.cf;
    let sx = 0, sy = 0, ss = 1, so = 1;
    if (sim.phase === 'decl') {
      const a = G.backOut(G.span(cf, 8, 30));
      const m = G.easeInOut(G.span(cf, 105, 140));
      ss = G.lerp(1.9 - 0.9 * a, 1, m);
      so = G.span(cf, 8, 16);
      sx = G.lerp(-(W / 2) + 20, 0, m);
      sy = G.lerp(H * 0.62, 0, m);
    } else if (sim.phase === 'end') {
      so = 1 - G.span(cf - sim.endAt, 60, 100);
    }
    setStyle(el.spell, 'transform', 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px) scale(' + ss.toFixed(3) + ')', c, 'sp');
    setStyle(el.spell, 'opacity', so.toFixed(3), c, 'spo');

    // cut-in：撕纸色带横穿场地，八云紫立绘滑入再离开
    const on = sim.phase === 'decl' && cf < 150;
    setStyle(el.cutin, 'visibility', on ? 'visible' : 'hidden', c, 'cv');
    if (on) {
      const band = G.easeOut(G.span(cf, 0, 14)), bandOut = G.span(cf, 118, 146);
      setStyle(el.cutBand, 'transform', 'translateX(' + ((band - 1) * 110 + bandOut * 110).toFixed(1) + '%) rotate(-11deg)', c, 'cb');
      const ix = G.lerp(700, 0, G.easeOut(G.span(cf, 0, 22))) - 70 * G.span(cf, 22, 112);
      const iy = -260 * G.easeIn(G.span(cf, 108, 146));
      setStyle(el.cutImg, 'transform', 'translate(' + ix.toFixed(1) + 'px,' + iy.toFixed(1) + 'px) rotate(' + (-3 + 2 * G.span(cf, 0, 146)).toFixed(2) + 'deg)', c, 'ci');
      setStyle(el.cutImg, 'opacity', (1 - G.span(cf, 118, 146)).toFixed(3), c, 'cio');
    }

    // 收卡结算
    let mo = 0;
    if (sim.phase === 'end') {
      const k = sim.cf - sim.endAt;
      mo = G.span(k, 0, 10) * (1 - G.span(k, 80, 105));
      const txt = sim.captured && sim.bonusValid ? '符卡收取！' : '收取失败';
      if (c.msg !== txt) { c.msg = txt; el.msgTxt.textContent = txt; }
      setStyle(el.msg, 'transform', 'translate(-50%,-50%) scale(' + (0.8 + 0.2 * G.backOut(G.span(k, 0, 14))).toFixed(3) + ') rotate(-4deg)', c, 'mt');
    }
    setStyle(el.msg, 'opacity', mo.toFixed(3), c, 'mo');

    // 宣传栏：跟着当前符卡切换，新的一张像纸一样拍上来
    const key = card.panel;
    if (c.panel !== key) {
      for (const k in this.panels) this.panels[k].classList.toggle('on', k === key);
      c.panel = key;
    }
    const pe = sim.phase === 'decl' ? G.span(cf, 0, 22) : 1;
    const pan = this.panels[key];
    if (pan) {
      const e = G.backOut(pe);
      setStyle(pan, 'transform', 'translateY(' + ((1 - e) * -60).toFixed(1) + 'px) rotate(' + ((1 - e) * 1.6).toFixed(2) + 'deg)', c, 'pt');
      setStyle(pan, 'opacity', G.span(pe, 0, 0.35).toFixed(3), c, 'po');
    }
    // 隙间月影栏：四幅作品跟着隙间的四段轮换
    if (key === 'sukima' && this.works.length) {
      const SEG = G.SUKIMA_SEG;
      let idx = 0, fade = 1;
      if (sim.phase === 'attack') { idx = Math.min(3, Math.floor(sim.af / SEG)); fade = idx === 0 ? 1 : G.span(sim.af - idx * SEG, 0, 18); }
      else if (sim.phase === 'end') idx = Math.min(3, Math.floor(sim.af / SEG));
      for (let k = 0; k < this.works.length; k++) {
        const o = k === idx ? fade : k === idx - 1 ? 1 - fade : 0;
        setStyle(this.works[k], 'opacity', o.toFixed(3), c, 'w' + k);
      }
    }

    // 底栏提示
    let hint;
    if (sim.mode === 'player') {
      const leftS = Math.ceil((G.IDLE_FRAMES - (sim.frame - sim.lastInput)) / 60);
      hint = '玩家操作中 · 方向键移动  Shift 低速  X 放 Bomb · ' + Math.max(0, leftS) + ' 秒无操作交还自动驾驶';
    } else hint = '幻想乡交通大学号 · 自动驾驶中 · 按方向键 / Z / 手柄 接管';
    if (c.hint !== hint) { c.hint = hint; el.hintTxt.textContent = hint; el.hint.classList.toggle('player', sim.mode === 'player'); }

    if (this.debug) {
      const st = sim.stats, inf = sim.ai.info;
      const t = 'f' + sim.frame + ' card ' + (sim.ci + 1) + ' ' + sim.phase + ' af ' + sim.af + ' | bullets ' + sim.b.n + ' max ' + st.maxBullets +
        ' | deaths ' + st.deaths + ' hits ' + st.hits + ' bombs ' + st.bombs + ' | mode ' + sim.mode + ' | ai m ' + inf.m + ' hitT ' + inf.hitT +
        ' | fps ' + (this.fps || 0).toFixed(0) + ' ms ' + (this.ms || 0).toFixed(1);
      el.dbg.textContent = t;
    }
  };
})();
