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
import { estimateCommission, calculateDealCommission, getActiveCommissionTier, getDealUnitPosition } from '@/src/lib/commissionLogic';
import { cn, formatDateSafe, getCalendarMonth, getCalendarYear } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Deal, DealStatus, PayPlan } from '@/src/types';
import { useAppData } from '@/src/contexts/AppDataContext';

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
  const { deals } = useAppData();
  const [showGross, setShowGross] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  
  // Get all deals for the same month to provide context for commission calculation
  const monthlyDeals = React.useMemo(() => {
    const month = getCalendarMonth(deal.date);
    const year = getCalendarYear(deal.date);
    
    return deals.filter(d => {
      return getCalendarMonth(d.date) === month && getCalendarYear(d.date) === year;
    });
  }, [deals, deal.date]);

  const commission = payPlan ? calculateDealCommission(deal, payPlan, monthlyDeals) : null;
  const isFinalized = deal.status === DealStatus.FINALIZED;

  // Determine effective rates for display
  const unitPosition = getDealUnitPosition(deal, monthlyDeals);
  const totalUnits = monthlyDeals.reduce((sum, d) => sum + (d.isSplitDeal ? (d.splitPercentage || 50) / 100 : 1), 0);
  
  const highestTier = payPlan?.tiers ? getActiveCommissionTier(totalUnits, payPlan.tiers) : null;
  const tierAtSale = payPlan?.tiers ? getActiveCommissionTier(unitPosition, payPlan.tiers) : null;

  const effectiveFrontRate = (highestTier?.frontRetroactive && highestTier.frontRate !== undefined)
    ? highestTier.frontRate
    : (tierAtSale?.frontRate ?? payPlan?.frontEndPercentage ?? 0);

  const effectiveBackRate = (highestTier?.backRetroactive && highestTier.backRate !== undefined)
    ? highestTier.backRate
    : (tierAtSale?.backRate ?? payPlan?.backEndPercentage ?? 0);

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(deal);
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 
        StripeItConfirmationSystem - centralized modal for critical actions
      */}
      <Modal 
        isOpen={showConfirm} 
        onClose={() => !isDeleting && setShowConfirm(false)}
        title="Confirm Deletion"
        className="max-w-md"
      >
        <div className="space-y-6">
          <Typography variant="p" className="text-slate-400">
            Are you sure you want to permanently delete the deal for <span className="text-white font-black">{deal.customerName}</span>? This action cannot be undone.
          </Typography>
          
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-2xl border-white/5"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest"
              onClick={handleConfirmDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

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
                <Typography variant="small" className="text-slate-500">Net Est. Payout</Typography>
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
                        <Typography variant="mono" className="text-[9px] text-slate-500 block">@ {effectiveFrontRate}%</Typography>
                      </div>
                      <div>
                        <Typography variant="small" className="text-slate-600 mb-0.5 block">Back Gross</Typography>
                        <Typography variant="label" className="text-white">${deal.backEndGross.toLocaleString()}</Typography>
                        <Typography variant="mono" className="text-[9px] text-slate-500 block">@ {effectiveBackRate}%</Typography>
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
          onClick={() => !isFinalized && setShowConfirm(true)}
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
