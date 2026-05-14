import { Feature } from './featureAccessService';
import { SubscriptionTier } from '../types';

/**
 * StripeItWidgetSystem
 * Definitions and metadata for all available dashboard widgets.
 */

export enum WidgetType {
  UNITS = 'units',
  COMMISSION = 'commission',
  FRONT_END_GROSS = 'front_end_gross',
  BACK_END_GROSS = 'back_end_gross',
  TOTAL_GROSS = 'total_gross',
  AVERAGE_GROSS = 'average_gross',
  GOAL_PROGRESS = 'goal_progress',
  RECENT_DEALS = 'recent_deals',
  QUICK_NOTES = 'quick_notes',
  COMPETITIONS = 'competitions',
  TEAM_METRICS = 'team_metrics',
  ADJUSTMENTS = 'adjustments'
}

export interface WidgetDefinition {
  type: WidgetType;
  label: string;
  description: string;
  requiredFeature?: Feature;
  minTier: SubscriptionTier;
  defaultVisible: boolean;
}

export const WIDGET_DEFINITIONS: Record<WidgetType, WidgetDefinition> = {
  [WidgetType.UNITS]: {
    type: WidgetType.UNITS,
    label: 'Total Units',
    description: 'Current MTD units vs previous month.',
    minTier: SubscriptionTier.FREE,
    defaultVisible: true
  },
  [WidgetType.COMMISSION]: {
    type: WidgetType.COMMISSION,
    label: 'Est. Payout',
    description: 'MTD projected earnings across all deals.',
    minTier: SubscriptionTier.FREE,
    defaultVisible: true
  },
  [WidgetType.FRONT_END_GROSS]: {
    type: WidgetType.FRONT_END_GROSS,
    label: 'Front-End Gross',
    description: 'Total vehicle profit before add-ons.',
    minTier: SubscriptionTier.FREE,
    defaultVisible: true
  },
  [WidgetType.BACK_END_GROSS]: {
    type: WidgetType.BACK_END_GROSS,
    label: 'Back-End Gross',
    description: 'F&I, service, and ancillary profit.',
    minTier: SubscriptionTier.FREE,
    defaultVisible: true
  },
  [WidgetType.TOTAL_GROSS]: {
    type: WidgetType.TOTAL_GROSS,
    label: 'Total Gross',
    description: 'Combined front and back end dealership profit.',
    minTier: SubscriptionTier.BASIC,
    defaultVisible: true
  },
  [WidgetType.AVERAGE_GROSS]: {
    type: WidgetType.AVERAGE_GROSS,
    label: 'Average Gross',
    description: 'Revenue per unit performance.',
    minTier: SubscriptionTier.PRO,
    defaultVisible: true,
    requiredFeature: Feature.ADVANCED_ANALYTICS
  },
  [WidgetType.GOAL_PROGRESS]: {
    type: WidgetType.GOAL_PROGRESS,
    label: 'Goal Progress',
    description: 'Visual tracking against monthly unit targets.',
    minTier: SubscriptionTier.BASIC,
    defaultVisible: true,
    requiredFeature: Feature.GOALS
  },
  [WidgetType.RECENT_DEALS]: {
    type: WidgetType.RECENT_DEALS,
    label: 'Recent Deals',
    description: 'Quick view of your last logged sales.',
    minTier: SubscriptionTier.FREE,
    defaultVisible: true
  },
  [WidgetType.QUICK_NOTES]: {
    type: WidgetType.QUICK_NOTES,
    label: 'Quick Notes',
    description: 'Draft customer follow-ups and deal reminders.',
    minTier: SubscriptionTier.BASIC,
    defaultVisible: true,
    requiredFeature: Feature.QUICK_NOTES
  },
  [WidgetType.COMPETITIONS]: {
    type: WidgetType.COMPETITIONS,
    label: 'Competitions',
    description: 'Active Spiffs and dealership leaderboard.',
    minTier: SubscriptionTier.ORGANIZATION,
    defaultVisible: true,
    requiredFeature: Feature.COMPETITIONS
  },
  [WidgetType.TEAM_METRICS]: {
    type: WidgetType.TEAM_METRICS,
    label: 'Team Metrics',
    description: 'Organization-wide performance overview.',
    minTier: SubscriptionTier.ORGANIZATION,
    defaultVisible: true,
    requiredFeature: Feature.TEAM_DASHBOARDS
  },
  [WidgetType.ADJUSTMENTS]: {
    type: WidgetType.ADJUSTMENTS,
    label: 'Adjustments',
    description: '1-time monthly SPIFFs and payout adjustments.',
    minTier: SubscriptionTier.BASIC,
    defaultVisible: true
  }
};

export const widgetService = {
  getAvailableWidgets: (tier: SubscriptionTier) => {
    return Object.values(WIDGET_DEFINITIONS).filter(w => {
      // Logic could be expanded to check specific features if needed
      return true; // Return all for selection, but visibility logic will handle filtering
    });
  },

  getDefaultLayout: (): WidgetType[] => {
    return [
      WidgetType.UNITS,
      WidgetType.COMMISSION,
      WidgetType.GOAL_PROGRESS,
      WidgetType.FRONT_END_GROSS,
      WidgetType.BACK_END_GROSS,
      WidgetType.RECENT_DEALS,
      WidgetType.QUICK_NOTES,
      WidgetType.COMPETITIONS,
      WidgetType.ADJUSTMENTS
    ];
  }
};
