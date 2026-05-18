import React, { useState } from 'react';
import { AppIcon } from '../ui/AppIcon';
import { Typography } from '../ui/Typography';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth } from '@/src/lib/firebase';
import { TierBadge } from './TierBadge';

/**
 * DealerHeader
 * Mobile header & drawer for the Dealer tier.
 */
interface DealerHeaderProps {
  onLogDeal?: () => void;
}

export const DealerHeader: React.FC<DealerHeaderProps> = ({ onLogDeal }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { profile } = useAuth();

  const toggleDrawer = () => setIsOpen(!isOpen);
  const closeDrawer = () => setIsOpen(false);

  const handleLogDealClick = () => {
    if (onLogDeal) onLogDeal();
    closeDrawer();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isDashboardActive = location.pathname === '/';
  const isSalesReportActive = location.pathname === '/dealer/sales-log';
  const isUserManagementActive = location.pathname === '/dealer/users';
  const isSettingsActive = location.pathname === '/dealer/settings';

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
        
        <button 
          onClick={toggleDrawer}
          className="text-white"
        >
          {isOpen ? <AppIcon name="close" className="h-6 w-6" /> : <AppIcon name="menu" className="h-6 w-6" />}
        </button>
      </header>

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
                <div className="p-6 border-b border-border-subtle bg-bg-deep/50 z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow">
                      <AppIcon name="trending" className="text-white h-6 w-6" />
                    </div>
                    <Typography variant="h3" className="font-display font-black italic text-white uppercase tracking-tighter">
                      StripeIt
                    </Typography>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col">
                  <nav className="flex flex-col mb-8">
                    {/* Top Level */}
                    <Link
                      to="/"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        isDashboardActive 
                          ? "bg-brand-primary/[0.03] text-brand-primary shadow-glow glow-primary/5" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isDashboardActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="dashboard" size={18} className={cn(isDashboardActive && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Dashboard
                    </Link>

                    {/* OPERATIONS */}
                    <div className="mt-8 mb-2 px-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Operations</span>
                    </div>

                    <Link
                      to="/dealer/sales-log"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        isSalesReportActive 
                          ? "bg-brand-primary/[0.03] text-brand-primary" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isSalesReportActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="salesLog" size={18} className={cn(isSalesReportActive && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Sales Report
                    </Link>

                    <Link
                      to="/activity"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        location.pathname === '/activity' 
                          ? "bg-brand-primary/[0.03] text-brand-primary" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {location.pathname === '/activity' && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="activity" size={18} className={cn(location.pathname === '/activity' && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Activity Feed
                    </Link>

                    {/* MANAGEMENT */}
                    <div className="mt-8 mb-2 px-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Management</span>
                    </div>

                    <Link
                      to="/dealer/users"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        location.pathname === '/dealer/users' && !location.search
                          ? "bg-brand-primary/[0.03] text-brand-primary" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {location.pathname === '/dealer/users' && !location.search && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="users" size={18} className={cn(location.pathname === '/dealer/users' && !location.search && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Managers
                    </Link>

                    <Link
                      to="/dealer/users?tab=permissions"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        location.search === '?tab=permissions' 
                          ? "bg-brand-primary/[0.03] text-brand-primary" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {location.search === '?tab=permissions' && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="lock" size={18} className={cn(location.search === '?tab=permissions' && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Permissions
                    </Link>

                    <Link
                      to="/dealer/users?tab=invites"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        location.search === '?tab=invites' 
                          ? "bg-brand-primary/[0.03] text-brand-primary" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {location.search === '?tab=invites' && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="mail" size={18} className={cn(location.search === '?tab=invites' && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Invites
                    </Link>

                    {/* CONFIGURATION */}
                    <div className="mt-8 mb-2 px-4">
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Configuration</span>
                    </div>

                    <Link
                      to="/dealer/settings"
                      onClick={closeDrawer}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all text-left",
                        isSettingsActive 
                          ? "bg-brand-primary/[0.03] text-brand-primary" 
                          : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {isSettingsActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-brand-primary rounded-r shadow-glow glow-primary" />
                      )}
                      <AppIcon name="settings" size={18} className={cn(isSettingsActive && "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]")} />
                      Settings
                    </Link>
                  </nav>
                </div>

                <div className="p-6 space-y-4 border-t border-border-subtle bg-bg-deep/80 backdrop-blur-md z-10">
                  <div className="relative bg-bg-card/40 border border-border-subtle rounded-3xl p-5 flex items-center gap-4 overflow-hidden shadow-lg">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase shrink-0 shadow-glow glow-primary/5 relative z-10">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                      )}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 text-sm">
                        {profile?.displayName || 'Dealer Operator'}
                      </Typography>
                      <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.1em] truncate">
                        Organization Auth
                      </Typography>
                    </div>
                    <div className="shrink-0 relative z-10">
                      <TierBadge tier={profile?.subscriptionTier} />
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-black text-slate-500 hover:text-white transition-all text-left uppercase tracking-[0.2em] group"
                  >
                    <AppIcon name="logout" className="h-5 w-5 text-slate-600 group-hover:text-brand-primary transition-colors" />
                    Exit Session
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
