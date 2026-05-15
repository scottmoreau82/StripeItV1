import React from 'react';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { Typography } from '../ui/Typography';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { TierBadge } from './TierBadge';

/**
 * DealerSidebar
 * Minimal navigation for the Dealer tier.
 */
interface DealerSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onLogDeal?: () => void;
}

export const DealerSidebar: React.FC<DealerSidebarProps> = ({ 
  isCollapsed, 
  onToggleCollapse,
  onLogDeal
}) => {
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) return null;

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isDashboardActive = location.pathname === '/';
  const isSalesLogActive = location.pathname === '/dealer/sales-log';
  const isSettingsActive = location.pathname === '/dealer/settings';

  return (
    <aside className={cn(
      "hidden h-screen flex-col border-r border-border-subtle bg-bg-deep lg:flex sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-30 overflow-hidden",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Identity */}
      <div className="flex flex-col h-20 shrink-0 justify-center">
        <div className="flex items-center w-full">
          <div className="w-20 shrink-0 flex items-center justify-center">
            <button 
              onClick={onToggleCollapse}
              className="h-10 w-10 min-w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary shrink-0 transition-all hover:scale-105 active:scale-95 group/logo"
            >
              <AppIcon name="trending" className="text-white h-6 w-6" />
            </button>
          </div>
          <div className={cn(
            "flex-1 min-w-0 pr-6 transition-all duration-300 overflow-hidden",
            isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
          )}>
            <Link to="/">
              <Typography variant="h3" className="font-display font-black italic text-white tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                StripeIt <span className="text-[10px] ml-1 opacity-50 not-italic">DEALER</span>
              </Typography>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <nav className="flex flex-col gap-1 py-4">
          <Link
            to="/"
            className={cn(
              "block w-full py-4 transition-all text-left group",
              isDashboardActive ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center w-full">
              <div className="w-20 shrink-0 flex items-center justify-center relative">
                {isDashboardActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
                )}
                <AppIcon name="trending" className={cn("h-6 w-6 shrink-0 transition-all", isDashboardActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
              </div>
              <div className={cn(
                "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
              )}>
                <span className={cn("font-bold text-[11px] uppercase tracking-[0.2em] truncate whitespace-nowrap transition-all", isDashboardActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Dashboard</span>
              </div>
            </div>
          </Link>

          <Link
            to="/dealer/sales-log"
            className={cn(
              "block w-full py-4 transition-all text-left group",
              isSalesLogActive ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center w-full">
              <div className="w-20 shrink-0 flex items-center justify-center relative">
                {isSalesLogActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
                )}
                <AppIcon name="salesLog" className={cn("h-6 w-6 shrink-0 transition-all", isSalesLogActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
              </div>
              <div className={cn(
                "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
              )}>
                <span className={cn("font-bold text-[11px] uppercase tracking-[0.2em] truncate whitespace-nowrap transition-all", isSalesLogActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Sales Report</span>
              </div>
            </div>
          </Link>

          <Link
            to="/dealer/settings"
            className={cn(
              "block w-full py-4 transition-all text-left group",
              isSettingsActive ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center w-full">
              <div className="w-20 shrink-0 flex items-center justify-center relative">
                {isSettingsActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
                )}
                <AppIcon name="settings" className={cn("h-6 w-6 shrink-0 transition-all", isSettingsActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
              </div>
              <div className={cn(
                "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
              )}>
                <span className={cn("font-bold text-[11px] uppercase tracking-[0.2em] truncate whitespace-nowrap transition-all", isSettingsActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Settings</span>
              </div>
            </div>
          </Link>

          <button
            onClick={onLogDeal}
            className={cn(
              "block w-full py-4 transition-all text-left group hover:bg-white/[0.02]"
            )}
          >
            <div className="flex items-center w-full">
              <div className="w-20 shrink-0 flex items-center justify-center relative">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-all shadow-glow glow-primary/5">
                  <AppIcon name="plus" className="h-5 w-5 text-brand-primary" />
                </div>
              </div>
              <div className={cn(
                "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
              )}>
                <span className="font-bold text-[11px] uppercase tracking-[0.2em] truncate whitespace-nowrap text-slate-500 group-hover:text-brand-primary transition-all">Log Deal</span>
              </div>
            </div>
          </button>
        </nav>
      </div>

      {/* Footer / Account */}
      <div className="shrink-0 border-t border-border-subtle bg-bg-deep/80 backdrop-blur-sm z-10 py-6">
        <div className={cn("px-4 mb-2 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
          <div className="bg-bg-card/40 border border-border-subtle rounded-2xl p-4 shadow-glow glow-primary/5 transition-all hover:bg-bg-card/60 relative overflow-hidden group/user">
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0 shadow-lg">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 text-[11px] group-hover/user:text-brand-primary transition-colors">
                  {profile.displayName}
                </Typography>
                <div className="flex items-center gap-2 opacity-80 overflow-hidden">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_5px_rgba(0,242,255,0.5)] shrink-0" />
                  <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black tracking-[0.15em] truncate">
                    Authorized Representative
                  </Typography>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <TierBadge tier={profile?.subscriptionTier} size="sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-4">
          <button 
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full group hover:bg-rose-500/5 transition-all rounded-xl py-3.5",
              isCollapsed ? "justify-center" : "px-4"
            )}
          >
            <div className={cn("shrink-0 flex items-center justify-center", isCollapsed ? "w-full" : "w-6")}>
              <AppIcon name="logout" className="h-5 w-5 text-slate-600 group-hover:text-rose-500 transition-colors" />
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-black text-slate-500 group-hover:text-rose-400 uppercase tracking-[0.25em] whitespace-nowrap transition-all">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
