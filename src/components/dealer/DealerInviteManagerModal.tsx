import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Typography } from '../ui/Typography';
import { useAuth } from '@/src/contexts/AuthContext';
import { joinCodeService } from '@/src/services/joinCodeService';
import { DealerJoinCode, JoinCodeStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Key, Copy, X, Clock, Users, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface DealerInviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealerInviteManagerModal: React.FC<DealerInviteManagerModalProps> = ({ isOpen, onClose }) => {
  const { profile, addToast } = useAuth();
  const [activeCodes, setActiveCodes] = useState<DealerJoinCode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [department, setDepartment] = useState<'Retail' | 'Internet'>('Retail');
  const [expiresIn, setExpiresIn] = useState(7); // default 7 days
  const [maxUses, setMaxUses] = useState(1);

  const fetchCodes = async () => {
    if (!profile?.orgId) return;
    try {
      const codes = await joinCodeService.getJoinCodes(profile.orgId);
      setActiveCodes(codes.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error fetching codes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCodes();
    }
  }, [isOpen, profile?.orgId]);

  const handleGenerateCode = async () => {
    if (!profile?.orgId) return;
    
    setIsGenerating(true);
    try {
      const dealerDomain = profile.email?.split('@')[1]?.toLowerCase().trim();
      
      const code = await joinCodeService.createJoinCode({
        organizationId: profile.orgId,
        dealerName: profile.orgName || 'Dealership',
        dealerDomain,
        createdBy: profile.uid,
        expiresInDays: expiresIn,
        maxUses: maxUses,
        department
      });
      
      addToast(`Join code ${code} generated successfully!`, 'success');
      fetchCodes();
    } catch (error) {
      addToast('Failed to generate join code.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeactivate = async (codeId: string) => {
    try {
      await joinCodeService.deactivateJoinCode(codeId);
      addToast('Code deactivated.', 'info');
      fetchCodes();
    } catch (error) {
      addToast('Failed to deactivate code.', 'error');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    addToast('Code copied to clipboard!', 'success');
  };

  const activeCount = activeCodes.filter(c => c.status === JoinCodeStatus.ACTIVE && c.expiresAt > Date.now()).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Access Control: Manager Onboarding"
      maxWidth="max-w-xl"
    >
      <div className="space-y-8">
        {/* Header / Instructions */}
        <div className="space-y-2">
          <Typography variant="p" className="text-slate-400 text-xs leading-relaxed">
            Generate secure join codes to onboard existing users as Managers. Codes are domain-restricted to <span className="text-brand-primary font-bold">@{profile?.email?.split('@')[1]}</span>.
          </Typography>
        </div>

        {/* Generator Controls */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest pl-1">Department</Typography>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value as any)}
                className="w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-wider focus:border-brand-primary/50 outline-none h-11"
              >
                <option value="Retail">Retail Sales</option>
                <option value="Internet">Internet Dept</option>
              </select>
            </div>
            <div className="space-y-2">
              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest pl-1">Expiration</Typography>
              <select 
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className="w-full bg-bg-deep border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-wider focus:border-brand-primary/50 outline-none h-11"
              >
                <option value={1}>24 Hours</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black tracking-widest pl-1">Max Uses</Typography>
              <Input 
                type="number"
                min={1}
                max={50}
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="bg-bg-deep h-11 text-xs font-bold"
              />
            </div>
            <div className="flex-[2] pt-5">
              <Button 
                onClick={handleGenerateCode}
                isLoading={isGenerating}
                className="w-full h-11 bg-brand-primary text-bg-deep font-black uppercase tracking-[0.2em] text-[10px]"
              >
                Generate Code
              </Button>
            </div>
          </div>
        </div>

        {/* List of Codes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Typography variant="mono" className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
              <Key size={12} className="text-brand-primary" />
              Active Codes ({activeCount})
            </Typography>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="h-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-primary border-t-transparent" />
              </div>
            ) : activeCodes.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/5">
                <Typography variant="p" className="text-slate-600 text-[10px] italic">No join codes generated yet.</Typography>
              </div>
            ) : (
              activeCodes.map((item) => {
                const isExpired = item.expiresAt < Date.now();
                const isFullyUsed = item.usedCount >= item.maxUses;
                const isActive = item.status === JoinCodeStatus.ACTIVE && !isExpired && !isFullyUsed;

                return (
                  <div 
                    key={item.id}
                    className={cn(
                      "group p-4 rounded-xl border transition-all flex items-center justify-between",
                      isActive 
                        ? "bg-white/[0.02] border-white/5 hover:border-brand-primary/30" 
                        : "bg-black/20 border-white/5 opacity-60 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex flex-col items-center justify-center font-mono font-black text-lg tracking-tighter",
                        isActive ? "bg-brand-primary/10 text-brand-primary" : "bg-white/5 text-slate-500"
                      )}>
                        {item.code}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Typography variant="mono" className="text-[10px] text-white font-black">{item.department}</Typography>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                          )}>
                            {isActive ? 'Active' : isExpired ? 'Expired' : isFullyUsed ? 'Used' : item.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-500 text-[9px] font-medium">
                          <span className="flex items-center gap-1"><Clock size={10} /> {format(item.expiresAt, 'MMM d, h:mm a')}</span>
                          <span className="flex items-center gap-1"><Users size={10} /> {item.usedCount}/{item.maxUses} Used</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && (
                        <button 
                          onClick={() => copyToClipboard(item.code)}
                          className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Copy Code"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      {item.status === JoinCodeStatus.ACTIVE && (
                        <button 
                          onClick={() => handleDeactivate(item.id)}
                          className="h-8 w-8 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Cancel Code"
                        >
                          <X size={14} />
                        </button>
                      )}
                      {!isActive && item.usedBy.length > 0 && (
                        <div className="h-8 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10 flex items-center gap-1.5 text-emerald-500" title="Code Redeemed">
                           <CheckCircle2 size={12} />
                           {item.usedCount > 1 && <span className="text-[10px] font-black">{item.usedCount}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/5 flex justify-center">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-white uppercase font-bold text-[10px] tracking-widest">
            Close Control Panel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
