import { motion } from 'motion/react';
import { Download, RefreshCw, Filter, Settings } from 'lucide-react';
import { useState } from 'react';

export function QuickActions() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const actions = [
    {
      icon: Download,
      label: 'Export Report',
      onClick: () => console.log('Export'),
      color: 'primary'
    },
    {
      icon: RefreshCw,
      label: 'Refresh Data',
      onClick: handleRefresh,
      color: 'success',
      isLoading: isRefreshing
    },
    {
      icon: Filter,
      label: 'Apply Filters',
      onClick: () => console.log('Filter'),
      color: 'warning'
    },
    {
      icon: Settings,
      label: 'Configure',
      onClick: () => console.log('Settings'),
      color: 'muted'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-2"
    >
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            onClick={action.onClick}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-2.5 rounded-xl transition-all
              ${action.color === 'primary' ? 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30' : ''}
              ${action.color === 'success' ? 'bg-success/10 hover:bg-success/20 text-success border border-success/30' : ''}
              ${action.color === 'warning' ? 'bg-warning/10 hover:bg-warning/20 text-warning border border-warning/30' : ''}
              ${action.color === 'muted' ? 'bg-secondary hover:bg-accent/20 text-foreground border border-border' : ''}
            `}
            title={action.label}
          >
            <Icon
              className={`w-4 h-4 ${action.isLoading ? 'animate-spin' : ''}`}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
