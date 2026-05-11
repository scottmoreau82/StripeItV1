import React from 'react';
import { cn } from '@/src/lib/utils';

/**
 * StripeItResponsiveGridSystem
 * Scalable grid utilities for dashboard and analytics views.
 */
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 4 | 6 | 8 | 10;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = 3,
  gap = 6,
}) => {
  const colMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  const gapMap = {
    4: 'gap-4',
    6: 'gap-6',
    8: 'gap-8',
    10: 'gap-10',
  };

  return (
    <div className={cn('grid', colMap[cols], gapMap[gap], className)}>
      {children}
    </div>
  );
};

/**
 * StripeItContentContainerSystem
 * Max-width containers for consistent content alignment.
 */
export const ContentContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <div className={cn("mx-auto w-full max-w-7xl", className)}>
    {children}
  </div>
);
