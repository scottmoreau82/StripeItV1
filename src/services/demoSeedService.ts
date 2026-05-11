import { 
  dealService 
} from './dealService';
import { 
  payPlanService 
} from './payPlanService';
import { 
  goalService 
} from './goalService';
import { 
  noteService 
} from './noteService';
import { 
  activityService 
} from './activityService';
import { 
  Deal, 
  DealStatus, 
  UserProfile, 
  SubscriptionTier, 
  ActivityEventType 
} from '../types';

/**
 * StripeItDemoSeedSystem
 * Provides realistic demo data for salesperson testing and Free Tier evaluation.
 */

export const demoSeedService = {
  /**
   * Seeds exactly 6 deals and supporting data for a salesperson.
   */
  async seedSalespersonDemo(profile: UserProfile): Promise<void> {
    const { orgId, uid: userId, displayName: userName } = profile;
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // 1. Seed Realistic Pay Plan
    await payPlanService.savePayPlan(orgId, userId, {
      name: 'Standard Dealership Plan',
      miniAmount: 250,
      frontEndPercentage: 25,
      backEndPercentage: 5,
      flatPerUnitAmount: 0,
      splitDealBehavior: 'standard',
      isAdvanced: true,
      rules: [
        {
          id: 'bonus-1',
          name: 'Gross Buster',
          description: 'Bonus for high front-end gross',
          condition: 'front_end_gross',
          operator: 'gte',
          threshold: 3000,
          rewardType: 'fixed_bonus',
          rewardValue: 100
        }
      ],
      tiers: [
        {
          id: 'tier-1',
          threshold: 10,
          bonusAmount: 500,
          perUnitBonus: 50,
          isRetroactive: true
        }
      ]
    });

    // 2. Seed Realistic Goal
    await goalService.saveGoal({
      userId,
      orgId,
      month: currentMonth,
      unitGoal: 12,
      commissionGoal: 5000,
      createdAt: Date.now()
    });

    // 3. Seed 6 Realistic Deals (Free Tier Limit is 8)
    const demoDeals = [
      {
        customerName: 'Sarah Jenkins',
        purchasedVehicle: '2024 Honda CR-V',
        stockNumber: 'H7821',
        newOrUsed: 'new' as const,
        frontEndGross: 2450,
        backEndGross: 1200,
        isSplitDeal: false,
        status: DealStatus.FINALIZED,
        date: `${currentMonth}-02`
      },
      {
        customerName: 'Michael Chen',
        purchasedVehicle: '2021 Toyota RAV4',
        stockNumber: 'T9902',
        newOrUsed: 'used' as const,
        frontEndGross: 3200,
        backEndGross: 800,
        isSplitDeal: false,
        status: DealStatus.FINALIZED,
        date: `${currentMonth}-05`
      },
      {
        customerName: 'Robert Wilson',
        purchasedVehicle: '2024 Honda Civic',
        stockNumber: 'H1123',
        newOrUsed: 'new' as const,
        frontEndGross: 1800,
        backEndGross: 1500,
        isSplitDeal: true,
        splitPercentage: 50,
        status: DealStatus.FINALIZED,
        date: `${currentMonth}-08`
      },
      {
        customerName: 'Amanda Lopez',
        purchasedVehicle: '2020 Ford F-150',
        stockNumber: 'F0032',
        newOrUsed: 'used' as const,
        frontEndGross: 4500,
        backEndGross: 2200,
        isSplitDeal: false,
        status: DealStatus.SUBMITTED,
        date: `${currentMonth}-11`
      },
      {
        customerName: 'David Thompson',
        purchasedVehicle: '2024 Honda Pilot',
        stockNumber: 'H4456',
        newOrUsed: 'new' as const,
        frontEndGross: 2800,
        backEndGross: 400,
        isSplitDeal: false,
        status: DealStatus.SUBMITTED,
        date: `${currentMonth}-12`
      },
      {
        customerName: 'Jessica Miller',
        purchasedVehicle: '2019 Jeep Wrangler',
        stockNumber: 'J7781',
        newOrUsed: 'used' as const,
        frontEndGross: 1500,
        backEndGross: 1000,
        isSplitDeal: false,
        status: DealStatus.DRAFT,
        date: `${currentMonth}-13`
      }
    ];

    for (const dealData of demoDeals) {
      await dealService.createDeal(orgId, {
        ...dealData,
        userId,
        createdByUserId: userId,
        assignedSalespersonId: userId,
        dealershipId: profile.dealershipId,
        salespersonName: userName,
        dealNumber: `D-${Math.floor(Math.random() * 10000)}`
      });
    }

    // 4. Seed Realistic Notes
    await noteService.createNote(orgId, {
      userId,
      text: 'Sarah Jenkins - Wants to add roof racks next week. Service scheduled.',
      customerName: 'Sarah Jenkins',
      stockNumber: 'H7821'
    });

    await noteService.createNote(orgId, {
      userId,
      text: 'Follow up with David Thompson - Check if insurance binder was received.',
      customerName: 'David Thompson'
    });

    // 5. Seed Activity
    await activityService.logEvent(orgId, {
      type: ActivityEventType.DEAL_CREATED,
      userId,
      userName,
      orgId,
      message: `created a new deal for Jessica Miller`
    });

    await activityService.logEvent(orgId, {
      type: ActivityEventType.GOAL_REACHED,
      userId,
      userName,
      orgId,
      message: `reached 50% of monthly unit goal!`
    });
  }
};
