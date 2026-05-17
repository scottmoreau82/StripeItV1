import React, { useState, useEffect } from 'react';
import { Activity, Clock, Filter, Search } from 'lucide-react';
import { DealerPageHeader } from '../dealer/DealerPageHeader';
import { activityService } from '@/src/services/activityService';
import { useAuth } from '@/src/contexts/AuthContext';
import { ActivityEvent } from '@/src/types';
import { ActivityItem } from './ActivityItem';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

import { cn } from '@/src/lib/utils';

/**
 * StripeItActivityFeedSystem
 * Root component for organizational event transparency.
 */

export const ActivityFeed: React.FC = () => {
  const { profile } = useAuth();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.orgId) return;
    
    setLoading(true);
    return activityService.subscribeToActivity(profile.orgId, (data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [profile?.orgId]);

  const filteredEvents = events.filter(e => 
    e.userName.toLowerCase().includes(search.toLowerCase()) || 
    e.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 h-full">
      {/* Header & Search */}
      <DealerPageHeader
        title="Activity Feed"
        subtitle="Org-wide transparency"
        icon={Activity}
      >
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Search activity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 bg-white/[0.02] border-white/10 h-11"
          />
        </div>
      </DealerPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-white/5" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 bg-white/5 rounded" />
                    <div className="h-20 w-full bg-white/5 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="py-20 flex flex-col items-center justify-center text-center bg-white/[0.01] border-dashed border-white/10">
              <Clock className="h-12 w-12 text-slate-700 mb-4" />
              <Typography variant="label" className="text-slate-500 block mb-1">
                No history found
              </Typography>
              <Typography variant="small" className="text-slate-600">
                Log deals or start competitions to populate the activity timeline.
              </Typography>
            </Card>
          ) : (
            <div className="pt-2">
              {filteredEvents.map((event, index) => (
                <ActivityItem 
                  key={event.id} 
                  event={event} 
                  isFirst={index === 0}
                  isLast={index === filteredEvents.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Legend / Stats */}
        <div className="hidden lg:block space-y-6">
          <Card className="p-6 bg-brand-primary/[0.02] border-brand-primary/10">
            <Typography variant="label" className="text-brand-primary uppercase tracking-widest text-[10px] mb-4 block font-black">
              Event Legend
            </Typography>
            <div className="space-y-4">
              {[
                { label: 'New Deals', color: 'bg-emerald-400' },
                { label: 'Calculations', color: 'bg-brand-primary' },
                { label: 'Milestones', color: 'bg-indigo-400' },
                { label: 'Battles', color: 'bg-amber-400' },
                { label: 'Global', color: 'bg-rose-400' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={cn("h-1.5 w-1.5 rounded-full shadow-glow", item.color)} />
                  <Typography variant="small" className="text-slate-400 font-bold">
                    {item.label}
                  </Typography>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
