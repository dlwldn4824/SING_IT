import { tap, held, getPointer } from "./input.js";

const COLORS = ["DANGER_RED", "PEDAL_BLUE", "SHIRT_P2", "TENSION_PINK"];
const LEFT_X = 84;
const RIGHT_X = 226;
const JACK_Y0 = 44;
const JACK_GAP = 26;
const JACK = 10;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function jackPos(side, i) {
  return {
    x: side === "L" ? LEFT_X : RIGHT_X,
    y: JACK_Y0 + i * JACK_GAP,
    w: JACK,
    h: JACK,
  };
}

function jackCenter(side, i) {
  const p = jackPos(side, i);
  return { x: p.x + 5, y: p.y + 5 };
}

function hitJack(game, x, y) {
  for (const j of game.left.concat(game.right)) {
    if (j.done) continue;
    const p = jackPos(j.side, j.i);
    if (x >= p.x - 3 && x < p.x + p.w + 3 && y >= p.y - 3 && y < p.y + p.h + 3) return j;
  }
  return null;
}

function nextOpen(list, from, dir) {
  const n = list.length;
  for (let k = 1; k <= n; k += 1) {
    const i = (from + dir * k + n * 4) % n;
    if (!list[i].done) return i;
  }
  return from;
}

export function startWireGame() {
  let order = shuffle([0, 1, 2, 3]);
  if (order.every((v, i) => v === i)) order = [2, 0, 3, 1];
  return {
    left: COLORS.map((color, i) => ({ side: "L", i, color, done: false })),
    right: order.map((colorIndex, i) => ({
      side: "R",
      i,
      color: COLORS[colorIndex],
      done: false,
    })),
    links: [],
    drag: null,
    selL: 0,
    selR: 0,
    mistakes: 0,
    flash: 0,
    bounce: 0,
    finished: false,
    result: null,
    time: 15,
    maxTime: 15,
  };
}

function tryConnect(game, a, b, audio) {
  if (!a || !b || a.side === b.side || a.done || b.done) return false;
  const L = a.side === "L" ? a : b;
  const R = a.side === "R" ? a : b;
  if (L.color !== R.color) {
    game.mistakes += 1;
    game.flash = 0.22;
    audio.blip("danger");
    return false;
  }
  L.done = true;
  R.done = true;
  game.links.push({ li: L.i, ri: R.i, color: L.color });
  audio.blip("fix");
  if (game.links.length >= 4) {
    game.finished = true;
    game.result = { perfect: game.mistakes === 0, ok: true };
    audio.punch();
  }
  return true;
}

export function updateWireGame(game, audio, dt) {
  if (!game || game.finished) return game;
  game.time = Math.max(0, game.time - dt);
  if (game.time <= 0) {
    game.finished = true;
    game.result = { perfect: false, ok: false, timedOut: true };
    audio.blip("danger");
    return game;
  }
  game.bounce += dt * 8;
  if (game.flash > 0) game.flash = Math.max(0, game.flash - dt);

  if (!game.left[game.selL].done && tap("p1u")) game.selL = nextOpen(game.left, game.selL, -1);
  if (!game.left[game.selL].done && tap("p1d")) game.selL = nextOpen(game.left, game.selL, 1);
  if (game.left[game.selL].done) game.selL = nextOpen(game.left, game.selL, 1);
  if (!game.right[game.selR].done && tap("p1l")) game.selR = nextOpen(game.right, game.selR, -1);
  if (!game.right[game.selR].done && tap("p1r")) game.selR = nextOpen(game.right, game.selR, 1);
  if (game.right[game.selR].done) game.selR = nextOpen(game.right, game.selR, 1);
  if (tap("p2u")) game.selL = nextOpen(game.left, game.selL, -1);
  if (tap("p2d")) game.selL = nextOpen(game.left, game.selL, 1);
  if (tap("p2l")) game.selR = nextOpen(game.right, game.selR, -1);
  if (tap("p2r")) game.selR = nextOpen(game.right, game.selR, 1);

  const ptr = getPointer();

  if (ptr.clicked) {
    const hit = hitJack(game, ptr.x, ptr.y);
    if (hit) {
      game.drag = { from: hit, x: ptr.x, y: ptr.y };
      if (hit.side === "L") game.selL = hit.i;
      else game.selR = hit.i;
    }
  }

  if (game.drag) {
    game.drag.x = ptr.x;
    game.drag.y = ptr.y;
  }

  if (ptr.released && game.drag) {
    const hit = hitJack(game, ptr.x, ptr.y);
    tryConnect(game, game.drag.from, hit, audio);
    game.drag = null;
  }

  if (tap("p1use") || tap("p2use")) {
    if (!game.drag) {
      const from = game.left[game.selL];
      if (from && !from.done) {
        const c = jackCenter("L", game.selL);
        game.drag = { from, x: c.x, y: c.y, keys: true };
      }
    } else if (game.drag.keys) {
      tryConnect(game, game.drag.from, game.right[game.selR], audio);
      game.drag = null;
    }
  }

  if (game.drag?.keys) {
    const c = jackCenter("R", game.selR);
    game.drag.x = c.x;
    game.drag.y = c.y;
  }

  if (game.drag && !ptr.down && !game.drag.keys && !held("p1use") && !held("p2use")) {
    game.drag = null;
  }

  return game;
}

