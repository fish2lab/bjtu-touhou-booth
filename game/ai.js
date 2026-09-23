/* 东方弹幕 POC · 自动驾驶。
 * 每帧：把附近子弹按真实运动学外推 30 帧（0.5 秒），对 17 个候选速度（8 方向×高速/低速 + 静止）
 * 各评估两种计划（一直这样走 / 走 5 帧后停），代价 = 最早碰撞时间 + 擦身而过的近距离代价
 * + 回到 Boss 下方偏好位的代价 + 靠墙惩罚 + 人群密度 − 少量擦弹奖励 + 换向惩罚，选最小的。 */
(function () {
  'use strict';
  const G = window.BXG;
  const W = G.W, H = G.H, TAU = G.TAU;
  const sqrt = Math.sqrt, cos = Math.cos, sin = Math.sin, atan2 = Math.atan2;

  const SAMPLES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 19, 22, 26, 30];
  const NS = SAMPLES.length;
  const HOR = 30;
  const MAXB = 3000;
  const TAP = 5;
  const NEAR = 56;
  const W_NEAR = 160, W_POSX = 2.4, W_POSY = 0.8, W_CROWD = 5, W_GRAZE = 9;
  const W_SWITCH = 30, W_TURN = 9, W_STOP = 16;   // 换向惩罚：转得越急越贵（反向 = 30 + 144）

  // 候选：0 静止；1..8 高速 8 方向；9..16 低速 8 方向
  const CAND = [{ mx: 0, my: 0, focus: false, dir: -1 }];
  for (let s = 0; s < 2; s++) {
    for (let d = 0; d < 8; d++) {
      const a = (d * TAU) / 8;
      let mx = Math.round(cos(a) * 1000) / 1000, my = Math.round(sin(a) * 1000) / 1000;
      CAND.push({ mx, my, focus: s === 1, dir: d });
    }
  }
  const NC = CAND.length;

  function AI(sim) {
    this.sim = sim;
    this.bx = new Float64Array(MAXB * NS);
    this.by = new Float64Array(MAXB * NS);
    this.br = new Float64Array(MAXB);
    this.prev = 0;
    this.hold = 0;
    this.info = { cand: 0, cost: 0, hitT: 0, m: 0, bomb: 0 };
    this.costs = new Float64Array(NC);
  }
  G.AI = AI;

  // 按 sim.updateBullets 的同一套运动学外推第 i 发子弹，写入第 j 行
  AI.prototype.predict = function (i, j, px, py) {
    const B = this.sim.b, bx = this.bx, by = this.by;
    let x = B.x[i], y = B.y[i], s = B.spd[i], a = B.ang[i], cvx = B.cvx[i], cvy = B.cvy[i];
    const acc = B.acc[i], angv = B.angv[i], ax = B.ax[i], ay = B.ay[i], tv = B.tv[i];
    let minS = B.minS[i], maxS = B.maxS[i];
    const wobA = B.wobA[i], wobF = B.wobF[i], wobP = B.wobP[i];
    let age = B.age[i];
    let ev = B.ev[i];
    const evAge = B.evAge[i];
    let accv = acc, angvv = angv, wob = wobA;
    let dead = false;
    let k = 0;
    let best = 1e9;
    for (let t = 1; t <= HOR; t++) {
      age++;
      if (ev !== 0 && age === evAge) {
        if (ev === 1) {
          a = atan2(py - y, px - x) + B.evB[i]; s = B.evA[i]; accv = B.evC[i]; angvv = 0; wob = 0;
          minS = 0; maxS = 99; cvx = 0; cvy = 0;
        } else if (ev === 2) {
          dead = true;   // 分裂：把分裂点当成一个静止危险区
        } else if (ev === 3) {
          accv = B.evA[i]; maxS = B.evB[i]; minS = 0; angvv = B.evC[i];
        }
        ev = 0;
      }
      if (!dead) {
        s += accv;
        if (s < minS) s = minS; else if (s > maxS) s = maxS;
        a += angvv;
        cvx += ax; cvy += ay;
        if (tv > 0 && cvy > tv) cvy = tv;
        const d = wob !== 0 ? a + wob * sin(age * wobF + wobP) : a;
        x += cos(d) * s + cvx;
        y += sin(d) * s + cvy;
      }
      if (t === SAMPLES[k]) {
        bx[k * MAXB + j] = x;
        by[k * MAXB + j] = y;
        const dx = x - px, dy = y - py;
        const reach = sqrt(dx * dx + dy * dy) - G.SPEED_FAST * t;
        if (reach < best) best = reach;
        k++;
      }
    }
    return best;
  };

  AI.prototype.addStatic = function (j, x, y) {
    const bx = this.bx, by = this.by;
    for (let k = 0; k < NS; k++) { bx[k * MAXB + j] = x; by[k * MAXB + j] = y; }
  };

  AI.prototype.decide = function () {
    const sim = this.sim, p = sim.player, B = sim.b, boss = sim.boss;
    const out = { mx: 0, my: 0, focus: false, shot: true, bomb: false, active: false };
    if (!p.alive) return out;
    if (p.hitPending > 0) { out.bomb = p.bombs > 0; return out; }

    const px = p.x, py = p.y;
    // 1) 收集相关子弹并外推
    let m = 0;
    const br = this.br;
    for (let i = 0; i < B.n && m < MAXB - 16; i++) {
      const dx = B.x[i] - px, dy = B.y[i] - py;
      const v = B.spd[i] + Math.abs(B.cvx[i]) + Math.abs(B.cvy[i]) + 40 * (Math.abs(B.acc[i]) + Math.abs(B.ay[i]) + Math.abs(B.ax[i]));
      const lim = (v + G.SPEED_FAST) * HOR + B.r[i] + 80;
      if (dx * dx + dy * dy > lim * lim) continue;
      const reach = this.predict(i, m, px, py);
      if (reach > B.r[i] + 90) continue;
      br[m] = B.r[i];
      m++;
    }
    // 发射口与 Boss 本体当作静止危险区（将来会从那里出弹）
    for (const e of sim.emitters) {
      if (e.open < 0.25 || !e.hazard) continue;
      this.addStatic(m, e.x, e.y); br[m] = e.hazard * e.open; m++;
    }
    if (sim.phase === 'attack' && boss.y > 0) { this.addStatic(m, boss.x, boss.y); br[m] = 120; m++; }

    // 2) 偏好位：Boss 正下方靠下
    let prefX = G.clamp(boss.x, 240, W - 240), prefY = H - 330;
    const card = sim.card;
    if (card && card.aiPref) {
      const q = card.aiPref(sim, sim.st);
      if (q) { prefX = q[0]; prefY = q[1]; }
    }

    const inv = p.inv > 45;
    const bx = this.bx, by = this.by;
    let bestC = 0, bestCost = Infinity, bestHit = 0, bestNear = 0;
    let allHitEarly = true;
    const prev = CAND[this.prev];
    for (let c = 0; c < NC; c++) {
      const cd = CAND[c];
      const sp = cd.focus ? G.SPEED_SLOW : G.SPEED_FAST;
      const vx = cd.mx * sp, vy = cd.my * sp;
      let candCost = Infinity, candHit = 0, candNear = 0;
      for (let plan = 0; plan < 2; plan++) {
        if (plan === 1 && c === 0) break;
        const T = plan === 0 ? HOR : TAP;
        let hitT = 0, near = 0, graze = 0, crowd = 0;
        let ex = px, ey = py;
        outer:
        for (let k = 0; k < NS; k++) {
          const t = SAMPLES[k];
          const tt = t < T ? t : T;
          let X = px + vx * tt, Y = py + vy * tt;
          if (X < G.XMIN) X = G.XMIN; else if (X > G.XMAX) X = G.XMAX;
          if (Y < G.YMIN) Y = G.YMIN; else if (Y > G.YMAX) Y = G.YMAX;
          ex = X; ey = Y;
          const marg = 2 + 0.45 * t;
          const wk = 1.15 - t / (HOR + 6);
          const base = k * MAXB;
          const last = k === NS - 1;
          const LIM = last ? 230 : 135;
          for (let j = 0; j < m; j++) {
            const dx = X - bx[base + j];
            if (dx > LIM || dx < -LIM) continue;
            const dy = Y - by[base + j];
            if (dy > LIM || dy < -LIM) continue;
            const d2 = dx * dx + dy * dy;
            const rr = br[j] + G.PR + marg;
            if (d2 < rr * rr) { hitT = t; break outer; }
            if (last) { if (d2 < 220 * 220) crowd++; }
            const rn = rr + NEAR;
            if (d2 < rn * rn) {
              const q = 1 - (sqrt(d2) - rr) / NEAR;
              near += wk * q * q;
              if (t >= 8 && q < 0.6) graze++;
            }
          }
        }
        let cost = 0;
        if (hitT) cost += (inv ? 2000 : 1e6) + (HOR + 1 - hitT) * (inv ? 100 : 1e5);
        cost += near * (inv ? 40 : W_NEAR);
        cost += crowd * W_CROWD;
        cost -= Math.min(graze, 6) * W_GRAZE;
        // 偏好位：Boss 正下方（水平对齐更重要，打得到 Boss 才能收卡）
        const dxp = Math.abs(ex - prefX), dyp = Math.abs(ey - prefY);
        cost += W_POSX * Math.max(0, dxp - 60) + W_POSY * Math.max(0, dyp - 80);
        if (ex < 150) cost += (150 - ex) * 3;
        if (ex > W - 150) cost += (ex - (W - 150)) * 3;
        if (ey > H - 120) cost += (ey - (H - 120)) * 3;
        if (ey < H * 0.42) cost += (H * 0.42 - ey) * 2;
        if (cost < candCost) { candCost = cost; candHit = hitT; candNear = near; }
      }
      // 换向惩罚：让动作连贯，不抖
      if (c !== this.prev) {
        candCost += W_SWITCH;
        if (cd.dir >= 0 && prev.dir >= 0) {
          const dd = Math.abs(cd.dir - prev.dir), turn = Math.min(dd, 8 - dd);   // 0..4，4 为反向
          candCost += turn * turn * W_TURN;
        } else if ((cd.dir < 0) !== (prev.dir < 0)) candCost += W_STOP;
        if (cd.focus !== prev.focus) candCost += 12;
      }
      this.costs[c] = candCost;
      if (!candHit || candHit > 3) allHitEarly = false;
      if (candCost < bestCost) { bestCost = candCost; bestC = c; bestHit = candHit; bestNear = candNear; }
    }

    const cd = CAND[bestC];
    out.mx = cd.mx; out.my = cd.my;
    out.focus = bestC === 0 ? bestNear > 0.4 || (p.focus && bestNear > 0.05) : cd.focus;
    // 3) 危险时放 Bomb：所有计划都会在 3 帧内被弹
    if (allHitEarly && !inv && p.inv <= 0 && p.bombs > 0 && !sim.bomb) out.bomb = true;
    this.prev = bestC;
    const info = this.info;
    info.cand = bestC; info.cost = bestCost; info.hitT = bestHit; info.m = m; info.bomb = out.bomb ? 1 : 0;
    info.prefX = prefX; info.prefY = prefY;
    return out;
  };
})();
