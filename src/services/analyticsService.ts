import { Deal, PayPlan, DealStatus, DashboardMetrics } from '../types';
import { estimateCommission, calculatePeriodEarnings } from '../lib/commissionLogic';
import { safeDate } from '../lib/utils';

/**
 * StripeItAnalyticsSystem
 * Centralized logic for calculating dashboard metrics and chart data.
 */

export interface ChartDataPoint {
  date: string;
  units: number;
  gross: number;
  commission: number;
}

/**
 * Filters deals for the current month
 */
export const getMTDDeals = (deals: Deal[]): Deal[] => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  
  return deals.filter(deal => {
    const dealTime = safeDate(deal.createdAt || deal.date).getTime();
    return dealTime >= firstDayOfMonth && deal.status !== DealStatus.CANCELLED;
  });
};

/**
 * Calculates core dashboard metrics
 */
export const calculateDashboardMetrics = (deals: Deal[], payPlan: PayPlan | null): DashboardMetrics => {
  const mtdDeals = getMTDDeals(deals);
  
  let totalUnits = 0;
  let totalFront = 0;
  let totalBack = 0;

  mtdDeals.forEach(deal => {
    const unitValue = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    totalUnits += unitValue;
    totalFront += deal.frontEndGross;
    totalBack += deal.backEndGross;
  });

  const totalGross = totalFront + totalBack;
  let totalComm = 0;

  if (payPlan) {
    const earnings = calculatePeriodEarnings(mtdDeals, payPlan);
    totalComm = earnings.grandTotal;
  }

  const avgGross = totalUnits > 0 ? totalGross / totalUnits : 0;
  const avgComm = totalUnits > 0 ? totalComm / totalUnits : 0;

  return {
    totalUnitsMTD: totalUnits,
    totalCommissionMTD: totalComm,
    totalFrontEndGrossMTD: totalFront,
    totalBackEndGrossMTD: totalBack,
    totalGrossMTD: totalGross,
    avgGrossPerUnit: avgGross,
    avgCommissionPerUnit: avgComm
  };
};

export interface SalespersonMetrics extends DashboardMetrics {
  userId: string;
  displayName: string;
}

/**
 * Calculates metrics per salesperson for team overview
 */
export const calculateTeamMetrics = (deals: Deal[], payPlans?: Record<string, PayPlan>): SalespersonMetrics[] => {
  const mtdDeals = getMTDDeals(deals);
  const salespersonMap = new Map<string, Deal[]>();

  mtdDeals.forEach(deal => {
    const userId = deal.assignedSalespersonId || deal.userId;
    const existing = salespersonMap.get(userId) || [];
    salespersonMap.set(userId, [...existing, deal]);
  });

  return Array.from(salespersonMap.entries()).map(([userId, userDeals]) => {
    const userPayPlan = payPlans?.[userId] || null;
    const dashboardMetrics = calculateDashboardMetrics(userDeals, userPayPlan);
    
    return {
      ...dashboardMetrics,
      userId,
      displayName: userDeals[0]?.salespersonName || 'Unknown'
    };
  });
};

/**
 * Calculates aggregate totals for an entire organization/team
 */
export const calculateOrgTotalMetrics = (teamMetrics: SalespersonMetrics[]) => {
  return teamMetrics.reduce((acc, curr) => ({
    units: acc.units + curr.totalUnitsMTD,
    gross: acc.gross + curr.totalGrossMTD,
    commission: acc.commission + curr.totalCommissionMTD,
    frontEnd: acc.frontEnd + curr.totalFrontEndGrossMTD,
    backEnd: acc.backEnd + curr.totalBackEndGrossMTD,
  }), { units: 0, gross: 0, commission: 0, frontEnd: 0, backEnd: 0 });
};

/**
 * Prepares data for trends chart
 * Groups deals by date and sums metrics
 */
export const getTrendsChartData = (deals: Deal[], payPlan: PayPlan | null): ChartDataPoint[] => {
  const mtdDeals = getMTDDeals(deals).sort((a, b) => {
    const timeA = safeDate(a.createdAt || a.date).getTime();
    const timeB = safeDate(b.createdAt || b.date).getTime();
    return timeA - timeB;
  });

  const dataMap = new Map<string, ChartDataPoint>();

  // Initialize all days of the month so far with zero
  const now = new Date();
  const currentDay = now.getDate();
  for (let i = 1; i <= currentDay; i++) {
    const dateStr = `${now.getMonth() + 1}/${i}`;
    dataMap.set(dateStr, { date: dateStr, units: 0, gross: 0, commission: 0 });
  }

  mtdDeals.forEach(deal => {
    const d = safeDate(deal.createdAt || deal.date);
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    
    const existing = dataMap.get(dateStr) || { date: dateStr, units: 0, gross: 0, commission: 0 };
    
    const unitValue = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    let comm = 0;
    if (payPlan) {
      comm = estimateCommission(deal, payPlan).finalPayout;
    }

    dataMap.set(dateStr, {
      date: dateStr,
      units: existing.units + unitValue,
      gross: existing.gross + (deal.frontEndGross + deal.backEndGross),
      commission: existing.commission + comm
    });
  });

  return Array.from(dataMap.values());
};
