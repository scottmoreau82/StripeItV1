import { 
  Home, 
  ClipboardList, 
  Activity, 
  BarChart3, 
  Target, 
  Settings, 
  Car, 
  Plus,
  FileText
} from 'lucide-react';

export const navigationConfig = {
  main: [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'sales-log', label: 'Sales Log', icon: ClipboardList, path: '/sales-log' },
    { id: 'activity', label: 'Activity', icon: Activity, path: '/activity' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'goals', label: 'Goals', icon: Target, path: '/goals' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'inventory', label: 'Inventory', icon: Car, path: '/inventory' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ],
  quickActions: [
    { id: 'log-deal', label: 'Log Deal', icon: Plus, variant: 'primary' as const },
  ]
};
