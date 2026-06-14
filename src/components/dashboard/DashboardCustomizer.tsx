import React from 'react';
import { Typography } from '../ui/Typography';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FullscreenMobileFlow } from '../layout/MobileFullscreenFlow';
import { DashboardLayout, WidgetConfig } from '@/src/types';
import { WIDGET_DEFINITIONS, WidgetType } from '@/src/services/widgetService';
import { dashboardService } from '@/src/services/dashboardService';
import { Eye, EyeOff, Save, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface DashboardCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  layout: DashboardLayout;
  onSave: (layout: DashboardLayout) => Promise<void>;
  isMobile: boolean;
}

export const DashboardCustomizer: React.FC<
  DashboardCustomizerProps
> = ({ isOpen, onClose, layout, onSave, isMobile }) => {
  const [localWidgets, setLocalWidgets] =
    React.useState<WidgetConfig[]>(layout.widgets);
  const [isSaving, setIsSaving] = React.useState(false);
  const [draggedId, setDraggedId] =
    React.useState<string | null>(null);
  const [hoveredId, setHoveredId] =
    React.useState<string | null>(null);
  const [animationStyle, setAnimationStyle] =
    React.useState<'stack' | 'standard'>(
      layout.animationStyle || 'standard'
    );

  React.useEffect(() => {
    setLocalWidgets(layout.widgets);
    setAnimationStyle(layout.animationStyle || 'standard');
  }, [layout.widgets, layout.animationStyle]);

  const handleToggleVisibility = (id: string) => {
    setLocalWidgets(
      dashboardService.toggleVisibility(localWidgets, id)
    );
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) setHoveredId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setHoveredId(null);
      return;
    }
    const newWidgets = [...localWidgets];
    const dragIdx = newWidgets.findIndex(w => w.id === draggedId);
    const targetIdx = newWidgets.findIndex(w => w.id === targetId);
    if (dragIdx === -1 || targetIdx === -1) return;
    // Swap positions
    const dragOrder = newWidgets[dragIdx].order;
    newWidgets[dragIdx] = {
      ...newWidgets[dragIdx],
      order: newWidgets[targetIdx].order
    };
    newWidgets[targetIdx] = {
      ...newWidgets[targetIdx],
      order: dragOrder
    };
    setLocalWidgets(
      [...newWidgets].sort((a, b) => a.order - b.order)
    );
    setDraggedId(null);
    setHoveredId(null);
  };

  const handleReset = () => {
    setLocalWidgets(
      dashboardService.generateDefaultLayout().widgets
    );
    setAnimationStyle('standard');
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

  // Split widgets into grid (metric) and list (other)
  const metricTypes = [
    WidgetType.UNITS,
    WidgetType.COMMISSION,
    WidgetType.FRONT_END_GROSS,
    WidgetType.BACK_END_GROSS,
    WidgetType.TOTAL_GROSS,
    WidgetType.AVERAGE_GROSS
  ] as string[];

  const gridWidgets = localWidgets
    .filter(w => metricTypes.includes(w.type))
    .sort((a, b) => a.order - b.order);

  const listWidgets = localWidgets
    // GOAL_PROGRESS retired — KPI cards now show goal context inline.
    .filter(w => !metricTypes.includes(w.type) && w.type !== WidgetType.GOAL_PROGRESS)
    .sort((a, b) => a.order - b.order);

  const content = (
    <div className="space-y-6">
      {/* Helper text + Reset */}
      <div className="flex items-center justify-between px-1">
        <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest">
          Drag cards to swap • eye to show/hide
        </Typography>
        <Button
          variant="ghost"
          onClick={handleReset}
          className="h-8 text-[9px] uppercase font-black text-slate-500 hover:text-white"
        >
          <RotateCcw size={12} className="mr-1" />
          Reset
        </Button>
      </div>

      {/* Metric Cards Grid */}
      <div className="space-y-2">
        <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-black px-1">
          Metric Cards
        </Typography>
        <div className="grid grid-cols-2 gap-3">
          {gridWidgets.map(widget => {
            const definition = WIDGET_DEFINITIONS[widget.type as WidgetType];
            const isDragging = draggedId === widget.id;
            const isHovered = hoveredId === widget.id;

            return (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(widget.id)}
                onDragOver={(e) => handleDragOver(e, widget.id)}
                onDrop={() => handleDrop(widget.id)}
                onDragEnd={() => {
                  setDraggedId(null);
                  setHoveredId(null);
                }}
                className={cn(
                  "relative rounded-2xl p-3 border",
                  "transition-all duration-200",
                  "cursor-grab active:cursor-grabbing",
                  "select-none",
                  widget.visible
                    ? "bg-white/[0.03] border-white/10"
                    : "bg-white/[0.01] border-white/5",
                  isDragging && "opacity-40 scale-95",
                  isHovered && !isDragging && "border-brand-primary/40 bg-brand-primary/5 scale-[1.02]",
                  !widget.visible && "opacity-70"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Typography variant="mono"
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest block truncate",
                        widget.visible
                          ? "text-white"
                          : "text-slate-600"
                      )}>
                      {definition?.label || widget.type}
                    </Typography>
                    <Typography variant="mono"
                      className="text-[8px] text-slate-600 mt-0.5 truncate">
                      {definition?.description || ''}
                    </Typography>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(widget.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0",
                      widget.visible
                        ? "text-brand-primary bg-brand-primary/10"
                        : "text-slate-600 bg-white/5"
                    )}
                  >
                    {widget.visible
                      ? <Eye size={14} />
                      : <EyeOff size={14} />}
                  </button>
                </div>

                {/* Drag indicator */}
                {isHovered && !isDragging && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-brand-primary/40 pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Widgets List */}
      {listWidgets.length > 0 && (
        <div className="space-y-2">
          <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-black px-1">
            Other Widgets
          </Typography>
          <div className="space-y-2">
            {listWidgets.map(widget => {
              const definition = WIDGET_DEFINITIONS[widget.type as WidgetType];
              const isDragging = draggedId === widget.id;
              const isHovered = hoveredId === widget.id;

              return (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={(e) => handleDragOver(e, widget.id)}
                  onDrop={() => handleDrop(widget.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setHoveredId(null);
                  }}
                  className={cn(
                    "rounded-2xl p-3 border flex items-center gap-3 transition-all duration-200 cursor-grab active:cursor-grabbing select-none",
                    widget.visible
                      ? "bg-white/[0.03] border-white/10"
                      : "bg-white/[0.01] border-white/5 opacity-70",
                    isDragging && "opacity-40 scale-95",
                    isHovered && !isDragging && "border-brand-primary/40 bg-brand-primary/5"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <Typography variant="mono"
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest truncate",
                        widget.visible
                          ? "text-white"
                          : "text-slate-600"
                      )}>
                      {definition?.label || widget.type}
                    </Typography>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleVisibility(widget.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0",
                      widget.visible
                        ? "text-brand-primary bg-brand-primary/10"
                        : "text-slate-600 bg-white/5"
                    )}
                  >
                    {widget.visible
                      ? <Eye size={14} />
                      : <EyeOff size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Animation Style Toggle */}
      <div className="space-y-3">
        <Typography variant="mono" className="text-[9px] text-slate-600 uppercase tracking-widest font-black px-1">
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
                  animationStyle === opt.value ? "text-brand-primary" : "text-slate-400"
                )}>
                {opt.label}
              </Typography>
              <Typography variant="mono" className="text-[9px] text-slate-600">
                {opt.desc}
              </Typography>
            </button>
          ))}
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="pt-2 flex gap-3">
        <Button
          onClick={handleSave}
          className="flex-1 bg-brand-primary text-bg-deep font-black uppercase tracking-widest shadow-glow h-12"
          isLoading={isSaving}
        >
          <Save size={16} className="mr-2" />
          Save Changes
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
