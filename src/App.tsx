/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { DealForm } from './components/forms/DealForm';
import { dealService } from './services/dealService';
import { PayPlanForm } from './components/forms/PayPlanForm';
import { payPlanService } from './services/payPlanService';
import { goalService } from './services/goalService';
import { calculateTotalEarnings } from './lib/commissionLogic';
import { Deal, DealStatus, Goal, PayPlan, UserRole, QuickNote, Competition } from './types';

import { HomeView } from './components/home/HomeView';
import { ActivityFeed } from './components/activity/ActivityFeed';
import { SalesLogView } from './components/log/SalesLogView';
import { ReportView } from './components/reports/ReportView';
import { SettingsView } from './components/settings/SettingsView';
import { ManagerView } from './components/management/ManagerView';
import { NoteEntryForm } from './components/notes/NoteEntryForm';
import { CreateCompetitionForm } from './components/competitions/CreateCompetitionForm';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { ContextHint } from './components/onboarding/ContextHint';
import { UpgradePrompt } from './components/ui/UpgradePrompt';

import { AppDataProvider, useAppData } from './contexts/AppDataContext';
import { permissionService } from './services/permissionService';
import { featureAccessService, Feature } from './services/featureAccessService';
import { SubscriptionTier } from './types';
import { UpgradeAccessScreen } from './components/subscription/UpgradeAccessScreen';

import { LoadingOverlay } from './components/ui/LoadingOverlay';
import { LandingPage } from './components/home/LandingPage';

function MainAppFlow() {
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [isPayPlanOpen, setIsPayPlanOpen] = useState(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState(false);
  const [isCompetitionOpen, setIsCompetitionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  const { isMobile } = useResponsive();
  const { profile, user } = useAuth();
  
  const { 
    deals,
    payPlan,
    showSuccess, 
    isLoading,
    handleSaveDeal, 
    handleSavePayPlan,
    handleSaveNote,
    handleCreateCompetition,
    handleCreateRandomDeal,
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
    return () => window.removeEventListener('stripeit:create-random-deal', handleRandomDealEvent);
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
        {editingDeal ? 'Update Deal' : 'Save Deal'}
      </Button>
    </div>
  );

  const onUpgradeClick = () => {
    setLimitMessage("Unlock premium sales intelligence and advanced tracking features.");
    setIsUpgradeOpen(true);
  };

  return (
    <RootLayout onLogDeal={() => { setEditingDeal(null); setIsNewDealOpen(true); }}>
      <LoadingOverlay isLoading={isLoading} />
      <OnboardingFlow />
      
      <Routes>
        <Route 
          path="/" 
          element={
            permissionService.isManager(profile) ? (
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
                onConfigPayPlan={() => setIsPayPlanOpen(true)}
              />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            permissionService.isManager(profile) ? (
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
                onConfigPayPlan={() => setIsPayPlanOpen(true)}
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
            />
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
      </Routes>

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

      {/* Pay Plan Setup Modal/Flow */}
      {isMobile ? (
        <FullscreenMobileFlow
          isOpen={isPayPlanOpen}
          onClose={() => setIsPayPlanOpen(false)}
          title="Pay Plan Setup"
        >
          <PayPlanForm 
            initialData={payPlan || {}} 
            onSubmit={handleSavePayPlan} 
            isLoading={isSubmitting} 
          />
        </FullscreenMobileFlow>
      ) : (
        <Modal
          isOpen={isPayPlanOpen}
          onClose={() => setIsPayPlanOpen(false)}
          title="Commission Payout Setup"
        >
          <PayPlanForm 
            initialData={payPlan || {}} 
            onSubmit={onSavePayPlan} 
            isLoading={isSubmitting} 
          />
        </Modal>
      )}

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
    </RootLayout>
  );
}

function AppContent() {
  const { user, profile, initialized, loading } = useAuth();
  
  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent shadow-glow" />
          <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[10px]">
             Initializing StripeIt Client...
          </Typography>
        </div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-deep">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent shadow-glow" />
          <Typography variant="mono" className="text-brand-primary uppercase tracking-widest text-[10px] animate-pulse">
             Authenticating Secure Session...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/dashboard" replace />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainAppFlow />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
