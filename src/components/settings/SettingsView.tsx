import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '@/src/lib/utils';
import { 
  User, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Building2, 
  ChevronRight,
  Monitor,
  LayoutGrid,
  Check,
  LogOut,
  CreditCard,
  Target,
  RefreshCw,
  FlaskConical,
  AlertTriangle,
  Sparkles,
  MessageSquarePlus,
  Bug,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, UserPreferences, SubscriptionTier } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { preferenceService, DEFAULT_PREFERENCES } from '@/src/services/preferenceService';
import { demoSeedService } from '@/src/services/demoSeedService';
import { testingService } from '@/src/services/testingService';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';

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

type SettingsSection = 'profile' | 'appearance' | 'notifications' | 'account' | 'organization' | 'testing' | 'feedback' | 'admin' | 'developer';

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onLogout, isMobile }) => {
  const { isAdmin } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Ensure we have fallbacks for nested preference objects
  const preferences: UserPreferences = {
    ...DEFAULT_PREFERENCES,
    ...(profile?.preferences || {}),
    display: {
      ...DEFAULT_PREFERENCES.display,
      ...(profile?.preferences?.display || {})
    },
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(profile?.preferences?.notifications || {})
    }
  };

  const handleUpdatePreference = async (updates: any) => {
    if (!profile?.uid) return;
    setIsUpdating(true);
    try {
      await preferenceService.updatePreferences(profile.uid, { ...preferences, ...updates });
      setSuccessMsg('Preferences updated');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

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

      <section id="appearance" className="scroll-mt-24">
        <AppearancePanel preferences={preferences} onUpdate={handleUpdatePreference} />
      </section>

      <section id="notifications" className="scroll-mt-24">
        <NotificationsPanel userId={profile?.uid} notifications={preferences.notifications} />
      </section>

      <section id="account" className="scroll-mt-24">
        <AccountPanel profile={profile} />
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

      <section id="testing" className="scroll-mt-24">
        <TestingPanel profile={profile} />
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

const AppearancePanel = ({ preferences, onUpdate }: { preferences: UserPreferences, onUpdate: (u: any) => void }) => (
  <div className="space-y-8">
    <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Appearance</Typography>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(['dark', 'light', 'system'] as const).map((mode) => (
        <Card 
          key={mode}
          onClick={() => onUpdate({ theme: mode })}
          className={cn(
            "p-6 cursor-pointer transition-all border-2 flex flex-col items-center gap-4 group",
            preferences.theme === mode 
              ? "border-brand-primary bg-brand-primary/5" 
              : "border-white/5 bg-white/[0.02] hover:border-white/10"
          )}
        >
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-all",
            preferences.theme === mode ? "bg-brand-primary text-bg-deep shadow-glow glow-primary" : "bg-white/5 text-slate-500 group-hover:text-white"
          )}>
            {mode === 'dark' && <Moon />}
            {mode === 'light' && <Sun />}
            {mode === 'system' && <Monitor />}
          </div>
          <Typography variant="label" className={cn(
            "font-black uppercase tracking-widest text-[10px]",
            preferences.theme === mode ? "text-brand-primary" : "text-slate-500"
          )}>
            {mode} Mode
          </Typography>
        </Card>
      ))}
    </div>

    <div className="space-y-4">
      <Typography variant="label" className="text-slate-500 ml-1">Visual Architecture</Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'matrix', name: 'Matrix Theme', icon: Sparkles, desc: 'Premium futurist cyan & purple accents' },
          { id: 'og', name: 'OG Theme', icon: LayoutGrid, desc: 'Original Stripe It glass-morphism' }
        ].map((vTheme) => (
          <Card 
            key={vTheme.id}
            onClick={() => onUpdate({ visualTheme: vTheme.id })}
            className={cn(
              "p-6 cursor-pointer transition-all border flex items-center gap-4 group",
              (preferences.visualTheme || 'matrix') === vTheme.id 
                ? "border-brand-primary bg-brand-primary/10 shadow-glow-sm glow-primary/10" 
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            )}
          >
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
              (preferences.visualTheme || 'matrix') === vTheme.id ? "bg-brand-primary text-bg-deep shadow-glow glow-primary" : "bg-white/5 text-slate-500"
            )}>
              <vTheme.icon size={18} />
            </div>
            <div className="flex-1">
              <Typography variant="label" className={cn(
                "font-black uppercase tracking-widest text-[10px] block mb-0.5",
                (preferences.visualTheme || 'matrix') === vTheme.id ? "text-brand-primary" : "text-slate-300"
              )}>
                {vTheme.name}
              </Typography>
              <Typography variant="small" className="text-slate-500 text-[9px] lowercase opacity-60">
                {vTheme.desc}
              </Typography>
            </div>
            {(preferences.visualTheme || 'matrix') === vTheme.id && (
              <div className="h-6 w-6 rounded-full bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
                <Check className="h-3 w-3 text-brand-primary" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>

    <Card className="p-8 bg-white/[0.02] border-white/5 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography variant="label" className="text-white block mb-1">Show Metrics By Default</Typography>
          <Typography variant="small" className="text-slate-500 text-[11px]">Keep metrics visible on dashboard load</Typography>
        </div>
        <button 
          onClick={() => onUpdate({ display: { ...preferences.display, showMetricsByDefault: !preferences.display.showMetricsByDefault }})}
          className={cn(
            "h-6 w-12 rounded-full transition-all relative p-1",
            preferences.display.showMetricsByDefault ? "bg-brand-primary" : "bg-slate-700"
          )}
        >
          <div className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm transition-all",
            preferences.display.showMetricsByDefault ? "translate-x-6" : "translate-x-0"
          )} />
        </button>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <div>
          <Typography variant="label" className="text-white block mb-1">Compact Mode</Typography>
          <Typography variant="small" className="text-slate-500 text-[11px]">Reduce spacing for high-density viewing</Typography>
        </div>
        <button 
           onClick={() => onUpdate({ display: { ...preferences.display, compactMode: !preferences.display.compactMode }})}
           className={cn(
            "h-6 w-12 rounded-full transition-all relative p-1",
            preferences.display.compactMode ? "bg-brand-primary" : "bg-slate-700"
          )}
        >
          <div className={cn(
            "h-4 w-4 rounded-full bg-white shadow-sm transition-all",
            preferences.display.compactMode ? "translate-x-6" : "translate-x-0"
          )} />
        </button>
      </div>
    </Card>
  </div>
);

