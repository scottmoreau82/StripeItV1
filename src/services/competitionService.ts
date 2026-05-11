import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Competition, 
  CompetitionType, 
  CompetitionStatus, 
  Deal, 
  LeaderboardEntry,
  PayPlan,
  DealStatus
} from '../types';
import { estimateCommission, calculatePeriodEarnings } from '../lib/commissionLogic';
import { safeDate } from '../lib/utils';

/**
 * StripeItCompetitionSystem
 * Logic for managing competitions and calculating real-time rankings.
 */

export const competitionService = {
  /**
   * Calculate leaderboard for a specific competition
   */
  calculateLeaderboard(competition: Competition, deals: Deal[], payPlans?: Record<string, PayPlan>): LeaderboardEntry[] {
    const { startDate, endDate, type } = competition;
    
    // Filter deals within competition timeframe
    const compDeals = deals.filter(deal => {
      const dealTime = safeDate(deal.createdAt || deal.date).getTime();
      return (
        dealTime >= startDate && 
        dealTime <= endDate && 
        deal.status !== DealStatus.CANCELLED
      );
    });

    const userDealsMap = new Map<string, Deal[]>();
    const userNames = new Map<string, string>();

    // Group deals by user
    compDeals.forEach(deal => {
      const userId = deal.assignedSalespersonId || deal.userId;
      const salespersonName = (deal as any).salespersonName || 'Team Member';
      userNames.set(userId, salespersonName);

      const existing = userDealsMap.get(userId) || [];
      userDealsMap.set(userId, [...existing, deal]);
    });

    const leaderboard: LeaderboardEntry[] = Array.from(userDealsMap.entries()).map(([userId, userDeals]) => {
      let value = 0;
      const payPlan = payPlans?.[userId] || null;

      switch (type) {
        case CompetitionType.UNITS:
          value = userDeals.reduce((sum, deal) => 
            sum + (deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1), 0);
          break;
        case CompetitionType.FRONT_END_GROSS:
          value = userDeals.reduce((sum, deal) => sum + deal.frontEndGross, 0);
          break;
        case CompetitionType.BACK_END_GROSS:
          value = userDeals.reduce((sum, deal) => sum + deal.backEndGross, 0);
          break;
        case CompetitionType.TOTAL_GROSS:
          value = userDeals.reduce((sum, deal) => sum + (deal.frontEndGross + deal.backEndGross), 0);
          break;
        case CompetitionType.COMMISSION:
          if (payPlan) {
            // Include tier bonuses for the competition period
            value = calculatePeriodEarnings(userDeals, payPlan).grandTotal;
          } else {
            // Fallback if no pay plan
            value = 0;
          }
          break;
      }

      return {
        userId,
        displayName: userNames.get(userId) || 'Unknown',
        value,
        rank: 0
      };
    });

    return leaderboard
      .sort((a, b) => b.value - a.value)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  },

  /**
   * Fetch active competitions for an organization
   */
  async getActiveCompetitions(orgId: string): Promise<Competition[]> {
    const q = query(
      collection(db, 'organizations', orgId, 'competitions'),
      where('status', 'in', [CompetitionStatus.ACTIVE, CompetitionStatus.COMPLETED]),
      orderBy('endDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data(),
      // Handle timestamps if coming back as Firestore Timestamps
      startDate: (d.data() as any).startDate?.seconds ? (d.data() as any).startDate.seconds * 1000 : (d.data() as any).startDate,
      endDate: (d.data() as any).endDate?.seconds ? (d.data() as any).endDate.seconds * 1000 : (d.data() as any).endDate,
    } as Competition));
  },

  /**
   * Create a new competition
   */
  async createCompetition(orgId: string, data: Omit<Competition, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'organizations', orgId, 'competitions'), {
      ...data,
      orgId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Update competition status
   */
  async updateStatus(orgId: string, compId: string, status: CompetitionStatus): Promise<void> {
     const docRef = doc(db, 'organizations', orgId, 'competitions', compId);
     await updateDoc(docRef, { 
       status,
       updatedAt: serverTimestamp()
     });
  },

  /**
   * Helper to map competitions to their top leaders for display
   */
  getCompetitionsWithLeaders(competitions: Competition[], deals: Deal[]): { competition: Competition, leader?: LeaderboardEntry }[] {
    return competitions.map(c => {
      const entries = this.calculateLeaderboard(c, deals);
      return {
        competition: c,
        leader: entries[0]
      };
    });
  }
};
