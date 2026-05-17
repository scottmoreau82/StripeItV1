import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, SubscriptionTier } from '../types';
import { STRIPEIT_DEVELOPER_EMAIL, COLLECTIONS } from '../constants';
import { Typography } from '../components/ui/Typography';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { analyticsService } from '../services/analyticsService';
import { AnalyticsEventType } from '../types';

/**
 * StripeItAuthSystem & StripeItSessionSystem
 */

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  connectionError: string | null;
  logout: () => Promise<void>;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  sendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  tierOverride: SubscriptionTier | null;
  setTierOverride: (tier: SubscriptionTier | null) => void;
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
  isAdmin: false,
  isEditMode: false,
  setIsEditMode: () => {},
  tierOverride: null,
  setTierOverride: () => {},
});

export const useAuth = () => useContext(AuthContext);

/**
 * StripeItToastNotificationSystem
 * Global overlay for providing instant feedback on critical actions.
 */
const ToastContainer: React.FC<{ toasts: Toast[], removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
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
    return sessionStorage.getItem('stripeit_tier_override') as SubscriptionTier | null;
  });

  const setIsEditMode = useCallback((value: boolean) => {
    localStorage.setItem('stripeit_edit_mode', String(value));
    setIsEditModeState(value);
  }, []);

  const setTierOverride = useCallback((tier: SubscriptionTier | null) => {
    if (tier) {
      sessionStorage.setItem('stripeit_tier_override', tier);
    } else {
      sessionStorage.removeItem('stripeit_tier_override');
    }
    setTierOverrideState(tier);
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
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
      
      analyticsService.trackEvent(AnalyticsEventType.LOGIN, { email: firebaseUser.email });

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
                orgId = `PERSONAL-${firebaseUser.uid.slice(0, 5)}`;
                const orgDocRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
                batch.set(orgDocRef, {
                  id: orgId,
                  name: 'Personal Workspace',
                  ownerId: firebaseUser.uid,
                  subscriptionTier: SubscriptionTier.FREE,
                  createdAt: serverTimestamp()
                });
              }

              const userProfileData: any = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || (inviteData ? 'New Manager' : 'New Salesperson'),
                role: role,
                subscriptionTier: tier,
                orgId: orgId,
                dealershipId: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
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

              // 🛡️ BLOCK FROZEN ACCOUNTS
              if (rawData.isFrozen) {
                console.warn("Account is frozen. Blocking access.");
                setProfile(null);
                setLoading(false);
                setInitialized(true);
                setConnectionError("ACCOUNT_FROZEN");
                return;
              }
              
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
              setProfile(profileData);
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
            handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.USERS}/${firebaseUser.uid}`);
          });
        } catch (error: any) {
          console.error("Initial profile fetch error:", error);
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(setupProfileListener, 1000);
          } else {
            setConnectionError("Unable to establish profile link.");
            setLoading(false);
            setInitialized(true);
            handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.USERS}/${firebaseUser.uid}`);
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
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
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
   * Centralized admin detection logic.
   */
  const isAdmin = user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase() || profile?.isAdmin === true;

  // StripeItIdentitySystem - Effective Profile Resolution
  // We memoize this to prevent downstream infinite loops in contexts that depend on the profile object
  const effectiveProfile = useMemo(() => {
    if (!profile) return profile;
    return (isAdmin && tierOverride)
      ? { ...profile, subscriptionTier: tierOverride }
      : profile;
  }, [profile, isAdmin, tierOverride]);

  // StripeItThemeSystem - Apply visual theme to document
  useEffect(() => {
    const visualTheme = profile?.preferences?.visualTheme || 'matrix';
    document.documentElement.setAttribute('data-visual-theme', visualTheme);
  }, [profile?.preferences?.visualTheme]);

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
    isAdmin,
    isEditMode,
    setIsEditMode,
    tierOverride: isAdmin ? tierOverride : null,
    setTierOverride: isAdmin ? setTierOverride : () => {},
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
    isAdmin, 
    isEditMode, 
    setIsEditMode, 
    tierOverride,
    setTierOverride
  ]);

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {children}
    </AuthContext.Provider>
  );
};
