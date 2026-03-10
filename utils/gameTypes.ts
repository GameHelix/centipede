// ─── Core game types ───────────────────────────────────────────────────────

export type GamePhase =
  | "start"
  | "playing"
  | "paused"
  | "dying"
  | "levelComplete"
  | "gameOver";

export type Difficulty = "easy" | "medium" | "hard";

/** A mushroom cell on the grid */
export interface MushroomCell {
  health: number; // 1-4, removed when 0
  poisoned: boolean;
}

/**
 * One segment of the centipede.
 * Positions are integer grid columns/rows.
 * animProgress (0→1) interpolates from prev→current for smooth motion.
 */
export interface CentipedeSegment {
  col: number;
  row: number;
  dir: 1 | -1; // horizontal movement direction
  isPoisoned: boolean; // goes straight down when poisoned
  isHead: boolean;
  prevCol: number;
  prevRow: number;
  animProgress: number; // 0-1
  wrapped: boolean; // true when teleported (skip interpolation)
}

/** Player position in fractional grid units */
export interface Player {
  x: number; // center-x, 0..COLS
  y: number; // center-y, 0..ROWS
}

/** A player bullet */
export interface Bullet {
  id: number;
  x: number; // center-x in grid units
  y: number; // center-y in grid units
}

/** A flea that drops straight down */
export interface Flea {
  id: number;
  col: number; // column (integer)
  y: number; // center-y in grid units (fractional for smooth fall)
}

/** A spider that bounces around the player zone */
export interface Spider {
  id: number;
  x: number;
  y: number;
  dx: number; // grid-units / second
  dy: number;
  changeTimer: number; // seconds until next direction randomisation
}

/** A scorpion crossing the field, poisoning mushrooms */
export interface Scorpion {
  id: number;
  x: number; // center-x in grid units
  row: number; // integer row
  dir: 1 | -1;
}

/** A visual particle effect */
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0-1, decreases each frame
  color: string;
  size: number; // in grid units
}

/** Keyboard / touch input snapshot */
export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  fire: boolean;
  pause: boolean; // single-frame flag
}

/** Complete mutable game state (stored in useRef) */
export interface GameState {
  phase: GamePhase;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  difficulty: Difficulty;
  soundEnabled: boolean;
  musicEnabled: boolean;

  // Grid: mushrooms[row][col]
  mushrooms: (MushroomCell | null)[][];

  player: Player;

  // Array of independent centipede chains
  centipedes: CentipedeSegment[][];

  bullets: Bullet[];
  bulletNextId: number;
  bulletCooldown: number; // ms before next bullet allowed

  fleas: Flea[];
  fleaNextId: number;
  fleaSpawnTimer: number; // ms

  spiders: Spider[];
  spiderNextId: number;
  spiderSpawnTimer: number; // ms

  scorpions: Scorpion[];
  scorpionNextId: number;
  scorpionSpawnTimer: number; // ms

  particles: Particle[];
  particleNextId: number;

  tickTimer: number; // ms until next centipede tick
  tickInterval: number; // ms between ticks (difficulty/level dependent)

  dyingTimer: number; // ms countdown on player death
  levelCompleteTimer: number; // ms countdown before next level

  flashTimer: number; // screen flash duration ms
  flashColor: string;

  prevPause: boolean; // tracks previous pause key state (edge detection)
}
