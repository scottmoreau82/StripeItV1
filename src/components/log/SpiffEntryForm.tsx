import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Input } from '../ui/Input';
import { MonthlySpiff } from '@/src/types';

interface SpiffEntryFormProps {
  initialData?: Partial<MonthlySpiff>;
  onSubmit: (data: Partial<MonthlySpiff>) => Promise<void>;
  onCancel: () => void;
}

export const SpiffEntryForm: React.FC<SpiffEntryFormProps> = ({
  initialData,
  onSubmit,
  onCancel
}) => {
  const [amount, setAmount] = useState(initialData?.amount || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [includedInTotal, setIncludedInTotal] = useState(initialData?.includedInTotal !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...initialData,
        amount,
        notes,
        label,
        date,
        includedInTotal,
        month: date.slice(0, 7) // Update month based on date
      });
    } catch (error) {
      console.error("Failed to save SPIFF:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CurrencyInput
            label="Adjustment Amount"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
            placeholder="$0.00"
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <Input
          label="Label (Optional)"
          placeholder="e.g. Flash SPIFF, Volume Bonus"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        <Input
          label="Notes / Reason"
          placeholder="Detailed notes for log..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="pt-2">
          <Typography variant="label" className="text-slate-400 mb-2 block">Payout Treatment</Typography>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIncludedInTotal(true)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                includedInTotal 
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
            >
              <Typography variant="mono" className="text-[10px] font-black uppercase">Include</Typography>
              <Typography variant="small" className="text-[9px]">MTD Total Pay</Typography>
            </button>
            <button
              type="button"
              onClick={() => setIncludedInTotal(false)}
              className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                !includedInTotal 
                  ? 'bg-blue-500/10 border-blue-500 text-blue-400' 
                  : 'bg-white/5 border-white/10 text-slate-500'
              }`}
            >
              <Typography variant="mono" className="text-[10px] font-black uppercase">Separate</Typography>
              <Typography variant="small" className="text-[9px]">Line Item Only</Typography>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="ghost" className="flex-1" onClick={onCancel} type="button">Cancel</Button>
        <Button 
          type="submit"
          className="flex-1 bg-brand-primary text-bg-deep font-black"
          isLoading={isSubmitting}
          disabled={amount === 0}
        >
          {initialData?.id ? 'Update' : 'Log'} SPIFF
        </Button>
      </div>
    </form>
  );
};
