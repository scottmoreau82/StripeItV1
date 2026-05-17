import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { userService } from '@/src/services/userService';
import { UserProfile, UserRole } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AppIcon } from '../ui/AppIcon';
import { 
  Users, 
  Shield, 
  Snowflake, 
  Trash2, 
  MoreVertical,
  Mail,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  UserPlus,
  Lock,
  History,
  Zap,
  Users2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DealerInviteManagerModal } from './DealerInviteManagerModal';
import { useLocation, useNavigate } from 'react-router-dom';
import { DealerPageHeader } from './DealerPageHeader';

/**
 * DealerUserManagementView
 * Dedicated management interface for organizational members and access controls.
 */
export const DealerUserManagementView: React.FC = () => {
  const { profile, addToast } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'managers';

  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchManagers = async () => {
    if (!profile?.orgId) return;
    setIsLoading(true);
    try {
      const allUsers = await userService.getUsers(profile.orgId);
      const managerUsers = allUsers.filter(u => 
        (u.role === UserRole.MANAGER || u.role === UserRole.GENERAL_MANAGER) && 
        !u.isDeleted &&
        u.uid !== profile.uid
      );
      setManagers(managerUsers);
    } catch (error) {
      addToast('Failed to load managers', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [profile?.orgId]);

  const handleTabChange = (tab: string) => {
    if (tab === 'managers') {
      navigate('/dealer/users');
    } else {
      navigate(`/dealer/users?tab=${tab}`);
    }
  };

  const handleToggleFreeze = async (user: UserProfile) => {
    setActionInProgress(user.uid);
    try {
      const newStatus = !user.isFrozen;
      await userService.setUserFrozen(user.uid, newStatus);
      addToast(`Manager account ${newStatus ? 'frozen' : 'unfrozen'} successfully`, 'success');
      setManagers(prev => prev.map(u => u.uid === user.uid ? { ...u, isFrozen: newStatus } : u));
    } catch (error) {
      addToast('Failed to update account status', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (!window.confirm(`Are you sure you want to remove ${user.displayName || user.email} from the organization? This will revoke their access immediately.`)) {
      return;
    }

    setActionInProgress(user.uid);
    try {
      await userService.deleteUser(user.uid);
      addToast('Manager removed successfully', 'success');
      setManagers(prev => prev.filter(u => u.uid !== user.uid));
    } catch (error) {
      addToast('Failed to remove manager', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredManagers = managers.filter(m => 
    m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const header = (
    <div className="space-y-8">
      <DealerPageHeader
        title="Management"
        subtitle="Dealership Operational Authorization Control"
        icon={Users2}
        iconColor="bg-brand-primary"
      >
        <Button 
          onClick={() => setIsInviteModalOpen(true)}
          className="shadow-glow glow-primary h-11 px-6 font-black uppercase tracking-widest text-xs"
        >
          <UserPlus size={16} className="mr-2" />
          Invite Manager
        </Button>
      </DealerPageHeader>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-px">
        {[
          { id: 'managers', label: 'Managers', icon: Users },
          { id: 'permissions', label: 'Permissions', icon: Lock },
          { id: 'invites', label: 'Pending Invites', icon: Mail },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 border-b-2 transition-all relative group",
              activeTab === tab.id 
                ? "border-brand-primary text-brand-primary bg-brand-primary/[0.03]" 
                : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.02]"
            )}
          >
            <tab.icon size={14} className={cn("transition-all", activeTab === tab.id ? "text-brand-primary" : "text-slate-600 group-hover:text-slate-400")} />
            <span className="font-black uppercase tracking-[0.2em] text-[10px]">{tab.label}</span>
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-brand-primary/5 blur-xl pointer-events-none" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderManagersContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-bg-card/20 border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total Managers</Typography>
                <Users size={16} className="text-indigo-400" />
             </div>
             <Typography variant="h2" className="text-white font-black italic">{managers.length}</Typography>
          </Card>
          <Card className="p-6 bg-bg-card/20 border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Active Seats</Typography>
                <CheckCircle2 size={16} className="text-emerald-500" />
             </div>
             <Typography variant="h2" className="text-white font-black italic">{managers.filter(m => !m.isFrozen).length}</Typography>
          </Card>
          <Card className="p-6 bg-bg-card/20 border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Frozen Accounts</Typography>
                <Snowflake size={16} className="text-blue-400" />
             </div>
             <Typography variant="h2" className="text-white font-black italic">{managers.filter(m => m.isFrozen).length}</Typography>
          </Card>
       </div>

       {/* Search Bar */}
       <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
             <input 
                type="text" 
                placeholder="Find manager by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600 font-medium"
             />
          </div>
       </div>

       {/* Manager Directory */}
       <Card className="bg-bg-card/20 border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="border-b border-white/5 bg-white/[0.01]">
                      <th className="px-6 py-4">
                         <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Identity</Typography>
                      </th>
                      <th className="px-6 py-4">
                         <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Role & Access</Typography>
                      </th>
                      <th className="px-6 py-4">
                         <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Status</Typography>
                      </th>
                      <th className="px-6 py-4">
                         <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Created</Typography>
                      </th>
                      <th className="px-6 py-4 text-right">
                         <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Actions</Typography>
                      </th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {isLoading ? (
                      [1,2,3].map(i => (
                         <tr key={i} className="animate-pulse">
                            <td colSpan={5} className="px-6 py-8">
                               <div className="h-10 bg-white/5 rounded-xl w-full" />
                            </td>
                         </tr>
                      ))
                   ) : filteredManagers.length === 0 ? (
                      <tr>
                         <td colSpan={5} className="px-6 py-20 text-center">
                            <Users className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                            <Typography variant="p" className="text-slate-500 font-bold">No managers found in this organization.</Typography>
                         </td>
                      </tr>
                   ) : (
                      filteredManagers.map((manager) => (
                         <tr key={manager.uid} className="hover:bg-white/[0.01] transition-colors group">
                            <td className="px-6 py-5">
                               <div className="flex items-center gap-4">
                                  <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-white font-bold uppercase overflow-hidden shrink-0">
                                     {manager.photoURL ? (
                                        <img src={manager.photoURL} alt="" className="h-full w-full object-cover" />
                                     ) : (
                                        manager.displayName?.charAt(0) || manager.email.charAt(0)
                                     )}
                                  </div>
                                  <div className="min-w-0">
                                     <Typography variant="label" className="text-white block font-black truncate text-[13px]">
                                        {manager.displayName || 'Unnamed Manager'}
                                     </Typography>
                                     <div className="flex items-center gap-1.5 min-w-0">
                                        <Mail size={10} className="text-slate-600 shrink-0" />
                                        <Typography variant="mono" className="text-[10px] text-slate-500 truncate lowercase">
                                           {manager.email}
                                        </Typography>
                                     </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-5">
                               <Badge 
                                  variant="outline" 
                                  className={cn(
                                     "text-[9px] font-black uppercase tracking-widest border-white/10",
                                     manager.role === UserRole.GENERAL_MANAGER ? "text-indigo-400" : "text-slate-400"
                                  )}
                               >
                                  {manager.role === UserRole.GENERAL_MANAGER ? 'General Manager' : 'Manager'}
                               </Badge>
                            </td>
                            <td className="px-6 py-5">
                               {manager.isFrozen ? (
                                  <div className="flex items-center gap-1.5 text-blue-400">
                                     <Snowflake size={14} />
                                     <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest">Frozen</Typography>
                                  </div>
                               ) : (
                                  <div className="flex items-center gap-1.5 text-emerald-500">
                                     <CheckCircle2 size={14} />
                                     <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest">Active</Typography>
                                  </div>
                               )}
                            </td>
                            <td className="px-6 py-5">
                               <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                     <Calendar size={12} className="text-slate-600" />
                                     <Typography variant="mono" className="text-[10px] text-slate-500">
                                        {new Date(manager.createdAt).toLocaleDateString()}
                                     </Typography>
                                  </div>
                                  {manager.lastActive && (
                                     <div className="flex items-center gap-1.5">
                                        <Clock size={12} className="text-slate-600" />
                                        <Typography variant="mono" className="text-[9px] text-slate-600">
                                           {new Date(manager.lastActive).toLocaleDateString()}
                                        </Typography>
                                     </div>
                                  )}
                               </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button 
                                     variant="ghost" 
                                     size="sm"
                                     onClick={() => handleToggleFreeze(manager)}
                                     disabled={actionInProgress === manager.uid}
                                     className={cn(
                                        "h-9 w-9 p-0 rounded-xl",
                                        manager.isFrozen ? "text-emerald-500 hover:bg-emerald-500/10" : "text-blue-400 hover:bg-blue-400/10"
                                     )}
                                     title={manager.isFrozen ? "Unfreeze Account" : "Freeze Account"}
                                  >
                                     <Snowflake size={16} className={cn(manager.isFrozen && "animate-pulse")} />
                                  </Button>
                                  <Button 
                                     variant="ghost" 
                                     size="sm"
                                     onClick={() => handleDelete(manager)}
                                     disabled={actionInProgress === manager.uid}
                                     className="h-9 w-9 p-0 rounded-xl text-rose-500 hover:bg-rose-500/10"
                                     title="Delete Account"
                                  >
                                     <Trash2 size={16} />
                                  </Button>
                                  <Button 
                                     variant="ghost" 
                                     size="sm"
                                     className="h-9 w-9 p-0 rounded-xl text-slate-500"
                                  >
                                     <MoreVertical size={16} />
                                  </Button>
                                </div>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </Card>
    </div>
  );

  const renderPermissionsContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="p-8 bg-indigo-500/[0.03] border border-indigo-500/20 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Lock size={120} className="text-indigo-500" />
        </div>
        <div className="relative z-10 space-y-4">
          <Typography variant="h3" className="text-white font-black italic uppercase tracking-tight">Global Permission Overrides</Typography>
          <Typography variant="p" className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Configure default access levels for organizational entities. Individual manager permissions can be overridden in the directory.
          </Typography>
          
          <div className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4">
              <Typography variant="label" className="text-white uppercase text-[11px] font-black tracking-widest flex items-center gap-2">
                <Shield size={14} className="text-indigo-400" />
                Baseline Access
              </Typography>
              <Typography variant="p" className="text-slate-500 text-xs">Standard managers can view organization-wide reports and log deals by default.</Typography>
              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-emerald-500 border-emerald-500/20">System Enforced</Badge>
            </div>
            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl space-y-4 opacity-50">
              <Typography variant="label" className="text-white uppercase text-[11px] font-black tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" />
                Advanced Controls
              </Typography>
              <Typography variant="p" className="text-slate-500 text-xs">Custom granular permissions per route and action. Coming soon for enterprise.</Typography>
              <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest text-slate-500 border-white/10">Coming Soon</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderInvitesContent = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card className="bg-bg-card/20 border-white/5 overflow-hidden">
        <div className="p-20 text-center">
          <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 mx-auto mb-6">
            <Mail className="h-8 w-8 text-slate-500" />
          </div>
          <Typography variant="h3" className="text-white font-black italic uppercase mb-2">No Pending Invites</Typography>
          <Typography variant="p" className="text-slate-500 text-sm max-w-md mx-auto">
            All organizational invitations have been resolved or accepted. Use the button above to invite new managers.
          </Typography>
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            className="mt-8 bg-brand-primary h-11 px-8 font-black uppercase tracking-widest text-[10px] shadow-glow glow-primary"
          >
            Invite Now
          </Button>
        </div>
      </Card>
      
      <Card className="p-8 bg-white/[0.01] border border-white/5 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center">
            <History size={20} className="text-slate-500" />
          </div>
          <div>
             <Typography variant="label" className="text-slate-400 uppercase text-[11px] font-black tracking-widest">Audit Log</Typography>
             <Typography variant="p" className="text-slate-600 text-xs">Last organization invite was sent 4 days ago to dealer@example.com</Typography>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'permissions': return renderPermissionsContent();
      case 'invites': return renderInvitesContent();
      default: return renderManagersContent();
    }
  };

  return (
    <DashboardLayout
      header={header}
      main={(
        <div className="space-y-8 pb-32">
          {renderContent()}
          
          {/* Security Context Panel - Shared */}
          <Card className="p-8 bg-brand-primary/[0.02] border border-brand-primary/10 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Shield size={120} className="text-brand-primary" />
            </div>
            <div className="relative z-10 space-y-4">
              <Typography variant="h3" className="text-white font-black italic uppercase tracking-tight">Access Control & Security</Typography>
              <Typography variant="p" className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                Accounts listed here have administrative oversight of your StripeIt Dealer organization. 
                Frozen accounts retain their history but cannot access dashboards or deal logs. 
                Deleted accounts lose all organizational access immediately.
              </Typography>
            </div>
          </Card>

          <DealerInviteManagerModal 
            isOpen={isInviteModalOpen}
            onClose={() => {
                setIsInviteModalOpen(false);
                fetchManagers(); // Refresh list after invite
            }}
          />
        </div>
      )}
    />
  );
};

