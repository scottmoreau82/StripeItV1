import React from 'react';
import { Deal, DealStatus, PayPlan } from '@/src/types';
import { calculateDealCommission } from '@/src/lib/commissionLogic';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Car, Clock, CreditCard, ChevronRight } from 'lucide-react';
import { cn, getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { useAppData } from '@/src/contexts/AppDataContext';

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
        "group p-5 transition-all bg-white/[0.01] hover:bg-white/[0.03] active:scale-[0.99] cursor-pointer border-white/[0.05] relative overflow-hidden",
        onClick ? "hover:border-brand-primary/20" : ""
      )}
    >
      {/* Active hover indicator hover only */}
      <div className="absolute left-0 top-0 bottom-0 w-0 bg-brand-primary group-hover:w-1 transition-all shadow-cyan-glow" />

      <div className="flex items-center justify-between gap-5">
        <div className="flex items-center gap-5 min-w-0">
          {/* Vehicle Icon / Indicator */}
          <div className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all border border-white/5 group-hover:border-white/10",
            deal.newOrUsed === 'new' ? "bg-brand-primary/10 text-brand-primary shadow-cyan-glow" : "bg-[var(--color-bg-elevated)] dark:bg-slate-900 text-slate-500"
          )}>
            <Car className={cn("h-7 w-7", deal.newOrUsed === 'new' && "drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]")} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Typography variant="label" className="text-[var(--color-text-primary)] text-sm font-black uppercase tracking-tight truncate">
                {deal.customerName}
              </Typography>
              <Badge status={deal.status}>{deal.status}</Badge>
            </div>
            <Typography variant="small" className="text-[var(--color-text-secondary)] truncate block text-xs font-bold">
              {deal.purchasedVehicle}
            </Typography>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 opacity-60">
                <Clock className="h-4 w-4 text-[var(--color-text-secondary)]" />
                <Typography variant="mono" className="text-[10px] text-[var(--color-text-secondary)] font-black">
                  {deal.date}
                </Typography>
              </div>
              {deal.isSplitDeal && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-primary/5 border border-brand-primary/10">
                  <CreditCard className="h-3.5 w-3.5 text-brand-primary/60" />
                  <Typography variant="mono" className="text-[9px] text-brand-primary/60 font-black">Split</Typography>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {commission && (
            <div className="text-right">
              <Typography variant="h2" className="text-emerald-400 font-black block leading-none md:text-2xl">
                +${commission.finalPayout.toLocaleString()}
              </Typography>
              <Typography variant="mono" className="text-[8px] font-black text-slate-600 mt-1">
                Estimated Payout
              </Typography>
            </div>
          )}
          
          {showGross && !commission && (
            <Typography variant="h3" className="text-[var(--color-text-primary)] font-black">
              ${(deal.frontEndGross + deal.backEndGross).toLocaleString()}
            </Typography>
          )}

          <div className="h-8 w-8 rounded-full bg-[var(--color-bg-elevated)] dark:bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:border-brand-primary/30 group-hover:bg-brand-primary/5 transition-all">
            <ChevronRight className="h-5 w-5 text-slate-700 group-hover:text-brand-primary" />
          </div>
        </div>
      </div>
    </Card>
  );
};
