import { UserProfile, UserRole } from '../types';

/**
 * StripeItRolePermissionSystem
 * Centralized logic for role-based access control and fine-grained permissions.
 */

export type AppPermission = 
  | 'deals:create'
  | 'deals:view_all'
  | 'deals:edit_any'
  | 'analytics:view_team'
  | 'analytics:view_dealership'
  | 'management:competitions'
  | 'admin:settings';

const rolePermissions: Record<UserRole, AppPermission[]> = {
  [UserRole.SALES]: [
    'deals:create',
    'deals:view_all'
  ],
  [UserRole.MANAGER]: [
    'deals:create',
    'deals:view_all',
    'deals:edit_any',
    'analytics:view_team',
    'management:competitions'
  ],
  [UserRole.GENERAL_MANAGER]: [
    'deals:create',
    'deals:view_all',
    'deals:edit_any',
    'analytics:view_team',
    'analytics:view_dealership',
    'management:competitions'
  ],
  [UserRole.ADMIN]: [
    'deals:create',
    'deals:view_all',
    'deals:edit_any',
    'analytics:view_team',
    'analytics:view_dealership',
    'management:competitions',
    'admin:settings'
  ]
};

export const permissionService = {
  /**
   * Core check for any permission
   */
  hasPermission: (profile: UserProfile | null, permission: AppPermission): boolean => {
    if (!profile) return false;
    return rolePermissions[profile.role]?.includes(permission) || false;
  },

  /**
   * Helper for manager-level checks (legacy support + convenience)
   */
  isManager: (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    return [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN].includes(profile.role);
  },

  /**
   * Check if user represents a salesperson (primary role)
   */
  isSales: (profile: UserProfile | null): boolean => {
    if (!profile) return false;
    return profile.role === UserRole.SALES;
  },

  /**
   * Check if user can edit a specific deal
   */
  canEditDeal: (profile: UserProfile | null, dealUserId: string): boolean => {
    if (!profile) return false;
    // Users can edit their own deals, Managers/Admins can edit any deal via edit_any permission
    return profile.uid === dealUserId || permissionService.hasPermission(profile, 'deals:edit_any');
  }
};
