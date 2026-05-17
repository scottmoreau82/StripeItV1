import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Deal, UserRole, DealStatus } from '../types';

/**
 * StripeItReportSystem
 * Centralized data retrieval for permission-aware reporting.
 */

export interface ReportFilter {
  startDate: string;
  endDate: string;
  status?: DealStatus;
  userId?: string;
  newOrUsed?: 'new' | 'used';
}

export const reportService = {
  /**
   * Fetches deals based on filters and permissions.
   */
  async getReportDeals(orgId: string, filter: ReportFilter, userRole: UserRole, currentUserId: string): Promise<Deal[]> {
    const path = `organizations/${orgId}/deals`;
    const dealsRef = collection(db, 'organizations', orgId, 'deals');
    const constraints = [
      where('date', '>=', filter.startDate),
      where('date', '<=', filter.endDate),
      orderBy('date', 'desc')
    ];

    // Permission Boundary: Salespeople only see their own data
    if (userRole === 'sales') {
      constraints.push(where('userId', '==', currentUserId));
    } else if (filter.userId) {
      // Managers can filter by a specific user
      constraints.push(where('userId', '==', filter.userId));
    }

    if (filter.status) {
      constraints.push(where('status', '==', filter.status));
    }

    if (filter.newOrUsed) {
      constraints.push(where('newOrUsed', '==', filter.newOrUsed));
    }

    const q = query(dealsRef, ...constraints);
    try {
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deal[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  }
};
