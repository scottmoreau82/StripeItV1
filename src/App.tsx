/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { FullscreenMobileFlow } from './components/layout/MobileFullscreenFlow';
import { Plus, TrendingUp, Users, DollarSign, Car, ArrowUpRight, CheckCircle2, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useResponsive } from './hooks/useResponsive';
import { cn } from './lib/utils';
import { DealForm } from './components/forms/DealForm';
import { dealService } from './services/dealService';
import { StripeItCommissionSetupModal } from './components/commission/StripeItCommissionSetupModal';
import { payPlanService } from './services/payPlanService';
import { goalService } from './services/goalService';
import { Deal, DealStatus, Goal, PayPlan, UserRole, QuickNote, Competition, MonthlySpiff } from './types';

import { HomeView } from './components/home/HomeView';
import { ActivityFeed } from './components/activity/ActivityFeed';
import { SalesLogView } from './components/log/SalesLogView';
import { ReportView } from './components/reports/ReportView';
import { SettingsView } from './components/settings/SettingsView';
import { ManagerView } from './components/management/ManagerView';
import { NoteEntryForm } from './components/notes/NoteEntryForm';
import { SpiffEntryForm } from './components/log/SpiffEntryForm';
import { CreateCompetitionForm } from './components/competitions/CreateCompetitionForm';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { LandingView } from './components/landing/LandingView';
import { DealerDashboard } from './components/dealer/DealerDashboard';
import { UpgradePrompt } from './components/ui/UpgradePrompt';
import { FeedbackSystem } from './components/feedback/FeedbackSystem';
import { FeedbackReviewPage } from './components/feedback/FeedbackReviewPage';

import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { permissionService } from './services/permissionService';
import { featureAccessService, Feature } from './services/featureAccessService';
import { SubscriptionTier } from './types';
import { UpgradeAccessScreen } from './components/subscription/UpgradeAccessScreen';
import { FeedbackType } from './types';
import { analyticsService } from './services/analyticsService';
import { AnalyticsEventType } from './types';
import { AdminAnalyticsDashboard } from './components/analytics/AdminAnalyticsDashboard';
import { UserManagementPage } from './components/management/UserManagementPage';
import { DealerSalesLogView } from './components/dealer/DealerSalesLogView';
import { DealerSettingsView } from './components/dealer/DealerSettingsView';
import { DealerUserManagementView } from './components/dealer/DealerUserManagementView';
import { DealerLogBuilderView } from './components/dealer/DealerLogBuilderView';
import { DealerAccessRequestFlow } from './components/dealer/DealerAccessRequestFlow';
import { DealerRequestsAdminView } from './components/management/DealerRequestsAdminView';

import { AuthHydrationFallback } from './components/auth/AuthHydrationFallback';
import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { PageHeader } from './components/ui/PageHeader';
import { ScrollToTop } from './components/utils/ScrollToTop';

