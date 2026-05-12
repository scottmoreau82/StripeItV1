import { Feature } from './featureAccessService';

/**
 * StripeItFeatureAvailabilitySystem
 * Centralized registry for feature development and rollout status.
 */

export enum FeatureStatus {
  COMPLETE = 'complete',
  IN_DEVELOPMENT = 'inDevelopment',
  DISABLED = 'disabled',
  PLANNED = 'planned'
}

export interface FeatureAvailability {
  id: Feature | string;
  status: FeatureStatus;
  label?: string;
}

const FEATURE_REGISTRY: Record<string, FeatureStatus> = {
  // Core Features (Complete)
  [Feature.GOALS]: FeatureStatus.COMPLETE,
  [Feature.SALES_LOG_FILTERS]: FeatureStatus.COMPLETE,
  [Feature.QUICK_NOTES]: FeatureStatus.COMPLETE,
  
  // Advanced Features (In Development for Testing)
  [Feature.CUSTOM_DASHBOARD]: FeatureStatus.IN_DEVELOPMENT,
  [Feature.ADVANCED_ANALYTICS]: FeatureStatus.IN_DEVELOPMENT,
  [Feature.SAVED_PREFERENCES]: FeatureStatus.IN_DEVELOPMENT,
  
  // Organization Features (Planned/In Development)
  [Feature.MANAGER_VISIBILITY]: FeatureStatus.PLANNED,
  [Feature.TEAM_DASHBOARDS]: FeatureStatus.IN_DEVELOPMENT,
  [Feature.COMPETITIONS]: FeatureStatus.IN_DEVELOPMENT,
  [Feature.ORG_SETTINGS]: FeatureStatus.COMPLETE,
  
  // Extra Planned Features
  'ai_deal_optimizer': FeatureStatus.PLANNED,
  'customer_crm_sync': FeatureStatus.PLANNED,
};

export const featureAvailabilityService = {
  getStatus: (featureId: Feature | string): FeatureStatus => {
    return FEATURE_REGISTRY[featureId] || FeatureStatus.COMPLETE;
  },

  isInDevelopment: (featureId: Feature | string): boolean => {
    const status = FEATURE_REGISTRY[featureId];
    return status === FeatureStatus.IN_DEVELOPMENT || status === FeatureStatus.PLANNED;
  },

  isComplete: (featureId: Feature | string): boolean => {
    return FEATURE_REGISTRY[featureId] === FeatureStatus.COMPLETE;
  },

  getTooltipMessage: (featureId: Feature | string): string => {
    const status = FEATURE_REGISTRY[featureId];
    switch (status) {
      case FeatureStatus.IN_DEVELOPMENT:
        return 'This feature is currently in active development.';
      case FeatureStatus.PLANNED:
        return 'This feature is planned for a future update.';
      default:
        return 'This is still in development';
    }
  }
};
