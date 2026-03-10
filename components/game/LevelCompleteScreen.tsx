"use client";

interface Props {
  level: number;
  score: number;
}

export default function LevelCompleteScreen({ level, score }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in z-20 pointer-events-none">
      <h2
        className="text-4xl sm:text-5xl font-mono font-bold tracking-widest mb-3 animate-pulse-glow"
        style={{ color: "#00ff88" }}
      >
        WAVE {level - 1} CLEAR!
      </h2>
      <p className="text-lg font-mono tracking-widest" style={{ color: "#ffcc00" }}>
        SCORE: {score.toLocaleString()}
      </p>
      <p className="mt-4 text-sm font-mono tracking-widest animate-pulse" style={{ color: "#555" }}>
        PREPARING WAVE {level}…
      </p>
    </div>
  );
}
