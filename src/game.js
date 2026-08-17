import { PALETTE } from "./palette.js";
import { W, H } from "./camera.js";
import { axis, tap, held } from "./input.js";

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

const STAGE = { x: 24, y: 52, w: 272, h: 84 };
const BACK = { y: 136 };

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

export function createGame(assets, camera, juice, audio) {
  const { chars, tiles, props, fx, crowd } = assets;

  const solids = [
    aabb(148, 118, 16, 12),
    aabb(208, 118, 16, 12),
    aabb(214, 92, 28, 16),
    aabb(248, 156, 16, 14),
    aabb(0, 0, 320, 52),
  ];

  const stations = {
    guitar: { x: 148, y: 78, w: 16, h: 24 },
    amp: { x: 148, y: 108, w: 16, h: 16 },
    drum: { x: 214, y: 80, w: 32, h: 24 },
    micHome: { x: 86, y: 70, w: 16, h: 24 },
  };

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
    state = {
      phase: "title",
      time: SHOW,
      tension: 82,
      song: 0,
      players: [makePlayer("p1", 150, 148, "p1"), makePlayer("p2", 176, 148, "p2")],
      npcs: [
        { who: "vocal", x: 78, y: 78, dir: "down", panic: false, t: 0 },
        { who: "guitar", x: 164, y: 76, dir: "down", panic: false, t: 0 },
        { who: "drum", x: 226, y: 72, dir: "down", panic: false, t: 0 },
      ],
      pickups: [
        makePickup("spareGuitar", 36, 148),
        makePickup("mic", 86, 70),
        makePickup("box", 250, 148),
      ],
      accidents: {
        cable: { on: false, ttl: 0 },
        string: { on: false, ttl: 0 },
        stick: { on: false, ttl: 0 },
        feedback: { on: false, ttl: 0 },
      },
      nextSpawn: 6,
      spawnIndex: 0,
      pop: [],
      wave: 0,
      hold: null,
    };
  }

  reset();

  const spawnOrder = ["cable", "stick", "string", "feedback"];

  function pickupAt(kind) {
    return state.pickups.find((p) => p.kind === kind && !p.heldBy);
  }

  function spawnAccident(kind) {
    const acc = state.accidents[kind];
    if (acc.on) return false;
    acc.on = true;
    acc.ttl = kind === "feedback" ? 9 : kind === "cable" ? 10 : 12;
    juice.spark(160, 90);
    camera.shake(1, 0.16);
    audio.blip("danger");

    if (kind === "cable") {
      const existing = state.pickups.find((p) => p.kind === "cable");
      if (!existing) state.pickups.push(makePickup("cable", 156, 102));
      else if (!existing.heldBy) {
        existing.x = 156;
        existing.y = 102;
      }
    }
    if (kind === "stick") {
      const sx = 40 + Math.random() * 240;
      const sy = 60 + Math.random() * 70;
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
    return true;
  }

  function accidentPos(kind) {
    if (kind === "cable" || kind === "string") return { x: 156, y: 86 };
    if (kind === "stick") return { x: 226, y: 86 };
    return { x: 94, y: 78 };
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
  }

  function nearestInteract(player) {
    const f = feetBox(player);
    const cx = f.x + f.w / 2;
    const cy = f.y + f.h / 2;
    let best = null;
    let bestD = 16;

    for (const p of state.pickups) {
      if (p.heldBy) continue;
      if (p.kind === "box") continue;
      const d = dist(cx, cy, p.x + 8, p.y + 12);
      if (d < bestD) {
        bestD = d;
        best = { type: "pickup", item: p };
      }
    }

    if (player.carrying) {
      const ampD = dist(cx, cy, stations.amp.x + 8, stations.amp.y + 8);
      if (player.carrying.kind === "cable" && ampD < 18) {
        return { type: "plug" };
      }
      const gD = dist(cx, cy, stations.guitar.x + 8, stations.guitar.y + 12);
      if (player.carrying.kind === "spareGuitar" && gD < 18) {
        return { type: "swap" };
      }
      const dD = dist(cx, cy, stations.drum.x + 16, stations.drum.y + 12);
      if (player.carrying.kind === "stick" && dD < 20) {
        return { type: "giveStick" };
      }
    }
    return best;
  }

  function tryUse(player) {
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
      state.hold = { player: player.id, kind: "swap", t: 0 };
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
    const dAmp2 = dist(mic.x + 8, mic.y + 12, 216, 116);
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
      player.carrying.x = player.x;
      player.carrying.y = player.y - 12;
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

    state.nextSpawn -= dt;
    if (state.nextSpawn <= 0) {
      const ordered = spawnOrder[state.spawnIndex];
      if (state.spawnIndex < spawnOrder.length) {
        spawnAccident(ordered);
        state.spawnIndex += 1;
      } else {
        const pool = names.filter((k) => !state.accidents[k].on);
        if (pool.length) spawnAccident(pool[Math.floor(Math.random() * pool.length)]);
      }
      const panic = 1 - state.tension / 100;
      state.nextSpawn = 11 - panic * 5 + Math.random() * 3;
    }

    for (const p of state.pop) p.t -= dt;
    state.pop = state.pop.filter((p) => p.t > -1.2);
  }

  function update(dt) {
    audio.tick();
    if (tap("mute")) audio.toggleMute();
    if (state.phase === "title") {
      if (tap("start") || tap("p1use")) {
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

    state.time -= dt;
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
    for (const pl of state.players) {
      if (nearestInteract(pl)?.item === p) return true;
    }
    return false;
  }

  function fill(ctx, key, x, y, w, h) {
    ctx.fillStyle = PALETTE[key];
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }

  function drawWorld(ctx) {
    fill(ctx, "BG_NIGHT", 0, 0, W, H);
    for (let x = 0; x < W; x += 16) {
      ctx.drawImage(tiles, 64, 0, 16, 16, x, 16, 16, 16);
      ctx.drawImage(tiles, 64, 0, 16, 16, x, 32, 16, 16);
      ctx.drawImage(tiles, 80, 0, 16, 16, x, 40, 16, 16);
    }
    fill(ctx, "BG_AUDIENCE", 0, 0, W, 20);

    const mood = state.accidents.feedback.on ? 3 : state.tension > 70 ? 0 : state.tension > 35 ? 1 : 2;
    const jump = state.phase === "play" && state.tension > 70 && Math.floor(performance.now() / 250) % 2 === 0 ? -1 : 0;
    for (let i = 0; i < 22; i += 1) {
      const m = state.accidents.feedback.on ? 3 : (i % 3 === 0 ? mood : Math.min(2, mood + (i % 2)));
      const x = 16 + i * 13;
      const y = 26 + (i % 2) + jump;
      ctx.drawImage(crowd, m * 8, 0, 8, 12, x, y, 8, 12);
      if (state.tension > 55 && i % 2 === 0) {
        fill(ctx, "TENSION_PINK", x + 3, y - 4, 1, 3);
      }
    }

    for (let y = STAGE.y; y < BACK.y; y += 16) {
      for (let x = STAGE.x; x < STAGE.x + STAGE.w; x += 16) {
        const sx = ((x + y) / 16) % 2 === 0 ? 0 : 16;
        ctx.drawImage(tiles, sx, 0, 16, 16, x, y, 16, 16);
      }
    }
    for (let y = BACK.y; y < H; y += 16) {
      for (let x = 0; x < W; x += 16) {
        ctx.drawImage(tiles, 48, 0, 16, 16, x, y, 16, 16);
      }
    }

    ctx.drawImage(props, 144, 16, 14, 8, 176, 118, 14, 8);
    ctx.drawImage(props, 32, 8, 16, 16, stations.amp.x, stations.amp.y, 16, 16);
    ctx.drawImage(props, 32, 8, 16, 16, 208, 108, 16, 16);
    ctx.drawImage(props, 64, 0, 32, 24, stations.drum.x, stations.drum.y, 32, 24);
    ctx.drawImage(props, 128, 8, 16, 16, 250, 148, 16, 16);

    ctx.drawImage(props, 0, 0, 16, 24, stations.guitar.x, stations.guitar.y, 16, 24);

    if (state.accidents.feedback.on) {
      const o = Math.round(Math.sin(state.wave) * 1);
      ctx.globalAlpha = 0.35;
      fill(ctx, "MIC_SILVER", 0, 90 + o, W, 1);
      fill(ctx, "WHITE", 0, 110 - o, W, 1);
      ctx.globalAlpha = 1;
    }
  }

  function drawEntities(ctx) {
    const list = [];
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
          if (pl.carrying) drawProp(ctx, pl.carrying.kind, pl.x, pl.y - 14);
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
    ctx.drawImage(props, r[0], r[1], r[2], r[3], Math.round(x), Math.round(y), r[2], r[3]);
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
    }
    if (state.hold) {
      const p = state.players.find((pl) => pl.id === state.hold.player);
      if (p) {
        fill(ctx, "BLACK", p.x, p.y - 4, 16, 2);
        fill(ctx, "SUCCESS_GOLD", p.x, p.y - 4, Math.round(16 * clamp(state.hold.t / 0.85, 0, 1)), 2);
      }
    }
  }

  function pixelText(ctx, text, x, y, key = "WHITE") {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PALETTE[key];
    ctx.font = "8px monospace";
    ctx.fillText(text, Math.round(x), Math.round(y));
  }

  function drawHud(ctx) {
    const t = Math.ceil(state.time);
    const mm = String(Math.floor(t / 60)).padStart(1, "0");
    const ss = String(t % 60).padStart(2, "0");
    pixelText(ctx, `${mm}:${ss}`, 148, 10, "WHITE");

    if (state.phase === "title") {
      fill(ctx, "BG_SHADOW", 40, 58, 240, 70);
      pixelText(ctx, "LAST SONG!", 118, 78, "SUCCESS_GOLD");
      pixelText(ctx, "공연은 멈추면 안 된다", 92, 94, "WHITE");
      pixelText(ctx, "WASD+E / ARROWS+ENTER", 86, 110, "MIC_SILVER");
      pixelText(ctx, "SPACE", 148, 122, "TENSION_PINK");
    }
    if (state.phase === "win") {
      fill(ctx, "BG_SHADOW", 50, 70, 220, 44);
      pixelText(ctx, "LAST SONG CLEAR", 104, 88, "SUCCESS_GOLD");
      pixelText(ctx, "R to encore", 124, 104, "WHITE");
    }
    if (state.phase === "lose") {
      fill(ctx, "BG_SHADOW", 50, 70, 220, 44);
      pixelText(ctx, "the song died.", 110, 88, "DANGER_RED");
      pixelText(ctx, "R to try again", 116, 104, "WHITE");
    }
  }

  function draw(ctx) {
    drawWorld(ctx);
    drawEntities(ctx);
    drawFx(ctx);
    drawHud(ctx);
  }

  return { update, draw, reset, getState: () => state };
}
