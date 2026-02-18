import clsx from 'clsx'
import { Wind, Gauge, Thermometer, Zap, WifiOff } from 'lucide-react'
import type { StationStatus } from '@/lib/data-generator'
import { formatDistanceToNow } from 'date-fns'

const STATUS_CONFIG = {
  normal:  { label: 'Nominal',  border: 'border-scada-border',       led: 'led-green',  text: 'text-scada-green'  },
  warning: { label: 'Warning',  border: 'border-amber-700/40',        led: 'led-amber',  text: 'text-scada-amber'  },
  alert:   { label: 'Alert',    border: 'border-red-700/50',          led: 'led-red led-pulse-red', text: 'text-scada-red' },
  offline: { label: 'Offline',  border: 'border-scada-textMuted/30',  led: 'led-gray',   text: 'text-scada-textDim'},
}

interface StationCardProps {
  station: StationStatus
}

function StatRow({
  icon: Icon, label, value, unit,
}: { icon: React.ElementType; label: string; value: string | number; unit: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-scada-border/50 last:border-0">
      <div className="flex items-center gap-1.5 text-scada-textDim">
        <Icon size={11} />
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <span className="font-mono text-scada-text text-xs font-medium">
        {value} <span className="text-scada-textDim text-[9px]">{unit}</span>
      </span>
    </div>
  )
}

export default function StationCard({ station }: StationCardProps) {
  const s = STATUS_CONFIG[station.status]

  let timeAgo = '—'
  try {
    timeAgo = formatDistanceToNow(new Date(station.lastUpdated), { addSuffix: true })
  } catch {}

  return (
    <div className={clsx('scada-card p-4 flex flex-col gap-3 border', s.border)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={clsx('led flex-shrink-0', s.led)} />
            <span className="text-scada-text font-semibold text-sm">{station.name}</span>
          </div>
          <p className="text-scada-textDim text-[10px] tracking-wide pl-4">{station.location}</p>
        </div>
        <span className={clsx(
          'scada-badge border',
          station.status === 'normal'  && 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400',
          station.status === 'warning' && 'bg-amber-950/30   border-amber-800/30  text-amber-400',
          station.status === 'alert'   && 'bg-red-950/30     border-red-800/30    text-red-400',
          station.status === 'offline' && 'bg-scada-panelAlt border-scada-border  text-scada-textDim',
        )}>
          {station.status === 'offline' && <WifiOff size={9} />}
          {s.label}
        </span>
      </div>

      {/* Stats */}
      {station.status !== 'offline' ? (
        <div className="space-y-0.5">
          <StatRow icon={Wind}        label="Flow"        value={station.currentFlow.toFixed(1)} unit="m³/h" />
          <StatRow icon={Gauge}       label="Pressure"    value={station.pressure.toFixed(0)}    unit="kPa"  />
          <StatRow icon={Thermometer} label="Temperature" value={station.temperature.toFixed(1)} unit="°C"   />
          <StatRow icon={Zap}         label="Efficiency"  value={station.efficiency.toFixed(1)}  unit="%"    />
        </div>
      ) : (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <WifiOff size={24} className="text-scada-textMuted mx-auto mb-2" />
            <p className="text-[11px] text-scada-textDim">No data available</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-[9px] text-scada-textMuted font-mono border-t border-scada-border/40 pt-2">
        Updated {timeAgo}
      </p>
    </div>
  )
}
