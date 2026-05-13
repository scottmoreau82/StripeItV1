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
}

export const HomeView: React.FC<HomeViewProps> = ({
  onLogDeal,
  onQuickNote,
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

  const isFree = profile?.subscriptionTier === SubscriptionTier.FREE;

  const [showMetrics, setShowMetrics] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends'>('overview');
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  // Force overview tab for free users
  useMemo(() => {
    if (isFree && activeTab === 'trends') {
      setActiveTab('overview');
    }
  }, [isFree, activeTab]);

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
        <div className="flex flex-col sm:flex-row gap-3 mb-2 md:mb-1">
          <Typography variant="h1" className="italic text-[30px] sm:text-[36px] leading-[0.95] tracking-tighter">
            Performance Overview
          </Typography>
        </div>
        <Typography variant="p" className="text-slate-500 max-w-xs font-semibold leading-tight text-lg">
          {profile?.dealershipId ? "Tracking dealership gross analytics" : "Real-time car sales & gross tracking"}
        </Typography>
      </div>
      
      <div className="flex items-center gap-3">
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
            <div className="relative group/metrics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] lg:max-h-none overflow-y-auto lg:overflow-visible snap-y lg:snap-none snap-mandatory scrollbar-hide pr-2 pb-12 lg:pb-0">
                {[
                  WidgetType.UNITS,
                  WidgetType.COMMISSION,
                  WidgetType.FRONT_END_GROSS,
                  WidgetType.BACK_END_GROSS
                ].map(type => {
                  const widget = dashboardLayout.widgets.find(w => w.type === type);
                  if (!widget || !widget.visible) return null;
                  
                  return (
                    <div key={type} className="snap-center snap-always h-auto min-h-[160px] lg:min-h-0">
                      <WidgetRegistry 
                        type={type as WidgetType} 
                        data={widgetData}
                        onUpgrade={() => {
                          // navigate to settings/subscription tab
                          window.location.hash = '#settings';
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Atmospheric Continuation Hint - Visual Fade for Mobile */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-deep via-bg-deep/40 to-transparent pointer-events-none z-20 block lg:hidden" />
              
              {/* Mobile Scroll Indicator Hint */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 animate-pulse lg:hidden pointer-events-none">
                 <div className="w-[1px] h-8 bg-gradient-to-b from-brand-primary/0 via-brand-primary/50 to-brand-primary/0" />
                 <Typography variant="mono" className="text-[8px] text-brand-primary font-bold tracking-[0.3em] uppercase">Telemetry</Typography>
              </div>
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
              title="Est. Payout Performance" 
              color="#10b981"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            {/* Dynamic Main Widgets */}
            {dashboardLayout.widgets
              .filter(w => w.visible && [WidgetType.RECENT_DEALS].includes(w.type as WidgetType))
              .filter(w => !(isFree && w.type === WidgetType.RECENT_DEALS))
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
              hasGoalsAccess && !isFree ? (
                <WidgetRegistry type={WidgetType.GOAL_PROGRESS} data={widgetData} />
              ) : null
            )
          )}

          {/* Average Performance Static Card */}
          {!isFree && (
            <Card className="p-6 bg-bg-card/40 border-white/5 space-y-4">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-full bg-brand-deep/10 flex items-center justify-center border border-brand-deep/20">
                   <Activity className="h-5 w-5 text-brand-deep" />
                 </div>
                 <div>
                    <Typography variant="mono" className="text-[9px] text-slate-500">AVG FRONT / UNIT</Typography>
                    <Typography variant="h3" className="text-white text-lg">${Math.round(metrics.frontEnd / metrics.units || 0).toLocaleString()}</Typography>
                 </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                 <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                   <Award className="h-5 w-5 text-emerald-500" />
                 </div>
                 <div>
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest">Avg Est. Payout / Unit</Typography>
                    <Typography variant="h3" className="text-white text-lg">${Math.round(metrics.avgCommission).toLocaleString()}</Typography>
                 </div>
              </div>
            </Card>
          )}

          {!isMobile && !isFree && <QuickActions onQuickNote={onQuickNote} />}

          {/* Dynamic Sidebar Widgets */}
          {dashboardLayout.widgets
            .filter(w => w.visible && [WidgetType.QUICK_NOTES, WidgetType.COMPETITIONS].includes(w.type as WidgetType))
            .filter(w => !(isFree && w.type === WidgetType.QUICK_NOTES))
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
          {!hasNotesAccess && !isFree && dashboardLayout.widgets.find(w => w.type === WidgetType.QUICK_NOTES && w.visible) && (
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
