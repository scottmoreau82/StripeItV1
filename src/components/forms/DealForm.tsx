import React, { useState, useMemo } from 'react';
import { Deal, DealStatus } from '@/src/types';
import { validateDeal, ValidationError } from '@/src/lib/validation';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { Button } from '@/src/components/ui/Button';
import { Typography } from '@/src/components/ui/Typography';
import { ChevronDown, ChevronUp, UserPlus, Car, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppData } from '@/src/contexts/AppDataContext';
import { getActiveCommissionTier } from '@/src/lib/commissionLogic';
import { cn } from '@/src/lib/utils';

/**
 * StripeItDealFormSystem
 * Reusable deal form with progressive disclosure and built-in validation.
 */
interface DealFormProps {
  initialData?: Partial<Deal>;
  onSubmit: (data: Partial<Deal>) => void;
  isLoading?: boolean;
}

interface DealFormState extends Partial<Deal> {
  hasTrade?: boolean;
}

export const DealForm: React.FC<DealFormProps> = ({
  initialData = {} as Partial<Deal>,
  onSubmit,
  isLoading
}) => {
  const { triggerError, deals, payPlan } = useAppData();
  const [formData, setFormData] = useState<DealFormState>({
    customerName: initialData?.customerName || '',
    purchasedVehicle: initialData?.purchasedVehicle || '',
    frontEndGross: initialData?.frontEndGross,
    backEndGross: initialData?.backEndGross,
    newOrUsed: initialData?.newOrUsed || 'new',
    status: initialData?.status || DealStatus.DRAFT,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dealNumber: initialData?.dealNumber || '',
    stockNumber: initialData?.stockNumber || '',
    tradedVehicle: initialData?.tradedVehicle || '',
    notes: initialData?.notes || '',
    isSplitDeal: initialData?.isSplitDeal || false,
    splitSalespersonId: initialData?.splitSalespersonId || '',
    splitPercentage: initialData?.splitPercentage || 50,
    hasTrade: !!initialData?.tradedVehicle,
    ...initialData
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (field: keyof DealFormState, value: any) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      
      // If we turn off 'hasTrade', we should clear 'tradedVehicle'
      if (field === 'hasTrade' && !value) {
        newState.tradedVehicle = '';
      }
      
      // If we turn on 'isSplitDeal', default percentage to 50
      if (field === 'isSplitDeal' && value) {
        newState.splitPercentage = 50;
      }
      
      return newState;
    });
    // Clear error for this field
    if (errors.length > 0 && field in formData) {
      setErrors(prev => prev.filter(e => e.field !== field));
    }
  };

  const handleNumericChange = (field: keyof DealFormState, value: string) => {
    // If empty or just a minus sign, keep it as is (as a string)
    if (value === "" || value === "-") {
      handleChange(field, value);
      return;
    }
    const numValue = parseFloat(value);
    handleChange(field, isNaN(numValue) ? 0 : numValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Prepare data with numeric types
    const baseData = {
      ...formData,
      frontEndGross: Number(formData.frontEndGross) || 0,
      backEndGross: Number(formData.backEndGross) || 0,
    };

    // 2. Conditional data cleaning
    const submitData = { ...baseData } as any;

    // If trade toggle is OFF, remove trade info
    if (!formData.hasTrade) {
      submitData.tradedVehicle = '';
    } else if (!formData.tradedVehicle?.trim()) {
      // If toggled ON but empty, flag it for validation using our marker
      submitData.tradedVehicle = '__REQUIRED_BUT_EMPTY__';
    }
    
    // If split toggle is OFF, remove split info
    if (!formData.isSplitDeal) {
      delete submitData.splitSalespersonId;
      delete submitData.splitPercentage;
    }

    // Always clean notes if empty
    if (!submitData.notes?.trim()) {
      submitData.notes = '';
    }

    // 3. Remove UI-only fields
    const { hasTrade: _, ...finalData } = submitData;

    // 4. Validate core fields
    const validationErrors = validateDeal(finalData);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      triggerError('Please correct the highlighted fields in the deal record.');
      
      // Auto-expand advanced if the error is there
      if (validationErrors.some(e => e.field === 'notes')) {
        setShowAdvanced(true);
      }
      
      return;
    }

    // Clean up marker if needed
    if (finalData.tradedVehicle === '__REQUIRED_BUT_EMPTY__') {
      finalData.tradedVehicle = '';
    }

    onSubmit(finalData);
  };

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  // Projected Commission Logic
  const currentMtdUnits = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return deals
      .filter(d => {
        const dealDate = new Date(d.date);
        return dealDate.getMonth() === currentMonth && dealDate.getFullYear() === currentYear;
      })
      .reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  }, [deals]);

  const pendingUnitCredit = formData.isSplitDeal ? (Number(formData.splitPercentage) || 0) / 100 : 1;
  const projectedUnits = currentMtdUnits + pendingUnitCredit;

  const projectedTier = useMemo(() => {
    if (!payPlan || !payPlan.tiers) return null;
    return getActiveCommissionTier(projectedUnits, payPlan.tiers);
  }, [payPlan, projectedUnits]);

  const projectedFrontRate = projectedTier?.frontRate ?? payPlan?.frontEndPercentage ?? null;
  const projectedBackRate = projectedTier?.backRate ?? payPlan?.backEndPercentage ?? null;

  const renderRatePill = (rate: number | null, color: 'cyan' | 'purple') => {
    if (!payPlan) return null;
    
    const colorClasses = color === 'cyan' 
      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
      : "bg-purple-500/10 border-purple-500/20 text-purple-400";

    const glowColor = color === 'cyan' ? 'rgba(6,182,212,0.5)' : 'rgba(168,85,247,0.5)';
    const baseGlow = color === 'cyan' ? 'rgba(6,182,212,0.15)' : 'rgba(168,85,247,0.15)';

    return (
      <div className="flex items-center h-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${color}-${rate}`}
            initial={{ opacity: 0, scale: 0.95, y: 2 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              boxShadow: [`0 0 10px ${baseGlow}`, `0 0 20px ${glowColor}`, `0 0 10px ${baseGlow}`]
            }}
            exit={{ opacity: 0, scale: 0.95, y: -2 }}
            transition={{ 
              duration: 0.2,
              boxShadow: { duration: 0.6, times: [0, 0.3, 1] }
            }}
            className={cn("px-2 py-0.5 rounded flex items-center justify-center border text-[10px] font-bold transition-all", colorClasses)}
            title={`Projected ${color === 'cyan' ? 'front-end' : 'back-end'} commission rate`}
          >
            {rate != null ? `${rate}%` : '--'}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  };

  return (
    <form id="deal-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Summary (Mobile/Inline) */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-start gap-3 mb-2"
          >
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div>
              <Typography variant="label" className="text-orange-100 font-bold block mb-1">
                Incomplete Deal Information
              </Typography>
              <Typography variant="small" className="text-orange-200/70">
                Found {errors.length} {errors.length === 1 ? 'field' : 'fields'} requiring attention. Please update the highlighted areas below.
              </Typography>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Basic Section */}
      <div className="grid grid-cols-1 gap-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Deal Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={getError('date')}
            required
          />
          <Input
            label="Deal #"
            placeholder="e.g. 12345"
            value={formData.dealNumber}
            onChange={(e) => handleChange('dealNumber', e.target.value)}
            error={getError('dealNumber')}
            required
          />
        </div>

        <Input
          label="Customer Name"
          placeholder="e.g. Michael Scott"
          value={formData.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          error={getError('customerName')}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Input
              label="Purchased Vehicle"
              placeholder="e.g. 2024 Ford F-150 Lariat"
              value={formData.purchasedVehicle}
              onChange={(e) => handleChange('purchasedVehicle', e.target.value)}
              error={getError('purchasedVehicle')}
              required
            />
          </div>
          <div className="col-span-1">
            <Input
              label="Stock #"
              placeholder="e.g. S9876"
              value={formData.stockNumber}
              onChange={(e) => handleChange('stockNumber', e.target.value)}
              error={getError('stockNumber')}
              required
            />
          </div>
        </div>

        <Select
          label="Condition"
          options={[
            { value: 'new', label: 'New' },
            { value: 'used', label: 'Used' },
            { value: 'cpo', label: 'CPO' },
          ]}
          value={formData.newOrUsed}
          onChange={(e) => handleChange('newOrUsed', e.target.value)}
          error={getError('newOrUsed')}
          required
        />

        {/* Traded Vehicle Toggle */}
        <div className="flex items-center justify-between rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${formData.hasTrade ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
              <Car className="h-5 w-5" />
            </div>
            <div>
              <Typography variant="label" className="text-white">TRADED VEHICLE</Typography>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChange('hasTrade', !formData.hasTrade)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${formData.hasTrade ? 'bg-orange-500' : 'bg-slate-800'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.hasTrade ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Trade Details (Conditional) */}
        <AnimatePresence>
          {formData.hasTrade && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-4 px-1"
            >
              <Input
                label="Vehicle Description"
                placeholder="e.g. 2020 Honda Civic"
                value={formData.tradedVehicle}
                onChange={(e) => handleChange('tradedVehicle', e.target.value)}
                error={getError('tradedVehicle')}
                required={formData.hasTrade}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Split Deal Toggle */}
        <div className="flex items-center justify-between rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${formData.isSplitDeal ? 'bg-brand-primary/20 text-brand-primary' : 'bg-slate-800 text-slate-500'}`}>
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <Typography variant="label" className="text-white">SPLIT DEAL</Typography>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleChange('isSplitDeal', !formData.isSplitDeal)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${formData.isSplitDeal ? 'bg-brand-primary' : 'bg-slate-800'}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${formData.isSplitDeal ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Split Details (Conditional) */}
        <AnimatePresence>
          {formData.isSplitDeal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-4 px-1"
            >
              <Input
                label="Partner"
                placeholder="2nd Salesperson"
                value={formData.splitSalespersonId}
                onChange={(e) => handleChange('splitSalespersonId', e.target.value)}
                error={getError('splitSalespersonId')}
                required={formData.isSplitDeal}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4">
          <CurrencyInput
            label="Front End Gross"
            value={formData.frontEndGross}
            onChange={(e) => handleNumericChange('frontEndGross', e.target.value)}
            extraLabel={renderRatePill(projectedFrontRate, 'cyan')}
            error={getError('frontEndGross')}
            required
          />
          <CurrencyInput
            label="Back End Gross"
            value={formData.backEndGross}
            onChange={(e) => handleNumericChange('backEndGross', e.target.value)}
            extraLabel={renderRatePill(projectedBackRate, 'purple')}
            error={getError('backEndGross')}
            required
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-white transition-colors"
      >
        {showAdvanced ? (
          <>Hide Additional Details <ChevronUp className="h-4 w-4" /></>
        ) : (
          <>Show Additional Details <ChevronDown className="h-4 w-4" /></>
        )}
      </button>

      {/* Advanced Section */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-5 pt-2">
              <div className="flex flex-col gap-1.5">
                <Typography variant="label" className="text-slate-400">Notes</Typography>
                <textarea
                  className="flex min-h-24 w-full rounded-xl border border-white/5 bg-slate-900/50 px-4 py-3 text-sm text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary/20 focus-visible:border-brand-primary/50 transition-all placeholder:text-slate-600 outline-none"
                  placeholder="Internal details or customer preferences..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistence/Validation Bottom Summary */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-center gap-3 mt-4"
          >
            <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            <Typography variant="small" className="text-orange-200/80 font-medium">
              Complete {errors.length} required {errors.length === 1 ? 'field' : 'fields'} highlighted above to save.
            </Typography>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
};
