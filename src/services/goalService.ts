import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Goal } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItGoalDataSystem
 * Service for managing user goals in Firestore.
 */

export const goalService = {
  async getGoalForMonth(userId: string, orgId: string, month: string): Promise<Goal | null> {
    const goalId = `${userId}-${month}`;
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Goal;
    }
    return null;
  },

  async saveGoal(goalData: Partial<Goal>): Promise<void> {
    if (!goalData.userId || !goalData.month) throw new Error("Missing required goal fields");
    
    const goalId = `${goalData.userId}-${goalData.month}`;
    const docRef = doc(db, COLLECTIONS.GOALS, goalId);
    
    const finalGoal = {
      ...goalData,
      id: goalId,
      updatedAt: serverTimestamp(),
      createdAt: goalData.createdAt || serverTimestamp()
    };

    await setDoc(docRef, finalGoal, { merge: true });
  }
};
