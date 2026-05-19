import React, { useState, useEffect, useMemo } from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { useAuth } from '@/src/contexts/AuthContext';
import { dealerService } from '@/src/services/dealerService';
import { DealerDeal } from '@/src/types';
import { Activity, TrendingUp, Calculator, MousePointer2, Store } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { LoadingOverlay } from '../ui/LoadingOverlay';

interface MetricSplit {
  daily: number;
  mtd: number;
  pacing: number;
}

interface KPIMetrics {
  units: { retail: MetricSplit; internet: MetricSplit };
  frontGross: { retail: MetricSplit; internet: MetricSplit };
  backGross: { retail: MetricSplit; internet: MetricSplit };
}

export const DealerKPIOverview: React.FC = () => {
  const { profile } = useAuth();
  const [mtdDeals, setMtdDeals] = useState<DealerDeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMTD = async () => {
      if (!profile?.orgId) return;
      setIsLoading(true);
      try {
        const data = await dealerService.getMTDDeals(profile.orgId);
        setMtdDeals(data);
      } catch (error) {
        console.error("Dealer KPI Fetch Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMTD();
  }, [profile?.orgId]);

  const metrics = useMemo((): KPIMetrics => {
    const todayStr = new Date().toISOString().split('T')[0];
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();

    const emptySplit = (): MetricSplit => ({ daily: 0, mtd: 0, pacing: 0 });

    const baseMetrics: KPIMetrics = {
      units: { retail: emptySplit(), internet: emptySplit() },
      frontGross: { retail: emptySplit(), internet: emptySplit() },
      backGross: { retail: emptySplit(), internet: emptySplit() },
    };

    const isInternet = (source?: string) => {
      if (!source) return false;
      const s = source.toLowerCase();
      return s.includes('internet') || s.includes('web') || s.includes('digital');
    };

    mtdDeals.forEach(deal => {
      const isDay = deal.date === todayStr;
      const category = isInternet(deal.source) ? 'internet' : 'retail';

      // Units
      if (isDay) baseMetrics.units[category].daily += 1;
      baseMetrics.units[category].mtd += 1;

      // Front
      if (isDay) baseMetrics.frontGross[category].daily += (deal.frontGross || 0);
      baseMetrics.frontGross[category].mtd += (deal.frontGross || 0);

      // Back
      if (isDay) baseMetrics.backGross[category].daily += (deal.backGross || 0);
      baseMetrics.backGross[category].mtd += (deal.backGross || 0);
    });

    // Calculate Pacing
    const types: (keyof KPIMetrics)[] = ['units', 'frontGross', 'backGross'];
    const cats: ('retail' | 'internet')[] = ['retail', 'internet'];

    types.forEach(type => {
      cats.forEach(cat => {
        const m = baseMetrics[type][cat];
        m.pacing = (m.mtd / (currentDay || 1)) * daysInMonth;
      });
    });

    return baseMetrics;
  }, [mtdDeals]);

  const KPICard = ({ 
    title, 
    retail, 
    internet, 
    icon: Icon,
    isCurrency = false 
  }: { 
    title: string; 
    retail: MetricSplit; 
    internet: MetricSplit;
    icon: any;
    isCurrency?: boolean;
  }) => {
    const formatValue = (val: number) => {
      if (isCurrency) {
        return `$${Math.round(val).toLocaleString()}`;
      }
      return Math.round(val).toLocaleString();
    };

    return (
      <Card className="bg-[var(--color-bg-card)] border-white/5 overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Icon size={18} />
            </div>
            <Typography variant="mono" className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-primary)]">
              {title}
            </Typography>
          </div>
          <div className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-glow glow-primary animate-pulse" />
        </div>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/5">
          {/* Retail Section */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Store size={12} className="text-slate-500" />
              <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Retail</Typography>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-bold">Daily</Typography>
                <Typography variant="p" className="text-[var(--color-text-primary)] font-black italic text-sm">{formatValue(retail.daily)}</Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-bold">MTD</Typography>
                <Typography variant="p" className="text-brand-primary font-black italic text-sm">{formatValue(retail.mtd)}</Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-bold">Pacing</Typography>
                <Typography variant="p" className="text-[var(--color-text-secondary)] font-black italic text-sm">{formatValue(retail.pacing)}</Typography>
              </div>
            </div>
          </div>

          {/* Internet Section */}
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer2 size={12} className="text-slate-500" />
              <Typography variant="mono" className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Internet</Typography>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-bold">Daily</Typography>
                <Typography variant="p" className="text-[var(--color-text-primary)] font-black italic text-sm">{formatValue(internet.daily)}</Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-bold">MTD</Typography>
                <Typography variant="p" className="text-brand-primary font-black italic text-sm">{formatValue(internet.mtd)}</Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="mono" className="text-[8px] text-[var(--color-text-secondary)] uppercase font-bold">Pacing</Typography>
                <Typography variant="p" className="text-[var(--color-text-secondary)] font-black italic text-sm">{formatValue(internet.pacing)}</Typography>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading && mtdDeals.length === 0) {
    return <div className="h-64 flex items-center justify-center"><LoadingOverlay inline /></div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KPICard 
        title="Units" 
        retail={metrics.units.retail} 
        internet={metrics.units.internet} 
        icon={Activity} 
      />
      <KPICard 
        title="Front Gross" 
        retail={metrics.frontGross.retail} 
        internet={metrics.frontGross.internet} 
        icon={TrendingUp} 
        isCurrency 
      />
      <KPICard 
        title="Back Gross" 
        retail={metrics.backGross.retail} 
        internet={metrics.backGross.internet} 
        icon={Calculator} 
        isCurrency 
      />
    </div>
  );
};
