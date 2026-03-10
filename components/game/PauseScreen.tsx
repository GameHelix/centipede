"use client";

interface Props {
  onResume: () => void;
  onQuit: () => void;
}

export default function PauseScreen({ onResume, onQuit }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in z-20">
      <h2
        className="text-4xl sm:text-5xl font-mono font-bold tracking-[0.3em] mb-8 animate-pulse-glow"
        style={{ color: "#00ff88" }}
      >
        PAUSED
      </h2>
      <div className="flex flex-col gap-3 w-48">
        <button
          onClick={onResume}
          className="py-3 font-mono font-bold tracking-widest rounded transition-all duration-150 active:scale-95"
          style={{
            backgroundColor: "#00ff88",
            color: "#000",
            boxShadow: "0 0 16px rgba(0,255,136,0.4)",
          }}
        >
          RESUME
        </button>
        <button
          onClick={onQuit}
          className="py-3 font-mono text-sm tracking-widest rounded border transition-all duration-150 active:scale-95"
          style={{ borderColor: "#444", color: "#888", backgroundColor: "transparent" }}
        >
          QUIT
        </button>
      </div>
      <p className="mt-8 text-xs font-mono tracking-widest" style={{ color: "#444" }}>
        PRESS P TO RESUME
      </p>
    </div>
  );
}
