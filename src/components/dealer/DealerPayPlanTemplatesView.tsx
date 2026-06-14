import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { payPlanTemplateService } from '@/src/services/payPlanTemplateService';
import { PayPlan, PayPlanTemplate } from '@/src/types';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Typography } from '../ui/Typography';
import { StripeItCommissionMatrixPanel } from '../commission/StripeItCommissionMatrixPanel';
import { Layers, Plus, Pencil, Trash2, ArrowLeft, Users } from 'lucide-react';

/**
 * DealerPayPlanTemplatesView (Dealer tier — Phase 1)
 *
 * Owner-facing management of org pay-plan templates.
 * - List existing templates (name, assigned count, edit/delete).
 * - Create: opens Commission Architect; "Save as Template" -> createTemplate.
 * - Edit: opens Architect pre-filled with the template; save -> updateTemplate (propagates live).
 * Delete uses the inline pendingDeleteId pattern (no nested modal).
 */

type Mode =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; template: PayPlanTemplate };

export const DealerPayPlanTemplatesView: React.FC = () => {
  const { profile, addToast } = useAuth();
  const orgId = profile?.orgId || '';

  const [templates, setTemplates] = useState<PayPlanTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const list = await payPlanTemplateService.listTemplates(orgId);
      setTemplates(list.sort((a, b) => (a.templateName || '').localeCompare(b.templateName || '')));
    } catch {
      addToast('Could not load templates.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, addToast]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleCreate = async (
    data: Omit<PayPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>,
    templateName: string
  ) => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      await payPlanTemplateService.createTemplate(orgId, templateName, data as any);
      addToast(`Template "${templateName}" created.`, 'success');
      setMode({ kind: 'list' });
      await loadTemplates();
    } catch (error: any) {
      console.error('Create template error:', error?.code, error?.message, error);
      addToast(error?.code === 'permission-denied'
        ? 'Permission denied creating template.'
        : 'Could not create template.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (
    template: PayPlanTemplate,
    data: Omit<PayPlan, 'id' | 'createdAt' | 'updatedAt' | 'organizationId' | 'userId'>
  ) => {
    if (!orgId) return;
    setIsSaving(true);
    try {
      await payPlanTemplateService.updateTemplate(orgId, template.id, {
        ...(data as any),
        templateName: template.templateName,
      });
      addToast(`"${template.templateName}" updated. Linked salespeople will reflect the change.`, 'success');
      setMode({ kind: 'list' });
      await loadTemplates();
    } catch {
      addToast('Could not update template.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!orgId) return;
    try {
      await payPlanTemplateService.deleteTemplate(orgId, id);
      setPendingDeleteId(null);
      addToast('Template deleted.', 'success');
      await loadTemplates();
    } catch {
      addToast('Could not delete template.', 'error');
    }
  };

  // --- Create / Edit: render the Commission Architect ---
  if (mode.kind === 'create' || mode.kind === 'edit') {
    const isEdit = mode.kind === 'edit';
    const initialData: Partial<PayPlan> | undefined = isEdit ? (mode.template as unknown as Partial<PayPlan>) : undefined;

    return (
      <DashboardLayout
        header={
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setMode({ kind: 'list' })}
              className="h-10 px-3 text-slate-400 hover:text-text-primary font-black uppercase tracking-widest text-[10px]"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Button>
            <PageHeader
              icon={Layers}
              title={isEdit ? `Edit: ${mode.template.templateName}` : 'New Pay Plan Template'}
              subtitle={isEdit ? 'Changes apply live to every salesperson on this template' : 'Build the plan, then save it as a reusable template'}
            />
          </div>
        }
        main={
          isEdit ? (
            // Edit: the Architect saves via onSubmit -> updateTemplate (name preserved).
            <StripeItCommissionMatrixPanel
              initialData={initialData}
              onSubmit={(data) => handleUpdate(mode.template, data)}
              isLoading={isSaving}
            />
          ) : (
            // Create: "Save as Template" -> createTemplate (captures the name inline).
            <StripeItCommissionMatrixPanel
              initialData={initialData}
              onSubmit={() => { /* create flow uses Save as Template only */ }}
              onSaveAsTemplate={handleCreate}
              isLoading={isSaving}
            />
          )
        }
      />
    );
  }

  // --- List ---
  return (
    <DashboardLayout
      header={
        <PageHeader
          icon={Layers}
          title="Pay Plan Templates"
          subtitle="Build comp plans once, assign them to your team"
          actions={
            <Button
              onClick={() => setMode({ kind: 'create' })}
              className="h-11 px-6 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          }
        />
      }
      main={
        <div className="space-y-8">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <Card className="p-10 text-center bg-bg-card/40 border-border-subtle">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-brand-primary" />
              </div>
              <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-sm block mb-1">
                No templates yet
              </Typography>
              <Typography variant="small" className="text-slate-500 max-w-sm mx-auto block mb-6">
                Create your first pay plan template, then assign it to salespeople in one action.
              </Typography>
              <Button
                onClick={() => setMode({ kind: 'create' })}
                className="h-11 px-6 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {templates.map((t) => (
                <Card
                  key={t.id}
                  className="p-5 bg-bg-card/40 border-border-subtle hover:border-brand-primary/20 transition-all"
                >
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-11 w-11 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                        <Layers className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div className="min-w-0">
                        <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-sm block truncate">
                          {t.templateName}
                        </Typography>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Users className="h-3 w-3 text-slate-500" />
                          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                            {t.assignedCount || 0} assigned
                          </Typography>
                        </div>
                      </div>
                    </div>

                    {pendingDeleteId === t.id ? (
                      <div className="flex items-center gap-2 animate-in fade-in duration-200">
                        <Typography variant="mono" className="text-[10px] text-rose-400 uppercase font-bold tracking-widest mr-1">
                          Delete?
                        </Typography>
                        <Button
                          onClick={() => handleDelete(t.id)}
                          className="h-9 px-4 bg-rose-600/90 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-lg"
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setPendingDeleteId(null)}
                          className="h-9 px-3 text-slate-500 hover:text-text-primary font-black uppercase tracking-widest text-[10px]"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => setMode({ kind: 'edit', template: t })}
                          className="h-9 px-4 border-white/10 text-text-secondary hover:border-brand-primary/40 hover:text-brand-primary font-black uppercase tracking-widest text-[10px] rounded-lg"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setPendingDeleteId(t.id)}
                          className="h-9 w-9 p-0 text-slate-500 hover:text-rose-400 rounded-lg flex items-center justify-center"
                          aria-label="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
};
