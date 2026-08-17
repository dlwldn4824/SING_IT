export function createJuice() {
  const particles = [];
  let freeze = 0;

  function spawn(kind, x, y, n = 4) {
    for (let i = 0; i < n; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const sp = kind === "star" ? 18 + Math.random() * 24 : 10 + Math.random() * 20;
      particles.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (kind === "star" ? 12 : 4),
        life: 0.28 + Math.random() * 0.18,
        max: 0.46,
      });
    }
  }

  function bang(x, y) {
    spawn("star", x, y, 6);
  }

  function dust(x, y) {
    spawn("dust", x, y, 3);
  }

  function smoke(x, y) {
    particles.push({
      kind: "smoke",
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: -10 - Math.random() * 8,
      life: 0.5,
      max: 0.5,
    });
  }

  function spark(x, y) {
    spawn("spark", x, y, 5);
  }

  function hitstop(t = 0.05) {
    freeze = Math.max(freeze, t);
  }

  function update(dt) {
    if (freeze > 0) {
      freeze -= dt;
      return freeze > 0;
    }
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === "star") p.vy += 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    return false;
  }

  return { particles, spawn, bang, dust, smoke, spark, hitstop, update, frozen: () => freeze > 0 };
}
