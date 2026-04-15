import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import { useState } from 'react';

const timeRanges = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' }
];

export function TimeRangeSelector() {
  const [selectedRange, setSelectedRange] = useState('24h');

  return (
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-1 p-1 rounded-lg bg-secondary/50 border border-border">
        {timeRanges.map((range) => (
          <motion.button
            key={range.value}
            onClick={() => setSelectedRange(range.value)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-3 py-1 rounded-md text-xs transition-all
              ${selectedRange === range.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }
            `}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {range.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
