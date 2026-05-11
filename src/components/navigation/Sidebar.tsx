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
  Target, 
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
import { randomDealService } from '@/src/services/randomDealService';
import { ComingSoonIndicator } from '../ui/ComingSoonIndicator';
import { Feature, featureAccessService } from '@/src/services/featureAccessService';
import { SubscriptionTier } from '@/src/types';

import { navigationConfig } from './NavigationItems';

/**
 * StripeItSidebarSystem
 * Premium navigation system matching the futuristic SaaS visual target.
 */
interface SidebarProps {
  onLogDeal?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TierBadge: React.FC<{ tier?: SubscriptionTier; isCollapsed?: boolean }> = ({ tier, isCollapsed }) => {
  const getTierStyles = (t?: SubscriptionTier) => {
    switch (t) {
      case SubscriptionTier.BASIC:
        return "bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-[0_0_10px_rgba(0,242,255,0.15)]";
      case SubscriptionTier.PRO:
        return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20 shadow-[0_0_10px_rgba(168,85,247,0.15)]";
      case SubscriptionTier.ORGANIZATION:
        return "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]";
      case SubscriptionTier.FREE:
      default:
        return "bg-slate-500/10 text-slate-500 border-white/5";
    }
  };

  const label = tier === SubscriptionTier.ORGANIZATION ? 'Dealer' : (tier || 'Free');

  if (isCollapsed) {
    return (
      <div 
        className={cn(
          "w-6 h-6 rounded-full border flex items-center justify-center text-[8px] font-black uppercase transition-all shrink-0",
          getTierStyles(tier)
        )}
        title={label}
      >
        {label.charAt(0)}
      </div>
    );
  }

  return (
    <div className={cn(
      "px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-[0.15em] transition-all shrink-0",
      getTierStyles(tier)
    )}>
      {label}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onLogDeal, isCollapsed, onToggleCollapse }) => {
  const { profile, user, tierOverride, setTierOverride } = useAuth();
  const location = useLocation();
  const [isEditMode, setIsEditMode] = React.useState(false);

  const developerEmail = 'scottmoreau82@gmail.com';
  const isDeveloper = user?.email?.toLowerCase() === developerEmail.toLowerCase();

  const handleLogout = async () => {
    try {
      await auth.signOut();
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
    <aside className={cn(
      "hidden h-screen flex-col border-r border-white/5 bg-bg-deep lg:flex sticky top-0 shrink-0 transition-all duration-300 ease-in-out z-30",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Identity / Top Area (Pinned) */}
      <div className={cn(
        "flex flex-col gap-8 transition-all p-6 pb-4",
        isCollapsed && "p-4 items-center"
      )}>
        <div className="flex items-center justify-between w-full">
          <Link to="/" className={cn("flex items-center gap-3 transition-all", isCollapsed && "gap-0")}>
            <div className="h-10 w-10 min-w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary shrink-0">
              <TrendingUp className="text-white h-6 w-6" />
            </div>
            {!isCollapsed && (
              <Typography variant="h3" className="font-display font-black italic text-white tracking-tighter uppercase whitespace-nowrap overflow-hidden">
                StripeIt
              </Typography>
            )}
          </Link>
          {!isCollapsed && onToggleCollapse && (
            <button 
              onClick={onToggleCollapse}
              className="text-slate-600 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
        </div>

        {isCollapsed && onToggleCollapse && (
          <button 
            onClick={onToggleCollapse}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/[0.03] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <Menu className="h-5 w-5 rotate-180" />
          </button>
        )}
      </div>

      {/* Navigation & Action Area (Scrollable) */}
      <div className={cn(
        "flex-1 overflow-y-auto px-6 lg:px-6 custom-scrollbar space-y-8",
        isCollapsed && "px-4"
      )}>
        <nav className="flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            if (item.id === 'feedback') {
              return (
                <button
                  key={item.id}
                  onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-feedback'))}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl py-3.5 transition-all group overflow-hidden text-slate-500 hover:bg-white/[0.02] hover:text-slate-300 w-full text-left",
                    isCollapsed ? "justify-center px-0" : "gap-4 px-4"
                  )}
                >
                  <item.icon className={cn("h-6 w-6 shrink-0 transition-colors", isActive ? "text-brand-primary" : "text-slate-600 group-hover:text-slate-400")} />
                  {!isCollapsed && <span className="font-semibold text-base truncate">{item.label}</span>}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "relative flex items-center rounded-xl py-3.5 transition-all group overflow-hidden",
                  isCollapsed ? "justify-center px-0" : "gap-4 px-4",
                  isActive 
                    ? "bg-white/[0.03] text-brand-primary" 
                    : "text-slate-500 hover:bg-white/[0.02] hover:text-slate-300"
                )}
              >
                {/* Active Indicator Bar */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-[0_0_10px_#00F2FF]" />
                )}
                
                <item.icon className={cn("h-6 w-6 shrink-0", isActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                    <span className="font-semibold text-base truncate">{item.label}</span>
                    {item.featureId && <ComingSoonIndicator featureId={item.featureId} size="sm" />}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Area within Scrollable for better UX with many items */}
        <div className="space-y-3 pb-12">
          <Button 
            onClick={onLogDeal}
            title={isCollapsed ? "Log New Deal" : undefined}
            className={cn(
              "w-full bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black rounded-xl shadow-glow glow-primary transition-all flex items-center justify-center gap-2",
              isCollapsed ? "h-12 w-12 p-0 rounded-full mx-auto" : "py-6"
            )}
          >
            <Plus className={cn("shrink-0 stroke-[3px]", isCollapsed ? "h-5 w-5" : "h-6 w-6")} />
            {!isCollapsed && <span className="tracking-widest uppercase truncate">Log New Deal</span>}
          </Button>
          
          <Button 
            variant="secondary"
            title={isCollapsed ? "Create Random" : undefined}
            className={cn(
              "w-full bg-white/5 border-white/10 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 group transition-all hover:bg-white/10 overflow-hidden",
              isCollapsed ? "h-10 w-10 p-0 rounded-full mx-auto" : "py-4"
            )}
            onClick={() => {
              const randomDeal = randomDealService.generateRandomDeal();
              if (window.confirm(`Create random deal for ${randomDeal.customerName}?`)) {
                window.dispatchEvent(new CustomEvent('stripeit:create-random-deal'));
              }
            }}
          >
            <Target className={cn("shrink-0 text-slate-500 group-hover:text-brand-primary", isCollapsed ? "h-5 w-5" : "h-4 w-4")} />
            {!isCollapsed && <span className="text-[10px] uppercase tracking-widest truncate">Create Random</span>}
          </Button>
        </div>
      </div>

      {/* Account & Footer Area (Pinned) */}
      <div className={cn(
        "mt-auto space-y-4 p-6 pt-6 border-t border-white/5 bg-bg-deep/80 backdrop-blur-sm z-10",
        isCollapsed && "p-4 items-center"
      )}>
        {/* StripeItDeveloperTierOverrideSystem */}
        {isDeveloper && !isCollapsed && (
          <div className="px-4 py-3 bg-brand-primary/[0.03] border border-brand-primary/10 rounded-2xl space-y-2 shadow-glow-sm glow-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-3 w-3 text-brand-primary" />
              <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black tracking-[0.2em]">
                Dev Tier Override
              </Typography>
            </div>
            <select
              value={tierOverride || profile?.subscriptionTier || ''}
              onChange={(e) => setTierOverride(e.target.value as SubscriptionTier || null)}
              className="w-full bg-bg-deep border border-white/10 rounded-lg px-3 py-2 text-[11px] font-bold text-white uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
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

        {/* User Card */}
        <div className={cn(
          "relative bg-bg-card/50 border border-white/5 rounded-2xl flex items-center transition-all overflow-hidden",
          isCollapsed ? "p-2 justify-center" : "p-4 gap-3"
        )}>
          {/* StripeItTierBadgeSystem */}
          <div className={cn(
            "absolute",
            isCollapsed ? "inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100" : "top-2 right-2"
          )}>
            <TierBadge tier={profile?.subscriptionTier} isCollapsed={isCollapsed} />
          </div>

          <div className={cn(
            "rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-white font-bold uppercase overflow-hidden shrink-0",
            isCollapsed ? "h-10 w-10" : "h-10 w-10"
          )} title={isCollapsed ? profile?.displayName : undefined}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || '?'
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <Typography variant="label" className="text-white block font-black truncate uppercase tracking-tight mb-1 pr-12">
                {profile?.displayName || 'User'}
              </Typography>
              <div className="flex items-center gap-2 opacity-80">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#22C55E]" />
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-[0.1em]">
                  {profile?.role || 'Sales'}
                </Typography>
              </div>
            </div>
          )}
        </div>

        {/* Edit Mode Toggle */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-4 py-3 bg-white/[0.01] border border-white/5 rounded-xl">
            <Typography variant="mono" className="text-[11px] text-slate-500 uppercase font-extrabold tracking-wider">Edit Mode</Typography>
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "relative inline-flex h-5 w-10 items-center rounded-full transition-colors",
                isEditMode ? "bg-brand-primary" : "bg-slate-700"
              )}
            >
              <span className={cn(
                "inline-block h-3 w-3 transform rounded-full bg-white transition-transform",
                isEditMode ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        )}

        {/* Logout / Exit */}
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Exit Vault" : undefined}
          className={cn(
            "flex w-full items-center transition-all group uppercase tracking-widest text-slate-500 hover:text-white font-extrabold",
            isCollapsed ? "justify-center p-0 h-10" : "gap-3 rounded-xl px-4 py-3 text-sm"
          )}
        >
          <LogOut className={cn("shrink-0 text-slate-600 group-hover:text-brand-primary transition-colors", isCollapsed ? "h-6 w-6" : "h-5 w-5")} />
          {!isCollapsed && <span>Exit Vault</span>}
        </button>
      </div>
    </aside>
  );
};
