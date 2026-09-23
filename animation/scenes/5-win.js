'use strict';
// 第 5 段 会赢的（10 秒）。施工中：先放段名卡，保证全片时长和顺序能跑通。
scene({ order: 5, key: 'win', name: '会赢的', dur: 10, fn: (c, tau) => stubCard(c, tau, '会赢的') });
