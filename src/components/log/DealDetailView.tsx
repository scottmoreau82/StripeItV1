import React from 'react';
import { 
  User, 
  Car, 
  Calendar, 
  Hash, 
  DollarSign, 
  Trash2, 
  Edit3, 
  Clock, 
  Tag, 
  FileText,
  Users,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { estimateCommission } from '@/src/lib/commissionLogic';
import { cn, formatDateSafe } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Deal, DealStatus, PayPlan } from '@/src/types';

/**
 * StripeItDealDetailSystem
 * Comprehensive view of a single deal's data and calculations.
 */

interface DealDetailViewProps {
  deal: Deal;
  payPlan?: PayPlan | null;
  onClose: () => void;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  onStatusChange?: (deal: Deal, newStatus: DealStatus) => void;
}

export const DealDetailView: React.FC<DealDetailViewProps> = ({
  deal,
  payPlan,
  onClose,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const [showGross, setShowGross] = React.useState(false);
  const commission = payPlan ? estimateCommission(deal, payPlan) : null;
  
  const isFinalized = deal.status === DealStatus.FINALIZED;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography variant="h2" className="text-white mb-1">
            {deal.customerName}
          </Typography>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Badge status={deal.status} className="cursor-pointer hover:opacity-80 transition-opacity">
                {deal.status}
              </Badge>
              
              {/* Status Quick Switcher (Desktop focus, simple variant) */}
              <select 
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                value={deal.status}
                onChange={(e) => onStatusChange?.(deal, e.target.value as DealStatus)}
              >
                {Object.values(DealStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Calendar size={12} />
              <Typography variant="mono" className="text-[10px] uppercase">{deal.date}</Typography>
            </div>
          </div>
        </div>
        <div className="text-right">
          <Typography variant="mono" className="text-[10px] text-slate-600 block mb-1">STK #</Typography>
          <Typography variant="label" className="text-white">
            {deal.stockNumber || '---'}
          </Typography>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle Info */}
        <Card className="p-4 bg-white/[0.02] border-white/5">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <Car size={14} />
            <Typography variant="mono" className="text-[10px] uppercase tracking-wider">Vehicle Details</Typography>
          </div>
          <div className="space-y-3">
            <div>
              <Typography variant="small" className="text-slate-500 block">Unit</Typography>
              <Typography variant="p" className="text-white">{deal.purchasedVehicle}</Typography>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Typography variant="small" className="text-slate-500 block">Condition</Typography>
                <Typography variant="p" className="text-white capitalize">{deal.newOrUsed}</Typography>
              </div>
              <div>
                <Typography variant="small" className="text-slate-500 block">Deal #</Typography>
                <Typography variant="p" className="text-white">{deal.dealNumber || 'N/A'}</Typography>
              </div>
            </div>
          </div>
        </Card>

        {/* Financial Info (Commission Focus) */}
        <Card className={cn(
          "p-4 border transition-all",
          isFinalized ? "bg-emerald-500/[0.03] border-emerald-500/10" : "bg-brand-primary/[0.03] border-brand-primary/10"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-brand-primary">
              <DollarSign size={14} />
              <Typography variant="mono" className="text-[10px] uppercase tracking-wider">Estimated Payout</Typography>
            </div>
            <button 
              onClick={() => setShowGross(!showGross)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              {showGross ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          
          {commission ? (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <Typography variant="small" className="text-slate-500">Net Commission</Typography>
                <Typography variant="h2" className="text-emerald-400">
                  ${commission.finalPayout.toLocaleString()}
                </Typography>
              </div>
              
              <AnimatePresence>
                {showGross && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 border-t border-white/5 space-y-3 overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Typography variant="small" className="text-slate-600 mb-0.5 block">Front Gross</Typography>
                        <Typography variant="label" className="text-white">${deal.frontEndGross.toLocaleString()}</Typography>
                        <Typography variant="mono" className="text-[9px] text-slate-500 block">@ {payPlan?.frontEndPercentage}%</Typography>
                      </div>
                      <div>
                        <Typography variant="small" className="text-slate-600 mb-0.5 block">Back Gross</Typography>
                        <Typography variant="label" className="text-white">${deal.backEndGross.toLocaleString()}</Typography>
                        <Typography variant="mono" className="text-[9px] text-slate-500 block">@ {payPlan?.backEndPercentage}%</Typography>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-white/[0.03]">
                      <div className="flex justify-between">
                        <Typography variant="small" className="text-slate-500">Front Comm.</Typography>
                        <Typography variant="small" className="text-slate-300">${commission.frontEndCommission.toLocaleString()}</Typography>
                      </div>
                      <div className="flex justify-between">
                        <Typography variant="small" className="text-slate-500">Back Comm.</Typography>
                        <Typography variant="small" className="text-slate-300">${commission.backEndCommission.toLocaleString()}</Typography>
                      </div>
                      {deal.isSplitDeal && (
                        <div className="flex justify-between text-amber-500/80">
                          <Typography variant="small" className="font-medium">Split ({deal.splitPercentage || 50}%)</Typography>
                          <Typography variant="small" className="font-bold">-${(commission.frontEndCommission + commission.backEndCommission - commission.finalPayout).toLocaleString()}</Typography>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Clock className="text-slate-700 mb-2" size={24} />
              <Typography variant="small" className="text-slate-600">
                Setup your Pay Plan to see estimated commissions.
              </Typography>
            </div>
          )}
        </Card>
      </div>

      {/* Internal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-950 border-white/5 h-full">
          <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-600 mb-4 block">Salesperson Notes</Typography>
          <Typography variant="p" className="text-slate-400 text-sm italic">
            {deal.notes || "No notes provided."}
          </Typography>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 bg-white/[0.01] border-white/5">
            <Typography variant="mono" className="text-[10px] uppercase tracking-widest text-slate-600 mb-4 block">Timeline</Typography>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Typography variant="small" className="text-slate-500">Created</Typography>
                <Typography variant="mono" className="text-[9px] text-slate-400">
                  {formatDateSafe(deal.createdAt, "Pp")}
                </Typography>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="small" className="text-slate-500">Last Updated</Typography>
                <Typography variant="mono" className="text-[9px] text-slate-400">
                  {formatDateSafe(deal.updatedAt, "Pp")}
                </Typography>
              </div>
            </div>
          </Card>
          
          {deal.tradedVehicle && (
            <Card className="p-4 bg-white/[0.01] border-white/5">
              <div className="flex items-center gap-2 mb-2 text-slate-500">
                <Tag size={12} />
                <Typography variant="mono" className="text-[10px] uppercase tracking-wider">Trade-In</Typography>
              </div>
              <Typography variant="p" className="text-slate-300">{deal.tradedVehicle}</Typography>
            </Card>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4 border-t border-white/5">
        <Button 
          variant="outline" 
          className={cn(
            "flex-1 rounded-2xl border-white/10",
            isFinalized && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !isFinalized && onEdit?.(deal)}
          disabled={isFinalized}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Deal
        </Button>
        <Button 
          variant="outline" 
          className={cn(
            "flex-1 rounded-2xl border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/40",
            isFinalized && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !isFinalized && onDelete?.(deal)}
          disabled={isFinalized}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {isFinalized && (
        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <Typography variant="mono" className="text-[9px] text-emerald-500/80 uppercase font-bold tracking-widest">
            This record is finalized and locked
          </Typography>
        </div>
      )}
    </div>
  );
};
