import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '../ui/Typography';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { AmbientEffect } from '@/src/types';

/**
 * PageHeader
 * Standardized header component for all StripeIt pages, adhering to the 
 * bold, high-contrast typography system of the Dealer shell.
 */

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = "bg-brand-primary",
  children,
  className
}) => {
  const { profile } = useAuth();
  const activeEffects = profile?.preferences?.ambientEffects || [];
  const hasScramble = activeEffects.includes(AmbientEffect.TEXT_SCRAMBLE);
  const hasTypewriter = activeEffects.includes(AmbientEffect.TYPEWRITER);
  const titleStr = typeof title === 'string' ? title : '';
  const [displayTitle, setDisplayTitle] = useState(titleStr);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  useEffect(() => {
    if (!titleStr) return;
    if (animRef.current) clearInterval(animRef.current);

    if (hasTypewriter) {
      setDisplayTitle('');
      let i = 0;
      animRef.current = setInterval(() => {
        i++;
        setDisplayTitle(titleStr.slice(0, i));
        if (i >= titleStr.length) clearInterval(animRef.current!);
      }, 55);
    } else if (hasScramble) {
      let iteration = 0;
      animRef.current = setInterval(() => {
        setDisplayTitle(
          titleStr.split('').map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx < iteration) return titleStr[idx];
            return chars[Math.floor(Math.random() * chars.length)];
          }).join('')
        );
        iteration += 0.6;
        if (iteration >= titleStr.length) {
          clearInterval(animRef.current!);
          setDisplayTitle(titleStr);
        }
      }, 35);
    } else {
      setDisplayTitle(titleStr);
    }

    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [titleStr, hasScramble, hasTypewriter]);

  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6", className)}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-[1.25rem] flex items-center justify-center shadow-glow shadow-brand-primary/10",
          iconColor === "bg-brand-primary" ? "bg-brand-primary glow-primary" : iconColor
        )}>
          <Icon className={cn("h-6 w-6", iconColor === "bg-brand-primary" ? "text-bg-deep" : "text-white")} />
        </div>
        <div className="space-y-0.5">
          <Typography variant="h2" className="text-text-primary italic font-black uppercase tracking-tighter text-xl md:text-2xl leading-none">
            {(hasScramble || hasTypewriter) ? displayTitle : title}
          </Typography>
          <Typography variant="mono" className="text-[9px] text-text-muted uppercase font-black tracking-[0.2em] block">
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
