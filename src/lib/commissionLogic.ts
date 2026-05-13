import { Deal, PayPlan, PayPlanRule, PayPlanTier, VolumeBonus, VolumeBonusType, VolumeBonusScope, VolumeBonusFilter, MiniLadderTier } from '../types';

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
  tierBonuses: { tierId: string; amount: number; label?: string }[];
  totalTierBonuses: number;
  hourlyCompensation?: {
    model: string;
    hourlyTotal: number;
    commissionTotal: number; // Sum of deals + tier bonuses
    adjustment: number; // Difference applied for guarantee
    finalTotal: number;
  };
  grandTotal: number;
}

/**
 * StripeItVolumeBonusSystem
 * Advanced volume-based bonus calculation.
 */
export const calculateVolumeBonus = (deals: Deal[], bonuses: VolumeBonus[], plan?: PayPlan): { bonuses: { tierId: string; amount: number; label: string }[]; total: number } => {
  if (!bonuses || bonuses.length === 0) return { bonuses: [], total: 0 };

  const results: { tierId: string; amount: number; label: string }[] = [];
  let total = 0;

  // 1. Separate bonuses by type
  const activeBonuses = bonuses.filter(b => b.active);
  
  // Non-cumulative types (Highest qualifying threshold wins within each filter group)
  const nonCumulativeTypes = [VolumeBonusType.FLAT, VolumeBonusType.NON_CUMULATIVE];
  const stackingTypes = [VolumeBonusType.CUMULATIVE, VolumeBonusType.RETRO_PER_UNIT];

  const nonCumulativeBonuses = activeBonuses.filter(b => nonCumulativeTypes.includes(b.type));
  const otherBonuses = activeBonuses.filter(b => stackingTypes.includes(b.type));

  // Helper to count units based on filter
  const getFilteredUnits = (filter: VolumeBonusFilter) => {
    let filteredDeals = deals;
    if (filter === VolumeBonusFilter.NEW) filteredDeals = deals.filter(d => d.newOrUsed === 'new');
    if (filter === VolumeBonusFilter.USED) filteredDeals = deals.filter(d => d.newOrUsed === 'used');
    if (filter === VolumeBonusFilter.CPO) filteredDeals = deals.filter(d => d.newOrUsed === 'cpo');
    
    return filteredDeals.reduce((sum, d) => {
      const unitValue = d.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1;
      return sum + unitValue;
    }, 0);
  };

  // 2. Handle Non-Cumulative Bonuses (Highest qualifying threshold wins per filter group)
  const sortedNonCum = [...nonCumulativeBonuses].sort((a, b) => b.threshold - a.threshold);
  const claimedFilters = new Set<string>();

  for (const bonus of sortedNonCum) {
    if (claimedFilters.has(bonus.filter)) continue;

    const units = getFilteredUnits(bonus.filter);
    if (units >= bonus.threshold) {
      const typeLabel = bonus.type === VolumeBonusType.NON_CUMULATIVE ? 'NON-CUMULATIVE' : 'Flat';
      results.push({
        tierId: bonus.id,
        amount: bonus.amount,
        label: `${bonus.threshold}+ Units ${typeLabel} Bonus (${bonus.filter})`
      });
      total += bonus.amount;
      claimedFilters.add(bonus.filter);
    }
  }

  // 3. Handle Cumulative and Retro Per Unit Bonuses
  for (const bonus of otherBonuses) {
    const units = getFilteredUnits(bonus.filter);
    if (units >= bonus.threshold) {
      let bonusAmount = 0;
      let label = '';

      if (bonus.type === VolumeBonusType.CUMULATIVE) {
        bonusAmount = bonus.amount;
        label = `${bonus.threshold}+ Units Cumulative Bonus (${bonus.filter})`;
      } else if (bonus.type === VolumeBonusType.RETRO_PER_UNIT) {
        if (bonus.scope === VolumeBonusScope.ALL_UNITS) {
          bonusAmount = units * bonus.amount;
          label = `Retro Per-Unit Bonus: ${units} units × $${bonus.amount} (${bonus.filter})`;
        } else {
          const eligibleUnits = Math.max(0, units - bonus.threshold);
          bonusAmount = eligibleUnits * bonus.amount;
          label = `Threshold+ Per-Unit Bonus: ${eligibleUnits} units × $${bonus.amount} (${bonus.filter})`;
        }
      }

      if (bonusAmount > 0) {
        results.push({ tierId: bonus.id, amount: bonusAmount, label });
        total += bonusAmount;
      }
    }
  }

  return { bonuses: results, total };
};

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
export const getDealUnitPosition = (deal: Deal, allDealsForMonth: Deal[], plan?: PayPlan): number => {
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
    const unitValue = d.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1;
    runningUnits += unitValue;
    if (d.id === deal.id) return runningUnits;
  }

  // If deal not found in the list (e.g. it's a new unsaved deal being projected)
  // We assume it's added at the end
  const totalCurrentUnits = sorted.reduce((sum, d) => sum + (d.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1), 0);
  const dealUnitValue = deal.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (deal.splitPercentage || 50) / 100 : 1;
  return totalCurrentUnits + dealUnitValue;
};

