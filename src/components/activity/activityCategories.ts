import { ActivityEventType } from '@/src/types';

/**
 * StripeItActivityFeedSystem — shared category model.
 * Single source of truth mapping raw ActivityEventType values into the five
 * user-facing categories shown in the legend. Used by the feed (filtering +
 * legend toggles) and by ActivityItem, so they never drift apart.
 */

export type ActivityCategory =
  | 'new_deals'
  | 'calculations'
  | 'milestones'
  | 'battles'
  | 'global';

export interface ActivityCategoryMeta {
  key: ActivityCategory;
  label: string;
  /** Tailwind text color for the icon. */
  text: string;
  /** Tailwind background tint for the timeline node. */
  bg: string;
  /** Tailwind border/ring color for the timeline node. */
  border: string;
  /** Solid dot color used in the legend. */
  dot: string;
}

export const ACTIVITY_CATEGORIES: ActivityCategoryMeta[] = [
  { key: 'new_deals',    label: 'New Deals',    text: 'text-emerald-300',      bg: 'bg-emerald-400/20',      border: 'border-emerald-400/40',      dot: 'bg-emerald-400' },
  { key: 'calculations', label: 'Calculations', text: 'text-brand-primary',    bg: 'bg-brand-primary/20',    border: 'border-brand-primary/40',    dot: 'bg-brand-primary' },
  { key: 'milestones',   label: 'Milestones',   text: 'text-indigo-300',       bg: 'bg-indigo-400/20',       border: 'border-indigo-400/40',       dot: 'bg-indigo-400' },
  { key: 'battles',      label: 'Battles',      text: 'text-amber-300',        bg: 'bg-amber-400/20',        border: 'border-amber-400/40',        dot: 'bg-amber-400' },
  { key: 'global',       label: 'Global',       text: 'text-rose-300',         bg: 'bg-rose-400/20',         border: 'border-rose-400/40',         dot: 'bg-rose-400' },
];

export const categoryForEventType = (type: ActivityEventType): ActivityCategory => {
  switch (type) {
    case ActivityEventType.DEAL_CREATED:
      return 'new_deals';
    case ActivityEventType.DEAL_UPDATED:
    case ActivityEventType.DEAL_FINALIZED:
      return 'calculations';
    case ActivityEventType.GOAL_REACHED:
      return 'milestones';
    case ActivityEventType.COMPETITION_STARTED:
    case ActivityEventType.COMPETITION_ENDED:
      return 'battles';
    case ActivityEventType.ANNOUNCEMENT:
    case ActivityEventType.REMINDER:
    case ActivityEventType.FEEDBACK_SUBMITTED:
    default:
      return 'global';
  }
};

export const categoryMeta = (key: ActivityCategory): ActivityCategoryMeta =>
  ACTIVITY_CATEGORIES.find(c => c.key === key) ?? ACTIVITY_CATEGORIES[4];
