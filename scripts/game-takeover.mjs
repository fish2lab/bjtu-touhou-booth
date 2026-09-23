// 接管测试：自动模式下按 ArrowLeft、Z，mode 应变成 'player'，自机应向左移动；
// 之后不再输入，用 __game.step() 推进超过 15 秒，mode 应回到 'auto'。
// 用法：node scripts/game-takeover.mjs
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const url = pathToFileURL(path.resolve('game/index.html')).href + '?pause=1';
const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 60000 });

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ${detail}`); };

await page.evaluate(() => window.__game.step(200));
const m0 = await page.evaluate(() => window.__game.mode);
check('初始为自动模式', m0 === 'auto', `mode=${m0}`);

const x0 = await page.evaluate(() => window.__game.sim.player.x);
await page.keyboard.down('ArrowLeft');
const m1 = await page.evaluate(() => window.__game.mode);
await page.evaluate(() => window.__game.step(30));   // 按住左键推进 0.5 秒
await page.keyboard.up('ArrowLeft');
const x1 = await page.evaluate(() => window.__game.sim.player.x);
check('按 ArrowLeft 后切到玩家模式', m1 === 'player', `mode=${m1}`);
check('按住左键时自机向左移动', x1 < x0 - 100, `x ${x0.toFixed(0)} -> ${x1.toFixed(0)}`);

await page.keyboard.press('KeyZ');
const m2 = await page.evaluate(() => window.__game.mode);
check('按 Z 后仍是玩家模式', m2 === 'player', `mode=${m2}`);

const m3 = await page.evaluate(() => { window.__game.step(14 * 60); return window.__game.mode; });
check('无输入 14 秒时仍是玩家模式', m3 === 'player', `mode=${m3}`);
const m4 = await page.evaluate(() => { window.__game.step(2 * 60); return window.__game.mode; });
check('无输入超过 15 秒后交还 AI', m4 === 'auto', `mode=${m4}`);

await page.keyboard.press('KeyZ');
const m5 = await page.evaluate(() => window.__game.mode);
check('交还后再按 Z 又能接管', m5 === 'player', `mode=${m5}`);

await browser.close();
if (errors.length) console.log('page errors:', [...new Set(errors)].join('\n'));
const ok = results.every((r) => r.ok) && !errors.length;
console.log(ok ? `\n全部通过（${results.length} 项）` : '\n有失败项');
process.exitCode = ok ? 0 : 1;