/**
 * Find the active mini tier for a given unit count.
 */
export const getActiveMiniTier = (unitCount: number, tiers: MiniLadderTier[]): MiniLadderTier | null => {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].filter(t => t.active).sort((a, b) => Number(a.threshold) - Number(b.threshold));
  let activeTier: MiniLadderTier | null = null;
  for (const tier of sorted) {
    if (unitCount >= Number(tier.threshold)) {
      activeTier = tier;
    }
  }
  return activeTier;
};

/**
 * Helper to resolve the correct mini amount based on current system configuration.
 */
const resolveMiniAmount = (deal: Deal, plan: PayPlan, totalUnits: number, overrides?: { newMini?: number; usedMini?: number }): number => {
  // If no mini system active, use base mini
  if (!plan.isMinisActive) return plan.miniAmount || 0;
  
  let mini = 0;

  // 1. Check for Ladder Overrides (highest priority if provided via calculateDealCommission)
  if (overrides) {
    if ((deal.newOrUsed === 'used' || deal.newOrUsed === 'cpo') && overrides.usedMini !== undefined) {
      mini = overrides.usedMini;
    } else if (deal.newOrUsed === 'new' && overrides.newMini !== undefined) {
      mini = overrides.newMini;
    }
  }

  // 2. Fallback to Mini Ladder Logic if no overrides provided (e.g. estimateCommission called directly)
  if (mini === 0 && plan.miniTiers && plan.miniTiers.length > 0) {
    const tier = getActiveMiniTier(totalUnits, plan.miniTiers);
    if (tier) {
      mini = (deal.newOrUsed === 'used' || deal.newOrUsed === 'cpo') ? tier.usedMini : tier.newMini;
    }
  }

  // 3. Final fallback to legacy miniAmount
  if (mini === 0) {
    mini = plan.miniAmount || 0;
  }

  return mini;
};

/**
 * StripeItFormulaEngineSystem - Evaluate individual deal rules
 */
