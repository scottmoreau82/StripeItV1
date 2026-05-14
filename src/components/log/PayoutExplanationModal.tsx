import React from 'react';
import { CommissionResult } from '@/src/lib/commissionLogic';
import { Modal } from '../ui/Modal';
import { Typography } from '../ui/Typography';
import { AppIcon } from '../ui/AppIcon';
import { cn } from '@/src/lib/utils';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface PayoutExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  commission: CommissionResult | null;
  customerName: string;
}

export const PayoutExplanationModal: React.FC<PayoutExplanationModalProps> = ({
  isOpen,
  onClose,
  commission,
  customerName
}) => {
  if (!commission || !commission.explanation) return null;

  const { explanation } = commission;

  const formatCurrency = (amt: number) => 
    `$${amt.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payout Explanation"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Deal Header */}
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
          <div>
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Customer</Typography>
            <Typography variant="h4" className="text-white">{customerName}</Typography>
          </div>
          <div className="text-right">
            <Typography variant="mono" className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 text-right">Final Payout</Typography>
            <Typography variant="h4" className="text-emerald-400 font-black">{formatCurrency(commission.finalPayout)}</Typography>
          </div>
        </div>

        {/* Calculation Steps */}
        <div className="space-y-4">
          
          {/* Front End */}
          <section className="space-y-2">
             <div className="flex items-center gap-2 mb-3">
               <div className="h-6 w-0.5 bg-cyan-500 rounded-full" />
               <Typography variant="mono" className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Front-End Commission</Typography>
             </div>
             <Card className="bg-white/[0.02] border-white/5 p-4">
               {explanation.frontEndGross > 0 ? (
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400">Front Gross × Rate</span>
                     <span className="text-slate-200 font-mono">
                       {formatCurrency(explanation.frontEndGross)} × {explanation.frontRate}%
                     </span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-white/5">
                     <span className="text-slate-200 font-bold">Frontend Payout</span>
                     <span className="text-white font-mono font-black">{formatCurrency(commission.frontEndCommission)}</span>
                   </div>
                 </div>
               ) : (
                 <Typography variant="small" className="text-slate-600 italic">No Front-End Gross recorded.</Typography>
               )}
             </Card>
          </section>

          {/* Back End */}
          <section className="space-y-2">
             <div className="flex items-center gap-2 mb-3">
               <div className="h-6 w-0.5 bg-purple-500 rounded-full" />
               <Typography variant="mono" className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Back-End Commission</Typography>
             </div>
             <Card className="bg-white/[0.02] border-white/5 p-4">
               {explanation.backEndGross > 0 ? (
                 <div className="space-y-3">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400">Back Gross × Rate</span>
                     <span className="text-slate-200 font-mono">
                       {formatCurrency(explanation.backEndGross)} × {explanation.backRate}%
                     </span>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-white/5">
                     <span className="text-slate-200 font-bold">Backend Payout</span>
                     <span className="text-white font-mono font-black">{formatCurrency(commission.backEndCommission)}</span>
                   </div>
                 </div>
               ) : (
                 <Typography variant="small" className="text-slate-600 italic">No Back-End Gross recorded.</Typography>
               )}
             </Card>
          </section>

          {/* Add-ons/Rules/Flats */}
          <section className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
               <div className="h-6 w-0.5 bg-amber-500 rounded-full" />
               <Typography variant="mono" className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Flat Units & Bonuses</Typography>
             </div>
             <Card className="bg-white/[0.02] border-white/5 p-4 space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-400">Flat Per Unit {explanation.isFlatActive ? '' : '(Inactive)'}</span>
                  <span className={cn("font-mono", explanation.isFlatActive ? "text-slate-200" : "text-slate-600")}>
                    {formatCurrency(explanation.flatPerUnit)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-slate-400">Deal Rules & Bonuses</span>
                  <div className="text-right">
                    <span className="text-slate-200 font-mono block transition-all">
                      {formatCurrency(explanation.totalRuleBonuses)}
                    </span>
                    {commission.appliedRules.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1 justify-end">
                        {commission.appliedRules.map(rule => (
                          <Badge key={rule} variant="outline" className="text-[8px] px-1 py-0 border-white/10 opacity-70">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
             </Card>
          </section>

          {/* Mini Floor */}
          <section className="space-y-2">
             <div className="flex items-center gap-2 mb-3">
               <div className="h-6 w-0.5 bg-emerald-500 rounded-full" />
               <Typography variant="mono" className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Minimum Floor (Mini)</Typography>
             </div>
             <Card className={cn("p-4 border-white/5 transition-all", explanation.wasMiniApplied ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/[0.02]")}>
               <div className="space-y-3">
                 <div className="flex justify-between items-center text-[13px]">
                   <div className="flex items-center gap-2">
                     <span className="text-slate-400">Mini Amount</span>
                     {explanation.wasMiniApplied && (
                       <Badge variant="success" className="bg-emerald-500/20 text-emerald-400 border-none text-[8px] uppercase">Applied</Badge>
                     )}
                   </div>
                   <span className="text-slate-200 font-mono">{formatCurrency(explanation.miniAmount)}</span>
                 </div>
                 
                 {!explanation.isMinisActive && (
                   <Typography variant="small" className="text-slate-600 italic text-[11px]">Mini system inactive — not included.</Typography>
                 )}

                 {explanation.isMinisActive && (
                   <div className="text-[11px] text-slate-500 pt-1 border-t border-white/5">
                     {explanation.isDeficitRecovery ? (
                       <span>Recovery Model: Calculated from <strong>Total Payable</strong> ({formatCurrency(explanation.totalPayable)})</span>
                     ) : (
                       <span>Independent Model: Calculated from <strong>Front Portion</strong> ({formatCurrency(explanation.frontPayable)})</span>
                     )}
                   </div>
                 )}
               </div>
             </Card>
          </section>

          {/* Split Adjustment */}
          {explanation.isSplit && (
            <section className="space-y-2">
               <div className="flex items-center gap-2 mb-3">
                 <div className="h-6 w-0.5 bg-rose-500 rounded-full" />
                 <Typography variant="mono" className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Split Adjustment</Typography>
               </div>
               <Card className="bg-rose-500/5 border-rose-500/20 p-4">
                 <div className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                     <span className="text-slate-400">Split Percentage</span>
                     <span className="text-slate-200 font-mono">{(explanation.splitRatio * 100)}%</span>
                   </div>
                   {explanation.splitBehavior === 'half_mini' && explanation.wasMiniApplied && (
                     <Typography variant="small" className="text-rose-400 text-[10px] uppercase font-black">Half-Mini Behavior Active</Typography>
                   )}
                   <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                     <span className="text-slate-200 font-bold">Adjustment</span>
                     <span className="text-white font-mono font-black">
                       {explanation.splitBehavior === 'half_mini' && explanation.wasMiniApplied 
                         ? formatCurrency(explanation.miniAmount / 2)
                         : `× ${explanation.splitRatio}`
                       }
                     </span>
                   </div>
                 </div>
               </Card>
            </section>
          )}

          {/* Deal SPIFF */}
          {explanation.spiffAmount > 0 && (
            <section className="space-y-2">
               <div className="flex items-center gap-2 mb-3">
                 <div className="h-6 w-0.5 bg-blue-500 rounded-full" />
                 <Typography variant="mono" className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Deal SPIFF</Typography>
               </div>
               <Card className={cn("p-4 border-blue-500/20", explanation.spiffIncludedInTotal ? "bg-blue-500/5" : "bg-white/[0.02] border-white/10")}>
                 <div className="flex justify-between items-center">
                    <span className="text-slate-200">
                      {explanation.spiffIncludedInTotal ? 'Included in Total Pay' : 'Separate Line Item'}
                    </span>
                    <span className={cn("font-mono font-black", explanation.spiffIncludedInTotal ? "text-white" : "text-slate-500")}>
                      +{formatCurrency(explanation.spiffAmount)}
                    </span>
                 </div>
                 {!explanation.spiffIncludedInTotal && (
                   <Typography variant="small" className="text-slate-500 text-[10px] mt-1 italic">
                     Not included in Final Estimated Payout total.
                   </Typography>
                 )}
               </Card>
            </section>
          )}

          {/* Final Summary */}
          <section className="pt-6 border-t border-white/10">
            <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-5 shadow-inner">
               <div className="flex justify-between items-center">
                 <div>
                   <Typography variant="mono" className="text-[10px] text-brand-primary uppercase tracking-[0.2em] font-black mb-1">Final Estimated Payout</Typography>
                   <Typography variant="h2" className="text-emerald-400 font-black">{formatCurrency(commission.finalPayout)}</Typography>
                 </div>
                 <AppIcon name="shield-check" className="h-10 w-10 text-emerald-500/20" />
               </div>
            </div>
            <Typography variant="small" className="text-slate-600 text-center mt-4 text-[10px] uppercase tracking-widest">
              Calculated using standard StripeIt payout engine
            </Typography>
          </section>

        </div>
      </div>
    </Modal>
  );
};
