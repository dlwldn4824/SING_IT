import { tap, getPointer } from "./input.js";

const BAR_X = 96;
const BAR_Y = 96;
const BAR_W = 128;
const MIN = 0;
const MAX = 8;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function inRect(pointer, x, y, w, h) {
  return pointer.x >= x && pointer.x < x + w && pointer.y >= y && pointer.y < y + h;
}

export function startMicGame() {
  return {
    position: 1,
    safePosition: 6,
    mistakes: 0,
    flash: 0,
    bounce: 0,
    finished: false,
    result: null,
  };
}

function moveMic(game, amount, audio) {
  const next = clamp(game.position + amount, MIN, MAX);
  if (next === game.position) return;
  game.position = next;
  audio.blip("pickup");
}

function placeMic(game, audio) {
  if (game.position !== game.safePosition) {
    game.mistakes += 1;
    game.flash = 0.2;
    audio.blip("danger");
    return;
  }
  game.finished = true;
  game.result = { perfect: game.mistakes === 0, ok: true };
  audio.blip("fix");
  audio.punch();
}

export function updateMicGame(game, audio, dt) {
  if (!game || game.finished) return game;
  game.bounce += dt * 8;
  game.flash = Math.max(0, game.flash - dt);
  if (tap("p1l") || tap("p2l")) moveMic(game, -1, audio);
  if (tap("p1r") || tap("p2r")) moveMic(game, 1, audio);

  const pointer = getPointer();
  if (pointer.clicked) {
    if (inRect(pointer, BAR_X - 8, BAR_Y - 10, BAR_W + 16, 20)) {
      game.position = Math.round(clamp((pointer.x - BAR_X) / BAR_W, 0, 1) * MAX);
      audio.blip("pickup");
    } else if (inRect(pointer, 145, 132, 30, 12)) {
      placeMic(game, audio);
    }
  }
  if (tap("p1use") || tap("p2use")) placeMic(game, audio);
  return game;
}

export function drawMicGame(ctx, game, fill, blitStr) {
  if (!game) return;
  fill(ctx, "BG_SHADOW", 72, 48, 176, 108);
  fill(ctx, "BG_NIGHT", 76, 52, 168, 100);
  if (game.flash > 0) {
    fill(ctx, "DANGER_RED", 72, 48, 176, 2);
    fill(ctx, "DANGER_RED", 72, 154, 176, 2);
  }
  fill(ctx, "METAL_DK", BAR_X, BAR_Y, BAR_W, 4);
  fill(ctx, "DANGER_ORANGE", BAR_X, BAR_Y + 1, Math.round(BAR_W * 0.45), 2);
  const safeX = BAR_X + Math.round((game.safePosition / MAX) * BAR_W);
  const micX = BAR_X + Math.round((game.position / MAX) * BAR_W);
  fill(ctx, "SUCCESS_GOLD", safeX - 3, BAR_Y - 6, 6, 16);
  fill(ctx, "MIC_SILVER", micX - 3, BAR_Y - (Math.floor(game.bounce) % 2), 6, 12);
  fill(ctx, "WHITE", micX - 1, BAR_Y - 3 - (Math.floor(game.bounce) % 2), 2, 4);
  fill(ctx, "METAL_DK", 145, 132, 30, 12);
  fill(ctx, "SUCCESS_GOLD", 147, 134, 26, 8);
  blitStr(ctx, "E", 157, 135, "BG_NIGHT");
}