function plot(fill, ctx, key, x, y) {
  fill(ctx, key, x, y, 2, 2);
}

function line(fill, ctx, key, x0, y0, x1, y1) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const x1i = Math.round(x1);
  const y1i = Math.round(y1);
  const dx = Math.abs(x1i - x);
  const sx = x < x1i ? 1 : -1;
  const dy = -Math.abs(y1i - y);
  const sy = y < y1i ? 1 : -1;
  let err = dx + dy;
  while (true) {
    plot(fill, ctx, key, x, y);
    if (x === x1i && y === y1i) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function drawWire(fill, ctx, x0, y0, x1, y1, key) {
  const mx = Math.round((x0 + x1) / 2);
  const sag = Math.round((y0 + y1) / 2) + 6;
  line(fill, ctx, key, x0, y0, x0 + 10, y0);
  line(fill, ctx, key, x0 + 10, y0, mx, sag);
  line(fill, ctx, key, mx, sag, x1 - 10, y1);
  line(fill, ctx, key, x1 - 10, y1, x1, y1);
}

function drawJack(fill, ctx, j, selected, bounce) {
  const p = jackPos(j.side, j.i);
  const up = selected && !j.done && Math.floor(bounce) % 2 === 1 ? 1 : 0;
  const x = p.x;
  const y = p.y - up;
  fill(ctx, "METAL", x, y, p.w, p.h);
  fill(ctx, "METAL_DK", x + 1, y + 1, p.w - 2, p.h - 2);
  fill(ctx, j.color, x + 2, y + 2, 6, 6);
  if (j.done) fill(ctx, "WHITE", x + 4, y + 4, 2, 2);
}

export function drawWireGame(ctx, game, fill, blitStr) {
  if (!game) return;
  fill(ctx, "BG_SHADOW", 68, 24, 184, 132);
  fill(ctx, "BG_NIGHT", 72, 28, 176, 124);
  fill(ctx, "METAL_DK", 72, 28, 28, 124);
  fill(ctx, "METAL_DK", 220, 28, 28, 124);
  if (game.flash > 0) {
    fill(ctx, "DANGER_RED", 68, 24, 184, 2);
    fill(ctx, "DANGER_RED", 68, 154, 184, 2);
  }

  for (const link of game.links) {
    const a = jackCenter("L", link.li);
    const b = jackCenter("R", link.ri);
    drawWire(fill, ctx, a.x, a.y, b.x, b.y, link.color);
  }

  if (game.drag) {
    const a = jackCenter(game.drag.from.side, game.drag.from.i);
    drawWire(fill, ctx, a.x, a.y, game.drag.x, game.drag.y, game.drag.from.color);
  }

  for (const j of game.left) drawJack(fill, ctx, j, game.selL === j.i, game.bounce);
  for (const j of game.right) drawJack(fill, ctx, j, game.selR === j.i, game.bounce);

  blitStr(ctx, "E", 156, 140, "SUCCESS_GOLD");
}
