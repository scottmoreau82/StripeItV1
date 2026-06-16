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
  hideLabel?: boolean;
  extraLabel?: React.ReactNode;
  description?: string;
  error?: string | boolean;
  value: number;
  onChange: (e: { target: { value: string, name?: string } }) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, labelClassName, hideLabel, extraLabel, description, error, value, onChange, ...props }, ref) => {
    
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
    // Track sign locally so toggle is immediate — don't rely on prop round-trip
    const [isNegativeLocal, setIsNegativeLocal] = useState(value < 0);
    const isInternalUpdate = useRef(false);
    const toggleTouchHandled = useRef(false);

    // Sync input value when external value changes
    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      setInputValue(formatForDisplay(value));
      setIsNegativeLocal(value < 0);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      
      // Fix leading zero (010 -> 10)
      if (val.length > 1 && val.startsWith('0') && val[1] !== '.') {
        val = val.substring(1);
      }
      
      setInputValue(val);
    };

    const handleBlur = () => {
      // Remove everything except digits and decimal point
      const cleaned = inputValue.replace(/[^0-9.]/g, '');
      
      // Handle multiple decimal points (keep only first)
      const parts = cleaned.split('.');
      const sanitized = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
      
      if (sanitized === '' || sanitized === '.') {
        setInputValue("0");
        setIsNegativeLocal(false);
        isInternalUpdate.current = true;
        onChange({ target: { value: "0", name: props.name } });
        return;
      }

      const absNum = parseFloat(sanitized);
      const signed = isNegativeLocal ? -Math.abs(absNum) : Math.abs(absNum);
      const truncated = truncateToDecimal(signed, 2);
      
      const finalDisplay = formatForDisplay(truncated);
      setInputValue(finalDisplay);
      setIsNegativeLocal(truncated < 0);
      
      isInternalUpdate.current = true;
      onChange({ target: { value: truncated.toString(), name: props.name } });
    };

    const isNegative = isNegativeLocal;

    const handleToggleSign = () => {
      const cleaned = inputValue.replace(/[^0-9.]/g, '');
      if (!cleaned || cleaned === '0') return;
      const num = parseFloat(cleaned);
      if (isNaN(num) || num === 0) return;
      const newNegative = !isNegativeLocal;
      const flipped = newNegative ? -Math.abs(num) : Math.abs(num);
      setIsNegativeLocal(newNegative);
      const display = formatForDisplay(flipped);
      setInputValue(display);
      isInternalUpdate.current = true;
      onChange({ target: { value: flipped.toString(), name: props.name } });
    };

    return (
      <div className="relative">
        {!hideLabel && label && (
          <div className="flex items-center justify-between mb-1.5">
            <Typography variant="label" className={cn("text-text-secondary block", labelClassName)}>
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
              "flex h-11 w-full rounded-xl border border-border-subtle bg-bg-card pl-10 pr-10 py-2 text-sm text-text-primary ring-offset-bg-deep placeholder:text-text-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-orange-500/50 bg-orange-500/5 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
              className
            )}
            placeholder="0"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium pointer-events-none flex items-center">
            {isNegative && <span className="mr-0.5 text-red-400 font-bold">-</span>}
            $
          </span>
          {/* ± toggle — lets mobile users flip sign without needing the keyboard minus key.
              iOS: onTouchStart fires before blur; preventDefault keeps keyboard open.
              A touchHandled ref prevents the synthesized click from double-firing. */}
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); }}
            onTouchStart={(e) => {
              e.preventDefault();
              toggleTouchHandled.current = true;
              handleToggleSign();
            }}
            onClick={() => {
              if (toggleTouchHandled.current) {
                toggleTouchHandled.current = false;
                return;
              }
              handleToggleSign();
            }}
            className={cn(
              "absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-7 w-7 rounded-md text-[13px] font-black transition-all select-none",
              isNegative
                ? "text-red-400 bg-red-400/10 hover:bg-red-400/20"
                : "text-text-muted hover:text-text-primary hover:bg-white/[0.06]"
            )}
            tabIndex={-1}
            title="Toggle negative"
          >
            ±
          </button>
        </div>
        {description && !error && (
          <Typography variant="small" className="text-text-muted mt-1.5 block opacity-60">
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
