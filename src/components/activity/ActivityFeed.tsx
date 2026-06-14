import React, { useState, useEffect } from 'react';
import { Activity, Clock, Search } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { activityService } from '@/src/services/activityService';
import { useAuth } from '@/src/contexts/AuthContext';
import { ActivityEvent } from '@/src/types';
import { ActivityItem } from './ActivityItem';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { ACTIVITY_CATEGORIES, ActivityCategory, categoryForEventType } from './activityCategories';

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
  // Category filter: which categories are currently shown. Empty set = show all.
  const [activeCategories, setActiveCategories] = useState<Set<ActivityCategory>>(new Set());

  useEffect(() => {
    if (!profile?.orgId) return;
    
    setLoading(true);
    return activityService.subscribeToActivity(profile.orgId, (data) => {
      setEvents(data);
      setLoading(false);
    });
  }, [profile?.orgId]);

  const toggleCategory = (key: ActivityCategory) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch =
      e.userName.toLowerCase().includes(search.toLowerCase()) ||
      e.message.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategories.size === 0 || activeCategories.has(categoryForEventType(e.type));
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 h-full">
      {/* Header & Search */}
      <PageHeader
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
            className="pl-12 bg-[var(--color-bg-elevated)] border-[var(--color-border)] h-11 text-[var(--color-text-primary)]"
          />
        </div>
      </PageHeader>

      {/* Mobile category filter (the legend panel is desktop-only) */}
      <div className="lg:hidden -mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {ACTIVITY_CATEGORIES.map(item => {
          const on = activeCategories.has(item.key);
          return (
            <button
              key={item.key}
              onClick={() => toggleCategory(item.key)}
              className={cn(
                "flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 border transition-all",
                on
                  ? "bg-brand-primary/10 border-brand-primary/30"
                  : "bg-[var(--color-bg-elevated)] border-[var(--color-border)]"
              )}
            >
              <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", item.dot)} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest whitespace-nowrap",
                on ? "text-text-primary" : "text-slate-500"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-elevated)]" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-32 bg-[var(--color-bg-elevated)] rounded" />
                    <div className="h-20 w-full bg-[var(--color-bg-elevated)] rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="py-20 flex flex-col items-center justify-center text-center bg-[var(--color-bg-elevated)] border-dashed border-[var(--color-border)]">
              <Clock className="h-12 w-12 text-slate-700 mb-4" />
              <Typography variant="label" className="text-slate-500 block mb-1">
                {search || activeCategories.size > 0 ? 'No matching activity' : 'No history found'}
              </Typography>
              <Typography variant="small" className="text-slate-600">
                {search || activeCategories.size > 0
                  ? 'Try a different search or clear your filters.'
                  : 'Log deals or start competitions to populate the activity timeline.'}
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

        {/* Legend / Filter */}
        <div className="hidden lg:block space-y-6">
          <Card className="p-6 bg-brand-primary/[0.02] border-brand-primary/10">
            <div className="flex items-center justify-between mb-4">
              <Typography variant="label" className="text-brand-primary uppercase tracking-widest text-[10px] block font-black">
                {activeCategories.size === 0 ? 'Event Legend' : 'Filtering'}
              </Typography>
              {activeCategories.size > 0 && (
                <button
                  onClick={() => setActiveCategories(new Set())}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-primary transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <Typography variant="small" className="text-slate-600 text-[10px] block mb-4 leading-relaxed">
              Tap a category to filter the feed.
            </Typography>
            <div className="space-y-1">
              {ACTIVITY_CATEGORIES.map(item => {
                const isActive = activeCategories.size === 0 || activeCategories.has(item.key);
                return (
                  <button
                    key={item.key}
                    onClick={() => toggleCategory(item.key)}
                    className={cn(
                      "flex items-center gap-3 w-full rounded-lg px-3 py-2 transition-all text-left",
                      activeCategories.has(item.key)
                        ? "bg-brand-primary/10"
                        : "hover:bg-white/[0.03]",
                      !isActive && "opacity-35"
                    )}
                  >
                    <div className={cn("h-1.5 w-1.5 rounded-full shadow-glow shrink-0", item.dot)} />
                    <Typography variant="small" className={cn(
                      "font-bold transition-colors",
                      activeCategories.has(item.key) ? "text-text-primary" : "text-slate-400"
                    )}>
                      {item.label}
                    </Typography>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
