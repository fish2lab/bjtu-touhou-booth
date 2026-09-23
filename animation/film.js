'use strict';
// 片子的时间线：scenes/*.js 各自 scene({...}) 登记，这里按 order 排好交给引擎。
// ?scene=hearts 或 ?scene=vol1,vol2 只放这几镜（开发用），?booth 全屏自动循环（展位用）。
const Q = new URLSearchParams(location.search), BOOTH = Q.has('booth');
const ONLY = Q.get('scene'), TIMELINE = SCENES.slice().sort((a, b) => a.order - b.order).filter(s => !ONLY || ONLY.split(',').includes(s.key));
defineFilm({ palette: pastel('sky'), timeline: TIMELINE, format: { ar: '16:9', width: BOOTH ? 3840 : 1920 }, fps: 24 });
if (BOOTH) {
  document.body.classList.add('booth'); document.querySelectorAll('.bar').forEach(b => b.hidden = true);
  const go = () => { if (!window.__ready) return setTimeout(go, 50); playing = true; start = performance.now(); loop(); };
  go(); document.addEventListener('click', () => document.documentElement.requestFullscreen?.().catch(() => {}));
}
