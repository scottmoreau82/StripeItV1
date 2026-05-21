import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart3, DollarSign, Car, PieChart, Activity, Award, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppData } from '@/src/contexts/AppDataContext';
import { PageHeader } from '../ui/PageHeader';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '@/src/lib/utils';
import { PerformanceChart } from './ChartSystem';
import { DashboardLayout } from '../layout/DashboardLayout';
import { getMonthlyHistoricalData, getTrendsChartData, calculateDashboardMetrics } from '@/src/services/analyticsService';

const CustomBarTooltip = ({ active, payload, label,
  isCurrency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-bg-elevated border border-white/10
        p-3 rounded-xl shadow-2xl backdrop-blur-md
        space-y-1">
        <Typography variant="mono"
          className="text-slate-500 mb-2 block">
          {label}
        </Typography>
        {payload.map((entry: any, i: number) => (
          <div key={i}
            className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: entry.fill }} />
            <Typography variant="mono"
              className="text-white font-bold text-[10px]">
              {entry.name}: {isCurrency
                ? `$${Number(entry.value).toLocaleString()}`
                : Number(entry.value).toFixed(1)}
            </Typography>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-bg-elevated border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <Typography variant="mono" className="text-white font-bold uppercase tracking-wider text-[10px] mb-1">
          {entry.name}
        </Typography>
        <Typography variant="label" className="text-slate-300 font-bold">
          Deals: {entry.value}
        </Typography>
      </div>
    );
  }
  return null;
};

