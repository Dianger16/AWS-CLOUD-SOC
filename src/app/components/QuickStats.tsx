import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface QuickStat {
  label: string;
  value: string;
  change?: {
    value: number;
    trend: 'up' | 'down';
  };
}

const quickStats: QuickStat[] = [
  {
    label: 'Avg Response Time',
    value: '124ms',
    change: { value: 8, trend: 'down' }
  },
  {
    label: 'Active Sessions',
    value: '2,847',
    change: { value: 12, trend: 'up' }
  },
  {
    label: 'Bandwidth Usage',
    value: '47.2 GB/s',
    change: { value: 5, trend: 'up' }
  },
  {
    label: 'Cache Hit Rate',
    value: '94.3%',
    change: { value: 2, trend: 'up' }
  }
];

export function QuickStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8"
    >
      {quickStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 * index }}
          className="glass-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-lg" style={{ fontFamily: 'var(--font-mono)' }}>
                {stat.value}
              </div>
            </div>
            {stat.change && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${stat.change.trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {stat.change.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                  {stat.change.value}%
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
