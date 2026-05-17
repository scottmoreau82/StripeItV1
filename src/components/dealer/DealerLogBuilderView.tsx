import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { organizationService } from '@/src/services/organizationService';
import { Organization, LogField, LogFieldType, LogConfig } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AppIcon } from '../ui/AppIcon';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Settings2, 
  Eye, 
  EyeOff, 
  CheckSquare, 
  Square,
  Save,
  RotateCcw,
  LayoutGrid,
  FileText,
  Hash,
  DollarSign,
  ChevronDown,
  Calendar,
  ToggleLeft
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, Reorder, AnimatePresence } from 'motion/react';
import { DEFAULT_LOG_FIELDS } from '@/src/constants';

import { PageHeader } from '../ui/PageHeader';

export const DealerLogBuilderView: React.FC = () => {
  const { profile, addToast, isAdmin } = useAuth();
  const [fields, setFields] = useState<LogField[]>([]);
  const [hasConfig, setHasConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!profile?.orgId) return;
      setIsLoading(true);
      try {
        const org = await organizationService.getOrganization(profile.orgId);
        if (org?.logConfig?.fields) {
          setFields(org.logConfig.fields.sort((a, b) => a.order - b.order));
          setHasConfig(true);
        }
      } catch (error) {
        addToast('Failed to load log configuration', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, [profile?.orgId]);

  const handleApplyTemplate = () => {
    setFields([...DEFAULT_LOG_FIELDS]);
    setHasConfig(true);
  };

  const handleStartBlank = () => {
    setFields([]);
    setHasConfig(true);
  };

  const handleAddField = () => {
    const newField: LogField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: LogFieldType.TEXT,
      required: false,
      visible: true,
      order: fields.length
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleUpdateField = (id: string, updates: Partial<LogField>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    if (!profile?.orgId) return;
    
    // Operational Validation
    const validationErrors: string[] = [];
    const seenLabels = new Set<string>();

    fields.forEach((field, index) => {
      const fieldName = field.label?.trim() || `Field #${index + 1}`;
      
      // 1. Empty Label Check
      if (!field.label || field.label.trim() === '') {
        validationErrors.push(`Field #${index + 1} must have a label.`);
      }

      // 2. Duplicate Label Check
      const normalizedLabel = field.label.trim().toLowerCase();
      if (normalizedLabel && seenLabels.has(normalizedLabel)) {
        validationErrors.push(`Duplicate field label found: "${field.label.trim()}".`);
      }
      seenLabels.add(normalizedLabel);

      // 3. Dropdown Option Check
      if (field.type === LogFieldType.DROPDOWN) {
        const validOptions = field.options?.filter(opt => opt.trim() !== '') || [];
        if (validOptions.length === 0) {
          validationErrors.push(`Dropdown field "${fieldName}" requires at least one valid option.`);
        }
      }
    });

    if (validationErrors.length > 0) {
      addToast(validationErrors[0], 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Clean and re-order fields
      const cleanedFields = fields.map((f, idx) => ({ 
        ...f, 
        order: idx,
        label: f.label.trim(),
        options: f.type === LogFieldType.DROPDOWN 
          ? f.options?.map(opt => opt.trim()).filter(Boolean) 
          : undefined
      }));

      await organizationService.updateLogConfig(profile.orgId, { fields: cleanedFields });
      addToast('Operational schema synchronized successfully', 'success');
      setFields(cleanedFields);
    } catch (error: any) {
      console.error("Schema Save Error:", error);
      
      let errorMessage = 'System failed to persist schema configuration';
      
      // Extract friendly message for permission errors
      const message = error?.message || String(error);
      if (message.includes('insufficient permissions') || 
          message.includes('permission-denied') ||
          (error?.details?.error && (
            error.details.error.toLowerCase().includes('permissions') || 
            error.details.error.toLowerCase().includes('denied')
          ))) {
        errorMessage = "You do not have permission to modify this organization's log schema.";
      }
      
      addToast(errorMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getFieldIcon = (type: LogFieldType) => {
    switch (type) {
      case LogFieldType.TEXT: return <FileText size={14} />;
      case LogFieldType.NUMBER: return <Hash size={14} />;
      case LogFieldType.CURRENCY: return <DollarSign size={14} />;
      case LogFieldType.DROPDOWN: return <ChevronDown size={14} />;
      case LogFieldType.DATE: return <Calendar size={14} />;
      case LogFieldType.TOGGLE: return <ToggleLeft size={14} />;
      default: return <Settings2 size={14} />;
    }
  };

  const header = (
    <PageHeader
      title="Log Builder"
      subtitle="Configure Shared Operational Deal Log Schema"
      icon={LayoutGrid}
    >
      {hasConfig && (
        <div className="flex items-center gap-3">
           <Button 
              variant="ghost" 
              onClick={() => setHasConfig(false)}
              className="text-slate-500 hover:text-white"
           >
              <RotateCcw size={16} className="mr-2" />
              Reset
           </Button>
           <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="shadow-glow glow-primary h-11 px-8 font-black uppercase tracking-widest text-xs"
           >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save Schema'}
           </Button>
        </div>
      )}
    </PageHeader>
  );

  const mainContent = (
    <div className="space-y-8 pb-32">
      {!hasConfig ? (
        <div className="max-w-4xl mx-auto space-y-8 pt-12">
          <div className="text-center space-y-4">
             <Typography variant="h2" className="text-white font-black italic uppercase tracking-tight">Initialization Profile</Typography>
             <Typography variant="p" className="text-slate-500 max-w-lg mx-auto">
                Define the operational structure of your dealership's deal log. 
                This schema will synchronize your data entry forms and sales reports.
             </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card 
                className="p-8 bg-bg-card/20 border-white/5 hover:border-brand-primary/30 transition-all group cursor-pointer"
                onClick={handleApplyTemplate}
             >
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="h-16 w-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 group-hover:scale-110 transition-transform">
                      <LayoutGrid size={32} />
                   </div>
                   <div className="space-y-2">
                      <Typography variant="h3" className="text-white font-black uppercase italic">Deal Log Template</Typography>
                      <Typography variant="p" className="text-slate-500 text-sm">
                         Start with a standard automotive industry deal log profile including common gross and inventory metrics.
                      </Typography>
                   </div>
                   <Button variant="outline" className="w-full border-brand-primary/20 text-brand-primary group-hover:bg-brand-primary group-hover:text-black transition-all">
                      Apply Template
                   </Button>
                </div>
             </Card>

             <Card 
                className="p-8 bg-bg-card/20 border-white/5 hover:border-white/20 transition-all group cursor-pointer"
                onClick={handleStartBlank}
             >
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 border border-white/10 group-hover:scale-110 transition-transform">
                      <Plus size={32} />
                   </div>
                   <div className="space-y-2">
                      <Typography variant="h3" className="text-white font-black uppercase italic">Blank Configuration</Typography>
                      <Typography variant="p" className="text-slate-500 text-sm">
                         Build a custom operational schema from scratch for unique organizational requirements.
                      </Typography>
                   </div>
                   <Button variant="outline" className="w-full border-white/10 text-slate-500 group-hover:bg-white group-hover:text-black transition-all">
                      Start Blank
                   </Button>
                </div>
             </Card>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-6">
           <div className="flex items-center justify-between px-2">
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                 Live Operational Schema
              </Typography>
              <Button 
                onClick={handleAddField}
                size="sm"
                className="h-8 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 font-black uppercase tracking-widest text-[9px]"
              >
                 <Plus size={12} className="mr-1" />
                 Add Field
              </Button>
           </div>

           <Reorder.Group axis="y" values={fields} onReorder={setFields} className="space-y-3">
              <AnimatePresence mode="popLayout">
                 {fields.map((field) => (
                    <Reorder.Item 
                       key={field.id} 
                       value={field}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                    >
                       <Card className="bg-bg-card/10 border-white/5 hover:border-white/10 transition-colors p-4 group">
                          <div className="flex items-center gap-4">
                             <div className="cursor-grab active:cursor-grabbing text-slate-700 group-hover:text-slate-500 transition-colors">
                                <GripVertical size={20} />
                             </div>

                             <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center border transition-all",
                                field.visible ? "bg-white/[0.03] border-white/10 text-slate-400" : "bg-white/5 border-transparent text-slate-700 opacity-50"
                             )}>
                                {getFieldIcon(field.type)}
                             </div>

                             <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input 
                                   value={field.label}
                                   onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                                   className="bg-transparent border-none text-white font-bold text-sm focus:ring-0 placeholder:text-slate-700"
                                   placeholder="Field Label"
                                />

                                <select 
                                   value={field.type}
                                   onChange={(e) => handleUpdateField(field.id, { type: e.target.value as LogFieldType })}
                                   className="bg-white/[0.03] border-white/5 rounded-lg text-slate-400 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-brand-primary/50"
                                >
                                   {Object.values(LogFieldType).map(t => (
                                      <option key={t} value={t}>{t.toUpperCase()}</option>
                                   ))}
                                </select>

                                <div className="flex items-center gap-6">
                                   <button 
                                      onClick={() => handleUpdateField(field.id, { required: !field.required })}
                                      className={cn(
                                         "flex items-center gap-2 transition-all",
                                         field.required ? "text-brand-primary" : "text-slate-600 hover:text-slate-400"
                                      )}
                                   >
                                      {field.required ? <CheckSquare size={16} /> : <Square size={16} />}
                                      <Typography variant="mono" className="text-[9px] uppercase font-black">Required</Typography>
                                   </button>
                                   
                                   <button 
                                      onClick={() => handleUpdateField(field.id, { visible: !field.visible })}
                                      className={cn(
                                         "flex items-center gap-2 transition-all",
                                         field.visible ? "text-emerald-500" : "text-slate-600 hover:text-slate-400"
                                      )}
                                   >
                                      {field.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                      <Typography variant="mono" className="text-[9px] uppercase font-black">Visible</Typography>
                                   </button>
                                </div>

                                <div className="flex items-center justify-end">
                                   <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleRemoveField(field.id)}
                                      className="h-9 w-9 p-0 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
                                   >
                                      <Trash2 size={16} />
                                   </Button>
                                </div>
                             </div>
                          </div>

                          {/* Options for Dropdown */}
                          {field.type === LogFieldType.DROPDOWN && (
                             <div className="mt-4 pl-14 flex items-center gap-4 w-full">
                                <Typography variant="mono" className="text-[9px] text-slate-600 uppercase font-black shrink-0">Dropdown Options:</Typography>
                                <input 
                                   value={field.options?.join(', ') || ''}
                                   onChange={(e) => handleUpdateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })}
                                   className="flex-1 bg-white/[0.02] border-white/5 rounded-lg px-3 py-2 text-[11px] text-slate-400 focus:outline-none focus:border-brand-primary/50 placeholder:text-slate-800"
                                   placeholder="Comma separated: New, Used, CPO"
                                />
                             </div>
                          )}
                       </Card>
                    </Reorder.Item>
                 ))}
              </AnimatePresence>
           </Reorder.Group>

           {fields.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                 <Typography variant="p" className="text-slate-600 font-bold uppercase text-xs tracking-widest">
                    No fields defined yet.
                 </Typography>
              </div>
           )}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout
      header={header}
      main={mainContent}
    />
  );
};
