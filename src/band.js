import { PALETTE, hexToRgb } from "./palette.js";

const WHO_INDEX = { vocal: 2, guitar: 3, guitar1: 3, drum: 4, flex: 5 };
const CHAR_W = 16;
const CHAR_H = 24;
const DIRS = 4;
const FRAMES = 13;
const STORE = "lastsong.band.looks";
const FLEX_ROLES = ["guitar2", "bass", "keys"];

const HAIR_KEYS = [
  "BLACK", "HAIR_P1", "HAIR_P2", "METAL_DK", "STAGE_WOOD_DK",
  "BOX_KRAFT", "GUITAR_SUN", "SMOKE", "WHITE",
];
const SKIN_KEYS = ["SKIN", "SKIN_SH", "BOX_KRAFT", "GUITAR_SUN", "WHITE"];
const SHIRT_KEYS = [
  "SHIRT_P1", "SHIRT_P1_DK", "SHIRT_P2", "SHIRT_P2_DK",
  "GUITAR_RED", "DANGER_RED", "PEDAL_BLUE", "METAL_DK", "BLACK",
  "WHITE", "DRUM_WHITE", "TENSION_PINK", "GUITAR_SUN",
];
const GUITAR_KEYS = [
  "GUITAR_RED", "GUITAR_SUN", "BLACK", "METAL", "METAL_DK",
  "WHITE", "STAGE_WOOD", "PEDAL_BLUE", "DANGER_ORANGE", "BOX_KRAFT",
];

const looks = {};

function rgbDist(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function nearestKey(rgb, keys) {
  let best = keys[0];
  let bestD = Infinity;
  for (const key of keys) {
    const d = rgbDist(rgb, hexToRgb(PALETTE[key]));
    if (d < bestD) {
      bestD = d;
      best = key;
    }
  }
  return best;
}

function shadeKey(key, keys) {
  const rgb = hexToRgb(PALETTE[key]);
  const darker = [Math.max(0, rgb[0] - 40), Math.max(0, rgb[1] - 40), Math.max(0, rgb[2] - 40)];
  return nearestKey(darker, keys);
}

function avgRegion(data, w, h, x0, y0, x1, y1) {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 80) continue;
      const lum = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      if (lum < 18 || lum > 245) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n += 1;
    }
  }
  if (!n) return [160, 120, 90];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

function longHairFrom(data, w, h) {
  let dark = 0;
  let total = 0;
  for (const x of [2, 3, w - 4, w - 3]) {
    for (let y = Math.floor(h * 0.35); y < Math.floor(h * 0.72); y += 1) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 80) continue;
      total += 1;
      const lum = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
      if (lum < 90) dark += 1;
    }
  }
  return total > 8 && dark / total > 0.42;
}

export function lookFromImage(img, kind) {
  const w = 48;
  const h = 64;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const skin = avgRegion(data, w, h, 16, 14, 32, 30);
  const hair = avgRegion(data, w, h, 10, 2, 38, 16);
  const shirt = avgRegion(data, w, h, 12, 38, 36, 60);
  const guitar = avgRegion(data, w, h, 8, 44, 40, 62);
  const look = {
    hair: nearestKey(hair, HAIR_KEYS),
    skin: nearestKey(skin, SKIN_KEYS),
    skinDk: nearestKey(
      [Math.max(0, skin[0] - 36), Math.max(0, skin[1] - 40), Math.max(0, skin[2] - 40)],
      SKIN_KEYS,
    ),
    shirt: nearestKey(shirt, SHIRT_KEYS),
    longHair: longHairFrom(data, w, h),
  };
  look.shirtDk = shadeKey(look.shirt, SHIRT_KEYS);
  if (kind === "guitar1" || kind === "guitar2" || kind === "bass" || kind === "guitar" || kind === "axe") {
    look.guitar = nearestKey(guitar, GUITAR_KEYS);
    look.guitarHi = nearestKey(
      [Math.min(255, guitar[0] + 28), Math.min(255, guitar[1] + 22), Math.min(255, guitar[2] + 10)],
      GUITAR_KEYS,
    );
  }
  return look;
}

