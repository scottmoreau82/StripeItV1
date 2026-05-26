import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, mapAuthError } from '@/src/lib/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { analyticsService } from '@/src/services/analyticsService';
import { AnalyticsEventType, UserRole } from '@/src/types';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Typography } from '@/src/components/ui/Typography';
import { Card } from '@/src/components/ui/Card';
import { DollarSign, UserPlus, LogIn, Sparkles, AlertTriangle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [inviteRole, setInviteRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { addToast, connectionError } = useAuth();

  useEffect(() => {
    // Legacy Invite System Disabled - Replaced by Manager Join Codes
    /*
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('inviteId');
    const token = params.get('token');
    ...
    */
  }, [addToast]);

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
        if (!displayName.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        if (confirmPassword !== password) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // StripeItVerificationSystem - Send welcome verification
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName: displayName.trim() });
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
    setDisplayName('');
    setConfirmPassword('');
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
            <Typography variant="h2" className="text-[var(--color-text-primary)]">
              Access Stripe It
            </Typography>
            <Typography variant="p" className="text-[var(--color-text-secondary)]">
              Sign in or create your account to start tracking deals, commissions, goals, and performance.
            </Typography>
          </div>
        </div>

        <Card className="p-8 md:p-10 relative overflow-hidden bg-[var(--color-bg-card)]">
          {connectionError && (
            <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0" />
              <Typography variant="label" className="text-orange-400 text-[11px]">
                {connectionError}
              </Typography>
            </div>
          )}



          <form onSubmit={showForgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <Input
                label="Your Name"
                type="text"
                placeholder="First Last"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                disabled={loading}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@dealership.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
              disabled={loading || !!inviteRole}
            />
            
            {!showForgotPassword && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full h-12 px-4 pr-12 rounded-xl border bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {!showForgotPassword && mode === 'signup' && (
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
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

          <div className="mt-8 pt-8 border-t border-[var(--color-border)] flex flex-col items-center gap-4">
            <Typography variant="small" className="text-[var(--color-text-secondary)]">
              {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </Typography>
            <Button 
              variant="outline" 
              onClick={toggleMode}
              className="w-full border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]"
              disabled={loading}
            >
              {mode === 'signin' ? 'Create Free Account' : 'Sign In'}
            </Button>
          </div>
        </Card>
        
          <div className="mt-10 text-center">
          <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-600">
            Powered by StripeIt Deal Tracker • VisionForged Ventures
          </Typography>
        </div>
      </motion.div>
    </div>
  );
};
