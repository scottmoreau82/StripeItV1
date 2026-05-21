import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ChevronRight, 
  Download, 
  Printer, 
  Edit, 
  PieChart
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppData } from '@/src/contexts/AppDataContext';
import { exportService } from '@/src/services/exportService';
import { calculatePeriodEarnings } from '@/src/lib/commissionLogic';
import { PageHeader } from '../ui/PageHeader';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { DealForm } from '../forms/DealForm';
import { Deal, SubscriptionTier } from '@/src/types';
import { cn, formatDateSafe } from '@/src/lib/utils';
import { DashboardLayout } from '../layout/DashboardLayout';

export const ReportView: React.FC = () => {
  const { profile, user, addToast } = useAuth();
  const { deals, monthlySpiffs, payPlan, handleSaveDeal } = useAppData();
  
  // Two views: LIST (month cards) and DETAIL (single month)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  
  // Editing state for deals inside report view
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedMonth) {
      const styleEl = document.createElement('style');
      styleEl.id = 'stripeit-print-styles';
      styleEl.textContent = `
        @media print {
          body > * { visibility: hidden !important; }
          #stripe-report-print-area { 
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            padding: 20px !important;
            z-index: 99999 !important;
          }
          #stripe-report-print-area * {
            visibility: visible !important;
            color: black !important;
            background: transparent !important;
            border-color: #ccc !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `;
      document.head.appendChild(styleEl);
      return () => {
        const el = document.getElementById('stripeit-print-styles');
        if (el) {
          el.remove();
        }
      };
    }
  }, [selectedMonth]);

  if (!profile || !user) return null;

  const currentMonthKey = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  // Helper to format Month keys (e.g., '2026-05' -> 'MAY 2026')
  const getMonthNameString = (monthKey: string) => {
    const [year, monthStr] = monthKey.split('-');
    const monthNames = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    const idx = parseInt(monthStr, 10) - 1;
    return `${monthNames[idx] || ''} ${year}`;
  };

  // Grouping logic: All unique months from deals & spiffs
  const monthsSet = new Set<string>();
  deals.forEach(deal => {
    if (deal.date) {
      try {
        const mKey = new Date(deal.date).toISOString().slice(0, 7);
        monthsSet.add(mKey);
      } catch (e) {}
    }
  });
  monthlySpiffs.forEach(spiff => {
    if (spiff.month) {
      monthsSet.add(spiff.month);
    }
  });
  // Always guarantee current month is listed
  monthsSet.add(currentMonthKey);

  const monthKeys = Array.from(monthsSet).sort().reverse();

  const reportData = selectedMonth ? deals.filter(d => {
    try {
      return d.date && new Date(d.date).toISOString().slice(0, 7) === selectedMonth;
    } catch (e) {
      return false;
    }
  }) : [];

  const filters = {
    startDate: selectedMonth || '',
    endDate: selectedMonth || '',
  };

  // Export and print actions
  const handleExportCSV = (mKey?: string, monthDeals?: Deal[]) => {
    const activeDeals = monthDeals || reportData;
    const activeKey = mKey || filters.startDate;
    if (activeDeals.length === 0) return;
    if (!payPlan) return;
    const exportData = exportService.prepareDealExportData(activeDeals, payPlan);
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'stock', label: 'Stock #' },
      { key: 'condition', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'frontGross', label: 'Front Gross' },
      { key: 'backGross', label: 'Back Gross' },
      { key: 'totalGross', label: 'Total Gross' },
      { key: 'estCommission', label: 'Est. Payout' },
      { key: 'isSplit', label: 'Split Deal' }
    ];
    const csvContent = exportService.generateCSV(exportData, headers);
    exportService.downloadCSV(csvContent, `StripeIt_${activeKey}`);
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) return;
    const exportData = exportService.prepareDealExportData(
      reportData, payPlan
    );
    const headers = [
      { key: 'date', label: 'Date' },
      { key: 'customer', label: 'Customer' },
      { key: 'vehicle', label: 'Vehicle' },
      { key: 'stock', label: 'Stock #' },
      { key: 'condition', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'frontGross', label: 'Front Gross' },
      { key: 'backGross', label: 'Back Gross' },
      { key: 'totalGross', label: 'Total Gross' },
      { key: 'estCommission', label: 'Est. Payout' },
      { key: 'isSplit', label: 'Split Deal' }
    ];
    exportService.downloadPDF(
      exportData,
      headers,
      'Performance Report',
      `${filters.startDate} to ${filters.endDate}`,
      `StripeIt_Report_${filters.startDate}_to_${filters.endDate}`
    );
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  const handleEditDeal = (deal: Deal) => {
    const dealMonth = new Date(deal.date).toISOString().slice(0, 7);
    if (dealMonth !== currentMonthKey) {
      addToast('Editing a closed month — changes will affect your historical report', 'info');
    }
    setEditingDeal(deal);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedDeal = async (dealData: Partial<Deal>) => {
    if (!editingDeal) return;
    setIsSubmitting(true);
    try {
      await handleSaveDeal(dealData, editingDeal.id);
      setIsEditModalOpen(false);
      setEditingDeal(null);
      addToast('Deal synchronized successfully', 'success');
    } catch (error: any) {
      console.error("Save deal error:", error);
      addToast(error?.message || 'Synchronization failure. Please retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rendering inside standard structures
  if (selectedMonth) {
    const selectedMonthDeals = deals.filter(d => {
      try {
        return d.date && new Date(d.date).toISOString().slice(0, 7) === selectedMonth;
      } catch (e) {
        return false;
      }
    });
    const selectedMonthSpiffs = monthlySpiffs.filter(s => s.month === selectedMonth);
    const selectedMonthEarnings = calculatePeriodEarnings(selectedMonthDeals, payPlan, selectedMonthSpiffs);

    const selectedMonthUnits = selectedMonthDeals.reduce((sum, d) => sum + (d.isSplitDeal && payPlan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1), 0);
    const selectedMonthFrontGross = selectedMonthDeals.reduce((sum, d) => sum + (d.frontEndGross * (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1)), 0);
    const selectedMonthBackGross = selectedMonthDeals.reduce((sum, d) => sum + (d.backEndGross * (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1)), 0);
    const selectedMonthEstPayout = selectedMonthEarnings.grandTotal;
    const selectedMonthSpiffsTotal = selectedMonthEarnings.totalMonthlySpiffs;

    const isCurrent = selectedMonth === currentMonthKey;

    const headerComponent = (
      <PageHeader
        title={`${getMonthNameString(selectedMonth)} — ${isCurrent ? 'OPEN' : 'CLOSED'}`}
        subtitle="Month-by-month financial statements and deal logging"
        icon={PieChart}
      >
        <div className="flex flex-wrap items-center gap-2 print:hidden w-full md:w-auto mt-2 md:mt-0 no-print">
          <Button
            variant="outline"
            onClick={() => setSelectedMonth(null)}
            className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-white border-white/10 no-print"
          >
            ← ALL MONTHS
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExportCSV(selectedMonth, selectedMonthDeals)}
            className="text-[10px] uppercase font-black tracking-widest text-cyan-400 hover:text-cyan-300 border-cyan-500/20 bg-cyan-500/5 no-print"
          >
            <Download className="mr-2 h-4 w-4" />
            EXPORT CSV
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            className="text-[10px] uppercase font-black tracking-widest h-11 px-6 bg-brand-primary text-bg-deep rounded-xl shadow-glow glow-primary no-print"
          >
            <Printer className="mr-2 h-4 w-4" />
            PRINT
          </Button>
        </div>
      </PageHeader>
    );

    const statsComponent = (
      <>
        <Card className="p-4 bg-bg-card/45 border border-white/5 shadow-md relative group backdrop-blur-md">
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black mb-1 block">Units Sold</Typography>
          <Typography variant="h3" className="text-white font-black">{selectedMonthUnits} Units</Typography>
        </Card>
        <Card className="p-4 bg-bg-card/45 border border-white/5 shadow-md relative group backdrop-blur-md">
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black mb-1 block">Front Gross</Typography>
          <Typography variant="h3" className="text-cyan-400 font-black">${selectedMonthFrontGross.toLocaleString()}</Typography>
        </Card>
        <Card className="p-6 bg-white/[0.03] border-white/10 flex flex-col gap-3 items-center justify-center">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="w-full text-xs font-black uppercase tracking-widest hover:bg-white/5"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            className="w-full text-xs font-black uppercase tracking-widest text-brand-primary border-brand-primary/20 hover:bg-brand-primary/5"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </Card>
        <Card className="p-4 bg-bg-card/45 border border-white/5 shadow-md relative group backdrop-blur-md">
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black mb-1 block">Back Gross</Typography>
          <Typography variant="h3" className="text-purple-400 font-black">${selectedMonthBackGross.toLocaleString()}</Typography>
        </Card>
        <Card className="p-4 bg-bg-card/45 border border-white/5 shadow-md relative group backdrop-blur-md">
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black mb-1 block">Est. Payout</Typography>
          <Typography variant="h3" className="text-emerald-400 font-black">${selectedMonthEstPayout.toLocaleString()}</Typography>
        </Card>
        <Card className="p-4 bg-bg-card/45 border border-white/5 shadow-md relative group backdrop-blur-md col-span-2 md:col-span-1">
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black mb-1 block">Spiffs & CBs</Typography>
          <Typography variant="h3" className={cn("font-black", selectedMonthSpiffsTotal >= 0 ? "text-cyan-400" : "text-rose-400")}>
            {selectedMonthSpiffsTotal >= 0 ? '+' : ''}${selectedMonthSpiffsTotal.toLocaleString()}
          </Typography>
        </Card>
      </>
    );

    const mainComponent = (
      <div className="space-y-6">
        {/* Deal Table */}
        <div className="space-y-4">
          <Typography variant="mono" className="text-[10px] text-cyan-400 tracking-widest font-black uppercase block">
            Deals Recorded ({selectedMonthDeals.length})
          </Typography>
          <Card className="overflow-hidden bg-bg-card/45 border border-white/5 rounded-2xl shadow-deal p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/5">
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Date</Typography></th>
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Customer</Typography></th>
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Vehicle</Typography></th>
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Type</Typography></th>
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Front</Typography></th>
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Back</Typography></th>
                    <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Est. Payout</Typography></th>
                    <th className="px-6 py-4 text-right print:hidden no-print"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest no-print">Action</Typography></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {selectedMonthDeals.map((deal) => {
                    const dealResult = selectedMonthEarnings.dealResults.find(r => r.dealId === deal.id);
                    const estPayout = dealResult ? dealResult.finalPayout : 0;
                    const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;

                    return (
                      <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 text-xs text-slate-400 font-medium font-mono">{formatDateSafe(deal.date, 'MM/dd/yyyy')}</td>
                        <td className="px-6 py-4 text-sm text-white font-bold">{deal.customerName}</td>
                        <td className="px-6 py-4 text-xs text-slate-300">{deal.purchasedVehicle}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-mono tracking-widest font-black uppercase badge-print-clean",
                            deal.newOrUsed === 'new' ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15" :
                            deal.newOrUsed === 'used' ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                            "bg-purple-500/10 text-purple-400 border border-purple-500/15"
                          )}>
                            {deal.newOrUsed}
                          </span>
                          {deal.isSplitDeal && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-mono border border-orange-500/15 bg-orange-500/10 text-orange-400 font-black badge-print-clean">
                              SPLIT {deal.splitPercentage || 50}%
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 font-mono">
                          ${(deal.frontEndGross * splitRatio).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300 font-mono">
                          ${(deal.backEndGross * splitRatio).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-emerald-400 font-bold font-mono">
                          ${estPayout.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right print:hidden no-print">
                          <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleEditDeal(deal)}
                             className="h-8 w-8 text-slate-400 hover:text-cyan-400 p-1 rounded-lg transition-colors inline-flex items-center justify-center border border-transparent hover:border-white/5 hover:bg-white/5 no-print"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {selectedMonthDeals.length === 0 && (
              <div className="p-12 text-center">
                <Typography variant="small" className="text-slate-600">No deals logged for this month.</Typography>
              </div>
            )}
          </Card>
        </div>

        {/* Spiffs / Chargebacks Section */}
        {selectedMonthSpiffs.length > 0 && (
          <div className="space-y-4">
            <Typography variant="mono" className="text-[10px] text-cyan-400 tracking-widest font-black uppercase block">
              Month Spiffs & Adjustments
            </Typography>
            <Card className="overflow-hidden bg-bg-card/45 border border-white/5 rounded-2xl shadow-deal p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/5 font-mono">
                      <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Date</Typography></th>
                      <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Adjustments & Spiffs</Typography></th>
                      <th className="px-6 py-4 text-right"><Typography variant="mono" className="text-[9px] uppercase text-slate-400 font-black tracking-widest">Amount</Typography></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selectedMonthSpiffs.map((spiff) => (
                      <tr key={spiff.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-400 font-mono">{formatDateSafe(spiff.date, 'MM/dd/yyyy')}</td>
                        <td className="px-6 py-4 text-sm text-white font-semibold">
                          {spiff.label || spiff.notes || (spiff.isChargeback ? 'CHARGEBACK' : 'SPIFF')}
                        </td>
                        <td className={cn(
                          "px-6 py-4 text-sm font-bold text-right font-mono",
                          spiff.isChargeback ? "text-rose-400" : "text-cyan-400"
                        )}>
                          {spiff.isChargeback ? '-' : '+'}${spiff.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Deal Editing Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingDeal(null);
          }}
          title="Synchronize Deal Registry"
        >
          {editingDeal && (
            <DealForm
              initialData={editingDeal}
              onSubmit={handleSaveEditedDeal}
              isLoading={isSubmitting}
            />
          )}
        </Modal>
      </div>
    );

    return (
      <div id="stripe-report-print-area">
        <DashboardLayout
          header={headerComponent}
          stats={statsComponent}
          main={mainComponent}
        />
      </div>
    );
  }

  // LIST VIEW: Month Cards Stack
  const listHeader = (
    <PageHeader
      title="Performance Reports"
      subtitle="Historical month-by-month tracking & reporting"
      icon={PieChart}
    />
  );

  const listMain = (
    <div className="space-y-6">
      <Typography variant="mono" className="text-[10px] text-cyan-400 tracking-widest font-black uppercase block mb-4">
        Statement Log Calendar
      </Typography>
      <div className="grid grid-cols-1 gap-6">
        {monthKeys.map(mKey => {
          const isCurrent = mKey === currentMonthKey;
          const monthDeals = deals.filter(d => {
            try {
              return d.date && new Date(d.date).toISOString().slice(0, 7) === mKey;
            } catch (e) {
              return false;
            }
          });
          const monthSpiffs = monthlySpiffs.filter(s => s.month === mKey);
          const earnings = calculatePeriodEarnings(monthDeals, payPlan, monthSpiffs);
          
          const unitCount = monthDeals.reduce((sum, d) => sum + (d.isSplitDeal && payPlan?.isSplitBehaviorActive !== false ? (d.splitPercentage || 50) / 100 : 1), 0);
          const totalFront = monthDeals.reduce((sum, d) => sum + (d.frontEndGross * (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1)), 0);
          const totalBack = monthDeals.reduce((sum, d) => sum + (d.backEndGross * (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1)), 0);
          const estPayout = earnings.grandTotal;

          return (
            <Card 
              key={mKey} 
              hoverable 
              onClick={() => setSelectedMonth(mKey)}
              className="p-6 bg-bg-card/45 border border-white/5 shadow-md relative group hover:border-cyan-500/20 backdrop-blur-md transition-all duration-300 rounded-2xl cursor-pointer"
            >
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h3" className="italic font-black text-white text-lg tracking-tight uppercase">
                  {getMonthNameString(mKey)}
                </Typography>
                {isCurrent ? (
                  <span className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold shadow-cyan-glow">
                    OPEN
                  </span>
                ) : (
                  <span className="bg-slate-800/80 border border-slate-700/50 text-slate-400 font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold">
                    CLOSED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 font-mono text-xs">
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-1">
                    VOLUME
                  </span>
                  <span className="text-white font-black text-base">{unitCount} UNITS</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-1">
                    TOTAL FRONT
                  </span>
                  <span className="text-slate-300 font-semibold text-base">${totalFront.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-1">
                    TOTAL BACK
                  </span>
                  <span className="text-slate-300 font-semibold text-base">${totalBack.toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-1">
                    EST PAYOUT
                  </span>
                  <span className="text-cyan-400 font-black text-base">${estPayout.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end text-cyan-400 group-hover:text-cyan-300 font-mono text-[10px] tracking-wider font-extrabold uppercase mt-2 transition-colors">
                <span>VIEW REPORT</span>
                <ChevronRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      header={listHeader}
      stats={null}
      main={listMain}
    />
  );
};
