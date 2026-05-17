import React, { useState, useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { DashboardLayout } from '../layout/DashboardLayout';
import { DealerKPIOverview } from './DealerKPIOverview';
import { Card } from '../ui/Card';
import { dealerService } from '@/src/services/dealerService';
import { useAuth } from '@/src/contexts/AuthContext';
import { DealerDeal } from '@/src/types';
import { AppIcon } from '../ui/AppIcon';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, ClipboardList, TrendingUp } from 'lucide-react';

export const DealerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [recentDeals, setRecentDeals] = useState<DealerDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      if (!profile?.orgId) return;
      try {
        const data = await dealerService.getDeals(profile.orgId, 5);
        setRecentDeals(data);
      } catch (error) {
        console.error("Dashboard Recent Deals Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, [profile?.orgId]);

  const header = (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-glow glow-indigo/5">
              <LayoutGrid className="text-indigo-400 h-5 w-5" />
           </div>
           <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter">
             Executive Dashboard
           </Typography>
        </div>
        <Typography variant="p" className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-1 opacity-60">
           {profile?.orgName || 'StripeIt Dealership'} • Total Operational Oversight
        </Typography>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/dealer/sales-log">
          <Button variant="outline" className="h-10 border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-widest px-6 gap-2">
            <ClipboardList size={14} />
            Full Sales Log
          </Button>
        </Link>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-10 pb-20">
      {/* Primary KPI Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-brand-primary" />
          <Typography variant="mono" className="text-[10px] font-black uppercase tracking-widest text-slate-500">Performance Telemetry</Typography>
        </div>
        <DealerKPIOverview />
      </section>

      {/* Secondary Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Recent Deal Actions</Typography>
            <Typography variant="p" className="text-[10px] text-slate-600 italic">Global Sync Status: Active</Typography>
          </div>

          <Card className="bg-bg-card/20 border-white/5 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-white/5 bg-white/[0.01]">
                     <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Deal</Typography></th>
                     <th className="px-6 py-4"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Customer</Typography></th>
                     <th className="px-6 py-4 text-right"><Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Total Gross</Typography></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {isLoading ? (
                     [1,2,3].map(i => (
                       <tr key={i} className="animate-pulse">
                         <td colSpan={3} className="px-6 py-6"><div className="h-4 bg-white/5 rounded w-full" /></td>
                       </tr>
                     ))
                   ) : recentDeals.length === 0 ? (
                     <tr>
                       <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic text-xs uppercase tracking-widest">No deals logged</td>
                     </tr>
                   ) : (
                     recentDeals.map((deal, idx) => (
                       <motion.tr 
                         key={deal.id}
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         className="hover:bg-white/[0.01] transition-colors group"
                       >
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <Typography variant="label" className="text-white font-black text-xs uppercase italic tracking-wider">#{deal.dealNumber}</Typography>
                              <Typography variant="p" className="text-[10px] text-slate-500 mt-1 uppercase">{deal.year} {deal.model}</Typography>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <Typography variant="p" className="text-slate-300 font-bold text-xs uppercase">{deal.customerName}</Typography>
                         </td>
                         <td className="px-6 py-5 text-right">
                            <Typography variant="mono" className="text-brand-primary font-black text-sm italic">
                              ${((deal.frontGross || 0) + (deal.backGross || 0)).toLocaleString()}
                            </Typography>
                         </td>
                       </motion.tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-2">Operational Alerts</Typography>
          
          <Card className="p-6 bg-brand-primary/5 border border-brand-primary/10 space-y-4">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <AppIcon name="trending" size={16} />
                </div>
                <Typography variant="label" className="text-white font-black uppercase text-xs tracking-wider">Market Pacing</Typography>
             </div>
             <Typography variant="p" className="text-slate-400 text-[11px] leading-relaxed italic">
                Monthly pacing is calculated based on active deal velocity. Current projections indicate a stable operational month for both Retail and Internet channels.
             </Typography>
          </Card>

          <Card className="p-6 bg-white/[0.02] border border-white/5 space-y-4 opacity-50 grayscale">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <AppIcon name="users" size={16} />
                </div>
                <Typography variant="label" className="text-slate-300 font-black uppercase text-xs tracking-wider">Team Performance</Typography>
             </div>
             <Typography variant="p" className="text-slate-600 text-[10px] uppercase font-bold tracking-widest text-center py-4">
                Analysis Modules Offline
             </Typography>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};
