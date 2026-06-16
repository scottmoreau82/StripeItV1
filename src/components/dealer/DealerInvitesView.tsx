import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { inviteService } from '@/src/services/inviteService';
import { Invite, UserRole } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Typography } from '../ui/Typography';
import { UserPlus, Link, Copy, RefreshCw, X, Check, Mail, Users, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/**
 * DealerInvitesView (Dealer tier — Phase 1)
 *
 * Two join paths:
 * 1. Reusable join code — generate once, share with the team, deactivate when needed.
 * 2. Email invite — enter email + role, creates a pending invite the invitee claims on signup.
 */

export const DealerInvitesView: React.FC = () => {
  const { profile, addToast } = useAuth();
  const orgId = profile?.orgId ?? '';

  // ── Join Code state ──────────────────────────────────────────────────────
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [codeLoading, setCodeLoading] = useState(true);
  const [codeGenerating, setCodeGenerating] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // ── Email invite state ───────────────────────────────────────────────────
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole.SALES | UserRole.MANAGER>(UserRole.SALES);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────
  const loadCode = useCallback(async () => {
    if (!orgId) return;
    setCodeLoading(true);
    try {
      const code = await inviteService.getJoinCode(orgId);
      setJoinCode(code);
    } catch {
      addToast('Could not load join code.', 'error');
    } finally {
      setCodeLoading(false);
    }
  }, [orgId, addToast]);

  const loadInvites = useCallback(async () => {
    if (!orgId) return;
    setInvitesLoading(true);
    try {
      const list = await inviteService.listInvites(orgId);
      setInvites(list.sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      addToast('Could not load invites.', 'error');
    } finally {
      setInvitesLoading(false);
    }
  }, [orgId, addToast]);

  useEffect(() => { loadCode(); loadInvites(); }, [loadCode, loadInvites]);

  // ── Join Code handlers ───────────────────────────────────────────────────
  const handleGenerateCode = async () => {
    setCodeGenerating(true);
    try {
      const code = await inviteService.generateJoinCode(orgId);
      setJoinCode(code);
      addToast('Join code generated.', 'success');
    } catch {
      addToast('Could not generate join code.', 'error');
    } finally {
      setCodeGenerating(false);
    }
  };

  const handleDeactivateCode = async () => {
    try {
      await inviteService.deactivateJoinCode(orgId);
      setJoinCode(null);
      addToast('Join code deactivated.', 'success');
    } catch {
      addToast('Could not deactivate code.', 'error');
    }
  };

  const handleCopyCode = () => {
    if (!joinCode) return;
    navigator.clipboard.writeText(joinCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  // ── Email invite handlers ────────────────────────────────────────────────
  const handleSendInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      addToast('Enter a valid email address.', 'error');
      return;
    }
    setInviting(true);
    try {
      await inviteService.createInvite(orgId, trimmed, role, profile?.uid ?? '');
      addToast(`Invite sent to ${trimmed}.`, 'success');
      setEmail('');
      await loadInvites();
    } catch {
      addToast('Could not send invite.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await inviteService.cancelInvite(inviteId);
      setPendingCancelId(null);
      addToast('Invite cancelled.', 'success');
      await loadInvites();
    } catch {
      addToast('Could not cancel invite.', 'error');
    }
  };

  const roleLabel = (r: UserRole) =>
    r === UserRole.MANAGER ? 'Manager' : 'Salesperson';

  const roleColor = (r: UserRole) =>
    r === UserRole.MANAGER ? 'text-indigo-400' : 'text-emerald-400';

  return (
    <DashboardLayout
      header={
        <PageHeader
          icon={UserPlus}
          title="Invites / Join Codes"
          subtitle="Add salespeople and managers to your dealership"
        />
      }
      main={
        <div className="space-y-10">

          {/* ── Join Code ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-brand-primary" />
              <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-[11px]">
                Reusable Join Code
              </Typography>
            </div>
            <Typography variant="small" className="text-slate-500 block -mt-2">
              Anyone with this code can join your dealership as a salesperson. Deactivate it to stop new joins.
            </Typography>

            <Card className="p-6 bg-bg-card/40 border-border-subtle">
              {codeLoading ? (
                <div className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
              ) : joinCode ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 font-mono text-2xl font-black tracking-[0.25em] text-brand-primary bg-brand-primary/10 border border-brand-primary/20 rounded-2xl px-6 py-4 text-center select-all">
                    {joinCode}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      onClick={handleCopyCode}
                      className={cn(
                        "h-12 px-5 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all",
                        codeCopied
                          ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                          : "bg-brand-primary text-bg-deep"
                      )}
                    >
                      {codeCopied ? <Check className="h-4 w-4 mr-1.5" /> : <Copy className="h-4 w-4 mr-1.5" />}
                      {codeCopied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerateCode}
                      isLoading={codeGenerating}
                      className="h-12 px-4 border-white/10 text-slate-400 hover:text-text-primary hover:border-white/20 rounded-xl"
                      title="Generate a new code"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleDeactivateCode}
                      className="h-12 px-4 text-slate-500 hover:text-rose-400 rounded-xl"
                      title="Deactivate code"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 gap-4 text-center">
                  <div className="h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                    <Link className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <Typography variant="label" className="text-slate-500 font-black uppercase tracking-widest text-[10px] block mb-1">
                      No active join code
                    </Typography>
                    <Typography variant="small" className="text-slate-600 block">
                      Generate a code to share with your team.
                    </Typography>
                  </div>
                  <Button
                    onClick={handleGenerateCode}
                    isLoading={codeGenerating}
                    className="h-11 px-6 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] rounded-xl"
                  >
                    Generate Code
                  </Button>
                </div>
              )}
            </Card>
          </section>

          {/* ── Email Invites ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-brand-primary" />
              <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-[11px]">
                Email Invite
              </Typography>
            </div>
            <Typography variant="small" className="text-slate-500 block -mt-2">
              Send a targeted invite with a pre-assigned role. The invitee claims it when they sign up.
            </Typography>

            <Card className="p-6 bg-bg-card/40 border-border-subtle space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="colleague@dealership.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSendInvite(); } }}
                  className="flex-1 h-12"
                />
                {/* Role toggle */}
                <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl p-1 shrink-0">
                  {([UserRole.SALES, UserRole.MANAGER] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all",
                        role === r
                          ? "bg-brand-primary text-bg-deep"
                          : "text-slate-500 hover:text-text-primary"
                      )}
                    >
                      {r === UserRole.MANAGER ? <ShieldCheck className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {roleLabel(r)}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleSendInvite}
                  isLoading={inviting}
                  className="h-12 px-6 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] rounded-xl shrink-0"
                >
                  Send Invite
                </Button>
              </div>
            </Card>

            {/* Pending invites list */}
            {invitesLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : invites.length > 0 ? (
              <div className="space-y-2">
                <Typography variant="mono" className="text-[10px] text-slate-600 uppercase font-bold tracking-widest block px-1">
                  Pending ({invites.length})
                </Typography>
                {invites.map(invite => (
                  <Card
                    key={invite.id}
                    className="p-4 bg-bg-card/40 border-border-subtle flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <Typography variant="label" className="text-text-primary font-bold text-sm block truncate">
                          {invite.email}
                        </Typography>
                        <Typography variant="mono" className={cn("text-[10px] font-bold uppercase tracking-widest", roleColor(invite.role))}>
                          {roleLabel(invite.role)}
                        </Typography>
                      </div>
                    </div>

                    {pendingCancelId === invite.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in duration-200">
                        <Typography variant="mono" className="text-[10px] text-rose-400 uppercase font-bold tracking-widest mr-1">
                          Cancel?
                        </Typography>
                        <Button
                          onClick={() => handleCancelInvite(invite.id)}
                          className="h-8 px-3 bg-rose-600/90 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[9px] rounded-lg"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setPendingCancelId(null)}
                          className="h-8 px-3 text-slate-500 hover:text-text-primary font-black uppercase tracking-widest text-[9px]"
                        >
                          Keep
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => setPendingCancelId(invite.id)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 rounded-lg flex items-center justify-center shrink-0"
                        aria-label="Cancel invite"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      }
    />
  );
};
