'use strict';
// 第 4 段 雏祭（18 秒）。施工中：先放转转玩偶的预览（五个角度 + 一个在转的），保证全片时长和顺序能跑通。
scene({ order: 4, key: 'hina', name: '雏祭', dur: 18, fn: (c, tau) => { setView(null); paperBg(c);
  [0, .7, 1.57, 2.4, 3.14, 4.71].forEach((a, k) => hinaFumo(c, 200 + k * 300, 520, 300, a));
  hinaFumo(c, CX, 1000, 380, tau * TAU / 2.5); zh(c, FUMO_CREDIT, 60, 1040, { size: 22, color: K.g3 }); } });
