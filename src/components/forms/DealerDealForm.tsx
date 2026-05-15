import React, { useState } from 'react';
import { DealerDeal } from '@/src/types';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { Typography } from '@/src/components/ui/Typography';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

/**
 * DealerDealForm
 * Specialized form for organizational deal entry.
 */
interface DealerDealFormProps {
  initialData?: Partial<DealerDeal>;
  onSubmit: (data: Partial<DealerDeal>) => void;
  isLoading?: boolean;
}

export const DealerDealForm: React.FC<DealerDealFormProps> = ({
  initialData = {} as Partial<DealerDeal>,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<Partial<DealerDeal>>({
    date: initialData.date || new Date().toISOString().split('T')[0],
    desk: initialData.desk || '',
    customerName: initialData.customerName || '',
    dealNumber: initialData.dealNumber || '',
    year: initialData.year || '',
    newOrUsed: initialData.newOrUsed || 'N',
    model: initialData.model || '',
    stockNumber: initialData.stockNumber || '',
    frontGross: initialData.frontGross || 0,
    tradeInfo: initialData.tradeInfo || '',
    salesperson: initialData.salesperson || '',
    source: initialData.source || '',
    fiManager: initialData.fiManager || '',
    backGross: initialData.backGross || 0,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (field: keyof DealerDeal, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors([]);
  };

  const handleNumericChange = (field: keyof DealerDeal, value: string) => {
    const numValue = parseFloat(value) || 0;
    handleChange(field, numValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    const requiredFields: (keyof DealerDeal)[] = [
      'date', 'desk', 'customerName', 'dealNumber', 'year', 'newOrUsed', 
      'model', 'stockNumber', 'frontGross', 'salesperson', 'fiManager', 'backGross'
    ];

    const missingFields = requiredFields.filter(f => !formData[f] && formData[f] !== 0);
    
    if (missingFields.length > 0) {
      setErrors(missingFields);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form id="dealer-deal-form" onSubmit={handleSubmit} className="space-y-6">
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
                Required Fields Missing
              </Typography>
              <Typography variant="small" className="text-orange-200/70">
                Please ensure all required fields are filled out correctly.
              </Typography>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          required
        />
        <Input
          label="Desk"
          placeholder="Sales Desk ID"
          value={formData.desk}
          onChange={(e) => handleChange('desk', e.target.value)}
          required
        />
        <Input
          label="Customer"
          placeholder="Full Name"
          value={formData.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          required
        />
        <Input
          label="Deal #"
          placeholder="Ref Number"
          value={formData.dealNumber}
          onChange={(e) => handleChange('dealNumber', e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Year"
            placeholder="YYYY"
            value={formData.year}
            onChange={(e) => handleChange('year', e.target.value)}
            required
          />
          <Select
            label="N or U"
            options={[
              { value: 'N', label: 'New' },
              { value: 'U', label: 'Used' },
            ]}
            value={formData.newOrUsed}
            onChange={(e) => handleChange('newOrUsed', e.target.value)}
            required
          />
        </div>
        <Input
          label="Model"
          placeholder="Vehicle Model"
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          required
        />
        <Input
          label="Stock #"
          placeholder="Inventory ID"
          value={formData.stockNumber}
          onChange={(e) => handleChange('stockNumber', e.target.value)}
          required
        />
        <CurrencyInput
          label="Front $"
          value={formData.frontGross || 0}
          onChange={(e) => handleNumericChange('frontGross', e.target.value)}
          required
        />
         <Input
          label="Trade"
          placeholder="Trade-in info (Optional)"
          value={formData.tradeInfo}
          onChange={(e) => handleChange('tradeInfo', e.target.value)}
        />
        <Input
          label="Sales P"
          placeholder="Salesperson Name"
          value={formData.salesperson}
          onChange={(e) => handleChange('salesperson', e.target.value)}
          required
        />
        <Input
          label="Source"
          placeholder="Lead Source"
          value={formData.source}
          onChange={(e) => handleChange('source', e.target.value)}
        />
        <Input
          label="F&I"
          placeholder="F&I Manager"
          value={formData.fiManager}
          onChange={(e) => handleChange('fiManager', e.target.value)}
          required
        />
        <CurrencyInput
          label="Back $"
          value={formData.backGross || 0}
          onChange={(e) => handleNumericChange('backGross', e.target.value)}
          required
        />
      </div>
    </form>
  );
};
