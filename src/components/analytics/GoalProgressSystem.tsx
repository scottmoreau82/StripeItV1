import React from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { Target, TrendingUp, DollarSign, Award, TrendingDown, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface GoalMetricBarProps {
  label: string;
  current: number;
  target: number;
  color: 'cyan' | 'emerald' | 'purple' | 'amber';
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
}

export const GoalMetricBar: React.FC<
  GoalMetricBarProps
> = ({ label, current, target, color, prefix = '', suffix = '', icon: Icon }) => {
  const percentage = target > 0
    ? Math.min(Math.round((current / target) * 100), 100)
    : 0;

  const colorMap = {
    cyan: {
      bar: 'from-brand-deep to-brand-primary',
      text: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
      border: 'border-brand-primary/20'
    },
    emerald: {
      bar: 'from-emerald-600 to-emerald-400',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20'
    },
    purple: {
      bar: 'from-purple-600 to-purple-400',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20'
    },
    amber: {
      bar: 'from-amber-600 to-amber-400',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20'
    }
  };

  const c = colorMap[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-6 w-6 rounded-lg flex items-center justify-center border",
            c.bg, c.border
          )}>
            <Icon className={cn("h-3 w-3", c.text)} />
          </div>
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
            {label}
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Typography variant="mono" className={cn("text-[10px] font-black", c.text)}>
            {percentage}%
          </Typography>
          <Typography variant="mono" className="text-[9px] text-slate-600">
            {prefix}{current.toLocaleString()}{suffix} / {prefix}{target.toLocaleString()}{suffix}
          </Typography>
        </div>
      </div>

      <div className="relative h-3 w-full bg-bg-deep rounded-full border border-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={cn(
            "h-full bg-gradient-to-r rounded-full relative",
            c.bar
          )}
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_2s_linear_infinite]" />
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[4px]" />
        </motion.div>
      </div>
    </div>
  );
};

interface MultiGoalProgressProps {
  metrics: {
    units: number;
    frontEnd: number;
    backEnd: number;
    commission: number;
  };
  goal: {
    unitGoal: number;
    frontGoal?: number;
    backGoal?: number;
    commissionGoal?: number;
    enabledGoals?: {
      units: boolean;
      front: boolean;
      back: boolean;
      payout: boolean;
    };
  } | null;
  loading?: boolean;
}

export const MultiGoalProgress: React.FC<
  MultiGoalProgressProps
> = ({ metrics, goal, loading }) => {
  if (!goal || (goal.unitGoal || 0) === 0) return null;

  const enabled = {
    units: goal.enabledGoals?.units ?? true,
    front: goal.enabledGoals?.front ?? false,
    back: goal.enabledGoals?.back ?? false,
    payout: goal.enabledGoals?.payout ?? false
  };

  const activeGoals = [
    enabled.units && (goal.unitGoal || 0) > 0 && {
      label: 'Units',
      current: metrics.units,
      target: goal.unitGoal || 0,
      color: 'cyan' as const,
      prefix: '',
      suffix: ' units',
      icon: Activity
    },
    enabled.front && (goal.frontGoal || 0) > 0 && {
      label: 'Front Gross',
      current: metrics.frontEnd,
      target: goal.frontGoal || 0,
      color: 'purple' as const,
      prefix: '$',
      suffix: '',
      icon: TrendingUp
    },
    enabled.back && (goal.backGoal || 0) > 0 && {
      label: 'Back Gross',
      current: metrics.backEnd,
      target: goal.backGoal || 0,
      color: 'amber' as const,
      prefix: '$',
      suffix: '',
      icon: TrendingDown
    },
    enabled.payout && (goal.commissionGoal || 0) > 0 && {
      label: 'Est. Payout',
      current: metrics.commission,
      target: goal.commissionGoal || 0,
      color: 'emerald' as const,
      prefix: '$',
      suffix: '',
      icon: Award
    }
  ].filter(Boolean) as GoalMetricBarProps[];

  if (activeGoals.length === 0) return null;

  return (
    <Card className="p-6 bg-bg-card/40 border-white/5 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
          <Target className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <Typography variant="label" className="text-white font-black uppercase text-[10px] tracking-widest block">
            Monthly Goals
          </Typography>
          <Typography variant="mono" className="text-[9px] text-slate-600">
            {activeGoals.length} active target{activeGoals.length !== 1 ? 's' : ''}
          </Typography>
        </div>
      </div>
      {activeGoals.map((g, i) => (
        <GoalMetricBar key={i} {...g} />
      ))}
    </Card>
  );
};

/**
 * StripeItGoalProgressSystem
 * Visual tracking for monthly sales goals.
 */

interface GoalProgressProps {
  current: number;
  target: number;
  label: string;
  unit?: string;
  loading?: boolean;
}

export const GoalProgress: React.FC<GoalProgressProps> = ({
  current,
  target,
  label,
  unit = 'Units',
  loading
}) => {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const remaining = Math.max(target - current, 0);

  return (
    <Card className="p-6 bg-bg-card/40 border-white/5 overflow-hidden group">
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mb-8 gap-4 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
            <Target className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <Typography variant="label" className="text-text-primary font-black block tracking-tight uppercase">{label}</Typography>
            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Monthly Target</Typography>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <Typography variant="h3" className="text-text-primary leading-none mb-1">
            {percentage}%
          </Typography>
          <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black">
            Progress
          </Typography>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar Container */}
        <div className="relative h-4 w-full bg-bg-deep rounded-full border border-white/5 overflow-hidden">
          {/* Subtle Markers */}
          <div className="absolute inset-0 flex justify-between px-4 pointer-events-none">
            <div className="h-full w-[1px] bg-white/[0.03]" />
            <div className="h-full w-[1px] bg-white/[0.03]" />
            <div className="h-full w-[1px] bg-white/[0.03]" />
          </div>

          {/* Active Progress */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-brand-deep to-brand-primary rounded-full relative"
          >
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_2s_linear_infinite]" />
            {/* Glow Head */}
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/40 blur-[4px]" />
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 sm:gap-0">
          <div className="space-y-1 text-center sm:text-left">
            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold block">Current</Typography>
            <Typography variant="h4" className="text-text-primary">{current} {unit}</Typography>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold block">Pacing</Typography>
            {remaining > 0 ? (
              <Typography variant="p" className="text-slate-400 text-xs font-bold font-mono">
                {remaining} more to goal
              </Typography>
            ) : (
              <Typography variant="p" className="text-emerald-400 text-xs font-black font-mono">
                GOAL CRUSHED
              </Typography>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
