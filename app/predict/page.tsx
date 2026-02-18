'use client'

import { useState } from 'react'
import { Cpu, ChevronRight, RotateCcw, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import CircularGauge from '@/components/gauges/CircularGauge'
import clsx from 'clsx'
import type { PredictionResult } from '@/lib/prediction'

interface FormState {
  timestamp:    string
  temperature:  number
  pressure:     number
  pressureDiff: number
  density:      number
  dMm:          number
  dOutMm:       number
}

const DEFAULTS: FormState = {
  timestamp:    new Date().toISOString().slice(0, 16),
  temperature:  8.4,
  pressure:     455,
  pressureDiff: 12.1,
  density:      0.728,
  dMm:          184,
  dOutMm:       301,
}

function SliderRow({
  label, value, min, max, step = 1, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit: string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={e => onChange(Number(e.target.value))}
            className="scada-input w-20 text-right text-xs py-1 px-2"
          />
          <span className="text-scada-textDim text-[10px] w-8">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[9px] text-scada-textMuted font-mono">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

const CONFIDENCE_STYLE = {
  High:   { color: 'text-scada-green', border: 'border-emerald-700/40',   bg: 'bg-emerald-950/20', icon: CheckCircle   },
  Medium: { color: 'text-scada-amber', border: 'border-amber-700/40',     bg: 'bg-amber-950/20',   icon: AlertTriangle },
  Low:    { color: 'text-scada-red',   border: 'border-red-700/40',       bg: 'bg-red-950/20',     icon: Info          },
}

export default function PredictPage() {
  const [form,    setForm]    = useState<FormState>(DEFAULTS)
  const [result,  setResult]  = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/predict', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, timestamp: new Date(form.timestamp).toISOString() }),
      })
      const json = await res.json()
      if (json.success) setResult(json.data)
      else setError(json.error ?? 'Prediction failed')
    } catch (e) {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  const confStyle = result ? CONFIDENCE_STYLE[result.confidence] : null
  const ConfIcon  = confStyle?.icon ?? Info

  return (
    <div className="max-w-[1200px] space-y-4">
      <div>
        <h1 className="text-scada-text font-bold text-lg tracking-wide flex items-center gap-2">
          <Cpu size={18} className="text-scada-cyan" />
          Gas Usage Prediction
        </h1>
        <p className="text-scada-textDim text-xs mt-1">
          Physics-informed model · Set parameters and calculate projected gas flow
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Form panel */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 scada-card p-5 space-y-5">
          <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
            Input Parameters
          </p>

          {/* Date/time */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
              Date &amp; Time
            </label>
            <input
              type="datetime-local"
              value={form.timestamp}
              onChange={e => set('timestamp', e.target.value)}
              className="scada-input"
            />
          </div>

          {/* Environmental */}
          <div className="border-t border-scada-border pt-4 space-y-4">
            <p className="text-[10px] text-scada-cyan uppercase tracking-widest">Environmental</p>
            <SliderRow label="Temperature"    value={form.temperature}  min={-20} max={45}  step={0.1} unit="°C"    onChange={v => set('temperature',  v)} />
            <SliderRow label="System Pressure" value={form.pressure}    min={200} max={700} step={5}   unit="kPa"   onChange={v => set('pressure',     v)} />
            <SliderRow label="Press. Diff."   value={form.pressureDiff} min={1}   max={50}  step={0.1} unit="kPa"   onChange={v => set('pressureDiff', v)} />
            <SliderRow label="Gas Density"    value={form.density}      min={0.6} max={0.9} step={0.001} unit="kg/m³" onChange={v => set('density', v)} />
          </div>

          {/* Pipe specs */}
          <div className="border-t border-scada-border pt-4 space-y-4">
            <p className="text-[10px] text-scada-cyan uppercase tracking-widest">Pipe Geometry</p>
            <SliderRow label="Inner Diameter (d)"  value={form.dMm}    min={50}  max={500} step={1} unit="mm" onChange={v => set('dMm',    v)} />
            <SliderRow label="Outer Diameter (D)"  value={form.dOutMm} min={60}  max={510} step={1} unit="mm" onChange={v => set('dOutMm', v)} />
            <div className="text-[10px] text-scada-textDim font-mono bg-scada-panelAlt rounded px-3 py-2 border border-scada-border">
              Wall thickness: {((form.dOutMm - form.dMm) / 2).toFixed(1)} mm ·{' '}
              Cross-section: {(Math.PI * (form.dMm / 2000) ** 2 * 1e6).toFixed(0)} cm²
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading} className="scada-btn flex-1 flex items-center justify-center gap-2">
              {loading ? <RotateCcw size={13} className="animate-spin" /> : <ChevronRight size={13} />}
              {loading ? 'Computing...' : 'Calculate'}
            </button>
            <button
              type="button"
              className="scada-btn-ghost px-3"
              onClick={() => { setForm(DEFAULTS); setResult(null); setError(null) }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {error && (
            <p className="text-scada-red text-xs bg-red-950/20 border border-red-800/40 rounded px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Result panel */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Main result */}
              <div className="scada-card p-5">
                <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold mb-4">
                  Prediction Result
                </p>
                <div className="flex flex-wrap items-center gap-6">
                  <CircularGauge
                    value={result.predictedVolume}
                    max={150}
                    label="Predicted Flow"
                    unit="m³/h"
                    size={160}
                    decimals={2}
                  />
                  <div className="space-y-3 flex-1 min-w-[160px]">
                    <div>
                      <p className="text-[10px] text-scada-textDim uppercase tracking-widest mb-1">Daily Estimate</p>
                      <p className="data-value text-scada-text font-bold text-3xl">
                        {result.dailyEstimate.toLocaleString()}
                        <span className="text-scada-textDim text-sm font-normal ml-1">m³/day</span>
                      </p>
                    </div>
                    {/* Confidence badge */}
                    <div className={clsx('flex items-center gap-2 rounded-md border px-3 py-2', confStyle?.border, confStyle?.bg)}>
                      <ConfIcon size={13} className={confStyle?.color} />
                      <div>
                        <p className={clsx('text-xs font-bold', confStyle?.color)}>
                          {result.confidence} Confidence
                        </p>
                        <p className="text-[10px] text-scada-textDim">Score: {result.confidenceScore}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-scada-panelAlt rounded px-2 py-1.5 border border-scada-border">
                        <p className="text-[9px] text-scada-textDim uppercase tracking-wider">Season</p>
                        <p className="text-xs text-scada-cyan font-semibold mt-0.5">{result.season}</p>
                      </div>
                      <div className="bg-scada-panelAlt rounded px-2 py-1.5 border border-scada-border">
                        <p className="text-[9px] text-scada-textDim uppercase tracking-wider">Period</p>
                        <p className="text-xs text-scada-text font-semibold mt-0.5">{result.peakPeriod}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Factor breakdown */}
              <div className="scada-card p-5">
                <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold mb-4">
                  Factor Breakdown
                </p>
                <div className="space-y-3">
                  {Object.entries({
                    'Temporal':    result.factors.temporal,
                    'Temperature': result.factors.temperature,
                    'Pressure':    result.factors.pressure,
                    'Pipe Factor': result.factors.pipe,
                    'Seasonal':    result.factors.seasonal,
                  }).map(([name, factor]) => {
                    const impact = Math.abs(factor - 1) * 100
                    const color  = factor > 1.15 ? '#ff1744' : factor < 0.85 ? '#00d4ff' : '#00e676'
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <p className="text-[11px] text-scada-textDim w-24 flex-shrink-0">{name}</p>
                        <div className="flex-1 h-1.5 bg-scada-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (factor / 2) * 100)}%`,
                              backgroundColor: color,
                              boxShadow: `0 0 6px ${color}50`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-scada-text w-10 text-right"
                          style={{ color }}
                        >
                          ×{factor.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Breakdown detail */}
              <div className="scada-card p-5">
                <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold mb-3">
                  Parameter Detail
                </p>
                <div className="space-y-0">
                  {result.breakdown.map(item => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between py-2 border-b border-scada-border/40 last:border-0"
                    >
                      <div>
                        <p className="text-scada-text text-xs font-medium">{item.name}</p>
                        <p className="text-scada-textDim text-[10px]">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-scada-text text-xs">
                          {item.value} <span className="text-scada-textDim">{item.unit}</span>
                        </p>
                        {item.contribution !== 100 && (
                          <p className={clsx(
                            'text-[10px] font-mono font-medium',
                            item.contribution > 0 ? 'text-scada-amber' : 'text-sky-400',
                          )}>
                            {item.contribution > 0 ? '+' : ''}{item.contribution}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="scada-card p-8 flex flex-col items-center justify-center min-h-[360px] text-center">
              <Cpu size={48} className="text-scada-textMuted mb-4" />
              <p className="text-scada-textDim text-sm">Set parameters and press Calculate</p>
              <p className="text-scada-textMuted text-xs mt-1">
                Physics-informed prediction · &lt;1ms inference
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
