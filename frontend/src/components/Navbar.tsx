/**
 * components/Navbar.tsx — Top status bar for the security dashboard.
 */

import { useLocation } from 'react-router-dom'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'OPERATIONS CENTER', subtitle: 'Real-time cloud security overview' },
  '/assets': { title: 'ASSET INVENTORY', subtitle: 'Discovered cloud resources' },
  '/vulnerabilities': { title: 'VULNERABILITY MATRIX', subtitle: 'Detected misconfigurations' },
  '/alerts': { title: 'THREAT ALERTS', subtitle: 'Active security incidents' },
  '/logs': { title: 'LOG ANALYSIS', subtitle: 'Anomaly detection engine' },
}

export function Navbar() {
  const { pathname } = useLocation()
  const page = pageTitles[pathname] ?? { title: 'GUARDIAN', subtitle: '' }
  const now = new Date()

  return (
    <header className="h-14 bg-bg-secondary border-b border-bg-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        {/* Breadcrumb indicator */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-cyan-glow rounded-full shadow-cyan-glow-sm" />
          <span className="font-mono text-[10px] text-text-muted tracking-[0.2em]">ACSG</span>
          <span className="text-text-muted text-[10px]">/</span>
          <span className="font-mono text-xs text-text-primary tracking-wider">{page.title}</span>
        </div>
        <span className="hidden md:block font-mono text-[10px] text-text-muted">
          — {page.subtitle}
        </span>
      </div>

      <div className="flex items-center gap-6">
        {/* Live clock */}
        <div className="font-mono text-[10px] text-text-muted tracking-widest hidden sm:block">
          {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {' '}
          <span className="text-cyan-dim">{now.toLocaleTimeString('en-US', { hour12: false })}</span>
          {' UTC'}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          {[
            { label: 'ML', color: 'bg-severity-low' },
            { label: 'AWS', color: 'bg-severity-low' },
            { label: 'DB', color: 'bg-severity-medium' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${color} animate-pulse-slow`} />
              <span className="font-mono text-[9px] text-text-muted tracking-widest">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
