import React from 'react';
import { Typography } from '../ui/Typography';
import { Select } from '../ui/Select';
import { DealStatus } from '@/src/types';
import { Filter, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';

/**
 * StripeItDealFilterSystem
 * Collapsible filter engine for the sales log.
 */

interface DealFiltersProps {
  status: string;
  onStatusChange: (status: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
  onClear: () => void;
  className?: string;
}

export const DealFilters: React.FC<DealFiltersProps> = ({
  status,
  onStatusChange,
  type,
  onTypeChange,
  onClear,
  className
}) => {
  const hasFilters = status !== 'all' || type !== 'all';

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter size={14} />
          <Typography variant="mono" className="text-[10px] uppercase tracking-widest">Filters</Typography>
        </div>
        {hasFilters && (
          <button 
            onClick={onClear}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-brand-primary font-bold hover:text-white transition-colors"
          >
            <X size={10} />
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select 
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: DealStatus.DRAFT, label: 'Draft' },
            { value: DealStatus.SUBMITTED, label: 'Submitted' },
            { value: DealStatus.FINALIZED, label: 'Finalized' },
            { value: DealStatus.CANCELLED, label: 'Cancelled' },
          ]}
        />
        <Select 
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          options={[
            { value: 'all', label: 'New & Used' },
            { value: 'new', label: 'New Only' },
            { value: 'used', label: 'Used Only' },
          ]}
        />
      </div>
    </div>
  );
};
