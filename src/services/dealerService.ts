import { collection, doc, setDoc, query, where, getDocs, orderBy, limit, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DealerDeal } from '../types';

/**
 * DealerService
 * Handles organizational deal logging for the Dealer tier.
 */
export const dealerService = {
  async saveDeal(orgId: string, userId: string, dealData: Partial<DealerDeal>, dealId?: string): Promise<string> {
    const isNew = !dealId;
    const finalDealId = dealId || doc(collection(db, 'temp')).id;
    const path = `organizations/${orgId}/dealerDeals/${finalDealId}`;
    const dealRef = doc(db, 'organizations', orgId, 'dealerDeals', finalDealId);

    const fullData = {
      ...dealData,
      id: finalDealId,
      orgId,
      createdByUserId: userId,
      createdAt: isNew ? Date.now() : dealData.createdAt,
      updatedAt: Date.now(),
    };

    try {
      await setDoc(dealRef, fullData, { merge: true });
      return finalDealId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  async deleteDeal(orgId: string, dealId: string): Promise<void> {
    const path = `organizations/${orgId}/dealerDeals/${dealId}`;
    const dealRef = doc(db, 'organizations', orgId, 'dealerDeals', dealId);
    try {
      await deleteDoc(dealRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  async getDeals(orgId: string, limitCount: number = 50): Promise<DealerDeal[]> {
    const path = `organizations/${orgId}/dealerDeals`;
    const dealsRef = collection(db, 'organizations', orgId, 'dealerDeals');
    const q = query(
      dealsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DealerDeal);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  },

  async getDealsByDate(orgId: string, date: string): Promise<DealerDeal[]> {
    const path = `organizations/${orgId}/dealerDeals`;
    const dealsRef = collection(db, 'organizations', orgId, 'dealerDeals');
    const q = query(
      dealsRef,
      where('date', '==', date),
      orderBy('createdAt', 'asc')
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DealerDeal);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  },

  async getMTDDeals(orgId: string): Promise<DealerDeal[]> {
    const path = `organizations/${orgId}/dealerDeals`;
    const dealsRef = collection(db, 'organizations', orgId, 'dealerDeals');
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const dateStr = startOfMonth.toISOString().split('T')[0];
    
    const q = query(
      dealsRef,
      where('date', '>=', dateStr),
      orderBy('date', 'desc')
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DealerDeal);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  },

  async getDealsByRange(orgId: string, startDate: string, endDate: string): Promise<DealerDeal[]> {
    const path = `organizations/${orgId}/dealerDeals`;
    const dealsRef = collection(db, 'organizations', orgId, 'dealerDeals');
    
    const q = query(
      dealsRef,
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DealerDeal);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  }
};
