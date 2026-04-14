/**
 * components/AlertTable.tsx — Security alerts table with severity color coding.
 */

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import type { Alert, Severity } from '@/types'
import { acknowledgeAlert, resolveAlert } from '@/services/api'

const SEVERITY_STYLES: Record<Severity, { badge: string; row: string; dot: string }> = {
  Critical: {
    badge: 'bg-severity-critical/15 text-severity-critical border border-severity-critical/30',
    row: 'hover:bg-severity-critical/5 border-l-severity-critical',
    dot: 'bg-severity-critical shadow-critical',
  },
  High: {
    badge: 'bg-severity-high/15 text-severity-high border border-severity-high/30',
    row: 'hover:bg-severity-high/5 border-l-severity-high',
    dot: 'bg-severity-high',
  },
  Medium: {
    badge: 'bg-severity-medium/15 text-severity-medium border border-severity-medium/30',
    row: 'hover:bg-severity-medium/5 border-l-severity-medium',
    dot: 'bg-severity-medium',
  },
  Low: {
    badge: 'bg-severity-low/15 text-severity-low border border-severity-low/30',
    row: 'hover:bg-severity-low/5 border-l-severity-low',
    dot: 'bg-severity-low',
  },
  Info: {
    badge: 'bg-bg-elevated text-text-secondary border border-bg-border',
    row: 'hover:bg-bg-elevated/50 border-l-text-muted',
    dot: 'bg-text-muted',
  },
}

interface AlertTableProps {
  alerts: Alert[]
  onRefresh?: () => void
  compact?: boolean
}

interface AlertRowProps {
  alert: Alert
  onRefresh?: () => void
}

function AlertRow({ alert, onRefresh }: AlertRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const styles = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.Info

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await acknowledgeAlert(alert.id)
      onRefresh?.()
    } catch {
      // Error is handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await resolveAlert(alert.id)
      onRefresh?.()
    } catch {
      // Error is handled by API interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className={clsx(
          'border-b border-bg-border border-l-2 cursor-pointer transition-all duration-150',
          styles.row
        )}
      >
        {/* Severity */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={clsx('w-1.5 h-1.5 rounded-full', styles.dot,
              alert.severity === 'Critical' && 'animate-pulse')} />
            <span className={clsx('font-mono text-[10px] tracking-widest px-1.5 py-0.5 rounded', styles.badge)}>
              {alert.severity.toUpperCase()}
            </span>
          </div>
        </td>

        {/* Title */}
        <td className="px-4 py-3 max-w-xs">
          <div className="font-mono text-xs text-text-primary truncate">{alert.title}</div>
          <div className="font-mono text-[10px] text-text-muted mt-0.5">{alert.resource_type}</div>
        </td>

        {/* Resource */}
        <td className="px-4 py-3 hidden md:table-cell">
          <span className="font-mono text-[10px] text-cyan-dim bg-bg-elevated px-2 py-0.5 rounded">
            {alert.resource_id}
          </span>
        </td>

        {/* Source */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="font-mono text-[10px] text-text-secondary">
            {alert.source.replace('_', ' ').toUpperCase()}
          </span>
        </td>

        {/* Time */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="font-mono text-[10px] text-text-muted">
            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {alert.is_resolved ? (
              <span className="font-mono text-[9px] text-severity-low tracking-widest">RESOLVED</span>
            ) : alert.is_acknowledged ? (
              <span className="font-mono text-[9px] text-severity-medium tracking-widest">ACK</span>
            ) : (
              <div className="flex gap-1">
                {!loading ? (
                  <>
                    <button
                      onClick={handleAcknowledge}
                      className="font-mono text-[9px] text-text-secondary hover:text-severity-medium border border-bg-border hover:border-severity-medium/40 px-1.5 py-0.5 rounded transition-colors"
                    >
                      ACK
                    </button>
                    <button
                      onClick={handleResolve}
                      className="font-mono text-[9px] text-text-secondary hover:text-severity-low border border-bg-border hover:border-severity-low/40 px-1.5 py-0.5 rounded transition-colors"
                    >
                      RESOLVE
                    </button>
                  </>
                ) : (
                  <span className="font-mono text-[9px] text-text-muted animate-pulse">...</span>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded remediation row */}
      {expanded && (
        <tr className="border-b border-bg-border bg-bg-secondary/50">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-mono text-[9px] text-text-muted tracking-widest mb-2">DESCRIPTION</div>
                <div className="font-mono text-xs text-text-secondary leading-relaxed">
                  {alert.description}
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] text-cyan-dim tracking-widest mb-2">REMEDIATION</div>
                <div className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                  {alert.remediation_advice || 'No remediation guidance available.'}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function AlertTable({ alerts, onRefresh, compact = false }: AlertTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3 opacity-30">◉</div>
        <div className="font-mono text-sm text-text-secondary">No alerts found.</div>
        <div className="font-mono text-[10px] text-text-muted mt-1">System operating within normal parameters.</div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bg-border">
            {['SEVERITY', 'TITLE', 'RESOURCE', 'SOURCE', 'TIME', 'ACTION'].map((h, i) => (
              <th
                key={h}
                className={clsx(
                  'px-4 py-2 text-left font-mono text-[9px] tracking-[0.2em] text-text-muted',
                  i >= 2 && i <= 3 && 'hidden md:table-cell',
                  i === 2 && 'hidden md:table-cell',
                  i === 3 && 'hidden lg:table-cell',
                  i === 4 && 'hidden sm:table-cell',
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(compact ? alerts.slice(0, 5) : alerts).map((alert) => (
            <AlertRow key={alert.id} alert={alert} onRefresh={onRefresh} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
