import React from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { LeaderboardEntry, Competition, CompetitionType } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { Trophy, Medal, Crown } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * StripeItLeaderboardSystem
 * A premium, responsive leaderboard for sales competitions.
 */

interface CompetitionLeaderboardProps {
  entries: LeaderboardEntry[];
  competition: Competition;
  highlights?: boolean;
}

export const CompetitionLeaderboard: React.FC<CompetitionLeaderboardProps> = ({ 
  entries, 
  competition,
  highlights = true
}) => {
  const getMetricLabel = (type: CompetitionType) => {
    switch (type) {
      case CompetitionType.UNITS: return 'Units';
      case CompetitionType.COMMISSION: return 'Earnings';
      default: return 'Gross';
    }
  };

  const formatValue = (value: number, type: CompetitionType) => {
    if (type === CompetitionType.UNITS) return value.toFixed(1);
    return `$${Math.round(value).toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Top 3 Podium (Highlights) */}
      {highlights && entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            if (!entry) return <div key={i} />;
            const isWinner = entry.rank === 1;
            
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex flex-col items-center p-4 rounded-2xl border text-center transition-all",
                  isWinner 
                    ? "bg-brand-primary/10 border-brand-primary/20 scale-105 shadow-glow z-10" 
                    : "bg-white/[0.02] border-white/5 opacity-80"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center mb-3",
                  isWinner ? "bg-brand-primary text-bg-deep" : "bg-white/10 text-slate-400"
                )}>
                  {entry.rank === 1 ? <Crown size={20} /> : entry.rank === 2 ? <Medal size={20} /> : <Trophy size={18} />}
                </div>
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-1 line-clamp-1">
                  {entry.displayName.split(' ')[0]}
                </Typography>
                <Typography variant="label" className="text-white">
                  {formatValue(entry.value, competition.type)}
                </Typography>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="space-y-2">
        {entries.map((entry, index) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "p-3 px-4 flex items-center justify-between border-white/5",
              entry.rank === 1 ? "bg-brand-primary/5 border-brand-primary/10" : "bg-white/[0.01]"
            )}>
              <div className="flex items-center gap-4">
                 <div className={cn(
                   "w-8 text-center font-black italic",
                   entry.rank === 1 ? "text-brand-primary" : "text-slate-600"
                 )}>
                    {entry.rank}
                 </div>
                 <div>
                    <Typography variant="label" className="text-white block">{entry.displayName}</Typography>
                    <Typography variant="mono" className="text-[8px] text-slate-500 uppercase">Sales Specialist</Typography>
                 </div>
              </div>
              
              <div className="text-right">
                 <Typography variant="label" className={entry.rank === 1 ? "text-brand-primary" : "text-white"}>
                    {formatValue(entry.value, competition.type)}
                 </Typography>
                 <Typography variant="mono" className="text-[8px] text-slate-500 uppercase">
                    Total {getMetricLabel(competition.type)}
                 </Typography>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
