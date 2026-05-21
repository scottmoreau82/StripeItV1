import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';

export interface TrialWelcomeModalProps {
  isOpen: boolean;
  daysRemaining: number;
  onConfigPayPlan: () => void;
  onLogDeal: () => void;
  onDismiss: () => void;
}

export const TrialWelcomeModal: React.FC<TrialWelcomeModalProps> = ({
  isOpen,
  daysRemaining,
  onConfigPayPlan,
  onLogDeal,
  onDismiss,
}) => {
  const displayDays = Math.max(0, daysRemaining);

  return (
    <Modal isOpen={isOpen} onClose={onDismiss}>
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        {/* Header Area */}
        <div className="space-y-2">
          <h2 className="font-display text-4xl font-black italic uppercase tracking-tighter text-brand-primary leading-none">
            WELCOME TO PRO
          </h2>
          <Typography variant="mono" className="text-slate-500 font-bold block text-xs tracking-wider">
            YOUR 30-DAY TRIAL IS ACTIVE
          </Typography>
        </div>

        {/* Days Remaining Display */}
        <div className="flex flex-col items-center py-2">
          <span className="text-6xl md:text-7xl font-display font-black tracking-tighter text-brand-primary italic leading-none">
            {displayDays}
          </span>
          <Typography variant="mono" className="text-slate-500 text-[10px] mt-2 block tracking-widest font-black">
            DAYS REMAINING
          </Typography>
        </div>

        {/* Brief Body Copy */}
        <p className="text-slate-400 text-sm max-w-sm leading-relaxed px-4">
          You have full Pro access for the next {displayDays} days. Set up your pay plan now to start tracking your commission accurately.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full pt-2">
          <Button
            variant="primary"
            onClick={onConfigPayPlan}
            className="w-full text-xs font-black tracking-wider py-4 h-auto"
          >
            SET UP PAY PLAN
          </Button>
          <Button
            variant="outline"
            onClick={onLogDeal}
            className="w-full text-xs font-black tracking-wider py-4 h-auto text-white/90 border-white/10 hover:bg-white/5 uppercase"
          >
            LOG FIRST DEAL
          </Button>
        </div>

        {/* Dismiss Link */}
        <button
          onClick={onDismiss}
          className="text-slate-500 text-xs hover:text-slate-300 transition-colors cursor-pointer block font-mono uppercase tracking-widest"
        >
          I'll do this later
        </button>
      </div>
    </Modal>
  );
};
