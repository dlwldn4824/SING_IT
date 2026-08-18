import { PALETTE } from "./palette.js";
import { W, H } from "./camera.js";
import { axis, tap, held } from "./input.js";
import { VENUES } from "./venues.js";

const SHOW = 180;
const CHAR = { w: 16, h: 24 };
const DIR = { down: 0, up: 1, left: 2, right: 3 };
const FRAMES = {
  idle: [0, 1, 2, 3],
  walk: [4, 5, 6, 7],
  act: [8, 9, 10],
  panic: [11, 12],
};
const WHO = { p1: 0, p2: 1, vocal: 2, guitar: 3, drum: 4 };

function aabb(x, y, w, h) {
  return { x, y, w, h };
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function dirFrom(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? "left" : "right";
  if (dy < 0) return "up";
  return "down";
}

function feetBox(e) {
  return aabb(e.x + 3, e.y + 16, 10, 8);
}

function carryOffset(pl) {
  const tall = pl.carrying && (pl.carrying.kind === "spareGuitar" || pl.carrying.kind === "guitar" || pl.carrying.kind === "mic");
  if (pl.dir === "left") return { x: tall ? -10 : -8, y: tall ? 6 : 10 };
  if (pl.dir === "right") return { x: 12, y: tall ? 6 : 10 };
  if (pl.dir === "up") return { x: 10, y: tall ? 2 : 6 };
  return { x: 10, y: tall ? 8 : 12 };
}

export function createGame(assets, camera, juice, audio) {
  const { chars, tiles, props, fx, crowd } = assets;

  const solids = [];
  const stations = {
    guitar: { x: 148, y: 78, w: 16, h: 24 },
    amp: { x: 148, y: 108, w: 16, h: 16 },
    amp2: { x: 208, y: 108, w: 16, h: 16 },
    drum: { x: 214, y: 80, w: 32, h: 24 },
    micHome: { x: 86, y: 70, w: 16, h: 24 },
  };
  let venueIndex = 0;
  const venue = () => VENUES[venueIndex];

  function applyLayout() {
    const v = venue();
    solids.length = 0;
    for (const s of v.solids) solids.push(aabb(s.x, s.y, s.w, s.h));
    Object.assign(stations.guitar, v.stations.guitar);
    Object.assign(stations.amp, v.stations.amp);
    Object.assign(stations.amp2, v.stations.amp2);
    Object.assign(stations.drum, v.stations.drum);
    Object.assign(stations.micHome, v.stations.micHome);
  }

  function makePlayer(id, x, y, who) {
    return {
      id, who, x, y, vx: 0, vy: 0, dir: "down",
      anim: "idle", frame: 0, t: 0, carrying: null,
      squash: 1, stun: 0, act: 0,
    };
  }

  function makePickup(kind, x, y) {
    return { kind, x, y, vx: 0, vy: 0, heldBy: null, bounce: 0, fly: 0 };
  }

  let state;

  function reset() {
    applyLayout();
    const v = venue();
    state = {
      phase: "title",
      time: v.duration,
      tension: 82,
      song: 0,
      players: [
        makePlayer("p1", v.players[0].x, v.players[0].y, "p1"),
        makePlayer("p2", v.players[1].x, v.players[1].y, "p2"),
      ],
      npcs: v.npcs.map((n) => ({ who: n.who, x: n.x, y: n.y, dir: "down", panic: false, t: 0 })),
      pickups: v.pickups.map((p) => makePickup(p.kind, p.x, p.y)),
      accidents: {
        cable: { on: false, ttl: 0 },
        string: { on: false, ttl: 0 },
        stick: { on: false, ttl: 0 },
        feedback: { on: false, ttl: 0 },
      },
      nextSpawn: v.firstSpawn,
      spawnIndex: 0,
      pop: [],
      bubbles: [],
      wave: 0,
      hold: null,
      tutorial: { on: !!v.tutorial, step: "move", t: 0, dist: 0 },
    };
  }

  reset();

  const spawnOrder = ["cable", "stick", "string", "feedback"];

  function pickupAt(kind) {
    return state.pickups.find((p) => p.kind === kind && !p.heldBy);
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function barkAt(x, y, text) {
    if (!state.bubbles) state.bubbles = [];
    state.bubbles.push({ x, y, text, t: 1.15 });
    if (state.bubbles.length > 2) state.bubbles.shift();
  }

  function barkWho(kind) {
    if (kind === "stick") return state.npcs[2];
    if (kind === "feedback") return state.npcs[0];
    return state.npcs[1];
  }

  function barkAccident(kind) {
    const n = barkWho(kind);
    const lines = {
      cable: ["야!", "헉", "엇!"],
      string: ["엇!", "아", "야!"],
      stick: ["야!", "ㅋㅋ", "엇!"],
      feedback: ["헉", "아아", "야!"],
    };
    const on = Object.values(state.accidents).filter((a) => a.on).length;
    const text = on >= 2 ? pick(["ㅋㅋㅋ", "야야", "헉"]) : pick(lines[kind] || ["야!"]);
    barkAt(n.x + 8, n.y - 4, text);
  }

  function barkFix() {
    const n = state.npcs[Math.floor(Math.random() * state.npcs.length)];
    barkAt(n.x + 8, n.y - 4, pick(["오!", "ㅋㅋ", "야!"]));
  }

  function spawnAccident(kind) {
    const acc = state.accidents[kind];
    if (acc.on) return false;
    acc.on = true;
    acc.ttl = kind === "feedback" ? 9 : kind === "cable" ? 10 : 12;
    juice.spark(160, 90);
    camera.shake(1, 0.16);
    audio.blip("danger");
    if (kind === "cable" || kind === "string") audio.setStem("guitar", false);
    if (kind === "stick") audio.setStem("drums", false);
    if (kind === "feedback") audio.setStem("vocals", false);

    if (kind === "cable") {
      const existing = state.pickups.find((p) => p.kind === "cable");
      if (!existing) state.pickups.push(makePickup("cable", 80, 154));
      else if (!existing.heldBy) {
        existing.x = 80;
        existing.y = 154;
      }
    }
    if (kind === "stick") {
      const sx = state.tutorial.on ? 168 : 40 + Math.random() * 240;
      const sy = state.tutorial.on ? 122 : 60 + Math.random() * 70;
      const existing = state.pickups.find((p) => p.kind === "stick");
      if (!existing) state.pickups.push(makePickup("stick", sx, sy));
      else if (!existing.heldBy) {
        existing.x = sx;
        existing.y = sy;
      }
    }
    if (kind === "feedback") {
      const mic = state.pickups.find((p) => p.kind === "mic");
      if (mic && !mic.heldBy) {
        mic.x = 132;
        mic.y = 100;
      }
    }
    const pos = accidentPos(kind);
    state.pop.push({ x: pos.x, y: pos.y - 14, t: 0.35, kind: "bang" });
    barkAccident(kind);
    return true;
  }

  function accidentPos(kind) {
    if (kind === "cable") return { x: stations.amp.x + 4, y: stations.amp.y - 8 };
    if (kind === "string") return { x: state.npcs[1].x + 4, y: state.npcs[1].y - 10 };
    if (kind === "stick") return { x: state.npcs[2].x + 4, y: state.npcs[2].y - 10 };
    return { x: state.npcs[0].x + 4, y: state.npcs[0].y - 10 };
  }

  function clearAccident(kind, perfect) {
    const acc = state.accidents[kind];
    if (!acc.on) return;
    acc.on = false;
    acc.ttl = 0;
    juice.hitstop(0.05);
    juice.bang(accidentPos(kind).x, accidentPos(kind).y);
    camera.shake(1, 0.1);
    audio.blip("fix");
    audio.punch();
    state.tension = clamp(state.tension + (perfect ? 10 : 6), 0, 100);
    for (const p of state.players) p.squash = 0.78;
    for (const n of state.npcs) n.t = 0;
    barkFix();
  }

  function nearestInteract(player) {
    const f = feetBox(player);
    const cx = f.x + f.w / 2;
    const cy = f.y + f.h / 2;
    let best = null;
    let bestD = 24;

    for (const p of state.pickups) {
      if (p.heldBy) continue;
      if (p.kind === "box") continue;
      const d = dist(cx, cy, p.x + 8, p.y + 6);
      if (d < bestD) {
        bestD = d;
        best = { type: "pickup", item: p };
      }
    }

    if (player.carrying) {
      const reach = 28;
      const ampD = dist(cx, cy, stations.amp.x + 8, stations.amp.y + 8);
      if (player.carrying.kind === "cable" && ampD < reach) return { type: "plug" };
      const gD = Math.min(
        dist(cx, cy, stations.guitar.x + 8, stations.guitar.y + 12),
        dist(cx, cy, state.npcs[1].x + 8, state.npcs[1].y + 16),
      );
      if (player.carrying.kind === "spareGuitar" && gD < reach) return { type: "swap" };
      const dD = Math.min(
        dist(cx, cy, stations.drum.x + 16, stations.drum.y + 12),
        dist(cx, cy, state.npcs[2].x + 8, state.npcs[2].y + 16),
      );
      if (player.carrying.kind === "stick" && dD < reach) return { type: "giveStick" };
    }
    return best;
  }

  function tryUse(player) {
    if (player.carrying && player.carrying.kind === "mic" && state.accidents.feedback.on) {
      const hitMic = nearestInteract(player);
      if (!hitMic || hitMic.type !== "pickup") {
        drop(player, 0, 0);
        return;
      }
    }
    const hit = nearestInteract(player);
    if (!hit) return;
    if (hit.type === "pickup") {
      if (player.carrying) drop(player, 0, 0);
      player.carrying = hit.item;
      hit.item.heldBy = player.id;
      audio.blip("pickup");
      juice.dust(player.x + 8, player.y + 22);
      player.act = 0.12;
      return;
    }
    if (hit.type === "plug" && state.accidents.cable.on) {
      const cable = player.carrying;
      player.carrying = null;
      cable.heldBy = null;
      state.pickups = state.pickups.filter((p) => p !== cable);
      clearAccident("cable", true);
      player.act = 0.2;
      return;
    }
    if (hit.type === "swap" && state.accidents.string.on) {
      const g = player.carrying;
      player.carrying = null;
      if (g) {
        g.heldBy = null;
        const home = venue().pickups.find((p) => p.kind === "spareGuitar");
        g.x = home.x;
        g.y = home.y;
      }
      state.hold = null;
      clearAccident("string", true);
      player.act = 0.2;
      return;
    }
    if (hit.type === "giveStick" && state.accidents.stick.on) {
      const st = player.carrying;
      player.carrying = null;
      st.heldBy = null;
      state.pickups = state.pickups.filter((p) => p !== st);
      clearAccident("stick", true);
      player.act = 0.2;
    }
  }

  function drop(player, vx, vy) {
    if (!player.carrying) return;
    const item = player.carrying;
    item.heldBy = null;
    item.x = player.x;
    item.y = player.y + 10;
    item.vx = vx;
    item.vy = vy;
    item.fly = Math.hypot(vx, vy) > 1 ? 0.35 : 0;
    player.carrying = null;
    if (item.kind === "mic") checkMicPlacement(item);
  }

  function checkMicPlacement(mic) {
    const dAmp = dist(mic.x + 8, mic.y + 12, stations.amp.x + 8, stations.amp.y + 8);
    const dAmp2 = dist(mic.x + 8, mic.y + 12, stations.amp2.x + 8, stations.amp2.y + 8);
    const close = Math.min(dAmp, dAmp2) < 28;
    if (close) {
      if (!state.accidents.feedback.on) spawnAccident("feedback");
    } else if (state.accidents.feedback.on) {
      clearAccident("feedback", true);
    }
  }

  function moveActor(e, dx, dy) {
    e.x += dx;
    let box = feetBox(e);
    for (const s of solids) {
      if (!overlaps(box, s)) continue;
      if (dx > 0) e.x = s.x - 13;
      if (dx < 0) e.x = s.x + s.w - 3;
      box = feetBox(e);
    }
    e.y += dy;
    box = feetBox(e);
    for (const s of solids) {
      if (!overlaps(box, s)) continue;
      if (dy > 0) e.y = s.y - 24;
      if (dy < 0) e.y = s.y + s.h - 16;
      box = feetBox(e);
    }
    e.x = clamp(e.x, 2, W - 18);
    e.y = clamp(e.y, 40, H - 26);
  }

  function trip(player) {
    if (player.stun > 0) return;
    player.stun = 0.4;
    player.squash = 0.7;
    camera.shake(2, 0.18);
    juice.dust(player.x + 8, player.y + 20);
    barkAt(player.x + 8, player.y - 2, pick(["엇!", "아", "야!"]));
    if (player.carrying) {
      const dir = player.dir;
      const vx = dir === "left" ? -80 : dir === "right" ? 80 : (Math.random() * 40 - 20);
      const vy = dir === "up" ? -70 : 50;
      drop(player, vx, vy);
    }
  }

  function updatePlayer(player, prefix, dt) {
    if (player.squash < 1) player.squash = Math.min(1, player.squash + dt * 3);
    if (player.stun > 0) {
      player.stun -= dt;
      player.anim = "panic";
      return;
    }
    const a = axis(prefix);
    const speed = player.carrying ? 58 : 76;
    if (a.x || a.y) {
      player.dir = dirFrom(a.x, a.y);
      moveActor(player, a.x * speed * dt, a.y * speed * dt);
      player.anim = "walk";
      if (Math.random() < 0.04) juice.dust(player.x + 8, player.y + 22);
    } else {
      player.anim = player.act > 0 ? "act" : "idle";
    }
    if (player.act > 0) player.act -= dt;
    player.t += dt * (player.anim === "walk" ? 10 : 6);
    const seq = FRAMES[player.anim] || FRAMES.idle;
    player.frame = seq[Math.floor(player.t) % seq.length];

    if (player.carrying) {
      const c = carryOffset(player);
      player.carrying.x = player.x + c.x;
      player.carrying.y = player.y + c.y;
    }

    const cable = pickupAt("cable");
    if (cable && player.carrying && state.accidents.cable.on) {
      const f = feetBox(player);
      const c = aabb(cable.x + 2, cable.y + 2, 12, 6);
      if (overlaps(f, c) && (a.x || a.y)) trip(player);
    }

    if (tap(`${prefix}use`)) tryUse(player);
    if (held(`${prefix}use`) && state.hold && state.hold.player === player.id) {
      state.hold.t += dt;
      player.anim = "act";
      player.act = 0.1;
      if (state.hold.t >= 0.85) {
        const g = player.carrying;
        player.carrying = null;
        if (g) {
          g.heldBy = null;
          g.x = 36;
          g.y = 148;
        }
        state.hold = null;
        clearAccident("string", true);
      }
    } else if (state.hold && state.hold.player === player.id && !held(`${prefix}use`)) {
      state.hold = null;
    }
    if (tap(`${prefix}drop`)) drop(player, 0, 0);
  }

  function updatePickups(dt) {
    for (const p of state.pickups) {
      if (p.heldBy) continue;
      if (p.fly > 0) {
        p.fly -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 180 * dt;
        p.x = clamp(p.x, 4, W - 20);
        p.y = clamp(p.y, 52, H - 16);
        if (p.kind === "mic" && p.fly <= 0) checkMicPlacement(p);
      }
      p.bounce += dt * 8;
    }
  }

  function updateAccidents(dt) {
    const names = Object.keys(state.accidents);
    let active = 0;
    for (const k of names) {
      const a = state.accidents[k];
      if (!a.on) continue;
      active += 1;
      a.ttl -= dt;
      if (k === "feedback") {
        state.wave += dt * 14;
        if (Math.random() < 0.08) juice.spark(stations.amp.x + 8, stations.amp.y);
        const mic = state.pickups.find((p) => p.kind === "mic");
        if (mic && !mic.heldBy) {
          const dAmp = dist(mic.x + 8, mic.y + 12, stations.amp.x + 8, stations.amp.y + 8);
          if (dAmp >= 28) clearAccident("feedback", true);
        }
      }
      if (k === "cable" && Math.random() < 0.05) juice.spark(156, 114);
      if (k === "cable" && Math.random() < 0.08) juice.smoke(156, 112);
    }

    const guitarHurt = state.accidents.cable.on || state.accidents.string.on;
    const drumHurt = state.accidents.stick.on;
    const vocalHurt = state.accidents.feedback.on || state.pickups.some((p) => p.kind === "mic" && p.heldBy);
    audio.setStem("guitar", !guitarHurt);
    audio.setStem("drums", !drumHurt);
    audio.setStem("vocals", !vocalHurt);
    audio.setStem("bass", state.tension > 8);

    state.npcs[0].panic = vocalHurt;
    state.npcs[1].panic = guitarHurt;
    state.npcs[2].panic = drumHurt;
    for (const n of state.npcs) n.t += dt * (n.panic ? 12 : 4);

    let drain = 0;
    if (guitarHurt) drain += 2.4;
    if (drumHurt) drain += 2.0;
    if (vocalHurt) drain += 3.6;
    if (guitarHurt && drumHurt && vocalHurt) drain += 3;
    if (drain === 0) state.tension = clamp(state.tension + 1.15 * dt, 0, 100);
    else state.tension = clamp(state.tension - drain * dt, 0, 100);

    if (state.tutorial.on) state.tension = Math.max(state.tension, 45);

    if (!state.tutorial.on) state.nextSpawn -= dt;
    if (!state.tutorial.on && state.nextSpawn <= 0) {
      const ordered = spawnOrder[state.spawnIndex];
      if (state.spawnIndex < spawnOrder.length) {
        spawnAccident(ordered);
        state.spawnIndex += 1;
      } else {
        const pool = names.filter((k) => !state.accidents[k].on);
        if (pool.length) spawnAccident(pool[Math.floor(Math.random() * pool.length)]);
      }
      const gap = venue().spawnGap;
      state.nextSpawn = gap[0] + Math.random() * (gap[1] - gap[0]);
    }

    for (const p of state.pop) p.t -= dt;
    state.pop = state.pop.filter((p) => p.t > -1.2);
    for (const b of state.bubbles) b.t -= dt;
    state.bubbles = state.bubbles.filter((b) => b.t > 0);
  }

  function setTutorial(step) {
    state.tutorial.step = step;
    state.tutorial.t = 0;
  }

  function finishTutorial() {
    state.tutorial.on = false;
    state.tutorial.step = "done";
    state.nextSpawn = 14;
    state.spawnIndex = 4;
  }

  function skipTutorial() {
    state.tutorial.on = false;
    state.tutorial.step = "done";
    state.nextSpawn = 6;
    state.spawnIndex = 0;
  }

  function anyoneCarrying(kind) {
    return state.players.some((p) => p.carrying && p.carrying.kind === kind);
  }

  function updateTutorial(dt) {
    if (!state.tutorial.on) return;
    state.tutorial.t += dt;
    if (tap("start") && state.tutorial.t > 0.5) {
      skipTutorial();
      return;
    }
    const step = state.tutorial.step;
    if (step === "move") {
      const a = axis("p1");
      if (a.x || a.y) state.tutorial.dist += 70 * dt;
      if (state.tutorial.dist > 14) setTutorial("cableShow");
    } else if (step === "cableShow") {
      if (!state.accidents.cable.on) spawnAccident("cable");
      if (state.tutorial.t > 1.0) setTutorial("cableGet");
    } else if (step === "cableGet") {
      if (anyoneCarrying("cable")) setTutorial("cableFix");
    } else if (step === "cableFix") {
      if (!state.accidents.cable.on) setTutorial("stringShow");
    } else if (step === "stringShow") {
      if (state.tutorial.t > 0.7 && !state.accidents.string.on) spawnAccident("string");
      if (state.accidents.string.on && state.tutorial.t > 1.1) setTutorial("stringGet");
    } else if (step === "stringGet") {
      if (anyoneCarrying("spareGuitar")) setTutorial("stringFix");
    } else if (step === "stringFix") {
      if (!state.accidents.string.on) setTutorial("stickShow");
    } else if (step === "stickShow") {
      if (state.tutorial.t > 0.7 && !state.accidents.stick.on) spawnAccident("stick");
      if (state.accidents.stick.on && state.tutorial.t > 1.1) setTutorial("stickGet");
    } else if (step === "stickGet") {
      if (anyoneCarrying("stick")) setTutorial("stickFix");
    } else if (step === "stickFix") {
      if (!state.accidents.stick.on) setTutorial("feedShow");
    } else if (step === "feedShow") {
      if (state.tutorial.t > 0.7 && !state.accidents.feedback.on) spawnAccident("feedback");
      if (state.accidents.feedback.on && state.tutorial.t > 1.1) setTutorial("feedGet");
    } else if (step === "feedGet") {
      if (anyoneCarrying("mic")) setTutorial("feedPlace");
    } else if (step === "feedPlace") {
      if (!state.accidents.feedback.on) setTutorial("cheer");
    } else if (step === "cheer" && state.tutorial.t > 1.4) {
      finishTutorial();
    }
  }

  function tutorialTarget() {
    if (!state.tutorial.on) return null;
    const step = state.tutorial.step;
    if (step === "cableShow" || step === "cableFix") {
      return { x: stations.amp.x + 8, y: stations.amp.y - 10 };
    }
    if (step === "cableGet") {
      const c = pickupAt("cable");
      if (c) return { x: c.x + 8, y: c.y - 8 };
    }
    if (step === "stringShow" || step === "stringFix") {
      return { x: state.npcs[1].x + 8, y: state.npcs[1].y - 12 };
    }
    if (step === "stringGet") {
      const g = pickupAt("spareGuitar");
      if (g) return { x: g.x + 8, y: g.y - 8 };
    }
    if (step === "stickShow" || step === "stickFix") {
      return { x: state.npcs[2].x + 8, y: state.npcs[2].y - 12 };
    }
    if (step === "stickGet") {
      const s = pickupAt("stick");
      if (s) return { x: s.x + 8, y: s.y - 8 };
    }
    if (step === "feedShow" || step === "feedGet") {
      const m = pickupAt("mic") || state.pickups.find((p) => p.kind === "mic");
      if (m && !m.heldBy) return { x: m.x + 8, y: m.y - 10 };
    }
    if (step === "feedPlace") return { x: venue().safePad.x + 8, y: venue().safePad.y - 8 };
    return null;
  }

  function update(dt) {
    audio.tick();
    if (tap("mute")) audio.toggleMute();
    if (state.phase === "title") {
      if (tap("p1l") || tap("p2l")) {
        venueIndex = (venueIndex + VENUES.length - 1) % VENUES.length;
        reset();
        state.phase = "title";
      }
      if (tap("p1r") || tap("p2r")) {
        venueIndex = (venueIndex + 1) % VENUES.length;
        reset();
        state.phase = "title";
      }
      if (tap("start") || tap("p1use")) {
        reset();
        state.phase = "play";
        audio.start();
      }
      return;
    }
    if (state.phase === "win") {
      if (tap("restart") || tap("start") || tap("p1use")) {
        if (venueIndex < VENUES.length - 1) venueIndex += 1;
        else venueIndex = 0;
        reset();
        state.phase = "play";
        audio.start();
      }
      return;
    }
    if (state.phase !== "play") {
      if (tap("restart") || tap("start") || tap("p1use")) {
        reset();
        state.phase = "play";
        audio.start();
      }
      return;
    }

    const frozen = juice.update(dt);
    if (frozen) return;

    updatePlayer(state.players[0], "p1", dt);
    updatePlayer(state.players[1], "p2", dt);
    updatePickups(dt);
    updateAccidents(dt);
    updateTutorial(dt);

    if (!state.tutorial.on) state.time -= dt;
    if (state.tension <= 0) {
      state.phase = "lose";
      audio.stop();
    } else if (state.time <= 0) {
      state.phase = "win";
      audio.punch();
    }
  }

  function blit(ctx, img, sx, sy, sw, sh, dx, dy, squash = 1) {
    const h = Math.max(1, Math.round(sh * squash));
    const extra = squash < 0.96 ? 1 : 0;
    ctx.drawImage(img, sx, sy, sw, sh, Math.round(dx) - extra, Math.round(dy + (sh - h)), sw + extra * 2, h);
  }

  function drawChar(ctx, who, dir, frame, x, y, squash) {
    const row = WHO[who] * 4 + DIR[dir];
    blit(ctx, chars, frame * 16, row * 24, 16, 24, x, y, squash);
  }

  function hover(item, playerNear) {
    if (!playerNear) return 0;
    return (Math.floor(item.bounce) % 2);
  }

  function playerNearPickup(p) {
    const s = state.tutorial.on ? state.tutorial.step : "";
    if (s === "cableGet" && p.kind === "cable") return true;
    if (s === "stringGet" && p.kind === "spareGuitar") return true;
    if (s === "stickGet" && p.kind === "stick") return true;
    if (s === "feedGet" && p.kind === "mic") return true;
    for (const pl of state.players) {
      if (nearestInteract(pl)?.item === p) return true;
    }
    return false;
  }

  function fill(ctx, key, x, y, w, h) {
    ctx.fillStyle = PALETTE[key];
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function blitTile(ctx, sx, sy, x, y) {
    ctx.drawImage(tiles, sx, sy, 16, 16, x, y, 16, 16);
  }

  function blitProp(ctx, sx, sy, sw, sh, x, y) {
    ctx.drawImage(props, sx, sy, sw, sh, Math.round(x), Math.round(y), sw, sh);
  }

  function stageTile(v, x, y) {
    if (v.id === "club" || v.id === "arena") return ((x + y) / 16) % 2 === 0 ? [32, 16] : [48, 16];
    if (v.id === "fest") return ((x + y) / 16) % 2 === 0 ? [32, 0] : [16, 0];
    return ((x + y) / 16) % 2 === 0 ? [0, 0] : [16, 0];
  }

  function drawWorld(ctx) {
    const v = venue();
    const STAGE = v.stage;
    const BACK = { y: v.backY };
    fill(ctx, "BG_NIGHT", 0, 0, W, H);

    for (let x = 0; x < W; x += 16) {
      blitTile(ctx, 64, 0, x, 16);
      blitTile(ctx, 64, 0, x, 32);
      blitTile(ctx, 80, 0, x, 40);
    }
    fill(ctx, "BG_AUDIENCE", 0, 0, W, 16);

    const mood = state.accidents.feedback.on ? 3 : state.tension > 70 ? 0 : state.tension > 35 ? 1 : 2;
    const jump = state.phase === "play" && state.tension > 70 && Math.floor(performance.now() / 250) % 2 === 0 ? -1 : 0;
    const rows = v.crowdRows;
    for (let row = 0; row < rows; row += 1) {
      for (let i = 0; i < v.crowd; i += 1) {
        const m = state.accidents.feedback.on ? 3 : (i % 3 === 0 ? mood : Math.min(2, mood + (i % 2)));
        const x = v.id === "club" ? 100 + i * 14 : 8 + i * Math.floor(300 / Math.max(v.crowd, 1));
        const y = (v.id === "fest" ? 18 : 26) + row * 10 + (i % 2) + jump;
        if (y < 46) ctx.drawImage(crowd, m * 8, 0, 8, 12, x, y, 8, 12);
      }
    }

    for (let y = STAGE.y; y < BACK.y; y += 16) {
      for (let x = 0; x < W; x += 16) {
        const onStage = x + 8 >= STAGE.x && x < STAGE.x + STAGE.w;
        if (onStage) {
          const t = stageTile(v, x, y);
          blitTile(ctx, t[0], t[1], x, y);
        } else if (v.id === "club" || v.id === "arena") {
          blitTile(ctx, 0, 16, x, y);
        }
      }
    }

    if (v.id === "club") {
      blitTile(ctx, 16, 0, 8, 108);
      blitTile(ctx, 0, 0, 16, 108);
    }
    if (v.id === "arena") {
      for (let y = 58; y < 106; y += 16) {
        blitTile(ctx, 32, 16, 8, y);
        blitTile(ctx, 48, 16, 24, y);
        blitTile(ctx, 32, 16, 280, y);
        blitTile(ctx, 48, 16, 296, y);
      }
    }

    for (let y = BACK.y; y < H; y += 16) {
      for (let x = 0; x < W; x += 16) blitTile(ctx, 48, 0, x, y);
    }
    fill(ctx, "STAGE_WOOD_LT", STAGE.x, BACK.y - 1, STAGE.w, 1);
    fill(ctx, "BG_SHADOW", 0, BACK.y, W, 1);
    if (state.tutorial.on && state.tutorial.step === "feedPlace") {
      fill(ctx, "MIC_SILVER", v.safePad.x, v.safePad.y, 16, 4);
      fill(ctx, "WHITE", v.safePad.x + 2, v.safePad.y + 1, 12, 2);
    }
  }

  function drawEntities(ctx) {
    const list = [];
    const cableOn = state.accidents.cable.on;
    const stringOn = state.accidents.string.on;
    const stickOn = state.accidents.stick.on;

    list.push({
      z: stations.amp.y,
      draw: () => {
        if (cableOn) blitProp(ctx, 16, 56, 16, 16, stations.amp.x, stations.amp.y);
        else blitProp(ctx, 32, 8, 16, 16, stations.amp.x, stations.amp.y);
        blitProp(ctx, 144, 16, 14, 8, stations.amp.x + 28, stations.amp.y + 10);
      },
    });
    list.push({
      z: stations.amp2.y,
      draw: () => blitProp(ctx, 32, 8, 16, 16, stations.amp2.x, stations.amp2.y),
    });
    list.push({
      z: stations.drum.y,
      draw: () => {
        if (stickOn) blitProp(ctx, 64, 48, 32, 24, stations.drum.x, stations.drum.y);
        else blitProp(ctx, 64, 0, 32, 24, stations.drum.x, stations.drum.y);
      },
    });
    list.push({
      z: stations.guitar.y,
      draw: () => {
        if (stringOn) blitProp(ctx, 0, 48, 16, 24, stations.guitar.x, stations.guitar.y);
        else blitProp(ctx, 0, 0, 16, 24, stations.guitar.x, stations.guitar.y);
      },
    });

    for (const n of state.npcs) {
      const anim = n.panic ? "panic" : "idle";
      const seq = FRAMES[anim];
      const frame = seq[Math.floor(n.t) % seq.length];
      list.push({ z: n.y, draw: () => drawChar(ctx, n.who, "down", frame, n.x, n.y, 1) });
    }
    for (const p of state.pickups) {
      if (p.heldBy) continue;
      const near = playerNearPickup(p);
      const up = hover(p, near);
      list.push({
        z: p.y,
        draw: () => drawProp(ctx, p.kind, p.x, p.y - up),
      });
    }
    for (const pl of state.players) {
      list.push({
        z: pl.y,
        draw: () => {
          drawChar(ctx, pl.who, pl.dir, pl.frame, pl.x, pl.y, pl.squash);
          if (pl.carrying) {
            const c = carryOffset(pl);
            drawCarried(ctx, pl.carrying.kind, pl.x + c.x, pl.y + c.y, pl.dir);
          }
          if (pl.stun > 0) ctx.drawImage(fx, 58, 2, 2, 4, Math.round(pl.x + 12), Math.round(pl.y + 2), 2, 4);
        },
      });
    }
    list.sort((a, b) => a.z - b.z);
    for (const e of list) e.draw();
  }

  function drawProp(ctx, kind, x, y) {
    const map = {
      spareGuitar: [16, 0, 16, 24],
      guitar: [0, 0, 16, 24],
      mic: [48, 0, 16, 24],
      cable: [96, 16, 16, 8],
      stick: [112, 16, 16, 8],
      box: [128, 8, 16, 16],
    };
    const r = map[kind];
    if (!r) return;
    if (kind === "mic" && state.accidents.feedback.on) {
      blitProp(ctx, 32, 48, 16, 24, x, y);
      return;
    }
    blitProp(ctx, r[0], r[1], r[2], r[3], x, y);
  }

  function drawCarried(ctx, kind, x, y, dir) {
    const map = {
      spareGuitar: [16, 0, 16, 24],
      guitar: [0, 0, 16, 24],
      mic: [48, 0, 16, 24],
      cable: [96, 16, 16, 8],
      stick: [112, 16, 16, 8],
    };
    const r = map[kind];
    if (!r) return;
    const dx = Math.round(x);
    const dy = Math.round(y);
    ctx.save();
    if (dir === "left") {
      ctx.translate(dx + r[2], dy);
      ctx.scale(-1, 1);
      ctx.drawImage(props, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    } else {
      ctx.drawImage(props, r[0], r[1], r[2], r[3], dx, dy, r[2], r[3]);
    }
    ctx.restore();
  }

  function drawFx(ctx) {
    for (const p of juice.particles) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (p.kind === "star") ctx.drawImage(fx, 0, 0, 8, 8, x, y, 8, 8);
      else if (p.kind === "spark") ctx.drawImage(fx, 16, 0, 8, 8, x, y, 8, 8);
      else if (p.kind === "smoke") ctx.drawImage(fx, 24, 0, 8, 8, x, y, 8, 8);
      else fill(ctx, "WHITE", x, y, 1, 1);
    }
    for (const p of state.pop) {
      const popY = Math.round(p.y - (p.t > 0 ? (0.35 - p.t) * 8 : 0));
      ctx.drawImage(props, 48, 24, 8, 12, Math.round(p.x), popY, 8, 12);
    }
    if (state.accidents.cable.on) {
      const g = accidentPos("cable");
      ctx.drawImage(props, 48, 24, 8, 12, g.x, g.y - 10 + Math.round(Math.sin(performance.now() / 80)), 8, 12);
    }
    if (state.accidents.string.on) {
      const g = accidentPos("string");
      ctx.drawImage(props, 48, 24, 8, 12, g.x, g.y - 16 + Math.round(Math.sin(performance.now() / 80)), 8, 12);
    }
    if (state.accidents.stick.on) {
      const g = accidentPos("stick");
      ctx.drawImage(props, 48, 24, 8, 12, g.x, g.y - 16 + Math.round(Math.sin(performance.now() / 90)), 8, 12);
    }
    if (state.accidents.feedback.on) {
      const g = accidentPos("feedback");
      ctx.drawImage(props, 48, 24, 8, 12, g.x, g.y - 18 + Math.round(Math.sin(performance.now() / 70)), 8, 12);
      const mic = state.pickups.find((p) => p.kind === "mic");
      if (mic) {
        const o = Math.round(Math.sin(state.wave) * 1);
        fill(ctx, "DANGER_ORANGE", mic.x - 2, mic.y + 20 + o, 20, 1);
        fill(ctx, "WHITE", mic.x, mic.y + 22 - o, 16, 1);
      }
    }
    if (state.hold) {
      const p = state.players.find((pl) => pl.id === state.hold.player);
      if (p) {
        fill(ctx, "BLACK", p.x, p.y - 4, 16, 2);
        fill(ctx, "SUCCESS_GOLD", p.x, p.y - 4, Math.round(16 * clamp(state.hold.t / 0.85, 0, 1)), 2);
      }
    }
  }

  const GLYPH = {
    0: ["111", "101", "101", "101", "111"],
    1: ["010", "110", "010", "010", "111"],
    2: ["111", "001", "111", "100", "111"],
    3: ["111", "001", "111", "001", "111"],
    4: ["101", "101", "111", "001", "001"],
    5: ["111", "100", "111", "001", "111"],
    6: ["111", "100", "111", "101", "111"],
    7: ["111", "001", "001", "001", "001"],
    8: ["111", "101", "111", "101", "111"],
    9: ["111", "101", "111", "001", "111"],
    L: ["100", "100", "100", "100", "111"],
    A: ["010", "101", "111", "101", "101"],
    S: ["111", "100", "111", "001", "111"],
    T: ["111", "010", "010", "010", "010"],
    O: ["111", "101", "101", "101", "111"],
    N: ["101", "111", "111", "101", "101"],
    G: ["111", "100", "101", "101", "111"],
    R: ["110", "101", "110", "101", "101"],
    "!": ["010", "010", "010", "000", "010"],
    ":": ["000", "010", "000", "010", "000"],
    C: ["111", "100", "100", "100", "111"],
    H: ["101", "101", "111", "101", "101"],
    U: ["101", "101", "101", "101", "111"],
    B: ["110", "101", "110", "101", "110"],
    F: ["111", "100", "110", "100", "100"],
    E: ["111", "100", "111", "100", "111"],
    X: ["101", "010", "010", "010", "101"],
    "?": ["111", "001", "010", "000", "010"],
    야: ["10101", "10101", "11111", "01010", "10101"],
    헉: ["01110", "00100", "11111", "10001", "11110"],
    아: ["01110", "10001", "11111", "00100", "00100"],
    ㅋ: ["11100", "10100", "11110", "10101", "10100"],
    엇: ["01110", "10001", "01110", "00100", "01110"],
    오: ["01110", "10001", "11111", "00100", "01110"],
  };

  function glyphW(ch) {
    const g = GLYPH[ch];
    if (!g) return 0;
    return g[0].length;
  }

  function measureStr(str) {
    let w = 0;
    for (const ch of str) {
      if (ch === " ") w += 3;
      else if (GLYPH[ch]) w += glyphW(ch) + 1;
    }
    return Math.max(0, w - 1);
  }

  function blitStr(ctx, str, x, y, key) {
    let ox = Math.round(x);
    const oy = Math.round(y);
    for (const ch of str) {
      if (ch === " ") {
        ox += 3;
        continue;
      }
      const g = GLYPH[ch];
      if (g) {
        for (let row = 0; row < g.length; row += 1) {
          for (let col = 0; col < g[row].length; col += 1) {
            if (g[row][col] === "1") fill(ctx, key, ox + col, oy + row, 1, 1);
          }
        }
        ox += glyphW(ch) + 1;
      }
    }
  }

  function drawBubbles(ctx) {
    for (const b of state.bubbles) {
      const pop = b.t > 1.0 ? 1 : 0;
      const w = measureStr(b.text);
      const x = clamp(Math.round(b.x - w / 2), 2, W - w - 6);
      const y = clamp(Math.round(b.y - 10 - pop), 2, H - 16);
      fill(ctx, "BG_SHADOW", x - 2, y - 2, w + 4, 9);
      fill(ctx, "WHITE", x - 1, y - 1, w + 2, 1);
      fill(ctx, "WHITE", x - 1, y + 6, w + 2, 1);
      blitStr(ctx, b.text, x, y, "WHITE");
      fill(ctx, "BG_SHADOW", Math.round(b.x) - 1, y + 7, 3, 2);
      fill(ctx, "BG_SHADOW", Math.round(b.x), y + 9, 1, 1);
    }
  }

  function drawArrow(ctx, x, y) {
    const bob = Math.round(Math.sin(performance.now() / 110) * 2);
    const ax = Math.round(x);
    const ay = Math.round(y) + bob;
    fill(ctx, "DANGER_RED", ax, ay, 1, 3);
    fill(ctx, "DANGER_ORANGE", ax - 1, ay + 2, 3, 1);
    fill(ctx, "WHITE", ax, ay + 3, 1, 1);
  }

  function drawHud(ctx) {
    if (!state.tutorial.on && state.phase === "play") {
      const t = Math.max(0, Math.ceil(state.time));
      const mm = String(Math.floor(t / 60));
      const ss = String(t % 60).padStart(2, "0");
      blitStr(ctx, `${mm}:${ss}`, 148, 6, "WHITE");
    }

    const target = tutorialTarget();
    if (target) drawArrow(ctx, target.x, target.y);
    const p1 = state.players[0];
    const hit = nearestInteract(p1);
    const canUse = hit || (p1.carrying && p1.carrying.kind === "mic" && state.accidents.feedback.on);
    if (canUse && state.phase === "play") {
      blitStr(ctx, "E", p1.x + 4, p1.y - 8, "SUCCESS_GOLD");
    }

    if (state.phase === "title") {
      fill(ctx, "BG_SHADOW", 70, 56, 180, 52);
      blitStr(ctx, "LAST SONG!", 116, 62, "SUCCESS_GOLD");
      const nm = venue().name;
      blitStr(ctx, nm, 160 - nm.length * 2, 74, "WHITE");
      for (let i = 0; i < VENUES.length; i += 1) {
        const key = i === venueIndex ? "SUCCESS_GOLD" : "METAL";
        fill(ctx, key, 148 + i * 8, 86, 4, 4);
      }
      fill(ctx, "TENSION_PINK", 156, 96, 8, 2);
    }
    if (state.phase === "win") {
      fill(ctx, "BG_SHADOW", 90, 70, 140, 32);
      blitStr(ctx, venue().name, 160 - venue().name.length * 2, 78, "SUCCESS_GOLD");
      blitStr(ctx, venueIndex < VENUES.length - 1 ? "NEXT" : "LAST SONG!", 124, 90, "WHITE");
    }
    if (state.phase === "lose") {
      fill(ctx, "BG_SHADOW", 120, 74, 80, 22);
      blitStr(ctx, "X", 156, 82, "DANGER_RED");
    }
  }

  function draw(ctx) {
    drawWorld(ctx);
    drawEntities(ctx);
    drawFx(ctx);
    drawHud(ctx);
    if (state.phase === "play") drawBubbles(ctx);
  }

  return { update, draw, reset, getState: () => state };
}
