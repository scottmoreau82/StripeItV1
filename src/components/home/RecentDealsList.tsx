import React from 'react';
import { Deal, PayPlan, AmbientEffect } from '@/src/types';
import { DealSummaryCard } from './DealSummaryCard';
import { motion } from 'motion/react';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';
import { cn } from '@/src/lib/utils';
import { DealCardSkeleton } from '../ui/Skeleton';
import { useAuth } from '@/src/contexts/AuthContext';
import { AppIcon } from '../ui/AppIcon';
import { Typography } from '../ui/Typography';

interface RecentDealsListProps {
  deals: Deal[];
  payPlan?: PayPlan | null;
  onDealClick?: (deal: Deal) => void;
  isLoading?: boolean;
}

export const RecentDealsList: React.FC<RecentDealsListProps> = ({
  deals,
  payPlan,
  onDealClick,
  isLoading
}) => {
  const { profile } = useAuth();
  const hasGlass = profile?.preferences?.ambientEffects?.includes(AmbientEffect.GLASSMORPHISM) ?? false;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (deals.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="No deals found"
        description="Start logging deals to see your performance and activity history here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className={cn(
        "rounded-2xl overflow-hidden",
        hasGlass
          ? "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]"
          : "bg-transparent"
      )}>
        {deals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              index < deals.length - 1 && "border-b",
              hasGlass ? "border-white/[0.06]" : "border-white/[0.03]"
            )}
          >
            <DealSummaryCard
              deal={deal}
              payPlan={payPlan}
              onClick={() => onDealClick?.(deal)}
              noCard={hasGlass}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};
