import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';

const threatData = [
  { name: 'DDoS', value: 342, color: '#ef4444' },
  { name: 'SQL Injection', value: 187, color: '#f59e0b' },
  { name: 'XSS', value: 156, color: '#8b5cf6' },
  { name: 'Brute Force', value: 289, color: '#00d9ff' },
  { name: 'Malware', value: 98, color: '#10b981' },
];

export function ThreatDistribution() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-2xl p-6 h-[400px] border-2 border-border hover:border-primary/30 transition-all duration-500"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1">Threat Distribution</h3>
          <p className="text-sm text-muted-foreground">Attack types detected in the last 24h</p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30">
          <span className="text-xs text-destructive" style={{ fontFamily: 'var(--font-mono)' }}>
            {threatData.reduce((sum, t) => sum + t.value, 0)} Total
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={threatData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
            }}
            cursor={{ fill: 'rgba(0, 217, 255, 0.1)' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {threatData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {threatData.map((threat) => (
          <div key={threat.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: threat.color, boxShadow: `0 0 10px ${threat.color}` }}
            />
            <span className="text-xs text-muted-foreground">{threat.name}</span>
            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
              {threat.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
