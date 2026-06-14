import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  MiniLadderTier,
  CustomMini,
  CustomUnitBonus,
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
  History,
  Info,
  FileDown,
  FileUp,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculatePeriodEarnings, getActiveCommissionTier, getActiveMiniTier } from '@/src/lib/commissionLogic';
import { cn } from '@/src/lib/utils';
import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { commissionCsvService } from '@/src/lib/commissionCsvService';
import { Modal } from '../ui/Modal';
import { SubscriptionTier } from '@/src/types';
import { 
  formatMatrixValue, 
  normalizeMatrixNumber,
  normalizeCurrencyNumber
} from '@/src/lib/numberUtils';

/**
 * StripeItPayPlanFormSystem & StripeItAdvancedPayPlanSystem
 * Guided setup flow with optional advanced rules and volume tiers.
 */

interface MatrixSectionProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  summary?: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
  iconColor?: string;
}

const MatrixSection: React.FC<MatrixSectionProps> = ({
  title,
  subtitle,
  icon,
  isActive,
  onActiveChange,
  summary,
  children,
  isExpanded,
  onToggle,
  className,
  iconColor = "brand-primary"
}) => {
  return (
    <div className={cn("space-y-6", className)}>
      <div 
        className="flex items-center justify-between px-2 cursor-pointer group/header"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center border transition-all duration-300",
            isActive 
              ? `bg-${iconColor}/10 border-${iconColor}/20 text-${iconColor}` 
              : "bg-slate-500/10 border-slate-500/20 text-slate-500"
          )}>
            {icon}
          </div>
          <div className="flex flex-col">
            <Typography variant="h3" className="text-[var(--color-text-primary)] text-xl group-hover/header:text-brand-primary transition-colors">{title}</Typography>
            <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">{subtitle}</Typography>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {!isExpanded && summary && (
            <div className="hidden md:flex items-center gap-4 animate-in fade-in duration-500">
              {summary}
            </div>
          )}
          <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
            {onActiveChange && (
              <ActiveChip 
                active={isActive ?? false} 
                onClick={() => onActiveChange(!isActive)} 
              />
            )}
            <button 
              type="button"
              onClick={onToggle}
              className={cn(
                "p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-slate-500 hover:text-[var(--color-text-primary)] transition-all shrink-0",
                isExpanded && "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
              )}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MatrixItemChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: 'cyan' | 'green' | 'purple' | 'amber' | 'slate';
}

const MatrixItemChip: React.FC<MatrixItemChipProps> = ({ label, active, onClick, color = 'cyan' }) => {
  const styles = {
    cyan: active ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)]",
    green: active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)]",
    purple: active ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)]",
    amber: active ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)]",
    slate: active ? "bg-slate-500/20 text-slate-300 border-slate-500/30 shadow-[0_0_15px_rgba(100,116,139,0.15)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)]",
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
  label?: string;
  value: string | number | undefined;
  onChange: (val: string) => void;
  color?: 'neutral' | 'cyan' | 'purple' | 'amber';
  suffix?: string;
  placeholder?: string;
  ghostValue?: string;
  isRetroactive?: boolean;
  onToggleRetroactive?: () => void;
  isInfinite?: boolean;
  disabled?: boolean;
  isError?: boolean;
  className?: string;
  size?: 'sm' | 'md';
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
        : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)] hover:border-[var(--color-border)] hover:text-slate-600"
    )}
  >
    ACTIVE
  </button>
);

interface VolumeBonusRowProps {
  bonus: VolumeBonus;
  onUpdate: (updates: Partial<VolumeBonus>) => void;
  onRemove: () => void;
  previousThreshold?: number;
}

