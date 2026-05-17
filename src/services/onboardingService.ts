import { 
  doc, 
  updateDoc, 
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
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
    try {
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
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      throw error;
    }
  },

  /**
   * Update the current onboarding step.
   */
  async updateStep(userId: string, step: string) {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        'preferences.onboarding.currentStep': step
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  /**
   * Mark a step as completed.
   */
  async completeStep(userId: string, step: string) {
    const userRef = doc(db, 'users', userId);
    try {
      const state = await this.getOnboardingState(userId);
      
      if (!state.completedSteps.includes(step)) {
        await updateDoc(userRef, {
          'preferences.onboarding.completedSteps': [...state.completedSteps, step]
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  /**
   * Complete the entire onboarding process.
   */
  async finishOnboarding(userId: string) {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        'preferences.onboarding.isCompleted': true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  },

  /**
   * Mark a hint as seen.
   */
  async markHintSeen(userId: string, hintId: string) {
    const userRef = doc(db, 'users', userId);
    try {
      const state = await this.getOnboardingState(userId);
      
      if (!state.seenHints.includes(hintId)) {
        await updateDoc(userRef, {
          'preferences.onboarding.seenHints': [...state.seenHints, hintId]
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
      throw error;
    }
  }
};
