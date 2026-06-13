import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Modal } from '../ui/Modal';
import { AppIcon } from '../ui/AppIcon';
import { MonthlySpiff } from '@/src/types';
import { useAppData } from '@/src/contexts/AppDataContext';
import { Plus, Trash2, PencilLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * StripeItAdjustmentSystem
 * Widget for managing monthly/global SPIFF adjustments.
 */

interface AdjustmentsWidgetProps {
  monthlySpiffs: MonthlySpiff[];
  isLoading?: boolean;
}

export const AdjustmentsWidget: React.FC<AdjustmentsWidgetProps> = ({ 
  monthlySpiffs, 
  isLoading 
}) => {
  const { handleSaveMonthlySpiff, handleDeleteMonthlySpiff } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpiff, setEditingSpiff] = useState<Partial<MonthlySpiff> | null>(null);

  const handleOpenAdd = () => {
    setEditingSpiff({
      label: '',
      amount: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (spiff: MonthlySpiff) => {
    setEditingSpiff(spiff);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingSpiff || !editingSpiff.label || editingSpiff.amount === undefined) return;
    
    try {
      await handleSaveMonthlySpiff(editingSpiff);
      setIsModalOpen(false);
      setEditingSpiff(null);
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const formatCurrency = (amt: number) => 
    `$${amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monthly Adjustments (SPIFFS)</Typography>
        <button 
          onClick={handleOpenAdd}
          className="h-6 w-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all active:scale-90"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-3">
        {monthlySpiffs.length > 0 ? (
          monthlySpiffs.map((spiff) => (
            <motion.div
              key={spiff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 bg-white/[0.02] border-white/5 hover:border-white/10 transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Typography variant="label" className="text-white block">{spiff.label}</Typography>
                    {spiff.notes && (
                      <Typography variant="small" className="text-slate-500 text-[11px] italic">{spiff.notes}</Typography>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Typography variant="mono" className="text-emerald-400 font-bold">{formatCurrency(spiff.amount)}</Typography>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(spiff)}
                        className="h-7 w-7 rounded-sm bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <PencilLine size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteMonthlySpiff(spiff.id)}
                        className="h-7 w-7 rounded-sm bg-red-500/10 flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="p-8 bg-white/[0.01] border-dashed border-white/5 text-center flex flex-col items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                <AppIcon name="plus" className="h-5 w-5" />
             </div>
             <div>
                <Typography variant="small" className="text-slate-500">No monthly adjustments</Typography>
                <button 
                  onClick={handleOpenAdd}
                  className="text-brand-primary text-[11px] font-bold uppercase tracking-wider mt-1 hover:underline"
                >
                  Add Your First SPIFF
                </button>
             </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSpiff?.id ? "Edit Adjustment" : "Add Monthly Adjustment"}
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
             <Input 
               label="SPIFF Label" 
               placeholder="e.g. Unit Goal Bonus, Holiday SPIFF" 
               value={editingSpiff?.label || ''}
               onChange={(e) => setEditingSpiff(prev => ({ ...prev!, label: e.target.value }))}
             />
             <CurrencyInput 
               label="Adjustment Amount"
               value={editingSpiff?.amount || 0}
               onChange={(e) => setEditingSpiff(prev => ({ ...prev!, amount: parseFloat(e.target.value.replace(/[$,]/g, '')) || 0 }))}
               placeholder="$0.00"
             />
             <div className="space-y-1.5">
               <Typography variant="label" className="text-slate-400">Optional Note</Typography>
               <textarea 
                 className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary transition-all min-h-[100px]"
                 placeholder="Context for this adjustment..."
                 value={editingSpiff?.notes || ''}
                 onChange={(e) => setEditingSpiff(prev => ({ ...prev!, notes: e.target.value }))}
               />
             </div>
          </div>

          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave}>Save Adjustment</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
