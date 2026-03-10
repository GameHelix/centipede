/**
 * Pure game-logic functions — no React, no canvas.
 * The game state is mutated in-place for performance at 60 fps.
 */
import {
  COLS,
  ROWS,
  PLAYER_ROWS,
  PLAYER_ZONE_TOP,
  INITIAL_LIVES,
  CENTIPEDE_START_LENGTH,
  MAX_INITIAL_MUSHROOMS,
  MUSHROOM_MAX_HEALTH,
  PLAYER_SPEED,
  BULLET_SPEED,
  FLEA_SPEED,
  SPIDER_SPEED,
  SCORPION_SPEED,
  TICK_INTERVALS,
  FLEA_SPAWN_INTERVAL,
  SPIDER_SPAWN_INTERVAL,
  SCORPION_SPAWN_INTERVAL,
  BULLET_FIRE_COOLDOWN,
  DYING_DURATION,
  LEVEL_COMPLETE_DURATION,
  INVINCIBLE_DURATION,
  SCORE_CENTIPEDE_HEAD,
  SCORE_CENTIPEDE_BODY,
  SCORE_FLEA,
  SCORE_SPIDER_CLOSE,
  SCORE_SPIDER_MED,
  SCORE_SPIDER_FAR,
  SCORE_SCORPION,
  SCORE_MUSHROOM,
  COLORS,
} from "./constants";
import type {
  GameState,
  InputState,
  Difficulty,
  CentipedeSegment,
  MushroomCell,
  Particle,
  Player,
  Spider,
} from "./gameTypes";

// ─── Helpers ───────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
function dist2(ax: number, ay: number, bx: number, by: number) {
  return (ax - bx) ** 2 + (ay - by) ** 2;
}
function getTickInterval(difficulty: Difficulty, level: number): number {
  const arr = TICK_INTERVALS[difficulty];
  return arr[Math.min(level - 1, arr.length - 1)];
}

// ─── Initialisation ────────────────────────────────────────────────────────

export function createEmptyInput(): InputState {
  return { left: false, right: false, up: false, down: false, fire: false, pause: false };
}

function buildMushrooms(level: number): (MushroomCell | null)[][] {
  const grid: (MushroomCell | null)[][] = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(null)
  );
  // Extra mushrooms with each level (up to max)
  const count = Math.min(MAX_INITIAL_MUSHROOMS + (level - 1) * 4, 60);
  let placed = 0;
  let attempts = 0;
  while (placed < count && attempts < 2000) {
    attempts++;
    const col = randInt(0, COLS - 1);
    // Avoid first row and bottom player zone
    const row = randInt(1, PLAYER_ZONE_TOP - 1);
    if (!grid[row][col]) {
      grid[row][col] = { health: MUSHROOM_MAX_HEALTH, poisoned: false };
      placed++;
    }
  }
  return grid;
}

function buildCentipede(level: number): CentipedeSegment[][] {
  // One centipede chain; extra levels add a second short chain
  const chains: CentipedeSegment[][] = [];
  const mainLength = Math.max(4, CENTIPEDE_START_LENGTH - (level - 1));
  const startCol = 0;
  const chain: CentipedeSegment[] = [];
  for (let i = 0; i < mainLength; i++) {
    chain.push({
      col: startCol - i,
      row: 0,
      dir: 1,
      isPoisoned: false,
      isHead: i === 0,
      prevCol: startCol - i,
      prevRow: 0,
      animProgress: 1,
      wrapped: false,
    });
  }
  chains.push(chain);

  // From level 2 onwards, add a second short chain entering mid-field
  if (level >= 2) {
    const extraLength = Math.min(level - 1, 6);
    const chain2: CentipedeSegment[] = [];
    for (let i = 0; i < extraLength; i++) {
      chain2.push({
        col: COLS - 1 + i,
        row: Math.floor(ROWS / 3),
        dir: -1,
        isPoisoned: false,
        isHead: i === 0,
        prevCol: COLS - 1 + i,
        prevRow: Math.floor(ROWS / 3),
        animProgress: 1,
        wrapped: false,
      });
    }
    chains.push(chain2);
  }
  return chains;
}

