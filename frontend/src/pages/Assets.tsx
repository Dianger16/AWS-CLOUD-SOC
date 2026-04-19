/**
 * pages/Assets.tsx — Cloud asset inventory with search + filter.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { runAwsScan, ScanRequest } from '@/services/api'
import { AssetCard } from '@/components/AssetCard'
import { PageLoader } from '@/components/Loader'
import type { ScanSummary } from '@/types'
import clsx from 'clsx'

// Default scan request — all resources enabled
const DEFAULT_REQUEST: ScanRequest = {
  credentials: { access_key_id: '', secret_access_key: '', region: 'us-east-1' },
  scan_ec2: true, scan_s3: true, scan_iam: true, scan_security_groups: true,
}

type AssetFilter = 'all' | 'ec2' | 's3' | 'iam' | 'sg'

export function Assets() {
  const [filter, setFilter] = useState<AssetFilter>('all')
  const [search, setSearch] = useState('')

  const { data: rawData, isLoading, error, refetch, isFetching } = useQuery<ScanSummary>({
    queryKey: ['scan-summary'],
    queryFn: () => runAwsScan(DEFAULT_REQUEST),
    enabled: false,  // Only fetch when user triggers
    staleTime: 60_000,
  })
  const data = rawData as ScanSummary | undefined

  const filters: { key: AssetFilter; label: string }[] = [
    { key: 'all', label: 'ALL ASSETS' },
    { key: 'ec2', label: 'EC2' },
    { key: 's3', label: 'S3' },
    { key: 'iam', label: 'IAM' },
    { key: 'sg', label: 'SEC GROUPS' },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-1">AWS CLOUD</div>
          <h2 className="font-mono text-lg text-text-primary tracking-wide">Asset Inventory</h2>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="font-mono text-xs tracking-widest px-4 py-2.5 border border-cyan-dim/50 text-cyan-glow hover:border-cyan-glow rounded transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
        >
          <span className={clsx('text-sm', isFetching && 'animate-spin')}>◈</span>
          {isFetching ? 'SCANNING...' : 'SCAN AWS'}
        </button>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={100}
          className="flex-1 bg-bg-card border border-bg-border rounded px-3 py-2 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-dim transition-colors"
        />
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx(
                'font-mono text-[10px] tracking-wider px-3 py-2 rounded border transition-colors',
                filter === f.key
                  ? 'bg-cyan-muted/30 border-cyan-dim/50 text-cyan-glow'
                  : 'border-bg-border text-text-secondary hover:text-text-primary hover:border-bg-elevated'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt to scan */}
      {!data && !isLoading && !error && (
        <div className="bg-bg-card border border-bg-border rounded-lg p-16 text-center">
          <div className="text-4xl mb-4 opacity-30">◫</div>
          <div className="font-mono text-sm text-text-secondary mb-2">No asset data loaded.</div>
          <div className="font-mono text-[10px] text-text-muted mb-6">
            Click SCAN AWS to discover your cloud infrastructure.
          </div>
          <button
            onClick={() => refetch()}
            className="font-mono text-xs tracking-widest px-5 py-2.5 border border-cyan-dim/50 text-cyan-glow hover:shadow-cyan-glow-sm rounded transition-all duration-200"
          >
            START DISCOVERY SCAN
          </button>
        </div>
      )}

      {isLoading || isFetching ? (
        <PageLoader />
      ) : error ? (
        <div className="bg-severity-critical/10 border border-severity-critical/30 rounded-lg p-6 font-mono text-sm text-severity-critical">
          Failed to load assets. Ensure AWS credentials are configured.
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary cards */}
          {(filter === 'all' || filter === 'ec2') && (
            <Section title="EC2 INSTANCES" count={data.summary.ec2_instances}>
              <AssetCard type="EC2 Instances" count={data.summary.ec2_instances} icon="◫" />
              <div className="bg-bg-card border border-bg-border rounded-lg p-4 col-span-2">
                <div className="font-mono text-[10px] text-text-muted tracking-widest mb-2">DETAILS</div>
                <div className="font-mono text-xs text-text-secondary">
                  {data.summary.ec2_instances} instance{data.summary.ec2_instances !== 1 ? 's' : ''} discovered. Risk scoring applied. Check Vulnerabilities tab for misconfigurations.
 ls
                </div>
              </div>
            </Section>
          )}
          {(filter === 'all' || filter === 's3') && (
            <Section title="S3 BUCKETS" count={data.summary.s3_buckets}>
              <AssetCard type="S3 Buckets" count={data.summary.s3_buckets} icon="◩" />
              <div className="bg-bg-card border border-bg-border rounded-lg p-4 col-span-2">
                <div className="font-mono text-[10px] text-text-muted tracking-widest mb-2">DETAILS</div>
                <div className="font-mono text-xs text-text-secondary">
                  {data.summary.s3_buckets} bucket{data.summary.s3_buckets !== 1 ? 's' : ''} scanned for public access, encryption, and logging posture.
                </div>
              </div>
            </Section>
          )}
          {(filter === 'all' || filter === 'iam') && (
            <Section title="IAM IDENTITIES" count={data.summary.iam_users + data.summary.iam_roles}>
              <AssetCard type="IAM Users" count={data.summary.iam_users} icon="◉" />
              <AssetCard type="IAM Roles" count={data.summary.iam_roles} icon="◈" />
              <div className="bg-bg-card border border-bg-border rounded-lg p-4">
                <div className="font-mono text-[10px] text-text-muted tracking-widest mb-2">MFA + PRIVILEGE</div>
                <div className="font-mono text-xs text-text-secondary">
                  Users and roles checked for AdministratorAccess and missing MFA.
                </div>
              </div>
            </Section>
          )}
          {(filter === 'all' || filter === 'sg') && (
            <Section title="SECURITY GROUPS" count={data.summary.security_groups}>
              <AssetCard type="Security Groups" count={data.summary.security_groups} icon="◬" />
              <div className="bg-bg-card border border-bg-border rounded-lg p-4 col-span-2">
                <div className="font-mono text-[10px] text-text-muted tracking-widest mb-2">DETAILS</div>
                <div className="font-mono text-xs text-text-secondary">
                  {data.summary.security_groups} security groups evaluated for 0.0.0.0/0 exposure.
                </div>
              </div>
            </Section>
          )}

          {/* Risk sample */}
          {data.risk_scores_sample.length > 0 && (
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-3">TOP RISK SCORES</div>
              <div className="space-y-2">
                {data.risk_scores_sample.map((r) => (
                  <div key={r.resource_id} className="bg-bg-card border border-bg-border rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">{r.resource_type}</span>
                      <span className="font-mono text-xs text-cyan-dim">{r.resource_id}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-bg-border rounded-full overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all', riskBarColor(r.risk_level))}
                          style={{ width: `${r.risk_score * 100}%` }}
                        />
                      </div>
                      <span className={clsx('font-mono text-[10px] tracking-widest w-16 text-right', riskTextColor(r.risk_level))}>
                        {r.risk_level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted">{title}</div>
        <div className="flex-1 h-px bg-bg-border" />
        <span className="font-mono text-[10px] text-text-muted">{count}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>
    </div>
  )
}

function riskBarColor(level: string) {
  return { Critical: 'bg-severity-critical', High: 'bg-severity-high', Medium: 'bg-severity-medium', Low: 'bg-severity-low' }[level] ?? 'bg-text-muted'
}
function riskTextColor(level: string) {
  return { Critical: 'text-severity-critical', High: 'text-severity-high', Medium: 'text-severity-medium', Low: 'text-severity-low' }[level] ?? 'text-text-muted'
}
