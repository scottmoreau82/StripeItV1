import { collection, doc, setDoc, query, where, getDocs, orderBy, limit, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DealerDeal } from '../types';

/**
 * DealerService
 * Handles organizational deal logging for the Dealer tier.
 */
export const dealerService = {
  async saveDeal(orgId: string, userId: string, dealData: Partial<DealerDeal>, dealId?: string): Promise<string> {
    const isNew = !dealId;
    const finalDealId = dealId || doc(collection(db, 'temp')).id;
    const dealRef = doc(db, 'organizations', orgId, 'dealerDeals', finalDealId);

    const fullData = {
      ...dealData,
      id: finalDealId,
      orgId,
      createdByUserId: userId,
      createdAt: isNew ? Date.now() : dealData.createdAt,
      updatedAt: Date.now(),
    };

    await setDoc(dealRef, fullData, { merge: true });
    return finalDealId;
  },

  async deleteDeal(orgId: string, dealId: string): Promise<void> {
    const dealRef = doc(db, 'organizations', orgId, 'dealerDeals', dealId);
    await deleteDoc(dealRef);
  },

  async getDeals(orgId: string, limitCount: number = 50): Promise<DealerDeal[]> {
    const dealsRef = collection(db, 'organizations', orgId, 'dealerDeals');
    const q = query(
      dealsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DealerDeal);
  },

  async getDealsByDate(orgId: string, date: string): Promise<DealerDeal[]> {
    const dealsRef = collection(db, 'organizations', orgId, 'dealerDeals');
    const q = query(
      dealsRef,
      where('date', '==', date),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DealerDeal);
  }
};
