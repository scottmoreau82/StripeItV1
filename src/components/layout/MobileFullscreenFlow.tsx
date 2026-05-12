import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { useResponsive } from '@/src/hooks/useResponsive';

/**
 * StripeItFullscreenMobileFlowSystem
 * Fullscreen workflows optimized for mobile speed and one-handed use.
 */
interface FullscreenFlowProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const FullscreenMobileFlow: React.FC<FullscreenFlowProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const { isMobile } = useResponsive();

  // On desktop, we might want to fallback to a modal or just show this as a centered overlay.
  // The system specifically asks for "Fullscreen mobile flows" for mobile.
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 flex flex-col bg-bg-deep"
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-border-subtle px-6 shrink-0">
            <Typography variant="h3" className="text-white">{title}</Typography>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-lg">
               {children}
            </div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-border-subtle p-6 bg-bg-main/50 backdrop-blur-md shrink-0">
              <div className="mx-auto max-w-lg">
                {footer}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
