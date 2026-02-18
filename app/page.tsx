'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wind, Gauge, Thermometer, Zap, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react'
import MetricCard       from '@/components/ui/MetricCard'
import CircularGauge    from '@/components/gauges/CircularGauge'
import GasUsageChart    from '@/components/charts/GasUsageChart'
import PipeFlowDiagram  from '@/components/scada/PipeFlowDiagram'
import type { DataPoint, StationStatus, Alert } from '@/lib/data-generator'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface NetworkMetrics {
  totalFlow:      number
  avgPressure:    number
  avgTemperature: number
  avgEfficiency:  number
  activeStations: number
  totalStations:  number
}

interface DashboardData {
  timestamp:  string
  network:    NetworkMetrics
  prediction: { predictedVolume: number; confidence: string; season: string }
  stations:   StationStatus[]
  allAlerts:  Alert[]
}

const SEVERITY_ICON = {
  critical: AlertTriangle,
  warning:  AlertTriangle,
  info:     Info,
}

const SEVERITY_STYLE = {
  critical: 'border-red-700/40 bg-red-950/20 text-red-400',
  warning:  'border-amber-700/40 bg-amber-950/20 text-amber-400',
  info:     'border-sky-700/40  bg-sky-950/20   text-sky-400',
}

export default function DashboardPage() {
  const [data,    setData]    = useState<DashboardData | null>(null)
  const [history, setHistory] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, historyRes] = await Promise.all([
        fetch('/api/metrics'),
        fetch('/api/history?period=24h'),
      ])
      const metricsJson  = await metricsRes.json()
      const historyJson  = await historyRes.json()

      if (metricsJson.success)  setData(metricsJson.data)
      if (historyJson.success)  setHistory(historyJson.data.points)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30_000)  // auto-refresh every 30s
    return () => clearInterval(id)
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw size={32} className="text-scada-cyan mx-auto mb-4 animate-spin" />
          <p className="text-scada-textDim text-sm">Initializing system...</p>
        </div>
      </div>
    )
  }

  const net = data?.network
  const avg = history.length
    ? history.reduce((s, p) => s + p.volume, 0) / history.length
    : undefined

  return (
    <div className="space-y-4 max-w-[1400px]">
      {/* Page title + refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-scada-text font-bold text-lg tracking-wide">System Overview</h1>
          <p className="text-scada-textDim text-xs mt-0.5 font-mono">
            Last updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            {data?.prediction?.season && (
              <span className="ml-3 text-scada-cyan">Season: {data.prediction.season}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData() }}
          className="scada-btn-ghost flex items-center gap-2 text-xs"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Total Flow"
          value={net ? net.totalFlow.toFixed(1) : '—'}
          unit="m³/h"
          icon={Wind}
          status="normal"
          change={+2.1}
          sub={`${net?.activeStations ?? '—'} / ${net?.totalStations ?? '—'} stations active`}
        />
        <MetricCard
          title="System Pressure"
          value={net ? net.avgPressure.toFixed(0) : '—'}
          unit="kPa"
          icon={Gauge}
          status="warning"
          change={-0.8}
        />
        <MetricCard
          title="Temperature"
          value={net ? net.avgTemperature.toFixed(1) : '—'}
          unit="°C"
          icon={Thermometer}
          status="normal"
          change={-1.2}
        />
        <MetricCard
          title="Net Efficiency"
          value={net ? net.avgEfficiency.toFixed(1) : '—'}
          unit="%"
          icon={Zap}
          status="normal"
          change={+0.4}
        />
      </div>

      {/* Pipeline diagram + Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline */}
        <div className="lg:col-span-2">
          <PipeFlowDiagram stations={data?.stations ?? []} />
        </div>

        {/* Gauges */}
        <div className="scada-card p-4 flex flex-col gap-6 items-center justify-center">
          <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold self-start">
            Live Gauges
          </p>
          <CircularGauge
            value={net?.totalFlow ?? 0}
            max={400}
            label="Total Flow"
            unit="m³/h"
            size={150}
          />
          <CircularGauge
            value={net?.avgPressure ?? 0}
            max={700}
            label="Avg Pressure"
            unit="kPa"
            size={150}
          />
        </div>
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 24h chart */}
        <div className="lg:col-span-2">
          <GasUsageChart data={history} period="24h" avgVolume={avg} />
        </div>

        {/* Alerts panel */}
        <div className="scada-card p-4 flex flex-col gap-3">
          <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
            Active Alerts
          </p>

          {(data?.allAlerts ?? []).length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle size={28} className="text-scada-green mb-2" />
              <p className="text-scada-textDim text-xs">No active alerts</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto flex-1">
              {(data?.allAlerts ?? []).map(alert => {
                const Icon  = SEVERITY_ICON[alert.severity]
                const style = SEVERITY_STYLE[alert.severity]
                return (
                  <div
                    key={alert.id}
                    className={clsx(
                      'flex gap-2 p-2.5 rounded-md border',
                      style,
                      alert.acknowledged && 'opacity-50',
                    )}
                  >
                    <Icon size={13} className="flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] leading-snug">{alert.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono opacity-60">
                          {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                        </span>
                        {alert.acknowledged && (
                          <span className="text-[9px] opacity-60">· Acknowledged</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
