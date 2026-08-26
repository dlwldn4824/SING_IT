import { makeCamera } from "./camera.js";
import { endFrame } from "./input.js";
import { createJuice } from "./juice.js";
import { createAudio } from "./audio.js";
import { createGame } from "./game.js?v=five-members";
import { copySheet, setupBand } from "./band.js";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

const canvas = document.getElementById("game");
const camera = makeCamera(canvas);
const juice = createJuice();
const audio = createAudio();

const charsImg = await loadImage("assets/sprites/chars.png");
const propsImg = await loadImage("assets/sprites/props.png");
const originals = {
  chars: copySheet(charsImg),
  props: copySheet(propsImg),
};
const assets = {
  chars: copySheet(charsImg),
  tiles: await loadImage("assets/sprites/tiles.png"),
  props: copySheet(propsImg),
  fx: await loadImage("assets/sprites/fx.png"),
  crowd: await loadImage("assets/sprites/crowd.png"),
};

await setupBand(assets, originals);

const game = createGame(assets, camera, juice, audio);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  camera.update(dt);
  game.update(dt);
  document.body.classList.toggle("is-playing", game.getState().phase !== "title");
  const ctx = camera.begin();
  game.draw(ctx);
  camera.end();
  endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
