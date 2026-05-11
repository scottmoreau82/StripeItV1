import React from 'react';
import { cn } from '@/src/lib/utils';
import { Typography } from './Typography';

/**
 * StripeItDesignSystem - CurrencyInput
 * Specialized input for financial data with validation and formatting hints.
 */
interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, error, value, onChange, ...props }, ref) => {
    // Format value with commas
    const formatValue = (val: any) => {
      if (val === undefined || val === null || val === "" || val === "-") {
        return "";
      }
      
      const strVal = val.toString();
      // Strip everything but numbers
      const numericString = strVal.replace(/[^0-9]/g, "");
      
      if (numericString === "") {
        return "";
      }

      return numericString.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const rawNumeric = inputValue.replace(/[^0-9]/g, "");
      const wasNegative = value?.toString().startsWith('-');
      const justTypedMinus = inputValue.includes('-');
      
      if (onChange) {
        let isNeg = wasNegative;
        
        // Toggle negative if minus was typed
        if (justTypedMinus) {
          isNeg = !wasNegative;
        }
        
        // If everything is cleared, reset to positive
        if (inputValue === "" && wasNegative) {
          isNeg = false;
        }

        const finalValue = isNeg 
          ? (rawNumeric ? `-${rawNumeric}` : "-")
          : rawNumeric;
        
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: finalValue,
            name: props.name
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    const isNegative = value?.toString().startsWith('-');

    return (
      <div className="relative">
        {label && (
          <Typography variant="label" className="text-slate-400 mb-1.5 block">
            {label}
            {props.required && <span className="ml-1 text-red-500 font-bold">*</span>}
          </Typography>
        )}
        <div className="relative">
          <input
            {...props}
            ref={ref}
            type="text"
            inputMode="numeric"
            value={formatValue(value)}
            onChange={handleChange}
            className={cn(
              "flex h-11 w-full rounded-xl border border-white/5 bg-slate-900/50 pl-10 pr-4 py-2 text-sm text-white ring-offset-bg-deep placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500/50 focus-visible:ring-red-500/10 focus-visible:border-red-500",
              className
            )}
            placeholder="0"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none flex items-center">
            {isNegative && <span className="mr-0.5 text-red-400">-</span>}
            $
          </span>
        </div>
        {error && (
          <Typography variant="mono" className="text-red-400 mt-1.5 block">
            {error}
          </Typography>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
