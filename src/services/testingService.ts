import { 
  collection, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dealService } from './dealService';
import { noteService } from './noteService';
import { demoSeedService } from './demoSeedService';
import { UserProfile } from '../types';

/**
 * StripeItTestingModeSystem
 * Provides utilities for repeatable Free Tier testing and demo data management.
 */

export const testingService = {
  /**
   * StripeItDealClearingSystem
   * surgical deletion of current user's deals and associated data.
   */
  async clearUserDeals(profile: UserProfile): Promise<void> {
    const { uid: userId, orgId } = profile;

    // 1. Delete all Deals
    const dealsRef = collection(db, 'organizations', orgId, 'deals');
    const dealsQuery = query(dealsRef, where('userId', '==', userId));
    const dealsSnap = await getDocs(dealsQuery);
    const dealDeletions = dealsSnap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(dealDeletions);

    // 2. Delete all Notes (associated with deals)
    const notesRef = collection(db, 'organizations', orgId, 'notes');
    const notesQuery = query(notesRef, where('userId', '==', userId));
    const notesSnap = await getDocs(notesQuery);
    const noteDeletions = notesSnap.docs.map(n => deleteDoc(n.ref));
    await Promise.all(noteDeletions);

    // 3. Delete Activity Events for this user
    const activityRef = collection(db, 'organizations', orgId, 'activity');
    const activityQuery = query(activityRef, where('userId', '==', userId));
    const activitySnap = await getDocs(activityQuery);
    const activityDeletions = activitySnap.docs.map(a => deleteDoc(a.ref));
    await Promise.all(activityDeletions);
    
    // We do NOT clear goals, pay plans, or profile data here as requested.
  },

  /**
   * StripeItOnboardingResetSystem
   * Resets the onboarding progress so the user can experience the first-login flow again.
   */
  async resetOnboarding(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.onboarding': {
        isCompleted: false,
        currentStep: 'welcome',
        completedSteps: [],
        seenHints: []
      }
    });
  },

  /**
   * StripeItDemoResetSystem
   * Original reset logic, now optionally available if needed, but we'll prioritize the new split actions.
   */
  async resetUserData(profile: UserProfile): Promise<void> {
    const { uid: userId, orgId } = profile;

    await this.clearUserDeals(profile);

    // clear Goals for this user
    const goalsRef = collection(db, 'goals');
    const goalsQuery = query(goalsRef, where('userId', '==', userId));
    const goalsSnap = await getDocs(goalsQuery);
    const goalDeletions = goalsSnap.docs.map(g => deleteDoc(g.ref));
    await Promise.all(goalDeletions);

    // clear Pay Plan
    const payPlanRef = doc(db, 'organizations', orgId, 'users', userId, 'payPlans', 'primary');
    await deleteDoc(payPlanRef);

    // clear Onboarding
    await this.resetOnboarding(userId);

    // Re-seed to return to clean state
    await demoSeedService.seedSalespersonDemo(profile);
  }
};
