/**
 * Pure canvas drawing functions.
 * All positions are in grid units; cellSize converts to pixels.
 */
import { COLS, ROWS, PLAYER_ZONE_TOP, PLAYER_ROWS, MUSHROOM_MAX_HEALTH, COLORS } from "./constants";
import type { GameState } from "./gameTypes";
import { lerp, easeInOut } from "./gameLogic";

// ─── Helpers ───────────────────────────────────────────────────────────────

function glow(ctx: CanvasRenderingContext2D, color: string, blur: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}
function noGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
}

// ─── Background ────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, cs: number) {
  const w = COLS * cs;
  const h = ROWS * cs;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cs, 0);
    ctx.lineTo(c * cs, h);
    ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * cs);
    ctx.lineTo(w, r * cs);
    ctx.stroke();
  }

  // Player zone tint
  ctx.fillStyle = COLORS.playerZoneFill;
  ctx.fillRect(0, PLAYER_ZONE_TOP * cs, w, PLAYER_ROWS * cs);

  // Player zone boundary line
  ctx.strokeStyle = COLORS.playerZoneLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, PLAYER_ZONE_TOP * cs);
  ctx.lineTo(w, PLAYER_ZONE_TOP * cs);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ─── Mushrooms ─────────────────────────────────────────────────────────────

