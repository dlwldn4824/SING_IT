import { PALETTE } from "./palette.js";
import { tap } from "./input.js";

const TRAVEL = 1.55;
const EXCELLENT = 0.07;
const GREAT = 0.12;
const GOOD = 0.17;
const PASS = 0.35;
const LANES = [
  { key: "p1l", alt: "p2l", kind: "kick", color: "METAL", label: "A" },
  { key: "p1d", alt: "p2d", kind: "snare", color: "GUITAR_SUN", label: "S" },
  { key: "p1r", alt: "p2r", kind: "hat", color: "WHITE", label: "D" },
  { key: "p1u", alt: "p2u", kind: "crash", color: "DANGER_ORANGE", label: "W" },
];

function pushBeat(notes, step, lane) {
  notes.push({ step, lane, hit: false, judged: false });
}

function makeChart() {
  const notes = [];
  const pattern = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 3, 1];
  for (let i = 0; i < pattern.length; i += 1) pushBeat(notes, 8 + i * 4, pattern[i]);
  return notes;
}

export function startDrumGame(audio) {
  audio.ensure();
  audio.setRhythmMode(true);
  const countdownEnds = audio.now() + 3;
  return {
    t0: countdownEnds,
    countdownEnds,
    countdownTick: 3,
    notes: makeChart(),
    hits: 0,
    combo: 0,
    score: 0,
    accuracyTotal: 0,
    flash: [0, 0, 0, 0],
    judge: null,
    impact: 0,
    failed: false,
    finished: false,
    result: null,
    time: 12,
    maxTime: 12,
  };
}

function hitTime(game, note, sixteenth) {
  return game.t0 + note.step * sixteenth;
}

function judgeNote(game, note, err) {
  note.judged = true;
  const accuracy = Math.max(0, 1 - Math.abs(err) / GOOD);
  game.accuracyTotal += accuracy;
  if (Math.abs(err) <= EXCELLENT) {
    note.hit = true;
    game.hits += 1;
    game.combo += 1;
    game.score += 1000 + game.combo * 10;
    game.judge = { text: "EXCELLENT", t: 0.5, key: "SUCCESS_GOLD" };
  } else if (Math.abs(err) <= GREAT) {
    note.hit = true;
    game.hits += 1;
    game.combo += 1;
    game.score += 700 + game.combo * 8;
    game.judge = { text: "GREAT", t: 0.45, key: "WHITE" };
  } else {
    note.hit = true;
    game.hits += 1;
    game.combo += 1;
    game.score += 400 + game.combo * 5;
    game.judge = { text: "GOOD", t: 0.35, key: "WHITE" };
  }
  game.impact = 0.12;
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);
}

