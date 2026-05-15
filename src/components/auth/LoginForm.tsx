import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, mapAuthError } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { analyticsService } from '@/src/services/analyticsService';
import { AnalyticsEventType, UserRole } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Typography } from '@/src/components/ui/Typography';
import { Card } from '@/src/components/ui/Card';
import { DollarSign, UserPlus, LogIn, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { inviteService } from '@/src/services/inviteService';
import { cn } from '@/src/lib/utils';

/**
 * StripeItAuthSystem - AuthView
 * Professional authentication interface supporting Sign In and Free Tier Sign Up.
 */

type AuthMode = 'signin' | 'signup';

interface LoginFormProps {
  initialMode?: AuthMode;
}

export const LoginForm: React.FC<LoginFormProps> = ({ initialMode = 'signin' }) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { addToast, connectionError } = useAuth();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      addToast('Password reset link sent to your email.', 'success');
      setShowForgotPassword(false);
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // StripeItVerificationSystem - Send welcome verification
        if (userCredential.user) {
          const { sendEmailVerification } = await import('firebase/auth');
          await sendEmailVerification(userCredential.user);
          addToast('Verification email sent! Please check your inbox.', 'success');
        }
      }
    } catch (err: any) {
      const message = mapAuthError(err);
      setError(message);
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin';
    if (newMode === 'signup') {
      analyticsService.trackEvent(AnalyticsEventType.SIGNUP_STARTED);
    }
    setMode(newMode);
    setError('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-deep p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <motion.div 
            layoutId="logo"
            className="h-16 w-16 rounded-[2rem] bg-brand-primary flex items-center justify-center shadow-glow glow-primary"
          >
            <DollarSign className="text-white h-8 w-8" />
          </motion.div>
          <div className="space-y-1">
            <Typography variant="h2" className="text-white">
              Access Stripe It
            </Typography>
            <Typography variant="p" className="text-slate-400">
              Sign in or create your account to start tracking deals, commissions, goals, and performance.
            </Typography>
          </div>
        </div>

        <Card className="p-8 md:p-10 relative overflow-hidden">
          {connectionError && (
            <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />
              <Typography variant="label" className="text-orange-400 text-[11px]">
                {connectionError}
              </Typography>
            </div>
          )}

          {mode === 'signup' && (
            <div className="absolute top-0 right-0 p-1">
              <div className="px-3 py-1 rounded-full flex items-center gap-1.5 border bg-brand-primary/10 border-brand-primary/20">
                <Sparkles className="h-3 w-3 text-brand-primary" />
                <Typography variant="mono" className="text-[10px] text-brand-primary uppercase font-bold">Free Tier Beta</Typography>
              </div>
            </div>
          )}

          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@dealership.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10"
              disabled={loading}
            />
            
            {!showForgotPassword && (
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/5 border-white/10"
                disabled={loading}
              />
            )}
            
            {mode === 'signin' && (
              <div className="flex justify-end mt-[-1rem]">
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="text-[10px] text-slate-500 hover:text-brand-primary uppercase font-bold tracking-widest transition-colors"
                >
                  {showForgotPassword ? 'Back to Login' : 'Forgot Password?'}
                </button>
              </div>
            )}
            
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-red-500/10 border border-red-500/20 p-4"
                >
                  <Typography variant="mono" className="text-red-400 text-[10px] text-center uppercase tracking-wider font-bold">
                    {error}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full h-12 shadow-glow glow-primary"
              isLoading={loading}
              disabled={loading}
            >
              {showForgotPassword ? (
                'Reset Password'
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" /> Create Free Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
            <Typography variant="small" className="text-slate-500">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </Typography>
            <Button 
              variant="outline" 
              onClick={toggleMode}
              className="w-full border-white/10 hover:bg-white/5"
              disabled={loading}
            >
              {mode === 'signin' ? 'Create Free Account' : 'Sign In'}
            </Button>
          </div>
        </Card>
        
          <div className="mt-10 text-center">
          <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-600">
            Powered by StripeIt Deal Tracker • Professional Car Deal Foundation
          </Typography>
        </div>
      </motion.div>
    </div>
  );
};
