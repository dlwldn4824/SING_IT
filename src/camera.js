export const W = 320;
export const H = 180;

export function makeCamera(canvas) {
  const ctx = canvas.getContext("2d");
  let scale = 1;
  let shakeX = 0;
  let shakeY = 0;
  let shakeTime = 0;
  let shakeMag = 0;

  function getAvailableHeight() {
    const parent = canvas.parentElement;
    if (!parent) return window.innerHeight;

    const siblings = [...parent.children].filter((element) => element !== canvas);
    const visibleSiblings = siblings.filter((element) => element.getBoundingClientRect().height > 0);
    const reservedHeight = visibleSiblings.reduce(
      (total, element) => total + Math.ceil(element.getBoundingClientRect().height),
      0,
    );
    const style = getComputedStyle(parent);
    const gap = Number.parseFloat(style.rowGap) || 0;
    const padding = (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
    return parent.clientHeight - reservedHeight - gap * visibleSiblings.length - padding;
  }

  function resize() {
    const maxS = Math.max(1, Math.floor(Math.min(window.innerWidth / W, getAvailableHeight() / H)));
    scale = maxS;
    canvas.width = W * scale;
    canvas.height = H * scale;
    canvas.style.width = `${W * scale}px`;
    canvas.style.height = `${H * scale}px`;
    ctx.imageSmoothingEnabled = false;
  }

  function shake(mag = 1, time = 0.12) {
    shakeMag = Math.max(shakeMag, mag);
    shakeTime = Math.max(shakeTime, time);
  }

  function update(dt) {
    if (shakeTime > 0) {
      shakeTime -= dt;
      const m = shakeMag * (shakeTime > 0 ? 1 : 0);
      shakeX = Math.round((Math.random() * 2 - 1) * m);
      shakeY = Math.round((Math.random() * 2 - 1) * m);
      if (shakeTime <= 0) {
        shakeX = 0;
        shakeY = 0;
        shakeMag = 0;
      }
    }
  }

  function begin() {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(shakeX, shakeY);
    return ctx;
  }

  function end() {
    ctx.restore();
  }

  window.addEventListener("resize", resize);
  const layoutObserver = new ResizeObserver(resize);
  for (const sibling of canvas.parentElement?.children || []) {
    if (sibling !== canvas) layoutObserver.observe(sibling);
  }
  resize();
  return { ctx, resize, shake, update, begin, end, getScale: () => scale };
}
