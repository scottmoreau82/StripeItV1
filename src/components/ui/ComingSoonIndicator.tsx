import React, { useState } from 'react';
import { Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Feature } from '@/src/services/featureAccessService';
import { featureAvailabilityService, FeatureStatus } from '@/src/services/featureAvailabilityService';

/**
 * StripeItComingSoonIndicator
 * A floating, glowing indicator for features that are still in development.
 */

interface ComingSoonIndicatorProps {
  featureId: Feature | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ComingSoonIndicator: React.FC<ComingSoonIndicatorProps> = ({ 
  featureId, 
  className,
  size = 'md'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const status = featureAvailabilityService.getStatus(featureId);

  // If feature is complete, don't show the indicator
  if (featureAvailabilityService.isComplete(featureId)) {
    return null;
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const statusLabel = status === FeatureStatus.PLANNED ? 'Planned' : 'In Dev';

  return (
    <div 
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsHovered(!isHovered);
      }}
    >
      <motion.div
        initial={false}
        animate={{
          scale: isHovered ? 1.1 : 1,
        }}
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-help",
          "bg-white/5 border border-white/10 text-slate-400 backdrop-blur-md",
          "shadow-glow glow-slate/30",
          isHovered && "border-red-500/50 text-white shadow-glow glow-red-500/50"
        )}
      >
        <Timer className={cn(iconSizes[size], isHovered ? "text-red-400" : "text-brand-primary")} />
        <span className="hidden sm:inline">{statusLabel}</span>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: -4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap"
          >
            <div className="bg-bg-deep/95 border border-white/10 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-xl">
              <p className="text-[10px] text-white font-medium tracking-wide">
                {featureAvailabilityService.getTooltipMessage(featureId)}
              </p>
              {/* Optional: Small arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-bg-deep border-b border-r border-white/10 rotate-45 -mt-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
