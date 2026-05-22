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
  subValue?: string;
  secondaryLabel?: string;
  secondaryValue?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'orange';
  loading?: boolean;
  isLocked?: boolean;
  onUnlock?: () => void;
  lockMessage?: string;
  variant?: 'hero' | 'telemetry' | 'hero-horizontal' | 'carousel';
  onClick?: () => void;
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
  subValue,
  secondaryLabel,
  secondaryValue,
  color = 'cyan',
  loading,
  isLocked,
  onUnlock,
  lockMessage,
  variant = 'hero',
  onClick
}) => {
  const isTelemetry = variant === 'telemetry';
  const isHorizontal = variant === 'hero-horizontal';
  const isCarousel = variant === 'carousel';

  if (isLocked) {
    return (
      <Card 
        onClick={onUnlock}
        className={cn(
          "bg-bg-card border-white/[0.03] hover:border-purple-500/30 transition-all group relative overflow-hidden flex flex-col justify-center",
          onUnlock && "cursor-pointer hover:shadow-purple-glow active:scale-[0.98]",
          isTelemetry ? "p-3 min-h-[75px]" : isHorizontal ? "p-3.5 min-h-[90px]" : "p-4 min-h-[140px]"
        )}
      >
        {/* Cinematic Locked Decor */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)] opacity-0 dark:opacity-70 dark:group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_3px] pointer-events-none opacity-20" />
        
        <div className="relative z-10 flex items-center justify-between gap-4 px-2">
          <div className="flex flex-col">
            <Typography variant="label" className={cn("text-slate-600 dark:text-slate-400 font-black tracking-[0.25em] block uppercase mb-0.5 opacity-80", isTelemetry ? "text-[6px]" : "text-[8px]")}>
              {label}
            </Typography>
            <Typography variant="h2" className={cn("text-text-primary/20 font-black italic uppercase tracking-tighter group-hover:text-text-primary/40 transition-colors", isTelemetry ? "text-lg" : "text-2xl")}>
              Restricted
            </Typography>
          </div>
          
          <div className={cn(
            "rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-purple-500 transition-colors shadow-inner",
            isTelemetry ? "h-7 w-7" : "h-9 w-9"
          )}>
            <Lock className={isTelemetry ? "h-3.5 w-3.5" : "h-4.5 w-4.5"} />
          </div>
        </div>

        {/* Tactial Accent */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
      </Card>
    );
  }

  if (isHorizontal) {
    return (
      <Card 
        onClick={onClick}
        className={cn(
          "bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden p-3.5 min-h-[95px]",
          onClick && "cursor-pointer hover:border-white/20 transition-all"
        )}
      >
        {/* Atmospheric Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-10" />
        
        <div className="flex items-center gap-4 h-full relative z-10">
          <div className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105 shrink-0 shadow-sm",
            colorMap[color as keyof typeof colorMap]
          )}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <Typography variant="label" className="text-slate-400 font-black tracking-widest block uppercase text-[7px] mb-1 opacity-90">
              {label}
            </Typography>
            
            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <Typography variant="h1" className="text-text-primary text-2xl sm:text-4xl tracking-tighter font-black italic leading-none shrink-0">
                  {loading ? '...' : value}
                </Typography>
                
                {subValue && !loading && (
                  <div className="flex flex-col items-end shrink-0 ml-auto leading-none gap-0.5">
                    <Typography variant="mono" className="text-[12px] text-brand-primary font-black italic tracking-tighter">
                      {subValue}<span className="text-[7px] ml-0.5 text-slate-400 font-bold uppercase not-italic">/mo</span>
                    </Typography>
                    <Typography variant="mono" className="text-[6px] text-slate-400 uppercase font-bold tracking-[0.1em]">Pacing</Typography>
                  </div>
                )}
              </div>

              {secondaryValue && !loading && (
                <div className="flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-500">
                  <Typography variant="mono" className="text-[10px] text-emerald-400 font-bold italic tracking-tighter">
                    +{secondaryValue}
                  </Typography>
                  <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
                    {secondaryLabel}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Visual Accent */}
        <div className={cn(
          "absolute inset-y-0 left-0 w-[2px] bg-current opacity-40",
          color === 'cyan' ? 'text-brand-primary' : 
          color === 'emerald' ? 'text-emerald-500' :
          color === 'amber' ? 'text-amber-500' : 
          color === 'purple' ? 'text-purple-500' :
          color === 'orange' ? 'text-orange-500' : 'text-rose-500'
        )} />
      </Card>
    );
  }

  if (isCarousel) {
    return (
      <Card className="bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden p-8 min-h-[190px] flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-10" />

        <div className="flex flex-col items-center text-center gap-4 relative z-10 w-full">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 shadow-sm",
            colorMap[color as keyof typeof colorMap]
          )}>
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <Typography variant="label" className="text-slate-500 font-black tracking-widest block uppercase text-[9px] opacity-80">
              {label}
            </Typography>
            <Typography variant="h1" className="text-text-primary text-4xl sm:text-5xl tracking-tighter font-black italic leading-none">
              {loading ? '...' : value}
            </Typography>
            {subValue && !loading && (
              <div className="flex items-center gap-1 mt-1">
                <Typography variant="mono" className="text-[13px] text-brand-primary font-black italic tracking-tighter">
                  {subValue}
                  <span className="text-[8px] ml-0.5 text-slate-500 font-bold uppercase not-italic">/mo</span>
                </Typography>
                <Typography variant="mono" className="text-[8px] text-slate-600 uppercase font-bold tracking-widest">
                  Pacing
                </Typography>
              </div>
            )}
            {secondaryValue && !loading && (
              <div className="flex items-center gap-1 mt-1">
                <Typography variant="mono" className="text-[11px] text-emerald-400 font-bold italic tracking-tighter">
                  +{secondaryValue}
                </Typography>
                <Typography variant="mono" className="text-[9px] text-slate-600 uppercase font-bold tracking-widest">
                  {secondaryLabel}
                </Typography>
              </div>
            )}
          </div>
        </div>

        <div className={cn(
          "absolute inset-y-0 left-0 w-[2px] bg-current opacity-40",
          color === 'cyan' ? 'text-brand-primary' :
          color === 'emerald' ? 'text-emerald-500' :
          color === 'amber' ? 'text-amber-500' :
          color === 'purple' ? 'text-purple-500' :
          color === 'orange' ? 'text-orange-500' :
          'text-rose-500'
        )} />
      </Card>
    );
  }

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "bg-gradient-to-br from-white/[0.04] to-transparent border-white/[0.05] hover:border-white/10 transition-all group relative overflow-hidden flex flex-col",
        isTelemetry ? "p-3 h-auto min-h-[85px]" : "p-4.5 h-full min-h-[140px]",
        onClick && "cursor-pointer hover:border-white/20 transition-all"
      )}
    >
      {/* Scanlines visual accent */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none opacity-20" />

      <div className="flex flex-col h-full relative z-10">
        <div className={cn(
          "rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105 shrink-0 shadow-sm",
          colorMap[color as keyof typeof colorMap],
          isTelemetry ? "h-7 w-7 mb-2" : "h-9 w-9 mb-4"
        )}>
          <Icon className={isTelemetry ? "h-3.5 w-3.5" : "h-5 w-5"} />
        </div>
        
        <div className={cn("flex flex-col w-full", isTelemetry ? "space-y-0" : "space-y-0.5")}>
          <Typography variant="label" className={cn("text-slate-400 font-black tracking-widest block uppercase shrink-0 opacity-90", isTelemetry ? "text-[6.5px]" : "text-[7.5px]")}>
            {label}
          </Typography>
          
          <Typography variant="h1" className={cn("text-text-primary tracking-tighter font-black italic leading-none", isTelemetry ? "text-2xl" : "text-2xl sm:text-3xl lg:text-4xl")}>
            {loading ? '...' : value}
          </Typography>

          {secondaryValue && !loading && (
            <div className={cn("flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-500", isTelemetry ? "pb-1" : "")}>
              <Typography variant="mono" className={cn("text-emerald-400 font-bold italic tracking-tighter", isTelemetry ? "text-[11px]" : "text-[14px]")}>
                +{secondaryValue}
              </Typography>
              <Typography variant="mono" className={cn("text-slate-500 uppercase font-bold tracking-widest", isTelemetry ? "text-[7px]" : "text-[9px]")}>
                {secondaryLabel}
              </Typography>
            </div>
          )}

          {subValue && !loading && !isTelemetry && (
            <div className="flex items-center gap-1.5 mt-2 animate-in fade-in slide-in-from-left-2 duration-700">
               <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.1em]">Pace:</Typography>
               <Typography variant="mono" className="text-[13px] text-brand-primary font-black italic tracking-tighter">{subValue}<span className="text-[8px] ml-0.5 text-slate-400 font-bold uppercase not-italic">/mo</span></Typography>
            </div>
          )}
          
          {subtext && !isTelemetry && (
            <Typography variant="mono" className="text-[9px] text-slate-500 font-bold block mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
