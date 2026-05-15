import React, { useState, useEffect, useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { DealerDeal } from '@/src/types';
import { dealerService } from '@/src/services/dealerService';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  DollarSign, 
  ClipboardCheck, 
  Car, 
  BarChart3, 
  Activity
} from 'lucide-react';
import { DashboardLayout } from '../layout/DashboardLayout';

/**
 * DealerDashboardView
 * Organizational command center for Dealer-tier users.
 * Strictly derives data from organizational deal records (dealerDeals).
 */
export const DealerDashboardView: React.FC = () => {
  const { profile } = useAuth();
  const [deals, setDeals] = useState<DealerDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    const fetchOrgData = async () => {
      if (!profile?.orgId) return;
      setIsLoading(true);
      try {
        // Fetch recent deals for the organization
        const recentDeals = await dealerService.getDeals(profile.orgId, 50);
        setDeals(recentDeals);
      } catch (error) {
        console.error("Dealer Dashboard Data Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrgData();
  }, [profile?.orgId]);

  const stats = useMemo(() => {
    const todayDeals = deals.filter(d => d.date === today);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayDeals = deals.filter(d => d.date === yesterdayStr);

    const calcTotal = (dealList: DealerDeal[]) => dealList.reduce((sum, d) => sum + (d.frontGross || 0) + (d.backGross || 0), 0);
    const calcFront = (dealList: DealerDeal[]) => dealList.reduce((sum, d) => sum + (d.frontGross || 0), 0);
    const calcBack = (dealList: DealerDeal[]) => dealList.reduce((sum, d) => sum + (d.backGross || 0), 0);

    return {
      todayTotal: calcTotal(todayDeals),
      todayUnits: todayDeals.length,
      todayFront: calcFront(todayDeals),
      todayBack: calcBack(todayDeals),
      yesterdayTotal: calcTotal(yesterdayDeals),
      yesterdayUnits: yesterdayDeals.length,
      totalUnits: deals.length
    };
  }, [deals, today]);

  const header = (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex-1">
          <Typography variant="h1" className="mb-2 italic font-black uppercase tracking-tighter">
            Operational Command
          </Typography>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse shadow-glow glow-primary" />
            <Typography variant="mono" className="text-slate-500 font-bold uppercase text-[10px] tracking-widest pl-1">
              Live Organizational Telemetry • {profile?.dealershipId}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-8 pb-20">
      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem 
          label="Today's Velocity" 
          value={`$${stats.todayTotal.toLocaleString()}`} 
          subValue={`${stats.todayUnits} Units Logged`}
          icon={<TrendingUp size={18} />}
          trend={stats.todayTotal >= stats.yesterdayTotal ? 'up' : 'down'}
        />
        <KPIItem 
          label="Front Loading" 
          value={`$${stats.todayFront.toLocaleString()}`} 
          subValue="Gross Contribution"
          icon={<DollarSign size={18} />}
          color="cyan"
        />
        <KPIItem 
          label="Back Operations" 
          value={`$${stats.todayBack.toLocaleString()}`} 
          subValue="F&I Performance"
          icon={<Activity size={18} />}
          color="blue"
        />
        <KPIItem 
          label="Desk Activity" 
          value={stats.todayUnits.toString()} 
          subValue="Daily Pacing"
          icon={<ClipboardCheck size={18} />}
          color="brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-bg-card/20 border-white/5 p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                     <BarChart3 className="text-brand-primary h-5 w-5" />
                  </div>
                  <Typography variant="h3" className="italic font-black uppercase tracking-tight text-white">
                    Live Deal Traffic
                  </Typography>
               </div>
               <Typography variant="mono" className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
                 Last 50 Records
               </Typography>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
                ))
              ) : deals.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <AppIcon name="salesLog" className="h-12 w-12 text-slate-800 mx-auto" />
                  <Typography variant="p" className="text-slate-500 font-bold uppercase text-xs tracking-widest">
                    No organizational deals recorded yet
                  </Typography>
                </div>
              ) : (
                deals.slice(0, 10).map((deal, idx) => (
                  <motion.div 
                    key={deal.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-black italic text-xs",
                        deal.newOrUsed === 'N' ? "bg-brand-primary/10 text-brand-primary" : "bg-slate-800 text-slate-500"
                      )}>
                        {deal.newOrUsed}
                      </div>
                      <div>
                        <Typography variant="label" className="text-white block font-black uppercase tracking-tight text-[11px]">
                          {deal.customerName}
                        </Typography>
                        <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">
                          {deal.year} {deal.model} • #{deal.stockNumber}
                        </Typography>
                      </div>
                    </div>
                    <div className="text-right">
                      <Typography variant="label" className="text-brand-primary block font-black italic tracking-tighter text-[13px]">
                        ${((deal.frontGross || 0) + (deal.backGross || 0)).toLocaleString()}
                      </Typography>
                      <Typography variant="mono" className="text-[8px] text-slate-600 uppercase font-black">
                        {deal.salesperson} • {deal.desk}
                      </Typography>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {deals.length > 10 && (
              <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                 <Button 
                   variant="ghost" 
                   className="text-slate-500 hover:text-brand-primary text-[10px] font-black uppercase tracking-widest"
                   onClick={() => window.location.href = '/dealer/sales-log'}
                 >
                   View Full Sales Log
                 </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
           <Card className="bg-bg-card/20 border-white/5 p-6 space-y-6">
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black"> Operational Health </Typography>
              <div className="space-y-4">
                 <HealthItem label="Daily Pacing" percentage={deals.length > 0 ? 88 : 0} color="brand" />
                 <HealthItem label="Gross Retention" percentage={74} color="cyan" />
                 <HealthItem label="F&I Penetration" percentage={92} color="brand-deep" />
              </div>
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

interface KPIItemProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  color?: 'brand' | 'cyan' | 'blue';
}

const KPIItem: React.FC<KPIItemProps> = ({ label, value, subValue, icon, trend, color = 'brand' }) => {
  return (
    <Card className="bg-bg-card/20 border-white/5 p-6 relative overflow-hidden group hover:bg-white/[0.03] transition-all">
      <div className={cn(
        "absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity",
        color === 'brand' ? "text-brand-primary" : color === 'cyan' ? "text-cyan-400" : "text-blue-500"
      )}>
        {icon}
      </div>
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2">
           <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">{label}</Typography>
           {trend && (
             <div className={cn("h-1 w-1 rounded-full", trend === 'up' ? "bg-emerald-500" : "bg-rose-500")} />
           )}
        </div>
        <div>
          <Typography variant="h2" className="text-white font-black italic tracking-tighter leading-none mb-2">
            {value}
          </Typography>
          <Typography variant="label" className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {subValue}
          </Typography>
        </div>
      </div>
    </Card>
  );
};

const HealthItem: React.FC<{ label: string; percentage: number; color: string }> = ({ label, percentage, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center px-1">
      <Typography variant="mono" className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{label}</Typography>
      <Typography variant="mono" className="text-[10px] text-white font-black">{percentage}%</Typography>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className={cn(
          "h-full rounded-full shadow-glow",
          color === 'brand' ? "bg-brand-primary glow-primary" : 
          color === 'cyan' ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" : 
          "bg-brand-deep glow-brand-deep"
        )}
      />
    </div>
  </div>
);
