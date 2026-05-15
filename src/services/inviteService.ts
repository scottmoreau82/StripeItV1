import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invite, InviteStatus, UserRole, UserProfile, ActivityEventType } from '../types';
import { userService } from './userService';
import { notificationService } from './notificationService';

/**
 * InviteService
 * Manages organizational invites for Dealers/Admins to bring in Managers.
 */
export const inviteService = {
  async createInvite(orgId: string, invitedBy: UserProfile, email: string, role: UserRole): Promise<string> {
    const inviteEmail = email.toLowerCase().trim();
    
    // 1. Verify User Exists
    const existingUser = await userService.getUserByEmail(inviteEmail);
    if (!existingUser) {
      throw new Error('Only existing users can be invited to manage a Dealer Deal Board.');
    }

    // 2. Domain Restriction Check
    const dealerDomain = invitedBy.email.split('@')[1]?.toLowerCase();
    const invitedDomain = inviteEmail.split('@')[1]?.toLowerCase();

    if (dealerDomain !== invitedDomain) {
      throw new Error(`Domain mismatch. You may only invite users with a @${dealerDomain} email address.`);
    }

    // 3. Prevent duplicate active invites
    const existingInvites = await this.getInvitesByOrg(orgId);
    if (existingInvites.some(inv => inv.email === inviteEmail && inv.status === InviteStatus.PENDING)) {
      throw new Error('A pending invite already exists for this user.');
    }

    // 4. Resolve Org Name
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    const orgName = orgDoc.exists() ? orgDoc.data().name : 'StripeIt Dealer';

    const inviteId = doc(collection(db, 'temp')).id;
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const inviteRef = doc(db, 'invites', inviteId);

    const invite: Invite = {
      id: inviteId,
      email: inviteEmail,
      role,
      orgId,
      orgName,
      token,
      status: InviteStatus.PENDING,
      invitedBy: invitedBy.uid,
      invitedByDisplayName: invitedBy.displayName,
      invitedUserId: existingUser.uid,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: Date.now(),
    };

    await setDoc(inviteRef, invite);

    // 5. Trigger Notification to invited user
    await notificationService.notify(existingUser.uid, {
      userId: existingUser.uid,
      type: ActivityEventType.ORG_INVITE,
      title: 'Organizational Invite',
      message: `${invitedBy.displayName} has invited you to manage the Deal Board at ${orgName}.`,
      link: `/invites/${inviteId}`,
      metadata: { inviteId, orgId, orgName, inviter: invitedBy.displayName }
    });

    return inviteId;
  },

  async getInviteById(inviteId: string): Promise<Invite | null> {
    const inviteDoc = await getDoc(doc(db, 'invites', inviteId));
    if (!inviteDoc.exists()) return null;
    return inviteDoc.data() as Invite;
  },

  async getInviteByToken(token: string): Promise<Invite | null> {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('token', '==', token), where('status', '==', InviteStatus.PENDING));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const invite = snapshot.docs[0].data() as Invite;
    if (invite.expiresAt < Date.now()) {
      // Mark as expired
      await updateDoc(doc(db, 'invites', invite.id), { status: InviteStatus.EXPIRED });
      return null;
    }
    
    return invite;
  },

  async acceptInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await this.getInviteById(inviteId);
    if (!invite || invite.status !== InviteStatus.PENDING) {
      throw new Error('Invite is no longer valid.');
    }

    if (invite.invitedUserId !== userId) {
      throw new Error('This invite is not intended for the current user.');
    }

    // Update user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      orgId: invite.orgId,
      role: invite.role,
      updatedAt: serverTimestamp()
    });

    // Mark invite as accepted
    const inviteRef = doc(db, 'invites', inviteId);
    await updateDoc(inviteRef, {
      status: InviteStatus.ACCEPTED,
      acceptedAt: Date.now()
    });
  },

  async declineInvite(inviteId: string, userId: string): Promise<void> {
    const invite = await this.getInviteById(inviteId);
    if (!invite || invite.status !== InviteStatus.PENDING) return;
    
    if (invite.invitedUserId !== userId) {
      throw new Error('Unauthorized');
    }

    await updateDoc(doc(db, 'invites', inviteId), {
      status: InviteStatus.CANCELLED,
      updatedAt: serverTimestamp()
    });
  },

  async getInvitesByOrg(orgId: string): Promise<Invite[]> {
    const invitesRef = collection(db, 'invites');
    const q = query(invitesRef, where('orgId', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Invite);
  },

  async getPendingInvitesForUser(userId: string): Promise<Invite[]> {
    const invitesRef = collection(db, 'invites');
    const q = query(
      invitesRef, 
      where('invitedUserId', '==', userId), 
      where('status', '==', InviteStatus.PENDING)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Invite);
  }
};
