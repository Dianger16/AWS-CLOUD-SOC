import { motion } from 'motion/react';
import { Globe, MapPin, Wifi, TrendingUp, Clock, Shield } from 'lucide-react';

const mockIPData = {
  ip: '185.220.101.45',
  location: 'Amsterdam, Netherlands',
  isp: 'Cloudflare Inc.',
  riskScore: 78,
  requestHistory: [
    { time: '14:32:15', path: '/api/auth/login', status: 'blocked' },
    { time: '14:32:12', path: '/api/users', status: 'blocked' },
    { time: '14:32:08', path: '/admin', status: 'blocked' },
    { time: '14:31:55', path: '/api/auth/login', status: 'blocked' },
  ],
  statistics: {
    totalRequests: 1247,
    blockedRequests: 892,
    allowedRequests: 355,
    firstSeen: '2026-04-14 08:23:10',
  },
};

export function IPIntelligence() {
  const riskLevel = mockIPData.riskScore > 70 ? 'critical' : mockIPData.riskScore > 40 ? 'medium' : 'low';
  const riskColor = riskLevel === 'critical' ? 'text-destructive' : riskLevel === 'medium' ? 'text-warning' : 'text-success';
  const riskBg = riskLevel === 'critical' ? 'bg-destructive/10' : riskLevel === 'medium' ? 'bg-warning/10' : 'bg-success/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass-card rounded-2xl p-6 h-[600px] overflow-hidden flex flex-col border-2 border-border hover:border-primary/20 transition-all duration-500"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1">IP Intelligence</h3>
          <p className="text-sm text-muted-foreground">Detailed information about selected IP</p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg ${riskBg} border border-${riskLevel === 'critical' ? 'destructive' : riskLevel === 'medium' ? 'warning' : 'success'}/30`}>
          <span className={`text-xs ${riskColor} uppercase tracking-wide`} style={{ fontFamily: 'var(--font-mono)' }}>
            {riskLevel} Risk
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
        {/* IP Address */}
        <div className="p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">IP Address</span>
          </div>
          <div className="text-2xl" style={{ fontFamily: 'var(--font-mono)' }}>
            {mockIPData.ip}
          </div>
        </div>

        {/* Risk Score */}
        <div className={`p-4 rounded-xl ${riskBg} border border-${riskLevel === 'critical' ? 'destructive' : riskLevel === 'medium' ? 'warning' : 'success'}/30`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 ${riskColor}`} />
              <span className="text-sm text-muted-foreground">Threat Risk Score</span>
            </div>
            <span className={`text-2xl ${riskColor}`} style={{ fontFamily: 'var(--font-mono)' }}>
              {mockIPData.riskScore}/100
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mockIPData.riskScore}%` }}
              transition={{ delay: 0.9, duration: 1, ease: 'easeOut' }}
              className={`h-full ${riskLevel === 'critical' ? 'bg-destructive' : riskLevel === 'medium' ? 'bg-warning' : 'bg-success'}`}
            />
          </div>
        </div>

        {/* Location & ISP */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">Location</span>
            </div>
            <div className="text-sm">{mockIPData.location}</div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">ISP</span>
            </div>
            <div className="text-sm">{mockIPData.isp}</div>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground uppercase">First Seen</span>
            </div>
            <div className="text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
              {mockIPData.statistics.firstSeen}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Request Statistics</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total</div>
              <div className="text-lg" style={{ fontFamily: 'var(--font-mono)' }}>
                {mockIPData.statistics.totalRequests}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Blocked</div>
              <div className="text-lg text-destructive" style={{ fontFamily: 'var(--font-mono)' }}>
                {mockIPData.statistics.blockedRequests}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Allowed</div>
              <div className="text-lg text-success" style={{ fontFamily: 'var(--font-mono)' }}>
                {mockIPData.statistics.allowedRequests}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-4 rounded-xl bg-secondary/30 border border-border">
          <div className="text-sm text-muted-foreground mb-3">Recent Activity</div>
          <div className="space-y-2">
            {mockIPData.requestHistory.map((req, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs p-2 rounded bg-secondary/50"
              >
                <span style={{ fontFamily: 'var(--font-mono)' }}>{req.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }} className="text-muted-foreground">
                  {req.path}
                </span>
                <span className={req.status === 'blocked' ? 'text-destructive' : 'text-success'}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
