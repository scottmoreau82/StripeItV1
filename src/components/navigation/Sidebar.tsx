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
  ShieldCheck
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
}

export const TierBadge: React.FC<{ tier?: SubscriptionTier }> = ({ tier }) => {
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

  return (
    <div className={cn(
      "px-2 py-0.5 rounded-full border text-[7px] font-black uppercase tracking-[0.15em] transition-all shrink-0",
      getTierStyles(tier)
    )}>
      {tier === SubscriptionTier.ORGANIZATION ? 'Dealer' : (tier || 'Free')}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onLogDeal }) => {
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
    <aside className="hidden h-screen w-72 flex-col border-r border-white/5 bg-bg-deep p-6 lg:flex sticky top-0 shrink-0">
      {/* Brand Identity */}
      <div className="mb-10 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary">
            <TrendingUp className="text-white h-6 w-6" />
          </div>
          <Typography variant="h3" className="font-display font-black italic text-white tracking-tighter uppercase">
            StripeIt
          </Typography>
        </Link>
        <button className="text-slate-600 hover:text-white transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1 mb-8">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "relative flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all group overflow-hidden",
                isActive 
                  ? "bg-white/[0.03] text-brand-primary" 
                  : "text-slate-500 hover:bg-white/[0.02] hover:text-slate-300"
              )}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-brand-primary rounded-r shadow-[0_0_10px_#00F2FF]" />
              )}
              
              <item.icon className={cn("h-6 w-6", isActive ? "text-brand-primary drop-shadow-[0_0_8px_rgba(0,242,255,0.5)]" : "text-slate-600 group-hover:text-slate-400")} />
              <div className="flex-1 flex items-center justify-between gap-2 overflow-hidden">
                <span className="font-semibold text-base truncate">{item.label}</span>
                {item.featureId && <ComingSoonIndicator featureId={item.featureId} size="sm" />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Action Area */}
      <div className="mb-10 space-y-3">
        <Button 
          onClick={onLogDeal}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-bg-deep font-black rounded-xl py-6 shadow-glow glow-primary transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-6 w-6 stroke-[3px]" />
          <span className="tracking-widest uppercase">Log New Deal</span>
        </Button>
        
        <Button 
          variant="secondary"
          className="w-full bg-white/5 border-white/10 text-slate-300 font-bold rounded-xl py-4 flex items-center justify-center gap-2 group transition-all hover:bg-white/10"
          onClick={() => {
            const randomDeal = randomDealService.generateRandomDeal();
            // This relies on the parent providing a way to direct-save a deal or open the form with data
            // For now, I'll assume we can trigger a random create via a new prop or event
            if (window.confirm(`Create random deal for ${randomDeal.customerName}?`)) {
              window.dispatchEvent(new CustomEvent('stripeit:create-random-deal'));
            }
          }}
        >
          <Target className="h-4 w-4 text-slate-500 group-hover:text-brand-primary" />
          <span className="text-[10px] uppercase tracking-widest">Create Random</span>
        </Button>
      </div>

      {/* Account & Footer Area */}
      <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
        {/* StripeItDeveloperTierOverrideSystem */}
        {isDeveloper && (
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
        <div className="relative bg-bg-card/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3 overflow-hidden">
          {/* StripeItTierBadgeSystem */}
          <div className="absolute top-2 right-2">
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
        </div>

        {/* Edit Mode Toggle */}
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

        {/* Logout / Exit */}
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-extrabold text-slate-500 hover:text-white transition-all text-left uppercase tracking-widest group"
        >
          <LogOut className="h-5 w-5 text-slate-600 group-hover:text-brand-primary transition-colors" />
          Exit Vault
        </button>
      </div>
    </aside>
  );
};
