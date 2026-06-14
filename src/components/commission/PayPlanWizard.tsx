import React, { useState, useEffect } from 'react';
import { Crown, Lock, Car, Zap, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { useResponsive } from '@/src/hooks/useResponsive';
import { useAuth } from '@/src/contexts/AuthContext';
import { PayPlan, SubscriptionTier, VolumeBonusType, VolumeBonusScope, VolumeBonusFilter, HourlyPayoutModel } from '@/src/types';

interface PayPlanWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<PayPlan> | null;
  onSubmit: (data: Partial<PayPlan>) => Promise<void>;
  isLoading?: boolean;
}

export const PayPlanWizard: React.FC<PayPlanWizardProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const { profile } = useAuth();
  const { isMobile } = useResponsive();

  const isFree = profile?.subscriptionTier === SubscriptionTier.FREE;

  // 1. Current step
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);

  // 2. Form state
  const [selectedTypes, setSelectedTypes] = useState<('new' | 'used' | 'cpo')[]>(['new', 'used']);
  const [frontSame, setFrontSame] = useState(true);
  const [frontRates, setFrontRates] = useState<{ new: number; used: number; cpo: number }>({ new: 25, used: 25, cpo: 25 });
  const [backSame, setBackSame] = useState(true);
  const [backRates, setBackRates] = useState<{ new: number; used: number; cpo: number }>({ new: 5, used: 5, cpo: 5 });
  
  const [packTracking, setPackTracking] = useState<'before' | 'after'>('after');
  const [packAmounts, setPackAmounts] = useState<{ new: number; used: number; cpo: number }>({ new: 0, used: 0, cpo: 0 });

  const [hasMinis, setHasMinis] = useState(false);
  const [miniNew, setMiniNew] = useState(0);
  const [miniUsed, setMiniUsed] = useState(0);

  const [hasVolumeBonuses, setHasVolumeBonuses] = useState(false);
  const [volumeTiers, setVolumeTiers] = useState<{ threshold: number; amount: number; retro: boolean }[]>([
    { threshold: 10, amount: 250, retro: true },
  ]);

  const [hasHourly, setHasHourly] = useState(false);
  const [hourlyModel, setHourlyModel] = useState<'guarantee' | 'additive' | 'draw'>('draw');
  const [hourlyRate, setHourlyRate] = useState(0);
  const [hoursWorked, setHoursWorked] = useState(0);

  // Reset/populate state on open/close or new data
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setDirection(1);
      
      if (initialData) {
        if (initialData.frontEndPercentage !== undefined) {
          setFrontRates({
            new: initialData.frontEndPercentage,
            used: initialData.frontEndPercentage,
            cpo: initialData.frontEndPercentage,
          });
          setFrontSame(true);
        }
        if (initialData.backEndPercentage !== undefined) {
          setBackRates({
            new: initialData.backEndPercentage,
            used: initialData.backEndPercentage,
            cpo: initialData.backEndPercentage,
          });
          setBackSame(true);
        }
        if (initialData.miniAmount !== undefined) {
          setMiniNew(initialData.miniAmount);
          setMiniUsed(initialData.miniAmount);
          setHasMinis(initialData.miniAmount > 0);
        }
        if (initialData.hourlyConfig) {
          setHasHourly(initialData.hourlyConfig.active);
          setHourlyRate(initialData.hourlyConfig.rate || 0);
          setHoursWorked(initialData.hourlyConfig.hoursWorked || 0);
          setHourlyModel(initialData.hourlyConfig.model || 'draw');
        }
        if (initialData.volumeBonuses && initialData.volumeBonuses.length > 0) {
          setHasVolumeBonuses(true);
          setVolumeTiers(initialData.volumeBonuses.map(v => ({
            threshold: v.threshold,
            amount: v.amount,
            retro: v.type === 'retro_per_unit',
          })));
        }
      } else {
        // Defaults
        setSelectedTypes(['new', 'used']);
        setFrontSame(true);
        setFrontRates({ new: 25, used: 25, cpo: 25 });
        setBackSame(true);
        setBackRates({ new: 5, used: 5, cpo: 5 });
        setPackTracking('after');
        setPackAmounts({ new: 0, used: 0, cpo: 0 });
        setHasMinis(false);
        setMiniNew(0);
        setMiniUsed(0);
        setHasVolumeBonuses(false);
        setVolumeTiers([{ threshold: 10, amount: 250, retro: true }]);
        setHasHourly(false);
        setHourlyModel('draw');
        setHourlyRate(0);
        setHoursWorked(0);
      }
    }
  }, [isOpen, initialData]);

  const PROBadge = () => {
    if (!isFree) return null;
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-[#AAFF00]/20 bg-[#AAFF00]/10 text-[#AAFF00] text-[9px] font-black uppercase tracking-widest shrink-0 select-none">
        PRO FEATURE
      </span>
    );
  };

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1: return "Deal Types";
      case 2: return "Front End Rate";
      case 3: return "Back End Rate";
      case 4: return "Pack Deduction";
      case 5: return "Minis Guarantee";
      case 6: return "Unit Bonuses";
      case 7: return "Draw or Hourly";
      case 8: return "Save & Review";
      default: return "";
    }
  };

  const isStepValid = (step: number) => {
    if (step === 1) return selectedTypes.length > 0;
    if (step === 2) {
      if (frontSame) return frontRates.new >= 0 && frontRates.new <= 100;
      return selectedTypes.every(t => frontRates[t] >= 0 && frontRates[t] <= 100);
    }
    if (step === 3) {
      if (backSame) return backRates.new >= 0 && backRates.new <= 100;
      return selectedTypes.every(t => backRates[t] >= 0 && backRates[t] <= 100);
    }
    if (step === 4) {
      if (packTracking === 'before') {
        return selectedTypes.every(t => packAmounts[t] >= 0);
      }
    }
    if (step === 5) {
      if (hasMinis) {
        return miniNew >= 0 && miniUsed >= 0;
      }
    }
    if (step === 6) {
      if (hasVolumeBonuses) {
        return volumeTiers.length > 0 && volumeTiers.every(tier => tier.threshold > 0 && tier.amount >= 0);
      }
    }
    if (step === 7) {
      if (hasHourly) {
        return hourlyRate >= 0 && hoursWorked >= 0;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      if (currentStep < 8) {
        setDirection(1);
        setCurrentStep(currentStep + 1);
      } else {
        handleSave();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const mappedData: Partial<PayPlan> = {
        frontEndPercentage: frontSame ? frontRates.new : (frontRates.new || 0),
        backEndPercentage: backSame ? backRates.new : (backRates.new || 0),
        miniAmount: hasMinis ? miniNew : 0,
        isMinisAndHourlyActive: hasMinis || hasHourly,
        isMinisActive: false,
        isHourlyActive: hasHourly,
        hourlyConfig: hasHourly ? { active: true, rate: hourlyRate, hoursWorked, model: hourlyModel as HourlyPayoutModel } : undefined,
        isAdvanced: hasVolumeBonuses,
        isVolumeBonusEngineActive: hasVolumeBonuses,
        volumeBonuses: hasVolumeBonuses ? volumeTiers.map((t, i) => ({
          id: `wizard-tier-${i}`,
          threshold: t.threshold,
          amount: t.amount,
          type: t.retro ? VolumeBonusType.RETRO_PER_UNIT : VolumeBonusType.FLAT,
          scope: VolumeBonusScope.ALL_UNITS,
          filter: VolumeBonusFilter.ANY,
          active: true
        })) : [],
        tiers: hasVolumeBonuses ? volumeTiers.map((t, i) => ({
          id: `wizard-tier-${i}`,
          threshold: t.threshold,
          bonusAmount: t.amount,
          perUnitBonus: 0,
          isRetroactive: t.retro,
          frontRetroactive: false,
          backRetroactive: false
        })) : [],
        flatPerUnitAmount: 0,
        isFlatPerUnitActive: false,
        splitDealBehavior: 'standard',
        isSplitBehaviorActive: true,
        name: 'My Pay Plan',
        isRulesEnabled: false,
        rules: [],
      };
      await onSubmit(mappedData);
      onClose();
    } catch (err) {
      console.error('Error saving pay plan from wizard:', err);
    } finally {
      setSaving(false);
    }
  };

  const isSelected = (type: 'new' | 'used' | 'cpo') => selectedTypes.includes(type);
  const toggleType = (type: 'new' | 'used' | 'cpo') => {
    if (isSelected(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] mb-2 block">
                Step 1: Vehicle Access
              </span>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                WHAT DO YOU SELL?
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
                Select all vehicle types you log deals for.
              </Typography>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full max-w-md mx-auto">
              {(['new', 'used', 'cpo'] as const).map(type => {
                const active = isSelected(type);
                return (
                  <div
                    key={type}
                    id={`card-type-${type}`}
                    onClick={() => toggleType(type)}
                    className={cn(
                      "rounded-2xl border p-4 sm:p-6 flex flex-col items-center gap-3 transition-all cursor-pointer select-none",
                      active 
                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                        : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20 hover:bg-white/[0.04]"
                    )}
                  >
                    <Car size={24} className={cn(active ? "text-brand-primary" : "text-slate-500")} />
                    <span className="text-xs uppercase font-black tracking-widest">{type}</span>
                  </div>
                );
              })}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-center text-orange-400 text-[10px] uppercase font-black tracking-wide">
                Please select at least one sell type.
              </p>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] mb-2 block animate-pulse">
                Step 2: Gross Commission
              </span>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                YOUR FRONT END RATE
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                What percentage do you earn on front end gross?
              </Typography>
            </div>

            {selectedTypes.length > 1 && (
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 max-w-xs mx-auto mb-6">
                <button
                  type="button"
                  onClick={() => setFrontSame(true)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    frontSame 
                      ? "bg-brand-primary text-bg-deep font-black" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Same for all
                </button>
                <button
                  type="button"
                  onClick={() => setFrontSame(false)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    !frontSame 
                      ? "bg-brand-primary text-bg-deep font-black" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Different
                </button>
              </div>
            )}

            <div className="space-y-4 max-w-xs mx-auto">
              {frontSame || selectedTypes.length <= 1 ? (
                <div className="relative">
                  <Typography variant="label" className="text-slate-500 block mb-1.5 text-xs">
                    Front End Commission Rate (%)
                  </Typography>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="25"
                      required
                      value={frontRates.new || ''}
                      onChange={(e) => setFrontRates({ ...frontRates, new: parseFloat(e.target.value) || 0 })}
                      className="pr-10 bg-slate-900/50"
                      hideLabel
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTypes.map(type => (
                    <div key={type} className="relative">
                      <Typography variant="label" className="text-slate-500 block mb-1.5 text-xs uppercase font-bold tracking-wider">
                        {type} Front End Rate (%)
                      </Typography>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          placeholder="25"
                          required
                          value={frontRates[type] || ''}
                          onChange={(e) => setFrontRates({ ...frontRates, [type]: parseFloat(e.target.value) || 0 })}
                          className="pr-10 bg-slate-900/50"
                          hideLabel
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] mb-2 block">
                Step 3: F&I Commission
              </span>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                YOUR BACK END RATE
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                What percentage do you earn on back end / F&I gross?
              </Typography>
            </div>

            {selectedTypes.length > 1 && (
              <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1 max-w-xs mx-auto mb-6">
                <button
                  type="button"
                  onClick={() => setBackSame(true)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    backSame 
                      ? "bg-brand-primary text-bg-deep font-black" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Same for all
                </button>
                <button
                  type="button"
                  onClick={() => setBackSame(false)}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                    !backSame 
                      ? "bg-brand-primary text-bg-deep font-black" 
                      : "text-slate-400 hover:text-white"
                  )}
                >
                  Different
                </button>
              </div>
            )}

            <div className="space-y-4 max-w-xs mx-auto">
              {backSame || selectedTypes.length <= 1 ? (
                <div className="relative">
                  <Typography variant="label" className="text-slate-500 block mb-1.5 text-xs">
                    Back End Commission Rate (%)
                  </Typography>
                  <div className="relative">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      placeholder="5"
                      required
                      value={backRates.new || ''}
                      onChange={(e) => setBackRates({ ...backRates, new: parseFloat(e.target.value) || 0 })}
                      className="pr-10 bg-slate-900/50"
                      hideLabel
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTypes.map(type => (
                    <div key={type} className="relative">
                      <Typography variant="label" className="text-slate-500 block mb-1.5 text-xs uppercase font-bold tracking-wider">
                        {type} Back End Rate (%)
                      </Typography>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          placeholder="5"
                          required
                          value={backRates[type] || ''}
                          onChange={(e) => setBackRates({ ...backRates, [type]: parseFloat(e.target.value) || 0 })}
                          className="pr-10 bg-slate-900/50"
                          hideLabel
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm pointer-events-none">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] mb-2 block">
                Step 4: Pack Deductions
              </span>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                HOW DO YOU TRACK GROSS?
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Does your dealership show you gross before or after pack is deducted?
              </Typography>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-6">
              <div
                id="card-pack-before"
                onClick={() => setPackTracking('before')}
                className={cn(
                  "rounded-2xl border p-5 flex flex-col gap-2 transition-all cursor-pointer select-none text-left",
                  packTracking === 'before'
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="text-xs uppercase font-black tracking-wider block font-display">Before Pack</div>
                <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  I see the full gross, pack gets deducted from my commission.
                </div>
              </div>

              <div
                id="card-pack-after"
                onClick={() => setPackTracking('after')}
                className={cn(
                  "rounded-2xl border p-5 flex flex-col gap-2 transition-all cursor-pointer select-none text-left",
                  packTracking === 'after'
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="text-xs uppercase font-black tracking-wider block font-display">After Pack</div>
                <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  The gross I see already has pack removed.
                </div>
              </div>
            </div>

            {packTracking === 'before' && (
              <div className="space-y-4 max-w-xs mx-auto animate-fadeIn mt-6">
                {selectedTypes.map(type => (
                  <CurrencyInput
                    key={type}
                    label={`${type.toUpperCase()} Pack Amount`}
                    value={packAmounts[type] || 0}
                    onChange={(e) => setPackAmounts({ ...packAmounts, [type]: parseFloat(e.target.value) || 0 })}
                    required
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex gap-2 items-center justify-center mb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] block">
                  Step 5: Minimum Commission
                </span>
                <PROBadge />
              </div>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                MINIMUM DEAL PAY
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Do you have a minimum commission guarantee per deal?
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
              <div
                id="card-minis-yes"
                onClick={() => setHasMinis(true)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer select-none text-center",
                  hasMinis
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <span className="text-xs uppercase font-black tracking-widest font-display">Yes</span>
              </div>

              <div
                id="card-minis-no"
                onClick={() => setHasMinis(false)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer select-none text-center",
                  !hasMinis
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <span className="text-xs uppercase font-black tracking-widest font-display">No</span>
              </div>
            </div>

            {hasMinis && (
              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mt-6 animate-fadeIn">
                <CurrencyInput
                  label="New Mini Pay"
                  value={miniNew}
                  onChange={(e) => setMiniNew(parseFloat(e.target.value) || 0)}
                  required
                />
                <CurrencyInput
                  label="Used Mini Pay"
                  value={miniUsed}
                  onChange={(e) => setMiniUsed(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex gap-2 items-center justify-center mb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] block">
                  Step 6: Unit Bonuses
                </span>
                <PROBadge />
              </div>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                UNIT BONUSES
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Do you earn extra pay for hitting unit targets?
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
              <div
                id="card-volume-yes"
                onClick={() => setHasVolumeBonuses(true)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer select-none text-center",
                  hasVolumeBonuses
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20"
                )}
              >
                <span className="text-xs uppercase font-black tracking-widest font-display">Yes</span>
              </div>

              <div
                id="card-volume-no"
                onClick={() => setHasVolumeBonuses(false)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer select-none text-center",
                  !hasVolumeBonuses
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20"
                )}
              >
                <span className="text-xs uppercase font-black tracking-widest font-display">No</span>
              </div>
            </div>

            {hasVolumeBonuses && (
              <div className="space-y-4 max-w-md mx-auto mt-6 animate-fadeIn">
                {volumeTiers.map((tier, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-end gap-3 p-4 rounded-xl bg-white/[0.01] border border-white/5 relative">
                    <div className="w-20">
                      <Input
                        label="Units"
                        type="number"
                        min={1}
                        placeholder="10"
                        value={tier.threshold || ''}
                        onChange={(e) => {
                          const updated = [...volumeTiers];
                          updated[index].threshold = parseInt(e.target.value) || 0;
                          setVolumeTiers(updated);
                        }}
                        required
                      />
                    </div>
                    <div className="flex-1 w-full sm:w-auto">
                      <CurrencyInput
                        label="Bonus Amount"
                        value={tier.amount}
                        onChange={(e) => {
                          const updated = [...volumeTiers];
                          updated[index].amount = parseFloat(e.target.value) || 0;
                          setVolumeTiers(updated);
                        }}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...volumeTiers];
                          updated[index].retro = !updated[index].retro;
                          setVolumeTiers(updated);
                        }}
                        className={cn(
                          "flex-1 h-11 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center whitespace-nowrap",
                          tier.retro
                            ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/20"
                        )}
                      >
                        Retro
                      </button>
                      
                      {volumeTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setVolumeTiers(volumeTiers.filter((_, i) => i !== index));
                          }}
                          className="h-11 w-11 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center hover:bg-orange-500/20 transition-all shrink-0"
                          title="Remove Tier"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {volumeTiers.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setVolumeTiers([...volumeTiers, { threshold: (volumeTiers[volumeTiers.length - 1]?.threshold || 10) + 5, amount: 250, retro: true }]);
                    }}
                    className="w-full h-11 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:border-white/20 transition-all"
                  >
                    <Plus size={14} />
                    Add Bonus Tier ({volumeTiers.length}/3)
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex gap-2 items-center justify-center mb-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] block">
                  Step 7: Advanced Offsets
                </span>
                <PROBadge />
              </div>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                DRAW OR HOURLY PAY
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Do you receive a draw advance or hourly guarantee against your commission?
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
              <div
                id="card-hourly-yes"
                onClick={() => setHasHourly(true)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer select-none text-center",
                  hasHourly
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20"
                )}
              >
                <span className="text-xs uppercase font-black tracking-widest font-display">Yes</span>
              </div>

              <div
                id="card-hourly-no"
                onClick={() => setHasHourly(false)}
                className={cn(
                  "rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all cursor-pointer select-none text-center",
                  !hasHourly
                    ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_15px_rgba(0,212,255,0.15)]"
                    : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20"
                )}
              >
                <span className="text-xs uppercase font-black tracking-widest font-display">No</span>
              </div>
            </div>

            {hasHourly && (
              <div className="space-y-6 max-w-md mx-auto mt-6 animate-fadeIn">
                {/* Model Selection */}
                <div className="grid grid-cols-3 gap-2">
                  {(['guarantee', 'additive', 'draw'] as const).map(model => (
                    <div
                      key={model}
                      id={`card-model-${model}`}
                      onClick={() => setHourlyModel(model)}
                      className={cn(
                        "rounded-xl border p-3 flex flex-col items-center transition-all cursor-pointer select-none text-center gap-1",
                        hourlyModel === model
                          ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-[0_0_10px_rgba(0,212,255,0.1)]"
                          : "bg-white/[0.02] border-white/10 text-slate-500 hover:border-white/20"
                      )}
                    >
                      <span className="text-[10px] uppercase font-black tracking-widest font-display">{model}</span>
                      <span className="text-[8px] text-slate-500 font-sans leading-none">
                        {model === 'guarantee' && 'Guarantee'}
                        {model === 'additive' && 'On top'}
                        {model === 'draw' && 'Draw'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Hourly inputs */}
                <div className="grid grid-cols-2 gap-4">
                  <CurrencyInput
                    label="Hourly / Draw Rate"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <Input
                    label="Hours / Month"
                    type="number"
                    min={1}
                    placeholder="160"
                    value={hoursWorked || ''}
                    onChange={(e) => setHoursWorked(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#AAFF00] mb-2 block animate-pulse">
                Step 8: Pay Plan Complete
              </span>
              <Typography variant="h2" className="text-white font-black uppercase tracking-tight italic">
                REVIEW YOUR PAY PLAN
              </Typography>
              <Typography variant="p" className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Here's what we'll save. You can always refine this further in Commission Architect.
              </Typography>
            </div>

            <div className="space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Deal Types Summary Card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Selling Fleet</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedTypes.map(t => (
                      <span key={t} className="text-[10px] font-black uppercase tracking-wider bg-brand-primary/10 text-brand-primary border border-brand-primary/10 px-2 py-0.5 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rates Summary Card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Commission Rates</span>
                  <div className="text-xs font-mono space-y-0.5 text-white">
                    <div>Front: {frontSame ? `${frontRates.new}%` : selectedTypes.map(t => `${t}: ${frontRates[t]}%`).join(' | ')}</div>
                    <div>Back: {backSame ? `${backRates.new}%` : selectedTypes.map(t => `${t}: ${backRates[t]}%`).join(' | ')}</div>
                  </div>
                </div>

                {/* Pack Summary Card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Pack Tracking</span>
                  <div className="text-xs text-white">
                    {packTracking === 'before' ? (
                      <div className="font-mono">
                        Pack: {selectedTypes.map(t => `${t}: $${packAmounts[t]}`).join(' | ')}
                      </div>
                    ) : (
                      <span className="font-bold text-slate-400">After Pack (No deducts)</span>
                    )}
                  </div>
                </div>

                {/* Minis Summary Card with Lock/Pro state */}
                <div className="relative p-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  {isFree && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] z-10 flex items-center justify-center gap-1.5 border border-white/5 rounded-xl">
                      <Lock size={12} className="text-[#AAFF00]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#AAFF00]">Unlock With Pro</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Deal Minis</span>
                    <div className="text-xs font-mono text-white">
                      {hasMinis ? `New: $${miniNew} | Used: $${miniUsed}` : 'No Minis Configured'}
                    </div>
                  </div>
                </div>

                {/* Bonuses Summary Card with Lock/Pro state */}
                <div className="relative p-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden sm:col-span-2">
                  {isFree && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] z-10 flex items-center justify-center gap-1.5 border border-white/5 rounded-xl">
                      <Lock size={12} className="text-[#AAFF00]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#AAFF00]">Unlock With Pro</span>
                    </div>
                  )}
                  <div className="space-y-1 select-none">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Volume Unit Bonuses</span>
                    <div className="text-xs font-mono text-white">
                      {hasVolumeBonuses ? (
                        <div className="flex gap-2 flex-wrap">
                          {volumeTiers.map((t, idx) => (
                            <span key={idx} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                              {t.threshold} Units = ${t.amount} {t.retro ? '(Retro)' : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'No volume bonuses'
                      )}
                    </div>
                  </div>
                </div>

                {/* Draw/Hourly Summary Card with Lock/Pro state */}
                <div className="relative p-4 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden sm:col-span-2">
                  {isFree && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] z-10 flex items-center justify-center gap-1.5 border border-white/5 rounded-xl">
                      <Lock size={12} className="text-[#AAFF00]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#AAFF00]">Unlock With Pro</span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Draw or Hourly Pay</span>
                    <div className="text-xs font-mono text-white">
                      {hasHourly ? (
                        <span>Model: {hourlyModel.toUpperCase()} | Rate: ${hourlyRate}/hr | Hours: {hoursWorked}/mo</span>
                      ) : (
                        'No Draw/Hourly offset'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 gap-3 mt-6">
                <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/20 text-left gap-2 flex items-start">
                  <Sparkles size={16} className="text-brand-primary mt-0.5 shrink-0" />
                  <div>
                    <Typography variant="p" className="text-xs text-brand-primary font-bold">
                      Near-infinite customization available.
                    </Typography>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Commission Architect supports volume ladders, custom rules, retro tiers, mini ladders, split deal logic, and more.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-left gap-2 flex items-start justify-between">
                  <div className="flex gap-2 items-start">
                    <ShieldCheck size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <Typography variant="p" className="text-xs text-slate-300 font-bold">
                        Don't see your pay plan structure?
                      </Typography>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        Submit a feature request — we add new pay plan types regularly.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('stripeit:open-feedback', { detail: { type: 'feature' } }));
                      onClose();
                    }}
                    className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest shrink-0"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const indicatorsAndProgress = (
    <div className="shrink-0">
      {/* Pills */}
      <div className="flex justify-between items-center w-full max-w-sm mx-auto mb-4 gap-1 sm:gap-2">
        {Array.from({ length: 8 }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <button
                type="button"
                onClick={() => {
                  if (stepNum < currentStep || (stepNum > currentStep && isStepValid(currentStep))) {
                    setDirection(stepNum > currentStep ? 1 : -1);
                    setCurrentStep(stepNum);
                  }
                }}
                className={cn(
                  "h-7 w-7 rounded-full text-[10px] font-black flex items-center justify-center transition-all border",
                  isActive && "bg-brand-primary text-bg-deep border-brand-primary shadow-glow",
                  isCompleted && "bg-brand-primary/30 text-white/85 border-brand-primary/20 hover:bg-brand-primary/45",
                  !isActive && !isCompleted && "bg-white/10 text-white/40 border-transparent"
                )}
              >
                {stepNum}
              </button>
            </div>
          );
        })}
      </div>

      {/* Progress Bar Label */}
      <div className="text-center mb-6">
        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
          Step {currentStep} of 8: {getStepLabel(currentStep)}
        </Typography>
        <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <div 
            className="bg-brand-primary h-full transition-all duration-300"
            style={{ width: `${(currentStep / 8) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  const wizardInnerContent = (
    <div className="flex flex-col h-full justify-between min-h-[480px]">
      {indicatorsAndProgress}

      {/* Step slider animation container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar my-4 py-2 px-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentStep}
            custom={direction}
            initial={{ x: direction * 25, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -direction * 25, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="space-y-6 flex-1 flex flex-col justify-start"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer sticky-ish navigation bar */}
      <div className="flex gap-3 pt-6 border-t border-white/5 mt-auto bg-bg-main/50 pb-2">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 font-bold text-xs uppercase tracking-widest py-3 h-11"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>
        )}
        <Button
          variant="primary"
          disabled={!isStepValid(currentStep) || saving || isLoading}
          onClick={handleNext}
          className={cn(
            "font-black uppercase tracking-widest py-3 h-11 bg-brand-primary text-bg-deep",
            currentStep === 1 ? "w-full" : "flex-1"
          )}
        >
          {saving || isLoading ? (
            "Saving..."
          ) : currentStep === 8 ? (
            "Save Pay Plan"
          ) : (
            <span className="flex items-center justify-center gap-1">
              Next
              <ChevronRight size={16} className="ml-1" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <FullscreenMobileFlow
        isOpen={isOpen}
        onClose={onClose}
        title="Pay Plan Setup"
      >
        <div className="h-[calc(100vh-140px)] flex flex-col justify-between">
          {wizardInnerContent}
        </div>
      </FullscreenMobileFlow>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay Plan Setup"
      className="max-w-2xl bg-bg-main border-border-card"
    >
      <div className="max-h-[75vh] overflow-hidden flex flex-col">
        {wizardInnerContent}
      </div>
    </Modal>
  );
};
