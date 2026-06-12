import React from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';
import { TopBar } from '../components/navigation/TopBar';
import { ContentContainer } from '../components/layout/ResponsiveGrid';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier } from '../types';
import { DealerLayout } from './DealerLayout';
import { useAppData } from '../contexts/AppDataContext';
import { AlertTriangle, X } from 'lucide-react';

/**
 * StripeItLayoutSystem - RootLayout
 * Orchestrates StripeItDesktopAppShell and StripeItMobileAppShell.
 */
interface RootLayoutProps {
  children: React.ReactNode;
  onLogDeal?: () => void;
  onLogSpiff?: () => void;
  onConfigPayPlan?: () => void;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, onLogDeal, onLogSpiff, onConfigPayPlan }) => {
  const { profile } = useAuth();
  const { connectionBlocked } = useAppData();
  const [dismissed, setDismissed] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stripeit_sidebar_collapsed') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    localStorage.setItem('stripeit_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // StripeItLayoutTierSwitch - Direct Dealer users to their dedicated layout shell
  // We must have a profile to determine which shell to mount
  if (profile?.subscriptionTier === SubscriptionTier.ORGANIZATION) {
    return (
      <DealerLayout>
        {connectionBlocked && !dismissed && (
          <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-200/90 font-medium leading-relaxed">
                Connection issue detected — your ad blocker may be blocking our database sync. StripeIt is 100% ad-free, so no blocker is needed here. Whitelist stripeit.app to restore live updates.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setDismissed(true)}
              className="text-amber-500/40 hover:text-amber-400 transition-colors p-0.5"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {children}
      </DealerLayout>
    );
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-bg-deep select-none">
      {/* Desktop Sidebar System */}
      <Sidebar 
        onLogDeal={onLogDeal} 
        onLogSpiff={onLogSpiff}
        onConfigPayPlan={onConfigPayPlan}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header System */}
        <Header onLogDeal={onLogDeal} onConfigPayPlan={onConfigPayPlan} />
        
        {/* Desktop TopBar System */}
        <TopBar />
        
        <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-10 lg:py-10">
          <ContentContainer>
            {connectionBlocked && !dismissed && (
              <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-amber-200/90 font-medium leading-relaxed">
                    Connection issue detected — your ad blocker may be blocking our database sync. StripeIt is 100% ad-free, so no blocker is needed here. Whitelist stripeit.app to restore live updates.
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setDismissed(true)}
                  className="text-amber-500/40 hover:text-amber-400 transition-colors p-0.5"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {children}
          </ContentContainer>
        </main>
      </div>
      
      {/* Background Ornaments */}
      <div className="fixed top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-brand-primary/[0.03] blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-brand-deep/[0.03] blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] -z-10 h-[700px] w-[700px] rounded-full bg-brand-secondary/[0.02] blur-[180px] pointer-events-none" />
    </div>
  );
};
