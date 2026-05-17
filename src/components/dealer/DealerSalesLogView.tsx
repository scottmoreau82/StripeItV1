import React, { useState, useEffect, useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DealerDeal, LogField, LogFieldType } from '@/src/types';
import { dealerService } from '@/src/services/dealerService';
import { organizationService } from '@/src/services/organizationService';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { DealerInviteManagerModal } from './DealerInviteManagerModal';
import { getFriendlyErrorMessage } from '@/src/lib/firebase';
import { AlertCircle } from 'lucide-react';
import { DEFAULT_LOG_FIELDS } from '@/src/constants';

/**
 * DealerSalesLogView
 * High-density operational sales log for dealerships.
 * Modernizes the Daily Sales Report into a premium telemetry grid.
 * Dynamic rendering based on LogField configuration.
 */
export const DealerSalesLogView: React.FC = () => {
  const { profile } = useAuth();
  const [timeframe, setTimeframe] = useState<'today' | 'mtd' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deals, setDeals] = useState<DealerDeal[]>([]);
  const [fields, setFields] = useState<LogField[]>(DEFAULT_LOG_FIELDS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    const fetchConfigAndData = async () => {
      if (!profile?.orgId) return;
      setIsLoading(true);
      setError(null);
      try {
        // Fetch Schema
        const org = await organizationService.getOrganization(profile.orgId);
        if (org?.logConfig?.fields) {
          setFields(org.logConfig.fields.filter(f => f.visible).sort((a, b) => a.order - b.order));
        } else {
          setFields(DEFAULT_LOG_FIELDS.filter(f => f.visible));
        }

        // Fetch Deals based on timeframe
        let data: DealerDeal[] = [];
        if (timeframe === 'today') {
          data = await dealerService.getDealsByDate(profile.orgId, selectedDate);
        } else if (timeframe === 'mtd') {
          data = await dealerService.getMTDDeals(profile.orgId);
        } else {
          data = await dealerService.getDealsByRange(profile.orgId, startDate, endDate);
        }
        
        setDeals(data);
      } catch (err) {
        console.error("Fetch Dealer Data Error:", err);
        setError(getFriendlyErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigAndData();

    const handleRefresh = () => fetchConfigAndData();
    window.addEventListener('stripeit:dealer-deal-saved', handleRefresh);
    return () => window.removeEventListener('stripeit:dealer-deal-saved', handleRefresh);
  }, [profile?.orgId, selectedDate, timeframe, startDate, endDate]);

  const totals = useMemo(() => {
    return deals.reduce((acc, deal) => {
      acc.front += Number(deal.frontGross || 0);
      acc.back += Number(deal.backGross || 0);
      acc.total += Number(deal.frontGross || 0) + Number(deal.backGross || 0);
      if (deal.newOrUsed === 'N') acc.newCount++;
      else if (deal.newOrUsed === 'U') acc.usedCount++;
      return acc;
    }, { front: 0, back: 0, total: 0, newCount: 0, usedCount: 0 });
  }, [deals]);

  const formatValue = (value: any, type: LogFieldType) => {
    if (value === undefined || value === null || value === '') return '—';
    
    switch (type) {
      case LogFieldType.CURRENCY:
        return `$${Number(value).toLocaleString()}`;
      case LogFieldType.NUMBER:
        return Number(value).toLocaleString();
      case LogFieldType.TOGGLE:
        return value ? 'YES' : 'NO';
      case LogFieldType.DATE:
        return new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return String(value);
    }
  };

  const renderProtocolSubtitle = () => {
    if (timeframe === 'today') {
      const d = new Date(selectedDate + 'T00:00:00');
      const dateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      return `Operational Protocol • ${dateStr}`;
    }
    if (timeframe === 'mtd') {
      const d = new Date();
      const monthStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return `Operational Protocol • Month to Date (${monthStr})`;
    }
    if (timeframe === 'custom') {
      const start = new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const end = new Date(endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Operational Protocol • ${start} to ${end}`;
    }
    return 'Operational Protocol';
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header / Operational Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 print:flex-row print:items-end print:gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shadow-glow glow-primary/5">
                <AppIcon name="salesLog" className="text-brand-primary h-5 w-5" />
             </div>
             <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter whitespace-nowrap">
               Daily Sales Report
             </Typography>
          </div>
          <Typography variant="mono" className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black pl-1">
            {renderProtocolSubtitle()}
          </Typography>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          {/* Timeframe Selector */}
          <div className="flex bg-bg-card/40 p-1 rounded-xl border border-border-subtle mr-2 min-w-fit">
            {[
              { id: 'today', label: 'Today' },
              { id: 'mtd', label: 'MTD' },
              { id: 'custom', label: 'Custom' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTimeframe(t.id as any);
                  if (t.id === 'today') {
                    setSelectedDate(new Date().toISOString().split('T')[0]);
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  timeframe === t.id 
                    ? "bg-brand-primary text-white shadow-glow glow-primary/20" 
                    : "text-slate-500 hover:text-slate-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {timeframe === 'today' ? (
              <motion.div 
                key="today-picker"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(newDate);
                    if (newDate !== today) {
                      setStartDate(newDate);
                      setEndDate(newDate);
                      setTimeframe('custom');
                    }
                  }}
                  className="bg-bg-card/40 border-border-subtle text-white w-48 h-10 uppercase font-mono text-[11px] tracking-widest pl-10"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <AppIcon name="calendar" size={16} className="text-brand-primary/60" />
                </div>
              </motion.div>
            ) : timeframe === 'custom' ? (
              <motion.div 
                key="custom-picker"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <div className="relative">
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-bg-card/40 border-border-subtle text-white w-40 h-10 uppercase font-mono text-[11px] tracking-widest pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[10px] font-black text-brand-primary/40">FR</span>
                  </div>
                </div>
                <div className="text-slate-700 h-px w-2 bg-slate-700" />
                <div className="relative">
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-bg-card/40 border-border-subtle text-white w-40 h-10 uppercase font-mono text-[11px] tracking-widest pl-10"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <span className="text-[10px] font-black text-brand-primary/40">TO</span>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="h-8 w-[1px] bg-white/5 mx-2" />

          <Button 
            variant="ghost" 
            className="h-10 text-slate-500 hover:text-brand-primary uppercase font-black text-[10px] tracking-widest gap-2"
            onClick={() => setIsInviteOpen(true)}
          >
             <AppIcon name="userPlus" size={14} />
             Invite
          </Button>

          <Button 
            variant="ghost" 
            className="h-10 text-slate-500 hover:text-brand-primary uppercase font-black text-[10px] tracking-widest gap-2"
            onClick={() => window.print()}
          >
             <AppIcon name="printer" size={14} />
             Print
          </Button>
          
          <Button 
            variant="outline" 
            className="h-10 border-border-subtle bg-bg-card/20 hover:bg-white/5 transition-all text-[11px] font-black uppercase tracking-widest px-6"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          >
             Desk Observation
          </Button>
        </div>
      </div>

      {/* Summary Cards (Operational Density) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
        <Card className="bg-bg-card/30 border-border-subtle p-5 relative overflow-hidden group print:bg-white print:border-black print:text-black">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/50 shadow-glow glow-primary print:hidden" />
          <Typography variant="mono" className="text-slate-500 uppercase text-[9px] font-black tracking-widest mb-1 print:text-black">
            Front Gross
          </Typography>
          <Typography variant="h2" className="text-white font-black tracking-tighter italic print:text-black">
            ${totals.front.toLocaleString()}
          </Typography>
        </Card>

        <Card className="bg-bg-card/30 border-border-subtle p-5 relative overflow-hidden group print:bg-white print:border-black print:text-black">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-deep/50 shadow-glow glow-brand-deep print:hidden" />
          <Typography variant="mono" className="text-slate-500 uppercase text-[9px] font-black tracking-widest mb-1 print:text-black">
            Back Gross
          </Typography>
          <Typography variant="h2" className="text-white font-black tracking-tighter italic print:text-black">
            ${totals.back.toLocaleString()}
          </Typography>
        </Card>

        <Card className="bg-bg-card/30 border-border-subtle p-5 relative overflow-hidden print:bg-white print:border-black print:text-black">
          <Typography variant="mono" className="text-slate-500 uppercase text-[9px] font-black tracking-widest mb-1 print:text-black">
            Units (N/U)
          </Typography>
          <div className="flex items-baseline gap-2">
            <Typography variant="h2" className="text-white font-black tracking-tighter italic mr-2 print:text-black">
              {deals.length}
            </Typography>
            <Typography variant="mono" className="text-brand-primary text-[11px] font-bold print:text-black">
              {totals.newCount}N / {totals.usedCount}U
            </Typography>
          </div>
        </Card>

        <Card className="bg-bg-card/30 border-border-subtle p-5 relative overflow-hidden print:bg-white print:border-black print:text-black">
          <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity print:hidden" />
          <Typography variant="mono" className="text-slate-500 uppercase text-[9px] font-black tracking-widest mb-1 print:text-black">
            {timeframe === 'today' ? 'Day Combined' : 'Period Combined'}
          </Typography>
          <Typography variant="h2" className="text-brand-primary font-black tracking-tighter italic shadow-glow print:text-black">
            ${totals.total.toLocaleString()}
          </Typography>
        </Card>
      </div>

      {/* Main Operational Table */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-4 mb-4">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
             <Typography variant="mono" className="text-red-100 font-bold uppercase tracking-widest text-[9px] mb-1">
               Data Sync Interruption
             </Typography>
             <Typography variant="p" className="text-red-200/70 text-sm">
               {error}
             </Typography>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-200/50 hover:text-red-200 h-8 text-[10px] font-black uppercase tracking-widest"
            onClick={() => window.location.reload()}
          >
            Retry Protocol
          </Button>
        </div>
      )}

      <Card className="bg-bg-card/20 border-border-subtle overflow-hidden relative print:bg-white print:border-black print:text-black">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent print:hidden" />
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[max-content] print:min-w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-deep/50 print:bg-gray-100 print:text-black">
                {fields.map(field => (
                  <th key={field.id} className={cn("px-4 py-4", (field.type === LogFieldType.NUMBER || field.type === LogFieldType.CURRENCY) ? "text-right" : "text-left")}>
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">
                      {field.label}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 print:divide-black">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse print:hidden">
                      {fields.map((_, j) => (
                        <td key={`j-${j}`} className="px-4 py-6">
                          <div className="h-3 w-full bg-white/5 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan={fields.length} className="px-4 py-20 text-center">
                      <Typography variant="mono" className="text-slate-600 uppercase tracking-widest text-[10px] print:text-black">
                        No deal activity recorded for this period
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  deals.map((deal, idx) => (
                    <motion.tr 
                      key={deal.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-white/[0.02] transition-colors group print:text-black"
                    >
                      {fields.map(field => {
                        const isPrimary = field.id === 'customerName' || field.id === 'dealNumber';
                        const isNumeric = field.type === LogFieldType.NUMBER || field.type === LogFieldType.CURRENCY;
                        return (
                          <td key={field.id} className={cn("px-4 py-4", isNumeric ? "text-right" : "text-left")}>
                            <Typography 
                              variant={isNumeric ? "mono" : "p"} 
                              className={cn(
                                "text-xs transition-colors print:text-black",
                                isPrimary ? "text-white font-bold group-hover:text-brand-primary italic" : "text-slate-400 group-hover:text-slate-200",
                                field.id === 'backGross' ? "text-brand-primary" : ""
                              )}
                            >
                              {formatValue(deal[field.id], field.type)}
                            </Typography>
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Notes / Manager Observations Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:hidden">
        <Card className="bg-bg-card/20 border-border-subtle p-8 space-y-6">
          <div className="flex items-center justify-between">
            <Typography variant="h3" className="italic font-black uppercase tracking-tight text-brand-primary">
              Desk Observations
            </Typography>
            <AppIcon name="trending" size={20} className="text-slate-700" />
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <Typography variant="p" className="text-slate-500 text-xs italic">
                Awaiting manager input for desk performance review...
              </Typography>
            </div>
          </div>
        </Card>

        <Card className="bg-bg-card/20 border-border-subtle p-8 space-y-6 opacity-30 cursor-not-allowed grayscale">
           <div className="flex items-center justify-between">
            <Typography variant="h3" className="italic font-black uppercase tracking-tight text-white">
              Inventory Trends
            </Typography>
            <AppIcon name="lock" size={16} className="text-slate-500" />
          </div>
          <div className="h-24 flex items-center justify-center">
            <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-500">
              Analysis Engine Offline
            </Typography>
          </div>
        </Card>
      </div>

      <DealerInviteManagerModal 
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .aside, .nav, .dealer-sidebar, .dealer-header, .top-bar, .sidebar, .header {
            display: none !important;
          }
          main, #root > div {
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .custom-scrollbar {
            overflow: visible !important;
          }
          .Card {
             border: 1px solid black !important;
          }
        }
      `}</style>
    </div>
  );
};
