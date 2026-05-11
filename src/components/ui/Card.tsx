import React from 'react';
import { cn } from '@/src/lib/utils';

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
  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-white/[0.05] bg-bg-card p-6 shadow-deal overflow-hidden",
        hoverable && "transition-all hover:translate-y-[-2px] hover:bg-bg-elevated hover:border-white/10 hover:shadow-cyan-glow cursor-pointer",
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
