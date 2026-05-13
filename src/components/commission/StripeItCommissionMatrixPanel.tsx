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
  MiniLadderTier,
  CustomMini,
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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculatePeriodEarnings, getActiveCommissionTier, getActiveMiniTier } from '@/src/lib/commissionLogic';
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
            <Typography variant="h3" className="text-white text-xl group-hover/header:text-brand-primary transition-colors">{title}</Typography>
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
                "p-2 rounded-xl bg-white/[0.02] border border-white/5 text-slate-500 hover:text-white transition-all shrink-0",
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
      "group bg-[#0A0C12] border border-white/5 p-4 md:p-5 rounded-2xl transition-all duration-300 relative",
      !bonus.active ? "opacity-40 grayscale-[0.5]" : "hover:border-white/10",
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
                 className="h-10 bg-black/40 border-white/5 font-black text-white"
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
              className="h-10 bg-black/40 border-white/5 w-[130px] font-black text-[10px] uppercase"
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
              className="h-10 bg-black/40 border-white/5 w-[110px] font-black text-[10px] uppercase"
            />
          </div>

          <div className="flex items-center gap-2">
            {isRetro && (
               <button
                 type="button"
                 onClick={() => onUpdate({ scope: bonus.scope === VolumeBonusScope.ALL_UNITS ? VolumeBonusScope.THRESHOLD_PLUS : VolumeBonusScope.ALL_UNITS })}
                 className={cn(
                   "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                   bonus.scope === VolumeBonusScope.ALL_UNITS ? "bg-purple-500/20 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]" : "bg-white/[0.02] text-slate-700 border-white/5 hover:border-white/10 hover:text-slate-500"
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
        <div className="mt-3 pt-3 border-t border-white/[0.03]">
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
    neutral: "bg-[#050608] border-white/5 text-white focus:border-white/20",
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
            isInfinite && "text-slate-500 bg-white/[0.02] border-white/[0.03] cursor-default",
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
  const { deals, triggerError } = useAppData();
  const isSimulationEngineEnabled = false;

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
    isRulesEnabled: initialData?.rules && initialData.rules.length > 0 ? true : false,
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
    hourlyConfig: initialData?.hourlyConfig || {
      active: true,
      rate: 15,
      hoursWorked: 160,
      model: HourlyPayoutModel.GUARANTEE
    } as HourlyConfig
  });

  // Simulation State System
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

  const simulatedDeals = useMemo(() => {
    if (!isSimulationEngineEnabled) return [];
    const deals: Deal[] = [];
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

      deals.push({
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
    return deals;
  }, [simulationData]);

  const simEarnings = useMemo(() => {
    if (!isSimulationEngineEnabled) {
      return {
        totalPayout: 0,
        totalTierBonuses: 0,
        grandTotal: 0,
        dealResults: [],
        tierBonuses: [],
        hourlyCompensation: null
      };
    }
    return calculatePeriodEarnings(simulatedDeals, formData as PayPlan);
  }, [simulatedDeals, formData, isSimulationEngineEnabled]);

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

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    minis_hourly: false,
    commission_matrix: false,
    volume_bonus: false,
    rules: false,
    misc_defaults: false,
    sim_settings: false,
    sim_ladder: false,
    sim_minis: false,
    sim_bonus: false
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const actualId = sectionId === 'commission_ladder' ? 'commission_matrix' : sectionId;
      return { ...prev, [actualId]: !prev[actualId] };
    });
  };

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
      const maxThreshold = bonuses.length > 0 ? Math.max(...bonuses.map(b => b.threshold)) : 5;
      
      const newBonus: VolumeBonus = {
        id: crypto.randomUUID(),
        threshold: bonuses.length > 0 ? maxThreshold + 5 : 10,
        amount: 500,
        type: VolumeBonusType.FLAT,
        scope: VolumeBonusScope.ALL_UNITS,
        filter: VolumeBonusFilter.ANY,
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
      bonusAmount: Number(r.bonusAmount) || 0
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
        active: formData.hourlyConfig?.active ?? false
      },
      frontDeficitRecoveryEnabled: formData.frontDeficitRecoveryEnabled
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
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                    <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">New:</Typography>
                    <Typography variant="mono" className="text-[10px] text-white font-black">
                      ${activeMiniTier?.newMini ?? formData.miniTiers[0]?.newMini ?? 0}
                    </Typography>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                    <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Used:</Typography>
                    <Typography variant="mono" className="text-[10px] text-white font-black">
                      ${activeMiniTier?.usedMini ?? formData.miniTiers[0]?.usedMini ?? 0}
                    </Typography>
                  </div>
                </>
              )}
              {formData.isHourlyActive && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                  <Typography variant="mono" className="text-[10px] text-slate-400 font-black uppercase">Hourly</Typography>
                  <Typography variant="mono" className="text-[10px] text-white font-black">${formData.hourlyConfig.rate}/hr</Typography>
                </div>
              )}
            </div>
          }
        >
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Mini Ladder Subsection */}
            <Card className="bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem]">
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
                            "group bg-white/[0.02] border border-white/5 p-4 md:p-5 rounded-2xl transition-all duration-300",
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
                                    tier.isRetroactive ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : "bg-white/[0.02] text-slate-700 border-white/5 hover:border-white/10 hover:text-slate-500"
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
                      <MatrixInputGroup 
                        value={formData.hourlyConfig.hoursWorked} 
                        onChange={(val) => handleChange('hourlyConfig', { ...formData.hourlyConfig, hoursWorked: parseInt(val) || 0 })}
                        size="sm"
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
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Front:</Typography>
                <Typography variant="mono" className="text-[10px] text-white font-black">
                  {activeTier?.frontRate ?? formData.tiers[0]?.frontRate ?? 0}%
                </Typography>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Back:</Typography>
                <Typography variant="mono" className="text-[10px] text-white font-black">
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
                      "group bg-[#0A0C12] border border-white/5 p-4 md:p-5 rounded-2xl transition-all duration-300 relative",
                      hasError ? "ring-1 ring-red-500/30 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.05)]" : "hover:border-white/10"
                    )}
                  >
                    <div className="flex flex-col lg:grid lg:grid-cols-[210px_1fr_1fr_48px] gap-8 items-center w-full">
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

                      {/* Controls - Column 4 (Fixed 48px) */}
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
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                  <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Active:</Typography>
                  <Typography variant="mono" className="text-[10px] text-white font-black">{(formData.volumeBonuses || []).filter(b => b.active).length}</Typography>
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
                    className="bg-[#0A0C12]/50 border-white/5 p-12 rounded-[2rem] border-dashed border-2 flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-colors group"
                    onClick={addVolumeBonus}
                  >
                    <Settings2 className="h-12 w-12 text-slate-700 mb-4 group-hover:text-brand-primary transition-colors" />
                    <Typography className="text-slate-500 font-bold mb-2">No volume bonus records initialized.</Typography>
                    <Typography variant="small" className="text-slate-600 text-center max-w-sm">
                      Configure flat bonuses, cumulative stackers, or retroactive per-unit payouts to incentivize high-volume months.
                    </Typography>
                    <Button type="button" variant="link" className="text-brand-primary mt-6 font-black uppercase tracking-widest text-[10px]">
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
              <div className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                <Typography variant="mono" className="text-[10px] text-white font-black">{formData.rules.length} Rules</Typography>
              </div>
            )
          }
        >
          <div className="space-y-6 animate-in fade-in duration-500">
            {formData.isRulesEnabled && (
              <div className="space-y-6">
                {/* StripeItFrontDeficitRecoverySystem - Recovery Toggle */}
                <div className="bg-white/[0.01] border border-white/5 p-5 md:p-6 rounded-2xl transition-all duration-300">
                  <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <Typography variant="h3" className="text-white text-lg font-black uppercase tracking-tight">Front Deficit Recovery</Typography>
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
                    <div key={rule.id} className="group bg-white/[0.01] border border-white/5 p-5 md:p-6 rounded-2xl transition-all duration-300">
                      <div className="flex flex-col lg:flex-row gap-5 items-start lg:items-center">
                        <div className="flex-1 lg:max-w-md w-full">
                          <Input 
                            placeholder="Rule Name (e.g. Sales Trainee Bonus)" 
                            value={rule.name}
                            onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                            className="h-10 bg-black/40 border-white/5 font-bold"
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
                                className="h-10 bg-black/40 border-white/5"
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
                                className="h-10 bg-black/40 border-white/5"
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
                                className="h-10 bg-black/40 border-white/5"
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
                    <div className="py-12 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01]">
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
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                  <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase">Flat:</Typography>
                  <Typography variant="mono" className="text-[10px] text-white font-black">${formData.flatPerUnitAmount.toLocaleString()}</Typography>
                </div>
              )}
            </div>
          }
        >
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* Flat Per Unit Refinement */}
            <Card className={cn(
              "bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem] transition-all duration-300",
              !formData.isFlatPerUnitActive && "opacity-40 grayscale-[0.5]"
            )}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20 text-slate-500">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="h3" className="text-white text-lg font-black uppercase tracking-tight">Flat Per Unit</Typography>
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
                  className="h-12 w-full max-w-[180px]"
                />
              </div>
            </Card>

            {/* Split Behavior Refinement */}
            <Card className={cn(
              "bg-[#0A0C12]/50 border-white/5 p-8 rounded-[2rem] transition-all duration-300",
              !formData.isSplitBehaviorActive && "opacity-40 grayscale-[0.5]"
            )}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20 text-slate-500">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <Typography variant="h3" className="text-white text-lg font-black uppercase tracking-tight">Split Behavior</Typography>
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
                  className="h-12 w-full max-w-[320px]"
                />
              </div>
            </Card>
          </div>
        </MatrixSection>

        {/* Adaptive Simulation Engine */}
        {isSimulationEngineEnabled && (
          <div className="space-y-4 pt-12">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <Typography variant="h3" className="text-white text-xl">Simulation Engine</Typography>
                <Typography variant="mono" className="text-slate-500 uppercase tracking-widest text-[9px]">Model Monthly Payout Scenarios</Typography>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5">
                 <Typography variant="mono" className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Presets:</Typography>
                 <div className="flex items-center gap-1.5">
                   {savedScenarios.map((s, idx) => (
                     <button
                       key={s.id || idx}
                       type="button"
                       onClick={() => loadScenario(s)}
                       className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 hover:text-white transition-colors"
                     >
                       {s.name}
                     </button>
                   ))}
                   <button
                     type="button"
                     onClick={saveScenario}
                     className="px-2 py-1 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-[9px] font-black text-brand-primary hover:bg-brand-primary/20 transition-colors"
                   >
                     SAVE CURRENT
                   </button>
                 </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#0A0C12]/80 border-cyan-500/20 p-6 rounded-[2rem] border-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp size={48} className="text-cyan-500" />
              </div>
              <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Final Estimated Total</Typography>
              <div className="flex items-baseline gap-2">
                <Typography variant="h1" className="text-4xl font-black text-white">${Math.round(simEarnings.grandTotal).toLocaleString()}</Typography>
                <Typography variant="mono" className="text-emerald-500 text-[10px] font-bold">EST</Typography>
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-col">
                  <Typography variant="mono" className="text-[8px] text-slate-600 uppercase">Per Unit Avg</Typography>
                  <Typography variant="mono" className="text-xs text-white font-black">${Math.round(simEarnings.grandTotal / (simulationData.totalUnits || 1)).toLocaleString()}</Typography>
                </div>
                {simulationData.frontGrossTotal + simulationData.backGrossTotal > 0 && (
                  <div className="flex flex-col items-end">
                    <Typography variant="mono" className="text-[8px] text-slate-600 uppercase">Gross %</Typography>
                    <Typography variant="mono" className="text-xs text-brand-primary font-black">
                      {((simEarnings.grandTotal / (simulationData.frontGrossTotal + simulationData.backGrossTotal)) * 100).toFixed(1)}%
                    </Typography>
                  </div>
                )}
              </div>
            </Card>

            <Card className="bg-[#0A0C12]/80 border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all">
              <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Deal Payouts</Typography>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="mono" className="text-[10px] text-slate-600">Commission:</Typography>
                  <Typography variant="mono" className="text-xs text-white font-black">${Math.round(simEarnings.totalPayout).toLocaleString()}</Typography>
                </div>
                <div className="flex items-center justify-between">
                  <Typography variant="mono" className="text-[10px] text-slate-600">Avg / Deal:</Typography>
                  <Typography variant="mono" className="text-xs text-slate-400 font-black">${Math.round(simEarnings.totalPayout / (simulationData.totalUnits || 1)).toLocaleString()}</Typography>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                  <Typography variant="mono" className="text-[10px] text-slate-600">Minis Hit:</Typography>
                  <Typography variant="mono" className="text-xs text-brand-primary font-black">{simEarnings.dealResults.filter(r => r.isMini).length}</Typography>
                </div>
              </div>
            </Card>

            <Card className="bg-[#0A0C12]/80 border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all">
              <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Bonus Rewards</Typography>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="mono" className="text-[10px] text-slate-600">Volume Bonus:</Typography>
                  <Typography variant="mono" className="text-xs text-emerald-400 font-black">+${Math.round(simEarnings.totalTierBonuses).toLocaleString()}</Typography>
                </div>
                <div className="flex items-center justify-between">
                  <Typography variant="mono" className="text-[10px] text-slate-600">Custom Rules:</Typography>
                  <Typography variant="mono" className="text-xs text-emerald-400 font-black">+${Math.round(simEarnings.dealResults.reduce((sum, r) => sum + r.ruleBonuses, 0)).toLocaleString()}</Typography>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                  <Typography variant="mono" className="text-[10px] text-slate-600">Total Bonuses:</Typography>
                  <Typography variant="mono" className="text-xs text-white font-black">${Math.round(simEarnings.totalTierBonuses + simEarnings.dealResults.reduce((sum, r) => sum + r.ruleBonuses, 0)).toLocaleString()}</Typography>
                </div>
              </div>
            </Card>

            <Card className="bg-[#0A0C12]/80 border-white/5 p-6 rounded-[2rem] hover:border-white/10 transition-all">
              <Typography variant="mono" className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4">Hourly & Draws</Typography>
              {simEarnings.hourlyCompensation ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Typography variant="mono" className="text-[10px] text-slate-600">Monthly Total:</Typography>
                    <Typography variant="mono" className="text-xs text-white font-black">${Math.round(simEarnings.hourlyCompensation.hourlyTotal).toLocaleString()}</Typography>
                  </div>
                  <div className="flex items-center justify-between">
                    <Typography variant="mono" className="text-[10px] text-slate-600">Adjustment:</Typography>
                    <Typography variant="mono" className="text-xs text-amber-500 font-black">
                      {simEarnings.hourlyCompensation.adjustment > 0 ? `+$${Math.round(simEarnings.hourlyCompensation.adjustment).toLocaleString()}` : '$0'}
                    </Typography>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
                    <Typography variant="mono" className="text-[10px] text-slate-600">Model:</Typography>
                    <Typography variant="mono" className="text-[9px] text-slate-400 font-black uppercase">{simEarnings.hourlyCompensation.model}</Typography>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-40">
                  <Typography variant="mono" className="text-[8px] text-slate-700 uppercase font-black">Inactive</Typography>
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              {/* General Month Simulation Section */}
              <MatrixSection
                id="sim_settings"
                title="Simulation Configuration"
                subtitle="General Month Inputs"
                icon={<Settings2 size={24} />}
                isExpanded={expandedSections.sim_settings}
                onToggle={() => toggleSection('sim_settings')}
                className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8"
                summary={
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                      <Typography variant="mono" className="text-[10px] text-white font-black">{simulationData.totalUnits} Units</Typography>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                      <Typography variant="mono" className="text-[10px] text-white font-black">${simulationData.frontGrossTotal.toLocaleString()} FG</Typography>
                    </div>
                  </div>
                }
              >
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Month Identity</Typography>
                      <Input 
                        value={simulationData.name}
                        onChange={(e) => setSimulationData(p => ({ ...p, name: e.target.value }))}
                        className="h-12 bg-black/40 border-white/5 font-black text-lg"
                        placeholder="Scenario Name (e.g. Dream Month)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Total Units</Typography>
                        <MatrixInputGroup 
                          value={simulationData.totalUnits}
                          onChange={(val) => setSimulationData(p => ({ ...p, totalUnits: parseInt(val) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Split Ratio</Typography>
                        <MatrixInputGroup 
                          value={simulationData.splitDeals}
                          onChange={(val) => setSimulationData(p => ({ ...p, splitDeals: parseInt(val) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <CurrencyInput 
                      label="Monthly Front Gross" 
                      value={simulationData.frontGrossTotal}
                      onChange={(e) => setSimulationData(p => ({ ...p, frontGrossTotal: normalizeCurrencyNumber(e.target.value) }))}
                      labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
                      className="h-12"
                    />
                    <CurrencyInput 
                      label="Monthly Back Gross" 
                      value={simulationData.backGrossTotal}
                      onChange={(e) => setSimulationData(p => ({ ...p, backGrossTotal: normalizeCurrencyNumber(e.target.value) }))}
                      labelClassName="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black mb-3 block"
                      className="h-12"
                    />
                  </div>

                  {/* Adaptive Unit Mix */}
                  <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <Typography variant="mono" className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Deal Mix Allocation</Typography>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          simulationData.newUnits + simulationData.usedUnits + simulationData.cpoUnits === simulationData.totalUnits ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <Typography variant="mono" className="text-[10px] text-white font-black">
                          {simulationData.newUnits + simulationData.usedUnits + simulationData.cpoUnits} / {simulationData.totalUnits}
                        </Typography>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <Typography variant="mono" className="text-[9px] text-cyan-500 font-black uppercase">New Deals</Typography>
                        <MatrixInputGroup 
                          value={simulationData.newUnits}
                          onChange={(val) => setSimulationData(p => ({ ...p, newUnits: parseInt(val) || 0 }))}
                          color="cyan"
                        />
                      </div>
                      <div className="space-y-4">
                        <Typography variant="mono" className="text-[9px] text-purple-500 font-black uppercase">Used Deals</Typography>
                        <MatrixInputGroup 
                          value={simulationData.usedUnits}
                          onChange={(val) => setSimulationData(p => ({ ...p, usedUnits: parseInt(val) || 0 }))}
                          color="purple"
                        />
                      </div>
                      <div className="space-y-4">
                        <Typography variant="mono" className="text-[9px] text-emerald-500 font-black uppercase">CPO Deals</Typography>
                        <MatrixInputGroup 
                          value={simulationData.cpoUnits}
                          onChange={(val) => setSimulationData(p => ({ ...p, cpoUnits: parseInt(val) || 0 }))}
                          color="neutral"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </MatrixSection>

              {/* Commission Matrix Simulation */}
              {formData.isAdvanced && (
                <MatrixSection
                  id="sim_ladder"
                  title="Commission Matrix Simulation"
                  subtitle="Unit Tier & Rate Progression"
                  icon={<TrendingUp size={24} />}
                  isExpanded={expandedSections.sim_ladder}
                  onToggle={() => toggleSection('sim_ladder')}
                  className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8"
                  summary={
                    <div className="flex items-center gap-2">
                       <Typography variant="mono" className="text-[10px] text-cyan-400 font-black">Tier {formData.tiers.findIndex(t => t.id === getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.id) + 1}</Typography>
                       <div className="h-1 w-8 rounded-full bg-white/5 overflow-hidden">
                         <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, (simulationData.totalUnits / (getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.maxUnits || 1)) * 100)}%` }} />
                       </div>
                    </div>
                  }
                >
                  <div className="animate-in fade-in duration-500">
                    <Card className="bg-black/20 border-white/5 p-8 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <div>
                             <Typography variant="mono" className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1 block">Active Strategy</Typography>
                             <Typography variant="h2" className="text-white font-black uppercase">
                               TIER {formData.tiers.findIndex(t => t.id === getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.id) + 1} ARCHITECTURE
                             </Typography>
                           </div>
                           <div className="space-y-4">
                             <div className="flex justify-between items-center">
                               <span className="text-slate-500 text-sm">Front End Rate:</span>
                               <span className="text-white font-bold">{getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.frontRate}%</span>
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-slate-500 text-sm">Back End Rate:</span>
                               <span className="text-white font-bold">{getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.backRate}%</span>
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-slate-500 text-sm">Retroactive Application:</span>
                               <span className={cn("font-bold text-[10px]", getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.frontRetroactive ? "text-emerald-400" : "text-slate-600")}>
                                 {getActiveCommissionTier(simulationData.totalUnits, formData.tiers)?.frontRetroactive ? "ENABLED" : "INACTIVE"}
                               </span>
                             </div>
                           </div>
                        </div>
                        <div className="flex flex-col justify-center items-center md:items-end border-l border-white/5 pl-12">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-2">Simulated Payout</Typography>
                          <Typography variant="h1" className="text-5xl font-black text-white">${Math.round(simEarnings.totalPayout).toLocaleString()}</Typography>
                          <Typography variant="small" className="text-slate-600 mt-2 text-right">Excluding bonuses & minis</Typography>
                        </div>
                      </div>
                    </Card>
                  </div>
                </MatrixSection>
              )}

              {/* Mini Ladder Simulation */}
              {formData.isMinisActive && (
                <MatrixSection
                  id="sim_minis"
                  title="Minis & Protection Simulation"
                  subtitle="Unit Range Payout Details"
                  icon={<ShieldCheck size={24} />}
                  isExpanded={expandedSections.sim_minis}
                  onToggle={() => toggleSection('sim_minis')}
                  className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8"
                  summary={
                    <div className="flex items-center gap-2">
                       <Typography variant="mono" className="text-[10px] text-emerald-400 font-black">
                         ${getActiveMiniTier(simulationData.totalUnits, formData.miniTiers)?.newMini} / ${getActiveMiniTier(simulationData.totalUnits, formData.miniTiers)?.usedMini}
                       </Typography>
                    </div>
                  }
                >
                  <div className="animate-in fade-in duration-500">
                    <Card className="bg-black/20 border-white/5 p-8 rounded-2xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <div>
                             <Typography variant="mono" className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1 block">Mini Profile</Typography>
                             <Typography variant="h2" className="text-white font-black uppercase">
                               RANGE {formData.miniTiers.findIndex(t => t.id === getActiveMiniTier(simulationData.totalUnits, formData.miniTiers)?.id) + 1} METRICS
                             </Typography>
                           </div>
                           <div className="space-y-4">
                             <div className="flex justify-between items-center">
                               <span className="text-slate-500 text-sm">New Deal Mini:</span>
                               <span className="text-white font-bold">${getActiveMiniTier(simulationData.totalUnits, formData.miniTiers)?.newMini}</span>
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-slate-500 text-sm">Used Deal Mini:</span>
                               <span className="text-white font-bold">${getActiveMiniTier(simulationData.totalUnits, formData.miniTiers)?.usedMini}</span>
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="text-slate-500 text-sm">Unit Threshold:</span>
                               <span className="text-white font-bold">{getActiveMiniTier(simulationData.totalUnits, formData.miniTiers)?.threshold}+ Units</span>
                             </div>
                           </div>
                        </div>
                        <div className="flex flex-col justify-center items-center md:items-end border-l border-white/5 pl-12">
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-2">Simulated Mini Capture</Typography>
                          <Typography variant="h1" className="text-5xl font-black text-white">{simEarnings.dealResults.filter(r => r.isMini).length}</Typography>
                          <Typography variant="small" className="text-slate-600 mt-2 text-right">Deals hitting mini floor</Typography>
                        </div>
                      </div>
                    </Card>
                  </div>
                </MatrixSection>
              )}

              {/* Bonus Simulation Details */}
              {(formData.isVolumeBonusEngineActive || formData.isRulesEnabled) && (
                <MatrixSection
                  id="sim_bonus"
                  title="Bonus & Rule Engine"
                  subtitle="Simulated Reward Triggers"
                  icon={<Zap size={24} />}
                  isExpanded={expandedSections.sim_bonus}
                  onToggle={() => toggleSection('sim_bonus')}
                  className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8"
                  summary={
                    <div className="flex items-center gap-2">
                      <Typography variant="mono" className="text-[10px] text-emerald-400 font-black">
                        ${Math.round(simEarnings.totalTierBonuses + simEarnings.dealResults.reduce((sum, r) => sum + r.ruleBonuses, 0)).toLocaleString()} Total
                      </Typography>
                    </div>
                  }
                >
                  <div className="space-y-6 animate-in fade-in duration-500">
                    {simEarnings.tierBonuses.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-black/20 border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                            <Plus size={16} />
                          </div>
                          <div>
                            <Typography variant="mono" className="text-xs text-white font-black">{b.label}</Typography>
                            <Typography variant="mono" className="text-[8px] text-slate-500 uppercase">Volume Bonus Tier Reward</Typography>
                          </div>
                        </div>
                        <Typography variant="h3" className="text-emerald-400 font-black text-xl">+${b.amount.toLocaleString()}</Typography>
                      </div>
                    ))}
                    
                    {simEarnings.dealResults.some(r => r.ruleBonuses > 0) && (
                      <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
                        <Typography variant="mono" className="text-[10px] text-amber-500 font-black uppercase mb-4 block">Rule-Based Overrides</Typography>
                        <div className="space-y-3">
                          {simEarnings.dealResults.filter(r => r.ruleBonuses > 0).slice(0, 5).map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/[0.03] last:border-0">
                              <span className="text-slate-400">Rule Trigger Applied: {r.appliedRules?.[0] || 'Override'}</span>
                              <span className="text-emerald-400 font-bold">+${r.ruleBonuses}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </MatrixSection>
              )}

              {/* Hourly Simulation Details */}
              {formData.isHourlyActive && (
                <MatrixSection
                  id="sim_hourly"
                  title="Hourly & Protection Simulation"
                  subtitle="Estimating Floor Logic"
                  icon={<ShieldCheck size={24} />}
                  isExpanded={expandedSections.sim_hourly}
                  onToggle={() => toggleSection('sim_hourly')}
                  className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8"
                >
                   <div className="p-8 rounded-[2rem] bg-black/20 border border-brand-primary/10 relative overflow-hidden">
                     <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                       <div className="space-y-6">
                         <div>
                           <Typography variant="mono" className="text-[10px] text-brand-primary font-black uppercase tracking-widest mb-1 block">Active Strategy</Typography>
                           <Typography variant="h2" className="text-white font-black uppercase">{formData.hourlyConfig.model === 'guarantee' ? 'MINIMUM FLOOR' : formData.hourlyConfig.model === 'additive' ? 'ADDITIVE' : 'RECOVERABLE DRAW'}</Typography>
                         </div>
                         <div className="space-y-4">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-500 text-sm">Hourly Yield ({simulationData.hoursWorked} hrs):</span>
                             <span className="text-white font-bold">${Math.round(simulationData.hoursWorked * formData.hourlyConfig.rate).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-500 text-sm">Commission Target:</span>
                             <span className="text-white font-bold">${Math.round(simEarnings.totalPayout + simEarnings.totalTierBonuses).toLocaleString()}</span>
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex flex-col justify-center items-center md:items-end border-l border-white/5 pl-12">
                         <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black mb-2">Required Adjustment</Typography>
                         <Typography variant="h1" className={cn(
                           "text-5xl font-black",
                           (simEarnings.hourlyCompensation?.adjustment || 0) > 0 ? "text-amber-500" : "text-slate-700"
                         )}>
                           +${Math.round(simEarnings.hourlyCompensation?.adjustment || 0).toLocaleString()}
                         </Typography>
                         <Typography variant="small" className="text-slate-600 mt-2 text-right italic">
                           { (simEarnings.hourlyCompensation?.adjustment || 0) > 0 
                             ? "Hourly floor exceeds commission. Payout adjusted."
                             : "Commission exceeds hourly floor. No adjustment needed."
                           }
                         </Typography>
                       </div>
                     </div>
                   </div>
                </MatrixSection>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6">
               <Card className="bg-emerald-500/[0.02] border-emerald-500/10 p-8 rounded-[2.5rem] h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <Typography variant="mono" className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Simulation Analytics</Typography>
                  </div>
                  
                  <div className="space-y-8 flex-1">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Monthly Rentality</Typography>
                        <Typography variant="mono" className="text-[10px] text-white font-bold">
                          {((simEarnings.grandTotal / (simulationData.frontGrossTotal || 1)) * 100).toFixed(1)}% Yield
                        </Typography>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (simEarnings.grandTotal / (simulationData.frontGrossTotal || 1)) * 100 * 4)}%` }}
                          className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <Typography variant="mono" className="text-[9px] text-slate-500 uppercase font-black">Bonus Leverage</Typography>
                        <Typography variant="mono" className="text-[10px] text-white font-bold">
                          {((simEarnings.totalTierBonuses / (simEarnings.grandTotal || 1)) * 100).toFixed(1)}% Multiplier
                        </Typography>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (simEarnings.totalTierBonuses / (simEarnings.grandTotal || 1)) * 100 * 3)}%` }}
                          className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                         <Typography variant="mono" className="text-[9px] text-slate-600 uppercase mb-2 block">Minis Driven</Typography>
                         <Typography variant="h3" className="text-2xl text-white font-black">{simEarnings.dealResults.filter(r => r.isMini).length}</Typography>
                       </div>
                       <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                         <Typography variant="mono" className="text-[9px] text-slate-600 uppercase mb-2 block">Full Comm</Typography>
                         <Typography variant="h3" className="text-2xl text-white font-black">{simEarnings.dealResults.filter(r => !r.isMini).length}</Typography>
                       </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-brand-primary/5 border border-brand-primary/10 flex flex-col items-center justify-center text-center">
                       <Calculator className="h-8 w-8 text-brand-primary/40 mb-3" />
                       <Typography variant="mono" className="text-[10px] text-brand-primary font-black uppercase mb-1">Estimated Net Payout</Typography>
                       <Typography variant="h1" className="text-4xl text-white font-black">${Math.round(simEarnings.grandTotal).toLocaleString()}</Typography>
                    </div>
                  </div>

                  <div className="mt-8">
                     <Button 
                       type="button"
                       variant="outline"
                       className="w-full h-14 border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                       onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                     >
                       <Settings2 size={16} className="mr-2" /> Adjust Commission Plan
                     </Button>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      )}
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
    </form>
  );
};
