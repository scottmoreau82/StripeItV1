import React, { useState } from 'react';
import { Info, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { onboardingService } from '@/src/services/onboardingService';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';

/**
 * StripeItContextHintSystem - ContextHint
 * Non-intrusive, dismissible feature callouts.
 */

interface ContextHintProps {
  id: string;
  title: string;
  message: string;
  className?: string;
}

export const ContextHint: React.FC<ContextHintProps> = ({ id, title, message, className }) => {
  const { profile } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if user has already seen this specific hint
  const hasSeen = profile?.preferences?.onboarding?.seenHints?.includes(id);

  if (hasSeen || isDismissed || !profile) return null;

  const handleDismiss = async () => {
    setIsDismissed(true);
    await onboardingService.markHintSeen(profile.uid, id);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "relative p-5 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 flex gap-5 overflow-hidden group shadow-2xl backdrop-blur-sm",
          className
        )}
      >
        {/* Glow Accent */}
        <div className="absolute -left-10 -top-10 h-32 w-32 bg-brand-primary/10 blur-[50px] pointer-events-none" />
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/40" />

        <div className="h-12 w-12 shrink-0 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-glow">
          <Zap className="h-6 w-6 text-brand-primary animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-1.5 py-0.5 rounded bg-brand-primary/20 border border-brand-primary/30">
              <Typography variant="mono" className="text-[8px] text-brand-primary font-black uppercase tracking-[0.2em]">
                Insight
              </Typography>
            </div>
          </div>
          <Typography variant="h3" className="text-white text-base font-display font-bold tracking-tight">
            {title}
          </Typography>
          <Typography variant="p" className="text-slate-400 text-xs leading-relaxed font-medium">
            {message}
          </Typography>
        </div>

        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 ring-1 ring-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
