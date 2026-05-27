import React from 'react';
import { Deal, PayPlan } from '@/src/types';
import { DealSummaryCard } from './DealSummaryCard';
import { Typography } from '../ui/Typography';
import { AppIcon } from '../ui/AppIcon';
import { motion } from 'motion/react';
import { EmptyState } from '../ui/EmptyState';
import { Card } from '../ui/Card';
import { cn } from '@/src/lib/utils';

/**
 * StripeItRecentDealsSystem
 * A scrollable, privacy-focused list of recent deals.
 */

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
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
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
      <div className="flex items-center justify-between mb-4">
        <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-500">
          Last {deals.length} Actions
        </Typography>
        <button className="p-2 -mr-2 text-slate-500 hover:text-white transition-colors">
          <AppIcon name="search" className="h-4 w-4" />
        </button>
      </div>

      <Card className="bg-bg-card border-border-subtle overflow-hidden p-0">
        {deals.map((deal, index) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(index < deals.length - 1 ? "border-b border-border-subtle" : "")}
          >
            <DealSummaryCard 
              deal={deal} 
              payPlan={payPlan} 
              onClick={() => onDealClick?.(deal)}
            />
          </motion.div>
        ))}
      </Card>
    </div>
  );
};
