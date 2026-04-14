/**
 * tests/auth.test.ts — Tests for the useAuth hook and login flow.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../src/hooks/useAuth'

// Mock the API module
vi.mock('../src/services/api', () => ({
  login: vi.fn(),
  tokenStore: { set: vi.fn(), get: vi.fn(), clear: vi.fn() },
  setUnauthorizedHandler: vi.fn(),
}))

import * as api from '../src/services/api'

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('rejects empty username', async () => {
    const { result } = renderHook(() => useAuth())
    let success: boolean
    await act(async () => {
      success = await result.current.login({ username: '', password: 'pass123' })
    })
    expect(success!).toBe(false)
    expect(result.current.error).toBeTruthy()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('rejects empty password', async () => {
    const { result } = renderHook(() => useAuth())
    let success: boolean
    await act(async () => {
      success = await result.current.login({ username: 'admin', password: '' })
    })
    expect(success!).toBe(false)
    expect(result.current.error).toBeTruthy()
  })

  it('rejects username with special chars', async () => {
    const { result } = renderHook(() => useAuth())
    let success: boolean
    await act(async () => {
      success = await result.current.login({ username: "admin'; DROP TABLE--", password: 'pass123' })
    })
    expect(success!).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('authenticates successfully with valid credentials', async () => {
    // Build a valid non-expired token
    const payload = { sub: 'admin', exp: Math.floor((Date.now() + 3600_000) / 1000) }
    const fakeToken = `h.${btoa(JSON.stringify(payload))}.s`

    vi.mocked(api.login).mockResolvedValueOnce({ access_token: fakeToken, token_type: 'bearer' })

    const { result } = renderHook(() => useAuth())
    let success: boolean
    await act(async () => {
      success = await result.current.login({ username: 'admin', password: 'guardian2024' })
    })

    expect(success!).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('admin')
    expect(result.current.error).toBeNull()
    expect(api.tokenStore.set).toHaveBeenCalledWith(fakeToken)
  })

  it('handles API login failure gracefully', async () => {
    vi.mocked(api.login).mockRejectedValueOnce({ message: 'Incorrect username or password.' })

    const { result } = renderHook(() => useAuth())
    let success: boolean
    await act(async () => {
      success = await result.current.login({ username: 'admin', password: 'wrongpass' })
    })

    expect(success!).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBeTruthy()
  })

  it('logout clears state', async () => {
    const payload = { sub: 'admin', exp: Math.floor((Date.now() + 3600_000) / 1000) }
    const fakeToken = `h.${btoa(JSON.stringify(payload))}.s`
    vi.mocked(api.login).mockResolvedValueOnce({ access_token: fakeToken, token_type: 'bearer' })

    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.login({ username: 'admin', password: 'guardian2024' })
    })
    expect(result.current.isAuthenticated).toBe(true)

    act(() => result.current.logout())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(api.tokenStore.clear).toHaveBeenCalled()
  })

  it('clearError resets error state', async () => {
    vi.mocked(api.login).mockRejectedValueOnce({ message: 'Error' })
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.login({ username: 'admin', password: 'bad' })
    })
    expect(result.current.error).toBeTruthy()

    act(() => result.current.clearError())
    expect(result.current.error).toBeNull()
  })
})
