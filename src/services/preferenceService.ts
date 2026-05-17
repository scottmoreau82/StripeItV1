import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserPreferences, UserProfile } from '../types';

/**
 * StripeItUserPreferenceSystem
 * Centralized service for managing user preferences and profile settings.
 */

const USERS_COLLECTION = 'users';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  visualTheme: 'matrix',
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
    
    try {
      // We update the preferences object within the profile document
      await updateDoc(userRef, {
        'preferences': preferences
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
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
    
    try {
      await updateDoc(userRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
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
    
    try {
      await updateDoc(userRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
  },

  /**
   * Updates profile information
   */
  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, USERS_COLLECTION, userId);
    // Be careful not to overwrite sensitive fields if this was a larger app
    const { uid, email, role, dealershipId, orgId, createdAt, ...updatable } = profileData;
    try {
      await updateDoc(userRef, updatable);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${USERS_COLLECTION}/${userId}`);
      throw error;
    }
  }
};
