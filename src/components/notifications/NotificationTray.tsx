import React, { useState, useEffect, useRef } from 'react';
import { AppIcon } from '../ui/AppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';
import { notificationService } from '@/src/services/notificationService';
import { feedbackService } from '@/src/services/feedbackService';
import { Notification, FeedbackReport, FeedbackType, SubscriptionTier, ActivityEventType, Invite } from '@/src/types';
import { STRIPEIT_DEVELOPER_EMAIL } from '@/src/constants';
import { NotificationItem } from './NotificationItem';
import { InviteModal } from './InviteModal';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { cn } from '@/src/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { inviteService } from '@/src/services/inviteService';

/**
 * StripeItNotificationSystem - NotificationTray
 * Premium popover for personal alerts and unread tracking.
 */

export const NotificationTray: React.FC = () => {
  const { profile, tierOverride } = useAuth();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [feedbackReports, setFeedbackReports] = useState<FeedbackReport[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const currentTier = tierOverride || profile?.subscriptionTier;
  const isFreeTier = currentTier === SubscriptionTier.FREE;

  const isAdmin = profile?.isAdmin || profile?.email === STRIPEIT_DEVELOPER_EMAIL;

  // StripeItNotificationSystem - Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // StripeItNotificationSystem - Outside click and Escape key handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!profile?.uid || isFreeTier) return;
    const unsubNotifications = notificationService.subscribeToUnread(profile.uid, (data) => {
      setNotifications(data);
    });

    let unsubFeedback: (() => void) | undefined;
    if (isAdmin) {
      unsubFeedback = feedbackService.subscribeToUnread((reports) => {
        setFeedbackReports(reports);
      });
    }

    return () => {
      unsubNotifications();
      if (unsubFeedback) unsubFeedback();
    };
  }, [profile?.uid, isAdmin, isFreeTier]);

  if (isFreeTier) return null;

  const unreadCount = notifications.length + (isAdmin ? feedbackReports.length : 0);

  const handleMarkAllRead = async () => {
    if (!profile?.uid) return;
    await notificationService.markAllAsRead(profile.uid);
    if (isAdmin) {
      await feedbackService.markAllAsRead();
    }
  };

  const handleReadOne = async (id: string) => {
    if (!profile?.uid) return;
    await notificationService.markAsRead(profile.uid, id);
  };

  const handleReadFeedback = async (id: string) => {
    await feedbackService.markAsRead(id);
  };

  const handleNotificationAction = async (n: Notification) => {
    setIsOpen(false);
    if (n.type === ActivityEventType.ORG_INVITE && n.metadata?.inviteId) {
      const invite = await inviteService.getInviteById(n.metadata.inviteId);
      if (invite) {
        setSelectedInvite(invite);
        setIsInviteModalOpen(true);
      }
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative rounded-full transition-all",
          isOpen ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"
        )}
      >
        <AppIcon name="bell" className={cn("h-5 w-5", unreadCount > 0 && "animate-tada")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary text-[9px] font-black text-bg-deep shadow-glow glow-primary">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <InviteModal 
        invite={selectedInvite}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          if (profile?.uid) {
            notificationService.markAllAsRead(profile.uid);
          }
        }}
      />

      <AnimatePresence>
        {isOpen && (
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
                    <AppIcon name="premium" className="h-4 w-4 text-brand-primary" />
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
              <div className="max-h-[70vh] overflow-y-auto px-4 py-4 space-y-4">
                {/* Feedback Requests Section (Admin Only) */}
                {isAdmin && feedbackReports.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 px-2 pb-1">
                      <Typography variant="mono" className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
                        Feedback Requests
                      </Typography>
                      <div className="h-px flex-1 bg-brand-primary/10" />
                    </div>
                    {feedbackReports.map((report) => (
                      <div 
                        key={report.id}
                        onClick={() => handleReadFeedback(report.id)}
                        className="group relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-brand-primary/20 transition-all cursor-pointer"
                      >
                        <div className="flex gap-4">
                          <div className={cn(
                            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border",
                            report.type === FeedbackType.BUG 
                              ? "bg-orange-500/10 border-orange-500/20 text-orange-500" 
                              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-500"
                          )}>
                            <AppIcon name="badge" className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                                report.type === FeedbackType.BUG 
                                  ? "bg-orange-500/10 text-orange-500" 
                                  : "bg-cyan-500/10 text-cyan-500"
                              )}>
                                {report.type === FeedbackType.BUG ? 'Bug' : 'Feature'}
                              </span>
                              <Typography variant="mono" className="text-[9px] text-slate-500 font-bold ml-auto">
                                {formatDistanceToNow(report.createdAt)} ago
                              </Typography>
                            </div>
                            <Typography variant="h4" className="text-white text-xs font-bold leading-tight mb-1 truncate">
                              {report.title}
                            </Typography>
                            <Typography variant="p" className="text-[10px] text-slate-500 line-clamp-1">
                              {report.description}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notifications Section */}
                <div className="space-y-2">
                  {isAdmin && notifications.length > 0 && feedbackReports.length > 0 && (
                    <div className="flex items-center gap-2 px-2 pb-1 pt-2">
                       <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                         Activity
                       </Typography>
                       <div className="h-px flex-1 bg-white/5" />
                    </div>
                  )}

                  {notifications.length === 0 && (!isAdmin || feedbackReports.length === 0) ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                      <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center mb-4">
                        <AppIcon name="inbox" className="h-8 w-8 text-slate-700" />
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
                        onAction={handleNotificationAction}
                      />
                    ))
                  )}
                </div>
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
        )}
      </AnimatePresence>
    </div>
  );
};
