import React from 'react';
import { WidgetType } from '@/src/services/widgetService';
import { MetricCard } from '../analytics/MetricCardSystem';
import { GoalProgress } from '../analytics/GoalProgressSystem';
import { RecentDealsList } from '../home/RecentDealsList';
import { RecentNotesList } from '../notes/RecentNotesList';
import { CompetitionCard } from '../competitions/CompetitionCard';
import { CompetitionLeaderboard } from '../competitions/CompetitionLeaderboard';
import { AdjustmentsWidget } from './AdjustmentsWidget';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Deal, QuickNote, Competition, LeaderboardEntry, DashboardMetrics } from '@/src/types';
import { EmptyState } from '../ui/EmptyState';
import { TrendingUp, Activity, Wallet, Calculator, Lock, BarChart3, StickyNote, Trophy } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { SubscriptionTier } from '@/src/types';

/**
 * StripeItWidgetSystem - WidgetRegistry
 * Centralized dynamic rendering for all dashboard widgets.
 */

interface WidgetRegistryProps {
  type: WidgetType;
  data: {
    deals: Deal[];
    notes: QuickNote[];
    competitions: Competition[];
    metrics: DashboardMetrics;
    goal: any;
    leaders: { competition: Competition, leader?: LeaderboardEntry }[];
    monthlySpiffs: any[];
    isLoading: boolean;
  };
  onAction?: (action: string, payload?: any) => void;
  onUpgrade?: () => void;
  variant?: 'hero' | 'telemetry' | 'hero-horizontal';
  onClick?: () => void;
}

export const WidgetRegistry: React.FC<WidgetRegistryProps> = ({ type, data, onAction, onUpgrade, variant, onClick }) => {
  const { deals, notes, competitions, metrics, goal, leaders, monthlySpiffs, isLoading } = data;
  const { profile } = useAuth();
  const isFree = profile?.subscriptionTier === SubscriptionTier.FREE;

  switch (type) {
    case WidgetType.UNITS:
      return (
        <MetricCard 
          label="Units"
          value={metrics.units.toString()}
          subValue={metrics.dealPace.toFixed(1)}
          icon={Activity}
          loading={isLoading}
          variant={variant}
        />
      );
    case WidgetType.COMMISSION:
      return (
        <div 
          onClick={onClick} 
          className={onClick ? "cursor-pointer" : ""}
        >
          <MetricCard 
            label="Est. Payout"
            value={`$${metrics.commission.toLocaleString()}`}
            secondaryLabel="spiffs"
            secondaryValue={`$${metrics.spiffsMTD.toLocaleString()}`}
            icon={Wallet}
            loading={isLoading}
            color="emerald"
            variant={variant}
          />
        </div>
      );
    case WidgetType.FRONT_END_GROSS:
      return (
        <MetricCard 
          label="Front-End"
          value={`$${metrics.frontEnd.toLocaleString()}`}
          icon={TrendingUp}
          loading={isLoading}
          isLocked={isFree}
          onUnlock={onUpgrade}
          lockMessage="Upgrade to unlock advanced payout telemetry."
          color="purple"
          variant={variant}
          onClick={onClick}
        />
      );
    case WidgetType.BACK_END_GROSS:
      return (
        <MetricCard 
          label="Back-End"
          value={`$${metrics.backEnd.toLocaleString()}`}
          icon={Calculator}
          loading={isLoading}
          isLocked={isFree}
          onUnlock={onUpgrade}
          lockMessage="Unlock advanced performance tracking."
          color="orange"
          variant={variant}
          onClick={onClick}
        />
      );
    case WidgetType.TOTAL_GROSS:
      return (
        <MetricCard 
          label="Total Gross"
          value={`$${metrics.gross.toLocaleString()}`}
          icon={TrendingUp}
          loading={isLoading}
          color="emerald"
          variant={variant}
        />
      );
    case WidgetType.AVERAGE_GROSS:
      return (
        <MetricCard 
          label="Avg Gross/Unit"
          value={`$${Math.round(metrics.avgGross || 0).toLocaleString()}`}
          icon={BarChart3}
          loading={isLoading}
          color="amber"
          subtext="MTD Efficiency"
          variant={variant}
        />
      );
    case WidgetType.GOAL_PROGRESS:
      return (
        <GoalProgress 
          label="Monthly Goal"
          current={metrics.units}
          target={goal?.unitGoal || 15}
          loading={isLoading}
        />
      );
    case WidgetType.RECENT_DEALS:
      return (
        <div className="space-y-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-2">Recent Deals</Typography>
          <RecentDealsList deals={deals.slice(0, 5)} onDealClick={(deal) => onAction?.('view_deal', deal)} isLoading={isLoading} />
        </div>
      );
    case WidgetType.QUICK_NOTES:
      return (
        <div className="space-y-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-2">Recent Notes</Typography>
          {notes.length > 0 ? (
            <RecentNotesList notes={notes.slice(0, 3)} onDelete={(id) => onAction?.('delete_note', id)} isLoading={isLoading} />
          ) : (
            <EmptyState
              icon={StickyNote}
              title="No recent notes"
              description="Capture customer details or inventory reminders here."
              className="py-8"
            />
          )}
        </div>
      );
    case WidgetType.COMPETITIONS:
      return (
        <div className="space-y-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-2">Active Competitions</Typography>
          <div className="space-y-4">
            {leaders.length > 0 ? (
              leaders.map(({ competition, leader }) => (
                <CompetitionCard 
                  key={competition.id} 
                  competition={competition} 
                  leader={leader} 
                  onClick={() => onAction?.('view_competition', competition.id)}
                />
              ))
            ) : (
              <EmptyState
                icon={Trophy}
                title="No active battles"
                description="Your group doesn't have any active competitions right now."
                className="py-8"
              />
            )}
          </div>
        </div>
      );
    case WidgetType.ADJUSTMENTS:
      return (
        <AdjustmentsWidget 
          monthlySpiffs={monthlySpiffs} 
          isLoading={isLoading} 
        />
      );
    default:
      return null;
  }
};
