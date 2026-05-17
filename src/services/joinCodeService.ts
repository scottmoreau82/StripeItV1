import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DealerJoinCode, JoinCodeStatus, UserProfile, UserRole } from '../types';

/**
 * JoinCodeService
 * Manages Dealer Join Codes for secure manager onboarding.
 */
export const joinCodeService = {
  /**
   * Generates a new join code
   */
  async createJoinCode(params: {
    organizationId: string;
    dealerName: string;
    dealerDomain?: string;
    createdBy: string;
    expiresInDays: number;
    maxUses: number;
    department: 'Retail' | 'Internet';
  }): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const codeId = doc(collection(db, 'temp')).id;
    const codeRef = doc(db, 'dealerJoinCodes', codeId);

    const joinCode: DealerJoinCode = {
      id: codeId,
      code,
      organizationId: params.organizationId,
      dealerName: params.dealerName,
      dealerDomain: params.dealerDomain,
      createdBy: params.createdBy,
      createdAt: Date.now(),
      expiresAt: Date.now() + (params.expiresInDays * 24 * 60 * 60 * 1000),
      maxUses: params.maxUses,
      usedCount: 0,
      usedBy: [],
      status: JoinCodeStatus.ACTIVE,
      department: params.department
    };

    try {
      await setDoc(codeRef, joinCode);
      return code;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `dealerJoinCodes/${codeId}`);
      throw error;
    }
  },

  /**
   * Fetches active join codes for an organization
   */
  async getJoinCodes(orgId: string): Promise<DealerJoinCode[]> {
    const codesRef = collection(db, 'dealerJoinCodes');
    const q = query(codesRef, where('organizationId', '==', orgId));
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DealerJoinCode);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'dealerJoinCodes');
      throw error;
    }
  },

  /**
   * Deactivates a join code
   */
  async deactivateJoinCode(codeId: string): Promise<void> {
    const codeRef = doc(db, 'dealerJoinCodes', codeId);
    try {
      await updateDoc(codeRef, { status: JoinCodeStatus.CANCELLED });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `dealerJoinCodes/${codeId}`);
      throw error;
    }
  },

  /**
   * Redeems a join code for a user
   */
  async redeemJoinCode(code: string, userProfile: UserProfile): Promise<{ dealerName: string }> {
    const codesRef = collection(db, 'dealerJoinCodes');
    const q = query(codesRef, where('code', '==', code.toUpperCase().trim()), where('status', '==', JoinCodeStatus.ACTIVE));
    
    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) throw new Error('Invalid join code.');
      
      const codeDoc = snapshot.docs[0];
      const codeData = codeDoc.data() as DealerJoinCode;
      
      // Validation
      if (userProfile.orgId && !userProfile.orgId.startsWith('PERSONAL-')) {
        throw new Error('You are already a member of an organization. Please contact your administrator.');
      }

      if (codeData.usedBy && codeData.usedBy.includes(userProfile.uid)) {
        throw new Error('You have already redeemed this code.');
      }

      if (codeData.expiresAt < Date.now()) {
        await updateDoc(codeDoc.ref, { status: JoinCodeStatus.EXPIRED });
        throw new Error('This code has expired.');
      }
      
      if (codeData.usedCount >= codeData.maxUses) {
        await updateDoc(codeDoc.ref, { status: JoinCodeStatus.USED });
        throw new Error('This code has already been used.');
      }

      if (codeData.dealerDomain && userProfile.email) {
        const userDomain = userProfile.email.split('@')[1]?.toLowerCase();
        if (userDomain !== codeData.dealerDomain.toLowerCase()) {
          throw new Error('Your email domain does not match this dealership.');
        }
      }

      // Update user and code in a transaction
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userProfile.uid);
        
        transaction.update(userRef, {
          orgId: codeData.organizationId,
          role: UserRole.MANAGER,
          department: codeData.department,
          updatedAt: Date.now()
        });
        
        transaction.update(codeDoc.ref, {
          usedCount: codeData.usedCount + 1,
          usedBy: [...codeData.usedBy, userProfile.uid],
          status: (codeData.usedCount + 1 >= codeData.maxUses) ? JoinCodeStatus.USED : JoinCodeStatus.ACTIVE
        });
      });

      return { dealerName: codeData.dealerName };
    } catch (error: any) {
      console.error("Redeem Error:", error);
      if (error.message.includes('Invalid') || error.message.includes('expired') || error.message.includes('used') || error.message.includes('domain')) {
        throw error;
      }
      throw new Error('Unable to join this dealership.');
    }
  }
};
