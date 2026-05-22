import React from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { DashboardLayout, WidgetConfig } from '@/src/types';
import { WIDGET_DEFINITIONS, WidgetType } from '@/src/services/widgetService';
import { dashboardService } from '@/src/services/dashboardService';
import { Eye, EyeOff, GripVertical, Save, RotateCcw, X, Sparkles } from 'lucide-react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { cn } from '@/src/lib/utils';

/**
 * StripeItDashboardCustomizationSystem
 * UI for reordering and toggling dashboard widgets.
 */

const DraggableWidgetRow: React.FC<{
  widget: WidgetConfig;
  definition: any;
  onToggle: () => void;
}> = ({ widget, definition, onToggle }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      key={widget.id}
      value={widget}
      dragListener={false}
      dragControls={dragControls}
      className={cn(
        "bg-white/[0.02] border rounded-2xl p-4 flex items-center gap-4 group transition-colors",
        widget.visible ? "border-white/5" : "border-white/5 opacity-70"
      )}
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 touch-none"
      >
        <GripVertical size={18} />
      </div>

      <div className="flex-1">
        <Typography variant="label" className="text-white block font-bold">
          {definition?.label || 'Unknown Widget'}
        </Typography>
        <Typography variant="mono" className="text-[9px] text-slate-500 uppercase">
          {definition?.description || ''}
        </Typography>
      </div>

      <button
        onClick={onToggle}
        className={cn(
          "p-2 rounded-xl transition-colors",
          widget.visible ? "text-brand-primary bg-brand-primary/10" : "text-slate-600 bg-white/5"
        )}
      >
        {widget.visible ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </Reorder.Item>
  );
};

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  layout: DashboardLayout;
  onSave: (layout: DashboardLayout) => Promise<void>;
  isMobile: boolean;
}

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  isOpen,
  onClose,
  layout,
  onSave,
  isMobile
}) => {
  const [localWidgets, setLocalWidgets] = React.useState<WidgetConfig[]>(layout.widgets);
  const [isSaving, setIsSaving] = React.useState(false);
  const [animationStyle, setAnimationStyle] = React.useState<'stack' | 'standard'>(
    layout.animationStyle || 'standard'
  );

  React.useEffect(() => {
    setLocalWidgets(layout.widgets);
    setAnimationStyle(layout.animationStyle || 'standard');
  }, [layout.widgets, layout.animationStyle]);

  const handleToggleVisibility = (id: string) => {
    setLocalWidgets(dashboardService.toggleVisibility(localWidgets, id));
  };

  const handleReorder = (newOrder: WidgetConfig[]) => {
    setLocalWidgets(newOrder.map((w, i) => ({ ...w, order: i })));
  };

  const handleReset = () => {
    setLocalWidgets(dashboardService.generateDefaultLayout().widgets);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        widgets: localWidgets,
        animationStyle
      });
      onClose();
    } catch (error) {
      console.error("Failed to save layout", error);
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <Typography variant="p" className="text-slate-500 text-xs italic">
          Drag to reorder. Toggle eye to show/hide.
        </Typography>
        <Button 
          variant="ghost" 
          onClick={handleReset}
          className="h-8 text-[9px] uppercase font-black text-slate-500 hover:text-white"
        >
          <RotateCcw size={12} className="mr-1" /> Reset
        </Button>
      </div>

      <div className="space-y-3">
        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-2">
          Card Animation
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'standard', label: 'Standard', desc: 'All cards visible' },
            { value: 'stack', label: 'Carousel', desc: 'One card at a time' }
          ] as const).map(opt => (
            <button
              key={opt.value}
              onClick={() => setAnimationStyle(opt.value)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all",
                animationStyle === opt.value
                  ? "border-brand-primary/40 bg-brand-primary/10"
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
              )}
            >
              <Typography variant="mono"
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest block mb-1",
                  animationStyle === opt.value
                    ? "text-brand-primary"
                    : "text-slate-400"
                )}>
                {opt.label}
              </Typography>
              <Typography variant="mono"
                className="text-[9px] text-slate-600">
                {opt.desc}
              </Typography>
            </button>
          ))}
        </div>
      </div>

      <Reorder.Group 
        axis="y" 
        values={localWidgets} 
        onReorder={handleReorder}
        className="space-y-2"
      >
        {localWidgets.map((widget) => {
          const definition = WIDGET_DEFINITIONS[widget.type as WidgetType];
          
          return (
            <DraggableWidgetRow
              key={widget.id}
              widget={widget}
              definition={definition}
              onToggle={() => handleToggleVisibility(widget.id)}
            />
          );
        })}
      </Reorder.Group>

      <div className="pt-4 flex gap-3">
        <Button 
          onClick={handleSave} 
          className="flex-1 bg-brand-primary text-bg-deep font-black uppercase tracking-widest shadow-glow h-12"
          isLoading={isSaving}
        >
          <Save size={16} className="mr-2" /> Save Changes
        </Button>
        <Button variant="ghost" onClick={onClose} className="text-slate-500">
          Cancel
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <FullscreenMobileFlow
        isOpen={isOpen}
        onClose={onClose}
        title="Customize Dashboard"
      >
        <div className="p-4">{content}</div>
      </FullscreenMobileFlow>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Your Dashboard"
    >
      <div className="py-2">{content}</div>
    </Modal>
  );
};
