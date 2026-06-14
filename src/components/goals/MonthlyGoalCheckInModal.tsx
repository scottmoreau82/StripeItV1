import React, { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { calculatePeriodEarnings } from '@/src/lib/commissionLogic';
import { Target, TrendingUp, TrendingDown, Award, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Deal, Goal, PayPlan, MonthlySpiff } from '@/src/types';

interface MonthlyGoalCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The month we're setting goals for, e.g. "2026-06". */
  currentMonth: string;
  /** Last month's saved goal (if any) to recap and prefill from. */
  previousGoal: Goal | null;
  /** All deals (filtered internally to last month for the recap). */
  deals: Deal[];
  monthlySpiffs: MonthlySpiff[];
  payPlan: PayPlan | null;
  /** Persists the new goal for currentMonth. */
  onSave: (goal: {
    unitGoal: number;
    frontGoal: number;
    backGoal: number;
    commissionGoal: number;
    enabledGoals: { units: boolean; front: boolean; back: boolean; payout: boolean };
  }) => Promise<void>;
}

type GoalKey = 'units' | 'front' | 'back' | 'payout';

const splitRatio = (d: Deal) => (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1);

export const MonthlyGoalCheckInModal: React.FC<MonthlyGoalCheckInModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  previousGoal,
  deals,
  monthlySpiffs,
  payPlan,
  onSave,
}) => {
  const [isSaving, setIsSaving] = useState(false);

  // --- Compute last month's key + label ---
  const { prevMonthKey, prevMonthLabel } = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1); // m is 1-based; m-2 = previous month, 0-based
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { prevMonthKey: key, prevMonthLabel: label };
  }, [currentMonth]);

  // --- Compute last month's actuals (split-aware), matching dashboard metric logic ---
  const actuals = useMemo(() => {
    const pm = Number(prevMonthKey.split('-')[1]) - 1;
    const py = Number(prevMonthKey.split('-')[0]);
    const lastMonthDeals = deals.filter(
      (d) => getCalendarMonth(d.date) === pm && getCalendarYear(d.date) === py
    );
    const lastMonthSpiffs = monthlySpiffs.filter((s) => {
      const ref = s.date || s.month;
      return getCalendarMonth(ref) === pm && getCalendarYear(ref) === py;
    });

    const units = lastMonthDeals.reduce((sum, d) => sum + splitRatio(d), 0);
    const front = lastMonthDeals.reduce((sum, d) => sum + (d.frontEndGross || 0) * splitRatio(d), 0);
    const back = lastMonthDeals.reduce((sum, d) => sum + (d.backEndGross || 0) * splitRatio(d), 0);
    const earnings = payPlan ? calculatePeriodEarnings(lastMonthDeals, payPlan, lastMonthSpiffs) : null;
    const payout = earnings ? earnings.totalPayout + earnings.totalTierBonuses : 0;

    return { units, front, back, payout, dealCount: lastMonthDeals.length };
  }, [deals, monthlySpiffs, payPlan, prevMonthKey]);

  // --- Prefill enabled toggles + targets from last month's goal ---
  const [enabledGoals, setEnabledGoals] = useState({
    units: previousGoal?.enabledGoals?.units ?? true,
    front: previousGoal?.enabledGoals?.front ?? false,
    back: previousGoal?.enabledGoals?.back ?? false,
    payout: previousGoal?.enabledGoals?.payout ?? false,
  });

  const [targets, setTargets] = useState({
    units: previousGoal?.unitGoal?.toString() || '',
    front: previousGoal?.frontGoal?.toString() || '',
    back: previousGoal?.backGoal?.toString() || '',
    payout: previousGoal?.commissionGoal?.toString() || '',
  });

  const goalTypes: {
    key: GoalKey;
    label: string;
    icon: any;
    color: 'cyan' | 'purple' | 'amber' | 'emerald';
    prefix: string;
    placeholder: string;
    target?: number;
    actual: number;
  }[] = [
    { key: 'units', label: 'Units', icon: Activity, color: 'cyan', prefix: '', placeholder: 'e.g. 15', target: previousGoal?.unitGoal, actual: actuals.units },
    { key: 'front', label: 'Front Gross', icon: TrendingUp, color: 'purple', prefix: '$', placeholder: 'e.g. 20000', target: previousGoal?.frontGoal, actual: actuals.front },
    { key: 'back', label: 'Back Gross', icon: TrendingDown, color: 'amber', prefix: '$', placeholder: 'e.g. 15000', target: previousGoal?.backGoal, actual: actuals.back },
    { key: 'payout', label: 'Est. Payout', icon: Award, color: 'emerald', prefix: '$', placeholder: 'e.g. 8000', target: previousGoal?.commissionGoal, actual: actuals.payout },
  ];

  const colorMap = {
    cyan: 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };

  const hadPreviousGoals = !!previousGoal && (
    (previousGoal.enabledGoals?.units && (previousGoal.unitGoal || 0) > 0) ||
    (previousGoal.enabledGoals?.front && (previousGoal.frontGoal || 0) > 0) ||
    (previousGoal.enabledGoals?.back && (previousGoal.backGoal || 0) > 0) ||
    (previousGoal.enabledGoals?.payout && (previousGoal.commissionGoal || 0) > 0)
  );

  const fmt = (key: GoalKey, val: number) =>
    key === 'units'
      ? (Math.round(val * 10) / 10).toLocaleString()
      : `$${Math.round(val).toLocaleString()}`;

  // Build a recap sentence for a single goal type.
  const recapFor = (gt: typeof goalTypes[number]) => {
    if (!gt.target || gt.target <= 0) return null;
    const diff = gt.actual - gt.target;
    const exceeded = diff >= 0;
    const magnitude = fmt(gt.key, Math.abs(diff));
    return (
      <Typography variant="mono" className={cn('text-[10px] font-bold', exceeded ? 'text-emerald-400' : 'text-amber-400')}>
        {exceeded ? 'Exceeded by ' : 'Fell short by '}{magnitude}
      </Typography>
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        unitGoal: Number(targets.units) || 0,
        frontGoal: Number(targets.front) || 0,
        backGoal: Number(targets.back) || 0,
        commissionGoal: Number(targets.payout) || 0,
        enabledGoals,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const monthLabel = useMemo(() => {
    const [y, m] = currentMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' });
  }, [currentMonth]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Set Your ${monthLabel} Goals`} maxWidth="max-w-2xl">
      <div className="space-y-6 px-8 md:px-10 pb-8 md:pb-10">
        <Typography variant="small" className="text-slate-400">
          {hadPreviousGoals
            ? `Here's how ${prevMonthLabel} finished against your targets. Keep them the same or adjust below.`
            : `A new month means a fresh start. Set your targets for ${monthLabel} below.`}
        </Typography>

        <div className="space-y-3">
          {goalTypes.map((gt) => (
            <div
              key={gt.key}
              className={cn(
                'p-4 rounded-2xl border transition-all duration-200',
                enabledGoals[gt.key] ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center border', colorMap[gt.color])}>
                    <gt.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <Typography variant="label" className="text-white font-black text-xs uppercase tracking-widest block font-sans">
                      {gt.label}
                    </Typography>
                    {hadPreviousGoals && gt.target && gt.target > 0 ? (
                      <div className="flex items-center gap-2">
                        <Typography variant="mono" className="text-[9px] text-slate-600">
                          {prevMonthLabel}: {fmt(gt.key, gt.actual)} / {fmt(gt.key, gt.target)}
                        </Typography>
                        {recapFor(gt)}
                      </div>
                    ) : (
                      <Typography variant="mono" className="text-[9px] text-slate-600">
                        {prevMonthLabel}: {fmt(gt.key, gt.actual)} ({actuals.dealCount} deals)
                      </Typography>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setEnabledGoals((prev) => ({ ...prev, [gt.key]: !prev[gt.key] }))}
                  className={cn(
                    'relative h-5 w-9 rounded-full border transition-all duration-200 shrink-0',
                    enabledGoals[gt.key] ? 'bg-brand-primary/20 border-brand-primary/40' : 'bg-white/5 border-white/10'
                  )}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200',
                      enabledGoals[gt.key] ? 'left-[18px] bg-brand-primary' : 'left-0.5 bg-slate-600'
                    )}
                  />
                </button>
              </div>

              <AnimatePresence>
                {enabledGoals[gt.key] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative mt-4">
                      {gt.prefix && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">{gt.prefix}</span>
                      )}
                      <input
                        type="number"
                        value={targets[gt.key]}
                        onChange={(e) => setTargets((prev) => ({ ...prev, [gt.key]: e.target.value }))}
                        placeholder={gt.placeholder}
                        className={cn(
                          'w-full h-11 rounded-xl border bg-white/[0.03] border-white/10 text-white text-sm font-mono focus:outline-none focus:border-brand-primary/40 transition-all',
                          gt.prefix ? 'pl-7 pr-4' : 'px-4'
                        )}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="ghost"
            className="flex-1 h-11 text-slate-400 font-black uppercase tracking-widest text-[10px]"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="flex-1 h-11 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] shadow-glow"
          >
            <Target size={14} className="mr-2" />
            {hadPreviousGoals ? 'Save Goals' : 'Set Goals'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
