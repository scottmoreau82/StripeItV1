import React, { useState, useMemo } from 'react';
import { PayPlan, PayPlanRule, PayPlanTier, Deal, DealStatus } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { 
  Calculator, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Zap, 
  TrendingUp,
} from 'lucide-react';
import { calculatePeriodEarnings } from '@/src/lib/commissionLogic';
import { cn } from '@/src/lib/utils';
import { useAppData } from '@/src/contexts/AppDataContext';
import { 
  formatMatrixValue, 
  normalizeMatrixNumber,
  normalizeCurrencyNumber
} from '@/src/lib/numberUtils';

/**
 * StripeItPayPlanFormSystem & StripeItAdvancedPayPlanSystem
 * Guided setup flow with optional advanced rules and volume tiers.
 */

interface MatrixInputGroupProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  color?: 'neutral' | 'cyan' | 'purple';
  suffix?: string;
  placeholder?: string;
  isRetroactive?: boolean;
  onToggleRetroactive?: () => void;
  isInfinite?: boolean;
  disabled?: boolean;
}

const ActiveChip: React.FC<{ active: boolean; onClick: () => void }> = ({ active, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className={cn(
      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border",
      active 
        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/20"
        : "bg-white/[0.02] text-slate-700 border-white/5 hover:border-white/10 hover:text-slate-600"
    )}
  >
    ACTIVE
  </button>
);

const MatrixInputGroup: React.FC<MatrixInputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  color = "neutral", 
  suffix,
  placeholder,
  isRetroactive,
  onToggleRetroactive,
  isInfinite,
  disabled
}) => {
  const [localValue, setLocalValue] = React.useState(value?.toString() || '');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync local value when external value changes (but not while typing)
  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(value?.toString() || '');
    }
  }, [value]);

  const labelColors = {
    neutral: "text-slate-500/80",
    cyan: "text-cyan-400 brightness-110",
    purple: "text-purple-400 brightness-110",
  };

  const fieldStyles = {
    neutral: "bg-[#050608] border-white/5 text-white focus:border-white/20",
    cyan: "bg-cyan-500/[0.03] border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)] focus:border-cyan-400/60",
    purple: "bg-purple-500/[0.03] border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.05)] focus:border-purple-400/60",
  };

  const handleBlur = () => {
    if (localValue === '') {
      onChange('');
      return;
    }
    const normalized = normalizeMatrixNumber(localValue);
    const formatted = formatMatrixValue(normalized);
    setLocalValue(formatted);
    onChange(formatted);
  };

  return (
    <div className="flex flex-col gap-2.5 flex-1 min-w-[140px] group/input">
      <div className="flex items-center justify-between">
        <Typography variant="mono" className={cn("text-[10px] font-black tracking-[0.25em] uppercase", labelColors[color])}>
          {label}
        </Typography>
      </div>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={isInfinite ? '∞' : localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isInfinite}
          className={cn(
            "w-full h-12 rounded-2xl px-5 font-bold text-base outline-none transition-all duration-300 border",
            fieldStyles[color],
            isInfinite && "text-slate-500 bg-white/[0.02] border-white/[0.03] cursor-default",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {suffix === '%' ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2.5 select-none">
            {onToggleRetroactive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRetroactive?.();
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm border",
                  isRetroactive 
                    ? (color === 'cyan' 
                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20" 
                        : "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/20")
                    : "bg-white/[0.02] text-slate-700 border-white/5 hover:border-white/10 hover:text-slate-500"
                )}
              >
                RETRO
              </button>
            )}
            <span className={cn(
              "font-bold text-sm",
              color === 'cyan' ? 'text-cyan-400/60' : color === 'purple' ? 'text-purple-400/60' : 'text-slate-500'
            )}>
              %
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface StripeItCommissionMatrixPanelProps {
  initialData?: Partial<PayPlan>;
  onSubmit: (data: Omit<PayPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>) => void;
  isLoading?: boolean;
}

export const StripeItCommissionMatrixPanel: React.FC<StripeItCommissionMatrixPanelProps> = ({
  initialData,
  onSubmit,
  isLoading
}) => {
  const { triggerError } = useAppData();

  // Ensure we have at least one default row if none exist
  const getInitialTiers = () => {
    let tiers: PayPlanTier[] = [];
    if (initialData?.tiers && initialData.tiers.length > 0) {
      tiers = [...initialData.tiers];
    } else {
      tiers = [{
        id: crypto.randomUUID(),
        threshold: 0,
        maxUnits: undefined,
        frontRate: initialData?.frontEndPercentage ?? 25,
        backRate: initialData?.backEndPercentage ?? 0,
        bonusAmount: 0,
        perUnitBonus: 0,
        isRetroactive: false,
        frontRetroactive: false,
        backRetroactive: false
      }];
    }

    // CRITICAL: Force the first tier to have threshold 0 to ensure it is the baseline
    if (tiers.length > 0) {
      tiers[0] = { ...tiers[0], threshold: 0 };
    }
    return tiers;
  };

  const [formData, setFormData] = useState({
    name: initialData?.name || 'Standard Pay Plan',
    miniAmount: initialData?.miniAmount || 200,
    frontEndPercentage: initialData?.frontEndPercentage || 25,
    backEndPercentage: initialData?.backEndPercentage || 5,
    flatPerUnitAmount: initialData?.flatPerUnitAmount || 0,
    splitDealBehavior: initialData?.splitDealBehavior || ('standard' as const),
    isAdvanced: initialData?.isAdvanced !== undefined ? initialData.isAdvanced : true,
    isRulesEnabled: initialData?.rules && initialData.rules.length > 0 ? true : false,
    isVolumeBonusActive: initialData?.tiers?.some(t => (t.bonusAmount || 0) > 0 || (t.perUnitBonus || 0) > 0) ? true : false,
    isBackEndThresholdActive: false, // New feature
    backEndThreshold: 0, // New feature
    rules: initialData?.rules || [] as PayPlanRule[],
    tiers: getInitialTiers()
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumeric = (field: string, value: string) => {
    const isCurrency = ['miniAmount', 'flatPerUnitAmount'].includes(field);
    const val = isCurrency ? normalizeCurrencyNumber(value) : normalizeMatrixNumber(value);
    handleChange(field, val);
  };

  // Validation Logic
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    // Sort safely, keeping undefined thresholds at the end
    const sortedTiers = [...formData.tiers].sort((a, b) => {
      const valA = a.threshold ?? (a.id === formData.tiers[0].id ? 0 : Number.MAX_SAFE_INTEGER);
      const valB = b.threshold ?? (b.id === formData.tiers[0].id ? 0 : Number.MAX_SAFE_INTEGER);
      return valA - valB;
    });
    
    for (let i = 0; i < sortedTiers.length; i++) {
      const current = sortedTiers[i];
      const next = sortedTiers[i + 1];

      // 1. Min must be < Max 
      const currentMin = current.threshold ?? (i === 0 ? 0 : undefined);
      const currentMax = current.maxUnits;
      
      // If maxUnits is null or undefined, it's considered infinity (∞)
      if (currentMin !== undefined && currentMax != null && currentMin >= currentMax) {
        errors[current.id] = "Min units must be less than max units";
      }

      // 2. Overlap check
      if (next) {
        // Only show open-ended error if the current tier isn't completely blank (temporary editing state)
        const currentIsBlank = current.threshold == null && current.maxUnits == null && current.frontRate == null && current.backRate == null;
        const nextIsBlank = next.threshold == null && next.maxUnits == null && next.frontRate == null && next.backRate == null;

        if (currentMax == null && !currentIsBlank && !nextIsBlank) {
          errors[next.id] = "Previous row is open-ended. Provide a Max Unit limit to add more rows.";
        } else if (currentMax != null && next.threshold !== undefined && next.threshold <= currentMax) {
          errors[next.id] = `Range overlaps with previous tier (${currentMin}-${currentMax})`;
        }
      }
    }
    return errors;
  }, [formData.tiers]);

  // Rule Helpers
  const addRule = () => {
    const newRule: PayPlanRule = {
      id: crypto.randomUUID(),
      name: 'New Rule',
      condition: 'total_gross',
      operator: 'gte',
      threshold: 3000,
      rewardType: 'fixed_bonus',
      rewardValue: 50
    };
    handleChange('rules', [...formData.rules, newRule]);
  };

  const updateRule = (id: string, updates: Partial<PayPlanRule>) => {
    handleChange('rules', formData.rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeRule = (id: string) => {
    handleChange('rules', formData.rules.filter(r => r.id !== id));
  };

  // Tier Helpers
  const syncTiers = (tiers: PayPlanTier[]): PayPlanTier[] => {
    // Sort tiers by threshold (Min Units), keeping undefined at the end
    const sorted = [...tiers].sort((a, b) => {
      const valA = a.threshold ?? Number.MAX_SAFE_INTEGER;
      const valB = b.threshold ?? Number.MAX_SAFE_INTEGER;
      return valA - valB;
    });

    // CRITICAL: Regardless of what the threshold was, the first row in the sequence MUST be 0
    if (sorted.length > 0) {
      sorted[0] = { ...sorted[0], threshold: 0 };
    }

    return sorted.map((tier, i) => {
      const next = sorted[i + 1];
      // Auto-adjust: current.maxUnits = next.threshold - 0.5
      if (next) {
        if (next.threshold !== undefined) {
          // Only update maxUnits, preserve everything else
          return { ...tier, maxUnits: next.threshold - 0.5 };
        }
        // If next exists but threshold is cleared, this row becomes open-ended
        return { ...tier, maxUnits: undefined };
      }
      // Last row or single row - always open-ended (∞)
      return { ...tier, maxUnits: undefined };
    });
  };

  const addTier = () => {
    const newTier: PayPlanTier = {
      id: crypto.randomUUID(),
      threshold: undefined,
      maxUnits: undefined,
      frontRate: undefined,
      backRate: undefined,
      bonusAmount: 0,
      perUnitBonus: 0,
      isRetroactive: false,
      frontRetroactive: false,
      backRetroactive: false
    };
    handleChange('tiers', syncTiers([...formData.tiers, newTier]));
  };

  const updateTier = (id: string, updates: Partial<PayPlanTier>) => {
    const newTiers = formData.tiers.map(t => t.id === id ? { ...t, ...updates } : t);
    // If threshold changed, sync ranges
    if (updates.threshold !== undefined || updates.maxUnits !== undefined) {
      handleChange('tiers', syncTiers(newTiers));
    } else {
      handleChange('tiers', newTiers);
    }
  };

  const removeTier = (id: string) => {
    if (formData.tiers.length <= 1) return;
    const remaining = formData.tiers.filter(t => t.id !== id);
    handleChange('tiers', syncTiers(remaining));
  };

  /**
   * StripeItPayPlanPreviewSystem
   * Live calculation preview based on current form state.
   */
  const previewData = useMemo(() => {
    const mockDeals: Deal[] = Array(12).fill(null).map((_, i) => ({
      id: `mock-${i}`,
      frontEndGross: 2500,
      backEndGross: 1000,
      isSplitDeal: false,
      status: DealStatus.FINALIZED,
      date: new Date().toISOString(),
      customerName: 'Sample',
      purchasedVehicle: 'Vehicle',
      orgId: '',
      dealershipId: '',
      userId: '',
      createdByUserId: '',
      assignedSalespersonId: '',
      newOrUsed: 'used',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));

    return calculatePeriodEarnings(mockDeals, formData as PayPlan);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Pre-submission Validation
    const tiers = formData.tiers;
    if (tiers.length === 0) {
      triggerError('Commission matrix must have at least one row.');
      return;
    }

    for (let i = 0; i < tiers.length; i++) {
        const t = tiers[i];
        const rowNum = i + 1;
        
        // Baseline Row 1 is always 0
        const minUnits = i === 0 ? 0 : t.threshold;
        
        if (minUnits == null || isNaN(minUnits)) {
            triggerError(`Row ${rowNum} is missing its starting unit threshold.`);
            return;
        }

        if (t.frontRate == null || isNaN(t.frontRate)) {
            triggerError(`Row ${rowNum} is missing its Front Rate percentage.`);
            return;
        }

        if (t.backRate == null || isNaN(t.backRate)) {
            triggerError(`Row ${rowNum} is missing its Back Rate percentage.`);
            return;
        }

        // All but the last row must have a maxUnits
        if (i < tiers.length - 1) {
            if (t.maxUnits == null || isNaN(t.maxUnits)) {
                triggerError(`Row ${rowNum} must have a Max Unit limit before the next tier starts.`);
                return;
            }
        }
    }

    if (Object.keys(validationErrors).length > 0) {
        triggerError('Please fix the mathematical range overlaps in the Commission Matrix before saving.');
        return;
    }

    // 2. Normalization for Persistence
    const cleanTiers = tiers.map((t, i) => ({
      ...t,
      threshold: i === 0 ? 0 : (t.threshold ?? 0),
      maxUnits: t.maxUnits ?? null, // Firestore-safe open end
      frontRate: t.frontRate ?? 0,
      backRate: t.backRate ?? 0,
      // Row 1 never has retro behavior active
      frontRetroactive: i === 0 ? false : (t.frontRetroactive ?? false),
      backRetroactive: i === 0 ? false : (t.backRetroactive ?? false),
      bonusAmount: t.bonusAmount || 0,
      perUnitBonus: t.perUnitBonus || 0,
      isRetroactive: t.isRetroactive || false
    }));

    const cleanData = {
      ...formData,
      tiers: cleanTiers
    };

    onSubmit(cleanData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="space-y-10">
        {/* Header/Info */}
        <div className="flex items-start gap-5 rounded-3xl bg-brand-primary/[0.03] p-6 border border-brand-primary/10">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <Typography variant="label" className="text-brand-primary font-black uppercase tracking-widest text-xs mb-1 block">Precision Matrix</Typography>
            <Typography variant="small" className="text-slate-400 max-w-2xl leading-relaxed">
              Tiered commission infrastructure. Define unit-based performance ranges with custom front and back-end payouts. 
              Calculations are applied retroactively to your monthly deal volume.
            </Typography>
          </div>
        </div>

        {/* Matrix Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <TrendingUp className="h-6 w-6 text-cyan-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Tiered Matrix Rows</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Commission Hierarchy</Typography>
              </div>
            </div>
            <ActiveChip 
              active={formData.isAdvanced} 
              onClick={() => handleChange('isAdvanced', !formData.isAdvanced)} 
            />
          </div>

          {formData.isAdvanced && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              {formData.tiers.map((tier, index) => {
                const hasError = validationErrors[tier.id];
                const isOnlyRow = formData.tiers.length === 1;
                const isFirstRow = index === 0;
                
                return (
                  <Card 
                    key={tier.id} 
                    className={cn(
                      "bg-[#0A0C12] border-white/5 p-8 rounded-[2rem] shadow-2xl relative transition-all duration-300",
                      hasError ? "ring-1 ring-red-500/30 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]" : "hover:border-white/10"
                    )}
                  >
                    <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-end">
                      <div className="flex flex-col md:flex-row gap-8 flex-1 w-full xl:w-auto">
                        <MatrixInputGroup 
                          label="Min Units" 
                          value={isFirstRow ? 0 : (tier.threshold ?? '')} 
                          onChange={(val) => updateTier(tier.id, { threshold: val === '' ? undefined : normalizeMatrixNumber(val) })} 
                          color="neutral"
                          disabled={isFirstRow}
                        />
                        <MatrixInputGroup 
                          label="Max Units" 
                          value={tier.maxUnits ?? ''} 
                          onChange={(val) => updateTier(tier.id, { maxUnits: val === '' ? undefined : normalizeMatrixNumber(val) })} 
                          color="neutral"
                          placeholder="∞"
                          isInfinite={(isOnlyRow || index === formData.tiers.length - 1) && tier.maxUnits == null}
                        />
                      </div>

                      <div className="flex flex-col md:flex-row gap-8 flex-2 w-full xl:w-auto">
                        <MatrixInputGroup 
                          label="Front Rate (%)" 
                          value={tier.frontRate ?? ''} 
                          onChange={(val) => updateTier(tier.id, { frontRate: val === '' ? undefined : normalizeMatrixNumber(val) })} 
                          color="cyan"
                          suffix="%"
                          isRetroactive={tier.frontRetroactive}
                          onToggleRetroactive={isFirstRow ? undefined : () => updateTier(tier.id, { frontRetroactive: !tier.frontRetroactive })}
                        />

                        <MatrixInputGroup 
                          label="Back Rate (%)" 
                          value={tier.backRate ?? ''} 
                          onChange={(val) => updateTier(tier.id, { backRate: val === '' ? undefined : normalizeMatrixNumber(val) })} 
                          color="purple"
                          suffix="%"
                          isRetroactive={tier.backRetroactive}
                          onToggleRetroactive={isFirstRow ? undefined : () => updateTier(tier.id, { backRetroactive: !tier.backRetroactive })}
                        />
                      </div>

                      <div className="flex items-center gap-4 self-end h-12">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeTier(tier.id)} 
                          disabled={formData.tiers.length <= 1}
                          className="text-red-500/40 hover:text-red-400 disabled:opacity-0 transition-opacity"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {hasError && (
                      <div className="mt-6 pt-4 border-t border-red-500/10 flex items-center gap-2 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
                        <ShieldCheck className="h-3 w-3" />
                        <Typography variant="mono" className="text-[10px] uppercase tracking-wider font-bold">
                          {hasError}
                        </Typography>
                      </div>
                    )}
                  </Card>
                );
              })}

              <div className="flex justify-center pt-2">
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={addTier} 
                  className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 rounded-xl h-11 px-8 transition-all duration-300 shadow-[0_0_15px_rgba(34,211,238,0.05)] active:scale-95"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Row
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Volume Bonuses Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Volume Bonuses</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Tier Achievement Rewards</Typography>
              </div>
            </div>
            <ActiveChip 
              active={formData.isVolumeBonusActive} 
              onClick={() => handleChange('isVolumeBonusActive', !formData.isVolumeBonusActive)} 
            />
          </div>

          {formData.isVolumeBonusActive && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
                <div className="space-y-6">
                  {formData.tiers.map((tier, index) => (
                    <div key={tier.id + '-bonus'} className="flex flex-col md:flex-row gap-6 items-end border-b border-white/[0.03] pb-6 last:border-0 last:pb-0">
                      <div className="w-[120px]">
                        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 block">Tier {index + 1}</Typography>
                        <Typography variant="label" className="text-white font-black">{index === 0 ? 'Baseline' : `${tier.threshold}+ Units`}</Typography>
                      </div>
                      <div className="flex-1">
                        <CurrencyInput 
                          label="Lump Sum Bonus"
                          value={tier.bonusAmount}
                          onChange={(e) => updateTier(tier.id, { bonusAmount: normalizeCurrencyNumber(e.target.value) })}
                          labelClassName="text-[9px] uppercase tracking-widest text-slate-500"
                        />
                      </div>
                      <div className="flex-1">
                        <CurrencyInput 
                          label="Per Unit Bonus"
                          value={tier.perUnitBonus}
                          onChange={(e) => updateTier(tier.id, { perUnitBonus: normalizeCurrencyNumber(e.target.value) })}
                          labelClassName="text-[9px] uppercase tracking-widest text-slate-500"
                        />
                      </div>
                      <div className="flex items-center h-12">
                        <button
                          type="button"
                          onClick={() => updateTier(tier.id, { isRetroactive: !tier.isRetroactive })}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border",
                            tier.isRetroactive 
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                              : "bg-white/[0.02] text-slate-700 border-white/5"
                          )}
                        >
                          RETRO
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Back-End Eligibility Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Back-End Eligibility</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Protection Thresholds</Typography>
              </div>
            </div>
            <ActiveChip 
              active={formData.isBackEndThresholdActive} 
              onClick={() => handleChange('isBackEndThresholdActive', !formData.isBackEndThresholdActive)} 
            />
          </div>

          {formData.isBackEndThresholdActive && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
                <div className="max-w-md">
                  <CurrencyInput 
                    label="Minimum Front-End Gross for Back-End Eligibility"
                    value={formData.backEndThreshold}
                    onChange={(e) => handleChange('backEndThreshold', normalizeCurrencyNumber(e.target.value))}
                    description="If front-end gross is below this amount, back-end commission is not paid."
                    labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
                  />
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Global Thresholds Section */}
        <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <Typography variant="label" className="text-white font-black uppercase tracking-widest text-[10px]">Guardrails & Guarantees</Typography>
              <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[8px]">Minimum Thresholds</Typography>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CurrencyInput 
              label="Minimum Payout" 
              value={formData.miniAmount}
              onChange={(e) => handleNumeric('miniAmount', e.target.value)}
              description="Standard mini per deal"
              labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
            />
            <CurrencyInput 
              label="Flat Per Unit" 
              value={formData.flatPerUnitAmount}
              onChange={(e) => handleNumeric('flatPerUnitAmount', e.target.value)}
              description="Fixed amount per car sold"
              labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
            />
            <Select 
              label="Split Behavior"
              options={[
                { value: 'standard', label: 'Standard Proportion' },
                { value: 'half_mini', label: 'Half the Mini' },
              ]}
              value={formData.splitDealBehavior}
              onChange={(e) => handleChange('splitDealBehavior', e.target.value)}
              labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
            />
          </div>
        </Card>

        {/* Rules Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Zap className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Rules & Overrides</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Custom Bonus Logic</Typography>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {formData.isRulesEnabled && (
                <Button type="button" size="sm" variant="outline" onClick={addRule} className="border-amber-500/20 text-amber-500 hover:bg-amber-500/10 h-10 px-6 rounded-xl animate-in fade-in zoom-in duration-300">
                  <Plus className="mr-2 h-4 w-4" /> Add Rule
                </Button>
              )}
              <ActiveChip 
                active={formData.isRulesEnabled} 
                onClick={() => handleChange('isRulesEnabled', !formData.isRulesEnabled)} 
              />
            </div>
          </div>
          
          {formData.isRulesEnabled && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              {formData.rules.map((rule) => (
              <Card key={rule.id} className="bg-white/[0.01] border-white/5 p-6 flex flex-wrap items-center gap-6 rounded-[1.5rem]">
                <div className="flex-1 min-w-[200px]">
                  <Input 
                    placeholder="Rule Name" 
                    value={rule.name}
                    onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                    className="h-12 bg-black/40 border-white/5"
                  />
                </div>
                <div className="w-[180px]">
                  <Select 
                    options={[
                      { value: 'front_end_gross', label: 'Front End Gross' },
                      { value: 'back_end_gross', label: 'Back End Gross' },
                      { value: 'total_gross', label: 'Total Gross' },
                    ]}
                    value={rule.condition}
                    onChange={(e) => updateRule(rule.id, { condition: e.target.value as any })}
                    className="h-12 bg-black/40 border-white/5"
                  />
                </div>
                <div className="w-[80px]">
                  <Select 
                    options={[
                      { value: 'gt', label: '>' },
                      { value: 'gte', label: '>=' },
                    ]}
                    value={rule.operator}
                    onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                    className="h-12 bg-black/40 border-white/5"
                  />
                </div>
                <div className="w-[120px]">
                  <CurrencyInput 
                    value={rule.threshold}
                    onChange={(e) => updateRule(rule.id, { threshold: parseFloat(e.target.value) || 0 })}
                    className="h-12 bg-black/40 border-white/5"
                  />
                </div>
                <div className="w-[150px]">
                  <Select 
                    options={[
                      { value: 'fixed_bonus', label: 'Flat Bonus' },
                      { value: 'percentage_increase', label: 'Gross % Bump' },
                    ]}
                    value={rule.rewardType}
                    onChange={(e) => updateRule(rule.id, { rewardType: e.target.value as any })}
                    className="h-12 bg-black/40 border-white/5"
                  />
                </div>
                <div className="w-[120px]">
                  <Input 
                    type="number"
                    step="0.01"
                    value={rule.rewardValue}
                    onChange={(e) => updateRule(rule.id, { rewardValue: parseFloat(e.target.value) || 0 })}
                    onBlur={(e) => {
                      const val = rule.rewardType === 'fixed_bonus' 
                        ? normalizeCurrencyNumber(e.target.value)
                        : normalizeMatrixNumber(e.target.value);
                      updateRule(rule.id, { rewardValue: val });
                    }}
                    className="h-12 bg-black/40 border-white/5"
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(rule.id)} className="text-red-500 opacity-40 hover:opacity-100">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </Card>
            ))}
            {formData.rules.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-[2rem]">
                <Typography className="text-slate-500">No active commission rules. Add one to reward high gross deals.</Typography>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Live Preview Section */}
        <Card className="bg-brand-primary/[0.03] border-brand-primary/10 p-10 rounded-[2.5rem]">
          <Typography variant="label" className="text-brand-primary uppercase font-black tracking-[0.25em] text-[10px] mb-8 block">Simulation Preview (12 Unit Standard Month)</Typography>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div>
              <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px] mb-2 block">Deal Earnings</Typography>
              <Typography variant="h2" className="text-3xl font-black">${Math.round(previewData.totalPayout).toLocaleString()}</Typography>
            </div>
            <div>
              <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px] mb-2 block">Tier Overrides</Typography>
              <Typography variant="h2" className="text-3xl font-black text-brand-primary">+${Math.round(previewData.totalTierBonuses).toLocaleString()}</Typography>
            </div>
            <div className="col-span-2 border-l border-white/5 pl-12 flex flex-col justify-center">
              <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px] mb-2 block">Total Projected Payout</Typography>
              <div className="flex items-baseline gap-4">
                <Typography variant="h1" className="text-5xl font-black text-white">${Math.round(previewData.grandTotal).toLocaleString()}</Typography>
                <div className="flex flex-col">
                  <Typography variant="small" className="text-emerald-500 font-bold tracking-tight">${Math.round(previewData.grandTotal / 12).toLocaleString()} / Avg</Typography>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="pt-10">
        <Button 
          type="submit" 
          className="w-full h-20 text-xl bg-brand-primary text-bg-deep font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(34,211,238,0.2)] hover:shadow-[0_20px_70px_rgba(34,211,238,0.3)] transition-all rounded-3xl group" 
          isLoading={isLoading} 
          disabled={isLoading}
        >
          <ShieldCheck className="mr-3 h-8 w-8 group-hover:scale-110 transition-transform" />
          Deploy Matrix Configuration
        </Button>
      </div>
    </form>
  );
};
