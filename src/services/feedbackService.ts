import { 
  collection, 
  setDoc,
  updateDoc, 
  doc, 
  query, 
  where,
  getDocs, 
  orderBy,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { FeedbackReport, FeedbackStatus } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItFeedbackSystem - Centralized Service
 * Handles bug reports, feature requests, and administrative review operations.
 */
export const feedbackService = {
  /**
   * Submits a new feedback report (bug or feature) to Firestore.
   */
  async submitFeedback(feedback: Omit<FeedbackReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<string> {
    const feedbackRef = collection(db, COLLECTIONS.FEEDBACK_REPORTS);
    const newDocRef = doc(feedbackRef);
    const feedbackId = newDocRef.id;
    
    // Clean undefined values to prevent Firestore errors
    const cleanedFeedback = Object.fromEntries(
      Object.entries(feedback).filter(([_, v]) => v !== undefined)
    );

    const newFeedback = {
      ...cleanedFeedback,
      id: feedbackId,
      status: FeedbackStatus.NEW,
      read: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    try {
      await setDoc(newDocRef, newFeedback);
      
      // Trigger notification scaffold
      this.notifyAdmin(newFeedback);

      return feedbackId;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.FEEDBACK_REPORTS);
      throw error;
    }
  },

  /**
   * Fetches all feedback reports for administrative review.
   * Only accessible by authorized admins via Security Rules.
   */
  async getReports(): Promise<FeedbackReport[]> {
    const feedbackRef = collection(db, COLLECTIONS.FEEDBACK_REPORTS);
    const q = query(feedbackRef, orderBy('createdAt', 'desc'));
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackReport));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.FEEDBACK_REPORTS);
      throw error;
    }
  },

  /**
   * StripeItNotificationScaffold - Subscribes to unread feedback reports.
   * Only for admins.
   */
  subscribeToUnread(callback: (reports: FeedbackReport[]) => void) {
    const feedbackRef = collection(db, COLLECTIONS.FEEDBACK_REPORTS);
    const q = query(
      feedbackRef, 
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeedbackReport));
      callback(reports);
    });
  },

  /**
   * Marks a feedback report as read.
   */
  async markAsRead(reportId: string): Promise<void> {
    const reportRef = doc(db, COLLECTIONS.FEEDBACK_REPORTS, reportId);
    try {
      await updateDoc(reportRef, {
        read: true,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.FEEDBACK_REPORTS}/${reportId}`);
      throw error;
    }
  },

  /**
   * Marks all unread feedback reports as read.
   */
  async markAllAsRead(): Promise<void> {
    const feedbackRef = collection(db, COLLECTIONS.FEEDBACK_REPORTS);
    const q = query(feedbackRef, where('read', '==', false));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true, updatedAt: Date.now() });
    });
    
    await batch.commit();
  },

  /**
   * Updates the status of an existing feedback report.
   */
  async updateStatus(reportId: string, status: FeedbackStatus): Promise<void> {
    const reportRef = doc(db, COLLECTIONS.FEEDBACK_REPORTS, reportId);
    try {
      await updateDoc(reportRef, {
        status,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.FEEDBACK_REPORTS}/${reportId}`);
      throw error;
    }
  },

  /**
   * StripeItNotificationScaffold
   * Prepares notification data. In production, this would trigger a server-side
   * email via Cloud Functions + SendGrid/Postmark/etc.
   */
  async notifyAdmin(report: any) {
    console.log('StripeItFeedbackSystem - Admin Notification Triggered:', {
      to: 'scottmoreau82@gmail.com',
      subject: `New ${report.type.toUpperCase()} Report: ${report.title}`,
      severity: report.severity || report.importance || 'N/A',
      user: report.userEmail,
      device: `${report.deviceInfo?.os} (${report.deviceInfo?.browser})`
    });
    
    // NOTE: Real email integration requires a backend provider.
    // This scaffold ensures the system is ready for that hook.
  }
};
