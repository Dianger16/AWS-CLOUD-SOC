/**
 * App.tsx — Root application with routing and providers.
 */

import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { PrivateRoute } from '@/routes'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Assets } from '@/pages/Assets'
import { Vulnerabilities } from '@/pages/Vulnerabilities'
import { Alerts } from '@/pages/Alerts'
import { Logs } from '@/pages/Logs'
import type { ScanSummary } from '@/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: { retry: 0 },
  },
})

export default function App() {
  const [lastScan, setLastScan] = useState<ScanSummary | null>(null)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard onScanComplete={setLastScan} />} />
              <Route path="/assets" element={<Assets lastScan={lastScan} />} />
              <Route path="/vulnerabilities" element={<Vulnerabilities />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/logs" element={<Logs />} />
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}