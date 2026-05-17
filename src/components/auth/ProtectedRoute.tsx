import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { UserRole } from '@/src/types';
import { VerificationRequired } from './VerificationRequired';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { AlertCircle, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * StripeItProtectedRouteSystem
 * Enforces authenticated sessions and role-based access.
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, profile, loading, initialized, connectionError } = useAuth();
  const location = useLocation();

  // Handle initialization and connection errors (e.g. FROZEN) first
  if (!initialized || (user && !profile && loading) || connectionError) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
        {/* Atmosphere for minimal splash */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full opacity-50" />
        </div>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative z-10 flex flex-col items-center gap-8"
        >
          {connectionError === 'ACCOUNT_FROZEN' ? (
            <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-glow glow-rose/5">
              <AlertCircle className="text-rose-500 h-10 w-10 animate-pulse" />
            </div>
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-glow glow-primary">
              <DollarSign className="text-white h-10 w-10 animate-pulse" />
            </div>
          )}
          
          <div className="space-y-3">
            <Typography variant="h3" className="text-white italic font-black uppercase tracking-tighter text-2xl">StripeIt</Typography>
            {connectionError ? (
              <div className="flex flex-col items-center gap-4">
                {connectionError === 'ACCOUNT_FROZEN' ? (
                  <>
                    <Typography variant="p" className="text-rose-400 font-bold text-[11px] uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                      This manager account has been frozen by the Dealer organization. Access is restricted.
                    </Typography>
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase">
                      Contact your administrator to resolve.
                    </Typography>
                    <Button 
                      onClick={() => import('@/src/lib/firebase').then(f => f.auth.signOut())} 
                      size="sm" 
                      variant="ghost" 
                      className="text-slate-500 hover:text-white uppercase font-black tracking-widest text-[10px]"
                    >
                      Return to Login
                    </Button>
                  </>
                ) : (
                  <>
                    <Typography variant="p" className="text-red-400 font-bold text-[11px] uppercase tracking-wider">
                      Connection Error: {connectionError}
                    </Typography>
                    <Button onClick={() => window.location.reload()} size="sm" variant="outline" className="h-9 px-6 text-[10px] uppercase font-black tracking-widest border-red-500/20 text-red-400 hover:bg-red-500/10">
                       Reconnect Now
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em]">
                  Initializing Sales Toolkit
                </Typography>
                <div className="w-32 h-[1px] bg-white/5 relative overflow-hidden">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-brand-primary to-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // StripeItVerificationGuard - Block unverified users except on specific flows
  if (!user.emailVerified) {
    return <VerificationRequired />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Role not authorized
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-deep p-6 text-center">
        <div className="max-w-md space-y-4">
          <Typography variant="h2" className="text-white">Permission Denied</Typography>
          <Typography variant="p">
            Your account role ({profile.role}) does not have permission to access this area.
          </Typography>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
