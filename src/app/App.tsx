import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { MetricCard } from './components/MetricCard';
import { TrafficChart } from './components/TrafficChart';
import { ThreatDistribution } from './components/ThreatDistribution';
import { GeoMap } from './components/GeoMap';
import { LiveLogsPanel } from './components/LiveLogsPanel';
import { AlertsFeed } from './components/AlertsFeed';
import { IPIntelligence } from './components/IPIntelligence';
import { SectionHeader } from './components/SectionHeader';
import { QuickStats } from './components/QuickStats';
import { QuickActions } from './components/QuickActions';
import { ThreatNotifications } from './components/ThreatNotification';
import { Shield, Activity, Users, TrendingUp, BarChart3, Globe, Terminal, Bell, Target } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground hex-pattern">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-accent/5 pointer-events-none" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
        }}
      >
        {/* Top Navigation */}
        <TopNav collapsed={sidebarCollapsed} />

        {/* Dashboard Content */}
        <main className="pt-24 px-8 pb-8 relative z-10">
          {/* Dashboard Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-card rounded-2xl p-6 border-2 border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="tracking-tight">
                    Cloud Security Operations Center
                  </h1>
                  <div className="px-3 py-1 rounded-full bg-success/10 border border-success/30 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-success uppercase tracking-wide" style={{ fontFamily: 'var(--font-mono)' }}>
                      Operational
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Real-time threat monitoring and analytics dashboard
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                  <div className="text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-right">
                  <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                  <div className="text-sm text-success" style={{ fontFamily: 'var(--font-mono)' }}>
                    99.98%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Primary Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            <MetricCard
              title="Active Threats"
              value={23}
              icon={Shield}
              color="destructive"
              trend={{ value: 12, isPositive: false }}
              delay={0}
            />
            <MetricCard
              title="Requests/sec"
              value={4287}
              icon={Activity}
              color="primary"
              trend={{ value: 8, isPositive: true }}
              delay={0.1}
            />
            <MetricCard
              title="Blocked IPs"
              value={1542}
              icon={Users}
              color="warning"
              trend={{ value: 5, isPositive: false }}
              delay={0.2}
            />
            <MetricCard
              title="System Health"
              value={99}
              suffix="%"
              icon={TrendingUp}
              color="success"
              trend={{ value: 2, isPositive: true }}
              delay={0.3}
            />
          </div>

          {/* Quick Stats */}
          <QuickStats />

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />

          {/* Analytics Section */}
          <SectionHeader
            icon={BarChart3}
            title="Traffic Analytics"
            description="Real-time request monitoring and threat patterns"
            badge="Live"
            action={<QuickActions />}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-12">
            <TrafficChart />
            <ThreatDistribution />
          </div>

          {/* Geographic Intelligence Section */}
          <SectionHeader
            icon={Globe}
            title="Geographic Intelligence"
            description="Attack origin tracking and geolocation analysis"
          />
          <div className="mb-12">
            <GeoMap />
          </div>

          {/* Live Monitoring Section */}
          <SectionHeader
            icon={Terminal}
            title="Live Request Stream"
            description="Real-time security event monitoring and logging"
            badge={`${Math.floor(Math.random() * 50 + 150)}/s`}
          />
          <div className="mb-12">
            <LiveLogsPanel />
          </div>

          {/* Threat Intelligence Section */}
          <SectionHeader
            icon={Target}
            title="Threat Intelligence"
            description="Security alerts and IP reputation analysis"
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-12">
            <AlertsFeed />
            <IPIntelligence />
          </div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 pt-8 border-t border-border/50"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-6">
                <span>CloudSOC Dashboard v2.0.1</span>
                <span>•</span>
                <span>Powered by AWS & Grafana Analytics</span>
              </div>
              <div className="flex items-center gap-4">
                <span>© 2026 Security Operations</span>
                <span>•</span>
                <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                <span>•</span>
                <a href="#" className="hover:text-primary transition-colors">API Status</a>
              </div>
            </div>
          </motion.footer>
        </main>
      </div>

      {/* Live Threat Notifications */}
      <ThreatNotifications />

      {/* Custom Scrollbar and Additional Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 217, 255, 0.3);
          border-radius: 10px;
          transition: background 0.3s;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 217, 255, 0.6);
        }

        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Glow effect on focus */
        *:focus-visible {
          outline: 2px solid rgba(0, 217, 255, 0.5);
          outline-offset: 2px;
        }

        /* Grid overlay effect */
        .hex-pattern::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(0, 217, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  );
}