function MainAppFlow() {
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isNewSpiffOpen, setIsNewSpiffOpen] = useState(false);
  const [isPayPlanOpen, setIsPayPlanOpen] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [isCompetitionOpen, setIsCompetitionOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingSpiff, setEditingSpiff] = useState<MonthlySpiff | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { isMobile } = useResponsive();
  const { profile, user, isAdmin, isDeveloper, logout } = useAuth();
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
  
  const { 
    deals,
    payPlan,
    showSuccess, 
    isLoading,
    handleSaveDeal, 
    handleSavePayPlan,
    handleSaveMonthlySpiff,
    handleSaveNote,
    handleCreateCompetition,
    handleCreateRandomDeal,
    triggerError,
  } = useAppData();

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

    return () => {
      window.removeEventListener('stripeit:create-random-deal', handleRandomDealEvent);
      window.removeEventListener('stripeit:edit-spiff', handleEditSpiffEvent);
      window.removeEventListener('stripeit:open-feedback', handleFeedbackEvent);
      window.removeEventListener('stripeit:drawer-toggle', handleDrawer);
    };
  }, [handleCreateRandomDeal]);

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');

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

  const onUpgradeClick = () => {
    setLimitMessage("Unlock premium sales intelligence and advanced tracking features.");
    setIsUpgradeOpen(true);
  };

  return (
    <RootLayout 
      onLogDeal={() => { setEditingDeal(null); setIsNewDealOpen(true); }}
      onLogSpiff={() => { setEditingSpiff(null); setIsNewSpiffOpen(true); }}
      onConfigPayPlan={() => setIsPayPlanOpen(true)}
    >
      <LoadingOverlay isLoading={isLoading && !!profile} />
      <OnboardingFlow />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="w-full"
        >
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
                    onConfigPayPlan={() => setIsPayPlanOpen(true)}
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
                  ? (
                    <DashboardLayout
                      header={
                        <PageHeader
                          title="Market Analytics"
                          subtitle="Performance telemetry • historical trends"
                          icon={TrendingUp}
                        />
                      }
                      main={<div className="py-20 text-center text-slate-500 italic uppercase tracking-[0.2em] text-xs">Analytics Module Loading...</div>}
                    />
                  )
                  : <UpgradeAccessScreen feature={Feature.ADVANCED_ANALYTICS} tierRequired={SubscriptionTier.PRO} onUpgrade={onUpgradeClick} />
              } 
            />
    
            <Route 
              path="/goals" 
              element={
                featureAccessService.hasAccess(profile, Feature.GOALS) 
                  ? (
                    <DashboardLayout
                      header={
                        <PageHeader
                          title="Career Goals"
                          subtitle="Pacing • targets • ambition"
                          icon={ArrowUpRight}
                        />
                      }
                      main={<div className="py-20 text-center text-slate-500 italic uppercase tracking-[0.2em] text-xs">Goal Management System Offline</div>}
                    />
                  )
                  : <UpgradeAccessScreen feature={Feature.GOALS} tierRequired={SubscriptionTier.PRO} onUpgrade={onUpgradeClick} />
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
                      main={<div className="py-20 text-center text-slate-500 italic uppercase tracking-[0.2em] text-xs">Inventory Access Restricted</div>}
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
                profile?.isAdmin 
                  ? <FeedbackReviewPage /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                profile?.isAdmin 
                  ? <AdminAnalyticsDashboard /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                profile?.isAdmin 
                  ? <UserManagementPage /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/admin/dealer-requests" 
              element={
                profile?.isAdmin 
                  ? <DealerRequestsAdminView /> 
                  : <Navigate to="/" />
              } 
            />
          </Routes>
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
      <StripeItCommissionSetupModal
        isOpen={isPayPlanOpen}
        onClose={() => setIsPayPlanOpen(false)}
        initialData={payPlan}
        onSubmit={onSavePayPlan}
        isLoading={isSubmitting}
      />

      {/* Upgrade Modal */}
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
            // In a real app, this would trigger the checkout flow
            setIsUpgradeOpen(false);
          }}
        />
      </Modal>

      {/* Global Mobile Log Deal FAB */}
      {isMobile && !isNewDealOpen && !isNewSpiffOpen && !isFeedbackOpen && !isQuickNoteOpen && !isCompetitionOpen && (
        <div className={cn(
          "fixed bottom-10 z-50 transition-all duration-500 ease-in-out md:hidden",
          isDrawerOpen ? "right-8 translate-x-0" : "left-1/2 -translate-x-1/2"
        )}>
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="relative"
          >
            {/* Visual Echo/Glow */}
            <div className="absolute inset-0 rounded-full bg-brand-primary/15 blur-lg animate-pulse" />
            
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => { setEditingDeal(null); setIsNewDealOpen(true); }}
              className="relative h-12 w-12 rounded-full bg-brand-primary text-bg-deep shadow-glow glow-primary flex items-center justify-center border-2 border-bg-deep/40 transition-transform shadow-2xl"
            >
              <Plus size={22} strokeWidth={3} />
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* FAB Clearance Zone for Mobile Scroll */}
      {isMobile && <div className="h-20 pointer-events-none" />}
    </RootLayout>
  );
}

function AppContent() {
  const { user, profile, initialized, loading, connectionError, logout, retryHydration, addToast } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const previousMemberState = useRef<{ isFrozen: boolean, orgId: string | null } | null>(null);

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
    const isPublicLandingPath = window.location.pathname === '/' || window.location.pathname === '/dealer/request';
    const hasAuthHint = typeof window !== 'undefined' && Object.keys(localStorage).some(key => key.includes('firebase:authUser'));
    
    // If we are on the landing page and don't have an auth hint, show the landing page immediately
    if (isPublicLandingPath && !hasAuthHint) {
      return <LandingView />;
    }
    
    // Otherwise show the initialization splash (for returning users or auth-related paths)
    return <LandingView isInitializing />;
  }

  // 2. User is authenticated but profile is still hydrating
  // We MUST wait for the profile to resolve (or fail) before mounting shells
  if (user && !profile && loading) {
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
