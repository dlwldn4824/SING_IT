export const PALETTE = {
  // BACKGROUND — dark, low saturation
  BG_NIGHT: "#1a1520",
  BG_AUDIENCE: "#2a2433",
  BG_RAIL: "#3d3548",
  BG_SHADOW: "#0e0b12",

  // STAGE — brown / gray
  STAGE_WOOD: "#6b4a32",
  STAGE_WOOD_DK: "#4a3224",
  STAGE_WOOD_LT: "#8a6244",
  METAL: "#6e6a68",
  METAL_DK: "#3a3836",

  // CHARACTER — bright, readable
  SKIN: "#f0c8a0",
  SKIN_SH: "#c4926c",
  HAIR_P1: "#1c1410",
  HAIR_P2: "#6a3a22",
  SHIRT_P1: "#3a5cff",
  SHIRT_P1_DK: "#2438b0",
  SHIRT_P2: "#e8c84a",
  SHIRT_P2_DK: "#b09020",
  WHITE: "#f4f0e8",
  BLACK: "#141210",

  // INTERACTABLE — high value
  GUITAR_RED: "#c43c3c",
  GUITAR_SUN: "#d4a04a",
  MIC_SILVER: "#d0d4d8",
  DRUM_WHITE: "#e8e0d4",
  BOX_KRAFT: "#c4a06a",
  PEDAL_BLUE: "#3c8cdc",

  // DANGER
  DANGER_RED: "#f03030",
  DANGER_ORANGE: "#f07820",
  SPARK_YEL: "#ffe040",
  SMOKE: "#8a8490",

  // SUCCESS
  SUCCESS_GOLD: "#ffe86a",
  SUCCESS_STAR: "#fff6c8",
  TENSION_PINK: "#ff5a8a",
};

export const ROLE = {
  BACKGROUND: ["BG_NIGHT", "BG_AUDIENCE", "BG_RAIL", "BG_SHADOW"],
  STAGE: ["STAGE_WOOD", "STAGE_WOOD_DK", "STAGE_WOOD_LT", "METAL", "METAL_DK"],
  CHARACTER: [
    "SKIN", "SKIN_SH", "HAIR_P1", "HAIR_P2",
    "SHIRT_P1", "SHIRT_P1_DK", "SHIRT_P2", "SHIRT_P2_DK", "WHITE", "BLACK",
  ],
  INTERACTABLE: [
    "GUITAR_RED", "GUITAR_SUN", "MIC_SILVER", "DRUM_WHITE", "BOX_KRAFT", "PEDAL_BLUE",
  ],
  DANGER: ["DANGER_RED", "DANGER_ORANGE", "SPARK_YEL", "SMOKE"],
  SUCCESS: ["SUCCESS_GOLD", "SUCCESS_STAR", "TENSION_PINK"],
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
