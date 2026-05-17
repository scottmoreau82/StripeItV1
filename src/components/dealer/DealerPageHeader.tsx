import React from 'react';
import { Typography } from '../ui/Typography';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/**
 * DealerPageHeader
 * Standardized header component for Dealer-tier pages.
 * Matches the layout and style of the Activity Feed header.
 */

interface DealerPageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export const DealerPageHeader: React.FC<DealerPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "bg-brand-primary",
  children,
  className
}) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6", className)}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-[1.25rem] flex items-center justify-center shadow-glow shadow-brand-primary/10",
          iconColor === "bg-brand-primary" ? "bg-brand-primary glow-primary" : iconColor
        )}>
          <Icon className={cn("h-6 w-6", iconColor === "bg-brand-primary" ? "text-bg-deep" : "text-white")} />
        </div>
        <div className="space-y-1">
          <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter">
            {title}
          </Typography>
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
            {subtitle}
          </Typography>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {children}
      </div>
    </div>
  );
};
