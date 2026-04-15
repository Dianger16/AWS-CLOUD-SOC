import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ icon: Icon, title, description, badge, action }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-6 flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 cyber-glow">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="tracking-tight">{title}</h2>
            {badge && (
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs text-primary">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
