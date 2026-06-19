import React from 'react';
import { NotificationTray } from '../notifications/NotificationTray';
import { useAuth } from '@/src/contexts/AuthContext';
import { SubscriptionTier } from '@/src/types';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { Shield } from 'lucide-react';

/**
 * StripeItTopBarSystem
 * Desktop top bar for utility actions and context.
 */
export const TopBar = () => {
  const { isAdmin, tierOverride, setTierOverride } = useAuth();

  return (
    <header className="hidden h-14 items-center justify-end border-b border-white/5 bg-bg-main/20 backdrop-blur-md px-6 lg:flex sticky top-0 z-30 transition-all duration-300 overflow-visible">
      <div className="flex items-center gap-6">
        {isAdmin && (
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 pl-3 pr-1 py-1 rounded-xl group hover:border-purple-500/30 transition-colors">
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-purple-400 opacity-60" />
              <Typography variant="mono" className="text-[9px] uppercase tracking-widest font-black text-slate-500 group-hover:text-purple-400 transition-colors">
                Preview
              </Typography>
            </div>
            <select
              value={tierOverride || 'real'}
              onChange={(e) => {
                const val = e.target.value;
                setTierOverride(val === 'real' ? null : (val as SubscriptionTier));
              }}
              className={cn(
                "bg-transparent text-[10px] uppercase tracking-widest font-black text-white px-2 py-1 cursor-pointer outline-hidden focus:ring-0 appearance-none text-center min-w-[90px]",
                tierOverride ? "text-purple-400" : "text-emerald-400"
              )}
            >
              <option value="real" className="bg-bg-card">Real Account</option>
              <option value={SubscriptionTier.FREE} className="bg-bg-card">Free</option>
              <option value={SubscriptionTier.PRO} className="bg-bg-card">Pro</option>
              <option value={SubscriptionTier.ORGANIZATION} className="bg-bg-card">Dealer</option>
            </select>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          <NotificationTray />
        </div>
      </div>
    </header>
  );
};
