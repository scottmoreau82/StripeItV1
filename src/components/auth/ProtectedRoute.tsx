import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { UserRole } from '@/src/types';
import { VerificationRequired } from './VerificationRequired';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';

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

  if (!initialized || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-deep">
        <div className="flex flex-col items-center gap-6 max-w-sm px-6 text-center">
          {connectionError ? (
            <>
              <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-red-500/10">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <Typography variant="h3" className="text-white">Connection Error</Typography>
                <Typography variant="p" className="text-slate-400 text-sm">
                  {connectionError}
                </Typography>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Retry Connection
              </Button>
            </>
          ) : (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent shadow-glow" />
              <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[10px]">
                Authenticating Session...
              </Typography>
            </>
          )}
        </div>
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
