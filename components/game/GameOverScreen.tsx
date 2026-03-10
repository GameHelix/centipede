"use client";
import type { Difficulty } from "@/utils/gameTypes";

interface Props {
  score: number;
  highScore: number;
  level: number;
  isNewHigh: boolean;
  onRestart: (difficulty: Difficulty) => void;
  difficulty: Difficulty;
}

export default function GameOverScreen({ score, highScore, level, isNewHigh, onRestart, difficulty }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in z-20">
      <div className="text-center animate-slide-up">
        {/* Game Over title */}
        <h2
          className="text-5xl sm:text-6xl font-mono font-bold tracking-widest mb-2"
          style={{ color: "#ff2200", textShadow: "0 0 20px #ff2200, 0 0 40px #ff2200" }}
        >
          GAME OVER
        </h2>

        {isNewHigh && (
          <p
            className="text-lg font-mono font-bold tracking-widest animate-pulse-glow mb-4"
            style={{ color: "#ffcc00" }}
          >
            ★ NEW HIGH SCORE ★
          </p>
        )}

        {/* Stats */}
        <div className="mt-6 mb-8 space-y-3 font-mono">
          <div className="flex justify-between gap-16">
            <span style={{ color: "#666" }} className="tracking-widest text-sm">SCORE</span>
            <span style={{ color: "#00ff88" }} className="text-xl font-bold">
              {score.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-16">
            <span style={{ color: "#666" }} className="tracking-widest text-sm">HIGH SCORE</span>
            <span style={{ color: "#ffcc00" }} className="text-xl font-bold">
              {highScore.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-16">
            <span style={{ color: "#666" }} className="tracking-widest text-sm">LEVEL REACHED</span>
            <span style={{ color: "#cc44ff" }} className="text-xl font-bold">{level}</span>
          </div>
        </div>

        {/* Restart buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <button
            onClick={() => onRestart(difficulty)}
            className="px-8 py-3 font-mono font-bold tracking-widest rounded transition-all duration-150 active:scale-95"
            style={{
              backgroundColor: "#00ff88",
              color: "#000",
              boxShadow: "0 0 16px rgba(0,255,136,0.4)",
            }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => onRestart("easy")}
            className="px-6 py-3 font-mono text-sm tracking-widest rounded border transition-all duration-150 active:scale-95"
            style={{
              borderColor: "#444",
              color: "#888",
              backgroundColor: "transparent",
            }}
          >
            CHANGE DIFFICULTY
          </button>
        </div>
      </div>
    </div>
  );
}
