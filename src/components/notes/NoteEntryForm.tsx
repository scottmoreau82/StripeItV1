import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { QuickNote, Deal } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { FileText, User, Hash, Calendar, Send, X } from 'lucide-react';

/**
 * StripeItQuickNoteEntrySystem
 * Ultra-fast note entry system optimized for mobile and desktop.
 */

interface NoteEntryFormProps {
  deals?: Deal[];
  onSubmit: (data: Partial<QuickNote>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const NoteEntryForm: React.FC<NoteEntryFormProps> = ({
  deals = [],
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [text, setText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [stockNumber, setStockNumber] = useState('');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    await onSubmit({
      text,
      customerName: customerName || undefined,
      stockNumber: stockNumber || undefined,
      dealId: selectedDealId || undefined,
      reminderDate: reminderDate || undefined,
    });

    // Reset form after successful submit (assuming parent handles closing)
    setText('');
    setCustomerName('');
    setStockNumber('');
    setSelectedDealId('');
    setReminderDate('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Main Note Text - Textarea style but using Input for consistency if needed, 
            or a custom styled textarea for the premium feel */}
        <div className="space-y-2">
          <Typography variant="label" className="text-slate-500 ml-1">What's on your mind?</Typography>
          <div className="relative">
            <textarea
              className={cn(
                "w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary min-h-[120px] transition-all resize-none",
                isLoading && "opacity-50 pointer-events-none"
              )}
              placeholder="e.g. Follow up on the F-150 trade, customer needs $2k more..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Optional Metadata Toggle */}
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-primary/80 transition-colors ml-1"
          >
            + Add Details (Deal, Customer, Reminder)
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Typography variant="label" className="text-slate-500 ml-1">Customer</Typography>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    placeholder="Customer Name"
                    className="pl-10 bg-white/[0.02]"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Typography variant="label" className="text-slate-500 ml-1">Stock #</Typography>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    placeholder="Stock Number"
                    className="pl-10 bg-white/[0.02]"
                    value={stockNumber}
                    onChange={(e) => setStockNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Typography variant="label" className="text-slate-500 ml-1">Related Deal</Typography>
                <select
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 h-11 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary appearance-none text-sm"
                  value={selectedDealId}
                  onChange={(e) => setSelectedDealId(e.target.value)}
                >
                  <option value="" className="bg-bg-deep">Select existing deal...</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id} className="bg-bg-deep">
                      {deal.customerName} - {deal.purchasedVehicle}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Typography variant="label" className="text-slate-500 ml-1">Reminder Date</Typography>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                  <Input
                    type="date"
                    className="pl-10 bg-white/[0.02]"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors ml-1"
            >
              <X size={12} /> Hide Details
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1 bg-brand-primary text-bg-deep font-black uppercase tracking-widest shadow-glow h-12"
          isLoading={isLoading}
        >
          <Send className="mr-2 h-4 w-4" />
          Save Quick Note
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-slate-500 hover:text-white uppercase font-bold text-[10px] tracking-widest"
          >
            Discard
          </Button>
        )}
      </div>
    </form>
  );
};
