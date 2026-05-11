import React, { useState, useMemo } from 'react';
import { PayPlan, PayPlanRule, PayPlanTier, Deal, DealStatus } from '@/src/types';
import { Typography } from '../ui/Typography';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Card } from '../ui/Card';
import { 
  Calculator, 
  Info, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Zap, 
  Settings2,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { estimateCommission, calculatePeriodEarnings } from '@/src/lib/commissionLogic';

/**
 * StripeItPayPlanFormSystem & StripeItAdvancedPayPlanSystem
 * Guided setup flow with optional advanced rules and volume tiers.
 */

interface PayPlanFormProps {
  initialData?: Partial<PayPlan>;
  onSubmit: (data: Omit<PayPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>) => void;
  isLoading?: boolean;
}

export const PayPlanForm: React.FC<PayPlanFormProps> = ({
  initialData,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || 'Standard Pay Plan',
    miniAmount: initialData?.miniAmount || 200,
    frontEndPercentage: initialData?.frontEndPercentage || 25,
    backEndPercentage: initialData?.backEndPercentage || 5,
    flatPerUnitAmount: initialData?.flatPerUnitAmount || 0,
    splitDealBehavior: initialData?.splitDealBehavior || ('standard' as const),
    isAdvanced: initialData?.isAdvanced || false,
    rules: initialData?.rules || [] as PayPlanRule[],
    tiers: initialData?.tiers || [] as PayPlanTier[]
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumeric = (field: string, value: string) => {
    const val = value === '' ? 0 : parseFloat(value);
    handleChange(field, val);
  };

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
  const addTier = () => {
    const newTier: PayPlanTier = {
      id: crypto.randomUUID(),
      threshold: 10,
      bonusAmount: 500,
      perUnitBonus: 0,
      isRetroactive: true
    };
    handleChange('tiers', [...formData.tiers, newTier]);
  };

  const updateTier = (id: string, updates: Partial<PayPlanTier>) => {
    handleChange('tiers', formData.tiers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const removeTier = (id: string) => {
    handleChange('tiers', formData.tiers.filter(t => t.id !== id));
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

    const plan: any = { ...formData };
    return calculatePeriodEarnings(mockDeals, plan as PayPlan);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Header/Info */}
        <div className="flex items-start gap-4 rounded-2xl bg-brand-primary/5 p-4 border border-brand-primary/10">
          <div className="mt-1">
            <Info className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <Typography variant="label" className="text-brand-primary block mb-1">Pay Plan Configuration</Typography>
            <Typography variant="small" className="text-slate-400">
              Configure how you earn. Basic plans are straightforward, while Advanced mode allows for complex rules and volume bonuses.
            </Typography>
          </div>
        </div>

        {/* Plan Name */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <Input 
              label="Plan Name" 
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. 2024 Commission Plan"
              required
            />
          </div>
          <div className="flex items-end pb-1">
            <Button
              type="button"
              variant={formData.isAdvanced ? 'primary' : 'outline'}
              onClick={() => handleChange('isAdvanced', !formData.isAdvanced)}
              className={formData.isAdvanced ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              <Zap className={`mr-2 h-4 w-4 ${formData.isAdvanced ? 'fill-white' : ''}`} />
              {formData.isAdvanced ? 'Advanced Mode Active' : 'Enable Advanced Mode'}
            </Button>
          </div>
        </div>

        {/* Percentages Section */}
        <Card className="bg-white/[0.02] border-white/5 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calculator className="h-4 w-4 text-slate-500" />
            <Typography variant="label" className="text-slate-300 uppercase tracking-widest text-[10px]">Percentage Earnings</Typography>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Input 
                label="Front End %" 
                type="number"
                value={formData.frontEndPercentage}
                onChange={(e) => handleNumeric('frontEndPercentage', e.target.value)}
                className="pr-10"
              />
              <span className="absolute right-4 top-[42px] text-slate-500 text-sm">%</span>
            </div>
            <div className="relative">
              <Input 
                label="Back End %"
                type="number"
                value={formData.backEndPercentage}
                onChange={(e) => handleNumeric('backEndPercentage', e.target.value)}
                className="pr-10"
              />
              <span className="absolute right-4 top-[42px] text-slate-500 text-sm">%</span>
            </div>
          </div>
        </Card>

        {/* Guarantees & Split Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CurrencyInput 
            label="Mini Amount" 
            value={formData.miniAmount}
            onChange={(e) => handleNumeric('miniAmount', e.target.value)}
            description="Minimum payout per deal"
          />
          <CurrencyInput 
            label="Flat Per Unit" 
            value={formData.flatPerUnitAmount}
            onChange={(e) => handleNumeric('flatPerUnitAmount', e.target.value)}
            description="Fixed amount per car sold"
          />
          <Select 
            label="Split Deal Behavior"
            options={[
              { value: 'standard', label: 'Standard Proportion' },
              { value: 'half_mini', label: 'Half the Mini' },
            ]}
            value={formData.splitDealBehavior}
            onChange={(e) => handleChange('splitDealBehavior', e.target.value)}
          />
        </div>

        {/* Advanced Section */}
        <AnimatePresence>
          {formData.isAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-8"
            >
              {/* Rules Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-amber-500" />
                    <Typography variant="h4">Commission Rules</Typography>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addRule}>
                    <Plus className="mr-2 h-4 w-4" /> Add Rule
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {formData.rules.map((rule) => (
                    <Card key={rule.id} className="bg-white/[0.01] border-white/5 p-4 flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <Input 
                          placeholder="Rule Name" 
                          value={rule.name}
                          onChange={(e) => updateRule(rule.id, { name: e.target.value })}
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
                        />
                      </div>
                      <div className="w-[120px]">
                        <CurrencyInput 
                          value={rule.threshold}
                          onChange={(e) => updateRule(rule.id, { threshold: parseFloat(e.target.value) || 0 })}
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
                        />
                      </div>
                      <div className="w-[120px]">
                        <Input 
                          type="number"
                          value={rule.rewardValue}
                          onChange={(e) => updateRule(rule.id, { rewardValue: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRule(rule.id)} className="text-red-500 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}
                  {formData.rules.length === 0 && (
                    <div className="text-center py-6 border-2 border-dashed border-white/5 rounded-2xl">
                      <Typography className="text-slate-500">No active commission rules. Add one to reward high gross deals.</Typography>
                    </div>
                  )}
                </div>
              </div>

              {/* Volume Tiers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-brand-primary" />
                    <Typography variant="h4">Volume Tiers</Typography>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addTier}>
                    <Plus className="mr-2 h-4 w-4" /> Add Tier
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {formData.tiers.map((tier) => (
                    <Card key={tier.id} className="bg-white/[0.01] border-white/5 p-6 space-y-4">
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="w-[100px]">
                          <Input 
                            label="Units"
                            type="number"
                            value={tier.threshold}
                            onChange={(e) => updateTier(tier.id, { threshold: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <CurrencyInput 
                            label="Lump Sum Bonus"
                            value={tier.bonusAmount}
                            onChange={(e) => updateTier(tier.id, { bonusAmount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                          <CurrencyInput 
                            label="Per Unit Bonus"
                            value={tier.perUnitBonus || 0}
                            onChange={(e) => updateTier(tier.id, { perUnitBonus: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-2 pb-2">
                          <Button 
                            type="button"
                            variant={tier.isRetroactive ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => updateTier(tier.id, { isRetroactive: !tier.isRetroactive })}
                            className="h-10 px-4"
                          >
                            <TrendingUp className={`h-4 w-4 mr-2 ${tier.isRetroactive ? 'text-white' : 'text-slate-500'}`} />
                            {tier.isRetroactive ? 'Retroactive' : 'Step-Up'}
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeTier(tier.id)} className="text-red-500 hover:text-red-400 h-10 w-10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Typography variant="small" className="text-slate-500 block">
                        {tier.isRetroactive 
                          ? `At ${tier.threshold} units, earn $${tier.bonusAmount.toLocaleString()} plus $${(tier.perUnitBonus || 0).toLocaleString()} extra for EVERY unit sold this month.`
                          : `At ${tier.threshold} units, earn $${tier.bonusAmount.toLocaleString()} plus $${(tier.perUnitBonus || 0).toLocaleString()} extra for each unit starting at #${tier.threshold}.`
                        }
                      </Typography>
                    </Card>
                  ))}
                  {formData.tiers.length === 0 && (
                    <div className="md:col-span-2 text-center py-6 border-2 border-dashed border-white/5 rounded-2xl">
                      <Typography className="text-slate-500">No volume tiers defined. Add tiers to earn extra for more units sold.</Typography>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Preview Section */}
        <Card className="bg-brand-primary/5 border-brand-primary/10 p-6">
          <Typography variant="label" className="text-brand-primary uppercase tracking-widest text-[10px] mb-4 block">Simulation Preview (based on 12 typical deals)</Typography>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Typography variant="small" className="text-slate-500">Deal Earnings</Typography>
              <Typography variant="h3">${Math.round(previewData.totalPayout).toLocaleString()}</Typography>
            </div>
            <div>
              <Typography variant="small" className="text-slate-500">Tier Bonuses</Typography>
              <Typography variant="h3" className="text-brand-primary">+${Math.round(previewData.totalTierBonuses).toLocaleString()}</Typography>
            </div>
            <div className="col-span-2 border-l border-white/10 pl-6">
              <Typography variant="small" className="text-slate-500">Total Projected Payout</Typography>
              <div className="flex items-baseline gap-2">
                <Typography variant="h1" className="text-white">${Math.round(previewData.grandTotal).toLocaleString()}</Typography>
                <Typography variant="small" className="text-emerald-500">${Math.round(previewData.grandTotal / 12).toLocaleString()}/avg</Typography>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="pt-6">
        <Button 
          type="submit" 
          className="w-full h-14 text-lg" 
          isLoading={isLoading} 
          disabled={isLoading}
        >
          <ShieldCheck className="mr-2 h-6 w-6" />
          Finalize & Save Pay Plan
        </Button>
      </div>
    </form>
  );
};
