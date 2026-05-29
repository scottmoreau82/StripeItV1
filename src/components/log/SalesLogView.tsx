import React, { useState, useMemo, useEffect } from 'react';
import { Deal, DealStatus, PayPlan, UserProfile, SubscriptionTier, MonthlySpiff } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { DealRowSkeleton, DealCardSkeleton } from '../ui/Skeleton';
import { DealSearch } from './DealSearch';
import { Modal } from '../ui/Modal';
import { motion, AnimatePresence } from 'motion/react';
import { AppIcon } from '../ui/AppIcon';
import { PageHeader } from '../ui/PageHeader';
import { Eye, Lock, Zap, Check, ChevronUp, ChevronDown } from 'lucide-react';
import { cn, formatDateSafe, getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { calculateDealCommission } from '@/src/lib/commissionLogic';
import { Badge } from '../ui/Badge';

import { useAppData } from '@/src/contexts/AppDataContext';
import { stripeService } from '@/src/services/stripeService';
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
  onUpgrade?: () => void;
}

const randomFrom = (arr: string[]) =>
  arr[Math.floor(Math.random() * arr.length)];

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

export const SalesLogView: React.FC<SalesLogViewProps> = ({
  onEdit,
  onConfigPayPlan,
  onUpgrade,
}) => {
  const { 
    deals, 
    lockedDealsCount,
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

  const lockedCount = useMemo(() => deals.filter(d => {
    const dDate = new Date(d.date);
    return (d as any).lockedByTier === true &&
      dDate.getMonth() + 1 === currentMonth &&
      dDate.getFullYear() === currentYear;
  }).length, [deals, currentMonth, currentYear]);

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSpiff, setSelectedSpiff] = useState<MonthlySpiff | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

  const [devTierOverride, setDevTierOverride] = useState<SubscriptionTier | null>(null);
  const [showSpiffs, setShowSpiffs] = useState(false);

  const [pendingDeleteDealId, setPendingDeleteDealId] = useState<string | null>(null);
  const [pendingDeleteSpiffId, setPendingDeleteSpiffId] = useState<string | null>(null);
  const [pendingDeleteMobileDealId, setPendingDeleteMobileDealId] = useState<string | null>(null);

  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('stripeit:open-upgrade'));
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      setPendingDeleteDealId(null);
      setPendingDeleteSpiffId(null);
      setPendingDeleteMobileDealId(null);
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
  const [explanationData, setExplanationData] = useState<{ commission: CommissionResult, customerName: string, deal: Deal } | null>(null);



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
      if (isDeal && (item as any).lockedByTier === true) return false;
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

  const sortedDeals = useMemo(() =>
    sortedItems.filter(item =>
      'customerName' in item) as Deal[],
    [sortedItems]);

  const sortedSpiffs = useMemo(() =>
    sortedItems.filter(item =>
      !('customerName' in item)) as MonthlySpiff[],
    [sortedItems]);

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
      const m = getCalendarMonth(deal.date);
      const y = getCalendarYear(deal.date);
      const monthlyDealsForCalc = deals.filter(d => getCalendarMonth(d.date) === m && getCalendarYear(d.date) === y);
      const commission = payPlan ? calculateDealCommission(deal, payPlan, monthlyDealsForCalc) : null;
      if (commission) {
        setExplanationData({ commission, customerName: deal.customerName, deal });
      }
    } else {
      setExpandedId(deal.id);
    }
  };

  const header = (
    <PageHeader
      title="Sales Log"
      subtitle={`${currentMonthDeals.length} deals / ${currentMonthSpiffs.length} spiffs this month`}
      icon={() => <AppIcon name="salesLog" className="h-6 w-6 text-bg-deep" />}
    >
      {(isDeveloper || profile?.canCreateRandomDeals) && (
        <button
          onClick={() => window.dispatchEvent(
            new CustomEvent('stripeit:create-random-deal')
          )}
          className="h-11 px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all active:scale-95 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest"
          title="Generate Random Deal"
        >
          <Zap size={14} />
          Quick Deal
        </button>
      )}
      {!isMobile && (
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-commission-architect'))}
          className="h-11 px-6 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-95 shadow-glow glow-primary/5 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest"
          title="Est. Payout Engine"
          aria-label="Est. Payout Engine"
        >
          <AppIcon name="calculator" size={16} />
          Payout Engine
        </button>
      )}
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

      {lockedDealsCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <AppIcon name="lock" size={16} className="text-amber-400" />
            </div>
            <div>
              <Typography variant="mono" className="text-amber-400 text-[10px] font-black uppercase tracking-widest block">
                {lockedDealsCount} Locked {lockedDealsCount === 1 ? 'Deal' : 'Deals'}
              </Typography>
              <Typography variant="mono" className="text-slate-500 text-[9px]">
                Your data is safe — upgrade to Pro to unlock and include in metrics
              </Typography>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all active:scale-95 shrink-0 disabled:opacity-50"
          >
            {isUpgrading ? 'Redirecting...' : 'Upgrade'}
          </button>
        </div>
      )}



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
            onClick={() => window.dispatchEvent(
              new CustomEvent('stripeit:open-upgrade')
            )}
            className="h-9 px-4 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black uppercase text-[10px] tracking-widest rounded-xl shrink-0 hover:bg-amber-500/30 transition-all"
          >
            UPGRADE
          </button>
        </div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            {/* Desktop skeleton */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse">
                <tbody>
                  {[1,2,3,4,5,6].map(i => <DealRowSkeleton key={i} />)}
                </tbody>
              </table>
            </div>
            {/* Mobile skeleton */}
            <div className="flex flex-col gap-2 md:hidden">
              {[1,2,3,4,5].map(i => <DealCardSkeleton key={i} />)}
            </div>
          </>
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
                      <th className="py-4 px-4 text-left w-[100px]">
                        <Typography variant="mono"
                          className="text-[10px] text-slate-500 uppercase
                          tracking-widest font-black">
                          Split
                        </Typography>
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
                    {sortedDeals.map((deal, index) => {
                       const dealIndex = dealIndexMap.get(deal.id) ?? 0;
                       const isBlurred = false;
                       const shouldBlur = false;

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
                          initial={{ opacity: 0, y: 8, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
                          onClick={() => {
                            if (commission) {
                              setExplanationData({ commission, customerName: deal.customerName, deal });
                            }
                          }}
                          className={cn(
                            "group hover:bg-white/[0.02] cursor-pointer transition-colors relative",
                            isBlurred ? 'relative overflow-hidden pointer-events-none select-none' : ''
                          )}
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Typography variant="mono" className="text-[11px] text-slate-400 font-black">
                              {formatDateSafe(deal.date, 'MM/dd/yy')}
                            </Typography>
                          </td>
                          <td className="py-3 px-4">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <div className="flex flex-col min-w-0">
                                <Typography variant="label" className="text-text-primary text-sm font-black truncate">
                                  {getLastName(deal.customerName)}
                                </Typography>
                                <Typography variant="mono" className="text-[10px] text-slate-600 font-bold">
                                  #{deal.dealNumber || '---'}
                                </Typography>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
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
                          <td className="py-3 px-4">
                            <TypeBadge type={deal.newOrUsed as any} />
                          </td>
                          <td className="py-3 px-4">
                            {deal.isSplitDeal && deal.splitPartnerName ? (
                              <Typography variant="mono"
                                className="text-xs text-amber-400 font-black
                                uppercase tracking-wider">
                                {getLastName(deal.splitPartnerName)}
                              </Typography>
                            ) : (
                              <Typography variant="mono"
                                className="text-xs text-slate-700">
                                —
                              </Typography>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <Typography variant="mono" className="text-xs text-text-primary group-hover:text-cyan-400 transition-colors font-black">
                                ${deal.frontEndGross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </Typography>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <Typography variant="mono" className="text-xs text-text-primary group-hover:text-purple-400 transition-colors font-black">
                                ${deal.backEndGross.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </Typography>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right relative">
                            <div className={cn(shouldBlur && "[filter:blur(4px)] select-none")}>
                              <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2">
                                  <Typography variant="label" className="text-emerald-400 font-black text-sm">
                                    ${commission?.finalPayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) || '0'}
                                  </Typography>
                                </div>
                                {commission && (
                                  <Typography variant="mono" className="text-[8px] text-slate-600 font-black uppercase">
                                    {frontRate}% / {backRate}%
                                  </Typography>
                                )}
                              </div>
                            </div>


                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); onEdit?.(deal); }}
                                className="p-2 rounded-lg border border-border-subtle bg-bg-card text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/10 transition-all active:scale-95 shadow-sm"
                                title="Edit Deal"
                              >
                                <AppIcon name="edit" size={14} />
                              </button>
                              {pendingDeleteDealId === deal.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteDeal?.(deal.id); setPendingDeleteDealId(null); }}
                                    className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/30 transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setPendingDeleteDealId(null); }}
                                    className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setPendingDeleteDealId(deal.id); }}
                                  className="p-2 rounded-lg border border-border-subtle bg-bg-card text-slate-500 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10 transition-all active:scale-95 shadow-sm"
                                  title="Delete Deal"
                                >
                                  <AppIcon name="delete" size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
                {lockedCount > 0 && (
                  <div className="mt-4 flex items-center gap-4 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <AppIcon name="lock" size={20} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="mono" className="text-[11px] text-amber-400 font-black uppercase tracking-widest block">
                        {lockedCount} Locked Deal{lockedCount !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                        Your data is safe — upgrade to Pro to unlock and include in metrics
                      </Typography>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="px-4 py-2 rounded-xl border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all active:scale-95 shrink-0 disabled:opacity-50"
                    >
                      {isUpgrading ? 'Redirecting...' : 'Upgrade'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Cards Layout */}
            {isMobile && (
              <div className="flex flex-col gap-2">
                {sortedDeals.map((deal, index) => {
                  const dealIndex = dealIndexMap.get(deal.id) ?? 0;
                  const isBlurred = false;
                  const shouldBlur = false;

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
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
                      layout
                      className={cn(
                        "transition-all duration-300 border rounded-xl overflow-hidden shadow-lg relative",
                        isExpanded 
                          ? "bg-bg-elevated border-border-subtle p-4" 
                          : "bg-bg-card border-border-subtle p-3",
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
                              {getLastName(deal.customerName)}
                            </Typography>
                            {deal.isSplitDeal && (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 inline-block mt-0.5">
                                Split {deal.splitPercentage || 50}%
                              </span>
                            )}
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
                                 <Typography variant="label" className="text-text-primary font-black text-sm">
                                   ${deal.frontEndGross.toLocaleString()}
                                 </Typography>
                               </div>
                               <div>
                                 <Typography variant="mono" className="text-[8px] text-slate-600 uppercase tracking-widest font-black mb-1 block">Back Gross</Typography>
                                 <Typography variant="label" className="text-text-primary font-black text-sm">
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
                                       setExplanationData({ commission, customerName: deal.customerName, deal });
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
                                 {pendingDeleteMobileDealId === deal.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDeal?.(deal.id); setPendingDeleteMobileDealId(null); }}
                                        className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[9px] font-black uppercase tracking-widest"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setPendingDeleteMobileDealId(null); }}
                                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setPendingDeleteMobileDealId(deal.id); }}
                                      className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all active:scale-95"
                                    >
                                      <AppIcon name="delete" size={16} />
                                    </button>
                                  )}
                               </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
                {lockedCount > 0 && (
                  <div className="mt-4 flex items-center gap-4 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <AppIcon name="lock" size={20} className="text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="mono" className="text-[11px] text-amber-400 font-black uppercase tracking-widest block">
                        {lockedCount} Locked Deal{lockedCount !== 1 ? 's' : ''}
                      </Typography>
                      <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">
                        Your data is safe — upgrade to Pro to unlock and include in metrics
                      </Typography>
                    </div>
                    <button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="px-4 py-2 rounded-xl border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all active:scale-95 shrink-0 disabled:opacity-50"
                    >
                      {isUpgrading ? 'Redirecting...' : 'Upgrade'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {sortedSpiffs.length > 0 && (
              <div className="space-y-3 mt-6">
                <button
                  onClick={() => setShowSpiffs(p => !p)}
                  className="flex items-center justify-between w-full px-2 py-3 border-t border-white/5 group border-none outline-none focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <AppIcon name="billing" size={12} className="text-emerald-400" />
                    </div>
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest group-hover:text-slate-300 transition-colors">
                      Spiffs & Adjustments ({sortedSpiffs.length})
                    </Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <Typography variant="mono" className="text-[10px] text-emerald-400 font-black">
                      +${sortedSpiffs.reduce((sum, s) => sum + (s.amount || 0), 0).toLocaleString()}
                    </Typography>
                    {showSpiffs
                      ? <ChevronUp size={14} className="text-slate-600" />
                      : <ChevronDown size={14} className="text-slate-600" />
                    }
                  </div>
                </button>

                {showSpiffs && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {sortedSpiffs.map((spiff, index) => (
                      <motion.div
                        key={spiff.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => window.dispatchEvent(
                          new CustomEvent('stripeit:edit-spiff', { detail: spiff })
                        )}
                        className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-card border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/[0.06] transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <AppIcon name="billing" size={12} className="text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <Typography variant="label" className="text-text-primary text-xs font-black truncate block">
                              {spiff.label || 'SPIFF'}
                            </Typography>
                            <Typography variant="mono" className="text-[9px] text-slate-500">
                              {formatDateSafe(spiff.date, 'MM/dd/yy')}
                              {spiff.notes && ` • ${spiff.notes}`}
                            </Typography>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Typography variant="label" className="text-emerald-400 font-black text-sm">
                            +${spiff.amount.toLocaleString()}
                          </Typography>
                          {pendingDeleteSpiffId === spiff.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMonthlySpiff?.(spiff.id); setPendingDeleteSpiffId(null); }}
                                className="px-2 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/30 transition-all"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setPendingDeleteSpiffId(null); }}
                                className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPendingDeleteSpiffId(spiff.id); }}
                              className="p-2 rounded-lg border border-border-subtle bg-bg-card text-slate-500 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10 transition-all active:scale-95 shadow-sm opacity-100 md:opacity-0 group-hover:opacity-100"
                              title="Delete Adjustment"
                            >
                              <AppIcon name="delete" size={14} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
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

      {isMobile && (
        <div className="pt-2 pb-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-commission-architect'))}
            className="w-full h-12 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px] uppercase font-black tracking-widest"
            title="Est. Payout Engine"
          >
            <AppIcon name="calculator" size={16} />
            Payout Engine
          </button>
        </div>
      )}

      <PayoutExplanationModal
        isOpen={!!explanationData}
        onClose={() => setExplanationData(null)}
        commission={explanationData?.commission || null}
        customerName={explanationData?.customerName || ''}
        deal={explanationData?.deal}
        onEdit={(deal) => { setExplanationData(null); onEdit?.(deal); }}
        onDelete={async (deal) => { await handleDeleteDeal?.(deal.id); setExplanationData(null); }}
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
