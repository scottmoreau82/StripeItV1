import React from 'react';
import { cn } from '@/src/lib/utils';
import { Typography } from './Typography';

/**
 * StripeItInputSystem
 * Standardized form inputs with labels and error states.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  hideLabel?: boolean;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, labelClassName, hideLabel, error, ...props }, ref) => {
    return (
      <div className="flex w-full flex-col gap-1.5">
        {!hideLabel && label && (
          <Typography variant="label" className={cn("text-slate-400", labelClassName)}>
            {label}
            {props.required && <span className="ml-1 text-red-500 font-bold">*</span>}
          </Typography>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-2 text-sm text-white caret-white ring-offset-bg-deep file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-orange-500/50 bg-orange-500/5 focus-visible:ring-orange-500/20 focus-visible:border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <Typography variant="mono" className="text-orange-400 text-[10px] uppercase font-bold tracking-wider mt-1 px-1">
            {error}
          </Typography>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
