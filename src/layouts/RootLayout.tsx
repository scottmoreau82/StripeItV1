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
  const { profile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);

  React.useEffect(() => {
    // Sync with localStorage if present, but default to true as per request
    const stored = localStorage.getItem('stripeit_sidebar_collapsed');
    if (stored === 'false') {
      // We respect previous manual state if it exists, or should we force true?
      // "DEFAULT STATE - Sidebar is collapsed"
      // I will force true on first load, then let them toggle if they really want, 
      // but the request implies it should default to collapsed.
      // Actually, I'll just force true initially and let the hover take over.
    }
    localStorage.setItem('stripeit_sidebar_collapsed', 'true');
  }, []);

  // StripeItLayoutTierSwitch - Direct Dealer users to their dedicated layout shell
  // We must have a profile to determine which shell to mount
  if (!profile) {
    return null; // Should be caught by ProtectedRoute/AppContent, but prevents flash
  }

  if (profile.subscriptionTier === SubscriptionTier.ORGANIZATION) {
    return <DealerLayout>{children}</DealerLayout>;
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-bg-deep select-none overflow-x-hidden">
      {/* Desktop Sidebar System Wrapper - Prevents Layout Shifting */}
      <div className="hidden lg:block w-20 shrink-0 relative z-40">
        <Sidebar 
          onLogDeal={onLogDeal} 
          onLogSpiff={onLogSpiff}
          onConfigPayPlan={onConfigPayPlan}
          isCollapsed={true} // Force collapsed layout state for desktop
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
      
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
