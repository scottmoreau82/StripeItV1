import React, { useState, useEffect } from 'react';
import { DealerDeal, LogField, LogFieldType } from '@/src/types';
import { Input } from '@/src/components/ui/Input';
import { Select } from '@/src/components/ui/Select';
import { CurrencyInput } from '@/src/components/ui/CurrencyInput';
import { Typography } from '@/src/components/ui/Typography';
import { Checkbox } from '@/src/components/ui/Checkbox';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

/**
 * DealerDealForm
 * Specialized form for organizational deal entry.
 * Dynamic rendering based on LogField configuration.
 */
interface DealerDealFormProps {
  initialData?: Partial<DealerDeal>;
  fields: LogField[];
  onSubmit: (data: Partial<DealerDeal>) => void;
  isLoading?: boolean;
}

export const DealerDealForm: React.FC<DealerDealFormProps> = ({
  initialData = {},
  fields,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState<Partial<DealerDeal>>({});
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize form data with defaults and initial values
  useEffect(() => {
    const data: Partial<DealerDeal> = { ...initialData };
    fields.forEach(field => {
      if (data[field.id] === undefined) {
        if (field.type === LogFieldType.DATE && field.id === 'date') {
          data[field.id] = new Date().toISOString().split('T')[0];
        } else if (field.type === LogFieldType.NUMBER || field.type === LogFieldType.CURRENCY) {
          data[field.id] = 0;
        } else if (field.type === LogFieldType.TOGGLE) {
          data[field.id] = false;
        } else {
          data[field.id] = '';
        }
      }
    });
    setFormData(data);
  }, [fields, initialData]);

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    setErrors(prev => prev.filter(f => f !== fieldId));
  };

  const handleNumericChange = (fieldId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    handleChange(fieldId, numValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Dynamic Validation
    const missingFields = fields
      .filter(f => f.required && (formData[f.id] === undefined || formData[f.id] === '' || formData[f.id] === null))
      .map(f => f.id);
    
    if (missingFields.length > 0) {
      setErrors(missingFields);
      return;
    }

    onSubmit(formData);
  };

  const renderField = (field: LogField) => {
    if (!field.visible) return null;

    const commonProps = {
      label: field.label,
      value: formData[field.id] ?? '',
      required: field.required,
      onChange: (e: any) => handleChange(field.id, e.target.value),
      placeholder: field.label,
      error: errors.includes(field.id)
    };

    switch (field.type) {
      case LogFieldType.TEXT:
        return <Input {...commonProps} />;
      
      case LogFieldType.NUMBER:
        return (
          <Input 
            {...commonProps} 
            type="number" 
            onChange={(e) => handleNumericChange(field.id, e.target.value)}
          />
        );
      
      case LogFieldType.CURRENCY:
        return (
          <CurrencyInput 
            {...commonProps} 
            value={Number(formData[field.id] || 0)}
            onChange={(e) => handleNumericChange(field.id, e.target.value)}
          />
        );
      
      case LogFieldType.DATE:
        return <Input {...commonProps} type="date" />;
      
      case LogFieldType.DROPDOWN:
        return (
          <Select 
            {...commonProps}
            options={field.options?.map(o => ({ value: o, label: o })) || []}
          />
        );
      
      case LogFieldType.TOGGLE:
        return (
          <div className="flex items-center gap-3 h-10 px-1">
             <Checkbox 
                id={field.id}
                checked={!!formData[field.id]}
                onCheckedChange={(checked) => handleChange(field.id, checked)}
             />
             <Typography variant="label" htmlFor={field.id} className="text-slate-400 cursor-pointer">
                {field.label}
             </Typography>
          </div>
        );

      default:
        return <Input {...commonProps} />;
    }
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
                Please ensure all required fields marked as mandatory are filled out.
              </Typography>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map(field => (
          <React.Fragment key={field.id}>
            {renderField(field)}
          </React.Fragment>
        ))}
      </div>
    </form>
  );
};
