import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, getFriendlyErrorMessage } from '../lib/firebase';
import { UserProfile, SubscriptionTier, UserRole } from '../types';
import { STRIPEIT_DEVELOPER_EMAIL, COLLECTIONS } from '../constants';
import { Typography } from '../components/ui/Typography';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { analyticsService } from '../services/analyticsService';
import { AnalyticsEventType } from '../types';

const INACTIVITY_TIMEOUT = 24 * 60 * 60 * 1000;
const WARNING_BEFORE = 30 * 60 * 1000;
const ACTIVITY_KEY = 'stripeit_last_activity';
const CHECK_INTERVAL = 60 * 1000;

/**
 * StripeItAuthSystem & StripeItSessionSystem
 */

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  connectionError: string | null;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retryHydration: () => void;
  isAdmin: boolean;
  isDeveloper: boolean;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  tierOverride: SubscriptionTier | null;
  setTierOverride: (tier: SubscriptionTier | null) => void;
  actualTier: SubscriptionTier | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  connectionError: null,
  logout: async () => {},
  updateProfileData: async () => {},
  addToast: () => {},
  sendVerificationEmail: async () => {},
  refreshUser: async () => {},
  retryHydration: () => {},
  isAdmin: false,
  isDeveloper: false,
  isEditMode: false,
  setIsEditMode: () => {},
  tierOverride: null,
  setTierOverride: () => {},
  actualTier: null,
});

export const useAuth = () => useContext(AuthContext);

/**
 * StripeItToastNotificationSystem
 * Global overlay for providing instant feedback on critical actions.
 */
