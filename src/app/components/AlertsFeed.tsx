import { motion } from 'motion/react';
import { AlertTriangle, Shield, Info, AlertCircle } from 'lucide-react';

interface Alert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'critical';
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    timestamp: '2 min ago',
    title: 'Brute Force Attack Detected',
    description: 'Multiple failed login attempts from IP 185.220.101.45',
    severity: 'critical',
  },
  {
    id: '2',
    timestamp: '15 min ago',
    title: 'Suspicious API Activity',
    description: 'Unusual request pattern detected from authenticated user',
    severity: 'medium',
  },
  {
    id: '3',
    timestamp: '32 min ago',
    title: 'Rate Limit Exceeded',
    description: 'IP 192.168.1.100 exceeded rate limit threshold',
    severity: 'low',
  },
  {
    id: '4',
    timestamp: '1 hour ago',
    title: 'DDoS Mitigation Active',
    description: 'Traffic spike detected and mitigated successfully',
    severity: 'critical',
  },
  {
    id: '5',
    timestamp: '2 hours ago',
    title: 'New Firewall Rule Applied',
    description: 'Blocking traffic from malicious IP range',
    severity: 'low',
  },
  {
    id: '6',
    timestamp: '3 hours ago',
    title: 'SQL Injection Attempt',
    description: 'Malicious query pattern blocked at WAF layer',
    severity: 'medium',
  },
];

export function AlertsFeed() {
  const severityConfig = {
    critical: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      icon: AlertTriangle,
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
    medium: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      icon: AlertCircle,
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    },
    low: {
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      icon: Info,
      glow: 'shadow-[0_0_20px_rgba(0,217,255,0.3)]',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-card rounded-2xl p-6 h-[600px] overflow-hidden flex flex-col border-2 border-border hover:border-primary/20 transition-all duration-500"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="mb-1">Security Alerts</h3>
          <p className="text-sm text-muted-foreground">Recent threat detections and events</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-destructive/10 border border-destructive/30">
            <span className="text-xs text-destructive" style={{ fontFamily: 'var(--font-mono)' }}>
              {mockAlerts.filter(a => a.severity === 'critical').length} Critical
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-warning/10 border border-warning/30">
            <span className="text-xs text-warning" style={{ fontFamily: 'var(--font-mono)' }}>
              {mockAlerts.filter(a => a.severity === 'medium').length} Medium
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {mockAlerts.map((alert, index) => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;

          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 rounded-xl border ${config.border} ${config.bg}
                hover:${config.glow} transition-all duration-300 cursor-pointer
                relative overflow-hidden group
              `}
            >
              {/* Animated background gradient */}
              <div
                className={`
                  absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                  bg-gradient-to-r ${config.bg}
                `}
              />

              <div className="relative flex gap-4">
                <div className={`mt-1 p-2 rounded-lg ${config.bg} ${config.glow}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {alert.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`
                        px-2 py-1 rounded-md text-xs ${config.color} ${config.bg}
                        uppercase tracking-wider
                      `}
                    >
                      {alert.severity}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
