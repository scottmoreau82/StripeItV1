import { 
  Home, 
  ClipboardList, 
  Activity, 
  TrendingUp, 
  Target, 
  Settings, 
  Archive, 
  Plus,
  FileText,
  MessageSquarePlus
} from 'lucide-react';
import { Feature, featureAccessService } from '@/src/services/featureAccessService';
import { UserProfile, SubscriptionTier } from '@/src/types';

export const navigationConfig = {
  main: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'sales-log', label: 'Sales Log', icon: ClipboardList, path: '/sales-log' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity', featureId: Feature.ACTIVITY_FEED },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/analytics', featureId: Feature.ADVANCED_ANALYTICS },
    { id: 'goals', label: 'Goals', icon: Target, path: '/goals', featureId: Feature.GOALS },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports', featureId: Feature.ADVANCED_ANALYTICS },
    { id: 'inventory', label: 'Inventory', icon: Archive, path: '/inventory', featureId: Feature.INVENTORY_MANAGEMENT },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    { id: 'feedback', label: 'Feedback', icon: MessageSquarePlus, path: '#feedback' },
  ],
  settingsSubmenu: [
    { id: 'profile', label: 'Profile', path: '#profile' },
    { id: 'appearance', label: 'Appearance', path: '#appearance' },
    { id: 'notifications', label: 'Notifications', path: '#notifications' },
    { id: 'account', label: 'Account', path: '#account' },
    { id: 'admin', label: 'Admin', path: '#admin', adminOnly: true },
    { id: 'testing', label: 'Testing & Demo', path: '#testing', adminOnly: true },
    { id: 'developer', label: 'Developer Tools', path: '#developer', adminOnly: true },
  ],
  quickActions: [
    { id: 'log-deal', label: 'Log Deal', icon: Plus, variant: 'primary' as const },
  ],
  
  /**
   * Filter items based on user profile and tier access rules.
   */
  getVisibleItems: (profile: UserProfile | null) => {
    return navigationConfig.main.filter(item => {
      // Items without featureId (like Dashboard, Settings) are always visible
      if (!item.featureId) return true;
      if (!profile) return false;
      
      const isFree = profile.subscriptionTier === SubscriptionTier.FREE;
      const hasAccess = featureAccessService.hasAccess(profile, item.featureId as Feature);

      // Hard gate: Hide specific items for Free tier even if hasAccess might return true (extra safety/clarity)
      const restrictedForFree = ['activity', 'analytics', 'goals', 'reports', 'inventory'];
      if (isFree && restrictedForFree.includes(item.id)) {
        return false;
      }

      return hasAccess;
    });
  }
};
