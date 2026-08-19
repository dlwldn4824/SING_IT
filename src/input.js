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

const pointer = { x: 0, y: 0, down: false, clicked: false, released: false };

function toGame(e, el) {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return { x: 0, y: 0 };
  return {
    x: Math.max(0, Math.min(319, Math.floor((e.clientX - r.left) * 320 / r.width))),
    y: Math.max(0, Math.min(179, Math.floor((e.clientY - r.top) * 180 / r.height))),
  };
}

function bindPointer() {
  const el = document.getElementById("game");
  if (!el) return;
  el.addEventListener("pointerdown", (e) => {
    const p = toGame(e, el);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = true;
    pointer.clicked = true;
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  el.addEventListener("pointermove", (e) => {
    const p = toGame(e, el);
    pointer.x = p.x;
    pointer.y = p.y;
  });
  el.addEventListener("pointerup", (e) => {
    const p = toGame(e, el);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = false;
    pointer.released = true;
  });
  el.addEventListener("pointercancel", () => {
    pointer.down = false;
    pointer.released = true;
  });
}

bindPointer();

export function getPointer() {
  return pointer;
}

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
  pointer.clicked = false;
  pointer.released = false;
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
