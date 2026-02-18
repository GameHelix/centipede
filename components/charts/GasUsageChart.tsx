'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { DataPoint } from '@/lib/data-generator'
import { format } from 'date-fns'

interface CustomTooltipProps {
  active?:  boolean
  payload?: Array<{ value: number }>
  label?:   string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-scada-panelAlt border border-scada-border rounded-md px-3 py-2 shadow-xl">
      <p className="text-[10px] text-scada-textDim font-mono mb-1">{label}</p>
      <p className="text-scada-cyan font-bold font-mono text-sm">
        {payload[0].value.toFixed(1)} <span className="text-[10px] text-scada-textDim">m³/h</span>
      </p>
    </div>
  )
}

interface GasUsageChartProps {
  data:        DataPoint[]
  period?:     string
  avgVolume?:  number
}

export default function GasUsageChart({ data, period = '24h', avgVolume }: GasUsageChartProps) {
  const formatTick = (ts: string) => {
    const d = new Date(ts)
    if (period === '24h') return format(d, 'HH:mm')
    if (period === '7d')  return format(d, 'EEE HH:mm')
    return format(d, 'dd MMM')
  }

  const chartData = data.map(p => ({
    ...p,
    label: formatTick(p.timestamp),
  }))

  // Downsample for readability if too many points
  const sampled = chartData.length > 80
    ? chartData.filter((_, i) => i % Math.ceil(chartData.length / 80) === 0)
    : chartData

  return (
    <div className="scada-card p-4 h-full">
      <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold mb-4">
        Gas Flow Rate — {period.toUpperCase()} History
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={sampled} margin={{ top: 8, right: 4, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#00d4ff" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.01} />
            </linearGradient>
            <filter id="line-glow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1a3352" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: '#4a7090', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#1a3352' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: '#4a7090', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}`}
            domain={['auto', 'auto']}
          />

          <Tooltip content={<CustomTooltip />} />

          {avgVolume && (
            <ReferenceLine
              y={avgVolume}
              stroke="#ffab00"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: `avg ${avgVolume.toFixed(1)}`, fill: '#ffab00', fontSize: 9, position: 'insideTopRight' }}
            />
          )}

          <Area
            type="monotone"
            dataKey="volume"
            stroke="#00d4ff"
            strokeWidth={2}
            fill="url(#gasGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#00d4ff', strokeWidth: 0, filter: 'url(#line-glow)' }}
            filter="url(#line-glow)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
