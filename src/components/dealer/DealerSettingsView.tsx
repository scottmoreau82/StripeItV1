import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { userService } from '@/src/services/userService';
import { inviteService } from '@/src/services/inviteService';
import { UserProfile, UserRole, Invite } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AppIcon } from '../ui/AppIcon';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Snowflake, 
  Trash2, 
  MoreVertical,
  Mail,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DealerInviteManagerModal } from './DealerInviteManagerModal';
import { motion, AnimatePresence } from 'motion/react';

/**
 * DealerSettingsView
 * Operational control center for Dealer organizations.
 */
export const DealerSettingsView: React.FC = () => {
  const { profile, addToast } = useAuth();
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);

  const fetchManagers = async () => {
    if (!profile?.orgId) return;
    setIsLoading(true);
    try {
      const allUsers = await userService.getUsers(profile.orgId);
      // Filter for Managers (not sales or the dealer itself, though dealer might want to see themselves?)
      // Actually, prompt says "manage Managers".
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

  const fetchPendingInvites = async () => {
    if (!profile?.orgId) return;
    setIsLoadingInvites(true);
    try {
      const invites = await inviteService.getPendingInvitesByOrg(profile.orgId);
      setPendingInvites(invites);
    } catch (error) {
      console.error('Failed to load pending invites:', error);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  useEffect(() => {
    fetchManagers();
    fetchPendingInvites();
  }, [profile?.orgId]);

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

  const handleCancelInvite = async (inviteId: string) => {
    if (!window.confirm('Are you sure you want to cancel this invite? This will invalidate the registration link.')) {
      return;
    }

    setActionInProgress(inviteId);
    try {
      await inviteService.cancelInvite(inviteId);
      addToast('Invite invalidated successfully', 'success');
      setPendingInvites(prev => prev.filter(inv => inv.id !== inviteId));
    } catch (error) {
      addToast('Failed to cancel invite', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredManagers = managers.filter(m => 
    m.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-glow glow-primary/5">
            <AppIcon name="settings" className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <Typography variant="h1" className="text-white italic font-black uppercase tracking-tighter leading-none">
              Dealer Settings
            </Typography>
            <Typography variant="p" className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest opacity-60">
              Organizational Management & Oversight
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsInviteModalOpen(true)}
            className="shadow-glow glow-primary h-11 px-6 font-black uppercase tracking-widest text-xs"
          >
            <UserPlus size={16} className="mr-2" />
            Invite Manager
          </Button>
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <div className="space-y-8 pb-32">
       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-bg-card/20 border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total Managers</Typography>
                <Users size={16} className="text-brand-primary" />
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

       {/* Search & Actions Bar */}
       <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
             <input 
                type="text" 
                placeholder="Find manager by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-slate-600 font-medium"
             />
          </div>
       </div>

       {/* Manager Directory */}
       <div className="space-y-4">
          <div className="flex items-center gap-2">
             <Users size={16} className="text-brand-primary" />
             <Typography variant="h3" className="italic font-black uppercase tracking-tight text-white leading-none">
                Active Management Team
             </Typography>
          </div>
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
                                        manager.role === UserRole.GENERAL_MANAGER ? "text-brand-primary" : "text-slate-400"
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

       {/* Pending Invites Management */}
       <div className="space-y-4">
          <div className="flex items-center gap-2">
             <Clock size={16} className="text-brand-primary" />
             <Typography variant="h3" className="italic font-black uppercase tracking-tight text-white leading-none">
                Pending Invites
             </Typography>
             {pendingInvites.length > 0 && (
                <Badge variant="outline" className="text-brand-primary border-brand-primary/20 bg-brand-primary/5 text-[9px] font-black">{pendingInvites.length}</Badge>
             )}
          </div>
          
          <Card className="bg-bg-card/20 border-white/5 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-white/5 bg-white/[0.01]">
                         <th className="px-6 py-4">
                            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Invited User</Typography>
                         </th>
                         <th className="px-6 py-4">
                            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Role</Typography>
                         </th>
                         <th className="px-6 py-4">
                            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Invited By</Typography>
                         </th>
                         <th className="px-6 py-4">
                            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Expires</Typography>
                         </th>
                         <th className="px-6 py-4 text-right">
                            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Actions</Typography>
                         </th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {isLoadingInvites ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center animate-pulse">
                               <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest">Polling Secure Invites...</Typography>
                            </td>
                         </tr>
                      ) : pendingInvites.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center">
                               <Typography variant="p" className="text-slate-600 text-[11px] font-bold">No outstanding management invites found.</Typography>
                            </td>
                         </tr>
                      ) : (
                         pendingInvites.map((invite) => (
                            <tr key={invite.id} className="hover:bg-white/[0.01] transition-colors group">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                        <Mail size={14} className="text-slate-500" />
                                     </div>
                                     <Typography variant="mono" className="text-[11px] text-white font-bold">{invite.email}</Typography>
                                  </div>
                               </td>
                               <td className="px-6 py-4">
                                  <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 text-slate-400">
                                     {invite.role === UserRole.GENERAL_MANAGER ? 'GM' : 'Manager'}
                                  </Badge>
                               </td>
                               <td className="px-6 py-4">
                                  <Typography variant="mono" className="text-[10px] text-slate-500">{invite.invitedByDisplayName}</Typography>
                               </td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-amber-500/80">
                                     <Clock size={12} />
                                     <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest">
                                        {Math.max(0, Math.ceil((invite.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} Days
                                     </Typography>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  <Button 
                                     variant="ghost" 
                                     size="sm"
                                     onClick={() => handleCancelInvite(invite.id)}
                                     disabled={actionInProgress === invite.id}
                                     className="h-8 px-3 text-rose-500 hover:bg-rose-500/10 text-[9px] font-black uppercase tracking-widest border border-white/5 hover:border-rose-500/20 rounded-lg"
                                  >
                                     Cancel Invite
                                  </Button>
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </Card>
       </div>

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
             fetchManagers();
             fetchPendingInvites();
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
