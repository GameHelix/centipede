"use client";
/**
 * Main game component — assembles canvas, HUD, overlays, and controls.
 */
import { useRef, useState, useCallback } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useControls } from "@/hooks/useControls";
import { useSound } from "@/hooks/useSound";
import HUD from "./HUD";
import StartScreen from "./StartScreen";
import GameOverScreen from "./GameOverScreen";
import PauseScreen from "./PauseScreen";
import LevelCompleteScreen from "./LevelCompleteScreen";
import MobileControls from "./MobileControls";
import type { Difficulty } from "@/utils/gameTypes";

export default function CentipedeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { inputRef, setLeft, setRight, setUp, setDown, setFire, setPause } = useControls();
  const { playSound, setSoundEnabled, setMusicEnabled, resumeCtx } = useSound();

  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(false);

  const { ui, startGame, pauseGame, resumeGame, restartGame, setDifficulty, goToStart } = useGameEngine({
    canvasRef,
    inputRef,
    playSound,
    resumeCtx,
  });

  const handleToggleSound = useCallback(() => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }, [soundOn, setSoundEnabled]);

  const handleToggleMusic = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  }, [musicOn, setMusicEnabled]);

  const handleStart = useCallback((d: Difficulty) => {
    setDifficulty(d);
    startGame(d);
    resumeCtx();
  }, [setDifficulty, startGame, resumeCtx]);

  const handlePause = useCallback(() => {
    if (ui.phase === "playing") pauseGame();
    else if (ui.phase === "paused") resumeGame();
  }, [ui.phase, pauseGame, resumeGame]);

  const handleQuit = useCallback(() => {
    goToStart();
  }, [goToStart]);

  const isNewHigh = ui.score > 0 && ui.score === ui.highScore;

  return (
    <div
      className="flex flex-col w-full h-full max-h-screen overflow-hidden"
      style={{ backgroundColor: "#050510" }}
    >
      {/* HUD */}
      <HUD
        score={ui.score}
        highScore={ui.highScore}
        lives={ui.lives}
        level={ui.level}
        soundEnabled={soundOn}
        musicEnabled={musicOn}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onPause={handlePause}
        phase={ui.phase}
      />

      {/* Game canvas area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" style={{ minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          className="block"
          style={{ imageRendering: "pixelated" }}
        />

        {/* Overlay screens */}
        {ui.phase === "start" && (
          <StartScreen highScore={ui.highScore} onStart={handleStart} />
        )}
        {ui.phase === "gameOver" && (
          <GameOverScreen
            score={ui.score}
            highScore={ui.highScore}
            level={ui.level}
            isNewHigh={isNewHigh}
            onRestart={handleStart}
            difficulty={ui.difficulty}
          />
        )}
        {ui.phase === "paused" && (
          <PauseScreen onResume={resumeGame} onQuit={handleQuit} />
        )}
        {ui.phase === "levelComplete" && (
          <LevelCompleteScreen level={ui.level} score={ui.score} />
        )}
      </div>

      {/* Mobile controls — visible on touch devices */}
      <div className="block sm:hidden">
        <MobileControls
          onLeft={setLeft}
          onRight={setRight}
          onUp={setUp}
          onDown={setDown}
          onFire={setFire}
        />
      </div>

      {/* Keyboard hint (desktop) */}
      {ui.phase === "playing" && (
        <div className="hidden sm:block text-center py-1 font-mono text-xs" style={{ color: "#333" }}>
          ARROWS/WASD — MOVE &nbsp;·&nbsp; SPACE — FIRE &nbsp;·&nbsp; P — PAUSE
        </div>
      )}
    </div>
  );
}