const NotificationsPanel = ({ userId, notifications }: { userId?: string, notifications: UserPreferences['notifications'] }) => {
  const [localNotifs, setLocalNotifs] = useState(notifications);

  const toggle = async (key: keyof UserPreferences['notifications']) => {
    if (!userId) return;
    const next = !localNotifs[key];
    setLocalNotifs({ ...localNotifs, [key]: next });
    await preferenceService.updateNotificationSettings(userId, { [key]: next });
  };

  const items = [
    { key: 'dealReminders' as const, label: 'Deal Reminders', desc: 'Alerts for pending or unfinished deals' },
    { key: 'goalAlerts' as const, label: 'Goal Progress', desc: 'Notifications when you reach milestones' },
    { key: 'payoutAlerts' as const, label: 'Payout Updates', desc: 'Get notified when commission estimates change' },
    { key: 'managerAnnouncements' as const, label: 'Manager Announcements', desc: 'Direct messages from your dealership management' },
    { key: 'competitionNotifications' as const, label: 'Leaderboard Alerts', desc: 'Updates on team standings and races' },
  ];

  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Notifications</Typography>
      
      <Card className="p-2 bg-white/[0.01] border-white/5 divide-y divide-white/5">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <Typography variant="label" className="text-white">{item.label}</Typography>
              <Typography variant="small" className="text-slate-500 block leading-tight">{item.desc}</Typography>
            </div>
            <button 
              onClick={() => toggle(item.key)}
              className={cn(
                "h-6 w-12 rounded-full transition-all relative p-1 shrink-0",
                localNotifs[item.key] ? "bg-brand-primary" : "bg-slate-700"
              )}
            >
              <div className={cn(
                "h-4 w-4 rounded-full bg-white shadow-sm transition-all",
                localNotifs[item.key] ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        ))}
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

