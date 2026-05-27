import { UserProfile, SubscriptionTier, UserRole } from '../types';
import { STRIPEIT_DEVELOPER_EMAIL } from '../constants';

/**
 * StripeItFeatureAccessSystem
 * Centralized logic for determining if a feature is available to a user.
 */

const isDeveloper = (profile: UserProfile | null) => {
  return profile?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase() && profile?.isAdmin === true;
};

export const isOnActiveTrial = (profile: UserProfile | null): boolean => {
  if (!profile) return false;
  if (profile.subscriptionTier !== SubscriptionTier.TRIAL) return false;
  if (!profile.trialEndsAt) return false;
  return Date.now() < profile.trialEndsAt;
};

export enum Feature {
  GOALS = 'goals',
  SALES_LOG_FILTERS = 'sales_log_filters',
  QUICK_NOTES = 'quick_notes',
  CUSTOM_DASHBOARD = 'custom_dashboard',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  SAVED_PREFERENCES = 'saved_preferences',
  MANAGER_VISIBILITY = 'manager_visibility',
  TEAM_DASHBOARDS = 'team_dashboards',
  COMPETITIONS = 'competitions',
  ORG_SETTINGS = 'org_settings',
  ACTIVITY_FEED = 'activity_feed',
  INVENTORY_MANAGEMENT = 'inventory_management',
  SPIFF_TRACKING = 'spiff_tracking',
}

export const featureAccessService = {
  /**
   * Check if a feature is enabled for a user based on their subscription tier and role.
   */
  hasAccess: (profile: UserProfile | null, feature: Feature): boolean => {
    if (!profile) return false;
    if (isDeveloper(profile)) return true;
    
    // TRIAL tier has identical access to PRO
    if (isOnActiveTrial(profile)) {
      const tier = SubscriptionTier.PRO;
      return featureAccessService.hasAccess({ ...profile, subscriptionTier: tier }, feature);
    }

    const tier = profile.subscriptionTier;
    const role = profile.role;

    switch (feature) {
      case Feature.SALES_LOG_FILTERS:
      case Feature.QUICK_NOTES:
        return [SubscriptionTier.FREE, SubscriptionTier.TRIAL, SubscriptionTier.PRO, SubscriptionTier.ORGANIZATION].includes(tier);

      case Feature.GOALS:
      case Feature.ACTIVITY_FEED:
      case Feature.SPIFF_TRACKING:
        // Restricted for Free users
        return [SubscriptionTier.TRIAL, SubscriptionTier.PRO, SubscriptionTier.ORGANIZATION].includes(tier);

      case Feature.CUSTOM_DASHBOARD:
      case Feature.ADVANCED_ANALYTICS:
      case Feature.SAVED_PREFERENCES:
      case Feature.INVENTORY_MANAGEMENT:
        return [SubscriptionTier.TRIAL, SubscriptionTier.PRO, SubscriptionTier.ORGANIZATION].includes(tier);

      case Feature.MANAGER_VISIBILITY:
      case Feature.TEAM_DASHBOARDS:
      case Feature.COMPETITIONS:
      case Feature.ORG_SETTINGS:
        // Organization features require Organization tier AND a leadership role
        const isOrgTier = tier === SubscriptionTier.ORGANIZATION;
        const isManager = [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN, UserRole.DEALER_OWNER].includes(role);
        return isOrgTier && isManager;

      default:
        return false;
    }
  },

  /**
   * Returns metadata about a plan for UI display
   */
  getTierLabel: (tier: SubscriptionTier): string => {
    switch (tier) {
      case SubscriptionTier.FREE: return 'Free';
      case SubscriptionTier.PRO: return 'Pro';
      case SubscriptionTier.TRIAL: return 'Trial';
      case SubscriptionTier.ORGANIZATION: return 'Organization';
      default: return 'Free';
    }
  }
};
