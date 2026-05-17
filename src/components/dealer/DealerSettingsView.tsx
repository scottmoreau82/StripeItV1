import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { organizationService } from '@/src/services/organizationService';
import { Organization, SubscriptionTier, OrganizationStatus } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  UserPlus, 
  Shield, 
  Clock,
  AlertCircle,
  Zap,
  Settings,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DealerInviteManagerModal } from './DealerInviteManagerModal';
import { Link } from 'react-router-dom';

/**
 * DealerSettingsView
 * Operational control center for Dealer organizations.
 */
export const DealerSettingsView: React.FC = () => {
  const { profile, addToast, isAdmin, user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isOrgLoading, setIsOrgLoading] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  const fetchOrganization = async () => {
    if (!profile?.orgId || !isAdmin) return;
    setIsOrgLoading(true);
    try {
      const org = await organizationService.getOrganization(profile.orgId);
      setOrganization(org);
    } catch (error) {
      addToast('Failed to load organization details', 'error');
    } finally {
      setIsOrgLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchOrganization();
  }, [profile?.orgId, isAdmin]);

  const handleUpdateOrgTier = async (tier: SubscriptionTier) => {
    if (!profile?.orgId || !user || !organization) return;
    setIsUpdatingOrg(true);
    try {
      await organizationService.updateOrgTierAndStatus(profile.orgId, user.uid, {
        tier,
        status: organization.status || OrganizationStatus.ACTIVE
      });
      setOrganization(prev => prev ? { ...prev, subscriptionTier: tier } : null);
      addToast(`Organization tier updated to ${tier} successfully`, 'success');
    } catch (error) {
      addToast('Failed to update tier', 'error');
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  const handleUpdateOrgStatus = async (status: OrganizationStatus) => {
    if (!profile?.orgId || !user || !organization) return;
    setIsUpdatingOrg(true);
    try {
      await organizationService.updateOrgTierAndStatus(profile.orgId, user.uid, {
        tier: organization.subscriptionTier,
        status
      });
      setOrganization(prev => prev ? { ...prev, status } : null);
      addToast(`Organization status updated to ${status} successfully`, 'success');
    } catch (error) {
      addToast('Failed to update status', 'error');
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-glow glow-primary/5">
            <Settings className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter leading-none">
              Dealer Settings
            </Typography>
            <Typography variant="p" className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest opacity-60">
              Organizational Parameters & Global Controls
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            className="shadow-glow glow-primary h-11 px-6 font-black uppercase tracking-widest text-xs"
          >
            <UserPlus size={16} className="mr-2" />
            Invite Member
          </Button>
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-8 pb-32">
       {/* Organization Profile Card */}
       <Card className="p-8 bg-bg-card/20 border-white/5 space-y-6">
          <div className="flex items-center justify-between">
             <div className="space-y-1">
                <Typography variant="label" className="text-slate-500 uppercase text-[11px] font-black tracking-widest">Dealership Identity</Typography>
                <Typography variant="h2" className="text-white font-black italic">{profile?.orgName || 'StripeIt Organization'}</Typography>
             </div>
             <Badge variant="outline" className="text-brand-primary border-brand-primary/20 uppercase tracking-widest font-black text-[10px]">
                {profile?.subscriptionTier} TIER
             </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
             <div className="space-y-2">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Owner Email</Typography>
                <Typography variant="p" className="text-white font-medium">{profile?.email}</Typography>
             </div>
             <div className="space-y-2">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Member Domains</Typography>
                <Typography variant="p" className="text-white font-medium">@{profile?.email?.split('@')[1]}</Typography>
             </div>
          </div>
       </Card>
 
        {/* Log Builder & Operational Config */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Link to="/dealer/log-builder" className="group">
              <Card className="p-8 bg-blue-500/[0.03] border border-blue-500/20 rounded-3xl hover:border-blue-500/40 transition-all relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <LayoutGrid size={120} className="text-blue-500" />
                 </div>
                 <div className="relative z-10 space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                       <LayoutGrid size={24} className="text-blue-400" />
                    </div>
                    <div className="space-y-1">
                       <Typography variant="h3" className="text-white font-black italic uppercase tracking-tight">Log Builder</Typography>
                       <Typography variant="p" className="text-slate-400 text-sm leading-relaxed">
                          Define your operational dealership deal log structure. Synchronize report columns and entry forms across the organization.
                       </Typography>
                    </div>
                    <Button variant="outline" className="border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all uppercase font-black text-[10px] tracking-widest px-6 mt-4">
                       Configure Schema
                    </Button>
                 </div>
              </Card>
           </Link>

           <Card className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl opacity-50 grayscale cursor-not-allowed">
              <div className="space-y-4">
                 <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                    <Zap size={24} className="text-slate-500" />
                 </div>
                 <div className="space-y-1">
                    <Typography variant="h3" className="text-slate-400 font-black italic uppercase tracking-tight">Workflow Engine</Typography>
                    <Typography variant="p" className="text-slate-600 text-sm leading-relaxed">
                       Advanced automations and approvals based on your operational schema. Coming soon for enterprise tiers.
                    </Typography>
                 </div>
              </div>
           </Card>
        </div>

        {/* Admin: Organization Control */}
       {isAdmin && organization && (
         <Card className="p-8 bg-purple-500/[0.03] border border-purple-500/20 rounded-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Settings size={120} className="text-purple-500" />
           </div>
           
           <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shadow-purple-glow">
                  <Zap size={16} className="text-purple-400" />
                </div>
                <div>
                  <Typography variant="h3" className="text-white font-black italic uppercase tracking-tight">Admin: Organizational Elevation</Typography>
                  <Typography variant="mono" className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Override Core Operational Parameters</Typography>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tier Management */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Typography variant="label" className="text-slate-400 uppercase text-[11px] font-black tracking-widest">Subscription Tier</Typography>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {[SubscriptionTier.FREE, SubscriptionTier.PRO, SubscriptionTier.ORGANIZATION, SubscriptionTier.TRIAL, SubscriptionTier.PREMIUM, SubscriptionTier.ENTERPRISE].map((tier) => (
                      <Button
                        key={tier}
                        variant={organization.subscriptionTier === tier ? 'primary' : 'outline'}
                        size="sm"
                        disabled={isUpdatingOrg}
                        onClick={() => handleUpdateOrgTier(tier)}
                        className={cn(
                          "h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                          organization.subscriptionTier === tier 
                            ? "bg-purple-600 border-purple-400 shadow-purple-glow" 
                            : "bg-white/[0.02] border-white/10 text-slate-500 hover:text-white hover:border-purple-500/50"
                        )}
                      >
                        {tier}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Status Management */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Typography variant="label" className="text-slate-400 uppercase text-[11px] font-black tracking-widest">Organization Status</Typography>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {Object.values(OrganizationStatus).map((status) => (
                      <Button
                        key={status}
                        variant={organization.status === status ? 'primary' : 'outline'}
                        size="sm"
                        disabled={isUpdatingOrg}
                        onClick={() => handleUpdateOrgStatus(status as OrganizationStatus)}
                        className={cn(
                          "h-10 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all",
                          organization.status === status 
                            ? "bg-emerald-600 border-emerald-400 shadow-emerald-500/20" 
                            : "bg-white/[0.02] border-white/10 text-slate-500 hover:text-white hover:border-emerald-500/50"
                        )}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {organization.updatedAt && (
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={12} />
                    <Typography variant="mono" className="text-[9px] uppercase tracking-widest font-bold">
                      Last modified: {new Date(organization.updatedAt).toLocaleString()}
                    </Typography>
                  </div>
                  {organization.updatedBy && (
                    <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-black">
                      BY ADMIN: {organization.updatedBy.slice(0, 8)}
                    </Typography>
                  )}
                </div>
              )}
           </div>
        </Card>
       )}

       {/* Organizational Context Panel */}
       <Card className="p-8 bg-brand-primary/[0.02] border border-brand-primary/10 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Shield size={120} className="text-brand-primary" />
          </div>
          <div className="relative z-10 space-y-6">
             <div className="space-y-2">
                <Typography variant="h3" className="text-white font-black italic uppercase tracking-tight">Access Control & Security</Typography>
                <Typography variant="p" className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                   Accounts listed here have administrative oversight of your StripeIt Dealer organization. 
                   Frozen accounts retain their history but cannot access dashboards or deal logs. 
                   Deleted accounts lose all organizational access immediately.
                </Typography>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                   <div className="h-2 w-2 rounded-full bg-brand-primary shadow-glow glow-primary" />
                   <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                      Org Level: <span className="text-white">Enterprise Dealer Tier</span>
                   </Typography>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/5 rounded-2xl">
                   <AlertCircle size={14} className="text-slate-500" />
                   <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
                      Domain Enforcement: <span className="text-emerald-500">Active</span>
                   </Typography>
                </div>
             </div>
          </div>
       </Card>

       <DealerInviteManagerModal 
          isOpen={isInviteModalOpen}
          onClose={() => {
             setIsInviteModalOpen(false);
          }}
       />
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};
