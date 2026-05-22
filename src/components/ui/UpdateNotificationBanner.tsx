import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import { Typography } from './Typography';

interface UpdateNotificationBannerProps {
  show: boolean;
  onDismiss: () => void;
}

export const UpdateNotificationBanner: React.FC<
  UpdateNotificationBannerProps
> = ({ show, onDismiss }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300,
            damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[99999]
            flex items-center justify-between gap-4
            px-4 py-3 bg-brand-primary text-bg-deep
            shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <RefreshCw size={16} className="shrink-0
              animate-spin" style={{ animationDuration:
              '2s' }} />
            <Typography variant="mono"
              className="text-[11px] font-black uppercase
              tracking-widest text-bg-deep">
              New version available
            </Typography>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-1.5 rounded-lg
                bg-bg-deep/20 hover:bg-bg-deep/30
                text-bg-deep text-[10px] font-black
                uppercase tracking-widest transition-all
                active:scale-95"
            >
              Refresh Now
            </button>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-bg-deep/20
                rounded-lg transition-all"
            >
              <X size={14} className="text-bg-deep" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
