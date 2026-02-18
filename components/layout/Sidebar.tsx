'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Cpu,
  BarChart3,
  Radio,
  ChevronLeft,
  Flame,
  Menu,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/predict',   label: 'Predict',    icon: Cpu             },
  { href: '/analytics', label: 'Analytics',  icon: BarChart3       },
  { href: '/monitor',   label: 'Monitor',    icon: Radio           },
]

export default function Sidebar() {
  const pathname    = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden scada-btn-ghost p-2 rounded-md"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <Menu size={18} className="text-scada-cyan" />
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          'flex flex-col flex-shrink-0 bg-scada-panel border-r border-scada-border',
          'transition-all duration-300 ease-in-out z-40',
          // Desktop
          'hidden md:flex',
          collapsed ? 'w-16' : 'w-56',
          // Mobile overlay
          mobileOpen && '!flex fixed inset-y-0 left-0 w-56 shadow-2xl',
        )}
      >
        {/* Logo */}
        <div className={clsx(
          'flex items-center gap-3 px-4 h-16 border-b border-scada-border flex-shrink-0',
          collapsed && 'justify-center px-0',
        )}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600
                          flex items-center justify-center shadow-lg">
            <Flame size={16} className="text-scada-bg" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-scada-text font-bold text-sm tracking-wide leading-none">
                GazMonitor
              </p>
              <p className="text-scada-textDim text-[10px] mt-0.5 tracking-wider uppercase">
                Industrial
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 group',
                  collapsed ? 'justify-center' : '',
                  active
                    ? 'bg-scada-panelAlt text-scada-cyan border border-scada-border'
                    : 'text-scada-textDim hover:text-scada-text hover:bg-scada-panelAlt/50',
                )}
                title={collapsed ? label : undefined}
              >
                <Icon
                  size={16}
                  className={clsx(
                    'flex-shrink-0 transition-colors',
                    active
                      ? 'text-scada-cyan drop-shadow-[0_0_6px_rgba(0,212,255,0.8)]'
                      : 'text-scada-textDim group-hover:text-scada-text',
                  )}
                />
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide">
                    {label}
                  </span>
                )}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-scada-cyan
                                   shadow-[0_0_6px_#00d4ff]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Version / collapse toggle */}
        <div className={clsx(
          'border-t border-scada-border px-4 py-3 flex-shrink-0',
          collapsed ? 'flex justify-center px-2' : 'flex items-center justify-between',
        )}>
          {!collapsed && (
            <span className="text-[10px] text-scada-textMuted font-mono tracking-widest uppercase">
              v1.0.0
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-scada-textDim hover:text-scada-cyan transition-colors p-1 rounded"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              size={14}
              className={clsx('transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>
      </aside>
    </>
  )
}
