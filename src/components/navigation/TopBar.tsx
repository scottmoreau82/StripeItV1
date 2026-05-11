import React from 'react';
import { Typography } from '../ui/Typography';
import { Bell, Search, User } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';

import { NotificationTray } from '../notifications/NotificationTray';

/**
 * StripeItTopBarSystem
 * Desktop top bar for utility actions and context.
 */
export const TopBar = () => {
  const { profile } = useAuth();

  return (
    <header className="hidden h-16 items-center justify-between border-b border-white/5 bg-bg-main/40 backdrop-blur-sm px-10 lg:flex sticky top-0 z-30">
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Search deals, customers, or VINs..." 
          className="w-full rounded-xl bg-white/5 py-2 pl-10 pr-4 text-sm text-white border border-transparent focus:border-brand-primary/50 focus:bg-white/10 outline-none transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <NotificationTray />
        
        <div className="h-8 w-px bg-white/5" />
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <Typography variant="label" className="block text-white group-hover:text-brand-primary transition-colors">
              {profile?.displayName || 'User'}
            </Typography>
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-wider">
              {profile?.role || 'Sales'}
            </Typography>
          </div>
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
             {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
             ) : (
                <User className="h-5 w-5 text-slate-400" />
             )}
          </div>
        </div>
      </div>
    </header>
  );
};
