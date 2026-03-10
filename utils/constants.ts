// ─── Grid ──────────────────────────────────────────────────────────────────
export const COLS = 30;
export const ROWS = 26;
export const PLAYER_ROWS = 5; // bottom rows reserved for player movement
export const PLAYER_ZONE_TOP = ROWS - PLAYER_ROWS; // row index of the boundary

// ─── Game parameters ───────────────────────────────────────────────────────
export const INITIAL_LIVES = 3;
export const CENTIPEDE_START_LENGTH = 12;
export const MAX_INITIAL_MUSHROOMS = 28;
export const MAX_BULLETS = 1; // max bullets on screen at once

// ─── Speeds (grid units / second) ──────────────────────────────────────────
export const PLAYER_SPEED = 15;
export const BULLET_SPEED = 28;

export const FLEA_SPEED: Record<string, number> = {
  easy: 7,
  medium: 9,
  hard: 13,
};

export const SPIDER_SPEED: Record<string, number> = {
  easy: 5,
  medium: 7,
  hard: 10,
};

export const SCORPION_SPEED: Record<string, number> = {
  easy: 5,
  medium: 7,
  hard: 9,
};

// ─── Centipede tick intervals (ms per grid step) ───────────────────────────
// Index = level - 1, clamped at last entry
export const TICK_INTERVALS: Record<string, number[]> = {
  easy: [380, 350, 320, 295, 270, 250, 230, 215, 200, 185],
  medium: [260, 235, 210, 190, 170, 155, 140, 128, 116, 106],
  hard: [180, 158, 138, 120, 105, 92, 81, 72, 64, 57],
};

// ─── Spawn timers (ms) ─────────────────────────────────────────────────────
export const FLEA_SPAWN_INTERVAL = 9000;
export const SPIDER_SPAWN_INTERVAL = 13000;
export const SCORPION_SPAWN_INTERVAL = 22000;

// ─── Mushrooms ─────────────────────────────────────────────────────────────
export const MUSHROOM_MAX_HEALTH = 4;

// ─── Scoring ───────────────────────────────────────────────────────────────
export const SCORE_CENTIPEDE_HEAD = 100;
export const SCORE_CENTIPEDE_BODY = 10;
export const SCORE_FLEA = 200;
export const SCORE_SPIDER_CLOSE = 900;
export const SCORE_SPIDER_MED = 600;
export const SCORE_SPIDER_FAR = 300;
export const SCORE_SCORPION = 1000;
export const SCORE_MUSHROOM = 1;

// ─── Bullet cooldown (ms) ──────────────────────────────────────────────────
export const BULLET_FIRE_COOLDOWN = 180; // min ms between shots

// ─── Colors ────────────────────────────────────────────────────────────────
export const COLORS = {
  background: "#05050f",
  gridLine: "rgba(0,255,136,0.025)",

  mushroomFull: "#cc44ff",
  mushroomHigh: "#aa33dd",
  mushroomMid: "#882299",
  mushroomLow: "#661177",
  mushroomPoisoned: "#ff4422",
  mushroomPoisonedDark: "#aa2211",

  centipedeHead: "#00ff88",
  centipedeBody: "#00cc66",
  centipedeBodyDark: "#009944",
  centipedeEye: "#ffffff",

  player: "#ffcc00",
  playerGlow: "#ff8800",
  playerCannon: "#ffee88",

  bullet: "#ffffff",
  bulletGlow: "#ffffaa",

  flea: "#ff88cc",
  fleaGlow: "#ff44aa",

  spider: "#ff8800",
  spiderGlow: "#ff6600",

  scorpion: "#ffff44",
  scorpionGlow: "#ffcc00",

  playerZoneFill: "rgba(0,200,255,0.03)",
  playerZoneLine: "rgba(0,200,255,0.22)",

  particleColors: ["#ff8800", "#ff4400", "#ffcc00", "#ff6600", "#ffffff", "#00ff88"],
};

// ─── Timers ────────────────────────────────────────────────────────────────
export const DYING_DURATION = 1500; // ms player "dying" phase
export const LEVEL_COMPLETE_DURATION = 2000; // ms between levels
export const INVINCIBLE_DURATION = 2500; // ms after respawn
