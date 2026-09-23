'use strict';
// 第 1 发车（8 秒）：占位，见 docs/动画施工.md
scene({ order: 1, key: 'depart', name: '1 发车', dur: 8, fn: (c, tau) => stubCard(c, tau, '1 发车') });
