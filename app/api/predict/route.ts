import { NextRequest, NextResponse } from 'next/server'
import { predictGasUsage, PredictionInput } from '@/lib/prediction'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<PredictionInput>

    const input: PredictionInput = {
      timestamp:   body.timestamp   ?? new Date().toISOString(),
      temperature: body.temperature ?? 8.4,
      pressure:    body.pressure    ?? 455,
      pressureDiff:body.pressureDiff?? 12.1,
      density:     body.density     ?? 0.728,
      dMm:         body.dMm         ?? 184,
      dOutMm:      body.dOutMm      ?? 301,
    }

    const result = predictGasUsage(input)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 400 }
    )
  }
}
