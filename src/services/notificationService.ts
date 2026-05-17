import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Notification, ActivityEventType } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItNotificationSystem & StripeItUnreadStateSystem
 * Centralized alert management for user-specific events.
 */

export const notificationService = {
  /**
   * Send a notification to a specific user.
   */
  async notify(userId: string, notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const path = `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}`;
    try {
      const notificationsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
      await addDoc(notificationsRef, {
        ...notification,
        read: false,
        createdAt: Date.now()
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Subscribe to a user's unread notifications.
   */
  subscribeToUnread(userId: string, callback: (notifications: Notification[]) => void) {
    const path = `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}`;
    const notificationsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
    const q = query(
      notificationsRef, 
      where('read', '==', false), 
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return onSnapshot(q, {
      next: (snapshot) => {
        const notifications = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now())
          };
        }) as Notification[];
        callback(notifications);
      },
      error: (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    });
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(userId: string, notificationId: string) {
    const path = `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}/${notificationId}`;
    const notificationRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS, notificationId);
    try {
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string) {
    const path = `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}`;
    const notificationsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
    const q = query(notificationsRef, where('read', '==', false));
    
    try {
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  }
};
