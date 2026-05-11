import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, SubscriptionTier } from '../types';
import { Typography } from '../components/ui/Typography';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * StripeItAuthSystem & StripeItSessionSystem
 * Centralized authentication and session management with integrated notification system.
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
  isAdmin: boolean;
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
  isAdmin: false,
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
  const [tierOverride, setTierOverrideState] = useState<SubscriptionTier | null>(() => {
    return sessionStorage.getItem('stripeit_tier_override') as SubscriptionTier | null;
  });

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

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // 1. Critical: Cleanup previous profile listener to prevent memory leaks and zombie updates
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      setConnectionError(null);
      
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        setInitialized(true);
        return;
      }

      // 2. Setup Profile Sync
      setLoading(true);
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      let retryCount = 0;
      const MAX_RETRIES = 2;

      const setupProfileListener = () => {
        unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
          // If user changed mid-stream, disregard
          if (auth.currentUser?.uid !== firebaseUser.uid) return;

          setConnectionError(null);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profileData = {
              uid: firebaseUser.uid, // Ensure UID is always present
              ...data,
              createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
              updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt || Date.now(),
            } as any as UserProfile;
            setProfile(profileData);
            setLoading(false);
            setInitialized(true);
          } else {
            // Auto-provision initial Free Tier profile
            try {
              const { writeBatch, serverTimestamp } = await import('firebase/firestore');
              const { UserRole, SubscriptionTier } = await import('../types');
              
              const orgId = `PERSONAL-${firebaseUser.uid.slice(0, 5)}`;
              const orgDocRef = doc(db, 'organizations', orgId);
              const batch = writeBatch(db);
              
              batch.set(orgDocRef, {
                id: orgId,
                name: 'Personal Workspace',
                ownerId: firebaseUser.uid,
                subscriptionTier: SubscriptionTier.FREE,
                createdAt: serverTimestamp()
              });

              batch.set(userDocRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'New Salesperson',
                role: UserRole.SALES,
                subscriptionTier: SubscriptionTier.FREE,
                orgId: orgId,
                dealershipId: '',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                preferences: {
                  theme: 'dark',
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
              });
              
              await batch.commit();
              // Note: snapshot will re-fire after commit
            } catch (err) {
              console.error("Failed to auto-provision user profile:", err);
              if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(setupProfileListener, 1000);
              } else {
                setConnectionError("Account initialization failed. Please contact support.");
                setLoading(false);
                setInitialized(true);
                handleFirestoreError(err, OperationType.WRITE, 'batch-init');
              }
            }
          }
        }, (error) => {
          if (!auth.currentUser) return;

          console.error("Error fetching user profile:", error);
          if (error.message.includes('offline') || error.message.includes('network')) {
            setConnectionError("Network issue. Retrying...");
            setTimeout(setupProfileListener, 3000);
          } else if (error.message.includes('permission')) {
            // Likely a race condition where user is authenticated but Firestore doesn't know yet
            if (retryCount < MAX_RETRIES) {
              retryCount++;
              setTimeout(setupProfileListener, 1000);
            } else {
              setConnectionError("Permission issues loading your profile.");
              setLoading(false);
              setInitialized(true);
              handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            }
          } else {
            setConnectionError("Unable to load profile data.");
            setLoading(false);
            setInitialized(true);
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          }
        });
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
      
      const userRef = doc(db, 'users', user.uid);
      
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
   * StripeItDeveloperTierOverrideSystem
   * Only allows the specific developer account to simulate different subscription tiers.
   */
  const developerEmail = 'scottmoreau82@gmail.com';
  const isDeveloper = user?.email?.toLowerCase() === developerEmail.toLowerCase();
  
  const effectiveProfile = profile && (isDeveloper && tierOverride)
    ? { ...profile, subscriptionTier: tierOverride }
    : profile;

  /**
   * StripeItAdminAccessSystem
   * Centralized admin detection logic.
   */
  const isAdmin = user?.email?.toLowerCase() === developerEmail.toLowerCase() || profile?.isAdmin === true;

  const value = {
    user,
    profile: effectiveProfile,
    loading,
    initialized,
    connectionError,
    logout,
    updateProfileData,
    addToast,
    isAdmin,
    tierOverride: isDeveloper ? tierOverride : null,
    setTierOverride: isDeveloper ? setTierOverride : () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {children}
    </AuthContext.Provider>
  );
};
