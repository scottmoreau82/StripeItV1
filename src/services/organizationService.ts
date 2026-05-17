import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Organization, SubscriptionTier, OrganizationStatus } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItOrganizationService
 * Handles organizational metadata and administrative controls.
 */
export const organizationService = {
  /**
   * Fetches the organization document.
   */
  async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      const snap = await getDoc(orgRef);
      
      if (!snap.exists()) return null;
      
      const data = snap.data();
      return {
        ...data,
        id: snap.id,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt,
      } as Organization;
    } catch (error) {
      console.error("Error fetching organization:", error);
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.ORGANIZATIONS}/${orgId}`);
      throw error;
    }
  },

  /**
   * Updates organization tier and status.
   * Strictly for Admin use.
   */
  async updateOrgTierAndStatus(
    orgId: string, 
    userId: string,
    updates: { tier: SubscriptionTier; status: OrganizationStatus }
  ): Promise<void> {
    try {
      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      await setDoc(orgRef, {
        subscriptionTier: updates.tier,
        status: updates.status,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      }, { merge: true });
    } catch (error) {
      console.error("Error updating organization tier/status:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.ORGANIZATIONS}/${orgId}`);
      throw error;
    }
  },

  /**
   * Updates the organization's log configuration.
   */
  async updateLogConfig(orgId: string, config: any): Promise<void> {
    try {
      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      await setDoc(orgRef, {
        logConfig: {
          ...config,
          updatedAt: Date.now()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating log config:", error);
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.ORGANIZATIONS}/${orgId}`);
      throw error;
    }
  }
};
