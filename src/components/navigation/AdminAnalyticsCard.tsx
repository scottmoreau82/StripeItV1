import React, { useState, useEffect } from 'react';
import { analyticsService } from '@/src/services/analyticsService';
import { DailyAnalyticsAggregate } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '@/src/lib/utils';
import { 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  MousePointer2, 
  FileText, 
  UserPlus,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

/**
 * StripeItAnalyticsSystem - Admin Sidebar Component
 * Provides a live, compact view of app performance for administrators.
 */

interface AdminAnalyticsCardProps {
  isCollapsed?: boolean;
}

export const AdminAnalyticsCard: React.FC<AdminAnalyticsCardProps> = ({ isCollapsed }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [metrics, setMetrics] = useState<DailyAnalyticsAggregate | null>(null);

  useEffect(() => {
    const unsubscribe = analyticsService.subscribeToLiveMetrics((data) => {
      setMetrics(data);
    });
    return () => unsubscribe();
  }, []);

  if (isCollapsed) return null;

  return (
    <div className="mx-4 mb-6">
      <div className={cn(
        "bg-bg-card/40 border border-border-subtle rounded-3xl overflow-hidden transition-all duration-300",
        isExpanded ? "ring-1 ring-brand-primary/20 shadow-glow glow-primary" : "hover:border-white/10"
      )}>
        {/* Header / Summary */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between group transition-colors"
        >
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-glow glow-primary">
                <BarChart3 className="h-4 w-4 text-brand-primary" />
             </div>
             <div className="text-left">
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10B981]" />
                   <Typography variant="mono" className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Live Feed</Typography>
                </div>
                <Typography variant="label" className="text-white text-xs font-black">
                  {metrics?.visits || 0} <span className="text-slate-500 font-medium">VISITS</span>
                </Typography>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <Typography variant="mono" className="text-[10px] text-brand-primary font-black">
                  {metrics?.signups || 0} <span className="text-[8px] text-slate-500">SIGNUPS</span>
                </Typography>
             </div>
             {isExpanded ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 overflow-hidden"
            >
              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                 <StatItem 
                    icon={FileText} 
                    label="PAGES" 
                    value={metrics?.pageViews || 0} 
                    color="cyan" 
                 />
                 <StatItem 
                    icon={MousePointer2} 
                    label="CLICKS" 
                    value={metrics?.clicks || 0} 
                    color="purple" 
                 />
                 <StatItem 
                    icon={Users} 
                    label="SESSIONS" 
                    value={metrics?.activeSessions || 0} 
                    color="emerald" 
                 />
                 <StatItem 
                    icon={UserPlus} 
                    label="REGISTRATIONS" 
                    value={metrics?.signups || 0} 
                    color="brand" 
                 />
              </div>

              <Link to="/admin/analytics" className="mt-4 block">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-[10px] uppercase tracking-widest font-black py-2 rounded-xl group/btn"
                >
                  <Zap size={10} className="mr-2 text-brand-primary group-hover/btn:animate-pulse" />
                  Full Dashboard
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface StatItemProps {
  icon: any;
  label: string;
  value: number;
  color: 'cyan' | 'purple' | 'emerald' | 'brand';
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, color }) => {
  const colors = {
    cyan: "text-cyan-400 bg-cyan-400/5 border-cyan-400/10",
    purple: "text-purple-400 bg-purple-400/5 border-purple-400/10",
    emerald: "text-emerald-400 bg-emerald-400/5 border-emerald-400/10",
    brand: "text-brand-primary bg-brand-primary/5 border-brand-primary/10",
  };

  return (
    <div className={cn("p-2 rounded-xl border flex flex-col items-center justify-center text-center", colors[color])}>
      <Icon size={12} className="mb-1 opacity-60" />
      <span className="text-[8px] font-black uppercase tracking-tighter opacity-70 mb-0.5">{label}</span>
      <span className="text-sm font-black text-white leading-none">{value.toLocaleString()}</span>
    </div>
  );
};
