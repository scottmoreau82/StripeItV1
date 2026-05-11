import React from 'react';
import { Input } from '../ui/Input';
import { Search } from 'lucide-react';

/**
 * StripeItDealSearchSystem
 * Search bar for finding specific deals by customer, stock, or deal number.
 */

interface DealSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DealSearch: React.FC<DealSearchProps> = ({ 
  value, 
  onChange, 
  placeholder = "Search customer, stock #, or deal #" 
}) => {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-primary transition-colors">
        <Search size={18} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 pl-12 pr-4 bg-slate-900 border border-white/5 rounded-2xl text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-brand-primary/50 transition-all text-sm"
      />
    </div>
  );
};
