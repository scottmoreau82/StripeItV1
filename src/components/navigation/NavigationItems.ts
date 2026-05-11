import { 
  Home, 
  ClipboardList, 
  Activity, 
  TrendingUp, 
  Target, 
  Settings, 
  Archive, 
  Plus,
  FileText
} from 'lucide-react';
import { Feature } from '@/src/services/featureAccessService';

export const navigationConfig = {
  main: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'sales-log', label: 'Sales Log', icon: ClipboardList, path: '/sales-log' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity', featureId: Feature.ACTIVITY_FEED },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/analytics', featureId: Feature.ADVANCED_ANALYTICS },
    { id: 'goals', label: 'Goals', icon: Target, path: '/goals', featureId: Feature.GOALS },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports', featureId: Feature.ADVANCED_ANALYTICS },
    { id: 'inventory', label: 'Inventory', icon: Archive, path: '/inventory', featureId: Feature.INVENTORY_MANAGEMENT },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ],
  quickActions: [
    { id: 'log-deal', label: 'Log Deal', icon: Plus, variant: 'primary' as const },
  ]
};
