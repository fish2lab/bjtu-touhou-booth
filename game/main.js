/* 东方弹幕 POC · 入口。固定 60Hz 步长，渲染与模拟分离。
 * 查询参数：?card=1..5 起始符卡  ?t=秒 无渲染快进  &pause=1 停住  ?seed=  ?debug=1  ?rs=0.5 降渲染分辨率  ?jitter=0 关手绘抖动 */
(async function () {
  'use strict';
  const G = window.BXG;
  const nCards = G.CARDS.length;
  const seed = G.qnum('seed', 20260923) | 0;
  const startCard = G.clamp((G.qnum('card', 1) | 0) - 1, 0, nCards - 1);
  const t0 = Math.max(0, G.qnum('t', 0));
  const paused = G.qflag('pause');
  const debug = G.qflag('debug');
  const rs = G.clamp(G.qnum('rs', 1), 0.25, 2);
  const jitter = G.qflag('jitter', true);

  // 舞台等比缩放
  const stageEl = document.getElementById('stage');
  let scale = 1;
  function fit() {
    scale = Math.min(innerWidth / G.STAGE_W, innerHeight / G.STAGE_H);
    const ox = (innerWidth - G.STAGE_W * scale) / 2, oy = (innerHeight - G.STAGE_H * scale) / 2;
    stageEl.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + scale + ')';
  }
  fit();
  const resOf = () => Math.max(0.25, Math.min(2, scale * rs * (window.devicePixelRatio || 1)));

  // 画布里要用的手写字必须先加载
  await Promise.all([
    document.fonts.load('60px "Xiaolai"', '厄赢?'),
    document.fonts.ready,
  ]);
  const imgs = Array.from(document.images);
  await Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; }))));

  G.drawDesk();
  G.drawPanelArt();

  const sim = new G.Sim({ seed, startCard });
  G.input.init(sim);
  const R = new G.Renderer(sim, { debug, jitter });
  await R.init(resOf());
  addEventListener('resize', () => { fit(); R.resize(resOf()); });

  const n0 = Math.round(t0 * 60);
  for (let i = 0; i < n0; i++) sim.step();

  window.__game = {
    step(n) { n = n | 0 || 1; for (let i = 0; i < n; i++) sim.step(); return this.summary(); },
    get deaths() { return sim.stats.deaths; },
    get bullets() { return sim.b.n; },
    get maxBullets() { return sim.stats.maxBullets; },
    get card() { return sim.ci + 1; },
    get cardName() { return sim.card.name; },
    get mode() { return sim.mode; },
    get frame() { return sim.frame; },
    get stats() { return sim.stats; },
    get phase() { return sim.phase; },
    summary() {
      const s = sim.stats;
      return { frame: sim.frame, card: sim.ci + 1, phase: sim.phase, mode: sim.mode, bullets: sim.b.n, maxBullets: s.maxBullets, deaths: s.deaths, hits: s.hits, bombs: s.bombs, deathbombs: s.deathbombs, cardsSeen: s.cardsSeen.slice(), captures: s.captures, timeouts: s.timeouts };
    },
    sim, renderer: R,
    ready: true,
  };

  const DT = 1000 / 60;
  let acc = 0, last = performance.now(), fpsT = last, fpsN = 0;
  function frame(now) {
    G.input.poll();
    if (!paused) {
      acc += Math.min(100, now - last);
      let k = 0;
      while (acc >= DT && k < 4) { sim.step(); acc -= DT; k++; }
      if (k === 4) acc = 0;
    }
    last = now;
    const a = performance.now();
    R.render();
    R.ms = R.ms ? R.ms * 0.9 + (performance.now() - a) * 0.1 : performance.now() - a;
    fpsN++;
    if (now - fpsT > 500) { R.fps = (fpsN * 1000) / (now - fpsT); fpsN = 0; fpsT = now; }
    requestAnimationFrame(frame);
  }
  R.render();
  document.body.classList.add('ready');
  requestAnimationFrame(frame);
})().catch((e) => {
  console.error(e);
  const d = document.getElementById('dbg');
  if (d) { d.hidden = false; d.textContent = String(e && e.stack || e); }
});
