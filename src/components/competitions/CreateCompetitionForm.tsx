import React, { useState } from 'react';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CompetitionType, CompetitionStatus } from '@/src/types';
import { cn, safeDate } from '@/src/lib/utils';
import { Calendar, Target, Award, Send } from 'lucide-react';

/**
 * StripeItCompetitionSystem - CreateCompetitionForm
 * Internal manager tool for launching new sales events.
 */

interface CreateCompetitionFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CreateCompetitionForm: React.FC<CreateCompetitionFormProps> = ({ 
  onSubmit, 
  onCancel,
  isLoading = false 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CompetitionType>(CompetitionType.UNITS);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reward, setReward] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;

    await onSubmit({
      title,
      description,
      type,
      startDate: safeDate(startDate).getTime(),
      endDate: safeDate(endDate).getTime(),
      rewardDescription: reward,
      status: CompetitionStatus.ACTIVE // Default to active for foundational release
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Typography variant="label" className="text-slate-500 ml-1">Competition Title</Typography>
          <Input 
            placeholder="e.g. Memorial Day Unit Blitz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="bg-white/[0.02]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-2">
             <Typography variant="label" className="text-slate-500 ml-1">Rank By Metric</Typography>
             <Select
               value={type}
               onChange={(val) => setType(val as CompetitionType)}
               options={[
                 { label: 'Total Units', value: CompetitionType.UNITS },
                 { label: 'Front-End Gross', value: CompetitionType.FRONT_END_GROSS },
                 { label: 'Back-End Gross', value: CompetitionType.BACK_END_GROSS },
                 { label: 'Total Gross', value: CompetitionType.TOTAL_GROSS },
                 { label: 'Estimated Commission', value: CompetitionType.COMMISSION },
               ]}
               className="bg-white/[0.02]"
             />
           </div>
           <div className="space-y-2">
             <Typography variant="label" className="text-slate-500 ml-1">Spiff / Reward</Typography>
             <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <Input 
                  placeholder="e.g. $500 Bonus or 2 Days Off"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="pl-10 bg-white/[0.02]"
                />
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="space-y-2">
             <Typography variant="label" className="text-slate-500 ml-1">Start Date</Typography>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <Input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="pl-10 bg-white/[0.02]"
                />
             </div>
           </div>
           <div className="space-y-2">
             <Typography variant="label" className="text-slate-500 ml-1">End Date</Typography>
             <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4" />
                <Input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="pl-10 bg-white/[0.02]"
                />
             </div>
           </div>
        </div>

        <div className="space-y-2">
          <Typography variant="label" className="text-slate-500 ml-1">Description (Optional)</Typography>
          <textarea
            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-primary min-h-[80px] transition-all resize-none text-sm"
            placeholder="Rules, additional info, etc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="submit"
          className="flex-1 bg-brand-primary text-bg-deep font-black uppercase tracking-widest shadow-glow h-12"
          isLoading={isLoading}
        >
          <Send className="mr-2 h-4 w-4" />
          Launch Competition
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
