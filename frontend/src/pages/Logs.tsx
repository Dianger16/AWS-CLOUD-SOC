/**
 * pages/Logs.tsx — Log analysis and anomaly detection interface.
 *
 * Security note: User-provided JSON is parsed through safeJsonParse()
 * which blocks prototype pollution before sending to the API.
 */

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { analyzeLogs } from '@/services/api'
import { safeJsonParse } from '@/utils/security'
import type { LogAnalysisResult, LogAnomaly } from '@/types'
import { Loader } from '@/components/Loader'
import clsx from 'clsx'

const SAMPLE_EVENTS = JSON.stringify(
  [
    {
      eventTime: '2024-01-15T03:22:00Z',
      eventName: 'DescribeInstances',
      userIdentity: { arn: 'arn:aws:iam::123456789:user/bob' },
      awsRegion: 'ap-southeast-1',
      sourceIPAddress: '185.220.101.55',
      errorCode: 'AccessDenied',
    },
    ...Array.from({ length: 14 }, (_, i) => ({
      eventTime: `2024-01-15T${(8 + i).toString().padStart(2, '0')}:00:00Z`,
      eventName: i % 3 === 0 ? 'GetObject' : 'ListBuckets',
      userIdentity: { arn: `arn:aws:iam::123456789:user/user${i}` },
      awsRegion: 'us-east-1',
      sourceIPAddress: '10.0.0.1',
    })),
  ],
  null,
  2
)

