import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { BUTTON_SHAPES } from '@/src/constants';
import { useTheme } from '@/src/contexts/ThemeContext';
import { isProTheme } from '@/src/contexts/ThemeContext';
import { ButtonEffect } from '@/src/types';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

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
  onClick,
  ...props
}) => {
  const { profile } = useAuth();
  const { theme } = useTheme();
  const shapePreference = profile?.preferences?.buttonShape || 'standard';
  
  const buttonEffect = profile?.preferences?.buttonEffect || ButtonEffect.NONE;
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isGlowPulsing, setIsGlowPulsing] = useState(false);
  const [isBorderFlashing, setIsBorderFlashing] = useState(false);
  const [isScaleColor, setIsScaleColor] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (props.disabled || isLoading) return;
    onClick?.(e);
    switch (buttonEffect) {
      case ButtonEffect.RIPPLE: {
        const btn = buttonRef.current;
        if (!btn) break;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const id = Date.now();
        setRipples(prev => [...prev, { id, x, y, size }]);
        setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
        break;
      }
      case ButtonEffect.GLOW_PULSE:
        setIsGlowPulsing(true);
        setTimeout(() => setIsGlowPulsing(false), 400);
        break;
      case ButtonEffect.BORDER_FLASH:
        setIsBorderFlashing(true);
        setTimeout(() => setIsBorderFlashing(false), 350);
        break;
      case ButtonEffect.SCALE_COLOR:
        setIsScaleColor(true);
        setTimeout(() => setIsScaleColor(false), 300);
        break;
    }
  }, [props.disabled, isLoading, onClick, buttonEffect]);

  // Eligible for custom geometry: Major CTAs, actions, and primary buttons
  // Excludes ghost, icon-only, and small utility buttons (secondary)
  const isEligible = size !== 'icon' && (variant === 'primary' || variant === 'danger' || variant === 'outline');
  const shapeClass = isEligible ? BUTTON_SHAPES[shapePreference] : BUTTON_SHAPES.standard;

  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer relative overflow-hidden";
  
  const variants = {
    primary: isProTheme(theme)
      ? "border border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10 shadow-glow glow-primary font-black uppercase tracking-widest"
      : "bg-brand-primary text-bg-deep hover:bg-brand-primary/90 shadow-glow glow-primary font-black uppercase tracking-widest",
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
      ref={buttonRef}
      whileTap={(!props.disabled && !isLoading) ? { scale: buttonEffect === ButtonEffect.SCALE_COLOR ? 0.94 : 0.97 } : undefined}
      whileHover={(!props.disabled && !isLoading) ? { y: -1 } : undefined}
      animate={{
        boxShadow: isGlowPulsing ? '0 0 35px 8px var(--color-brand-primary)' : undefined,
        backgroundColor: isScaleColor ? 'var(--color-brand-secondary)' : undefined,
        borderColor: isBorderFlashing ? 'var(--color-brand-primary)' : undefined,
      }}
      transition={{ duration: 0.2 }}
      className={cn(baseStyles, variants[variant], sizes[size], className, shapeClass)}
      disabled={props.disabled || isLoading}
      {...props as any}
      onClick={handleClick}
    >
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.35)',
              pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>
      {isLoading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </motion.button>
  );
};
