import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ArrowLeft, Users } from 'lucide-react';
import { UserManagementPanel } from './UserManagementPanel';
import { useAuth } from '@/src/contexts/AuthContext';

export const UserManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const header = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/settings')}
          className="text-slate-500 hover:text-white -ml-2"
        >
          <ArrowLeft size={16} className="mr-2" />
          Settings
        </Button>
      </div>
      <PageHeader
        title="User Management"
        subtitle="Control platform access and subscription tiers"
        icon={Users}
      >
        <Button 
          variant="outline"
          onClick={() => navigate('/admin/dealer-requests')}
          className="border-white/10 hover:bg-white/5"
        >
          Dealer Requests
        </Button>
      </PageHeader>
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={
        <div className="max-w-4xl mx-auto pb-32">
          {profile?.orgId ? (
            <UserManagementPanel orgId={profile.orgId} />
          ) : (
            <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-3xl">
              <Typography variant="p" className="text-slate-500">Initializing organization context...</Typography>
            </div>
          )}
        </div>
      }
    />
  );
};
