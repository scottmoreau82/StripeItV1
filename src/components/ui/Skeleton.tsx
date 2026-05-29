import React from 'react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
  },
  transition: {
    duration: 1.8,
    repeat: Infinity,
    ease: 'linear',
  },
};

interface SkeletonProps {
  className?: string;
}

// Base shimmer block
export const Skeleton = ({ className }: SkeletonProps) => (
  <motion.div
    animate={shimmer.animate}
    transition={shimmer.transition}
    className={cn(
      'rounded-lg',
      className
    )}
    style={{
      background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
      backgroundSize: '400% 100%',
    }}
  />
);

// Sales Log desktop table row skeleton
export const DealRowSkeleton = () => (
  <tr className="border-b border-white/[0.02]">
    <td className="py-5 px-4"><Skeleton className="h-3 w-16" /></td>
    <td className="py-5 px-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2 w-16" />
      </div>
    </td>
    <td className="py-5 px-4">
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-2 w-20" />
      </div>
    </td>
    <td className="py-5 px-4"><Skeleton className="h-4 w-10 rounded" /></td>
    <td className="py-5 px-4 text-right"><Skeleton className="h-3 w-16 ml-auto" /></td>
    <td className="py-5 px-4 text-right"><Skeleton className="h-3 w-16 ml-auto" /></td>
    <td className="py-5 px-4 text-right"><Skeleton className="h-3 w-20 ml-auto" /></td>
    <td className="py-5 px-4">
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </td>
  </tr>
);

// Sales Log mobile card skeleton
export const DealCardSkeleton = () => (
  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
      <div className="space-y-1.5 items-end flex flex-col">
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  </div>
);

// Dashboard metric card skeleton
export const MetricCardSkeleton = () => (
  <div className="rounded-2xl bg-bg-card/40 border border-white/5 p-6 space-y-4 min-h-[160px]">
    <div className="flex items-center justify-between">
      <Skeleton className="h-2 w-20" />
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
    <Skeleton className="h-10 w-32 mt-2" />
    <Skeleton className="h-2 w-24" />
  </div>
);