function copyToCanvas(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  return c;
}

function paintRgb(data, i, rgb) {
  data[i] = rgb[0];
  data[i + 1] = rgb[1];
  data[i + 2] = rgb[2];
  data[i + 3] = 255;
}

function isBlackish(r, g, b) {
  return r + g + b < 70;
}

function isWhiteish(r, g, b) {
  return r > 210 && g > 205 && b > 195;
}

function applyWho(orig, dest, who, look) {
  const idx = WHO_INDEX[who];
  if (idx == null || !look) return;
  const octx = orig.getContext("2d");
  const dctx = dest.getContext("2d");
  const hair = hexToRgb(PALETTE[look.hair]);
  const skin = hexToRgb(PALETTE[look.skin]);
  const skinDk = hexToRgb(PALETTE[look.skinDk || look.skin]);
  const shirt = hexToRgb(PALETTE[look.shirt]);
  const shirtDk = hexToRgb(PALETTE[look.shirtDk || look.shirt]);
  const p2y = 1 * DIRS * CHAR_H;

  for (let dir = 0; dir < DIRS; dir += 1) {
    for (let frame = 0; frame < FRAMES; frame += 1) {
      const sx = frame * CHAR_W;
      const sy = (idx * DIRS + dir) * CHAR_H;
      const src = octx.getImageData(sx, sy, CHAR_W, CHAR_H);
      const p2 = look.longHair ? octx.getImageData(sx, p2y + dir * CHAR_H, CHAR_W, CHAR_H) : null;
      const out = src;
      const d = out.data;
      const p = p2 ? p2.data : null;
      for (let y = 0; y < CHAR_H; y += 1) {
        for (let x = 0; x < CHAR_W; x += 1) {
          const i = (y * CHAR_W + x) * 4;
          if (p && p[i + 3] > 80 && y < 12 && (x <= 3 || x >= 12) && !isBlackish(p[i], p[i + 1], p[i + 2])) {
            paintRgb(d, i, hair);
            continue;
          }
          if (d[i + 3] < 80) continue;
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (isBlackish(r, g, b) || isWhiteish(r, g, b)) continue;
          if (y <= 8) {
            const lum = r * 0.3 + g * 0.59 + b * 0.11;
            paintRgb(d, i, lum > 118 ? (lum > 170 ? skin : skinDk) : hair);
          } else if (y <= 14) {
            const lum = r * 0.3 + g * 0.59 + b * 0.11;
            paintRgb(d, i, lum > 90 ? shirt : shirtDk);
          }
        }
      }
      dctx.putImageData(out, sx, sy);
    }
  }
}

function applyPropLook(orig, dest, sx, sy, sw, sh, look) {
  if (!look?.guitar) return;
  const octx = orig.getContext("2d");
  const dctx = dest.getContext("2d");
  const body = hexToRgb(PALETTE[look.guitar]);
  const hi = hexToRgb(PALETTE[look.guitarHi || look.guitar]);
  const img = octx.getImageData(sx, sy, sw, sh);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 80) continue;
    if (isBlackish(d[i], d[i + 1], d[i + 2]) || isWhiteish(d[i], d[i + 1], d[i + 2])) continue;
    const lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    paintRgb(d, i, lum > 140 ? hi : body);
  }
  dctx.putImageData(img, sx, sy);
}

function guitarLook() {
  return looks.guitar1 || looks.guitar;
}

function flexLook() {
  return looks.flex;
}

function flexRole() {
  const role = looks.flexRole || looks.flex?.role || "bass";
  return FLEX_ROLES.includes(role) ? role : "bass";
}

