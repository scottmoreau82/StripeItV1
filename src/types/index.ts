/**
 * StripeIt Foundation Types
 */

export enum UserRole {
  SALES = 'sales',
  MANAGER = 'manager',
  GENERAL_MANAGER = 'gm',
  ADMIN = 'admin',
  DEALER_OWNER = 'dealer_owner'
}

export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  ORGANIZATION = 'organization',
  TRIAL = 'trial',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum OrganizationStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
}

export enum IconTheme {
  LUCIDE = 'lucide',
  PHOSPHOR = 'phosphor',
  TABLER = 'tabler',
  HEROICONS = 'heroicons'
}

export enum DealStatus {
  DRAFT = 'Draft',
  SUBMITTED = 'Submitted',
  FINALIZED = 'Finalized',
  CANCELLED = 'Cancelled'
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  visualTheme?: 'matrix' | 'og';
  iconTheme?: IconTheme;
  buttonShape?: 'standard' | 'parallelogram';
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
  orgName?: string;
  department?: 'Retail' | 'Internet';
  photoURL?: string;
  subscriptionTier: SubscriptionTier;
  isAdmin?: boolean;
  dashboardPreference?: UserDashboardPreference;
  createdAt: number;
  updatedAt: number;
  preferences?: UserPreferences;
  isFrozen?: boolean;
  suspensionAcknowledgedAt?: number;
  isDeleted?: boolean;
  lastActive?: number;
  themePreference?: 'dark' | 'light';
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
  active: boolean;
}

export interface PayPlanTier {
  id: string;
  threshold?: number; // Unit count
  maxUnits?: number; // Visual max units for display
  frontRate?: number; // Override front end % for this tier
  backRate?: number; // Override back end % for this tier
  bonusAmount: number; // One-time lump sum for hitting this level
  perUnitBonus: number; // Extra per unit
  isRetroactive: boolean; // If true, perUnitBonus applies to ALL units MTD. If false, only applies to units >= threshold.
  frontRetroactive?: boolean;
  backRetroactive?: boolean;
  newMiniOverride?: number;
  usedMiniOverride?: number;
  newFrontRate?: number;
  newBackRate?: number;
  usedFrontRate?: number;
  usedBackRate?: number;
  cpoFrontRate?: number;
  cpoBackRate?: number;
  usePerTypRates?: boolean;
  usePerTypeRates?: boolean;
}

export enum VolumeBonusType {
  FLAT = 'flat',
  CUMULATIVE = 'cumulative',
  NON_CUMULATIVE = 'non_cumulative',
  RETRO_PER_UNIT = 'retro_per_unit'
}

export enum VolumeBonusScope {
  ALL_UNITS = 'all_units',
  THRESHOLD_PLUS = 'threshold_plus'
}

export enum VolumeBonusFilter {
  ANY = 'any',
  NEW = 'new',
  USED = 'used',
  CPO = 'cpo'
}

export interface VolumeBonus {
  id: string;
  threshold: number;
  amount: number;
  type: VolumeBonusType;
  scope: VolumeBonusScope;
  filter: VolumeBonusFilter;
  active: boolean;
  notes?: string;
}

export enum HourlyPayoutModel {
  GUARANTEE = 'guarantee',
  ADDITIVE = 'additive',
  DRAW = 'draw'
}

export interface HourlyConfig {
  active: boolean;
  rate: number;
  hoursWorked: number;
  model: HourlyPayoutModel;
}

export interface MiniLadderTier {
  id: string;
  threshold: number;
  maxUnits: number | null;
  newMini: number;
  usedMini: number;
  isRetroactive: boolean; // Retroactive behavior for minis
  active: boolean;
}

export interface CustomMini {
  id: string;
  label: string;
  amount: number;
  active: boolean;
  filter: VolumeBonusFilter;
}

export interface PayPlan {
  id: string;
  organizationId: string;
  userId: string;
  name: string;
  miniAmount: number; // Legacy or default
  frontEndPercentage: number;
  backEndPercentage: number;
  flatPerUnitAmount: number;
  splitDealBehavior: 'standard' | 'half_mini';
  isSplitBehaviorActive?: boolean;
  isFlatPerUnitActive?: boolean;
  frontDeficitRecoveryEnabled?: boolean;
  schemaVersion?: string;
  
  // Advanced Features
  isAdvanced: boolean;
  isRulesEnabled?: boolean;
  isVolumeBonusActive?: boolean;
  isVolumeBonusEngineActive?: boolean; // New engine flag
  rules: PayPlanRule[];
  tiers: PayPlanTier[];
  volumeBonuses?: VolumeBonus[]; 
  
  // Minis and Hourly System
  isMinisAndHourlyActive?: boolean;
  isMinisActive?: boolean;
  isHourlyActive?: boolean;
  miniTiers?: MiniLadderTier[]; // New Mini Ladder System
  customMinis?: CustomMini[];
  hourlyConfig?: HourlyConfig;
  
  createdAt: number;
  updatedAt: number;
}

