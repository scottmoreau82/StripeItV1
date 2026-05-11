import React, { useState, useMemo } from 'react';
import { Deal, DealStatus } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Filter, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn, formatDateSafe } from '@/src/lib/utils';

/**
 * StripeItManagerDealOversightSystem
 * Focused list for managers to verify and monitor team deals.
 */

interface DealOversightListProps {
  deals: Deal[];
  onDealClick: (deal: Deal) => void;
}

export const DealOversightList: React.FC<DealOversightListProps> = ({ deals, onDealClick }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | DealStatus>('all');

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch = 
        deal.customerName.toLowerCase().includes(search.toLowerCase()) ||
        deal.purchasedVehicle.toLowerCase().includes(search.toLowerCase()) ||
        deal.salespersonName?.toLowerCase().includes(search.toLowerCase());
      
      const matchesFilter = activeFilter === 'all' || deal.status === activeFilter;
      
      return matchesSearch && matchesFilter;
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [deals, search, activeFilter]);

  const stats = useMemo(() => {
    const drafts = deals.filter(d => d.status === DealStatus.DRAFT).length;
    const submitted = deals.filter(d => d.status === DealStatus.SUBMITTED).length;
    return { drafts, submitted };
  }, [deals]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4 bg-white/[0.02] border-white/5 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
          <Input 
            placeholder="Search team deals or salesperson..."
            className="pl-10 bg-transparent border-white/10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl">
           {(['all', DealStatus.DRAFT, DealStatus.SUBMITTED, DealStatus.FINALIZED] as const).map((f) => (
             <button
               key={f}
               onClick={() => setActiveFilter(f)}
               className={cn(
                 "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                 activeFilter === f ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
               )}
             >
               {f}
             </button>
           ))}
        </div>
      </Card>

      {/* Exception Highlights */}
      {(stats.drafts > 0 || stats.submitted > 0) && (
        <div className="flex flex-wrap gap-4">
           {stats.drafts > 0 && (
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 animate-pulse">
               <Clock size={14} className="stroke-[3px]" />
               <Typography variant="mono" className="text-[10px] font-black uppercase">{stats.drafts} PENDING DRAFTS</Typography>
             </div>
           )}
           {stats.submitted > 0 && (
             <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
               <AlertCircle size={14} className="stroke-[3px]" />
               <Typography variant="mono" className="text-[10px] font-black uppercase">{stats.submitted} REQUIRES REVIEW</Typography>
             </div>
           )}
        </div>
      )}

      {/* Deals List */}
      <div className="space-y-3">
        {filteredDeals.length > 0 ? (
          filteredDeals.map((deal) => (
            <button
              key={deal.id}
              onClick={() => onDealClick(deal)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-bg-card/20 border border-white/5 hover:border-white/10 transition-all group text-left"
            >
              <div className="flex items-center gap-6">
                 <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-white/5 items-center justify-center text-slate-500 shrink-0">
                    <Clock size={20} />
                 </div>
                 <div>
                    <div className="flex items-center gap-2 mb-0.5">
                       <Typography variant="label" className="text-white truncate max-w-[150px]">{deal.customerName}</Typography>
                       <Badge status={deal.status}>{deal.status}</Badge>
                    </div>
                    <Typography variant="small" className="text-slate-500 text-[11px] font-bold block">
                       {deal.purchasedVehicle} · {deal.salespersonName || 'Team Member'}
                    </Typography>
                 </div>
              </div>
              
              <div className="flex items-center gap-8 pr-2">
                 <div className="text-right hidden sm:block">
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase">Gross</Typography>
                    <Typography variant="label" className="text-white">${(deal.frontEndGross + deal.backEndGross).toLocaleString()}</Typography>
                 </div>
                 <div className="text-right">
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase">Updated</Typography>
                    <Typography variant="small" className="text-slate-400 font-bold block">{formatDateSafe(deal.updatedAt, 'MMM d')}</Typography>
                 </div>
                 <ChevronRight className="text-slate-600 group-hover:text-white transition-all" />
              </div>
            </button>
          ))
        ) : (
          <div className="py-20 text-center">
             <Typography variant="p" className="text-slate-600">No deals matched your visibility filters.</Typography>
          </div>
        )}
      </div>
    </div>
  );
};