export function Logs() {
  const [input, setInput] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult] = useState<LogAnalysisResult | null>(null)

  const mutation = useMutation({
    mutationFn: analyzeLogs,
    onSuccess: (data) => setResult(data),
  })

  const handleAnalyze = () => {
    setParseError(null)

    if (!input.trim()) {
      setParseError('Paste CloudTrail JSON events to analyze.')
      return
    }

    // safeJsonParse blocks prototype pollution before API call
    const parsed = safeJsonParse<object[]>(input.trim())
    if (!parsed || !Array.isArray(parsed)) {
      setParseError('Invalid JSON. Provide a JSON array of CloudTrail events.')
      return
    }
    if (parsed.length > 500) {
      setParseError('Too many events. Limit input to 500 events per request.')
      return
    }

    mutation.mutate({
      cloudtrail_events: parsed,
      persist_alerts: true,
    })
  }

  const handleLoadSample = () => {
    setInput(SAMPLE_EVENTS)
    setParseError(null)
  }

  const anomalies = [
    ...(result?.cloudtrail_anomalies ?? []),
    ...(result?.vpc_anomalies ?? []),
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-1">ISOLATION FOREST</div>
        <h2 className="font-mono text-lg text-text-primary tracking-wide">Log Anomaly Detection</h2>
      </div>

      {/* How it works */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-5">
        <div className="font-mono text-[9px] tracking-[0.2em] text-cyan-dim mb-3">HOW IT WORKS</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'INPUT LOGS', desc: 'Paste CloudTrail JSON events or VPC flow log records.' },
            { step: '02', title: 'ML ANALYSIS', desc: 'Isolation Forest detects statistical outliers in user behaviour.' },
            { step: '03', title: 'ALERTS', desc: 'Anomalies are flagged with explanations and persisted as alerts.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="font-mono text-[10px] text-cyan-muted shrink-0 pt-0.5">{step}</div>
              <div>
                <div className="font-mono text-[10px] text-text-primary tracking-wider mb-1">{title}</div>
                <div className="font-mono text-[10px] text-text-muted leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input panel */}
      <div className="bg-bg-card border border-bg-border rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px] tracking-[0.2em] text-text-muted">CLOUDTRAIL EVENT INPUT</div>
          <button
            onClick={handleLoadSample}
            className="font-mono text-[10px] text-cyan-dim hover:text-cyan-glow border border-bg-border hover:border-cyan-dim/40 px-2.5 py-1 rounded transition-colors"
          >
            LOAD SAMPLE
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setParseError(null)
          }}
          placeholder='Paste a JSON array of CloudTrail events here...'
          rows={10}
          maxLength={100_000}
          spellCheck={false}
          className="w-full bg-bg-secondary border border-bg-border rounded p-3 font-mono text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-dim transition-colors resize-y"
          aria-label="CloudTrail JSON input"
        />

        {parseError && (
          <p className="font-mono text-[10px] text-severity-critical">{parseError}</p>
        )}

        {mutation.error && (
          <div className="bg-severity-critical/10 border border-severity-critical/30 rounded p-3">
            <p className="font-mono text-[10px] text-severity-critical">
              {(mutation.error as { message?: string }).message ?? 'Analysis failed.'}
            </p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={mutation.isPending}
          className="font-mono text-xs tracking-widest px-5 py-2.5 border border-cyan-dim/50 text-cyan-glow hover:border-cyan-glow hover:shadow-cyan-glow-sm rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {mutation.isPending ? (
            <>
              <Loader size="sm" label="" />
              ANALYZING LOGS...
            </>
          ) : (
            <>◈ RUN ANOMALY DETECTION</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'EVENTS ANALYZED', value: result.total_events_analyzed },
              {
                label: 'ANOMALIES FOUND',
                value: result.total_anomalies_found,
                highlight: result.total_anomalies_found > 0,
              },
              { label: 'ALERTS CREATED', value: result.alerts_created },
              { label: 'STATUS', value: result.status.toUpperCase() },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className={clsx(
                  'bg-bg-card border rounded-lg p-4',
                  highlight ? 'border-severity-critical/40' : 'border-bg-border'
                )}
              >
                <div className="font-mono text-[9px] tracking-[0.2em] text-text-muted mb-1">{label}</div>
                <div className={clsx('font-mono text-2xl font-semibold', highlight ? 'text-severity-critical' : 'text-text-primary')}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Anomaly list */}
          {anomalies.length > 0 ? (
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] text-text-muted mb-3">
                DETECTED ANOMALIES ({anomalies.length})
              </div>
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <AnomalyCard key={i} anomaly={a} />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-severity-low/10 border border-severity-low/30 rounded-lg p-6 text-center">
              <div className="font-mono text-sm text-severity-low">✓ No anomalies detected.</div>
              <div className="font-mono text-[10px] text-severity-low/70 mt-1">
                All analyzed events appear within normal behavioural parameters.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnomalyCard({ anomaly }: { anomaly: LogAnomaly }) {
  return (
    <div className="bg-bg-card border border-l-2 border-severity-high/30 border-l-severity-high rounded-lg px-5 py-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="font-mono text-xs text-severity-high mb-0.5">ANOMALY DETECTED</div>
          <div className="font-mono text-[10px] text-text-secondary">{anomaly.user_identity}</div>
        </div>
        <div className="font-mono text-[10px] text-severity-medium border border-severity-medium/30 px-2 py-0.5 rounded shrink-0">
          SCORE {anomaly.anomaly_score.toFixed(3)}
        </div>
      </div>

      <div className="font-mono text-[10px] text-text-muted mb-3 leading-relaxed">
        ◉ {anomaly.anomaly_reason}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'API CALLS', value: anomaly.api_call_count },
          { label: 'FAILED LOGIN', value: anomaly.failed_logins },
          { label: 'HOUR UTC', value: anomaly.hour_of_day.toFixed(1) },
          { label: 'NEW REGION', value: anomaly.is_new_region ? 'YES' : 'NO' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-bg-secondary rounded p-2">
            <div className="font-mono text-[8px] text-text-muted tracking-wider">{label}</div>
            <div className={clsx(
              'font-mono text-xs font-semibold',
              (label === 'NEW REGION' && value === 'YES') || (label === 'FAILED LOGIN' && Number(value) > 0)
                ? 'text-severity-critical'
                : 'text-text-primary'
            )}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
