/**
 * components/AwsCredentialsModal.tsx
 *
 * Modal where users enter their AWS credentials before scanning.
 * Credentials are held in React state only — never written to
 * localStorage, sessionStorage, or any persistent store.
 *
 * Security notes:
 *  - secret_access_key field is type="password" — masked by default
 *  - session_token is optional (for STS/AssumeRole temporary creds)
 *  - "Verify" calls STS before running a full scan
 *  - All fields cleared when modal is closed or scan completes
 */

import { useState } from 'react'
import { verifyAwsCredentials, runAwsScan, AWSCredentials, ScanRequest } from '@/services/api'
import { Loader } from '@/components/Loader'
import type { ScanSummary } from '@/types'
import clsx from 'clsx'

const AWS_REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-north-1',
  'ca-central-1', 'sa-east-1', 'me-south-1', 'af-south-1',
]

interface Props {
  onClose: () => void
  onScanComplete: (result: ScanSummary) => void
}

type Step = 'credentials' | 'verifying' | 'verified' | 'scanning' | 'error'

export function AwsCredentialsModal({ onClose, onScanComplete }: Props) {
  const [creds, setCreds] = useState<AWSCredentials>({
    access_key_id: '',
    secret_access_key: '',
    region: 'us-east-1',
    session_token: '',
  })
  const [showSecret, setShowSecret] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [step, setStep] = useState<Step>('credentials')
  const [isScanning, setIsScanning] = useState(false)
  const [identity, setIdentity] = useState<{ account_id: string; user_arn: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanOptions, setScanOptions] = useState({
    scan_ec2: true,
    scan_s3: true,
    scan_iam: true,
    scan_security_groups: true,
  })

  const fieldErrors = {
    access_key_id: creds.access_key_id && !creds.access_key_id.match(/^(AKIA|ASIA|AIDA|AROA)[A-Z0-9]{16}/)
      ? 'Must start with AKIA, ASIA, etc. and be 20 chars'
      : null,
  }

  const canVerify =
    creds.access_key_id.length >= 16 &&
    creds.secret_access_key.length >= 8 &&
    creds.region &&
    !fieldErrors.access_key_id

  const handleVerify = async () => {
    setStep('verifying')
    setError(null)
    try {
      const result = await verifyAwsCredentials({
        ...creds,
        session_token: creds.session_token || undefined,
      })
      setIdentity({ account_id: result.account_id, user_arn: result.user_arn })
      setStep('verified')
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Credential verification failed.')
      setStep('error')
    }
  }

  const handleScan = async () => {
    setIsScanning(true)
    setError(null)
    try {
      const request: ScanRequest = {
        credentials: {
          ...creds,
          session_token: creds.session_token || undefined,
        },
        ...scanOptions,
        persist_results: true,
      }
      const result = await runAwsScan(request)
      // Clear credentials from state immediately after scan completes
      setCreds({ access_key_id: '', secret_access_key: '', region: 'us-east-1', session_token: '' })
      onScanComplete(result)
      onClose()
    } catch (err) {
      setError((err as { message?: string }).message ?? 'Scan failed.')
      setStep('error')
    } finally {
      setIsScanning(false)
    }
  }

  const handleClose = () => {
    // Clear all credential state on close
    setCreds({ access_key_id: '', secret_access_key: '', region: 'us-east-1', session_token: '' })
    setIdentity(null)
    setError(null)
    setStep('credentials')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-lg bg-bg-card border border-bg-border rounded-lg shadow-card animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
          <div>
            <div className="font-mono text-[9px] tracking-[0.3em] text-text-muted mb-0.5">AWS CLOUD SCANNER</div>
            <h3 className="font-mono text-sm text-text-primary tracking-wide">Enter Account Credentials</h3>
          </div>
          <button onClick={handleClose} className="text-text-muted hover:text-text-primary text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Security notice */}
          <div className="bg-cyan-muted/10 border border-cyan-dim/30 rounded p-3 flex gap-3">
            <span className="text-cyan-glow text-sm shrink-0 mt-0.5">⬡</span>
            <div className="font-mono text-[10px] text-cyan-dim leading-relaxed">
              Credentials are used only for this scan request and are <strong className="text-cyan-glow">never stored</strong> on our servers, in logs, or in your browser storage.
            </div>
          </div>

          {/* Verified identity banner */}
          {identity && step !== 'error' && (
            <div className="bg-severity-low/10 border border-severity-low/30 rounded p-3">
              <div className="font-mono text-[9px] tracking-widest text-severity-low mb-1">✓ CREDENTIALS VERIFIED</div>
              <div className="font-mono text-[10px] text-text-secondary">Account: <span className="text-text-primary">{identity.account_id}</span></div>
              <div className="font-mono text-[10px] text-text-secondary truncate">Identity: <span className="text-text-primary">{identity.user_arn}</span></div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-severity-critical/10 border border-severity-critical/30 rounded p-3">
              <div className="font-mono text-[10px] text-severity-critical">{error}</div>
            </div>
          )}

          {/* Credential fields */}
          <div className="space-y-4">
            {/* Access Key ID */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-text-secondary mb-1.5">
                ACCESS KEY ID <span className="text-severity-critical">*</span>
              </label>
              <input
                type="text"
                value={creds.access_key_id}
                onChange={(e) => { setCreds((c) => ({ ...c, access_key_id: e.target.value.trim() })); setStep('credentials') }}
                placeholder="AKIAIOSFODNN7EXAMPLE"
                maxLength={128}
                spellCheck={false}
                autoComplete="off"
                className={clsx(
                  'w-full bg-bg-secondary border rounded px-3 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none transition-colors',
                  fieldErrors.access_key_id ? 'border-severity-critical/50' : 'border-bg-border focus:border-cyan-dim'
                )}
              />
              {fieldErrors.access_key_id && (
                <p className="font-mono text-[10px] text-severity-critical mt-1">{fieldErrors.access_key_id}</p>
              )}
            </div>

            {/* Secret Access Key */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-text-secondary mb-1.5">
                SECRET ACCESS KEY <span className="text-severity-critical">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={creds.secret_access_key}
                  onChange={(e) => { setCreds((c) => ({ ...c, secret_access_key: e.target.value })); setStep('credentials') }}
                  placeholder="wJalrXUtnFEMI/K7MDENG..."
                  maxLength={512}
                  autoComplete="new-password"
                  className="w-full bg-bg-secondary border border-bg-border focus:border-cyan-dim rounded px-3 py-2.5 pr-10 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-muted hover:text-text-secondary"
                >
                  {showSecret ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-text-secondary mb-1.5">
                AWS REGION <span className="text-severity-critical">*</span>
              </label>
              <select
                value={creds.region}
                onChange={(e) => { setCreds((c) => ({ ...c, region: e.target.value })); setStep('credentials') }}
                className="w-full bg-bg-secondary border border-bg-border focus:border-cyan-dim rounded px-3 py-2.5 font-mono text-sm text-text-primary focus:outline-none transition-colors"
              >
                {AWS_REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Session Token (optional) */}
            <div>
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="font-mono text-[10px] text-text-muted hover:text-text-secondary tracking-wider mb-2 flex items-center gap-1"
              >
                <span className={clsx('transition-transform', showToken && 'rotate-90')}>▶</span>
                SESSION TOKEN (optional — for temporary credentials)
              </button>
              {showToken && (
                <input
                  type="password"
                  value={creds.session_token}
                  onChange={(e) => setCreds((c) => ({ ...c, session_token: e.target.value }))}
                  placeholder="Paste STS session token here..."
                  maxLength={2048}
                  autoComplete="off"
                  className="w-full bg-bg-secondary border border-bg-border focus:border-cyan-dim rounded px-3 py-2.5 font-mono text-xs text-text-primary placeholder-text-muted focus:outline-none transition-colors"
                />
              )}
            </div>
          </div>

          {/* Scan options (only shown after verification) */}
          {step === 'verified' && (
            <div className="border border-bg-border rounded p-4 space-y-2 animate-fade-in">
              <div className="font-mono text-[9px] tracking-[0.25em] text-text-muted mb-3">SELECT RESOURCES TO SCAN</div>
              {(Object.keys(scanOptions) as (keyof typeof scanOptions)[]).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => setScanOptions((o) => ({ ...o, [key]: !o[key] }))}
                    className={clsx(
                      'w-4 h-4 border rounded-sm flex items-center justify-center transition-colors cursor-pointer',
                      scanOptions[key] ? 'bg-cyan-muted/40 border-cyan-dim' : 'border-bg-border'
                    )}
                  >
                    {scanOptions[key] && <span className="text-cyan-glow text-[10px]">✓</span>}
                  </div>
                  <span className="font-mono text-[10px] text-text-secondary group-hover:text-text-primary transition-colors tracking-wider">
                    {key.replace('scan_', '').replace('_', ' ').toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-bg-border flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="font-mono text-[10px] tracking-widest px-4 py-2 border border-bg-border text-text-secondary hover:text-text-primary rounded transition-colors"
          >
            CANCEL
          </button>

          {step !== 'verified' ? (
            <button
              onClick={handleVerify}
              disabled={!canVerify || step === 'verifying'}
              className="font-mono text-[10px] tracking-widest px-5 py-2 border border-cyan-dim/50 text-cyan-glow hover:border-cyan-glow hover:shadow-cyan-glow-sm rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {step === 'verifying' ? <><Loader size="sm" label="" /> VERIFYING...</> : '◈ VERIFY CREDENTIALS'}
            </button>
          ) : (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="font-mono text-[10px] tracking-widest px-5 py-2 border border-severity-low/50 text-severity-low hover:border-severity-low hover:shadow-md rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isScanning ? <><Loader size="sm" label="" /> SCANNING AWS...</> : '▶ START SCAN'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
