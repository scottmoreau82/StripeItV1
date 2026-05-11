import React from 'react';
import { 
  PlusCircle, 
  RefreshCw, 
  Award, 
  Zap, 
  MessageSquare, 
  TrendingUp,
  Circle 
} from 'lucide-react';
import { ActivityEvent, ActivityEventType } from '@/src/types';
import { Typography } from '../ui/Typography';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/src/lib/utils';

/**
 * StripeItActivityFeedSystem - ActivityItem
 * Visual timeline element for shared organizational events.
 */

interface ActivityItemProps {
  event: ActivityEvent;
  isFirst?: boolean;
  isLast?: boolean;
}

const getEventTheme = (type: ActivityEventType) => {
  switch (type) {
    case ActivityEventType.DEAL_CREATED:
      return {
        icon: <PlusCircle className="h-4 w-4" />,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/20"
      };
    case ActivityEventType.DEAL_UPDATED:
    case ActivityEventType.DEAL_FINALIZED:
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        color: "text-brand-primary",
        bg: "bg-brand-primary/10",
        border: "border-brand-primary/20"
      };
    case ActivityEventType.GOAL_REACHED:
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-indigo-400",
        bg: "bg-indigo-400/10",
        border: "border-indigo-400/20"
      };
    case ActivityEventType.COMPETITION_STARTED:
    case ActivityEventType.COMPETITION_ENDED:
      return {
        icon: <Award className="h-4 w-4" />,
        color: "text-amber-400",
        bg: "bg-amber-400/10",
        border: "border-amber-400/20"
      };
    case ActivityEventType.ANNOUNCEMENT:
      return {
        icon: <Zap className="h-4 w-4" />,
        color: "text-rose-400",
        bg: "bg-rose-400/10",
        border: "border-rose-400/20"
      };
    default:
      return {
        icon: <MessageSquare className="h-4 w-4" />,
        color: "text-slate-400",
        bg: "bg-white/5",
        border: "border-white/10"
      };
  }
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ event, isFirst, isLast }) => {
  const theme = getEventTheme(event.type);

  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-[32px] bottom-0 w-[2px] bg-gradient-to-b from-white/10 to-transparent" />
      )}

      {/* Timeline Node */}
      <div className={cn(
        "absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl border z-10 transition-transform hover:scale-110",
        theme.bg,
        theme.color,
        theme.border
      )}>
        {theme.icon}
      </div>

      {/* Content */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Typography variant="label" className="text-white font-black uppercase text-xs tracking-tight">
            {event.userName}
          </Typography>
          <Circle className="h-1 w-1 fill-slate-700 text-slate-700" />
          <Typography variant="mono" className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {formatDistanceToNow(event.createdAt, { addSuffix: true })}
          </Typography>
        </div>

        <div className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
          <Typography variant="p" className="text-slate-300 text-sm leading-relaxed antialiased">
            {event.message}
          </Typography>
          
          {event.payload?.vehicle && (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
              <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black">
                {event.payload.vehicle}
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
