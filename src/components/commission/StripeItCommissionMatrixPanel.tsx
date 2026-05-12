import React, { useState, useMemo } from 'react';
import { 
  PayPlan, 
  PayPlanRule, 
  PayPlanTier, 
  Deal, 
  DealStatus,
  VolumeBonus,
  VolumeBonusType,
  VolumeBonusScope,
  VolumeBonusFilter,
  HourlyPayoutModel,
  HourlyConfig,
  MiniConfig,
  CustomMini,
  MiniThreshold,
  MiniAppliesTo
} from '@/src/types';
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
  ChevronDown,
  ChevronUp,
  Settings2,
  Filter,
  Layers,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

interface MatrixItemChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'cyan' | 'green' | 'purple' | 'amber' | 'slate';
}

const MatrixItemChip: React.FC<MatrixItemChipProps> = ({ label, active, onClick, color = 'cyan' }) => {
  const styles = {
    cyan: active ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-white/[0.02] text-slate-700 border-white/5",
    green: active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-white/[0.02] text-slate-700 border-white/5",
    purple: active ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "bg-white/[0.02] text-slate-700 border-white/5",
    amber: active ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-white/[0.02] text-slate-700 border-white/5",
    slate: active ? "bg-slate-500/20 text-slate-300 border-slate-500/30 shadow-[0_0_15px_rgba(100,116,139,0.15)]" : "bg-white/[0.02] text-slate-700 border-white/5",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-300 border",
        styles[color]
      )}
    >
      {label}
    </button>
  );
};

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

interface VolumeBonusRowProps {
  bonus: VolumeBonus;
  onUpdate: (updates: Partial<VolumeBonus>) => void;
  onRemove: () => void;
}

