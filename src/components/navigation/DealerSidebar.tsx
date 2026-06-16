import React from 'react';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { Typography } from '../ui/Typography';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { SIDEBAR_NAV_TYPOGRAPHY, SIDEBAR_NAV_ICON_SIZE_CLASS } from '@/src/constants';
import { TierBadge } from './TierBadge';
import { Sparkles } from 'lucide-react';

import { AdminAnalyticsCard } from './AdminAnalyticsCard';

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
  const { profile, isAdmin, isDeveloper } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isDashboardActive = location.pathname === '/';
  const isSalesReportActive = location.pathname === '/dealer/sales-log';
  const isUserManagementActive = location.pathname === '/dealer/users';
  const isLogBuilderActive = location.pathname === '/dealer/log-builder';
  const isSettingsActive = location.pathname === '/dealer/settings';
  const isPayPlansActive = location.pathname === '/dealer/pay-plans';

  return (
    <aside className={cn(
      "hidden h-dvh flex-col border-r border-border-subtle bg-bg-deep lg:flex sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-30 overflow-hidden",
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
              <Typography variant="h3" className="font-display font-black italic text-[var(--color-text-primary)] tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                StripeIt <span className="text-[10px] ml-1 opacity-50 not-italic">DEALER</span>
              </Typography>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <nav className="flex flex-col py-6">
          {/* Dashboard - Top Level */}
          <Link
            to="/"
            className={cn(
              "flex items-center w-full py-3.5 transition-all group relative",
              isDashboardActive ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {isDashboardActive && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="dashboard" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", isDashboardActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, isDashboardActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Dashboard</span>
            </div>
          </Link>

          {/* OPERATIONS SECTION */}
          <div className={cn("mt-8 mb-2 px-6 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Operations</span>
          </div>

          <Link
            to="/dealer/sales-log"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              isSalesReportActive ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {isSalesReportActive && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="salesLog" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", isSalesReportActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, isSalesReportActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Sales Report</span>
            </div>
          </Link>

          <Link
            to="/activity"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              location.pathname === '/activity' ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {location.pathname === '/activity' && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="activity" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", location.pathname === '/activity' ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, location.pathname === '/activity' ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Activity Feed</span>
            </div>
          </Link>

          {/* MANAGEMENT SECTION */}
          <div className={cn("mt-8 mb-2 px-6 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Management</span>
          </div>

          <Link
            to="/dealer/users"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              location.pathname === '/dealer/users' && !location.search ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {location.pathname === '/dealer/users' && !location.search && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="users" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", location.pathname === '/dealer/users' && !location.search ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, location.pathname === '/dealer/users' && !location.search ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Managers</span>
            </div>
          </Link>

          <Link
            to="/dealer/users?tab=permissions"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              location.search === '?tab=permissions' ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {location.search === '?tab=permissions' && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="lock" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", location.search === '?tab=permissions' ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, location.search === '?tab=permissions' ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Permissions</span>
            </div>
          </Link>

          <Link
            to="/dealer/invites"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              location.pathname === '/dealer/invites' ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {location.pathname === '/dealer/invites' && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="mail" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", location.pathname === '/dealer/invites' ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, location.pathname === '/dealer/invites' ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Invites</span>
            </div>
          </Link>
          
          {profile?.email?.toLowerCase() === 'scottmoreau82@gmail.com' && (
            <div className="flex flex-col gap-1">
              <div className={cn("mt-8 mb-2 px-6 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
                <span className="font-mono uppercase text-slate-600 text-[9px] tracking-widest">TOOLS</span>
              </div>
              <Link
                to="/deal-desk"
                title={isCollapsed ? "MAGIC" : undefined}
                className={cn(
                  "flex items-center w-full py-3.5 transition-all group relative text-left",
                  location.pathname === '/deal-desk' ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                )}
              >
                <div className="w-16 shrink-0 flex items-center justify-center relative">
                  {location.pathname === '/deal-desk' && !isCollapsed && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
                  )}
                  <Sparkles 
                    className={cn(
                      SIDEBAR_NAV_ICON_SIZE_CLASS, 
                      "shrink-0 transition-all text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]"
                    )} 
                  />
                </div>
                <div className={cn(
                  "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                  isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
                )}>
                  <span className={cn("font-bold uppercase tracking-[0.2em] truncate whitespace-nowrap transition-all text-brand-primary", SIDEBAR_NAV_TYPOGRAPHY)}>
                    MAGIC
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* CONFIGURATION SECTION */}
          <div className={cn("mt-8 mb-2 px-6 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">Configuration</span>
          </div>

          <Link
            to="/dealer/pay-plans"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              isPayPlansActive ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {isPayPlansActive && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="billing" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", isPayPlansActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, isPayPlansActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Pay Plans</span>
            </div>
          </Link>

          <Link
            to="/dealer/settings"
            className={cn(
              "flex items-center w-full py-3 transition-all group relative",
              isSettingsActive ? "bg-brand-primary/[0.03]" : "hover:bg-white/[0.02]"
            )}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              {isSettingsActive && !isCollapsed && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
              )}
              <AppIcon name="settings" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", isSettingsActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]" : "text-slate-600 group-hover:text-slate-400")} />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, isSettingsActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>Settings</span>
            </div>
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center w-full py-3.5 transition-all group relative hover:bg-white/[0.02] text-left"
            )}
            title={isCollapsed ? "Toggle Appearance" : undefined}
          >
            <div className="w-16 shrink-0 flex items-center justify-center relative">
              <AppIcon 
                name={theme === 'dark' ? 'moon' : 'sun'} 
                className={cn(
                  SIDEBAR_NAV_ICON_SIZE_CLASS, 
                  "shrink-0 transition-all text-brand-primary drop-shadow-[0_0_8px_rgba(0,212,255,0.4)]"
                )} 
              />
            </div>
            <div className={cn(
              "flex-1 overflow-hidden transition-all duration-300 pr-6",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <span className={cn("font-bold uppercase tracking-[0.25em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, "text-slate-500 group-hover:text-slate-300")}>
                Theme
              </span>
            </div>
          </button>
        </nav>
      </div>

      {/* Admin / Developer Tools (Utility Layer - Anchored but separate) */}
      <div className="shrink-0 px-2 mb-2">
        {profile?.isAdmin && (
          <AdminAnalyticsCard isCollapsed={isCollapsed} />
        )}
      </div>

      {/* Footer / Account (Pinned Footer) */}
      <div className="shrink-0 border-t border-white/5 bg-[var(--color-bg-surface)] backdrop-blur-md z-10 py-6">
        <div className={cn("px-4 mb-4 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
          <div className="bg-[var(--color-bg-surface)] border-transparent rounded-2xl p-4 transition-all hover:opacity-90 relative overflow-hidden group/user">
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0 shadow-lg">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <Typography variant="label" className="text-[var(--color-text-primary)] block font-black truncate uppercase tracking-tight mb-1 text-[11px] group-hover/user:text-brand-primary transition-colors italic leading-none">
                  {profile?.displayName || 'Dealer Operator'}
                </Typography>
                <div className="flex items-center gap-2 opacity-80 overflow-hidden">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-glow glow-primary animate-pulse shrink-0" />
                  <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-black tracking-[0.15em] truncate">
                    Authorized Representative
                  </Typography>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <TierBadge tier={profile?.subscriptionTier} />
              </div>
            </div>
            {/* Background Texture/Accents */}
            <div className="absolute top-0 right-0 p-1 opacity-5 group-hover/user:opacity-10 transition-opacity">
              <AppIcon name="dashboard" className="h-12 w-12 text-brand-primary" />
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
              <AppIcon name="logout" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "text-slate-600 group-hover:text-rose-500 transition-colors drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]")} />
            </div>
            {!isCollapsed && (
              <span className={cn("font-black text-[var(--color-text-secondary)] group-hover:text-rose-400 uppercase tracking-[0.25em] whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY)}>Exit Session</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
