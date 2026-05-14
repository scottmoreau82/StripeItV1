import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { dealService } from '../services/dealService';
import { payPlanService } from '../services/payPlanService';
import { spiffService } from '../services/spiffService';
import { goalService } from '../services/goalService';
import { noteService } from '../services/noteService';
import { competitionService } from '../services/competitionService';
import { permissionService } from '../services/permissionService';
import { planLimitService, LimitType } from '../services/planLimitService';
import { dashboardService } from '../services/dashboardService';
import { activityService } from '../services/activityService';
import { notificationService } from '../services/notificationService';
import { Deal, PayPlan, Goal, DealStatus, QuickNote, Competition, SubscriptionTier, DashboardLayout, ActivityEventType, AnalyticsEventType, MonthlySpiff } from '../types';
import { onSnapshot, query, collection, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { analyticsService } from '../services/analyticsService';
import { COLLECTIONS } from '../constants';

/**
 * StripeItAppDataSystem & StripeItCommissionSystem (Data Link)
 * Centralized data context for high-performance state management and real-time synchronization.
 */

interface AppDataContextType {
  deals: Deal[];
  payPlan: PayPlan | null;
  goal: Goal | null;
  notes: QuickNote[];
  monthlySpiffs: MonthlySpiff[];
  competitions: Competition[];
  isLoading: boolean;
  showSuccess: boolean;
  dashboardLayout: DashboardLayout;
  handleSaveDeal: (dealData: Partial<Deal>, editingId?: string) => Promise<void>;
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
  const [payPlan, setPayPlan] = useState<PayPlan | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [monthlySpiffs, setMonthlySpiffs] = useState<MonthlySpiff[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // triggerSuccess now maps to global toast
  const triggerSuccess = useCallback((message: string = 'Action successful!') => {
    addToast(message, 'success');
  }, [addToast]);

  const triggerError = useCallback((message: string) => {
    addToast(message, 'error');
  }, [addToast]);

  // Dashboard Layout
  const dashboardLayout = React.useMemo(() => 
    profile?.dashboardPreference?.layout || dashboardService.generateDefaultLayout(), 
    [profile?.dashboardPreference?.layout]
  );

  const handleSaveDashboardLayout = async (layout: DashboardLayout) => {
    if (!user) return;
    try {
      await dashboardService.saveUserLayout(user.uid, layout);
      triggerSuccess('Layout saved.');
    } catch (error) {
      console.error("Error saving dashboard layout:", error);
      triggerError('Failed to save layout.');
      throw error;
    }
  };

  // Static Data Fetching (Pay Plans, Goals)
  const loadStaticData = useCallback(async (orgId: string, userId: string) => {
    try {
      const plan = await payPlanService.getPrimaryPayPlan(orgId, userId);
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
    // If not logged in, we're not loading app data
    if (!user) {
      setDeals([]);
      setNotes([]);
      setCompetitions([]);
      setIsLoading(false);
      return;
    }

    // If logged in but profile hasn't arrived yet, we ARE loading
    if (!profile) {
      if (initialized) {
        // If Auth says it's initialized but profile is still null, 
        // something is wrong with the profile fetch but auth is technically "ready".
        // We shouldn't hang here forever.
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }
      return;
    }

    const loadTimeout = setTimeout(() => {
      console.warn("AppDataContext - Initialization timeout reached.");
      setIsLoading(false);
    }, 8000); 

    setIsLoading(true);
    loadStaticData(profile.orgId, user.uid);

    // 1. Subscription to Deals
    let dealsQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, profile.orgId, COLLECTIONS.DEALS),
      orderBy('createdAt', 'desc')
    );
    
    if (!permissionService.isManager(profile)) {
      dealsQuery = query(dealsQuery, where('userId', '==', user.uid));
    }

    const unsubDeals = onSnapshot(dealsQuery, (snapshot) => {
      const dealData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toMillis?.() || (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
          updatedAt: data.updatedAt?.toMillis?.() || (typeof data.updatedAt === 'number' ? data.updatedAt : Date.now())
        } as Deal;
      });
      setDeals(dealData);
      setIsLoading(false);
      clearTimeout(loadTimeout);
    }, (error) => {
      console.error("Deals subscription error:", error);
      setIsLoading(false);
      clearTimeout(loadTimeout);
      if (error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, `organizations/${profile.orgId}/deals`);
      }
    });

    // 2. Subscription to Notes
    const notesQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, profile.orgId, COLLECTIONS.NOTES),
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
    }, (error) => {
      console.error("Notes subscription error:", error);
      if (error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, `organizations/${profile.orgId}/notes`);
      }
    });

    // 3. Subscription to Competitions
    const compsQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, profile.orgId, COLLECTIONS.COMPETITIONS),
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
    }, (error) => {
      console.error("Competitions subscription error:", error);
      if (error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, `organizations/${profile.orgId}/competitions`);
      }
    });

    // 4. Subscription to Monthly SPIFFs
    const spiffsQuery = query(
      collection(db, COLLECTIONS.ORGANIZATIONS, profile.orgId, 'monthlySpiffs'),
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
    }, (error) => {
      console.error("Spiffs subscription error:", error);
      if (error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.LIST, `organizations/${profile.orgId}/monthlySpiffs`);
      }
    });

    return () => {
      unsubDeals();
      unsubNotes();
      unsubComps();
      unsubSpiffs();
    };
  }, [profile, user, loadStaticData]);

  const handleSaveDeal = async (dealData: Partial<Deal>, editingId?: string) => {
    if (!profile || !user) return;
    
    try {
      if (!editingId) {
        const isLimitReached = planLimitService.isLimitReached(
          profile.subscriptionTier || SubscriptionTier.FREE, 
          LimitType.DEAL_STORAGE, 
          deals.length
        );

        if (isLimitReached) {
          throw new Error(`Plan Limit Reached: Your current plan only supports ${planLimitService.getLimit(profile.subscriptionTier || SubscriptionTier.FREE, LimitType.DEAL_STORAGE)} deals.`);
        }
      }

      if (editingId) {
        await dealService.updateDeal(profile.orgId, editingId, dealData);
        analyticsService.trackEvent(AnalyticsEventType.DEAL_EDITED, { dealId: editingId });
        
        if (dealData.status === DealStatus.FINALIZED) {
          await activityService.logEvent(profile.orgId, {
            type: ActivityEventType.DEAL_FINALIZED,
            userId: user.uid,
            userName: profile.displayName || 'Salesperson',
            orgId: profile.orgId,
            message: `Closed a deal for ${dealData.customerName || 'Customer'}!`,
            payload: { dealId: editingId, vehicle: dealData.purchasedVehicle }
          });
        }
        triggerSuccess('Deal updated.');
      } else {
        const dealId = await dealService.createDeal(profile.orgId, {
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
          tradedVehicle: dealData.tradedVehicle,
          notes: dealData.notes,
          dealNumber: dealData.dealNumber,
          stockNumber: dealData.stockNumber,
        });

        await activityService.logEvent(profile.orgId, {
          type: ActivityEventType.DEAL_CREATED,
          userId: user.uid,
          userName: profile.displayName || 'Salesperson',
          orgId: profile.orgId,
          message: `Logged a new ${dealData.newOrUsed || ''} deal for ${dealData.customerName}`,
          payload: { dealId, vehicle: dealData.purchasedVehicle }
        });
        analyticsService.trackEvent(AnalyticsEventType.DEAL_CREATED, { dealId, type: dealData.newOrUsed });
        triggerSuccess('Deal logged successfully!');
      }
    } catch (error: any) {
      console.error("Deal Save Error:", error);
      let message = editingId ? 'Failed to update deal.' : 'Failed to save deal.';
      
      // Attempt to parse stringified Firestore error
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('permission')) {
          message = "Permission Denied: You don't have authority to modify deals in this organization.";
        } else if (parsed.error) {
          message = `Persistence Error: ${parsed.error}`;
        }
      } catch (e) {
        if (error.message && !error.message.includes('{')) {
          message = error.message;
        }
      }
      
      triggerError(message);
      throw error;
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (!profile) return;
    try {
      await dealService.deleteDeal(profile.orgId, dealId);
      triggerSuccess('Deal deleted.');
    } catch (error) {
      console.error("Deal deletion error:", error);
      triggerError('Failed to delete deal.');
      handleFirestoreError(error, OperationType.DELETE, `organizations/${profile.orgId}/deals/${dealId}`);
    }
  };

  const handleUpdateDealStatus = async (dealId: string, newStatus: DealStatus) => {
    if (!profile || !user) return;
    try {
      await dealService.updateDeal(profile.orgId, dealId, { status: newStatus });
      
      if (newStatus === DealStatus.FINALIZED) {
        const deal = deals.find(d => d.id === dealId);
        await activityService.logEvent(profile.orgId, {
          type: ActivityEventType.DEAL_FINALIZED,
          userId: user.uid,
          userName: profile.displayName || 'Salesperson',
          orgId: profile.orgId,
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
  };

  const handleSavePayPlan = async (planData: Partial<PayPlan>) => {
    if (!profile || !user) return;
    try {
      const { id, createdAt, updatedAt, organizationId, userId, ...cleanPlan } = planData as any;
      await payPlanService.savePayPlan(profile.orgId, user.uid, cleanPlan);
      await loadStaticData(profile.orgId, user.uid);
      analyticsService.trackEvent(AnalyticsEventType.COMMISSION_MATRIX_UPDATED);
      triggerSuccess('Pay plan updated.');
    } catch (error: any) {
      console.error("Pay Plan Save Error:", error);
      // If it's a Firestore error object from our helper, it might be stringified JSON
      let message = 'Failed to save pay plan.';
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error) message = `Persistence Error: ${parsed.error}`;
      } catch (e) {
        if (error.message) message = error.message;
      }
      triggerError(message);
      throw error;
    }
  };

  const handleSaveMonthlySpiff = async (data: Partial<MonthlySpiff>) => {
    if (!profile || !user) return;
    try {
      await spiffService.saveMonthlySpiff(profile.orgId, {
        ...data,
        userId: user.uid,
        orgId: profile.orgId,
        month: data.month || new Date().toISOString().slice(0, 7)
      });
      await loadStaticData(profile.orgId, user.uid);
      triggerSuccess('Monthly adjustment saved.');
    } catch (error) {
      triggerError('Failed to save adjustment.');
    }
  };

  const handleDeleteMonthlySpiff = async (id: string) => {
    if (!profile || !user) return;
    try {
      await spiffService.deleteMonthlySpiff(profile.orgId, id);
      await loadStaticData(profile.orgId, user.uid);
      triggerSuccess('Adjustment deleted.');
    } catch (error) {
      triggerError('Failed to delete adjustment.');
    }
  };

  const handleSaveNote = async (noteData: Partial<QuickNote>) => {
    if (!profile || !user) return;
    
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

      await noteService.createNote(profile.orgId, {
        userId: user.uid,
        text: noteData.text!,
        customerName: noteData.customerName,
        dealId: noteData.dealId,
        stockNumber: noteData.stockNumber,
        reminderDate: noteData.reminderDate,
      });
      triggerSuccess('Note saved.');
    } catch (error: any) {
      triggerError(error.message || 'Failed to save note.');
    }
  };

  const handleCreateRandomDeal = async () => {
    if (!profile || !user) return;
    try {
      const { randomDealService } = await import('../services/randomDealService');
      const randomData = randomDealService.generateRandomDeal();
      await handleSaveDeal(randomData);
      // handleSaveDeal calls triggerSuccess
    } catch (error: any) {
      triggerError(error.message || 'Failed to generate deal.');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!profile) return;
    try {
      await noteService.deleteNote(profile.orgId, noteId);
      triggerSuccess('Note deleted.');
    } catch (error) {
      triggerError('Failed to delete note.');
    }
  };

  const handleCreateCompetition = async (data: any) => {
    if (!profile || !user) return;
    try {
      await competitionService.createCompetition(profile.orgId, {
        ...data,
        createdByUserId: user.uid,
      });

      await activityService.logEvent(profile.orgId, {
        type: ActivityEventType.COMPETITION_STARTED,
        userId: user.uid,
        userName: profile.displayName || 'Manager',
        orgId: profile.orgId,
        message: `Launched a new battle: ${data.title}!`,
      });

      triggerSuccess('Competition created!');
    } catch (error) {
      triggerError('Failed to create competition.');
    }
  };

  const refreshDeals = async () => {
    await loadStaticData(profile?.orgId || '', user?.uid || '');
  };

  const isCommissionConfigured = React.useMemo(() => {
    if (!payPlan) return false;
    const hasStandardTiers = payPlan.tiers && payPlan.tiers.length > 0;
    const hasMiniTiers = payPlan.isMinisActive && payPlan.miniTiers && payPlan.miniTiers.some(t => t.active);
    return hasStandardTiers || hasMiniTiers;
  }, [payPlan]);

  return (
    <AppDataContext.Provider value={{
      deals,
      payPlan,
      goal,
      notes,
      monthlySpiffs,
      competitions,
      isLoading,
      showSuccess,
      dashboardLayout,
      handleSaveDeal,
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
    }}>
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