export const AnalyticsView: React.FC = () => {
  const { deals, payPlan, monthlySpiffs } = useAppData();
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'breakdown'>('overview');
  const [monthsBack, setMonthsBack] = useState<number>(6);

  // Derived data
  const monthlyData = useMemo(() => {
    return getMonthlyHistoricalData(deals, payPlan, monthsBack);
  }, [deals, payPlan, monthsBack]);

  const trendData = useMemo(() => {
    return getTrendsChartData(deals, payPlan);
  }, [deals, payPlan]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(deals, payPlan, monthlySpiffs);
  }, [deals, payPlan, monthlySpiffs]);

  const dealTypeData = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentMonthDeals = deals.filter(d => d.date.startsWith(currentMonthStr));
    const newDealsCount = currentMonthDeals.filter(d => d.newOrUsed === 'new').length;
    const usedDealsCount = currentMonthDeals.filter(d => d.newOrUsed === 'used').length;
    const cpoDealsCount = currentMonthDeals.filter(d => d.newOrUsed === 'cpo').length;

    return [
      { name: 'New', value: newDealsCount, color: '#00D4FF' },
      { name: 'Used', value: usedDealsCount, color: '#8B5CF6' },
      { name: 'CPO', value: cpoDealsCount, color: '#10B981' }
    ];
  }, [deals]);

  const breakdownStats = useMemo(() => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentMonthDeals = deals.filter(d => d.date.startsWith(currentMonthStr));
    const len = currentMonthDeals.length;

    const newCount = currentMonthDeals.filter(d => d.newOrUsed === 'new').length;
    const usedCount = currentMonthDeals.filter(d => d.newOrUsed === 'used').length;
    const cpoCount = currentMonthDeals.filter(d => d.newOrUsed === 'cpo').length;

    const totalFront = currentMonthDeals.reduce((sum, d) => sum + (d.frontEndGross || 0), 0);
    const totalBack = currentMonthDeals.reduce((sum, d) => sum + (d.backEndGross || 0), 0);

    const avgFront = len > 0 ? totalFront / len : 0;
    const avgBack = len > 0 ? totalBack / len : 0;

    return {
      newCount,
      usedCount,
      cpoCount,
      avgFront,
      avgBack,
      totalDeals: len
    };
  }, [deals]);

  // Empty state handling
  if (deals.length === 0) {
    return (
      <DashboardLayout
        header={
          <PageHeader
            title="Market Analytics"
            subtitle="Performance telemetry • historical trends"
            icon={TrendingUp}
          />
        }
        stats={null}
        main={
          <div className="flex items-center justify-center py-12 px-4 w-full">
            <Card className="w-full max-w-md bg-bg-card/40 border-white/5 rounded-3xl p-10 flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-cyan-500/10 text-cyan-400 mb-6 shrink-0">
                <BarChart3 size={24} />
              </div>
              <Typography variant="mono" className="text-brand-primary uppercase tracking-widest text-[10px] mb-2 font-black">
                Telemetry Empty
              </Typography>
              <Typography variant="h2" className="text-text-primary font-black uppercase tracking-tight italic mb-3">
                No performance data available
              </Typography>
              <Typography variant="p" className="text-slate-500 text-sm leading-relaxed text-center">
                Log deals in the Deal Log section to visualize and track your statistics over time.
              </Typography>
            </Card>
          </div>
        }
      />
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'trends', label: 'Trends' },
    { id: 'breakdown', label: 'Breakdown' }
  ] as const;

  const headerContent = (
    <PageHeader
      title="Market Analytics"
      subtitle="Performance telemetry • historical trends"
      icon={TrendingUp}
    >
      <div className="flex items-center gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab.id
                ? "bg-brand-primary text-bg-deep"
                : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </PageHeader>
  );

  const statsContent = (
    <>
      {/* MTD Units (Car icon, cyan) */}
      <Card className="p-6 bg-bg-card/40 border border-white/5 hover:border-white/10 transition-all rounded-3xl relative overflow-hidden group flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            MTD UNITS
          </Typography>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-brand-primary/10 border border-brand-primary/20 shrink-0 text-brand-primary shadow-inner">
            <Car className="h-5 w-5" />
          </div>
        </div>
        <Typography variant="h2" className="text-brand-primary text-3xl font-black italic uppercase tracking-tight">
          {metrics.units.toFixed(1)}
        </Typography>
      </Card>

      {/* MTD Gross (DollarSign icon, emerald) */}
      <Card className="p-6 bg-bg-card/40 border border-white/5 hover:border-white/10 transition-all rounded-3xl relative overflow-hidden group flex flex-col justify-between w-full">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            MTD GROSS
          </Typography>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-emerald-400/10 border border-emerald-400/20 shrink-0 text-emerald-400 shadow-inner">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <Typography variant="h2" className="text-emerald-400 text-3xl font-black italic uppercase tracking-tight">
          ${Math.round(metrics.gross).toLocaleString()}
        </Typography>
      </Card>

      {/* Est. Payout (Award icon, amber) */}
      <Card className="p-6 bg-bg-card/40 border border-white/5 hover:border-white/10 transition-all rounded-3xl relative overflow-hidden group flex flex-col justify-between w-full">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            EST. PAYOUT
          </Typography>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-amber-400/10 border border-amber-400/20 shrink-0 text-amber-400 shadow-inner">
            <Award className="h-5 w-5" />
          </div>
        </div>
        <Typography variant="h2" className="text-amber-400 text-3xl font-black italic uppercase tracking-tight">
          ${Math.round(metrics.commission + metrics.spiffsMTD).toLocaleString()}
        </Typography>
      </Card>

      {/* Avg Gross/Unit (Target icon, purple) */}
      <Card className="p-6 bg-bg-card/40 border border-white/5 hover:border-white/10 transition-all rounded-3xl relative overflow-hidden group flex flex-col justify-between w-full">
        <div className="flex items-center justify-between mb-4">
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            AVG GROSS / UNIT
          </Typography>
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-purple-400/10 border border-purple-400/20 shrink-0 text-purple-400 shadow-inner">
            <Target className="h-5 w-5" />
          </div>
        </div>
        <Typography variant="h2" className="text-purple-400 text-3xl font-black italic uppercase tracking-tight">
          ${Math.round(metrics.avgGross).toLocaleString()}
        </Typography>
      </Card>
    </>
  );

  const mainContent = (
    <div className="space-y-8">
      {/* Overview Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Timeframe Selector */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-between bg-bg-card/40 border border-white/5 p-4 rounded-3xl gap-4">
            <Typography variant="mono" className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
              Historical Timeframe
            </Typography>
            <div className="flex gap-2 bg-white/[0.02] border border-white/5 p-1 rounded-2xl">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonthsBack(m)}
                  className={cn(
                    "h-8 px-4 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all",
                    monthsBack === m
                      ? "bg-brand-primary text-bg-deep shadow-glow"
                      : "text-slate-500 hover:text-white"
                  )}
                >
                  Last {m} Months
                </button>
              ))}
            </div>
          </div>

          {/* Overview Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Unit Volume BarChart */}
            <Card className="p-6 bg-bg-card/40 border border-white/5 h-[340px] flex flex-col justify-between">
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest mb-6 font-bold">
                MONTHLY UNIT VOLUME
              </Typography>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip content={<CustomBarTooltip isCurrency={false} />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                    <Bar
                      dataKey="newUnits"
                      name="New"
                      stackId="units"
                      fill="#00D4FF"
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="usedUnits"
                      name="Used"
                      stackId="units"
                      fill="#8B5CF6"
                      animationDuration={1500}
                    />
                    <Bar
                      dataKey="cpoUnits"
                      name="CPO"
                      stackId="units"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Monthly Gross BarChart */}
            <Card className="p-6 bg-bg-card/40 border border-white/5 h-[340px] flex flex-col justify-between">
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest mb-6 font-bold">
                MONTHLY GROSS
              </Typography>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(val) => `$${val.toLocaleString()}`}
                    />
                    <Tooltip content={<CustomBarTooltip isCurrency={true} />} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                    <Bar
                      dataKey="gross"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Trends Content */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PerformanceChart data={trendData} title="DAILY UNIT VOLUME" metric="units" color="#00D4FF" />
          <PerformanceChart data={trendData} title="DAILY GROSS REVENUE" metric="gross" color="#fbbf24" />
          <PerformanceChart data={trendData} title="DAILY COMMISSION" metric="commission" color="#10b981" />
        </div>
      )}

      {/* Breakdown Content */}
      {activeTab === 'breakdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deal classification split */}
          <Card className="p-6 bg-bg-card/40 border border-white/5 flex flex-col justify-between h-[340px]">
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest mb-6 font-bold">
              DEAL CLASSIFICATION SPLIT
            </Typography>
            <div className="h-[240px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RPieChart>
                  <Pie
                    data={dealTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dealTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend iconType="circle" />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Classification stats breakdown */}
          <Card className="p-6 bg-bg-card/40 border border-white/5 flex flex-col justify-between min-h-[340px]">
            <div>
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest mb-6 font-bold">
                CLASSIFICATION METRICS
              </Typography>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">New Deals</Typography>
                  <Typography variant="h3" className="text-text-primary text-xl font-bold italic">{breakdownStats.newCount}</Typography>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Used Deals</Typography>
                  <Typography variant="h3" className="text-text-primary text-xl font-bold italic">{breakdownStats.usedCount}</Typography>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">CPO Deals</Typography>
                  <Typography variant="h3" className="text-text-primary text-xl font-bold italic">{breakdownStats.cpoCount}</Typography>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Avg Front Gross</Typography>
                  <Typography variant="h3" className="text-brand-primary text-lg font-bold italic">${Math.round(breakdownStats.avgFront).toLocaleString()}</Typography>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Avg Back Gross</Typography>
                  <Typography variant="h3" className="text-purple-400 text-lg font-bold italic">${Math.round(breakdownStats.avgBack).toLocaleString()}</Typography>
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-center">
                  <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider mb-1">Total deals MTD</Typography>
                  <Typography variant="h3" className="text-emerald-400 text-lg font-bold italic">{breakdownStats.totalDeals}</Typography>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      header={headerContent}
      stats={statsContent}
      main={mainContent}
    />
  );
};