const VolumeBonusRow: React.FC<VolumeBonusRowProps> = ({ bonus, onUpdate, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeColor = (type: VolumeBonusType) => {
    switch (type) {
      case VolumeBonusType.FLAT: return 'cyan';
      case VolumeBonusType.CUMULATIVE: return 'green';
      case VolumeBonusType.NON_CUMULATIVE: return 'amber';
      case VolumeBonusType.RETRO_PER_UNIT: return 'purple';
      default: return 'slate';
    }
  };

  const getFilterLabel = (filter: VolumeBonusFilter) => {
    if (filter === VolumeBonusFilter.ANY) return 'Any Deal';
    return filter.toUpperCase();
  };

  return (
    <div className={cn(
      "group overflow-hidden rounded-[2rem] border transition-all duration-300",
      bonus.active 
        ? (isExpanded ? "bg-[#0A0C12] border-white/10 shadow-2xl" : "bg-white/[0.01] border-white/5 hover:border-white/10")
        : "bg-black/20 border-white/[0.02] opacity-60"
    )}>
      {/* Collapsed Content / Header */}
      <div 
        className="flex items-center gap-6 p-6 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 min-w-[120px]">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center border",
            bonus.active ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/[0.02]"
          )}>
            <Typography variant="h3" className="text-white text-lg">{bonus.threshold}</Typography>
          </div>
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black">UNITS</Typography>
        </div>

        <div className="flex-1 flex items-center gap-4">
          <Typography variant="h3" className="text-white text-xl">
            ${bonus.amount.toLocaleString()}
            {bonus.type === VolumeBonusType.RETRO_PER_UNIT && <span className="text-xs text-slate-500 ml-1">/ UNIT</span>}
          </Typography>
          
          <div className="flex items-center gap-2">
            <MatrixItemChip 
              label={bonus.type.replace(/_/g, ' ')} 
              active={true} 
              onClick={() => {}} 
              color={getTypeColor(bonus.type)}
            />
            {bonus.filter !== VolumeBonusFilter.ANY && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5">
                <Filter size={8} className="text-slate-500" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">{getFilterLabel(bonus.filter)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ActiveChip 
            active={bonus.active} 
            onClick={() => onUpdate({ active: !bonus.active })} 
          />
          <div className="text-slate-500 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'circOut' }}
          >
            <div className="p-8 pt-2 border-t border-white/5 bg-white/[0.01]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
                <div className="space-y-3">
                  <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">Threshold Configuration</Typography>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={bonus.threshold}
                        onChange={(e) => onUpdate({ threshold: parseInt(e.target.value) || 0 })}
                        className="bg-black/40 border-white/5 h-11"
                        placeholder="Threshold"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">Bonus Payout</Typography>
                  <div className="flex-1">
                    <CurrencyInput
                      value={bonus.amount}
                      onChange={(e) => onUpdate({ amount: normalizeCurrencyNumber(e.target.value) })}
                      className="bg-black/40 border-white/5 h-11"
                      hideLabel
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">Bonus Model</Typography>
                  <Select
                    options={[
                      { value: VolumeBonusType.FLAT, label: 'Flat Bonus' },
                      { value: VolumeBonusType.CUMULATIVE, label: 'Cumulative Bonus' },
                      { value: VolumeBonusType.NON_CUMULATIVE, label: 'Non-Cumulative' },
                      { value: VolumeBonusType.RETRO_PER_UNIT, label: 'Retro Per-Unit' },
                    ]}
                    value={bonus.type}
                    onChange={(e) => onUpdate({ type: e.target.value as VolumeBonusType })}
                    className="bg-black/40 border-white/5 h-11"
                  />
                </div>

                <div className="space-y-3">
                  <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">Deal-Type Filter</Typography>
                  <Select
                    options={[
                      { value: VolumeBonusFilter.ANY, label: 'Any Deal' },
                      { value: VolumeBonusFilter.NEW, label: 'New Only' },
                      { value: VolumeBonusFilter.USED, label: 'Used Only' },
                      { value: VolumeBonusFilter.CPO, label: 'CPO Only' },
                    ]}
                    value={bonus.filter}
                    onChange={(e) => onUpdate({ filter: e.target.value as VolumeBonusFilter })}
                    className="bg-black/40 border-white/5 h-11"
                  />
                </div>
              </div>

              <div className="flex flex-col xl:flex-row gap-8 items-start xl:items-end justify-between">
                <div className="flex-1 space-y-3 w-full">
                  <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest px-1">Advanced Settings & Notes</Typography>
                  <div className="flex flex-col md:flex-row gap-4">
                    {bonus.type === VolumeBonusType.RETRO_PER_UNIT && (
                      <div className="min-w-[200px]">
                         <Select
                          options={[
                            { value: VolumeBonusScope.ALL_UNITS, label: 'Retroactive: All Units' },
                            { value: VolumeBonusScope.THRESHOLD_PLUS, label: 'Threshold+ Units Only' },
                          ]}
                          value={bonus.scope}
                          onChange={(e) => onUpdate({ scope: e.target.value as VolumeBonusScope })}
                          className="bg-brand-primary/[0.03] border-brand-primary/20 h-11 text-brand-primary font-bold"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        placeholder="Internal notes (e.g. standard owner bonus)"
                        value={bonus.notes || ''}
                        onChange={(e) => onUpdate({ notes: e.target.value })}
                        className="bg-black/40 border-white/5 h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 h-11 mt-4 xl:mt-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="text-red-500/40 hover:text-red-400 font-black uppercase tracking-[0.2em] text-[10px]"
                  >
                    <Trash2 size={14} className="mr-2" /> Remove Payout
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
    isVolumeBonusEngineActive: initialData?.isVolumeBonusEngineActive || false,
    isBackEndThresholdActive: initialData?.isBackEndThresholdActive || false,
    backEndThreshold: initialData?.backEndThreshold || 0,
    rules: initialData?.rules || [] as PayPlanRule[],
    tiers: getInitialTiers(),
    volumeBonuses: initialData?.volumeBonuses || [] as VolumeBonus[],
    
    // Minis and Hourly Section
    isMinisAndHourlyActive: initialData?.isMinisAndHourlyActive ?? false,
    isMinisActive: initialData?.isMinisActive ?? false,
    isHourlyActive: initialData?.isHourlyActive ?? false,
    miniConfig: initialData?.miniConfig || {
      active: true,
      isLinked: false, // Default to independent for the new Mini Ladder mental model
      baseNewMini: initialData?.miniAmount || 200,
      baseUsedMini: initialData?.miniAmount || 200,
      baseCpoMini: initialData?.baseCpoMini || 250,
      independentThresholds: []
    } as MiniConfig,
    customMinis: initialData?.customMinis || [] as CustomMini[],
    hourlyConfig: initialData?.hourlyConfig || {
      active: true,
      rate: 15,
      hoursWorked: 160,
      model: HourlyPayoutModel.GUARANTEE
    } as HourlyConfig
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

  // Volume Bonus Engine Helpers
  const addVolumeBonus = () => {
    const newBonus: VolumeBonus = {
      id: crypto.randomUUID(),
      threshold: 10,
      amount: 500,
      type: VolumeBonusType.FLAT,
      scope: VolumeBonusScope.ALL_UNITS,
      filter: VolumeBonusFilter.ANY,
      active: true,
    };
    handleChange('volumeBonuses', [...(formData.volumeBonuses || []), newBonus]);
    handleChange('isVolumeBonusEngineActive', true);
  };

  const updateVolumeBonus = (id: string, updates: Partial<VolumeBonus>) => {
    handleChange('volumeBonuses', (formData.volumeBonuses || []).map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeVolumeBonus = (id: string) => {
    handleChange('volumeBonuses', (formData.volumeBonuses || []).filter(b => b.id !== id));
  };

  // Minis and Hourly Helpers
  const addIndependentMiniThreshold = () => {
    const newThreshold: MiniThreshold = {
      id: crypto.randomUUID(),
      threshold: 12,
      amount: 250,
      appliesTo: MiniAppliesTo.NEW,
      isRetro: true,
      active: true
    };
    handleChange('miniConfig', {
      ...formData.miniConfig,
      independentThresholds: [...formData.miniConfig.independentThresholds, newThreshold]
    });
  };

  const updateIndependentMiniThreshold = (id: string, updates: Partial<MiniThreshold>) => {
    handleChange('miniConfig', {
      ...formData.miniConfig,
      independentThresholds: formData.miniConfig.independentThresholds.map(t => t.id === id ? { ...t, ...updates } : t)
    });
  };

  const removeIndependentMiniThreshold = (id: string) => {
    handleChange('miniConfig', {
      ...formData.miniConfig,
      independentThresholds: formData.miniConfig.independentThresholds.filter(t => t.id !== id)
    });
  };

  const addCustomMini = () => {
    const newCustom: CustomMini = {
      id: crypto.randomUUID(),
      label: 'New Custom Mini',
      amount: 100,
      active: true,
      filter: VolumeBonusFilter.ANY
    };
    handleChange('customMinis', [...formData.customMinis, newCustom]);
  };

  const updateCustomMini = (id: string, updates: Partial<CustomMini>) => {
    handleChange('customMinis', formData.customMinis.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeCustomMini = (id: string) => {
    handleChange('customMinis', formData.customMinis.filter(m => m.id !== id));
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
      tiers: cleanTiers,
      volumeBonuses: formData.volumeBonuses || [],
      isVolumeBonusEngineActive: formData.isVolumeBonusEngineActive || false,
      isMinisAndHourlyActive: formData.isMinisAndHourlyActive,
      isMinisActive: formData.isMinisActive,
      isHourlyActive: formData.isHourlyActive,
      miniConfig: formData.miniConfig,
      customMinis: formData.customMinis,
      hourlyConfig: formData.hourlyConfig,
      miniAmount: formData.miniConfig.baseNewMini // Sync for backward compatibility
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

        {/* StripeItMinisAndHourlySystem - Minis and Hourly Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Minis and Hourly</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Base Compensation & Protections</Typography>
              </div>
            </div>
            <ActiveChip 
              active={formData.isMinisAndHourlyActive} 
              onClick={() => handleChange('isMinisAndHourlyActive', !formData.isMinisAndHourlyActive)} 
            />
          </div>

          {formData.isMinisAndHourlyActive && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* Mini Ladder Subsection */}
              <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <Typography variant="mono" className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Mini Ladder</Typography>
                    {!formData.miniConfig.isLinked && (
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    )}
                  </div>
                  <ActiveChip 
                    active={formData.isMinisActive} 
                    onClick={() => handleChange('isMinisActive', !formData.isMinisActive)} 
                  />
                </div>

                {formData.isMinisActive && (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    
                    {/* 1. Base Minis */}
                    <div className="space-y-4">
                      <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest pl-1">1. Base Minis (Default Payouts)</Typography>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                          <Typography variant="mono" className="text-[10px] text-slate-400 font-black uppercase">New Mini</Typography>
                          <CurrencyInput 
                            value={formData.miniConfig.baseNewMini}
                            onChange={(e) => handleChange('miniConfig', { ...formData.miniConfig, baseNewMini: normalizeCurrencyNumber(e.target.value) })}
                            hideLabel
                            className="bg-black/20 border-white/5"
                          />
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                          <Typography variant="mono" className="text-[10px] text-slate-400 font-black uppercase">Used Mini</Typography>
                          <CurrencyInput 
                            value={formData.miniConfig.baseUsedMini}
                            onChange={(e) => handleChange('miniConfig', { ...formData.miniConfig, baseUsedMini: normalizeCurrencyNumber(e.target.value) })}
                            hideLabel
                            className="bg-black/20 border-white/5"
                          />
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                          <Typography variant="mono" className="text-[10px] text-slate-400 font-black uppercase">CPO Mini</Typography>
                          <CurrencyInput 
                            value={formData.miniConfig.baseCpoMini || 0}
                            onChange={(e) => handleChange('miniConfig', { ...formData.miniConfig, baseCpoMini: normalizeCurrencyNumber(e.target.value) })}
                            hideLabel
                            className="bg-black/20 border-white/5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Mini Increase Rules */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pl-1">
                        <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest">2. Mini Increase Rules</Typography>
                        <Button type="button" variant="ghost" size="sm" onClick={addIndependentMiniThreshold} className="text-brand-primary h-7 text-[9px] uppercase tracking-widest font-black">
                          <Plus size={14} className="mr-2" /> Add Mini Increase
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {formData.miniConfig.independentThresholds.length === 0 ? (
                          <div className="h-24 rounded-2xl border border-dashed border-white/5 flex items-center justify-center text-slate-600 text-[10px] uppercase font-black">
                            No increase rules active. Standard base minis will apply.
                          </div>
                        ) : (
                          formData.miniConfig.independentThresholds.map((t) => (
                            <div key={t.id} className={cn(
                              "flex flex-col md:flex-row gap-6 items-center p-4 rounded-2xl border transition-all duration-300",
                              t.active ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-60"
                            )}>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 items-center w-full">
                                <div className="space-y-1.5">
                                  <Typography variant="mono" className="text-[8px] text-slate-500 font-black uppercase ml-1">Threshold</Typography>
                                  <div className="relative">
                                    <Input 
                                      type="number" 
                                      value={t.threshold} 
                                      onChange={(e) => updateIndependentMiniThreshold(t.id, { threshold: parseFloat(e.target.value) || 0 })}
                                      className="h-10 bg-black/40 border-white/5 font-bold pr-10"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-black uppercase">Units</div>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <Typography variant="mono" className="text-[8px] text-slate-500 font-black uppercase ml-1">Applies To</Typography>
                                  <Select 
                                    options={[
                                      { value: MiniAppliesTo.ALL, label: 'All Deals' },
                                      { value: MiniAppliesTo.NEW, label: 'New Only' },
                                      { value: MiniAppliesTo.USED, label: 'Used Only' },
                                      { value: MiniAppliesTo.CPO, label: 'CPO Only' },
                                    ]}
                                    value={t.appliesTo}
                                    onChange={(e) => updateIndependentMiniThreshold(t.id, { appliesTo: e.target.value as any })}
                                    className="h-10 bg-black/40 border-white/5 text-xs font-bold"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Typography variant="mono" className="text-[8px] text-slate-500 font-black uppercase ml-1">Mini Amount</Typography>
                                  <CurrencyInput 
                                    value={t.amount}
                                    onChange={(e) => updateIndependentMiniThreshold(t.id, { amount: normalizeCurrencyNumber(e.target.value) })}
                                    hideLabel
                                    className="h-10 bg-black/40 border-white/5"
                                  />
                                </div>

                                <div className="flex items-center gap-6 justify-end h-10 mt-auto md:mt-4">
                                  <div className="flex items-center gap-4">
                                    <Typography variant="mono" className="text-[8px] text-slate-500 font-black uppercase">Retro</Typography>
                                    <button
                                      type="button"
                                      onClick={() => updateIndependentMiniThreshold(t.id, { isRetro: !t.isRetro })}
                                      className={cn(
                                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border",
                                        t.isRetro 
                                          ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                                          : "bg-white/[0.02] text-slate-700 border-white/5"
                                      )}
                                    >
                                      RETRO
                                    </button>
                                  </div>
                                  <div className="h-6 w-px bg-white/5" />
                                  <ActiveChip active={t.active} onClick={() => updateIndependentMiniThreshold(t.id, { active: !t.active })} />
                                  <button type="button" onClick={() => removeIndependentMiniThreshold(t.id)} className="text-red-500/40 hover:text-red-400 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Custom Mini Types */}
                    {formData.customMinis.length > 0 && (
                      <div className="space-y-4 pt-6 border-t border-white/[0.03]">
                        <div className="flex items-center justify-between pl-1">
                          <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Custom Mini Types</Typography>
                          <Button type="button" variant="ghost" size="sm" onClick={addCustomMini} className="text-brand-primary h-7 text-[9px] uppercase tracking-widest font-black">
                            <Plus size={14} className="mr-2" /> Add Custom
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.customMinis.map((m) => (
                            <div key={m.id} className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 space-y-4">
                              <div className="flex items-center justify-between">
                                <Input 
                                  value={m.label} 
                                  onChange={(e) => updateCustomMini(m.id, { label: e.target.value })}
                                  className="h-9 bg-transparent border-none text-white font-bold p-0 focus-visible:ring-0"
                                  placeholder="Mini Name"
                                />
                                <div className="flex items-center gap-2">
                                  <ActiveChip active={m.active} onClick={() => updateCustomMini(m.id, { active: !m.active })} />
                                  <button type="button" onClick={() => removeCustomMini(m.id)} className="text-red-500/40 hover:text-red-400">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              <div className="flex gap-4">
                                <div className="flex-1">
                                  <CurrencyInput 
                                    value={m.amount}
                                    onChange={(e) => updateCustomMini(m.id, { amount: normalizeCurrencyNumber(e.target.value) })}
                                    hideLabel
                                    className="h-10 bg-black/40 border-white/5"
                                  />
                                </div>
                                <div className="w-[120px]">
                                  <Select 
                                    options={[
                                      { value: VolumeBonusFilter.ANY, label: 'Any' },
                                      { value: VolumeBonusFilter.NEW, label: 'New' },
                                      { value: VolumeBonusFilter.USED, label: 'Used' },
                                      { value: VolumeBonusFilter.CPO, label: 'CPO' },
                                    ]}
                                    value={m.filter}
                                    onChange={(e) => updateCustomMini(m.id, { filter: e.target.value as any })}
                                    className="h-10 bg-black/40 border-white/5"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {formData.customMinis.length === 0 && (
                      <div className="flex justify-start">
                         <Button type="button" variant="ghost" size="sm" onClick={addCustomMini} className="text-slate-500 hover:text-slate-300 h-7 text-[8px] uppercase tracking-widest font-black">
                          <Plus size={12} className="mr-2" /> Add Custom Mini Type
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Hourly Subsection */}
              <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
                <div className="flex items-center justify-between mb-8">
                  <Typography variant="mono" className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Hourly Compensation</Typography>
                  <ActiveChip 
                    active={formData.isHourlyActive} 
                    onClick={() => handleChange('isHourlyActive', !formData.isHourlyActive)} 
                  />
                </div>

                {formData.isHourlyActive && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <CurrencyInput 
                        label="Hourly Rate" 
                        value={formData.hourlyConfig.rate}
                        onChange={(e) => handleChange('hourlyConfig', { ...formData.hourlyConfig, rate: normalizeCurrencyNumber(e.target.value) })}
                        labelClassName="text-[9px] uppercase tracking-widest text-slate-500"
                      />
                      <div className="space-y-2.5">
                        <Typography variant="mono" className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Hours Worked</Typography>
                        <Input 
                          type="number" 
                          value={formData.hourlyConfig.hoursWorked} 
                          onChange={(e) => handleChange('hourlyConfig', { ...formData.hourlyConfig, hoursWorked: parseInt(e.target.value) || 0 })}
                          className="h-12 bg-black/40 border-white/5 font-bold"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Typography variant="mono" className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Monthly Total</Typography>
                        <div className="h-12 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center px-5 font-black text-white">
                          ${(formData.hourlyConfig.rate * formData.hourlyConfig.hoursWorked).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Payout Model</Typography>
                      <div className="flex flex-wrap gap-4">
                        {[
                          { id: HourlyPayoutModel.GUARANTEE, label: 'FLOOR (Higher of Both)', desc: 'Pay whichever is highest: Hourly vs Commission.' },
                          { id: HourlyPayoutModel.ADDITIVE, label: 'ADDITIVE (Pay Both)', desc: 'Pay commission ladder PLUS hourly total.' },
                          { id: HourlyPayoutModel.DRAW, label: 'RECOVERABLE DRAW', desc: 'Hourly total advances against future commission.' },
                        ].map((model) => (
                          <div 
                            key={model.id}
                            onClick={() => handleChange('hourlyConfig', { ...formData.hourlyConfig, model: model.id })}
                            className={cn(
                              "flex-1 min-w-[240px] p-5 rounded-2xl border transition-all duration-300 cursor-pointer group",
                              formData.hourlyConfig.model === model.id 
                                ? "bg-brand-primary/10 border-brand-primary/30 ring-1 ring-brand-primary/20"
                                : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                            )}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                formData.hourlyConfig.model === model.id ? "border-brand-primary bg-brand-primary" : "border-slate-700"
                              )}>
                                {formData.hourlyConfig.model === model.id && <div className="w-1.5 h-1.5 rounded-full bg-bg-deep" />}
                              </div>
                              <Typography variant="mono" className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                formData.hourlyConfig.model === model.id ? "text-brand-primary" : "text-slate-500 group-hover:text-slate-300"
                              )}>
                                {model.label}
                              </Typography>
                            </div>
                            <Typography variant="small" className="text-slate-500 text-[11px] leading-relaxed pl-7">
                              {model.desc}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Matrix Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <TrendingUp className="h-6 w-6 text-cyan-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Commission Ladder</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Unit-Based Payout Progression</Typography>
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

        {/* Back-End Eligibility Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <ShieldCheck className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Back-End Eligibility Threshold</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Gross Profit Guardrails</Typography>
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

        {/* StripeItVolumeBonusSystem - Volume Bonuses Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Volume Bonus Engine</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Programmable Compensation</Typography>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {formData.isVolumeBonusEngineActive && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline" 
                  onClick={addVolumeBonus} 
                  className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 h-10 px-6 rounded-xl animate-in fade-in zoom-in duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Payout Row
                </Button>
              )}
              <ActiveChip 
                active={formData.isVolumeBonusEngineActive} 
                onClick={() => handleChange('isVolumeBonusEngineActive', !formData.isVolumeBonusEngineActive)} 
              />
            </div>
          </div>

          {formData.isVolumeBonusEngineActive && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              {(formData.volumeBonuses || []).length > 0 ? (
                <div className="space-y-4">
                  {(formData.volumeBonuses || [])
                    .sort((a, b) => a.threshold - b.threshold)
                    .map((bonus) => (
                      <VolumeBonusRow 
                        key={bonus.id}
                        bonus={bonus}
                        onUpdate={(updates) => updateVolumeBonus(bonus.id, updates)}
                        onRemove={() => removeVolumeBonus(bonus.id)}
                      />
                    ))
                  }
                </div>
              ) : (
                <Card 
                  className="bg-[#0A0C12]/50 border-white/5 p-12 rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors group"
                  onClick={addVolumeBonus}
                >
                  <Settings2 className="h-12 w-12 text-slate-700 mb-4 group-hover:text-brand-primary transition-colors" />
                  <Typography className="text-slate-500 font-bold mb-2">No volume bonus records initialized.</Typography>
                  <Typography variant="small" className="text-slate-600 text-center max-w-sm">
                    Configure flat bonuses, cumulative stackers, or retroactive per-unit payouts to incentivize high-volume months.
                  </Typography>
                  <Button type="button" variant="link" className="text-brand-primary mt-6 font-black uppercase tracking-widest text-[10px]">
                    Initialize Engine Now
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Global Thresholds Section */}
        <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
          <div className="flex items-center gap-4 mb-4">
             <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[8px] font-black">Miscellaneous Defaults</Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
