import { NextRequest, NextResponse } from 'next/server'
import { generateDataPoints } from '@/lib/data-generator'

const PERIOD_MAP: Record<string, { hours: number; interval: number }> = {
  '24h':  { hours:   24, interval: 1  },
  '7d':   { hours:  168, interval: 3  },
  '30d':  { hours:  720, interval: 12 },
  '90d':  { hours: 2160, interval: 24 },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const period   = searchParams.get('period') ?? '24h'
  const config   = PERIOD_MAP[period] ?? PERIOD_MAP['24h']

  const now    = new Date()
  const points = generateDataPoints(config.hours, config.interval, now)

  // Aggregate stats
  const volumes = points.map(p => p.volume)
  const max     = Math.max(...volumes)
  const min     = Math.min(...volumes)
  const avg     = volumes.reduce((s, v) => s + v, 0) / volumes.length
  const total   = volumes.reduce((s, v) => s + v, 0) * config.interval  // approx m³

  // Heatmap: hour × day-of-week matrix (average volume)
  const heatmap: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
  const heatCount:  number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const p of points) {
    const d = new Date(p.timestamp)
    const h = d.getHours()
    const w = d.getDay()
    heatmap[w][h]  += p.volume
    heatCount[w][h]+= 1
  }
  const heatmapAvg = heatmap.map((row, w) =>
    row.map((sum, h) => heatCount[w][h] > 0 ? Math.round(sum / heatCount[w][h] * 10) / 10 : 0)
  )

  return NextResponse.json({
    success: true,
    data: {
      period,
      points,
      stats: {
        max:   Math.round(max  * 10) / 10,
        min:   Math.round(min  * 10) / 10,
        avg:   Math.round(avg  * 10) / 10,
        total: Math.round(total),
        count: points.length,
      },
      heatmap: heatmapAvg,
    },
  })
}
