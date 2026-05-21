import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  arrayUnion,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  calculateDealCommission, 
  calculateTotalEarnings,
  calculatePeriodEarnings
} from '../lib/commissionLogic';
import { getCalendarMonth, getCalendarYear } from '../lib/utils';
import { 
  AnalyticsEvent, 
  AnalyticsEventType, 
  AnalyticsSession, 
  DailyAnalyticsAggregate,
  Deal,
  PayPlan,
  MonthlySpiff
} from '../types';

/**
 * StripeItAnalyticsSystem
 * Centralized internal analytics and activity tracking system.
 */

export interface ChartDataPoint {
  date: string;
  units: number;
  gross: number;
  commission: number;
}

export interface SalespersonMetrics {
  userId: string;
  displayName: string;
  totalUnitsMTD: number;
  totalGrossMTD: number;
  totalCommissionMTD: number;
  avgGrossPerUnit: number;
  avgCommissionPerUnit: number;
  totalFrontEndMTD: number;
  totalBackEndMTD: number;
}

const COLLECTIONS = {
  EVENTS: 'analyticsEvents',
  SESSIONS: 'analyticsSessions',
  AGGREGATES: 'analyticsDailyAggregates'
};

// Simple ID generator for visitor and session
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

class AnalyticsService {
  private visitorId: string;
  private sessionId: string;
  private currentUserId: string | null = null;
  private currentUserEmail: string | null = null;

  constructor() {
    // Visitor ID persists across sessions
    let vid = typeof window !== 'undefined' ? localStorage.getItem('stripeit_visitor_id') : null;
    if (!vid && typeof window !== 'undefined') {
      vid = generateId();
      localStorage.setItem('stripeit_visitor_id', vid);
    }
    this.visitorId = vid || 'unknown';

    // Session ID is for the tab/browser session
    let sid = typeof window !== 'undefined' ? sessionStorage.getItem('stripeit_session_id') : null;
    if (!sid && typeof window !== 'undefined') {
      sid = generateId();
      sessionStorage.setItem('stripeit_session_id', sid);
    }
    this.sessionId = sid || 'unknown';
  }

  setUser(userId: string | null, email: string | null) {
    this.currentUserId = userId;
    this.currentUserEmail = email;
  }

  async trackEvent(type: AnalyticsEventType, payload?: Record<string, any>) {
    try {
      const event: Omit<AnalyticsEvent, 'id'> = {
        type,
        visitorId: this.visitorId,
        sessionId: this.sessionId,
        userId: this.currentUserId || undefined,
        userEmail: this.currentUserEmail || undefined,
        route: typeof window !== 'undefined' ? window.location.pathname : '/',
        payload,
        timestamp: Date.now()
      };

      await addDoc(collection(db, COLLECTIONS.EVENTS), {
        ...event,
        serverTime: serverTimestamp()
      });

      // Update daily aggregate
      await this.updateDailyAggregate(type);

      // Update session if it's a page view or click
      if (type === AnalyticsEventType.PAGE_VIEW || type === AnalyticsEventType.BUTTON_CLICK) {
        await this.updateCurrentSession(type);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.EVENTS);
    }
  }