function rebuild(assets, originals) {
  const cctx = assets.chars.getContext("2d");
  cctx.imageSmoothingEnabled = false;
  cctx.clearRect(0, 0, assets.chars.width, assets.chars.height);
  cctx.drawImage(originals.chars, 0, 0);
  const pctx = assets.props.getContext("2d");
  pctx.imageSmoothingEnabled = false;
  pctx.clearRect(0, 0, assets.props.width, assets.props.height);
  pctx.drawImage(originals.props, 0, 0);
  applyWho(originals.chars, assets.chars, "vocal", looks.vocal);
  applyWho(originals.chars, assets.chars, "guitar", guitarLook());
  applyWho(originals.chars, assets.chars, "drum", looks.drum);
  applyWho(originals.chars, assets.chars, "flex", flexLook());
  applyPropLook(originals.props, assets.props, 0, 0, 16, 24, guitarLook());
  applyPropLook(originals.props, assets.props, 0, 48, 16, 24, guitarLook());
  const role = flexRole();
  if (role === "guitar2") applyPropLook(originals.props, assets.props, 96, 48, 16, 24, flexLook());
  if (role === "bass") applyPropLook(originals.props, assets.props, 96, 24, 16, 24, flexLook());
}

function save() {
  localStorage.setItem(STORE, JSON.stringify(looks));
}

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || "{}");
  } catch {
    return {};
  }
}

function adopt(src) {
  for (const k of Object.keys(looks)) delete looks[k];
  if (src.guitar && !src.guitar1) looks.guitar1 = src.guitar;
  Object.assign(looks, src);
  if (looks.guitar && !looks.guitar1) looks.guitar1 = looks.guitar;
  if (looks.flex?.role && !looks.flexRole) looks.flexRole = looks.flex.role;
  if (!looks.flexRole) looks.flexRole = "bass";
}

function refreshPreviews(root) {
  const flexMember = root.querySelector("#flex-member");
  if (flexMember) {
    const role = flexRole();
    flexMember.src = role === "keys" ? "assets/band/keyboardist.png" : role === "bass" ? "assets/band/bassist.png" : "assets/band/guitarist.png";
    flexMember.alt = role === "keys" ? "키보드" : role === "bass" ? "베이스" : "기타2";
  }
  for (const btn of root.querySelectorAll("[data-role]")) {
    btn.setAttribute("aria-pressed", btn.dataset.role === flexRole() ? "true" : "false");
  }
}

export function copySheet(img) {
  return copyToCanvas(img);
}

export function bandConfig() {
  return { flexRole: flexRole() };
}

export async function setupBand(assets, originals) {
  for (const key of Object.keys(looks)) delete looks[key];
  looks.flexRole = "bass";
  rebuild(assets, originals);

  const root = document.getElementById("band");
  if (!root) return looks;

  refreshPreviews(root);

  for (const input of root.querySelectorAll("input[type=file]")) {
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = await new Promise((resolve, reject) => {
        const im = new Image();
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = url;
      });
      URL.revokeObjectURL(url);
      const who = input.dataset.who;
      const kind = who === "flex" ? flexRole() : who;
      if (who === "flex") {
        looks.flex = lookFromImage(img, kind);
        looks.flex.role = flexRole();
      } else if (who === "guitar1") {
        looks.guitar1 = lookFromImage(img, "guitar1");
      } else {
        looks[who] = lookFromImage(img, who);
      }
      save();
      rebuild(assets, originals);
      refreshPreviews(root);
    });
  }

  for (const btn of root.querySelectorAll("[data-role]")) {
    btn.addEventListener("click", () => {
      looks.flexRole = btn.dataset.role;
      if (looks.flex) looks.flex.role = looks.flexRole;
      save();
      rebuild(assets, originals);
      refreshPreviews(root);
    });
  }

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    for (const k of Object.keys(looks)) delete looks[k];
    looks.flexRole = "bass";
    localStorage.removeItem(STORE);
    rebuild(assets, originals);
    refreshPreviews(root);
  });

  return looks;
}
