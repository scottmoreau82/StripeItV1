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
  trialEndsAt?: number;
}

export const TierBadge: React.FC<TierBadgeProps> = ({ tier, isCollapsed, trialEndsAt }) => {
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

  const isActiveTrial = trialEndsAt && Date.now() < trialEndsAt;
  const daysRemaining = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  const label = tier === SubscriptionTier.ORGANIZATION ? 'Dealer' : (tier || 'Free');

  if (isCollapsed) {
    return (
      <div 
        className={cn(
          "w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-black uppercase transition-all shrink-0",
          isActiveTrial && tier === SubscriptionTier.FREE
            ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
            : getTierStyles(tier)
        )}
        title={isActiveTrial && tier === SubscriptionTier.FREE ? `Trial — ${daysRemaining} days remaining` : label}
      >
        {isActiveTrial && tier === SubscriptionTier.FREE ? 'T' : label.charAt(0)}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <div className={cn(
        "px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-[0.15em] transition-all",
        getTierStyles(tier)
      )}>
        {label}
      </div>
      {isActiveTrial && tier === SubscriptionTier.FREE && (
        <div className="px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-[0.15em] bg-amber-500/10 border-amber-500/30 text-amber-500">
          Trial • {daysRemaining}d
        </div>
      )}
    </div>
  );
};
