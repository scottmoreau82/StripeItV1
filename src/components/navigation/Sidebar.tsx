import React from 'react';
import { cn } from '@/src/lib/utils';
import { 
  TrendingUp, 
  LogOut, 
  LayoutDashboard, 
  ClipboardList, 
  Archive, 
  Activity,
  FileText,
  Settings, 
  Plus,
  ChevronLeft,
  Timer,
  ShieldCheck,
  Menu
} from 'lucide-react';
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

/**
 * StripeItSidebarSystem
 * Core navigation anchor for desktop users with tiered visibility and state stabilization.
 */
interface SidebarProps {
  onLogDeal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogDeal, isCollapsed, onToggleCollapse }) => {
  const { profile, user, isAdmin, tierOverride, setTierOverride, isEditMode, setIsEditMode } = useAuth();
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
      "hidden h-screen flex-col border-r border-white/5 bg-bg-deep lg:flex sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-30 overflow-hidden",
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
              <TrendingUp className="text-white h-6 w-6 group-hover/logo:scale-110 transition-transform" />
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

      {/* Navigation & Action Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <nav className="flex flex-col gap-1 py-4">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            const content = (
              <div className="flex items-center w-full group">
                <div className="w-20 shrink-0 flex items-center justify-center relative">
                  {/* Active Indicator Bar - Fixed to Left edge of sidebar */}
                  {isActive && !isCollapsed && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-[0_0_10px_#00F2FF]" />
                  )}
                  <item.icon className={cn("h-6 w-6 shrink-0 transition-all", isActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
                </div>
                <div className={cn(
                  "flex-1 flex items-center justify-between gap-2 overflow-hidden transition-all duration-300 pr-6",
                  isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
                )}>
                  <span className={cn("font-semibold text-base truncate whitespace-nowrap", isActive ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300")}>{item.label}</span>
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
                          className="py-1.5 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors text-left"
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
        <div className="py-8 flex flex-col gap-3">
          <div className="flex items-center w-full">
            <div className="w-20 shrink-0 flex items-center justify-center">
              <Button 
                onClick={onLogDeal}
                title={isCollapsed ? "Log Deal" : undefined}
                className="h-10 w-10 p-0 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black shadow-glow glow-primary transition-all flex items-center justify-center group"
              >
                <Plus className="h-6 w-6 shrink-0 stroke-[3px] group-hover:scale-110 transition-transform" />
              </Button>
            </div>
            <div className={cn(
              "flex-1 pr-6 transition-all duration-300 overflow-hidden",
              isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
            )}>
              <Button 
                onClick={onLogDeal}
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black rounded-xl py-4 shadow-glow glow-primary transition-all flex items-center justify-center whitespace-nowrap"
              >
                <span className="tracking-widest uppercase truncate whitespace-nowrap">+ Log Deal</span>
              </Button>
            </div>
          </div>
          
          <div className="h-12 shrink-0" />
        </div>
      </div>

      {/* Account & Footer Area (Pinned) */}
      <div className="mt-auto border-t border-white/5 bg-bg-deep/80 backdrop-blur-sm z-10 py-6">
        {/* User Card */}
        <div className="flex items-center w-full mb-2 group relative">
          {/* Rail side: Avatar */}
          <div className="w-20 shrink-0 flex items-center justify-center relative">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0 transition-transform group-hover:scale-105">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
              ) : (
                profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
              )}
            </div>
            
            {/* StripeItTierBadgeSystem - Collapsed Overlay */}
            {isCollapsed && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <TierBadge tier={tierOverride || profile?.subscriptionTier} isCollapsed={isCollapsed} />
              </div>
            )}
          </div>

          {/* Content side: Name & Role */}
          <div className={cn(
            "flex-1 min-w-0 pr-6 transition-all duration-300 overflow-hidden",
            isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
          )}>
            <div className="bg-bg-card/50 border border-white/5 rounded-2xl p-4 transition-all whitespace-nowrap">
              <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 whitespace-nowrap">
                {profile?.displayName || 'User'}
              </Typography>
              <div className="flex items-center gap-2 opacity-80 overflow-hidden whitespace-nowrap">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#22C55E] shrink-0" />
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-[0.1em] truncate whitespace-nowrap">
                  {profile?.role || 'Sales'}
                </Typography>
                <TierBadge tier={tierOverride || profile?.subscriptionTier} />
              </div>
            </div>
          </div>
        </div>

        {/* Logout / Exit */}
        <div className="flex flex-col gap-1">
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Exit Vault" : undefined}
            className="w-full group hover:bg-white/[0.02] transition-colors rounded-xl py-3.5"
          >
            <div className="flex items-center w-full">
              <div className="w-20 shrink-0 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-slate-600 group-hover:text-brand-primary transition-colors" />
              </div>
              <div className={cn(
                "flex-1 pr-6 text-left transition-all duration-300 overflow-hidden",
                isCollapsed ? "opacity-0 invisible w-0" : "opacity-100 visible w-full"
              )}>
                <span className="text-sm font-extrabold text-slate-500 group-hover:text-white uppercase tracking-widest whitespace-nowrap">Exit Vault</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};
