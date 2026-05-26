import React, { useState } from 'react';
import { Modal } from './Modal';
import { Typography } from './Typography';
import { Button } from './Button';
import { useAuth } from '@/src/contexts/AuthContext';
import { stripeService } from '@/src/services/stripeService';
import { Crown, Sparkles, Zap, ShieldCheck, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'upgrade' | 'manage';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  mode,
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStripeAction = async () => {
    if (!user || !user.uid) {
      setError('You must be logged in to manage your subscription.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await stripeService.createCheckoutSession(user.uid, user.email || '');
    } catch (err: any) {
      console.error('Subscription redirect error:', err);
      // Fallback checkout link in case worker has issues
      const fallbackUrl = `https://buy.stripe.com/test_fZu3cu0St7Hk7EDgXq1kA00?client_reference_id=${user.uid}&prefilled_email=${encodeURIComponent(user.email || '')}`;
      window.location.href = fallbackUrl;
    } finally {
      setLoading(false);
    }
  };

  const titleText = mode === 'manage' ? 'Manage Subscription' : 'Upgrade to Pro';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titleText}
      className="z-[60]"
    >
      {mode === 'upgrade' ? (
        <div className="flex flex-col items-center text-center gap-6 py-2 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[60px] rounded-full -mr-12 pointer-events-none" />
          
          <div className="h-16 w-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 text-brand-primary shadow-glow shrink-0 animate-pulse">
            <Crown size={32} />
          </div>

          <div className="space-y-2">
            <Typography variant="h3" className="text-white italic font-black uppercase tracking-tight">
              Stripe It Pro
            </Typography>
            <Typography variant="p" className="text-slate-400 text-sm leading-relaxed px-4">
              Unlock unlimited deal logs, advanced tracking metrics, premium sales intelligence, and custom dashboard layouts.
            </Typography>
          </div>

          <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left space-y-4">
            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <Zap size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">Unlimited Logging</span>
                <span className="text-[11px] text-slate-500">Log endless deals and transactions with no restrictions.</span>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <Sparkles size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">Dynamic Insights</span>
                <span className="text-[11px] text-slate-500">Access metrics, goals tracking, and automated commission projections.</span>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider block">Customer Portal Management</span>
                <span className="text-[11px] text-slate-500">Manage invoices and plan tiers dynamically at any time.</span>
              </div>
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs font-bold uppercase tracking-wider">{error}</p>}

          <Button
            onClick={handleStripeAction}
            isLoading={loading}
            disabled={loading}
            className="w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest py-6 shadow-glow glow-primary mt-2"
          >
            Upgrade Now
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center gap-6 py-2 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[60px] rounded-full -mr-12 pointer-events-none" />

          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-glow shadow-emerald-500/20 shrink-0">
            <ShieldCheck size={32} />
          </div>

          <div className="space-y-2">
            <Typography variant="h3" className="text-emerald-400 italic font-black uppercase tracking-tight">
              Subscription Active
            </Typography>
            <Typography variant="p" className="text-slate-400 text-sm leading-relaxed px-4">
              You are currently on the <span className="text-white font-bold">{profile?.subscriptionTier.toUpperCase()}</span> tier. Manage your billing, check your invoices, or update your plan limits on Stripe.
            </Typography>
          </div>

          <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Active Plan</span>
              <span className="text-xs font-mono font-black text-white uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/10">
                {profile?.subscriptionTier}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Billing Method</span>
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard size={14} className="text-slate-400" />
                Stripe Secure
              </span>
            </div>
          </div>

          {error && <p className="text-rose-500 text-xs font-bold uppercase tracking-wider">{error}</p>}

          <Button
            onClick={handleStripeAction}
            isLoading={loading}
            disabled={loading}
            className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-black uppercase tracking-widest py-6 mt-2"
          >
            Manage Billing
          </Button>
        </div>
      )}
    </Modal>
  );
};
