import React from 'react';
import { NotificationTray } from '../notifications/NotificationTray';

/**
 * StripeItTopBarSystem
 * Desktop top bar for utility actions and context.
 */
export const TopBar = () => {
  return (
    <header className="hidden h-14 items-center justify-end border-b border-border-subtle bg-bg-main/20 backdrop-blur-md px-10 lg:flex sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <NotificationTray />
        </div>
      </div>
    </header>
  );
};