const evaluateRules = (deal: Deal, rules: PayPlanRule[], plan?: PayPlan): { bonus: number; applied: string[] } => {
  let bonus = 0;
  const applied: string[] = [];

  for (const rule of rules) {
    const splitRatio = deal.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (deal.splitPercentage || 50) / 100 : 1;
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
export const estimateCommission = (
  deal: Deal, 
  plan: PayPlan, 
  overrides?: { frontRate?: number; backRate?: number; newMini?: number; usedMini?: number; totalUnitsAtMonthEnd?: number }
): CommissionResult => {
  // 1. Calculate raw percentages
  const frontRate = overrides?.frontRate ?? plan.frontEndPercentage;
  const backRate = overrides?.backRate ?? plan.backEndPercentage;

  const frontComm = deal.frontEndGross * (frontRate / 100);
  const backComm = deal.backEndGross * (backRate / 100);
  
  const flatComm = plan.isFlatPerUnitActive !== false ? (plan.flatPerUnitAmount || 0) : 0;

  // 2. Evaluate Advanced Rules
  const { bonus: ruleBonuses, applied: appliedRules } = plan.isAdvanced && plan.isRulesEnabled && plan.rules 
    ? evaluateRules(deal, plan.rules, plan) 
    : { bonus: 0, applied: [] };

  // 3. Resolve Custom Minis
  let customMiniBonus = 0;
  if (plan.customMinis) {
    for (const cm of plan.customMinis) {
      if (!cm.active) continue;
      let matches = true;
      if (cm.filter === VolumeBonusFilter.NEW && deal.newOrUsed !== 'new') matches = false;
      if (cm.filter === VolumeBonusFilter.USED && deal.newOrUsed !== 'used') matches = false;
      if (cm.filter === VolumeBonusFilter.CPO && deal.newOrUsed !== 'cpo') matches = false;
      
      if (matches) customMiniBonus += cm.amount;
    }
  }

  // 4. Resolve "Mini"
  const miniAmount = resolveMiniAmount(deal, plan, overrides?.totalUnitsAtMonthEnd || 0, {
    newMini: overrides?.newMini,
    usedMini: overrides?.usedMini
  });
  
  let totalComm = 0;
  let isMini = false;

  if (plan.frontDeficitRecoveryEnabled) {
    // Recovery Model: Combine all payouts first, then apply mini floor
    const totalPayable = frontComm + backComm + flatComm + ruleBonuses + customMiniBonus;
    if (totalPayable < miniAmount) {
      totalComm = miniAmount;
      isMini = true;
    } else {
      totalComm = totalPayable;
    }
  } else {
    // Independent Model (Default): Mini applies to front portion only
    const frontPayable = frontComm + flatComm + ruleBonuses + customMiniBonus;
    if (frontPayable < miniAmount) {
      totalComm = miniAmount + backComm;
      isMini = true;
    } else {
      totalComm = frontPayable + backComm;
    }
  }

  const totalBeforeSplit = totalComm;
  let finalPayout = totalComm;

  // 5. Handle Split Deals
  if (deal.isSplitDeal && plan.isSplitBehaviorActive !== false) {
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
 * Find the index of the active commission tier for a given unit count.
 */
export const getActiveCommissionTierIndex = (unitCount: number, tiers: PayPlanTier[]): number => {
  if (!tiers || tiers.length === 0) return -1;
  const sorted = [...tiers].sort((a, b) => Number(a.threshold ?? 0) - Number(b.threshold ?? 0));
  let index = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (unitCount >= Number(sorted[i].threshold ?? 0)) {
      index = i;
    }
  }
  return index;
};

/**
 * Resolves a rate for a specific tier by inheriting from rows above if the current row's rate is undefined.
 */
const resolveInheritedRate = (tierIndex: number, tiers: PayPlanTier[], field: 'frontRate' | 'backRate', defaultRate: number): number => {
  if (tierIndex < 0) return defaultRate;
  for (let i = tierIndex; i >= 0; i--) {
    const val = tiers[i][field];
    if (val !== undefined && val !== null) return val;
  }
  return defaultRate;
};

/**
 * Canonical calculation for a single deal within a monthly context.
 */
export const calculateDealCommission = (deal: Deal, plan: PayPlan, allDealsForMonth: Deal[]): CommissionResult => {
  if (!plan.isAdvanced || !plan.tiers || plan.tiers.length === 0) {
    return estimateCommission(deal, plan);
  }

  const totalUnits = allDealsForMonth.reduce((sum, d) => sum + (d.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1), 0);
  const unitPosition = getDealUnitPosition(deal, allDealsForMonth, plan);
  
  const tiers = [...plan.tiers].sort((a, b) => Number(a.threshold ?? 0) - Number(b.threshold ?? 0));
  const tierAtSaleIndex = getActiveCommissionTierIndex(unitPosition, tiers);
  const highestTierReachedIndex = getActiveCommissionTierIndex(totalUnits, tiers);

  const highestTierReached = highestTierReachedIndex >= 0 ? tiers[highestTierReachedIndex] : null;

  // Resolve rates with inheritance
  let frontRate = resolveInheritedRate(tierAtSaleIndex, tiers, 'frontRate', plan.frontEndPercentage);
  let backRate = resolveInheritedRate(tierAtSaleIndex, tiers, 'backRate', plan.backEndPercentage);

  // If retroactive is enabled on the highest tier reached, and that tier (or an inherited one) has a rate
  if (highestTierReached?.frontRetroactive) {
    frontRate = resolveInheritedRate(highestTierReachedIndex, tiers, 'frontRate', plan.frontEndPercentage);
  }
  
  if (highestTierReached?.backRetroactive) {
    backRate = resolveInheritedRate(highestTierReachedIndex, tiers, 'backRate', plan.backEndPercentage);
  }

  // 3. Determine Mini Overrides from Mini Ladder
  let newMini = undefined;
  let usedMini = undefined;

  if (plan.isMinisActive && plan.miniTiers && plan.miniTiers.length > 0) {
    const miniTierAtSale = getActiveMiniTier(unitPosition, plan.miniTiers);
    const highestMiniTierReached = getActiveMiniTier(totalUnits, plan.miniTiers);

    if (highestMiniTierReached?.isRetroactive) {
      newMini = highestMiniTierReached.newMini;
      usedMini = highestMiniTierReached.usedMini;
    } else {
      newMini = miniTierAtSale?.newMini;
      usedMini = miniTierAtSale?.usedMini;
    }
  }

  return estimateCommission(deal, plan, { 
    frontRate, 
    backRate, 
    newMini, 
    usedMini,
    totalUnitsAtMonthEnd: totalUnits 
  });
};

/**
 * StripeItTierBonusSystem & StripeItRetroactiveBonusSystem
 * Calculate total period earnings including volume-based tier bonuses and retroactive rate overrides.
 */
export const calculatePeriodEarnings = (deals: Deal[], plan: PayPlan): PeriodEarnings => {
  let dealResults: any[] = [];
  let totalDealPayout = 0;

  if (!plan.isAdvanced || !plan.tiers || plan.tiers.length === 0) {
    dealResults = deals.map(d => estimateCommission(d, plan));
    totalDealPayout = dealResults.reduce((sum, r) => sum + r.finalPayout, 0);
  } else {
    // Use the canonical per-deal calculation
    dealResults = deals.map(deal => calculateDealCommission(deal, plan, deals));
    totalDealPayout = dealResults.reduce((sum, r) => sum + r.finalPayout, 0);
  }

  // Calculate Tier Volume Bonuses
  const tierBonuses: { tierId: string; amount: number; label?: string }[] = [];
  let totalTierBonuses = 0;

  // New Volume Bonus
  if (plan.isVolumeBonusEngineActive && plan.volumeBonuses) {
    const engineResults = calculateVolumeBonus(deals, plan.volumeBonuses, plan);
    tierBonuses.push(...engineResults.bonuses);
    totalTierBonuses = engineResults.total;
  } 
  // Backward compatibility: Old Tier Volume Bonuses
  else if (plan.isVolumeBonusActive && plan.tiers && plan.tiers.length > 0) {
    const totalUnits = deals.reduce((sum, d) => sum + (d.isSplitDeal && plan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1), 0);
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

      tierBonuses.push({ 
        tierId: highestTier.id, 
        amount: tierAmount,
        label: `${highestTier.threshold}+ Units Bonus`
      });
      totalTierBonuses = tierAmount;
    }
  }

  const commissionTotal = totalDealPayout + totalTierBonuses;
  let finalGrandTotal = commissionTotal;
  let hourlyInfo: PeriodEarnings['hourlyCompensation'];

  // Handle Minis and Hourly Section
  if (plan.isMinisAndHourlyActive && plan.isHourlyActive && plan.hourlyConfig) {
    const config = plan.hourlyConfig;
    const hourlyTotal = config.rate * config.hoursWorked;
    let adjustment = 0;

    if (config.model === 'guarantee') {
      if (hourlyTotal > commissionTotal) {
        adjustment = hourlyTotal - commissionTotal;
        finalGrandTotal = hourlyTotal;
      }
    } else if (config.model === 'additive') {
      adjustment = hourlyTotal;
      finalGrandTotal = commissionTotal + hourlyTotal;
    } else if (config.model === 'draw') {
      if (hourlyTotal > commissionTotal) {
        adjustment = hourlyTotal - commissionTotal;
        finalGrandTotal = hourlyTotal;
      }
    }

    hourlyInfo = {
      model: config.model,
      hourlyTotal,
      commissionTotal,
      adjustment,
      finalTotal: finalGrandTotal
    };
  }

  return {
    totalPayout: totalDealPayout,
    dealResults,
    tierBonuses,
    totalTierBonuses,
    hourlyCompensation: hourlyInfo,
    grandTotal: finalGrandTotal
  };
};

/**
 * Legacy support / convenience helper
 */
export const calculateTotalEarnings = (deals: Deal[], plan: PayPlan) => {
  return calculatePeriodEarnings(deals, plan).grandTotal;
};
