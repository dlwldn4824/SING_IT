import { getPointer } from "./input.js";

const PATCH_X = 92;
const PATCH_Y = 48;
const COLS = 9;
const ROWS = 5;
const CELL_W = 15;
const CELL_H = 15;

export function startWaterGame() {
  const wet = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if ((row + col) % 4 !== 0 || (row === 2 && col === 4)) wet.push({ row, col, clean: false });
    }
  }
  return {
    wet,
    cleaned: 0,
    lastX: null,
    lastY: null,
    finished: false,
    result: null,
    time: 10,
    maxTime: 10,
  };
}

function scrubAt(game, x, y) {
  let changed = false;
  for (const cell of game.wet) {
    if (cell.clean) continue;
    const cx = PATCH_X + cell.col * CELL_W + CELL_W / 2;
    const cy = PATCH_Y + cell.row * CELL_H + CELL_H / 2;
    if (Math.hypot(x - cx, y - cy) <= 11) {
      cell.clean = true;
      game.cleaned += 1;
      changed = true;
    }
  }
  return changed;
}

export function updateWaterGame(game, audio, dt) {
  if (!game || game.finished) return game;
  game.time = Math.max(0, game.time - dt);
  if (game.time <= 0) {
    game.finished = true;
    game.result = { perfect: false, ok: false, timedOut: true };
    audio.blip("danger");
    return game;
  }

  const pointer = getPointer();
  if (!pointer.down) {
    game.lastX = null;
    game.lastY = null;
    return game;
  }

  const fromX = game.lastX ?? pointer.x;
  const fromY = game.lastY ?? pointer.y;
  const distance = Math.hypot(pointer.x - fromX, pointer.y - fromY);
  const steps = Math.max(1, Math.ceil(distance / 4));
  let changed = false;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    changed = scrubAt(game, fromX + (pointer.x - fromX) * t, fromY + (pointer.y - fromY) * t) || changed;
  }
  game.lastX = pointer.x;
  game.lastY = pointer.y;
  if (changed) audio.blip("pickup");

  if (game.cleaned >= game.wet.length) {
    game.finished = true;
    game.result = { perfect: game.time >= 4, ok: true };
    audio.blip("fix");
    audio.punch();
  }
  return game;
}

export function drawWaterGame(ctx, game, fill, blitStr) {
  if (!game) return;
  fill(ctx, "BG_SHADOW", 70, 30, 180, 126);
  fill(ctx, "BG_NIGHT", 74, 34, 172, 118);
  blitStr(ctx, "MOP THE WATER", 119, 38, "WHITE");
  fill(ctx, "STAGE_WOOD_DK", PATCH_X - 4, PATCH_Y - 4, COLS * CELL_W + 8, ROWS * CELL_H + 8);
  for (const cell of game.wet) {
    if (cell.clean) continue;
    const x = PATCH_X + cell.col * CELL_W;
    const y = PATCH_Y + cell.row * CELL_H;
    fill(ctx, "PEDAL_BLUE", x + 2, y + 3, 11, 8);
    fill(ctx, "WHITE", x + 4, y + 4, 4, 1);
  }
  const pointer = getPointer();
  fill(ctx, "MIC_SILVER", pointer.x - 5, pointer.y - 2, 10, 4);
  fill(ctx, "WHITE", pointer.x - 3, pointer.y - 1, 6, 1);
}
