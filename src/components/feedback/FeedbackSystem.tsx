import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Typography } from '../ui/Typography';
import { Bug, Lightbulb, ArrowLeft, X, MessageSquarePlus } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackType } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

/**
 * StripeItFeedbackSystem
 * Entry point and responsive container for the feedback flow.
 * Handles desktop modals and mobile full-screen views.
 */
interface FeedbackSystemProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: FeedbackType;
}

export const FeedbackSystem: React.FC<FeedbackSystemProps> = ({ isOpen, onClose, initialType }) => {
  const [step, setStep] = useState<'choosing' | 'form'>(initialType ? 'form' : 'choosing');
  const [type, setType] = useState<FeedbackType>(initialType || FeedbackType.BUG);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setStep(initialType ? 'form' : 'choosing');
      if (initialType) setType(initialType);
    }
  }, [isOpen, initialType]);

  const handleChoice = (t: FeedbackType) => {
    setType(t);
    setStep('form');
  };

  const renderContent = () => {
    if (step === 'choosing') {
      return (
        <div className="space-y-8">
          <div className="space-y-4">
            <Typography variant="p" className="text-slate-400">
              Report a bug or request a feature. Include as much detail as you can so the issue or idea can be reviewed faster.
            </Typography>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ChoiceCard 
              icon={Bug} 
              title="Report Bug" 
              description="Something is broken or behaving incorrectly." 
              onClick={() => handleChoice(FeedbackType.BUG)} 
              color="rose"
            />
            <ChoiceCard 
              icon={Lightbulb} 
              title="Request Feature" 
              description="Ideas for new tools or improvements." 
              onClick={() => handleChoice(FeedbackType.FEATURE)}
              color="brand"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <button 
          onClick={() => setStep('choosing')} 
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Selection
        </button>
        <FeedbackForm type={type} onSuccess={onClose} />
      </div>
    );
  };

  const titleText = step === 'choosing' 
    ? "Help Improve Stripe It" 
    : type === FeedbackType.BUG ? "Report a Bug" : "New Feature Request";

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-bg-deep overflow-y-auto flex flex-col"
          >
            <div className="sticky top-0 z-10 bg-bg-deep/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
                  <MessageSquarePlus className="h-6 w-6 text-brand-primary" />
                </div>
                <Typography variant="h3" className="text-white font-black uppercase tracking-tight italic text-lg leading-none">
                  {titleText}
                </Typography>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white active:scale-95 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 pb-20">
              {renderContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={titleText}
      className="max-w-2xl"
    >
      {renderContent()}
    </Modal>
  );
};

interface ChoiceCardProps {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  color: 'rose' | 'brand';
}

const ChoiceCard: React.FC<ChoiceCardProps> = ({ icon: Icon, title, description, onClick, color }) => {
  const colorClasses = {
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-500",
    brand: "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
  }[color];

  return (
    <button 
      onClick={onClick}
      className="group p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all text-left space-y-6"
    >
      <div className={cn(
        "h-16 w-16 rounded-3xl border flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform",
        colorClasses
      )}>
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-2">
        <Typography variant="label" className="text-white block font-black uppercase tracking-[0.1em] text-xs leading-none">{title}</Typography>
        <Typography variant="small" className="text-slate-500 block leading-relaxed text-[11px] font-medium">{description}</Typography>
      </div>
    </button>
  );
};
