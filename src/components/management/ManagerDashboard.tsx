import React, { useState, useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { DashboardLayout } from '../layout/DashboardLayout';
import { TeamMetricsOverview } from './TeamMetricsOverview';
import { DealOversightList } from './DealOversightList';
import { Deal, PayPlan, UserProfile, UserRole } from '@/src/types';
import { calculateTeamMetrics, calculateOrgTotalMetrics } from '@/src/services/analyticsService';
import { cn } from '@/src/lib/utils';
import { LayoutDashboard, Users, ClipboardCheck, BarChart3, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';

/**
 * StripeItManagerDashboardSystem
 * Centralized command center for dealership management.
 */

interface ManagerDashboardProps {
  onDealClick: (deal: Deal) => void;
}

type ManagementView = 'team_performance' | 'deal_oversight';

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  onDealClick
}) => {
  const { deals } = useAppData();
  const { profile } = useAuth();
  const { isMobile } = useResponsive();

  const [activeView, setActiveView] = useState<ManagementView>('team_performance');

  // Note: payPlans record fetching could be added to context for broader management oversight
  const payPlans = undefined; 

  const teamMetrics = useMemo(() => calculateTeamMetrics(deals, payPlans), [deals, payPlans]);
  
  const totalTeamMetrics = useMemo(() => calculateOrgTotalMetrics(teamMetrics), [teamMetrics]);

  const header = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[1.25rem] bg-brand-primary glow-primary flex items-center justify-center shadow-glow shadow-brand-primary/10">
            <LayoutDashboard className="h-6 w-6 text-bg-deep" strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter text-2xl md:text-[42px] leading-none">
              Command Center
            </Typography>
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] block mt-1">
              Managing {teamMetrics.length} salespeople at {profile?.orgName || 'Highline Motors'}
            </Typography>
          </div>
        </div>

        <div className="flex bg-white/[0.03] border border-white/5 rounded-full p-1 self-start lg:self-auto">
          <button
            onClick={() => setActiveView('team_performance')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === 'team_performance' ? "bg-brand-primary text-bg-deep shadow-glow" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Users size={14} />
            {isMobile ? 'Team' : 'Team Performance'}
          </button>
          <button
            onClick={() => setActiveView('deal_oversight')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === 'deal_oversight' ? "bg-brand-primary text-bg-deep shadow-glow" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <ClipboardCheck size={14} />
            {isMobile ? 'Log' : 'Deal Oversight'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'team_performance' ? (
              <TeamMetricsOverview 
                metrics={teamMetrics} 
                totalTeamMetrics={totalTeamMetrics}
                onSalespersonClick={(uid) => {
                   // Future: Drill down to salesperson personal stats
                   console.log('Drill down to:', uid);
                }}
              />
            ) : (
              <DealOversightList 
                deals={deals} 
                onDealClick={onDealClick} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      }
    />
  );
};