function drawMushrooms(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  const { mushrooms } = state;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const m = mushrooms[r]?.[c];
      if (!m) continue;

      const x = c * cs;
      const y = r * cs;
      const pad = cs * 0.1;
      const sz = cs - pad * 2;

      // Color based on health and poisoned state
      let color: string;
      if (m.poisoned) {
        color = m.health >= 3 ? COLORS.mushroomPoisoned : COLORS.mushroomPoisonedDark;
      } else {
        const ratio = m.health / MUSHROOM_MAX_HEALTH;
        if (ratio >= 0.75) color = COLORS.mushroomFull;
        else if (ratio >= 0.5) color = COLORS.mushroomHigh;
        else if (ratio >= 0.25) color = COLORS.mushroomMid;
        else color = COLORS.mushroomLow;
      }

      glow(ctx, color, cs * 0.6);
      ctx.fillStyle = color;

      // Draw mushroom cap (top half rounded, bottom flat)
      const cx = x + cs / 2;
      const cy = y + cs / 2;
      const r2 = sz / 2;

      ctx.beginPath();
      ctx.arc(cx, cy - r2 * 0.1, r2 * 0.85, Math.PI, 0);
      ctx.lineTo(cx + r2 * 0.85, cy + r2 * 0.55);
      ctx.lineTo(cx - r2 * 0.85, cy + r2 * 0.55);
      ctx.closePath();
      ctx.fill();

      // Stem
      ctx.fillRect(cx - r2 * 0.35, cy + r2 * 0.3, r2 * 0.7, r2 * 0.6);

      // Health dots
      noGlow(ctx);
      const dotCount = m.health;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let d = 0; d < dotCount; d++) {
        const dx = cx - r2 * 0.4 + d * (r2 * 0.27);
        ctx.beginPath();
        ctx.arc(dx, cy + r2 * 0.1, cs * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  noGlow(ctx);
}

// ─── Centipede ─────────────────────────────────────────────────────────────

function drawCentipede(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  for (const chain of state.centipedes) {
    for (let i = chain.length - 1; i >= 0; i--) {
      const seg = chain[i];
      const t = easeInOut(Math.min(1, seg.animProgress));
      const useLerp = !seg.wrapped;
      const gx = useLerp ? lerp(seg.prevCol, seg.col, t) : seg.col;
      const gy = useLerp ? lerp(seg.prevRow, seg.row, t) : seg.row;
      const px = (gx + 0.5) * cs;
      const py = (gy + 0.5) * cs;
      const radius = cs * 0.42;

      const color = seg.isHead ? COLORS.centipedeHead : COLORS.centipedeBody;
      glow(ctx, color, cs * 0.8);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Body segment lines to next segment
      if (i < chain.length - 1) {
        const ns = chain[i + 1];
        const nt = easeInOut(Math.min(1, ns.animProgress));
        const nuL = !ns.wrapped;
        const ngx = nuL ? lerp(ns.prevCol, ns.col, nt) : ns.col;
        const ngy = nuL ? lerp(ns.prevRow, ns.row, nt) : ns.row;
        const npx = (ngx + 0.5) * cs;
        const npy = (ngy + 0.5) * cs;
        ctx.strokeStyle = COLORS.centipedeBodyDark;
        ctx.lineWidth = cs * 0.3;
        glow(ctx, COLORS.centipedeBodyDark, cs * 0.4);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(npx, npy);
        ctx.stroke();
      }

      // Head features
      if (seg.isHead) {
        noGlow(ctx);
        ctx.fillStyle = COLORS.centipedeEye;
        const eyeOffset = seg.dir === 1 ? cs * 0.15 : -cs * 0.15;
        ctx.beginPath();
        ctx.arc(px + eyeOffset, py - cs * 0.1, cs * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + eyeOffset, py + cs * 0.1, cs * 0.07, 0, Math.PI * 2);
        ctx.fill();
        // Antennae
        ctx.strokeStyle = COLORS.centipedeHead;
        ctx.lineWidth = cs * 0.04;
        glow(ctx, COLORS.centipedeHead, cs * 0.3);
        const antX = px + seg.dir * cs * 0.42;
        ctx.beginPath();
        ctx.moveTo(antX, py);
        ctx.lineTo(antX + seg.dir * cs * 0.3, py - cs * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(antX, py);
        ctx.lineTo(antX + seg.dir * cs * 0.3, py + cs * 0.3);
        ctx.stroke();
      }
    }
  }
  noGlow(ctx);
}

// ─── Player ────────────────────────────────────────────────────────────────

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, cs: number, frameMs: number) {
  const { player } = state;
  const inv = (player as { invincibleTimer?: number }).invincibleTimer ?? 0;
  // Blink when invincible (skip every other 150ms window)
  if (inv > 0 && Math.floor(frameMs / 150) % 2 === 0) return;

  const px = player.x * cs;
  const py = player.y * cs;
  const sz = cs * 0.45;

  glow(ctx, COLORS.playerGlow, cs * 1.2);
  ctx.fillStyle = COLORS.player;

  // Ship body (triangle pointing up)
  ctx.beginPath();
  ctx.moveTo(px, py - sz);
  ctx.lineTo(px + sz * 0.7, py + sz * 0.6);
  ctx.lineTo(px - sz * 0.7, py + sz * 0.6);
  ctx.closePath();
  ctx.fill();

  // Cannon tip
  ctx.fillStyle = COLORS.playerCannon;
  glow(ctx, COLORS.player, cs * 0.6);
  ctx.fillRect(px - cs * 0.07, py - sz - cs * 0.18, cs * 0.14, cs * 0.22);

  // Engine glow
  ctx.fillStyle = "#ff6600";
  glow(ctx, "#ff4400", cs * 0.8);
  ctx.beginPath();
  ctx.arc(px, py + sz * 0.55, cs * 0.12, 0, Math.PI * 2);
  ctx.fill();

  noGlow(ctx);
}

// ─── Bullets ───────────────────────────────────────────────────────────────

function drawBullets(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  for (const b of state.bullets) {
    const px = b.x * cs;
    const py = b.y * cs;
    glow(ctx, COLORS.bulletGlow, cs * 0.8);
    ctx.fillStyle = COLORS.bullet;
    ctx.fillRect(px - cs * 0.06, py - cs * 0.35, cs * 0.12, cs * 0.55);
    // Bright tip
    ctx.fillStyle = COLORS.bulletGlow;
    ctx.fillRect(px - cs * 0.06, py - cs * 0.35, cs * 0.12, cs * 0.14);
  }
  noGlow(ctx);
}

// ─── Flea ──────────────────────────────────────────────────────────────────

function drawFleas(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  for (const fl of state.fleas) {
    const px = (fl.col + 0.5) * cs;
    const py = fl.y * cs;
    glow(ctx, COLORS.fleaGlow, cs * 0.9);
    ctx.fillStyle = COLORS.flea;
    // Body
    ctx.beginPath();
    ctx.ellipse(px, py, cs * 0.3, cs * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Legs
    ctx.strokeStyle = COLORS.flea;
    ctx.lineWidth = cs * 0.06;
    for (let l = -1; l <= 1; l += 2) {
      ctx.beginPath();
      ctx.moveTo(px, py + l * cs * 0.15);
      ctx.lineTo(px + cs * 0.4, py + l * cs * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, py - l * cs * 0.05);
      ctx.lineTo(px - cs * 0.4, py + l * cs * 0.25);
      ctx.stroke();
    }
  }
  noGlow(ctx);
}

// ─── Spider ────────────────────────────────────────────────────────────────

function drawSpiders(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  for (const sp of state.spiders) {
    const px = sp.x * cs;
    const py = sp.y * cs;
    glow(ctx, COLORS.spiderGlow, cs * 1.0);
    ctx.fillStyle = COLORS.spider;
    // Body (two circles)
    ctx.beginPath();
    ctx.arc(px, py - cs * 0.12, cs * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py + cs * 0.15, cs * 0.28, 0, Math.PI * 2);
    ctx.fill();
    // 8 legs
    ctx.strokeStyle = COLORS.spider;
    ctx.lineWidth = cs * 0.06;
    for (let l = 0; l < 4; l++) {
      const angle = (l / 4) * Math.PI - Math.PI * 0.5;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + side * Math.cos(angle) * cs * 0.55, py + Math.sin(angle) * cs * 0.55);
        ctx.stroke();
      }
    }
    // Eyes
    noGlow(ctx);
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(px - cs * 0.1, py - cs * 0.16, cs * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px + cs * 0.1, py - cs * 0.16, cs * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  noGlow(ctx);
}

// ─── Scorpion ──────────────────────────────────────────────────────────────

function drawScorpions(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  for (const sc of state.scorpions) {
    const px = sc.x * cs;
    const py = (sc.row + 0.5) * cs;
    glow(ctx, COLORS.scorpionGlow, cs * 1.0);
    ctx.fillStyle = COLORS.scorpion;
    // Body segments
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.arc(px + sc.dir * s * cs * 0.32, py, cs * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Tail (curved up)
    ctx.strokeStyle = COLORS.scorpion;
    ctx.lineWidth = cs * 0.12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(px + sc.dir * 4 * cs * 0.32, py);
    ctx.quadraticCurveTo(
      px + sc.dir * cs * 1.8,
      py - cs * 0.8,
      px + sc.dir * cs * 1.2,
      py - cs * 0.9
    );
    ctx.stroke();
    // Claws
    ctx.beginPath();
    ctx.arc(px - sc.dir * cs * 0.32, py - cs * 0.25, cs * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px - sc.dir * cs * 0.32, py + cs * 0.25, cs * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  noGlow(ctx);
  ctx.lineCap = "butt";
}

// ─── Particles ─────────────────────────────────────────────────────────────

function drawParticles(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    glow(ctx, p.color, cs * 0.4);
    ctx.beginPath();
    ctx.arc(p.x * cs, p.y * cs, p.size * cs, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  noGlow(ctx);
}

// ─── Screen flash ──────────────────────────────────────────────────────────

function drawFlash(ctx: CanvasRenderingContext2D, state: GameState, cs: number) {
  if (state.flashTimer <= 0) return;
  const alpha = Math.min(0.35, state.flashTimer / 300) * 0.8;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = state.flashColor;
  ctx.fillRect(0, 0, COLS * cs, ROWS * cs);
  ctx.globalAlpha = 1;
}

// ─── Main draw entry point ─────────────────────────────────────────────────

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cs: number,
  frameMs: number
) {
  ctx.clearRect(0, 0, COLS * cs, ROWS * cs);
  drawBackground(ctx, cs);
  drawMushrooms(ctx, state, cs);
  drawCentipede(ctx, state, cs);
  drawBullets(ctx, state, cs);
  drawFleas(ctx, state, cs);
  drawSpiders(ctx, state, cs);
  drawScorpions(ctx, state, cs);
  drawPlayer(ctx, state, cs, frameMs);
  drawParticles(ctx, state, cs);
  drawFlash(ctx, state, cs);
}
