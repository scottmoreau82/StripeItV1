import React, { useState } from 'react';
import { DealerSidebar } from '../components/navigation/DealerSidebar';
import { DealerHeader } from '../components/navigation/DealerHeader';
import { TopBar } from '../components/navigation/TopBar';
import { ContentContainer } from '../components/layout/ResponsiveGrid';
import { DealerLogDealModal } from '../components/management/DealerLogDealModal';

/**
 * DealerLayout
 * Specialized app shell for the Dealer/Organization tier.
 */
interface DealerLayoutProps {
  children: React.ReactNode;
}

export const DealerLayout: React.FC<DealerLayoutProps> = ({ children }) => {
  const [isLogDealOpen, setIsLogDealOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const handleLogDeal = () => {
    setIsLogDealOpen(true);
  };

  React.useEffect(() => {
    localStorage.setItem('stripeit_dealer_sidebar_collapsed', 'true');
  }, []);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-bg-deep select-none overflow-x-hidden">
      {/* Dealer Desktop Sidebar Wrapper - Prevents Layout Shifting */}
      <div className="hidden lg:block w-20 shrink-0 relative z-40">
        <DealerSidebar 
          isCollapsed={true} // Force collapsed layout state
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogDeal={handleLogDeal}
        />
      </div>
      
      <div className="flex flex-1 flex-col min-w-0">
        {/* Dealer Mobile Header */}
        <DealerHeader onLogDeal={handleLogDeal} />
        
        {/* Shared Desktop TopBar System */}
        <TopBar />
        
        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10 lg:py-10">
          <ContentContainer>
            {children}
          </ContentContainer>
        </main>
      </div>
      
      <DealerLogDealModal 
        isOpen={isLogDealOpen} 
        onClose={() => setIsLogDealOpen(false)} 
        onSuccess={() => {
          // Could refresh data here if needed
        }}
      />
      
      {/* Premium Background Atmosphere */}
      <div className="fixed top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-brand-primary/[0.04] blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-brand-deep/[0.04] blur-[120px] pointer-events-none" />
    </div>
  );
};
