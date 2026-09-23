// 抽帧检查：以 file:// 打开短片，按帧号出整帧 PNG，或出联系表 / 连续帧条。
//   node animation/tools/frames.mjs --grid 24                 全片均匀 24 帧的联系表
//   node animation/tools/frames.mjs --strip 120,12            从第 120 帧起连续 12 帧
//   node animation/tools/frames.mjs --frames 60,200 --w 3840  指定帧的 4K 整帧
//   可加 --film index.html（默认）、--q "scene=red"（附加查询串）、--out out/anim、--cell 320
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d) => { const k = argv.indexOf(n); return k >= 0 ? argv[k + 1] : d; };
const film = flag('--film', 'animation/index.html'), w = +flag('--w', 1920), out = flag('--out', 'out/anim'), cell = +flag('--cell', 320), extra = flag('--q', '');
fs.mkdirSync(out, { recursive: true });
const url = pathToFileURL(path.resolve(film)).href + `?bare&w=${w}` + (extra ? '&' + extra : '');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
const info = await page.evaluate(() => ({ n: window.__NDRAW, fps: window.__fps, size: window.__size, err: window.__error }));
if (info.err) errors.push(info.err);
console.log(`frames ${info.n} @${info.fps}fps = ${(info.n / info.fps).toFixed(1)}s, ${info.size.w}x${info.size.h}`);
const save = (file, dataUrl) => { fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64')); console.log(file); };
const tag = path.basename(film, '.html') + (extra ? '-' + extra.replace(/[^a-z0-9]+/gi, '_') : '');

if (argv.includes('--grid')) {
  const n = +flag('--grid', 24);
  save(path.join(out, `${tag}-grid${n}.jpg`), await page.evaluate(([n, cell]) => window.__grid(n, cell), [n, cell]));
}
if (argv.includes('--strip')) {
  const [s, cnt] = flag('--strip', '0,12').split(',').map(Number);
  save(path.join(out, `${tag}-strip${s}.jpg`), await page.evaluate(([s, cnt, cell]) => window.__strip(s, cnt, cell), [s, cnt, cell]));
}
if (argv.includes('--frames')) {
  for (const i of flag('--frames', '0').split(',').map(Number)) {
    const t0 = Date.now();
    const data = await page.evaluate((i) => { window.__drawFrame(i); return cv.toDataURL('image/png'); }, i);
    save(path.join(out, `${tag}-f${String(i).padStart(4, '0')}-${w}.png`), data);
    console.log(`  frame ${i} drawn+encoded in ${Date.now() - t0} ms`);
  }
}
await browser.close();
if (errors.length) { console.log([...new Set(errors)].slice(0, 10).join('\n')); process.exitCode = 1; }
