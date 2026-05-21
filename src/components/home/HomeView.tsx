import React, { useState, useMemo } from 'react';
import { calculateDealCommission, calculatePeriodEarnings } from '@/src/lib/commissionLogic';
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
  Settings2,
  Plus,
  Snowflake,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { AppIcon } from '../ui/AppIcon';
import { DealerDashboard } from '../dealer/DealerDashboard';
import { PageHeader } from '../ui/PageHeader';
import { LayoutGrid } from 'lucide-react';

/**
 * StripeItDashboardMetricSystem
 * Integrated dashboard with analytics, goals, and trends.
 */

const CollapsibleHeader = ({
  label,
  isOpen,
  onToggle
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="flex items-center justify-between w-full py-2 px-1 text-left group"
  >
    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest group-hover:text-slate-300 transition-colors">
      {label}
    </Typography>
    {isOpen
      ? <ChevronUp size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
      : <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
    }
  </button>
);

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
    monthlySpiffs,
    handleSaveDashboardLayout,
    handleDeleteNote 
  } = useAppData();
  
  const { profile, updateProfileData, isDeveloper } = useAuth();
  const { isMobile } = useResponsive();

  const isFree = profile?.subscriptionTier === SubscriptionTier.FREE;
  const isDealer = profile?.subscriptionTier === SubscriptionTier.ORGANIZATION;
  const isFrozen = profile?.isFrozen && !profile?.suspensionAcknowledgedAt && !isDeveloper;

  const [showMetrics, setShowMetrics] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends'>('overview');
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showSuspensionDetails, setShowSuspensionDetails] = useState(false);
  const [showPaycheckBreakdown, setShowPaycheckBreakdown] = useState(false);

  const [metricsOpen, setMetricsOpen] = useState(true);
  const [dealsOpen, setDealsOpen] = useState(true);
  const [goalOpen, setGoalOpen] = useState(true);
  const [avgOpen, setAvgOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentMonthDeals = useMemo(() => {
    return deals.filter(d => {
      const dDate = new Date(d.date);
      return dDate.getMonth() + 1 === currentMonth && dDate.getFullYear() === currentYear;
    });
  }, [deals, currentMonth, currentYear]);

  const currentMonthSpiffs = useMemo(() => {
    return monthlySpiffs.filter(s => {
      const spiffMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
      return s.month === spiffMonthStr;
    });
  }, [monthlySpiffs, currentMonth, currentYear]);

  const dealCalculations = useMemo(() => {
    return currentMonthDeals.map(deal => {
      const commission = payPlan ? calculateDealCommission(deal, payPlan, currentMonthDeals) : null;
      return {
        deal,
        commission,
        frontEndGross: deal.frontEndGross,
        backEndGross: deal.backEndGross,
        finalPayout: commission?.finalPayout ?? 0,
        frontRate: commission?.explanation?.frontRate ?? payPlan?.frontEndPercentage ?? 0,
        backRate: commission?.explanation?.backRate ?? payPlan?.backEndPercentage ?? 0
      };
    });
  }, [currentMonthDeals, payPlan]);

  const totalFrontGrossDeals = useMemo(() => {
    return dealCalculations.reduce((sum, item) => sum + item.frontEndGross, 0);
  }, [dealCalculations]);

  const totalBackGrossDeals = useMemo(() => {
    return dealCalculations.reduce((sum, item) => sum + item.backEndGross, 0);
  }, [dealCalculations]);

  const totalPayoutDeals = useMemo(() => {
    return dealCalculations.reduce((sum, item) => sum + item.finalPayout, 0);
  }, [dealCalculations]);

  const spiffsSubtotal = useMemo(() => {
    return currentMonthSpiffs.reduce((sum, s) => {
      const amt = s.amount || 0;
      return sum + (s.isChargeback ? -amt : amt);
    }, 0);
  }, [currentMonthSpiffs]);

  const periodEarnings = useMemo(() => {
    if (!payPlan || currentMonthDeals.length === 0) 
      return null;
    return calculatePeriodEarnings(currentMonthDeals, payPlan);
  }, [currentMonthDeals, payPlan, showPaycheckBreakdown]);

  const grandTotal = (periodEarnings ? periodEarnings.grandTotal : totalPayoutDeals) + spiffsSubtotal;

  const handleAcknowledgeSuspension = async () => {
    try {
      await updateProfileData({
        suspensionAcknowledgedAt: Date.now()
      });
      setShowSuspensionDetails(false);
    } catch (error) {
      console.error("Failed to acknowledge suspension:", error);
    }
  };

  // If Dealer, return specific Dealer Dashboard
  if (isDealer) {
    return <DealerDashboard />;
  }

  // Force overview tab for free users
  useMemo(() => {
    if (isFree && activeTab === 'trends') {
      setActiveTab('overview');
    }
  }, [isFree, activeTab]);

  const metrics = useMemo(() => calculateDashboardMetrics(deals, payPlan, monthlySpiffs), [deals, payPlan, monthlySpiffs]);
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
    monthlySpiffs,
    leaders: activeCompetitionsWithLeaders,
    isLoading
  };

  const header = (
    <div className="space-y-10">
      {isFrozen && (
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Card className="bg-rose-950/20 backdrop-blur-xl border-rose-500/20 p-4 border-l-4 border-l-rose-600/80 shadow-glow glow-rose/5 relative overflow-hidden group transition-all duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Snowflake size={18} className="text-rose-500 animate-pulse" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                       <Typography variant="label" className="text-rose-500 font-black uppercase text-[10px] tracking-widest block">Operational Suspension</Typography>
                       <span className="h-1 w-1 rounded-full bg-rose-500/30" />
                       <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none">Status: Frozen</Typography>
                    </div>
                    <Typography variant="p" className="text-slate-400 text-[11px] font-medium leading-tight">
                      Dealership connection restricted. Operating on personal toolkit.
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    className="h-9 px-4 text-slate-500 hover:text-white uppercase font-black tracking-widest text-[9px] border-white/5 hover:bg-white/5" 
                    onClick={() => setShowSuspensionDetails(true)}
                  >
                    View Details
                  </Button>
                  <Button 
                    onClick={handleAcknowledgeSuspension}
                    className="h-9 px-6 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 font-black uppercase tracking-widest text-[9px] rounded-lg transition-all active:scale-95"
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      <PageHeader
        title="Performance Overview"
        subtitle={`${profile?.displayName || 'Personal'} • ${profile?.subscriptionTier.toUpperCase() || 'FREE'} Tooling Activity`}
        icon={LayoutGrid}
      >
        <div className="flex items-center gap-3">
          {!isMobile && hasCustomizationAccess && (
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

          {!isMobile && (
            <Button
              onClick={onLogDeal}
              className="h-11 px-6 bg-brand-primary text-bg-deep shadow-glow glow-primary transition-all font-black uppercase tracking-widest text-[11px] rounded-xl hover:scale-105 active:scale-95"
            >
              <Plus size={16} className="mr-2" />
              New Deal
            </Button>
          )}
        </div>
      </PageHeader>
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
              {isMobile ? (
                <div>
                  <CollapsibleHeader
                    label="Performance Metrics"
                    isOpen={metricsOpen}
                    onToggle={() => setMetricsOpen(p => !p)}
                  />
                  <AnimatePresence initial={false}>
                    {metricsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-3 pt-2">
                          {/* Hero Metrics - Units & Commission */}
                          <div className="grid grid-cols-1 gap-2.5">
                            {[WidgetType.UNITS, WidgetType.COMMISSION].map(type => {
                              const widget = dashboardLayout.widgets.find(w => w.type === type);
                              if (!widget || !widget.visible) return null;
                              return (
                                <WidgetRegistry 
                                  key={type} 
                                  type={type as WidgetType} 
                                  data={widgetData}
                                  variant="hero-horizontal"
                                  onClick={type === WidgetType.COMMISSION ? () => setShowPaycheckBreakdown(true) : undefined}
                                  onUpgrade={() => {
                                    window.location.hash = '#settings';
                                  }}
                                />
                              );
                            })}
                          </div>
                          
                          {/* Telemetry Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            {[
                              WidgetType.FRONT_END_GROSS, 
                              WidgetType.BACK_END_GROSS, 
                              WidgetType.TOTAL_GROSS, 
                              WidgetType.AVERAGE_GROSS
                            ].map(type => {
                              const widget = dashboardLayout.widgets.find(w => w.type === type);
                              if (!widget || !widget.visible) return null;
                              
                              const isWidgetLocked = isFree && widget.type !== WidgetType.UNITS;

                              return (
                                <div key={type} className={cn(isWidgetLocked ? "col-span-2" : "col-span-1")}>
                                  <WidgetRegistry 
                                    type={type as WidgetType} 
                                    data={widgetData}
                                    variant="telemetry"
                                    onUpgrade={() => {
                                      window.location.hash = '#settings';
                                    }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:max-h-none overflow-y-auto lg:overflow-visible snap-y lg:snap-none snap-mandatory scrollbar-hide pr-2 pb-12 lg:pb-0">
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
                          onClick={type === WidgetType.COMMISSION ? () => setShowPaycheckBreakdown(true) : undefined}
                          onUpgrade={() => {
                            // navigate to settings/subscription tab
                            window.location.hash = '#settings';
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Atmospheric Continuation Hint - Visual Fade for Mobile */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-deep/80 via-transparent to-transparent pointer-events-none z-20 block lg:hidden" />
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
            {isMobile ? (
              <div>
                <CollapsibleHeader
                  label="Recent Deals"
                  isOpen={dealsOpen}
                  onToggle={() => setDealsOpen(p => !p)}
                />
                <AnimatePresence initial={false}>
                  {dealsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2"
                    >
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Dynamic Main Widgets */
              dashboardLayout.widgets
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
                ))
            )}
        </div>
        
        <div className="flex flex-col gap-6">
          {activeTab === 'overview' && (
            dashboardLayout.widgets.find(w => w.type === WidgetType.GOAL_PROGRESS && w.visible) && (
              hasGoalsAccess && !isFree ? (
                isMobile ? (
                  <div>
                    <CollapsibleHeader
                      label="Monthly Goal"
                      isOpen={goalOpen}
                      onToggle={() => setGoalOpen(p => !p)}
                    />
                    <AnimatePresence initial={false}>
                      {goalOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden pt-2"
                        >
                          <WidgetRegistry type={WidgetType.GOAL_PROGRESS} data={widgetData} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <WidgetRegistry type={WidgetType.GOAL_PROGRESS} data={widgetData} />
                )
              ) : null
            )
          )}
          {/* Average Performance Static Card */}
          {!isFree && (
            isMobile ? (
              <div>
                <CollapsibleHeader
                  label="Avg Performance"
                  isOpen={avgOpen}
                  onToggle={() => setAvgOpen(p => !p)}
                />
                <AnimatePresence initial={false}>
                  {avgOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden pt-2"
                    >
                      <Card className="p-6 bg-bg-card/40 border-white/5 space-y-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                           <div className="h-10 w-10 rounded-full bg-brand-deep/10 flex items-center justify-center border border-brand-deep/20 shrink-0">
                             <Activity className="h-5 w-5 text-brand-deep" />
                           </div>
                           <div className="flex flex-col items-center sm:items-start">
                              <Typography variant="mono" className="text-[9px] text-slate-500">AVG FRONT / UNIT</Typography>
                              <Typography variant="h3" className="text-text-primary text-lg">${Math.round(metrics.frontEnd / metrics.units || 0).toLocaleString()}</Typography>
                           </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 pt-4 border-t border-white/5">
                           <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                             <Award className="h-5 w-5 text-emerald-500" />
                           </div>
                           <div className="flex flex-col items-center sm:items-start">
                              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest">Avg Est. Payout / Unit</Typography>
                              <Typography variant="h3" className="text-text-primary text-lg">${Math.round(metrics.avgCommission).toLocaleString()}</Typography>
                           </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Card className="p-6 bg-bg-card/40 border-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
                   <div className="h-10 w-10 rounded-full bg-brand-deep/10 flex items-center justify-center border border-brand-deep/20 shrink-0">
                     <Activity className="h-5 w-5 text-brand-deep" />
                   </div>
                   <div className="flex flex-col items-center sm:items-start">
                      <Typography variant="mono" className="text-[9px] text-slate-500">AVG FRONT / UNIT</Typography>
                      <Typography variant="h3" className="text-text-primary text-lg">${Math.round(metrics.frontEnd / metrics.units || 0).toLocaleString()}</Typography>
                   </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 pt-4 border-t border-white/5">
                   <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                     <Award className="h-5 w-5 text-emerald-500" />
                   </div>
                   <div className="flex flex-col items-center sm:items-start">
                      <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest">Avg Est. Payout / Unit</Typography>
                      <Typography variant="h3" className="text-text-primary text-lg">${Math.round(metrics.avgCommission).toLocaleString()}</Typography>
                   </div>
                </div>
              </Card>
            )
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
              
              const registry = (
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

              if (widget.type === WidgetType.QUICK_NOTES) {
                return (
                  isMobile ? (
                    <div key={widget.id}>
                      <CollapsibleHeader
                        label="Recent Notes"
                        isOpen={notesOpen}
                        onToggle={() => setNotesOpen(p => !p)}
                      />
                      <AnimatePresence initial={false}>
                        {notesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pt-2"
                          >
                            {registry}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : registry
                );
              }

              return registry;
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
                  <Button 
                    variant="ghost" 
                    className="h-7 text-[8px] uppercase tracking-widest border-white/10 w-full"
                    onClick={() => { window.location.hash = '#settings'; }}
                  >
                    Upgrade
                  </Button>
              </Card>
            </div>
          )}
        </div>
      </div>

      {isMobile && hasCustomizationAccess && (
        <div className="flex justify-center pt-8 pb-4">
          <button
            onClick={() => setIsCustomizing(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-dashed border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest"
          >
            <Settings2 size={14} />
            Customize Dashboard
          </button>
        </div>
      )}
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
        {showSuspensionDetails && (
          <Modal
            isOpen={showSuspensionDetails}
            onClose={() => setShowSuspensionDetails(false)}
            title="Dealership Access Details"
          >
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                <div className="h-12 w-12 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                  <Snowflake className="text-rose-500 h-6 w-6" />
                </div>
                <div>
                  <Typography variant="label" className="text-rose-400 font-black uppercase text-[10px] tracking-widest block">Membership Status</Typography>
                  <Typography variant="h3" className="italic font-black uppercase tracking-tighter text-white">Frozen / Suspended</Typography>
                </div>
              </div>

              <div className="space-y-4 px-2">
                <div className="space-y-2">
                  <Typography variant="label" className="text-slate-500 text-[9px] uppercase font-black tracking-widest">What this means</Typography>
                  <Typography variant="p" className="text-slate-400 text-sm leading-relaxed">
                    Your account has been placed in a "Frozen" state by the <span className="text-white font-bold">{profile?.orgName || 'Dealership'}</span> administration. 
                    This typically occurs when a manager leaves an organization or during administrative audits.
                  </Typography>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <Typography variant="label" className="text-brand-primary text-[8px] uppercase font-black tracking-widest block mb-1">Personal Toolkit</Typography>
                    <Typography variant="mono" className="text-emerald-500 text-[10px] font-black">Active</Typography>
                    <Typography variant="p" className="text-[10px] text-zinc-500 mt-2">All personal deals and data remain fully accessible.</Typography>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <Typography variant="label" className="text-slate-500 text-[8px] uppercase font-black tracking-widest block mb-1">Dealership Logs</Typography>
                    <Typography variant="mono" className="text-rose-500 text-[10px] font-black">Revoked</Typography>
                    <Typography variant="p" className="text-[10px] text-zinc-500 mt-2">Access to organizational logs and reports is restricted.</Typography>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                   <Typography variant="label" className="text-slate-500 text-[9px] uppercase font-black tracking-widest block">Next Steps</Typography>
                   <Typography variant="p" className="text-slate-500 text-xs italic">
                     If you believe this is an error, please contact your Dealership Administrator or General Manager.
                   </Typography>
                </div>
              </div>

              <div className="pt-4 px-2">
                <Button variant="outline" className="w-full h-12 uppercase font-black tracking-widest border-white/10" onClick={handleAcknowledgeSuspension}>
                  Acknowledged
                </Button>
              </div>
            </div>
          </Modal>
        )}

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

        {showPaycheckBreakdown && (
          isMobile ? (
            <FullscreenMobileFlow
              isOpen={showPaycheckBreakdown}
              onClose={() => setShowPaycheckBreakdown(false)}
              title="PAYCHECK BREAKDOWN"
            >
              <div className="p-4 space-y-6">
                <div className="text-center mb-6">
                  <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-0.5">
                    PAYCHECK BREAKDOWN
                  </Typography>
                  <Typography variant="h2" className="text-white italic uppercase font-black tracking-tighter">
                    {new Date().toLocaleString('default', { month: 'long' }).toUpperCase()} {new Date().getFullYear()}
                  </Typography>
                </div>

                {/* SECTION 1 - Deal Breakdown space */}
                <div className="space-y-3">
                  <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
                    Deals Calc ({currentMonthDeals.length})
                  </Typography>

                  <div className="rounded-xl border border-white/5 bg-white/[0.01] divide-y divide-white/5 overflow-hidden">
                    {dealCalculations.map((item, idx) => (
                      <div 
                        key={item.deal.id} 
                        className={cn(
                          "p-4 transition-colors text-xs flex flex-col gap-3",
                          idx % 2 === 0 ? "bg-white/[0.005]" : "bg-transparent"
                        )}
                      >
                        {/* Top row: customer name (left) + total payout in emerald (right) */}
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-white truncate">
                            {item.deal.customerName}
                          </span>
                          <span className="font-black text-emerald-400 text-sm shrink-0">
                            ${Math.round(item.finalPayout).toLocaleString()}
                          </span>
                        </div>

                        {/* Bottom row: two cells side by side */}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          {/* Left cell: FRONT label + gross amount + commission rate % below */}
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">FRONT</span>
                            <span className="font-black text-slate-200">
                              ${Math.round(item.frontEndGross).toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-semibold">
                              {item.frontRate}% rate
                            </span>
                          </div>

                          {/* Right cell: BACK label + gross amount + commission rate % below */}
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">BACK</span>
                            <span className="font-black text-slate-200">
                              ${Math.round(item.backEndGross).toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-semibold">
                              {item.backRate}% rate
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {dealCalculations.length === 0 && (
                      <div className="py-8 px-4 text-center text-slate-500 text-xs italic">
                        No deals recorded for this month.
                      </div>
                    )}

                    {/* TOTALS ROW on mobile */}
                    {dealCalculations.length > 0 && (
                      <div className="bg-white/[0.03] py-4 px-4 flex justify-between items-center text-xs font-black">
                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                          TOTAL COMMISSION
                        </span>
                        <span className="text-emerald-400 text-sm font-extrabold">
                          ${Math.round(totalPayoutDeals).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* VOLUME BONUSES SECTION */}
                {periodEarnings && periodEarnings.totalTierBonuses > 0 && (
                  <div className="space-y-3">
                    <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase tracking-widest block font-bold">
                      VOLUME BONUSES
                    </Typography>
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] divide-y divide-white/5 overflow-hidden">
                      {((periodEarnings as any).tierBonusBreakdown || periodEarnings.tierBonuses) ? (
                        ((periodEarnings as any).tierBonusBreakdown || periodEarnings.tierBonuses).map((bonus: any, index: number) => (
                          <div 
                            key={bonus.tierId || index} 
                            className="flex items-center justify-between py-3 px-4 text-xs text-slate-300"
                          >
                            <span className="font-bold text-white capitalize">
                              {bonus.label || bonus.tierName || "Volume Bonus"}
                            </span>
                            <span className="font-black text-emerald-400 text-right">
                              ${Math.round(bonus.amount).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between py-3 px-4 text-xs text-slate-300">
                          <span className="font-bold text-white capitalize">
                            VOLUME BONUS
                          </span>
                          <span className="font-black text-emerald-400 text-right">
                            ${Math.round(periodEarnings.totalTierBonuses).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 2 - SPIFFs & Adjustments */}
                {currentMonthSpiffs.length > 0 && (
                  <div className="space-y-3">
                    <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
                      SPIFFS & ADJUSTMENTS
                    </Typography>
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
                      {currentMonthSpiffs.map((spiff) => (
                        <div 
                          key={spiff.id} 
                          className="flex items-center justify-between py-3 px-4 border-b border-white/5 text-xs text-slate-300"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-white capitalize">{spiff.label || "Unnamed Spiff"}</span>
                            <span className="text-[9px] text-slate-500 mt-0.5">{spiff.notes || "No notes"}</span>
                          </div>
                          <span className={cn(
                            "font-black text-right",
                            spiff.isChargeback ? "text-rose-400" : "text-emerald-400"
                          )}>
                            {spiff.isChargeback ? "-" : ""}${Math.round(spiff.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-3 px-4 bg-white/[0.03] text-xs font-black">
                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Spiffs Subtotal</span>
                        <span className={cn(
                          "text-right",
                          spiffsSubtotal < 0 ? "text-rose-400" : "text-emerald-400"
                        )}>
                          {spiffsSubtotal < 0 ? "-" : ""}${Math.round(Math.abs(spiffsSubtotal)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3 - Grand Total */}
                <div className="space-y-4">
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">
                      PROJECTED PAYCHECK
                    </Typography>
                    <div className="text-3xl font-black text-emerald-400 italic uppercase tracking-tighter">
                      ${Math.round(grandTotal).toLocaleString()}
                    </div>
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none mt-2">
                      Est. Payout + Net Spiffs
                    </Typography>
                  </div>

                  {payPlan?.isMinisAndHourlyActive && payPlan?.isHourlyActive && payPlan?.hourlyConfig?.active && payPlan?.hourlyConfig?.model === "draw" && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                      <Lock size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <Typography variant="mono" className="text-amber-400 text-[10px] font-black uppercase tracking-widest block">
                          Draw Model Active
                        </Typography>
                        <Typography variant="p" className="text-slate-400 text-[11px] leading-relaxed">
                          This paycheck is subject to a draw debit. Total payout will validate against configured hours of {payPlan.hourlyConfig.hoursWorked} hrs @ ${payPlan.hourlyConfig.rate}/hr.
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full h-11 uppercase font-black tracking-widest border-white/5 hover:border-white/10 active:scale-95 text-xs text-slate-400"
                    onClick={() => setShowPaycheckBreakdown(false)}
                  >
                    Close Breakdown
                  </Button>
                </div>
              </div>
            </FullscreenMobileFlow>
          ) : (
            <Modal
              isOpen={showPaycheckBreakdown}
              onClose={() => setShowPaycheckBreakdown(false)}
              title="PAYCHECK BREAKDOWN"
            >
              <div className="space-y-6 py-4 px-2">
                <div className="mb-4">
                  <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-0.5">
                    PAYCHECK BREAKDOWN
                  </Typography>
                  <Typography variant="h2" className="text-white italic uppercase font-black tracking-tighter">
                    {new Date().toLocaleString('default', { month: 'long' }).toUpperCase()} {new Date().getFullYear()}
                  </Typography>
                </div>

                {/* SECTION 1 - Deal Breakdown table */}
                <div className="space-y-3">
                  <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
                    Deals Calc ({currentMonthDeals.length})
                  </Typography>

                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-white/[0.01]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02] text-[9px] font-black uppercase text-slate-500 tracking-wider">
                          <th className="py-2 px-4">Customer</th>
                          <th className="py-2 px-4 text-right">Front Gross</th>
                          <th className="py-2 px-4 text-right">Back Gross</th>
                          <th className="py-2 px-4 text-right">Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dealCalculations.map((item, idx) => (
                          <tr 
                            key={item.deal.id} 
                            className={cn(
                              "border-b border-white/5 text-xs transition-colors",
                              idx % 2 === 0 ? "bg-white/[0.005]" : "bg-transparent"
                            )}
                          >
                            <td className="py-3 px-4 font-bold text-white max-w-[150px] truncate">
                              {item.deal.customerName}
                            </td>
                            <td className="py-3 px-4 text-right pt-2">
                              <span className="font-black text-slate-200">
                                ${Math.round(item.frontEndGross).toLocaleString()}
                              </span>
                              <span className="block text-[9px] text-slate-500 font-semibold mt-0.5">
                                {item.frontRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right pt-2">
                              <span className="font-black text-slate-200">
                                ${Math.round(item.backEndGross).toLocaleString()}
                              </span>
                              <span className="block text-[9px] text-slate-500 font-semibold mt-0.5">
                                {item.backRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-black text-emerald-400">
                              ${Math.round(item.finalPayout).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {dealCalculations.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-8 px-4 text-center text-slate-500 text-xs italic">
                              No deals recorded for this month.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {dealCalculations.length > 0 && (
                        <tfoot>
                          <tr className="bg-white/[0.03] text-xs font-black">
                            <td className="py-3 px-4 text-slate-400 uppercase tracking-widest text-[10px]">
                              TOTAL
                            </td>
                            <td className="py-3 px-4 text-right text-slate-200">
                              ${Math.round(totalFrontGrossDeals).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-200">
                              ${Math.round(totalBackGrossDeals).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-extrabold">
                              ${Math.round(totalPayoutDeals).toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>

                {/* VOLUME BONUSES SECTION */}
                {periodEarnings && periodEarnings.totalTierBonuses > 0 && (
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase tracking-widest block font-bold">
                      VOLUME BONUSES
                    </Typography>
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] divide-y divide-white/5 overflow-hidden">
                      {((periodEarnings as any).tierBonusBreakdown || periodEarnings.tierBonuses) ? (
                        ((periodEarnings as any).tierBonusBreakdown || periodEarnings.tierBonuses).map((bonus: any, index: number) => (
                          <div 
                            key={bonus.tierId || index} 
                            className="flex items-center justify-between py-3 px-4 text-xs text-slate-300"
                          >
                            <span className="font-bold text-white capitalize">
                              {bonus.label || bonus.tierName || "Volume Bonus"}
                            </span>
                            <span className="font-black text-emerald-400 text-right">
                              ${Math.round(bonus.amount).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between py-3 px-4 text-xs text-slate-300">
                          <span className="font-bold text-white capitalize">
                            VOLUME BONUS
                          </span>
                          <span className="font-black text-emerald-400 text-right">
                            ${Math.round(periodEarnings.totalTierBonuses).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION 2 - SPIFFs & Adjustments */}
                {currentMonthSpiffs.length > 0 && (
                  <div className="space-y-3 border-t border-white/5 pt-4">
                    <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase tracking-widest block">
                      SPIFFS & ADJUSTMENTS
                    </Typography>
                    <div className="rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden">
                      {currentMonthSpiffs.map((spiff) => (
                        <div 
                          key={spiff.id} 
                          className="flex items-center justify-between py-3 px-4 border-b border-white/5 text-xs text-slate-300"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-white capitalize">{spiff.label || "Unnamed Spiff"}</span>
                            <span className="text-[9px] text-slate-500 mt-0.5">{spiff.notes || "No notes"}</span>
                          </div>
                          <span className={cn(
                            "font-black text-right",
                            spiff.isChargeback ? "text-rose-400" : "text-emerald-400"
                          )}>
                            {spiff.isChargeback ? "-" : ""}${Math.round(spiff.amount || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-3 px-4 bg-white/[0.03] text-xs font-black">
                        <span className="text-slate-400 uppercase tracking-widest text-[10px]">Spiffs Subtotal</span>
                        <span className={cn(
                          "text-right",
                          spiffsSubtotal < 0 ? "text-rose-400" : "text-emerald-400"
                        )}>
                          {spiffsSubtotal < 0 ? "-" : ""}${Math.round(Math.abs(spiffsSubtotal)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION 3 - Grand Total */}
                <div className="space-y-4 border-t border-white/5 pt-4">
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">
                      PROJECTED PAYCHECK
                    </Typography>
                    <div className="text-3xl font-black text-emerald-400 italic uppercase tracking-tighter">
                      ${Math.round(grandTotal).toLocaleString()}
                    </div>
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold tracking-widest leading-none mt-2">
                      Est. Payout + Net Spiffs
                    </Typography>
                  </div>

                  {payPlan?.isMinisAndHourlyActive && payPlan?.isHourlyActive && payPlan?.hourlyConfig?.active && payPlan?.hourlyConfig?.model === "draw" && (
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-3">
                      <Lock size={16} className="text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <Typography variant="mono" className="text-amber-400 text-[10px] font-black uppercase tracking-widest block">
                          Draw Model Active
                        </Typography>
                        <Typography variant="p" className="text-slate-400 text-[11px] leading-relaxed">
                          This paycheck is subject to a draw debit. Total payout will validate against configured hours of {payPlan.hourlyConfig.hoursWorked} hrs @ ${payPlan.hourlyConfig.rate}/hr.
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    variant="outline" 
                    className="w-full h-11 uppercase font-black tracking-widest border-white/5 hover:border-white/10 active:scale-95 text-xs text-slate-400"
                    onClick={() => setShowPaycheckBreakdown(false)}
                  >
                    Close Breakdown
                  </Button>
                </div>
              </div>
            </Modal>
          )
        )}
      </AnimatePresence>
    </>
  );
};
