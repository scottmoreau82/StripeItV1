import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DealerAccessRequest, DealerRequestStatus, UserRole, SubscriptionTier, OrganizationStatus } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItDealerRequestService
 * Handles the submission and lifecycle of Dealer Access Requests.
 */
export const dealerRequestService = {
  /**
   * Submits a new dealer access request.
   */
  async submitRequest(requestData: Partial<DealerAccessRequest>): Promise<string> {
    try {
      const requestsRef = collection(db, COLLECTIONS.DEALER_REQUESTS);
      const newRequestRef = doc(requestsRef);
      
      const fullRequest: DealerAccessRequest = {
        id: newRequestRef.id,
        userId: requestData.userId!,
        userEmail: requestData.userEmail!,
        userName: requestData.userName!,
        dealershipName: requestData.dealershipName!,
        workEmail: requestData.workEmail!,
        roleTitle: requestData.roleTitle!,
        website: requestData.website!,
        phoneNumber: requestData.phoneNumber!,
        notes: requestData.notes || '',
        status: DealerRequestStatus.PENDING,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(newRequestRef, {
        ...fullRequest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newRequestRef.id;
    } catch (error) {
      console.error("Error submitting dealer request:", error);
      handleFirestoreError(error, OperationType.CREATE, COLLECTIONS.DEALER_REQUESTS);
      throw error;
    }
  },

  /**
   * Fetches all requests for admin review.
   */
  async getRequests(status?: DealerRequestStatus): Promise<DealerAccessRequest[]> {
    try {
      const requestsRef = collection(db, COLLECTIONS.DEALER_REQUESTS);
      let q = query(requestsRef);
      
      if (status) {
        q = query(requestsRef, where('status', '==', status));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
          updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
          reviewedAt: data.reviewedAt?.toMillis?.() || data.reviewedAt,
        } as DealerAccessRequest;
      });
    } catch (error) {
      console.error("Error fetching dealer requests:", error);
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DEALER_REQUESTS);
      throw error;
    }
  },

  /**
   * Fetches a single request by user ID.
   */
  async getRequestByUserId(userId: string): Promise<DealerAccessRequest | null> {
    try {
      const requestsRef = collection(db, COLLECTIONS.DEALER_REQUESTS);
      const q = query(requestsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
        reviewedAt: data.reviewedAt?.toMillis?.() || data.reviewedAt,
      } as DealerAccessRequest;
    } catch (error) {
      console.error("Error fetching user dealer request:", error);
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.DEALER_REQUESTS);
      throw error;
    }
  },

  /**
   * Approves a dealer request.
   * Performs a batch operation to approve the request, create the org, and upgrade the user.
   */
  async approveRequest(requestId: string, adminId: string, adminNotes?: string): Promise<void> {
    try {
      const requestRef = doc(db, COLLECTIONS.DEALER_REQUESTS, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) throw new Error("Request not found");
      const request = requestSnap.data() as DealerAccessRequest;
      
      if (request.status !== DealerRequestStatus.PENDING) {
        throw new Error("Request is not in pending state");
      }

      const batch = writeBatch(db);
      
      // 1. Update Request
      batch.update(requestRef, {
        status: DealerRequestStatus.APPROVED,
        adminNotes: adminNotes || '',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        updatedAt: serverTimestamp()
      });

      // 2. Create Organization
      const orgId = `DEALER-${request.userId.slice(0, 5)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      batch.set(orgRef, {
        id: orgId,
        name: request.dealershipName,
        ownerId: request.userId,
        subscriptionTier: SubscriptionTier.ORGANIZATION,
        status: OrganizationStatus.ACTIVE,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Upgrade User
      const userRef = doc(db, COLLECTIONS.USERS, request.userId);
      batch.update(userRef, {
        orgId: orgId,
        role: UserRole.DEALER_OWNER,
        subscriptionTier: SubscriptionTier.ORGANIZATION,
        updatedAt: serverTimestamp()
      });

      // 4. Create welcome notification
      const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
      batch.set(notificationRef, {
        userId: request.userId,
        title: 'Dealer Access Approved',
        message: `Welcome to the operational tier! Your dealership '${request.dealershipName}' has been activated.`,
        read: false,
        type: 'announcement',
        createdAt: serverTimestamp()
      });

      await batch.commit();
      
      // Trigger activity event if applicable
      try {
        const { activityService } = await import('./activityService');
        await activityService.logEvent('SYSTEM', {
          type: 'announcement' as any,
          message: `Approved dealer request for ${request.dealershipName} (${request.userEmail})`,
          userId: adminId,
          userName: 'System Admin',
          orgId: 'SYSTEM'
        });
      } catch (e) {
        console.warn("Failed to log activity for approval:", e);
      }
      
    } catch (error) {
      console.error("Error approving dealer request:", error);
      handleFirestoreError(error, OperationType.UPDATE, COLLECTIONS.DEALER_REQUESTS);
      throw error;
    }
  },

  /**
   * Rejects a dealer request.
   */
  async rejectRequest(requestId: string, adminId: string, adminNotes?: string): Promise<void> {
    try {
      const requestRef = doc(db, COLLECTIONS.DEALER_REQUESTS, requestId);
      const requestSnap = await getDoc(requestRef);
      
      if (!requestSnap.exists()) throw new Error("Request not found");
      const request = requestSnap.data() as DealerAccessRequest;

      await updateDoc(requestRef, {
        status: DealerRequestStatus.REJECTED,
        adminNotes: adminNotes || '',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminId,
        updatedAt: serverTimestamp()
      });

      // Notify User
      const notificationRef = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
      await setDoc(notificationRef, {
        userId: request.userId,
        title: 'Dealer Access Request Update',
        message: `Your request for Dealer access has been reviewed and declined. ${adminNotes ? 'Reason: ' + adminNotes : ''}`,
        read: false,
        type: 'announcement',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error rejecting dealer request:", error);
      handleFirestoreError(error, OperationType.UPDATE, COLLECTIONS.DEALER_REQUESTS);
      throw error;
    }
  }
};
