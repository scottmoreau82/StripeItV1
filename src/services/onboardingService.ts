import { 
  doc, 
  updateDoc, 
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '@/src/lib/firebase';
import { OnboardingState, UserProfile } from '../types';

/**
 * StripeItOnboardingSystem
 * Manages the user's progress through the guided setup and feature introductions.
 */

export const onboardingService = {
  /**
   * Initialize or get onboarding state for a user.
   */
  async getOnboardingState(userId: string): Promise<OnboardingState> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      return userData.preferences?.onboarding || {
        isCompleted: false,
        currentStep: 'welcome',
        completedSteps: [],
        seenHints: []
      };
    }
    
    return {
      isCompleted: false,
      currentStep: 'welcome',
      completedSteps: [],
      seenHints: []
    };
  },

  /**
   * Update the current onboarding step.
   */
  async updateStep(userId: string, step: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.onboarding.currentStep': step
    });
  },

  /**
   * Mark a step as completed.
   */
  async completeStep(userId: string, step: string) {
    const userRef = doc(db, 'users', userId);
    const state = await this.getOnboardingState(userId);
    
    if (!state.completedSteps.includes(step)) {
      await updateDoc(userRef, {
        'preferences.onboarding.completedSteps': [...state.completedSteps, step]
      });
    }
  },

  /**
   * Complete the entire onboarding process.
   */
  async finishOnboarding(userId: string) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'preferences.onboarding.isCompleted': true
    });
  },

  /**
   * Mark a hint as seen.
   */
  async markHintSeen(userId: string, hintId: string) {
    const userRef = doc(db, 'users', userId);
    const state = await this.getOnboardingState(userId);
    
    if (!state.seenHints.includes(hintId)) {
      await updateDoc(userRef, {
        'preferences.onboarding.seenHints': [...state.seenHints, hintId]
      });
    }
  }
};
