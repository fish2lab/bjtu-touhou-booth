// 性能测试：用本机真 GPU（Metal）以 3840×2160 打开游戏，在境界卡最密的一段测两件事：
//  A. 逐帧推进并渲染，每帧 gl.finish() 等 GPU 画完，只统计同屏 ≥1500 发的帧；
//  B. 不暂停实时运行 6 秒，用 requestAnimationFrame 的间隔算真实帧率（含整页 4K 合成）。
// 用法：node scripts/game-perf.mjs [帧数=420]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const N = Number(process.argv[2] || 300);
const base = pathToFileURL(path.resolve('game/index.html')).href;
const url = base + '?card=4&t=16.5&pause=1';
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 60000 });
await page.waitForTimeout(1000);
const r = await page.evaluate((N) => {
  const g = window.__game, R = g.renderer, gl = R.app.renderer.gl;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown';
  const t = [], sim = [], bullets = [];
  for (let i = 0; i < N; i++) {
    const a = performance.now();
    g.sim.step();
    const b = performance.now();
    R.render();
    gl.finish();
    const c = performance.now();
    if (g.bullets >= 1500) { sim.push(b - a); t.push(c - a); bullets.push(g.bullets); }
  }
  const q = (arr, p) => { const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
  return {
    gpu, canvas: [R.app.canvas.width, R.app.canvas.height], frames: t.length,
    bulletsMin: Math.min(...bullets), bulletsMax: Math.max(...bullets),
    frameMsP50: +q(t, 0.5).toFixed(2), frameMsP95: +q(t, 0.95).toFixed(2), frameMsMax: +Math.max(...t).toFixed(2),
    simMsP50: +q(sim, 0.5).toFixed(3), simMsP95: +q(sim, 0.95).toFixed(3),
    atlas: R.atlasInfo, buildMs: R.buildMs,
  };
}, N);
// B. 实时运行
const page2 = await browser.newPage({ viewport: { width: 3840, height: 2160 }, deviceScaleFactor: 1 });
await page2.goto(base + '?card=4&t=16.5', { waitUntil: 'load' });
await page2.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 60000 });
const live = await page2.evaluate(() => new Promise((res) => {
  const iv = [], bl = [];
  let last = performance.now();
  const t0 = last;
  function f(now) {
    iv.push(now - last); last = now; bl.push(window.__game.bullets);
    if (now - t0 < 6000) requestAnimationFrame(f);
    else {
      const s = iv.slice(5).sort((a, b) => a - b);
      res({ frames: s.length, fps: +(1000 * s.length / s.reduce((a, b) => a + b, 0)).toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), max: +s[s.length - 1].toFixed(1), bulletsMax: Math.max(...bl), over20ms: s.filter((x) => x > 20).length });
    }
  }
  requestAnimationFrame(f);
}));
r.live = live;
await browser.close();
console.log(JSON.stringify(r, null, 2));
console.log(`\n${r.gpu}\nA. ${r.frames} 帧里同屏 ${r.bulletsMin}–${r.bulletsMax} 发的帧：每帧（模拟+渲染+等 GPU）p50 ${r.frameMsP50} ms，p95 ${r.frameMsP95} ms，最慢 ${r.frameMsMax} ms；模拟一步 p50 ${r.simMsP50} ms` +
  `\nB. 实时 6 秒：${r.live.fps} fps（${r.live.frames} 帧，p95 间隔 ${r.live.p95} ms，最长 ${r.live.max} ms，超过 20ms 的帧 ${r.live.over20ms}），期间最大同屏 ${r.live.bulletsMax} 发`);
if (errors.length) { console.log(errors.join('\n')); process.exitCode = 1; }
