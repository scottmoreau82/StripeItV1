/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
import { DealerDashboardView } from './components/dealer/DealerDashboardView';

import { LoadingOverlay } from './components/ui/LoadingOverlay';

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
  const { profile, user, isAdmin } = useAuth();
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
      <LoadingOverlay isLoading={isLoading} />
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
                  <DealerDashboardView />
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
                  : <UpgradeAccessScreen feature={Feature.ACTIVITY_FEED} tierRequired={SubscriptionTier.BASIC} onUpgrade={onUpgradeClick} />
              } 
            />
            
            <Route 
              path="/analytics" 
              element={
                featureAccessService.hasAccess(profile, Feature.ADVANCED_ANALYTICS) 
                  ? <div className="p-8"><Typography variant="h1">Analytics</Typography></div>
                  : <UpgradeAccessScreen feature={Feature.ADVANCED_ANALYTICS} tierRequired={SubscriptionTier.PRO} onUpgrade={onUpgradeClick} />
              } 
            />
    
            <Route 
              path="/goals" 
              element={
                featureAccessService.hasAccess(profile, Feature.GOALS) 
                  ? <div className="p-8"><Typography variant="h1">Goals</Typography></div>
                  : <UpgradeAccessScreen feature={Feature.GOALS} tierRequired={SubscriptionTier.BASIC} onUpgrade={onUpgradeClick} />
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
                  ? <div className="p-8"><Typography variant="h1">Inventory</Typography></div>
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
                profile?.subscriptionTier === SubscriptionTier.ORGANIZATION 
                  ? <DealerSalesLogView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/dealer/settings" 
              element={
                profile?.subscriptionTier === SubscriptionTier.ORGANIZATION 
                  ? <DealerSettingsView /> 
                  : <Navigate to="/" />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsView 
                  profile={profile}
                  onLogout={useAuth().logout}
                  isMobile={isMobile}
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
          tierRequired="Basic"
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
  const { user, profile, initialized, loading } = useAuth();
  
  // 1. App is still determining if a session exists
  if (!initialized) {
    return <LandingView isInitializing />;
  }

  // 2. User is authenticated but profile is still hydrating from Firestore
  // This prevents briefly showing "new user" or "unconfigured" states for existing users
  if (user && !profile && loading) {
    return <LandingView isInitializing />;
  }

  // 3. User is authenticated but profile fetch failed definitively
  // (we allow fallthrough to MainAppFlow where error states or fallback UI can show)
  
  return (
    <AppDataProvider>
      <Routes>
        {/* Public Landing & Auth */}
        <Route path="/" element={!user ? <LandingView /> : <ProtectedRoute><MainAppFlow /></ProtectedRoute>} />
        <Route path="/login" element={!user ? <LoginForm initialMode="signin" /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <LoginForm initialMode="signup" /> : <Navigate to="/" />} />
        
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
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
