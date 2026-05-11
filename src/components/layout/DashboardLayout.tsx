import React from 'react';
import { Typography } from '../ui/Typography';
import { ResponsiveGrid } from './ResponsiveGrid';
import { cn } from '../../lib/utils';

/**
 * StripeItDashboardLayoutSystem
 * Specialized layout for assembling dashboard metrics and data visualizations.
 */
interface DashboardLayoutProps {
  header: React.ReactNode;
  stats: React.ReactNode;
  main: React.ReactNode;
  aside?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  header,
  stats,
  main,
  aside,
}) => {
  return (
    <div className="flex flex-col gap-10">
      {/* Dashboard Header Section */}
      <section>{header}</section>

      {/* Dashboard Stats Section */}
      {stats && (
        <section>
          <ResponsiveGrid cols={4} gap={6}>
            {stats}
          </ResponsiveGrid>
        </section>
      )}

      {/* Main Content & Sidebar Grid */}
      <section className={cn(
        "grid grid-cols-1 gap-8",
        aside ? "lg:grid-cols-3" : "grid-cols-1"
      )}>
        <div className={cn(
          "flex flex-col gap-8",
          aside ? "lg:col-span-2" : ""
        )}>
          {main}
        </div>
        
        {aside && (
          <div className="flex flex-col gap-8">
            {aside}
          </div>
        )}
      </section>
    </div>
  );
};
