import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserPreferences, UserProfile } from '../types';

/**
 * StripeItUserPreferenceSystem
 * Centralized service for managing user preferences and profile settings.
 */

const USERS_COLLECTION = 'users';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  notifications: {
    dealReminders: true,
    goalAlerts: true,
    managerAnnouncements: true,
    competitionNotifications: false,
    payoutAlerts: true,
  },
  display: {
    showMetricsByDefault: true,
    currencySymbol: '$',
    compactMode: false,
  },
};

export const preferenceService = {
  /**
   * Updates user preferences in Firestore
   */
  async updatePreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    
    // We update the preferences object within the profile document
    await updateDoc(userRef, {
      'preferences': preferences
    });
  },

  /**
   * Updates specific notification settings
   */
  async updateNotificationSettings(userId: string, notifications: Partial<UserPreferences['notifications']>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updates: Record<string, any> = {};
    
    Object.entries(notifications).forEach(([key, value]) => {
      updates[`preferences.notifications.${key}`] = value;
    });
    
    await updateDoc(userRef, updates);
  },

  /**
   * Updates specific display settings
   */
  async updateDisplaySettings(userId: string, display: Partial<UserPreferences['display']>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const updates: Record<string, any> = {};
    
    Object.entries(display).forEach(([key, value]) => {
      updates[`preferences.display.${key}`] = value;
    });
    
    await updateDoc(userRef, updates);
  },

  /**
   * Updates profile information
   */
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    // Be careful not to overwrite sensitive fields if this was a larger app
    const { uid, email, role, dealershipId, orgId, createdAt, ...updatable } = profileData;
    await updateDoc(userRef, updatable);
  }
};
