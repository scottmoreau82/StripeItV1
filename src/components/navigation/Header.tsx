import React, { useState } from 'react';
import { Menu, X, TrendingUp } from 'lucide-react';
import { NotificationTray } from '../notifications/NotificationTray';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { navigationConfig } from './NavigationItems';
import { Link, useLocation } from 'react-router-dom';

/**
 * StripeItNavigationSystem - Mobile Header & Drawer
 */
export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-bg-main/80 backdrop-blur-md px-6 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow glow-primary">
            <TrendingUp className="text-white h-5 w-5" />
          </div>
          <Typography variant="h4" className="font-display font-black italic text-white uppercase tracking-tighter">
            StripeIt
          </Typography>
        </Link>
        
        <div className="flex items-center gap-4">
          <NotificationTray />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-bg-deep p-6 shadow-2xl border-r border-white/5 lg:hidden"
            >
              <div className="mb-10 flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-brand-primary to-brand-deep flex items-center justify-center shadow-glow">
                  <TrendingUp className="text-white h-6 w-6" />
                </div>
                <Typography variant="h3" className="font-display font-black italic text-white uppercase tracking-tighter">
                  StripeIt
                </Typography>
              </div>

              <nav className="flex flex-col gap-1">
                {navigationConfig.main.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wider transition-all text-left",
                        isActive ? "bg-white/[0.03] text-brand-primary" : "text-slate-500 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <item.icon size={18} className={cn(isActive && "text-brand-primary")} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 space-y-3">
                <Button 
                  className="w-full bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs h-12"
                  onClick={() => {
                    setIsOpen(false);
                    // Use a small delay to allow drawer to close before alert/action
                    setTimeout(() => window.dispatchEvent(new CustomEvent('stripeit:create-random-deal')), 300);
                  }}
                >
                  Create Random Deal
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
