import React from 'react';
import { motion } from 'motion/react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { AlertTriangle, LogOut, RefreshCcw } from 'lucide-react';

interface AuthHydrationFallbackProps {
  onRetry: () => void;
  onSignOut: () => void;
  error?: string | null;
}

export const AuthHydrationFallback: React.FC<AuthHydrationFallbackProps> = ({ onRetry, onSignOut, error }) => {
  return (
    <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-red-500/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full space-y-8"
      >
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-glow glow-red/10">
            <AlertTriangle className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-3">
          <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter text-3xl">
            Identity Sync Failed
          </Typography>
          <Typography variant="p" className="text-slate-400">
            {error || "We couldn't synchronize your profile with our performance engine. This usually happens due to network latency or permission constraints."}
          </Typography>
        </div>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={onRetry}
              className="h-14 font-black uppercase tracking-widest italic bg-white text-bg-deep hover:bg-slate-200"
            >
              <RefreshCcw className="mr-2 h-5 w-5" />
              Retry Connection
            </Button>
            
            <Button 
              variant="outline"
              onClick={onSignOut}
              className="h-14 font-black uppercase tracking-widest italic border-white/10 hover:bg-white/5 text-slate-400 hover:text-white"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>

          <div className="pt-6 border-t border-white/5">
            <Typography variant="mono" className="text-[10px] text-slate-600 uppercase font-black tracking-widest leading-loose">
              System Support: <span className="text-slate-400">ops@stripeit.tech</span>
              <br />
              Developer Diagnostic: <span className="text-slate-500 font-mono">AUTH_HYDRATION_TIMEOUT</span>
            </Typography>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
