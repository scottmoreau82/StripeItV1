import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { dealService } from '../services/dealService';
import { payPlanService } from '../services/payPlanService';
import { payPlanTemplateService } from '../services/payPlanTemplateService';
import { spiffService } from '../services/spiffService';
import { goalService } from '../services/goalService';
import { noteService } from '../services/noteService';
import { competitionService } from '../services/competitionService';
import { permissionService } from '../services/permissionService';
import { planLimitService, LimitType, getCurrentMonthDealCount } from '../services/planLimitService';
import { dashboardService } from '../services/dashboardService';
import { activityService } from '../services/activityService';
import { notificationService } from '../services/notificationService';
import { Deal, PayPlan, Goal, DealStatus, QuickNote, Competition, SubscriptionTier, DashboardLayout, ActivityEventType, AnalyticsEventType, MonthlySpiff } from '../types';
import { onSnapshot, query, collection, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getFriendlyErrorMessage } from '../lib/firebase';
import { analyticsService } from '../services/analyticsService';
import { COLLECTIONS } from '../constants';

/**
 * StripeItAppDataSystem & StripeItCommissionSystem (Data Link)
 * Centralized data context for high-performance state management and real-time synchronization.
 */

interface AppDataContextType {
  deals: Deal[];
  lockedDealsCount: number;
  payPlan: PayPlan | null;
  goal: Goal | null;
  notes: QuickNote[];
  monthlySpiffs: MonthlySpiff[];
  competitions: Competition[];
  isLoading: boolean;
  connectionBlocked: boolean;
  dashboardLayout: DashboardLayout;
  handleSaveDeal: (dealData: Partial<Deal>, editingId?: string) => Promise<void>;
  handleSaveGoal: (goalData: Partial<Goal>) => Promise<void>;
  handleDeleteDeal: (dealId: string) => Promise<void>;
  handleUpdateDealStatus: (dealId: string, newStatus: DealStatus) => Promise<void>;
  handleSavePayPlan: (planData: Partial<PayPlan>) => Promise<void>;
  handleSaveMonthlySpiff: (data: Partial<MonthlySpiff>) => Promise<void>;
  handleDeleteMonthlySpiff: (id: string) => Promise<void>;
  handleSaveNote: (noteData: Partial<QuickNote>) => Promise<void>;
  handleDeleteNote: (noteId: string) => Promise<void>;
  handleCreateCompetition: (data: any) => Promise<void>;
  handleSaveDashboardLayout: (layout: DashboardLayout) => Promise<void>;
  handleCreateRandomDeal: () => Promise<void>;
  refreshDeals: () => Promise<void>;
  triggerSuccess: (message?: string) => void;
  triggerError: (message: string) => void;
  isCommissionConfigured: boolean;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile, user, initialized, addToast } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [lockedDealsCount, setLockedDealsCount] = useState(0);
  const [payPlan, setPayPlan] = useState<PayPlan | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [monthlySpiffs, setMonthlySpiffs] = useState<MonthlySpiff[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionBlocked, setConnectionBlocked] = useState(false);

  // triggerSuccess now maps to global toast
  const triggerSuccess = useCallback((message: string = 'Action successful!') => {
    addToast(message, 'success');
  }, [addToast]);

  const triggerError = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  // Derive the effective Org ID for data operations.
  // If the user's connection to their primary dealership org is frozen, 
  // we fallback to their immutable personal workspace for safe operation.
  const effectiveOrgId = useMemo(() => {
    if (!profile) return null;
    if (profile.isFrozen) {
      return `PERSONAL-${user?.uid?.slice(0, 5)}`;
    }
    return profile.orgId;
  }, [profile, user]);

  // Dashboard Layout
  const dashboardLayout = React.useMemo(() => 
    profile?.dashboardPreference?.layout || dashboardService.generateDefaultLayout(), 
    [profile?.dashboardPreference?.layout]
  );

  const handleSaveDashboardLayout = useCallback(async (layout: DashboardLayout) => {
    if (!user) return;
    try {
      await dashboardService.saveUserLayout(user.uid, layout);
      triggerSuccess('Layout saved.');
    } catch (error) {
      console.error("Error saving dashboard layout:", error);
      triggerError('Failed to save layout.');
      throw error;
    }
  }, [user, triggerSuccess, triggerError]);

  // Static Data Fetching (Pay Plans, Goals)
  const loadStaticData = useCallback(async (orgId: string, userId: string) => {
    try {
      // Resolve-at-read: returns the template-driven plan (with any override) for org
      // members, or the personal plan if not template-linked.
      const plan = await payPlanTemplateService.resolveEffectivePayPlan(orgId, userId);
      if (plan) setPayPlan(plan);
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentGoal = await goalService.getGoalForMonth(userId, orgId, currentMonth);
      if (currentGoal) setGoal(currentGoal);

      const spiffData = await spiffService.getMonthlySpiffs(orgId, userId, currentMonth);
      setMonthlySpiffs(spiffData);
    } catch (error) {
      console.error("Error loading static app data:", error);
    }
  }, []);

  // Real-time Subscriptions (Deals, Notes, Competitions)
  useEffect(() => {
    // Parent AppContent ensures we only mount if user and profile are present
    if (!user || !profile || !effectiveOrgId) {
      if (!user) {
        setDeals([]);
        setNotes([]);
        setCompetitions([]);
      }
      setIsLoading(false);
      return;
    }

    const loadTimeout = setTimeout(() => {
      console.warn("AppDataContext - Initialization timeout reached.");
      setIsLoading(false);
    }, 8000); 

    setIsLoading(true);
    
    const initializeData = async () => {
      try {
        await loadStaticData(effectiveOrgId, user.uid);
      } catch (err) {
        console.error("Static data hydration failed:", err);
      }
    };

    initializeData();

    // Unified error handler for subscriptions to prevent permission spam
    const handleSubError = (error: any, path: string) => {
      setIsLoading(false);
      clearTimeout(loadTimeout);
      
      const isPermissionError = error.code === 'permission-denied' || error.message?.includes('permission-denied');
      
      // If user is frozen or losing org access, permission errors are expected and should be silenced
      if (isPermissionError && (profile?.isFrozen || profile?.subscriptionTier !== SubscriptionTier.ORGANIZATION)) {
        console.warn(`[AppDataContext] Silencing expected permission error during ejection/freeze: ${path}`);
        return;
      }

      console.error(`[AppDataContext] Subscription error at ${path}:`, error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        // Error is logged by handleFirestoreError, we've caught the throw to prevent spam
      }
    };

    // 1. Subscription to Deals
    const dealsCollectionPath = `${COLLECTIONS.ORGANIZATIONS}/${effectiveOrgId}/${COLLECTIONS.DEALS}`;
    let dealsQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, effectiveOrgId, COLLECTIONS.DEALS),
      orderBy('createdAt', 'desc')
    );
    
    if (!permissionService.isManager(profile)) {
      dealsQuery = query(dealsQuery, where('userId', '==', user.uid));
    }

    const blockCheckTimeout = setTimeout(() => {
      setConnectionBlocked(true);
    }, 8000);

    const unsubDeals = onSnapshot(dealsQuery, (snapshot) => {
      clearTimeout(blockCheckTimeout);
      setConnectionBlocked(false);
      const dealData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
          updatedAt: data.updatedAt?.toMillis?.() || (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
        } as Deal;
      });
      const isFreeUser = profile?.subscriptionTier ===
        SubscriptionTier.FREE;
      
      if (!isFreeUser && dealData.some(
        d => d.lockedByTier)) {
        dealService.unlockAllDeals(
          effectiveOrgId, user.uid
        ).catch(e => console.error(
          'Failed to unlock deals:', e));
      }

      const activeDeals = isFreeUser
        ? dealData.filter(d => !d.lockedByTier)
        : dealData;
      setDeals(activeDeals);
      setLockedDealsCount(
        isFreeUser
          ? dealData.filter(d => d.lockedByTier).length
          : 0
      );
      
      setIsLoading(false);
      clearTimeout(loadTimeout);
    }, (error) => {
      clearTimeout(blockCheckTimeout);
      handleSubError(error, dealsCollectionPath);
    });

    // 2. Subscription to Notes
    const notesCollectionPath = `${COLLECTIONS.ORGANIZATIONS}/${effectiveOrgId}/${COLLECTIONS.NOTES}`;
    const notesQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, effectiveOrgId, COLLECTIONS.NOTES),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubNotes = onSnapshot(notesQuery, (snapshot) => {
      const noteData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
          updatedAt: data.updatedAt?.toMillis?.() || (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
        } as QuickNote;
      });
      setNotes(noteData);
    }, (error) => handleSubError(error, notesCollectionPath));

    // 3. Subscription to Competitions
    const compsCollectionPath = `${COLLECTIONS.ORGANIZATIONS}/${effectiveOrgId}/${COLLECTIONS.COMPETITIONS}`;
    const compsQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, effectiveOrgId, COLLECTIONS.COMPETITIONS),
      where('endDate', '>=', Date.now())
    );

    const unsubComps = onSnapshot(compsQuery, (snapshot) => {
      const compData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          startDate: data.startDate?.toMillis?.() || (typeof data.startDate === 'number' ? data.startDate : Date.now()),
          endDate: data.endDate?.toMillis?.() || (typeof data.endDate === 'number' ? data.endDate : Date.now()),
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
          updatedAt: data.updatedAt?.toMillis?.() || (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
        } as Competition;
      });
      setCompetitions(compData);
    }, (error) => handleSubError(error, compsCollectionPath));

    // 4. Subscription to Monthly SPIFFs
    const spiffsCollectionPath = `${COLLECTIONS.ORGANIZATIONS}/${effectiveOrgId}/monthlySpiffs`;
    const spiffsQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, effectiveOrgId, 'monthlySpiffs'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubSpiffs = onSnapshot(spiffsQuery, (snapshot) => {
      const spiffData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
          updatedAt: data.updatedAt?.toMillis?.() || (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
        } as MonthlySpiff;
      });
      setMonthlySpiffs(spiffData);
    }, (error) => handleSubError(error, spiffsCollectionPath));

    return () => {
      clearTimeout(blockCheckTimeout);
      unsubDeals();
      unsubNotes();
      unsubComps();
      unsubSpiffs();
    };
  }, [profile, user, effectiveOrgId, loadStaticData]);

  const handleSaveDeal = useCallback(async (dealData: Partial<Deal>, editingId?: string) => {
    if (!profile || !user || !effectiveOrgId) return;
    
    try {
      let isOverLimit = false;
      if (!editingId) {
        const tier = profile.subscriptionTier || SubscriptionTier.FREE;
        const monthDealCount = getCurrentMonthDealCount(deals);
        const limit = planLimitService.getLimit(tier, LimitType.DEAL_STORAGE);
        isOverLimit = tier === SubscriptionTier.FREE && monthDealCount >= limit;

        if (monthDealCount === limit - 1) {
          addToast('Heads up — next deal will exceed your free monthly limit.', 'warning');
        }
      }

      if (editingId) {
        await dealService.updateDeal(effectiveOrgId, editingId, dealData);
        analyticsService.trackEvent(AnalyticsEventType.DEAL_EDITED, { dealId: editingId });
        
        if (dealData.status === DealStatus.FINALIZED) {
          await activityService.logEvent(effectiveOrgId, {
            type: ActivityEventType.DEAL_FINALIZED,
            userId: user.uid,
            userName: profile.displayName || 'Salesperson',
            orgId: effectiveOrgId,
            message: `Closed a deal for ${dealData.customerName || 'Customer'}!`,
            payload: { dealId: editingId, vehicle: dealData.purchasedVehicle }
          });
        }
        triggerSuccess('Deal updated.');
      } else {
        const dealId = await dealService.createDeal(effectiveOrgId, {
          userId: user.uid,
          createdByUserId: user.uid,
          assignedSalespersonId: user.uid,
          salespersonName: profile.displayName,
          dealershipId: profile.dealershipId,
          customerName: dealData.customerName!,
          purchasedVehicle: dealData.purchasedVehicle!,
          newOrUsed: dealData.newOrUsed as 'new' | 'used' | 'cpo',
          status: dealData.status!,
          date: dealData.date!,
          frontEndGross: dealData.frontEndGross || 0,
          backEndGross: dealData.backEndGross || 0,
          isSplitDeal: dealData.isSplitDeal || false,
          splitSalespersonId: dealData.splitSalespersonId,
          splitPercentage: dealData.splitPercentage,
          splitPartnerName: dealData.splitPartnerName,
          tradedVehicle: dealData.tradedVehicle,
          notes: dealData.notes,
          dealNumber: dealData.dealNumber,
          stockNumber: dealData.stockNumber,
          lockedByTier: isOverLimit ? true : false,
        });

        await activityService.logEvent(effectiveOrgId, {
          type: ActivityEventType.DEAL_CREATED,
          userId: user.uid,
          userName: profile.displayName || 'Salesperson',
          orgId: effectiveOrgId,
          message: `Logged a new ${dealData.newOrUsed || ''} deal for ${dealData.customerName}`,
          payload: { dealId, vehicle: dealData.purchasedVehicle }
        });
        analyticsService.trackEvent(AnalyticsEventType.DEAL_CREATED, { dealId, type: dealData.newOrUsed });
        
        if (isOverLimit) {
          addToast('Deal saved but hidden until you upgrade to Pro.', 'info');
        } else {
          triggerSuccess('Deal logged successfully!');
        }
      }
    } catch (error: any) {
      console.error("Deal Save Error:", error);
      triggerError(getFriendlyErrorMessage(error));
      throw error;
    }
  }, [profile, user, effectiveOrgId, deals, triggerSuccess, triggerError]);

  const handleDeleteDeal = useCallback(async (dealId: string) => {
    if (!effectiveOrgId) return;
    try {
      await dealService.deleteDeal(effectiveOrgId, dealId);
      triggerSuccess('Deal deleted.');
    } catch (error) {
      console.error("Deal deletion error:", error);
      triggerError('Failed to delete deal.');
      handleFirestoreError(error, OperationType.DELETE, `organizations/${effectiveOrgId}/deals/${dealId}`);
    }
  }, [effectiveOrgId, triggerSuccess, triggerError]);

  const handleUpdateDealStatus = useCallback(async (dealId: string, newStatus: DealStatus) => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      await dealService.updateDeal(effectiveOrgId, dealId, { status: newStatus });
      
      if (newStatus === DealStatus.FINALIZED) {
        const deal = deals.find(d => d.id === dealId);
        await activityService.logEvent(effectiveOrgId, {
          type: ActivityEventType.DEAL_FINALIZED,
          userId: user.uid,
          userName: profile.displayName || 'Salesperson',
          orgId: effectiveOrgId,
          message: `Finalized a deal for ${deal?.customerName || 'Customer'}!`,
          payload: { dealId, vehicle: deal?.purchasedVehicle }
        });

        await notificationService.notify(user.uid, {
          userId: user.uid,
          type: ActivityEventType.DEAL_FINALIZED,
          title: 'Deal Closed!',
          message: `Great job on the ${deal?.purchasedVehicle || 'vehicle'}! Your commission has been secured.`
        });
      }
      
      triggerSuccess(`Status updated to ${newStatus}`);
    } catch (error) {
      triggerError('Failed to update status.');
    }
  }, [profile, user, effectiveOrgId, deals, triggerSuccess, triggerError]);

  const handleSavePayPlan = useCallback(async (planData: Partial<PayPlan>) => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      const { id, createdAt, updatedAt, organizationId, userId, ...cleanPlan } = planData as any;
      await payPlanService.savePayPlan(effectiveOrgId, user.uid, cleanPlan);
      await loadStaticData(effectiveOrgId, user.uid);
      analyticsService.trackEvent(AnalyticsEventType.COMMISSION_MATRIX_UPDATED);
      triggerSuccess('Pay plan updated.');
    } catch (error: any) {
      console.error("Pay Plan Save Error:", error);
      triggerError(getFriendlyErrorMessage(error));
      throw error;
    }
  }, [profile, user, effectiveOrgId, loadStaticData, triggerSuccess, triggerError]);

  const handleSaveGoal = useCallback(async (
    goalData: Partial<Goal>
  ) => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      await goalService.saveGoal({
        ...goalData,
        userId: user.uid,
        orgId: effectiveOrgId,
        month: goalData.month ||
          new Date().toISOString().slice(0, 7)
      });
      const currentMonth = new Date()
        .toISOString().slice(0, 7);
      const updated = await goalService
        .getGoalForMonth(
          user.uid, effectiveOrgId, currentMonth);
      if (updated) setGoal(updated);
      triggerSuccess('Goals saved.');
    } catch (error: any) {
      console.error("Goal Save Error:", error);
      triggerError('Failed to save goals.');
      throw error;
    }
  }, [profile, user, effectiveOrgId, triggerSuccess, triggerError]);

  const handleSaveMonthlySpiff = useCallback(async (data: Partial<MonthlySpiff>) => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      await spiffService.saveMonthlySpiff(effectiveOrgId, {
        ...data,
        userId: user.uid,
        orgId: effectiveOrgId,
        month: data.month || new Date().toISOString().slice(0, 7)
      });
      triggerSuccess('Monthly adjustment saved.');
    } catch (error: any) {
      console.error("Monthly Spiff Save Error:", error);
      triggerError(getFriendlyErrorMessage(error));
    }
  }, [profile, user, effectiveOrgId, loadStaticData, triggerSuccess, triggerError]);

  const handleDeleteMonthlySpiff = useCallback(async (id: string) => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      await spiffService.deleteMonthlySpiff(effectiveOrgId, id);
      triggerSuccess('Adjustment deleted.');
    } catch (error) {
      triggerError('Failed to delete adjustment.');
    }
  }, [profile, user, effectiveOrgId, loadStaticData, triggerSuccess, triggerError]);

  const handleSaveNote = useCallback(async (noteData: Partial<QuickNote>) => {
    if (!profile || !user || !effectiveOrgId) return;
    
    try {
      // Enforce Note Limit for Free Tier
      const isLimitReached = planLimitService.isLimitReached(
        profile.subscriptionTier || SubscriptionTier.FREE,
        LimitType.NOTE_COUNT,
        notes.length
      );

      if (isLimitReached) {
        throw new Error(`Plan Limit Reached: Your current plan only supports ${planLimitService.getLimit(profile.subscriptionTier || SubscriptionTier.FREE, LimitType.NOTE_COUNT)} notes.`);
      }

      await noteService.createNote(effectiveOrgId, {
        userId: user.uid,
        text: noteData.text!,
        customerName: noteData.customerName,
        dealId: noteData.dealId,
        stockNumber: noteData.stockNumber,
        reminderDate: noteData.reminderDate,
      });
      triggerSuccess('Note saved.');
    } catch (error: any) {
      triggerError(getFriendlyErrorMessage(error));
    }
  }, [profile, user, effectiveOrgId, notes.length, triggerSuccess, triggerError]);

  const handleCreateRandomDeal = useCallback(async () => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      const { randomDealService } = await import('../services/randomDealService');
      const randomData = randomDealService.generateRandomDeal();
      await handleSaveDeal(randomData);
      // handleSaveDeal calls triggerSuccess
    } catch (error: any) {
      triggerError(error.message || 'Failed to generate deal.');
    }
  }, [profile, user, effectiveOrgId, handleSaveDeal, triggerError]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    if (!effectiveOrgId) return;
    try {
      await noteService.deleteNote(effectiveOrgId, noteId);
      triggerSuccess('Note deleted.');
    } catch (error) {
      triggerError('Failed to delete note.');
    }
  }, [effectiveOrgId, triggerSuccess, triggerError]);

  const handleCreateCompetition = useCallback(async (data: any) => {
    if (!profile || !user || !effectiveOrgId) return;
    try {
      await competitionService.createCompetition(effectiveOrgId, {
        ...data,
        createdByUserId: user.uid,
      });

      await activityService.logEvent(effectiveOrgId, {
        type: ActivityEventType.COMPETITION_STARTED,
        userId: user.uid,
        userName: profile.displayName || 'Manager',
        orgId: effectiveOrgId,
        message: `Launched a new battle: ${data.title}!`,
      });

      triggerSuccess('Competition created!');
    } catch (error) {
      triggerError('Failed to create competition.');
    }
  }, [profile, user, effectiveOrgId, triggerSuccess, triggerError]);

  const refreshDeals = useCallback(async () => {
    if (!effectiveOrgId || !user) return;
    await loadStaticData(effectiveOrgId, user.uid);
  }, [effectiveOrgId, user, loadStaticData]);

  const isCommissionConfigured = React.useMemo(() => {
    if (!payPlan) return false;
    const hasStandardTiers = payPlan.tiers && payPlan.tiers.length > 0;
    const hasMiniTiers = payPlan.isMinisActive && payPlan.miniTiers && payPlan.miniTiers.some(t => t.active);
    const hasBasicRates = (payPlan.frontEndPercentage > 0) || (payPlan.backEndPercentage > 0);
    return hasStandardTiers || hasMiniTiers || hasBasicRates;
  }, [payPlan]);

  const value = React.useMemo(() => ({
    deals,
    lockedDealsCount,
    payPlan,
    goal,
    notes,
    monthlySpiffs,
    competitions,
    isLoading,
    connectionBlocked,
    dashboardLayout,
    handleSaveDeal,
    handleSaveGoal,
    handleDeleteDeal,
    handleUpdateDealStatus,
    handleSavePayPlan,
    handleSaveMonthlySpiff,
    handleDeleteMonthlySpiff,
    handleSaveNote,
    handleDeleteNote,
    handleCreateCompetition,
    handleSaveDashboardLayout,
    handleCreateRandomDeal,
    refreshDeals,
    triggerSuccess,
    triggerError,
    isCommissionConfigured
  }), [
    deals,
    lockedDealsCount,
    payPlan,
    goal,
    notes,
    monthlySpiffs,
    competitions,
    isLoading,
    connectionBlocked,
    dashboardLayout,
    handleSaveDeal,
    handleSaveGoal,
    handleDeleteDeal,
    handleUpdateDealStatus,
    handleSavePayPlan,
    handleSaveMonthlySpiff,
    handleDeleteMonthlySpiff,
    handleSaveNote,
    handleDeleteNote,
    handleCreateCompetition,
    handleSaveDashboardLayout,
    handleCreateRandomDeal,
    refreshDeals,
    triggerSuccess,
    triggerError,
    isCommissionConfigured
  ]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