export enum LogFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  DROPDOWN = 'dropdown',
  TOGGLE = 'toggle',
  DATE = 'date'
}

export interface LogField {
  id: string;
  label: string;
  type: LogFieldType;
  required: boolean;
  visible: boolean;
  options?: string[];
  order: number;
}

export interface LogConfig {
  fields: LogField[];
  updatedAt: number;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  subscriptionTier: SubscriptionTier;
  status: OrganizationStatus;
  logConfig?: LogConfig;
  createdAt: number;
  updatedAt?: number;
  updatedBy?: string;
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
  lenderName?: string;
  reserveAmount?: number;
  tradeAllowance?: number;
  tradeACV?: number;
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
  units: number;
  frontEnd: number;
  backEnd: number;
  gross: number;
  commission: number;
  avgGross: number;
  avgCommission: number;
  dealPace: number;
  spiffsMTD: number;
}

export enum ActivityEventType {
  DEAL_CREATED = 'deal_created',
  DEAL_UPDATED = 'deal_updated',
  DEAL_FINALIZED = 'deal_finalized',
  GOAL_REACHED = 'goal_reached',
  COMPETITION_STARTED = 'competition_started',
  COMPETITION_ENDED = 'competition_ended',
  ANNOUNCEMENT = 'announcement',
  REMINDER = 'reminder',
  FEEDBACK_SUBMITTED = 'feedback_submitted'
}

export enum FeedbackType {
  BUG = 'bug',
  FEATURE = 'feature'
}

export enum FeedbackStatus {
  NEW = 'New',
  REVIEWED = 'Reviewed',
  IN_PROGRESS = 'In Progress',
  FIXED = 'Fixed',
  CLOSED = 'Closed',
  REJECTED = 'Rejected',
  PLANNED = 'Planned'
}

export enum FeedbackSeverity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum FeedbackImportance {
  NICE_TO_HAVE = 'Nice to have',
  IMPORTANT = 'Important',
  MUST_HAVE = 'Must have'
}

export interface FeedbackReport {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  pageArea: string;
  severity?: FeedbackSeverity;
  importance?: FeedbackImportance;
  notes?: string;
  screenshotUrl?: string;
  attachmentPath?: string;
  attachmentFileName?: string;
  attachmentContentType?: string;
  attachmentSize?: number;
  userId: string;
  userEmail: string;
  displayName?: string;
  subscriptionTier: SubscriptionTier;
  developerOverrideTier?: string;
  route: string;
  deviceInfo: {
    browser: string;
    os: string;
    userAgent: string;
    screenSize: string;
    viewportSize: string;
    isMobile: boolean;
  };
  status: FeedbackStatus;
  read?: boolean;
  archived?: boolean;
  createdAt: number;
  updatedAt: number;
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

export enum AnalyticsEventType {
  APP_VISIT = 'app_visit',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click',
  SIGNUP_STARTED = 'signup_started',
  SIGNUP_COMPLETED = 'signup_completed',
  LOGIN = 'login',
  LOGOUT = 'logout',
  DEAL_CREATED = 'deal_created',
  DEAL_EDITED = 'deal_edited',
  COMMISSION_MATRIX_UPDATED = 'commission_matrix_updated',
  SETTINGS_UPDATED = 'settings_updated',
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_UPGRADED = 'subscription_upgraded'
}

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  visitorId: string;
  sessionId: string;
  userId?: string;
  userEmail?: string;
  route: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export interface AnalyticsSession {
  id: string;
  visitorId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  pagesViewed: string[];
  clickCount: number;
  deviceInfo: {
    browser: string;
    os: string;
    isMobile: boolean;
  };
}

export interface DailyAnalyticsAggregate {
  id: string; // date string YYYY-MM-DD
  date: string;
  visits: number;
  signups: number;
  pageViews: number;
  clicks: number;
  activeSessions: number;
  timestamp: number;
}

export interface MonthlySpiff {
  id: string;
  userId: string;
  orgId: string;
  month: string; // e.g. "2024-05" - for grouping
  amount: number;
  label?: string;
  date: string; // ISO date for log sorting
  includedInTotal?: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DealerDeal {
  id: string;
  orgId: string;
  createdByUserId: string;
  createdAt: number;
  updatedAt: number;
  [key: string]: any;
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export enum DealerRequestStatus {
  PENDING = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export interface DealerAccessRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  dealershipName: string;
  workEmail: string;
  roleTitle: string;
  website: string;
  phoneNumber: string;
  notes?: string;
  status: DealerRequestStatus;
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export enum JoinCodeStatus {
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

export interface DealerJoinCode {
  id: string;
  code: string;
  organizationId: string;
  dealerName: string;
  dealerDomain?: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[]; // List of UIDs who used it
  status: JoinCodeStatus;
  department: 'Retail' | 'Internet';
  permissionsTemplate?: string;
}

export interface Invite {
  id: string;
  email: string;
  role: UserRole;
  orgId: string;
  token: string;
  status: InviteStatus;
  invitedBy: string;
  expiresAt: number;
  createdAt: number;
  acceptedAt?: number;
}
