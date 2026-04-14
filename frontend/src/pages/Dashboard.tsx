/**
 * pages/Dashboard.tsx — Main operations overview page.
 */

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getVulnerabilities, getAlerts } from '@/services/api'
import { AssetCard, StatCard } from '@/components/AssetCard'
import { SeverityBarChart, SeverityPieChart } from '@/components/RiskChart'
import { AlertTable } from '@/components/AlertTable'
import { PageLoader, CardSkeleton } from '@/components/Loader'
import { AwsCredentialsModal } from '@/components/AwsCredentialsModal'
import type { ScanSummary } from '@/types'

export function Dashboard() {
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [lastScan, setLastScan] = useState<ScanSummary | null>(null)

  const { data: vulns, isLoading: vulnsLoading } = useQuery({
    queryKey: ['vulnerabilities'],
    queryFn: () => getVulnerabilities({ limit: 100 }),
    staleTime: 30_000,
  })

  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => getAlerts({ limit: 10 }),
    staleTime: 20_000,
  })

  const handleScanComplete = (result: ScanSummary) => {
    setLastScan(result)
    queryClient.invalidateQueries({ queryKey: ['vulnerabilities'] })
    queryClient.invalidateQueries({ queryKey: ['alerts'] })
  }

  // Derive severity distribution from vulnerabilities
  const severityData = (['Critical', 'High', 'Medium', 'Low'] as const).map((s) => ({
    severity: s,
    count: vulns?.vulnerabilities?.filter((v) => v.severity === s).length ?? 0,
  }))

  const criticalCount = severityData.find((d) => d.severity === 'Critical')?.count ?? 0

  if (vulnsLoading) return <PageLoader />

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showModal && (
        <AwsCredentialsModal
          onClose={() => setShowModal(false)}
          onScanComplete={handleScanComplete}
        />
      )}

      {/* Page header + scan trigger */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-1">SYSTEM STATUS</div>
          <h2 className="font-mono text-lg text-text-primary tracking-wide">Operations Overview</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="font-mono text-xs tracking-widest px-4 py-2.5 border border-cyan-dim/50 text-cyan-glow hover:border-cyan-glow hover:shadow-cyan-glow-sm rounded transition-all duration-200 flex items-center gap-2"
        >
          <span>◈</span> SCAN AWS ACCOUNT
        </button>
      </div>

      {/* Last scan result banner */}
      {lastScan && (
        <div className="bg-severity-low/10 border border-severity-low/30 rounded-lg p-4 animate-fade-in">
          <div className="font-mono text-[9px] tracking-widest text-severity-low mb-2">✓ SCAN COMPLETE</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="font-mono text-[9px] text-text-muted">ACCOUNT</div><div className="font-mono text-xs text-text-primary">{lastScan.aws_account_id ?? '—'}</div></div>
            <div><div className="font-mono text-[9px] text-text-muted">REGION</div><div className="font-mono text-xs text-text-primary">{lastScan.region ?? '—'}</div></div>
            <div><div className="font-mono text-[9px] text-text-muted">RESOURCES</div><div className="font-mono text-xs text-text-primary">{lastScan.resources_scored}</div></div>
            <div><div className="font-mono text-[9px] text-text-muted">FINDINGS</div><div className="font-mono text-xs text-severity-critical font-semibold">{lastScan.vulnerabilities_found}</div></div>
          </div>
          {lastScan.aws_identity && (
            <div className="font-mono text-[9px] text-text-muted mt-2 truncate">Identity: {lastScan.aws_identity}</div>
          )}
        </div>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Findings" value={vulns?.total ?? 0} sublabel="across all resources" />
        <StatCard label="Critical Issues" value={criticalCount} sublabel="immediate action needed" variant="critical" />
        <StatCard label="Active Alerts" value={alerts?.total ?? 0} sublabel="unresolved" variant="warning" />
        <StatCard label="Risk Status" value={criticalCount > 0 ? 'HIGH' : 'MEDIUM'} sublabel="overall posture" variant={criticalCount > 0 ? 'critical' : 'warning'} />
      </div>

      {/* Asset summary from last scan */}
      {lastScan && (
        <div>
          <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-3">ASSET INVENTORY</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <AssetCard type="EC2 Instances" count={lastScan.summary.ec2_instances} icon="◫" />
            <AssetCard type="S3 Buckets" count={lastScan.summary.s3_buckets} icon="◩" />
            <AssetCard type="IAM Users" count={lastScan.summary.iam_users} icon="◉" />
            <AssetCard type="IAM Roles" count={lastScan.summary.iam_roles} icon="◈" />
            <AssetCard type="Security Groups" count={lastScan.summary.security_groups} icon="◬" />
          </div>
        </div>
      )}

      {/* No scan yet prompt */}
      {!lastScan && !vulns?.total && (
        <div className="bg-bg-card border border-bg-border rounded-lg p-12 text-center">
          <div className="text-5xl mb-4 opacity-20">◈</div>
          <div className="font-mono text-sm text-text-secondary mb-2">No scan data yet.</div>
          <div className="font-mono text-[10px] text-text-muted mb-6">
            Click SCAN AWS ACCOUNT, enter your IAM credentials, and Guardian will scan your infrastructure.
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="font-mono text-xs tracking-widest px-5 py-2.5 border border-cyan-dim/50 text-cyan-glow hover:shadow-cyan-glow-sm rounded transition-all"
          >
            ◈ START YOUR FIRST SCAN
          </button>
        </div>
      )}

      {/* Charts */}
      {(vulns?.total ?? 0) > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-bg-card border border-bg-border rounded-lg p-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-4">SEVERITY DISTRIBUTION</div>
            {vulnsLoading ? <CardSkeleton /> : <SeverityBarChart data={severityData} />}
          </div>
          <div className="bg-bg-card border border-bg-border rounded-lg p-5">
            <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-4">FINDING BREAKDOWN</div>
            {vulnsLoading ? <CardSkeleton /> : <SeverityPieChart data={severityData} />}
          </div>
        </div>
      )}

      {/* Recent alerts */}
      {(alerts?.total ?? 0) > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-lg">
          <div className="flex items-center justify-between px-5 py-3 border-b border-bg-border">
            <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted">RECENT ALERTS</div>
            <span className="font-mono text-[10px] text-text-muted">
              {alerts?.total ?? 0} total
            </span>
          </div>
          {alertsLoading ? (
            <div className="p-5"><PageLoader /></div>
          ) : (
            <AlertTable alerts={alerts?.alerts ?? []} onRefresh={() => refetchAlerts()} compact />
          )}
        </div>
      )}
    </div>
  )
}
