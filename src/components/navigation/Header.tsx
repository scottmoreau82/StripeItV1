import React, { useState } from 'react';
import { Menu, X, TrendingUp, LogOut, ShieldCheck } from 'lucide-react';
import { NotificationTray } from '../notifications/NotificationTray';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { navigationConfig } from './NavigationItems';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth } from '@/src/lib/firebase';
import { SubscriptionTier } from '@/src/types';
import { featureAccessService } from '@/src/services/featureAccessService';
import { TierBadge } from './Sidebar';

/**
 * StripeItNavigationSystem - Mobile Header & Drawer
 */
interface HeaderProps {
  onLogDeal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogDeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { profile, user, tierOverride, setTierOverride } = useAuth();

  const developerEmail = 'scottmoreau82@gmail.com';
  const isDeveloper = user?.email?.toLowerCase() === developerEmail.toLowerCase();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // StripeItFeatureAccessSystem - Filter items based on tier
  const visibleNavItems = navigationConfig.main.filter(item => {
    // Basic items always visible
    if (!item.featureId) return true;
    
    // Check access
    const isFree = profile?.subscriptionTier === SubscriptionTier.FREE;
    const hasAccess = featureAccessService.hasAccess(profile, item.featureId);

    // Hide if restricted for Free tier as per request
    if (isFree && ['activity', 'analytics', 'goals', 'reports', 'inventory'].includes(item.id)) {
      return false;
    }

    return hasAccess;
  });

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-bg-main/80 backdrop-blur-md px-6 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary">
            <TrendingUp className="text-white h-5 w-5" />
          </div>
          <Typography variant="h4" className="font-display font-black italic text-white uppercase tracking-tighter">
            StripeIt
          </Typography>
        </Link>
        
        <div className="flex items-center gap-4">
          <NotificationTray />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-bg-deep flex flex-col shadow-2xl border-r border-white/5 lg:hidden overflow-hidden"
            >
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-bg-deep/50 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow">
                      <TrendingUp className="text-white h-6 w-6" />
                    </div>
                    <Typography variant="h3" className="font-display font-black italic text-white uppercase tracking-tighter">
                      StripeIt
                    </Typography>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col custom-scrollbar">
                  <nav className="flex flex-col gap-1 mb-8">
                    {visibleNavItems.map((item) => {
                      const isActive = location.pathname === item.path;

                      if (item.id === 'feedback') {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setIsOpen(false);
                              window.dispatchEvent(new CustomEvent('stripeit:open-feedback'));
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all text-left",
                              "text-slate-500 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <item.icon size={20} />
                            {item.label}
                          </button>
                        );
                      }

                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all text-left",
                            isActive 
                              ? "bg-white/[0.03] text-brand-primary" 
                              : "text-slate-500 hover:bg-white/5 hover:text-white"
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-[0_0_10px_#00F2FF]" />
                          )}
                          <item.icon size={20} className={cn(isActive && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]")} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="space-y-3 mb-10">
                    <Button 
                      className="w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs h-14 shadow-glow glow-primary rounded-xl"
                      onClick={() => {
                        setIsOpen(false);
                        onLogDeal?.();
                      }}
                    >
                      Log New Deal
                    </Button>
                  </div>
                  <div className="h-4 shrink-0" />
                </div>

                {/* Footer Section (Pinned) */}
                <div className="p-6 space-y-4 border-t border-white/5 bg-bg-deep/80 backdrop-blur-md z-10">
                   {/* StripeItDeveloperTierOverrideSystem */}
                  {isDeveloper && (
                    <div className="px-4 py-3 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-3 w-3 text-brand-primary" />
                        <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black tracking-[0.2em]">
                          Dev Tier Override
                        </Typography>
                      </div>
                      <select
                        value={tierOverride || profile?.subscriptionTier || ''}
                        onChange={(e) => setTierOverride(e.target.value as SubscriptionTier || null)}
                        className="w-full bg-bg-deep border border-white/10 rounded-lg px-2 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Default ({profile?.subscriptionTier === SubscriptionTier.ORGANIZATION ? 'Dealer' : profile?.subscriptionTier})</option>
                        {Object.values(SubscriptionTier).map((tier) => (
                          <option key={tier} value={tier}>
                            {tier === SubscriptionTier.ORGANIZATION ? 'Dealer' : tier}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* User Profile Info */}
                  <div className="relative bg-bg-card/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3 overflow-hidden">
                    <div className="absolute top-2 right-2 scale-75 origin-top-right">
                      <TierBadge tier={profile?.subscriptionTier} />
                    </div>

                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 pr-8 text-xs">
                        {profile?.displayName || 'User'}
                      </Typography>
                      <div className="flex items-center gap-2 opacity-80">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#22C55E]" />
                        <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black tracking-[0.1em]">
                          {profile?.role || 'Sales'}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-black text-slate-500 hover:text-white transition-all text-left uppercase tracking-[0.2em] group"
                  >
                    <LogOut className="h-5 w-5 text-slate-600 group-hover:text-brand-primary transition-colors" />
                    Exit Vault
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
