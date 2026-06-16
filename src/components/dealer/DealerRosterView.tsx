import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { userService } from '@/src/services/userService';
import { payPlanTemplateService } from '@/src/services/payPlanTemplateService';
import { UserProfile, UserRole, PayPlanTemplate } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import {
  Users, Layers, ChevronDown, X, Check,
  ShieldCheck, UserMinus, UserCheck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

/**
 * DealerRosterView (Dealer tier — Phase 1)
 *
 * Owner-facing list of all org members with:
 * - Single + bulk template assignment (select checkboxes → assign)
 * - Role toggle (Salesperson ↔ Manager)
 * - Remove from org (resets to personal free account)
 */

const ROLE_LABELS: Partial<Record<UserRole, string>> = {
  [UserRole.SALES]: 'Salesperson',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.GENERAL_MANAGER]: 'GM',
  [UserRole.DEALER_OWNER]: 'Owner',
};

const ROLE_COLOR: Partial<Record<UserRole, string>> = {
  [UserRole.SALES]: 'text-emerald-400',
  [UserRole.MANAGER]: 'text-indigo-400',
  [UserRole.GENERAL_MANAGER]: 'text-amber-400',
  [UserRole.DEALER_OWNER]: 'text-brand-primary',
};

export const DealerRosterView: React.FC = () => {
  const { profile, addToast } = useAuth();
  const orgId = profile?.orgId ?? '';

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [templates, setTemplates] = useState<PayPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection for bulk actions
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bulk assign flow
  const [showAssignPicker, setShowAssignPicker] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Inline confirmations
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [users, tmps] = await Promise.all([
        userService.getUsers(orgId),
        payPlanTemplateService.listTemplates(orgId),
      ]);
      // Exclude the Owner themselves from the roster
      setMembers(users.filter(u => u.uid !== profile?.uid));
      setTemplates(tmps.sort((a, b) => (a.templateName || '').localeCompare(b.templateName || '')));
    } catch {
      addToast('Could not load roster.', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, profile?.uid, addToast]);

  useEffect(() => { load(); }, [load]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelect = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const toggleAll = () => {
    const assignable = members.filter(m => m.role !== UserRole.DEALER_OWNER).map(m => m.uid);
    setSelected(prev => prev.size === assignable.length ? new Set() : new Set(assignable));
  };

  const assignable = members.filter(m => m.role !== UserRole.DEALER_OWNER);

  // ── Assign template ───────────────────────────────────────────────────────
  const handleAssign = async (templateId: string, templateName: string) => {
    const targets = selected.size > 0
      ? Array.from(selected)
      : members.filter(m => m.role !== UserRole.DEALER_OWNER).map(m => m.uid);

    if (targets.length === 0) {
      addToast('No members to assign to.', 'error');
      return;
    }

    setAssigning(true);
    try {
      await payPlanTemplateService.assignTemplateToUsers(orgId, targets, templateId);
      addToast(
        `"${templateName}" assigned to ${targets.length} member${targets.length > 1 ? 's' : ''}.`,
        'success'
      );
      setShowAssignPicker(false);
      setSelected(new Set());
      await load();
    } catch {
      addToast('Could not assign template.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ── Role toggle ───────────────────────────────────────────────────────────
  const handleToggleRole = async (member: UserProfile) => {
    const newRole = member.role === UserRole.MANAGER ? UserRole.SALES : UserRole.MANAGER;
    try {
      await userService.updateUserRole(member.uid, newRole);
      setPendingRoleId(null);
      addToast(`${member.displayName} is now a ${ROLE_LABELS[newRole]}.`, 'success');
      await load();
    } catch {
      addToast('Could not update role.', 'error');
    }
  };

  // ── Remove from org ───────────────────────────────────────────────────────
  const handleRemove = async (uid: string) => {
    try {
      await userService.deleteUser(uid);
      setPendingRemoveId(null);
      addToast('Member removed from org.', 'success');
      await load();
    } catch {
      addToast('Could not remove member.', 'error');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const allSelected = selected.size === assignable.length && assignable.length > 0;

  return (
    <DashboardLayout
      header={
        <PageHeader
          icon={Users}
          title="Roster"
          subtitle="Your team — assign pay plans, manage roles"
          actions={
            templates.length > 0 && members.length > 0 ? (
              <div className="relative">
                <Button
                  onClick={() => setShowAssignPicker(v => !v)}
                  className="h-11 px-5 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-glow"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  {selected.size > 0 ? `Assign to ${selected.size}` : 'Assign Template'}
                  <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showAssignPicker && "rotate-180")} />
                </Button>

                {showAssignPicker && (
                  <div className="absolute right-0 top-full mt-2 w-64 z-20 bg-bg-elevated border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-border-subtle">
                      <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                        {selected.size > 0 ? `Assign to ${selected.size} selected` : 'Assign to all'}
                      </Typography>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          onClick={() => handleAssign(t.id, t.templateName)}
                          disabled={assigning}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left"
                        >
                          <Layers className="h-4 w-4 text-brand-primary shrink-0" />
                          <Typography variant="label" className="text-text-primary font-bold text-sm truncate">
                            {t.templateName}
                          </Typography>
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-border-subtle">
                      <button
                        onClick={() => setShowAssignPicker(false)}
                        className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-text-primary py-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : undefined
          }
        />
      }
      main={
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <Card className="p-10 text-center bg-bg-card/40 border-border-subtle">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-brand-primary" />
              </div>
              <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-sm block mb-1">
                No members yet
              </Typography>
              <Typography variant="small" className="text-slate-500 max-w-sm mx-auto block">
                Share your join code or send email invites to add salespeople to your org.
              </Typography>
            </Card>
          ) : (
            <>
              {/* Select-all row */}
              {assignable.length > 1 && (
                <div className="flex items-center gap-3 px-1 pb-1">
                  <button
                    onClick={toggleAll}
                    className={cn(
                      "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                      allSelected
                        ? "bg-brand-primary border-brand-primary"
                        : "border-white/20 hover:border-brand-primary/50"
                    )}
                  >
                    {allSelected && <Check className="h-3 w-3 text-bg-deep" />}
                  </button>
                  <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    {allSelected ? 'Deselect all' : `Select all (${assignable.length})`}
                  </Typography>
                </div>
              )}

              {/* Member rows */}
              <div className="space-y-2">
                {members.map(member => {
                  const isOwner = member.role === UserRole.DEALER_OWNER;
                  const isSelected = selected.has(member.uid);

                  return (
                    <Card
                      key={member.uid}
                      className={cn(
                        "p-4 border transition-all",
                        isSelected
                          ? "bg-brand-primary/[0.04] border-brand-primary/30"
                          : "bg-bg-card/40 border-border-subtle hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Checkbox */}
                        {!isOwner && (
                          <button
                            onClick={() => toggleSelect(member.uid)}
                            className={cn(
                              "h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                              isSelected
                                ? "bg-brand-primary border-brand-primary"
                                : "border-white/20 hover:border-brand-primary/50"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-bg-deep" />}
                          </button>
                        )}

                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                          <Typography variant="label" className="text-text-primary font-black text-sm">
                            {(member.displayName || member.email || '?')[0].toUpperCase()}
                          </Typography>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Typography variant="label" className="text-text-primary font-black text-sm block truncate">
                            {member.displayName || 'Unnamed'}
                          </Typography>
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <Typography variant="mono" className="text-[10px] text-slate-500 truncate">
                              {member.email}
                            </Typography>
                            <Typography variant="mono" className={cn("text-[10px] font-bold uppercase tracking-widest shrink-0", ROLE_COLOR[member.role as UserRole] ?? 'text-slate-400')}>
                              {ROLE_LABELS[member.role as UserRole] ?? member.role}
                            </Typography>
                          </div>
                        {/* Template assigned indicator could go here once we load plan state */}
                        </div>

                        {/* Actions */}
                        {!isOwner && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Role toggle */}
                            {pendingRoleId === member.uid ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                                <Typography variant="mono" className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">
                                  {member.role === UserRole.MANAGER ? '→ Salesperson?' : '→ Manager?'}
                                </Typography>
                                <Button
                                  onClick={() => handleToggleRole(member)}
                                  className="h-7 px-2.5 bg-indigo-600/80 text-white font-black uppercase tracking-widest text-[9px] rounded-lg"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setPendingRoleId(null)}
                                  className="h-7 px-2 text-slate-500 hover:text-text-primary text-[9px] font-black"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : pendingRemoveId === member.uid ? (
                              <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                                <Typography variant="mono" className="text-[9px] text-rose-400 uppercase font-bold tracking-widest">
                                  Remove?
                                </Typography>
                                <Button
                                  onClick={() => handleRemove(member.uid)}
                                  className="h-7 px-2.5 bg-rose-600/90 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[9px] rounded-lg"
                                >
                                  Confirm
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setPendingRemoveId(null)}
                                  className="h-7 px-2 text-slate-500 hover:text-text-primary text-[9px] font-black"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  onClick={() => setPendingRoleId(member.uid)}
                                  className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-400 rounded-lg flex items-center justify-center"
                                  title={member.role === UserRole.MANAGER ? 'Demote to Salesperson' : 'Promote to Manager'}
                                >
                                  {member.role === UserRole.MANAGER
                                    ? <UserCheck className="h-4 w-4" />
                                    : <ShieldCheck className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setPendingRemoveId(member.uid)}
                                  className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 rounded-lg flex items-center justify-center"
                                  title="Remove from org"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
