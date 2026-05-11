import React from 'react';
import { cn } from '@/src/lib/utils';

/**
 * StripeItTypographySystem
 * Standardized typography for consistent design language.
 */
interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small' | 'mono' | 'label';
  className?: string;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  variant = 'p', 
  className 
}) => {
  const baseStyles = "text-slate-200";
  
  const variants = {
    h1: "font-display text-4xl font-black tracking-tighter md:text-6xl text-white uppercase leading-[0.9]",
    h2: "font-display text-2xl font-bold tracking-tight md:text-3xl text-white",
    h3: "font-display text-xl font-bold md:text-2xl text-white",
    h4: "font-display text-lg font-bold md:text-xl text-white/90",
    p: "text-base leading-relaxed text-slate-500",
    small: "text-xs font-semibold leading-none text-slate-500 uppercase tracking-wider",
    mono: "font-mono text-[10px] text-brand-primary uppercase tracking-[0.2em] font-bold",
    label: "text-[11px] font-black leading-none text-slate-400 uppercase tracking-[0.15em]"
  };

  const Tag = (variant.startsWith('h') ? variant : 'p') as any;
  if (variant === 'label') return <span className={cn(baseStyles, variants[variant], className)}>{children}</span>;
  if (variant === 'mono' || variant === 'small') return <span className={cn(baseStyles, variants[variant], className)}>{children}</span>;

  return (
    <Tag className={cn(baseStyles, variants[variant as keyof typeof variants], className)}>
      {children}
    </Tag>
  );
};
