'use client'

import { useEffect, useRef } from 'react'
import clsx from 'clsx'

interface CircularGaugeProps {
  value:   number
  min?:    number
  max:     number
  label:   string
  unit:    string
  size?:   number
  decimals?: number
}

function getColor(pct: number): { stroke: string; glow: string } {
  if (pct >= 0.85) return { stroke: '#ff1744', glow: 'rgba(255,23,68,0.4)'    }
  if (pct >= 0.65) return { stroke: '#ffab00', glow: 'rgba(255,171,0,0.4)'   }
  return               { stroke: '#00d4ff', glow: 'rgba(0,212,255,0.35)'  }
}

export default function CircularGauge({
  value, min = 0, max, label, unit, size = 160, decimals = 1,
}: CircularGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pct       = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const { stroke, glow } = getColor(pct)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    if (!ctx)   return

    const dpr = window.devicePixelRatio || 1
    canvas.width  = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx     = size / 2
    const cy     = size / 2
    const radius = size * 0.38
    const lw     = size * 0.07

    // Start/end angles (220° arc, 110° gap at bottom)
    const startAngle = (Math.PI * 220) / 180 + Math.PI / 2   // 220° from bottom
    const fullSpan   = (Math.PI * 280) / 180                  // 280° total

    ctx.clearRect(0, 0, size, size)

    // Track (background arc)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, startAngle, startAngle + fullSpan, false)
    ctx.strokeStyle = '#1a3352'
    ctx.lineWidth   = lw
    ctx.lineCap     = 'round'
    ctx.stroke()

    // Subtle tick marks
    const ticks = 5
    for (let i = 0; i <= ticks; i++) {
      const angle = startAngle + (fullSpan * i) / ticks
      const inner = radius - lw * 0.8
      const outer = radius + lw * 0.6
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner)
      ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer)
      ctx.strokeStyle = '#2a4a65'
      ctx.lineWidth   = 1
      ctx.stroke()
    }

    // Glow layer (blur)
    if (pct > 0.01) {
      ctx.save()
      ctx.shadowColor = glow
      ctx.shadowBlur  = lw * 1.8
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, startAngle + fullSpan * pct, false)
      ctx.strokeStyle = stroke
      ctx.lineWidth   = lw
      ctx.lineCap     = 'round'
      ctx.stroke()
      ctx.restore()

      // Solid fill arc on top
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, startAngle + fullSpan * pct, false)
      ctx.strokeStyle = stroke
      ctx.lineWidth   = lw
      ctx.lineCap     = 'round'
      ctx.stroke()
    }

    // Center dot
    ctx.beginPath()
    ctx.arc(cx, cy, 4, 0, Math.PI * 2)
    ctx.fillStyle = stroke
    ctx.shadowColor = glow
    ctx.shadowBlur  = 8
    ctx.fill()
  }, [value, min, max, size, pct, stroke, glow])

  const displayValue = pct === 0 && value === min
    ? min.toFixed(decimals)
    : value.toFixed(decimals)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size }}
          className="block"
        />
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="data-value font-bold text-scada-text leading-none"
            style={{ fontSize: size * 0.16 }}
          >
            {displayValue}
          </span>
          <span
            className="font-mono text-scada-textDim mt-0.5"
            style={{ fontSize: size * 0.08 }}
          >
            {unit}
          </span>
        </div>
        {/* Min / Max labels */}
        <span
          className="absolute font-mono text-scada-textMuted"
          style={{ fontSize: 9, bottom: size * 0.05, left: size * 0.08 }}
        >
          {min}
        </span>
        <span
          className="absolute font-mono text-scada-textMuted"
          style={{ fontSize: 9, bottom: size * 0.05, right: size * 0.08 }}
        >
          {max}
        </span>
      </div>
      <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold text-center">
        {label}
      </p>
      {/* Percentage bar */}
      <div className="w-full max-w-[120px] h-1 bg-scada-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: stroke,
            boxShadow: `0 0 6px ${glow}`,
          }}
        />
      </div>
      <p
        className={clsx('text-[10px] font-mono font-semibold')}
        style={{ color: stroke }}
      >
        {(pct * 100).toFixed(0)}%
      </p>
    </div>
  )
}
