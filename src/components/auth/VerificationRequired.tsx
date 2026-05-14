import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Typography } from '@/src/components/ui/Typography';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { Mail, RefreshCw, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * StripeItVerificationSystem
 * Blocks access to the app until the user's email is verified.
 */

export const VerificationRequired: React.FC = () => {
  const { user, logout, sendVerificationEmail, refreshUser, addToast } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => {
      setIsRefreshing(false);
      addToast('Status refreshed.', 'info');
    }, 800);
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsResending(true);
    await sendVerificationEmail();
    setIsResending(false);
    setCountdown(60); // 1 minute cooldown
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-deep p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="h-16 w-16 rounded-[2rem] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-glow glow-primary/20">
            <ShieldCheck className="text-brand-primary h-8 w-8" />
          </div>
          <div className="space-y-1">
            <Typography variant="h2" className="text-white">
              Verify Your Email
            </Typography>
            <Typography variant="p" className="text-slate-400">
              For account security, we need to verify your email address before you can access the Stripe It platform.
            </Typography>
          </div>
        </div>

        <Card className="p-8 md:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Mail className="h-24 w-24 text-white" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Sent To</Typography>
              <Typography variant="h4" className="text-white truncate">{user?.email}</Typography>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <Typography variant="small" className="text-amber-200/80 leading-relaxed font-medium">
                Check your inbox and spam folder for the verification link. Once clicked, return here and refresh.
              </Typography>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <Button
              onClick={handleRefresh}
              className="w-full h-12 shadow-glow glow-primary"
              isLoading={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              I've Verified My Email
            </Button>
            
            <Button
              variant="outline"
              onClick={handleResend}
              className="w-full h-12 border-white/10 hover:bg-white/5"
              disabled={isResending || countdown > 0}
            >
              {countdown > 0 ? `Resend Email (${countdown}s)` : 'Resend Verification Link'}
            </Button>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4 relative z-10">
            <Button 
              variant="ghost" 
              onClick={logout}
              className="w-full text-slate-500 hover:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </Card>

        <div className="mt-10 text-center">
          <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-600">
            Secure Authentication Protocol • Stripe It v2.0
          </Typography>
        </div>
      </motion.div>
    </div>
  );
};
