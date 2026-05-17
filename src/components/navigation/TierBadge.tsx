import React from 'react';
import { SubscriptionTier } from '@/src/types';
import { cn } from '@/src/lib/utils';

/**
 * StripeItTierBadgeSystem
 * Reusable visual indicator for the user's subscription tier.
 */

interface TierBadgeProps {
  tier?: SubscriptionTier;
  isCollapsed?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, isCollapsed }) => {
  const getTierStyles = (tier?: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ORGANIZATION:
        return "bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-[0_0_8px_rgba(33,197,219,0.1)]";
      case SubscriptionTier.PRO:
        return "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]";
      default:
        return "bg-slate-500/10 border-white/10 text-slate-500";
    }
  };

  const label = tier === SubscriptionTier.ORGANIZATION ? 'Dealer' : (tier || 'Free');

  if (isCollapsed) {
    return (
      <div 
        className={cn(
          "w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-black uppercase transition-all shrink-0",
          getTierStyles(tier)
        )}
        title={label}
      >
        {label.charAt(0)}
      </div>
    );
  }

  return (
    <div className={cn(
      "px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-[0.15em] transition-all shrink-0",
      getTierStyles(tier)
    )}>
      {label}
    </div>
  );
};
