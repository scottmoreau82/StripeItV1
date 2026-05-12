import { Deal, PayPlan, PayPlanRule, PayPlanTier } from '../types';

/**
 * StripeItBasicCommissionSystem & StripeItCommissionEstimateSystem
 * Logic for estimating salesperson commission based on deal data and pay plans.
 */

/**
 * StripeItCommissionSystem
 * Advanced arithmetic engine for deal payouts, volume multipliers, and tiered structures.
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
 * Find the active commission tier for a given unit count.
 * A tier is active if: unitCount >= threshold AND (unitCount <= maxUnits OR maxUnits is null/infinity)
 */
export const getActiveCommissionTier = (unitCount: number, tiers: PayPlanTier[]): PayPlanTier | null => {
  if (!tiers || tiers.length === 0) return null;
  
  // Ensure tiers are sorted by threshold ascending for logical matching
  const sorted = [...tiers].sort((a, b) => Number(a.threshold ?? 0) - Number(b.threshold ?? 0));
  
  // Find the LAST tier that the user has qualified for (since thresholds are floors)
  let activeTier: PayPlanTier | null = null;
  
  for (const tier of sorted) {
    const min = Number(tier.threshold ?? 0);
    const max = tier.maxUnits != null ? Number(tier.maxUnits) : Infinity;
    
    if (unitCount >= min) {
      activeTier = tier;
    }
  }
  
  return activeTier;
};

/**
 * Calculates the unit position of a specific deal within a month's worth of deals.
 * Deals are sorted by date (ASC) then ID to ensure stable ordering.
 */
export const getDealUnitPosition = (deal: Deal, allDealsForMonth: Deal[]): number => {
  if (!allDealsForMonth || allDealsForMonth.length === 0) return 0;

  // Sort deals by date ascending, then ID for stable sorting
  const sorted = [...allDealsForMonth].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return (a.id || '').localeCompare(b.id || '');
  });

  let runningUnits = 0;
  for (const d of sorted) {
    const unitValue = d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1;
    runningUnits += unitValue;
    if (d.id === deal.id) return runningUnits;
  }

  // If deal not found in the list (e.g. it's a new unsaved deal being projected)
  // We assume it's added at the end
  const currentTotal = allDealsForMonth.reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  const dealUnitValue = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
  return currentTotal + dealUnitValue;
};

/**
 * StripeItFormulaEngineSystem - Evaluate individual deal rules
 */
const evaluateRules = (deal: Deal, rules: PayPlanRule[]): { bonus: number; applied: string[] } => {
  let bonus = 0;
  const applied: string[] = [];

  for (const rule of rules) {
    const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    let valueToTest = 0;
    if (rule.condition === 'front_end_gross') valueToTest = deal.frontEndGross * splitRatio;
    if (rule.condition === 'back_end_gross') valueToTest = deal.backEndGross * splitRatio;
    if (rule.condition === 'total_gross') valueToTest = (deal.frontEndGross + deal.backEndGross) * splitRatio;

    const isMatch = rule.operator === 'gt' ? valueToTest > rule.threshold : valueToTest >= rule.threshold;

    if (isMatch) {
      if (rule.rewardType === 'fixed_bonus') {
        bonus += rule.rewardValue;
      } else if (rule.rewardType === 'percentage_increase') {
        bonus += (valueToTest * (rule.rewardValue / 100));
      }
      applied.push(rule.name);
    }
  }

  return { bonus, applied };
};

/**
 * StripeItCommissionEstimateSystem - Core individual deal calculator
 * This performs the raw math based on assigned rates.
 */
