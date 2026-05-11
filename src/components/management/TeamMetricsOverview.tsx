import React, { useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { SalespersonMetrics } from '@/src/services/analyticsService';
import { cn } from '@/src/lib/utils';
import { TrendingUp, Users, DollarSign, Award, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * StripeItTeamMetricsSystem
 * High-level team performance overview for managers.
 */

 interface TeamMetricsOverviewProps {
  metrics: SalespersonMetrics[];
  totalTeamMetrics: {
    units: number;
    gross: number;
    commission: number;
    frontEnd: number;
    backEnd: number;
  };
  onSalespersonClick?: (userId: string) => void;
}

export const TeamMetricsOverview: React.FC<TeamMetricsOverviewProps> = ({ 
  metrics, 
  totalTeamMetrics,
  onSalespersonClick 
}) => {
  const sortedMetrics = useMemo(() => 
    [...metrics].sort((a, b) => b.totalUnitsMTD - a.totalUnitsMTD)
  , [metrics]);

  const topPerformer = sortedMetrics[0];

  // Simple pace calculation: target 30 units/month, where are we?
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const paceUnits = (totalTeamMetrics.units / dayOfMonth) * daysInMonth;

  return (
    <div className="space-y-8">
      {/* Team Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-brand-primary/5 border-brand-primary/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Users size={80} className="text-brand-primary" />
          </div>
          <Typography variant="mono" className="text-[10px] text-brand-primary uppercase font-black mb-1">TEAM UNITS MTD</Typography>
          <Typography variant="h2" className="text-white text-4xl">{totalTeamMetrics.units.toFixed(1)}</Typography>
          <div className="mt-2 flex items-center gap-1.5">
             <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, (totalTeamMetrics.units / 50) * 100)}%` }} />
             </div>
             <Typography variant="mono" className="text-[9px] text-slate-500">PACE: {paceUnits.toFixed(0)}</Typography>
          </div>
        </Card>

        <Card className="p-6 bg-emerald-500/5 border-emerald-500/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={80} className="text-emerald-500" />
          </div>
          <Typography variant="mono" className="text-[10px] text-emerald-500 uppercase font-black mb-1">TEAM TOTAL GROSS</Typography>
          <Typography variant="h2" className="text-white text-4xl">${totalTeamMetrics.gross.toLocaleString()}</Typography>
          <Typography variant="mono" className="text-[9px] text-slate-500 mt-2">FE: ${totalTeamMetrics.frontEnd.toLocaleString()} · BE: ${totalTeamMetrics.backEnd.toLocaleString()}</Typography>
        </Card>

        <Card className="p-6 bg-brand-deep/5 border-brand-deep/10 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
            <Award size={80} className="text-brand-deep" />
          </div>
          <Typography variant="mono" className="text-[10px] text-brand-deep uppercase font-black mb-1">TEAM PAYOUT MTD</Typography>
          <Typography variant="h2" className="text-white text-4xl">${totalTeamMetrics.commission.toLocaleString()}</Typography>
          <Typography variant="mono" className="text-[9px] text-slate-500 mt-2">AVG: ${Math.round(totalTeamMetrics.commission / totalTeamMetrics.units || 0).toLocaleString()} / UNIT</Typography>
        </Card>

        <Card className="p-6 bg-bg-card/40 border-white/5 flex flex-col justify-center">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-2">GROSS BREAKDOWN</Typography>
          <div className="space-y-3">
             <div className="flex justify-between items-end">
                <Typography variant="small" className="text-slate-400 text-[10px] font-bold">FRONT END</Typography>
                <Typography variant="label" className="text-white text-sm">${totalTeamMetrics.frontEnd.toLocaleString()}</Typography>
             </div>
             <div className="flex justify-between items-end">
                <Typography variant="small" className="text-slate-400 text-[10px] font-bold">BACK END</Typography>
                <Typography variant="label" className="text-white text-sm">${totalTeamMetrics.backEnd.toLocaleString()}</Typography>
             </div>
          </div>
        </Card>
      </div>

      {/* Top Performer Spot */}
      {topPerformer && (
        <Card className="p-1 px-6 bg-bg-card/40 border-white/5 flex items-center justify-between min-h-[80px]">
          <div className="flex items-center gap-4">
             <div className="h-10 w-10 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30 shadow-glow">
               <TrendingUp className="text-brand-primary h-5 w-5" />
             </div>
             <div>
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">MTD PACE LEADER</Typography>
                <Typography variant="h3" className="text-white">{topPerformer.displayName}</Typography>
             </div>
          </div>
          <div className="flex items-center gap-8 pr-4">
             <div className="text-right">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">UNITS</Typography>
                <Typography variant="label" className="text-brand-primary">{topPerformer.totalUnitsMTD.toFixed(1)}</Typography>
             </div>
             <div className="text-right">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">TOTAL GROSS</Typography>
                <Typography variant="label" className="text-emerald-500">${topPerformer.totalGrossMTD.toLocaleString()}</Typography>
             </div>
          </div>
        </Card>
      )}

      {/* Salesperson Leaderboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <Typography variant="h3" className="text-white font-black uppercase italic tracking-tight">Team Visibility</Typography>
           <Typography variant="mono" className="text-[10px] text-slate-500 uppercase">{metrics.length} Active Salespeople</Typography>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {sortedMetrics.map((sm, index) => (
            <motion.div
              key={sm.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => onSalespersonClick?.(sm.userId)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all">
                      {index + 1}
                   </div>
                   <div className="text-left">
                      <Typography variant="label" className="text-white block">{sm.displayName}</Typography>
                      <Typography variant="small" className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                         {sm.totalUnitsMTD.toFixed(1)} Units · Avg ${Math.round(sm.avgGrossPerUnit).toLocaleString()} Gross
                      </Typography>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-right hidden sm:block">
                      <Typography variant="mono" className="text-[9px] text-slate-500 uppercase">MTD Gross</Typography>
                      <Typography variant="label" className="text-white">${sm.totalGrossMTD.toLocaleString()}</Typography>
                   </div>
                   <ChevronRight className="text-slate-500 group-hover:text-white transition-all h-5 w-5" />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
