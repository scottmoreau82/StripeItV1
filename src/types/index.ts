/**
 * StripeIt Foundation Types
 */

export enum UserRole {
  SALES = 'sales',
  MANAGER = 'manager',
  GENERAL_MANAGER = 'gm',
  ADMIN = 'admin'
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ORGANIZATION = 'organization'
}

export enum DealStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  FINALIZED = 'Finalized',
  CANCELLED = 'Cancelled'
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  onboarding?: OnboardingState;
  notifications: {
    dealReminders: boolean;
    goalAlerts: boolean;
    managerAnnouncements: boolean;
    competitionNotifications: boolean;
    payoutAlerts: boolean;
  };
  display: {
    showMetricsByDefault: boolean;
    currencySymbol: string;
    compactMode: boolean;
  };
}

export interface UserDashboardPreference {
  layout: DashboardLayout;
  lastUpdated: number;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
}

export interface WidgetConfig {
  id: string;
  type: string;
  visible: boolean;
  order: number;
  settings?: Record<string, any>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  dealershipId: string;
  orgId: string;
  photoURL?: string;
  subscriptionTier: SubscriptionTier;
  dashboardPreference?: UserDashboardPreference;
  createdAt: number;
  preferences?: UserPreferences;
}

export interface PayPlanRule {
  id: string;
  name: string;
  description?: string;
  condition: 'front_end_gross' | 'back_end_gross' | 'total_gross';
  operator: 'gt' | 'gte';
  threshold: number;
  rewardType: 'fixed_bonus' | 'percentage_increase';
  rewardValue: number;
}

export interface PayPlanTier {
  id: string;
  threshold: number; // Unit count
  bonusAmount: number; // One-time lump sum for hitting this level
  perUnitBonus: number; // Extra per unit
  isRetroactive: boolean; // If true, perUnitBonus applies to ALL units MTD. If false, only applies to units >= threshold.
}

export interface PayPlan {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  miniAmount: number;
  frontEndPercentage: number;
  backEndPercentage: number;
  flatPerUnitAmount: number;
  splitDealBehavior: 'standard' | 'half_mini';
  
  // Advanced Features
  isAdvanced: boolean;
  rules: PayPlanRule[];
  tiers: PayPlanTier[];
  
  createdAt: number;
  updatedAt: number;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  subscriptionTier: SubscriptionTier;
  createdAt: number;
}

export interface Dealership {
  id: string;
  orgId: string;
  name: string;
  location?: string;
  createdAt: number;
}

export interface Deal {
  id: string;
  orgId: string;
  dealershipId: string;
  userId: string; // Primary salesperson/owner
  createdByUserId: string;
  assignedSalespersonId: string;
  salespersonName?: string; // Denormalized for visibility
  date: string; // ISO string or specific format
  dealNumber?: string;
  stockNumber?: string;
  customerName: string;
  purchasedVehicle: string;
  tradedVehicle?: string;
  newOrUsed: 'new' | 'used' | 'cpo';
  frontEndGross: number;
  backEndGross: number;
  isSplitDeal: boolean;
  splitSalespersonId?: string;
  splitPercentage?: number;
  notes?: string;
  status: DealStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Goal {
  id: string;
  userId: string;
  orgId: string;
  month: string; // e.g. "2024-05"
  unitGoal: number;
  grossGoal?: number;
  commissionGoal?: number;
  createdAt: number;
  updatedAt: number;
}

export interface QuickNote {
  id: string;
  userId: string;
  orgId: string;
  text: string;
  customerName?: string;
  dealId?: string;
  stockNumber?: string;
  reminderDate?: string;
  createdAt: number;
  updatedAt: number;
}

export enum CompetitionType {
  UNITS = 'units',
  FRONT_END_GROSS = 'front_end_gross',
  BACK_END_GROSS = 'back_end_gross',
  TOTAL_GROSS = 'total_gross',
  COMMISSION = 'commission'
}

export enum CompetitionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Competition {
  id: string;
  orgId: string;
  createdByUserId: string;
  title: string;
  description?: string;
  type: CompetitionType;
  status: CompetitionStatus;
  startDate: number;
  endDate: number;
  rewardDescription?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  value: number;
  rank: number;
}

export interface DashboardMetrics {
  totalUnitsMTD: number;
  totalCommissionMTD: number;
  totalFrontEndGrossMTD: number;
  totalBackEndGrossMTD: number;
  totalGrossMTD: number;
  avgGrossPerUnit: number;
  avgCommissionPerUnit: number;
}

export enum ActivityEventType {
  DEAL_CREATED = 'deal_created',
  DEAL_UPDATED = 'deal_updated',
  DEAL_FINALIZED = 'deal_finalized',
  GOAL_REACHED = 'goal_reached',
  COMPETITION_STARTED = 'competition_started',
  COMPETITION_ENDED = 'competition_ended',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder'
}

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  userId: string;
  userName: string;
  orgId: string;
  dealershipId? : string;
  payload?: any;
  message: string;
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: ActivityEventType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: any;
  createdAt: number;
}

export interface NotificationPreferences {
  dealUpdates: boolean;
  goalReached: boolean;
  competitionAlerts: boolean;
  reminders: boolean;
}

export interface OnboardingState {
  isCompleted: boolean;
  currentStep: string;
  completedSteps: string[];
  seenHints: string[];
}
