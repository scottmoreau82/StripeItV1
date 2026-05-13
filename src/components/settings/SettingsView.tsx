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

const ThemePanel = ({ profile }: { profile: UserProfile | null }) => {
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
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Global Theme</Typography>
      
      <Card className="p-8 bg-bg-card/20 border-white/5 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <AppIcon name="sparkles" className="text-brand-primary" />
              </div>
              <div>
                <Typography variant="label" className="text-white block">Icon Pack</Typography>
                <Typography variant="small" className="text-slate-500">Choose your interface symbol set</Typography>
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
                  <Typography variant="small" className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
                    BASIC+ EXCLUSIVE
                  </Typography>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-center gap-4">
             <Typography variant="small" className="text-slate-500 uppercase tracking-widest font-black text-[9px] mb-2">Preview</Typography>
             <div className="flex items-center justify-around">
                <div className="flex flex-col items-center gap-2">
                   <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <AppIcon name="dashboard" size={24} />
                   </div>
                   <Typography variant="mono" className="text-[8px] text-slate-500 uppercase">Home</Typography>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <AppIcon name="salesLog" size={24} />
                   </div>
                   <Typography variant="mono" className="text-[8px] text-slate-500 uppercase">Log</Typography>
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <AppIcon name="settings" size={24} />
                   </div>
                   <Typography variant="mono" className="text-[8px] text-slate-500 uppercase">Config</Typography>
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
    <div className="flex flex-col gap-2">
      <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter">
        Settings
      </Typography>
      <Typography variant="p" className="text-slate-500 font-bold">
        Manage your account and preferences
      </Typography>
    </div>
  );

  const mainContent = (
    <div className="max-w-4xl mx-auto space-y-20 pb-32">
      <section id="profile" className="scroll-mt-24">
        <ProfilePanel profile={profile} />
      </section>

      <section id="account" className="scroll-mt-24">
        <AccountPanel profile={profile} />
      </section>
      
      <section id="theme" className="scroll-mt-24">
        <ThemePanel profile={profile} />
      </section>

      {profile?.role && [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN].includes(profile.role) && (
        <section id="organization" className="scroll-mt-24">
          <OrganizationPanel profile={profile} />
        </section>
      )}

      {isAdmin && (
        <>
          <section id="admin" className="scroll-mt-24">
            <AdminPanel />
          </section>

          <section id="developer" className="scroll-mt-24">
            <DeveloperPanel />
          </section>
        </>
      )}

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

const AdminPanel = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Admin Tools</Typography>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 bg-brand-primary/5 border border-brand-primary/10 space-y-6 flex flex-col justify-between shadow-glow-sm glow-primary/5">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <MessageSquarePlus className="h-5 w-5 text-brand-primary" />
            </div>
            <Typography variant="h4" className="text-white">Feedback Review</Typography>
            <Typography variant="small" className="text-slate-400 block pb-4">
              Monitor, categorize, and respond to incoming bug reports and feature requests from all users.
            </Typography>
          </div>
          <Button 
            onClick={() => navigate('/admin/feedback')}
            className="w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] h-12"
          >
            Review Feedback
          </Button>
        </Card>

        {/* User Management Placeholder */}
        <Card className="p-8 bg-white/[0.02] border border-white/5 space-y-6 grayscale opacity-60">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <Typography variant="h4" className="text-white">User Management</Typography>
            <Typography variant="small" className="text-slate-400 block">
              Manage accounts, reset passwords, and adjust user roles across the entire platform.
            </Typography>
          </div>
          <Button disabled variant="outline" className="w-full border-white/10 text-slate-500 text-[10px] uppercase font-black tracking-widest">
            Coming Soon
          </Button>
        </Card>
      </div>

      <Card className="p-6 bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
        <ShieldCheck className="h-5 w-5 text-amber-500" />
        <Typography variant="small" className="text-amber-500/80 font-bold">
          Admin Access Active. You have unrestricted access to system-level tools and feedback databases.
        </Typography>
      </Card>
    </div>
  );
};

const DeveloperPanel = () => {
  const { profile, tierOverride, setTierOverride, isEditMode, setIsEditMode } = useAuth();
  
  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Developer Tools</Typography>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Override */}
        <Card className="p-8 bg-bg-card/40 border-white/5 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <Typography variant="h4" className="text-white">Dev Tier Override</Typography>
              <Typography variant="small" className="text-slate-500 block">Simulate different subscription levels</Typography>
            </div>
          </div>

          <div className="space-y-4">
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
            
            <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl">
              <Typography variant="small" className="text-brand-primary/80 font-bold block leading-relaxed">
                Active Tier: <span className="text-white">{tierOverride || profile?.subscriptionTier || 'Free'}</span>
              </Typography>
              <Typography variant="small" className="text-slate-500 block mt-1 text-[10px]">
                This effect is session-based and does not affect production billing.
              </Typography>
            </div>
          </div>
        </Card>

        {/* Edit Mode */}
        <Card className="p-8 bg-bg-card/40 border-white/5 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <Typography variant="h4" className="text-white">System Edit Mode</Typography>
              <Typography variant="small" className="text-slate-500 block">Enable UI & testing overrides</Typography>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="space-y-1">
              <Typography variant="label" className="text-white">Status</Typography>
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

          <Typography variant="small" className="text-slate-600 italic block text-center">
            Edit mode allows for rapid UI prototyping and state injection.
          </Typography>
        </Card>
      </div>

      <Card className="p-6 bg-brand-primary/5 border border-brand-primary/10 flex items-center gap-4">
        <Bug className="h-5 w-5 text-brand-primary" />
        <Typography variant="small" className="text-brand-primary/80 font-bold">
          Developer Mode Active. These tools are restricted to {STRIPEIT_DEVELOPER_EMAIL} and system admins.
        </Typography>
      </Card>
    </div>
  );
};

