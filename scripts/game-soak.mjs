// 无人值守测试：打开游戏页（暂停实时循环），用 __game.step() 无渲染推进 N 分钟游戏时间，
// 输出死亡次数、被弹/Bomb 次数、最大同屏弹数、每张符卡是否出现过。
// 用法：node scripts/game-soak.mjs [分钟=10] [种子=20260923]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const minutes = Number(process.argv[2] || 10);
const seed = process.argv[3] || '20260923';
const frames = Math.round(minutes * 60 * 60);
const url = pathToFileURL(path.resolve('game/index.html')).href + `?pause=1&seed=${seed}`;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__game && window.__game.ready, null, { timeout: 60000 });

const t0 = Date.now();
const chunk = 1800;
let s;
const deathsAt = [];
let lastDeaths = 0;
for (let f = 0; f < frames; f += chunk) {
  s = await page.evaluate((n) => window.__game.step(n), Math.min(chunk, frames - f));
  if (s.deaths > lastDeaths) {
    const info = await page.evaluate(() => window.__game.stats.deathsByCard.slice());
    deathsAt.push({ frame: s.frame, deaths: s.deaths, byCard: info });
    lastDeaths = s.deaths;
  }
}
const stats = await page.evaluate(() => {
  const g = window.__game, st = g.stats;
  return {
    cards: g.sim.cards.map((c, i) => {
      const d = st.durations.filter((x) => x[0] === i).map((x) => x[1] / 60);
      return { n: i + 1, name: c.name, seen: st.cardsSeen[i], deaths: st.deathsByCard[i], bombs: st.bombsByCard[i], captures: st.capturesByCard[i],
        maxBullets: st.maxBulletsByCard[i], secMin: d.length ? +Math.min(...d).toFixed(1) : null, secMax: d.length ? +Math.max(...d).toFixed(1) : null };
    }),
    loops: st.loops, continues: st.continues,
  };
});
const wall = (Date.now() - t0) / 1000;
await browser.close();

const out = {
  minutes, seed, frames: s.frame, wallSeconds: +wall.toFixed(1),
  deaths: s.deaths, hits: s.hits, bombs: s.bombs, deathbombs: s.deathbombs,
  maxBullets: s.maxBullets, captures: s.captures, timeouts: s.timeouts,
  allCardsSeen: stats.cards.every((c) => c.seen > 0),
  cards: stats.cards, deathTimeline: deathsAt, errors: [...new Set(errors)].slice(0, 5),
};
console.log(JSON.stringify(out, null, 2));
console.log(`\n${minutes} 分钟（${s.frame} 帧，墙钟 ${wall.toFixed(1)}s）：死亡 ${s.deaths}，被弹 ${s.hits}（决死 Bomb ${s.deathbombs}），Bomb ${s.bombs}，最大同屏 ${s.maxBullets} 发，` +
  `收取 ${s.captures} / 超时 ${s.timeouts}，符卡覆盖 ${stats.cards.map((c) => c.n + ':' + c.seen).join(' ')}\n` +
  stats.cards.map((c) => `  ${c.n} ${c.name}  出现 ${c.seen} 次  每张 ${c.secMin}–${c.secMax}s  最大弹数 ${c.maxBullets}  死亡 ${c.deaths}  Bomb ${c.bombs}`).join('\n'));
if (errors.length) process.exitCode = 1;
