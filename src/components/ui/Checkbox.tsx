import React from 'react';
import { Check, Square } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked,
  onCheckedChange,
  className
}) => {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "h-5 w-5 rounded border transition-all flex items-center justify-center outline-none focus:ring-2 focus:ring-brand-primary/20",
        checked 
          ? "bg-brand-primary border-brand-primary text-white shadow-glow glow-primary/20" 
          : "bg-white/5 border-white/10 text-transparent hover:border-white/20",
        className
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
    </button>
  );
};