/* --- Sub-Panels --- */

const ProfilePanel = ({ profile }: { profile: UserProfile | null }) => {
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
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Profile Details</Typography>
      
      <Card className="p-8 bg-bg-card/20 border-white/5 space-y-8">
        <div className="flex items-center gap-8">
          <div className="h-24 w-24 rounded-[2rem] bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center relative group overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-brand-primary" />
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Typography variant="mono" className="text-[10px] text-white uppercase font-black">Edit</Typography>
            </div>
          </div>
          <div className="space-y-1">
            <Typography variant="h2" className="text-white leading-none">{profile?.displayName}</Typography>
            <Typography variant="p" className="text-slate-500 font-bold">{profile?.email}</Typography>
            <div className="inline-flex mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-brand-primary">
              {profile?.role}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
          <div className="space-y-2">
            <Typography variant="label" className="text-slate-500 ml-1">Display Name</Typography>
            <Input 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name..."
              className="bg-white/[0.02]" 
            />
          </div>
          <div className="space-y-2">
            <Typography variant="label" className="text-slate-500 ml-1">Email Address</Typography>
            <Input defaultValue={profile?.email} disabled className="bg-white/[0.02] opacity-50" />
          </div>
        </div>
        
        <Button 
          onClick={handleSave}
          isLoading={isSaving}
          disabled={isSaving || !displayName.trim()}
          className="bg-brand-primary text-bg-deep font-black uppercase tracking-[0.2em] px-10"
        >
          Save Profile
        </Button>
      </Card>
    </div>
  );
};

const AccountPanel = ({ profile }: { profile: UserProfile | null }) => {
  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Account Security</Typography>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-8 bg-bg-card/20 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <Typography variant="label" className="text-white block">Password</Typography>
              <Typography variant="small" className="text-slate-500">Last changed 4 months ago</Typography>
            </div>
          </div>
          <Button variant="secondary" className="bg-white/5 border-white/10 text-xs px-6">Change</Button>
        </Card>

        <Card className="p-8 bg-bg-card/20 border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <Typography variant="label" className="text-white block">Subscription</Typography>
              <Typography variant="small" className="text-slate-500 text-brand-primary font-bold">Tier: {profile?.subscriptionTier.toUpperCase()}</Typography>
            </div>
          </div>
          <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest px-6 h-10">Manage</Button>
        </Card>
      </div>
    </div>
  );
};

const OrganizationPanel = ({ profile }: { profile: UserProfile | null }) => (
  <div className="space-y-8">
    <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Dealership / Org</Typography>
    
    <Card className="p-8 bg-bg-card/20 border-white/5 space-y-8">
      <div className="flex items-center gap-8">
        <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Building2 className="h-10 w-10 text-slate-400" />
        </div>
        <div className="space-y-1">
          <Typography variant="h2" className="text-white leading-none">Highline Motors</Typography>
          <Typography variant="p" className="text-slate-500 font-bold">Organization Member Since May 2024</Typography>
          <div className="inline-flex mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest text-emerald-400">
            Verified Partner
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-white/5">
        <div className="space-y-2">
          <Typography variant="label" className="text-slate-500 ml-1">Organization ID</Typography>
          <Input defaultValue={profile?.orgId} disabled className="bg-white/[0.02] font-mono text-xs opacity-50" />
        </div>
        <div className="space-y-2">
          <Typography variant="label" className="text-slate-500 ml-1">Dealership ID</Typography>
          <Input defaultValue={profile?.dealershipId} disabled className="bg-white/[0.02] font-mono text-xs opacity-50" />
        </div>
      </div>

      {(profile?.role === UserRole.ADMIN || profile?.role === UserRole.GENERAL_MANAGER) && (
        <div className="pt-8 space-y-4">
          <Typography variant="label" className="text-brand-primary block uppercase tracking-widest text-[10px]">Management Controls</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button variant="secondary" className="w-full bg-white/5 border-white/10 text-xs">Manage Users</Button>
            <Button variant="secondary" className="w-full bg-white/5 border-white/10 text-xs">Org Settings</Button>
          </div>
        </div>
      )}
    </Card>
  </div>
);
