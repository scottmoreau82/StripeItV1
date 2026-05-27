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
  labelClassName?: string;
  hideLabel?: boolean;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, labelClassName, hideLabel, error, options, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {!hideLabel && label && (
          <Typography variant="label" className={cn("text-text-secondary", labelClassName)}>
            {label}
            {props.required && <span className="ml-1 text-red-500 font-bold">*</span>}
          </Typography>
        )}
        <div className="relative">
          <select
            className={cn(
              "flex h-11 w-full appearance-none rounded-xl border border-border-subtle bg-bg-card px-4 py-2 text-sm text-text-primary ring-offset-bg-deep focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-orange-500/50 bg-orange-500/5 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
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
          <Typography variant="mono" className="text-orange-400 text-[10px] uppercase font-bold tracking-wider mt-1 px-1">
            {error}
          </Typography>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
