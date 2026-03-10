"use client";
/**
 * Core game engine hook.
 * Holds mutable game state in a useRef, runs a requestAnimationFrame loop,
 * and exposes minimal React state for UI overlays.
 */
import { useRef, useEffect, useCallback, useState, type RefObject } from "react";
import { COLS, ROWS } from "@/utils/constants";
import { initGameState, updateGame, restartGame, createEmptyInput } from "@/utils/gameLogic";
import { drawGame } from "@/utils/draw";
import type { GameState, InputState, Difficulty, GamePhase } from "@/utils/gameTypes";

export interface UIState {
  phase: GamePhase;
  score: number;
  highScore: number;
  lives: number;
  level: number;
  difficulty: Difficulty;
}

interface UseGameEngineOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  inputRef: RefObject<InputState>;
  playSound: (name: string) => void;
  resumeCtx: () => void;
}

export function useGameEngine({ canvasRef, inputRef, playSound, resumeCtx }: UseGameEngineOptions) {
  const stateRef = useRef<GameState>(initGameState("medium"));
  const animRef = useRef<number>(0);
  const frameTimeRef = useRef<number>(0);
  const cellSizeRef = useRef<number>(20);
  const runningMs = useRef<number>(0); // total elapsed ms for blink effects

  const [ui, setUI] = useState<UIState>({
    phase: "start",
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
    difficulty: "medium",
  });

  const syncUI = useCallback(() => {
    const s = stateRef.current;
    setUI({
      phase: s.phase,
      score: s.score,
      highScore: s.highScore,
      lives: s.lives,
      level: s.level,
      difficulty: s.difficulty,
    });
  }, []);

  // ── Canvas resize observer ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const availW = parent.clientWidth;
      const availH = parent.clientHeight;
      const aspectRatio = COLS / ROWS;
      let w = availW;
      let h = availW / aspectRatio;
      if (h > availH) {
        h = availH;
        w = h * aspectRatio;
      }
      w = Math.floor(w);
      h = Math.floor(h);
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      cellSizeRef.current = (w / COLS) * dpr;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [canvasRef]);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const loop = (timestamp: number) => {
      const delta = Math.min(timestamp - frameTimeRef.current, 50);
      frameTimeRef.current = timestamp;
      runningMs.current += delta;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const cs = cellSizeRef.current;
          const dpr = window.devicePixelRatio || 1;

          // Scale context by DPR once (using transform)
          ctx.setTransform(1, 0, 0, 1, 0, 0); // reset
          ctx.scale(1, 1); // already applied via canvas.width

          const state = stateRef.current;
          const inp = inputRef.current ?? createEmptyInput();

          if (state.phase === "playing" || state.phase === "dying" || state.phase === "levelComplete") {
            updateGame(state, delta, inp, syncUI, playSound);
            // Clear pause flag after one frame so it doesn't retrigger
            inp.pause = false;
          } else if (state.phase === "paused") {
            // Still allow unpausing
            updateGame(state, 0, inp, syncUI, playSound);
            inp.pause = false;
          }

          // Draw — cell size in physical canvas pixels
          drawGame(ctx, state, canvas.width / COLS, runningMs.current);
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [canvasRef, inputRef, syncUI, playSound]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const startGame = useCallback((difficulty: Difficulty) => {
    resumeCtx();
    const fresh = initGameState(difficulty);
    fresh.phase = "playing";
    fresh.highScore = stateRef.current.highScore;
    Object.assign(stateRef.current, fresh);
    syncUI();
  }, [resumeCtx, syncUI]);

  const pauseGame = useCallback(() => {
    if (stateRef.current.phase === "playing") {
      stateRef.current.phase = "paused";
      syncUI();
    }
  }, [syncUI]);

  const resumeGame = useCallback(() => {
    if (stateRef.current.phase === "paused") {
      stateRef.current.phase = "playing";
      syncUI();
    }
  }, [syncUI]);

  const doRestart = useCallback((difficulty?: Difficulty) => {
    resumeCtx();
    restartGame(stateRef.current, difficulty ?? stateRef.current.difficulty);
    syncUI();
  }, [resumeCtx, syncUI]);

  const setDifficulty = useCallback((d: Difficulty) => {
    stateRef.current.difficulty = d;
    syncUI();
  }, [syncUI]);

  const goToStart = useCallback(() => {
    const d = stateRef.current.difficulty;
    const hi = stateRef.current.highScore;
    const fresh = initGameState(d);
    fresh.highScore = hi;
    Object.assign(stateRef.current, fresh);
    syncUI();
  }, [syncUI]);

  return { ui, startGame, pauseGame, resumeGame, restartGame: doRestart, setDifficulty, goToStart };
}
