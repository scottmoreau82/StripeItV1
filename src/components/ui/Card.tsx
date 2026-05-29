import React from 'react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { AmbientEffect } from '@/src/types';

/**
 * StripeItCardSystem
 * Layout containers with consistent shadows, radii, and padding.
 */
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  onClick,
  hoverable = false 
}) => {
  const { profile } = useAuth();
  const hasGlass = profile?.preferences?.ambientEffects?.includes(AmbientEffect.GLASSMORPHISM) ?? false;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-border-card bg-bg-card p-6 shadow-deal overflow-hidden",
        hasGlass && "!bg-white/[0.04] !backdrop-blur-xl !border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        hoverable && "transition-all hover:translate-y-[-2px] hover:bg-bg-elevated hover:border-border-card hover:shadow-cyan-glow cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("mb-4 flex items-center justify-between", className)}>{children}</div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("", className)}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn("mt-6 flex items-center gap-4", className)}>{children}</div>
);
