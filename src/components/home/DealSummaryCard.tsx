import React from 'react';
import { Deal, PayPlan, AmbientEffect } from '@/src/types';
import { calculateDealCommission } from '@/src/lib/commissionLogic';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Car, ChevronRight } from 'lucide-react';
import { cn, getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';

const getLastName = (fullName: string): string => {
  if (!fullName) return '';
  const suffixes = ['jr.', 'sr.', 'ii', 'iii',
    'iv', 'v', 'jr', 'sr'];
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  if (suffixes.includes(last.toLowerCase())) {
    return `${secondLast} ${last}`;
  }
  return last;
};

/**
 * StripeItDealSummaryCardSystem
 * Individual deal record display optimized for scannability and privacy.
 */

interface DealSummaryCardProps {
  deal: Deal;
  payPlan?: PayPlan | null;
  showGross?: boolean;
  onClick?: () => void;
}

export const DealSummaryCard: React.FC<DealSummaryCardProps> = ({ 
  deal, 
  payPlan, 
  showGross = false,
  onClick 
}) => {
  const { deals } = useAppData();
  const { profile } = useAuth();
  const hasGlass = profile?.preferences?.ambientEffects?.includes(AmbientEffect.GLASSMORPHISM) ?? false;
  
  // Filter deals for the specific month/year of this deal to provide correct context
  const monthlyDeals = React.useMemo(() => {
    const m = getCalendarMonth(deal.date);
    const y = getCalendarYear(deal.date);
    return deals.filter(d => {
      return getCalendarMonth(d.date) === m && getCalendarYear(d.date) === y;
    });
  }, [deals, deal.date]);

  const commission = payPlan ? calculateDealCommission(deal, payPlan, monthlyDeals) : null;
  
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group p-5 transition-all active:scale-[0.99] cursor-pointer relative overflow-hidden",
        hasGlass ? "border-white/10" : "bg-white/[0.01] hover:bg-white/[0.03] border-white/[0.05]",
        onClick ? "hover:border-brand-primary/20" : ""
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0 bg-brand-primary group-hover:w-[2px] transition-all" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "h-8 w-8 shrink-0 rounded-xl flex items-center justify-center border transition-all",
            deal.newOrUsed === 'new'
              ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
              : deal.newOrUsed === 'cpo'
              ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
              : "bg-bg-elevated border-border-subtle text-text-muted"
          )}>
            <Car className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Typography variant="label" className="text-text-primary text-xs font-black uppercase tracking-tight truncate">
                {getLastName(deal.customerName)}
              </Typography>
              <span className={cn(
                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border shrink-0",
                deal.newOrUsed === 'new'
                  ? "text-cyan-400 border-cyan-500/20 bg-cyan-500/10"
                  : deal.newOrUsed === 'cpo'
                  ? "text-purple-400 border-purple-500/20 bg-purple-500/10"
                  : "text-slate-500 border-border-subtle bg-bg-card"
              )}>
                {deal.newOrUsed}
              </span>
            </div>
            <Typography variant="mono" className="text-[9px] text-slate-600 truncate">
              {deal.purchasedVehicle} •{' '}
              {deal.date}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {commission && (
            <Typography variant="mono" className="text-emerald-400 font-black text-sm">
              +${commission.finalPayout.toLocaleString()}
            </Typography>
          )}
          <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-brand-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
};
