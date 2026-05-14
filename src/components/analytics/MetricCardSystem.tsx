import React from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { LucideIcon, Lock } from 'lucide-react';
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
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'orange';
  loading?: boolean;
  isLocked?: boolean;
  onUnlock?: () => void;
  lockMessage?: string;
}

const colorMap = {
  cyan: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  rose: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  subtext,
  color = 'cyan',
  loading,
  isLocked,
  onUnlock,
  lockMessage
}) => {
  if (isLocked) {
    return (
      <Card className="p-6 bg-[#050505] border-white/[0.03] hover:border-purple-500/30 transition-all group relative overflow-hidden h-full flex flex-col justify-between">
        {/* Atmospheric Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-[40px] pointer-events-none group-hover:bg-purple-600/10 transition-colors" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-600/5 blur-[30px] pointer-events-none group-hover:bg-orange-600/10 transition-colors" />

        <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left h-full">
          <div className="flex items-center justify-center sm:justify-between w-full mb-6 relative">
            <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-purple-400 transition-colors">
              <Lock className="h-5 w-5" />
            </div>
            <Typography variant="mono" className="text-[10px] text-slate-700 font-black uppercase tracking-[0.2em] group-hover:text-amber-500/50 transition-colors absolute sm:static right-0 sm:right-auto opacity-0 sm:opacity-100">
              Classified Access
            </Typography>
          </div>

          <div className="space-y-4 flex flex-col items-center sm:items-start">
            <div>
              <Typography variant="label" className="text-slate-600 font-black tracking-widest block uppercase text-[10px] mb-1">
                {label}
              </Typography>
              <Typography variant="h2" className="text-white/20 text-3xl font-black italic uppercase tracking-tighter group-hover:text-white/30 transition-colors">
                Restricted
              </Typography>
            </div>

            <Typography variant="p" className="text-[11px] text-slate-500/80 font-medium leading-relaxed max-w-[200px]">
              {lockMessage || "Unlock advanced performance tracking and telemetry intel."}
            </Typography>
          </div>

          <div className="mt-auto pt-8">
            <button 
              onClick={onUnlock}
              className="px-4 py-2 rounded-lg bg-white/[0.03] border border-white/5 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all flex items-center gap-2"
            >
              <Typography variant="mono" className="text-[9px] text-slate-400 group-hover:text-white font-black uppercase tracking-widest">
                [ Unlock Matrix ]
              </Typography>
            </button>
          </div>
        </div>

        {/* Tactical Edge Light */}
        <div className="absolute top-0 left-0 w-[1px] h-0 group-hover:h-full bg-gradient-to-b from-transparent via-purple-500/50 to-transparent transition-all duration-700" />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-white/[0.04] to-transparent border-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden h-full">
      <div className="flex flex-col items-center sm:items-start text-center sm:text-left h-full">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center mb-6 border transition-transform group-hover:scale-110 shrink-0",
          colorMap[color as keyof typeof colorMap]
        )}>
          <Icon className="h-6 w-6" />
        </div>
        
        <div className="space-y-2 flex flex-col items-center sm:items-start w-full">
          <Typography variant="label" className="text-slate-500 font-black tracking-widest block uppercase text-[10px]">
            {label}
          </Typography>
          
          <Typography variant="h1" className="text-white text-4xl tracking-tighter sm:text-5xl">
            {loading ? '...' : value}
          </Typography>
          
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
        color === 'amber' ? 'text-amber-500' : 
        color === 'purple' ? 'text-purple-500' :
        color === 'orange' ? 'text-orange-500' : 'text-rose-500'
      )} />
    </Card>
  );
};
