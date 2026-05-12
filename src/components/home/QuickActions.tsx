import React from 'react';
import { Button } from '../ui/Button';
import { StickyNote } from 'lucide-react';
import { Typography } from '../ui/Typography';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

import { ComingSoonIndicator } from '../ui/ComingSoonIndicator';
import { Feature } from '@/src/services/featureAccessService';

/**
 * StripeItQuickEntrySystem
 * Centralized quick actions for mobile and desktop home.
 */

interface QuickActionsProps {
  onQuickNote: () => void;
  className?: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onQuickNote, className }) => {
  return (
    <div className={cn("grid grid-cols-1 gap-4", className)}>
      <motion.button
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onQuickNote}
        className="flex flex-col items-center justify-center p-5 bg-white/[0.01] border border-white/5 rounded-2xl gap-2 hover:bg-white/[0.03] hover:border-white/10 transition-all group relative"
      >
        <div className="h-10 w-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-white/5 group-hover:border-brand-primary/20 transition-colors">
          <StickyNote className="h-5 w-5 text-slate-400 group-hover:text-brand-primary transition-colors" />
        </div>
        <Typography variant="mono" className="text-[9px] uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Quick Note</Typography>
      </motion.button>
    </div>
  );
};
