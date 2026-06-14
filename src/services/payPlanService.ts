import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PayPlan } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItPayPlanServiceSystem & StripeItCommissionSystem
 * Core CRUD logic for managing user pay plans in Firestore.
 */

export const payPlanService = {
  /**
   * Create or Update a Pay Plan
   */
  async savePayPlan(orgId: string, userId: string, plan: Omit<PayPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>): Promise<void> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USERS}/${userId}/payPlans/primary`;
    const planRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USERS, userId, 'payPlans', 'primary'); 
    
    try {
      await setDoc(planRef, {
        ...plan,
        id: 'primary',
        organizationId: orgId,
        userId: userId,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Write ONLY the template-link fields on a user's primary pay plan
   * (sourceTemplateId / override / isOverridden) without disturbing the rest.
   * Used by the template service for assignment & override. Uses merge so a
   * user with no prior plan doc still gets one created.
   */
  async savePayPlanLink(
    orgId: string,
    userId: string,
    link: { sourceTemplateId?: string; override?: Partial<PayPlan>; isOverridden?: boolean }
  ): Promise<void> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USERS}/${userId}/payPlans/primary`;
    const planRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USERS, userId, 'payPlans', 'primary');
    try {
      await setDoc(planRef, {
        id: 'primary',
        organizationId: orgId,
        userId,
        sourceTemplateId: link.sourceTemplateId ?? null,
        override: link.override ?? null,
        isOverridden: link.isOverridden ?? false,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Get the primary pay plan for a user
   */
  async getPrimaryPayPlan(orgId: string, userId: string): Promise<PayPlan | null> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USERS}/${userId}/payPlans/primary`;
    const planRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USERS, userId, 'payPlans', 'primary');
    try {
      const snap = await getDoc(planRef);
      
      if (snap.exists()) {
        return snap.data() as PayPlan;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      throw error;
    }
  }
};
