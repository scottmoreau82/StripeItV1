import React, { useState } from 'react';
import { AppIcon } from '../ui/AppIcon';
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
import { Feature, featureAccessService } from '@/src/services/featureAccessService';
import { TierBadge } from './TierBadge';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';

import { useAppData } from '@/src/contexts/AppDataContext';

/**
 * StripeItNavigationSystem - Mobile Header & Drawer
 */
interface HeaderProps {
  onLogDeal?: () => void;
  onConfigPayPlan?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogDeal, onConfigPayPlan }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    window.dispatchEvent(new CustomEvent('stripeit:drawer-toggle', { detail: { isOpen: newState } }));
  };

  const closeDrawer = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('stripeit:drawer-toggle', { detail: { isOpen: false } }));
  };
  const location = useLocation();
  const { profile, user, tierOverride, setTierOverride, isAdmin } = useAuth();
  const { isCommissionConfigured } = useAppData();

  const isDeveloper = user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // StripeItFeatureAccessSystem - Filter items based on tier
  const visibleNavItems = navigationConfig.getVisibleItems(profile);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border-subtle bg-bg-main/80 backdrop-blur-md px-6 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary">
            <AppIcon name="trending" className="text-white h-5 w-5" />
          </div>
          <Typography variant="h4" className="font-display font-black italic text-white uppercase tracking-tighter">
            StripeIt
          </Typography>
        </Link>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <select
              value={tierOverride || 'real'}
              onChange={(e) => {
                const val = e.target.value;
                setTierOverride(val === 'real' ? null : (val as SubscriptionTier));
              }}
              className={cn(
                "bg-white/[0.03] border border-white/5 text-[9px] uppercase tracking-widest font-black rounded-lg px-2 py-1.5 cursor-pointer outline-hidden focus:ring-1 focus:ring-purple-500/50 appearance-none text-center min-w-[70px] transition-all",
                tierOverride ? "text-purple-400 border-purple-500/30" : "text-emerald-400"
              )}
            >
              <option value="real" className="bg-bg-card">Real</option>
              <option value={SubscriptionTier.FREE} className="bg-bg-card">Free</option>
              <option value={SubscriptionTier.PRO} className="bg-bg-card">Pro</option>
              <option value={SubscriptionTier.ORGANIZATION} className="bg-bg-card">Dealer</option>
            </select>
          )}
          <NotificationTray />
          <button 
            onClick={toggleDrawer}
            className="text-white"
          >
            {isOpen ? <AppIcon name="close" className="h-6 w-6" /> : <AppIcon name="menu" className="h-6 w-6" />}
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
              onClick={closeDrawer}
              className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-bg-deep flex flex-col shadow-2xl border-r border-border-subtle lg:hidden overflow-hidden"
            >
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-6 border-b border-border-subtle bg-bg-deep/50 backdrop-blur-md z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow">
                      <AppIcon name="trending" className="text-white h-6 w-6" />
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
                              closeDrawer();
                              window.dispatchEvent(new CustomEvent('stripeit:open-feedback'));
                            }}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all text-left",
                              "text-slate-500 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            <AppIcon name={item.icon as any} size={20} />
                            {item.label}
                          </button>
                        );
                      }

                      return (
                        <React.Fragment key={item.id}>
                          <Link
                            to={item.path}
                            onClick={closeDrawer}
                            className={cn(
                              "relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold uppercase tracking-wider transition-all text-left",
                              isActive 
                                ? "bg-white/[0.03] text-brand-primary" 
                                : "text-slate-500 hover:bg-white/5 hover:text-white"
                            )}
                          >
                            {isActive && (
                              <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
                            )}
                            <AppIcon name={item.icon as any} size={20} className={cn(isActive && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]")} />
                            {item.label}
                          </Link>

                          {isActive && item.id === 'settings' && (
                            <div className="ml-12 flex flex-col gap-1 border-l border-white/10 pl-4 py-2 mb-2">
                              {navigationConfig.settingsSubmenu
                                .filter(sub => {
                                  if (sub.adminOnly && !isAdmin && !isDeveloper) return false;
                                  if (sub.roles && profile && !sub.roles.includes(profile.role)) return false;
                                  return true;
                                })
                                .map(sub => (
                                  <button
                                    key={sub.id}
                                    onClick={() => {
                                      closeDrawer();
                                      const id = sub.path.replace('#', '');
                                      const el = document.getElementById(id);
                                      if (el) {
                                        el.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }}
                                    className="py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-primary transition-colors text-left"
                                  >
                                    {sub.label}
                                  </button>
                                ))
                              }
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </nav>
                  <div className="h-4 shrink-0" />
                </div>

                {/* Footer Section (Pinned) */}
                <div className="p-6 space-y-4 border-t border-border-subtle bg-bg-deep/80 backdrop-blur-md z-10">
                  {/* Commission Architect Setup Warning */}
                  {!isCommissionConfigured && onConfigPayPlan && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 mb-2 shadow-glow glow-rose/5">
                      <div className="flex items-center gap-3 mb-2">
                        <AppIcon name="trending" className="h-4 w-4 text-rose-500" />
                        <Typography variant="mono" className="text-[9px] text-rose-500 font-black uppercase tracking-widest leading-none">
                          Setup Required
                        </Typography>
                      </div>
                      <Typography variant="small" className="text-slate-400 text-[10px] leading-relaxed mb-3 block font-medium">
                        Configure your pay plan to ensure accurate commission calculations.
                      </Typography>
                      <Button 
                        onClick={() => {
                          closeDrawer();
                          onConfigPayPlan();
                        }}
                        size="sm"
                        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest py-2 rounded-lg h-9 shadow-glow glow-rose/20"
                      >
                        Configure Now
                      </Button>
                    </div>
                  )}

                  {/* User Account Hub (Mobile Drawer) */}
                  <div className="relative bg-bg-card/40 border border-border-subtle rounded-3xl p-5 flex items-center gap-4 overflow-hidden group/user shadow-lg">
                    {/* Background Accent */}
                    <div className="absolute -right-8 -bottom-8 h-24 w-24 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0 shadow-glow glow-primary/5 relative z-10">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 text-sm">
                        {profile?.displayName || 'Operator'}
                      </Typography>
                      <div className="flex items-center gap-2 opacity-80 overflow-hidden">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] shrink-0 animate-pulse" />
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.1em] truncate">
                          {profile?.role || 'Sales'}
                        </Typography>
                      </div>
                    </div>
                    <div className="shrink-0 relative z-10">
                      <TierBadge tier={tierOverride || profile?.subscriptionTier} />
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-black text-slate-500 hover:text-white transition-all text-left uppercase tracking-[0.2em] group"
                  >
                    <AppIcon name="logout" className="h-5 w-5 text-slate-600 group-hover:text-brand-primary transition-colors" />
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
