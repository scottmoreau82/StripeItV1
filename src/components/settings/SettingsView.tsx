import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '@/src/lib/utils';
import { 
  User, 
  Shield, 
  Building2, 
  LogOut,
  CreditCard,
  Target,
  Sparkles,
  MessageSquarePlus,
  Bug,
  Lightbulb,
  ShieldCheck,
  Sun,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, SubscriptionTier, IconTheme } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';
import { AppIcon } from '../ui/AppIcon';
import { PageHeader } from '../ui/PageHeader';
import { Settings } from 'lucide-react';

import { useTheme } from '@/src/contexts/ThemeContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { stripeService } from '@/src/services/stripeService';

import { useResponsive } from '@/src/hooks/useResponsive';

/**
 * StripeItSettingsSystem
 * Master settings foundation with polished, futuristic UI.
 */

interface SettingsViewProps {
  profile: UserProfile | null;
  onLogout: () => void;
}

const ThemePanel = ({ profile, isMobile }: { profile: UserProfile | null; isMobile?: boolean }) => {
  const { updateProfileData, addToast } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const currentIconTheme = profile?.preferences?.iconTheme || IconTheme.LUCIDE;
  const isFreeTier = profile?.subscriptionTier === SubscriptionTier.FREE;

  const handleIconThemeChange = async (newTheme: IconTheme) => {
    if (isFreeTier) {
      addToast('Upgrade to Pro or higher to change icon themes.', 'info');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProfileData({
        preferences: {
          ...profile?.preferences,
          theme: profile?.preferences?.theme || 'dark', // ensure required field
          notifications: profile?.preferences?.notifications || {
            dealReminders: true,
            goalAlerts: true,
            managerAnnouncements: true,
            competitionNotifications: true,
            payoutAlerts: true
          },
          display: profile?.preferences?.display || {
            showMetricsByDefault: true,
            currencySymbol: '$',
            compactMode: false
          },
          iconTheme: newTheme
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleButtonShapeChange = async (newShape: 'standard' | 'parallelogram') => {
    setIsSaving(true);
    try {
      await updateProfileData({
        preferences: {
          ...profile?.preferences,
          theme: profile?.preferences?.theme || 'dark', // ensure required field
          notifications: profile?.preferences?.notifications || {
            dealReminders: true,
            goalAlerts: true,
            managerAnnouncements: true,
            competitionNotifications: true,
            payoutAlerts: true
          },
          display: profile?.preferences?.display || {
            showMetricsByDefault: true,
            currencySymbol: '$',
            compactMode: false
          },
          buttonShape: newShape
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Global Theme</Typography>
      
      <Card className={cn("bg-bg-card/20 border-white/5", isMobile ? "p-4 space-y-6" : "p-8 space-y-8")}>
        <div className={cn("grid grid-cols-1 gap-8", !isMobile && "md:grid-cols-2")}>
          <div className="space-y-8">
            {/* Appearance Toggle */}
            <div className={cn("space-y-4", isMobile ? "space-y-3" : "")}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0 border border-brand-primary/20">
                    <Sun className="text-brand-primary" size={20} />
                  </div>
                  <div>
                    <Typography variant="label" className="text-[var(--color-text-primary)] block text-sm">APPEARANCE</Typography>
                    <Typography variant="small" className="text-slate-500 text-[10px]">DARK / LIGHT THEME</Typography>
                  </div>
                </div>

                <div className="flex bg-bg-deep p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                      theme === 'dark' 
                        ? "bg-brand-primary text-bg-deep shadow-glow glow-primary" 
                        : "text-slate-500 hover:text-white bg-transparent"
                    )}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('light')}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer",
                      theme === 'light' 
                        ? "bg-brand-primary text-bg-deep shadow-glow glow-primary" 
                        : "text-slate-500 hover:text-white bg-transparent"
                    )}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>

            <div className={cn("space-y-4", isMobile ? "space-y-3" : "")}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <AppIcon name="sparkles" className="text-brand-primary" />
                </div>
                <div>
                  <Typography variant="label" className="text-[var(--color-text-primary)] block text-sm">Icon Pack</Typography>
                  <Typography variant="small" className="text-slate-500 text-[10px]">Choose your interface symbols</Typography>
                </div>
              </div>

              <div className="space-y-2">
                <select
                  value={currentIconTheme}
                  onChange={(e) => handleIconThemeChange(e.target.value as IconTheme)}
                  disabled={isSaving}
                  className={cn(
                    "w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer",
                    isFreeTier && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <option value={IconTheme.LUCIDE}>Lucide (Default)</option>
                  <option value={IconTheme.PHOSPHOR}>Phosphor icons</option>
                  <option value={IconTheme.TABLER}>Tabler icons</option>
                  <option value={IconTheme.HEROICONS}>Heroicons (v2)</option>
                </select>
                
                {isFreeTier && (
                  <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-xl flex items-center gap-2">
                    <AppIcon name="lock" size={12} className="text-brand-primary" />
                    <Typography variant="small" className="text-[10px] text-brand-primary font-bold uppercase tracking-widest leading-none">
                      PRO+ EXCLUSIVE
                    </Typography>
                  </div>
                )}
              </div>
            </div>

            {/* Button Geometry */}
            <div className={cn("space-y-4", isMobile ? "space-y-3" : "")}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  <Target className="text-brand-primary" size={20} />
                </div>
                <div>
                  <Typography variant="label" className="text-[var(--color-text-primary)] block text-sm">Button Geometry</Typography>
                  <Typography variant="small" className="text-slate-500 text-[10px]">Choose your tactical silhouette</Typography>
                </div>
              </div>

              <div className="space-y-2">
                <select
                  value={profile?.preferences?.buttonShape || 'standard'}
                  onChange={(e) => handleButtonShapeChange(e.target.value as any)}
                  disabled={isSaving}
                  className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="standard">Standard (Default)</option>
                  <option value="parallelogram">Parallelogram</option>
                </select>
              </div>
            </div>
          </div>

          <div className={cn("bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-center gap-4", isMobile ? "p-4" : "p-6")}>
             <Typography variant="small" className="text-slate-500 uppercase tracking-widest font-black text-[9px] mb-1">Visual Preview</Typography>
             <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-1.5">
                   <div className={cn("rounded-lg bg-white/5 flex items-center justify-center", isMobile ? "h-8 w-8" : "h-10 w-10")}>
                      <AppIcon name="dashboard" size={isMobile ? 20 : 24} />
                   </div>
                   <Typography variant="mono" className="text-[7px] text-slate-500 uppercase">Home</Typography>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                   <div className={cn("rounded-lg bg-white/5 flex items-center justify-center", isMobile ? "h-8 w-8" : "h-10 w-10")}>
                      <AppIcon name="salesLog" size={isMobile ? 20 : 24} />
                   </div>
                   <Typography variant="mono" className="text-[7px] text-slate-500 uppercase">Log</Typography>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                   <div className={cn("rounded-lg bg-white/5 flex items-center justify-center", isMobile ? "h-8 w-8" : "h-10 w-10")}>
                      <AppIcon name="settings" size={isMobile ? 20 : 24} />
                   </div>
                   <Typography variant="mono" className="text-[7px] text-slate-500 uppercase">Config</Typography>
                </div>
             </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

type SettingsSection = 'profile' | 'account' | 'organization' | 'feedback' | 'admin' | 'developer';

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onLogout }) => {
  const { isAdmin } = useAuth();
  const { isMobile } = useResponsive();
  const [successMsg, setSuccessMsg] = useState('');

  const [profileOpen, setProfileOpen] = useState(true);
  const [themeOpen, setThemeOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const SectionHeader = ({
    label,
    isOpen,
    onToggle
  }: {
    label: string;
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    isMobile ? (
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-3 px-1 border-b border-white/5 text-left group mb-4"
      >
        <Typography variant="mono" className="text-[11px] text-slate-400 uppercase font-black tracking-widest group-hover:text-white transition-colors">
          {label}
        </Typography>
        {isOpen
          ? <ChevronUp size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
          : <ChevronDown size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
        }
      </button>
    ) : null
  );

  const header = (
    <PageHeader
      title="Settings"
      subtitle="Account oversight • system preferences"
      icon={Settings}
    />
  );

  const mainContent = (
    <div className={cn("max-w-4xl mx-auto pb-44", isMobile ? "space-y-12" : "space-y-20")}>
      <section id="profile" className="scroll-mt-24">
        <SectionHeader
          label="Profile"
          isOpen={profileOpen}
          onToggle={() => setProfileOpen(p => !p)}
        />
        {isMobile ? (
          <AnimatePresence initial={false}>
            {profileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ProfilePanel profile={profile} isMobile={isMobile} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <ProfilePanel profile={profile} isMobile={isMobile} />
        )}
      </section>
      
      <section id="theme" className="scroll-mt-24">
        <SectionHeader
          label="Appearance"
          isOpen={themeOpen}
          onToggle={() => setThemeOpen(p => !p)}
        />
        {isMobile ? (
          <AnimatePresence initial={false}>
            {themeOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ThemePanel profile={profile} isMobile={isMobile} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <ThemePanel profile={profile} isMobile={isMobile} />
        )}
      </section>

      <section id="organization-access" className="scroll-mt-24">
        <SectionHeader
          label="Organization"
          isOpen={orgOpen}
          onToggle={() => setOrgOpen(p => !p)}
        />
        {isMobile ? (
          <AnimatePresence initial={false}>
            {orgOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <OrganizationAccessPanel profile={profile} isMobile={isMobile} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <OrganizationAccessPanel profile={profile} isMobile={isMobile} />
        )}
      </section>

      <section id="membership" className="scroll-mt-24">
        <SectionHeader
          label="Membership"
          isOpen={membershipOpen}
          onToggle={() => setMembershipOpen(p => !p)}
        />
        {isMobile ? (
          <AnimatePresence initial={false}>
            {membershipOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <MembershipPanel profile={profile} isMobile={isMobile} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <MembershipPanel profile={profile} isMobile={isMobile} />
        )}
      </section>

      {isAdmin && (
        <>
          <section id="admin" className="scroll-mt-24">
            <SectionHeader
              label="Admin"
              isOpen={adminOpen}
              onToggle={() => setAdminOpen(p => !p)}
            />
            {isMobile ? (
              <AnimatePresence initial={false}>
                {adminOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <AdminPanel isMobile={isMobile} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <AdminPanel isMobile={isMobile} />
            )}
          </section>

          <section id="developer" className="scroll-mt-24">
            <SectionHeader
              label="Developer"
              isOpen={devOpen}
              onToggle={() => setDevOpen(p => !p)}
            />
            {isMobile ? (
              <AnimatePresence initial={false}>
                {devOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <DeveloperPanel isMobile={isMobile} />
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <DeveloperPanel isMobile={isMobile} />
            )}
          </section>
        </>
      )}

      <section id="account" className="scroll-mt-24">
        <SectionHeader
          label="Account"
          isOpen={accountOpen}
          onToggle={() => setAccountOpen(p => !p)}
        />
        {isMobile ? (
          <AnimatePresence initial={false}>
            {accountOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <AccountPanel profile={profile} isMobile={isMobile} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <AccountPanel profile={profile} isMobile={isMobile} />
        )}
      </section>

      <section className="scroll-mt-24">
        <div className={cn(
          "pt-8 border-t border-white/5",
          isMobile ? "pt-6" : "pt-8"
        )}>
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center justify-center gap-3 rounded-2xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-black uppercase tracking-widest transition-all active:scale-95",
              isMobile ? "h-14 text-[10px]" : "h-12 text-[10px]"
            )}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </section>

      {/* Quick Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-emerald-500 text-white font-black shadow-lg z-50"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};

const OrganizationAccessPanel = ({ profile, isMobile }: { profile: UserProfile | null, isMobile?: boolean }) => {
  const isDealer = profile?.subscriptionTier === SubscriptionTier.ORGANIZATION;
  const isAlreadyManaged = (profile?.orgId && profile.role !== UserRole.SALES) || false;

  if (isDealer && isAlreadyManaged) return null;

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Organization Access</Typography>
      
      <div className="space-y-6">
        <DealerProgressionPanel profile={profile} isMobile={isMobile} hideTitle />
        <JoinDealershipPanel profile={profile} isMobile={isMobile} hideTitle />
      </div>
    </div>
  );
};

const DealerProgressionPanel = ({ profile, isMobile, hideTitle }: { profile: UserProfile | null; isMobile?: boolean; hideTitle?: boolean }) => {
  const navigate = useNavigate();
  const isDealer = profile?.subscriptionTier === SubscriptionTier.ORGANIZATION;

  if (isDealer) return null;

  const card = (
    <Card className={cn("bg-brand-primary/[0.03] border-brand-primary/10 overflow-hidden relative group transition-all duration-500 hover:border-brand-primary/30", isMobile ? "p-4" : "p-10")}>
      <div className="absolute -right-20 -top-20 h-64 w-64 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
              <Building2 size={20} />
            </div>
            <Typography variant="mono" className="text-[10px] text-brand-primary uppercase font-black tracking-[0.3em]">Operational Scaling</Typography>
          </div>
          
          <div className="space-y-2">
            <Typography variant="h2" className={cn("text-[var(--color-text-primary)] italic font-black uppercase tracking-tighter leading-none", isMobile ? "text-xl" : "text-4xl")}>
              Upgrade to Dealership
            </Typography>
            <Typography variant="p" className={cn("text-slate-400 leading-relaxed", isMobile ? "text-xs" : "text-sm")}>
              Connect your entire floor to the StripeIt ecosystem. Unlock dealership-wide logs, manager governance, and real-time dealer performance telemetry.
            </Typography>
          </div>
        </div>

        <Button 
          onClick={() => navigate('/dealer/request')}
          className={cn(
            "bg-white/5 hover:bg-brand-primary hover:text-bg-deep text-white font-black uppercase tracking-widest italic border border-white/10 transition-all rounded-2xl group",
            isMobile ? "w-full h-11 text-xs" : "px-12 h-16 text-sm"
          )}
        >
          Request Access
        </Button>
      </div>
    </Card>
  );

  if (hideTitle) return card;

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Progression</Typography>
      {card}
    </div>
  );
};

const JoinDealershipPanel = ({ profile, isMobile, hideTitle }: { profile: UserProfile | null; isMobile?: boolean; hideTitle?: boolean }) => {
  const { addToast } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAlreadyManaged = (profile?.orgId && profile.role !== UserRole.SALES) || false;

  if (isAlreadyManaged) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !profile) return;

    setIsSubmitting(true);
    try {
      const { joinCodeService } = await import('@/src/services/joinCodeService');
      const { dealerName } = await joinCodeService.redeemJoinCode(code, profile);
      
      addToast(`You have joined ${dealerName} as a Manager.`, 'success');
      // Refresh page or update state to reflect new role/org
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      addToast(error.message || 'Unable to join this dealership.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const card = (
    <Card className={cn("bg-indigo-500/5 border-indigo-500/10 overflow-hidden relative group transition-all duration-500 hover:border-indigo-500/30", isMobile ? "p-4" : "p-10")}>
      <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck size={20} />
            </div>
            <Typography variant="mono" className="text-[10px] text-indigo-400 uppercase font-black tracking-[0.3em]">Institutional Verification</Typography>
          </div>
          
          <div className="space-y-2">
            <Typography variant="h2" className={cn("text-[var(--color-text-primary)] italic font-black uppercase tracking-tighter leading-none", isMobile ? "text-xl" : "text-4xl")}>
              Join Dealership
            </Typography>
            <Typography variant="p" className={cn("text-slate-400 leading-relaxed", isMobile ? "text-xs" : "text-sm")}>
              Elevate your account to Manager by entering a secure join code provided by your dealership administrator.
            </Typography>
          </div>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3 min-w-[240px]">
          <Input 
            placeholder="ENTER JOIN CODE"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={cn("bg-[var(--color-bg-card)] border-[var(--color-border)] text-center font-mono font-black tracking-[0.2em] uppercase text-[var(--color-text-primary)]", isMobile ? "h-11" : "h-14")}
            required
          />
          <Button 
            type="submit"
            isLoading={isSubmitting}
            className={cn(
              "bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest italic transition-all rounded-2xl",
              isMobile ? "w-full h-11 text-xs" : "h-14 text-sm"
            )}
          >
            Verify & Join
          </Button>
        </form>
      </div>
    </Card>
  );

  if (hideTitle) return card;

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Onboarding</Typography>
      {card}
    </div>
  );
};

const FeedbackPanel = () => {
  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-[var(--color-text-primary)] font-black uppercase tracking-tight italic">Support & Feedback</Typography>
      <Card className="p-8 bg-bg-card/20 border-white/5 space-y-8">
        <Typography variant="p" className="text-slate-400">
          Encountered an issue or have a vision for a new tool? Use the modules below to transmit your report directly to the engineering team.
        </Typography>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Button 
            className="h-20 bg-rose-500/5 border border-rose-500/10 text-rose-500 font-extrabold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-rose-500/10 transition-all rounded-2xl group shadow-sm"
            onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-feedback', { detail: { type: 'bug' } }))}
           >
             <Bug className="h-5 w-5 group-hover:scale-110 transition-transform" />
             Report Bug
           </Button>
           <Button 
            className="h-20 bg-brand-primary/5 border border-brand-primary/10 text-brand-primary font-extrabold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-brand-primary/10 transition-all rounded-2xl group shadow-sm"
            onClick={() => window.dispatchEvent(new CustomEvent('stripeit:open-feedback', { detail: { type: 'feature' } }))}
           >
             <Lightbulb className="h-5 w-5 group-hover:scale-110 transition-transform" />
             Request Feature
           </Button>
        </div>
      </Card>
    </div>
  );
};

const AdminPanel = ({ isMobile }: { isMobile?: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Admin Tools</Typography>
      
      <div className={cn("grid grid-cols-1 gap-6", !isMobile && "md:grid-cols-2")}>
        <Card className={cn("bg-brand-primary/5 border border-brand-primary/10 flex flex-col justify-between shadow-glow-sm glow-primary/5", isMobile ? "p-4 space-y-4" : "p-8 space-y-6")}>
          <div className="space-y-2">
            <div className={cn("rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
              <MessageSquarePlus className={cn("text-brand-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <Typography variant="h4" className={cn("text-[var(--color-text-primary)]", isMobile ? "text-base" : "")}>Feedback Review</Typography>
            <Typography variant="small" className={cn("text-slate-400 block pb-4", isMobile ? "text-[10px] leading-relaxed" : "")}>
              Monitor, categorize, and respond to incoming bug reports and feature requests from all users.
            </Typography>
          </div>
          <Button 
            onClick={() => navigate('/admin/feedback')}
            className={cn("w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px]", isMobile ? "h-10" : "h-12")}
          >
            Review Feedback
          </Button>
        </Card>

        <Card className={cn("bg-brand-primary/5 border border-brand-primary/10 flex flex-col justify-between shadow-glow-sm glow-primary/5", isMobile ? "p-4 space-y-4" : "p-8 space-y-6")}>
          <div className="space-y-2">
            <div className={cn("rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
              <User className={cn("text-brand-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <Typography variant="h4" className={cn("text-[var(--color-text-primary)]", isMobile ? "text-base" : "")}>User Management</Typography>
            <Typography variant="small" className={cn("text-slate-400 block pb-4", isMobile ? "text-[10px] leading-relaxed" : "")}>
              Manage accounts, adjust subscription tiers, and control permissions across your entire organization.
            </Typography>
          </div>
          <Button 
            onClick={() => navigate('/admin/users')}
            className={cn("w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px]", isMobile ? "h-10" : "h-12")}
          >
            Manage Users
          </Button>
        </Card>
      </div>

      <Card className={cn("bg-amber-500/5 border border-amber-500/10 flex items-center gap-4", isMobile ? "p-4" : "p-6")}>
        <ShieldCheck className={cn("text-amber-500 shrink-0", isMobile ? "h-4 w-4" : "h-5 w-5")} />
        <Typography variant="small" className={cn("text-amber-500/80 font-bold", isMobile ? "text-[9px]" : "")}>
          Admin Access Active. You have unrestricted access to system-level tools and feedback databases.
        </Typography>
      </Card>
    </div>
  );
};

const DeveloperPanel = ({ isMobile }: { isMobile?: boolean }) => {
  const { profile, tierOverride, setTierOverride } = useAuth();
  
  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Developer Tools</Typography>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Tier Override */}
        <Card className={cn("bg-bg-card/40 border-white/5 flex flex-col", isMobile ? "p-4 space-y-4" : "p-8 space-y-6")}>
          <div className={cn("flex items-center gap-4 mb-2", isMobile ? "gap-3 mb-0" : "")}>
            <div className={cn("rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
              <Sparkles className={cn("text-brand-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <div>
              <Typography variant="h4" className={cn("text-[var(--color-text-primary)]", isMobile ? "text-base leading-tight" : "")}>Dev Tier Override</Typography>
              <Typography variant="small" className={cn("text-slate-500 block", isMobile ? "text-[10px]" : "")}>Simulate subscription tiers</Typography>
            </div>
          </div>

          <div className={cn("space-y-4", isMobile ? "space-y-3" : "")}>
            <select
              value={tierOverride || profile?.subscriptionTier || ''}
              onChange={(e) => setTierOverride(e.target.value as SubscriptionTier || null)}
              className="w-full bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
            >
              <option value="">Default ({profile?.subscriptionTier === SubscriptionTier.ORGANIZATION ? 'Dealer' : profile?.subscriptionTier})</option>
              {Object.values(SubscriptionTier).map((tier) => (
                <option key={tier} value={tier}>
                  {tier === SubscriptionTier.ORGANIZATION ? 'Dealer' : tier}
                </option>
              ))}
            </select>
            
            <div className={cn("bg-brand-primary/5 border border-brand-primary/10 rounded-2xl", isMobile ? "p-3" : "p-4")}>
              <Typography variant="small" className={cn("text-brand-primary/80 font-bold block leading-relaxed", isMobile ? "text-[11px]" : "")}>
                Active Tier: <span className="text-[var(--color-text-primary)]">{tierOverride || profile?.subscriptionTier || 'Free'}</span>
              </Typography>
              <Typography variant="small" className="text-slate-500 block mt-1 text-[10px]">
                {isMobile ? "Session-based effect only." : "This effect is session-based and does not affect production billing."}
              </Typography>
            </div>
          </div>
        </Card>
      </div>

      <Card className={cn("bg-brand-primary/5 border border-brand-primary/10 flex items-center gap-4", isMobile ? "p-4" : "p-6")}>
        <Bug className={cn("text-brand-primary shrink-0", isMobile ? "h-4 w-4" : "h-5 w-5")} />
        <Typography variant="small" className={cn("text-brand-primary/80 font-bold", isMobile ? "text-[9px]" : "")}>
          Developer Mode Active. Restricted to system owners.
        </Typography>
      </Card>
    </div>
  );
};

/* --- Sub-Panels --- */

const ProfilePanel = ({ profile, isMobile }: { profile: UserProfile | null, isMobile?: boolean }) => {
  const { updateProfileData } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = displayName.trim();
    if (!trimmedName) return;
    
    setIsSaving(true);
    try {
      await updateProfileData({ displayName: trimmedName });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Card className={cn("bg-bg-card/20 border-white/5", isMobile ? "p-4 space-y-6" : "p-8 space-y-8")}>
        <div className={cn("flex items-center", isMobile ? "gap-4" : "gap-8")}>
          <div className={cn(
            "rounded-[1.5rem] bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center relative group overflow-hidden shrink-0",
            isMobile ? "h-16 w-16" : "h-24 w-24 rounded-[2rem]"
          )}>
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className={cn("text-brand-primary", isMobile ? "h-7 w-7" : "h-10 w-10")} />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Typography variant="mono" className="text-[10px] text-white uppercase font-black">Edit</Typography>
            </div>
          </div>
          <div className="space-y-0.5 min-w-0">
            <Typography variant="h2" className={cn("text-[var(--color-text-primary)] leading-none truncate", isMobile ? "text-lg" : "")}>{profile?.displayName}</Typography>
            <Typography variant="p" className={cn("text-slate-500 font-bold truncate", isMobile ? "text-[11px]" : "")}>{profile?.email}</Typography>
            <div className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest text-brand-primary">
              {profile?.role}
            </div>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2 pt-6 border-t border-white/5", isMobile ? "gap-4" : "gap-6")}>
          <div className="space-y-1.5">
            <Typography variant="label" className="text-slate-500 ml-1 text-[10px] uppercase font-black tracking-widest opacity-70">Display Name</Typography>
            <Input 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name..."
              className="bg-[var(--color-bg-card)] border-[var(--color-border)] h-11 text-[var(--color-text-primary)]" 
            />
          </div>
          <div className="space-y-1.5">
            <Typography variant="label" className="text-slate-500 ml-1 text-[10px] uppercase font-black tracking-widest opacity-70">Email Address</Typography>
            <Input defaultValue={profile?.email} disabled className="bg-[var(--color-bg-card)] border-[var(--color-border)] opacity-50 h-11 truncate text-[var(--color-text-primary)]" />
          </div>
        </div>
        
        <div className={isMobile ? "pt-2" : ""}>
          <Button 
            onClick={handleSave}
            isLoading={isSaving}
            disabled={isSaving || !displayName.trim()}
            className={cn(
              "bg-brand-primary text-bg-deep font-black uppercase tracking-[0.2em]",
              isMobile ? "w-full h-12 text-[10px]" : "px-10"
            )}
          >
            Save Profile
          </Button>
        </div>
      </Card>
    </div>
  );
};

const AccountPanel = ({ profile: propProfile, isMobile }: { profile: UserProfile | null, isMobile?: boolean }) => {
  const { profile } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleManage = async () => {
    if (!profile?.uid || !profile?.email) return;
    setIsUpgrading(true);
    try {
      await stripeService.createCheckoutSession(profile.uid, profile.email);
    } catch (err) {
      console.error('Upgrade error:', err);
      setIsUpgrading(false);
    }
  };

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Account Security</Typography>
      
      <div className={cn("grid grid-cols-1", isMobile ? "gap-4" : "gap-6")}>
        <Card className={cn("bg-bg-card/20 border-white/5 flex items-center justify-between", isMobile ? "p-4" : "p-8")}>
          <div className={cn("flex items-center", isMobile ? "gap-4" : "gap-6")}>
            <div className={cn("rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0", isMobile ? "h-10 w-10" : "h-12 w-12")}>
              <Shield className={cn("text-amber-500", isMobile ? "h-5 w-5" : "h-6 w-6")} />
            </div>
            <div>
              <Typography variant="label" className="text-[var(--color-text-primary)] block text-sm">Password</Typography>
              <Typography variant="small" className="text-slate-500 text-[10px]">Last changed 4 months ago</Typography>
            </div>
          </div>
          <Button variant="secondary" className={cn("bg-white/5 border-white/10", isMobile ? "text-[10px] px-3 h-8" : "text-xs px-6")}>Change</Button>
        </Card>

        <Card className={cn("bg-bg-card/20 border-white/5 flex items-center justify-between", isMobile ? "p-4" : "p-8")}>
          <div className={cn("flex items-center", isMobile ? "gap-4" : "gap-6")}>
            <div className={cn("rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0", isMobile ? "h-10 w-10" : "h-12 w-12")}>
              <CreditCard className={cn("text-brand-primary", isMobile ? "h-5 w-5" : "h-6 w-6")} />
            </div>
            <div>
              <Typography variant="label" className="text-[var(--color-text-primary)] block text-sm">Subscription</Typography>
              <Typography variant="small" className="text-brand-primary font-bold text-[10px]">Tier: {profile?.subscriptionTier.toUpperCase()}</Typography>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleManage}
            disabled={isUpgrading}
            className={cn("font-black uppercase tracking-widest disabled:opacity-50", isMobile ? "text-[8px] px-3 h-8" : "text-[10px] px-6 h-10")}
          >
            {isUpgrading ? 'Redirecting...' : 'Manage'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

const MembershipPanel = ({ profile, isMobile }: { profile: UserProfile | null, isMobile?: boolean }) => {
  const navigate = useNavigate();
  if (!profile) return null;

  const isFrozen = profile.isFrozen;
  const isPreviouslyFrozen = !!profile.suspensionAcknowledgedAt;
  const isManager = [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN, UserRole.DEALER_OWNER].includes(profile.role);
  const isInDealerOrg = profile.subscriptionTier === SubscriptionTier.ORGANIZATION;

  // If not a manager, not frozen, and not previously frozen, don't show the panel
  // Unless they have an orgName that isn't Personal
  const isPersonalOrg = profile.orgId?.startsWith('PERSONAL-');
  
  if (!isManager && !isFrozen && !isPreviouslyFrozen && isPersonalOrg) return null;

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-[var(--color-text-primary)] font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>
        {isFrozen || isPreviouslyFrozen ? 'Membership History' : 'Dealership / Org'}
      </Typography>
      
      <Card className={cn("bg-bg-card/20 border-white/5", isMobile ? "p-4 space-y-6" : "p-8 space-y-8")}>
        <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8")}>
          <div className={cn("rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0", isMobile ? "h-12 w-12" : "h-20 w-20 rounded-3xl")}>
            <Building2 className={cn("text-slate-400", isMobile ? "h-6 w-6" : "h-10 w-10")} />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <Typography variant="h2" className={cn("text-[var(--color-text-primary)] leading-none truncate font-black italic uppercase", isMobile ? "text-lg" : "text-3xl")}>
              {profile.orgName || (isPersonalOrg ? 'Personal Workspace' : 'Dealership Partner')}
            </Typography>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className={cn(
                "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border",
                isFrozen ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}>
                {isFrozen ? 'Suspended' : 'Active Member'}
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                Tier: {profile.subscriptionTier.toUpperCase()}
              </div>
              {profile.suspensionAcknowledgedAt && (
                <div className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500">
                  Ack: {new Date(profile.suspensionAcknowledgedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {(isFrozen || isPreviouslyFrozen) && (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
            <Typography variant="label" className="text-slate-500 text-[9px] uppercase font-black tracking-widest block">System Status Note</Typography>
            <Typography variant="p" className="text-slate-400 text-xs leading-relaxed">
              Your connection to <span className="text-[var(--color-text-primary)] font-bold">{profile.orgName || 'your dealership'}</span> is currently <span className="text-rose-400 font-bold">inactive</span>. 
              You have been reverted to your personal StripeIt toolkit to ensure continuous operation of your individual deal logging and commissions.
            </Typography>
          </div>
        )}

        {isManager && !isFrozen && (
          <div className={cn("pt-6 space-y-4 border-t border-white/5", isMobile ? "pt-4" : "")}>
            <Typography variant="label" className="text-brand-primary block uppercase tracking-widest text-[9px] font-black">Management Controls</Typography>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button 
                variant="secondary" 
                className={cn("w-full bg-brand-primary text-bg-deep border-none font-black uppercase tracking-widest", isMobile ? "text-[10px] h-10" : "text-[11px] h-11")}
                onClick={() => navigate(isInDealerOrg ? '/dealer/users' : '/admin/users')}
              >
                Manage Team
              </Button>
              <Button 
                variant="secondary" 
                className={cn("w-full bg-white/5 border-white/10 text-[var(--color-text-primary)] font-bold uppercase tracking-widest", isMobile ? "text-[10px] h-10" : "text-[11px] h-11")}
                onClick={() => navigate(isInDealerOrg ? '/dealer/settings' : '/settings')}
              >
                Org Settings
              </Button>
              <Button 
                variant="secondary" 
                className={cn("w-full bg-white/5 border-white/10 text-[var(--color-text-primary)] font-bold uppercase tracking-widest", isMobile ? "text-[10px] h-10" : "text-[11px] h-11")}
                onClick={() => navigate(isInDealerOrg ? '/dealer/log-builder' : '/')}
              >
                Log Builder
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

