/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginForm } from './components/auth/LoginForm';
import { RootLayout } from './layouts/RootLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Typography } from './components/ui/Typography';
import { Card, CardHeader, CardContent } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Modal } from './components/ui/Modal';
import { UpgradeModal } from './components/ui/UpgradeModal';
import { FullscreenMobileFlow } from './components/layout/MobileFullscreenFlow';
import { Plus, TrendingUp, Users, DollarSign, Car, ArrowUpRight, CheckCircle2, Calculator, Target, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useResponsive } from './hooks/useResponsive';
import { useEruda } from './hooks/useEruda';
import { cn } from './lib/utils';
import { DealForm } from './components/forms/DealForm';
import { dealService } from './services/dealService';
import { StripeItCommissionSetupModal } from './components/commission/StripeItCommissionSetupModal';
import { PayPlanWizard } from './components/commission/PayPlanWizard';
import { payPlanService } from './services/payPlanService';
import { goalService } from './services/goalService';
import { Deal, DealStatus, Goal, PayPlan, UserRole, QuickNote, Competition, MonthlySpiff } from './types';
import { useUpdateDetection } from './hooks/useUpdateDetection';
import { UpdateNotificationBanner } from './components/ui/UpdateNotificationBanner';

import { HomeView } from './components/home/HomeView';
import { NoteEntryForm } from './components/notes/NoteEntryForm';
import { SpiffEntryForm } from './components/log/SpiffEntryForm';
import { CreateCompetitionForm } from './components/competitions/CreateCompetitionForm';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { LandingView } from './components/landing/LandingView';

// Route-level code-splitting: heavy views load on navigation, not at startup.
// Importer fns kept as named refs so the same chunk can be PRELOADED (warmed) ahead of navigation.
const importActivityFeed = () => import('./components/activity/ActivityFeed').then(m => ({ default: m.ActivityFeed }));
const importSalesLogView = () => import('./components/log/SalesLogView').then(m => ({ default: m.SalesLogView }));
const importReportView = () => import('./components/reports/ReportView').then(m => ({ default: m.ReportView }));
const importGoalsView = () => import('./components/goals/GoalsView').then(m => ({ default: m.GoalsView }));
const importAnalyticsView = () => import('./components/analytics/AnalyticsView').then(m => ({ default: m.AnalyticsView }));
const importSettingsView = () => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView }));

const ActivityFeed = lazy(importActivityFeed);
const SalesLogView = lazy(importSalesLogView);
const ReportView = lazy(importReportView);
const GoalsView = lazy(importGoalsView);
const AnalyticsView = lazy(importAnalyticsView);
const SettingsView = lazy(importSettingsView);

// Warm the core navigation chunks once the app is idle so screen switches don't flash a loader.
const preloadCoreRoutes = () => {
  importSalesLogView();
  importActivityFeed();
  importAnalyticsView();
  importGoalsView();
  importReportView();
  importSettingsView();
};
const ManagerView = lazy(() => import('./components/management/ManagerView').then(m => ({ default: m.ManagerView })));
const DealDeskView = lazy(() => import('./components/dealdesk/DealDeskView').then(m => ({ default: m.DealDeskView })));
const DealerDashboard = lazy(() => import('./components/dealer/DealerDashboard').then(m => ({ default: m.DealerDashboard })));
const FeedbackReviewPage = lazy(() => import('./components/feedback/FeedbackReviewPage').then(m => ({ default: m.FeedbackReviewPage })));
const AdminAnalyticsDashboard = lazy(() => import('./components/analytics/AdminAnalyticsDashboard').then(m => ({ default: m.AdminAnalyticsDashboard })));
const UserManagementPage = lazy(() => import('./components/management/UserManagementPage').then(m => ({ default: m.UserManagementPage })));
const DealerSalesLogView = lazy(() => import('./components/dealer/DealerSalesLogView').then(m => ({ default: m.DealerSalesLogView })));
const DealerSettingsView = lazy(() => import('./components/dealer/DealerSettingsView').then(m => ({ default: m.DealerSettingsView })));
const DealerUserManagementView = lazy(() => import('./components/dealer/DealerUserManagementView').then(m => ({ default: m.DealerUserManagementView })));
const DealerLogBuilderView = lazy(() => import('./components/dealer/DealerLogBuilderView').then(m => ({ default: m.DealerLogBuilderView })));
const DealerPayPlanTemplatesView = lazy(() => import('./components/dealer/DealerPayPlanTemplatesView').then(m => ({ default: m.DealerPayPlanTemplatesView })));
const DealerInvitesView = lazy(() => import('./components/dealer/DealerInvitesView').then(m => ({ default: m.DealerInvitesView })));
const DealerRosterView = lazy(() => import('./components/dealer/DealerRosterView').then(m => ({ default: m.DealerRosterView })));
const MyPayPlanView = lazy(() => import('./components/commission/MyPayPlanView').then(m => ({ default: m.MyPayPlanView })));
const DealerRequestsAdminView = lazy(() => import('./components/management/DealerRequestsAdminView').then(m => ({ default: m.DealerRequestsAdminView })));
const EffectsPreview = lazy(() => import('./components/admin/EffectsPreview').then(m => ({ default: m.EffectsPreview })));
import { UpgradePrompt } from './components/ui/UpgradePrompt';
import { FeedbackSystem } from './components/feedback/FeedbackSystem';

