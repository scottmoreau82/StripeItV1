import { Feature, featureAccessService } from '@/src/services/featureAccessService';
import { UserProfile, SubscriptionTier, UserRole } from '@/src/types';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';

export const navigationConfig = {
  main: [
    { id: 'dashboard', label: 'DASHBOARD', icon: 'dashboard', path: '/' },
    { id: 'sales-log', label: 'SALES LOG', icon: 'salesLog', path: '/sales-log' },
    { id: 'activity', label: 'ACTIVITY', icon: 'activity', path: '/activity', featureId: Feature.ACTIVITY_FEED },
    { id: 'analytics', label: 'ANALYTICS', icon: 'analytics', path: '/analytics', featureId: Feature.ADVANCED_ANALYTICS },
    { id: 'goals', label: 'GOALS', icon: 'goals', path: '/goals', featureId: Feature.GOALS },
    { id: 'reports', label: 'SALES REPORT', icon: 'reports', path: '/reports', featureId: Feature.ADVANCED_ANALYTICS },
    { id: 'inventory', label: 'INVENTORY', icon: 'inventory', path: '/inventory', featureId: Feature.INVENTORY_MANAGEMENT },
    
    // Dealer Management Tier
    { id: 'dealer-log', label: 'DEALER LOG', icon: 'car', path: '/dealer/sales-log', featureId: Feature.ORG_SETTINGS },
    { id: 'dealer-managers', label: 'MANAGERS', icon: 'users', path: '/dealer/users?tab=managers', featureId: Feature.ORG_SETTINGS },
    { id: 'dealer-permissions', label: 'PERMISSIONS', icon: 'shield', path: '/dealer/users?tab=permissions', featureId: Feature.ORG_SETTINGS },
    { id: 'dealer-codes', label: 'INVITES / JOIN CODES', icon: 'userPlus', path: '/dealer/users?tab=codes', featureId: Feature.ORG_SETTINGS },
    { id: 'dealer-builder', label: 'LOG BUILDER', icon: 'logBuilder', path: '/dealer/log-builder', featureId: Feature.ORG_SETTINGS },
    { id: 'dealer-config', label: 'DEALER SETTINGS', icon: 'tuning', path: '/dealer/settings', featureId: Feature.ORG_SETTINGS },

    { id: 'settings', label: 'SETTINGS', icon: 'settings', path: '/settings' },
    { id: 'feedback', label: 'FEEDBACK', icon: 'feedback', path: '#feedback' },
  ],
  settingsSubmenu: [
    { id: 'profile', label: 'PROFILE', path: '#profile' },
    { id: 'theme', label: 'THEME', path: '#theme' },
    { id: 'progression', label: 'UPGRADE TO DEALER', path: '#dealer-progression' },
    { id: 'organization', label: 'ORGANIZATION', path: '#organization', roles: [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN, UserRole.DEALER_OWNER] },
    { id: 'dealer-reviews', label: 'DEALER REQUESTS', path: '/admin/dealer-requests', adminOnly: true },
    { id: 'admin', label: 'ADMIN', path: '#admin', adminOnly: true },
    { id: 'developer', label: 'DEVELOPER TOOLS', path: '#developer', adminOnly: true },
    { id: 'account', label: 'ACCOUNT', path: '#account' },
  ],
  quickActions: [
    { id: 'log-deal', label: 'LOG DEAL', icon: 'plus', variant: 'primary' as const },
  ],
  
  /**
   * Filter items based on user profile and tier access rules.
   */
  getVisibleItems: (profile: UserProfile | null) => {
    const isDeveloper = profile?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();

    return navigationConfig.main.filter(item => {
      // Items without featureId (like Dashboard, Settings) are always visible
      if (!item.featureId) return true;
      if (isDeveloper) return true;
      if (!profile) return false;
      
      const isFree = profile.subscriptionTier === SubscriptionTier.FREE;
      const isSalesperson = profile.subscriptionTier !== SubscriptionTier.ORGANIZATION;

      // Hide specific unfinished routes for all Salespeople (Free, Basic, Pro)
      const unfinishedRoutes = ['analytics', 'goals', 'inventory'];
      if (isSalesperson && unfinishedRoutes.includes(item.id)) {
        return false;
      }

      const hasAccess = featureAccessService.hasAccess(profile, item.featureId as Feature);

      // Hard gate: Hide specific items for Free tier even if hasAccess might return true (extra safety/clarity)
      const restrictedForFree = ['activity', 'reports'];
      if (isFree && restrictedForFree.includes(item.id)) {
        return false;
      }

      return hasAccess;
    });
  }
};
