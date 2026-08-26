import { PALETTE } from "./palette.js";
import { tap } from "./input.js";

const TRAVEL = 1.2;
const PERF = 0.05;
const GOOD = 0.1;
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
  for (let i = 0; i < 4; i += 1) pushBeat(notes, i * 4, 0);
  for (let bar = 0; bar < 4; bar += 1) {
    const b = 16 + bar * 16;
    pushBeat(notes, b + 0, 0);
    pushBeat(notes, b + 0, 2);
    pushBeat(notes, b + 2, 2);
    pushBeat(notes, b + 4, 1);
    pushBeat(notes, b + 4, 2);
    pushBeat(notes, b + 6, 2);
    pushBeat(notes, b + 8, 0);
    pushBeat(notes, b + 8, 2);
    pushBeat(notes, b + 10, 2);
    pushBeat(notes, b + 12, 1);
    pushBeat(notes, b + 12, 2);
    pushBeat(notes, b + 14, 2);
    if (bar === 1) pushBeat(notes, b + 8, 3);
    if (bar === 3) {
      pushBeat(notes, b + 10, 0);
      pushBeat(notes, b + 13, 1);
      pushBeat(notes, b + 14, 3);
      pushBeat(notes, b + 15, 1);
    }
  }
  return notes;
}

export function startDrumGame(audio) {
  audio.ensure();
  audio.setRhythmMode(true);
  return {
    t0: audio.now() + 0.08,
    notes: makeChart(),
    hits: 0,
    combo: 0,
    flash: [0, 0, 0, 0],
    judge: null,
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
  if (Math.abs(err) <= PERF) {
    note.hit = true;
    game.hits += 1;
    game.combo += 1;
    game.judge = { text: "NICE", t: 0.35, key: "SUCCESS_GOLD" };
  } else if (Math.abs(err) <= GOOD) {
    note.hit = true;
    game.hits += 1;
    game.combo += 1;
    game.judge = { text: "GOOD", t: 0.35, key: "WHITE" };
  } else {
    game.combo = 0;
    game.judge = { text: "X", t: 0.28, key: "DANGER_RED" };
  }
}

export function updateDrumGame(game, audio, dt) {
  if (!game || game.finished) return game;
  game.time = Math.max(0, game.time - dt);
  if (game.time <= 0) {
    game.finished = true;
    game.result = { perfect: false, ok: false, timedOut: true };
    audio.setRhythmMode(false);
    audio.blip("danger");
    return game;
  }
  const now = audio.now();
  const sixteenth = audio.sixteenth;
  if (game.judge) {
    game.judge.t -= dt;
    if (game.judge.t <= 0) game.judge = null;
  }
  for (let i = 0; i < 4; i += 1) game.flash[i] = Math.max(0, game.flash[i] - dt * 8);

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
      if (!game.judge) game.judge = { text: "X", t: 0.2, key: "DANGER_RED" };
    }
  }

  const last = game.notes[game.notes.length - 1];
  if (now > hitTime(game, last, sixteenth) + 0.45) {
    game.finished = true;
    const acc = game.hits / game.notes.length;
    game.result = { perfect: acc >= 0.8, ok: acc >= 0.45, acc };
    audio.setRhythmMode(false);
  }
  return game;
}

export function drawDrumGame(ctx, game, audio, fill, blitStr) {
  if (!game) return;
  const now = audio.now();
  const sixteenth = audio.sixteenth;
  const hx = 214;
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
  if (game.judge) blitStr(ctx, game.judge.text, hx + 30, hy + 4, game.judge.key);
  const n = String(game.combo);
  blitStr(ctx, n, hx + 4, hy + 4, "SUCCESS_GOLD");
}
