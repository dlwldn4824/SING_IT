import { tap, getPointer } from "./input.js";

const ROWS = 3;
const MIN_TENSION = 0;
const MAX_TENSION = 8;
const BAR_X = 112;
const BAR_W = 92;
const ROW_Y = 65;
const ROW_GAP = 22;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rowY(row) {
  return ROW_Y + row * ROW_GAP;
}

function inRect(pointer, x, y, w, h) {
  return pointer.x >= x && pointer.x < x + w && pointer.y >= y && pointer.y < y + h;
}

function randomTarget(exclude) {
  let target = exclude;
  while (target === exclude) target = Math.floor(Math.random() * (MAX_TENSION + 1));
  return target;
}

export function startStringGame() {
  const values = [0, 8, 3];
  const targets = values.map((value) => randomTarget(value));
  return {
    values,
    targets,
    locked: [false, false, false],
    selected: 0,
    mistakes: 0,
    flash: 0,
    shake: 0,
    bounce: 0,
    finished: false,
    result: null,
    time: 5,
    maxTime: 5,
  };
}

function moveSelection(game, direction) {
  game.selected = (game.selected + direction + ROWS) % ROWS;
}

function tune(game, amount, audio) {
  const row = game.selected;
  if (game.locked[row]) return;
  const next = clamp(game.values[row] + amount, MIN_TENSION, MAX_TENSION);
  if (next === game.values[row]) return;
  game.values[row] = next;
  audio.blip("pickup");
}

function lockString(game, audio) {
  const row = game.selected;
  if (game.locked[row]) return;
  if (game.values[row] !== game.targets[row]) {
    game.mistakes += 1;
    game.flash = 0.2;
    game.shake = 0.2;
    audio.blip("danger");
    return;
  }
  game.locked[row] = true;
  audio.blip("fix");
  if (game.locked.every(Boolean)) {
    game.finished = true;
    game.result = { perfect: game.mistakes === 0, ok: true };
    audio.punch();
  } else {
    moveSelection(game, 1);
  }
}

function pointerInput(game, audio) {
  const pointer = getPointer();
  if (!pointer.clicked) return;
  for (let row = 0; row < ROWS; row += 1) {
    const y = rowY(row);
    if (inRect(pointer, BAR_X - 10, y - 6, BAR_W + 20, 12)) {
      game.selected = row;
      const ratio = clamp((pointer.x - BAR_X) / BAR_W, 0, 1);
      game.values[row] = Math.round(ratio * MAX_TENSION);
      audio.blip("pickup");
      return;
    }
  }
  if (inRect(pointer, 145, 140, 30, 12)) lockString(game, audio);
}

export function updateStringGame(game, audio, dt) {
  if (!game || game.finished) return game;
  game.time = Math.max(0, game.time - dt);
  if (game.time <= 0) {
    game.finished = true;
    game.result = { perfect: false, ok: false, timedOut: true };
    audio.blip("danger");
    return game;
  }
  game.bounce += dt * 8;
  game.flash = Math.max(0, game.flash - dt);
  game.shake = Math.max(0, game.shake - dt);

  if (tap("p1u") || tap("p2u")) moveSelection(game, -1);
  if (tap("p1d") || tap("p2d")) moveSelection(game, 1);
  if (tap("p1l") || tap("p2l")) tune(game, -1, audio);
  if (tap("p1r") || tap("p2r")) tune(game, 1, audio);
  pointerInput(game, audio);
  if (tap("p1use") || tap("p2use")) lockString(game, audio);
  return game;
}

function drawPeg(fill, ctx, x, y, key) {
  fill(ctx, "METAL_DK", x, y, 8, 6);
  fill(ctx, key, x + 2, y + 1, 4, 4);
}

export function drawStringGame(ctx, game, fill, blitStr) {
  if (!game) return;
  fill(ctx, "BG_SHADOW", 80, 38, 160, 118);
  fill(ctx, "BG_NIGHT", 84, 42, 152, 110);
  fill(ctx, "METAL_DK", 92, 54, 14, 76);
  fill(ctx, "METAL", 96, 58, 6, 68);
  if (game.flash > 0) {
    fill(ctx, "DANGER_RED", 80, 38, 160, 2);
    fill(ctx, "DANGER_RED", 80, 154, 160, 2);
  }

  for (let row = 0; row < ROWS; row += 1) {
    const y = rowY(row);
    const selected = game.selected === row && !game.locked[row];
    const up = selected && Math.floor(game.bounce) % 2 ? 1 : 0;
    const targetX = BAR_X + Math.round((game.targets[row] / MAX_TENSION) * BAR_W);
    const valueX = BAR_X + Math.round((game.values[row] / MAX_TENSION) * BAR_W);
    const key = game.locked[row] ? "SUCCESS_GOLD" : selected ? "WHITE" : "METAL";
    const shake = selected && game.shake > 0 ? (Math.floor(game.shake * 60) % 2 ? -1 : 1) : 0;
    fill(ctx, "METAL_DK", BAR_X, y - up, BAR_W, 4);
    fill(ctx, "METAL", BAR_X + 1, y + 1 - up, BAR_W - 2, 1);
    fill(ctx, "SUCCESS_GOLD", targetX - 3, y - 4 - up, 6, 12);
    fill(ctx, key, valueX - 2 + shake, y - 6 - up, 4, 16);
    fill(ctx, "BG_NIGHT", valueX - 1 + shake, y - 3 - up, 2, 10);
    drawPeg(fill, ctx, 96, y - 2 - up, key);
  }

  fill(ctx, "METAL_DK", 145, 140, 30, 12);
  fill(ctx, "SUCCESS_GOLD", 147, 142, 26, 8);
  blitStr(ctx, "E", 157, 143, "BG_NIGHT");
}
