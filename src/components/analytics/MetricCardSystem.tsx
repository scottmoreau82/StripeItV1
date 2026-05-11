import React from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * StripeItMetricCardSystem
 * Individual metric display cards with futuristic styling.
 */

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'cyan' | 'emerald' | 'amber' | 'rose';
  loading?: boolean;
}

const colorMap = {
  cyan: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  rose: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
  color = 'cyan',
  loading
}) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-white/[0.04] to-transparent border-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden">
      <div className="flex flex-col h-full">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110",
          colorMap[color]
        )}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="space-y-1">
          <Typography variant="label" className="text-slate-500 font-black tracking-widest block uppercase text-[10px]">
            {label}
          </Typography>
          
          <div className="flex items-baseline gap-2">
            <Typography variant="h1" className="text-white text-4xl tracking-tighter sm:text-5xl">
              {loading ? '...' : value}
            </Typography>
            
            {trend && (
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider",
                trend.isPositive ? "text-emerald-400 border-emerald-400/20" : "text-rose-400 border-rose-400/20"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          
          {subtext && (
            <Typography variant="mono" className="text-[9px] text-slate-600 font-bold block mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {subtext}
            </Typography>
          )}
        </div>
      </div>
      
      {/* Visual Accent */}
      <div className={cn(
        "absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
        color === 'cyan' ? 'text-brand-primary' : 
        color === 'emerald' ? 'text-emerald-500' :
        color === 'amber' ? 'text-amber-500' : 'text-rose-500'
      )} />
    </Card>
  );
};
