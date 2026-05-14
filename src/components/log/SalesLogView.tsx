import React, { useState, useMemo } from 'react';
import { Deal, DealStatus, PayPlan, UserProfile, SubscriptionTier, MonthlySpiff } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { DealSearch } from './DealSearch';
import { DealFilters } from './DealFilters';
import { DealDetailView } from './DealDetailView';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { motion, AnimatePresence } from 'motion/react';
import { AppIcon } from '../ui/AppIcon';
import { Eye } from 'lucide-react';
import { cn, formatDateSafe, getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { calculateDealCommission } from '@/src/lib/commissionLogic';
import { Badge } from '../ui/Badge';

import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { DashboardLayout } from '../layout/DashboardLayout';
import { randomDealService } from '@/src/services/randomDealService';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';

import { EmptyState } from '../ui/EmptyState';

import { PayoutExplanationModal } from './PayoutExplanationModal';
import { CommissionResult } from '@/src/lib/commissionLogic';

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
    monthlySpiffs,
    payPlan, 
    isLoading, 
    handleDeleteDeal, 
    handleUpdateDealStatus,
    handleDeleteMonthlySpiff
  } = useAppData();
  
  const { profile, isAdmin, user } = useAuth();
  const { isMobile } = useResponsive();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const currentMonthDeals = useMemo(() => deals.filter(d => {
    const dDate = new Date(d.date);
    return dDate.getMonth() + 1 === currentMonth && dDate.getFullYear() === currentYear;
  }), [deals, currentMonth, currentYear]);

  const currentMonthSpiffs = useMemo(() => monthlySpiffs.filter(s => {
    const spiffMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
    return s.month === spiffMonthStr;
  }), [monthlySpiffs, currentMonth, currentYear]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedSpiff, setSelectedSpiff] = useState<MonthlySpiff | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const isBasicPlus = profile?.subscriptionTier !== SubscriptionTier.FREE;

  // Explanation Modal State
  const [explanationData, setExplanationData] = useState<{ commission: CommissionResult, customerName: string } | null>(null);

  // Sync selected deal if deals list updates (e.g. status change)
  const currentSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find(d => d.id === selectedDeal.id) || selectedDeal;
  }, [deals, selectedDeal]);

  const handleSort = (key: string) => {
    if (!isBasicPlus) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Filtering & Sorting Logic
  const sortedItems = useMemo(() => {
    // 1. Combine deals and spiffs into a unified log list
    const logItems: (Deal | MonthlySpiff)[] = [
      ...deals.map(d => ({ ...d, logType: 'deal' as const })),
      ...monthlySpiffs.map(s => ({ ...s, logType: 'spiff' as const, date: s.date || s.month + '-01' })) // Ensure date for sorting
    ];

    // 2. Pre-group deals by month for commission context
    const dealsByMonthKey: Record<string, Deal[]> = {};
    deals.forEach(d => {
      const key = `${getCalendarYear(d.date)}-${getCalendarMonth(d.date)}`;
      if (!dealsByMonthKey[key]) dealsByMonthKey[key] = [];
      dealsByMonthKey[key].push(d);
    });

    const filtered = logItems.filter(item => {
      const isDeal = 'customerName' in item;
      const searchStr = search.toLowerCase();
      
      const searchMatch = !search || (
        isDeal ? (
          item.customerName.toLowerCase().includes(searchStr) ||
          item.dealNumber?.toLowerCase().includes(searchStr) ||
          item.stockNumber?.toLowerCase().includes(searchStr) ||
          item.newOrUsed?.toLowerCase().includes(searchStr) ||
          (item.purchasedVehicle?.toLowerCase().includes(searchStr))
        ) : (
          item.label?.toLowerCase().includes(searchStr) ||
          item.notes?.toLowerCase().includes(searchStr) ||
          'spiff'.toLowerCase().includes(searchStr)
        )
      );
      
      const typeMatch = typeFilter === 'all' || (isDeal && item.newOrUsed === typeFilter);

      return searchMatch && typeMatch;
    });

    // 2. Wrap for sorting to handle calculated payouts efficiently
    const sortables = filtered.map(item => {
      let val: any = 0;
      const isDeal = 'customerName' in item;

      if (sortConfig.key === 'payout' && isBasicPlus) {
        if (isDeal) {
          const key = `${getCalendarYear(item.date)}-${getCalendarMonth(item.date)}`;
          const monthlyDeals = dealsByMonthKey[key] || [];
          val = payPlan ? calculateDealCommission(item, payPlan, monthlyDeals).finalPayout : 0;
        } else {
          val = item.amount;
        }
      }
      return { item, val };
    });

    return sortables.sort((a, b) => {
      let valA: any;
      let valB: any;
      const isDealA = 'customerName' in a.item;
      const isDealB = 'customerName' in b.item;

      if (sortConfig.key === 'date') {
        valA = new Date(a.item.date).getTime();
        valB = new Date(b.item.date).getTime();
      } else if (sortConfig.key === 'customer') {
        valA = isDealA ? (a.item as Deal).customerName.toLowerCase() : (a.item as MonthlySpiff).label?.toLowerCase() || 'spiff';
        valB = isDealB ? (b.item as Deal).customerName.toLowerCase() : (b.item as MonthlySpiff).label?.toLowerCase() || 'spiff';
      } else if (sortConfig.key === 'vehicle') {
        valA = isDealA ? (a.item as Deal).purchasedVehicle.toLowerCase() : '---';
        valB = isDealB ? (b.item as Deal).purchasedVehicle.toLowerCase() : '---';
      } else if (sortConfig.key === 'frontEndGross' || sortConfig.key === 'backEndGross') {
        valA = isDealA ? (a.item as any)[sortConfig.key] : 0;
        valB = isDealB ? (b.item as any)[sortConfig.key] : 0;
      } else if (sortConfig.key === 'payout') {
        valA = a.val;
        valB = b.val;
      } else {
        return 0;
      }

      const result = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortConfig.direction === 'asc' ? result : -result;
    }).map(s => s.item);

  }, [deals, monthlySpiffs, search, typeFilter, sortConfig, isBasicPlus, payPlan]);

  const clearFilters = () => {
    setTypeFilter('all');
  };

  const handleDealInteraction = (deal: Deal) => {
    if (expandedId === deal.id) {
      // Second tap on expanded deal: open fullscreen
      setSelectedDeal(deal);
    } else {
      // First tap or tap on another deal: expand inline
      setExpandedId(deal.id);
    }
  };

  const header = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Typography variant="h1" className="text-white text-2xl lg:text-3xl font-black italic tracking-tighter">Sales Log</Typography>
        <button 
          onClick={onConfigPayPlan}
          className="p-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-95 shadow-glow glow-primary/5"
          title="Est. Payout Engine"
          aria-label="Est. Payout Engine"
        >
          <AppIcon name="calculator" size={16} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Typography variant="mono" className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">
          {currentMonthDeals.length} deals / {currentMonthSpiffs.length} spiffs
        </Typography>
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
        <AppIcon name="lock" className="h-4 w-4 text-brand-primary" />
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
          <AppIcon name="target" className="h-4 w-4" />
          Create Random Deal
        </Button>
      </div>
    </div>
  ) : null;

  const mainContent = (
    <div className="space-y-8 pb-32">
      {/* Search & Filters Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        <div className={cn("lg:col-span-2", isMobile ? "col-span-1" : "")}>
          <DealSearch 
            value={search} 
            onChange={setSearch} 
            placeholder={isMobile ? "Search customer, stock, or condition..." : undefined}
          />
        </div>
        {!isMobile && (
          <DealFilters 
            type={typeFilter}
            onTypeChange={setTypeFilter}
            onClear={clearFilters}
          />
        )}
      </div>

      {isMobile && isBasicPlus && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black shrink-0">Sort By:</Typography>
          {[
            { key: 'date', label: 'Date' },
            { key: 'customer', label: 'Customer' },
            { key: 'frontEndGross', label: 'Front' },
            { key: 'backEndGross', label: 'Back' },
            { key: 'payout', label: 'Payout' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => handleSort(opt.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border",
                sortConfig.key === opt.key 
                  ? "bg-brand-primary/20 border-brand-primary text-brand-primary" 
                  : "bg-white/5 border-white/10 text-slate-500"
              )}
            >
              {opt.label}
              {sortConfig.key === opt.key && (
                <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Results Meta */}
      <div className="flex items-center justify-between">
        <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-500">
          Showing {sortedItems.length} items
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
        ) : sortedItems.length > 0 ? (
          <>
            {/* Desktop Table Layout */}
            {!isMobile && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th 
                        className={cn("py-4 px-4 text-left w-[100px]", isBasicPlus && "cursor-pointer hover:bg-white/5 transition-colors")}
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center gap-1">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Date</Typography>
                          {isBasicPlus && sortConfig.key === 'date' && (
                            <AppIcon name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} className="text-brand-primary" />
                          )}
                        </div>
                      </th>
                      <th 
                        className={cn("py-4 px-4 text-left", isBasicPlus && "cursor-pointer hover:bg-white/5 transition-colors")}
                        onClick={() => handleSort('customer')}
                      >
                        <div className="flex items-center gap-1">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Customer / Deal #</Typography>
                          {isBasicPlus && sortConfig.key === 'customer' && (
                            <AppIcon name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} className="text-brand-primary" />
                          )}
                        </div>
                      </th>
                      <th 
                        className={cn("py-4 px-4 text-left", isBasicPlus && "cursor-pointer hover:bg-white/5 transition-colors")}
                        onClick={() => handleSort('vehicle')}
                      >
                        <div className="flex items-center gap-1">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Vehicle / Stock #</Typography>
                          {isBasicPlus && sortConfig.key === 'vehicle' && (
                            <AppIcon name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} className="text-brand-primary" />
                          )}
                        </div>
                      </th>
                      <th className="py-4 px-4 text-left w-[100px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Type</Typography>
                      </th>
                      <th 
                        className={cn("py-4 px-4 text-right w-[140px]", isBasicPlus && "cursor-pointer hover:bg-white/5 transition-colors")}
                        onClick={() => handleSort('frontEndGross')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Front Gross</Typography>
                          {isBasicPlus && sortConfig.key === 'frontEndGross' && (
                            <AppIcon name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} className="text-brand-primary" />
                          )}
                        </div>
                      </th>
                      <th 
                        className={cn("py-4 px-4 text-right w-[140px]", isBasicPlus && "cursor-pointer hover:bg-white/5 transition-colors")}
                        onClick={() => handleSort('backEndGross')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Back Gross</Typography>
                          {isBasicPlus && sortConfig.key === 'backEndGross' && (
                            <AppIcon name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} className="text-brand-primary" />
                          )}
                        </div>
                      </th>
                      <th 
                        className={cn("py-4 px-4 text-right w-[180px]", isBasicPlus && "cursor-pointer hover:bg-white/5 transition-colors")}
                        onClick={() => handleSort('payout')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Est. Payout</Typography>
                          {isBasicPlus && sortConfig.key === 'payout' && (
                            <AppIcon name={sortConfig.direction === 'asc' ? 'chevron-up' : 'chevron-down'} size={10} className="text-brand-primary" />
                          )}
                        </div>
                      </th>
                      <th className="py-4 px-4 text-right w-[100px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black text-right">Actions</Typography>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {sortedItems.map((item, index) => {
                      const isDeal = 'customerName' in item;
                      
                      if (!isDeal) {
                        const spiff = item as MonthlySpiff;
                        return (
                          <motion.tr
                            key={spiff.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('stripeit:edit-spiff', { detail: spiff }));
                            }}
                            className="group hover:bg-emerald-500/[0.02] cursor-pointer transition-colors"
                          >
                            <td className="py-5 px-4 whitespace-nowrap">
                              <Typography variant="mono" className="text-[11px] text-slate-400 font-black">
                                {formatDateSafe(spiff.date, 'MM/dd/yy')}
                              </Typography>
                            </td>
                            <td className="py-5 px-4" colSpan={2}>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                  <AppIcon name="billing" className="h-4 w-4 text-emerald-400" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Typography variant="label" className="text-white text-sm font-black truncate">
                                      {spiff.label || 'spiff adjustment'}
                                    </Typography>
                                    {!spiff.includedInTotal && (
                                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10 font-black uppercase">
                                        Separate
                                      </Badge>
                                    )}
                                  </div>
                                  <Typography variant="mono" className="text-[10px] text-slate-600 font-bold truncate max-w-[200px]">
                                    {spiff.notes || 'Standalone payout adjustment'}
                                  </Typography>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <Badge variant="outline" className="text-[8px] px-1 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-black uppercase">
                                spiff
                              </Badge>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Typography variant="mono" className="text-xs text-slate-700 font-black">---</Typography>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Typography variant="mono" className="text-xs text-slate-700 font-black">---</Typography>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Typography variant="label" className="text-emerald-400 font-black text-sm">
                                ${spiff.amount.toLocaleString()}
                              </Typography>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    window.dispatchEvent(new CustomEvent('stripeit:edit-spiff', { detail: spiff }));
                                  }}
                                  className="p-2 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <AppIcon name="edit" size={14} />
                                </button>
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if (window.confirm('Delete this adjustment?')) handleDeleteMonthlySpiff?.(spiff.id); 
                                  }}
                                  className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <AppIcon name="delete" size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      }

                      const deal = item as Deal;
                      const m = getCalendarMonth(deal.date);
                      const y = getCalendarYear(deal.date);
                      const monthlyDeals = deals.filter(d => {
                        return getCalendarMonth(d.date) === m && getCalendarYear(d.date) === y;
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
                              <div className="flex items-center gap-2">
                                <Typography variant="label" className="text-emerald-400 font-black text-sm">
                                  ${commission?.finalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '0'}
                                </Typography>
                                {commission?.explanation && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExplanationData({ commission, customerName: deal.customerName });
                                    }}
                                    className="p-1 rounded bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 transition-all active:scale-90"
                                    title="View Calculation Breakdown"
                                  >
                                    <AppIcon name="eye" size={10} />
                                  </button>
                                )}
                              </div>
                              {commission && (
                                <Typography variant="mono" className="text-[8px] text-slate-600 font-black uppercase">
                                  {frontRate}% / {backRate}%
                                </Typography>
                              )}
                            </div>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                                className="p-2 rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <AppIcon name="edit" size={14} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if (window.confirm('Delete this deal record?')) handleDeleteDeal?.(deal.id); 
                                }}
                                className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <AppIcon name="delete" size={14} />
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
              <div className="flex flex-col gap-2">
                {sortedItems.map((item, index) => {
                  const isDeal = 'customerName' in item;
                  
                  if (!isDeal) {
                    const spiff = item as MonthlySpiff;
                    return (
                      <motion.div
                        key={spiff.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('stripeit:edit-spiff', { detail: spiff }));
                        }}
                        className="bg-[#0A1512] border border-emerald-500/10 rounded-xl p-3 shadow-md relative overflow-hidden"
                      >
                         <div className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3 min-w-0">
                             <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                               <AppIcon name="billing" className="h-4 w-4 text-emerald-400" />
                             </div>
                             <div className="min-w-0">
                               <Typography variant="label" className="text-white text-xs font-black uppercase truncate block">
                                 {spiff.label || 'spiff'}
                               </Typography>
                               <Typography variant="mono" className="text-[9px] text-slate-500 font-bold">
                                 {formatDateSafe(spiff.date, 'MM/dd/yy')}
                               </Typography>
                             </div>
                           </div>
                           <div className="text-right shrink-0">
                             <Typography variant="label" className="text-emerald-400 font-black text-sm">
                               ${spiff.amount.toLocaleString()}
                             </Typography>
                           </div>
                         </div>
                      </motion.div>
                    );
                  }

                  const deal = item as Deal;
                  const isExpanded = expandedId === deal.id;
                  const m = getCalendarMonth(deal.date);
                  const y = getCalendarYear(deal.date);
                  const monthlyDealsForCalc = deals.filter(d => {
                    return getCalendarMonth(d.date) === m && getCalendarYear(d.date) === y;
                  });
                  const commission = payPlan ? calculateDealCommission(deal, payPlan, monthlyDealsForCalc) : null;

                  return (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                      className={cn(
                        "transition-all duration-300 border rounded-xl overflow-hidden shadow-lg",
                        isExpanded 
                          ? "bg-[#0F111A] border-white/10 p-4" 
                          : "bg-[#0A0C12] border-white/5 p-3"
                      )}
                      onClick={() => handleDealInteraction(deal)}
                    >
                      {/* Collapsed Row State */}
                      <div className={cn(
                        "flex items-center justify-between gap-3",
                        isExpanded ? "mb-4 pb-4 border-b border-white/5" : ""
                      )}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                            isExpanded ? "bg-white/10 border-white/20" : "bg-white/[0.03] border-white/5"
                          )}>
                             <AppIcon name="user" className={cn("h-5 w-5", isExpanded ? "text-white" : "text-slate-600")} />
                          </div>
                          <div className="min-w-0">
                            <Typography variant="label" className="text-white text-xs font-black uppercase truncate block">
                              {deal.customerName}
                            </Typography>
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <Typography variant="mono" className="text-[9px] text-slate-500 font-bold whitespace-nowrap">
                                #{deal.dealNumber || '---'}
                              </Typography>
                              <span className="h-0.5 w-0.5 rounded-full bg-slate-800 shrink-0" />
                              <Typography variant="mono" className="text-[9px] text-slate-600 font-bold whitespace-nowrap">
                                {formatDateSafe(deal.date, 'MM/dd')}
                              </Typography>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <Typography variant="label" className="text-emerald-400 font-black text-sm block leading-tight">
                              ${commission?.finalPayout.toLocaleString() || '0'}
                            </Typography>
                            <TypeBadge type={deal.newOrUsed as any} />
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-2 gap-4 mb-4">
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
                            
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <div className="flex items-center gap-2">
                                 {commission?.explanation && (
                                   <button
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setExplanationData({ commission, customerName: deal.customerName });
                                     }}
                                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-black uppercase tracking-widest"
                                   >
                                     <Eye size={12} />
                                     Explain
                                   </button>
                                 )}
                               </div>
                               
                               <div className="flex items-center gap-2">
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                                   className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400"
                                 >
                                   <AppIcon name="edit" size={16} />
                                 </button>
                                 <button 
                                   onClick={(e) => { 
                                     e.stopPropagation(); 
                                     if (window.confirm('Delete this deal record?')) handleDeleteDeal?.(deal.id); 
                                   }}
                                   className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500"
                                 >
                                   <AppIcon name="delete" size={16} />
                                 </button>
                               </div>
                            </div>
                            
                            <div className="mt-4 flex justify-center">
                               <Typography variant="mono" className="text-[9px] text-slate-600 animate-pulse">
                                 Tap again for full details
                               </Typography>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon="history"
            title="No results found"
            description="Try adjusting your search or options to find what you're looking for."
            action={
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear All
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

      <PayoutExplanationModal
        isOpen={!!explanationData}
        onClose={() => setExplanationData(null)}
        commission={explanationData?.commission || null}
        customerName={explanationData?.customerName || ''}
      />
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
