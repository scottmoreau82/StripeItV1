import React from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';
import { TopBar } from '../components/navigation/TopBar';
import { ContentContainer } from '../components/layout/ResponsiveGrid';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier } from '../types';
import { DealerLayout } from './DealerLayout';

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
  const { profile, loading } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stripeit_sidebar_collapsed') === 'true';
    }
    return false;
  });

  React.useEffect(() => {
    localStorage.setItem('stripeit_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // StripeItLayoutHydrationGate - Prevent layout flashing/fallback rendering during profile resolution
  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center animate-pulse">
          <div className="h-6 w-6 rounded-full bg-brand-primary shadow-glow glow-primary" />
        </div>
      </div>
    );
  }

  // StripeItLayoutTierSwitch - Direct Dealer users to their dedicated layout shell
  if (profile.subscriptionTier === SubscriptionTier.ORGANIZATION) {
    return <DealerLayout>{children}</DealerLayout>;
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
        
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
          <ContentContainer>
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
