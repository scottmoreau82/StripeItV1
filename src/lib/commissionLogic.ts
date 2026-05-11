import { Deal, PayPlan, PayPlanRule, PayPlanTier } from '../types';

/**
 * StripeItBasicCommissionSystem & StripeItCommissionEstimateSystem
 * Logic for estimating salesperson commission based on deal data and pay plans.
 */

export interface CommissionResult {
  dealId: string;
  frontEndCommission: number;
  backEndCommission: number;
  flatCommission: number;
  ruleBonuses: number;
  totalBeforeSplit: number;
  finalPayout: number;
  isMini: boolean;
  appliedRules: string[];
}

export interface PeriodEarnings {
  totalPayout: number;
  dealResults: CommissionResult[];
  tierBonuses: { tierId: string; amount: number }[];
  totalTierBonuses: number;
  grandTotal: number;
}

/**
 * StripeItFormulaEngineSystem - Evaluate individual deal rules
 */
const evaluateRules = (deal: Deal, rules: PayPlanRule[]): { bonus: number; applied: string[] } => {
  let bonus = 0;
  const applied: string[] = [];

  for (const rule of rules) {
    let valueToTest = 0;
    if (rule.condition === 'front_end_gross') valueToTest = deal.frontEndGross;
    if (rule.condition === 'back_end_gross') valueToTest = deal.backEndGross;
    if (rule.condition === 'total_gross') valueToTest = deal.frontEndGross + deal.backEndGross;

    const isMatch = rule.operator === 'gt' ? valueToTest > rule.threshold : valueToTest >= rule.threshold;

    if (isMatch) {
      if (rule.rewardType === 'fixed_bonus') {
        bonus += rule.rewardValue;
      } else if (rule.rewardType === 'percentage_increase') {
        // This would traditionally be applied to the calculated commission, but 
        // usually rules are fixed dollar bumps for hitting gross targets.
        // We'll treat it as a % of the total gross for this rule's simple implementation.
        bonus += (valueToTest * (rule.rewardValue / 100));
      }
      applied.push(rule.name);
    }
  }

  return { bonus, applied };
};

/**
 * StripeItCommissionEstimateSystem - Core individual deal calculator
 */
export const estimateCommission = (deal: Deal, plan: PayPlan): CommissionResult => {
  // 1. Calculate raw percentages
  const frontComm = deal.frontEndGross * (plan.frontEndPercentage / 100);
  const backComm = deal.backEndGross * (plan.backEndPercentage / 100);
  const flatComm = plan.flatPerUnitAmount || 0;

  // 2. Evaluate Advanced Rules
  const { bonus: ruleBonuses, applied: appliedRules } = plan.isAdvanced && plan.rules 
    ? evaluateRules(deal, plan.rules) 
    : { bonus: 0, applied: [] };

  let totalComm = frontComm + backComm + flatComm + ruleBonuses;
  let isMini = false;

  // 3. Resolve "Mini" (Minimum commission per deal)
  if (totalComm < plan.miniAmount) {
    totalComm = plan.miniAmount;
    isMini = true;
  }

  const totalBeforeSplit = totalComm;
  let finalPayout = totalComm;

  // 4. Handle Split Deals
  if (deal.isSplitDeal) {
    const splitPercent = deal.splitPercentage || 50;
    
    if (plan.splitDealBehavior === 'half_mini' && isMini) {
      finalPayout = plan.miniAmount / 2;
    } else {
      finalPayout = totalComm * (splitPercent / 100);
    }
  }

  return {
    dealId: deal.id,
    frontEndCommission: frontComm,
    backEndCommission: backComm,
    flatCommission: flatComm,
    ruleBonuses,
    totalBeforeSplit,
    finalPayout,
    isMini,
    appliedRules
  };
};

/**
 * StripeItTierBonusSystem & StripeItRetroactiveBonusSystem
 * Calculate total period earnings including volume-based tier bonuses.
 */
export const calculatePeriodEarnings = (deals: Deal[], plan: PayPlan): PeriodEarnings => {
  const dealResults = deals.map(deal => estimateCommission(deal, plan));
  const totalDealPayout = dealResults.reduce((sum, r) => sum + r.finalPayout, 0);
  
  const tierBonuses: { tierId: string; amount: number }[] = [];
  let totalTierBonuses = 0;

  if (plan.isAdvanced && plan.tiers && plan.tiers.length > 0) {
    const unitCount = deals.length;
    // Sort tiers by threshold descending to find the highest achieved
    const sortedTiers = [...plan.tiers].sort((a, b) => b.threshold - a.threshold);
    
    // Most dealership pay plans are "Highest achieved".
    // We find the single highest tier the salesperson qualified for.
    const highestTier = sortedTiers.find(tier => unitCount >= tier.threshold);

    if (highestTier) {
      // 1. Calculate Lump Sum Bonus
      let tierAmount = highestTier.bonusAmount;

      // 2. Calculate Per-Unit Bonus (Retroactive or Fixed)
      if (highestTier.perUnitBonus > 0) {
        if (highestTier.isRetroactive) {
          // Applies to all units sold in the period
          tierAmount += highestTier.perUnitBonus * unitCount;
        } else {
          // Only applies to units above the threshold
          const unitsAboveThreshold = Math.max(0, unitCount - highestTier.threshold + 1);
          tierAmount += highestTier.perUnitBonus * unitsAboveThreshold;
        }
      }

      tierBonuses.push({ tierId: highestTier.id, amount: tierAmount });
      totalTierBonuses = tierAmount;
    }
  }

  return {
    totalPayout: totalDealPayout,
    dealResults,
    tierBonuses,
    totalTierBonuses,
    grandTotal: totalDealPayout + totalTierBonuses
  };
};

/**
 * Legacy support / convenience helper
 */
export const calculateTotalEarnings = (deals: Deal[], plan: PayPlan) => {
  return calculatePeriodEarnings(deals, plan).grandTotal;
};
