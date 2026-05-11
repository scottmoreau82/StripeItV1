import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Typography } from './Typography';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, message = "Synchronizing..." }) => {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#06090F]/80 backdrop-blur-sm px-6 text-center"
        >
          <div className="relative flex flex-col items-center">
            <div className="relative h-16 w-16 mb-8 group">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-2 border-brand-primary/20 border-t-brand-primary shadow-[0_0_20px_rgba(0,242,255,0.3)]"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-2 border-brand-primary/10 border-b-brand-primary"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-brand-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,242,255,0.8)]" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Typography variant="mono" className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary animate-pulse">
                {message}
              </Typography>
              <Typography variant="small" className="text-slate-500 max-w-[200px] leading-relaxed">
                Fetching latest data from secure servers...
              </Typography>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
