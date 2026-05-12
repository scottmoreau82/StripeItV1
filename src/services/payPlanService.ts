import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PayPlan } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItPayPlanServiceSystem
 * Core CRUD logic for managing user pay plans in Firestore.
 */

export const payPlanService = {
  /**
   * Create or Update a Pay Plan
   */
  async savePayPlan(orgId: string, userId: string, plan: Omit<PayPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>): Promise<void> {
    const planRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USERS, userId, 'payPlans', 'primary'); // For now, we only support one 'primary' plan
    
    await setDoc(planRef, {
      ...plan,
      id: 'primary',
      organizationId: orgId,
      userId: userId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp() // setDoc with merge:true or separate check would be better but keeping it simple for setup
    }, { merge: true });
  },

  /**
   * Get the primary pay plan for a user
   */
  async getPrimaryPayPlan(orgId: string, userId: string): Promise<PayPlan | null> {
    const planRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USERS, userId, 'payPlans', 'primary');
    const snap = await getDoc(planRef);
    
    if (snap.exists()) {
      return snap.data() as PayPlan;
    }
    return null;
  }
};
