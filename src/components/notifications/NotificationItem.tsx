import React from 'react';
import { AppIcon } from '../ui/AppIcon';
import { motion, AnimatePresence } from 'motion/react';
import { Notification, ActivityEventType } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/src/lib/utils';

/**
 * StripeItNotificationSystem - NotificationItem
 * Elegant alert card with type-specific styling.
 */

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onAction?: (notification: Notification) => void;
}

const getIcon = (type: ActivityEventType) => {
  switch (type) {
    case ActivityEventType.DEAL_FINALIZED:
    case ActivityEventType.DEAL_CREATED:
      return <AppIcon name="success" size={16} className="text-emerald-500" />;
    case ActivityEventType.GOAL_REACHED:
      return <AppIcon name="trending" size={16} className="text-brand-primary" />;
    case ActivityEventType.COMPETITION_STARTED:
    case ActivityEventType.COMPETITION_ENDED:
      return <AppIcon name="trophy" size={16} className="text-amber-500" />;
    case ActivityEventType.REMINDER:
      return <AppIcon name="bell" size={16} className="text-indigo-500" />;
    default:
      return <AppIcon name="info" size={16} className="text-slate-400" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onRead,
  onAction 
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      role="button"
      onClick={() => {
        onRead(notification.id);
        if (onAction) onAction(notification);
      }}
      className={cn(
        "group relative flex gap-4 p-4 rounded-2xl transition-all border select-none cursor-pointer",
        notification.read 
          ? "bg-transparent border-transparent opacity-60" 
          : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
      )}
    >
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        notification.read ? "bg-slate-900/50" : "bg-white/5"
      )}>
        {getIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="label" className="text-white text-sm font-bold truncate">
            {notification.title}
          </Typography>
          {!notification.read && (
            <AppIcon name="circle" size={8} className="fill-brand-primary text-brand-primary animate-pulse" />
          )}
        </div>
        <Typography variant="small" className="text-slate-500 line-clamp-2 leading-snug">
          {notification.message}
        </Typography>
        <Typography variant="mono" className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-1">
          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
        </Typography>
      </div>

      <div className="flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
          <AppIcon name="moreHorizontal" size={16} />
        </Button>
      </div>
    </motion.div>
  );
};
