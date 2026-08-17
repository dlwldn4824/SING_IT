const down = new Set();
const pressed = new Set();

const MAP = {
  KeyW: "p1u", KeyA: "p1l", KeyS: "p1d", KeyD: "p1r",
  KeyE: "p1use", KeyQ: "p1drop",
  ArrowUp: "p2u", ArrowLeft: "p2l", ArrowDown: "p2d", ArrowRight: "p2r",
  Enter: "p2use", ShiftLeft: "p2drop", ShiftRight: "p2drop",
  Space: "start", KeyR: "restart", KeyM: "mute",
};

window.addEventListener("keydown", (e) => {
  const k = MAP[e.code];
  if (!k) return;
  e.preventDefault();
  if (!down.has(k)) pressed.add(k);
  down.add(k);
});

window.addEventListener("keyup", (e) => {
  const k = MAP[e.code];
  if (!k) return;
  down.delete(k);
});

export function held(k) {
  return down.has(k);
}

export function tap(k) {
  if (pressed.has(k)) {
    pressed.delete(k);
    return true;
  }
  return false;
}

export function endFrame() {
  pressed.clear();
}

export function axis(prefix) {
  let x = 0;
  let y = 0;
  if (held(`${prefix}l`)) x -= 1;
  if (held(`${prefix}r`)) x += 1;
  if (held(`${prefix}u`)) y -= 1;
  if (held(`${prefix}d`)) y += 1;
  if (x && y) {
    const n = Math.SQRT1_2;
    x *= n;
    y *= n;
  }
  return { x, y };
}
