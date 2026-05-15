import React, { useState, useEffect, useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { DealerDeal } from '@/src/types';
import { dealerService } from '@/src/services/dealerService';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { LoadingOverlay } from '../ui/LoadingOverlay';
import { DealerInviteManagerModal } from './DealerInviteManagerModal';

/**
 * DealerSalesLogView
 * High-density operational sales log for dealerships.
 * Modernizes the Daily Sales Report into a premium telemetry grid.
 */
export const DealerSalesLogView: React.FC = () => {
  const { profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deals, setDeals] = useState<DealerDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      if (!profile?.orgId) return;
      setIsLoading(true);
      try {
        const data = await dealerService.getDealsByDate(profile.orgId, selectedDate);
        setDeals(data);
      } catch (error) {
        console.error("Fetch Dealer Deals Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();

    const handleRefresh = () => fetchDeals();
    window.addEventListener('stripeit:dealer-deal-saved', handleRefresh);
    return () => window.removeEventListener('stripeit:dealer-deal-saved', handleRefresh);
  }, [profile?.orgId, selectedDate]);

  const totals = useMemo(() => {
    return deals.reduce((acc, deal) => {
      acc.front += deal.frontGross || 0;
      acc.back += deal.backGross || 0;
      acc.total += (deal.frontGross || 0) + (deal.backGross || 0);
      if (deal.newOrUsed === 'N') acc.newCount++;
      else acc.usedCount++;
      return acc;
    }, { front: 0, back: 0, total: 0, newCount: 0, usedCount: 0 });
  }, [deals]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header / Operational Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shadow-glow glow-primary/5">
                <AppIcon name="salesLog" className="text-brand-primary h-5 w-5" />
             </div>
             <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter">
               Daily Sales Report
             </Typography>
          </div>
          <Typography variant="mono" className="text-slate-500 uppercase tracking-[0.3em] text-[10px] font-black pl-1">
            Operational Protocol • {formatDate(selectedDate)}
          </Typography>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <Button 
            variant="ghost" 
            className="h-10 text-slate-500 hover:text-brand-primary uppercase font-black text-[10px] tracking-widest gap-2"
            onClick={() => window.print()}
          >
             <AppIcon name="copy" size={14} />
             Print
          </Button>

          <div className="relative">
            <Input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-bg-card/40 border-border-subtle text-white w-48 h-10 uppercase font-mono text-[11px] tracking-widest pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
               <AppIcon name="calendar" size={16} className="text-brand-primary/60" />
            </div>
          </div>
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
            Day Combined
          </Typography>
          <Typography variant="h2" className="text-brand-primary font-black tracking-tighter italic shadow-glow print:text-black">
            ${totals.total.toLocaleString()}
          </Typography>
        </Card>
      </div>

      {/* Main Operational Table */}
      <Card className="bg-bg-card/20 border-border-subtle overflow-hidden relative print:bg-white print:border-black print:text-black">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent print:hidden" />
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px] print:min-w-full">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-deep/50 print:bg-gray-100 print:text-black">
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Desk</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Customer</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Deal #</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Year</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">N/U</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Model</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Stock #</Typography></th>
                <th className="px-4 py-4 text-right"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Front $</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Trade</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Sales P</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Source</Typography></th>
                <th className="px-4 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">F&I</Typography></th>
                <th className="px-4 py-4 text-right"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest print:text-black">Back $</Typography></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 print:divide-black">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse print:hidden">
                      {Array.from({ length: 13 }).map((_, j) => (
                        <td key={`j-${j}`} className="px-4 py-6">
                          <div className="h-3 w-full bg-white/5 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : deals.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-20 text-center">
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
                      <td className="px-4 py-4"><Typography variant="mono" className="text-[11px] text-white font-bold group-hover:text-brand-primary transition-colors print:text-black">{deal.desk}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-xs text-white font-medium uppercase truncate max-w-[150px] print:text-black">{deal.customerName}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="mono" className="text-[10px] text-slate-400 print:text-black">#{deal.dealNumber}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-xs text-slate-300 print:text-black">{deal.year}</Typography></td>
                      <td className="px-4 py-4">
                        <span className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded font-black",
                          deal.newOrUsed === 'N' ? "bg-brand-primary/10 text-brand-primary print:text-black" : "bg-slate-800 text-slate-400 print:text-black"
                        )}>
                          {deal.newOrUsed}
                        </span>
                      </td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-xs text-slate-300 uppercase truncate max-w-[120px] print:text-black">{deal.model}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="mono" className="text-[10px] text-slate-400 print:text-black">{deal.stockNumber}</Typography></td>
                      <td className="px-4 py-4 text-right">
                        <Typography variant="mono" className="text-[11px] text-white font-bold print:text-black">
                          ${deal.frontGross.toLocaleString()}
                        </Typography>
                      </td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-[10px] text-slate-500 uppercase truncate max-w-[120px] print:text-black">{deal.tradeInfo || '—'}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-xs text-brand-primary/80 font-bold uppercase print:text-black">{deal.salesperson}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-[10px] text-slate-500 uppercase print:text-black">{deal.source || '—'}</Typography></td>
                      <td className="px-4 py-4"><Typography variant="p" className="text-xs text-slate-300 uppercase print:text-black">{deal.fiManager}</Typography></td>
                      <td className="px-4 py-4 text-right">
                         <Typography variant="mono" className="text-[11px] text-brand-primary font-bold print:text-black">
                          ${deal.backGross.toLocaleString()}
                        </Typography>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </Card>

      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.5in;
          }
          
          body {
            background-color: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Hide ALL app chrome */
          nav, aside, header, footer, 
          .dealer-sidebar, .dealer-header, .top-bar,
          .print\\:hidden, 
          [role="navigation"], 
          [role="complementary"],
          button:not(.print-visible) {
            display: none !important;
          }

          /* Reset layout for print */
          main, #root, #root > div, .DashboardLayout_main {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: none !important;
          }

          /* Optimize Cards for Print */
          .Card, div.bg-bg-card\\/20, div.bg-bg-card\\/30 {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            padding: 1rem !important;
            color: black !important;
          }

          /* Table Optimization */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
          }

          th {
            background-color: #f8fafc !important;
            border-bottom: 2px solid #e2e8f0 !important;
            padding: 8px 4px !important;
          }

          td {
            padding: 6px 4px !important;
            border-bottom: 1px solid #f1f5f9 !important;
            font-size: 10px !important;
          }

          /* Force black text for contrast */
          .text-white, .text-slate-500, .text-slate-400, .text-slate-300, .text-brand-primary, .text-brand-primary\\/80 {
            color: black !important;
          }

          .font-black, .font-bold {
            color: black !important;
            font-weight: 700 !important;
          }

          /* Remove complex animations/shadows */
          .shadow-glow, .glow-primary, .animate-pulse {
            box-shadow: none !important;
            animation: none !important;
            background: none !important;
          }

          /* Ensure table fits */
          .overflow-x-auto {
            overflow: visible !important;
          }

          .min-w-\\[1200px\\] {
            min-w: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};
