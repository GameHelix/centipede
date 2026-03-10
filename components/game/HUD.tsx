"use client";

interface Props {
  score: number;
  highScore: number;
  lives: number;
  level: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onPause: () => void;
  phase: string;
}

export default function HUD({
  score,
  highScore,
  lives,
  level,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onPause,
  phase,
}: Props) {
  const showPause = phase === "playing" || phase === "paused";

  return (
    <div
      className="w-full flex items-center justify-between px-3 py-2 font-mono select-none"
      style={{ backgroundColor: "rgba(0,5,20,0.95)", borderBottom: "1px solid rgba(0,255,136,0.15)" }}
    >
      {/* Score block */}
      <div className="flex gap-4 sm:gap-6 text-xs">
        <div className="text-center">
          <div className="tracking-widest mb-0.5" style={{ color: "#555" }}>SCORE</div>
          <div className="text-base sm:text-lg font-bold" style={{ color: "#00ff88", textShadow: "0 0 8px #00ff88" }}>
            {score.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="tracking-widest mb-0.5" style={{ color: "#555" }}>HI</div>
          <div className="text-base sm:text-lg font-bold" style={{ color: "#ffcc00" }}>
            {highScore.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="tracking-widest mb-0.5" style={{ color: "#555" }}>LVL</div>
          <div className="text-base sm:text-lg font-bold" style={{ color: "#cc44ff" }}>{level}</div>
        </div>
      </div>

      {/* Lives */}
      <div className="flex gap-1 items-center">
        {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
          <span
            key={i}
            className="text-base sm:text-lg"
            style={{ color: "#ffcc00", textShadow: "0 0 6px #ff8800", filter: "drop-shadow(0 0 4px #ff8800)" }}
          >
            ▲
          </span>
        ))}
        {lives <= 0 && <span className="text-xs" style={{ color: "#555" }}>—</span>}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onToggleSound}
          title={soundEnabled ? "Sound ON" : "Sound OFF"}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded text-xs flex items-center justify-center transition-colors"
          style={{
            backgroundColor: soundEnabled ? "rgba(0,255,136,0.15)" : "rgba(50,50,50,0.5)",
            color: soundEnabled ? "#00ff88" : "#444",
            border: `1px solid ${soundEnabled ? "rgba(0,255,136,0.3)" : "#333"}`,
          }}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
        <button
          onClick={onToggleMusic}
          title={musicEnabled ? "Music ON" : "Music OFF"}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded text-xs flex items-center justify-center transition-colors"
          style={{
            backgroundColor: musicEnabled ? "rgba(204,68,255,0.15)" : "rgba(50,50,50,0.5)",
            color: musicEnabled ? "#cc44ff" : "#444",
            border: `1px solid ${musicEnabled ? "rgba(204,68,255,0.3)" : "#333"}`,
          }}
        >
          {musicEnabled ? "🎵" : "🎵"}
        </button>
        {showPause && (
          <button
            onClick={onPause}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded text-xs flex items-center justify-center transition-colors"
            style={{
              backgroundColor: "rgba(50,50,50,0.5)",
              color: "#888",
              border: "1px solid #333",
            }}
          >
            {phase === "paused" ? "▶" : "⏸"}
          </button>
        )}
      </div>
    </div>
  );
}
