import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ArrowUpRight, Target, TrendingUp, DollarSign, Edit2, Check, ChevronDown, ChevronUp, History } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useAppData } from '@/src/contexts/AppDataContext';
import { goalService } from '@/src/services/goalService';
import { PageHeader } from '../ui/PageHeader';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Goal } from '@/src/types';

export const GoalsView: React.FC = () => {
  const { user, profile } = useAuth();
  const { deals, goal, refreshDeals } = useAppData();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [unitGoal, setUnitGoal] = useState<string>('');
  const [grossGoal, setGrossGoal] = useState<string>('');
  const [commissionGoal, setCommissionGoal] = useState<string>('');

  const [historyGoals, setHistoryGoals] = useState<Goal[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Re-sync form state when goal changes
  useEffect(() => {
    setUnitGoal(goal?.unitGoal?.toString() || '');
    setGrossGoal(goal?.grossGoal?.toString() || '');
    setCommissionGoal(goal?.commissionGoal?.toString() || '');
  }, [goal]);

  // Derived data
  const {
    currentMonth,
    currentMonthDeals,
    actualUnits,
    actualGross,
    daysInMonth,
    daysPassed,
    daysRemaining,
    pacingUnits,
    unitProgress,
    grossProgress,
  } = useMemo(() => {
    const monthStr = new Date().toISOString().slice(0, 7);
    const monthDeals = deals.filter((deal) => deal.date.startsWith(monthStr));

    const unitsSum = monthDeals.reduce((sum, deal) => {
      const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
      return sum + splitRatio;
    }, 0);

    const grossSum = monthDeals.reduce((sum, deal) => {
      const splitRatio = deal.isSplitDeal ? (deal.splitPercentage || 50) / 100 : 1;
      return sum + (deal.frontEndGross + deal.backEndGross) * splitRatio;
    }, 0);

    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const daysIn = new Date(year, monthIndex + 1, 0).getDate();
    const passed = Math.max(now.getDate(), 1);
    const remaining = Math.max(daysIn - now.getDate(), 0);
    const pacing = (unitsSum / passed) * daysIn;

    const unitProg = goal?.unitGoal ? Math.min((unitsSum / goal.unitGoal) * 100, 100) : 0;
    const grossProg = goal?.grossGoal ? Math.min((grossSum / goal.grossGoal) * 100, 100) : 0;

    return {
      currentMonth: monthStr,
      currentMonthDeals: monthDeals,
      actualUnits: unitsSum,
      actualGross: grossSum,
      daysInMonth: daysIn,
      daysPassed: passed,
      daysRemaining: remaining,
      pacingUnits: pacing,
      unitProgress: unitProg,
      grossProgress: grossProg,
    };
  }, [deals, goal]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setIsSaving(true);
    try {
      await goalService.saveGoal({
        userId: user.uid,
        orgId: profile.orgId || '',
        month: currentMonth,
        unitGoal: Number(unitGoal) || 0,
        grossGoal: Number(grossGoal) || 0,
        commissionGoal: Number(commissionGoal) || 0,
      });
      await refreshDeals();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save goals:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUnitGoal(goal?.unitGoal?.toString() || '');
    setGrossGoal(goal?.grossGoal?.toString() || '');
    setCommissionGoal(goal?.commissionGoal?.toString() || '');
    setIsEditing(false);
  };

  useEffect(() => {
    if (!showHistory || !user || !profile) return;
    setIsLoadingHistory(true);
    goalService.getGoalsHistory(
      user.uid,
      profile.orgId || '',
      6
    ).then(data => {
      setHistoryGoals(data);
      setIsLoadingHistory(false);
    }).catch(() => setIsLoadingHistory(false));
  }, [showHistory, user, profile]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* A. PageHeader */}
      <PageHeader
        title="Career Goals"
        subtitle="Pacing • targets • ambition"
        icon={ArrowUpRight}
      >
        {isEditing ? (
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            className="text-xs uppercase font-black tracking-widest"
          >
            <Check className="mr-2 h-4 w-4" />
            Save Goals
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setIsEditing(true)}
            className="text-xs uppercase font-black tracking-widest border border-white/10 hover:bg-white/5"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            Set Goals
          </Button>
        )}
      </PageHeader>

      {/* B. Empty State Card */}
      {!goal && !isEditing && (
        <Card className="flex flex-col items-center justify-center text-center p-12 max-w-md mx-auto bg-white/[0.02] border-white/5">
          <div className="h-16 w-16 rounded-full bg-brand-primary/15 flex items-center justify-center mb-6">
            <Target className="h-8 w-8 text-brand-primary" />
          </div>
          <Typography variant="h3" className="mb-2 italic uppercase font-black tracking-tight text-white">
            No Goals Set
          </Typography>
          <Typography variant="p" className="text-sm text-slate-400 mb-8 max-w-sm">
            Define your monthly targets to start tracking your pacing.
          </Typography>
          <Button
            variant="primary"
            onClick={() => setIsEditing(true)}
            className="text-xs tracking-widest font-black uppercase"
          >
            Set My Goals
          </Button>
        </Card>
      )}

      {/* C. Goal input form */}
      {isEditing && (
        <Card className="bg-white/[0.02] border-white/5 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-5 w-5 text-brand-primary" />
            <Typography variant="h4" className="italic uppercase font-black">
              Define Current Month Targets
            </Typography>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Input
              label="Monthly Unit Goal"
              type="number"
              value={unitGoal}
              onChange={(e) => setUnitGoal(e.target.value)}
              placeholder="e.g. 15"
              min="0"
              step="any"
            />
            <Input
              label="Gross Revenue Goal"
              type="number"
              value={grossGoal}
              onChange={(e) => setGrossGoal(e.target.value)}
              placeholder="e.g. 30000"
              min="0"
              step="any"
            />
            <Input
              label="Commission Goal"
              type="number"
              value={commissionGoal}
              onChange={(e) => setCommissionGoal(e.target.value)}
              placeholder="e.g. 10000"
              min="0"
              step="any"
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={handleCancel}
              className="text-xs uppercase font-black tracking-widest"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={handleSave}
              isLoading={isSaving}
              className="text-xs uppercase font-black tracking-widest"
            >
              Save Goals
            </Button>
          </div>
        </Card>
      )}

      {/* D. Progress cards grid */}
      {goal && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1 — Units */}
          <Card className="flex flex-col gap-4 bg-white/[0.02] border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <Typography variant="mono" className="text-[10px] text-slate-400">
                UNITS SOLD
              </Typography>
              <Target className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <Typography variant="h2" className="text-3xl font-black italic uppercase leading-none text-white">
                {actualUnits}
              </Typography>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-primary h-full transition-all duration-500 ease-out"
                style={{ width: `${unitProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-400 font-bold">
                {actualUnits} of {goal.unitGoal} units
              </span>
              <span className="text-[10px] text-brand-primary font-mono tracking-wider">
                {Math.round(unitProgress)}%
              </span>
            </div>
          </Card>

          {/* Card 2 — Gross */}
          <Card className="flex flex-col gap-4 bg-white/[0.02] border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <Typography variant="mono" className="text-[10px] text-slate-400">
                TOTAL GROSS
              </Typography>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <Typography variant="h2" className="text-3xl font-black italic uppercase leading-none text-white">
                ${Math.round(actualGross).toLocaleString()}
              </Typography>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-500 ease-out"
                style={{ width: `${grossProgress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-400 font-bold">
                ${Math.round(actualGross).toLocaleString()} of ${goal.grossGoal?.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-wider">
                {Math.round(grossProgress)}%
              </span>
            </div>
          </Card>

          {/* Card 3 — Pacing */}
          <Card className="flex flex-col gap-4 bg-white/[0.02] border-white/5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <Typography variant="mono" className="text-[10px] text-slate-400">
                PROJECTED UNITS
              </Typography>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <Typography
                variant="h2"
                className={`text-3xl font-black italic uppercase leading-none ${
                  pacingUnits >= goal.unitGoal ? 'text-brand-primary' : 'text-amber-400'
                }`}
              >
                {pacingUnits.toFixed(1)}
              </Typography>
            </div>
            <div className="w-full bg-slate-800/10 h-2.5 rounded-full overflow-hidden" />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-slate-400 font-bold">
                {daysRemaining} days remaining
              </span>
              <span className={`text-[10px] font-mono tracking-wider font-bold ${
                pacingUnits >= goal.unitGoal ? 'text-brand-primary' : 'text-amber-400'
              }`}>
                {pacingUnits >= goal.unitGoal ? 'ON TRACK' : 'BEHIND'}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Historical Goals Section */}
      <div className="space-y-4">
        <button
          onClick={() => setShowHistory(p => !p)}
          className="flex items-center gap-2 w-full py-3
            px-1 border-t border-white/5 text-left group"
        >
          <History className="h-4 w-4 text-slate-600
            group-hover:text-brand-primary transition-colors"
          />
          <Typography variant="mono" className="text-[10px]
            text-slate-500 uppercase font-black tracking-widest
            group-hover:text-slate-300 transition-colors flex-1">
            Historical Goals
          </Typography>
          {showHistory
            ? <ChevronUp size={14} className="text-slate-600" />
            : <ChevronDown size={14}
                className="text-slate-600" />
          }
        </button>

        {showHistory && (
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="grid grid-cols-1 lg:grid-cols-3
                gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-48 rounded-2xl
                    bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : historyGoals.length === 0 ? (
              <div className="py-12 text-center">
                <Typography variant="mono"
                  className="text-slate-600 text-[10px]
                  uppercase tracking-widest font-black">
                  No historical goals found
                </Typography>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3
                gap-6">
                {historyGoals.map((hGoal) => {
                  const label = new Date(
                    hGoal.month + '-02'
                  ).toLocaleString('default', {
                    month: 'long', year: 'numeric'
                  });

                  const hDeals = deals.filter(d =>
                    d.date.startsWith(hGoal.month)
                  );
                  const hUnits = hDeals.reduce((sum, d) =>
                    sum + (d.isSplitDeal
                      ? (d.splitPercentage || 50) / 100
                      : 1), 0);
                  const hGross = hDeals.reduce((sum, d) => {
                    const r = d.isSplitDeal
                      ? (d.splitPercentage || 50) / 100 : 1;
                    return sum + (d.frontEndGross +
                      d.backEndGross) * r;
                  }, 0);
                  const hUnitProg = hGoal.unitGoal
                    ? Math.min(
                        (hUnits / hGoal.unitGoal) * 100, 100
                      )
                    : 0;
                  const hGrossProg = hGoal.grossGoal
                    ? Math.min(
                        (hGross / hGoal.grossGoal) * 100, 100
                      )
                    : 0;
                  const onTrack = hUnits >= hGoal.unitGoal;
                  const hasNoData = hDeals.length === 0 &&
                    !hGoal.unitGoal && !hGoal.grossGoal;

                  return (
                    <Card key={hGoal.month}
                      className="flex flex-col gap-4
                      bg-white/[0.02] border-white/5
                      relative overflow-hidden opacity-80
                      hover:opacity-100 transition-opacity">
                      <div className="flex items-center
                        justify-between">
                        <Typography variant="mono"
                          className="text-[10px] text-slate-400
                          uppercase font-black tracking-widest">
                          {label}
                        </Typography>
                        <span className={`text-[9px] font-mono
                          font-black tracking-wider px-2 py-0.5
                          rounded-full border
                          ${onTrack
                            ? 'text-brand-primary border-brand-primary/20 bg-brand-primary/5'
                            : 'text-amber-400 border-amber-400/20 bg-amber-400/5'
                          }`}>
                          {onTrack ? 'HIT' : 'MISSED'}
                        </span>
                      </div>

                      {hasNoData ? (
                        <div className="flex items-center justify-center
                          py-8">
                          <Typography variant="mono" className="text-[10px]
                            text-slate-600 uppercase tracking-widest
                            font-black text-center">
                            No goals were tracked<br />for this period
                          </Typography>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between
                              mb-1">
                              <Typography variant="mono"
                                className="text-[9px] text-slate-500">
                                UNITS
                              </Typography>
                              <Typography variant="mono"
                                className="text-[9px]
                                text-slate-400 font-black">
                                {hUnits.toFixed(1)} /
                                {hGoal.unitGoal}
                              </Typography>
                            </div>
                            <div className="w-full bg-slate-800
                              h-1.5 rounded-full overflow-hidden">
                              <div className="bg-brand-primary
                                h-full transition-all duration-500"
                                style={{ width:
                                  `${hUnitProg}%` }} />
                            </div>
                          </div>

                          {hGoal.grossGoal ? (
                            <div>
                              <div className="flex justify-between
                                mb-1">
                                <Typography variant="mono"
                                  className="text-[9px]
                                  text-slate-500">
                                  GROSS
                                </Typography>
                                <Typography variant="mono"
                                  className="text-[9px]
                                  text-slate-400 font-black">
                                  ${Math.round(
                                    hGross
                                  ).toLocaleString()} /
                                  ${hGoal.grossGoal
                                    .toLocaleString()}
                                </Typography>
                              </div>
                              <div className="w-full bg-slate-800
                                h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-400
                                  h-full transition-all duration-500"
                                  style={{ width:
                                    `${hGrossProg}%` }} />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
