/**
 * components/AssetCard.tsx — Card for displaying individual cloud asset stats.
 */

import clsx from 'clsx'

interface AssetCardProps {
  type: string
  count: number
  icon: string
  trend?: 'up' | 'down' | 'stable'
  riskCount?: number
}

const assetColors: Record<string, string> = {
  'EC2 Instances': 'border-cyan-dim/40 text-cyan-bright',
  'S3 Buckets': 'border-severity-medium/40 text-severity-medium',
  'IAM Users': 'border-severity-high/40 text-severity-high',
  'IAM Roles': 'border-severity-critical/30 text-severity-critical',
  'Security Groups': 'border-cyan-dim/40 text-cyan-dim',
}

export function AssetCard({ type, count, icon, riskCount }: AssetCardProps) {
  const colorClass = assetColors[type] ?? 'border-bg-border text-text-secondary'
  const hasRisk = (riskCount ?? 0) > 0

  return (
    <div className={clsx(
      'bg-bg-card border rounded-lg p-5 relative overflow-hidden group transition-all duration-300 hover:shadow-card animate-fade-in',
      colorClass,
    )}>
      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden opacity-20 group-hover:opacity-40 transition-opacity">
        <div className="absolute top-0 right-0 w-full h-full border-b-0 border-l-0" style={{ borderTop: '1px solid currentColor', borderRight: '1px solid currentColor' }} />
      </div>

      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {hasRisk && (
          <span className="font-mono text-[9px] tracking-widest text-severity-critical border border-severity-critical/30 px-1.5 py-0.5 rounded">
            {riskCount} AT RISK
          </span>
        )}
      </div>

      <div className="font-mono text-3xl font-semibold text-text-primary mb-1">
        {count.toString().padStart(2, '0')}
      </div>
      <div className="font-mono text-[10px] tracking-[0.15em] text-text-secondary uppercase">
        {type}
      </div>

      {/* Bottom scan line effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  variant?: 'default' | 'critical' | 'success' | 'warning'
}

export function StatCard({ label, value, sublabel, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-bg-border',
    critical: 'border-severity-critical/40 shadow-critical',
    success: 'border-severity-low/30',
    warning: 'border-severity-medium/40',
  }

  const valueStyles = {
    default: 'text-text-primary',
    critical: 'text-severity-critical',
    success: 'text-severity-low',
    warning: 'text-severity-medium',
  }

  return (
    <div className={clsx('bg-bg-card border rounded-lg p-5 animate-fade-in', variantStyles[variant])}>
      <div className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase mb-2">{label}</div>
      <div className={clsx('font-mono text-3xl font-semibold mb-1', valueStyles[variant])}>{value}</div>
      {sublabel && <div className="font-mono text-[10px] text-text-secondary">{sublabel}</div>}
    </div>
  )
}
