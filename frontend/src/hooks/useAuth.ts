/**
 * hooks/useAuth.ts — Authentication hook with secure token management.
 *
 * Security design:
 *  - Token lives in React state + module-level tokenStore (memory only)
 *  - Auto-logout timer based on JWT expiry
 *  - Input validation before any API call
 *  - Error messages sanitized — never expose raw backend errors
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { login as apiLogin, tokenStore, setUnauthorizedHandler } from '@/services/api'
import { isTokenExpired, getTokenExpiry, validateUsername, validatePassword } from '@/utils/security'
import type { LoginCredentials } from '@/types'

export interface AuthState {
  isAuthenticated: boolean
  username: string | null
  isLoading: boolean
  error: string | null
}

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    isLoading: false,
    error: null,
  })

  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const logout = useCallback(() => {
    tokenStore.clear()
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    setState({ isAuthenticated: false, username: null, isLoading: false, error: null })
  }, [])

  // Register global 401 handler so Axios interceptor can trigger logout
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(() => {})
  }, [logout])

  /**
   * Schedule auto-logout when the token expires.
   * Adds a 30s buffer to logout slightly before expiry.
   */
  const scheduleAutoLogout = useCallback((token: string) => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    const expiry = getTokenExpiry(token)
    if (!expiry) return

    const msUntilExpiry = expiry.getTime() - Date.now() - 30_000 // 30s buffer
    if (msUntilExpiry <= 0) {
      logout()
      return
    }
    logoutTimerRef.current = setTimeout(logout, msUntilExpiry)
  }, [logout])

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    // Validate inputs before hitting the API
    const usernameError = validateUsername(credentials.username)
    if (usernameError) {
      setState((s) => ({ ...s, error: usernameError }))
      return false
    }
    const passwordError = validatePassword(credentials.password)
    if (passwordError) {
      setState((s) => ({ ...s, error: passwordError }))
      return false
    }

    setState((s) => ({ ...s, isLoading: true, error: null }))

    try {
      const tokenData = await apiLogin(credentials)
      const token = tokenData.access_token

      // Verify token isn't immediately expired (sanity check)
      if (isTokenExpired(token)) {
        setState((s) => ({ ...s, isLoading: false, error: 'Received an invalid token. Contact support.' }))
        return false
      }

      tokenStore.set(token)
      scheduleAutoLogout(token)

      setState({
        isAuthenticated: true,
        username: credentials.username.trim(),
        isLoading: false,
        error: null,
      })
      return true
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Login failed. Please check your credentials.'
      setState((s) => ({ ...s, isLoading: false, error: message }))
      return false
    }
  }, [scheduleAutoLogout])

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }))
  }, [])

  // Cleanup auto-logout timer on unmount
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    }
  }, [])

  return { ...state, login, logout, clearError }
}