const ToastContainer: React.FC<{ toasts: Toast[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none items-center">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            className={`
              pointer-events-auto flex items-center gap-3 min-w-[300px] max-w-md p-4 rounded-2xl 
              border shadow-2xl backdrop-blur-xl
              ${toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400/50 text-white shadow-emerald-500/20' : ''}
              ${toast.type === 'error' ? 'bg-red-500/90 border-red-400/50 text-white shadow-red-500/20' : ''}
              ${toast.type === 'info' ? 'bg-slate-800/90 border-slate-700/50 text-white shadow-slate-900/40' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0" />}
            {toast.type === 'info' && <Info className="h-5 w-5 shrink-0" />}
            
            <Typography variant="label" className="flex-1 text-white">
              {toast.message}
            </Typography>
            
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-white/70" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isEditMode, setIsEditModeState] = useState(() => {
    return localStorage.getItem('stripeit_edit_mode') === 'true';
  });
  const [tierOverride, setTierOverrideState] = useState<SubscriptionTier | null>(() => {
    const stored = sessionStorage.getItem('stripeit_tier_override');
    // Default the admin tier-preview to Pro on a fresh session so the app opens in the
    // Pro view. The dropdown still switches freely; selecting Real Account stores an
    // explicit 'real' marker so it survives reloads within the session. A brand-new
    // session (no key) defaults to Pro. Inert for non-admins — the override only
    // applies when underlyingIsAdmin is true.
    if (stored === null) return SubscriptionTier.PRO;
    if (stored === 'real') return null;
    return stored as SubscriptionTier;
  });
  const [retryKey, setRetryKey] = useState(0);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const retryHydration = useCallback(() => {
    setLoading(true);
    setConnectionError(null);
    setRetryKey(prev => prev + 1);
  }, []);

  const setIsEditMode = useCallback((value: boolean) => {
    localStorage.setItem('stripeit_edit_mode', String(value));
    setIsEditModeState(value);
  }, []);

  const setTierOverride = useCallback((tier: SubscriptionTier | null) => {
    // Persist an explicit 'real' marker for Real Account so it survives reloads within
    // the session (rather than reverting to the Pro default).
    sessionStorage.setItem('stripeit_tier_override', tier ?? 'real');
    setTierOverrideState(tier);
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(auth.currentUser);
      addToast('Verification email sent! Please check your inbox.', 'success');
    } catch (error: any) {
      console.error("Verification email error:", error);
      if (error.code === 'auth/too-many-requests') {
        addToast('Too many requests. Please wait before trying again.', 'error');
      } else {
        addToast('Failed to send verification email.', 'error');
      }
    }
  }, [addToast]);

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser }); // Trigger state update
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  }, []);

  const resetActivityTimer = useCallback(() => {
    localStorage.setItem(ACTIVITY_KEY,
      Date.now().toString());
    warningShownRef.current = false;
  }, []);

  const checkInactivity = useCallback(() => {
    if (!auth.currentUser) return;
    const lastActivity = parseInt(
      localStorage.getItem(ACTIVITY_KEY) ||
      Date.now().toString()
    );
    const elapsed = Date.now() - lastActivity;
    const remaining = INACTIVITY_TIMEOUT - elapsed;

    if (remaining <= 0) {
      addToast('Signed out due to inactivity.', 'info');
      auth.signOut();
      localStorage.removeItem(ACTIVITY_KEY);
    } else if (remaining <= WARNING_BEFORE &&
      !warningShownRef.current) {
      warningShownRef.current = true;
      addToast(
        'You will be signed out in 30 minutes due to inactivity.',
        'info'
      );
    }
  }, [addToast]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    // Outer watchdog: covers the worst case where onAuthStateChanged never fires at all
    // (e.g. Firebase Auth's own network init is blocked), so the inner watchdog inside the
    // callback would never even arm. If we're still not initialized after 8s, release the UI
    // so the user reaches an interactive screen (landing/login) instead of an endless splash.
    const outerInitWatchdog = setTimeout(() => {
      setInitialized((alreadyInit) => {
        if (!alreadyInit) {
          console.warn('AuthContext - outer init watchdog fired (auth never resolved); releasing UI.');
          setLoading(false);
        }
        return true;
      });
    }, 8000);

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Auth resolved — the outer watchdog is no longer needed.
      clearTimeout(outerInitWatchdog);
      // 1. Critical: Cleanup previous profile listener to prevent memory leaks and zombie updates
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setConnectionError(null);
      
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // If we have a user, we ARE loading the profile
      setLoading(true);
      setUser(firebaseUser);
      
      const isDeveloper = firebaseUser.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();
      analyticsService.trackEvent(AnalyticsEventType.LOGIN, { email: firebaseUser.email });

      // Watchdog: the profile read below (getDoc) has no inherent timeout. If Firestore's
      // connection stalls (flaky network, ad-blocker, long-poll hiccup), `initialized`
      // would never flip and the app freezes on the loading screen (Chrome hangs; Safari
      // recovers only when its transport times out ~30s). Guarantee the app becomes
      // interactive within a few seconds regardless; the real profile load continues in
      // the background and updates state when it arrives. setInitialized(true) is idempotent.
      const initWatchdog = setTimeout(() => {
        console.warn('AuthContext - profile load watchdog fired; releasing UI.');
        setInitialized(true);
        setLoading(false);
      }, 6000);

      // 2. Setup Profile Sync
      const userDocRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
      
      let retryCount = 0;
      const MAX_RETRIES = 3;

      const setupProfileListener = async () => {
        // Use getDoc first for a definitive existence check before subscribing
        // this prevents race conditions where onSnapshot might fire with null before local cache syncs
        try {
          const { getDoc } = await import('firebase/firestore');
          const initialSnap = await getDoc(userDocRef);
          // Read returned — the stall risk has passed; cancel the watchdog.
          clearTimeout(initWatchdog);
          
          if (!initialSnap.exists()) {
            // Only provision if we are SURE it doesn't exist
            console.log("No profile found, provisioning...");
            try {
              const { writeBatch, serverTimestamp, getDoc: getDocDirect } = await import('firebase/firestore');
              const { UserRole, SubscriptionTier, IconTheme, InviteStatus } = await import('../types');
              
              // Check for invite in session (LEGACY REMOVED)
              const inviteData = null;

              const batch = writeBatch(db);
              let orgId = '';
              let role = UserRole.SALES;
              let tier = SubscriptionTier.FREE;

              if (inviteData) {
                orgId = inviteData.orgId;
                role = inviteData.role;
                tier = SubscriptionTier.ORGANIZATION; // Managers are part of the dealer tier org
              } else {
                const isDeveloper = firebaseUser.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();
                orgId = isDeveloper ? 'FOUNDER-ORG-001' : `PERSONAL-${firebaseUser.uid.slice(0, 5)}`;
                const orgDocRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
                batch.set(orgDocRef, {
                  id: orgId,
                  name: isDeveloper ? 'Founder Dealership' : 'Personal Workspace',
                  ownerId: firebaseUser.uid,
                  subscriptionTier: isDeveloper ? SubscriptionTier.ORGANIZATION : SubscriptionTier.FREE,
                  createdAt: serverTimestamp()
                }, { merge: true }); // Use merge to prevent overwriting existing FOUNDER-ORG
                
                if (isDeveloper) {
                  tier = SubscriptionTier.ORGANIZATION;
                  role = UserRole.DEALER_OWNER;
                } else if (!inviteData) {
                  tier = SubscriptionTier.TRIAL;
                }
              }

              const userProfileData: any = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || (inviteData ? 'New Manager' : 'New Salesperson'),
                role: role,
                subscriptionTier: tier,
                trialEndsAt: (!isDeveloper && !inviteData) ? Date.now() + (30 * 24 * 60 * 60 * 1000) : null,
                orgId: orgId,
                dealershipId: '',
                isAdmin: isDeveloper,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                themePreference: 'dark',
                preferences: {
                  theme: 'dark',
                  visualTheme: 'matrix',
                  iconTheme: IconTheme.LUCIDE,
                  onboarding: {
                    isCompleted: false,
                    currentStep: 'welcome',
                    completedSteps: [],
                    seenHints: []
                  },
                  notifications: {
                    dealReminders: true,
                    goalAlerts: true,
                    managerAnnouncements: true,
                    competitionNotifications: true,
                    payoutAlerts: true
                  },
                  display: {
                    showMetricsByDefault: true,
                    currencySymbol: '$',
                    compactMode: false
                  }
                }
              };

              batch.set(userDocRef, userProfileData);
              
              await batch.commit();

              analyticsService.trackEvent(AnalyticsEventType.SIGNUP_COMPLETED, { email: firebaseUser.email });

              // 🛡️ FOUNDER REPAIR: Ensure founder always has valid orgId and role (Only during initial account creation)
              if (isDeveloper) {
                // Org document repair: ensure the specific founder org exists
                const targetOrgId = orgId || 'FOUNDER-ORG-001';
                const orgDocRef = doc(db, COLLECTIONS.ORGANIZATIONS, targetOrgId);
                getDoc(orgDocRef).then(snap => {
                  if (!snap.exists()) {
                    console.log("[Bootstrap] Creating missing founder organization...");
                    setDoc(orgDocRef, {
                      id: targetOrgId,
                      name: 'Founder Dealership',
                      ownerId: firebaseUser.uid,
                      subscriptionTier: SubscriptionTier.ORGANIZATION,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    }).catch(e => console.error("Org repair failed", e));
                  }
                }).catch(e => console.error("Org check failed", e));
              }
            } catch (err) {
              console.error("Failed to auto-provision user profile:", err);
              // Fallback to onSnapshot even if provisioning failed - maybe it exists now?
            }
          }
          
          // Now subscribe for real-time updates
          unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
            // If user changed mid-stream, disregard
            if (auth.currentUser?.uid !== firebaseUser.uid) return;

            setConnectionError(null);
            if (docSnap.exists()) {
              const rawData = docSnap.data();

              // 🛡️ BLOCK FROZEN ACCOUNTS (REMOVED GLOBAL BLOCK)
              // We now allow profile hydration even if frozen, so users can still access personal accounts.
              
              // 🔄 TIER MIGRATION: BASIC -> PRO
              // Critical path for eliminating the legacy basic tier while preserving user access.
              let subscriptionTier = rawData.subscriptionTier;
              if (subscriptionTier === 'basic') {
                subscriptionTier = SubscriptionTier.PRO;
              }

              const profileData = {
                uid: firebaseUser.uid,
                ...rawData,
                subscriptionTier,
                createdAt: rawData.createdAt?.toMillis?.() || rawData.createdAt || Date.now(),
                updatedAt: rawData.updatedAt?.toMillis?.() || rawData.updatedAt || Date.now(),
              } as any as UserProfile;

              // 🛡️ FOUNDER REPAIR: Ensure founder always has valid orgId and role
              if (isDeveloper) {
                const needsUserRepair = !profileData.orgId || !profileData.isAdmin;
                
                if (needsUserRepair) {
                  console.log("[Bootstrap] Repairing founder profile state...");
                  const repairData: any = {};
                  if (!profileData.orgId) repairData.orgId = 'FOUNDER-ORG-001';
                  if (!profileData.isAdmin) repairData.isAdmin = true;
                  
                  updateDoc(userDocRef, { ...repairData, updatedAt: serverTimestamp() }).catch(e => console.error("Repair failed", e));
                }

                // Org document repair: ensure the specific founder org exists
                const targetOrgId = profileData.orgId || 'FOUNDER-ORG-001';
                const orgDocRef = doc(db, COLLECTIONS.ORGANIZATIONS, targetOrgId);
                getDoc(orgDocRef).then(snap => {
                  if (!snap.exists()) {
                    console.log("[Bootstrap] Creating missing founder organization...");
                    setDoc(orgDocRef, {
                      id: targetOrgId,
                      name: 'Founder Dealership',
                      ownerId: firebaseUser.uid,
                      subscriptionTier: SubscriptionTier.ORGANIZATION,
                      createdAt: serverTimestamp(),
                      updatedAt: serverTimestamp()
                    }).catch(e => console.error("Org repair failed", e));
                  }
                }).catch(e => console.error("Org check failed", e));
              }

              // Silent trial expiry downgrade
              let finalProfile = profileData;
              if (
                profileData.subscriptionTier === SubscriptionTier.TRIAL &&
                profileData.trialEndsAt &&
                Date.now() > profileData.trialEndsAt
              ) {
                // Downgrade in Firestore silently
                updateDoc(userDocRef, { 
                  subscriptionTier: SubscriptionTier.FREE,
                  updatedAt: serverTimestamp()
                }).catch(e => console.error("Trial downgrade failed", e));
                finalProfile = { ...profileData, subscriptionTier: SubscriptionTier.FREE };
              }
              setProfile(finalProfile);
              setLoading(false);
              setInitialized(true);
            } else {
              // This is highly unusual after the getDoc check, but handle it
              setConnectionError("Profile disappeared. Please refresh.");
              setLoading(false);
              setInitialized(true);
            }
          }, (error) => {
            if (!auth.currentUser) return;
            console.error("Profile subscription error:", error);
            setConnectionError(getFriendlyErrorMessage(error));
            setLoading(false);
            setInitialized(true);
          });
        } catch (error: any) {
          console.error("Initial profile fetch error:", error);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(setupProfileListener, 1000);
          } else {
            setConnectionError(getFriendlyErrorMessage(error));
            setLoading(false);
            setInitialized(true);
          }
        }
      };

      setupProfileListener();
    }, (error) => {
      console.error("Auth state change error:", error);
      setConnectionError("Authentication connection failure.");
      setLoading(false);
    });

    return () => {
      clearTimeout(outerInitWatchdog);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [retryKey]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        try {
          // Force token refresh to re-establish Firebase connection
          await auth.currentUser.getIdToken(true);
          
          // Re-fetch profile directly to get fresh data
          const { getDoc, doc } = await import('firebase/firestore');
          const userDocRef = doc(db, COLLECTIONS.USERS, auth.currentUser.uid);
          const snap = await getDoc(userDocRef);
          
          if (snap.exists()) {
            const rawData = snap.data();
            let subscriptionTier = rawData.subscriptionTier;
            if (subscriptionTier === 'basic') subscriptionTier = SubscriptionTier.PRO;
            
            setProfile(prev => prev ? {
              ...prev,
              ...rawData,
              subscriptionTier,
              updatedAt: rawData.updatedAt?.toMillis?.() || rawData.updatedAt || Date.now(),
            } as any : prev);
          }
        } catch (error) {
          console.warn('Visibility refresh failed:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      analyticsService.trackEvent(AnalyticsEventType.LOGOUT);
      await auth.signOut();
      // Explicitly clear errors on intentional logout
      setConnectionError(null);
      addToast('Signed out successfully.', 'info');
    } catch (error) {
      console.error("Logout error:", error);
      addToast('Error signing out.', 'error');
      setLoading(false);
    }
  };

  /**
   * StripeItProfileSyncSystem
   * Centralized update logic for profile data across Firestore and Firebase Auth.
   */
  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { updateDoc, doc, serverTimestamp } = await import('firebase/firestore');
      const { updateProfile: updateAuthProfile } = await import('firebase/auth');
      
      const userRef = doc(db, COLLECTIONS.USERS, user.uid);
      
      // Prepare Firestore updates
      const firestoreUpdates: any = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      // Update Firestore
      await updateDoc(userRef, firestoreUpdates);
      
      // Sync with Firebase Auth if displayName or photoURL changed
      if (data.displayName || data.photoURL) {
        await updateAuthProfile(user, {
          displayName: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL
        });
      }
      
      addToast('Profile updated successfully.', 'success');
    } catch (error) {
      console.error("Profile update error:", error);
      addToast('Failed to update profile.', 'error');
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  /**
   * StripeItAdminAccessSystem
   * Centralized admin and developer detection logic.
   */
  const isDeveloper = user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();
  const isAdmin = isDeveloper || profile?.isAdmin === true;

  // StripeItIdentitySystem - Effective Profile Resolution
  // We memoize this to prevent downstream infinite loops in contexts that depend on the profile object
  const effectiveProfile = useMemo(() => {
    if (!profile) return profile;
    
    // 1. Identify underlying state
    const underlyingIsDeveloper = user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();
    const underlyingIsAdmin = underlyingIsDeveloper || profile?.isAdmin === true;

    // 2. Resolve target state (Simulated or Real)
    // We only apply override if the user has admin authority to do so
    if (underlyingIsAdmin && tierOverride) {
      const isDealerPreview = tierOverride === SubscriptionTier.ORGANIZATION;
      
      return {
        ...profile,
        subscriptionTier: tierOverride,
        // Role simulation to ensure correct sidebar shell and permission triggers
        role: isDealerPreview ? UserRole.DEALER_OWNER : UserRole.SALES,
        // Org simulation: Dealers need an orgId, Personal users use PERSONAL- prefixed ones
        orgId: isDealerPreview 
          ? (profile.orgId && !profile.orgId.startsWith('PERSONAL-') ? profile.orgId : 'PREVIEW-ORG-001')
          : `PERSONAL-${profile.uid.slice(0, 5)}`,
        // We hide Admin status in the profile object during preview to test UI gating,
        // but the context's top-level isAdmin remains true so they can still see the console.
        isAdmin: false,
        isFrozen: false
      };
    }

    // 3. Apply Developer Overrides (when no tier override is active)
    if (underlyingIsDeveloper) {
      return {
        ...profile,
        isAdmin: true,
        isFrozen: false, // Founder cannot be frozen
        orgId: profile.orgId || 'FOUNDER-ORG-001'
      };
    }

    // 4. Return standard profile for normal users
    return profile;
  }, [profile, tierOverride, user]);

  const actualTier = useMemo(() => {
    if (!profile) return null;
    if (isDeveloper && (profile.subscriptionTier === SubscriptionTier.FREE || !profile.subscriptionTier)) {
      return SubscriptionTier.ORGANIZATION;
    }
    return profile.subscriptionTier;
  }, [profile, isDeveloper]);

  // StripeItThemeSystem - Apply visual theme to document
  useEffect(() => {
    const visualTheme = profile?.preferences?.visualTheme || 'matrix';
    document.documentElement.setAttribute('data-visual-theme', visualTheme);
  }, [profile?.preferences?.visualTheme]);

  useEffect(() => {
    if (!user) {
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
      return;
    }

    resetActivityTimer();

    const events = ['mousedown', 'keydown', 'scroll',
      'touchstart', 'click'];
    events.forEach(e =>
      window.addEventListener(e, resetActivityTimer,
        { passive: true }));

    inactivityTimerRef.current = setInterval(
      checkInactivity, CHECK_INTERVAL
    );

    return () => {
      events.forEach(e =>
        window.removeEventListener(e,
          resetActivityTimer));
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [user, resetActivityTimer, checkInactivity]);

  const value = useMemo(() => ({
    user,
    profile: effectiveProfile,
    loading,
    initialized,
    connectionError,
    logout,
    updateProfileData,
    addToast,
    sendVerificationEmail,
    refreshUser,
    retryHydration,
    isAdmin,
    isDeveloper,
    isEditMode,
    setIsEditMode,
    tierOverride: isAdmin ? tierOverride : null,
    setTierOverride: isAdmin ? setTierOverride : () => {},
    actualTier,
  }), [
    user, 
    effectiveProfile, 
    loading, 
    initialized, 
    connectionError, 
    logout, 
    updateProfileData, 
    addToast, 
    sendVerificationEmail, 
    refreshUser, 
    retryHydration,
    isAdmin, 
    isDeveloper,
    isEditMode, 
    setIsEditMode, 
    tierOverride,
    setTierOverride,
    actualTier
  ]);

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {children}
    </AuthContext.Provider>
  );
};
