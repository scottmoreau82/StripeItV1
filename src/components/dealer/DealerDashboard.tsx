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
import { LayoutGrid, ClipboardList, TrendingUp, Snowflake, Info, ShieldAlert } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';

export const DealerDashboard: React.FC = () => {
  const { profile, isDeveloper, updateProfileData } = useAuth();
  const [recentDeals, setRecentDeals] = useState<DealerDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const isFrozen = profile?.isFrozen && !isDeveloper;
  const isAwaitingAcknowledge = isFrozen && !profile?.suspensionAcknowledgedAt;

  useEffect(() => {
    const fetchRecent = async () => {
      if (!profile?.orgId || isFrozen) {
        setIsLoading(false);
        return;
      }
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
  }, [profile?.orgId, isFrozen]);

  const handleAcknowledge = async () => {
    setIsAcknowledging(true);
    try {
      await updateProfileData({
        suspensionAcknowledgedAt: Date.now()
      });
    } catch (error) {
      console.error("Failed to acknowledge suspension:", error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  if (isFrozen) {
    return (
      <DashboardLayout
        header={
          <PageHeader
            title="Access Restricted"
            subtitle="Dealership Operational Suspension"
            icon={Snowflake}
            iconColor="bg-rose-500/20 text-rose-500"
          />
        }
        main={
          <div className="flex flex-col items-center justify-center py-20 px-6 max-w-2xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="relative">
                <div className="h-24 w-24 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-glow glow-rose/20">
                   <Snowflake size={48} className="text-rose-500 animate-pulse" />
                </div>
                <div className="absolute -top-2 -right-2 bg-rose-600 rounded-full p-1.5 border-4 border-bg-deep">
                   <ShieldAlert size={16} className="text-white" />
                </div>
             </div>

             <div className="space-y-4">
                <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter text-3xl">Account Suspended</Typography>
                <Typography variant="p" className="text-slate-400 text-lg leading-relaxed">
                   Your organizational access to <span className="text-white font-bold">{profile?.orgName || 'the dealership'}</span> has been frozen by an administrator.
                </Typography>
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-left space-y-4">
                   <div className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                         <Info size={12} className="text-indigo-400" />
                      </div>
                      <Typography variant="p" className="text-[13px] text-slate-400">
                         All operational logs, reporting, and KPI dashboards are restricted until account reactivation.
                      </Typography>
                   </div>
                   <div className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                         <Info size={12} className="text-emerald-400" />
                      </div>
                      <Typography variant="p" className="text-[13px] text-slate-400">
                         Your personal toolkit and historical data remain preserved and accessible via your personal workspace.
                      </Typography>
                   </div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
                <Button 
                   className="flex-1 h-12 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-glow glow-rose/30 transition-all active:scale-95"
                   onClick={handleAcknowledge}
                   isLoading={isAcknowledging}
                >
                   {isAwaitingAcknowledge ? 'Acknowledge & Sync' : 'Status Acknowledged'}
                </Button>
                <Link to="/settings" className="flex-1">
                   <Button variant="outline" className="w-full h-12 border-white/10 hover:bg-white/5 text-slate-400 font-black uppercase tracking-widest text-xs rounded-xl">
                      Account Settings
                   </Button>
                </Link>
             </div>

             <Typography variant="mono" className="text-[10px] text-slate-600 uppercase tracking-[0.2em] pt-8">
                System Logic Version: 4.2.1-SECURE
             </Typography>
          </div>
        }
      />
    );
  }

  const header = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-glow shadow-brand-primary/5">
          <LayoutGrid size={18} />
        </div>
        <div className="space-y-0.5">
          <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter text-xl md:text-2xl leading-none">
            Dealer Dashboard
          </Typography>
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] block">
            {profile?.orgName || 'StripeIt Dealership'} • Global Telemetry
          </Typography>
        </div>
      </div>

      <Link to="/dealer/sales-log">
        <Button variant="outline" className="h-9 border-white/10 bg-white/5 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest px-5 gap-2">
          <ClipboardList size={12} />
          Full Sales Log
        </Button>
      </Link>
    </div>
  );

  const mainContent = (
    <div className="space-y-6 pb-20">
      {/* Primary KPI Section */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-brand-primary" />
          <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-slate-500">Performance Telemetry</Typography>
        </div>
        <DealerKPIOverview />
      </section>

      {/* Secondary Operational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Recent Deal Actions</Typography>
            <Typography variant="p" className="text-[9px] text-slate-600 italic">Sync: Active</Typography>
          </div>

          <Card className="bg-bg-card/20 border-white/5 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-white/5 bg-white/[0.01]">
                     <th className="px-6 py-3"><Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Deal</Typography></th>
                     <th className="px-6 py-3"><Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Customer</Typography></th>
                     <th className="px-6 py-3 text-right"><Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Total Gross</Typography></th>
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

        <div className="space-y-4 text-left">
           <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest px-2">Operational Alerts</Typography>
          
           <Card className="p-4 bg-brand-primary/5 border border-brand-primary/10 space-y-3">
              <div className="flex items-center gap-2">
                 <div className="h-6 w-6 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <AppIcon name="trending" size={12} />
                </div>
                <Typography variant="label" className="text-white font-black uppercase text-[10px] tracking-wider">Market Pacing</Typography>
             </div>
             <Typography variant="p" className="text-slate-400 text-[10px] leading-relaxed italic">
                Monthly pacing is calculated based on active deal velocity. Current projections indicate a stable operational month for both Retail and Internet channels.
             </Typography>
          </Card>

          <Card className="p-4 bg-white/[0.02] border border-white/5 space-y-3 opacity-50 grayscale">
             <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <AppIcon name="users" size={12} />
                </div>
                <Typography variant="label" className="text-slate-300 font-black uppercase text-[10px] tracking-wider">Team Performance</Typography>
             </div>
             <Typography variant="p" className="text-slate-600 text-[9px] uppercase font-bold tracking-widest text-center py-2">
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
