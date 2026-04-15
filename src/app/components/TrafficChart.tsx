import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';

const generateTrafficData = () => {
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now - (23 - i) * 60 * 60 * 1000);
    return {
      time: hour.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      requests: Math.floor(Math.random() * 3000) + 1000,
      blocked: Math.floor(Math.random() * 500) + 100,
      allowed: Math.floor(Math.random() * 2500) + 900,
    };
  });
};

export function TrafficChart() {
  const data = generateTrafficData();

  const totalRequests = data.reduce((sum, item) => sum + item.requests, 0);
  const totalBlocked = data.reduce((sum, item) => sum + item.blocked, 0);
  const totalAllowed = data.reduce((sum, item) => sum + item.allowed, 0);
  const blockRate = ((totalBlocked / totalRequests) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-2xl p-6 h-[400px] scan-line border-2 border-border hover:border-primary/30 transition-all duration-500"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1">Real-time Traffic</h3>
          <p className="text-sm text-muted-foreground">Request volume over the last 24 hours</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">Allowed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Blocked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
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
            labelStyle={{ color: '#e4e8f0', marginBottom: '8px' }}
          />
          <Area
            type="monotone"
            dataKey="allowed"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#colorAllowed)"
          />
          <Area
            type="monotone"
            dataKey="blocked"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#colorBlocked)"
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="#00d9ff"
            strokeWidth={2}
            fill="url(#colorRequests)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Statistics Summary */}
      <div className="mt-4 grid grid-cols-4 gap-3 pt-4 border-t border-border/50">
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Total Requests</div>
          <div className="text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
            {totalRequests.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Allowed</div>
          <div className="text-sm text-success" style={{ fontFamily: 'var(--font-mono)' }}>
            {totalAllowed.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Blocked</div>
          <div className="text-sm text-destructive" style={{ fontFamily: 'var(--font-mono)' }}>
            {totalBlocked.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Block Rate</div>
          <div className="text-sm text-warning" style={{ fontFamily: 'var(--font-mono)' }}>
            {blockRate}%
          </div>
        </div>
      </div>
    </motion.div>
  );
}
