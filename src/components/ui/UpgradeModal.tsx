import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Typography } from './Typography';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'upgrade' | 'manage';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, mode = 'upgrade' }) => {
  const handleMonthly = () => {
    window.open('https://buy.stripe.com/test_fZu3cu0St7Hk7EDgXq1kA00', '_blank');
    onClose();
  };

  const handleAnnual = () => {
    window.open('https://buy.stripe.com/test_4gM7sK44F5zc0cb6iM1kA01', '_blank');
    onClose();
  };

  const handleManage = () => {
    window.open('https://billing.stripe.com/p/login/test_fZu3cu0St7Hk7EDgXq1kA00', '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-bg-card border border-white/10 rounded-[2rem] p-8 shadow-2xl flex flex-col gap-6"
          >
            {/* Header */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-2xl bg-[#AAFF00]/10 border border-[#AAFF00]/20 flex items-center justify-center text-[#AAFF00]">
                <Crown className="h-7 w-7" />
              </div>
              <div>
                <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                  {mode === 'manage' ? 'Manage Subscription' : 'Go Pro'}
                </Typography>
                <Typography variant="p" className="text-slate-400 text-sm mt-1">
                  {mode === 'manage'
                    ? 'Update your plan, switch billing cycles, or cancel anytime.'
                    : 'Unlock unlimited deals, full commission architect, and every feature.'}
                </Typography>
              </div>
            </div>

            {mode === 'upgrade' ? (
              <>
                {/* Plan Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monthly */}
                  <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Monthly</span>
                      <div className="text-2xl font-black text-white mt-1">$9.95<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                    </div>
                    <button
                      onClick={handleMonthly}
                      className="w-full h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-[11px] font-black uppercase tracking-widest transition-all"
                    >
                      Start Monthly
                    </button>
                  </div>

                  {/* Annual */}
                  <div className="relative flex flex-col gap-4 p-5 rounded-2xl bg-[#AAFF00]/[0.02] border border-[#AAFF00]/30 hover:border-[#AAFF00]/50 transition-all">
                    <div className="absolute -top-3 right-4 bg-[#AAFF00] text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Best Value
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#AAFF00]">Annual</span>
                      <div className="text-2xl font-black text-white mt-1">$99.95<span className="text-sm text-slate-400 font-normal">/yr</span></div>
                      <div className="mt-2 inline-flex items-center bg-[#AAFF00]/10 border border-[#AAFF00]/20 rounded-full px-3 py-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#AAFF00]">Save $19.45 vs monthly</span>
                      </div>
                    </div>
                    <button
                      onClick={handleAnnual}
                      className="w-full h-10 rounded-xl bg-[#AAFF00] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#AAFF00]/90 transition-all shadow-[0_0_20px_-5px_rgba(170,255,0,0.5)]"
                    >
                      Start Annual
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Manage Mode */
              <div className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <Typography variant="p" className="text-slate-400 text-sm">
                  Use the Stripe customer portal to switch plans, update payment methods, or cancel your subscription.
                </Typography>
                <p className="text-[11px] text-slate-600 italic">
                  Cancellations take effect at the end of your current billing period.
                </p>
                <button
                  onClick={handleManage}
                  className="w-full h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Manage Subscription
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <Lock className="h-3 w-3" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secured by Stripe • Cancel anytime • No hidden fees</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
