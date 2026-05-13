import React from 'react';
import { motion } from 'motion/react';
import { AppIcon, IconName } from './AppIcon';
import { Typography } from './Typography';
import { cn } from '@/src/lib/utils';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center rounded-[2rem] bg-white/[0.02] border border-white/5",
        className
      )}
    >
      <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-inner border border-white/5 text-slate-600">
        <AppIcon name={icon} size={32} />
      </div>
      <Typography variant="h3" className="text-white mb-2 leading-tight">
        {title}
      </Typography>
      <Typography variant="p" className="text-slate-500 max-w-xs mx-auto mb-8 text-sm">
        {description}
      </Typography>
      {action && (
        <div className="w-full max-w-xs scale-90 sm:scale-100">
          {action}
        </div>
      )}
    </motion.div>
  );
};
