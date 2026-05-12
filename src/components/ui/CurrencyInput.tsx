import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/src/lib/utils';
import { Typography } from './Typography';
import { truncateToDecimal } from '@/src/lib/numberUtils';

/**
 * StripeItDesignSystem - CurrencyInput
 * Specialized input for financial data with validation and formatting hints.
 */
interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  labelClassName?: string;
  extraLabel?: React.ReactNode;
  description?: string;
  error?: string;
  value: number;
  onChange: (e: { target: { value: string, name?: string } }) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, labelClassName, extraLabel, description, error, value, onChange, ...props }, ref) => {
    
    // Internal helper to format for display
    const formatForDisplay = (num: number) => {
      if (num === null || num === undefined || isNaN(num)) return "";
      
      const truncated = truncateToDecimal(num, 2);
      const absVal = Math.abs(truncated);
      const hasCents = absVal % 1 !== 0;
      
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
      });

      return formatter.format(absVal);
    };

    const [inputValue, setInputValue] = useState(formatForDisplay(value));
    const isInternalUpdate = useRef(false);

    // Sync input value when external value changes
    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      setInputValue(formatForDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      
      // Basic sanitization while typing: allow numbers, one decimal point, and leading minus
      // But we don't want to over-sanitize here to allow intermediate states
      setInputValue(val);
    };

    const handleBlur = () => {
      // Parse the local value
      // Remove everything except numbers, decimal point, and leading minus
      const cleaned = inputValue.replace(/[^0-9.-]/g, '');
      
      // Handle multiple decimal points (keep only first)
      const parts = cleaned.split('.');
      const sanitized = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
      
      if (sanitized === '' || sanitized === '-' || sanitized === '.') {
        setInputValue("0");
        isInternalUpdate.current = true;
        onChange({ target: { value: "0", name: props.name } });
        return;
      }

      const num = parseFloat(sanitized);
      const truncated = truncateToDecimal(num, 2);
      
      const finalDisplay = formatForDisplay(truncated);
      setInputValue(finalDisplay);
      
      isInternalUpdate.current = true;
      onChange({ target: { value: truncated.toString(), name: props.name } });
    };

    const isNegative = value < 0;

    return (
      <div className="relative">
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <Typography variant="label" className={cn("text-slate-400 block", labelClassName)}>
              {label}
              {props.required && <span className="ml-1 text-red-500 font-bold">*</span>}
            </Typography>
            {extraLabel}
          </div>
        )}
        <div className="relative">
          <input
            {...props}
            ref={ref}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              "flex h-11 w-full rounded-xl border border-white/5 bg-slate-900/50 pl-10 pr-4 py-2 text-sm text-white ring-offset-bg-deep placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-orange-500/50 bg-orange-500/5 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
              className
            )}
            placeholder="0"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none flex items-center">
            {isNegative && <span className="mr-0.5 text-red-400 font-bold">-</span>}
            $
          </span>
        </div>
        {description && !error && (
          <Typography variant="small" className="text-slate-500 mt-1.5 block opacity-60">
            {description}
          </Typography>
        )}
        {error && (
          <Typography variant="mono" className="text-orange-400 text-[10px] uppercase font-bold tracking-wider mt-1.5 px-1 block">
            {error}
          </Typography>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
