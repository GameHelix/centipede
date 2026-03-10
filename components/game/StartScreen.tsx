"use client";
import { useState } from "react";
import type { Difficulty } from "@/utils/gameTypes";

interface Props {
  highScore: number;
  onStart: (difficulty: Difficulty) => void;
}

const DIFFICULTIES: { key: Difficulty; label: string; desc: string }[] = [
  { key: "easy", label: "EASY", desc: "Slow centipede · Forgiving" },
  { key: "medium", label: "MEDIUM", desc: "Classic pace · Balanced" },
  { key: "hard", label: "HARD", desc: "Fast & relentless · Expert" },
];

export default function StartScreen({ highScore, onStart }: Props) {
  const [selected, setSelected] = useState<Difficulty>("medium");

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in z-20">
      {/* Title */}
      <div className="mb-8 text-center select-none">
        <h1
          className="text-5xl sm:text-7xl font-mono font-bold tracking-widest animate-pulse-glow"
          style={{ color: "#00ff88", textShadow: "0 0 20px #00ff88, 0 0 40px #00ff88" }}
        >
          CENTIPEDE
        </h1>
        <p className="mt-2 text-sm font-mono tracking-[0.4em] animate-flicker" style={{ color: "#00cc66" }}>
          ARCADE EDITION
        </p>
      </div>

      {/* High score */}
      {highScore > 0 && (
        <div className="mb-6 text-center font-mono">
          <span className="text-xs tracking-widest" style={{ color: "#666" }}>HIGH SCORE</span>
          <p className="text-2xl font-bold" style={{ color: "#ffcc00", textShadow: "0 0 10px #ffcc00" }}>
            {highScore.toLocaleString()}
          </p>
        </div>
      )}

      {/* Difficulty selector */}
      <div className="mb-8 w-72 space-y-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => setSelected(d.key)}
            className="w-full px-4 py-3 font-mono text-left transition-all duration-150 rounded border"
            style={{
              borderColor: selected === d.key ? "#00ff88" : "#333",
              backgroundColor: selected === d.key ? "rgba(0,255,136,0.12)" : "rgba(0,0,0,0.5)",
              color: selected === d.key ? "#00ff88" : "#666",
              boxShadow: selected === d.key ? "0 0 12px rgba(0,255,136,0.3)" : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: selected === d.key ? "#00ff88" : "#444" }}
              >
                {selected === d.key && (
                  <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: "#00ff88" }} />
                )}
              </span>
              <div>
                <div className="text-sm font-bold tracking-widest">{d.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "#555" }}>{d.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={() => onStart(selected)}
        className="px-10 py-4 text-lg font-mono font-bold tracking-widest rounded transition-all duration-150 active:scale-95"
        style={{
          backgroundColor: "#00ff88",
          color: "#000",
          boxShadow: "0 0 20px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.2)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 30px rgba(0,255,136,0.8), 0 0 60px rgba(0,255,136,0.4)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow =
            "0 0 20px rgba(0,255,136,0.5), 0 0 40px rgba(0,255,136,0.2)";
        }}
      >
        INSERT COIN
      </button>

      {/* Controls hint */}
      <div className="mt-6 text-center font-mono text-xs space-y-1" style={{ color: "#444" }}>
        <p>ARROWS / WASD · MOVE &nbsp;|&nbsp; SPACE · FIRE &nbsp;|&nbsp; P · PAUSE</p>
        <p>TOUCH CONTROLS AVAILABLE ON MOBILE</p>
      </div>
    </div>
  );
}
