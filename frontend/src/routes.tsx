/**
 * routes.tsx — Application routing with protected route guard.
 *
 * PrivateRoute checks auth state and redirects unauthenticated users to login.
 * This is a UI-level guard only — the backend enforces real authorization via JWT.
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '@/context/AuthContext'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'
import Dither from '@/components/Dither/Dither'

/**
 * PrivateRoute — wraps protected pages.
 * Redirects to /login if user is not authenticated.
 */
export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) return null  // Avoid flash of login page during initial auth check

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      <div className="relative z-50">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="relative z-40">
          <Navbar />
        </div>
        <main className="flex-1 overflow-y-auto relative">
          {/* Background effects - only visible in dark mode for that SOC look */}
          <div className="fixed inset-0 pointer-events-none z-0 opacity-15 dark:opacity-15 opacity-0 transition-opacity duration-500">
            <Dither
              waveColor={[0.02, 0.06, 0.1]}
              disableAnimation={false}
              enableMouseInteraction
              mouseRadius={0.3}
              colorNum={4}
              waveAmplitude={0.2}
              waveFrequency={2.5}
              waveSpeed={0.03}
            />
          </div>
          <div className="fixed inset-0 pointer-events-none bg-scan-lines opacity-20 dark:opacity-20 opacity-0 z-1 transition-opacity duration-500" />
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
