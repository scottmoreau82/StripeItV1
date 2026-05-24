import { SubscriptionTier } from '../types';

/**
 * StripeItPlanLimitSystem
 * Centralized logic for plan-based numerical limits.
 */

export enum LimitType {
  DEAL_STORAGE = 'deal_storage',
  NOTE_COUNT = 'note_count',
}

export const planLimitService = {
  /**
   * Get the limit value for a specific type and tier
   */
  getLimit: (tier: SubscriptionTier, type: LimitType): number => {
    switch (type) {
      case LimitType.DEAL_STORAGE:
        switch (tier) {
          case SubscriptionTier.FREE: return 8;
          case SubscriptionTier.TRIAL: return 500;
          case SubscriptionTier.PRO: return 500;
          case SubscriptionTier.ORGANIZATION: return Infinity;
          default: return 5;
        }
      case LimitType.NOTE_COUNT:
        switch (tier) {
          case SubscriptionTier.FREE: return 5;
          case SubscriptionTier.TRIAL: return 100;
          case SubscriptionTier.PRO: return 100;
          case SubscriptionTier.ORGANIZATION: return Infinity;
          default: return 0;
        }
      default:
        return 0;
    }
  },

  /**
   * Check if a limit has been reached
   */
  isLimitReached: (tier: SubscriptionTier, type: LimitType, currentCount: number): boolean => {
    const limit = planLimitService.getLimit(tier, type);
    return currentCount >= limit;
  }
};

export const getCurrentMonthDealCount = (deals: { date: string }[]): number => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return deals.filter(d => {
    const dt = new Date(d.date);
    return dt.getMonth() + 1 === month && dt.getFullYear() === year;
  }).length;
};
