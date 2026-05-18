import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  ChevronRight, 
  PieChart, 
  Users, 
  BarChart3,
  Calendar,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppData } from '@/src/contexts/AppDataContext';
import { reportService, ReportFilter } from '@/src/services/reportService';
import { exportService } from '@/src/services/exportService';
import { PageHeader } from '../ui/PageHeader';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { Deal, DealStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { DashboardLayout } from '../layout/DashboardLayout';

/**
 * StripeItReportSystem - ReportView
 * Foundational report generation and data export workspace.
 */

export const ReportView: React.FC = () => {
  const { profile, user } = useAuth();
  const { payPlan } = useAppData();
  
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [reportData, setReportData] = useState<Deal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  if (!profile || !user) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const data = await reportService.getReportDeals(
        profile.orgId, 
        filters, 
        profile.role, 
        user.uid
      );
      setReportData(data);
      setHasGenerated(true);
    } catch (error) {
      console.error("Report generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    
    // Use the primary pay plan for calculations
    const userPayPlan = payPlan; 
    const exportData = exportService.prepareDealExportData(reportData, userPayPlan);
    
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
    exportService.downloadCSV(csvContent, `StripeIt_Report_${filters.startDate}_to_${filters.endDate}`);
  };

  const totalUnits = reportData.reduce((acc, deal) => {
    const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    return acc + splitRatio;
  }, 0);
  
  const totalGross = reportData.reduce((acc, deal) => {
    const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
    return acc + ((deal.frontEndGross + deal.backEndGross) * splitRatio);
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Reports & Export"
        subtitle="Performance summaries • data portability"
        icon={PieChart}
      >
        <Button 
          variant="outline" 
          onClick={() => setHasGenerated(false)} 
          className="text-[10px] uppercase font-black tracking-widest text-slate-500"
        >
          Clear All
        </Button>
        <Button 
          onClick={handleGenerateReport} 
          isLoading={isGenerating}
          className="h-12 px-6 bg-brand-primary text-bg-deep font-black uppercase tracking-widest shadow-glow glow-primary"
        >
          <PieChart className="mr-2 h-5 w-5" />
          Generate Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <Card className="lg:col-span-1 p-6 space-y-6 bg-bg-card/50 border-white/5 h-fit sticky top-24">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-white/5">
            <Filter className="h-4 w-4 text-brand-primary" />
            <Typography variant="label" className="text-white uppercase font-black tracking-tight">Report Filters</Typography>
          </div>

          <div className="space-y-4">
            <Input 
              label="Start Date" 
              type="date" 
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            />
            <Input 
              label="End Date" 
              type="date" 
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            />
            
            <Select 
              label="Deal Status"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'working', label: 'Working' },
                { value: 'pending', label: 'Pending' },
                { value: 'Finalized', label: 'Finalized' },
                { value: 'Cancelled', label: 'Cancelled' }
              ]}
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as DealStatus || undefined }))}
            />

            <Select 
              label="Condition"
              options={[
                { value: '', label: 'New & Used' },
                { value: 'new', label: 'New Only' },
                { value: 'used', label: 'Used Only' }
              ]}
              value={filters.newOrUsed || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, newOrUsed: e.target.value as any || undefined }))}
            />

            {profile.role !== 'sales' && (
              <Select 
                label="Salesperson"
                options={[
                  { value: '', label: 'Entire Team' }
                  // Population logic would go here in actual team view
                ]}
                value={filters.userId || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value || undefined }))}
              />
            )}
          </div>
        </Card>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-6">
          {!hasGenerated ? (
            <div className="flex flex-col items-center justify-center py-32 px-6 text-center rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10">
              <div className="h-16 w-16 rounded-3xl bg-slate-900 flex items-center justify-center mb-6">
                <FileText className="h-8 w-8 text-slate-700" />
              </div>
              <Typography variant="h3" className="text-slate-400 mb-2 font-black uppercase italic tracking-tight">System Ready</Typography>
              <Typography variant="p" className="text-slate-600 max-w-sm">
                Select your parameters and click Generate to analyze your performance and prepare exports.
              </Typography>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Summary Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-brand-primary/[0.03] border-brand-primary/10">
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Total Volume</Typography>
                    <Typography variant="h2" className="text-white">{totalUnits} Units</Typography>
                  </Card>
                  <Card className="p-6 bg-emerald-500/[0.03] border-emerald-500/10">
                    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-2 block">Total Gross</Typography>
                    <Typography variant="h2" className="text-emerald-400">${totalGross.toLocaleString()}</Typography>
                  </Card>
                  <Card className="p-6 bg-white/[0.03] border-white/10 flex items-center justify-center">
                    <Button 
                      variant="outline" 
                      onClick={handleExportCSV}
                      className="w-full h-full text-xs font-black uppercase tracking-widest hover:bg-white/5"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Save Report (PDF/CSV)
                    </Button>
                  </Card>
                </div>

                {/* Data Table Preview */}
                <Card className="overflow-hidden bg-bg-card/40 border-white/5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                          <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-500 font-black">Date</Typography></th>
                          <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-500 font-black">Customer</Typography></th>
                          <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-500 font-black">Vehicle</Typography></th>
                          <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] uppercase text-slate-500 font-black">Total Gross</Typography></th>
                          <th className="px-6 py-4 text-right"><Typography variant="mono" className="text-[9px] uppercase text-slate-500 font-black">Action</Typography></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {reportData.map((deal) => (
                          <tr key={deal.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4 text-xs text-slate-400 font-medium">{deal.date}</td>
                            <td className="px-6 py-4 text-sm text-white font-bold">{deal.customerName}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{deal.purchasedVehicle}</td>
                            <td className="px-6 py-4 text-sm text-emerald-400 font-bold">
                              ${((deal.frontEndGross + deal.backEndGross) * (deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1)).toLocaleString()}
                              {deal.isSplitDeal && <span className="ml-1 text-[10px] text-amber-500/60 font-mono">SPLIT</span>}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <ChevronRight className="h-4 w-4 text-slate-700 inline-block group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {reportData.length === 0 && (
                    <div className="p-12 text-center">
                      <Typography variant="small" className="text-slate-600">No records found for the selected period.</Typography>
                    </div>
                  )}
                </Card>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};