export function initGameState(difficulty: Difficulty): GameState {
  const highScore = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("centipede-hi") ?? "0", 10)
    : 0;

  return {
    phase: "start",
    score: 0,
    highScore,
    lives: INITIAL_LIVES,
    level: 1,
    difficulty,
    soundEnabled: true,
    musicEnabled: false,

    mushrooms: buildMushrooms(1),
    player: { x: COLS / 2, y: ROWS - 2.5 },

    centipedes: buildCentipede(1),

    bullets: [],
    bulletNextId: 0,
    bulletCooldown: 0,

    fleas: [],
    fleaNextId: 0,
    fleaSpawnTimer: FLEA_SPAWN_INTERVAL,

    spiders: [],
    spiderNextId: 0,
    spiderSpawnTimer: SPIDER_SPAWN_INTERVAL,

    scorpions: [],
    scorpionNextId: 0,
    scorpionSpawnTimer: SCORPION_SPAWN_INTERVAL,

    particles: [],
    particleNextId: 0,

    tickTimer: 0,
    tickInterval: getTickInterval(difficulty, 1),

    dyingTimer: 0,
    levelCompleteTimer: 0,

    flashTimer: 0,
    flashColor: "#ffffff",

    prevPause: false,
  };
}

// ─── Particles ─────────────────────────────────────────────────────────────

function spawnParticles(state: GameState, x: number, y: number, color: string, count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1.5, 5);
    state.particles.push({
      id: state.particleNextId++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      color,
      size: rand(0.08, 0.22),
    });
  }
}

// ─── Centipede movement ────────────────────────────────────────────────────

function calcHeadNext(
  head: CentipedeSegment,
  mushrooms: (MushroomCell | null)[][]
): { col: number; row: number; dir: 1 | -1; isPoisoned: boolean; wrapped: boolean } {
  if (head.isPoisoned) {
    // Go straight down, ignoring mushrooms/walls
    const nextRow = head.row + 1;
    if (nextRow >= ROWS) {
      return { col: head.col, row: 0, dir: head.dir, isPoisoned: false, wrapped: true };
    }
    return { col: head.col, row: nextRow, dir: head.dir, isPoisoned: true, wrapped: false };
  }

  const nextCol = head.col + head.dir;
  const hitWall = nextCol < 0 || nextCol >= COLS;
  const hitMushroom = !hitWall && !!mushrooms[head.row]?.[nextCol];

  if (hitWall || hitMushroom) {
    // Check if blocking mushroom is poisoned
    if (hitMushroom && mushrooms[head.row]?.[nextCol]?.poisoned) {
      const nextRow = head.row + 1;
      if (nextRow >= ROWS) {
        return { col: head.col, row: 0, dir: head.dir === 1 ? -1 : 1, isPoisoned: false, wrapped: true };
      }
      return { col: head.col, row: nextRow, dir: head.dir, isPoisoned: true, wrapped: false };
    }
    // Normal turn: move down one row, reverse direction
    const newDir: 1 | -1 = head.dir === 1 ? -1 : 1;
    const nextRow = head.row + 1;
    if (nextRow >= ROWS) {
      // Wrap to top
      return { col: newDir === 1 ? 0 : COLS - 1, row: 0, dir: newDir, isPoisoned: false, wrapped: true };
    }
    return { col: head.col, row: nextRow, dir: newDir, isPoisoned: false, wrapped: false };
  }

  // Normal horizontal step
  return { col: nextCol, row: head.row, dir: head.dir, isPoisoned: false, wrapped: false };
}

function tickChain(chain: CentipedeSegment[], mushrooms: (MushroomCell | null)[][]): void {
  if (chain.length === 0) return;
  // Save old positions before mutating
  const old = chain.map((s) => ({ col: s.col, row: s.row, dir: s.dir, isPoisoned: s.isPoisoned }));

  // Move head
  const next = calcHeadNext(chain[0], mushrooms);
  chain[0].prevCol = chain[0].col;
  chain[0].prevRow = chain[0].row;
  chain[0].col = next.col;
  chain[0].row = next.row;
  chain[0].dir = next.dir;
  chain[0].isPoisoned = next.isPoisoned;
  chain[0].animProgress = 0;
  chain[0].wrapped = next.wrapped;

  // Move body (each takes previous segment's old position)
  for (let i = 1; i < chain.length; i++) {
    chain[i].prevCol = chain[i].col;
    chain[i].prevRow = chain[i].row;
    chain[i].col = old[i - 1].col;
    chain[i].row = old[i - 1].row;
    chain[i].dir = old[i - 1].dir;
    chain[i].isPoisoned = old[i - 1].isPoisoned;
    chain[i].animProgress = 0;
    // Detect wrap (large row jump)
    chain[i].wrapped = Math.abs(chain[i].row - chain[i].prevRow) > 5;
  }
}

// ─── Main update ───────────────────────────────────────────────────────────

