/**
 * pages/Vulnerabilities.tsx — Misconfiguration findings with severity filter.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getVulnerabilities, getAdvisorRecommendation } from '@/services/api'
import { PageLoader, TableSkeleton } from '@/components/Loader'
import type { Vulnerability, Severity } from '@/types'
import clsx from 'clsx'

const SEVERITY_ORDER: Severity[] = ['Critical', 'High', 'Medium', 'Low', 'Info']

const SEVERITY_STYLES: Record<Severity, string> = {
  Critical: 'text-severity-critical border-severity-critical/30 bg-severity-critical/10',
  High: 'text-severity-high border-severity-high/30 bg-severity-high/10',
  Medium: 'text-severity-medium border-severity-medium/30 bg-severity-medium/10',
  Low: 'text-severity-low border-severity-low/30 bg-severity-low/10',
  Info: 'text-text-secondary border-bg-border bg-bg-elevated',
}

const SEVERITY_LEFT: Record<Severity, string> = {
  Critical: 'border-l-severity-critical',
  High: 'border-l-severity-high',
  Medium: 'border-l-severity-medium',
  Low: 'border-l-severity-low',
  Info: 'border-l-text-muted',
}

export function Vulnerabilities() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'All'>('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [advisorData, setAdvisorData] = useState<Record<string, string>>({})
  const [loadingAdvisor, setLoadingAdvisor] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['vulnerabilities', severityFilter],
    queryFn: () =>
      getVulnerabilities({
        severity: severityFilter !== 'All' ? severityFilter : undefined,
        limit: 200,
      }),
    staleTime: 30_000,
  })

  const handleExpand = async (vuln: Vulnerability) => {
    const newId = expandedId === vuln.id ? null : vuln.id
    setExpandedId(newId)

    // Fetch AI recommendation if not yet loaded
    if (newId && !advisorData[vuln.rule_id]) {
      setLoadingAdvisor(vuln.rule_id)
      try {
        const rec = await getAdvisorRecommendation({ rule_id: vuln.rule_id })
        setAdvisorData((prev) => ({ ...prev, [vuln.rule_id]: rec.recommendation }))
      } catch {
        setAdvisorData((prev) => ({ ...prev, [vuln.rule_id]: 'Unable to load AI recommendation.' }))
      } finally {
        setLoadingAdvisor(null)
      }
    }
  }

  // Count per severity
  const counts = SEVERITY_ORDER.reduce((acc, s) => {
    acc[s] = data?.vulnerabilities.filter((v) => v.severity === s).length ?? 0
    return acc
  }, {} as Record<Severity, number>)

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-1">DETECTION ENGINE</div>
        <h2 className="font-mono text-lg text-text-primary tracking-wide">Vulnerability Matrix</h2>
      </div>

      {/* Severity filter tabs */}
      <div className="flex flex-wrap gap-2">
        <FilterTab
          label="All"
          count={data?.total ?? 0}
          active={severityFilter === 'All'}
          onClick={() => setSeverityFilter('All')}
        />
        {SEVERITY_ORDER.slice(0, 4).map((s) => (
          <FilterTab
            key={s}
            label={s}
            count={counts[s]}
            active={severityFilter === s}
            onClick={() => setSeverityFilter(s)}
            severity={s}
          />
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorMessage />
      ) : !data?.vulnerabilities.length ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {data.vulnerabilities.map((vuln) => (
            <VulnRow
              key={vuln.id}
              vuln={vuln}
              expanded={expandedId === vuln.id}
              onToggle={() => handleExpand(vuln)}
              aiRecommendation={advisorData[vuln.rule_id]}
              loadingAI={loadingAdvisor === vuln.rule_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FilterTabProps {
  label: string
  count: number
  active: boolean
  onClick: () => void
  severity?: Severity
}

function FilterTab({ label, count, active, onClick, severity }: FilterTabProps) {
  const severityActive = severity ? SEVERITY_STYLES[severity] : ''
  return (
    <button
      onClick={onClick}
      className={clsx(
        'font-mono text-[10px] tracking-wider px-3 py-1.5 rounded border transition-all duration-200 flex items-center gap-2',
        active && severity
          ? `border ${severityActive}`
          : active
          ? 'border-cyan-dim/50 bg-cyan-muted/20 text-cyan-glow'
          : 'border-bg-border text-text-secondary hover:border-bg-elevated hover:text-text-primary'
      )}
    >
      {label.toUpperCase()}
      <span className={clsx('text-[9px] font-semibold', active ? '' : 'text-text-muted')}>{count}</span>
    </button>
  )
}

interface VulnRowProps {
  vuln: Vulnerability
  expanded: boolean
  onToggle: () => void
  aiRecommendation?: string
  loadingAI: boolean
}

function VulnRow({ vuln, expanded, onToggle, aiRecommendation, loadingAI }: VulnRowProps) {
  return (
    <div className={clsx(
      'bg-bg-card border border-l-2 rounded-lg overflow-hidden transition-all duration-200',
      SEVERITY_LEFT[vuln.severity as Severity] ?? 'border-l-text-muted',
      'border-t-bg-border border-r-bg-border border-b-bg-border'
    )}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-3.5 flex items-center gap-4 text-left hover:bg-bg-elevated/30 transition-colors"
      >
        {/* Rule ID */}
        <span className="font-mono text-[10px] text-text-muted bg-bg-elevated px-2 py-0.5 rounded shrink-0 hidden sm:block">
          {vuln.rule_id}
        </span>

        {/* Severity badge */}
        <span className={clsx(
          'font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded border shrink-0',
          SEVERITY_STYLES[vuln.severity as Severity] ?? 'text-text-secondary'
        )}>
          {vuln.severity.toUpperCase()}
        </span>

        {/* Issue */}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-xs text-text-primary truncate">{vuln.issue}</div>
          <div className="font-mono text-[10px] text-text-muted mt-0.5">
            {vuln.resource_type} · {vuln.asset_id}
          </div>
        </div>

        {/* Risk score */}
        <div className="shrink-0 hidden md:flex flex-col items-end gap-0.5">
          <div className="font-mono text-[10px] text-text-muted">RISK</div>
          <div className={clsx('font-mono text-sm font-semibold', SEVERITY_STYLES[vuln.severity as Severity]?.split(' ')[0])}>
            {(vuln.risk_score * 100).toFixed(0)}%
          </div>
        </div>

        {/* Expand indicator */}
        <span className={clsx('text-text-muted text-xs transition-transform duration-200', expanded && 'rotate-180')}>
          ▾
        </span>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-bg-border px-5 py-4 grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">
          <div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-text-muted mb-2">BACKEND REMEDIATION</div>
            <div className="font-mono text-xs text-text-secondary leading-relaxed">
              {vuln.remediation || 'No remediation details available.'}
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-cyan-dim mb-2 flex items-center gap-2">
              AI ADVISOR
              {loadingAI && <span className="animate-pulse">...</span>}
            </div>
            <div className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-line">
              {loadingAI
                ? 'Consulting AI advisor...'
                : aiRecommendation ?? 'Click a row to load AI recommendation.'}
            </div>
          </div>
          <div className="lg:col-span-2 flex items-center gap-4 pt-2 border-t border-bg-border">
            <div className="font-mono text-[9px] text-text-muted">STATUS</div>
            <span className="font-mono text-[10px] tracking-widest text-severity-medium border border-severity-medium/30 px-2 py-0.5 rounded">
              {vuln.status.toUpperCase()}
            </span>
            <div className="font-mono text-[9px] text-text-muted ml-4">DETECTED</div>
            <span className="font-mono text-[10px] text-text-secondary">
              {new Date(vuln.detected_at).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function ErrorMessage() {
  return (
    <div className="bg-severity-critical/10 border border-severity-critical/30 rounded-lg p-6">
      <div className="font-mono text-sm text-severity-critical">Failed to load vulnerabilities.</div>
      <div className="font-mono text-[10px] text-severity-critical/70 mt-1">Run a scan first, or check API connectivity.</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg p-16 text-center">
      <div className="text-4xl mb-3 opacity-30">◬</div>
      <div className="font-mono text-sm text-text-secondary">No vulnerabilities found.</div>
      <div className="font-mono text-[10px] text-text-muted mt-1">Run an AWS scan to populate findings.</div>
    </div>
  )
}
