/**
 * pages/Login.tsx — Secure login page with SOC terminal aesthetic.
 *
 * Security features implemented:
 *  - Client-side validation before API call
 *  - Generic error messages (no leaking backend detail)
 *  - Throttled submit to prevent brute force from frontend
 *  - Password field never logged
 */

import { useState, useRef, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { createThrottled } from '@/utils/security'
import { Loader } from '@/components/Loader'
// @ts-ignore
import SoftAurora from '@/components/SoftAurora/SoftAurora'

export function Login() {
  const { login, isLoading, error, clearError } = useAuthContext()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({})

  // Throttle submit: max 1 attempt per 2 seconds from frontend
  const throttledSubmit = useRef(
    createThrottled(async (u: string, p: string) => {
      const success = await login({ username: u, password: p })
      if (success) navigate('/dashboard')
    }, 2000)
  ).current

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setFieldErrors({})

    const errors: typeof fieldErrors = {}
    if (!username.trim()) errors.username = 'Username is required.'
    if (!password) errors.password = 'Password is required.'
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    throttledSubmit(username, password)
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0">
        <SoftAurora
          speed={0.6}
          scale={1.5}
          brightness={1}
          color1="#0a2a3a" // Adjusted for deep SOC look
          color2="#00f2ff" // Cyan glow
          enableMouseInteraction
        />
      </div>

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none z-1" />
      {/* Scan line overlay */}
      <div className="absolute inset-0 bg-scan-lines pointer-events-none z-2" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-glow/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-cyan-glow/40 mb-4 shadow-cyan-glow relative">
            <span className="text-cyan-glow text-2xl">⬡</span>
            <div className="absolute inset-0 bg-cyan-glow/5" />
          </div>
          <div className="font-mono text-[10px] tracking-[0.4em] text-text-muted mb-1">AI CLOUD</div>
          <h1 className="font-mono text-xl tracking-[0.2em] text-text-primary font-semibold">GUARDIAN</h1>
          <div className="font-mono text-[9px] tracking-widest text-text-muted mt-1">
            SECURITY OPERATIONS PLATFORM
          </div>
        </div>

        {/* Login card */}
        <div className="bg-bg-card border border-bg-border rounded-lg p-6 shadow-card">
          {/* Status bar */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-bg-border">
            <div className="w-1.5 h-1.5 bg-severity-medium rounded-full animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted">
              AUTHENTICATION REQUIRED
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Username */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-text-secondary mb-1.5">
                OPERATOR ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                spellCheck={false}
                maxLength={32}
                className="w-full bg-bg-secondary border border-bg-border rounded px-3 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-dim transition-colors"
                placeholder="username"
                aria-describedby={fieldErrors.username ? 'username-error' : undefined}
              />
              {fieldErrors.username && (
                <p id="username-error" className="font-mono text-[10px] text-severity-critical mt-1">
                  {fieldErrors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block font-mono text-[10px] tracking-[0.2em] text-text-secondary mb-1.5">
                ACCESS KEY
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                maxLength={128}
                className="w-full bg-bg-secondary border border-bg-border rounded px-3 py-2.5 font-mono text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-dim transition-colors"
                placeholder="••••••••"
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              />
              {fieldErrors.password && (
                <p id="password-error" className="font-mono text-[10px] text-severity-critical mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* API error */}
            {error && (
              <div className="bg-severity-critical/10 border border-severity-critical/30 rounded p-3">
                <p className="font-mono text-[10px] text-severity-critical">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-muted/40 hover:bg-cyan-muted/60 border border-cyan-dim/50 hover:border-cyan-glow/60 text-cyan-glow font-mono text-xs tracking-[0.2em] py-3 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-cyan-glow-sm hover:shadow-cyan-glow"
            >
              {isLoading ? (
                <>
                  <Loader size="sm" label="" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                'INITIATE SESSION'
              )}
            </button>
          </form>


        </div>

        <div className="text-center mt-4">
          <span className="font-mono text-[9px] text-text-muted tracking-widest">
            All activity is monitored and logged.
          </span>
        </div>
      </div>
    </div>
  )
}
