/**
 * pages/Alerts.tsx — Security alert management page.
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getAlerts } from '@/services/api'
import { AlertTable } from '@/components/AlertTable'
import { TableSkeleton } from '@/components/Loader'
import type { Severity } from '@/types'
import clsx from 'clsx'

type SourceFilter = 'all' | 'misconfiguration' | 'log_anomaly' | 'ml'

export function Alerts() {
  const [severity, setSeverity] = useState<Severity | ''>('')
  const [source, setSource] = useState<SourceFilter>('all')
  const [showResolved, setShowResolved] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', severity, source, showResolved],
    queryFn: () =>
      getAlerts({
        severity: severity || undefined,
        source: source !== 'all' ? source : undefined,
        resolved: showResolved,
        limit: 100,
      }),
    staleTime: 15_000,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['alerts'] })

  const severities: Array<{ val: Severity | ''; label: string }> = [
    { val: '', label: 'ALL' },
    { val: 'Critical', label: 'CRITICAL' },
    { val: 'High', label: 'HIGH' },
    { val: 'Medium', label: 'MEDIUM' },
    { val: 'Low', label: 'LOW' },
  ]

  const sources: Array<{ val: SourceFilter; label: string }> = [
    { val: 'all', label: 'ALL SOURCES' },
    { val: 'misconfiguration', label: 'MISCONFIG' },
    { val: 'log_anomaly', label: 'LOG ANOMALY' },
    { val: 'ml', label: 'ML ENGINE' },
  ]

  const criticalCount = data?.alerts.filter((a) => a.severity === 'Critical' && !a.is_resolved).length ?? 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-1">INCIDENT MANAGEMENT</div>
          <h2 className="font-mono text-lg text-text-primary tracking-wide">Threat Alerts</h2>
        </div>

        {/* Critical counter badge */}
        {criticalCount > 0 && (
          <div className="flex items-center gap-2 bg-severity-critical/10 border border-severity-critical/30 px-3 py-1.5 rounded shadow-critical">
            <div className="w-1.5 h-1.5 bg-severity-critical rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-severity-critical tracking-widest">
              {criticalCount} CRITICAL UNRESOLVED
            </span>
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        {/* Severity filters */}
        <div className="flex flex-wrap gap-2">
          {severities.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setSeverity(val)}
              className={clsx(
                'font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-all duration-200',
                severity === val
                  ? 'border-cyan-dim/50 bg-cyan-muted/20 text-cyan-glow'
                  : 'border-bg-border text-text-secondary hover:border-bg-elevated hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          {/* Resolved toggle */}
          <button
            onClick={() => setShowResolved((v) => !v)}
            className={clsx(
              'font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-all duration-200',
              showResolved
                ? 'border-severity-low/40 text-severity-low bg-severity-low/10'
                : 'border-bg-border text-text-secondary hover:text-text-primary'
            )}
          >
            {showResolved ? '◉ SHOWING RESOLVED' : '○ SHOW RESOLVED'}
          </button>
        </div>

        {/* Source filters */}
        <div className="flex flex-wrap gap-2">
          {sources.map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setSource(val)}
              className={clsx(
                'font-mono text-[9px] tracking-wider px-2.5 py-1 rounded border transition-all duration-200',
                source === val
                  ? 'border-text-secondary/40 text-text-primary'
                  : 'border-bg-border text-text-muted hover:text-text-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="font-mono text-[10px] text-text-muted tracking-widest">
        {data?.total ?? 0} ALERT{(data?.total ?? 0) !== 1 ? 'S' : ''} FOUND
      </div>

      {/* Table */}
      <div className="bg-bg-card border border-bg-border rounded-lg">
        {isLoading ? (
          <div className="p-5"><TableSkeleton rows={8} /></div>
        ) : error ? (
          <div className="p-6 font-mono text-sm text-severity-critical">
            Failed to load alerts. Check API connectivity.
          </div>
        ) : (
          <AlertTable alerts={data?.alerts ?? []} onRefresh={refresh} />
        )}
      </div>
    </div>
  )
}
