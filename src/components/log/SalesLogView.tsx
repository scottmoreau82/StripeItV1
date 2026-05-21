import React, { useState, useMemo, useEffect } from 'react';
import { Deal, DealStatus, PayPlan, UserProfile, SubscriptionTier, MonthlySpiff } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { DealSearch } from './DealSearch';
import { DealDetailView } from './DealDetailView';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { motion, AnimatePresence } from 'motion/react';
import { AppIcon } from '../ui/AppIcon';
import { PageHeader } from '../ui/PageHeader';
import { Eye, Lock, Zap, Check } from 'lucide-react';
import { cn, formatDateSafe, getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { calculateDealCommission } from '@/src/lib/commissionLogic';
import { Badge } from '../ui/Badge';

import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useMonthlyDealCount } from '@/src/hooks/useMonthlyDealCount';
import { DashboardLayout } from '../layout/DashboardLayout';

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

const randomFrom = (arr: string[]) =>
  arr[Math.floor(Math.random() * arr.length)];

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
    handleDeleteMonthlySpiff,
    handleSaveDeal
  } = useAppData();
  
  const { user, profile, addToast, isDeveloper } = useAuth();
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedSpiff, setSelectedSpiff] = useState<MonthlySpiff | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const [devTierOverride, setDevTierOverride] = useState<SubscriptionTier | null>(null);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteSpiffId, setPendingDeleteSpiffId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = () => {
      setPendingDeleteId(null);
      setPendingDeleteSpiffId(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const [simulateDateStr, setSimulateDateStr] = useState<string>('');

  const [debugDate, setDebugDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (profile?.email === 'scottmoreau82@gmail.com' && simulateDateStr) {
      setDebugDate(new Date(simulateDateStr + '-01T00:00:00'));
    } else {
      setDebugDate(undefined);
    }
  }, [simulateDateStr, profile?.email]);

  const { count: monthlyDealCount, loading: countLoading } = useMonthlyDealCount(user?.uid || '', debugDate);

  const effectiveTier = devTierOverride ?? profile?.subscriptionTier;
  const isFreeUser = effectiveTier === SubscriptionTier.FREE;

  const isBasicPlus = [
    SubscriptionTier.PRO,
    SubscriptionTier.ORGANIZATION,
    SubscriptionTier.TRIAL
  ].includes(effectiveTier as any);

  const FREE_DEAL_LIMIT = 8;
  const currentCount = countLoading ? 0 : monthlyDealCount;
  const isAtLimit = isFreeUser && currentCount >= 9;

  useEffect(() => {
    if (isFreeUser && currentCount === FREE_DEAL_LIMIT - 1) {
      addToast?.('1 free deal remaining this month. Upgrade to Pro for unlimited access.', 'warning' as any);
    }
  }, [currentCount, isFreeUser, addToast]);

  // Explanation Modal State
  const [explanationData, setExplanationData] = useState<{ commission: CommissionResult, customerName: string } | null>(null);

  // Sync selected deal if deals list updates (e.g. status change)
  const currentSelectedDeal = useMemo(() => {
    if (!selectedDeal) return null;
    return deals.find(d => d.id === selectedDeal.id) || selectedDeal;
  }, [deals, selectedDeal]);

  const handleQuickDeal = async () => {
    const quickDeal = {
      customerName: randomFrom([
        'John Smith', 'Jane Doe', 
        'Mike Johnson', 'Sarah Williams',
        'Tom Brown', 'Lisa Davis',
        'Chris Wilson', 'Amy Martinez',
        'David Anderson', 'Emma Taylor'
      ]),
      date: new Date().toISOString().split('T')[0],
      purchasedVehicle: randomFrom([
        '2024 Kia Telluride',
        '2024 Kia Sportage',
        '2025 Kia EV6',
        '2024 Kia K5',
        '2024 Kia Carnival'
      ]),
      stockNumber: 'TEST-' + Math.floor(Math.random() * 90000 + 10000),
      dealNumber: 'QD-' + Math.floor(Math.random() * 9000 + 1000),
      newOrUsed: randomFrom(['new', 'used', 'cpo']),
      frontEndGross: Math.floor(Math.random() * 3000 + 500),
      backEndGross: Math.floor(Math.random() * 2000 + 200),
      status: 'draft',
      notes: 'Quick test deal',
      lenderName: 'Kia Motors Finance',
      tradeAllowance: 0,
      tradeACV: 0,
      tradedVehicle: '',
      tradePayoff: 0,
      splitDeal: false,
      reserveAmount: 0,
    };

    try {
      await handleSaveDeal(quickDeal as any);
      addToast?.('Quick deal added!', 'success');
    } catch (err) {
      console.error(err);
    }
  };

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
      
      return searchMatch;
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

  }, [deals, monthlySpiffs, search, sortConfig, isBasicPlus, payPlan]);

  const sortedDeals = useMemo(() => {
    return sortedItems.filter(item => 'customerName' in item) as Deal[];
  }, [sortedItems]);

  const dealIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    let dealCounter = 0;
    sortedItems.forEach((item) => {
      const isDeal = 'customerName' in item;
      if (isDeal) {
        map.set(item.id, dealCounter);
        dealCounter++;
      }
    });
    return map;
  }, [sortedItems]);

  const clearFilters = () => {
    setSearch('');
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
    <PageHeader
      title="Sales Log"
      subtitle={`${currentMonthDeals.length} deals / ${currentMonthSpiffs.length} spiffs this month`}
      icon={() => <AppIcon name="salesLog" className="h-6 w-6 text-bg-deep" />}
    >
      {profile?.email === 'scottmoreau82@gmail.com' && (
        <>
          <button
            onClick={handleQuickDeal}
            className="h-9 px-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 hover:bg-amber-500/20 shadow-glow glow-amber-500/5"
            title="Quick Deal"
            type="button"
          >
            <Zap size={12} className="text-amber-400" />
            QUICK DEAL
          </button>
          <button
            onClick={() => {
              if (devTierOverride === null) {
                setDevTierOverride(SubscriptionTier.FREE);
              } else if (devTierOverride === SubscriptionTier.FREE) {
                setDevTierOverride(SubscriptionTier.TRIAL);
              } else {
                setDevTierOverride(null);
              }
            }}
            className={cn(
              "h-9 px-3 rounded-xl border bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-violet-500/20",
              devTierOverride !== null 
                ? "border-violet-500 shadow-glow glow-violet-500/10" 
                : "border-violet-500/20"
            )}
            title="Toggle Dev Tier Override"
            type="button"
          >
            TIER: {(devTierOverride ?? profile?.subscriptionTier ?? 'FREE').toUpperCase()}
          </button>

          {/* DEV ONLY — remove before Dealer tier launch */}
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            <span className="whitespace-nowrap">SIMULATE MONTH:</span>
            <input
              type="month"
              value={simulateDateStr}
              onChange={(e) => setSimulateDateStr(e.target.value)}
              className="bg-transparent border-none text-blue-400 focus:outline-none focus:ring-0 text-[10px] uppercase cursor-pointer p-0 select-none"
            />
          </div>
          <button
            onClick={() => setSimulateDateStr('')}
            disabled={!simulateDateStr}
            className={cn(
              "h-9 px-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
              simulateDateStr 
                ? "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 shadow-glow glow-red-500/5 cursor-pointer"
                : "border-slate-500/10 bg-slate-500/5 text-slate-500/40 cursor-not-allowed opacity-50"
            )}
            title="Clear simulate month"
            type="button"
          >
            CLEAR
          </button>
        </>
      )}
      <button 
        onClick={onConfigPayPlan}
        className="h-11 px-6 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-95 shadow-glow glow-primary/5 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest"
        title="Est. Payout Engine"
        aria-label="Est. Payout Engine"
      >
        <AppIcon name="calculator" size={16} />
        Payout Engine
      </button>
    </PageHeader>
  );

  const mainContent = (
    <div className="space-y-8 pb-32">
      {/* Search Group */}
      <div className="flex flex-col gap-3 md:gap-6">
        <div className="w-full">
          <DealSearch 
            value={search} 
            onChange={setSearch} 
            placeholder={isMobile ? "Search customer, stock, or condition..." : undefined}
          />
        </div>
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

      {isAtLimit && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <div className="flex items-center gap-3">
            <Lock size={16} className="text-amber-400 shrink-0" />
            <div>
              <Typography variant="mono" className="text-amber-400 text-[11px] font-black uppercase tracking-widest">
                FREE TIER LIMIT REACHED
              </Typography>
              <Typography variant="mono" className="text-slate-500 text-[10px] mt-0.5">
                Upgrade to Pro for unlimited deal logging and full visibility
              </Typography>
            </div>
          </div>
          <button
            onClick={() => {}}
            className="h-9 px-4 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black uppercase text-[10px] tracking-widest rounded-xl shrink-0 hover:bg-amber-500/30 transition-all"
          >
            UPGRADE
          </button>
        </div>
      )}

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
                            className={cn(
                              "group cursor-pointer transition-colors",
                              spiff.isChargeback ? "hover:bg-rose-500/[0.02] bg-rose-500/[0.01]" : "hover:bg-emerald-500/[0.02]"
                            )}
                          >
                            <td className="py-5 px-4 whitespace-nowrap">
                              <Typography variant="mono" className="text-[11px] text-slate-400 font-black">
                                {formatDateSafe(spiff.date, 'MM/dd/yy')}
                              </Typography>
                            </td>
                            <td className="py-5 px-4" colSpan={2}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                  spiff.isChargeback 
                                    ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" 
                                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                )}>
                                  <AppIcon name="billing" className={cn("h-4 w-4", spiff.isChargeback ? "text-rose-400" : "text-emerald-400")} />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Typography variant="label" className="text-white text-sm font-black truncate">
                                      {spiff.label || (spiff.isChargeback ? 'chargeback adjustment' : 'spiff adjustment')}
                                    </Typography>
                                    {!spiff.includedInTotal && (
                                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10 font-black uppercase">
                                        Separate
                                      </Badge>
                                    )}
                                  </div>
                                  <Typography variant="mono" className="text-[10px] text-slate-600 font-bold truncate max-w-[200px]">
                                    {spiff.notes || (spiff.isChargeback ? 'Standalone chargeback' : 'Standalone payout adjustment')}
                                  </Typography>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 px-4">
                              <Badge variant="outline" className={cn(
                                "text-[8px] px-1 py-0 font-black uppercase",
                                spiff.isChargeback 
                                  ? "border-rose-500/30 text-rose-400 bg-rose-500/10" 
                                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              )}>
                                {spiff.isChargeback ? 'chargeback' : 'spiff'}
                              </Badge>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Typography variant="mono" className="text-xs text-slate-700 font-black">---</Typography>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Typography variant="mono" className="text-xs text-slate-700 font-black">---</Typography>
                            </td>
                            <td className="py-5 px-4 text-right">
                              <Typography variant="label" className={cn("font-black text-sm", spiff.isChargeback ? "text-rose-400" : "text-emerald-400")}>
                                {spiff.isChargeback ? '-' : ''}${spiff.amount.toLocaleString()}
                              </Typography>
                            </td>
                            <td className="py-5 px-4">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    window.dispatchEvent(new CustomEvent('stripeit:edit-spiff', { detail: spiff }));
                                  }}
                                  className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/10 transition-all active:scale-95 shadow-sm"
                                  title="Edit Adjustment"
                                >
                                  <AppIcon name="edit" size={14} />
                                </button>
                                {pendingDeleteSpiffId === spiff.id ? (
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      handleDeleteMonthlySpiff?.(spiff.id);
                                      setPendingDeleteSpiffId(null);
                                    }}
                                    className="p-1 px-2 text-[10px] uppercase font-black tracking-widest rounded-lg border border-rose-500/50 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                                    title="Confirm Delete"
                                  >
                                    <Check size={10} className="text-rose-400 shrink-0" />
                                    <span>Confirm?</span>
                                  </button>
                                ) : (
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setPendingDeleteSpiffId(spiff.id);
                                    }}
                                    className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-slate-500 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10 transition-all active:scale-95 shadow-sm"
                                    title="Delete Adjustment"
                                  >
                                    <AppIcon name="delete" size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      }

                       const deal = item as Deal;
                       const dealIndex = dealIndexMap.get(deal.id) ?? 0;
                       const isBlurred = profile?.subscriptionTier === SubscriptionTier.FREE && !countLoading && dealIndex >= FREE_DEAL_LIMIT;
                       const shouldBlur = isBlurred;

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
                          onClick={() => {
                            if (!isBlurred) {
                              setSelectedDeal(deal);
                            }
                          }}
                          className={cn(
                            "group hover:bg-white/[0.02] cursor-pointer transition-colors relative",
                            isBlurred ? 'relative overflow-hidden pointer-events-none select-none' : ''
                          )}
                        >
                          <td className="py-5 px-4 whitespace-nowrap">
                            <Typography variant="mono" className="text-[11px] text-slate-400 font-black">
                              {formatDateSafe(deal.date, 'MM/dd/yy')}
                            </Typography>
                          </td>
                          <td className="py-5 px-4">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <div className="flex flex-col min-w-0">
                                <Typography variant="label" className="text-[var(--color-text-primary)] text-sm font-black truncate">
                                  {deal.customerName}
                                </Typography>
                                <Typography variant="mono" className="text-[10px] text-slate-600 font-bold">
                                  #{deal.dealNumber || '---'}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <div className="flex flex-col min-w-0">
                                <Typography variant="small" className="text-slate-300 truncate text-xs font-bold">
                                  {deal.purchasedVehicle}
                                </Typography>
                                <Typography variant="mono" className="text-[10px] text-slate-600 font-bold">
                                  {deal.stockNumber || '---'}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          <td className="py-5 px-4">
                            <TypeBadge type={deal.newOrUsed as any} />
                          </td>
                          <td className="py-5 px-4 text-right">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <Typography variant="mono" className="text-xs text-white group-hover:text-cyan-400 transition-colors font-black">
                                ${deal.frontEndGross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </Typography>
                            </div>
                          </td>
                          <td className="py-5 px-4 text-right">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <Typography variant="mono" className="text-xs text-white group-hover:text-purple-400 transition-colors font-black">
                                ${deal.backEndGross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </Typography>
                            </div>
                          </td>
                          <td className="py-5 px-4 text-right relative">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
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
                                      className="p-1 px-1.5 rounded border border-emerald-400/20 bg-emerald-400/5 text-emerald-400 hover:bg-emerald-400/20 hover:border-emerald-400/40 transition-all active:scale-90 shadow-sm shadow-emerald-500/5"
                                      title="View Calculation Breakdown"
                                    >
                                      <div className="flex items-center gap-1">
                                        <AppIcon name="eye" size={10} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">View</span>
                                      </div>
                                    </button>
                                  )}
                                </div>
                                {commission && (
                                  <Typography variant="mono" className="text-[8px] text-slate-600 font-black uppercase">
                                    {frontRate}% / {backRate}%
                                  </Typography>
                                )}
                              </div>
                            </div>


                          </td>
                          <td className="py-5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                                className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/10 transition-all active:scale-95 shadow-sm"
                                title="Edit Deal"
                              >
                                <AppIcon name="edit" size={14} />
                              </button>
                              {pendingDeleteId === deal.id ? (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    handleDeleteDeal?.(deal.id);
                                    setPendingDeleteId(null);
                                  }}
                                  className="p-1 px-2 text-[10px] uppercase font-black tracking-widest rounded-lg border border-rose-500/50 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all active:scale-95 shadow-sm flex items-center gap-1"
                                  title="Confirm Delete"
                                >
                                  <Check size={10} className="text-rose-400 shrink-0" />
                                  <span>Confirm?</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setPendingDeleteId(deal.id);
                                  }}
                                  className="p-2 rounded-lg border border-white/5 bg-white/[0.02] text-slate-500 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10 transition-all active:scale-95 shadow-sm"
                                  title="Delete Deal"
                                >
                                  <AppIcon name="delete" size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          {isBlurred && (
                            <td className="absolute inset-0 backdrop-blur-sm bg-bg-deep/60 flex items-center justify-center" colSpan={8}>
                              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                                Pro Required — Upgrade to View
                              </Typography>
                            </td>
                          )}
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
                        className={cn(
                          "rounded-xl p-3 shadow-md relative overflow-hidden border",
                          spiff.isChargeback 
                            ? "bg-[var(--color-bg-card)] border-rose-500/10 hover:bg-[var(--color-bg-elevated)]" 
                            : "bg-[var(--color-bg-card)] border-emerald-500/10 hover:bg-[var(--color-bg-elevated)]"
                        )}
                      >
                         <div className="flex items-center justify-between gap-3">
                           <div className="flex items-center gap-3 min-w-0">
                             <div className={cn(
                               "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                               spiff.isChargeback 
                                 ? "bg-rose-500/10 border border-rose-500/20 text-rose-400" 
                                 : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                             )}>
                               <AppIcon name="billing" className={cn("h-4 w-4", spiff.isChargeback ? "text-rose-400" : "text-emerald-400")} />
                             </div>
                             <div className="min-w-0">
                               <Typography variant="label" className="text-[var(--color-text-primary)] text-xs font-black uppercase truncate block">
                                 {spiff.label || (spiff.isChargeback ? 'CHARGEBACK' : 'spiff')}
                               </Typography>
                               <Typography variant="mono" className="text-[9px] text-slate-500 font-bold">
                                 {formatDateSafe(spiff.date, 'MM/dd/yy')}
                               </Typography>
                             </div>
                           </div>
                           <div className="text-right shrink-0">
                             <Typography variant="label" className={cn("font-black text-sm", spiff.isChargeback ? "text-rose-400" : "text-emerald-400")}>
                               {spiff.isChargeback ? '-' : ''}${spiff.amount.toLocaleString()}
                             </Typography>
                           </div>
                         </div>
                      </motion.div>
                    );
                  }

                  const deal = item as Deal;
                  const dealIndex = dealIndexMap.get(deal.id) ?? 0;
                  const isBlurred = profile?.subscriptionTier === SubscriptionTier.FREE && !countLoading && dealIndex >= FREE_DEAL_LIMIT;
                  const shouldBlur = isBlurred;

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
                        "transition-all duration-300 border rounded-xl overflow-hidden shadow-lg relative",
                        isExpanded 
                          ? "bg-[var(--color-bg-elevated)] border-[var(--color-border)] p-4" 
                          : "bg-[var(--color-bg-card)] border-[var(--color-border)] p-3",
                        isBlurred && "pointer-events-none select-none relative blur-sm"
                      )}
                      onClick={() => {
                        if (isBlurred) return;
                        handleDealInteraction(deal);
                      }}
                    >
                      <div className={cn("w-full h-full", shouldBlur && "[filter:blur(4px)] select-none")}>
                      {/* Collapsed Row State */}
                      <div className={cn(
                        "flex items-center justify-between gap-3",
                        isExpanded ? "mb-4 pb-4 border-b border-[var(--color-border)]" : ""
                      )}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                            isExpanded ? "bg-[var(--color-bg-elevated)] border-[var(--color-border)]" : "bg-[var(--color-bg-elevated)] border-[var(--color-border)]"
                          )}>
                             <AppIcon name="user" className={cn("h-5 w-5", isExpanded ? "text-[var(--color-text-primary)]" : "text-slate-600")} />
                          </div>
                          <div className="min-w-0">
                            <Typography variant="label" className="text-[var(--color-text-primary)] text-xs font-black uppercase truncate block">
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

                    </div>

                      {isBlurred && (
                        <div className="absolute inset-0 bg-bg-deep/70 flex items-center justify-center rounded-xl z-20 pointer-events-none">
                          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black text-center">
                            Pro Required — Upgrade to View
                          </Typography>
                        </div>
                      )}

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
                                 <Typography variant="label" className="text-[var(--color-text-primary)] font-black text-sm">
                                   ${deal.frontEndGross.toLocaleString()}
                                 </Typography>
                               </div>
                               <div>
                                 <Typography variant="mono" className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1 block">Back Gross</Typography>
                                 <Typography variant="label" className="text-[var(--color-text-primary)] font-black text-sm">
                                   ${deal.backEndGross.toLocaleString()}
                                 </Typography>
                               </div>
                            </div>
                            
                            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
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
                                   className="p-2.5 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-border)] transition-all active:scale-95"
                                 >
                                   <AppIcon name="edit" size={16} />
                                 </button>
                                 {pendingDeleteId === deal.id ? (
                                   <button 
                                     onClick={(e) => { 
                                       e.stopPropagation(); 
                                       handleDeleteDeal?.(deal.id);
                                       setPendingDeleteId(null);
                                     }}
                                     className="p-2.5 px-3.5 text-xs font-black uppercase tracking-widest rounded-xl bg-rose-500/20 border border-rose-500 text-rose-400 hover:text-rose-300 hover:bg-rose-500/30 transition-all active:scale-95 flex items-center gap-1.5"
                                     title="Confirm Delete"
                                   >
                                     <Check size={12} className="text-rose-400 shrink-0" />
                                     <span>Confirm</span>
                                   </button>
                                 ) : (
                                   <button 
                                     onClick={(e) => { 
                                       e.stopPropagation(); 
                                       setPendingDeleteId(deal.id);
                                     }}
                                     className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95"
                                     title="Delete Deal"
                                   >
                                     <AppIcon name="delete" size={16} />
                                   </button>
                                 )}
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
            variant="warning"
            description="Try adjusting your search or options to find what you're looking for."
            action={
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Clear All
              </Button>
            }
          />
        )}
      </div>

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
