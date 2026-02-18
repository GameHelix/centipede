import { NextResponse } from 'next/server'
import { generateStations, generateAlerts } from '@/lib/data-generator'
import { predictGasUsage } from '@/lib/prediction'

export async function GET() {
  const now = new Date()

  const stations = generateStations(now)
  const alerts   = generateAlerts(now)

  // Current network-wide metrics
  const activeStations = stations.filter(s => s.status !== 'offline')
  const totalFlow      = activeStations.reduce((sum, s) => sum + s.currentFlow, 0)
  const avgPressure    = activeStations.reduce((sum, s) => sum + s.pressure, 0) / (activeStations.length || 1)
  const avgTemp        = stations.reduce((sum, s) => sum + s.temperature, 0) / stations.length
  const avgEfficiency  = activeStations.reduce((sum, s) => sum + s.efficiency, 0) / (activeStations.length || 1)

  // Predict current hour
  const prediction = predictGasUsage({
    timestamp:    now.toISOString(),
    temperature:  Math.round(avgTemp * 10) / 10,
    pressure:     Math.round(avgPressure),
    pressureDiff: 12.1,
    density:      0.728,
    dMm:          184,
    dOutMm:       301,
  })

  return NextResponse.json({
    success: true,
    data: {
      timestamp:      now.toISOString(),
      network: {
        totalFlow:      Math.round(totalFlow * 10) / 10,
        avgPressure:    Math.round(avgPressure * 10) / 10,
        avgTemperature: Math.round(avgTemp * 10) / 10,
        avgEfficiency:  Math.round(avgEfficiency * 10) / 10,
        activeStations: activeStations.length,
        totalStations:  stations.length,
      },
      prediction,
      stations,
      alerts:       alerts.filter(a => !a.acknowledged),
      allAlerts:    alerts,
    },
  })
}
