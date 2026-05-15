import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { MonthlySpiff } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItSpiffSystem
 * Service for managing 1-time monthly/global SPIFF adjustments.
 */
export const spiffService = {
  /**
   * Get all SPIFFs for a user in a specific month
   */
  async getMonthlySpiffs(orgId: string, userId: string, month: string): Promise<MonthlySpiff[]> {
    try {
      const spiffsRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, 'monthlySpiffs');
      const q = query(
        spiffsRef,
        where('userId', '==', userId),
        where('month', '==', month),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toMillis?.() || doc.data().updatedAt,
      } as MonthlySpiff));
    } catch (error) {
      console.error('Error fetching monthly spiffs:', error);
      handleFirestoreError(error, OperationType.LIST, `organizations/${orgId}/monthlySpiffs`);
      return [];
    }
  },

  /**
   * Create or update a monthly SPIFF
   */
  async saveMonthlySpiff(orgId: string, spiffData: Partial<MonthlySpiff>): Promise<string> {
    try {
      const spiffsRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, 'monthlySpiffs');
      
      if (spiffData.id) {
        // Update existing
        const { id, createdAt, updatedAt, ...updates } = spiffData;
        const docRef = doc(spiffsRef, id);
        
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
        return id;
      } else {
        // Create new
        const docRef = doc(spiffsRef);
        const id = docRef.id;
        
        await setDoc(docRef, {
          ...spiffData,
          id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return id;
      }
    } catch (error) {
      console.error('Error saving monthly spiff:', error);
      handleFirestoreError(error, OperationType.WRITE, `organizations/${orgId}/monthlySpiffs`);
      throw error;
    }
  },

  /**
   * Delete a monthly SPIFF
   */
  async deleteMonthlySpiff(orgId: string, spiffId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, 'monthlySpiffs', spiffId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting monthly spiff:', error);
      handleFirestoreError(error, OperationType.DELETE, `organizations/${orgId}/monthlySpiffs/${spiffId}`);
      throw error;
    }
  }
};
