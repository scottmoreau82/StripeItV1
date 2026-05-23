import React, { useState, useEffect } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { userService } from '@/src/services/userService';
import { UserProfile, SubscriptionTier } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';
import { 
  Search, 
  User as UserIcon, 
  Shield, 
  ArrowUpRight, 
  MoreVertical,
  Check,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface UserManagementPanelProps {
  orgId: string;
}

/**
 * StripeItUserManagementPanel
 * Administrative control center for managing team members and subscription tiers.
 */
export const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ orgId }) => {
  const { profile: currentUser, addToast } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // If user is the bootstrap admin, allow global view by default or if requested
      const isBootstrapAdmin = currentUser?.email?.toLowerCase() === 'scottmoreau82@gmail.com';
      const data = await userService.getUsers(isBootstrapAdmin ? undefined : orgId);
      
      // Identity mapping for deduplication
      const identityMap = new Map<string, UserProfile>();
      const emailToCanonicalKey = new Map<string, string>();
      let detectedDuplicates = false;

      // Helper to calculate record quality score
      const getRecordScore = (u: UserProfile) => {
        let score = 0;
        // Assume longer strings are real Firebase UIDs (vs short auto-ids or placeholders)
        if (u.uid && u.uid.length > 15) score += 1000;
        if (u.displayName && u.displayName !== 'Anonymous User') score += 100;
        if (u.email && u.email !== 'No Email Address') score += 50;
        if (u.photoURL) score += 20;
        // Use updatedAt as a tie-breaker for freshness (normalized to prevent overflow)
        score += (Number(u.updatedAt) || 0) / 1000000000000;
        return score;
      };

      data.forEach(u => {
        const normEmail = u.email?.trim().toLowerCase() || '';
        
        // Priority Identity: 1. UID if it exists, 2. Normalized Email
        let identityKey = u.uid;
        
        // If we've seen this email before, use the canonical record's key for grouping
        if (normEmail) {
          if (emailToCanonicalKey.has(normEmail)) {
            identityKey = emailToCanonicalKey.get(normEmail)!;
          } else {
            emailToCanonicalKey.set(normEmail, identityKey);
          }
        }

        const existing = identityMap.get(identityKey);
        if (!existing) {
          identityMap.set(identityKey, u);
        } else {
          detectedDuplicates = true;
          // Conflict Resolution: Prefer more complete/recent data
          if (getRecordScore(u) > getRecordScore(existing)) {
            identityMap.set(identityKey, u);
          }
        }
      });
      
      const uniqueUsers = Array.from(identityMap.values()).sort((a, b) => 
        (a.displayName || '').localeCompare(b.displayName || '')
      );

      setUsers(uniqueUsers);
      setHasDuplicates(detectedDuplicates);
    } catch (error) {
      addToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      fetchUsers();
    }
  }, [orgId]);

  const handleTierChange = async (userId: string, newTier: SubscriptionTier) => {
    setUpdatingId(userId);
    try {
      await userService.updateSubscriptionTier(userId, newTier);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, subscriptionTier: newTier } : u));
      addToast('Subscription tier updated.', 'success');
    } catch (error) {
      addToast('Failed to update tier.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWipeUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      await userService.wipeUser(userId);
      setUsers(prev =>
        prev.filter(u => u.uid !== userId));
      addToast('User wiped — they can re-register.',
        'success');
      setConfirmDeleteId(null);
    } catch (error) {
      addToast('Failed to wipe user.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleRandomDealAccess = async (userId: string, current: boolean) => {
    try {
      await userService.setRandomDealAccess(userId, !current);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, canCreateRandomDeals: !current } : u));
      addToast(!current ? 'Random deal access enabled.' : 'Random deal access disabled.', 'success');
    } catch (error) {
      addToast('Failed to update access.', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.FREE: return 'text-slate-500 border-slate-500/20 bg-slate-500/5';
      case SubscriptionTier.PRO: return 'text-brand-primary border-brand-primary/20 bg-brand-primary/5';
      case SubscriptionTier.ORGANIZATION: return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5';
      default: return 'text-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic">User Management</Typography>
        
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search team..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {hasDuplicates && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <Shield className="h-3.5 w-3.5 text-amber-500" />
            <Typography variant="small" className="text-amber-500 font-bold text-[10px] uppercase tracking-wider">
              Duplicate profile records detected & resolved automatically
            </Typography>
          </div>
        )}

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
            <Typography variant="p" className="text-slate-500">No users found matching your search.</Typography>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.uid} className="p-4 bg-bg-card/20 border-white/5 hover:border-white/10 transition-all group">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-slate-500" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Typography variant="label" className="text-white truncate">
                        {user.displayName || 'Anonymous User'}
                      </Typography>
                      {user.isAdmin && (
                        <Shield className="h-3 w-3 text-brand-primary" title="Admin" />
                      )}
                      {user.uid === currentUser?.uid && (
                        <Badge variant="outline" className="text-[8px] px-1 py-0 border-blue-500/30 text-blue-400 bg-blue-500/10 font-black uppercase">
                          You
                        </Badge>
                      )}
                    </div>
                    <Typography variant="small" className="text-slate-500 truncate block">
                      {user.email || 'No Email Address'}
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:block">
                     <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-black block text-right mb-1">Active Tier</Typography>
                     <div className="flex items-center gap-2">
                        <select
                          value={user.subscriptionTier}
                          onChange={(e) => handleTierChange(user.uid, e.target.value as SubscriptionTier)}
                          disabled={updatingId === user.uid}
                          className={cn(
                            "bg-bg-deep border border-white/10 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider focus:outline-none transition-all cursor-pointer",
                            getTierColor(user.subscriptionTier)
                          )}
                        >
                          <option value={SubscriptionTier.FREE}>Free</option>
                          <option value={SubscriptionTier.PRO}>Pro</option>
                          <option value={SubscriptionTier.ORGANIZATION}>Dealer</option>
                        </select>
                        {updatingId === user.uid && (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
                        )}
                     </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-black">Test Deals</Typography>
                    <button
                      onClick={() => handleToggleRandomDealAccess(user.uid, !!user.canCreateRandomDeals)}
                      className={cn("relative h-5 w-9 rounded-full border transition-all duration-200", user.canCreateRandomDeals ? "bg-brand-primary/20 border-brand-primary/40" : "bg-white/5 border-white/10")}
                    >
                      <div className={cn("absolute top-0.5 h-4 w-4 rounded-full transition-all duration-200", user.canCreateRandomDeals ? "left-[18px] bg-brand-primary" : "left-0.5 bg-slate-600")} />
                    </button>
                  </div>
                  
                  <div className="h-8 w-px bg-white/5 mx-2" />
                  
                  {confirmDeleteId === user.uid ? (
                    <div className="flex items-center gap-2">
                      <Typography variant="mono"
                        className="text-[9px] text-rose-400 uppercase
                        font-black tracking-widest hidden sm:block">
                        Wipe user?
                      </Typography>
                      <button
                        onClick={() => handleWipeUser(user.uid)}
                        disabled={deletingId === user.uid}
                        className="p-2 rounded-lg bg-rose-500/20
                          border border-rose-500/30 text-rose-400
                          hover:bg-rose-500/30 transition-all
                          active:scale-95 disabled:opacity-50"
                      >
                        {deletingId === user.uid
                          ? <div className="h-4 w-4 animate-spin
                              rounded-full border-2 border-rose-400
                              border-t-transparent" />
                          : <Check size={14} />
                        }
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="p-2 rounded-lg bg-white/5
                          border border-white/10 text-slate-400
                          hover:text-white transition-all active:scale-95"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (user.uid === currentUser?.uid) return;
                        setConfirmDeleteId(user.uid);
                      }}
                      disabled={user.uid === currentUser?.uid}
                      className="p-2 rounded-lg text-slate-600
                        hover:text-rose-400 hover:bg-rose-500/10
                        transition-all disabled:opacity-20
                        disabled:cursor-not-allowed"
                      title={user.uid === currentUser?.uid
                        ? "Cannot delete yourself"
                        : "Wipe user"}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="p-6 bg-brand-primary/5 border border-brand-primary/10 flex items-center gap-4">
        <Shield className="h-5 w-5 text-brand-primary" />
        <Typography variant="small" className="text-brand-primary/80 font-bold">
          Tier updates take effect immediately for the user. Note that billing must still be handled via the Stripe Dashboard for production environments.
        </Typography>
      </Card>
    </div>
  );
};