const VolumeBonusRow: React.FC<VolumeBonusRowProps> = ({ bonus, onUpdate, onRemove, previousThreshold }) => {
  const isRetro = bonus.type === VolumeBonusType.RETRO_PER_UNIT;
  const { triggerError } = useAppData();
  
  const isInvalidOrdering = previousThreshold !== undefined && bonus.threshold <= previousThreshold;

  const handleBlur = () => {
    if (isInvalidOrdering) {
      triggerError("Unit threshold must be greater than the row above.");
    }
  };

  return (
    <div className={cn(
      "group bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 md:p-5 rounded-2xl transition-all duration-300 relative",
      !bonus.active ? "opacity-40 grayscale-[0.5]" : "hover:border-[var(--color-border)]",
      isInvalidOrdering && "ring-1 ring-red-500/30 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]"
    )}>
      <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center">
        {/* Threshold */}
        <div className="flex items-center gap-3 min-w-[150px]">
          <div className="w-[85px]">
            <MatrixInputGroup 
              value={bonus.threshold} 
              onChange={(val) => onUpdate({ threshold: parseInt(val) || 0 })} 
              onBlur={handleBlur}
              isError={isInvalidOrdering}
              size="sm"
              placeholder="0"
            />
          </div>
          <Typography variant="mono" className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            isInvalidOrdering ? "text-red-400" : "text-slate-500"
          )}>Units</Typography>
        </div>

        {/* Payout/Amount */}
        <div className="flex-1 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
             <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Payout</Typography>
             <div className="w-[120px]">
               <CurrencyInput
                 value={bonus.amount}
                 onChange={(e) => onUpdate({ amount: normalizeCurrencyNumber(e.target.value) })}
                 hideLabel
                 className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] font-black text-[var(--color-text-primary)]"
               />
             </div>
             {isRetro && (
                <Typography variant="mono" className="text-slate-600 font-black tracking-widest text-[9px] mt-1">/ UNIT</Typography>
             )}
          </div>

          {/* Model Toggle/Select */}
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: VolumeBonusType.FLAT, label: 'FLAT' },
                { value: VolumeBonusType.CUMULATIVE, label: 'CUMULATIVE' },
                { value: VolumeBonusType.NON_CUMULATIVE, label: 'NON-CUMULATIVE' },
                { value: VolumeBonusType.RETRO_PER_UNIT, label: 'RETRO UNIT' },
              ]}
              value={bonus.type}
              onChange={(e) => onUpdate({ type: e.target.value as VolumeBonusType })}
              className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] w-[130px] font-black text-[10px] uppercase text-[var(--color-text-primary)]"
            />

            <Select
              options={[
                { value: VolumeBonusFilter.ANY, label: 'ANY DEAL' },
                { value: VolumeBonusFilter.NEW, label: 'NEW ONLY' },
                { value: VolumeBonusFilter.USED, label: 'USED ONLY' },
                { value: VolumeBonusFilter.CPO, label: 'CPO ONLY' },
              ]}
              value={bonus.filter}
              onChange={(e) => onUpdate({ filter: e.target.value as VolumeBonusFilter })}
              className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] w-[110px] font-black text-[10px] uppercase text-[var(--color-text-primary)]"
            />
          </div>

          <div className="flex items-center gap-2">
            {isRetro && (
               <button
                 type="button"
                 onClick={() => onUpdate({ scope: bonus.scope === VolumeBonusScope.ALL_UNITS ? VolumeBonusScope.THRESHOLD_PLUS : VolumeBonusScope.ALL_UNITS })}
                 className={cn(
                   "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                   bonus.scope === VolumeBonusScope.ALL_UNITS ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)] hover:border-[var(--color-border)] hover:text-slate-500"
                 )}
               >
                 {bonus.scope === VolumeBonusScope.ALL_UNITS ? 'RETRO' : 'TIER+'}
               </button>
            )}
            
            {!isRetro && bonus.type === VolumeBonusType.CUMULATIVE && (
               <div className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                 STACKS
               </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 shrink-0 self-end lg:self-center">
          <ActiveChip active={bonus.active} onClick={() => onUpdate({ active: !bonus.active })} />
          <button 
            type="button"
            onClick={onRemove} 
            className="text-red-500/30 hover:text-red-400 transition-all p-2"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {isInvalidOrdering && (
        <div className="mt-3 pt-3 border-t border-red-500/10 flex items-center gap-2 text-red-400 animate-in fade-in slide-in-from-top-1 duration-300">
          <Typography variant="mono" className="text-[9px] uppercase tracking-widest font-bold">
            Unit threshold must be greater than the row above ({previousThreshold} units)
          </Typography>
        </div>
      )}

      {/* Optional Note Row if present */}
      {bonus.notes && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <Typography variant="mono" className="text-[9px] text-slate-600 italic">Note: {bonus.notes}</Typography>
        </div>
      )}
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
  ghostValue,
  isRetroactive,
  onToggleRetroactive,
  isInfinite,
  disabled,
  isError,
  className,
  size = 'md'
}) => {
  const [localValue, setLocalValue] = React.useState(value?.toString() || '');
  const [isFocused, setIsFocused] = React.useState(false);
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
    amber: "text-amber-400 brightness-110",
  };

  const fieldStyles = {
    neutral: "bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)] focus:border-white/20",
    cyan: "bg-cyan-500/[0.03] border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.05)] focus:border-cyan-400/60",
    purple: "bg-purple-500/[0.03] border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.05)] focus:border-purple-400/60",
    amber: "bg-amber-500/[0.03] border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.05)] focus:border-amber-400/60",
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = e.target.value;
    
    // Fix leading zero (010 -> 10)
    if (newVal.length > 1 && newVal.startsWith('0') && newVal[1] !== '.') {
      newVal = newVal.substring(1);
    }
    
    setLocalValue(newVal);
    // Real-time update to parent for feedback
    const normalized = normalizeMatrixNumber(newVal);
    onChange(normalized !== undefined ? normalized.toString() : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (localValue === '') {
      onChange('');
      return;
    }
    const normalized = normalizeMatrixNumber(localValue);
    const formatted = formatMatrixValue(normalized as number);
    setLocalValue(formatted);
    onChange(formatted);
  };

  const showGhost = !isFocused && (value === undefined || value === '' || value === null) && ghostValue !== undefined && ghostValue !== '';

  return (
    <div className={cn("flex flex-col gap-2.5 flex-1 min-w-[100px] group/input", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Typography variant="mono" className={cn("text-[10px] font-black tracking-[0.25em] uppercase", labelColors[color])}>
            {label}
          </Typography>
        </div>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={isInfinite ? '∞' : (showGhost ? ghostValue : localValue)}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled || isInfinite}
          className={cn(
            "w-full rounded-2xl font-bold text-base outline-none transition-all duration-300 border text-center",
            size === 'sm' ? 'h-10 px-2' : 'h-12 px-5',
            fieldStyles[color],
            isError && "text-red-500 !border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
            isInfinite && "text-slate-500 bg-[var(--color-bg-elevated)] border-[var(--color-border)] cursor-default",
            disabled && "opacity-50 cursor-not-allowed",
            showGhost && "opacity-30 !text-slate-500 italic"
          )}
        />
        {suffix === '%' ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center select-none">
            <span className={cn(
              "font-bold text-sm",
              color === 'cyan' ? 'text-cyan-400/60' : color === 'purple' ? 'text-purple-400/60' : color === 'amber' ? 'text-amber-400/60' : 'text-slate-500'
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
  const { deals, triggerError, monthlySpiffs = [] } = useAppData();
  const { profile, addToast } = useAuth();
  const isSimulationEngineEnabled = true;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import/Export States
  const [importPreview, setImportPreview] = useState<Partial<PayPlan> | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);

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

  // Ensure we have at least one default row for minis if none exist
  const getInitialMiniTiers = () => {
    let tiers: MiniLadderTier[] = [];
    if (initialData?.miniTiers && initialData.miniTiers.length > 0) {
      tiers = [...initialData.miniTiers];
    } else {
      tiers = [{
        id: crypto.randomUUID(),
        threshold: 0,
        maxUnits: undefined,
        newMini: initialData?.miniAmount || 200,
        usedMini: initialData?.miniAmount || 200,
        isRetroactive: false,
        active: true
      }];
    }
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
    frontDeficitRecoveryEnabled: initialData?.frontDeficitRecoveryEnabled ?? false,
    isAdvanced: initialData?.isAdvanced !== undefined ? initialData.isAdvanced : true,
    isRulesEnabled: initialData?.isRulesEnabled ?? (initialData?.rules && initialData.rules.length > 0 ? true : false),
    isVolumeBonusEngineActive: initialData?.isVolumeBonusEngineActive || false,
    isSplitBehaviorActive: initialData?.isSplitBehaviorActive ?? true,
    isFlatPerUnitActive: initialData?.isFlatPerUnitActive ?? true,
    rules: initialData?.rules || [] as PayPlanRule[],
    tiers: getInitialTiers(),
    volumeBonuses: initialData?.volumeBonuses || [] as VolumeBonus[],
    
    // Minis and Hourly Section
    isMinisAndHourlyActive: initialData?.isMinisAndHourlyActive ?? false,
    isMinisActive: initialData?.isMinisActive ?? false,
    isHourlyActive: initialData?.isHourlyActive ?? false,
    miniTiers: getInitialMiniTiers(),
    customMinis: initialData?.customMinis || [] as CustomMini[],
    customUnitBonuses: initialData?.customUnitBonuses || [] as CustomUnitBonus[],
    hourlyConfig: (() => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (initialData?.hourlyConfig) {
        const matchesMonth = initialData.hourlyConfig.hoursMonth === currentMonth;
        return {
          ...initialData.hourlyConfig,
          hoursWorked: matchesMonth ? (initialData.hourlyConfig.hoursWorked ?? 0) : 0,
          hoursMonth: currentMonth
        } as HourlyConfig;
      }
      return {
        active: true,
        rate: 15,
        hoursWorked: 0,
        model: HourlyPayoutModel.GUARANTEE,
        hoursMonth: currentMonth
      } as HourlyConfig;
    })(),

    // Pack Deduction
    isPackActive: initialData?.isPackActive ?? false,
    frontPack: initialData?.frontPack ?? 0,
    backPack: initialData?.backPack ?? 0,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Simulation State System
  const [simMode, setSimMode] = useState<'live' | 'scenario'>('live');

  const [drawBalance, setDrawBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('stripeit_draw_balance');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stripeit_draw_balance', drawBalance.toString());
    } catch (e) {
      console.error(e);
    }
  }, [drawBalance]);

  const [simulationData, setSimulationData] = useState({
    name: 'Standard Scenario',
    totalUnits: 12,
    newUnits: 6,
    usedUnits: 6,
    cpoUnits: 0,
    splitDeals: 0,
    frontGrossTotal: 30000,
    backGrossTotal: 12000,
    hoursWorked: 160
  });

  const [savedScenarios, setSavedScenarios] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('stripeit_simulation_scenarios');
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Average Month', totalUnits: 12, newUnits: 6, usedUnits: 6, cpoUnits: 0, splitDeals: 0, frontGrossTotal: 30000, backGrossTotal: 12000, hoursWorked: 160 },
        { id: '2', name: 'High Volume', totalUnits: 25, newUnits: 15, usedUnits: 10, cpoUnits: 0, splitDeals: 2, frontGrossTotal: 65000, backGrossTotal: 30000, hoursWorked: 172 }
      ];
    } catch {
      return [];
    }
  });

  const saveScenario = () => {
    const newScenario = { ...simulationData, id: crypto.randomUUID(), timestamp: Date.now() };
    const updated = [newScenario, ...savedScenarios].slice(0, 5); // Keep last 5
    setSavedScenarios(updated);
    localStorage.setItem('stripeit_simulation_scenarios', JSON.stringify(updated));
  };

  const loadScenario = (scenario: any) => {
    setSimulationData(scenario);
  };

  const currentMonthDeals = useMemo(() => {
    const prefix = new Date().toISOString()
      .slice(0, 7);
    return deals.filter(d => 
      d.date.startsWith(prefix));
  }, [deals]);

  const activeSimData = useMemo(() => {
    if (simMode === 'live') {
      const stats = {
        totalUnits: 0,
        frontGrossTotal: 0,
        backGrossTotal: 0,
        newUnits: 0,
        usedUnits: 0,
        cpoUnits: 0,
        splitDeals: 0,
        hoursWorked: simulationData.hoursWorked
      };
      currentMonthDeals.forEach(d => {
        const pct = d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1;
        stats.totalUnits += pct;
        stats.frontGrossTotal += d.frontEndGross || 0;
        stats.backGrossTotal += d.backEndGross || 0;
        if (d.isSplitDeal) stats.splitDeals += 1;
        if (d.newOrUsed === 'new') stats.newUnits += pct;
        else if (d.newOrUsed === 'used') stats.usedUnits += pct;
        else if (d.newOrUsed === 'cpo') stats.cpoUnits += pct;
      });
      return {
        ...simulationData,
        ...stats,
        name: 'Live Data Month'
      };
    }
    return simulationData;
  }, [simMode, currentMonthDeals, simulationData]);

  const simulatedDeals = useMemo(() => {
    if (!isSimulationEngineEnabled) return [];
    const dealsList: Deal[] = [];
    const count = simulationData.totalUnits;
    if (count <= 0) return [];

    const avgFront = simulationData.frontGrossTotal / count;
    const avgBack = simulationData.backGrossTotal / count;

    for (let i = 0; i < count; i++) {
      let type: 'new' | 'used' | 'cpo' = 'used';
      if (i < simulationData.newUnits) type = 'new';
      else if (i < simulationData.newUnits + simulationData.usedUnits) type = 'used';
      else type = 'cpo';

      const isSplit = i < simulationData.splitDeals;

      dealsList.push({
        id: `sim-${i}`,
        frontEndGross: avgFront,
        backEndGross: avgBack,
        isSplitDeal: isSplit,
        splitPercentage: 50,
        newOrUsed: type,
        status: DealStatus.FINALIZED,
        date: new Date().toISOString(),
        customerName: `Simulated Deal ${i + 1}`,
        purchasedVehicle: 'Simulation',
        orgId: '', dealershipId: '', userId: '', createdByUserId: '', assignedSalespersonId: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      } as Deal);
    }
    return dealsList;
  }, [simulationData, isSimulationEngineEnabled]);

  const currentMonthSpiffs = useMemo(() => {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    return (monthlySpiffs || []).filter(s => s.month === currentMonthStr);
  }, [monthlySpiffs]);

  const simEarnings = useMemo(() => {
    if (!isSimulationEngineEnabled) {
      return {
        totalPayout: 0,
        totalTierBonuses: 0,
        grandTotal: 0,
        dealResults: [],
        tierBonuses: [],
        hourlyCompensation: null,
        totalMonthlySpiffs: 0
      };
    }
    const targetDeals = simMode === 'live' ? currentMonthDeals : simulatedDeals;
    const targetSpiffs = simMode === 'live' ? currentMonthSpiffs : [];
    return calculatePeriodEarnings(targetDeals, formData as PayPlan, targetSpiffs);
  }, [simulatedDeals, currentMonthDeals, currentMonthSpiffs, simMode, formData, isSimulationEngineEnabled]);

  const currentUnits = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    return deals
      .filter(d => d.date.startsWith(currentMonthPrefix) && (d.status === DealStatus.FINALIZED || d.status === DealStatus.SUBMITTED))
      .reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  }, [deals]);

  const activeTier = useMemo(() => {
    return getActiveCommissionTier(currentUnits, formData.tiers);
  }, [currentUnits, formData.tiers]);

  const activeMiniTier = useMemo(() => {
    return getActiveMiniTier(currentUnits, formData.miniTiers);
  }, [currentUnits, formData.miniTiers]);

  const activeTierDisplay = useMemo(() => {
    if (!activeTier) return 'BASE';
    const idx = formData.tiers.findIndex(t => t.id === activeTier.id);
    if (idx <= 0) return 'BASE';
    return `${activeTier.frontRate}% front / ${activeTier.backRate}% back`;
  }, [activeTier, formData.tiers]);

  const nextTier = useMemo(() => {
    if (!formData.tiers || formData.tiers.length === 0) return null;
    const sorted = [...formData.tiers].sort((a, b) => Number(a.threshold ?? 0) - Number(b.threshold ?? 0));
    return sorted.find(t => Number(t.threshold ?? 0) > currentUnits);
  }, [formData.tiers, currentUnits]);

  const progressPercent = useMemo(() => {
    if (!nextTier) return 100;
    const thresh = Number(nextTier.threshold ?? 0);
    if (thresh <= 0) return 100;
    return Math.min(100, (currentUnits / thresh) * 100);
  }, [nextTier, currentUnits]);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    minis_hourly: false,
    commission_matrix: false,
    volume_bonus: false,
    custom_unit_bonus: false,
    rules: false,
    misc_defaults: false,
    sim_settings: false,
    sim_ladder: false,
    sim_minis: false,
    sim_bonus: false
  });

  const [pendingDeleteCustomBonusId, setPendingDeleteCustomBonusId] = useState<string | null>(null);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const actualId = sectionId === 'commission_ladder' ? 'commission_matrix' : sectionId;
      return { ...prev, [actualId]: !prev[actualId] };
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleNumeric = (field: string, value: string) => {
    const isCurrency = ['miniAmount', 'flatPerUnitAmount', 'frontPack', 'backPack'].includes(field);
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

    // Mini Ladder Validation
    const sortedMiniTiers = [...formData.miniTiers].sort((a, b) => {
      const valA = a.threshold ?? (a.id === formData.miniTiers[0].id ? 0 : Number.MAX_SAFE_INTEGER);
      const valB = b.threshold ?? (b.id === formData.miniTiers[0].id ? 0 : Number.MAX_SAFE_INTEGER);
      return valA - valB;
    });

    for (let i = 0; i < sortedMiniTiers.length; i++) {
      const current = sortedMiniTiers[i];
      const next = sortedMiniTiers[i + 1];

      const currentMin = current.threshold ?? (i === 0 ? 0 : undefined);
      const currentMax = current.maxUnits;

      if (currentMin !== undefined && currentMax != null && currentMin >= currentMax) {
        errors[current.id] = "Min units must be less than max units";
      }

      if (next) {
        const currentIsBlank = current.threshold == null && current.maxUnits == null && current.newMini == null && current.usedMini == null;
        const nextIsBlank = next.threshold == null && next.maxUnits == null && next.newMini == null && next.usedMini == null;

        if (currentMax == null && !currentIsBlank && !nextIsBlank) {
          errors[next.id] = "Previous row is open-ended. Provide a Max Unit limit to add more rows.";
        } else if (currentMax != null && next.threshold !== undefined && next.threshold <= currentMax) {
          errors[next.id] = `Range overlaps with previous tier (${currentMin}-${currentMax})`;
        }
      }
    }

    return errors;
  }, [formData.tiers, formData.miniTiers]);

  // Rule Helpers
  const addRule = () => {
    const newRule: PayPlanRule = {
      id: crypto.randomUUID(),
      name: 'New Rule',
      condition: 'total_gross',
      operator: 'gte',
      threshold: 3000,
      rewardType: 'fixed_bonus',
      rewardValue: 50,
      active: true
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

  // Volume Bonus Helpers
  const addVolumeBonus = () => {
    setFormData(prev => {
      const bonuses = prev.volumeBonuses || [];
      const lastBonus = bonuses.length > 0 ? bonuses[bonuses.length - 1] : null;
      const maxThreshold = bonuses.length > 0 ? Math.max(...bonuses.map(b => b.threshold)) : 5;
      
      const newBonus: VolumeBonus = {
        id: crypto.randomUUID(),
        threshold: bonuses.length > 0 ? maxThreshold + 5 : 10,
        amount: lastBonus ? lastBonus.amount : 500,
        type: lastBonus ? lastBonus.type : VolumeBonusType.FLAT,
        scope: lastBonus ? lastBonus.scope : VolumeBonusScope.ALL_UNITS,
        filter: lastBonus ? lastBonus.filter : VolumeBonusFilter.ANY,
        active: true,
      };

      return {
        ...prev,
        isVolumeBonusEngineActive: true,
        volumeBonuses: [...bonuses, newBonus]
      };
    });
  };

  const updateVolumeBonus = (id: string, updates: Partial<VolumeBonus>) => {
    handleChange('volumeBonuses', (formData.volumeBonuses || []).map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeVolumeBonus = (id: string) => {
    handleChange('volumeBonuses', (formData.volumeBonuses || []).filter(b => b.id !== id));
  };

  // Mini Ladder Tier Helpers
  const syncMiniTiers = (tiers: MiniLadderTier[]): MiniLadderTier[] => {
    const sorted = [...tiers].sort((a, b) => {
      const valA = a.threshold ?? Number.MAX_SAFE_INTEGER;
      const valB = b.threshold ?? Number.MAX_SAFE_INTEGER;
      return valA - valB;
    });

    if (sorted.length > 0) {
      sorted[0] = { ...sorted[0], threshold: 0 };
    }

    return sorted.map((tier, i) => {
      const next = sorted[i + 1];
      if (next) {
        if (next.threshold !== undefined) {
          return { ...tier, maxUnits: next.threshold - 0.5 };
        }
        return { ...tier, maxUnits: undefined };
      }
      return { ...tier, maxUnits: undefined };
    });
  };

  const addMiniTier = () => {
    const newTier: MiniLadderTier = {
      id: crypto.randomUUID(),
      threshold: undefined,
      maxUnits: undefined,
      newMini: 200,
      usedMini: 200,
      isRetroactive: false,
      active: true
    };
    handleChange('miniTiers', syncMiniTiers([...formData.miniTiers, newTier]));
  };

  const updateMiniTier = (id: string, updates: Partial<MiniLadderTier>) => {
    const newTiers = formData.miniTiers.map(t => t.id === id ? { ...t, ...updates } : t);
    if (updates.threshold !== undefined || updates.maxUnits !== undefined) {
      handleChange('miniTiers', syncMiniTiers(newTiers));
    } else {
      handleChange('miniTiers', newTiers);
    }
  };

  const removeMiniTier = (id: string) => {
    if (formData.miniTiers.length <= 1) return;
    const remaining = formData.miniTiers.filter(t => t.id !== id);
    handleChange('miniTiers', syncMiniTiers(remaining));
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

  const addCustomUnitBonus = () => {
    const newBonus: CustomUnitBonus = {
      id: crypto.randomUUID(),
      label: '',
      threshold: 5,
      amountPerUnit: 50,
      isRetroactive: true,
      active: true
    };
    handleChange('customUnitBonuses', [...(formData.customUnitBonuses || []), newBonus]);
  };

  const updateCustomUnitBonus = (id: string, updates: Partial<CustomUnitBonus>) => {
    handleChange('customUnitBonuses', (formData.customUnitBonuses || []).map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeCustomUnitBonus = (id: string) => {
    handleChange('customUnitBonuses', (formData.customUnitBonuses || []).filter(b => b.id !== id));
  };

  // CSV Export/Import Handlers
  const handleExport = () => {
    try {
      const csv = commissionCsvService.exportToCsv(formData as any);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `${formData.name.replace(/\s+/g, '_')}_PayPlan.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('Pay plan exported successfully.', 'success');
    } catch (err) {
      triggerError('Failed to export CSV.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = commissionCsvService.parseCsv(text);
        const errors = commissionCsvService.validatePlan(parsed);
        
        setImportPreview(parsed);
        setImportErrors(errors);
        setIsImportModalOpen(true);
      } catch (err: any) {
        triggerError(err.message || 'Failed to parse CSV.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const confirmImport = () => {
    if (!importPreview) return;
    
    // Normalizing parsed data to match formData expectation (especially ensuring default IDs aren't blank)
    const normalized = {
      ...importPreview,
      rules: importPreview.rules?.map(r => ({ ...r, id: r.id || crypto.randomUUID() })),
      tiers: importPreview.tiers?.map(t => ({ ...t, id: t.id || crypto.randomUUID() })),
      volumeBonuses: importPreview.volumeBonuses?.map(b => ({ ...b, id: b.id || crypto.randomUUID() })),
      miniTiers: importPreview.miniTiers?.map(t => ({ ...t, id: t.id || crypto.randomUUID() })),
      customMinis: importPreview.customMinis?.map(m => ({ ...m, id: m.id || crypto.randomUUID() })),
    };

    setFormData(prev => ({
      ...prev,
      ...normalized
    }) as any);
    
    setIsImportModalOpen(false);
    setImportPreview(null);
    addToast('Plan configuration imported. Review and Lock to save.', 'success');
  };

  /**
   * StripeItPayPlanPreviewSystem
   * Live calculation preview based on current form state.
   */
  const previewData = useMemo(() => {
    return simEarnings;
  }, [simEarnings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Pre-submission Validation
    const tiers = formData.tiers;
    if (tiers.length === 0) {
      triggerError('Commission architect must have at least one row.');
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

    // 2. Pre-submission Validation for Minis
    const miniTiers = formData.miniTiers;
    for (let i = 0; i < miniTiers.length; i++) {
        const t = miniTiers[i];
        const rowNum = i + 1;
        const minUnits = i === 0 ? 0 : t.threshold;
        
        if (minUnits == null || isNaN(minUnits)) {
            triggerError(`Mini Row ${rowNum} is missing its starting unit threshold.`);
            return;
        }
        if (t.newMini == null || isNaN(t.newMini)) {
            triggerError(`Mini Row ${rowNum} is missing its New Mini amount.`);
            return;
        }
        if (t.usedMini == null || isNaN(t.usedMini)) {
            triggerError(`Mini Row ${rowNum} is missing its Used Mini amount.`);
            return;
        }
        if (i < miniTiers.length - 1) {
            if (t.maxUnits == null || isNaN(t.maxUnits)) {
                triggerError(`Mini Row ${rowNum} must have a Max Unit limit.`);
                return;
            }
        }
    }

    if (Object.keys(validationErrors).length > 0) {
        triggerError('Please fix the mathematical range overlaps before saving.');
        return;
    }

    // 3. Normalization for Persistence
    const cleanTiers = (formData.tiers || []).map((t, i) => ({
      ...t,
      threshold: i === 0 ? 0 : (Number(t.threshold) || 0),
      maxUnits: t.maxUnits === undefined ? null : t.maxUnits,
      frontRate: Number(t.frontRate) || 0,
      backRate: Number(t.backRate) || 0,
      frontRetroactive: i === 0 ? false : (t.frontRetroactive ?? false),
      backRetroactive: i === 0 ? false : (t.backRetroactive ?? false),
      bonusAmount: Number(t.bonusAmount) || 0,
      perUnitBonus: Number(t.perUnitBonus) || 0,
      isRetroactive: t.isRetroactive || false
    }));

    const cleanMiniTiers = (formData.miniTiers || []).map((t, i) => ({
      ...t,
      threshold: i === 0 ? 0 : (Number(t.threshold) || 0),
      maxUnits: t.maxUnits === undefined ? null : t.maxUnits,
      newMini: Number(t.newMini) || 0,
      usedMini: Number(t.usedMini) || 0,
      isRetroactive: i === 0 ? false : (t.isRetroactive ?? false),
      active: t.active ?? true
    }));

    const cleanVolumeBonuses = (formData.volumeBonuses || []).map(b => ({
      ...b,
      threshold: Number(b.threshold) || 0,
      amount: Number(b.amount) || 0,
      active: b.active ?? true,
      notes: b.notes || ""
    }));

    const cleanRules = (formData.rules || []).map(r => ({
      ...r,
      rewardValue: Number(r.rewardValue) || 0
    }));

    const cleanCustomUnitBonuses = (formData.customUnitBonuses || []).map(b => ({
      ...b,
      threshold: Number(b.threshold) || 0,
      amountPerUnit: Number(b.amountPerUnit) || 0,
      isRetroactive: b.isRetroactive ?? false,
      active: b.active ?? true,
      label: b.label || ""
    }));

    const cleanData = {
      ...formData,
      frontEndPercentage: Number(formData.frontEndPercentage) || 0,
      backEndPercentage: Number(formData.backEndPercentage) || 0,
      miniAmount: cleanMiniTiers[0]?.newMini || 200,
      flatPerUnitAmount: Number(formData.flatPerUnitAmount) || 0,
      tiers: cleanTiers,
      miniTiers: cleanMiniTiers,
      volumeBonuses: cleanVolumeBonuses,
      rules: cleanRules,
      customUnitBonuses: cleanCustomUnitBonuses,
      isVolumeBonusEngineActive: formData.isVolumeBonusEngineActive || false,
      isSplitBehaviorActive: formData.isSplitBehaviorActive ?? true,
      isFlatPerUnitActive: formData.isFlatPerUnitActive ?? true,
      isMinisAndHourlyActive: formData.isMinisAndHourlyActive,
      isMinisActive: formData.isMinisActive,
      isHourlyActive: formData.isHourlyActive,
      customMinis: (formData.customMinis || []).map(m => ({ ...m, amount: Number(m.amount) || 0 })),
      hourlyConfig: {
        ...formData.hourlyConfig,
        rate: Number(formData.hourlyConfig?.rate) || 0,
        hoursWorked: Number(formData.hourlyConfig?.hoursWorked) || 0,
        active: formData.hourlyConfig?.active ?? false,
        hoursMonth: formData.hourlyConfig?.hoursMonth || new Date().toISOString().slice(0, 7)
      },
      frontDeficitRecoveryEnabled: formData.frontDeficitRecoveryEnabled,
      isPackActive: formData.isPackActive ?? false,
      frontPack: Number(formData.frontPack) || 0,
      backPack: Number(formData.backPack) || 0
    };

    // Validation Check: Prevent save if any active volume bonus has invalid ordering
    const hasOrderingErrors = cleanVolumeBonuses.some((b, i, arr) => 
      i > 0 && b.active && arr[i-1].active && b.threshold <= arr[i-1].threshold
    );

    if (hasOrderingErrors) {
      triggerError("Cannot save: Volume Bonus thresholds must be in ascending order.");
      return;
    }

    onSubmit(cleanData);
    setIsDirty(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.2 }}
            className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 backdrop-blur-md shadow-glow glow-primary/10 mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
              <Typography variant="mono" className="text-brand-primary text-[10px] font-black uppercase tracking-widest">
                Unsaved Changes
              </Typography>
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="h-9 px-5 text-[10px] font-black uppercase tracking-widest"
            >
              Save Changes
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="space-y-10">
        {/* Header/Info */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5 rounded-3xl bg-brand-primary/[0.03] p-6 border border-brand-primary/10">
          <div className="h-10 w-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Calculator className="h-6 w-6 text-brand-primary" />
          </div>
          <div className="flex-1">
            <Typography variant="label" className="text-brand-primary font-black uppercase tracking-widest text-xs mb-1 block">Precision Matrix</Typography>
            <Typography variant="small" className="text-slate-400 max-w-2xl leading-relaxed">
              Tiered commission infrastructure. Define unit-based performance ranges with custom front and back-end payouts. 
              Calculations are applied retroactively to your monthly deal volume.
            </Typography>
          </div>

          {/* CSV Actions with Premium Upsell */}
          {profile?.subscriptionTier === SubscriptionTier.FREE ? (
            <div className="relative group/upsell overflow-hidden rounded-2xl border border-brand-primary/20 bg-brand-primary/[0.03] p-4 flex items-center gap-4 transition-all hover:bg-brand-primary/[0.05] hover:border-brand-primary/30 w-full md:max-w-[280px]">
              <div className="flex flex-col gap-1.5 flex-1 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Zap size={12} className="text-amber-500 fill-amber-500" />
                  </div>
                  <Typography variant="mono" className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Unlock Architect CSV</Typography>
                </div>
                <div className="space-y-1">
                  <Typography variant="mono" className="text-[11px] text-[var(--color-text-primary)] font-black leading-tight border-b border-brand-primary/20 pb-1 w-fit uppercase tracking-tighter">Export & Share Plans</Typography>
                  <Typography variant="small" className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    Download pay plans to share with your team or quickly transfer configurations. <span className="text-[var(--color-text-primary)] font-bold underline decoration-brand-primary/40 underline-offset-2">Basic+ exclusive</span>.
                  </Typography>
                </div>
              </div>
              <div className="shrink-0 flex flex-col gap-2 relative z-10">
                 <div className="h-10 w-10 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-slate-600 transition-colors group-hover/upsell:text-brand-primary group-hover/upsell:border-brand-primary/30">
                    <FileDown size={20} />
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 blur-[40px] pointer-events-none group-hover/upsell:bg-brand-primary/10 transition-colors" />
            </div>
          ) : (
            <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="flex-1 md:flex-none h-11 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-slate-300 hover:text-[var(--color-text-primary)]"
              >
                <FileDown size={16} className="mr-2" /> Export CSV
              </Button>
              <div className="flex-1 md:flex-none">
                <input
                   ref={fileInputRef}
                   type="file"
                   accept=".csv"
                   onChange={handleImportFile}
                   className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 px-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-slate-300 hover:text-[var(--color-text-primary)]"
                >
                  <FileUp size={16} className="mr-2" /> Import CSV
                </Button>
              </div>
            </div>
          )}
        </div>

        {isSimulationEngineEnabled && simMode === 'live' && (
          <Card className="bg-emerald-500/[0.03] border border-emerald-500/10 p-6 rounded-[2rem] mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <Typography variant="mono" className="text-[10px] text-emerald-400 font-extrabold tracking-widest uppercase">
                LIVE PAYCHECK PROJECTION
              </Typography>
            </div>

            {/* Row 1 — Three stat cells side by side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Projected Pay</Typography>
                <Typography variant="p" className="text-3xl font-black text-emerald-400 tracking-tight">
                  ${Math.round(simEarnings.grandTotal).toLocaleString()}
                </Typography>
              </div>
              <div className="flex flex-col">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Units MTD</Typography>
                <Typography variant="p" className="text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                  {currentUnits}
                </Typography>
              </div>
              <div className="flex flex-col">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">Active Tier</Typography>
                <Typography variant="p" className="text-2xl font-black text-cyan-400 tracking-tight leading-9">
                  {activeTierDisplay}
                </Typography>
              </div>
            </div>

            {/* Row 2 — Breakdown row */}
            <div className="grid grid-cols-3 gap-6 py-4 border-t border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 rounded-xl">
              <div className="flex flex-col">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider">Deal Commission</Typography>
                <Typography variant="mono" className="text-sm text-[var(--color-text-primary)] font-black mt-1">
                  ${Math.round(simEarnings.totalPayout).toLocaleString()}
                </Typography>
              </div>
              <div className="flex flex-col">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider">Volume Bonuses</Typography>
                <Typography variant="mono" className="text-sm text-[var(--color-text-primary)] font-black mt-1">
                  ${Math.round(simEarnings.totalTierBonuses).toLocaleString()}
                </Typography>
              </div>
              <div className="flex flex-col">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider">SPIFFs</Typography>
                <Typography variant="mono" className="text-sm text-[var(--color-text-primary)] font-black mt-1">
                  ${Math.round(currentMonthSpiffs.reduce((sum, s) => sum + (s.isChargeback ? -(s.amount || 0) : (s.amount || 0)), 0)).toLocaleString()}
                </Typography>
              </div>
            </div>

            {/* Draw Balance Row (Only shown if draw model is active) */}
            {formData.isMinisAndHourlyActive && formData.isHourlyActive && formData.hourlyConfig.model === 'draw' && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Typography variant="mono" className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest block">
                    CARRY-FORWARD DRAW BALANCE
                  </Typography>
                  <div className="w-[180px]">
                    <CurrencyInput
                      value={drawBalance}
                      onChange={(e) => setDrawBalance(normalizeCurrencyNumber(e.target.value))}
                      hideLabel
                      className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-widest block">
                      ADJUSTED PROJECTION
                    </Typography>
                    <Typography 
                      variant="p" 
                      className={cn(
                        "text-2xl font-black tracking-tight block",
                        (simEarnings.grandTotal - drawBalance) >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      ${Math.round(simEarnings.grandTotal - drawBalance).toLocaleString()}
                    </Typography>
                  </div>
                  <Typography variant="p" className="text-slate-500 text-[10px] leading-relaxed block">
                    Amount owed back before new commission is payable
                  </Typography>
                </div>
              </div>
            )}

            {/* Row 3 — Slim progress bar */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase tracking-wider">
                  Tier Progress
                </Typography>
                {nextTier ? (
                  <Typography variant="mono" className="text-[10px] text-slate-400">
                    {currentUnits} / {Number(nextTier.threshold ?? 0)} Units to next tier
                  </Typography>
                ) : (
                  <Typography variant="mono" className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">
                    MAX TIER
                  </Typography>
                )}
              </div>
              <div className="h-1 w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-full overflow-hidden">
                <div 
                  className={cn("h-full rounded-full transition-all duration-500", nextTier ? "bg-cyan-500" : "bg-emerald-500")}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </Card>
        )}

        {/* StripeItMinisAndHourlySystem - Minis & Hourly Section */}
        <MatrixSection
          id="minis_hourly"
          title="Minis & Hourly"
          subtitle="Base Compensation & Protections"
          icon={<ShieldCheck className="h-6 w-6" />}
          iconColor="indigo-500"
          isActive={formData.isMinisAndHourlyActive}
          onActiveChange={(active) => handleChange('isMinisAndHourlyActive', active)}
          isExpanded={expandedSections.minis_hourly}
          onToggle={() => toggleSection('minis_hourly')}
          summary={
            <div className="flex items-center gap-4">
              {formData.isMinisActive && (
                <>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                    <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">New:</Typography>
                    <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">
                      ${activeMiniTier?.newMini ?? formData.miniTiers[0]?.newMini ?? 0}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                    <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Used:</Typography>
                    <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">
                      ${activeMiniTier?.usedMini ?? formData.miniTiers[0]?.usedMini ?? 0}
                    </Typography>
                  </div>
                </>
              )}
              {formData.isHourlyActive && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                  <Typography variant="mono" className="text-[10px] text-slate-400 font-black uppercase">Hourly</Typography>
                  <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">${formData.hourlyConfig.rate}/hr</Typography>
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Mini Ladder Subsection */}
            <Card className="bg-[var(--color-bg-surface)] border-[var(--color-border)] p-8 rounded-[2rem]">
              <div className="flex items-center justify-between mb-8">
                <Typography variant="mono" className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Mini Ladder System</Typography>
                <ActiveChip 
                  active={formData.isMinisActive} 
                  onClick={() => handleChange('isMinisActive', !formData.isMinisActive)} 
                />
              </div>

              {formData.isMinisActive && (
                <div className="animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 gap-3">
                    {formData.miniTiers.map((tier, index) => {
                      const hasError = validationErrors[tier.id];
                      const isFirstRow = index === 0;
                      const isLastRow = index === formData.miniTiers.length - 1;
                      
                      return (
                        <div 
                          key={tier.id} 
                          className={cn(
                            "group bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-4 md:p-5 rounded-2xl transition-all duration-300",
                            hasError && "ring-1 ring-red-500/30 border-red-500/20"
                          )}
                        >
                          <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center">
                            {/* Units Range */}
                            <div className="flex items-center gap-3 min-w-[190px]">
                              <div className="w-[85px]">
                                <MatrixInputGroup 
                                  value={isFirstRow ? 0 : tier.threshold} 
                                  onChange={(val) => updateMiniTier(tier.id, { threshold: val === '' ? undefined : parseFloat(val) })} 
                                  disabled={isFirstRow}
                                  placeholder="0"
                                  size="sm"
                                  className="min-w-0"
                                />
                              </div>
                              <Typography variant="mono" className="text-slate-600 font-black">→</Typography>
                              <div className="w-[85px]">
                                <MatrixInputGroup 
                                  value={tier.maxUnits} 
                                  onChange={(val) => updateMiniTier(tier.id, { maxUnits: val === '' ? undefined : parseFloat(val) })} 
                                  placeholder="∞"
                                  disabled={isLastRow && tier.maxUnits == null}
                                  isInfinite={isLastRow && tier.maxUnits == null}
                                  size="sm"
                                  className="min-w-0"
                                />
                              </div>
                            </div>

                            {/* Payouts */}
                            <div className="flex-1 flex flex-wrap items-center gap-6">
                              <div className="flex items-center gap-3">
                                <Typography variant="mono" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">New</Typography>
                                <div className="w-[110px]">
                                  <MatrixInputGroup 
                                    value={tier.newMini}
                                    onChange={(val) => updateMiniTier(tier.id, { newMini: val === '' ? undefined : parseFloat(val) })}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Typography variant="mono" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Used</Typography>
                                <div className="w-[110px]">
                                  <MatrixInputGroup 
                                    value={tier.usedMini}
                                    onChange={(val) => updateMiniTier(tier.id, { usedMini: val === '' ? undefined : parseFloat(val) })}
                                    size="sm"
                                  />
                                </div>
                              </div>
                              
                              {!isFirstRow && (
                                <button
                                  type="button"
                                  onClick={() => updateMiniTier(tier.id, { isRetroactive: !tier.isRetroactive })}
                                  className={cn(
                                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                                    tier.isRetroactive ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "bg-[var(--color-bg-elevated)] text-slate-700 border-[var(--color-border)] hover:border-[var(--color-border)] hover:text-slate-500"
                                  )}
                                >
                                  RETRO
                                </button>
                              )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-4 shrink-0">
                              <ActiveChip active={tier.active} onClick={() => updateMiniTier(tier.id, { active: !tier.active })} />
                              <button 
                                type="button"
                                onClick={() => removeMiniTier(tier.id)} 
                                disabled={formData.miniTiers.length <= 1}
                                className="text-red-500/30 hover:text-red-400 disabled:opacity-0 transition-all p-2"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {hasError && <Typography variant="mono" className="text-[9px] text-red-500 mt-2 uppercase font-bold px-1">{hasError}</Typography>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-center mt-6">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={addMiniTier} 
                      className="text-brand-primary h-10 px-6 hover:bg-brand-primary/5 rounded-xl border border-dashed border-brand-primary/20"
                    >
                      <Plus size={16} className="mr-2" /> Add Mini Range
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Hourly Subsection */}
            <Card className="bg-[var(--color-bg-surface)] border-[var(--color-border)] p-8 rounded-[2rem]">
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
                      className="h-11 bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                    />
                    <div className="space-y-2.5">
                      <Typography variant="mono" className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Hours Worked</Typography>
                      <MatrixInputGroup 
                        value={formData.hourlyConfig.hoursWorked} 
                        onChange={(val) => handleChange('hourlyConfig', { 
                          ...formData.hourlyConfig, 
                          hoursWorked: parseInt(val) || 0,
                          hoursMonth: new Date().toISOString().slice(0, 7)
                        })}
                        size="sm"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Typography variant="mono" className="text-[10px] text-slate-500 font-black tracking-widest uppercase">Monthly Total</Typography>
                      <div className="h-12 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl flex items-center px-5 font-black text-[var(--color-text-primary)]">
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
                              : "bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-surface)]"
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
        </MatrixSection>

        {/* Commission Architect Section */}
        <MatrixSection
          id="commission_matrix"
          title="Commission Matrix"
          subtitle="Unit-Based Payout Progression"
          icon={<TrendingUp className="h-6 w-6" />}
          iconColor="cyan-500"
          isActive={formData.isAdvanced}
          onActiveChange={(active) => handleChange('isAdvanced', active)}
          isExpanded={expandedSections.commission_matrix}
          onToggle={() => toggleSection('commission_matrix')}
          summary={
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Front:</Typography>
                <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">
                  {activeTier?.frontRate ?? formData.tiers[0]?.frontRate ?? 0}%
                </Typography>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Back:</Typography>
                <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">
                  {activeTier?.backRate ?? formData.tiers[0]?.backRate ?? 0}%
                </Typography>
              </div>
            </div>
          }
        >
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 gap-3">
              {formData.tiers.map((tier, index) => {
                const hasError = validationErrors[tier.id];
                const isFirstRow = index === 0;
                const isLastRow = index === formData.tiers.length - 1;
                
                return (
                  <div 
                    key={tier.id} 
                    className={cn(
                      "group bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 md:p-5 rounded-2xl transition-all duration-300 relative",
                      hasError ? "ring-1 ring-red-500/30 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]" : "hover:border-[var(--color-border)]"
                    )}
                  >
                    <div className="flex flex-col lg:grid lg:grid-cols-[210px_1fr_1fr_100px_48px] gap-8 items-center w-full">
                      {/* Units Range - Column 1 (Fixed 210px) */}
                      <div className="flex items-center gap-3 w-full justify-center lg:justify-start">
                        <div className="w-[85px] shrink-0">
                          <MatrixInputGroup 
                            value={isFirstRow ? 0 : tier.threshold} 
                            onChange={(val) => updateTier(tier.id, { threshold: val === '' ? undefined : parseFloat(val) })} 
                            disabled={isFirstRow}
                            placeholder="0"
                            size="sm"
                            className="min-w-0"
                          />
                        </div>
                        <Typography variant="mono" className="text-slate-600 font-black shrink-0">→</Typography>
                        <div className="w-[85px] shrink-0">
                          <MatrixInputGroup 
                            value={tier.maxUnits} 
                            onChange={(val) => updateTier(tier.id, { maxUnits: val === '' ? undefined : parseFloat(val) })} 
                            placeholder="∞"
                            disabled={isLastRow && tier.maxUnits == null}
                            isInfinite={isLastRow && tier.maxUnits == null}
                            size="sm"
                            className="min-w-0"
                          />
                        </div>
                      </div>

                      {/* Front End Rate - Column 2 (Balanced) */}
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-[60px] shrink-0 text-right">
                          <Typography variant="mono" className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Front End</Typography>
                        </div>
                        <div className="flex-1 min-w-[80px]">
                          <MatrixInputGroup 
                            value={tier.frontRate}
                            ghostValue={formData.tiers.slice(0, index).reverse().find(t => t.frontRate !== undefined)?.frontRate?.toString()}
                            onChange={(val) => updateTier(tier.id, { frontRate: val === '' ? undefined : parseFloat(val) })}
                            color="cyan"
                            suffix="%"
                            size="sm"
                            className="w-full"
                          />
                        </div>
                        <div className="w-[50px] shrink-0 flex justify-end">
                          {!isFirstRow && (
                            <MatrixItemChip 
                              label="RETRO"
                              active={tier.frontRetroactive}
                              onClick={() => updateTier(tier.id, { frontRetroactive: !tier.frontRetroactive })}
                              color="cyan"
                            />
                          )}
                        </div>
                      </div>

                      {/* Back End Rate - Column 3 (Balanced) */}
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-[60px] shrink-0 text-right">
                          <Typography variant="mono" className="text-[9px] text-purple-500 font-black uppercase tracking-widest">Back End</Typography>
                        </div>
                        <div className="flex-1 min-w-[80px]">
                          <MatrixInputGroup 
                            value={tier.backRate}
                            ghostValue={formData.tiers.slice(0, index).reverse().find(t => t.backRate !== undefined)?.backRate?.toString()}
                            onChange={(val) => updateTier(tier.id, { backRate: val === '' ? undefined : parseFloat(val) })}
                            color="purple"
                            suffix="%"
                            size="sm"
                            className="w-full"
                          />
                        </div>
                        <div className="w-[50px] shrink-0 flex justify-end">
                          {!isFirstRow && (
                            <MatrixItemChip 
                              label="RETRO"
                              active={tier.backRetroactive}
                              onClick={() => updateTier(tier.id, { backRetroactive: !tier.backRetroactive })}
                              color="purple"
                            />
                          )}
                        </div>
                      </div>

                      {/* Per Type Toggle - Column 4 (Fixed 100px) */}
                      <div className="flex items-center justify-center lg:justify-end w-full">
                        <MatrixItemChip 
                          label="PER TYPE"
                          active={!!(tier.usePerTypeRates || tier.usePerTypRates)}
                          onClick={() => {
                            const nextVal = !(tier.usePerTypeRates || tier.usePerTypRates);
                            updateTier(tier.id, { usePerTypeRates: nextVal, usePerTypRates: nextVal });
                          }}
                          color="amber"
                        />
                      </div>

                      {/* Controls - Column 5 (Fixed 48px) */}
                      <div className="flex items-center justify-end w-full">
                        <button 
                          type="button" 
                          onClick={() => removeTier(tier.id)} 
                          disabled={formData.tiers.length <= 1}
                          className="text-red-500/30 hover:text-red-400 disabled:opacity-0 transition-all p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable sub-grid for per-deal-type rates */}
                    {!!(tier.usePerTypeRates || tier.usePerTypRates) && (
                      <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        {/* Row 1 — NEW */}
                        <div className="flex flex-col lg:grid lg:grid-cols-[210px_1fr_1fr_100px_48px] gap-8 items-center w-full">
                          <div className="flex items-center w-full justify-center lg:justify-start">
                            <Typography variant="mono" className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest pl-2">
                              NEW DEALS
                            </Typography>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full">
                            <div className="w-[60px] shrink-0 text-right">
                              <Typography variant="mono" className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Front Rate</Typography>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <MatrixInputGroup 
                                value={tier.newFrontRate}
                                placeholder={tier.frontRate?.toString() || formData.frontEndPercentage?.toString()}
                                onChange={(val) => updateTier(tier.id, { newFrontRate: val === '' ? undefined : parseFloat(val) })}
                                color="cyan"
                                suffix="%"
                                size="sm"
                                className="w-full"
                              />
                            </div>
                            <div className="w-[50px] shrink-0" />
                          </div>

                          <div className="flex items-center gap-4 w-full">
                            <div className="w-[60px] shrink-0 text-right">
                              <Typography variant="mono" className="text-[9px] text-purple-500 font-black uppercase tracking-widest">Back Rate</Typography>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <MatrixInputGroup 
                                value={tier.newBackRate}
                                placeholder={tier.backRate?.toString() || formData.backEndPercentage?.toString()}
                                onChange={(val) => updateTier(tier.id, { newBackRate: val === '' ? undefined : parseFloat(val) })}
                                color="purple"
                                suffix="%"
                                size="sm"
                                className="w-full"
                              />
                            </div>
                            <div className="w-[50px] shrink-0" />
                          </div>

                          <div className="w-full" />
                          <div />
                        </div>

                        {/* Row 2 — USED */}
                        <div className="flex flex-col lg:grid lg:grid-cols-[210px_1fr_1fr_100px_48px] gap-8 items-center w-full">
                          <div className="flex items-center w-full justify-center lg:justify-start">
                            <Typography variant="mono" className="text-[10px] text-purple-400 font-extrabold uppercase tracking-widest pl-2">
                              USED DEALS
                            </Typography>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full">
                            <div className="w-[60px] shrink-0 text-right">
                              <Typography variant="mono" className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Front Rate</Typography>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <MatrixInputGroup 
                                value={tier.usedFrontRate}
                                placeholder={tier.frontRate?.toString() || formData.frontEndPercentage?.toString()}
                                onChange={(val) => updateTier(tier.id, { usedFrontRate: val === '' ? undefined : parseFloat(val) })}
                                color="cyan"
                                suffix="%"
                                size="sm"
                                className="w-full"
                              />
                            </div>
                            <div className="w-[50px] shrink-0" />
                          </div>

                          <div className="flex items-center gap-4 w-full">
                            <div className="w-[60px] shrink-0 text-right">
                              <Typography variant="mono" className="text-[9px] text-purple-500 font-black uppercase tracking-widest">Back Rate</Typography>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <MatrixInputGroup 
                                value={tier.usedBackRate}
                                placeholder={tier.backRate?.toString() || formData.backEndPercentage?.toString()}
                                onChange={(val) => updateTier(tier.id, { usedBackRate: val === '' ? undefined : parseFloat(val) })}
                                color="purple"
                                suffix="%"
                                size="sm"
                                className="w-full"
                              />
                            </div>
                            <div className="w-[50px] shrink-0" />
                          </div>

                          <div className="w-full" />
                          <div />
                        </div>

                        {/* Row 3 — CPO */}
                        <div className="flex flex-col lg:grid lg:grid-cols-[210px_1fr_1fr_100px_48px] gap-8 items-center w-full">
                          <div className="flex items-center w-full justify-center lg:justify-start">
                            <Typography variant="mono" className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest pl-2">
                              CPO DEALS
                            </Typography>
                          </div>
                          
                          <div className="flex items-center gap-4 w-full">
                            <div className="w-[60px] shrink-0 text-right">
                              <Typography variant="mono" className="text-[9px] text-cyan-500 font-black uppercase tracking-widest">Front Rate</Typography>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <MatrixInputGroup 
                                value={tier.cpoFrontRate}
                                placeholder={tier.frontRate?.toString() || formData.frontEndPercentage?.toString()}
                                onChange={(val) => updateTier(tier.id, { cpoFrontRate: val === '' ? undefined : parseFloat(val) })}
                                color="cyan"
                                suffix="%"
                                size="sm"
                                className="w-full"
                              />
                            </div>
                            <div className="w-[50px] shrink-0" />
                          </div>

                          <div className="flex items-center gap-4 w-full">
                            <div className="w-[60px] shrink-0 text-right">
                              <Typography variant="mono" className="text-[9px] text-purple-500 font-black uppercase tracking-widest">Back Rate</Typography>
                            </div>
                            <div className="flex-1 min-w-[80px]">
                              <MatrixInputGroup 
                                value={tier.cpoBackRate}
                                placeholder={tier.backRate?.toString() || formData.backEndPercentage?.toString()}
                                onChange={(val) => updateTier(tier.id, { cpoBackRate: val === '' ? undefined : parseFloat(val) })}
                                color="purple"
                                suffix="%"
                                size="sm"
                                className="w-full"
                              />
                            </div>
                            <div className="w-[50px] shrink-0" />
                          </div>

                          <div className="w-full" />
                          <div />
                        </div>
                      </div>
                    )}

                    {hasError && (
                      <div className="mt-3 pt-2 border-t border-red-500/10 flex items-center gap-2 text-red-400 animate-in fade-in slide-in-from-top-1 duration-300">
                        <Typography variant="mono" className="text-[9px] uppercase tracking-wider font-bold">
                          {hasError}
                        </Typography>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center mt-6">
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={addTier} 
                className="border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 rounded-xl h-11 px-10 transition-all duration-300 border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Ladder Tier
              </Button>
            </div>
          </div>
        </MatrixSection>

        {/* StripeItVolumeBonusSystem - Volume Bonuses Section */}
        <MatrixSection
          id="volume_bonus"
          title="Volume Bonus"
          subtitle="Programmable Compensation"
          icon={<TrendingUp className="h-6 w-6" />}
          iconColor="purple-500"
          isActive={formData.isVolumeBonusEngineActive}
          onActiveChange={(active) => {
            handleChange('isVolumeBonusEngineActive', active);
            if (active && (!formData.volumeBonuses || formData.volumeBonuses.length === 0)) {
              addVolumeBonus();
            }
          }}
          isExpanded={expandedSections.volume_bonus}
          onToggle={() => toggleSection('volume_bonus')}
          summary={
            formData.isVolumeBonusEngineActive && (
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                  <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Active:</Typography>
                  <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">{(formData.volumeBonuses || []).filter(b => b.active).length}</Typography>
                </div>
                {isSimulationEngineEnabled && previewData.totalTierBonuses > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <Typography variant="mono" className="text-[10px] text-emerald-500 font-black uppercase">Earned:</Typography>
                    <Typography variant="mono" className="text-[10px] text-emerald-400 font-black">${previewData.totalTierBonuses.toLocaleString()}</Typography>
                  </div>
                )}
              </div>
            )
          }
        >
          <div className="space-y-6 animate-in fade-in duration-500">
            {formData.isVolumeBonusEngineActive && (
              <div className="space-y-4">
                {(formData.volumeBonuses || []).length > 0 ? (
                  <div className="space-y-4">
                    {(formData.volumeBonuses || []).map((bonus, index, array) => (
                      <VolumeBonusRow 
                        key={bonus.id}
                        bonus={bonus}
                        onUpdate={(updates) => updateVolumeBonus(bonus.id, updates)}
                        onRemove={() => removeVolumeBonus(bonus.id)}
                        previousThreshold={index > 0 ? array[index - 1].threshold : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <Card 
                    className="bg-[var(--color-bg-surface)] border-[var(--color-border)] p-12 rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors group"
                    onClick={addVolumeBonus}
                  >
                    <Settings2 className="h-12 w-12 text-slate-700 mb-4 group-hover:text-brand-primary transition-colors" />
                    <Typography className="text-slate-500 font-bold mb-2">No volume bonus records initialized.</Typography>
                    <Typography variant="small" className="text-slate-600 text-center max-w-sm">
                      Configure flat bonuses, cumulative stackers, or retroactive per-unit payouts to incentivize high-volume months.
                    </Typography>
                    <Button type="button" variant="ghost" className="text-brand-primary mt-6 font-black uppercase tracking-widest text-[10px]">
                      Initialize Now
                    </Button>
                  </Card>
                )}

                <div className="flex justify-center mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={addVolumeBonus} 
                    className="text-brand-primary h-10 px-6 hover:bg-brand-primary/5 rounded-xl border border-dashed border-brand-primary/20"
                  >
                    <Plus size={16} className="mr-2" /> Add Payout Row
                  </Button>
                </div>
              </div>
            )}
          </div>
        </MatrixSection>

        {/* Custom Unit Bonuses Section */}
        <MatrixSection
          id="custom_unit_bonus"
          title="Custom Unit Bonuses"
          subtitle="NAMED PER-UNIT INCENTIVES"
          isActive={formData.customUnitBonuses && formData.customUnitBonuses.some(b => b.active)}
          onActiveChange={(active) => {
            const updated = (formData.customUnitBonuses || []).map(b => ({ ...b, active }));
            handleChange('customUnitBonuses', updated);
          }}
          isExpanded={expandedSections.custom_unit_bonus}
          onToggle={() => toggleSection('custom_unit_bonus')}
          icon={<Calculator className="h-6 w-6" />}
          iconColor="cyan-500"
          summary={
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                <Typography variant="mono" className="text-[10px] text-text-muted font-black uppercase">Active:</Typography>
                <Typography variant="mono" className="text-[10px] text-text-primary font-black">{(formData.customUnitBonuses || []).filter(b => b.active).length}</Typography>
              </div>
            </div>
          }
        >
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4">
              {(formData.customUnitBonuses || []).length > 0 ? (
                <div className="space-y-4">
                  {(formData.customUnitBonuses || []).map((bonus) => (
                    <div 
                      key={bonus.id}
                      className={cn(
                        "group bg-[var(--color-bg-card)] border border-[var(--color-border)] p-4 md:p-5 rounded-2xl transition-all duration-300 relative",
                        !bonus.active ? "opacity-40 grayscale-[0.5]" : "hover:border-[var(--color-border)]"
                      )}
                    >
                      <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center">
                        {/* Label Name */}
                        <div className="flex-1 min-w-[200px]">
                          <Input
                            placeholder="e.g. Senior Bonus"
                            value={bonus.label}
                            onChange={(e) => updateCustomUnitBonus(bonus.id, { label: e.target.value })}
                            className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] font-bold text-text-primary"
                          />
                        </div>

                        {/* Threshold */}
                        <div className="flex items-center gap-3 min-w-[150px]">
                          <div className="w-[85px]">
                            <MatrixInputGroup 
                              value={bonus.threshold} 
                              onChange={(val) => updateCustomUnitBonus(bonus.id, { threshold: parseInt(val) || 0 })} 
                              size="sm"
                              placeholder="0"
                            />
                          </div>
                          <Typography variant="mono" className="text-[10px] font-black uppercase tracking-widest text-text-muted">Units</Typography>
                        </div>

                        {/* Amount Per Unit */}
                        <div className="flex items-center gap-3">
                           <Typography variant="mono" className="text-[9px] text-text-muted font-black uppercase tracking-widest">Payout</Typography>
                           <div className="w-[120px]">
                             <CurrencyInput
                               value={bonus.amountPerUnit}
                               onChange={(e) => updateCustomUnitBonus(bonus.id, { amountPerUnit: normalizeCurrencyNumber(e.target.value) })}
                               hideLabel
                               className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] font-black text-text-primary"
                             />
                           </div>
                           <Typography variant="mono" className="text-text-muted font-black tracking-widest text-[9px] mt-1">/ UNIT</Typography>
                        </div>

                        {/* Retroactive / Tier+ toggle */}
                        <div className="flex items-center gap-2">
                           <button
                             type="button"
                             onClick={() => updateCustomUnitBonus(bonus.id, { isRetroactive: !bonus.isRetroactive })}
                             className={cn(
                               "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                               bonus.isRetroactive 
                                 ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" 
                                 : "bg-[var(--color-bg-elevated)] text-text-muted border-[var(--color-border)] hover:border-[var(--color-border)] hover:text-text-secondary"
                             )}
                           >
                             {bonus.isRetroactive ? 'RETRO' : 'TIER+'}
                           </button>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-4 shrink-0 lg:ml-auto self-end lg:self-center">
                          <ActiveChip 
                            active={bonus.active} 
                            onClick={() => updateCustomUnitBonus(bonus.id, { active: !bonus.active })} 
                          />
                          
                          {pendingDeleteCustomBonusId === bonus.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  removeCustomUnitBonus(bonus.id);
                                  setPendingDeleteCustomBonusId(null);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider"
                              >
                                CONFIRM
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteCustomBonusId(null)}
                                className="bg-slate-700 hover:bg-slate-600 text-text-muted font-black text-[9px] px-2.5 py-1 rounded-lg uppercase tracking-wider"
                              >
                                CANCEL
                              </button>
                            </div>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => setPendingDeleteCustomBonusId(bonus.id)} 
                              className="text-red-500/30 hover:text-red-400 transition-all p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Card 
                  className="bg-[var(--color-bg-surface)] border-[var(--color-border)] p-12 rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--color-bg-elevated)] transition-colors group"
                  onClick={addCustomUnitBonus}
                >
                  <Settings2 className="h-12 w-12 text-text-muted mb-4 group-hover:text-brand-primary transition-colors" />
                  <Typography className="text-text-muted font-bold mb-2">No custom unit bonuses initialized.</Typography>
                  <Typography variant="small" className="text-text-muted text-center max-w-sm">
                    Configure separate named per-unit incentives (e.g. Senior Bonus) with thresholds, rates, and retroactive calculation.
                  </Typography>
                  <Button type="button" variant="ghost" className="text-brand-primary mt-6 font-black uppercase tracking-widest text-[10px]">
                    Initialize Now
                  </Button>
                </Card>
              )}

              <div className="flex justify-center mt-6">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={addCustomUnitBonus} 
                  className="text-brand-primary h-10 px-6 hover:bg-brand-primary/5 rounded-xl border border-dashed border-brand-primary/20"
                >
                  <Plus size={16} className="mr-2" /> Add Custom Bonus
                </Button>
              </div>
            </div>
          </div>
        </MatrixSection>

        {/* Logic Rules & Exceptions Section */}
        <MatrixSection
          id="rules"
          title="Rules & Overrides"
          subtitle="Custom Bonus Logic"
          icon={<Zap className="h-6 w-6" />}
          iconColor="amber-500"
          isActive={formData.isRulesEnabled}
          onActiveChange={(active) => handleChange('isRulesEnabled', active)}
          isExpanded={expandedSections.rules}
          onToggle={() => toggleSection('rules')}
          summary={
            formData.isRulesEnabled && (
              <div className="px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">{formData.rules.length} Rules</Typography>
              </div>
            )
          }
        >
          <div className="space-y-6 animate-in fade-in duration-500">
            {formData.isRulesEnabled && (
              <div className="space-y-6">
                {/* StripeItFrontDeficitRecoverySystem - Recovery Toggle */}
                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-5 md:p-6 rounded-2xl transition-all duration-300">
                  <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <Typography variant="h3" className="text-[var(--color-text-primary)] text-lg font-black tracking-tight">Front Deficit Recovery</Typography>
                        <Typography variant="mono" className="text-slate-600 text-[9px] uppercase tracking-widest mt-1">
                          When enabled, negative front commission deficits must be recovered before backend commission becomes payable.
                        </Typography>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <ActiveChip 
                        active={formData.frontDeficitRecoveryEnabled} 
                        onClick={() => handleChange('frontDeficitRecoveryEnabled', !formData.frontDeficitRecoveryEnabled)} 
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {formData.rules.map((rule) => (
                    <div key={rule.id} className="group bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-5 md:p-6 rounded-2xl transition-all duration-300">
                      <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center">
                        <div className="flex-1 lg:max-w-md w-full">
                          <Input 
                            placeholder="Rule Name (e.g. Sales Trainee Bonus)" 
                            value={rule.name}
                            onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                            className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] font-bold text-[var(--color-text-primary)]"
                          />
                        </div>
                        
                        <div className="flex-1 flex flex-wrap items-center gap-6">
                          <div className="flex items-center gap-3">
                            <Typography variant="mono" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">IF</Typography>
                            <div className="w-[180px]">
                              <Select 
                                options={[
                                  { value: 'front_end_gross', label: 'Front End Gross' },
                                  { value: 'back_end_gross', label: 'Back End Gross' },
                                  { value: 'total_gross', label: 'Total Gross' },
                                ]}
                                value={rule.condition}
                                onChange={(e) => updateRule(rule.id, { condition: e.target.value as any })}
                                className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Typography variant="mono" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">EXCEEDS</Typography>
                            <div className="w-[120px]">
                              <CurrencyInput 
                                value={rule.threshold}
                                onChange={(e) => updateRule(rule.id, { threshold: normalizeCurrencyNumber(e.target.value) })}
                                hideLabel
                                className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Typography variant="mono" className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">PAY</Typography>
                            <div className="w-[120px]">
                              <CurrencyInput 
                                value={rule.rewardValue}
                                onChange={(e) => updateRule(rule.id, { rewardValue: normalizeCurrencyNumber(e.target.value) })}
                                hideLabel
                                className="h-10 bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0 self-end lg:self-center">
                          <ActiveChip active={rule.active} onClick={() => updateRule(rule.id, { active: !rule.active })} />
                          <button type="button" onClick={() => removeRule(rule.id)} className="text-red-500/30 hover:text-red-400 transition-all p-2">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.rules.length === 0 && (
                    <div className="py-12 border border-dashed border-[var(--color-border)] rounded-2xl flex flex-col items-center justify-center bg-[var(--color-bg-surface)]">
                      <Zap className="h-10 w-10 text-slate-800 mb-3" />
                      <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest">No Active Exceptions</Typography>
                      <Typography variant="small" className="text-[11px] text-slate-600 mt-2">Rules can override standard ladder logic based on deal attributes.</Typography>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={addRule} 
                    className="text-amber-500 h-10 px-6 hover:bg-amber-500/5 rounded-xl border border-dashed border-amber-500/20"
                  >
                    <Plus size={16} className="mr-2" /> Add New Rule
                  </Button>
                </div>
              </div>
            )}
          </div>
        </MatrixSection>

        {/* Global Defaults Section */}
        <MatrixSection
          id="misc_defaults"
          title="Miscellaneous Defaults"
          subtitle="General Behavior Settings"
          icon={<Settings2 className="h-6 w-6" />}
          iconColor="slate-500"
          isExpanded={expandedSections.misc_defaults}
          onToggle={() => toggleSection('misc_defaults')}
          summary={
            <div className="flex items-center gap-4">
              {formData.isFlatPerUnitActive && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                  <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Flat:</Typography>
                  <Typography variant="mono" className="text-[10px] text-[var(--color-text-primary)] font-black">${formData.flatPerUnitAmount.toLocaleString()}</Typography>
                </div>
              )}
            </div>
          }
        >
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* Flat Per Unit Refinement */}
            <Card className={cn(
              "bg-[var(--color-bg-surface)] border-[var(--color-border)] p-8 rounded-[2rem] transition-all duration-300",
              !formData.isFlatPerUnitActive && "opacity-40 grayscale-[0.5]"
            )}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20 text-slate-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="h3" className="text-[var(--color-text-primary)] text-lg font-black uppercase tracking-tight">Flat Per Unit</Typography>
                    <Typography variant="mono" className="text-slate-600 text-[9px] uppercase tracking-widest mt-1">
                      Fixed amount paid per unit sold, regardless of gross profit.
                    </Typography>
                  </div>
                </div>
                <ActiveChip 
                  active={formData.isFlatPerUnitActive} 
                  onClick={() => handleChange('isFlatPerUnitActive', !formData.isFlatPerUnitActive)} 
                />
              </div>

              <div className="max-w-md">
                <CurrencyInput 
                  label="Flat Amount" 
                  value={formData.flatPerUnitAmount}
                  onChange={(e) => handleNumeric('flatPerUnitAmount', e.target.value)}
                  hideLabel
                  className="h-12 w-full max-w-[180px] bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                />
              </div>
            </Card>

            {/* Split Behavior Refinement */}
            <Card className={cn(
              "bg-[var(--color-bg-surface)] border-[var(--color-border)] p-8 rounded-[2rem] transition-all duration-300",
              !formData.isSplitBehaviorActive && "opacity-40 grayscale-[0.5]"
            )}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20 text-slate-500">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="h3" className="text-[var(--color-text-primary)] text-lg font-black uppercase tracking-tight">Split Behavior</Typography>
                    <Typography variant="mono" className="text-slate-600 text-[9px] uppercase tracking-widest mt-1">
                      How commission is split when multiple salespeople are involved.
                    </Typography>
                  </div>
                </div>
                <ActiveChip 
                  active={formData.isSplitBehaviorActive} 
                  onClick={() => handleChange('isSplitBehaviorActive', !formData.isSplitBehaviorActive)} 
                />
              </div>

              <div className="max-w-md">
                <Select 
                  options={[
                    { value: 'standard', label: 'Standard Proportion (50%)' },
                    { value: 'half_mini', label: 'Half the Mini' },
                  ]}
                  value={formData.splitDealBehavior}
                  onChange={(e) => handleChange('splitDealBehavior', e.target.value)}
                  className="h-12 w-full max-w-[320px] bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                />
              </div>
            </Card>

            {/* Pack Deduction Card */}
            <Card className={cn(
              "bg-[var(--color-bg-surface)] border-[var(--color-border)] p-8 rounded-[2rem] transition-all duration-300",
              !formData.isPackActive && "opacity-40 grayscale-[0.5]"
            )}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20 text-slate-500">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="h3" className="text-[var(--color-text-primary)] text-lg font-black uppercase tracking-tight">Pack Deduction</Typography>
                    <Typography variant="mono" className="text-slate-600 text-[9px] uppercase tracking-widest mt-1">
                      Fixed cost deducted from gross before commission is calculated
                    </Typography>
                  </div>
                </div>
                <ActiveChip 
                  active={formData.isPackActive} 
                  onClick={() => handleChange('isPackActive', !formData.isPackActive)} 
                />
              </div>

              {formData.isPackActive && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300 max-w-xl">
                  <CurrencyInput 
                    label="Front Pack" 
                    value={formData.frontPack}
                    onChange={(e) => handleNumeric('frontPack', e.target.value)}
                    labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
                    className="h-12 w-full bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                  />
                  <CurrencyInput 
                    label="Back Pack" 
                    value={formData.backPack}
                    onChange={(e) => handleNumeric('backPack', e.target.value)}
                    labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
                    className="h-12 w-full bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)]"
                  />
                </div>
              )}
            </Card>
          </div>
        </MatrixSection>
      </div>

      <div className="pt-10">
        <Button 
          type="submit" 
          className="w-full h-20 text-xl bg-brand-primary text-bg-deep font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(34,211,238,0.2)] hover:shadow-[0_20px_70px_rgba(34,211,238,0.3)] transition-all rounded-3xl group" 
          isLoading={isLoading} 
          disabled={isLoading}
        >
          <ShieldCheck className="mr-3 h-8 w-8 group-hover:scale-110 transition-transform" />
          Lock Payplan
        </Button>
      </div>

      {/* Import Confirmation Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Confirm Plan Import"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <AlertTriangle className="h-6 w-6 shrink-0" />
            <Typography variant="small" className="font-bold">
              Warning: Importing this CSV will overwrite all current unsaved changes in the Commission Architect.
            </Typography>
          </div>

          {importErrors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <Typography variant="mono" className="text-[10px] text-red-500 font-bold uppercase mb-2">Structure Warnings:</Typography>
              <ul className="list-disc list-inside space-y-1">
                {importErrors.map((err, i) => (
                  <li key={i} className="text-red-400/80 text-xs">{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-1">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Plan Name</Typography>
                <Typography variant="h4" className="text-[var(--color-text-primary)] text-base">{importPreview?.name || 'Untitled'}</Typography>
             </div>
             <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-1">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Tiers Detected</Typography>
                <Typography variant="h4" className="text-[var(--color-text-primary)] text-base">{importPreview?.tiers?.length || 0} Levels</Typography>
             </div>
             <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-1">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Bonuses</Typography>
                <Typography variant="h4" className="text-[var(--color-text-primary)] text-base">{importPreview?.volumeBonuses?.length || 0} Records</Typography>
             </div>
             <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] space-y-1">
                <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Version</Typography>
                <Typography variant="h4" className="text-[var(--color-text-primary)] text-base">{importPreview?.schemaVersion || '1.0'}</Typography>
             </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-2xl h-11 border-white/10 hover:bg-white/5 text-slate-400"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-2xl h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              onClick={confirmImport}
              disabled={importErrors.length > 0}
            >
              Apply Imported Plan
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
};
