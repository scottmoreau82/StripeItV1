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
import { ActivityEvent, ActivityEventType, AmbientEffect } from '@/src/types';
import { Typography } from '../ui/Typography';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/src/lib/utils';
import { useAuth } from '@/src/contexts/AuthContext';
import { categoryForEventType, categoryMeta } from './activityCategories';

/**
 * StripeItActivityFeedSystem - ActivityItem
 * Visual timeline element for shared organizational events.
 */

interface ActivityItemProps {
  event: ActivityEvent;
  isFirst?: boolean;
  isLast?: boolean;
}

// Per-type glyph; color/background come from the shared category meta so the
// node always has enough contrast against the dark card.
const getEventIcon = (type: ActivityEventType) => {
  switch (type) {
    case ActivityEventType.DEAL_CREATED:
      return <PlusCircle className="h-4 w-4" />;
    case ActivityEventType.DEAL_UPDATED:
    case ActivityEventType.DEAL_FINALIZED:
      return <RefreshCw className="h-4 w-4" />;
    case ActivityEventType.GOAL_REACHED:
      return <TrendingUp className="h-4 w-4" />;
    case ActivityEventType.COMPETITION_STARTED:
    case ActivityEventType.COMPETITION_ENDED:
      return <Award className="h-4 w-4" />;
    case ActivityEventType.ANNOUNCEMENT:
      return <Zap className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ event, isFirst, isLast }) => {
  const meta = categoryMeta(categoryForEventType(event.type));
  const icon = getEventIcon(event.type);
  const { profile } = useAuth();
  const hasGlass = profile?.preferences?.ambientEffects?.includes(AmbientEffect.GLASSMORPHISM) ?? false;

  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-[32px] bottom-0 w-[2px] bg-gradient-to-b from-[var(--color-border)] to-transparent" />
      )}

      {/* Timeline Node */}
      <div className={cn(
        "absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl border z-10 transition-transform hover:scale-110 shadow-lg",
        meta.bg,
        meta.text,
        meta.border
      )}>
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-2 pt-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Typography variant="label" className="text-[var(--color-text-primary)] font-black uppercase text-xs tracking-tight">
            {event.userName}
          </Typography>
          <Circle className="h-1 w-1 fill-slate-700 text-slate-700" />
          <Typography variant="mono" className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {formatDistanceToNow(event.createdAt, { addSuffix: true })}
          </Typography>
        </div>

        <div className={cn(
          "relative p-4 rounded-2xl transition-colors hover:border-slate-500/30",
          hasGlass
            ? "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]"
            : "bg-[var(--color-bg-elevated)] border border-[var(--color-border)]"
        )}>
          <Typography variant="p" className="text-[var(--color-text-secondary)] text-sm leading-relaxed antialiased">
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
