import React, { useState } from 'react';
import { Deal, PayPlan, UserProfile, UserRole, QuickNote, Competition } from '@/src/types';
import { ManagerDashboard } from './ManagerDashboard';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { LayoutDashboard, Users, User, ArrowLeft } from 'lucide-react';
import { HomeView } from '../home/HomeView';
import { Goal } from '@/src/types';
import { permissionService } from '@/src/services/permissionService';
import { featureAccessService, Feature } from '@/src/services/featureAccessService';
import { UpgradePrompt } from '../ui/UpgradePrompt';
import { ContextHint } from '../onboarding/ContextHint';
import { ComingSoonIndicator } from '../ui/ComingSoonIndicator';

import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';

/**
 * StripeItRoleVisibilitySystem
 * Master entry point for management views with role-aware layout switching.
 */

interface ManagerViewProps {
  onLogDeal: () => void;
  onQuickNote: () => void;
  onConfigPayPlan: () => void;
  onDealClick: (deal: Deal) => void;
  onCreateCompetition: () => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  onLogDeal,
  onQuickNote,
  onConfigPayPlan,
  onDealClick,
  onCreateCompetition
}) => {
  const { deals, notes, competitions, payPlan, goal, isLoading } = useAppData();
  const { profile } = useAuth();
  const { isMobile } = useResponsive();

  const [viewMode, setViewMode] = useState<'personal' | 'management'>('management');

  // If user is just SALES, they shouldn't even be here, but we guard just in case
  const isManager = permissionService.isManager(profile);
  const hasManagerAccess = featureAccessService.hasAccess(profile, Feature.MANAGER_VISIBILITY);

  if (!isManager) {
    return (
      <HomeView 
        onLogDeal={onLogDeal}
        onQuickNote={onQuickNote}
        onConfigPayPlan={onConfigPayPlan}
      />
    );
  }

  if (!hasManagerAccess) {
    return (
      <div className="p-6 h-[calc(100vh-160px)] flex items-center justify-center">
        <UpgradePrompt 
          title="Team Management"
          description="Gain full visibility into your organization's deals, performance trends, and team metrics."
          tierRequired="Organization"
          onUpgrade={() => {}} // Integration point for billing
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ContextHint 
        id="hint-manager-view" 
        title="Team Visibility" 
        message="You are now viewing the organization feed. Real-time transparency across all salespeople and groups."
        className="mx-2"
      />
      {/* Role Switcher Toolbar */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-3">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">
            {viewMode === 'management' ? 'Management Overview' : 'Personal Dashboard'}
          </Typography>
          <ComingSoonIndicator featureId={Feature.MANAGER_VISIBILITY} size="sm" />
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-full border border-white/5">
           <button
             onClick={() => setViewMode('management')}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
               viewMode === 'management' ? 'bg-brand-primary text-bg-deep' : 'text-slate-500 hover:text-slate-300'
             }`}
           >
             <LayoutDashboard size={12} />
             Live Feed
           </button>
           <button
             onClick={() => setViewMode('personal')}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
               viewMode === 'personal' ? 'bg-brand-primary text-bg-deep' : 'text-slate-500 hover:text-slate-300'
             }`}
           >
             <User size={12} />
             My Stats
           </button>
        </div>
      </div>

      {viewMode === 'management' ? (
        <div className="space-y-6">
          <div className="px-2 relative">
            <Button 
               onClick={onCreateCompetition}
               className="w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] h-11"
            >
              Launch Spiff / Competition
            </Button>
            <ComingSoonIndicator 
              featureId={Feature.COMPETITIONS} 
              size="sm" 
              className="absolute -top-1 right-3" 
            />
          </div>
          <ManagerDashboard 
            onDealClick={onDealClick}
          />
        </div>
      ) : (
        <HomeView 
          onLogDeal={onLogDeal}
          onQuickNote={onQuickNote}
          onConfigPayPlan={onConfigPayPlan}
        />
      )}
    </div>
  );
};
