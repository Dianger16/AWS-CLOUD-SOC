import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'medium' | 'low';
  timestamp: Date;
}

export function ThreatNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulate random threat notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const severities: Array<'critical' | 'medium' | 'low'> = ['critical', 'medium', 'low'];
        const messages = [
          { title: 'DDoS Attack Detected', message: 'Traffic spike from 185.220.101.45' },
          { title: 'Brute Force Attempt', message: 'Multiple login failures detected' },
          { title: 'Suspicious Activity', message: 'Unusual API request pattern' }
        ];

        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        const newNotification: Notification = {
          id: `notif-${Date.now()}`,
          title: randomMsg.title,
          message: randomMsg.message,
          severity: severities[Math.floor(Math.random() * severities.length)],
          timestamp: new Date()
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 2)]);

        // Auto remove after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 5000);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const severityConfig = {
    critical: {
      bg: 'bg-destructive/10',
      border: 'border-destructive',
      text: 'text-destructive',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
    },
    medium: {
      bg: 'bg-warning/10',
      border: 'border-warning',
      text: 'text-warning',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
    },
    low: {
      bg: 'bg-primary/10',
      border: 'border-primary',
      text: 'text-primary',
      glow: 'shadow-[0_0_20px_rgba(0,217,255,0.3)]'
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 w-96">
      <AnimatePresence>
        {notifications.map((notif) => {
          const config = severityConfig[notif.severity];
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              className={`
                glass-card rounded-xl p-4 border-2 ${config.border} ${config.bg} ${config.glow}
                backdrop-blur-xl
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${config.bg}`}>
                  <AlertTriangle className={`w-5 h-5 ${config.text}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className={`font-medium ${config.text}`}>{notif.title}</h4>
                    <button
                      onClick={() => removeNotification(notif.id)}
                      className="p-1 hover:bg-secondary/50 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                  <div className="text-xs text-muted-foreground">
                    {notif.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
