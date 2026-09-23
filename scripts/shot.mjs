// 4K 截图验收：用 file:// 打开页面（与展位现场同一种打开方式），按查询参数定位时间点后截图。
// 用法：node scripts/shot.mjs <相对路径.html> <查询串> <输出.png> [等待毫秒] [宽x高]
// 例：  node scripts/shot.mjs carousel/index.html "scene=2&t=4&pause=1" out/c-2.png 1500
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const [rel, query = '', out = 'out/shot.png', wait = '1200', size = '3840x2160'] = process.argv.slice(2);
if (!rel) {
  console.error('usage: node scripts/shot.mjs <page.html> <query> <out.png> [waitMs] [WxH]');
  process.exit(2);
}
const [width, height] = size.split('x').map(Number);
const url = pathToFileURL(path.resolve(rel)).href + (query ? `?${query}` : '');
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out });
await browser.close();
console.log(`${out}  ${width}x${height}  ${url}`);
if (errors.length) {
  console.log(errors.join('\n'));
  process.exitCode = 1;
}
