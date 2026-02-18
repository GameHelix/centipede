'use client'

import { useEffect, useState } from 'react'
import { Bell, Signal, AlertTriangle, CheckCircle } from 'lucide-react'
import clsx from 'clsx'

function LiveClock() {
  const [time, setTime]   = useState<string>('')
  const [date, setDate]   = useState<string>('')

  useEffect(() => {
    const tick = () => {
      const now  = new Date()
      setTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      setDate(now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-right hidden sm:block">
      <p className="font-mono text-scada-cyan text-sm font-semibold tracking-widest">{time}</p>
      <p className="font-mono text-scada-textDim text-[10px] tracking-wider uppercase">{date}</p>
    </div>
  )
}

interface HeaderProps {
  alertCount?: number
}

export default function Header({ alertCount = 2 }: HeaderProps) {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const check = () => setOnline(navigator.onLine)
    window.addEventListener('online',  check)
    window.addEventListener('offline', check)
    return () => {
      window.removeEventListener('online',  check)
      window.removeEventListener('offline', check)
    }
  }, [])

  return (
    <header className="h-16 flex-shrink-0 bg-scada-panel border-b border-scada-border
                        flex items-center justify-between px-4 md:px-6 gap-4">
      {/* Left: title / breadcrumb */}
      <div className="flex items-center gap-3 ml-10 md:ml-0">
        <div className={clsx(
          'led flex-shrink-0',
          online ? 'led-green led-pulse-green' : 'led-red led-pulse-red',
        )} />
        <div>
          <p className="text-scada-text font-semibold text-sm tracking-wide">
            Gas Distribution Network
          </p>
          <p className="text-scada-textDim text-[10px] tracking-widest uppercase font-mono">
            {online ? 'System Nominal · All Sensors Active' : 'Connection Lost'}
          </p>
        </div>
      </div>

      {/* Right: clock + status chips + alerts */}
      <div className="flex items-center gap-3">
        {/* Network status chip */}
        <div className="hidden md:flex items-center gap-1.5 bg-scada-panelAlt border border-scada-border
                         rounded px-3 py-1">
          <Signal size={12} className="text-scada-green" />
          <span className="text-[10px] font-mono text-scada-green tracking-widest uppercase">
            98.6% Uptime
          </span>
        </div>

        {/* Alert bell */}
        <button className="relative p-2 rounded-md hover:bg-scada-panelAlt transition-colors group">
          <Bell size={16} className="text-scada-textDim group-hover:text-scada-text transition-colors" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-scada-red rounded-full
                              flex items-center justify-center text-white text-[9px] font-bold
                              shadow-[0_0_6px_#ff1744]">
              {alertCount}
            </span>
          )}
        </button>

        <LiveClock />

        {/* Status badge */}
        <div className={clsx(
          'hidden lg:flex items-center gap-1.5 rounded px-3 py-1 border',
          online
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
            : 'bg-red-950/30 border-red-800/40 text-red-400',
        )}>
          {online
            ? <CheckCircle size={12} />
            : <AlertTriangle size={12} />
          }
          <span className="text-[10px] font-semibold uppercase tracking-widest">
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  )
}
