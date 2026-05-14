import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, SubscriptionTier } from '../types';
import { COLLECTIONS as COLL_CONST } from '../constants';

/**
 * StripeItUserManagementSystem
 * Service for administrative user operations.
 */
export const userService = {
  /**
   * Fetches users. If orgId is provided, filters by organization.
   * If orgId is omitted, fetches all users (requires global admin permissions).
   */
  async getUsers(orgId?: string): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, COLL_CONST.USERS);
      let q = query(usersRef);
      
      if (orgId && orgId !== 'global') {
        q = query(usersRef, where('orgId', '==', orgId));
      }
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          uid: doc.id,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
        } as any as UserProfile;
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      handleFirestoreError(error, OperationType.LIST, COLL_CONST.USERS);
      throw error;
    }
  },

  /**
   * Updates a user's subscription tier.
   * Only authorized admins or developers can trigger this.
   */
  async updateSubscriptionTier(userId: string, tier: SubscriptionTier): Promise<void> {
    try {
      const userRef = doc(db, COLL_CONST.USERS, userId);
      await updateDoc(userRef, {
        subscriptionTier: tier,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating subscription tier:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_CONST.USERS}/${userId}`);
      throw error;
    }
  },

  /**
   * Updates a user's role.
   */
  async updateUserRole(userId: string, role: string): Promise<void> {
    try {
      const userRef = doc(db, COLL_CONST.USERS, userId);
      await updateDoc(userRef, {
        role,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating user role:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${COLL_CONST.USERS}/${userId}`);
      throw error;
    }
  }
};
