import { 
  collection, 
  addDoc, 
  setDoc,
  updateDoc, 
  doc, 
  query, 
  getDocs, 
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { FeedbackReport, FeedbackStatus } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItFeedbackSystem - Centralized Service
 * Handles bug reports, feature requests, and administrative review operations.
 */
export const feedbackService = {
  /**
   * Submits a new feedback report (bug or feature) to Firestore.
   * Handles optional screenshot upload to Firebase Storage.
   */
  async submitFeedback(feedback: Omit<FeedbackReport, 'id' | 'createdAt' | 'updatedAt' | 'status'>, attachment?: File): Promise<string> {
    const feedbackRef = collection(db, COLLECTIONS.FEEDBACK_REPORTS);
    const newDocRef = doc(feedbackRef);
    const feedbackId = newDocRef.id;
    
    let screenshotUrl = '';
    let attachmentPath = '';
    let attachmentFileName = '';
    let attachmentContentType = '';
    let attachmentSize = 0;

    if (attachment) {
      try {
        const timestamp = Date.now();
        const safeFileName = attachment.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const userId = auth.currentUser?.uid;
        
        attachmentPath = `feedbackAttachments/${userId}/${feedbackId}/${timestamp}-${safeFileName}`;
        const storageRef = ref(storage, attachmentPath);
        
        const uploadResult = await uploadBytes(storageRef, attachment);
        screenshotUrl = await getDownloadURL(uploadResult.ref);
        attachmentFileName = attachment.name;
        attachmentContentType = attachment.type;
        attachmentSize = attachment.size;
      } catch (error) {
        console.error('StripeItFeedbackSystem - File upload failed:', error);
        throw new Error('Screenshot upload failed. Please try again.');
      }
    }

    // Clean undefined values to prevent Firestore errors
    const cleanedFeedback = Object.fromEntries(
      Object.entries(feedback).filter(([_, v]) => v !== undefined)
    );

    const newFeedback = {
      ...cleanedFeedback,
      id: feedbackId,
      screenshotUrl,
      attachmentPath,
      attachmentFileName,
      attachmentContentType,
      attachmentSize,
      status: FeedbackStatus.NEW,
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
      link: report.screenshotUrl || 'No attachment'
    });
    
    // NOTE: Real email integration requires a backend provider.
    // This scaffold ensures the system is ready for that hook.
  }
};
