// 把整部片渲染成 MP4：Playwright 以 file:// 打开 index.html?bare&w=宽度，按帧调用 __drawFrame 取 JPEG，
// 分 N 段并行（每段一个页面、一个 ffmpeg），最后用 concat 无损拼接。
//   node animation/tools/render.mjs                     → out/booth-4k.mp4（3840×2160，24fps）
//   node animation/tools/render.mjs --w 1920 --out out/preview.mp4 --jobs 4 --q scene=sanyan
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const argv = process.argv.slice(2);
const flag = (n, d) => { const k = argv.indexOf(n); return k >= 0 ? argv[k + 1] : d; };
const w = +flag('--w', 3840), jobs = +flag('--jobs', 4), extra = flag('--q', ''), out = path.resolve(flag('--out', w >= 3840 ? 'out/booth-4k.mp4' : `out/booth-${w}.mp4`));
const crf = flag('--crf', '16'), tmp = path.resolve('out/render-tmp'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
const url = pathToFileURL(path.resolve('animation/index.html')).href + `?bare&w=${w}` + (extra ? '&' + extra : '');

const browser = await chromium.launch();
const open = async () => { const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url); await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__error); if (err) throw new Error(err); return { page, errors }; };
const first = await open(); const N = await first.page.evaluate(() => window.__NDRAW), fps = await first.page.evaluate(() => window.__fps);
console.log(`${N} frames @${fps}fps = ${(N / fps).toFixed(1)}s, width ${w}, ${jobs} jobs`);
const t0 = Date.now(); let done = 0;
const chunk = Math.ceil(N / jobs), parts = [];
await Promise.all(Array.from({ length: jobs }, async (_, j) => {
  const a = j * chunk, b = Math.min(N, a + chunk); if (a >= b) return; const file = path.join(tmp, `part${j}.mp4`); parts[j] = file;
  const { page, errors } = j === 0 ? first : await open();
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-profile:v', 'high', '-level:v', '5.1', '-r', String(fps), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const closed = new Promise((res, rej) => ff.on('close', code => code ? rej(new Error('ffmpeg exit ' + code)) : res()));
  for (let i = a; i < b; i++) {
    const data = await page.evaluate(i => { window.__drawFrame(i); return cv.toDataURL('image/jpeg', .95); }, i);
    if (!ff.stdin.write(Buffer.from(data.slice(data.indexOf(',') + 1), 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (++done % 48 === 0) { const s = (Date.now() - t0) / 1000; console.log(`${done}/${N}  ${s.toFixed(0)}s  eta ${(s / done * (N - done)).toFixed(0)}s`); }
  }
  ff.stdin.end(); await closed; if (errors.length) throw new Error([...new Set(errors)].slice(0, 5).join('\n'));
}));
await browser.close();
const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, parts.filter(Boolean).map(f => `file '${f}'`).join('\n'));
fs.mkdirSync(path.dirname(out), { recursive: true });
await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', c => c ? rej(new Error('concat failed')) : res()));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${out}  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB  in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
