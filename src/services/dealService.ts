import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Deal, DealStatus } from '../types';

/**
 * StripeItDealServiceSystem
 * Handles all Firestore interactions for car deals.
 */

const COLLECTION_NAME = 'deals';

// Helper to get organic deals collection ref (for top-level queries if needed, 
// though my blueprint uses organizations/{orgId}/deals)
const getDealsRef = (orgId: string) => {
  return collection(db, 'organizations', orgId, 'deals');
};

export const dealService = {
  /**
   * Create a new deal
   */
  async createDeal(orgId: string, dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>): Promise<string> {
    const dealsRef = getDealsRef(orgId);
    const docRef = await addDoc(dealsRef, {
      ...dealData,
      orgId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Get a single deal by ID
   */
  async getDeal(orgId: string, dealId: string): Promise<Deal | null> {
    const docRef = doc(db, 'organizations', orgId, 'deals', dealId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Deal;
    }
    return null;
  },

  /**
   * Update an existing deal
   */
  async updateDeal(orgId: string, dealId: string, updates: Partial<Deal>): Promise<void> {
    const docRef = doc(db, 'organizations', orgId, 'deals', dealId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a deal
   */
  async deleteDeal(orgId: string, dealId: string): Promise<void> {
    const docRef = doc(db, 'organizations', orgId, 'deals', dealId);
    await deleteDoc(docRef);
  },

  /**
   * Fetch deals for an organization with optional filters
   */
  async getOrgDeals(orgId: string, filters: {
    userId?: string;
    dealershipId?: string;
    status?: DealStatus;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Deal[]> {
    let q = query(getDealsRef(orgId), orderBy('createdAt', 'desc'));

    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }

    if (filters.dealershipId) {
      q = query(q, where('dealershipId', '==', filters.dealershipId));
    }

    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    // Date filtering (assuming string format YYYY-MM-DD or similar)
    if (filters.startDate) {
      q = query(q, where('date', '>=', filters.startDate));
    }
    if (filters.endDate) {
      q = query(q, where('date', '<=', filters.endDate));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deal));
  },

  /**
   * Fetch deals for a specific salesperson
   */
  async getUserDeals(orgId: string, userId: string): Promise<Deal[]> {
    return this.getOrgDeals(orgId, { userId });
  },

  /**
   * Fetch deals for a specific month
   * monthStr: 'YYYY-MM'
   */
  async getDealsByMonth(orgId: string, monthStr: string): Promise<Deal[]> {
    const startDate = `${monthStr}-01`;
    const endDate = `${monthStr}-31`; // Simplified for now
    return this.getOrgDeals(orgId, { startDate, endDate });
  }
};
