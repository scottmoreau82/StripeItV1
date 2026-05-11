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
import { db } from '@/src/lib/firebase';
import { ActivityEvent, ActivityEventType } from '../types';

/**
 * StripeItActivityEventSystem
 * Low-latency event logging for organization-wide transparency.
 */

export const activityService = {
  /**
   * Log an event to the organization's activity feed.
   */
  async logEvent(orgId: string, event: Omit<ActivityEvent, 'id' | 'createdAt'>) {
    try {
      const activityRef = collection(db, 'organizations', orgId, 'activity');
      await addDoc(activityRef, {
        ...event,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to log activity event:', error);
    }
  },

  /**
   * Listen for real-time activity updates.
   */
  subscribeToActivity(orgId: string, callback: (events: ActivityEvent[]) => void, maxResults = 50) {
    const activityRef = collection(db, 'organizations', orgId, 'activity');
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(maxResults));

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
        };
      }) as ActivityEvent[];
      callback(events);
    });
  },

  /**
   * Fetch recent activity events.
   */
  async getRecentActivity(orgId: string, maxResults = 20): Promise<ActivityEvent[]> {
    const activityRef = collection(db, 'organizations', orgId, 'activity');
    const q = query(activityRef, orderBy('createdAt', 'desc'), limit(maxResults));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
      };
    }) as ActivityEvent[];
  }
};
