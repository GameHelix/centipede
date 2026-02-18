'use client'

import { useEffect, useState } from 'react'
import type { StationStatus } from '@/lib/data-generator'

const STATUS_COLORS: Record<string, string> = {
  normal:  '#00d4ff',
  warning: '#ffab00',
  alert:   '#ff1744',
  offline: '#2a4a65',
}

// Station layout in SVG coordinate space (600 × 280)
const STATION_NODES = [
  { id: 'alpha',   x: 80,  y:  60, label: 'α Alpha'   },
  { id: 'beta',    x: 240, y:  60, label: 'β Beta'    },
  { id: 'gamma',   x: 400, y:  60, label: 'γ Gamma'   },
  { id: 'delta',   x: 520, y: 160, label: 'δ Delta'   },
  { id: 'epsilon', x: 400, y: 220, label: 'ε Epsilon' },
  { id: 'zeta',    x: 240, y: 220, label: 'ζ Zeta'    },
  { id: 'eta',     x: 80,  y: 220, label: 'η Eta'     },
  { id: 'theta',   x: 80,  y: 140, label: 'θ Theta'   },
]

const PIPES = [
  { from: 'alpha', to: 'beta'    },
  { from: 'beta',  to: 'gamma'   },
  { from: 'gamma', to: 'delta'   },
  { from: 'delta', to: 'epsilon' },
  { from: 'epsilon', to: 'zeta'  },
  { from: 'zeta',  to: 'eta'     },
  { from: 'eta',   to: 'theta'   },
  { from: 'theta', to: 'alpha'   },
  // Cross-links
  { from: 'beta',  to: 'zeta'    },
  { from: 'gamma', to: 'epsilon' },
]

function nodePos(id: string) {
  return STATION_NODES.find(n => n.id === id) ?? STATION_NODES[0]
}

interface PipeFlowDiagramProps {
  stations?: StationStatus[]
}

export default function PipeFlowDiagram({ stations = [] }: PipeFlowDiagramProps) {
  const [tick, setTick] = useState(0)

  // Animate every 50ms
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  function getStatus(id: string): StationStatus['status'] {
    return stations.find(s => s.id === id)?.status ?? 'normal'
  }

  function getFlow(id: string): number {
    return stations.find(s => s.id === id)?.currentFlow ?? 24
  }

  return (
    <div className="scada-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
          Pipeline Network
        </p>
        <div className="flex items-center gap-3 text-[10px] font-mono text-scada-textDim">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-scada-cyan inline-block" />Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-scada-amber inline-block" />Warn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-scada-red inline-block" />Alert
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 600 280"
          className="w-full min-w-[320px]"
          style={{ height: 'auto' }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="mini-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="rgba(0,212,255,0.04)" strokeWidth="0.5" />
            </pattern>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <rect width="600" height="280" fill="url(#mini-grid)" />

          {/* Pipes */}
          {PIPES.map(({ from, to }) => {
            const a = nodePos(from)
            const b = nodePos(to)
            const stA = getStatus(from)
            const stB = getStatus(to)
            const offline = stA === 'offline' || stB === 'offline'
            const color   = offline ? '#2a4a65' :
                            stA === 'alert' || stB === 'alert' ? '#ff1744' :
                            stA === 'warning' || stB === 'warning' ? '#ffab00' : '#1a3352'
            const flowColor = offline ? '#2a4a65' : color === '#1a3352' ? '#00d4ff' : color

            return (
              <g key={`${from}-${to}`}>
                {/* Static pipe */}
                <line
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
                {/* Animated flow dashes */}
                {!offline && (
                  <line
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={flowColor}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="6 12"
                    strokeDashoffset={-(tick * 0.5) % 18}
                    opacity={0.6}
                  />
                )}
              </g>
            )
          })}

          {/* Station nodes */}
          {STATION_NODES.map(node => {
            const st    = getStatus(node.id)
            const flow  = getFlow(node.id)
            const color = STATUS_COLORS[st]
            const pulse = st === 'alert' ? Math.sin(tick * 0.15) * 0.4 + 0.6 : 1
            const r     = 18

            return (
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                {/* Outer glow ring */}
                {st !== 'offline' && (
                  <circle
                    r={r + 6}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    opacity={0.15 + (st === 'alert' ? pulse * 0.3 : 0)}
                  />
                )}
                {/* Main circle */}
                <circle
                  r={r}
                  fill="#081525"
                  stroke={color}
                  strokeWidth={2}
                  opacity={st === 'offline' ? 0.4 : 1}
                />
                {/* Inner fill */}
                <circle r={r - 6} fill={color} opacity={st === 'offline' ? 0.1 : 0.15} />
                {/* Center dot */}
                <circle r={3} fill={color} opacity={st === 'offline' ? 0.4 : 1} />

                {/* Label above */}
                <text
                  y={-r - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill={color}
                  fontFamily="JetBrains Mono, monospace"
                  opacity={0.9}
                >
                  {node.label}
                </text>
                {/* Flow below */}
                {st !== 'offline' && (
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#4a7090"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {flow.toFixed(1)} m³/h
                  </text>
                )}
                {st === 'offline' && (
                  <text
                    y={r + 14}
                    textAnchor="middle"
                    fontSize={8}
                    fill="#2a4a65"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    OFFLINE
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
