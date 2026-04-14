/**
 * components/Sidebar.tsx — SOC terminal-style navigation sidebar.
 */

import { NavLink } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import clsx from 'clsx'

interface NavItem {
  path: string
  label: string
  icon: string
  tag?: string
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'DASHBOARD', icon: '◈', tag: 'OVERVIEW' },
  { path: '/assets', label: 'ASSETS', icon: '◫', tag: 'INVENTORY' },
  { path: '/vulnerabilities', label: 'VULNS', icon: '◬', tag: 'MISCONFIG' },
  { path: '/alerts', label: 'ALERTS', icon: '◉', tag: 'THREATS' },
  { path: '/logs', label: 'LOG ANALYSIS', icon: '◈', tag: 'ANOMALY' },
]

export function Sidebar() {
  const { username, logout } = useAuthContext()

  return (
    <aside className="w-64 h-screen bg-bg-secondary border-r border-bg-border flex flex-col shrink-0 relative overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50 pointer-events-none" />

      {/* Logo / Header */}
      <div className="relative p-6 border-b border-bg-border">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 border border-cyan-glow/60 flex items-center justify-center text-cyan-glow text-sm shadow-cyan-glow-sm">
            ⬡
          </div>
          <div>
            <div className="font-mono text-[10px] text-text-secondary tracking-[0.2em] uppercase">AI Cloud</div>
            <div className="font-mono text-xs text-cyan-glow tracking-widest font-semibold">GUARDIAN</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-severity-low animate-pulse-slow" />
          <span className="font-mono text-[10px] text-severity-low tracking-widest">SYS ACTIVE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="font-mono text-[9px] text-text-muted tracking-[0.25em] px-3 py-2">NAVIGATION</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'group flex items-center gap-3 px-3 py-2.5 rounded text-xs font-mono tracking-wider transition-all duration-200',
                isActive
                  ? 'bg-cyan-muted/30 text-cyan-glow border border-cyan-dim/40 shadow-cyan-glow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-transparent'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={clsx('text-sm transition-colors', isActive ? 'text-cyan-glow' : 'text-text-muted group-hover:text-text-secondary')}>
                  {item.icon}
                </span>
                <div className="flex-1">
                  <div>{item.label}</div>
                  <div className={clsx('text-[9px] tracking-[0.15em] mt-0.5', isActive ? 'text-cyan-dim' : 'text-text-muted')}>
                    {item.tag}
                  </div>
                </div>
                {isActive && (
                  <div className="w-1 h-4 bg-cyan-glow rounded-full shadow-cyan-glow-sm" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="relative p-4 border-t border-bg-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-sm bg-bg-elevated border border-bg-border flex items-center justify-center text-[10px] font-mono text-cyan-glow font-semibold">
            {username?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="font-mono text-xs text-text-primary">{username}</div>
            <div className="font-mono text-[9px] text-text-muted tracking-widest">OPERATOR</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full font-mono text-[10px] tracking-widest text-text-secondary hover:text-severity-critical border border-bg-border hover:border-severity-critical/40 py-1.5 rounded transition-all duration-200"
        >
          TERMINATE SESSION
        </button>
      </div>
    </aside>
  )
}
