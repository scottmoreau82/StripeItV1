import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Typography } from '../ui/Typography';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../ui/Card';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * StripeItAdminAccessSystem - AdminOnly Component
 * Guards children with admin-only access check.
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback }) => {
  const { isAdmin, initialized, loading } = useAuth();

  if (!initialized || (loading && !isAdmin)) {
    return null;
  }

  if (!isAdmin) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <Card className="max-w-md p-8 bg-rose-500/5 border-rose-500/10 space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-rose-500" />
          </div>
          <div className="space-y-2">
            <Typography variant="h3" className="text-white font-black uppercase italic tracking-tight">Access Denied</Typography>
            <Typography variant="p" className="text-slate-500">
              This module is restricted to system administrators. If you believe this is an error, please contact the engineering team.
            </Typography>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
