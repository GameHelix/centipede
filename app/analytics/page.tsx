'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import GasUsageChart from '@/components/charts/GasUsageChart'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import type { DataPoint } from '@/lib/data-generator'
import clsx from 'clsx'

interface HistoryData {
  points: DataPoint[]
  stats:  { max: number; min: number; avg: number; total: number; count: number }
  heatmap: number[][]
}

const PERIODS = ['24h', '7d', '30d', '90d'] as const
type Period = typeof PERIODS[number]

const HOUR_LABELS  = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`)
const DAY_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function heatColor(value: number, max: number): string {
  if (max === 0) return '#1a3352'
  const t = value / max
  if (t < 0.25) return `rgba(0, 212, 255, ${0.1 + t * 0.4})`
  if (t < 0.55) return `rgba(0, 212, 255, ${0.3 + t * 0.4})`
  if (t < 0.80) return `rgba(255, 171, 0, ${0.4 + t * 0.3})`
  return `rgba(255, 23, 68, ${0.5 + t * 0.4})`
}

export default function AnalyticsPage() {
  const [period,  setPeriod]  = useState<Period>('7d')
  const [data,    setData]    = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/history?period=${p}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchHistory(period) }, [period, fetchHistory])

  // Build hourly average bar chart (collapse all days)
  const hourlyAvg: { hour: string; avg: number }[] = HOUR_LABELS.map((h, hi) => {
    if (!data?.heatmap) return { hour: h, avg: 0 }
    let sum = 0, cnt = 0
    for (let d = 0; d < 7; d++) {
      const v = data.heatmap[d]?.[hi] ?? 0
      if (v > 0) { sum += v; cnt++ }
    }
    return { hour: h, avg: cnt ? Math.round(sum / cnt * 10) / 10 : 0 }
  })

  const peakHour = hourlyAvg.reduce((a, b) => a.avg > b.avg ? a : b, hourlyAvg[0])
  const heatmapMax = data ? Math.max(...data.heatmap.flat()) : 1

  const statCards = [
    { label: 'Peak Flow',     value: data?.stats.max,   unit: 'm³/h', icon: TrendingUp,   color: 'text-scada-red'   },
    { label: 'Average Flow',  value: data?.stats.avg,   unit: 'm³/h', icon: Minus,        color: 'text-scada-cyan'  },
    { label: 'Min Flow',      value: data?.stats.min,   unit: 'm³/h', icon: TrendingDown, color: 'text-sky-400'     },
    { label: 'Total Volume',  value: data?.stats.total, unit: 'm³',   icon: BarChart3,    color: 'text-scada-green', format: 'int' },
  ]

  return (
    <div className="max-w-[1400px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-scada-text font-bold text-lg tracking-wide flex items-center gap-2">
            <BarChart3 size={18} className="text-scada-cyan" />
            Analytics
          </h1>
          <p className="text-scada-textDim text-xs mt-0.5">Historical gas flow analysis and demand patterns</p>
        </div>

        {/* Period tabs */}
        <div className="flex items-center gap-1 bg-scada-panel border border-scada-border rounded-md p-0.5">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={clsx(
                'px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-widest transition-all',
                period === p
                  ? 'bg-scada-panelAlt text-scada-cyan border border-scada-border'
                  : 'text-scada-textDim hover:text-scada-text',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw size={28} className="text-scada-cyan animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ label, value, unit, icon: Icon, color, format }) => (
              <div key={label} className="scada-card p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Icon size={13} className={color} />
                  <p className="text-[10px] text-scada-textDim uppercase tracking-widest font-semibold">{label}</p>
                </div>
                <p className={clsx('data-value font-bold text-2xl text-scada-text leading-none')}>
                  {value === undefined ? '—' :
                    format === 'int'
                      ? value.toLocaleString()
                      : value.toFixed(1)
                  }
                  <span className="text-scada-textDim text-xs font-normal ml-1">{unit}</span>
                </p>
              </div>
            ))}
          </div>

          {/* Main chart */}
          <GasUsageChart data={data?.points ?? []} period={period} avgVolume={data?.stats.avg} />

          {/* Hourly bar chart + heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Hourly average bars */}
            <div className="scada-card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
                  Avg Flow by Hour
                </p>
                <span className="text-[10px] text-scada-cyan font-mono">
                  Peak: {peakHour?.hour} · {peakHour?.avg} m³/h
                </span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyAvg} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a3352" vertical={false} />
                  <XAxis
                    dataKey="hour"
                    tick={{ fill: '#4a7090', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                    axisLine={{ stroke: '#1a3352' }}
                    tickLine={false}
                    interval={2}
                    tickFormatter={h => h.slice(0,2)}
                  />
                  <YAxis
                    tick={{ fill: '#4a7090', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0d1e35', border: '1px solid #1a3352', borderRadius: 6 }}
                    labelStyle={{ color: '#4a7090', fontSize: 10 }}
                    itemStyle={{ color: '#00d4ff', fontSize: 11, fontFamily: 'monospace' }}
                  />
                  <Bar dataKey="avg" radius={[2,2,0,0]} maxBarSize={18}>
                    {hourlyAvg.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avg === peakHour?.avg ? '#ffab00' : '#00d4ff'}
                        opacity={0.7 + (entry.avg / (peakHour?.avg || 1)) * 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap */}
            <div className="scada-card p-4">
              <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold mb-3">
                Demand Heatmap — Hour × Day
              </p>
              <div className="overflow-x-auto">
                <div className="min-w-[380px]">
                  {/* Column labels */}
                  <div className="flex mb-1 ml-8">
                    {HOUR_LABELS.filter((_, i) => i % 3 === 0).map(h => (
                      <div key={h} className="flex-1 text-center text-[8px] font-mono text-scada-textMuted">
                        {h.slice(0,2)}
                      </div>
                    ))}
                  </div>
                  {/* Rows */}
                  {DAY_LABELS.map((day, di) => (
                    <div key={day} className="flex items-center gap-1 mb-0.5">
                      <span className="w-7 text-[9px] font-mono text-scada-textDim text-right flex-shrink-0">{day}</span>
                      <div className="flex flex-1 gap-0.5">
                        {HOUR_LABELS.map((_, hi) => {
                          const v = data?.heatmap[di]?.[hi] ?? 0
                          return (
                            <div
                              key={hi}
                              className="flex-1 rounded-sm"
                              style={{
                                height: 16,
                                backgroundColor: heatColor(v, heatmapMax),
                                minWidth: 3,
                              }}
                              title={`${day} ${HOUR_LABELS[hi]}: ${v} m³/h`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex items-center gap-2 mt-3 justify-end">
                    <span className="text-[9px] text-scada-textDim">Low</span>
                    {[0.1, 0.3, 0.55, 0.75, 1.0].map(t => (
                      <div key={t} className="w-5 h-3 rounded-sm"
                        style={{ backgroundColor: heatColor(t * heatmapMax, heatmapMax) }} />
                    ))}
                    <span className="text-[9px] text-scada-textDim">High</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
