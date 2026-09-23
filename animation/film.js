'use strict';
// 片子的时间线：scenes/*.js 各自 scene({...}) 登记，这里按 order 排好交给引擎，并在每帧最后画外圈画框。
// ?scene=sanyan 或 ?scene=sukima,alchemy 只放这几段（开发用），?noframe 不画画框，?booth 全屏自动循环（展位用）。
const Q = new URLSearchParams(location.search), BOOTH = Q.has('booth'), FRAME = !Q.has('noframe');
const ONLY = Q.get('scene'), TIMELINE = SCENES.slice().sort((a, b) => a.order - b.order).filter(s => !ONLY || ONLY.split(',').includes(s.key))
  .map(s => ({ ...s, fn: (c, tau, i) => { c.save(); s.fn(c, tau, i); c.restore(); if (FRAME && s.frame !== false) frameBorder(c, tau); } }));
defineFilm({ palette: makePalette({ paper: K.paper, ink: K.ink }), timeline: TIMELINE, format: { ar: '16:9', width: BOOTH ? 3840 : 1920 }, fps: 24 });
if (BOOTH) {
  document.body.classList.add('booth'); document.querySelectorAll('.bar').forEach(b => b.hidden = true);
  const go = () => { if (!window.__ready) return setTimeout(go, 50); playing = true; start = performance.now(); loop(); };
  go(); document.addEventListener('click', () => document.documentElement.requestFullscreen?.().catch(() => {}));
}
