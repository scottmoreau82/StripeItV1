import React from 'react';
import { useAppData } from '@/src/contexts/AppDataContext';
import { useAuth } from '@/src/contexts/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { ShieldCheck, Layers, TrendingUp, Zap, DollarSign, Clock, Lock, Info } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { PayPlan } from '@/src/types';

/**
 * MyPayPlanView (Dealer tier — Phase 1)
 *
 * Read-only view of a salesperson's effective pay plan as assigned by their dealer.
 * Rendered when the user is an org member with a sourceTemplateId on their plan.
 *
 * Sections: Commission Rates, Minis & Hourly, Volume Bonuses, Pack Deductions.
 * No editing — plan is owned by the dealership Owner.
 */

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, subtitle, children, className }) => (
  <Card className={cn("p-6 bg-bg-card/40 border-border-subtle space-y-5", className)}>
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-[11px] block">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            {subtitle}
          </Typography>
        )}
      </div>
    </div>
    {children}
  </Card>
);

const Stat: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex flex-col gap-1">
    <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
      {label}
    </Typography>
    <Typography variant="label" className={cn("font-black text-lg", highlight ? "text-brand-primary" : "text-text-primary")}>
      {value}
    </Typography>
  </div>
);

const fmt = (n: number | undefined, suffix = '%') =>
  n ? `${n}${suffix}` : '—';

const fmtCurrency = (n: number | undefined) =>
  n ? `$${n.toLocaleString()}` : '—';

