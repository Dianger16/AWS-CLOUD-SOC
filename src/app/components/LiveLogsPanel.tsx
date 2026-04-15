import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState, useRef } from 'react';
import { Shield, ShieldAlert, AlertCircle, Terminal } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  ip: string;
  location: string;
  requestType: string;
  status: 'allowed' | 'blocked' | 'suspicious';
  path: string;
}

const generateMockLogs = (): LogEntry[] => {
  const statuses: Array<'allowed' | 'blocked' | 'suspicious'> = ['allowed', 'blocked', 'suspicious'];
  const requestTypes = ['GET', 'POST', 'PUT', 'DELETE'];
  const paths = ['/api/users', '/api/auth', '/api/data', '/admin', '/login'];
  const locations = ['US-East', 'EU-West', 'Asia-Pacific', 'US-West', 'EU-North'];

  return Array.from({ length: 15 }, (_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 30000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    location: locations[Math.floor(Math.random() * locations.length)],
    requestType: requestTypes[Math.floor(Math.random() * requestTypes.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    path: paths[Math.floor(Math.random() * paths.length)],
  }));
};

export function LiveLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>(generateMockLogs());
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLog = generateMockLogs()[0];
        return [newLog, ...prev.slice(0, 24)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const statusConfig = {
    allowed: {
      color: 'text-success',
      bg: 'bg-success/10',
      icon: Shield,
      label: 'Allowed',
    },
    blocked: {
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      icon: ShieldAlert,
      label: 'Blocked',
    },
    suspicious: {
      color: 'text-warning',
      bg: 'bg-warning/10',
      icon: AlertCircle,
      label: 'Suspicious',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card rounded-2xl p-6 border-2 border-border hover:border-primary/20 transition-all duration-500"
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-success/10 border border-success/30">
            <Terminal className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="mb-1">Live Request Logs</h3>
            <p className="text-sm text-muted-foreground">Real-time security event monitoring</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors text-sm"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/30">
            <div className={`w-2 h-2 rounded-full bg-success ${!isPaused && 'animate-pulse'}`} />
            <span className="text-sm text-success" style={{ fontFamily: 'var(--font-mono)' }}>
              {isPaused ? 'PAUSED' : 'STREAMING'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        {/* Streaming indicator overlay */}
        {!isPaused && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-success to-transparent origin-left"
          />
        )}

        <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar" ref={scrollRef}>
          <table className="w-full">
            <thead className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <tr className="border-b-2 border-primary/20">
                <th className="text-left py-4 px-4 text-xs text-primary uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left py-4 px-4 text-xs text-primary uppercase tracking-wider">
                  IP Address
                </th>
                <th className="text-left py-4 px-4 text-xs text-primary uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left py-4 px-4 text-xs text-primary uppercase tracking-wider">
                  Method
                </th>
                <th className="text-left py-4 px-4 text-xs text-primary uppercase tracking-wider">
                  Path
                </th>
                <th className="text-left py-4 px-4 text-xs text-primary uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {logs.map((log, index) => {
                  const config = statusConfig[log.status];
                  const Icon = config.icon;
                  const isNew = index === 0 && !isPaused;

                  return (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20, backgroundColor: 'rgba(0, 217, 255, 0.1)' }}
                      animate={{
                        opacity: 1,
                        x: 0,
                        backgroundColor: isNew ? 'rgba(0, 217, 255, 0.05)' : 'transparent'
                      }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="border-b border-border/30 hover:bg-primary/5 cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {log.timestamp}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="text-primary group-hover:text-accent transition-colors">
                          {log.ip}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {log.location}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2.5 py-1 rounded-md text-xs bg-secondary/50 border border-border group-hover:border-primary/30 transition-colors"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {log.requestType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                          {log.path}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg} border border-${log.status === 'blocked' ? 'destructive' : log.status === 'suspicious' ? 'warning' : 'success'}/20 w-fit group-hover:border-${log.status === 'blocked' ? 'destructive' : log.status === 'suspicious' ? 'warning' : 'success'}/50 transition-colors`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                          <span className={`text-xs ${config.color} uppercase tracking-wide`} style={{ fontFamily: 'var(--font-mono)' }}>
                            {config.label}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
