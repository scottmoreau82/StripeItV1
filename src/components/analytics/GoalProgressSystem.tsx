import React from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { Target, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

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
            <Typography variant="label" className="text-white font-black block tracking-tight uppercase">{label}</Typography>
            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Monthly Target</Typography>
          </div>
        </div>
        <div className="text-center sm:text-right">
          <Typography variant="h3" className="text-white leading-none mb-1">
            {percentage}%
          </Typography>
          <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black">
            Progress
          </Typography>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar Container */}
        <div className="relative h-4 w-full bg-slate-900 rounded-full border border-white/5 overflow-hidden">
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
            <Typography variant="h4" className="text-white">{current} {unit}</Typography>
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