export const estimateCommission = (deal: Deal, plan: PayPlan, overrides?: { frontRate?: number; backRate?: number }): CommissionResult => {
  // 1. Calculate raw percentages (using overrides if provided, otherwise plan defaults)
  const frontRate = overrides?.frontRate ?? plan.frontEndPercentage;
  const backRate = overrides?.backRate ?? plan.backEndPercentage;

  const frontComm = deal.frontEndGross * (frontRate / 100);
  let backComm = deal.backEndGross * (backRate / 100);
  
  // Handle Back-End Eligibility Threshold
  if (plan.isBackEndThresholdActive && deal.frontEndGross < (plan.backEndThreshold || 0)) {
    backComm = 0;
  }
  
  const flatComm = (plan.flatPerUnitAmount || 0);

  // 2. Evaluate Advanced Rules
  const { bonus: ruleBonuses, applied: appliedRules } = plan.isAdvanced && plan.isRulesEnabled && plan.rules 
    ? evaluateRules(deal, plan.rules) 
    : { bonus: 0, applied: [] };

  let totalComm = frontComm + backComm + flatComm + ruleBonuses;
  let isMini = false;

  // 3. Resolve "Mini" (Minimum commission per deal)
  const miniAmount = plan.miniAmount || 0;
  if (totalComm < miniAmount) {
    totalComm = miniAmount;
    isMini = true;
  }

  const totalBeforeSplit = totalComm;
  let finalPayout = totalComm;

  // 4. Handle Split Deals (Final pass for split application)
  if (deal.isSplitDeal) {
    const splitRatio = (deal.splitPercentage || 50) / 100;
    
    if (plan.splitDealBehavior === 'half_mini' && isMini) {
      finalPayout = miniAmount / 2;
    } else {
      finalPayout = totalComm * splitRatio;
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
 * Canonical calculation for a single deal within a monthly context.
 */
export const calculateDealCommission = (deal: Deal, plan: PayPlan, allDealsForMonth: Deal[]): CommissionResult => {
  if (!plan.isAdvanced || !plan.tiers || plan.tiers.length === 0) {
    return estimateCommission(deal, plan);
  }

  const totalUnits = allDealsForMonth.reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  const unitPosition = getDealUnitPosition(deal, allDealsForMonth);
  
  const highestTierReached = getActiveCommissionTier(totalUnits, plan.tiers);
  const tierAtSale = getActiveCommissionTier(unitPosition, plan.tiers);

  // Determine effective rates
  // A retroactive rate applies if the highest tier reached has the flag enabled.
  const frontRate = (highestTierReached?.frontRetroactive && highestTierReached.frontRate !== undefined)
    ? highestTierReached.frontRate
    : (tierAtSale?.frontRate ?? plan.frontEndPercentage);

  const backRate = (highestTierReached?.backRetroactive && highestTierReached.backRate !== undefined)
    ? highestTierReached.backRate
    : (tierAtSale?.backRate ?? plan.backEndPercentage);

  return estimateCommission(deal, plan, { frontRate, backRate });
};

/**
 * StripeItTierBonusSystem & StripeItRetroactiveBonusSystem
 * Calculate total period earnings including volume-based tier bonuses and retroactive rate overrides.
 */
export const calculatePeriodEarnings = (deals: Deal[], plan: PayPlan): PeriodEarnings => {
  if (!plan.isAdvanced || !plan.tiers || plan.tiers.length === 0) {
    const dealResults = deals.map(d => estimateCommission(d, plan));
    const totalPayout = dealResults.reduce((sum, r) => sum + r.finalPayout, 0);
    return {
      totalPayout,
      dealResults,
      tierBonuses: [],
      totalTierBonuses: 0,
      grandTotal: totalPayout
    };
  }

  // Use the canonical per-deal calculation
  const dealResults = deals.map(deal => calculateDealCommission(deal, plan, deals));
  const totalDealPayout = dealResults.reduce((sum, r) => sum + r.finalPayout, 0);

  // Calculate Tier Volume Bonuses
  const totalUnits = deals.reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  
  const tierBonuses: { tierId: string; amount: number }[] = [];
  let totalTierBonuses = 0;

  if (plan.isVolumeBonusActive) {
    const highestTier = getActiveCommissionTier(totalUnits, plan.tiers);
    
    if (highestTier) {
      let tierAmount = highestTier.bonusAmount || 0;

      if (highestTier.perUnitBonus > 0) {
        if (highestTier.isRetroactive) {
          tierAmount += highestTier.perUnitBonus * totalUnits;
        } else {
          const unitsAboveThreshold = Math.max(0, totalUnits - (highestTier.threshold ?? 0));
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
