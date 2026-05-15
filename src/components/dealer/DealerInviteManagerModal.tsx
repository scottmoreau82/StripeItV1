import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Typography } from '../ui/Typography';
import { useAuth } from '@/src/contexts/AuthContext';
import { inviteService } from '@/src/services/inviteService';
import { UserRole } from '@/src/types';
import { AppIcon } from '../ui/AppIcon';

interface DealerInviteManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DealerInviteManagerModal: React.FC<DealerInviteManagerModalProps> = ({ isOpen, onClose }) => {
  const { profile, addToast, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [targetOrgId, setTargetOrgId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    const finalOrgId = isAdmin ? targetOrgId : profile.orgId;
    if (!finalOrgId || !email) {
      addToast('Org ID and Email are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteService.createInvite(
        finalOrgId, 
        profile, 
        email, 
        UserRole.MANAGER
      );
      
      addToast('Invite sent successfully to the user\'s inbox!', 'success');
      setEmail('');
      setTargetOrgId('');
      onClose();
    } catch (error: any) {
      console.error("Invite Error:", error);
      addToast(error.message || 'Failed to send invite.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Manager"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4 space-y-2">
            <Typography variant="mono" className="text-brand-primary text-[9px] uppercase font-black tracking-widest flex items-center gap-2">
              <AppIcon name="info" size={12} />
              Organizational Rule
            </Typography>
            <Typography variant="p" className="text-slate-400 text-[11px] leading-relaxed">
              Dealers may only invite <span className="text-white font-bold">existing StripeIt users</span> whose email domain matches your professional domain (@{profile?.email.split('@')[1]}).
            </Typography>
          </div>
          
          <Input
            label="Professional Email"
            type="email"
            placeholder="someone@yourdealership.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/5 border-white/10"
          />

          {isAdmin && (
            <Input
              label="Target Organization ID"
              type="text"
              placeholder="ORG-NAME"
              value={targetOrgId}
              onChange={(e) => setTargetOrgId(e.target.value)}
              required
              className="bg-white/5 border-white/10"
            />
          )}

          <Button 
            type="submit" 
            className="w-full h-12 shadow-glow glow-primary"
            isLoading={isSubmitting}
          >
            Dispatch Invitation
          </Button>
        </form>
        
        <div className="pt-4 border-t border-white/5 flex justify-center">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-white uppercase font-bold text-[10px] tracking-widest">
            Close Control Panel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
