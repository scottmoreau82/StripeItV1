import React from 'react';
import { Typography } from './Typography';
import { Card } from './Card';
import { Button } from './Button';
import { Lock, Sparkles, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

/**
 * StripeItUpgradePromptSystem
 * Premium upgrade prompts for locked features.
 */

interface UpgradePromptProps {
  title: string;
  description: string;
  tierRequired: string;
  onUpgrade?: () => void;
  className?: string;
  compact?: boolean;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  title, 
  description, 
  tierRequired, 
  onUpgrade,
  className,
  compact = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("w-full h-full flex items-center justify-center", className)}
    >
      <Card className={cn(
        "p-8 text-center relative overflow-hidden bg-white/[0.02] border-brand-primary/10 max-w-md mx-auto",
        compact && "p-4 py-6"
      )}>
        {/* Glowing Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 text-brand-primary shadow-glow mb-2">
            <Lock size={24} />
          </div>
          
          <div>
            <Typography variant="h3" className="text-white italic font-black uppercase tracking-tight mb-2">
              Unlock {title}
            </Typography>
            <Typography variant="p" className="text-slate-400 text-sm leading-relaxed mb-6 px-4">
              {description}
            </Typography>
          </div>

          <div className="w-full space-y-3">
             <Button 
               onClick={onUpgrade}
               className="w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest py-6 shadow-glow"
             >
               <Sparkles size={16} className="mr-2" />
               Upgrade to {tierRequired}
             </Button>
             
             <button 
               className="text-[10px] text-slate-600 uppercase font-bold tracking-widest hover:text-slate-400 transition-colors flex items-center gap-1 mx-auto"
               onClick={() => {}} // Could link to a plans comparison page
             >
                Compare All Plans <ChevronRight size={10} />
             </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
