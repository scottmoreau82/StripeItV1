import React from 'react';
import { cn } from '@/src/lib/utils';
import { DealStatus } from '@/src/types';

/**
 * StripeItBadgeSystem
 * Reusable badge components for statuses and labels.
 */

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'status' | 'outline' | 'ghost';
  status?: DealStatus;
}

const statusColors = {
  [DealStatus.DRAFT]: 'bg-slate-500/10 text-slate-500 border-slate-500/10',
  [DealStatus.SUBMITTED]: 'bg-blue-500/10 text-blue-500 border-blue-500/10',
  [DealStatus.FINALIZED]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/10',
  [DealStatus.CANCELLED]: 'bg-rose-500/10 text-rose-500 border-rose-500/10'
};

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  className, 
  variant = 'outline',
  status
}) => {
  return (
    <div className={cn(
      "inline-flex items-center rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] border",
      status ? statusColors[status] : "bg-white/5 text-slate-400 border-white/5",
      variant === 'ghost' && "bg-transparent border-transparent",
      className
    )}>
      {children}
    </div>
  );
};
