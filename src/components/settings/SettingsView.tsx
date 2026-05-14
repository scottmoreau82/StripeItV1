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
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, SubscriptionTier, IconTheme } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';
import { AppIcon } from '../ui/AppIcon';

import { DashboardLayout } from '../layout/DashboardLayout';

/**
 * StripeItSettingsSystem
 * Master settings foundation with polished, futuristic UI.
 */

interface SettingsViewProps {
  profile: UserProfile | null;
  onLogout: () => void;
  isMobile: boolean;
}

const ThemePanel = ({ profile, isMobile }: { profile: UserProfile | null; isMobile?: boolean }) => {
  const { updateProfileData, addToast } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const currentIconTheme = profile?.preferences?.iconTheme || IconTheme.LUCIDE;
  const isFreeTier = profile?.subscriptionTier === SubscriptionTier.FREE;

  const handleIconThemeChange = async (newTheme: IconTheme) => {
    if (isFreeTier) {
      addToast('Upgrade to Basic or higher to change icon themes.', 'info');
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

  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-white font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Global Theme</Typography>
      
      <Card className={cn("bg-bg-card/20 border-white/5", isMobile ? "p-4 space-y-6" : "p-8 space-y-8")}>
        <div className={cn("grid grid-cols-1 gap-8", !isMobile && "md:grid-cols-2")}>
          <div className={cn("space-y-4", isMobile ? "space-y-3" : "")}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                <AppIcon name="sparkles" className="text-brand-primary" />
              </div>
              <div>
                <Typography variant="label" className="text-white block text-sm">Icon Pack</Typography>
                <Typography variant="small" className="text-slate-500 text-[10px]">Choose your interface symbols</Typography>
              </div>
            </div>

            <div className="space-y-2">
              <select
                value={currentIconTheme}
                onChange={(e) => handleIconThemeChange(e.target.value as IconTheme)}
                disabled={isSaving}
                className={cn(
                  "w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer",
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
                    BASIC+ EXCLUSIVE
                  </Typography>
                </div>
              )}
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

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onLogout, isMobile }) => {
  const { isAdmin } = useAuth();
  const [successMsg, setSuccessMsg] = useState('');

  const header = (
    <div className={cn("flex flex-col", isMobile ? "gap-0.5" : "gap-2")}>
      <Typography 
        variant="h1" 
        className={cn(
          "text-white italic font-black uppercase tracking-tighter",
          isMobile ? "text-xl" : "text-3xl"
        )}
      >
        Settings
      </Typography>
      <Typography 
        variant="p" 
        className={cn(
          "text-slate-500 font-bold",
          isMobile ? "text-[10px] uppercase tracking-widest opacity-60" : "text-sm"
        )}
      >
        Manage your account and preferences
      </Typography>
    </div>
  );

  const mainContent = (
    <div className={cn("max-w-4xl mx-auto pb-44", isMobile ? "space-y-12" : "space-y-20")}>
      <section id="profile" className="scroll-mt-24">
        <ProfilePanel profile={profile} isMobile={isMobile} />
      </section>
      
      <section id="theme" className="scroll-mt-24">
        <ThemePanel profile={profile} isMobile={isMobile} />
      </section>

      {profile?.role && [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN].includes(profile.role) && (
        <section id="organization" className="scroll-mt-24">
          <OrganizationPanel profile={profile} isMobile={isMobile} />
        </section>
      )}

      {isAdmin && (
        <>
          <section id="admin" className="scroll-mt-24">
            <AdminPanel isMobile={isMobile} />
          </section>

          <section id="developer" className="scroll-mt-24">
            <DeveloperPanel isMobile={isMobile} />
          </section>
        </>
      )}

      <section id="account" className="scroll-mt-24">
        <AccountPanel profile={profile} isMobile={isMobile} />
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

const FeedbackPanel = () => {
  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Support & Feedback</Typography>
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
      <Typography variant="h3" className={cn("text-white font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Admin Tools</Typography>
      
      <div className={cn("grid grid-cols-1 gap-6", !isMobile && "md:grid-cols-2")}>
        <Card className={cn("bg-brand-primary/5 border border-brand-primary/10 flex flex-col justify-between shadow-glow-sm glow-primary/5", isMobile ? "p-4 space-y-4" : "p-8 space-y-6")}>
          <div className="space-y-2">
            <div className={cn("rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
              <MessageSquarePlus className={cn("text-brand-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <Typography variant="h4" className={cn("text-white", isMobile ? "text-base" : "")}>Feedback Review</Typography>
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
            <Typography variant="h4" className={cn("text-white", isMobile ? "text-base" : "")}>User Management</Typography>
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
  const { profile, tierOverride, setTierOverride, isEditMode, setIsEditMode } = useAuth();
  
  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-white font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Developer Tools</Typography>
      
      <div className={cn("grid grid-cols-1 gap-6", !isMobile && "md:grid-cols-2")}>
        {/* Tier Override */}
        <Card className={cn("bg-bg-card/40 border-white/5 flex flex-col", isMobile ? "p-4 space-y-4" : "p-8 space-y-6")}>
          <div className={cn("flex items-center gap-4 mb-2", isMobile ? "gap-3 mb-0" : "")}>
            <div className={cn("rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
              <Sparkles className={cn("text-brand-primary", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <div>
              <Typography variant="h4" className={cn("text-white", isMobile ? "text-base leading-tight" : "")}>Dev Tier Override</Typography>
              <Typography variant="small" className={cn("text-slate-500 block", isMobile ? "text-[10px]" : "")}>Simulate subscription tiers</Typography>
            </div>
          </div>

          <div className={cn("space-y-4", isMobile ? "space-y-3" : "")}>
            <select
              value={tierOverride || profile?.subscriptionTier || ''}
              onChange={(e) => setTierOverride(e.target.value as SubscriptionTier || null)}
              className="w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white uppercase tracking-wider focus:outline-none focus:border-brand-primary/50 transition-all appearance-none cursor-pointer"
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
                Active Tier: <span className="text-white">{tierOverride || profile?.subscriptionTier || 'Free'}</span>
              </Typography>
              <Typography variant="small" className="text-slate-500 block mt-1 text-[10px]">
                {isMobile ? "Session-based effect only." : "This effect is session-based and does not affect production billing."}
              </Typography>
            </div>
          </div>
        </Card>

        {/* Edit Mode */}
        <Card className={cn("bg-bg-card/40 border-white/5 flex flex-col", isMobile ? "p-4 space-y-4" : "p-8 space-y-6")}>
          <div className={cn("flex items-center gap-4 mb-2", isMobile ? "gap-3 mb-0" : "")}>
            <div className={cn("rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0", isMobile ? "h-8 w-8" : "h-10 w-10")}>
              <Target className={cn("text-indigo-400", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <div>
              <Typography variant="h4" className={cn("text-white", isMobile ? "text-base leading-tight" : "")}>System Edit Mode</Typography>
              <Typography variant="small" className={cn("text-slate-500 block", isMobile ? "text-[10px]" : "")}>UI & testing overrides</Typography>
            </div>
          </div>

          <div className={cn("flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl", isMobile ? "p-4" : "p-6")}>
            <div className="space-y-1">
              <Typography variant="label" className="text-white text-sm">Status</Typography>
              <Typography variant="small" className={cn(
                "font-black uppercase tracking-widest text-[10px]",
                isEditMode ? "text-brand-primary" : "text-slate-500"
              )}>
                {isEditMode ? 'Enabled' : 'Disabled'}
              </Typography>
            </div>
            
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={cn(
                "h-7 w-14 rounded-full transition-all relative p-1.5",
                isEditMode ? "bg-brand-primary shadow-glow glow-primary" : "bg-slate-700"
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                isEditMode ? "translate-x-7" : "translate-x-0"
              )} />
            </button>
          </div>

          {!isMobile && (
            <Typography variant="small" className="text-slate-600 italic block text-center">
              Edit mode allows for rapid UI prototyping and state injection.
            </Typography>
          )}
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
            <Typography variant="h2" className={cn("text-white leading-none truncate", isMobile ? "text-lg" : "")}>{profile?.displayName}</Typography>
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
              className="bg-white/[0.02] h-11" 
            />
          </div>
          <div className="space-y-1.5">
            <Typography variant="label" className="text-slate-500 ml-1 text-[10px] uppercase font-black tracking-widest opacity-70">Email Address</Typography>
            <Input defaultValue={profile?.email} disabled className="bg-white/[0.02] opacity-50 h-11 truncate" />
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

const AccountPanel = ({ profile, isMobile }: { profile: UserProfile | null, isMobile?: boolean }) => {
  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-white font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Account Security</Typography>
      
      <div className={cn("grid grid-cols-1", isMobile ? "gap-4" : "gap-6")}>
        <Card className={cn("bg-bg-card/20 border-white/5 flex items-center justify-between", isMobile ? "p-4" : "p-8")}>
          <div className={cn("flex items-center", isMobile ? "gap-4" : "gap-6")}>
            <div className={cn("rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0", isMobile ? "h-10 w-10" : "h-12 w-12")}>
              <Shield className={cn("text-amber-500", isMobile ? "h-5 w-5" : "h-6 w-6")} />
            </div>
            <div>
              <Typography variant="label" className="text-white block text-sm">Password</Typography>
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
              <Typography variant="label" className="text-white block text-sm">Subscription</Typography>
              <Typography variant="small" className="text-brand-primary font-bold text-[10px]">Tier: {profile?.subscriptionTier.toUpperCase()}</Typography>
            </div>
          </div>
          <Button variant="outline" className={cn("font-black uppercase tracking-widest", isMobile ? "text-[8px] px-3 h-8" : "text-[10px] px-6 h-10")}>Manage</Button>
        </Card>
      </div>
    </div>
  );
};

const OrganizationPanel = ({ profile, isMobile }: { profile: UserProfile | null, isMobile?: boolean }) => {
  const navigate = useNavigate();
  return (
    <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
      <Typography variant="h3" className={cn("text-white font-black uppercase tracking-tight italic", isMobile ? "text-lg" : "text-xl")}>Dealership / Org</Typography>
      
      <Card className={cn("bg-bg-card/20 border-white/5", isMobile ? "p-4 space-y-6" : "p-8 space-y-8")}>
        <div className={cn("flex items-center", isMobile ? "gap-4" : "gap-8")}>
          <div className={cn("rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0", isMobile ? "h-12 w-12" : "h-20 w-20 rounded-3xl")}>
            <Building2 className={cn("text-slate-400", isMobile ? "h-6 w-6" : "h-10 w-10")} />
          </div>
          <div className="space-y-0.5 min-w-0">
            <Typography variant="h2" className={cn("text-white leading-none truncate", isMobile ? "text-lg" : "")}>Highline Motors</Typography>
            <Typography variant="p" className={cn("text-slate-500 font-bold truncate", isMobile ? "text-[11px]" : "")}>Organization Member Since May 2024</Typography>
            <div className="inline-flex mt-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest text-emerald-400">
              Verified Partner
            </div>
          </div>
        </div>

        <div className={cn("grid grid-cols-1 md:grid-cols-2 pt-6 border-t border-white/5", isMobile ? "gap-4" : "gap-6")}>
          <div className="space-y-1.5">
            <Typography variant="label" className="text-slate-500 ml-1 text-[10px] uppercase font-black tracking-widest opacity-70">Organization ID</Typography>
            <Input defaultValue={profile?.orgId} disabled className="bg-white/[0.02] font-mono text-[10px] opacity-50 h-10 truncate" />
          </div>
          <div className="space-y-1.5">
            <Typography variant="label" className="text-slate-500 ml-1 text-[10px] uppercase font-black tracking-widest opacity-70">Dealership ID</Typography>
            <Input defaultValue={profile?.dealershipId} disabled className="bg-white/[0.02] font-mono text-[10px] opacity-50 h-10 truncate" />
          </div>
        </div>

        {(profile?.role === UserRole.ADMIN || profile?.role === UserRole.GENERAL_MANAGER) && (
          <div className={cn("pt-6 space-y-4", isMobile ? "pt-4" : "")}>
            <Typography variant="label" className="text-brand-primary block uppercase tracking-widest text-[9px] font-black">Management Controls</Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                className={cn("w-full bg-white/5 border-white/10", isMobile ? "text-[10px] h-10" : "text-xs")}
                onClick={() => navigate('/admin/users')}
              >
                Manage Users
              </Button>
              <Button 
                variant="secondary" 
                className={cn("w-full bg-white/5 border-white/10", isMobile ? "text-[10px] h-10" : "text-xs")}
              >
                Org Settings
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
