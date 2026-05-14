import React, { useState } from 'react';
import { 
  Rocket, 
  ChevronRight, 
  Zap, 
  Trophy, 
  Calculator, 
  X,
  Target,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { onboardingService } from '@/src/services/onboardingService';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '@/src/lib/utils';

/**
 * StripeItOnboardingSystem - OnboardingFlow
 * Lightweight, multi-step guided setup for new users.
 */

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to StripeIt',
    description: 'The premium commission tracker designed specifically for car sales professionals.',
    icon: <Sparkles className="h-8 w-8 text-brand-primary" />,
    color: 'from-brand-primary/20 to-transparent'
  },
  {
    id: 'payplan',
    title: 'Set Your Pay Plan',
    description: 'We calculate your commission in real-time. Define your minis, percentages, and unit tiers.',
    icon: <Calculator className="h-8 w-8 text-cyan-400" />,
    color: 'from-cyan-400/20 to-transparent'
  },
  {
    id: 'goals',
    title: 'Track Your Goals',
    description: 'Set monthly unit and gross goals to stay focused on what matters most.',
    icon: <Target className="h-8 w-8 text-indigo-400" />,
    color: 'from-indigo-400/20 to-transparent'
  },
  {
    id: 'log',
    title: 'Log Your First Deal',
    description: 'Everything starts with the log. Fast, simple, and mobile-optimized deal entry.',
    icon: <Zap className="h-8 w-8 text-emerald-400" />,
    color: 'from-emerald-400/20 to-transparent'
  }
];

export const OnboardingFlow: React.FC = () => {
  const { profile } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  if (!profile || profile.preferences?.onboarding?.isCompleted) return null;
  if (!isVisible) return null;

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;

  const handleNext = async () => {
    if (isLastStep) {
      await onboardingService.finishOnboarding(profile.uid);
      setIsVisible(false);
    } else {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      await onboardingService.updateStep(profile.uid, STEPS[nextIndex].id);
    }
  };

  const handleSkip = async () => {
    await onboardingService.finishOnboarding(profile.uid);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-bg-deep/80 backdrop-blur-xl"
          onClick={handleSkip}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-xl overflow-y-auto max-h-[90vh] rounded-[2.5rem] bg-bg-card border border-white/10 shadow-2xl no-scrollbar"
        >
          {/* Progress Bar */}
          <div className="sticky top-0 left-0 w-full h-1 bg-white/5 z-20">
            <motion.div 
              className="h-full bg-brand-primary shadow-glow glow-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 20 }}
            />
          </div>

          <div className={cn("p-8 sm:p-12 space-y-8 bg-gradient-to-b", currentStep.color)}>
            <div className="flex justify-between items-start">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner border border-white/5">
                {currentStep.icon}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleSkip}
                className="text-slate-500 hover:text-white -mr-2 sm:-mr-4 -mt-2 sm:-mt-4"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <Typography variant="h2" className="text-white italic font-black uppercase tracking-tighter text-3xl sm:text-4xl leading-none">
                {currentStep.title}
              </Typography>
              <Typography variant="p" className="text-slate-400 text-base sm:text-lg leading-relaxed">
                {currentStep.description}
              </Typography>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Button 
                onClick={handleNext}
                className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl text-base sm:text-lg font-black italic uppercase tracking-tighter shadow-glow glow-primary group"
              >
                {isLastStep ? 'Let\'s Go' : 'Continue'}
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="text-slate-500 hover:text-white uppercase text-[10px] font-black tracking-widest py-4 sm:py-0"
              >
                Skip intro
              </Button>
            </div>
          </div>

          <div className="px-8 sm:px-12 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
              Step {currentStepIndex + 1} of {STEPS.length}
            </Typography>
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    i === currentStepIndex ? "w-4 bg-brand-primary" : "w-1 bg-white/10"
                  )} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
