import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import clsx from 'clsx'

interface MetricCardProps {
  title:    string
  value:    string | number
  unit:     string
  icon:     LucideIcon
  status?:  'normal' | 'warning' | 'alert' | 'offline'
  change?:  number   // signed %, e.g. +3.2 or -1.1
  sub?:     string
  large?:   boolean
}

const STATUS_STYLES = {
  normal:  { border: 'border-scada-border',               glow: '',               ledClass: 'led-green',  label: 'Normal'  },
  warning: { border: 'border-amber-700/50',                glow: 'shadow-amber-500/10', ledClass: 'led-amber',  label: 'Warning' },
  alert:   { border: 'border-red-700/50',                  glow: 'shadow-red-500/10',   ledClass: 'led-red led-pulse-red',    label: 'Alert'   },
  offline: { border: 'border-scada-textMuted/30',          glow: '',               ledClass: 'led-gray',   label: 'Offline' },
}

export default function MetricCard({
  title, value, unit, icon: Icon, status = 'normal', change, sub, large,
}: MetricCardProps) {
  const s = STATUS_STYLES[status]

  const trendIcon =
    change === undefined ? null :
    change > 0  ? <TrendingUp  size={11} /> :
    change < 0  ? <TrendingDown size={11} /> :
                  <Minus size={11} />

  const trendColor =
    change === undefined ? '' :
    change > 0  ? 'text-scada-amber' :
    change < 0  ? 'text-sky-400' :
                  'text-scada-textDim'

  return (
    <div className={clsx(
      'scada-card relative p-4 flex flex-col justify-between gap-3',
      'border shadow-lg transition-all duration-200 hover:shadow-xl',
      s.border, s.glow,
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={clsx('led flex-shrink-0', s.ledClass)} />
          <span className="text-[11px] text-scada-textDim uppercase tracking-widest font-semibold">
            {title}
          </span>
        </div>
        <div className="p-1.5 rounded-md bg-scada-panelAlt border border-scada-border flex-shrink-0">
          <Icon size={13} className="text-scada-cyan opacity-70" />
        </div>
      </div>

      {/* Value */}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={clsx(
            'data-value text-scada-text font-bold leading-none',
            large ? 'text-4xl' : 'text-2xl',
          )}>
            {status === 'offline' ? '—' : value}
          </span>
          <span className="text-scada-textDim text-xs font-mono">{unit}</span>
        </div>

        {sub && (
          <p className="text-[11px] text-scada-textDim mt-1">{sub}</p>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && status !== 'offline' && (
        <div className={clsx('flex items-center gap-1 text-[11px] font-medium', trendColor)}>
          {trendIcon}
          <span className="font-mono">
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-scada-textMuted ml-1">vs prev</span>
        </div>
      )}
    </div>
  )
}
