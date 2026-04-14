/**
 * components/Loader.tsx — SOC-themed loading spinner and skeleton states.
 */

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function Loader({ size = 'md', label = 'Scanning...' }: LoaderProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-2 border-cyan-glow/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-glow animate-spin" />
        <div className="absolute inset-1 rounded-full border-t border-cyan-glow/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      {label && (
        <span className="font-mono text-xs text-text-secondary tracking-widest animate-pulse">
          {label}
        </span>
      )}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size="lg" label="Loading data..." />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-bg-card border border-bg-border rounded-lg p-5 animate-pulse">
      <div className="h-3 bg-bg-elevated rounded w-1/3 mb-4" />
      <div className="h-8 bg-bg-elevated rounded w-1/2 mb-2" />
      <div className="h-2 bg-bg-elevated rounded w-2/3" />
    </div>
  )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-bg-card border border-bg-border rounded-lg p-4 animate-pulse flex gap-4">
          <div className="h-3 bg-bg-elevated rounded w-16" />
          <div className="h-3 bg-bg-elevated rounded flex-1" />
          <div className="h-3 bg-bg-elevated rounded w-24" />
          <div className="h-3 bg-bg-elevated rounded w-20" />
        </div>
      ))}
    </div>
  )
}
