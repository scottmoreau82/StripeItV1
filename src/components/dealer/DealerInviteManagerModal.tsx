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
    const finalOrgId = isAdmin ? targetOrgId : profile?.orgId;
    if (!finalOrgId || !email) {
      addToast('Org ID and Email are required', 'error');
      return;
    }

    // Domain validation for non-admin Dealers
    if (!isAdmin && profile?.email) {
      const dealerDomain = profile.email.split('@')[1]?.toLowerCase().trim();
      const inviteDomain = email.split('@')[1]?.toLowerCase().trim();
      
      if (dealerDomain && inviteDomain && dealerDomain !== inviteDomain) {
        addToast(`Domain mismatch: You can only invite users with @${dealerDomain} email addresses.`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const inviteId = await inviteService.createInvite(
        finalOrgId, 
        profile!.uid, 
        email, 
        UserRole.MANAGER
      );
      
      // Since I don't send emails real-world here, I'll generate the link for the user to copy
      const token = (await import('firebase/firestore').then(async ({ getDoc, doc }) => {
        const { db } = await import('../../lib/firebase');
        const snap = await getDoc(doc(db, 'invites', inviteId));
        return snap.data()?.token;
      }));

      const baseUrl = window.location.origin;
      const inviteUrl = `${baseUrl}/signup?inviteId=${inviteId}&token=${token}`;
      
      setLastInviteLink(inviteUrl);
      addToast('Invite generated successfully!', 'success');
      setEmail('');
      setTargetOrgId('');
    } catch (error) {
      console.error("Invite Error:", error);
      addToast('Failed to generate invite.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (lastInviteLink) {
      navigator.clipboard.writeText(lastInviteLink);
      addToast('Invite link copied to clipboard!', 'success');
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
        {!lastInviteLink ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Typography variant="p" className="text-slate-400 text-xs leading-relaxed">
              Enter the professional email address of the manager you wish to onboard. They will receive access to your Dealer environment.
            </Typography>
            
            <Input
              label="Manager Email"
              type="email"
              placeholder="manager@dealership.com"
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
              Generate Secure Invite
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/10 space-y-3">
              <Typography variant="mono" className="text-brand-primary text-[10px] uppercase font-black tracking-widest">
                Secure Invite Link
              </Typography>
              <div className="flex bg-black/40 rounded-lg overflow-hidden border border-white/5">
                <input 
                  readOnly
                  value={lastInviteLink}
                  className="flex-1 bg-transparent px-3 py-2 text-[10px] font-mono text-slate-400 outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="bg-white/5 hover:bg-white/10 px-3 transition-colors"
                >
                  <AppIcon name="copy" size={14} className="text-brand-primary" />
                </button>
              </div>
            </div>
            
            <Typography variant="p" className="text-slate-500 text-[10px] italic text-center">
              Copy this link and send it to your manager. It expires in 7 days.
            </Typography>

            <Button 
              variant="outline"
              onClick={() => setLastInviteLink(null)}
              className="w-full border-white/10"
            >
              Invite Another
            </Button>
          </div>
        )}
        
        <div className="pt-4 border-t border-white/5 flex justify-center">
          <Button variant="ghost" onClick={onClose} className="text-slate-500 hover:text-white uppercase font-bold text-[10px] tracking-widest">
            Close Control Panel
          </Button>
        </div>
      </div>
    </Modal>
  );
};
