import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppIcon } from './AppIcon';
import { Typography } from './Typography';
import { cn } from '@/src/lib/utils';

/**
 * StripeItModalSystem
 * Accessible and responsive modal system.
 */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 md:items-center overflow-y-auto py-8 md:py-10">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full rounded-[2rem] bg-bg-main shadow-2xl border border-border-card my-auto flex flex-col max-h-[calc(100vh-4rem)]",
              maxWidth,
              className
            )}
          >
            <div className="p-8 md:p-10 pb-0 md:pb-0 flex-none flex items-center justify-between mb-8 gap-4">
              {title && (
                <div className="space-y-1 text-center md:text-left flex-1 min-w-0">
                  <Typography variant="h3" className="font-display font-black text-text-primary italic uppercase tracking-tighter text-center md:text-left">
                    {title}
                  </Typography>
                  <div className="h-1 w-12 bg-brand-primary rounded shadow-cyan-glow mx-auto md:mx-0" />
                </div>
              )}
              <button 
                onClick={onClose}
                className="rounded-xl p-2 text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition-all active:scale-95 border border-transparent hover:border-border-card shrink-0"
              >
                <AppIcon name="close" className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative z-10 flex-1 overflow-y-auto p-8 md:p-10 pt-0 md:pt-0 custom-scrollbar">
              {children}
            </div>

            {/* Subtle bottom glow decorative element */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-brand-primary/[0.02] blur-[80px] pointer-events-none" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