export function updateGame(
  state: GameState,
  deltaMs: number,
  input: InputState,
  onUIChange: () => void,
  playSound: (name: string) => void
): void {
  const dt = deltaMs / 1000; // seconds

  // ── Pause toggle (edge-triggered) ────────────────────────────────────────
  if (input.pause && !state.prevPause) {
    if (state.phase === "playing") {
      state.phase = "paused";
      onUIChange();
    } else if (state.phase === "paused") {
      state.phase = "playing";
      onUIChange();
    }
  }
  state.prevPause = input.pause;

  if (state.phase !== "playing") {
    // Advance level-complete or dying timers even when not fully playing
    if (state.phase === "dying") {
      state.dyingTimer -= deltaMs;
      updateParticlesOnly(state, dt);
      if (state.dyingTimer <= 0) {
        if (state.lives <= 0) {
          state.phase = "gameOver";
          if (state.score > state.highScore) {
            state.highScore = state.score;
            if (typeof window !== "undefined") {
              localStorage.setItem("centipede-hi", String(state.score));
            }
          }
        } else {
          respawnPlayer(state);
        }
        onUIChange();
      }
    }
    if (state.phase === "levelComplete") {
      state.levelCompleteTimer -= deltaMs;
      updateParticlesOnly(state, dt);
      if (state.levelCompleteTimer <= 0) {
        startNextLevel(state);
        onUIChange();
      }
    }
    return;
  }

  // ── Player movement ───────────────────────────────────────────────────────
  const { player } = state;
  const halfW = 0.45;
  const halfH = 0.45;
  if (input.left)  player.x = Math.max(halfW, player.x - PLAYER_SPEED * dt);
  if (input.right) player.x = Math.min(COLS - halfW, player.x + PLAYER_SPEED * dt);
  if (input.up)    player.y = Math.max(PLAYER_ZONE_TOP + halfH, player.y - PLAYER_SPEED * dt);
  if (input.down)  player.y = Math.min(ROWS - halfH, player.y + PLAYER_SPEED * dt);

  // ── Firing ────────────────────────────────────────────────────────────────
  state.bulletCooldown = Math.max(0, state.bulletCooldown - deltaMs);
  if (input.fire && state.bullets.length < 1 && state.bulletCooldown <= 0) {
    state.bullets.push({ id: state.bulletNextId++, x: player.x, y: player.y - 0.5 });
    state.bulletCooldown = BULLET_FIRE_COOLDOWN;
    playSound("shoot");
  }

  // ── Bullet movement ───────────────────────────────────────────────────────
  for (let i = state.bullets.length - 1; i >= 0; i--) {
    state.bullets[i].y -= BULLET_SPEED * dt;
    if (state.bullets[i].y < -1) {
      state.bullets.splice(i, 1);
    }
  }

  // ── Centipede animation + tick ────────────────────────────────────────────
  state.tickTimer -= deltaMs;
  const doTick = state.tickTimer <= 0;
  if (doTick) state.tickTimer = state.tickInterval;

  for (const chain of state.centipedes) {
    // Advance animation
    for (const seg of chain) {
      if (seg.animProgress < 1) {
        seg.animProgress = Math.min(1, seg.animProgress + deltaMs / state.tickInterval);
      }
    }
    if (doTick) tickChain(chain, state.mushrooms);
  }

  // ── Flea spawn + movement ─────────────────────────────────────────────────
  state.fleaSpawnTimer -= deltaMs;
  if (state.fleaSpawnTimer <= 0) {
    // Only spawn if player zone is sparse in mushrooms
    let mushroomsInZone = 0;
    for (let r = PLAYER_ZONE_TOP; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (state.mushrooms[r][c]) mushroomsInZone++;
      }
    }
    if (mushroomsInZone < 5) {
      state.fleas.push({
        id: state.fleaNextId++,
        col: randInt(0, COLS - 1),
        y: -0.5,
      });
    }
    state.fleaSpawnTimer = FLEA_SPAWN_INTERVAL;
  }
  const fleaSpd = FLEA_SPEED[state.difficulty];
  for (let i = state.fleas.length - 1; i >= 0; i--) {
    const flea = state.fleas[i];
    flea.y += fleaSpd * dt;
    // Occasionally drop a mushroom
    const row = Math.floor(flea.y);
    if (row >= 0 && row < ROWS && !state.mushrooms[row]?.[flea.col] && Math.random() < 0.07) {
      state.mushrooms[row][flea.col] = { health: MUSHROOM_MAX_HEALTH, poisoned: false };
    }
    if (flea.y > ROWS + 1) state.fleas.splice(i, 1);
  }

  // ── Spider spawn + movement ───────────────────────────────────────────────
  state.spiderSpawnTimer -= deltaMs;
  if (state.spiderSpawnTimer <= 0 && state.spiders.length < 1) {
    const spd = SPIDER_SPEED[state.difficulty];
    state.spiders.push({
      id: state.spiderNextId++,
      x: Math.random() < 0.5 ? 1 : COLS - 1,
      y: PLAYER_ZONE_TOP + 1 + Math.random() * (PLAYER_ROWS - 2),
      dx: (Math.random() < 0.5 ? 1 : -1) * spd,
      dy: (Math.random() < 0.5 ? 1 : -1) * spd * 0.7,
      changeTimer: rand(0.8, 2.0),
    });
    state.spiderSpawnTimer = SPIDER_SPAWN_INTERVAL;
  }
  const spiderSpd = SPIDER_SPEED[state.difficulty];
  for (let i = state.spiders.length - 1; i >= 0; i--) {
    const sp = state.spiders[i];
    sp.x += sp.dx * dt;
    sp.y += sp.dy * dt;
    sp.changeTimer -= dt;

    // Bounce off walls and zone boundaries
    if (sp.x < 0.5 || sp.x > COLS - 0.5) {
      sp.dx *= -1;
      sp.x = Math.max(0.5, Math.min(COLS - 0.5, sp.x));
    }
    if (sp.y < PLAYER_ZONE_TOP + 0.5 || sp.y > ROWS - 0.5) {
      sp.dy *= -1;
      sp.y = Math.max(PLAYER_ZONE_TOP + 0.5, Math.min(ROWS - 0.5, sp.y));
    }
    // Randomly change direction
    if (sp.changeTimer <= 0) {
      const angle = rand(0, Math.PI * 2);
      sp.dx = Math.cos(angle) * spiderSpd;
      sp.dy = Math.sin(angle) * spiderSpd * 0.7;
      sp.changeTimer = rand(0.6, 1.8);
    }
    // Spider destroys mushrooms it overlaps
    const sc = Math.round(sp.x - 0.5);
    const sr = Math.round(sp.y - 0.5);
    if (sc >= 0 && sc < COLS && sr >= PLAYER_ZONE_TOP && sr < ROWS && state.mushrooms[sr]?.[sc]) {
      state.mushrooms[sr][sc] = null;
    }
    // Remove if off-screen (shouldn't happen with bouncing, but safety)
    if (sp.x < -2 || sp.x > COLS + 2) state.spiders.splice(i, 1);
  }

  // ── Scorpion spawn + movement ─────────────────────────────────────────────
  state.scorpionSpawnTimer -= deltaMs;
  if (state.scorpionSpawnTimer <= 0 && state.scorpions.length < 1) {
    const goRight = Math.random() < 0.5;
    const row = randInt(2, PLAYER_ZONE_TOP - 3);
    state.scorpions.push({
      id: state.scorpionNextId++,
      x: goRight ? -1 : COLS + 1,
      row,
      dir: goRight ? 1 : -1,
    });
    state.scorpionSpawnTimer = SCORPION_SPAWN_INTERVAL;
  }
  const scorpionSpd = SCORPION_SPEED[state.difficulty];
  for (let i = state.scorpions.length - 1; i >= 0; i--) {
    const sc = state.scorpions[i];
    sc.x += sc.dir * scorpionSpd * dt;
    // Poison mushrooms it passes over
    const col = Math.round(sc.x - 0.5);
    if (col >= 0 && col < COLS && state.mushrooms[sc.row]?.[col]) {
      const m = state.mushrooms[sc.row][col];
      if (m) m.poisoned = true;
    }
    if (sc.x < -2 || sc.x > COLS + 2) state.scorpions.splice(i, 1);
  }

  // ── Invincibility timer ───────────────────────────────────────────────────
  const playerExt2 = state.player as Player & { invincibleTimer: number };
  if (!playerExt2.invincibleTimer) playerExt2.invincibleTimer = 0;
  if (playerExt2.invincibleTimer > 0) {
    playerExt2.invincibleTimer = Math.max(0, playerExt2.invincibleTimer - deltaMs);
  }

  // ── Collision detection ────────────────────────────────────────────────────
  checkCollisions(state, onUIChange, playSound);

  // ── Particles ─────────────────────────────────────────────────────────────
  updateParticlesOnly(state, dt);

  // ── Flash timer ───────────────────────────────────────────────────────────
  state.flashTimer = Math.max(0, state.flashTimer - deltaMs);

  // ── Level complete check ───────────────────────────────────────────────────
  const totalSegs = state.centipedes.reduce((s, c) => s + c.length, 0);
  if (totalSegs === 0 && state.phase === "playing") {
    state.phase = "levelComplete";
    state.levelCompleteTimer = LEVEL_COMPLETE_DURATION;
    playSound("levelComplete");
    onUIChange();
  }
}

