import React, { useState } from 'react';
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
  Check,
  LogOut,
  CreditCard,
  Target,
  RefreshCw,
  FlaskConical,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, UserRole, UserPreferences } from '@/src/types';
import { preferenceService, DEFAULT_PREFERENCES } from '@/src/services/preferenceService';
import { demoSeedService } from '@/src/services/demoSeedService';
import { testingService } from '@/src/services/testingService';

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

type SettingsSection = 'profile' | 'appearance' | 'notifications' | 'account' | 'organization' | 'testing';

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, onLogout, isMobile }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
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

  const sectionItems: { id: SettingsSection; label: string; icon: any; roles?: UserRole[] }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'organization', label: 'Organization', icon: Building2, roles: [UserRole.MANAGER, UserRole.GENERAL_MANAGER, UserRole.ADMIN] },
    { id: 'testing', label: 'Testing & Demo', icon: FlaskConical },
  ];

  const filteredSections = sectionItems.filter(item => 
    !item.roles || (profile?.role && item.roles.includes(profile.role))
  );

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

  const renderSidebar = () => (
    <div className="space-y-1">
      {filteredSections.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveSection(item.id)}
          className={cn(
            "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
            activeSection === item.id 
              ? "bg-brand-primary text-bg-deep shadow-glow glow-primary" 
              : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
          )}
        >
          <div className="flex items-center gap-4">
            <item.icon className={cn("h-5 w-5", activeSection === item.id ? "stroke-[3px]" : "stroke-[2px]")} />
            <span className="font-bold tracking-tight">{item.label}</span>
          </div>
          <ChevronRight className={cn(
            "h-4 w-4 opacity-0 group-hover:opacity-100 transition-all",
            activeSection === item.id && "opacity-100"
          )} />
        </button>
      ))}
      
      <div className="pt-8 mt-8 border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-bold tracking-tight">Sign Out</span>
        </button>
      </div>
    </div>
  );

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      {/* Navigation Sidebar */}
      <div className="lg:col-span-4">
        <Card className={cn(
          "p-3 bg-bg-card/40 border-white/5",
          isMobile && "mb-4"
        )}>
          {renderSidebar()}
        </Card>
      </div>

      {/* Content Area */}
      <div className="lg:col-span-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-8"
          >
            {activeSection === 'profile' && <ProfilePanel profile={profile} />}
            {activeSection === 'appearance' && <AppearancePanel preferences={preferences} onUpdate={handleUpdatePreference} />}
            {activeSection === 'notifications' && <NotificationsPanel userId={profile?.uid} notifications={preferences.notifications} />}
            {activeSection === 'account' && <AccountPanel profile={profile} />}
            {activeSection === 'organization' && <OrganizationPanel profile={profile} />}
            {activeSection === 'testing' && <TestingPanel profile={profile} onReset={() => window.location.reload()} />}
          </motion.div>
        </AnimatePresence>
      </div>

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

/* --- Sub-Panels --- */

const ProfilePanel = ({ profile }: { profile: UserProfile | null }) => (
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
          <Input defaultValue={profile?.displayName} className="bg-white/[0.02]" />
        </div>
        <div className="space-y-2">
          <Typography variant="label" className="text-slate-500 ml-1">Email Address</Typography>
          <Input defaultValue={profile?.email} disabled className="bg-white/[0.02] opacity-50" />
        </div>
      </div>
      
      <Button className="bg-brand-primary text-bg-deep font-black uppercase tracking-[0.2em] px-10">
        Save Profile
      </Button>
    </Card>
  </div>
);

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
            preferences.theme === mode ? "bg-brand-primary text-bg-deep" : "bg-white/5 text-slate-500 group-hover:text-white"
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

const TestingPanel = ({ profile, onReset }: { profile: UserProfile | null, onReset: () => void }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    if (!profile) return;
    setIsResetting(true);
    try {
      await testingService.resetUserData(profile);
      setShowConfirm(false);
      onReset();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSeed = async () => {
    if (!profile) return;
    setIsSeeding(true);
    try {
      await demoSeedService.seedSalespersonDemo(profile);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">Testing Mode</Typography>
      
      <div className="space-y-6">
        <Card className="p-8 bg-orange-500/5 border border-orange-500/20 space-y-6">
          <div className="flex items-start gap-6">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <RefreshCw className="h-6 w-6 text-orange-500" />
            </div>
            <div className="space-y-2">
              <Typography variant="label" className="text-white block">Full Demo Reset</Typography>
              <Typography variant="small" className="text-slate-500 block leading-relaxed">
                This will delete <span className="text-white">ALL</span> your current deals, notes, and activity, reset your onboarding progress, and re-seed the standard demo data (6 deals). Perfect for repeatable Free Tier testing.
              </Typography>
            </div>
          </div>

          {!showConfirm ? (
            <Button 
              onClick={() => setShowConfirm(true)}
              className="bg-orange-500 hover:bg-orange-600 shadow-glow glow-orange font-black uppercase tracking-widest px-8"
            >
              Reset for Testing
            </Button>
          ) : (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-500">
                <AlertTriangle className="h-5 w-5" />
                <Typography variant="label" className="font-black uppercase tracking-widest text-[11px]">Are you absolutely sure?</Typography>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleReset}
                  isLoading={isResetting}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest px-6 h-10 text-[10px]"
                >
                  Yes, Wipe Everything
                </Button>
                <Button 
                  variant="ghost"
                  onClick={() => setShowConfirm(false)}
                  className="text-slate-400 hover:text-white font-black uppercase tracking-widest px-6 h-10 text-[10px]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-8 bg-bg-card/20 border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
              <Target className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="space-y-1">
              <Typography variant="label" className="text-white block">Incremental Seed</Typography>
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
