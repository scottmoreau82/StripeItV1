import React, { useState, useMemo } from 'react';
import { Deal, DealStatus, PayPlan, UserProfile } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { DealSearch } from './DealSearch';
import { DealFilters } from './DealFilters';
import { DealDetailView } from './DealDetailView';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  ShieldCheck, 
  Target, 
  Calculator, 
  Edit, 
  Trash2, 
  ChevronRight,
  TrendingUp,
  Clock,
  Car
} from 'lucide-react';
import { cn, formatDateSafe } from '@/src/lib/utils';
import { calculateDealCommission } from '@/src/lib/commissionLogic';

import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { DashboardLayout } from '../layout/DashboardLayout';
import { ContextHint } from '../onboarding/ContextHint';
import { randomDealService } from '@/src/services/randomDealService';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';

import { EmptyState } from '../ui/EmptyState';

/**
 * StripeItSalesLogSystem
 * The primary view for browsing, searching, and managing all car deals.
 */

interface SalesLogViewProps {
  onEdit?: (deal: Deal) => void;
  onConfigPayPlan?: () => void;
}

export const SalesLogView: React.FC<SalesLogViewProps> = ({
  onEdit,
  onConfigPayPlan,
}) => {
  const { 
    deals, 
    payPlan, 
    isLoading, 
    handleDeleteDeal, 
    handleUpdateDealStatus 
  } = useAppData();
  
  const { profile, isAdmin, user } = useAuth();
  const { isMobile } = useResponsive();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  // Sync selected deal if deals list updates (e.g. status change)
  const currentSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find(d => d.id === selectedDeal.id) || selectedDeal;
  }, [deals, selectedDeal]);

  // Filtering Logic
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const searchMatch = !search || 
        deal.customerName.toLowerCase().includes(search.toLowerCase()) ||
        deal.dealNumber?.toLowerCase().includes(search.toLowerCase()) ||
        deal.stockNumber?.toLowerCase().includes(search.toLowerCase());
      
      const statusMatch = statusFilter === 'all' || deal.status === statusFilter;
      const typeMatch = typeFilter === 'all' || deal.newOrUsed === typeFilter;

      return searchMatch && statusMatch && typeMatch;
    });
  }, [deals, search, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const header = (
    <div className="flex flex-col gap-2">
      <Typography variant="h1" className="text-white">Sales Log</Typography>
      <div className="flex items-center gap-3">
        <Typography variant="p" className="text-slate-500">
          {profile?.displayName}'s personal history: {deals.length} deals total
        </Typography>
        <button 
          onClick={onConfigPayPlan}
          className="p-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-95 shadow-glow glow-primary/5"
          title="Commission Matrix"
          aria-label="Commission Matrix"
        >
          <Calculator size={14} />
        </button>
      </div>
    </div>
  );

  // Deal Detail Modal/Flow
  const handleCreateRandomDeal = () => {
    const randomDeal = randomDealService.generateRandomDeal();
    if (window.confirm(`Create random deal for ${randomDeal.customerName}?`)) {
      window.dispatchEvent(new CustomEvent('stripeit:create-random-deal'));
    }
  };

  const testingTools = (isAdmin || user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase()) ? (
    <div className="mt-12 pt-8 border-t border-white/5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-brand-primary" />
        <Typography variant="mono" className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">
          Testing Tools (Admin Only)
        </Typography>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <Typography variant="h4" className="text-white mb-1">Generate Demo Data</Typography>
          <Typography variant="small" className="text-slate-500">
            Instantly create a realistic car deal to test calculations, totalizers, and dashboard visualizations.
          </Typography>
        </div>
        <Button 
          variant="secondary"
          className="bg-white/5 border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all gap-2"
          onClick={handleCreateRandomDeal}
        >
          <Target className="h-4 w-4" />
          Create Random Deal
        </Button>
      </div>
    </div>
  ) : null;

  const mainContent = (
    <div className="space-y-8 pb-32">
      <ContextHint 
        id="hint-sales-log" 
        title="Institutional Memory" 
        message="Search by customer name or stock number to recall deal details months later. The history grows with you."
        className="mb-0"
      />
      {/* Search & Filters Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DealSearch value={search} onChange={setSearch} />
        </div>
        <DealFilters 
          status={statusFilter}
          onStatusChange={setStatusFilter}
          type={typeFilter}
          onTypeChange={setTypeFilter}
          onClear={clearFilters}
        />
      </div>

      {/* Results Meta */}
      <div className="flex items-center justify-between">
        <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-500">
          Showing {filteredDeals.length} of {deals.length} deals
        </Typography>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : filteredDeals.length > 0 ? (
          <>
            {/* Desktop Table Layout */}
            {!isMobile && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-4 text-left w-[100px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Date</Typography>
                      </th>
                      <th className="py-4 px-4 text-left">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Customer / Deal #</Typography>
                      </th>
                      <th className="py-4 px-4 text-left">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Vehicle / Stock #</Typography>
                      </th>
                      <th className="py-4 px-4 text-left w-[100px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Type</Typography>
                      </th>
                      <th className="py-4 px-4 text-right w-[140px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Front Gross</Typography>
                      </th>
                      <th className="py-4 px-4 text-right w-[140px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Back Gross</Typography>
                      </th>
                      <th className="py-4 px-4 text-right w-[180px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Commission</Typography>
                      </th>
                      <th className="py-4 px-4 text-right w-[100px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-right">Actions</Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {filteredDeals.map((deal, index) => {
                      const dDate = new Date(deal.date);
                      const m = dDate.getMonth();
                      const y = dDate.getFullYear();
                      const monthlyDeals = deals.filter(d => {
                        const dd = new Date(d.date);
                        return dd.getMonth() === m && dd.getFullYear() === y;
                      });
                      const commission = payPlan ? calculateDealCommission(deal, payPlan, monthlyDeals) : null;
                      const frontRate = commission?.frontEndCommission ? ((commission.frontEndCommission / deal.frontEndGross) * 100).toFixed(0) : 0;
                      const backRate = commission?.backEndCommission ? ((commission.backEndCommission / deal.backEndGross) * 100).toFixed(0) : 0;

                      return (
                        <motion.tr
                          key={deal.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          onClick={() => setSelectedDeal(deal)}
                          className="group hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <td className="py-5 px-4 whitespace-nowrap">
                            <Typography variant="mono" className="text-[11px] text-slate-400 font-black">
                              {formatDateSafe(deal.date, 'MM/dd/yy')}
                            </Typography>
                          </td>
                          <td className="py-5 px-4">
                            <div className="flex flex-col min-w-0">
                              <Typography variant="label" className="text-white text-sm font-black truncate">
                                {deal.customerName}
                              </Typography>
                              <Typography variant="mono" className="text-[10px] text-slate-600 font-bold">
                                #{deal.dealNumber || '---'}
                              </Typography>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <div className="flex flex-col min-w-0">
                              <Typography variant="small" className="text-slate-300 truncate text-xs font-bold">
                                {deal.purchasedVehicle}
                              </Typography>
                              <Typography variant="mono" className="text-[10px] text-slate-600 font-bold">
                                {deal.stockNumber || '---'}
                              </Typography>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <TypeBadge type={deal.newOrUsed as any} />
                          </td>
                          <td className="py-5 px-4 text-right">
                            <Typography variant="mono" className="text-xs text-white group-hover:text-cyan-400 transition-colors font-black">
                              ${deal.frontEndGross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </Typography>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <Typography variant="mono" className="text-xs text-white group-hover:text-purple-400 transition-colors font-black">
                              ${deal.backEndGross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </Typography>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <div className="flex flex-col items-end">
                              <Typography variant="label" className="text-emerald-400 font-black text-sm">
                                ${commission?.finalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '0'}
                              </Typography>
                              {commission && (
                                <Typography variant="mono" className="text-[8px] text-slate-600 font-black uppercase">
                                  {frontRate}% / {backRate}%
                                </Typography>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                                className="p-2 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (window.confirm('Delete this deal record?')) handleDeleteDeal?.(deal.id); 
                                }}
                                className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Cards Layout */}
            {isMobile && (
              <div className="grid grid-cols-1 gap-4">
                {filteredDeals.map((deal, index) => {
                  const dDate = new Date(deal.date);
                  const m = dDate.getMonth();
                  const y = dDate.getFullYear();
                  const monthlyDeals = deals.filter(d => {
                    const dd = new Date(d.date);
                    return dd.getMonth() === m && dd.getFullYear() === y;
                  });
                  const commission = payPlan ? calculateDealCommission(deal, payPlan, monthlyDeals) : null;

                  return (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedDeal(deal)}
                      className="bg-[#0A0C12] border border-white/5 rounded-[1.5rem] p-5 shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 flex gap-2">
                         <TypeBadge type={deal.newOrUsed as any} />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0">
                            <Car className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <Typography variant="label" className="text-white text-base font-black uppercase truncate block">
                              {deal.customerName}
                            </Typography>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Typography variant="mono" className="text-[10px] text-slate-600 font-bold">
                                #{deal.dealNumber || '---'}
                              </Typography>
                              <span className="h-1 w-1 rounded-full bg-slate-800" />
                              <Typography variant="mono" className="text-[10px] text-slate-500 font-black">
                                {formatDateSafe(deal.date, 'MM/dd/yy')}
                              </Typography>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/[0.03] grid grid-cols-2 gap-4">
                          <div>
                            <Typography variant="mono" className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1 block">Front Gross</Typography>
                            <Typography variant="label" className="text-white font-black text-sm">
                              ${deal.frontEndGross.toLocaleString()}
                            </Typography>
                          </div>
                          <div>
                            <Typography variant="mono" className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1 block">Back Gross</Typography>
                            <Typography variant="label" className="text-white font-black text-sm">
                              ${deal.backEndGross.toLocaleString()}
                            </Typography>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/[0.03] flex items-center justify-between">
                          <div>
                            <Typography variant="mono" className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1 block">Commission</Typography>
                            <Typography variant="h3" className="text-emerald-400 font-black">
                              ${commission?.finalPayout.toLocaleString() || '0'}
                            </Typography>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 active:scale-95 transition-all"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                if (window.confirm('Delete this deal record?')) handleDeleteDeal?.(deal.id); 
                              }}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-slate-400 active:scale-95 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={History}
            title="No results found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear Filters
              </Button>
            }
          />
        )}
      </div>

      {testingTools}

      {/* Deal Detail Modal/Flow */}
      <AnimatePresence>
        {currentSelectedDeal && (
          isMobile ? (
            <FullscreenMobileFlow
              isOpen={!!currentSelectedDeal}
              onClose={() => setSelectedDeal(null)}
              title="Deal Details"
            >
              <DealDetailView 
                deal={currentSelectedDeal}
                payPlan={payPlan}
                onClose={() => setSelectedDeal(null)}
                onEdit={onEdit}
                onDelete={async (deal) => {
                  await handleDeleteDeal?.(deal.id);
                  setSelectedDeal(null);
                }}
                onStatusChange={(deal, status) => handleUpdateDealStatus(deal.id, status)}
              />
            </FullscreenMobileFlow>
          ) : (
            <Modal
              isOpen={!!currentSelectedDeal}
              onClose={() => setSelectedDeal(null)}
              title="Deal Record"
            >
              <DealDetailView 
                deal={currentSelectedDeal}
                payPlan={payPlan}
                onClose={() => setSelectedDeal(null)}
                onEdit={onEdit}
                onDelete={async (deal) => {
                  await handleDeleteDeal?.(deal.id);
                  setSelectedDeal(null);
                }}
                onStatusChange={(deal, status) => handleUpdateDealStatus(deal.id, status)}
              />
            </Modal>
          )
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};

const TypeBadge = ({ type }: { type: 'new' | 'used' | 'cpo' }) => {
  const styles = {
    new: "bg-cyan-500/10 text-cyan-400 border-cyan-500/10 shadow-[0_0_10px_rgba(34,211,238,0.1)]",
    used: "bg-slate-500/10 text-slate-500 border-white/5",
    cpo: "bg-purple-500/10 text-purple-400 border-purple-500/10",
  };
  
  const colors = styles[type] || styles.used;
  
  return (
    <div className={cn(
      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.2em] border inline-flex transition-all",
      colors
    )}>
      {type}
    </div>
  );
};