const TestingPanel = ({ profile }: { profile: UserProfile | null }) => {
  const { updateProfileData, addToast } = useAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [isResettingIntro, setIsResettingIntro] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleSaveName = async () => {
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setIsSavingName(true);
    try {
      await updateProfileData({ displayName: trimmed });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleClearDeals = async () => {
    if (!profile) return;
    setIsResetting(true);
    try {
      await testingService.clearUserDeals(profile);
      setShowConfirmReset(false);
      addToast('All deals cleared for testing.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to clear deals.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetIntro = async () => {
    if (!profile?.uid) return;
    setIsResettingIntro(true);
    try {
      await testingService.resetOnboarding(profile.uid);
      addToast('First-login introduction reset. You can go through it again.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to reset introduction.', 'error');
    } finally {
      setIsResettingIntro(false);
    }
  };

  const handleSeed = async () => {
    if (!profile) return;
    setIsSeeding(true);
    try {
      await demoSeedService.seedSalespersonDemo(profile);
      addToast('Demo deals seeded successfully.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to seed demo deals.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Testing & Demo</Typography>
      
      <div className="space-y-6">
        {/* Display Name Override */}
        <Card className="p-8 bg-bg-card/20 border-white/5 space-y-6">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
              <User className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <Typography variant="label" className="text-white block">Display Name Override</Typography>
              <Typography variant="small" className="text-slate-500 block">Change how your name appears across the system for demo purposes.</Typography>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="New Display Name"
              className="bg-white/[0.02] flex-1"
            />
            <Button 
              onClick={handleSaveName}
              isLoading={isSavingName}
              disabled={isSavingName || !displayName.trim()}
              className="bg-brand-primary text-bg-deep font-black uppercase tracking-widest px-8"
            >
              Save
            </Button>
          </div>
        </Card>

        {/* Surgical Deal Reset */}
        <Card className="p-8 bg-orange-500/5 border border-orange-500/20 space-y-6">
          <div className="flex items-start gap-6">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <RefreshCw className="h-6 w-6 text-orange-500" />
            </div>
            <div className="space-y-2">
              <Typography variant="label" className="text-white block uppercase tracking-widest text-[11px] font-black">Reset for Testing</Typography>
              <Typography variant="small" className="text-slate-500 block leading-relaxed">
                Delete all your current deals, notes, and activity. This will <span className="text-white font-bold">NOT</span> reset your profile, subscription, or settings.
              </Typography>
            </div>
          </div>

          {!showConfirmReset ? (
            <Button 
              onClick={() => setShowConfirmReset(true)}
              className="bg-orange-500 hover:bg-orange-600 shadow-glow glow-orange font-black uppercase tracking-widest px-8 h-12 text-[11px]"
            >
              Reset for Testing
            </Button>
          ) : (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-4">
              <div className="flex items-start gap-3 text-rose-500">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <Typography variant="label" className="font-black uppercase tracking-widest text-[11px] block">Confirm Deal Deletion</Typography>
                  <Typography variant="small" className="text-rose-500/80 block text-[11px] leading-tight">
                    Clear all deals for this account? This will only remove your deal data. Your profile, settings, subscription tier, and tutorial status will not be changed.
                  </Typography>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleClearDeals}
                  isLoading={isResetting}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest px-6 h-10 text-[10px]"
                >
                  Yes, Clear Deals
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setShowConfirmReset(false)}
                  className="text-slate-400 hover:text-white font-black uppercase tracking-widest px-6 h-10 text-[10px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Replay Onboarding */}
        <Card className="p-8 bg-indigo-500/5 border border-indigo-500/20 space-y-6">
          <div className="flex items-start gap-6">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <Typography variant="label" className="text-white block uppercase tracking-widest text-[11px] font-black">Demo Experience</Typography>
              <Typography variant="small" className="text-slate-500 block leading-relaxed">
                Reset the first-login introduction flow. The onboarding guide will reappear immediately so you can walk through the system again.
              </Typography>
            </div>
          </div>
          <Button 
            onClick={handleResetIntro}
            isLoading={isResettingIntro}
            className="bg-indigo-500 hover:bg-indigo-600 shadow-glow glow-indigo font-black uppercase tracking-widest px-8 h-12 text-[11px]"
          >
            Replay First-Login Introduction
          </Button>
        </Card>

        {/* Incremental Seed */}
        <Card className="p-8 bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="space-y-1">
              <Typography variant="label" className="text-white block uppercase tracking-widest text-[11px] font-black">Incremental Seed</Typography>
              <Typography variant="small" className="text-slate-500 block">Add another 6 demo deals without deleting existing data.</Typography>
            </div>
          </div>
          <Button 
            onClick={handleSeed}
            isLoading={isSeeding}
            variant="secondary"
            className="shrink-0 px-8 h-12 font-black uppercase tracking-widest text-[11px] bg-white/5 border-white/10"
          >
            Seed 6 More Deals
          </Button>
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