// ─── Collision detection ───────────────────────────────────────────────────

function checkCollisions(
  state: GameState,
  onUIChange: () => void,
  playSound: (name: string) => void
) {
  const { bullets, mushrooms, centipedes, fleas, spiders, scorpions, player } = state;

  // ── Bullet vs mushroom ──────────────────────────────────────────────────
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    const col = Math.floor(b.x);
    const row = Math.floor(b.y);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS && mushrooms[row]?.[col]) {
      const m = mushrooms[row][col]!;
      m.health--;
      if (m.health <= 0) {
        mushrooms[row][col] = null;
        state.score += SCORE_MUSHROOM;
        spawnParticles(state, col + 0.5, row + 0.5, COLORS.mushroomFull, 6);
        playSound("mushroomDestroy");
      } else {
        playSound("mushroomHit");
      }
      bullets.splice(bi, 1);
      continue;
    }

    // ── Bullet vs centipede ──────────────────────────────────────────────
    let bulletUsed = false;
    for (let ci = 0; ci < centipedes.length && !bulletUsed; ci++) {
      const chain = centipedes[ci];
      for (let si = 0; si < chain.length && !bulletUsed; si++) {
        const seg = chain[si];
        const t = easeInOut(Math.min(1, seg.animProgress));
        const sx = lerp(seg.prevCol, seg.col, seg.wrapped ? 1 : t) + 0.5;
        const sy = lerp(seg.prevRow, seg.row, seg.wrapped ? 1 : t) + 0.5;
        if (dist2(b.x, b.y, sx, sy) < 0.5 * 0.5) {
          // Hit!
          const isHead = seg.isHead;
          state.score += isHead ? SCORE_CENTIPEDE_HEAD : SCORE_CENTIPEDE_BODY;
          spawnParticles(state, sx, sy, isHead ? COLORS.centipedeHead : COLORS.centipedeBody, isHead ? 12 : 8);
          playSound(isHead ? "centipedeHead" : "centipedeBody");

          // Place mushroom at integer position
          const mc = Math.round(sx - 0.5);
          const mr = Math.round(sy - 0.5);
          if (mc >= 0 && mc < COLS && mr >= 0 && mr < ROWS && !mushrooms[mr][mc]) {
            mushrooms[mr][mc] = { health: MUSHROOM_MAX_HEALTH, poisoned: false };
          }

          // Split the chain
          const before = chain.slice(0, si); // segments before the hit
          const after = chain.slice(si + 1); // segments after the hit

          // Mark new heads
          if (before.length > 0) before[0].isHead = true;
          if (after.length > 0) after[0].isHead = true;

          // Replace chain list
          centipedes.splice(ci, 1);
          if (after.length > 0) centipedes.splice(ci, 0, after);
          if (before.length > 0) centipedes.splice(ci, 0, before);

          bullets.splice(bi, 1);
          bulletUsed = true;
          onUIChange(); // score changed
        }
      }
    }
    if (bulletUsed) continue;

    // ── Bullet vs flea ──────────────────────────────────────────────────
    for (let fi = fleas.length - 1; fi >= 0; fi--) {
      const fl = fleas[fi];
      if (Math.abs(b.x - (fl.col + 0.5)) < 0.55 && Math.abs(b.y - fl.y) < 0.55) {
        state.score += SCORE_FLEA;
        spawnParticles(state, fl.col + 0.5, fl.y, COLORS.flea, 10);
        playSound("fleaDie");
        fleas.splice(fi, 1);
        bullets.splice(bi, 1);
        bulletUsed = true;
        onUIChange();
        break;
      }
    }
    if (bulletUsed) continue;

    // ── Bullet vs spider ─────────────────────────────────────────────────
    for (let spi = spiders.length - 1; spi >= 0; spi--) {
      const sp = spiders[spi];
      if (dist2(b.x, b.y, sp.x, sp.y) < 0.7 * 0.7) {
        // Score depends on distance from player
        const d = Math.abs(sp.x - player.x);
        const pts = d < 3 ? SCORE_SPIDER_CLOSE : d < 8 ? SCORE_SPIDER_MED : SCORE_SPIDER_FAR;
        state.score += pts;
        spawnParticles(state, sp.x, sp.y, COLORS.spider, 12);
        playSound("spiderDie");
        spiders.splice(spi, 1);
        bullets.splice(bi, 1);
        bulletUsed = true;
        onUIChange();
        break;
      }
    }
    if (bulletUsed) continue;

    // ── Bullet vs scorpion ───────────────────────────────────────────────
    for (let sci = scorpions.length - 1; sci >= 0; sci--) {
      const sc = scorpions[sci];
      if (Math.abs(b.x - sc.x) < 0.9 && Math.abs(b.y - (sc.row + 0.5)) < 0.55) {
        state.score += SCORE_SCORPION;
        spawnParticles(state, sc.x, sc.row + 0.5, COLORS.scorpion, 14);
        playSound("scorpionDie");
        scorpions.splice(sci, 1);
        bullets.splice(bi, 1);
        onUIChange();
        break;
      }
    }
  }

  // ── Enemy vs player (only if not invincible) ──────────────────────────────
  if (state.phase !== "playing") return;
  const playerExt = player as Player & { invincibleTimer: number };
  if (!playerExt.invincibleTimer) playerExt.invincibleTimer = 0;
  if (playerExt.invincibleTimer > 0) {
    return; // timer is decremented in updateGame
  }

  // Centipede vs player
  for (const chain of centipedes) {
    for (const seg of chain) {
      const t = easeInOut(Math.min(1, seg.animProgress));
      const sx = lerp(seg.prevCol, seg.col, seg.wrapped ? 1 : t) + 0.5;
      const sy = lerp(seg.prevRow, seg.row, seg.wrapped ? 1 : t) + 0.5;
      if (dist2(sx, sy, player.x, player.y) < 0.65 * 0.65) {
        killPlayer(state, onUIChange, playSound);
        return;
      }
    }
  }

  // Flea vs player
  for (const fl of fleas) {
    if (dist2(fl.col + 0.5, fl.y, player.x, player.y) < 0.6 * 0.6) {
      killPlayer(state, onUIChange, playSound);
      return;
    }
  }

  // Spider vs player
  for (const sp of spiders) {
    if (dist2(sp.x, sp.y, player.x, player.y) < 0.75 * 0.75) {
      killPlayer(state, onUIChange, playSound);
      return;
    }
  }
}

