import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Invite, InviteStatus, UserRole, SubscriptionTier } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItInviteSystem
 *
 * Two join paths for dealer orgs:
 *
 * 1. REUSABLE JOIN CODE — Owner generates one code for the whole org.
 *    Stored on the org doc as `joinCode` / `joinCodeActive`.
 *    Salesperson enters it on signup → gets added as salesperson.
 *
 * 2. EMAIL INVITE — Owner enters email + role → creates a pending Invite doc.
 *    Invitee signs up / logs in → claims the invite by token → gets the
 *    pre-assigned role.
 *
 * Both paths write orgId / role / subscriptionTier to the user doc via
 * claimInvite / claimJoinCode.
 */

// ─── helpers ─────────────────────────────────────────────────────────────────

const orgDoc = (orgId: string) =>
  doc(db, COLLECTIONS.ORGANIZATIONS, orgId);

const invitesCol = () =>
  collection(db, 'invites');

const inviteDoc = (inviteId: string) =>
  doc(db, 'invites', inviteId);

const userDoc = (userId: string) =>
  doc(db, COLLECTIONS.USERS, userId);

/** Generate a random uppercase alphanumeric code (e.g. "STRIPE-A3X9KM"). */
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `STRIPE-${rand}`;
};

/** Generate a cryptographically-safe invite token. */
const generateToken = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

// ─── Join Code ────────────────────────────────────────────────────────────────

export const inviteService = {
  /**
   * Get the current active join code for an org.
   * Returns null if none is set or it has been deactivated.
   */
  async getJoinCode(orgId: string): Promise<string | null> {
    const snap = await getDoc(orgDoc(orgId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return data.joinCodeActive ? (data.joinCode ?? null) : null;
  },

  /**
   * Generate a new join code for the org (replaces any existing one).
   */
  async generateJoinCode(orgId: string): Promise<string> {
    const code = generateCode();
    await updateDoc(orgDoc(orgId), {
      joinCode: code,
      joinCodeActive: true,
      joinCodeGeneratedAt: serverTimestamp(),
    });
    return code;
  },

  /**
   * Deactivate the current join code. The code is preserved for audit but
   * joinCodeActive = false means it won't be accepted.
   */
  async deactivateJoinCode(orgId: string): Promise<void> {
    await updateDoc(orgDoc(orgId), {
      joinCodeActive: false,
    });
  },

  /**
   * Look up an org by join code.
   * Returns { orgId, orgName } or null if no matching active code.
   */
  async lookupJoinCode(code: string): Promise<{ orgId: string; orgName: string } | null> {
    const q = query(
      collection(db, COLLECTIONS.ORGANIZATIONS),
      where('joinCode', '==', code.toUpperCase().trim()),
      where('joinCodeActive', '==', true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const data = snap.docs[0].data();
    return { orgId: snap.docs[0].id, orgName: data.name ?? '' };
  },

  /**
   * Claim a join code: write orgId / role / tier to the user doc.
   * Called after a user signs up and enters the code.
   */
  async claimJoinCode(userId: string, code: string): Promise<{ orgId: string; orgName: string }> {
    const org = await inviteService.lookupJoinCode(code);
    if (!org) throw new Error('Invalid or inactive join code.');

    await updateDoc(userDoc(userId), {
      orgId: org.orgId,
      role: UserRole.SALES,
      subscriptionTier: SubscriptionTier.ORGANIZATION,
      joinedOrgAt: serverTimestamp(),
    });
    return org;
  },

  // ─── Email Invites ──────────────────────────────────────────────────────────

  /**
   * Create a pending invite for an email address with a pre-assigned role.
   * The invitee signs up and the invite is matched by email on claim.
   */
  async createInvite(
    orgId: string,
    email: string,
    role: UserRole.SALES | UserRole.MANAGER,
    invitedBy: string
  ): Promise<Invite> {
    const ref = doc(invitesCol());
    const invite: Invite = {
      id: ref.id,
      email: email.toLowerCase().trim(),
      role,
      orgId,
      token: generateToken(),
      status: InviteStatus.PENDING,
      invitedBy,
      expiresAt: 0, // no expiry per spec — active until cancelled
      createdAt: Date.now(),
    };
    await setDoc(ref, invite);
    return invite;
  },

  /**
   * List all pending invites for an org.
   */
  async listInvites(orgId: string): Promise<Invite[]> {
    const q = query(invitesCol(), where('orgId', '==', orgId), where('status', '==', InviteStatus.PENDING));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Invite);
  },

  /**
   * Cancel a pending invite.
   */
  async cancelInvite(inviteId: string): Promise<void> {
    await updateDoc(inviteDoc(inviteId), { status: InviteStatus.CANCELLED });
  },

  /**
   * Look up a pending invite by email address.
   * Called on login/signup to check if the user has a waiting invite.
   */
  async lookupInviteByEmail(email: string): Promise<Invite | null> {
    const q = query(
      invitesCol(),
      where('email', '==', email.toLowerCase().trim()),
      where('status', '==', InviteStatus.PENDING)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as Invite;
  },

  /**
   * Claim an invite: write orgId / role / tier to the user doc and mark
   * the invite as accepted. Called after a user with a pending invite logs in.
   */
  async claimInvite(userId: string, invite: Invite): Promise<void> {
    const batch = writeBatch(db);

    // Update user doc
    batch.update(userDoc(userId), {
      orgId: invite.orgId,
      role: invite.role,
      subscriptionTier: SubscriptionTier.ORGANIZATION,
      inviteId: invite.id,
      inviteToken: invite.token,
      joinedOrgAt: serverTimestamp(),
    });

    // Mark invite accepted
    batch.update(inviteDoc(invite.id), {
      status: InviteStatus.ACCEPTED,
      acceptedAt: Date.now(),
    });

    await batch.commit();
  },
};
