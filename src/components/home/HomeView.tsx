import React, { useState, useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { QuickActions } from './QuickActions';
import { RecentDealsList } from './RecentDealsList';
import { RecentNotesList } from '../notes/RecentNotesList';
import { CompetitionCard } from '../competitions/CompetitionCard';
import { CompetitionLeaderboard } from '../competitions/CompetitionLeaderboard';
import { DashboardLayout as DashboardLayoutType, Deal, PayPlan, UserProfile, Goal, QuickNote, Competition, SubscriptionTier } from '@/src/types';
import { competitionService } from '@/src/services/competitionService';
import { DashboardCustomizer } from '../dashboard/DashboardCustomizer';
import { WidgetRegistry } from '../dashboard/WidgetRegistry';
import { WidgetType } from '@/src/services/widgetService';
import { DashboardLayout as DashboardLayoutComponent } from '../layout/DashboardLayout';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { calculateDashboardMetrics, getTrendsChartData } from '@/src/services/analyticsService';
import { featureAccessService, Feature } from '@/src/services/featureAccessService';
import { UpgradePrompt } from '../ui/UpgradePrompt';
import { MetricCard } from '../analytics/MetricCardSystem';
import { PerformanceChart } from '../analytics/ChartSystem';
import { GoalProgress } from '../analytics/GoalProgressSystem';
import { ContextHint } from '../onboarding/ContextHint';
import { ComingSoonIndicator } from '../ui/ComingSoonIndicator';
import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { 
  DollarSign, 
  TrendingUp, 
  Car, 
  Users, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Activity,
  Award,
  Wallet,
  Calculator,
  Lock,
  Settings2
} from 'lucide-react';

/**
 * StripeItDashboardMetricSystem
 * Integrated dashboard with analytics, goals, and trends.
 */

interface HomeViewProps {
  onLogDeal: () => void;
  onQuickNote: () => void;
  onConfigPayPlan?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onLogDeal,
  onQuickNote,
  onConfigPayPlan,
}) => {
  const { 
    deals, 
    notes, 
    competitions, 
    payPlan, 
    goal, 
    isLoading, 
    dashboardLayout, 
    handleSaveDashboardLayout,
    handleDeleteNote 
  } = useAppData();
  
  const { profile } = useAuth();
  const { isMobile } = useResponsive();

  const [showMetrics, setShowMetrics] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends'>('overview');
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const metrics = useMemo(() => calculateDashboardMetrics(deals, payPlan), [deals, payPlan]);
  const chartData = useMemo(() => getTrendsChartData(deals, payPlan), [deals, payPlan]);

  const selectedComp = useMemo(() => 
    competitions.find(c => c.id === selectedCompId)
  , [competitions, selectedCompId]);

  const leaderboardEntries = useMemo(() => {
    if (!selectedComp) return [];
    return competitionService.calculateLeaderboard(selectedComp, deals);
  }, [selectedComp, deals]);

  const hasNotesAccess = featureAccessService.hasAccess(profile, Feature.QUICK_NOTES);
  const hasGoalsAccess = featureAccessService.hasAccess(profile, Feature.GOALS);
  const hasCompetitionsAccess = featureAccessService.hasAccess(profile, Feature.COMPETITIONS);

  const activeCompetitionsWithLeaders = useMemo(() => 
    competitionService.getCompetitionsWithLeaders(competitions, deals)
  , [competitions, deals]);

  const hasCustomizationAccess = featureAccessService.hasAccess(profile, Feature.CUSTOM_DASHBOARD);

  const widgetData = {
    deals,
    notes,
    competitions,
    metrics,
    goal,
    leaders: activeCompetitionsWithLeaders,
    isLoading
  };

  const header = (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Typography variant="h1">
            MTD<br />Performance
          </Typography>
          {profile?.subscriptionTier === SubscriptionTier.FREE && (
            <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
              <Typography variant="mono" className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
                {8 - deals.length} of 8 Free Deals Remaining
              </Typography>
            </div>
          )}
        </div>
        <Typography variant="p" className="text-slate-500 max-w-xs font-semibold leading-tight text-lg">
          {profile?.dealershipId ? "Tracking dealership gross analytics" : "Real-time car sales & gross tracking"}
        </Typography>
      </div>
      
      <div className="flex items-center gap-3">
        {!isMobile && (
          <Button 
            variant="ghost" 
            className="text-slate-600 hover:text-slate-400 font-bold uppercase tracking-widest text-[10px]"
            onClick={onConfigPayPlan}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Config Payouts
          </Button>
        )}
        
        {hasCustomizationAccess && (
          <div className="relative group">
            <button 
              onClick={() => setIsCustomizing(true)}
              className="h-10 w-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-brand-primary transition-all active:scale-95 group"
              title="Customize Dashboard"
            >
              <Settings2 size={18} className="group-hover:rotate-45 transition-transform" />
            </button>
            <ComingSoonIndicator 
              featureId={Feature.CUSTOM_DASHBOARD} 
              size="sm" 
              className="absolute -top-1 -right-1 scale-75" 
            />
          </div>
        )}

        <div className="flex bg-white/[0.03] border border-white/5 rounded-full p-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'overview' ? "bg-brand-primary text-bg-deep shadow-glow" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={cn(
              "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'trends' ? "bg-brand-primary text-bg-deep shadow-glow" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Trends
          </button>
        </div>
        
        {isMobile && (
          <button 
            onClick={() => setShowMetrics(!showMetrics)}
            className="h-10 w-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
          >
            {showMetrics ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-10">
      <ContextHint 
        id="hint-dashboard-metrics" 
        title="Real-time Analytics" 
        message="Your MTD performance updates automatically as you log deals. Tap any cards to see detailed breakdowns."
        className="mb-0"
      />
      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Dynamic Metric Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardLayout.widgets
                .filter(w => w.visible && [WidgetType.UNITS, WidgetType.COMMISSION, WidgetType.FRONT_END_GROSS, WidgetType.BACK_END_GROSS].includes(w.type as WidgetType))
                .sort((a, b) => a.order - b.order)
                .map(widget => (
                  <WidgetRegistry 
                    key={widget.id} 
                    type={widget.type as WidgetType} 
                    data={widgetData}
                  />
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="trends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <PerformanceChart 
              data={chartData} 
              metric="units" 
              title="Daily Unit Volume" 
              color="#00F2FF"
            />
            <PerformanceChart 
              data={chartData} 
              metric="gross" 
              title="Daily Gross Profit" 
              color="#fbbf24"
            />
            <PerformanceChart 
              data={chartData} 
              metric="commission" 
              title="Payout Accumulation" 
              color="#10b981"
            />
            
            <Card className="p-8 bg-brand-primary/5 border-brand-primary/10 flex flex-col justify-center items-center text-center">
              <div className="h-16 w-16 rounded-3xl bg-brand-primary/20 flex items-center justify-center mb-6 shadow-glow">
                <TrendingUp className="h-8 w-8 text-brand-primary" />
              </div>
              <Typography variant="h3" className="text-white mb-2 text-base">Mid-month Insight</Typography>
              <Typography variant="p" className="text-slate-500 text-xs max-w-xs">
                Your momentum is trending above target. Ensure backend units are protected on all deals.
              </Typography>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            {/* Dynamic Main Widgets */}
            {dashboardLayout.widgets
              .filter(w => w.visible && [WidgetType.RECENT_DEALS].includes(w.type as WidgetType))
              .sort((a, b) => a.order - b.order)
              .map(widget => (
                <WidgetRegistry 
                  key={widget.id} 
                  type={widget.type as WidgetType} 
                  data={widgetData}
                  onAction={(action, payload) => {
                    // Handle widget actions (like clicking a deal)
                  }}
                />
              ))}
        </div>
        
        <div className="flex flex-col gap-6">
          {activeTab === 'overview' && (
            dashboardLayout.widgets.find(w => w.type === WidgetType.GOAL_PROGRESS && w.visible) && (
              hasGoalsAccess ? (
                <WidgetRegistry type={WidgetType.GOAL_PROGRESS} data={widgetData} />
              ) : (
                <Card className="p-6 bg-white/[0.02] border-brand-primary/10 relative overflow-hidden group cursor-pointer" onClick={() => {}}>
                  <div className="flex items-center justify-between mb-2">
                      <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Monthly Goal</Typography>
                      <Lock size={12} className="text-brand-primary/40" />
                  </div>
                  <Typography variant="p" className="text-[10px] text-slate-600 uppercase font-black tracking-tighter">Upgrade to Basic to set goals</Typography>
                  <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Card>
              )
            )
          )}

          {/* Average Performance Static Card (Could be a widget too) */}
          <Card className="p-6 bg-bg-card/40 border-white/5 space-y-4">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-brand-deep/10 flex items-center justify-center border border-brand-deep/20">
                 <Activity className="h-5 w-5 text-brand-deep" />
               </div>
               <div>
                  <Typography variant="mono" className="text-[9px] text-slate-500">AVG FRONT / UNIT</Typography>
                  <Typography variant="h3" className="text-white text-lg">${Math.round(metrics.totalFrontEndGrossMTD / metrics.totalUnitsMTD || 0).toLocaleString()}</Typography>
               </div>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
               <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                 <Award className="h-5 w-5 text-emerald-500" />
               </div>
               <div>
                  <Typography variant="mono" className="text-[9px] text-slate-500">AVG Payout / UNIT</Typography>
                  <Typography variant="h3" className="text-white text-lg">${Math.round(metrics.avgCommissionPerUnit).toLocaleString()}</Typography>
               </div>
            </div>
          </Card>

          {!isMobile && <QuickActions onQuickNote={onQuickNote} />}

          {/* Dynamic Sidebar Widgets */}
          {dashboardLayout.widgets
            .filter(w => w.visible && [WidgetType.QUICK_NOTES, WidgetType.COMPETITIONS].includes(w.type as WidgetType))
            .sort((a, b) => a.order - b.order)
            .map(widget => {
              if (widget.type === WidgetType.QUICK_NOTES && !hasNotesAccess) return null; // Handled separately or with lock
              if (widget.type === WidgetType.COMPETITIONS && !hasCompetitionsAccess) return null;
              
              return (
                <WidgetRegistry 
                  key={widget.id} 
                  type={widget.type as WidgetType} 
                  data={widgetData}
                  onAction={(action, payload) => {
                    if (action === 'delete_note') handleDeleteNote?.(payload);
                    if (action === 'view_competition') setSelectedCompId(payload);
                  }}
                />
              );
            })}

          {/* Notes Locked Placeholder if no access */}
          {!hasNotesAccess && dashboardLayout.widgets.find(w => w.type === WidgetType.QUICK_NOTES && w.visible) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                  <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Recent Notes</Typography>
                  <Lock size={10} className="text-slate-700" />
              </div>
              <Card className="p-4 bg-white/[0.02] border-white/5 text-center">
                  <Typography variant="p" className="text-[9px] text-slate-600 uppercase font-bold tracking-widest mb-2">Notes Locked</Typography>
                  <Button variant="ghost" className="h-7 text-[8px] uppercase tracking-widest border-white/10 w-full">Upgrade</Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DashboardLayoutComponent
        header={header}
        main={mainContent}
      />

      <DashboardCustomizer 
        isOpen={isCustomizing}
        onClose={() => setIsCustomizing(false)}
        layout={dashboardLayout}
        onSave={handleSaveDashboardLayout}
        isMobile={isMobile}
      />

      <AnimatePresence>
        {selectedCompId && selectedComp && (
           isMobile ? (
            <FullscreenMobileFlow
              isOpen={!!selectedCompId}
              onClose={() => setSelectedCompId(null)}
              title="Competition Leaderboard"
            >
              <div className="p-4 space-y-6">
                 <div className="text-center mb-8">
                    <Typography variant="h2" className="text-white italic uppercase font-black tracking-tighter mb-2">{selectedComp.title}</Typography>
                    <Typography variant="p" className="text-slate-500 text-sm">{selectedComp.description || 'Live dealership competition'}</Typography>
                 </div>
                 <CompetitionLeaderboard entries={leaderboardEntries} competition={selectedComp} />
              </div>
            </FullscreenMobileFlow>
           ) : (
             <Modal
               isOpen={!!selectedCompId}
               onClose={() => setSelectedCompId(null)}
               title={selectedComp.title}
             >
                <div className="space-y-6 py-4">
                   <Typography variant="p" className="text-slate-400 text-sm px-2 italic">{selectedComp.description}</Typography>
                   <CompetitionLeaderboard entries={leaderboardEntries} competition={selectedComp} />
                </div>
             </Modal>
           )
        )}
      </AnimatePresence>
    </>
  );
};
