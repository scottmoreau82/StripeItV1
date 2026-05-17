import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { ActivityEvent, ActivityEventType } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItActivityEventSystem
 * Low-latency event logging for organization-wide transparency.
 */

export const activityService = {
  /**
   * Log an event to the organization's activity feed.
   */
  async logEvent(orgId: string, event: Omit<ActivityEvent, 'id' | 'createdAt'>) {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.ACTIVITY}`;
    try {
      const activityRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.ACTIVITY);
      await addDoc(activityRef, {
        ...event,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log activity event:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Listen for real-time activity updates.
   */
  subscribeToActivity(orgId: string, callback: (events: ActivityEvent[]) => void, maxResults = 50) {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.ACTIVITY}`;
    const activityRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.ACTIVITY);
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(maxResults));

    return onSnapshot(q, {
      next: (snapshot) => {
        const events = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
          };
        }) as ActivityEvent[];
        callback(events);
      },
      error: (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    });
  },

  /**
   * Fetch recent activity events.
   */
  async getRecentActivity(orgId: string, maxResults = 20): Promise<ActivityEvent[]> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.ACTIVITY}`;
    const activityRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.ACTIVITY);
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(maxResults));
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
        };
      }) as ActivityEvent[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  }
};