// ─── Player death / respawn ────────────────────────────────────────────────

function killPlayer(state: GameState, onUIChange: () => void, playSound: (n: string) => void) {
  state.lives--;
  state.phase = "dying";
  state.dyingTimer = DYING_DURATION;
  state.flashTimer = 300;
  state.flashColor = "#ff2200";
  spawnParticles(state, state.player.x, state.player.y, COLORS.player, 20);
  playSound("playerDie");
  onUIChange();
}

function respawnPlayer(state: GameState) {
  state.phase = "playing";
  const p = { x: COLS / 2, y: ROWS - 2.5 } as Player & { invincibleTimer: number };
  p.invincibleTimer = INVINCIBLE_DURATION;
  state.player = p;
  // Clear enemies from player zone
  state.fleas = [];
  state.spiders = [];
}

// ─── Level progression ─────────────────────────────────────────────────────

function startNextLevel(state: GameState) {
  state.level++;
  state.phase = "playing";
  state.mushrooms = buildMushrooms(state.level);
  state.centipedes = buildCentipede(state.level);
  state.bullets = [];
  state.bulletCooldown = 0;
  state.fleas = [];
  state.spiders = [];
  state.scorpions = [];
  state.tickInterval = getTickInterval(state.difficulty, state.level);
  state.tickTimer = 0;
  state.player = { x: COLS / 2, y: ROWS - 2.5 };
}

// ─── Particles update ──────────────────────────────────────────────────────

function updateParticlesOnly(state: GameState, dt: number) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 4 * dt; // gravity
    p.life -= dt * 1.8;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}

// ─── Restart ───────────────────────────────────────────────────────────────

export function restartGame(state: GameState, difficulty: Difficulty): void {
  const highScore = state.highScore;
  const fresh = initGameState(difficulty);
  fresh.highScore = highScore;
  fresh.phase = "playing";
  Object.assign(state, fresh);
}

// ─── Utility (exported for draw.ts) ───────────────────────────────────────

export { lerp, easeInOut };
