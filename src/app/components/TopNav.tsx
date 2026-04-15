import { Search, Bell, User, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

interface TopNavProps {
  collapsed: boolean;
}

export function TopNav({ collapsed }: TopNavProps) {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications] = useState(3);

  return (
    <header
      className="fixed top-0 right-0 h-16 z-40 glass-card border-b border-border backdrop-blur-xl"
      style={{
        left: collapsed ? '80px' : '280px',
        transition: 'left 0.3s',
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search logs, IPs, threats..."
              className="w-full pl-12 pr-4 py-2.5 bg-input-background border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-secondary hover:bg-accent/20 transition-colors"
          >
            {darkMode ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </motion.button>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 rounded-xl bg-secondary hover:bg-accent/20 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-xs rounded-full flex items-center justify-center cyber-glow-strong"
              >
                {notifications}
              </motion.span>
            )}
          </motion.button>

          {/* User Profile */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl bg-secondary hover:bg-accent/20 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="text-left">
              <div className="text-sm">Admin</div>
              <div className="text-xs text-muted-foreground">Security Ops</div>
            </div>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
