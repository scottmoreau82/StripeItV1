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
  type: string;
  onTypeChange: (type: string) => void;
  onClear: () => void;
  className?: string;
}

export const DealFilters: React.FC<DealFiltersProps> = ({
  type,
  onTypeChange,
  onClear,
  className
}) => {
  const hasFilters = type !== 'all';

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-end h-4">
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

      <div className="grid grid-cols-1 gap-3">
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
