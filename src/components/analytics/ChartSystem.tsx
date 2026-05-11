import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { ChartDataPoint } from '@/src/services/analyticsService';

/**
 * StripeItChartSystem
 * Reusable chart components for analytics.
 */

interface PerformanceChartProps {
  data: ChartDataPoint[];
  title?: string;
  metric: 'units' | 'gross' | 'commission';
  color?: string;
}

const CustomTooltip = ({ active, payload, label, metric }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = metric === 'units' ? value : `$${value.toLocaleString()}`;
    
    return (
      <div className="bg-bg-elevated border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <Typography variant="mono" className="text-slate-500 mb-1">{label}</Typography>
        <Typography variant="label" className="text-white font-bold">
          {metric.charAt(0).toUpperCase() + metric.slice(1)}: {formattedValue}
        </Typography>
      </div>
    );
  }
  return null;
};

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  title, 
  metric,
  color = "#00F2FF" 
}) => {
  return (
    <Card className="p-6 bg-bg-card/40 border-white/5 h-[300px]">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <Typography variant="small" className="text-slate-500 font-black tracking-widest uppercase">
            {title}
          </Typography>
        </div>
      )}
      
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="date" 
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
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Area 
              type="monotone" 
              dataKey={metric} 
              stroke={color} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMetric)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
