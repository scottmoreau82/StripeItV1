import React from 'react';
import { cn } from '@/src/lib/utils';
import { Typography } from './Typography';
import { ChevronDown } from 'lucide-react';

/**
 * StripeItDesignSystem - Select
 * Standardized select dropdown with consistent styling.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <Typography variant="label" className="text-slate-400">
            {label}
            {props.required && <span className="ml-1 text-red-500 font-bold">*</span>}
          </Typography>
        )}
        <div className="relative">
          <select
            className={cn(
              "flex h-11 w-full appearance-none rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2 text-sm text-white ring-offset-bg-deep focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500/50 focus-visible:ring-red-500/10 focus-visible:border-red-500",
              className
            )}
            ref={ref}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-card">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-slate-500" />
        </div>
        {error && (
          <Typography variant="mono" className="text-red-400">
            {error}
          </Typography>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