export function updateDrumGame(game, audio, dt) {
  if (!game || game.finished) return game;
  if (game.failed) {
    if (tap("p1use") || tap("p2use")) Object.assign(game, startDrumGame(audio));
    return game;
  }
  const now = audio.now();
  if (now < game.countdownEnds) {
    const remaining = Math.ceil(game.countdownEnds - now);
    if (remaining < game.countdownTick) {
      game.countdownTick = remaining;
      audio.blip("pickup");
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
    }
    return game;
  }
  game.time = Math.max(0, game.time - dt);
  if (game.time <= 0) {
    game.finished = true;
    game.result = { perfect: false, ok: false, timedOut: true };
    audio.setRhythmMode(false);
    audio.blip("danger");
    return game;
  }
  const sixteenth = audio.sixteenth;
  if (game.judge) {
    game.judge.t -= dt;
    if (game.judge.t <= 0) game.judge = null;
  }
  for (let i = 0; i < 4; i += 1) game.flash[i] = Math.max(0, game.flash[i] - dt * 8);
  game.impact = Math.max(0, game.impact - dt);

  for (let lane = 0; lane < 4; lane += 1) {
    const L = LANES[lane];
    if (!(tap(L.key) || tap(L.alt))) continue;
    let best = null;
    let bestErr = 99;
    for (const n of game.notes) {
      if (n.lane !== lane || n.judged) continue;
      const err = now - hitTime(game, n, sixteenth);
      if (Math.abs(err) < Math.abs(bestErr) && Math.abs(err) <= GOOD) {
        best = n;
        bestErr = err;
      }
    }
    game.flash[lane] = 1;
    if (best) {
      judgeNote(game, best, bestErr);
      audio.playDrum(L.kind);
    }
  }

  for (const n of game.notes) {
    if (n.judged) continue;
    if (now - hitTime(game, n, sixteenth) > GOOD) {
      n.judged = true;
      game.combo = 0;
      game.impact = 0.1;
      if (!game.judge) game.judge = { text: "X", t: 0.2, key: "DANGER_RED" };
    }
  }

  const last = game.notes[game.notes.length - 1];
  if (now > hitTime(game, last, sixteenth) + 0.45) {
    const acc = game.hits / game.notes.length;
    const accuracy = Math.round((game.accuracyTotal / game.notes.length) * 100);
    if (acc >= PASS) {
      game.finished = true;
      game.result = { perfect: accuracy >= 85, ok: true, acc, accuracy, score: game.score };
      audio.setRhythmMode(false);
    } else {
      game.failed = true;
      game.judge = { text: "X", t: Infinity, key: "DANGER_RED" };
    }
  }
  return game;
}

export function drawDrumGame(ctx, game, audio, fill, blitStr) {
  if (!game) return;
  const now = audio.now();
  const sixteenth = audio.sixteenth;
  const shake = game.impact > 0 && Math.floor(game.impact * 90) % 2 ? -1 : 1;
  const hx = 214 + (game.impact > 0 ? shake : 0);
  const hy = 38;
  const hw = 88;
  const hh = 108;
  const rec = hy + hh - 14;
  fill(ctx, "BG_SHADOW", hx, hy, hw, hh);
  fill(ctx, "METAL_DK", hx + 1, rec, hw - 2, 8);
  for (let lane = 0; lane < 4; lane += 1) {
    const x = hx + 6 + lane * 20;
    fill(ctx, LANES[lane].color, x, rec + 2, 14, 4);
    if (game.flash[lane] > 0) fill(ctx, "SUCCESS_GOLD", x - 1, rec, 16, 8);
    blitStr(ctx, LANES[lane].label, x + 5, rec + 10, "WHITE");
  }
  for (const n of game.notes) {
    if (n.judged && !n.hit) continue;
    const until = hitTime(game, n, sixteenth) - now;
    const y = Math.round(rec - (until / TRAVEL) * (hh - 22));
    if (y < hy + 2 || y > rec + 6) continue;
    const x = hx + 6 + n.lane * 20;
    const key = n.hit ? "SUCCESS_GOLD" : LANES[n.lane].color;
    fill(ctx, key, x + 2, y, 10, 4);
    fill(ctx, "WHITE", x + 3, y + 1, 8, 1);
  }
  if (game.judge) blitStr(ctx, game.judge.text, hx + Math.floor((hw - game.judge.text.length * 5) / 2), hy + 4, game.judge.key);
  if (game.failed) blitStr(ctx, "E", hx + 42, hy + 48, "SUCCESS_GOLD");
  const n = String(game.combo);
  blitStr(ctx, n, hx + 4, hy + 4, "SUCCESS_GOLD");
  const accuracy = Math.round((game.accuracyTotal / game.notes.length) * 100);
  blitStr(ctx, String(game.score), hx + 44, hy + 22, "WHITE");
  blitStr(ctx, `${accuracy}%`, hx + 44, hy + 30, "SUCCESS_GOLD");
  if (now < game.countdownEnds) {
    const count = String(Math.max(1, Math.ceil(game.countdownEnds - now)));
    fill(ctx, "BG_SHADOW", hx + 18, hy + 42, 52, 28);
    blitStr(ctx, count, hx + 40, hy + 52, "SUCCESS_GOLD");
  }
}
