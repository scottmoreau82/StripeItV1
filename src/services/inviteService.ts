import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Invite, InviteStatus, UserRole } from '../types';

/**
 * InviteService
 * Manages organizational invites for Dealers/Admins to bring in Managers.
 */
export const inviteService = {
  async createInvite(orgId: string, invitedByUid: string, email: string, role: UserRole): Promise<string> {
    const inviteId = doc(collection(db, 'temp')).id; // Generate ID
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteRef = doc(db, 'invites', inviteId);

    const invite: Invite = {
      id: inviteId,
      email: email.toLowerCase().trim(),
      role,
      orgId,
      token,
      status: InviteStatus.PENDING,
      invitedBy: invitedByUid,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now(),
    };

    try {
      await setDoc(inviteRef, invite);
      return inviteId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `invites/${inviteId}`);
      throw error;
    }
  },

  async getInviteByToken(token: string): Promise<Invite | null> {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('token', '==', token), where('status', '==', InviteStatus.PENDING));
    
    try {
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const invite = snapshot.docs[0].data() as Invite;
      if (invite.expiresAt < Date.now()) {
        // Mark as expired
        await updateDoc(doc(db, 'invites', invite.id), { status: InviteStatus.EXPIRED });
        return null;
      }
      
      return invite;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'invites');
      throw error;
    }
  },

  async acceptInvite(inviteId: string): Promise<void> {
    const inviteRef = doc(db, 'invites', inviteId);
    try {
      await updateDoc(inviteRef, {
        status: InviteStatus.ACCEPTED,
        acceptedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invites/${inviteId}`);
      throw error;
    }
  },

  async getInvitesByOrg(orgId: string): Promise<Invite[]> {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('orgId', '==', orgId));
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Invite);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'invites');
      throw error;
    }
  }
};
