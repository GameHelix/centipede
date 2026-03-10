"use client";
import { useCallback } from "react";

interface Props {
  onLeft: (v: boolean) => void;
  onRight: (v: boolean) => void;
  onUp: (v: boolean) => void;
  onDown: (v: boolean) => void;
  onFire: (v: boolean) => void;
}

function DpadButton({
  label,
  onPress,
  onRelease,
  className = "",
}: {
  label: string;
  onPress: () => void;
  onRelease: () => void;
  className?: string;
}) {
  const prevent = (e: React.TouchEvent | React.PointerEvent) => e.preventDefault();

  return (
    <button
      className={`flex items-center justify-center rounded font-bold text-xl select-none touch-none ${className}`}
      style={{
        backgroundColor: "rgba(0,255,136,0.08)",
        border: "1px solid rgba(0,255,136,0.25)",
        color: "#00ff88",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
      onPointerDown={(e) => { e.preventDefault(); onPress(); }}
      onPointerUp={(e) => { e.preventDefault(); onRelease(); }}
      onPointerLeave={(e) => { e.preventDefault(); onRelease(); }}
      onPointerCancel={(e) => { e.preventDefault(); onRelease(); }}
      onTouchStart={prevent}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

export default function MobileControls({ onLeft, onRight, onUp, onDown, onFire }: Props) {
  const btnSize = "w-14 h-14 sm:w-16 sm:h-16";
  const fireSize = "w-20 h-20 sm:w-24 sm:h-24";

  return (
    <div
      className="w-full flex items-center justify-between px-4 py-3 select-none"
      style={{ backgroundColor: "rgba(0,5,20,0.9)", borderTop: "1px solid rgba(0,255,136,0.1)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* D-pad */}
      <div className="grid grid-cols-3 grid-rows-3 gap-1" style={{ width: "13rem", height: "13rem" }}>
        <div />
        <DpadButton label="▲" onPress={() => onUp(true)} onRelease={() => onUp(false)} className={`${btnSize} col-start-2 row-start-1`} />
        <div />
        <DpadButton label="◄" onPress={() => onLeft(true)} onRelease={() => onLeft(false)} className={`${btnSize} col-start-1 row-start-2`} />
        <div className="col-start-2 row-start-2 rounded" style={{ backgroundColor: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }} />
        <DpadButton label="►" onPress={() => onRight(true)} onRelease={() => onRight(false)} className={`${btnSize} col-start-3 row-start-2`} />
        <div />
        <DpadButton label="▼" onPress={() => onDown(true)} onRelease={() => onDown(false)} className={`${btnSize} col-start-2 row-start-3`} />
        <div />
      </div>

      {/* Fire button */}
      <div className="flex items-center justify-center">
        <button
          className={`${fireSize} rounded-full flex items-center justify-center font-mono font-bold text-base tracking-widest select-none touch-none`}
          style={{
            backgroundColor: "rgba(255,204,0,0.15)",
            border: "2px solid rgba(255,204,0,0.5)",
            color: "#ffcc00",
            textShadow: "0 0 8px #ffcc00",
            boxShadow: "0 0 16px rgba(255,204,0,0.2)",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          onPointerDown={(e) => { e.preventDefault(); onFire(true); }}
          onPointerUp={(e) => { e.preventDefault(); onFire(false); }}
          onPointerLeave={(e) => { e.preventDefault(); onFire(false); }}
          onPointerCancel={(e) => { e.preventDefault(); onFire(false); }}
          onContextMenu={(e) => e.preventDefault()}
        >
          FIRE
        </button>
      </div>
    </div>
  );
}
