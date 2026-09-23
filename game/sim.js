/* 东方弹幕 POC · 确定性模拟。固定 60Hz 步长，种子随机数，不碰 DOM、不碰 Pixi。 */
(function () {
  'use strict';
  const G = window.BXG;
  const W = G.W, H = G.H, TAU = G.TAU;
  const cos = Math.cos, sin = Math.sin, atan2 = Math.atan2, sqrt = Math.sqrt;

  const BCAP = 6000, FXCAP = 8000, SCAP = 800;
  const PR = 9;            // 自机判定半径
  const GRAZE = 44;        // 擦弹带宽
  const SPEED_FAST = 16, SPEED_SLOW = 7;
  const DECL = 150;        // 符卡宣言（cut-in）帧数
  const END = 110;         // 收卡结算帧数
  const IDLE_FRAMES = 15 * 60;
  const MIN_CAPTURE = 16 * 60;   // 伤害封顶：最快 16 秒收卡，保证每条宣传至少停留约 20 秒
  const XMIN = 40, XMAX = W - 40, YMIN = 90, YMAX = H - 60;
  const DEATHBOMB = 8;     // 决死窗口
  Object.assign(G, { PR, GRAZE, SPEED_FAST, SPEED_SLOW, DECL, END, IDLE_FRAMES, XMIN, XMAX, YMIN, YMAX, BCAP });

  const EV_AIM = 1, EV_SPLIT = 2, EV_GO = 3;
  G.EV = { AIM: EV_AIM, SPLIT: EV_SPLIT, GO: EV_GO };
  const FXS = G.FXS;

  // ---------- 子弹：结构化数组 ----------
  function Bullets(cap) {
    const F = () => new Float64Array(cap);
    this.cap = cap;
    this.n = 0;
    this.x = F(); this.y = F(); this.spd = F(); this.ang = F(); this.acc = F(); this.angv = F();
    this.minS = F(); this.maxS = F();
    this.cvx = F(); this.cvy = F(); this.ax = F(); this.ay = F(); this.tv = F();
    this.wobA = F(); this.wobF = F(); this.wobP = F();
    this.r = F(); this.rot = F(); this.sc = F();
    this.evA = F(); this.evB = F(); this.evC = F();
    this.age = new Int32Array(cap); this.life = new Int32Array(cap); this.evAge = new Int32Array(cap);
    this.spr = new Int16Array(cap); this.tag = new Int16Array(cap);
    this.flag = new Uint8Array(cap); this.ev = new Uint8Array(cap); this.vs = new Uint8Array(cap);
    this._arrs = [this.x, this.y, this.spd, this.ang, this.acc, this.angv, this.minS, this.maxS,
      this.cvx, this.cvy, this.ax, this.ay, this.tv, this.wobA, this.wobF, this.wobP, this.r, this.rot,
      this.sc, this.evA, this.evB, this.evC, this.age, this.life, this.evAge, this.spr, this.tag,
      this.flag, this.ev, this.vs];
  }
  Bullets.prototype.remove = function (i) {
    const j = --this.n;
    if (i === j) return;
    const A = this._arrs;
    for (let k = 0; k < A.length; k++) A[k][i] = A[k][j];
  };

  // ---------- 特效粒子（纯视觉，但同样在模拟里推进，保证 ?t= 快进后画面一致）----------
  function Fx(cap) {
    const F = () => new Float64Array(cap);
    this.cap = cap;
    this.n = 0;
    this.x = F(); this.y = F(); this.vx = F(); this.vy = F(); this.drag = F(); this.gy = F();
    this.rot = F(); this.spin = F(); this.s0 = F(); this.s1 = F(); this.a0 = F(); this.a1 = F();
    this.age = new Int32Array(cap); this.life = new Int32Array(cap); this.tint = new Int32Array(cap);
    this.spr = new Uint8Array(cap); this.layer = new Uint8Array(cap);
    this._arrs = [this.x, this.y, this.vx, this.vy, this.drag, this.gy, this.rot, this.spin, this.s0, this.s1,
      this.a0, this.a1, this.age, this.life, this.tint, this.spr, this.layer];
  }
  Fx.prototype.remove = Bullets.prototype.remove;

  function Shots(cap) {
    const F = () => new Float64Array(cap);
    this.cap = cap;
    this.n = 0;
    this.x = F(); this.y = F(); this.vx = F(); this.vy = F(); this.dmg = F();
    this.kind = new Uint8Array(cap);
    this._arrs = [this.x, this.y, this.vx, this.vy, this.dmg, this.kind];
  }
  Shots.prototype.remove = Bullets.prototype.remove;

  // ---------- 模拟 ----------
  function Sim(opt) {
    opt = opt || {};
    this.seed = (opt.seed | 0) || 1;
    this.rng = G.rng(this.seed);
    this.vrng = G.rng(this.seed * 7919 + 17);   // 只给视觉特效用，不影响玩法
    this.vsc = 0;
    this.cards = G.CARDS;
    this.b = new Bullets(BCAP);
    this.fx = new Fx(FXCAP);
    this.shots = new Shots(SCAP);
    this.frame = 0;
    this.mode = 'auto';
    this.modeAt = 0;
    this.lastInput = -99999;
    this.ctrl = { mx: 0, my: 0, focus: false, shot: true, bomb: false };
    this.player = {
      x: W / 2, y: H - 240, alive: true, respawn: 0, inv: 120, hitPending: 0,
      focus: false, foc: 0, vx: 0, lives: 3, bombs: 3, graze: 0, score: 0, hiscore: 0, shotCool: 0,
      deadAt: -999, deadX: 0, deadY: 0,
    };
    this.boss = { x: W / 2, y: -200, tx: W / 2, ty: 420, hp: 1, hpMax: 1, hitT: 0 };
    this.emitters = [];
    this.bomb = null;
    this.msg = null;
    this.prevCi = -1;
    this.stats = {
      deaths: 0, hits: 0, bombs: 0, deathbombs: 0, maxBullets: 0, loops: 0,
      captures: 0, timeouts: 0, continues: 0,
      cardsSeen: new Array(this.cards.length).fill(0),
      deathsByCard: new Array(this.cards.length).fill(0),
      bombsByCard: new Array(this.cards.length).fill(0),
      capturesByCard: new Array(this.cards.length).fill(0),
      attackFramesByCard: new Array(this.cards.length).fill(0),
      maxBulletsByCard: new Array(this.cards.length).fill(0),
      durations: [],   // [符卡序号, 帧数]：每张卡从宣言到结算结束
    };
    this.ai = new G.AI(this);
    this.startCard(G.clamp(opt.startCard | 0, 0, this.cards.length - 1));
  }
  G.Sim = Sim;
  const S = Sim.prototype;

  // ---- 发弹 API（给 cards.js 用）----
  S.fire = function (x, y, ang, spd, spr, o) {
    const B = this.b;
    if (B.n >= B.cap) return -1;
    const i = B.n++;
    B.x[i] = x; B.y[i] = y; B.ang[i] = ang; B.spd[i] = spd; B.spr[i] = spr;
    B.age[i] = 0; B.rot[i] = ang;
    B.flag[i] = G.SPR_FLAG[spr];
    B.vs[i] = (this.vsc = (this.vsc + 1) & 255);
    if (o) {
      const sc = o.sc || 1;
      B.sc[i] = sc; B.r[i] = G.SPR_R[spr] * sc;
      B.acc[i] = o.acc || 0; B.angv[i] = o.angv || 0;
      B.minS[i] = o.minS !== undefined ? o.minS : 0; B.maxS[i] = o.maxS !== undefined ? o.maxS : 99;
      B.cvx[i] = o.cvx || 0; B.cvy[i] = o.cvy || 0; B.ax[i] = o.ax || 0; B.ay[i] = o.ay || 0; B.tv[i] = o.tv || 0;
      B.wobA[i] = o.wobA || 0; B.wobF[i] = o.wobF || 0; B.wobP[i] = o.wobP || 0;
      B.life[i] = o.life || 0; B.ev[i] = o.ev || 0; B.evAge[i] = o.evAge || 0;
      B.evA[i] = o.evA || 0; B.evB[i] = o.evB || 0; B.evC[i] = o.evC || 0; B.tag[i] = o.tag || 0;
    } else {
      B.sc[i] = 1; B.r[i] = G.SPR_R[spr];
      B.acc[i] = 0; B.angv[i] = 0; B.minS[i] = 0; B.maxS[i] = 99;
      B.cvx[i] = 0; B.cvy[i] = 0; B.ax[i] = 0; B.ay[i] = 0; B.tv[i] = 0;
      B.wobA[i] = 0; B.wobF[i] = 0; B.wobP[i] = 0; B.life[i] = 0; B.ev[i] = 0; B.evAge[i] = 0;
      B.evA[i] = 0; B.evB[i] = 0; B.evC[i] = 0; B.tag[i] = 0;
    }
    return i;
  };
  S.ring = function (x, y, n, base, spd, spr, o) {
    for (let k = 0; k < n; k++) this.fire(x, y, base + (k * TAU) / n, spd, spr, o);
  };
  S.aim = function (x, y) {
    const p = this.player;
    const tx = p.alive ? p.x : W / 2, ty = p.alive ? p.y : H - 240;
    return atan2(ty - y, tx - x);
  };
  S.bossTo = function (x, y) { this.boss.tx = x; this.boss.ty = y; };
  S.wander = function (x0, x1, y0, y1) {
    const b = this.boss, r = this.rng;
    // 向玩家一侧偏一点，像东方 Boss 的游走
    let tx = r.range(x0, x1);
    if (this.player.alive && r() < 0.5) tx = G.clamp((tx + this.player.x) / 2, x0, x1);
    b.tx = tx; b.ty = r.range(y0, y1);
  };
  S.emitter = function (o) {
    const e = Object.assign({ kind: 'gap', x: 0, y: 0, rot: 0, len: 420, open: 0, target: 1, openRate: 1 / 24, age: 0, hazard: 90 }, o);
    this.emitters.push(e);
    return e;
  };

  // ---- 特效（剪纸：消弹变成黄色纸星星往上飘，擦弹是白色小火花，死亡是撕纸碎片） ----
  S.spawnFx = function (spr, x, y, vx, vy, life, s0, s1, a0, a1, tint, layer, drag, spin, rot, age0, gy) {
    const F = this.fx;
    if (F.n >= F.cap) return;
    const i = F.n++;
    F.spr[i] = spr; F.x[i] = x; F.y[i] = y; F.vx[i] = vx; F.vy[i] = vy; F.life[i] = life;
    F.s0[i] = s0; F.s1[i] = s1; F.a0[i] = a0; F.a1[i] = a1; F.tint[i] = tint; F.layer[i] = layer;
    F.drag[i] = drag || 0; F.spin[i] = spin || 0; F.rot[i] = rot || 0; F.age[i] = age0 || 0; F.gy[i] = gy || 0;
  };
  S.fxCancel = function (i) {
    const B = this.b, r = this.vrng;
    if (r() < 0.5) {
      this.spawnFx(FXS.star, B.x[i], B.y[i], r.range(-0.8, 0.8), r.range(-3.2, -1.2), 36 + r.int(16),
        1.1, 0.5, 1, 0, 0xffffff, 1, 0.03, r.range(-0.12, 0.12), r() * TAU);
    } else {
      this.spawnFx(FXS.shred + r.int(FXS.NSHRED), B.x[i], B.y[i], r.range(-1.5, 1.5), r.range(-2.5, 0), 30 + r.int(14),
        0.7, 0.4, 1, 0, G.SPR_FX[B.spr[i]], 1, 0.02, r.range(-0.2, 0.2), r() * TAU, 0, 0.12);
    }
  };
  S.fxGraze = function (x, y) {
    const r = this.vrng;
    for (let k = 0; k < 2; k++) {
      const a = r() * TAU, s = r.range(5, 9);
      this.spawnFx(FXS.spark, x, y, cos(a) * s, sin(a) * s, 16, 1.1, 0.4, 1, 0, 0xfff4c8, 1, 0.08, 0, a);
    }
  };
  // 撕纸碎片飞散（带一点重力，边转边落）
  S.fxShreds = function (x, y, n, spd, life, size) {
    const r = this.vrng;
    for (let k = 0; k < n; k++) {
      const a = r() * TAU, s = r.range(spd * 0.3, spd);
      this.spawnFx(FXS.shred + r.int(FXS.NSHRED), x, y, cos(a) * s, sin(a) * s - 2, life + r.int(life >> 1),
        size * r.range(0.8, 1.4), size * 0.7, 1, 0, 0xffffff, 1, 0.03, r.range(-0.3, 0.3), r() * TAU, 0, 0.28);
    }
  };
  S.fxBurst = function (x, y, n, tint, spd, life, size) {
    const r = this.vrng;
    for (let k = 0; k < n; k++) {
      const a = r() * TAU, s = r.range(spd * 0.3, spd);
      this.spawnFx(FXS.spark, x, y, cos(a) * s, sin(a) * s, life + r.int(life >> 1), size, 0.3, 1, 0, tint, 1, 0.05, 0, a);
    }
  };
  S.cancelAll = function () {
    const B = this.b;
    for (let i = 0; i < B.n; i++) this.fxCancel(i);
    B.n = 0;
  };
  S.cancelRadius = function (x, y, rad) {
    const B = this.b;
    let i = 0;
    while (i < B.n) {
      const dx = B.x[i] - x, dy = B.y[i] - y, rr = rad + B.r[i];
      if (dx * dx + dy * dy < rr * rr) { this.fxCancel(i); B.remove(i); this.player.score += 100; continue; }
      i++;
    }
  };

  // ---- 符卡流程 ----
  S.startCard = function (i) {
    this.prevCi = this.ci === undefined ? -1 : this.ci;
    if (this.ci !== undefined) this.stats.durations.push([this.ci, this.frame - this.cardStart]);
    this.cardStart = this.frame;
    this.ci = i;
    this.card = this.cards[i];
    this.cf = 0;
    this.af = 0;
    this.endAt = 0;
    this.phase = 'decl';
    this.st = {};
    this.emitters.length = 0;
    this.bonusValid = true;
    const b = this.boss;
    b.hp = b.hpMax = this.card.hp;
    b.tx = this.card.home[0]; b.ty = this.card.home[1];
    this.stats.cardsSeen[i]++;
    if (this.card.init) this.card.init(this, this.st);
  };
  S.endCard = function (captured) {
    this.phase = 'end';
    this.endAt = this.cf;
    this.captured = captured;
    this.cancelAll();
    for (const e of this.emitters) e.target = 0;
    const p = this.player;
    const st = this.stats;
    st.attackFramesByCard[this.ci] += this.af;
    if (captured) { st.captures++; st.capturesByCard[this.ci]++; }
    else st.timeouts++;
    let bonus = 0;
    if (captured && this.bonusValid) {
      bonus = 1000000 + Math.round((this.card.limit - this.af) / 60) * 100000;
      p.score += bonus;
    }
    this.msg = { captured, bonus: bonus, at: this.frame };
    this.boss.hp = Math.max(0, this.boss.hp);
  };
  S.nextCard = function () {
    let i = this.ci + 1;
    if (i >= this.cards.length) {
      i = 0;
      this.stats.loops++;
      const p = this.player;
      p.lives = Math.max(p.lives, 3);
      p.bombs = Math.max(p.bombs, 3);
    }
    this.startCard(i);
  };
  S.updateCard = function () {
    const card = this.card;
    this.cf++;
    if (this.phase === 'decl') {
      if (this.cf >= DECL) { this.phase = 'attack'; this.af = 0; }
    } else if (this.phase === 'attack') {
      card.update(this, this.st, this.af);
      this.af++;
      if (this.boss.hp <= 0) this.endCard(true);
      else if (this.af >= card.limit) this.endCard(!!card.survival);
    } else if (this.cf - this.endAt >= END) {
      this.nextCard();
    }
    const b = this.boss;
    const k = this.phase === 'decl' ? 0.06 : 0.045;
    b.x += (b.tx - b.x) * k;
    b.y += (b.ty - b.y) * k;
    if (b.hitT > 0) b.hitT--;
    // 发射口（隙间、药瓶）的开合
    const E = this.emitters;
    for (let j = E.length - 1; j >= 0; j--) {
      const e = E[j];
      e.age++;
      if (e.target > e.open) e.open = Math.min(e.target, e.open + e.openRate);
      else if (e.target < e.open) e.open = Math.max(e.target, e.open - e.openRate);
      if (e.target === 0 && e.open <= 0) E.splice(j, 1);
    }
  };

  // ---- 自机 ----
  S.updatePlayer = function (c) {
    const p = this.player;
    p.foc += ((p.focus ? 1 : 0) - p.foc) * 0.25;
    if (!p.alive) {
      if (--p.respawn <= 0) {
        p.alive = true; p.x = W / 2; p.y = H - 200; p.inv = 200; p.hitPending = 0;
      }
      return;
    }
    if (p.hitPending > 0) {
      if (c.bomb && p.bombs > 0) {
        p.hitPending = 0;
        this.stats.deathbombs++;
        this.doBomb();
      } else if (--p.hitPending === 0) {
        this.killPlayer();
        return;
      }
      if (p.hitPending > 0) return;   // 决死窗口里不能动
    }
    const sp = c.focus ? SPEED_SLOW : SPEED_FAST;
    let mx = c.mx, my = c.my;
    const m = sqrt(mx * mx + my * my);
    if (m > 1) { mx /= m; my /= m; }
    p.x = G.clamp(p.x + mx * sp, XMIN, XMAX);
    p.y = G.clamp(p.y + my * sp, YMIN, YMAX);
    p.vx = mx;
    p.focus = !!c.focus;
    if (p.inv > 0) p.inv--;
    if (c.bomb && p.bombs > 0 && !this.bomb) this.doBomb();
    if (p.shotCool > 0) p.shotCool--;
    if (c.shot && p.shotCool <= 0 && this.phase !== 'end') {
      p.shotCool = 4;
      this.firePlayerShots();
    }
  };
  S.firePlayerShots = function () {
    const p = this.player, Sh = this.shots, b = this.boss;
    const add = (x, y, vx, vy, dmg, kind) => {
      if (Sh.n >= Sh.cap) return;
      const i = Sh.n++;
      Sh.x[i] = x; Sh.y[i] = y; Sh.vx[i] = vx; Sh.vy[i] = vy; Sh.dmg[i] = dmg; Sh.kind[i] = kind;
    };
    add(p.x - 16, p.y - 40, 0, -52, 1.2, 0);
    add(p.x + 16, p.y - 40, 0, -52, 1.2, 0);
    const f = p.foc;
    for (let s = -1; s <= 1; s += 2) {
      const ox = p.x + s * G.lerp(88, 38, f), oy = p.y + G.lerp(10, -56, f);
      if (p.focus) add(ox, oy - 20, 0, -62, 0.9, 1);
      else {
        const vx = G.clamp((b.x - ox) * 0.03, -9, 9) + s * 1.5;
        add(ox, oy - 10, vx, -44, 0.7, 2);
      }
    }
  };
  // 血量下限随时间线性降到 0（16 秒），任何伤害都不能让符卡早于 16 秒结束
  S.hpFloor = function () { return this.card.hp * Math.max(0, 1 - this.af / MIN_CAPTURE); };
  S.updateShots = function () {
    const Sh = this.shots, b = this.boss;
    const hittable = this.phase === 'attack' && b.y > 0 && !this.card.survival;
    const floor = this.hpFloor();
    let i = 0;
    while (i < Sh.n) {
      Sh.x[i] += Sh.vx[i];
      Sh.y[i] += Sh.vy[i];
      if (hittable && Math.abs(Sh.x[i] - b.x) < 110 && Math.abs(Sh.y[i] - b.y) < 150) {
        b.hp = Math.max(floor, b.hp - Sh.dmg[i]);
        b.hitT = 3;
        this.player.score += 10;
        if ((this.frame + i) % 3 === 0) {
          const r = this.vrng;
          this.spawnFx(FXS.spark, Sh.x[i], Sh.y[i], r.range(-4, 4), r.range(-6, -1), 12, 0.9, 0.3, 0.9, 0, 0xfff0c0, 1, 0.05, 0, r() * TAU);
        }
        Sh.remove(i);
        continue;
      }
      if (Sh.y[i] < -120 || Sh.x[i] < -120 || Sh.x[i] > W + 120) { Sh.remove(i); continue; }
      i++;
    }
  };
  S.doBomb = function () {
    const p = this.player;
    p.bombs--;
    this.stats.bombs++;
    this.stats.bombsByCard[this.ci]++;
    this.bonusValid = false;
    p.inv = Math.max(p.inv, 220);
    const orbs = [];
    const cols = [0xff4466, 0xff9944, 0xffee55, 0x55ee88, 0x55ccff, 0x6677ff, 0xcc66ff];
    for (let k = 0; k < 7; k++) orbs.push({ a: (k * TAU) / 7, rad: 30, x: p.x, y: p.y, vx: 0, vy: 0, col: cols[k], alive: true, age: 0 });
    this.bomb = { t: 0, x: p.x, y: p.y, orbs };
    this.cancelRadius(p.x, p.y, 420);
    this.spawnFx(FXS.ring, p.x, p.y, 0, 0, 40, 0.3, 4.2, 0.9, 0, 0xffffff, 1);
    this.spawnFx(FXS.ring, p.x, p.y, 0, 0, 52, 0.2, 3.2, 0.8, 0, 0xf6c63f, 1, 0, 0.02, 0, -8);
  };
  S.updateBomb = function () {
    const bm = this.bomb;
    if (!bm) return;
    bm.t++;
    const p = this.player, b = this.boss;
    let alive = 0;
    for (const o of bm.orbs) {
      if (!o.alive) continue;
      o.age++;
      if (bm.t < 46) {
        o.a += 0.1;
        o.rad = 40 + bm.t * 5.5;
        o.x = p.x + cos(o.a) * o.rad;
        o.y = p.y + sin(o.a) * o.rad;
      } else {
        const dx = b.x - o.x, dy = b.y - o.y, d = sqrt(dx * dx + dy * dy) || 1;
        o.vx += (dx / d) * 2.2; o.vy += (dy / d) * 2.2;
        const v = sqrt(o.vx * o.vx + o.vy * o.vy);
        if (v > 26) { o.vx *= 26 / v; o.vy *= 26 / v; }
        o.x += o.vx; o.y += o.vy;
        if (d < 120 || bm.t > 150) {
          o.alive = false;
          if (this.phase === 'attack' && d < 160 && !this.card.survival) { b.hp = Math.max(this.hpFloor(), b.hp - 26); b.hitT = 6; }
          this.spawnFx(FXS.ring, o.x, o.y, 0, 0, 26, 0.3, 1.8, 0.9, 0, 0xffffff, 1);
          this.fxShreds(o.x, o.y, 10, 12, 26, 1.1);
          continue;
        }
      }
      this.cancelRadius(o.x, o.y, 120);
      alive++;
    }
    if (!alive || bm.t > 170) this.bomb = null;
  };
  S.killPlayer = function () {
    const p = this.player, st = this.stats;
    p.alive = false;
    p.respawn = 50;
    p.deadAt = this.frame; p.deadX = p.x; p.deadY = p.y;
    st.deaths++;
    st.deathsByCard[this.ci]++;
    this.bonusValid = false;
    // 电车被弹：撕成纸片飞散，一圈撕纸圆环扩散
    for (let k = 0; k < 3; k++) this.spawnFx(FXS.ring, p.x, p.y, 0, 0, 44, 0.15, 3.6 - k * 0.8, 1, 0, k === 1 ? 0xf07ea4 : 0xffffff, 1, 0, 0.01, k, -k * 7);
    this.spawnFx(FXS.puff, p.x, p.y, 0, 0, 24, 1.2, 3.2, 0.9, 0, 0xffffff, 1);
    this.fxShreds(p.x, p.y, 46, 17, 70, 1.5);
    this.cancelAll();
    p.lives--;
    if (p.lives < 0) { p.lives = 2; st.continues++; }
    p.bombs = 3;
  };

  // ---- 子弹推进 ----
  S.bulletEvent = function (i) {
    const B = this.b, t = B.ev[i];
    B.ev[i] = 0;
    if (t === EV_AIM) {
      B.ang[i] = this.aim(B.x[i], B.y[i]) + B.evB[i];
      B.spd[i] = B.evA[i]; B.acc[i] = B.evC[i]; B.angv[i] = 0; B.wobA[i] = 0;
      B.minS[i] = 0; B.maxS[i] = 99; B.cvx[i] = 0; B.cvy[i] = 0; B.ax[i] = 0; B.ay[i] = 0;
      return false;
    }
    if (t === EV_SPLIT) {
      const n = B.evA[i] | 0, spr = B.evB[i] | 0, spd = B.evC[i], x = B.x[i], y = B.y[i];
      const base = this.aim(x, y) + TAU / n / 2;
      this.fxCancel(i);
      B.remove(i);
      this.ring(x, y, n, base, spd, spr);
      return true;
    }
    if (t === EV_GO) {
      B.acc[i] = B.evA[i]; B.maxS[i] = B.evB[i]; B.minS[i] = 0;
      B.angv[i] = B.evC[i];
    }
    return false;
  };
  S.updateBullets = function () {
    const B = this.b;
    let i = 0;
    while (i < B.n) {
      const age = ++B.age[i];
      if (B.ev[i] !== 0 && age === B.evAge[i] && this.bulletEvent(i)) continue;
      let s = B.spd[i] + B.acc[i];
      if (s < B.minS[i]) s = B.minS[i];
      else if (s > B.maxS[i]) s = B.maxS[i];
      B.spd[i] = s;
      const a = (B.ang[i] += B.angv[i]);
      const cvx = (B.cvx[i] += B.ax[i]);
      let cvy = (B.cvy[i] += B.ay[i]);
      if (B.tv[i] > 0 && cvy > B.tv[i]) cvy = B.cvy[i] = B.tv[i];
      const d = B.wobA[i] !== 0 ? a + B.wobA[i] * sin(age * B.wobF[i] + B.wobP[i]) : a;
      const vx = cos(d) * s + cvx, vy = sin(d) * s + cvy;
      const x = (B.x[i] += vx), y = (B.y[i] += vy);
      const fl = B.flag[i];
      if (fl & 2) { if (vx !== 0 || vy !== 0) B.rot[i] = atan2(vy, vx); }
      else if (fl & 4) B.rot[i] += 0.07;
      const m = 60 + B.r[i] * 2;
      const lifeOut = B.life[i] > 0 && age >= B.life[i];
      if (lifeOut || x < -m || x > W + m || y > H + m || (y < -m && (B.ay[i] <= 0 || y < -1400))) {
        if (lifeOut) this.fxCancel(i);
        B.remove(i);
        continue;
      }
      i++;
    }
  };
  S.collide = function () {
    const p = this.player;
    if (!p.alive || p.hitPending > 0) return;
    const B = this.b, px = p.x, py = p.y, n = B.n;
    for (let i = 0; i < n; i++) {
      const dx = B.x[i] - px;
      if (dx > 140 || dx < -140) continue;
      const dy = B.y[i] - py;
      if (dy > 140 || dy < -140) continue;
      const rr = B.r[i] + PR, d2 = dx * dx + dy * dy;
      if (d2 < rr * rr) {
        if (p.inv <= 0) {
          p.hitPending = DEATHBOMB;
          this.stats.hits++;
          this.spawnFx(FXS.puff, px, py, 0, 0, 10, 0.5, 1.4, 1, 0, 0xf07ea4, 1);
          return;
        }
      } else if (!(B.flag[i] & 1)) {
        const gr = rr + GRAZE;
        if (d2 < gr * gr) {
          B.flag[i] |= 1;
          p.graze++;
          p.score += 500;
          this.fxGraze(px + dx * 0.5, py + dy * 0.5);
        }
      }
    }
  };
  S.updateFx = function () {
    const F = this.fx;
    let i = 0;
    while (i < F.n) {
      const age = ++F.age[i];
      if (age >= F.life[i]) { F.remove(i); continue; }
      if (age > 0) {
        const k = 1 - F.drag[i];
        F.vx[i] *= k; F.vy[i] = F.vy[i] * k + F.gy[i];
        F.x[i] += F.vx[i]; F.y[i] += F.vy[i];
        F.rot[i] += F.spin[i];
      }
      i++;
    }
  };

  // ---- 输入 / 模式 ----
  S.notifyInput = function () {
    this.lastInput = this.frame;
    if (this.mode !== 'player') { this.mode = 'player'; this.modeAt = this.frame; }
  };
  const IDLE = { mx: 0, my: 0, focus: false, shot: true, bomb: false, active: false };

  S.step = function () {
    this.frame++;
    let c = null;
    if (this.mode === 'player') {
      c = G.input ? G.input.read(this) : IDLE;
      if (c.active) this.lastInput = this.frame;
      if (this.frame - this.lastInput > IDLE_FRAMES) { this.mode = 'auto'; this.modeAt = this.frame; c = null; }
    }
    if (!c) c = this.ai.decide();
    this.ctrl = c;
    this.updatePlayer(c);
    this.updateCard();
    this.updateBullets();
    this.updateShots();
    this.updateBomb();
    this.collide();
    this.updateFx();
    const p = this.player;
    if (p.score > p.hiscore) p.hiscore = p.score;
    if (this.b.n > this.stats.maxBullets) this.stats.maxBullets = this.b.n;
    if (this.b.n > this.stats.maxBulletsByCard[this.ci]) this.stats.maxBulletsByCard[this.ci] = this.b.n;
  };
})();
