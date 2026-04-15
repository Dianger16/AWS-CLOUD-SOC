import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  delay?: number;
}

export function MetricCard({
  title,
  value,
  suffix = '',
  icon: Icon,
  trend,
  color = 'primary',
  delay = 0
}: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const colorClasses = {
    primary: 'from-primary to-accent',
    success: 'from-success to-emerald-400',
    warning: 'from-warning to-yellow-400',
    destructive: 'from-destructive to-red-400',
  };

  const glowClasses = {
    primary: 'shadow-[0_0_30px_rgba(0,217,255,0.3)]',
    success: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
    warning: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
    destructive: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className={`
        glass-card rounded-2xl p-6 border-2 transition-all duration-300 group cursor-pointer
        hover:border-${color === 'primary' ? 'primary' : color === 'success' ? 'success' : color === 'warning' ? 'warning' : 'destructive'}/50
        ${color === 'destructive' && value > 20 ? 'animate-pulse-glow' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-sm text-muted-foreground mb-1">{title}</div>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={displayValue}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-3xl tracking-tight"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {displayValue.toLocaleString()}{suffix}
            </motion.span>
            {trend && (
              <span
                className={`text-sm ${
                  trend.isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`
            w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]}
            flex items-center justify-center
            ${glowClasses[color]}
            group-hover:${glowClasses[color]}
          `}
        >
          <Icon className="w-6 h-6 text-white" />
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: delay + 0.3, duration: 1.5, ease: 'easeOut' }}
          className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
        />
      </div>
    </motion.div>
  );
}
