import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AppIcon } from '../ui/AppIcon';
import { ShieldCheck, X, Check, AlertCircle } from 'lucide-react';
import { Invite, InviteStatus } from '@/src/types';
import { inviteService } from '@/src/services/inviteService';
import { useAuth } from '@/src/contexts/AuthContext';
import { cn } from '@/src/lib/utils';

interface InviteModalProps {
  invite: Invite | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * InviteModal
 * Organizational transition gateway for invited managers.
 */
export const InviteModal: React.FC<InviteModalProps> = ({ 
  invite, 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { profile, addToast } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!invite || !profile) return null;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await inviteService.acceptInvite(invite.id, profile.uid);
      addToast('Welcome to the organization!', 'success');
      onSuccess();
      onClose();
      // Reload to apply new role/org context
      window.location.reload();
    } catch (error: any) {
      addToast(error.message || 'Failed to accept invite', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await inviteService.declineInvite(invite.id, profile.uid);
      addToast('Invite declined', 'info');
      onClose();
    } catch (error: any) {
      addToast('Failed to decline invite', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg"
          >
            <Card className="bg-bg-card border border-white/10 shadow-2xl overflow-hidden rounded-[2.5rem]">
              <div className="absolute top-0 right-0 p-6">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="rounded-full text-slate-500 hover:text-white"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="p-10 space-y-8">
                {/* Header/Icon */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="h-20 w-20 rounded-3xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-glow glow-primary/5">
                    <ShieldCheck size={40} className="text-brand-primary" />
                  </div>
                  <div className="space-y-1">
                    <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter">
                      Organizational Invite
                    </Typography>
                    <Typography variant="mono" className="text-[10px] text-brand-primary uppercase tracking-[0.2em] font-black">
                      Management Authorization
                    </Typography>
                  </div>
                </div>

                {/* Content */}
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-center space-y-4">
                  <Typography variant="p" className="text-slate-300 text-lg leading-relaxed font-medium">
                    <span className="text-white font-black">{invite.invitedByDisplayName}</span> has invited you to help manage the Deal Board at <span className="text-brand-primary font-black uppercase tracking-tight">{invite.orgName}</span>.
                  </Typography>
                  
                  <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <AlertCircle size={14} />
                      <Typography variant="small" className="text-[11px] font-bold uppercase tracking-wider">
                        Existing Account Persistence
                      </Typography>
                    </div>
                    <Typography variant="small" className="text-slate-500 text-[10px] max-w-xs leading-normal">
                      Accepting this will associate your account with this organization. 
                      Your existing data and profile will be preserved.
                    </Typography>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handleDecline}
                    disabled={isProcessing}
                    className="h-14 rounded-2xl border-white/10 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 font-black uppercase tracking-widest text-xs"
                  >
                    Decline
                  </Button>
                  <Button 
                    onClick={handleAccept}
                    disabled={isProcessing}
                    className="h-14 rounded-2xl shadow-glow glow-primary font-black uppercase tracking-widest text-xs"
                  >
                    {isProcessing ? 'Processing...' : 'Accept & Join'}
                    <Check size={18} className="ml-2" />
                  </Button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-brand-primary/10 px-10 py-4 flex items-center justify-between">
                <Typography variant="mono" className="text-[9px] text-brand-primary/80 font-black uppercase tracking-widest">
                  Secure Onboarding Token Active
                </Typography>
                <div className="flex gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-brand-primary animate-pulse" />
                  <div className="h-1 w-1 rounded-full bg-brand-primary animate-pulse delay-75" />
                  <div className="h-1 w-1 rounded-full bg-brand-primary animate-pulse delay-150" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
