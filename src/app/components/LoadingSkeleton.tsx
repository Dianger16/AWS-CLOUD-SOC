import { motion } from 'motion/react';

export function MetricCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 border-2 border-border">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 w-24 bg-secondary rounded animate-pulse mb-2" />
          <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-secondary animate-pulse" />
      </div>
      <div className="w-full h-1 bg-secondary rounded-full" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 h-[400px] border-2 border-border">
      <div className="mb-6">
        <div className="h-5 w-40 bg-secondary rounded animate-pulse mb-2" />
        <div className="h-4 w-64 bg-secondary rounded animate-pulse" />
      </div>
      <div className="flex-1 flex items-end gap-2 h-[280px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${Math.random() * 100}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="flex-1 bg-secondary/50 rounded-t animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-6 border-2 border-border">
      <div className="mb-6">
        <div className="h-5 w-48 bg-secondary rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-secondary rounded animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="h-12 bg-secondary/50 rounded animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