export const MyPayPlanView: React.FC = () => {
  const { payPlan } = useAppData();
  const { profile } = useAuth();

  const isLinked = !!payPlan?.sourceTemplateId;
  const plan = payPlan as PayPlan | null;

  if (!plan) {
    return (
      <DashboardLayout
        header={
          <PageHeader
            icon={ShieldCheck}
            title="My Pay Plan"
            subtitle="Your dealership compensation plan"
          />
        }
        main={
          <Card className="p-10 text-center bg-bg-card/40 border-border-subtle">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-brand-primary" />
            </div>
            <Typography variant="label" className="text-text-primary font-black uppercase tracking-widest text-sm block mb-1">
              No pay plan assigned
            </Typography>
            <Typography variant="small" className="text-slate-500 max-w-sm mx-auto block">
              Your manager hasn't assigned a pay plan yet. Check back soon or reach out to your dealership owner.
            </Typography>
          </Card>
        }
      />
    );
  }

  const hasTiers = plan.tiers && plan.tiers.length > 0;
  const hasVolume = plan.isVolumeBonusActive && plan.volumeBonuses && plan.volumeBonuses.length > 0;
  const hasMinis = plan.isMinisActive && plan.miniTiers && plan.miniTiers.length > 0;
  const hasHourly = plan.isHourlyActive && plan.hourlyConfig;
  const hasPack = plan.isPackActive && (plan.frontPack || plan.backPack);

  return (
    <DashboardLayout
      header={
        <PageHeader
          icon={ShieldCheck}
          title="My Pay Plan"
          subtitle={isLinked ? `Assigned by ${profile?.orgId ? 'your dealership' : 'your manager'}` : 'Your compensation plan'}
          actions={
            isLinked ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary/10 border border-brand-primary/20">
                <Lock className="h-3.5 w-3.5 text-brand-primary" />
                <Typography variant="mono" className="text-[10px] text-brand-primary font-black uppercase tracking-widest">
                  Dealership Managed
                </Typography>
              </div>
            ) : undefined
          }
        />
      }
      main={
        <div className="space-y-4">

          {/* Template badge */}
          {isLinked && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
              <Layers className="h-4 w-4 text-slate-500 shrink-0" />
              <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                This plan is managed by your dealership and updates automatically when your dealer makes changes.
              </Typography>
            </div>
          )}

          {/* Commission Rates */}
          <Section
            icon={<TrendingUp className="h-4 w-4 text-brand-primary" />}
            title="Commission Rates"
            subtitle="Front & back end"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <Stat label="Front End" value={fmt(plan.frontEndPercentage)} highlight />
              <Stat label="Back End" value={fmt(plan.backEndPercentage)} highlight />
              {plan.isFlatPerUnitActive && plan.flatPerUnitAmount > 0 && (
                <Stat label="Flat / Unit" value={fmtCurrency(plan.flatPerUnitAmount)} />
              )}
            </div>

            {/* Commission tiers */}
            {hasTiers && (
              <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                  Unit Tiers
                </Typography>
                <div className="space-y-1.5">
                  {plan.tiers.map((tier, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <Typography variant="mono" className="text-[11px] text-slate-400 font-bold">
                        {tier.threshold ?? i + 1}+ units
                      </Typography>
                      <div className="flex items-center gap-3">
                        {tier.frontRate != null && (
                          <Typography variant="mono" className="text-[11px] text-brand-primary font-black">
                            Front {tier.frontRate}%
                          </Typography>
                        )}
                        {tier.backRate != null && (
                          <Typography variant="mono" className="text-[11px] text-slate-400 font-bold">
                            Back {tier.backRate}%
                          </Typography>
                        )}
                        {tier.bonusAmount > 0 && (
                          <Typography variant="mono" className="text-[11px] text-emerald-400 font-black">
                            +{fmtCurrency(tier.bonusAmount)}
                          </Typography>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Minis & Hourly */}
          {(hasMinis || hasHourly) && (
            <Section
              icon={<DollarSign className="h-4 w-4 text-brand-primary" />}
              title="Minis & Hourly"
              subtitle="Base compensation"
            >
              {hasMinis && plan.miniTiers && (
                <div className="space-y-2">
                  <Typography variant="mono" className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">
                    Mini Ladder
                  </Typography>
                  <div className="space-y-1.5">
                    {plan.miniTiers.filter(t => t.active).map((tier, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <Typography variant="mono" className="text-[11px] text-slate-400 font-bold">
                          {tier.threshold}–{tier.maxUnits ?? '∞'} units
                        </Typography>
                        <div className="flex items-center gap-3">
                          <Typography variant="mono" className="text-[11px] text-brand-primary font-black">
                            New {fmtCurrency(tier.newMini)}
                          </Typography>
                          <Typography variant="mono" className="text-[11px] text-slate-400 font-bold">
                            Used {fmtCurrency(tier.usedMini)}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasHourly && plan.hourlyConfig && (
                <div className="grid grid-cols-2 gap-6 pt-2 border-t border-white/[0.05]">
                  <Stat label="Hourly Rate" value={fmtCurrency(plan.hourlyConfig.rate)} highlight />
                  <Stat label="Hours / Month" value={String(plan.hourlyConfig.hoursWorked ?? '—')} />
                </div>
              )}
            </Section>
          )}

          {/* Volume Bonuses */}
          {hasVolume && plan.volumeBonuses && (
            <Section
              icon={<Zap className="h-4 w-4 text-brand-primary" />}
              title="Volume Bonuses"
              subtitle="Hit the number, earn the bonus"
            >
              <div className="space-y-1.5">
                {plan.volumeBonuses.filter(b => b.active).map((bonus, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <Typography variant="mono" className="text-[11px] text-slate-400 font-bold">
                      {bonus.threshold} units
                    </Typography>
                    <Typography variant="mono" className="text-[11px] text-brand-primary font-black">
                      +{fmtCurrency(bonus.amount)}
                    </Typography>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Pack Deductions */}
          {hasPack && (
            <Section
              icon={<Info className="h-4 w-4 text-brand-primary" />}
              title="Pack Deductions"
              subtitle="Applied before your commission is calculated"
            >
              <div className="grid grid-cols-2 gap-6">
                {plan.frontPack ? <Stat label="Front Pack" value={fmtCurrency(plan.frontPack)} /> : null}
                {plan.backPack ? <Stat label="Back Pack" value={fmtCurrency(plan.backPack)} /> : null}
              </div>
            </Section>
          )}

          {/* Footer note */}
          <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
            <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
            <Typography variant="mono" className="text-[10px] text-slate-600 font-bold leading-relaxed">
              Questions about your pay plan? Speak with your dealership manager. This view is for reference only.
            </Typography>
          </div>
        </div>
      }
    />
  );
};