import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { permissionService } from './services/permissionService';
import { featureAccessService, Feature } from './services/featureAccessService';
import { SubscriptionTier } from './types';
import { UpgradeAccessScreen } from './components/subscription/UpgradeAccessScreen';
import { TrialWelcomeModal } from './components/subscription/TrialWelcomeModal';
import { MonthlyGoalCheckInModal } from './components/goals/MonthlyGoalCheckInModal';
import { WaitlistModal } from './components/subscription/WaitlistModal';
import { FeedbackType } from './types';
import { analyticsService } from './services/analyticsService';
import { AnalyticsEventType } from './types';
import { DealerAccessRequestFlow } from './components/dealer/DealerAccessRequestFlow';
import { AmbientEffectsLayer } from './components/effects/AmbientEffectsLayer';

import { AuthHydrationFallback } from './components/auth/AuthHydrationFallback';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { PageHeader } from './components/ui/PageHeader';
import { ScrollToTop } from './components/utils/ScrollToTop';

function MainAppFlow() {
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isNewSpiffOpen, setIsNewSpiffOpen] = useState(false);
  const [isPayPlanOpen, setIsPayPlanOpen] = useState(false);
  const [isCommissionArchitectOpen, setIsCommissionArchitectOpen] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [isCompetitionOpen, setIsCompetitionOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingSpiff, setEditingSpiff] = useState<MonthlySpiff | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);
  const [isTrialWelcomeOpen, setIsTrialWelcomeOpen] = useState(false);
  const { updateAvailable } = useUpdateDetection();
  const [dismissedUpdate, setDismissedUpdate] = useState(false);

  const { isMobile } = useResponsive();
  const { profile, user, isAdmin, isDeveloper, logout, addToast, updateProfileData } = useAuth();

  // Dev-only mobile console — loads Eruda for the developer account only,
  // completely inert (script never injected) for all other users.
  useEruda(isDeveloper);
  const location = useLocation();

  // StripeItAnalyticsSystem - Global Lifecycle Tracking
  useEffect(() => {
    analyticsService.setUser(user?.uid || null, user?.email || null);
    analyticsService.startSession();
    analyticsService.trackEvent(AnalyticsEventType.APP_VISIT);
  }, [user]);

  useEffect(() => {
    analyticsService.trackEvent(AnalyticsEventType.PAGE_VIEW, { path: location.pathname });
  }, [location.pathname]);

  // Preload core route chunks during idle time so navigating between screens is instant
  // (no Suspense loader flash). Uses requestIdleCallback where available.
  useEffect(() => {
    const ric = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1500));
    const id = ric(() => preloadCoreRoutes());
    return () => {
      const cic = (window as any).cancelIdleCallback;
      if (cic) cic(id); else clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (profile.subscriptionTier !== SubscriptionTier.TRIAL) return;
    if (!profile.trialEndsAt) return;
    if (Date.now() > profile.trialEndsAt) return;
    
    const sessionKey = `stripeit_trial_welcome_shown_${profile.uid}`;
    if (sessionStorage.getItem(sessionKey)) return;
    
    sessionStorage.setItem(sessionKey, 'true');
    setIsTrialWelcomeOpen(true);
  }, [profile?.uid, profile?.subscriptionTier]);
  
  const { 
    deals,
    payPlan,
    isLoading,
    handleSaveDeal, 
    handleSavePayPlan,
    handleSaveMonthlySpiff,
    handleSaveNote,
    handleCreateCompetition,
    handleCreateRandomDeal,
    handleSaveGoal,
    goal,
    monthlySpiffs,
    triggerError,
  } = useAppData();

  // --- New-month goal check-in ---
  const [isGoalCheckInOpen, setIsGoalCheckInOpen] = useState(false);
  const [previousGoal, setPreviousGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!profile || isLoading) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    // Already prompted this month (synced via preferences) — don't show again.
    if (profile.preferences?.goalPrompt?.lastPromptedMonth === currentMonth) return;

    let cancelled = false;
    (async () => {
      try {
        const [y, m] = currentMonth.split('-').map(Number);
        const prev = new Date(y, m - 2, 1);
        const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
        const prevGoal = await goalService.getGoalForMonth(profile.uid, profile.orgId, prevKey);
        if (cancelled) return;
        setPreviousGoal(prevGoal);
        setIsGoalCheckInOpen(true);
      } catch {
        // Non-blocking: if the lookup fails, simply don't prompt.
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.uid, isLoading]);

  const markGoalPromptSeen = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    updateProfileData({
      preferences: {
        ...(profile?.preferences as any),
        goalPrompt: { lastPromptedMonth: currentMonth },
      },
    }).catch(() => {});
  };

  const handleGoalCheckInClose = () => {
    setIsGoalCheckInOpen(false);
    markGoalPromptSeen();
  };

  useEffect(() => {
    const handleRandomDealEvent = () => {
      handleCreateRandomDeal().catch(err => {
        if (err.message.includes('Plan Limit Reached')) {
          setLimitMessage(err.message);
          setIsUpgradeOpen(true);
        }
      });
    };
    
    window.addEventListener('stripeit:create-random-deal', handleRandomDealEvent);

    const handleEditSpiffEvent = (e: any) => {
      setEditingSpiff(e.detail);
      setIsNewSpiffOpen(true);
    };
    window.addEventListener('stripeit:edit-spiff', handleEditSpiffEvent);
    
    const handleFeedbackEvent = (e: any) => {
      if (e.detail?.type) {
        setFeedbackType(e.detail.type);
      } else {
        setFeedbackType(undefined);
      }
      setIsFeedbackOpen(true);
    };
    window.addEventListener('stripeit:open-feedback', handleFeedbackEvent);

    const handleDrawer = (e: any) => {
      setIsDrawerOpen(e.detail?.isOpen ?? false);
    };
    window.addEventListener('stripeit:drawer-toggle', handleDrawer);

    const handleOpenWaitlistEvent = () => {
      setIsWaitlistOpen(true);
    };
    window.addEventListener('stripeit:open-waitlist', handleOpenWaitlistEvent);

    const handleUpgradeEvent = () => {
      setUpgradeModalMode('upgrade');
      setIsUpgradeModalOpen(true);
    };
    const handleManageEvent = () => {
      setUpgradeModalMode('manage');
      setIsUpgradeModalOpen(true);
    };
    window.addEventListener('stripeit:open-upgrade', handleUpgradeEvent);
    window.addEventListener('stripeit:open-manage', handleManageEvent);

    const handleOpenArchitect = () => {
      setIsCommissionArchitectOpen(true);
    };
    window.addEventListener('stripeit:open-commission-architect', handleOpenArchitect);

    return () => {
      window.removeEventListener('stripeit:create-random-deal', handleRandomDealEvent);
      window.removeEventListener('stripeit:edit-spiff', handleEditSpiffEvent);
      window.removeEventListener('stripeit:open-feedback', handleFeedbackEvent);
      window.removeEventListener('stripeit:drawer-toggle', handleDrawer);
      window.removeEventListener('stripeit:open-waitlist', handleOpenWaitlistEvent);
      window.removeEventListener('stripeit:open-upgrade', handleUpgradeEvent);
      window.removeEventListener('stripeit:open-manage', handleManageEvent);
      window.removeEventListener('stripeit:open-commission-architect', handleOpenArchitect);
    };
  }, [handleCreateRandomDeal]);

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalMode, setUpgradeModalMode] = useState<'upgrade' | 'manage'>('upgrade');

  const handleSubmitDeal = async (dealData: Partial<Deal>) => {
    setIsSubmitting(true);
    try {
      await handleSaveDeal(dealData, editingDeal?.id);
      setIsSubmitting(false);
      setIsNewDealOpen(false);
      setEditingDeal(null);
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.message.includes('Plan Limit Reached')) {
        setLimitMessage(error.message);
        setIsNewDealOpen(false);
        setEditingDeal(null);
        setIsUpgradeOpen(true);
      }
      // Error is already handled by triggerError inside handleSaveDeal in AppDataContext
    }
  };

  const onSavePayPlan = async (planData: Partial<PayPlan>) => {
    setIsSubmitting(true);
    try {
      await handleSavePayPlan(planData);
      setIsSubmitting(false);
      setIsPayPlanOpen(false);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const onSubmitQuickNote = async (noteData: Partial<QuickNote>) => {
    setIsSubmitting(true);
    try {
      await handleSaveNote(noteData);
      setIsSubmitting(false);
      setIsQuickNoteOpen(false);
    } catch (error: any) {
      setIsSubmitting(false);
      if (error.message.includes('Plan Limit Reached')) {
        setLimitMessage(error.message);
        setIsQuickNoteOpen(false);
        setIsUpgradeOpen(true);
      }
    }
  };

  const onSubmitCompetition = async (compData: any) => {
    setIsSubmitting(true);
    try {
      await handleCreateCompetition(compData);
      setIsSubmitting(false);
      setIsCompetitionOpen(false);
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const NewDealFooter = (
    <div className="flex gap-4">
      <Button variant="ghost" className="flex-1" onClick={() => { setIsNewDealOpen(false); setEditingDeal(null); }} disabled={isSubmitting}>Discard</Button>
      <Button form="deal-form" type="submit" className="flex-1 shadow-glow glow-primary" isLoading={isSubmitting}>
        {isSubmitting ? 'Saving...' : (editingDeal ? 'Update Deal' : 'Stripe It')}
      </Button>
    </div>
  );

  const handleUpgradeClick = async () => {
    if (!user || !profile) return;
    window.location.href = `https://buy.stripe.com/test_fZu3cu0St7Hk7EDgXq1kA00?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email || '')}`;
  };

  const onUpgradeClick = () => {
    setIsUpgradeOpen(true);
  };

  return (
    <>
      <UpdateNotificationBanner
        show={updateAvailable && !dismissedUpdate}
        onDismiss={() => setDismissedUpdate(true)}
      />
      <RootLayout 
      onLogDeal={() => { setEditingDeal(null); setIsNewDealOpen(true); }}
      onLogSpiff={() => { setEditingSpiff(null); setIsNewSpiffOpen(true); }}
      onConfigPayPlan={() => setIsPayPlanOpen(true)}
    >
      <AmbientEffectsLayer />
      <LoadingOverlay isLoading={isLoading && !!profile} />
      <OnboardingFlow
        onConfigPayPlan={() => setIsPayPlanOpen(true)}
        onLogDeal={() => {
          setEditingDeal(null);
          setIsNewDealOpen(true);
        }}
      />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full"
        >
          <Suspense fallback={null}>
          <Routes location={location}>
            <Route 
              path="/" 
              element={
                profile?.subscriptionTier === SubscriptionTier.ORGANIZATION ? (
                  <DealerDashboard />
                ) : permissionService.isManager(profile) ? (
                  <ManagerView 
                    onLogDeal={() => { setEditingDeal(null); setIsNewDealOpen(true); }}
                    onQuickNote={() => setIsQuickNoteOpen(true)}
                    onDealClick={(deal) => {
                       setEditingDeal(deal);
                       setIsNewDealOpen(true);
                    }}
                    onCreateCompetition={() => setIsCompetitionOpen(true)}
                  />
                ) : (
                  <HomeView 
                    onLogDeal={() => { setEditingDeal(null); setIsNewDealOpen(true); }}
                    onQuickNote={() => setIsQuickNoteOpen(true)}
                  />
                )
              } 
            />
            
            {/* Protected Feature Routes */}
            <Route 
              path="/activity" 
              element={
                featureAccessService.hasAccess(profile, Feature.ACTIVITY_FEED) 
                  ? <ActivityFeed /> 
                  : <UpgradeAccessScreen feature={Feature.ACTIVITY_FEED} tierRequired={SubscriptionTier.PRO} onUpgrade={onUpgradeClick} />
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                featureAccessService.hasAccess(profile, Feature.ADVANCED_ANALYTICS)
                  ? <AnalyticsView />
                  : <UpgradeAccessScreen
                      feature={Feature.ADVANCED_ANALYTICS}
                      tierRequired={SubscriptionTier.PRO}
                      onUpgrade={onUpgradeClick} />
              } 
            />
    
            <Route 
              path="/goals" 
              element={
                featureAccessService.hasAccess(profile, Feature.GOALS)
                  ? <GoalsView />
                  : <UpgradeAccessScreen
                      feature={Feature.GOALS}
                      tierRequired={SubscriptionTier.PRO}
                      onUpgrade={onUpgradeClick} />
              } 
            />
    
            <Route 
              path="/reports" 
              element={
                featureAccessService.hasAccess(profile, Feature.ADVANCED_ANALYTICS) 
                  ? <ReportView /> 
                  : <UpgradeAccessScreen feature={Feature.ADVANCED_ANALYTICS} tierRequired={SubscriptionTier.PRO} onUpgrade={onUpgradeClick} />
              } 
            />
    
            <Route 
              path="/inventory" 
              element={
                featureAccessService.hasAccess(profile, Feature.INVENTORY_MANAGEMENT) 
                  ? (
                    <DashboardLayout
                      header={
                        <PageHeader
                          title="Inventory Log"
                          subtitle="Lot status • vehicle telemetry"
                          icon={Car}
                        />
                      }
                      main={
                        <div className="flex items-center justify-center py-12 px-4 w-full">
                          <Card className="w-full max-w-md bg-[var(--color-bg-card)] border-[var(--color-border)] rounded-3xl p-10 flex flex-col items-center text-center">
                            <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-400 mb-6 shrink-0">
                              <Car size={24} />
                            </div>
                            <Typography variant="mono" className="text-brand-primary uppercase tracking-widest text-[10px] mb-2 font-black">
                              COMING SOON
                            </Typography>
                            <Typography variant="h2" className="text-[var(--color-text-primary)] font-black uppercase tracking-tight italic mb-3">
                              INVENTORY LOG
                            </Typography>
                            <Typography variant="p" className="text-slate-500 text-sm leading-relaxed text-center">
                              Lot status monitoring and vehicle telemetry. Arriving soon.
                            </Typography>
                          </Card>
                        </div>
                      }
                    />
                  )
                  : <UpgradeAccessScreen feature={Feature.INVENTORY_MANAGEMENT} tierRequired={SubscriptionTier.PRO} onUpgrade={onUpgradeClick} />
              } 
            />
    
            <Route 
              path="/sales-log" 
              element={
                <SalesLogView 
                  onEdit={(deal) => { setEditingDeal(deal); setIsNewDealOpen(true); }}
                  onConfigPayPlan={() => setIsPayPlanOpen(true)}
                  onUpgrade={handleUpgradeClick}
                />
              } 
            />
            <Route 
              path="/dealer/sales-log" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerSalesLogView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/settings" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerSettingsView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/users" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerUserManagementView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/log-builder" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerLogBuilderView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/pay-plans" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerPayPlanTemplatesView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/invites" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerInvitesView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/roster" 
              element={
                featureAccessService.hasAccess(profile, Feature.ORG_SETTINGS) 
                  ? <DealerRosterView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/request" 
              element={<DealerAccessRequestFlow />} 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsView 
                  profile={profile}
                  onLogout={logout}
                />
              } 
            />
            <Route 
              path="/admin/feedback" 
              element={
                isAdmin 
                  ? <FeedbackReviewPage /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                isAdmin 
                  ? <AdminAnalyticsDashboard /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                isAdmin 
                  ? <UserManagementPage /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin/dealer-requests" 
              element={
                isAdmin 
                  ? <DealerRequestsAdminView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route
              path="/effects-preview"
              element={
                profile?.isAdmin
                  ? <EffectsPreview />
                  : <Navigate to="/" />
              }
            />
            <Route 
              path="/deal-desk" 
              element={
                profile?.email === 'scottmoreau82@gmail.com'
                  ? <DealDeskView />
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="*" 
              element={
                <DashboardLayout
                  header={
                    <PageHeader
                      title="Page Not Found"
                      subtitle="This route doesn't exist"
                      icon={Calculator}
                    />
                  }
                  main={
                    <div className="flex flex-col items-center justify-center py-20 gap-6">
                      <Typography variant="mono" 
                        className="text-slate-500 uppercase tracking-widest text-xs text-center">
                        The page you're looking for doesn't exist or has moved.
                      </Typography>
                      <Button 
                        onClick={() => window.location.href = '/'}
                        className="bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] px-8 h-11 rounded-xl"
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                  }
                />
              } 
            />
          </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {isNewSpiffOpen && (
          isMobile ? (
            <FullscreenMobileFlow
              isOpen={isNewSpiffOpen}
              onClose={() => { setIsNewSpiffOpen(false); setEditingSpiff(null); }}
              title={editingSpiff ? "Edit SPIFF" : "Log SPIFF"}
            >
              <SpiffEntryForm 
                initialData={editingSpiff || {}} 
                onSubmit={async (data) => {
                  await handleSaveMonthlySpiff(data);
                  setIsNewSpiffOpen(false);
                  setEditingSpiff(null);
                }}
                onCancel={() => { setIsNewSpiffOpen(false); setEditingSpiff(null); }}
              />
            </FullscreenMobileFlow>
          ) : (
            <Modal
              isOpen={isNewSpiffOpen}
              onClose={() => { setIsNewSpiffOpen(false); setEditingSpiff(null); }}
              title={editingSpiff ? "Edit SPIFF" : "Log New SPIFF"}
            >
              <SpiffEntryForm 
                initialData={editingSpiff || {}} 
                onSubmit={async (data) => {
                  await handleSaveMonthlySpiff(data);
                  setIsNewSpiffOpen(false);
                  setEditingSpiff(null);
                }}
                onCancel={() => { setIsNewSpiffOpen(false); setEditingSpiff(null); }}
              />
            </Modal>
          )
        )}
      </AnimatePresence>

      {/* Feedback System */}
      <FeedbackSystem 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
        initialType={feedbackType}
      />

      {/* Shared Modals */}
      {isMobile ? (
        <FullscreenMobileFlow
          isOpen={isNewDealOpen}
          onClose={() => { setIsNewDealOpen(false); setEditingDeal(null); }}
          title={editingDeal ? "Edit Deal" : "Log Deal"}
          footer={NewDealFooter}
        >
          <DealForm initialData={editingDeal || {}} onSubmit={handleSubmitDeal} isLoading={isSubmitting} />
        </FullscreenMobileFlow>
      ) : (
        <Modal 
          isOpen={isNewDealOpen} 
          onClose={() => { setIsNewDealOpen(false); setEditingDeal(null); }}
          title={editingDeal ? "Edit Deal Entry" : "New Deal Entry"}
        >
          <DealForm initialData={editingDeal || {}} onSubmit={handleSubmitDeal} isLoading={isSubmitting} />
          <div className="mt-10">
            {NewDealFooter}
          </div>
        </Modal>
      )}

      {/* Quick Note Modal/Flow */}
      {isMobile ? (
        <FullscreenMobileFlow
          isOpen={isQuickNoteOpen}
          onClose={() => setIsQuickNoteOpen(false)}
          title="Quick Note"
        >
          <NoteEntryForm deals={deals} onSubmit={onSubmitQuickNote} onCancel={() => setIsQuickNoteOpen(false)} isLoading={isSubmitting} />
        </FullscreenMobileFlow>
      ) : (
        <Modal
          isOpen={isQuickNoteOpen}
          onClose={() => setIsQuickNoteOpen(false)}
          title="Capture Quick Note"
        >
          <NoteEntryForm deals={deals} onSubmit={onSubmitQuickNote} onCancel={() => setIsQuickNoteOpen(false)} isLoading={isSubmitting} />
        </Modal>
      )}

      {/* Competition Setup Modal/Flow */}
      {isMobile ? (
        <FullscreenMobileFlow
          isOpen={isCompetitionOpen}
          onClose={() => setIsCompetitionOpen(false)}
          title="New Competition"
        >
          <div className="p-4">
             <CreateCompetitionForm onSubmit={onSubmitCompetition} onCancel={() => setIsCompetitionOpen(false)} isLoading={isSubmitting} />
          </div>
        </FullscreenMobileFlow>
      ) : (
        <Modal
          isOpen={isCompetitionOpen}
          onClose={() => setIsCompetitionOpen(false)}
          title="Create New Competition"
        >
          <CreateCompetitionForm onSubmit={onSubmitCompetition} onCancel={() => setIsCompetitionOpen(false)} isLoading={isSubmitting} />
        </Modal>
      )}

      {/* Pay Plan Setup Modal */}
      <PayPlanWizard
        isOpen={isPayPlanOpen}
        onClose={() => setIsPayPlanOpen(false)}
        initialData={payPlan}
        onSubmit={onSavePayPlan}
        isLoading={isSubmitting}
      />

      <StripeItCommissionSetupModal
        isOpen={isCommissionArchitectOpen}
        onClose={() => setIsCommissionArchitectOpen(false)}
        initialData={payPlan}
        onSubmit={onSavePayPlan}
        isLoading={isSubmitting}
      />

      {/* Upgrade Modal - Plan Limit */}
      <Modal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        title="Upgrade Your Plan"
        className="z-[60]"
      >
        <UpgradePrompt 
          title="Unlimited Deal Logging"
          description={limitMessage}
          tierRequired="Pro"
          onUpgrade={() => {
            setIsUpgradeOpen(false);
            setUpgradeModalMode('upgrade');
            setIsUpgradeModalOpen(true);
          }}
        />
      </Modal>

      {/* Upgrade Modal - Stripe Checkout */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        mode={upgradeModalMode}
      />

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
      />

      {/* Global Mobile Log Deal FAB */}
      {isMobile && (location.pathname === '/' || isDrawerOpen) && !isNewDealOpen && !isNewSpiffOpen && !isFeedbackOpen && !isQuickNoteOpen && !isCompetitionOpen && (
        <div className={cn(
          "fixed bottom-10 z-50 transition-all duration-500 ease-in-out md:hidden global-mobile-log-deal-fab",
          (isDrawerOpen || profile?.email === 'scottmoreau82@gmail.com') ? "right-6 translate-x-0" : "left-1/2 -translate-x-1/2"
        )}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            {/* Visual Echo/Glow */}
            <div className="absolute inset-x-0 inset-y-0 rounded-full bg-brand-primary/15 blur-lg animate-pulse" />
            
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { setEditingDeal(null); setIsNewDealOpen(true); }}
              className="relative h-12 w-12 rounded-full bg-brand-primary text-bg-deep shadow-glow glow-primary flex items-center justify-center border border-bg-deep/40 transition-transform shadow-2xl"
            >
              <Plus size={22} strokeWidth={3} />
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* FAB Clearance Zone for Mobile Scroll */}
      {isMobile && (location.pathname === '/' || isDrawerOpen) && 
        !isNewDealOpen && !isNewSpiffOpen && 
        !isFeedbackOpen && !isQuickNoteOpen && 
        !isCompetitionOpen && (
        <div className="h-20 pointer-events-none" />
      )}

      <TrialWelcomeModal
        isOpen={isTrialWelcomeOpen}
        daysRemaining={profile?.trialEndsAt ? Math.max(0, Math.ceil((profile.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24))) : 0}
        onConfigPayPlan={() => { setIsTrialWelcomeOpen(false); setIsPayPlanOpen(true); }}
        onLogDeal={() => { setIsTrialWelcomeOpen(false); setEditingDeal(null); setIsNewDealOpen(true); }}
        onDismiss={() => setIsTrialWelcomeOpen(false)}
      />

      <MonthlyGoalCheckInModal
        isOpen={isGoalCheckInOpen}
        onClose={handleGoalCheckInClose}
        currentMonth={new Date().toISOString().slice(0, 7)}
        previousGoal={previousGoal}
        deals={deals}
        monthlySpiffs={monthlySpiffs}
        payPlan={payPlan}
        onSave={async (g) => {
          if (!profile) return;
          await handleSaveGoal({
            userId: profile.uid,
            orgId: profile.orgId,
            month: new Date().toISOString().slice(0, 7),
            unitGoal: g.unitGoal,
            frontGoal: g.frontGoal,
            backGoal: g.backGoal,
            commissionGoal: g.commissionGoal,
            enabledGoals: g.enabledGoals,
          });
          markGoalPromptSeen();
          addToast('Goals saved.', 'success');
        }}
      />
    </RootLayout>
    </>
  );
}

function AppContent() {
  const { user, profile, initialized, loading, connectionError, logout, retryHydration, addToast } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const previousMemberState = useRef<{ isFrozen: boolean, orgId: string | null } | null>(null);
  const [showLoadingFallback, setShowLoadingFallback] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user && !profile) {
      timer = setTimeout(() => {
        setShowLoadingFallback(true);
      }, 300);
    } else {
      setShowLoadingFallback(false);
    }
    return () => clearTimeout(timer);
  }, [user, profile]);

  // StripeItEjectionNotificationSystem
  useEffect(() => {
    if (profile && previousMemberState.current && !loading) {
      const wasInDealerOrg = previousMemberState.current.orgId && !previousMemberState.current.orgId.startsWith('PERSONAL-');
      const isInDealerOrg = profile.orgId && !profile.orgId.startsWith('PERSONAL-');
      
      const justFrozen = profile.isFrozen && !previousMemberState.current.isFrozen;
      const justRemoved = wasInDealerOrg && !isInDealerOrg;

      if (justFrozen || justRemoved) {
        const message = justFrozen 
          ? "Organization Access Frozen. Reverting to personal workspace." 
          : "Organizational membership revoked. Reverting to personal workspace.";
        
        addToast(message, 'info');
      }
    }
    
    if (profile && !loading) {
      previousMemberState.current = { isFrozen: !!profile.isFrozen, orgId: profile.orgId };
    }
  }, [profile, loading, addToast]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // If we have a user but no profile and we are stuck in a loading state,
    // trigger the fallback after a 10s safety window.
    if (user && !profile && loading) {
      timer = setTimeout(() => {
        // Double check conditions before showing fallback
        setShowFallback(true);
      }, 10000);
    } else {
      setShowFallback(false);
    }

    return () => clearTimeout(timer);
  }, [user, profile, loading]);

  // 0. Fallback UI if hydration hangs or fails critically
  if (showFallback) {
    return (
      <AuthHydrationFallback 
        onSignOut={logout}
        onRetry={() => {
          setShowFallback(false);
          retryHydration();
        }}
        error={connectionError}
      />
    );
  }
  
  // 1. App is determining if a session exists
  if (!initialized) {
    const path = window.location.pathname;
    const isPublicLandingPath = path === '/' || path === '/dealer/request';
    // Auth entry points must always be reachable, even mid-init or with a stale auth hint.
    const isAuthEntryPath = path === '/login' || path === '/signup';
    const hasAuthHint = typeof window !== 'undefined' && Object.keys(localStorage).some(key => key.includes('firebase:authUser'));

    // On public landing or auth-entry paths, ALWAYS show the interactive view immediately.
    // A stale 'firebase:authUser' key (left from a previous session) must not trap a
    // logged-out user on a non-clickable splash while auth tries — and fails — to resolve.
    // Auth still resolves in the background; if it succeeds the app advances normally.
    if (isPublicLandingPath) {
      return <LandingView />;
    }
    if (isAuthEntryPath) {
      return (
        <Routes>
          <Route path="/login" element={<LoginForm initialMode="signin" />} />
          <Route path="/signup" element={<LoginForm initialMode="signup" />} />
        </Routes>
      );
    }

    // On PROTECTED deep-links with an auth hint, show the dark loading screen
    // (prevents a landing-page flash before the app mounts).
    if (hasAuthHint) {
      return (
        <div className="fixed inset-0 bg-bg-deep
          flex items-center justify-center">
          <div className="flex flex-col items-center
            gap-4">
            <div className="h-10 w-10 rounded-xl
              bg-gradient-to-br from-brand-primary
              to-brand-deep flex items-center
              justify-center shadow-glow animate-pulse">
              <svg viewBox="0 0 24 24" fill="none"
                className="h-6 w-6 text-white"
                stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5
                  10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="h-1 w-24 rounded-full
              bg-white/5 overflow-hidden">
              <div className="h-full bg-brand-primary
                rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        </div>
      );
    }
    return <LandingView isInitializing />;
  }

  // 2. User is authenticated but profile is still hydrating (or null after tab resume)
  if (user && !profile && showLoadingFallback) {
    return <LandingView isInitializing />;
  }

  // 3. User is NOT authenticated -> Show public shell
  if (!user) {
    return (
      <Routes>
         <Route path="/" element={<LandingView />} />
         <Route path="/login" element={<LoginForm initialMode="signin" />} />
         <Route path="/signup" element={<LoginForm initialMode="signup" />} />
         <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }
  
  // 4. User is authenticated -> Hand over to AppDataProvider & MainAppFlow
  // ProtectedRoute inside MainAppFlow handles specific profile/connection error UI
  return (
    <AppDataProvider>
      <Routes>
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/signup" element={<Navigate to="/" />} />
        
        {/* Protected Main Entry Points */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              <MainAppFlow />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
