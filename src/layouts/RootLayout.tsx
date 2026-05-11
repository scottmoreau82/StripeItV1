import React from 'react';
import { Sidebar } from '../components/navigation/Sidebar';
import { Header } from '../components/navigation/Header';
import { TopBar } from '../components/navigation/TopBar';
import { ContentContainer } from '../components/layout/ResponsiveGrid';

/**
 * StripeItLayoutSystem - RootLayout
 * Orchestrates StripeItDesktopAppShell and StripeItMobileAppShell.
 */
interface RootLayoutProps {
  children: React.ReactNode;
  onLogDeal?: () => void;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children, onLogDeal }) => {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-bg-deep select-none">
      {/* Desktop Sidebar System */}
      <Sidebar onLogDeal={onLogDeal} />
      
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header System */}
        <Header onLogDeal={onLogDeal} />
        
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
    </div>
  );
};
