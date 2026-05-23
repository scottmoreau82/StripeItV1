import React, { useState, useMemo } from 'react';
import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { goalService } from '@/src/services/goalService';
import { calculateDashboardMetrics } from '@/src/services/analyticsService';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { DashboardLayout } from '../layout/DashboardLayout';
import { GoalMetricBar, MultiGoalProgress } from '../analytics/GoalProgressSystem';
import { AppIcon } from '../ui/AppIcon';
import { Target, TrendingUp, TrendingDown, Award, Activity, Save } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const GoalsView: React.FC = () => {
  const { deals, monthlySpiffs, payPlan, goal, handleSaveGoal } = useAppData();
  const { profile, addToast } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const metrics = useMemo(() =>
    calculateDashboardMetrics(deals, payPlan, monthlySpiffs),
    [deals, payPlan, monthlySpiffs]);

  const [enabledGoals, setEnabledGoals] = useState({
    units: goal?.enabledGoals?.units ?? true,
    front: goal?.enabledGoals?.front ?? false,
    back: goal?.enabledGoals?.back ?? false,
    payout: goal?.enabledGoals?.payout ?? false
  });

  const [targets, setTargets] = useState({
    units: goal?.unitGoal?.toString() || '',
    front: goal?.frontGoal?.toString() || '',
    back: goal?.backGoal?.toString() || '',
    payout: goal?.commissionGoal?.toString() || ''
  });

  const goalTypes = [
    {
      key: 'units' as const,
      label: 'Units',
      description: 'Monthly unit sales target',
      icon: Activity,
      color: 'cyan' as const,
      prefix: '',
      suffix: ' units',
      placeholder: 'e.g. 15',
      metricValue: metrics.units
    },
    {
      key: 'front' as const,
      label: 'Front Gross',
      description: 'Total front-end gross target',
      icon: TrendingUp,
      color: 'purple' as const,
      prefix: '$',
      suffix: '',
      placeholder: 'e.g. 20000',
      metricValue: metrics.frontEnd
    },
    {
      key: 'back' as const,
      label: 'Back Gross',
      description: 'Total back-end gross target',
      icon: TrendingDown,
      color: 'amber' as const,
      prefix: '$',
      suffix: '',
      placeholder: 'e.g. 15000',
      metricValue: metrics.backEnd
    },
    {
      key: 'payout' as const,
      label: 'Est. Payout',
      description: 'Monthly commission target',
      icon: Award,
      color: 'emerald' as const,
      prefix: '$',
      suffix: '',
      placeholder: 'e.g. 8000',
      metricValue: metrics.commission
    }
  ];

  const colorMap = {
    cyan: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  };

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await handleSaveGoal({
        userId: profile.uid,
        orgId: profile.orgId,
        month: currentMonth,
        unitGoal: Number(targets.units) || 0,
        frontGoal: Number(targets.front) || 0,
        backGoal: Number(targets.back) || 0,
        commissionGoal: Number(targets.payout) || 0,
        enabledGoals
      });
      addToast('Goals saved.', 'success');
    } catch (error) {
      addToast('Failed to save goals.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const header = (
    <PageHeader
      title="Goals"
      subtitle="Set and track your monthly performance targets"
      icon={Target}
    >
      <Button
        onClick={handleSave}
        isLoading={isSaving}
        className="h-11 px-6 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] shadow-glow"
      >
        <Save size={14} className="mr-2" />
        Save Goals
      </Button>
    </PageHeader>
  );

  const activePreviewGoal = {
    unitGoal: Number(targets.units) || 0,
    frontGoal: Number(targets.front) || 0,
    backGoal: Number(targets.back) || 0,
    commissionGoal: Number(targets.payout) || 0,
    enabledGoals
  };

  const mainContent = (
    <div className="space-y-8 max-w-2xl">
      {/* Goal Type Cards */}
      <div className="space-y-4">
        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">
          This Month's Targets
        </Typography>

        {goalTypes.map(gt => (
          <Card key={gt.key}
            className={cn(
              "p-5 border transition-all duration-200",
              enabledGoals[gt.key]
                ? "bg-white/[0.03] border-white/10"
                : "bg-white/[0.01] border-white/5 opacity-60"
            )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center border",
                  colorMap[gt.color]
                )}>
                  <gt.icon className="h-4 w-4" />
                </div>
                <div>
                  <Typography variant="label" className="text-white font-black text-xs uppercase tracking-widest block font-sans">
                    {gt.label}
                  </Typography>
                  <Typography variant="mono" className="text-[9px] text-slate-600">
                    {gt.description}
                  </Typography>
                </div>
              </div>
              <button
                onClick={() => setEnabledGoals(
                  prev => ({
                    ...prev,
                    [gt.key]: !prev[gt.key]
                  })
                )}
                className={cn(
                  "relative h-5 w-9 rounded-full border transition-all duration-200",
                  enabledGoals[gt.key]
                    ? "bg-brand-primary/20 border-brand-primary/40"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200",
                  enabledGoals[gt.key]
                    ? "left-[18px] bg-brand-primary"
                    : "left-0.5 bg-slate-600"
                )} />
              </button>
            </div>

            <AnimatePresence>
              {enabledGoals[gt.key] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
                        {gt.prefix}
                      </span>
                      <input
                        type="number"
                        value={targets[gt.key]}
                        onChange={e =>
                          setTargets(prev => ({
                            ...prev,
                            [gt.key]: e.target.value
                          }))
                        }
                        placeholder={gt.placeholder}
                        className={cn(
                          "w-full h-11 rounded-xl border bg-white/[0.03] border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-primary/40 transition-all",
                          gt.prefix ? "pl-7 pr-4" : "px-4"
                        )}
                      />
                    </div>
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black shrink-0">
                      Target
                    </Typography>
                  </div>

                  {targets[gt.key] && Number(targets[gt.key]) > 0 && (
                    <GoalMetricBar
                      label={gt.label}
                      current={gt.metricValue}
                      target={Number(targets[gt.key])}
                      color={gt.color}
                      prefix={gt.prefix}
                      suffix={gt.suffix}
                      icon={gt.icon}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};
