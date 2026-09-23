/* 东方弹幕 POC · 符卡。每张卡对应一条摊位宣传（panel 指向右侧宣传栏）。
 * update(sim, st, f)：f 是进入攻击阶段后的帧数。所有随机都走 sim.rng，保证同一种子画面一致。 */
(function () {
  'use strict';
  const G = window.BXG;
  const W = G.W, H = G.H, T = G.TAU, PI = Math.PI;
  const cos = Math.cos, sin = Math.sin;

  // 用到的子弹精灵（加载时注册，图集只画这些）
  const S = {
    redHeart: G.spr('heart', 'red'),
    blackMid: G.spr('mid', 'black'),
    redOrb: G.spr('orb', 'red'),
    ribRed: G.spr('ribbon', 'hred'),
    ribGreen: G.spr('ribbon', 'hgreen'),
    riceRed: G.spr('rice', 'hred'),
    riceGreen: G.spr('rice', 'hgreen'),
    yaku: G.spr('yaku', 'gray'),
    fireOrb: G.spr('orb', 'orange'),
    fireMid: G.spr('mid', 'red'),
    waterDrop: G.spr('drop', 'blue'),
    waterOrb: G.spr('orb', 'cyan'),
    woodRice: G.spr('rice', 'green'),
    woodOrb: G.spr('orb', 'green'),
    vialFire: G.spr('vial', 'orange'),
    vialWater: G.spr('vial', 'blue'),
    vialWood: G.spr('vial', 'green'),
    starY: G.spr('star', 'yellow'),
    starR: G.spr('star', 'red'),
    win: G.spr('win', 'black'),
    riceBlack: G.spr('rice', 'black'),
    // 境界卡：按四幅名画的主色分四段
    gBlue: G.spr('orb', 'blue'), gYellowRice: G.spr('rice', 'yellow'), gCream: G.spr('orb', 'cream'),
    gOrange: G.spr('orb', 'orange'), gBrownRice: G.spr('rice', 'brown'), gGreen: G.spr('orb', 'green'),
    gRed: G.spr('orb', 'red'), gCreamRice: G.spr('rice', 'cream'), gPurple: G.spr('orb', 'purple'),
    gPink: G.spr('orb', 'pink'), gGreenRice: G.spr('rice', 'green'), gYellow: G.spr('orb', 'yellow'),
    gBig: G.spr('big', 'purple'),
  };
  G.CARD_SPR = S;

  const CARDS = [];

  // 1 红黑：红心花环顺时针，停一下后自机狙；黑弹花环逆时针，出去后波浪
  CARDS.push({
    key: 'badge', panel: 'badge',
    name: '红黑「YES / NO」',
    hp: 420, limit: 1200, home: [W / 2, 440],
    init(s, st) { st.a = 0; },
    update(s, st, f) {
      const b = s.boss;
      if (f % 240 === 200) s.wander(W * 0.32, W * 0.62, 420, 500);
      const hard = f > 600 ? 1 : 0;
      if (f % 40 === 0) {
        const n = 26 + hard * 6, base = -f * 0.011;
        for (let k = 0; k < n; k++) {
          const a = base + (k * T) / n;
          s.fire(b.x + cos(a) * 70, b.y + sin(a) * 70, a, 2.4, S.blackMid, { angv: -0.022, acc: -0.02, minS: 1.2, wobA: 0.3, wobF: 0.07, wobP: k * 0.9, ev: G.EV.GO, evAge: 50, evA: 0.035, evB: 4.8, evC: 0 });
        }
      }
      if (f % 60 === 30) {
        const n = 20, base = f * 0.013;
        for (let k = 0; k < n; k++) {
          const a = base + (k * T) / n;
          s.fire(b.x + cos(a) * 90, b.y + sin(a) * 90, a, 5, S.redHeart, {
            angv: 0.035, acc: -0.12, minS: 0.4, ev: G.EV.AIM, evAge: 46 + (k % 4) * 5, evA: 8 + hard, evB: ((k % 3) - 1) * 0.05, evC: 0.05,
          });
        }
      }
      if (hard && f % 120 === 90) {
        const a = s.aim(b.x, b.y);
        for (let k = -2; k <= 2; k++) s.fire(b.x, b.y, a + k * 0.2, 6.5, S.redOrb, { acc: 0.02, maxS: 8 });
      }
    },
  });

  // 2 厄符：四臂旋转螺旋的缎带（雏的红、墨绿），反向三臂螺旋，混入「厄」字弹
  CARDS.push({
    key: 'hina', panel: 'hina',
    name: '厄符「流し雛」',
    hp: 320, limit: 1200, home: [W / 2, 480],
    init(s, st) { st.a = 0; st.b = 0; },
    update(s, st, f) {
      const b = s.boss;
      if (f % 300 === 280) s.bossTo(W / 2 + (s.rng() - 0.5) * 260, 480 + (s.rng() - 0.5) * 60);
      if (f % 2 === 0) {
        st.a += 0.115 + 0.035 * sin(f * 0.006);
        for (let k = 0; k < 4; k++) {
          const a = st.a + (k * T) / 4;
          s.fire(b.x + cos(a) * 40, b.y + sin(a) * 40, a, 2.6, k % 2 ? S.ribGreen : S.ribRed, { acc: 0.05, maxS: 6.0, angv: 0.003 });
        }
      }
      if (f > 150 && f % 7 === 0) {
        st.b -= 0.21;
        for (let k = 0; k < 3; k++) {
          const a = st.b + (k * T) / 3;
          s.fire(b.x, b.y, a, 2.0, k % 2 ? S.riceGreen : S.riceRed, { acc: 0.04, maxS: 4.8, angv: -0.003 });
        }
      }
      if (f % 54 === 20) {
        const n = 7, base = s.rng() * T;
        for (let k = 0; k < n; k++) s.fire(b.x, b.y, base + (k * T) / n, 1.6, S.yaku, { acc: 0.012, maxS: 3.2 });
      }
    },
  });

  // 3 魔药：三个问号药瓶发射口，火（扇形扫射）、水（喷泉落雨）、木（旋转叶环），定时抛出会分裂的小药瓶
  CARDS.push({
    key: 'alchemy', panel: 'alchemy',
    name: '魔药「帕秋莉的炼金工坊」',
    hp: 240, limit: 1200, home: [W / 2, 420],
    init(s, st) {
      st.w = 0;
      st.bot = [
        s.emitter({ kind: 'bottle', el: 0, x: 300, y: 780, openRate: 1 / 30, hazard: 95 }),
        s.emitter({ kind: 'bottle', el: 1, x: W / 2, y: 760, openRate: 1 / 30, hazard: 95 }),
        s.emitter({ kind: 'bottle', el: 2, x: W - 300, y: 780, openRate: 1 / 30, hazard: 95 }),
      ];
    },
    update(s, st, f) {
      if (f % 200 === 100) s.bossTo(W / 2 + (f % 400 === 100 ? -1 : 1) * (240 + s.rng() * 160), 400 + s.rng() * 60);
      if (f < 30) return;
      const [F, Wt, Wd] = st.bot;
      const hard = f > 660 ? 1 : 0;
      // 火
      if (f % 4 === 0) {
        const a0 = PI / 2 + 0.8 * sin(f * 0.021);
        for (let k = -2; k <= 2; k++) s.fire(F.x + 10, F.y - 90, a0 + k * 0.17, 6, S.fireOrb, { acc: 0.02, maxS: 7.5 });
      }
      if (hard && f % 40 === 0) {
        const a = s.aim(F.x, F.y);
        s.fire(F.x, F.y - 60, a, 5, S.fireMid, { acc: 0.04, maxS: 8 });
      }
      // 水：弹道抛物线，像喷泉落下的雨
      if (f % 2 === 0) {
        const a = -PI / 2 + (s.rng() - 0.5) * 2.0, sp = 7 + s.rng() * 5;
        s.fire(Wt.x, Wt.y - 110, 0, 0, S.waterDrop, { cvx: cos(a) * sp, cvy: sin(a) * sp, ay: 0.13, tv: 7.5 });
      }
      // 木
      if (f % 12 === 0) {
        st.w += 0.23;
        const n = 9 + hard * 3;
        for (let k = 0; k < n; k++) s.fire(Wd.x - 10, Wd.y - 90, st.w + (k * T) / n, 3.2, S.woodRice, { acc: 0.02, maxS: 4.8, angv: 0.004 });
      }
      // 小药瓶：抛起后分裂成一圈本色的弹
      if (f % 150 === 75) {
        const list = [[F, S.vialFire, S.fireOrb], [Wt, S.vialWater, S.waterOrb], [Wd, S.vialWood, S.woodOrb]];
        for (const [e, v, ring] of list) {
          const a = -PI / 2 + (s.rng() - 0.5) * 1.0, sp = 9;
          s.fire(e.x, e.y - 110, 0, 0, v, { cvx: cos(a) * sp, cvy: sin(a) * sp, ay: 0.2, tv: 6, ev: G.EV.SPLIT, evAge: 62, evA: 14, evB: ring, evC: 4.0 });
        }
      }
    },
  });

  // 4 境界：隙间在场地边缘开合，弹从裂缝里涌出；Boss 放慢速结界环。按四幅名画分四段换位置、换颜色
  const LAYOUTS = [
    [[70, 560, PI / 2, 0], [W - 70, 860, PI / 2, PI], [460, 150, 0.12, PI / 2]],
    [[W / 2 + 200, 140, -0.08, PI / 2], [70, 980, PI / 2, 0], [W - 70, 480, PI / 2, PI]],
    [[250, 420, -0.75, 0.82], [W - 250, 420, 0.75, PI - 0.82], [W / 2, 130, 0, PI / 2]],
    [[70, 620, PI / 2, 0], [W - 70, 620, PI / 2, PI], [360, 140, 0.1, PI / 2], [W - 360, 140, -0.1, PI / 2]],
  ];
  const PALS = [
    [S.gBlue, S.gYellowRice, S.gCream],
    [S.gOrange, S.gBrownRice, S.gGreen],
    [S.gRed, S.gCreamRice, S.gPurple],
    [S.gPink, S.gGreenRice, S.gYellow],
  ];
  const SEG = 300;
  G.SUKIMA_SEG = SEG;
  CARDS.push({
    key: 'sukima', panel: 'sukima',
    name: '境界「名画与东方的邂逅」',
    hp: 1, limit: SEG * 4, home: [W / 2, 440], survival: true,
    init(s, st) { st.seg = -1; st.gaps = []; },
    update(s, st, f) {
      const b = s.boss;
      const seg = Math.min(3, Math.floor(f / SEG));
      if (seg !== st.seg) {
        st.seg = seg;
        for (const g of st.gaps) g.target = 0;
        st.gaps = LAYOUTS[seg].map((q) => s.emitter({ kind: 'gap', x: q[0], y: q[1], rot: q[2], nrm: q[3], len: 400, openRate: 1 / 22, hazard: 80 }));
        st.pal = PALS[seg];
        s.bossTo(W / 2 + (s.rng() - 0.5) * 300, 430 + s.rng() * 70);
      }
      const pal = st.pal;
      const lf = f - seg * SEG;
      // 从隙间涌出
      if (f % (seg >= 2 ? 3 : 4) === 0) {
        for (const g of st.gaps) {
          if (g.open < 0.7 || g.target === 0) continue;
          const t = (s.rng() - 0.5) * 0.8 * g.len;
          const px = g.x + cos(g.rot) * t, py = g.y + sin(g.rot) * t;
          s.fire(px, py, g.nrm + (s.rng() - 0.5) * 0.7, 1.8 + s.rng() * 1.5, pal[0], { acc: 0.008, maxS: 3.6 });
        }
      }
      // 每道隙间朝自机射一串米粒
      if (lf > 40 && f % 80 === 40) {
        for (const g of st.gaps) {
          const a = s.aim(g.x, g.y);
          for (let k = 0; k < 5; k++) s.fire(g.x, g.y, a, 5.5 + k * 0.8, pal[1]);
        }
      }
      // Boss：慢速结界环，最后一段更密
      const every = seg >= 2 ? 18 : 28;
      if (f % every === 0) {
        const n = seg >= 2 ? 64 : 52, base = f * 0.0105;
        for (let k = 0; k < n; k++) s.fire(b.x, b.y, base + (k * T) / n, 1.5, pal[2], { acc: 0.01, maxS: 2.9 });
      }
      if (lf === 150) {
        const a = s.aim(b.x, b.y);
        for (let k = -1; k <= 1; k++) s.fire(b.x, b.y, a + k * 0.5, 3, S.gBig, { acc: 0.02, maxS: 4.2 });
      }
    },
  });

  // 5 宣符：旋转七向星星流，「赢」字环，自机狙三向米粒
  CARDS.push({
    key: 'win', panel: 'win',
    name: '宣符「会赢的」',
    hp: 240, limit: 1200, home: [W / 2, 440],
    init(s, st) { st.a = 0; st.b = 0; },
    update(s, st, f) {
      const b = s.boss;
      if (f % 260 === 200) s.wander(W * 0.32, W * 0.62, 420, 500);
      if (f % 4 === 0) {
        st.a += 0.075;
        for (let k = 0; k < 7; k++) s.fire(b.x, b.y, st.a + (k * T) / 7, 3.8, S.starY, { acc: 0.03, maxS: 6.2 });
      }
      if (f > 120 && f % 5 === 3) {
        st.b -= 0.07;
        for (let k = 0; k < 5; k++) s.fire(b.x, b.y, st.b + (k * T) / 5, 3.2, S.starR, { acc: 0.025, maxS: 5.2 });
      }
      if (f % 96 === 48) {
        const n = 10, base = s.rng() * T;
        for (let k = 0; k < n; k++) s.fire(b.x, b.y, base + (k * T) / n, 1.8, S.win, { acc: 0.01, maxS: 3 });
      }
      if (f > 90 && f % 30 === 0) {
        const a = s.aim(b.x, b.y);
        for (let k = -1; k <= 1; k++) s.fire(b.x, b.y, a + k * 0.22, 7.5, S.riceBlack);
      }
    },
  });

  G.CARDS = CARDS;
})();
