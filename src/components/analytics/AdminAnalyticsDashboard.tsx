import React, { useState, useEffect, useMemo } from 'react';
import { analyticsService } from '@/src/services/analyticsService';
import { DailyAnalyticsAggregate } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { 
  Users, 
  MousePointer2, 
  FileText, 
  UserPlus, 
  Calendar, 
  ArrowLeft,
  TrendingUp,
  Activity,
  History,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';

/**
 * AdminAnalyticsDashboard
 * Comprehensive internal analytics overview for platform administrators.
 */

export const AdminAnalyticsDashboard: React.FC = () => {
  const [aggregates, setAggregates] = useState<DailyAnalyticsAggregate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodDays, setPeriodDays] = useState(14);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - periodDays);
        
        const data = await analyticsService.getMetricsForPeriod(
          start.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        setAggregates(data);
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [periodDays]);

  const totals = useMemo(() => {
    return aggregates.reduce((acc, curr) => ({
      visits: acc.visits + (curr.visits || 0),
      signups: acc.signups + (curr.signups || 0),
      pageViews: acc.pageViews + (curr.pageViews || 0),
      clicks: acc.clicks + (curr.clicks || 0),
    }), { visits: 0, signups: 0, pageViews: 0, clicks: 0 });
  }, [aggregates]);

  const conversionRate = totals.visits > 0 ? ((totals.signups / totals.visits) * 100).toFixed(1) : '0';

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent shadow-glow" />
          <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Aggregating Intelligence...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link to="/" className="inline-flex items-center text-slate-500 hover:text-brand-primary transition-colors text-xs font-black uppercase tracking-widest mb-4 group">
            <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20 shadow-glow glow-primary">
              <Activity className="h-6 w-6 text-brand-primary" />
            </div>
            <Typography variant="h1" className="italic text-4xl uppercase tracking-tighter">
              Platform Analytics
            </Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                periodDays === days ? "bg-brand-primary text-bg-deep shadow-glow" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {days}D
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-bg-card/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Total Visits</Typography>
            <div className="flex items-end justify-between">
              <Typography variant="h2" className="text-white font-black text-3xl">{totals.visits.toLocaleString()}</Typography>
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Users size={16} className="text-cyan-400" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="bg-bg-card/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Total Signups</Typography>
            <div className="flex items-end justify-between">
              <Typography variant="h2" className="text-white font-black text-3xl">{totals.signups.toLocaleString()}</Typography>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <UserPlus size={16} className="text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="bg-bg-card/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Conversion</Typography>
            <div className="flex items-end justify-between">
              <Typography variant="h2" className="text-white font-black text-3xl">{conversionRate}%</Typography>
              <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                <TrendingUp size={16} className="text-brand-primary" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="bg-bg-card/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 block">Engagement Score</Typography>
            <div className="flex items-end justify-between">
              <Typography variant="h2" className="text-white font-black text-3xl">{(totals.clicks / (totals.visits || 1)).toFixed(1)}</Typography>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <MousePointer2 size={16} className="text-purple-400" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Visits & Signups Area Chart */}
        <Card className="p-8 bg-bg-card/80 border-white/5 shadow-2xl rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Typography variant="h3" className="text-white italic tracking-tight mb-1">Growth Trajectory</Typography>
              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Visits vs. Signups</Typography>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-[9px] text-slate-500 font-black uppercase">Visits</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-primary" />
                <span className="text-[9px] text-slate-500 font-black uppercase">Signups</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregates}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F2FF" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00F2FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem' }}
                  itemStyle={{ fontSize: 12, fontWeight: 900 }}
                />
                <Area type="monotone" dataKey="visits" stroke="#22D3EE" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={3} />
                <Area type="monotone" dataKey="signups" stroke="#00F2FF" fillOpacity={1} fill="url(#colorSignups)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Engagement Bar Chart */}
        <Card className="p-8 bg-bg-card/80 border-white/5 shadow-2xl rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Typography variant="h3" className="text-white italic tracking-tight mb-1">Engagement Velocity</Typography>
              <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Page Views vs. Clicks</Typography>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-slate-400" />
                <span className="text-[9px] text-slate-500 font-black uppercase">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400" />
                <span className="text-[9px] text-slate-500 font-black uppercase">Clicks</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregates}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 900 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem' }}
                  itemStyle={{ fontSize: 12, fontWeight: 900 }}
                />
                <Bar dataKey="pageViews" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Raw Data Table Snapshot */}
      <Card className="bg-bg-card/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
           <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-slate-500" />
              <Typography variant="h3" className="text-white text-lg font-black uppercase tracking-tight">Recent Historical Performance</Typography>
           </div>
           <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest rounded-xl">
             <Download size={14} className="mr-2" /> Export CSV
           </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-8 py-6"><Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Date</Typography></th>
                <th className="px-8 py-6"><Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Visits</Typography></th>
                <th className="px-8 py-6"><Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Signups</Typography></th>
                <th className="px-8 py-6"><Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Page Views</Typography></th>
                <th className="px-8 py-6 text-right"><Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Total Engagement</Typography></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {aggregates.map((agg) => (
                <tr key={agg.date} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <Calendar size={12} className="text-slate-600" />
                       <Typography variant="mono" className="text-[11px] text-white font-black">{agg.date}</Typography>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Typography variant="mono" className="text-xs text-slate-400 group-hover:text-cyan-400 transition-colors font-black">{agg.visits?.toLocaleString()}</Typography>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/10">
                       <Typography variant="mono" className="text-[10px] text-emerald-400 font-black">+{agg.signups}</Typography>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <Typography variant="mono" className="text-[11px] text-slate-400 font-black">{agg.pageViews?.toLocaleString()}</Typography>
                       <div className="h-1 flex-1 min-w-[40px] bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full bg-slate-600 rounded-full" style={{ width: `${Math.min(100, (agg.pageViews / (totals.pageViews / periodDays) * 50))}%` }} />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Typography variant="mono" className="text-xs text-brand-primary font-black">
                      {(agg.clicks + agg.pageViews).toLocaleString()} <span className="text-[8px] text-slate-600">PTS</span>
                    </Typography>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
