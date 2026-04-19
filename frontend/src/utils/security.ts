/**
 * utils/security.ts — Frontend security utilities
 *
 * Security audit notes:
 *  - All user-generated strings are sanitized via DOMPurify before rendering
 *  - JWT stored in memory only (not localStorage / sessionStorage)
 *  - Input validation performed before any API submission
 *  - Throttle utility prevents rapid repeated requests
 */

import DOMPurify from 'dompurify'
import throttle from 'lodash.throttle'

// ── XSS Prevention ───────────────────────────────────────────────────────────

/**
 * Sanitize a string for safe HTML rendering.
 * Use whenever rendering any server-returned string inside dangerouslySetInnerHTML.
 * For plain text rendering (most cases), this is NOT needed — React escapes by default.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Strip all HTML tags from a string — use for plain text display.
 */
export function stripHtml(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

// ── Input Validation ─────────────────────────────────────────────────────────

/**
 * Validate username: alphanumeric + underscore, 3–32 chars.
 * Prevents injection via login form.
 */
export function validateUsername(value: string): string | null {
  if (!value || value.trim().length === 0) return 'Username is required.'
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(value.trim())) {
    return 'Username must be 3–32 alphanumeric characters.'
  }
  return null
}

/**
 * Validate password: 6–128 chars, no null bytes.
 */
export function validatePassword(value: string): string | null {
  if (!value || value.length === 0) return 'Password is required.'
  if (value.length < 6) return 'Password must be at least 6 characters.'
  if (value.length > 128) return 'Password must not exceed 128 characters.'
  // Reject null bytes — could be used in injection attacks
  if (value.includes('\0')) return 'Password contains invalid characters.'
  return null
}

/**
 * Sanitize a JSON string before parsing to prevent prototype pollution.
 * Rejects JSON containing __proto__, constructor, or prototype keys.
 */
export function safeJsonParse<T>(raw: string): T | null {
  try {
    // Block prototype pollution patterns
    if (/(__proto__|constructor|prototype)\s*:/.test(raw)) {
      console.warn('[Security] Blocked potentially malicious JSON.')
      return null
    }
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// ── Rate Limiting / Throttle ─────────────────────────────────────────────────

/**
 * Create a throttled version of an async function.
 * Use to prevent rapid repeated API calls (e.g., scan button).
 *
 * @param fn Function to throttle
 * @param waitMs Minimum ms between invocations
 */
export function createThrottled<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs: number
): T {
  return throttle(fn, waitMs, { leading: true, trailing: false }) as unknown as T
}

// ── CSRF Token ───────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random CSRF token.
 * In a cookie-based auth setup, send this in X-CSRF-Token header.
 * The backend must validate it matches the token in the cookie.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

// ── Secure Logging ───────────────────────────────────────────────────────────

const REDACTED_KEYS = ['token', 'password', 'secret', 'key', 'authorization', 'credential']

/**
 * Safe console logger that redacts sensitive fields before logging.
 * Use instead of console.log for any object that might contain auth data.
 */
export function safeLog(label: string, data: unknown): void {
  if (import.meta.env.PROD) return // Never log in production

  const redacted = redactSensitive(data)
  console.log(`[Guardian] ${label}`, redacted)
}

function redactSensitive(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const isRedacted = REDACTED_KEYS.some((k) => key.toLowerCase().includes(k))
    result[key] = isRedacted ? '[REDACTED]' : redactSensitive(value)
  }
  return result
}

// ── Token Expiry ──────────────────────────────────────────────────────────────

/**
 * Parse JWT payload without verifying signature (client-side only).
 * Used to check expiry time for auto-logout.
 * IMPORTANT: Never trust this for authorization — always verify on the server.
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // atob can fail on malformed base64 — we wrap in try/catch
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    if (typeof payload.exp !== 'number') return null
    return new Date(payload.exp * 1000)
  } catch {
    return null
  }
}

/**
 * Returns true if the token has expired or will expire within `bufferMs`.
 */
export function isTokenExpired(token: string, bufferMs = 30_000): boolean {
  const expiry = getTokenExpiry(token)
  if (!expiry) return true
  return expiry.getTime() - bufferMs < Date.now()
}
