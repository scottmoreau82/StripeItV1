import React from 'react';
import { cn } from '@/src/lib/utils';
import { AppIcon } from '../ui/AppIcon';
import { Typography } from '../ui/Typography';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '../ui/Button';
import { ComingSoonIndicator } from '../ui/ComingSoonIndicator';
import { Modal } from '../ui/Modal';
import { Lock, Zap, CheckCircle2, ArrowUpRight, Star, Sparkles, Crown } from 'lucide-react';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';
import { navigationConfig } from './NavigationItems';
import { SIDEBAR_NAV_TYPOGRAPHY, SIDEBAR_NAV_ICON_SIZE_CLASS } from '@/src/constants';
import { TierBadge } from './TierBadge';
import { useResponsive } from '@/src/hooks/useResponsive';
import { SubscriptionTier } from '@/src/types';
import { AdminAnalyticsCard } from './AdminAnalyticsCard';
import { useAppData } from '@/src/contexts/AppDataContext';
import { useTheme } from '@/src/contexts/ThemeContext';
import { isProTheme } from '@/src/contexts/ThemeContext';

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
  const { theme } = useTheme();
  const { isCommissionConfigured } = useAppData();
  const location = useLocation();
  const [isSpiffModalOpen, setIsSpiffModalOpen] = React.useState(false);
  const [exitArmed, setExitArmed] = React.useState(false);
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDeveloper = user?.email?.toLowerCase() === STRIPEIT_DEVELOPER_EMAIL.toLowerCase();

  const handleLogout = async () => {
    if (!exitArmed) {
      setExitArmed(true);
      exitTimerRef.current = setTimeout(() => {
        setExitArmed(false);
      }, 3000);
    } else {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      setExitArmed(false);
      try {
        await auth.signOut();
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
  };

  // StripeItFeatureAccessSystem - Filter items based on tier
  const visibleNavItems = navigationConfig.getVisibleItems(profile);

  const mainNavItems = visibleNavItems.filter(item => item.id !== 'settings' && item.id !== 'feedback');
  const secondaryNavItems = visibleNavItems.filter(item => item.id === 'settings' || item.id === 'feedback');

  const renderNavItem = (item: typeof navigationConfig.main[0]) => {
    const isActive = location.pathname === item.path;
    
    const content = (
      <div className="flex items-center w-full group">
        <div className="w-16 shrink-0 flex items-center justify-center relative">
          {/* Active Indicator Bar - Fixed to Left edge of sidebar */}
          {isActive && !isCollapsed && (
            <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-glow glow-primary" />
          )}
          <AppIcon name={item.icon as any} className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 transition-all", isActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
        </div>
        <div className={cn(
          "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
          isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
        )}>
          <span className={cn("font-bold uppercase tracking-[0.2em] truncate whitespace-nowrap transition-all", SIDEBAR_NAV_TYPOGRAPHY, isActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>{item.label}</span>
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
          className="w-full py-3.5 hover:bg-bg-elevated/50 transition-all"
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
            isActive ? "bg-bg-elevated" : "hover:bg-bg-elevated/50"
          )}
        >
          {content}
        </Link>
        
        {/* StripeItSettingsSubmenuSystem - Render nested submenu if on settings and expanded */}
        {isActive && item.id === 'settings' && !isCollapsed && (
          <div className="mt-1 ml-16 flex flex-col gap-1 border-l border-white/10 pl-4 mb-2">
            {navigationConfig.settingsSubmenu
              .filter(sub => {
                if (sub.adminOnly && !profile?.isAdmin) return false;
                if (sub.roles && profile && !sub.roles.includes(profile.role)) return false;
                return true;
              })
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
                  className={cn("py-1.5 font-black uppercase tracking-[0.2em] text-slate-600 hover:text-brand-primary transition-colors text-left", SIDEBAR_NAV_TYPOGRAPHY)}
                >
                  {sub.label}
                </button>
              ))
            }
          </div>
        )}
      </React.Fragment>
    );
  };

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
              <Typography variant="h3" className="font-display font-black italic text-[var(--color-text-primary)] tracking-tighter uppercase whitespace-nowrap overflow-hidden hover:text-brand-primary transition-colors">
                StripeIt
              </Typography>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation & Action Area (Scrollable Navigation) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <nav className="flex flex-col gap-1 py-6">
          {mainNavItems.map((item) => renderNavItem(item))}

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
                  location.pathname === '/deal-desk' ? "bg-bg-elevated" : "hover:bg-bg-elevated/50"
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

          {secondaryNavItems.map((item) => renderNavItem(item))}


        </nav>
      </div>

      {/* Action Area (Pinned) */}
      <div className={cn("shrink-0 py-6 transition-all duration-300 flex flex-col gap-3", isCollapsed ? "px-0" : "px-5 pr-6")}>
        <Button 
          onClick={onLogDeal}
          title={isCollapsed ? "Log Deal" : undefined}
          className={cn(
            isProTheme(theme)
              ? "border border-brand-primary bg-transparent text-brand-primary hover:bg-brand-primary/10 shadow-glow glow-primary font-black transition-all flex items-center justify-center group overflow-hidden"
              : "bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black shadow-glow glow-primary transition-all flex items-center justify-center group overflow-hidden",
            isCollapsed 
              ? "h-10 w-10 p-0 rounded-xl mx-auto" 
              : "h-14 w-full rounded-xl px-4"
          )}
        >
          <AppIcon name="plus" className={cn(SIDEBAR_NAV_ICON_SIZE_CLASS, "shrink-0 stroke-[3px] group-hover:scale-110 transition-transform")} />
          <span className={cn(
            "tracking-widest uppercase truncate whitespace-nowrap transition-all duration-300",
            isCollapsed ? "opacity-0 w-0 ml-0 invisible" : "opacity-100 w-auto ml-2 visible"
          )}>
            Log Deal
          </span>
        </Button>

        {/* New SPIFF & Utility Row */}
        {!isCollapsed && (
          <div className="flex gap-2 h-10">
            {profile?.subscriptionTier === SubscriptionTier.FREE ? (
              <button 
                onClick={() => setIsSpiffModalOpen(true)}
                className="flex-1 rounded-lg bg-bg-elevated border border-border-subtle text-text-muted hover:bg-bg-elevated hover:border-brand-primary/30 transition-all flex items-center justify-center gap-2 group p-1"
                title="SPIFF - Basic+ Exclusive"
              >
                <AppIcon name="lock" size={14} className="text-slate-400 transition-colors group-hover:text-brand-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 transition-colors group-hover:text-slate-400">SPIFF</span>
              </button>
            ) : (
              <button 
                onClick={onLogSpiff}
                className="flex-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group p-1"
                title="Log SPIFF Adjustment"
              >
                <AppIcon name="billing" size={14} className="group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">SPIFF</span>
              </button>
            )}
            
            {profile?.subscriptionTier === SubscriptionTier.FREE ? (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-upgrade'))}
                className="flex-1 rounded-lg bg-[#AAFF00]/15 border border-[#AAFF00]/60 text-[#5C8A00] hover:bg-[#AAFF00]/25 transition-all flex items-center justify-center gap-2 group p-1 [html[data-theme='light']_&]:bg-[#AAFF00]/20 [html[data-theme='light']_&]:border-[#5C8A00]/60 [html[data-theme='light']_&]:text-[#3D5C00]"
                title="Upgrade to Pro"
              >
                <Crown size={14} className="group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-widest">Pro</span>
              </button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        )}

        {isCollapsed && (
          <>
            {profile?.subscriptionTier === SubscriptionTier.FREE ? (
              <button 
                onClick={() => setIsSpiffModalOpen(true)}
                className="h-10 w-10 rounded-xl bg-bg-elevated border border-border-subtle text-text-muted flex items-center justify-center mx-auto hover:border-brand-primary/30 hover:text-brand-primary transition-all"
                title="SPIFF - Basic+ Exclusive"
              >
                <AppIcon name="lock" size={18} />
              </button>
            ) : (
              <button 
                onClick={onLogSpiff}
                className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto hover:bg-emerald-500/20 transition-all"
                title="Log SPIFF Adjustment"
              >
                <AppIcon name="billing" size={18} />
              </button>
            )}
            
            {profile?.subscriptionTier === SubscriptionTier.FREE && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-upgrade'))}
                className="h-10 w-10 rounded-xl bg-[#AAFF00]/15 border border-[#AAFF00]/60 text-[#5C8A00] flex items-center justify-center mx-auto hover:bg-[#AAFF00]/25 transition-all [html[data-theme='light']_&]:border-[#5C8A00]/60 [html[data-theme='light']_&]:text-[#3D5C00] shadow-[0_0_15px_-3px_rgba(170,255,0,0.4)]"
                title="Upgrade to Pro"
              >
                <Crown size={18} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Commission Architect Setup Warning & Analytics (Utility Layer - Anchored but separate) */}
      <div className="shrink-0 px-2 space-y-2 mb-2">
        {!isCommissionConfigured && !isAdmin && onConfigPayPlan && (
          <CommissionWarningCard onConfigure={onConfigPayPlan} isCollapsed={!!isCollapsed} />
        )}
        {profile?.isAdmin && <AdminAnalyticsCard isCollapsed={isCollapsed} />}
      </div>

      {/* Account & Footer Area (Pinned Footer) */}
      <div className="shrink-0 border-t border-border-subtle bg-[var(--color-bg-surface)] backdrop-blur-sm z-10 py-6">
        {/* User Account Hub */}
        <div className={cn("px-4 mb-2 transition-all duration-300", isCollapsed ? "opacity-0 invisible h-0" : "opacity-100 visible h-auto")}>
          <div className="bg-[var(--color-bg-surface)] border-transparent rounded-2xl p-4 transition-all hover:opacity-90 relative overflow-hidden group/user">
            {/* Background Accent */}
            <div className="absolute -right-6 -bottom-6 h-20 w-20 bg-brand-primary/5 rounded-full blur-2xl group-hover/user:bg-brand-primary/10 transition-all" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-10 w-10 rounded-full bg-bg-elevated flex items-center justify-center border border-border-subtle text-text-primary font-bold uppercase overflow-hidden shrink-0 shadow-lg transition-transform group-hover/user:scale-105">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <Typography variant="label" className="text-[var(--color-text-primary)] block font-black truncate uppercase tracking-tight mb-1 text-[11px] group-hover/user:text-brand-primary transition-colors">
                  {profile?.displayName || 'Operator'}
                </Typography>
                <div className="flex items-center gap-2 opacity-80 overflow-hidden">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#22C55E] shrink-0 pulse" />
                  <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-black tracking-[0.15em] truncate">
                    {profile?.role || 'Sales'}
                  </Typography>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <TierBadge tier={tierOverride || profile?.subscriptionTier} trialEndsAt={profile?.trialEndsAt} />
              </div>
            </div>
          </div>
        </div>

        {/* System Exit */}
        <div className="flex flex-col gap-1 px-4">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Exit Session" : undefined}
            className={cn(
              "flex items-center gap-3 w-full group transition-all rounded-xl py-3.5 relative overflow-hidden",
              isCollapsed ? "justify-center" : "px-4",
              exitArmed ? "hover:bg-rose-500/10" : "hover:bg-rose-500/5"
            )}
          >
            {/* Draining progress bar — bottom edge of button, drains right to left */}
            {exitArmed && (
              <span
                className="absolute bottom-0 left-0 h-[2px] w-full pointer-events-none"
                style={{
                  background: 'linear-gradient(to left, #ef4444, #f97316)',
                  animation: 'exitBarDrain 3s linear forwards',
                  transformOrigin: 'right center',
                }}
              />
            )}
            <div className={cn("shrink-0 flex items-center justify-center", isCollapsed ? "w-full" : "w-6")}>
              <AppIcon
                name="logout"
                className={cn(
                  SIDEBAR_NAV_ICON_SIZE_CLASS,
                  "transition-colors",
                  exitArmed ? "text-rose-500" : "text-slate-600 group-hover:text-rose-500"
                )}
              />
            </div>
            {!isCollapsed && (
              <span className={cn(
                "font-black uppercase tracking-[0.25em] whitespace-nowrap transition-all",
                SIDEBAR_NAV_TYPOGRAPHY,
                exitArmed ? "text-rose-400" : "text-[var(--color-text-secondary)] group-hover:text-rose-400"
              )}>
                {exitArmed ? "Confirm Exit" : "Exit Session"}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* SPIFF Upgrade Modal */}
      <Modal
        isOpen={isSpiffModalOpen}
        onClose={() => setIsSpiffModalOpen(false)}
        title="Premium Incentive Engine"
        className="max-w-xl"
      >
        <div className="space-y-8">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-glow glow-emerald">
                 <AppIcon name="billing" size={32} className="text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full bg-bg-deep border-2 border-emerald-500 flex items-center justify-center">
                <Lock className="h-3.5 w-3.5 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <Typography variant="mono" className="text-emerald-500 uppercase tracking-[0.3em] font-black italic text-[10px] mb-2">
              Pro & Dealer Exclusive Feature
            </Typography>
            <Typography variant="h2" className="text-white font-black italic uppercase tracking-tighter mb-4 text-3xl">
              Professional SPIFF Tracking
            </Typography>
            <Typography variant="small" className="text-slate-400 leading-relaxed max-w-md mx-auto">
              Track one-time bonuses, incentive fund payouts, and auxiliary adjustments independently from your deal matrix.
            </Typography>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {[
               { icon: Zap, text: "Independent Payouts" },
               { icon: CheckCircle2, text: "Bonus Visualization" },
               { icon: Star, text: "Volume Engine Sync" },
               { icon: Zap, text: "Adjustment History" }
             ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3">
                  <item.icon className="h-4 w-4 text-emerald-500 shrink-0" />
                  <Typography variant="mono" className="text-[10px] text-slate-300 uppercase font-bold tracking-wider">
                    {item.text}
                  </Typography>
                </div>
             ))}
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <Button 
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-bg-deep font-black rounded-xl shadow-glow glow-emerald flex items-center justify-center gap-3 group border-none"
              onClick={() => {
                setIsSpiffModalOpen(false);
                // Redirect to settings or wherever upgrade happens
                const settingsLink = document.querySelector('a[href="/settings"]');
                if (settingsLink instanceof HTMLElement) settingsLink.click();
              }}
            >
              Unlock Incentive Engine
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Button>
            <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-bold text-center">
              Available on Pro & Dealer Plans(Coming Soon!)
            </Typography>
          </div>
        </div>
      </Modal>
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
            Setup Required <b />
          </Typography>
          <Typography variant="label" className="text-white text-xs font-black uppercase tracking-tight">
            Payout Engine
          </Typography>
        </div>
      </div>

      <Typography variant="small" className="text-slate-400 text-[11px] leading-relaxed mb-4 block font-medium">
        Configure your pay plan to ensure commissions and payouts calculate accurately.
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
