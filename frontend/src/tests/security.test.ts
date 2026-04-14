/**
 * tests/security.test.ts — Unit tests for security utilities.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  sanitizeHtml, stripHtml, validateUsername, validatePassword,
  safeJsonParse, generateCsrfToken, isTokenExpired, getTokenExpiry,
} from '../src/utils/security'

// ── sanitizeHtml ─────────────────────────────────────────────────────────────

describe('sanitizeHtml', () => {
  it('strips script tags', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>Hello')
    expect(result).not.toContain('<script>')
    expect(result).toContain('Hello')
  })

  it('strips onclick attributes', () => {
    const result = sanitizeHtml('<b onclick="evil()">text</b>')
    expect(result).not.toContain('onclick')
    expect(result).toContain('text')
  })

  it('allows safe tags', () => {
    const result = sanitizeHtml('<b>bold</b> and <em>em</em>')
    expect(result).toContain('<b>bold</b>')
    expect(result).toContain('<em>em</em>')
  })

  it('strips img tags', () => {
    const result = sanitizeHtml('<img src="x" onerror="evil()">')
    expect(result).not.toContain('<img')
  })
})

// ── stripHtml ─────────────────────────────────────────────────────────────────

describe('stripHtml', () => {
  it('removes all HTML tags', () => {
    expect(stripHtml('<b>Hello</b> <i>World</i>')).toBe('Hello World')
  })

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('')
  })

  it('handles string with no tags', () => {
    expect(stripHtml('plain text')).toBe('plain text')
  })
})

// ── validateUsername ──────────────────────────────────────────────────────────

describe('validateUsername', () => {
  it('accepts valid usernames', () => {
    expect(validateUsername('admin')).toBeNull()
    expect(validateUsername('user_123')).toBeNull()
    expect(validateUsername('abc')).toBeNull()
  })

  it('rejects empty username', () => {
    expect(validateUsername('')).not.toBeNull()
    expect(validateUsername('   ')).not.toBeNull()
  })

  it('rejects usernames that are too short', () => {
    expect(validateUsername('ab')).not.toBeNull()
  })

  it('rejects usernames with special characters', () => {
    expect(validateUsername('user<script>')).not.toBeNull()
    expect(validateUsername("admin' OR 1=1--")).not.toBeNull()
    expect(validateUsername('user@domain.com')).not.toBeNull()
  })

  it('rejects usernames over 32 chars', () => {
    expect(validateUsername('a'.repeat(33))).not.toBeNull()
  })
})

// ── validatePassword ──────────────────────────────────────────────────────────

describe('validatePassword', () => {
  it('accepts valid passwords', () => {
    expect(validatePassword('password123')).toBeNull()
    expect(validatePassword('P@ssw0rd!')).toBeNull()
  })

  it('rejects empty password', () => {
    expect(validatePassword('')).not.toBeNull()
  })

  it('rejects passwords shorter than 6 chars', () => {
    expect(validatePassword('abc12')).not.toBeNull()
  })

  it('rejects passwords over 128 chars', () => {
    expect(validatePassword('a'.repeat(129))).not.toBeNull()
  })

  it('rejects passwords with null bytes', () => {
    expect(validatePassword('pass\0word')).not.toBeNull()
  })
})

// ── safeJsonParse ─────────────────────────────────────────────────────────────

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    const result = safeJsonParse<{ key: string }>('{"key": "value"}')
    expect(result).toEqual({ key: 'value' })
  })

  it('returns null for invalid JSON', () => {
    expect(safeJsonParse('not json')).toBeNull()
  })

  it('blocks prototype pollution via __proto__', () => {
    const malicious = '{"__proto__": {"isAdmin": true}}'
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = safeJsonParse(malicious)
    expect(result).toBeNull()
    consoleSpy.mockRestore()
  })

  it('blocks constructor pollution', () => {
    const malicious = '{"constructor": {"prototype": {"x": 1}}}'
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = safeJsonParse(malicious)
    expect(result).toBeNull()
    consoleSpy.mockRestore()
  })

  it('parses JSON arrays', () => {
    const result = safeJsonParse<number[]>('[1, 2, 3]')
    expect(result).toEqual([1, 2, 3])
  })
})

// ── generateCsrfToken ─────────────────────────────────────────────────────────

describe('generateCsrfToken', () => {
  it('generates a 64-char hex string', () => {
    const token = generateCsrfToken()
    expect(token).toHaveLength(64)
    expect(/^[0-9a-f]+$/.test(token)).toBe(true)
  })

  it('generates unique tokens', () => {
    const t1 = generateCsrfToken()
    const t2 = generateCsrfToken()
    expect(t1).not.toBe(t2)
  })
})

// ── Token expiry ──────────────────────────────────────────────────────────────

describe('getTokenExpiry', () => {
  // Build a fake JWT with exp = now + 1 hour
  function makeToken(expOffsetMs: number): string {
    const payload = { sub: 'user', exp: Math.floor((Date.now() + expOffsetMs) / 1000) }
    const encoded = btoa(JSON.stringify(payload))
    return `header.${encoded}.signature`
  }

  it('extracts expiry from a valid token', () => {
    const token = makeToken(3600_000)
    const expiry = getTokenExpiry(token)
    expect(expiry).toBeInstanceOf(Date)
  })

  it('returns null for malformed tokens', () => {
    expect(getTokenExpiry('not.a.token')).toBeNull()
    expect(getTokenExpiry('one-part')).toBeNull()
  })
})

describe('isTokenExpired', () => {
  function makeToken(expOffsetMs: number): string {
    const payload = { sub: 'user', exp: Math.floor((Date.now() + expOffsetMs) / 1000) }
    const encoded = btoa(JSON.stringify(payload))
    return `header.${encoded}.signature`
  }

  it('returns false for a fresh token', () => {
    const token = makeToken(3600_000) // 1 hour from now
    expect(isTokenExpired(token, 0)).toBe(false)
  })

  it('returns true for an expired token', () => {
    const token = makeToken(-10_000) // expired 10s ago
    expect(isTokenExpired(token, 0)).toBe(true)
  })

  it('considers buffer time', () => {
    const token = makeToken(20_000) // expires in 20s
    // Buffer of 30s — should be considered expired
    expect(isTokenExpired(token, 30_000)).toBe(true)
  })
})
