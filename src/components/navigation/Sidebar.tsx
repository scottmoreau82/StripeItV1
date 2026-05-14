import React from 'react';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { Typography } from '../ui/Typography';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '../ui/Button';
import { ComingSoonIndicator } from '../ui/ComingSoonIndicator';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';
import { navigationConfig } from './NavigationItems';
import { TierBadge } from './TierBadge';
import { useResponsive } from '@/src/hooks/useResponsive';
import { SubscriptionTier } from '@/src/types';
import { AdminAnalyticsCard } from './AdminAnalyticsCard';
import { useAppData } from '@/src/contexts/AppDataContext';

/**
 * StripeItSidebarSystem
 * Core navigation anchor for desktop users with tiered visibility and state stabilization.
 */
interface SidebarProps {
  onLogDeal?: () => void;
  onLogSpiff?: () => void;
  onConfigPayPlan?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onLogDeal, 
  onLogSpiff, 
  onConfigPayPlan, 
  isCollapsed, 
  onToggleCollapse 
}) => {
  const { profile, user, isAdmin, tierOverride, setTierOverride, isEditMode, setIsEditMode } = useAuth();
  const { isCommissionConfigured } = useAppData();
  const location = useLocation();

  const isDeveloper = user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // StripeItFeatureAccessSystem - Filter items based on tier
  const visibleNavItems = navigationConfig.getVisibleItems(profile);

  return (
    <aside className={cn(
      "hidden h-screen flex-col border-r border-border-subtle bg-bg-deep lg:flex sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-30 overflow-hidden",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Identity / Top Area (Pinned) */}
      <div className="flex flex-col h-20 shrink-0 justify-center">
        <div className="flex items-center w-full">
          <div className="w-20 shrink-0 flex items-center justify-center">
            <button 
              onClick={onToggleCollapse}
              className="h-10 w-10 min-w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary shrink-0 transition-all hover:scale-105 active:scale-95 group/logo"
              title="Toggle sidebar"
            >
              <AppIcon name="trending" className="text-white h-6 w-6 group-hover/logo:scale-110 transition-transform" />
            </button>
          </div>
          <div className={cn(
            "flex-1 min-w-0 pr-6 transition-all duration-300 overflow-hidden",
            isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
          )}>
            <Link to="/">
              <Typography variant="h3" className="font-display font-black italic text-white tracking-tighter uppercase whitespace-nowrap overflow-hidden hover:text-brand-primary transition-colors">
                StripeIt
              </Typography>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation & Action Area (Scrollable Navigation) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <nav className="flex flex-col gap-1 py-4">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            const content = (
              <div className="flex items-center w-full group">
                <div className="w-20 shrink-0 flex items-center justify-center relative">
                  {/* Active Indicator Bar - Fixed to Left edge of sidebar */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
                  )}
                  <AppIcon name={item.icon as any} className={cn("h-6 w-6 shrink-0 transition-all", isActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
                </div>
                <div className={cn(
                  "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                  isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
                )}>
                  <span className={cn("font-bold text-[11px] uppercase tracking-[0.2em] truncate whitespace-nowrap transition-all", isActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>{item.label}</span>
                  {item.featureId && <ComingSoonIndicator featureId={item.featureId} size="sm" />}
                </div>
              </div>
            );

            if (item.id === 'feedback') {
              return (
                <button
                  key={item.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-feedback'))}
                  title={isCollapsed ? item.label : undefined}
                  className="w-full py-3.5 hover:bg-white/[0.02] transition-all"
                >
                  {content}
                </button>
              );
            }

            return (
              <React.Fragment key={item.id}>
                <Link
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "block w-full py-3.5 transition-all text-left",
                    isActive ? "bg-white/[0.03]" : "hover:bg-white/[0.02]"
                  )}
                >
                  {content}
                </Link>
                
                {/* StripeItSettingsSubmenuSystem - Render nested submenu if on settings and expanded */}
                {isActive && item.id === 'settings' && !isCollapsed && (
                  <div className="mt-1 ml-20 flex flex-col gap-1 border-l border-white/10 pl-4 mb-2">
                    {navigationConfig.settingsSubmenu
                      .filter(sub => !sub.adminOnly || isAdmin || isDeveloper)
                      .map(sub => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            const id = sub.path.replace('#', '');
                            const el = document.getElementById(id);
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                          className="py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-brand-primary transition-colors text-left"
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

        {/* Action Area within Scrollable */}
        <div className={cn("py-8 transition-all duration-300 flex flex-col gap-3", isCollapsed ? "px-0" : "px-5 pr-6")}>
          <Button 
            onClick={onLogDeal}
            title={isCollapsed ? "Log Deal" : undefined}
            className={cn(
              "bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black shadow-glow glow-primary transition-all flex items-center justify-center group overflow-hidden",
              isCollapsed 
                ? "h-10 w-10 p-0 rounded-xl mx-auto" 
                : "h-14 w-full rounded-xl px-4"
            )}
          >
            <AppIcon name="plus" className="h-6 w-6 shrink-0 stroke-[3px] group-hover:scale-110 transition-transform" />
            <span className={cn(
              "tracking-widest uppercase truncate whitespace-nowrap transition-all duration-300",
              isCollapsed ? "opacity-0 w-0 ml-0 invisible" : "opacity-100 w-auto ml-2 visible"
            )}>
              Log Deal
            </span>
          </Button>

          {/* New SPIFF & Utility Row */}
          {!isCollapsed && profile?.subscriptionTier !== SubscriptionTier.FREE && (
            <div className="flex gap-2 h-10">
              <button 
                onClick={onLogSpiff}
                className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group p-1"
                title="Log SPIFF Adjustment"
              >
                <AppIcon name="billing" size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">SPIFF</span>
              </button>
              
              <button 
                className="flex-1 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:bg-white/10 transition-all flex items-center justify-center gap-2 group p-1 cursor-not-allowed opacity-40"
                title="Reserved Slot"
                disabled
              >
                <AppIcon name="target" size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">---</span>
              </button>
            </div>
          )}

          {isCollapsed && profile?.subscriptionTier !== SubscriptionTier.FREE && (
            <button 
              onClick={onLogSpiff}
              className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto hover:bg-emerald-500/20 transition-all"
              title="Log SPIFF Adjustment"
            >
              <AppIcon name="billing" size={18} />
            </button>
          )}
          
          <div className="h-12 shrink-0" />
        </div>
      </div>

      {/* Account & Footer Area (Pinned Footer) */}
      <div className="shrink-0 border-t border-border-subtle bg-bg-deep/80 backdrop-blur-sm z-10 py-6">
        {/* Commission Architect Setup Warning */}
        {!isCommissionConfigured && !isAdmin && onConfigPayPlan && (
          <CommissionWarningCard onConfigure={onConfigPayPlan} isCollapsed={!!isCollapsed} />
        )}

        {/* StripeItAnalyticsSystem - Admin Tracker */}
        {(isAdmin || isDeveloper) && <AdminAnalyticsCard isCollapsed={isCollapsed} />}
        
        {/* User Account Hub */}
        <div className={cn("px-4 mb-2 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
          <div className="bg-bg-card/40 border border-border-subtle rounded-2xl p-4 shadow-glow glow-primary/5 transition-all hover:bg-bg-card/60 relative overflow-hidden group/user">
            {/* Background Accent */}
            <div className="absolute -right-6 -bottom-6 h-20 w-20 bg-brand-primary/5 rounded-full blur-2xl group-hover/user:bg-brand-primary/10 transition-all" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0 shadow-lg transition-transform group-hover/user:scale-105">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 text-[11px] group-hover/user:text-brand-primary transition-colors">
                  {profile?.displayName || 'Operator'}
                </Typography>
                <div className="flex items-center gap-2 opacity-80 overflow-hidden">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#22C55E] shrink-0 pulse" />
                  <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black tracking-[0.15em] truncate">
                    {profile?.role || 'Sales'}
                  </Typography>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <TierBadge tier={tierOverride || profile?.subscriptionTier} size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* System Exit */}
        <div className="flex flex-col gap-1 px-4">
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Exit Vault" : undefined}
            className={cn(
              "flex items-center gap-3 w-full group hover:bg-rose-500/5 transition-all rounded-xl py-3.5",
              isCollapsed ? "justify-center" : "px-4"
            )}
          >
            <div className={cn("shrink-0 flex items-center justify-center", isCollapsed ? "w-full" : "w-6")}>
              <AppIcon name="logout" className="h-5 w-5 text-slate-600 group-hover:text-rose-500 transition-colors" />
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-black text-slate-500 group-hover:text-rose-400 uppercase tracking-[0.25em] whitespace-nowrap transition-all">Exit Session</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};

const CommissionWarningCard: React.FC<{ onConfigure: () => void; isCollapsed: boolean }> = ({ onConfigure, isCollapsed }) => {
  if (isCollapsed) {
    return (
      <div className="px-4 mb-4">
        <button 
          onClick={onConfigure}
          className="h-12 w-12 rounded-xl bg-rose-500/10 border border-rose-500/50 flex items-center justify-center shadow-glow glow-rose/20 hover:bg-rose-500/20 transition-all group"
          title="Setup Pay Plan Required"
        >
          <AppIcon name="timer" className="h-6 w-6 text-rose-500 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 shadow-glow glow-rose/10 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-16 w-16 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
      
      <div className="flex items-start gap-3 mb-3">
        <div className="mt-1">
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <AppIcon name="timer" size={16} className="text-rose-500" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <Typography variant="mono" className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1 leading-none">
            Setup Required
          </Typography>
          <Typography variant="label" className="text-white text-xs font-black uppercase tracking-tight">
            Est. Payout Engine
          </Typography>
        </div>
      </div>

      <Typography variant="small" className="text-slate-400 text-[11px] leading-relaxed mb-4 block font-medium">
        Configure your pay plan first to ensure commissions and payouts calculate accurately.
      </Typography>

      <Button 
        onClick={onConfigure}
        size="sm"
        className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black text-[10px] uppercase tracking-widest py-2.5 rounded-lg shadow-glow glow-rose/30 border-none"
      >
        Configure Now
      </Button>
    </div>
  );
};
