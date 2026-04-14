/**
 * context/AuthContext.tsx — React context for auth state.
 * Wraps useAuth and provides it to the entire component tree.
 */

import { createContext, useContext, ReactNode } from 'react'
import { useAuth, UseAuthReturn } from '@/hooks/useAuth'

const AuthContext = createContext<UseAuthReturn | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuthContext(): UseAuthReturn {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
