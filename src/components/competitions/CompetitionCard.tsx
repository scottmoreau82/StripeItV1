import React from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { Competition, LeaderboardEntry, CompetitionStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Trophy, Clock, ChevronRight, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * StripeItCompetitionVisibilitySystem
 * Lightweight summary card for active dealership events.
 */

interface CompetitionCardProps {
  competition: Competition;
  leader?: LeaderboardEntry;
  onClick?: () => void;
  isDetailed?: boolean;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({ 
  competition, 
  leader, 
  onClick,
  isDetailed = false
}) => {
  const isExpired = competition.endDate < Date.now();
  const statusLabels = {
    [CompetitionStatus.DRAFT]: 'Drafting',
    [CompetitionStatus.ACTIVE]: 'Live Now',
    [CompetitionStatus.COMPLETED]: 'Finished',
    [CompetitionStatus.CANCELLED]: 'Cancelled'
  };

  return (
    <Card 
      onClick={onClick}
      className={cn(
        "p-6 relative overflow-hidden transition-all group",
        onClick && "cursor-pointer hover:border-brand-primary/30",
        competition.status === CompetitionStatus.ACTIVE ? "bg-brand-primary/5 border-brand-primary/10" : "bg-white/[0.02] border-white/5"
      )}
    >
      {/* Decorative Glow */}
      {competition.status === CompetitionStatus.ACTIVE && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <Trophy size={14} className={competition.status === CompetitionStatus.ACTIVE ? "text-brand-primary" : "text-slate-500"} />
             <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                {statusLabels[competition.status]}
             </Typography>
          </div>
          <Typography variant="h3" className="text-white italic font-black uppercase tracking-tight group-hover:text-brand-primary transition-colors">
            {competition.title}
          </Typography>
        </div>
        {!isExpired && competition.status === CompetitionStatus.ACTIVE && (
          <div className="px-3 py-1 bg-brand-primary text-bg-deep rounded-full shadow-glow">
             <Typography variant="mono" className="text-[9px] font-black">LIVE</Typography>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold mb-1">Ends In</Typography>
          <div className="flex items-center gap-2 text-white">
             <Clock size={12} className="text-slate-500" />
             <Typography variant="small" className="font-bold">
                {formatDistanceToNow(competition.endDate)}
             </Typography>
          </div>
        </div>
        {leader && (
          <div>
            <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-bold mb-1">Top Spot</Typography>
            <div className="flex items-center gap-2 text-brand-primary">
               <TrendingUp size={12} />
               <Typography variant="small" className="font-bold truncate">
                  {leader.displayName.split(' ')[0]}
               </Typography>
            </div>
          </div>
        )}
      </div>

      {competition.rewardDescription && (
        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl mb-4">
          <Typography variant="mono" className="text-[8px] text-slate-500 uppercase font-black mb-1">Potential Reward</Typography>
          <Typography variant="p" className="text-slate-300 text-xs leading-snug">
            {competition.rewardDescription}
          </Typography>
        </div>
      )}

      {onClick && (
        <div className="flex items-center justify-end">
          <Typography variant="mono" className="text-[9px] text-brand-primary uppercase font-black tracking-widest group-hover:mr-2 transition-all flex items-center gap-1">
            View Leaderboard <ChevronRight size={12} />
          </Typography>
        </div>
      )}
    </Card>
  );
};
