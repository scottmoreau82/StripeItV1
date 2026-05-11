import React, { useState, useEffect } from 'react';
import { Bell, Inbox, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { notificationService } from '@/src/services/notificationService';
import { Notification } from '@/src/types';
import { NotificationItem } from './NotificationItem';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { cn } from '@/src/lib/utils';

/**
 * StripeItNotificationSystem - NotificationTray
 * Premium popover for personal alerts and unread tracking.
 */

export const NotificationTray: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    return notificationService.subscribeToUnread(profile.uid, (data) => {
      setNotifications(data);
    });
  }, [profile?.uid]);

  const unreadCount = notifications.length;

  const handleMarkAllRead = async () => {
    if (!profile?.uid) return;
    await notificationService.markAllAsRead(profile.uid);
  };

  const handleReadOne = async (id: string) => {
    if (!profile?.uid) return;
    await notificationService.markAsRead(profile.uid, id);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-full transition-all",
          isOpen ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-tada")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[9px] font-black text-bg-deep shadow-glow glow-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-transparent"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 z-50 w-80 md:w-96 rounded-[2rem] bg-bg-card border border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-primary/10">
                    <Sparkles className="h-4 w-4 text-brand-primary" />
                  </div>
                  <Typography variant="h4" className="text-white italic font-black uppercase tracking-tight">
                    Inbox
                  </Typography>
                </div>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-slate-500 font-bold uppercase hover:text-brand-primary"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {/* List */}
              <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                    <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                      <Inbox className="h-8 w-8 text-slate-700" />
                    </div>
                    <Typography variant="label" className="text-slate-400 block mb-1">
                      Nothing to see here
                    </Typography>
                    <Typography variant="small" className="text-slate-600">
                      You're all caught up with your latest dealership activity!
                    </Typography>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <NotificationItem 
                      key={n.id} 
                      notification={n} 
                      onRead={handleReadOne}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs text-slate-500 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  View All Activity
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
