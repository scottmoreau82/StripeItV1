import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { BUTTON_SHAPES } from '@/src/constants';

/**
 * StripeItButtonSystem
 * Reusable high-performance button system with built-in interactions.
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  ...props
}) => {
  const { profile } = useAuth();
  const shapePreference = profile?.preferences?.buttonShape || 'standard';
  
  // Eligible for custom geometry: Major CTAs, actions, and primary buttons
  // Excludes ghost, icon-only, and small utility buttons (secondary)
  const isEligible = size !== 'icon' && (variant === 'primary' || variant === 'danger' || variant === 'outline');
  const shapeClass = isEligible ? BUTTON_SHAPES[shapePreference] : BUTTON_SHAPES.standard;

  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
  
  const variants = {
    primary: "bg-brand-primary text-bg-deep hover:bg-brand-primary/90 shadow-glow glow-primary font-black uppercase tracking-widest",
    secondary: "bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 hover:bg-brand-secondary/20 font-bold uppercase tracking-wider text-[10px]",
    outline: "border border-white/10 bg-transparent hover:bg-white/5 text-slate-300",
    ghost: "text-slate-500 hover:bg-white/5 hover:text-white transition-colors",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20"
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6",
    lg: "h-14 px-8 text-lg",
    icon: "h-10 w-10 rounded-xl" // Icons always keep standard rounding
  };

  return (
    <motion.button
      whileTap={(!props.disabled && !isLoading) ? { scale: 0.97 } : undefined}
      whileHover={(!props.disabled && !isLoading) ? { y: -1 } : undefined}
      className={cn(baseStyles, variants[variant], sizes[size], className, shapeClass)}
      disabled={props.disabled || isLoading}
      {...props as any}
    >
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  );
};
