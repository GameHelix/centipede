'use client'

import { useEffect, useState, useCallback } from 'react'
import { Radio, RefreshCw, AlertTriangle, CheckCircle, WifiOff, Info } from 'lucide-react'
import StationCard from '@/components/ui/StationCard'
import type { StationStatus, Alert } from '@/lib/data-generator'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface MonitorData {
  timestamp:  string
  network:    {
    totalFlow:      number
    avgPressure:    number
    avgTemperature: number
    avgEfficiency:  number
    activeStations: number
    totalStations:  number
  }
  stations:  StationStatus[]
  allAlerts: Alert[]
}

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-950/20',    border: 'border-red-700/40',    text: 'text-red-400',    icon: AlertTriangle },
  warning:  { bg: 'bg-amber-950/20',  border: 'border-amber-700/40',  text: 'text-amber-400',  icon: AlertTriangle },
  info:     { bg: 'bg-sky-950/20',    border: 'border-sky-700/40',    text: 'text-sky-400',    icon: Info          },
}

const STATUS_FILTER_OPTIONS = ['All', 'Normal', 'Warning', 'Alert', 'Offline'] as const
type FilterOption = typeof STATUS_FILTER_OPTIONS[number]

export default function MonitorPage() {
  const [data,    setData]    = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<FilterOption>('All')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch('/api/metrics')
      const json = await res.json()
      if (json.success) setData(json.data)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 15_000)
    return () => clearInterval(id)
  }, [fetchData])

  const stations = (data?.stations ?? []).filter(s => {
    if (filter === 'All')     return true
    if (filter === 'Normal')  return s.status === 'normal'
    if (filter === 'Warning') return s.status === 'warning'
    if (filter === 'Alert')   return s.status === 'alert'
    if (filter === 'Offline') return s.status === 'offline'
    return true
  })

  const countsByStatus = (data?.stations ?? []).reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const net = data?.network

  return (
    <div className="max-w-[1400px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-scada-text font-bold text-lg tracking-wide flex items-center gap-2">
            <Radio size={18} className="text-scada-cyan" />
            Station Monitor
          </h1>
          <p className="text-scada-textDim text-xs mt-0.5 font-mono">
            Auto-refreshes every 15s · Last: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
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

      {/* Network summary row */}
      {net && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Active',   value: `${net.activeStations}/${net.totalStations}`,  color: 'text-scada-green' },
            { label: 'Total Flow', value: `${net.totalFlow.toFixed(1)} m³/h`,          color: 'text-scada-cyan'  },
            { label: 'Avg Press', value: `${net.avgPressure.toFixed(0)} kPa`,          color: 'text-scada-text'  },
            { label: 'Avg Temp',  value: `${net.avgTemperature.toFixed(1)} °C`,        color: 'text-scada-text'  },
            { label: 'Efficiency',value: `${net.avgEfficiency.toFixed(1)} %`,          color: 'text-scada-green' },
            { label: 'Alerts',   value: `${(data?.allAlerts ?? []).filter(a => !a.acknowledged).length}`,
              color: (data?.allAlerts ?? []).filter(a => !a.acknowledged).length > 0
                ? 'text-scada-red' : 'text-scada-green' },
          ].map(({ label, value, color }) => (
            <div key={label} className="scada-card px-3 py-2 text-center">
              <p className="text-[9px] text-scada-textDim uppercase tracking-wider mb-1">{label}</p>
              <p className={clsx('data-value font-bold text-sm', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={clsx(
              'px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest transition-all border',
              filter === opt
                ? 'bg-scada-panelAlt text-scada-cyan border-scada-border'
                : 'text-scada-textDim border-transparent hover:border-scada-border hover:text-scada-text',
            )}
          >
            {opt}
            {opt !== 'All' && countsByStatus[opt.toLowerCase()] !== undefined && (
              <span className="ml-1.5 opacity-60">({countsByStatus[opt.toLowerCase()] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <RefreshCw size={28} className="text-scada-cyan animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {stations.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
              <WifiOff size={40} className="text-scada-textMuted mb-3" />
              <p className="text-scada-textDim">No stations match this filter</p>
            </div>
          ) : (
            stations.map(station => (
              <StationCard key={station.id} station={station} />
            ))
          )}
        </div>
      )}

      {/* Alert log */}
      {(data?.allAlerts ?? []).length > 0 && (
        <div className="scada-card p-4">
          <p className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold mb-3">
            Event Log
          </p>
          <div className="space-y-2">
            {(data?.allAlerts ?? []).map(alert => {
              const cfg  = SEVERITY_COLORS[alert.severity]
              const Icon = cfg.icon
              return (
                <div
                  key={alert.id}
                  className={clsx(
                    'flex items-start gap-3 rounded-md border px-3 py-2.5',
                    cfg.bg, cfg.border,
                    alert.acknowledged && 'opacity-50',
                  )}
                >
                  <Icon size={13} className={clsx('flex-shrink-0 mt-0.5', cfg.text)} />
                  <div className="flex-1 min-w-0">
                    <p className={clsx('text-xs font-medium', cfg.text)}>{alert.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-mono text-scada-textDim">
                        Station: {alert.station}
                      </span>
                      <span className="text-[10px] font-mono text-scada-textDim">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                      {alert.acknowledged && (
                        <span className="flex items-center gap-1 text-[10px] text-scada-green">
                          <CheckCircle size={9} /> Acknowledged
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border flex-shrink-0',
                    cfg.text, cfg.border, cfg.bg,
                  )}>
                    {alert.severity}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