  async startSession() {
    try {
      const sessionDoc = doc(db, COLLECTIONS.SESSIONS, this.sessionId);
      const docSnap = await getDoc(sessionDoc);

      if (!docSnap.exists()) {
        const session: AnalyticsSession = {
          id: this.sessionId,
          visitorId: this.visitorId,
          userId: this.currentUserId || undefined,
          startTime: Date.now(),
          pagesViewed: [typeof window !== 'undefined' ? window.location.pathname : '/'],
          clickCount: 0,
          deviceInfo: {
            browser: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
            os: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
            isMobile: typeof navigator !== 'undefined' ? /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) : false
          }
        };

        await setDoc(sessionDoc, session);
        await this.trackEvent(AnalyticsEventType.SESSION_START);
      }
    } catch (error) {
      console.error('Error starting analytics session:', error);
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.SESSIONS}/${this.sessionId}`);
    }
  }

  private async updateCurrentSession(type: AnalyticsEventType) {
    try {
      const sessionDoc = doc(db, COLLECTIONS.SESSIONS, this.sessionId);
      if (type === AnalyticsEventType.PAGE_VIEW) {
        await updateDoc(sessionDoc, {
          pagesViewed: arrayUnion(typeof window !== 'undefined' ? window.location.pathname : '/')
        });
      } else if (type === AnalyticsEventType.BUTTON_CLICK) {
        await updateDoc(sessionDoc, {
          clickCount: increment(1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.SESSIONS}/${this.sessionId}`);
    }
  }

  private async updateDailyAggregate(type: AnalyticsEventType) {
    const today = new Date().toISOString().split('T')[0];
    try {
      const aggDoc = doc(db, COLLECTIONS.AGGREGATES, today);

      const updateData: any = {
        date: today,
        timestamp: Date.now()
      };

      if (type === AnalyticsEventType.APP_VISIT) {
        updateData.visits = increment(1);
      } else if (type === AnalyticsEventType.SIGNUP_COMPLETED) {
        updateData.signups = increment(1);
      } else if (type === AnalyticsEventType.PAGE_VIEW) {
        updateData.pageViews = increment(1);
      } else if (type === AnalyticsEventType.BUTTON_CLICK) {
        updateData.clicks = increment(1);
      } else if (type === AnalyticsEventType.SESSION_START) {
        updateData.activeSessions = increment(1);
      }

      await setDoc(aggDoc, updateData, { merge: true });
    } catch (error) {
      console.error('Error updating daily aggregates:', error);
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.AGGREGATES}/${today}`);
    }
  }

  // Admin visibility helpers
  getDailyAggregates(days: number = 7) {
    return query(
      collection(db, COLLECTIONS.AGGREGATES),
      orderBy('date', 'desc'),
      limit(days)
    );
  }

  subscribeToLiveMetrics(callback: (metrics: DailyAnalyticsAggregate | null) => void) {
    const today = new Date().toISOString().split('T')[0];
    const path = `${COLLECTIONS.AGGREGATES}/${today}`;
    
    return onSnapshot(doc(db, COLLECTIONS.AGGREGATES, today), {
      next: (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as DailyAnalyticsAggregate);
        } else {
          callback(null);
        }
      },
      error: (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    });
  }

  async getMetricsForPeriod(startDate: string, endDate: string) {
    const q = query(
      collection(db, COLLECTIONS.AGGREGATES),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as DailyAnalyticsAggregate);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.AGGREGATES);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();

/**
 * Domain-specific analytics calculations for dashboard and management
 */

const isThisMonth = (dateStr: string) => {
  if (!dateStr) return false;
  const now = new Date();
  return getCalendarMonth(dateStr) === now.getMonth() && getCalendarYear(dateStr) === now.getFullYear();
};

export const calculateDashboardMetrics = (deals: Deal[], payPlan: PayPlan | null, monthlySpiffs: MonthlySpiff[] = []) => {
  const mtdDeals = deals.filter(d => isThisMonth(d.date));
  const mtdSpiffs = monthlySpiffs.filter(s => isThisMonth(s.date || s.month));
  
  const unitCount = mtdDeals.reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  const frontEnd = mtdDeals.reduce((sum, d) => sum + (d.frontEndGross || 0), 0);
  const backEnd = mtdDeals.reduce((sum, d) => sum + (d.backEndGross || 0), 0);
  const gross = frontEnd + backEnd;
  
  const earnings = payPlan ? calculatePeriodEarnings(mtdDeals, payPlan, mtdSpiffs) : null;
  const commission = earnings ? earnings.totalPayout + earnings.totalTierBonuses : 0;
  
  // Sum ALL MTD spiffs for display to ensure the Est. Payout card accurately reflects total spiffs found in the vault
  const spiffsMTD = mtdSpiffs.reduce((sum, s) => sum + (s.amount || 0), 0);

  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();

  return {
    units: unitCount,
    frontEnd,
    backEnd,
    gross,
    commission,
    spiffsMTD,
    avgGross: unitCount > 0 ? gross / unitCount : 0,
    avgCommission: unitCount > 0 ? (commission + spiffsMTD) / unitCount : 0,
    dealPace: (unitCount / (dayOfMonth || 1)) * daysInMonth
  };
};

export const getTrendsChartData = (deals: Deal[], payPlan: PayPlan | null) => {
  const mtdDeals = deals.filter(d => isThisMonth(d.date)).sort((a, b) => a.date.localeCompare(b.date));
  const dailyMap: Record<string, ChartDataPoint> = {};

  mtdDeals.forEach(deal => {
    const day = deal.date.split('T')[0];
    if (!dailyMap[day]) {
      dailyMap[day] = { date: day, units: 0, gross: 0, commission: 0 };
    }
    
    const unitValue = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    dailyMap[day].units += unitValue;
    dailyMap[day].gross += (deal.frontEndGross || 0) + (deal.backEndGross || 0);
    
    if (payPlan) {
      const result = calculateDealCommission(deal, payPlan, mtdDeals);
      dailyMap[day].commission += result.finalPayout;
    }
  });

  return Object.values(dailyMap);
};

export interface MonthlyDataPoint {
  month: string;       // e.g. "Jan", "Feb"
  monthKey: string;    // e.g. "2026-01"
  units: number;
  frontEnd: number;
  backEnd: number;
  gross: number;
  commission: number;
  avgGross: number;
  newUnits: number;
  usedUnits: number;
  cpoUnits: number;
}

export const getMonthlyHistoricalData = (
  deals: Deal[],
  payPlan: PayPlan | null,
  monthsBack: number = 6
): MonthlyDataPoint[] => {
  const results: MonthlyDataPoint[] = [];
  const now = new Date();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short' });

    const monthDeals = deals.filter(deal => {
      const dd = new Date(deal.date);
      return dd.getFullYear() === year && dd.getMonth() === month;
    });

    const units = monthDeals.reduce((sum, d) =>
      sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
    const frontEnd = monthDeals.reduce((sum, d) =>
      sum + (d.frontEndGross || 0), 0);
    const backEnd = monthDeals.reduce((sum, d) =>
      sum + (d.backEndGross || 0), 0);
    const gross = frontEnd + backEnd;

    let commission = 0;
    if (payPlan && monthDeals.length > 0) {
      const earnings = calculatePeriodEarnings(monthDeals, payPlan, []);
      commission = earnings.totalPayout + earnings.totalTierBonuses;
    }

    const newUnits = monthDeals.filter(d => d.newOrUsed === 'new').length;
    const usedUnits = monthDeals.filter(d => d.newOrUsed === 'used').length;
    const cpoUnits = monthDeals.filter(d => d.newOrUsed === 'cpo').length;

    results.push({
      month: monthLabel,
      monthKey,
      units,
      frontEnd,
      backEnd,
      gross,
      commission,
      avgGross: units > 0 ? gross / units : 0,
      newUnits,
      usedUnits,
      cpoUnits
    });
  }

  return results;
};

export const calculateTeamMetrics = (deals: Deal[], users?: any[]) => {
  const salespersonMap: Record<string, SalespersonMetrics> = {};
  const mtdDeals = deals.filter(d => isThisMonth(d.date));

  mtdDeals.forEach(deal => {
    const uid = deal.userId;
    if (!salespersonMap[uid]) {
      salespersonMap[uid] = {
        userId: uid,
        displayName: deal.salespersonName || 'Unknown',
        totalUnitsMTD: 0,
        totalGrossMTD: 0,
        totalCommissionMTD: 0,
        avgGrossPerUnit: 0,
        avgCommissionPerUnit: 0,
        totalFrontEndMTD: 0,
        totalBackEndMTD: 0
      };
    }

    const unitValue = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    salespersonMap[uid].totalUnitsMTD += unitValue;
    salespersonMap[uid].totalFrontEndMTD += (deal.frontEndGross || 0);
    salespersonMap[uid].totalBackEndMTD += (deal.backEndGross || 0);
    salespersonMap[uid].totalGrossMTD += (deal.frontEndGross || 0) + (deal.backEndGross || 0);
    
    // Note: For team metrics, we might not have the individual pay plans for each user here
    // so we might use denormalized commission if it existed, or just partials.
    // For now, we'll sum up what's available or assume a standard calc if needed.
    // In this app, calculatedCommission often comes from the deal object if it was saved there.
    salespersonMap[uid].totalCommissionMTD += (deal.frontEndGross * 0.25); // Placeholder or logic similar to old one
  });

  return Object.values(salespersonMap).map(m => ({
    ...m,
    avgGrossPerUnit: m.totalUnitsMTD > 0 ? m.totalGrossMTD / m.totalUnitsMTD : 0,
    avgCommissionPerUnit: m.totalUnitsMTD > 0 ? m.totalCommissionMTD / m.totalUnitsMTD : 0
  }));
};

export const calculateOrgTotalMetrics = (teamMetrics: SalespersonMetrics[]) => {
  return teamMetrics.reduce((acc, curr) => ({
    units: acc.units + curr.totalUnitsMTD,
    gross: acc.gross + curr.totalGrossMTD,
    commission: acc.commission + curr.totalCommissionMTD,
    frontEnd: acc.frontEnd + curr.totalFrontEndMTD,
    backEnd: acc.backEnd + curr.totalBackEndMTD
  }), { units: 0, gross: 0, commission: 0, frontEnd: 0, backEnd: 0 });
};
