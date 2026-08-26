import { tap } from "./input.js";

const SAFE_MIN = 44;
const SAFE_MAX = 56;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function startAmpGame() {
  return {
    heat: 82,
    expected: "left",
    safeHits: 0,
    mistakes: 0,
    flash: 0,
    pulse: 0,
    finished: false,
    result: null,
    time: 6,
    maxTime: 6,
  };
}

export function updateAmpGame(game, audio, dt) {
  if (!game || game.finished) return game;
  game.time = Math.max(0, game.time - dt);
  game.flash = Math.max(0, game.flash - dt);
  game.pulse += dt * 10;
  game.heat = clamp(game.heat + dt * 4, 0, 100);

  if (game.time <= 0) {
    game.finished = true;
    game.result = { perfect: false, ok: false, timedOut: true };
    audio.blip("danger");
    return game;
  }

  const left = tap("p1l") || tap("p2l");
  const right = tap("p1r") || tap("p2r");
  if (!left && !right) return game;

  const pressed = left && !right ? "left" : right && !left ? "right" : "both";
  if (pressed !== game.expected) {
    game.mistakes += 1;
    game.safeHits = 0;
    game.heat = clamp(game.heat + 7, 0, 100);
    game.flash = 0.18;
    audio.blip("danger");
    return game;
  }

  game.expected = game.expected === "left" ? "right" : "left";
  game.heat = Math.max(SAFE_MIN, game.heat - 4.5);
  game.safeHits = game.heat >= SAFE_MIN && game.heat <= SAFE_MAX ? game.safeHits + 1 : 0;
  audio.blip("pickup");

  if (game.safeHits >= 4) {
    game.finished = true;
    game.result = { perfect: game.mistakes === 0, ok: true };
    audio.blip("fix");
    audio.punch();
  }
  return game;
}

export function drawAmpGame(ctx, game, fill, blitStr) {
  if (!game) return;
  fill(ctx, "BG_SHADOW", 60, 38, 200, 118);
  fill(ctx, "BG_NIGHT", 64, 42, 192, 110);
  if (game.flash > 0) {
    fill(ctx, "DANGER_RED", 60, 38, 200, 2);
    fill(ctx, "DANGER_RED", 60, 154, 200, 2);
  }

  blitStr(ctx, "AMP HEAT", 132, 52, "DANGER_ORANGE");
  const barX = 88;
  const barY = 82;
  const barW = 144;
  fill(ctx, "METAL_DK", barX, barY, barW, 12);
  fill(ctx, "DANGER_RED", barX + 2, barY + 2, barW - 4, 8);
  const safeX = barX + Math.round((SAFE_MIN / 100) * barW);
  const safeW = Math.round(((SAFE_MAX - SAFE_MIN) / 100) * barW);
  fill(ctx, "SUCCESS_GOLD", safeX, barY + 1, safeW, 10);
  const markerX = barX + Math.round((game.heat / 100) * (barW - 4));
  fill(ctx, "WHITE", markerX, barY - 4, 4, 20);
  fill(ctx, "BG_NIGHT", markerX + 1, barY - 2, 2, 16);

  const pulse = Math.floor(game.pulse) % 2;
  const leftKey = game.expected === "left" ? "SUCCESS_GOLD" : "METAL";
  const rightKey = game.expected === "right" ? "SUCCESS_GOLD" : "METAL";
  fill(ctx, leftKey, 90 - (game.expected === "left" ? pulse : 0), 112, 56, 20);
  fill(ctx, "BG_NIGHT", 93, 115, 50, 14);
  blitStr(ctx, "COOL", 109, 120, leftKey);
  fill(ctx, rightKey, 174 + (game.expected === "right" ? pulse : 0), 112, 56, 20);
  fill(ctx, "BG_NIGHT", 177, 115, 50, 14);
  blitStr(ctx, "POWER", 190, 120, rightKey);
}
