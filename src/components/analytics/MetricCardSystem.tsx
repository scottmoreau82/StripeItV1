import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { LucideIcon, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { AmbientEffect } from '@/src/types';

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
  /** Optional monthly-goal context (shown on hero/carousel cards only). */
  goalTarget?: string;       // formatted, e.g. "$6,000" or "12"
  goalToGo?: string;         // formatted remaining, e.g. "$5,091" or "8 units"
  goalPercent?: number;      // 0-100+
  goalOnTrack?: boolean;     // honest pace-based status
}

const colorMap = {
  cyan: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  rose: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
};

const useCountUp = (value: string | number) => {
  const str = String(value);
  const prefix = str.startsWith('$') ? '$' : '';
  const suffix = str.endsWith('%') ? '%' : '';
  const raw = parseFloat(str.replace(/[$,%]/g, '').replace(/,/g, '')) || 0;
  const isDecimal = str.includes('.') && !str.endsWith('.0');
  const decimals = isDecimal ? (str.split('.')[1]?.length || 1) : 0;

  const [display, setDisplay] = useState(str);
  const prevRef = useRef(raw);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = raw;
    if (from === to) return;

    const duration = 800;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplay(`${prefix}${decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()}${suffix}`);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(str);
        prevRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    prevRef.current = to;

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [raw]);

  return display;
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
  onClick,
  goalTarget,
  goalToGo,
  goalPercent,
  goalOnTrack
}) => {
  const isTelemetry = variant === 'telemetry';
  const isHorizontal = variant === 'hero-horizontal';
  const isCarousel = variant === 'carousel';
  const animatedValue = useCountUp(loading ? 0 : value);

  const { profile } = useAuth();
  const { isMobile } = useResponsive();
  const activeEffects = profile?.preferences?.ambientEffects || [];
  // Scanline (constant animation) and spotlight (pointer-follow, meaningless on touch)
  // are disabled on mobile to keep cards smooth.
  const hasScanline = !isMobile && activeEffects.includes(AmbientEffect.SCANLINE);
  const hasSpotlight = !isMobile && activeEffects.includes(AmbientEffect.SPOTLIGHT);
  const [spotPos, setSpotPos] = useState<{x: number; y: number} | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Randomize scanline per card using label as seed
  const scanlineProps = useMemo(() => {
    const seed = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return {
      duration: 2.5 + (seed % 5) * 0.5,
      opacity: 0.04 + (seed % 4) * 0.015,
    };
  }, [label]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasSpotlight || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpotPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [hasSpotlight]);
  const handleMouseLeave = useCallback(() => setSpotPos(null), []);

  if (isLocked) {
    return (
      <Card 
        onClick={onUnlock}
        className={cn(
          "bg-bg-card border-border-subtle hover:border-purple-500/30 transition-all group relative overflow-hidden flex flex-col justify-center",
          onUnlock && "cursor-pointer hover:shadow-purple-glow active:scale-[0.98]",
          isTelemetry ? "p-3 min-h-[75px]" : isHorizontal ? "p-3.5 min-h-[90px]" : "p-4 min-h-[140px]"
        )}
      >
        {/* Cinematic Locked Decor */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.08)_0%,transparent_70%)] opacity-0 group-hover:opacity-70 transition-opacity [html[data-theme='light']_&]:hidden" />
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
            "rounded-full bg-bg-card border border-white/5 flex items-center justify-center text-slate-600 group-hover:text-purple-500 transition-colors shadow-inner",
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
      <div 
        onClick={onClick}
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "rounded-2xl border bg-bg-card shadow-deal relative overflow-hidden",
          "bg-gradient-to-br from-white/[0.03] to-transparent transition-all group p-3.5 min-h-[95px]",
          color === 'cyan' ? 'border-brand-primary/20 hover:border-brand-primary/40' :
          color === 'emerald' ? 'border-emerald-500/20 hover:border-emerald-500/40' :
          color === 'amber' ? 'border-amber-500/20 hover:border-amber-500/40' :
          color === 'purple' ? 'border-purple-500/20 hover:border-purple-500/40' :
          color === 'orange' ? 'border-orange-500/20 hover:border-orange-500/40' :
          'border-rose-500/20 hover:border-rose-500/40',
          onClick && "cursor-pointer"
        )}
      >
        {/* Atmospheric Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-10" />
        
        {hasSpotlight && spotPos && (
          <div className="absolute inset-0 pointer-events-none z-20" style={{ background: `radial-gradient(160px circle at ${spotPos.x}px ${spotPos.y}px, color-mix(in srgb, var(--color-brand-primary) 10%, transparent), transparent 70%)` }} />
        )}
        {hasScanline && (
          <motion.div
            animate={{ top: ['-15%', '115%'] }}
            transition={{ duration: scanlineProps.duration, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-x-0 h-12 pointer-events-none z-20"
            style={{ background: `linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-brand-primary) ${Math.round(scanlineProps.opacity * 100)}%, transparent), transparent)` }}
          />
        )}

        <div className="flex items-center gap-3 h-full relative z-10 pl-4">
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105 shrink-0 shadow-sm",
            colorMap[color as keyof typeof colorMap]
          )}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <Typography variant="label" className="text-text-muted font-black tracking-widest block uppercase text-[7px] mb-1 opacity-90">
              {label}
            </Typography>
            
            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <div className="font-display text-text-primary text-2xl sm:text-4xl tracking-tighter font-black italic leading-[1.3] pb-1 pr-2 min-w-0">
                  {loading ? '...' : animatedValue}
                </div>
                
                {subValue && !loading && (
                  <div className="flex flex-col items-end shrink-0 ml-auto leading-none gap-0.5">
                    <Typography variant="mono" className="text-[12px] text-brand-primary font-black italic tracking-tighter">
                      {subValue}<span className="text-[7px] ml-0.5 text-text-muted font-bold uppercase not-italic">/mo</span>
                    </Typography>
                    <Typography variant="mono" className="text-[6px] text-text-muted uppercase font-bold tracking-[0.1em]">Pacing</Typography>
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

              {goalTarget && !loading && (
                <div className="flex items-center gap-2 mt-1.5 animate-in fade-in duration-500">
                  <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[6.5px] font-black uppercase tracking-widest border shrink-0", goalOnTrack ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-amber-400 border-amber-400/30 bg-amber-400/10")}>
                    {goalOnTrack ? 'On Track' : 'Behind'}
                  </span>
                  <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-bold tracking-widest truncate">
                    Goal {goalTarget}
                    {typeof goalPercent === 'number' && <span className={cn("ml-1.5 not-italic", goalOnTrack ? "text-emerald-400" : "text-amber-400")}>{Math.round(goalPercent)}%</span>}
                  </Typography>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Visual Accent */}
        <div className={cn(
          "absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-current opacity-60",
          color === 'cyan' ? 'text-brand-primary' :
          color === 'emerald' ? 'text-emerald-500' :
          color === 'amber' ? 'text-amber-500' :
          color === 'purple' ? 'text-purple-500' :
          color === 'orange' ? 'text-orange-500' : 'text-rose-500'
        )} />
      </div>
    );
  }

  if (isCarousel) {
    return (
      <Card className="bg-gradient-to-br from-white/[0.03] to-transparent border-white/[0.05] hover:border-white/10 transition-all group relative p-8 min-h-[220px] flex items-center justify-center">
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
            <div className="font-display text-text-primary text-4xl sm:text-5xl tracking-tighter font-black italic leading-[1.3] pb-1.5 pl-2 pr-4 w-full text-center break-all">
              {loading ? '...' : animatedValue}
            </div>
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
    <div 
      onClick={onClick}
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "rounded-2xl border border-border-card bg-bg-card shadow-deal relative overflow-hidden",
        "bg-gradient-to-br from-white/[0.04] to-transparent border-border-subtle hover:border-white/20 transition-all group flex flex-col items-center justify-center text-center",
        isTelemetry ? "p-3 h-auto min-h-[85px]" : "p-4 lg:p-4.5 h-full min-h-[110px] lg:min-h-[140px]",
        onClick && "cursor-pointer hover:border-white/20 transition-all"
      )}
    >
      {/* Scanlines visual accent */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_8px] pointer-events-none opacity-20" />

      {hasSpotlight && spotPos && (
        <div className="absolute inset-0 pointer-events-none z-20" style={{ background: `radial-gradient(160px circle at ${spotPos.x}px ${spotPos.y}px, color-mix(in srgb, var(--color-brand-primary) 10%, transparent), transparent 70%)` }} />
      )}
      {hasScanline && (
        <motion.div
          animate={{ top: ['-15%', '115%'] }}
          transition={{ duration: scanlineProps.duration, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-12 pointer-events-none z-20"
          style={{ background: `linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-brand-primary) ${Math.round(scanlineProps.opacity * 100)}%, transparent), transparent)` }}
        />
      )}

      <div className="flex flex-col h-full relative z-10">
        <div className={cn(
          "rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105 shrink-0 shadow-sm",
          colorMap[color as keyof typeof colorMap],
          isTelemetry ? "h-7 w-7 mb-2" : "h-8 w-8 lg:h-9 lg:w-9 mb-2 lg:mb-4 mx-auto"
        )}>
          <Icon className={isTelemetry ? "h-3.5 w-3.5" : "h-5 w-5"} />
        </div>
        
        <div className={cn("flex flex-col w-full items-center", isTelemetry ? "space-y-0" : "space-y-0.5")}>
          <Typography variant="label" className={cn("text-text-muted font-black tracking-widest block uppercase shrink-0 opacity-90", isTelemetry ? "text-[6.5px]" : "text-[7.5px]")}>
            {label}
          </Typography>
          
          <div className={cn("font-display text-text-primary tracking-tighter font-black italic leading-[1.3] pb-1.5 pr-3 w-full text-center", isTelemetry ? "text-2xl" : "text-3xl lg:text-4xl")}>
            {loading ? '...' : animatedValue}
          </div>

          {goalTarget && !loading && !isTelemetry && (
            <div className="w-full mt-2 space-y-1.5 animate-in fade-in slide-in-from-bottom-1 duration-500">
              <div className="flex items-center justify-between gap-2">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-[0.1em]">
                  Goal: {goalTarget}
                </Typography>
                {typeof goalPercent === 'number' && (
                  <Typography variant="mono" className={cn("text-[11px] font-black italic tracking-tighter", goalOnTrack ? "text-emerald-400" : "text-amber-400")}>
                    {Math.round(goalPercent)}%
                  </Typography>
                )}
              </div>
              <div className="h-1 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", goalOnTrack ? "bg-emerald-400" : "bg-amber-400")}
                  style={{ width: `${Math.min(100, Math.max(0, goalPercent || 0))}%` }}
                />
              </div>
              {goalToGo && (
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border", goalOnTrack ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" : "text-amber-400 border-amber-400/30 bg-amber-400/10")}>
                    {goalOnTrack ? 'On Track' : 'Behind'}
                  </span>
                  <Typography variant="mono" className="text-[9px] text-slate-500 font-bold tracking-wide">
                    {goalToGo} to go
                  </Typography>
                </div>
              )}
            </div>
          )}

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
            <div className="flex items-center gap-1.5 mt-1 lg:mt-2 animate-in fade-in slide-in-from-left-2 duration-700">
               <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.1em]">Pace:</Typography>
               <Typography variant="mono" className="text-[13px] text-brand-primary font-black italic tracking-tighter">{subValue}<span className="text-[8px] ml-0.5 text-text-muted font-bold uppercase not-italic">/mo</span></Typography>
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
    </div>
  );
};
