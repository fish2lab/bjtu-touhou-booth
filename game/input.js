/* 东方弹幕 POC · 输入。方向键 / WASD 移动，Shift 低速，Z 射击（玩家模式下自动连射），X 放 Bomb；手柄同理。
 * 任何一次按键或手柄动作都会让 sim 切到玩家模式；sim 自己负责 15 秒无输入交还 AI。 */
(function () {
  'use strict';
  const G = window.BXG;
  const KEYS = {
    ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd',
    KeyA: 'l', KeyD: 'r', KeyW: 'u', KeyS: 'd',
    ShiftLeft: 'f', ShiftRight: 'f', KeyZ: 'z', KeyX: 'x', KeyJ: 'z', KeyK: 'x', Space: 'z',
  };
  const held = { l: 0, r: 0, u: 0, d: 0, f: 0, z: 0, x: 0 };
  let sim = null;
  let pad = { mx: 0, my: 0, f: 0, x: 0, any: false };

  function onDown(e) {
    const k = KEYS[e.code];
    if (!k) return;
    e.preventDefault();
    held[k] = 1;
    if (sim) sim.notifyInput();
  }
  function onUp(e) {
    const k = KEYS[e.code];
    if (!k) return;
    e.preventDefault();
    held[k] = 0;
  }
  function clear() { for (const k in held) held[k] = 0; }

  function pollPad() {
    pad.any = false; pad.mx = 0; pad.my = 0; pad.f = 0; pad.x = 0;
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of list) {
      if (!gp) continue;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      const dz = 0.3;
      let mx = Math.abs(ax) > dz ? ax : 0, my = Math.abs(ay) > dz ? ay : 0;
      const b = gp.buttons;
      const pressed = (i) => !!(b[i] && b[i].pressed);
      if (pressed(14)) mx = -1; if (pressed(15)) mx = 1; if (pressed(12)) my = -1; if (pressed(13)) my = 1;
      const f = pressed(2) || pressed(4) || pressed(5) || pressed(6) || pressed(7);
      const x = pressed(1) || pressed(3);
      const shot = pressed(0);
      if (mx || my || f || x || shot) {
        pad.any = true; pad.mx = mx; pad.my = my; pad.f = f ? 1 : 0; pad.x = x ? 1 : 0;
      }
    }
    return pad.any;
  }

  G.input = {
    init(s) {
      sim = s;
      addEventListener('keydown', onDown, { passive: false });
      addEventListener('keyup', onUp, { passive: false });
      addEventListener('blur', clear);
    },
    // 每个渲染帧调用一次：手柄有动作也算接管
    poll() {
      if (pollPad() && sim) sim.notifyInput();
    },
    read() {
      let mx = held.r - held.l, my = held.d - held.u;
      if (pad.any) { mx = mx || pad.mx; my = my || pad.my; }
      const focus = !!(held.f || pad.f);
      const bomb = !!(held.x || pad.x);
      const active = !!(mx || my || focus || bomb || held.z || pad.any);
      return { mx, my, focus, shot: true, bomb, active };
    },
  };
})();
