import { Shield, Activity, FileText, AlertTriangle, BarChart3, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'threats', label: 'Threats', icon: AlertTriangle },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'alerts', label: 'Alerts', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, collapsed, onCollapsedChange }: SidebarProps) {

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{
        x: 0,
        width: collapsed ? 80 : 280
      }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-screen z-50 glass-card border-r border-sidebar-border"
      style={{
        background: 'var(--sidebar)',
      }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d9ff] to-[#0ea5e9] flex items-center justify-center cyber-glow">
              <Shield className="w-5 h-5 text-[#0b0f19]" />
            </div>
            <span className="tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
              CLOUDSOC
            </span>
          </motion.div>
        )}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                ${isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground cyber-glow'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : ''}`} />
              {!collapsed && (
                <span className="tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                  {item.label}
                </span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-current"
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Status Indicator */}
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-6 left-6 right-6 p-4 rounded-xl glass-card border border-success/20"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-success animate-ping" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">System Status</div>
              <div className="text-sm text-success">All Systems Operational</div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}
