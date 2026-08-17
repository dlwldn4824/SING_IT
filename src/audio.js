const BPM = 120;
const SIXTEENTH = 60 / BPM / 4;

function envGain(ctx, t, a, h, d, vol) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.setValueAtTime(vol, t + a + h);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + h + d);
  return g;
}

function kick(ctx, dest, t) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + 0.2);
}

function snare(ctx, dest, t) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1800;
  const g = envGain(ctx, t, 0.001, 0.02, 0.1, 0.35);
  src.connect(bp).connect(g).connect(dest);
  src.start(t);
  src.stop(t + 0.15);
  const o = ctx.createOscillator();
  o.type = "triangle";
  o.frequency.setValueAtTime(180, t);
  const og = envGain(ctx, t, 0.001, 0.01, 0.08, 0.2);
  o.connect(og).connect(dest);
  o.start(t);
  o.stop(t + 0.1);
}

function hat(ctx, dest, t, open) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 7000;
  const g = envGain(ctx, t, 0.001, open ? 0.04 : 0.01, open ? 0.08 : 0.03, open ? 0.12 : 0.07);
  src.connect(hp).connect(g).connect(dest);
  src.start(t);
  src.stop(t + 0.1);
}

function note(ctx, dest, t, freq, type, dur, vol) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  const g = envGain(ctx, t, 0.01, dur * 0.4, dur * 0.55, vol);
  o.connect(g).connect(dest);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function powerChord(ctx, dest, t, root, dur) {
  note(ctx, dest, t, root, "sawtooth", dur, 0.09);
  note(ctx, dest, t, root * 1.498, "sawtooth", dur, 0.07);
  note(ctx, dest, t, root * 2, "square", dur, 0.03);
}

const ROOTS = [82.41, 110, 123.47, 110]; // E A B A
const MELODY = [329.63, 392, 440, 392, 329.63, 246.94, 220, 329.63];

export function createAudio() {
  let ctx = null;
  let master;
  let stems;
  let started = false;
  let muted = false;
  let nextStep = 0;
  let step = 0;
  const targets = { vocals: 1, guitar: 1, bass: 1, drums: 1 };

  function ensure() {
    if (ctx) return;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    stems = {};
    for (const name of ["vocals", "guitar", "bass", "drums"]) {
      const g = ctx.createGain();
      g.gain.value = 1;
      g.connect(master);
      stems[name] = g;
    }
  }

  function setStem(name, on, instant = false) {
    targets[name] = on ? 1 : 0;
    if (!stems) return;
    const g = stems[name].gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    if (instant) g.setValueAtTime(targets[name], now);
    else g.linearRampToValueAtTime(targets[name], now + (on ? 0.08 : 0.12));
  }

  function scheduler() {
    if (!started || !ctx) return;
    const horizon = ctx.currentTime + 0.2;
    while (nextStep < horizon) {
      const s = step % 16;
      const bar = Math.floor(step / 16) % 4;
      const t = nextStep;
      if (s === 0 || s === 8) kick(ctx, stems.drums, t);
      if (s === 4 || s === 12) snare(ctx, stems.drums, t);
      if (s % 2 === 0) hat(ctx, stems.drums, t, s % 8 === 6);
      const root = ROOTS[bar];
      if (s % 4 === 0) note(ctx, stems.bass, t, root, "square", 0.22, 0.16);
      if (s % 2 === 0) powerChord(ctx, stems.guitar, t, root * 2, 0.14);
      if (bar % 2 === 1 && (s === 0 || s === 4 || s === 8 || s === 12)) {
        const m = MELODY[(bar * 4 + s / 4) % MELODY.length];
        note(ctx, stems.vocals, t, m, "triangle", 0.28, 0.14);
        note(ctx, stems.vocals, t, m * 2, "sine", 0.18, 0.04);
      }
      nextStep += SIXTEENTH;
      step += 1;
    }
  }

  function start() {
    ensure();
    ctx.resume();
    started = true;
    nextStep = ctx.currentTime + 0.05;
    step = 0;
  }

  function stop() {
    started = false;
    if (!stems) return;
    for (const name of Object.keys(stems)) setStem(name, false, true);
  }

  function punch() {
    if (!master || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.95, now);
    master.gain.linearRampToValueAtTime(0.7, now + 0.12);
  }

  function blip(kind) {
    if (!ctx) return;
    const t = ctx.currentTime;
    if (kind === "danger") {
      note(ctx, master, t, 220, "square", 0.08, 0.12);
      note(ctx, master, t + 0.08, 180, "square", 0.1, 0.1);
    } else if (kind === "fix") {
      note(ctx, master, t, 523, "square", 0.06, 0.1);
      note(ctx, master, t + 0.06, 784, "square", 0.1, 0.1);
    } else if (kind === "pickup") {
      note(ctx, master, t, 660, "square", 0.05, 0.08);
    }
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.7;
  }

  function tick() {
    scheduler();
  }

  return { start, stop, setStem, punch, blip, toggleMute, tick, ensure };
}
