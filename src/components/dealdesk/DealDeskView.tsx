import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Typography } from '../ui/Typography';
import { Button } from '../ui/Button';
import { Sparkles, Edit2, ChevronDown, ChevronUp, Plus, Trash2, HelpCircle } from 'lucide-react';
import { DashboardLayout } from '../layout/DashboardLayout';
import { PageHeader } from '../ui/PageHeader';
import { Modal } from '../ui/Modal';
import { useAuth } from '@/src/contexts/AuthContext';

// Types for Add-ons
interface AddonItem {
  id: string;
  description: string;
  price: number;
  cost: number;
}

export const DealDeskView: React.FC = () => {
  const { profile, updateProfileData } = useAuth();

  // --- INITIAL / DEFAULT STATE CONTROLS ---
  const [msrp, setMsrp] = useState<number>(35000);
  const [cost, setCost] = useState<number>(31000);
  const [discount, setDiscount] = useState<number>(2000);
  const [rebate, setRebate] = useState<number>(1000);
  const [tradeAllowance, setTradeAllowance] = useState<number>(5000);
  const [tradeAcv, setTradeAcv] = useState<number>(4000);
  const [tradePayoff, setTradePayoff] = useState<number>(4500);
  const [backEnds, setBackEnds] = useState<number>(1500);
  const [backEndsCost, setBackEndsCost] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(500);

  // Settings
  const [taxRate, setTaxRate] = useState<number>(9.1); // default 9.1%
  const [pack, setPack] = useState<number>(0);         // default $0
  const [daysFirstPayment, setDaysFirstPayment] = useState<number>(45); // default 45 days

  // Fees details (AZ VLT and Postage editable, default AZ VLT is 488.63)
  const [docFee, setDocFee] = useState<number>(599.50);
  const [registration] = useState<number>(8.00);
  const [title] = useState<number>(5.50);
  const [tireFee] = useState<number>(11.65);
  const [azVlt, setAzVlt] = useState<number>(488.63);
  const [postage] = useState<number>(1.50);

  // --- SIMPLE MODE STATES ---
  const [mode, setMode] = useState<'SIMPLE' | 'FULL'>(() => {
    const saved = localStorage.getItem('stripeit_desk_mode');
    return (saved === 'FULL' || saved === 'SIMPLE') ? saved : 'SIMPLE';
  });

  const [protection1Name, setProtection1Name] = useState<string>("Supreme Protection Pkg");
  const [protection1Amount, setProtection1Amount] = useState<number>(0);
  const [protection2Name, setProtection2Name] = useState<string>("Desert Protection Package");
  const [protection2Amount, setProtection2Amount] = useState<number>(0);

  const [taxRateState, setTaxRateState] = useState<number>(5.6);
  const [taxRateCounty, setTaxRateCounty] = useState<number>(0.7);
  const [taxRateCity, setTaxRateCity] = useState<number>(2.8);

  const [simpleNonTaxFees, setSimpleNonTaxFees] = useState<number>(511.28);

  // Simple rename/inputs states
  const [isEditingP1Name, setIsEditingP1Name] = useState<boolean>(false);
  const [isEditingP2Name, setIsEditingP2Name] = useState<boolean>(false);

  // Modal control for tax rates
  const [isTaxRatesModalOpen, setIsTaxRatesModalOpen] = useState<boolean>(false);
  const [tempTaxRateState, setTempTaxRateState] = useState<number>(5.6);
  const [tempTaxRateCounty, setTempTaxRateCounty] = useState<number>(0.7);
  const [tempTaxRateCity, setTempTaxRateCity] = useState<number>(2.8);

  // --- SAVE TO FIREBASE PROFILE ---
  const handleSaveDeskSetting = async (field: string, value: any) => {
    if (!profile) return;
    try {
      const updatedDeskSettings = {
        ...(profile.deskSettings || {}),
        [field]: value
      };
      await updateProfileData({
        deskSettings: updatedDeskSettings
      } as any);
    } catch (err) {
      console.error("Failed to save desk settings to Firebase:", err);
    }
  };

  const handleModeChange = (newMode: 'SIMPLE' | 'FULL') => {
    setMode(newMode);
    localStorage.setItem('stripeit_desk_mode', newMode);
  };

  const handleSaveTaxRates = async () => {
    try {
      setTaxRateState(tempTaxRateState);
      setTaxRateCounty(tempTaxRateCounty);
      setTaxRateCity(tempTaxRateCity);
      
      if (profile) {
        const updatedDeskSettings = {
          ...(profile.deskSettings || {}),
          taxRateState: tempTaxRateState,
          taxRateCounty: tempTaxRateCounty,
          taxRateCity: tempTaxRateCity
        };
        await updateProfileData({
          deskSettings: updatedDeskSettings
        } as any);
      }
      setIsTaxRatesModalOpen(false);
    } catch (err) {
      console.error("Failed to save tax rates to Firebase:", err);
    }
  };

  // --- LOAD FROM FIREBASE ON MOUNT OR UPDATE ---
  useEffect(() => {
    if (profile?.deskSettings) {
      const ds = profile.deskSettings;
      if (ds.protection1Name !== undefined) setProtection1Name(ds.protection1Name);
      if (ds.protection1Amount !== undefined) setProtection1Amount(ds.protection1Amount);
      if (ds.protection2Name !== undefined) setProtection2Name(ds.protection2Name);
      if (ds.protection2Amount !== undefined) setProtection2Amount(ds.protection2Amount);
      if (ds.docFee !== undefined) setDocFee(ds.docFee);
      if (ds.nonTaxFees !== undefined) setSimpleNonTaxFees(ds.nonTaxFees);
      if (ds.taxRateState !== undefined) setTaxRateState(ds.taxRateState);
      if (ds.taxRateCounty !== undefined) setTaxRateCounty(ds.taxRateCounty);
      if (ds.taxRateCity !== undefined) setTaxRateCity(ds.taxRateCity);
    }
  }, [profile?.deskSettings]);

  // Add-ons list
  const [addons, setAddons] = useState<AddonItem[]>([]);

  // Section Expansion State
  const [isSettingsExpanded, setIsSettingsExpanded] = useState<boolean>(false);
  const [isAddonsExpanded, setIsAddonsExpanded] = useState<boolean>(true);
  const [isFeesExpanded, setIsFeesExpanded] = useState<boolean>(false);

  // Cash down inputs
  const [cashDown1, setCashDown1] = useState<number>(1000);
  const [cashDown2, setCashDown2] = useState<number>(2000);
  const [cashDown3, setCashDown3] = useState<number>(3000);

  // Payment configuration rows (Rate & Term)
  const [row1Rate, setRow1Rate] = useState<number>(8.99);
  const [row1Term, setRow1Term] = useState<number>(60);
  const [row2Rate, setRow2Rate] = useState<number>(8.99);
  const [row2Term, setRow2Term] = useState<number>(66);
  const [row3Rate, setRow3Rate] = useState<number>(8.99);
  const [row3Term, setRow3Term] = useState<number>(72);

  // Modals state
  const [isRollBackOpen, setIsRollBackOpen] = useState<boolean>(false);
  const [isLtvOpen, setIsLtvOpen] = useState<boolean>(false);

  // Roll Back Calculator Modal State
  const [targetPayment, setTargetPayment] = useState<number>(600);
  const [rollToField, setRollToField] = useState<'discount' | 'tradeAllowance' | 'msrp' | 'cashDown' | 'rate'>('discount');
  const [rollColumn, setRollColumn] = useState<number>(0); // 0 = Column 1, 1 = Column 2, 2 = Column 3
  const [rollBackOutputs, setRollBackOutputs] = useState<{ newValue: number; newGross: number } | null>(null);

  // LTV Modal Selected Column
  const [selectedLtvColumn, setSelectedLtvColumn] = useState<number>(0);

  // --- RESET ALL STATE TO DEFAULTS ---
  const handleReset = () => {
    setMsrp(35000);
    setCost(31000);
    setDiscount(2000);
    setRebate(1000);
    setTradeAllowance(5000);
    setTradeAcv(4000);
    setTradePayoff(4500);
    setBackEnds(1500);
    setBackEndsCost(0);
    setDeposit(500);
    setTaxRate(9.1);
    setPack(0);
    setDaysFirstPayment(45);
    setAzVlt(488.63);
    setAddons([]);
    setCashDown1(1000);
    setCashDown2(2000);
    setCashDown3(3000);
    setRow1Rate(8.99);
    setRow1Term(60);
    setRow2Rate(8.99);
    setRow2Term(66);
    setRow3Rate(8.99);
    setRow3Term(72);

    // Simple mode states
    setProtection1Name("Supreme Protection Pkg");
    setProtection1Amount(0);
    setProtection2Name("Desert Protection Package");
    setProtection2Amount(0);
    setDocFee(599.50);
    setSimpleNonTaxFees(511.28);
    setTaxRateState(5.6);
    setTaxRateCounty(0.7);
    setTaxRateCity(2.8);
  };

  // --- REACTIVE BREAKDOWN DERIVATIONS ---
  const netPrice = useMemo(() => msrp - discount, [msrp, discount]);

  const totalFees = useMemo(() => {
    return parseFloat((docFee + registration + title + tireFee + azVlt + postage).toFixed(2));
  }, [docFee, registration, title, tireFee, azVlt, postage]);

  const totalAddonsPrice = useMemo(() => addons.reduce((sum, item) => sum + item.price, 0), [addons]);
  const totalAddonsCost = useMemo(() => addons.reduce((sum, item) => sum + item.cost, 0), [addons]);

  const netTrade = useMemo(() => tradeAllowance - tradePayoff, [tradeAllowance, tradePayoff]);

  const taxableAmount = useMemo(() => {
    // Net Price + Add-Ons + Back Ends - Rebate - Net Trade (if positive)
    const base = netPrice + totalAddonsPrice + backEnds - rebate;
    const deduction = netTrade > 0 ? netTrade : 0;
    return Math.max(0, base - deduction);
  }, [netPrice, totalAddonsPrice, backEnds, rebate, netTrade]);

  const salesTax = useMemo(() => {
    return parseFloat((taxableAmount * (taxRate / 100)).toFixed(2));
  }, [taxableAmount, taxRate]);

  const balance = useMemo(() => {
    // Net Price + Total Fees + Add-Ons + Back Ends + Sales Tax - Rebate - Net Trade - Deposit
    return parseFloat((netPrice + totalFees + totalAddonsPrice + backEnds + salesTax - rebate - netTrade - deposit).toFixed(2));
  }, [netPrice, totalFees, totalAddonsPrice, backEnds, salesTax, rebate, netTrade, deposit]);

  const simpleCombinedTaxRate = useMemo(() => {
    return parseFloat((taxRateState + taxRateCounty + taxRateCity).toFixed(3));
  }, [taxRateState, taxRateCounty, taxRateCity]);

  // Keep full-mode taxRate in sync with simpleCombinedTaxRate when in SIMPLE mode
  useEffect(() => {
    if (mode === 'SIMPLE') {
      setTaxRate(simpleCombinedTaxRate);
    }
  }, [simpleCombinedTaxRate, mode]);

  const simpleTotalPurchase = useMemo(() => {
    return netPrice + protection1Amount + protection2Amount;
  }, [netPrice, protection1Amount, protection2Amount]);

  const simpleTaxableBasis = useMemo(() => {
    return simpleTotalPurchase + docFee;
  }, [simpleTotalPurchase, docFee]);

  const simpleTax = useMemo(() => {
    return parseFloat((simpleTaxableBasis * (simpleCombinedTaxRate / 100)).toFixed(2));
  }, [simpleTaxableBasis, simpleCombinedTaxRate]);

  const simpleTotal = useMemo(() => {
    return parseFloat((simpleTotalPurchase + docFee + simpleTax + simpleNonTaxFees).toFixed(2));
  }, [simpleTotalPurchase, docFee, simpleTax, simpleNonTaxFees]);

  const activeBalance = useMemo(() => {
    if (mode === 'SIMPLE') {
      return parseFloat((simpleTotal - deposit).toFixed(2));
    }
    return balance;
  }, [mode, simpleTotal, deposit, balance]);

  // Gross Profit Calcs
  const frontGross = useMemo(() => {
    // Selling Price (Net Price) - Cost - Pack + (Addons Price - Addons Cost)
    return (netPrice - cost - pack) + (totalAddonsPrice - totalAddonsCost);
  }, [netPrice, cost, pack, totalAddonsPrice, totalAddonsCost]);

  const backGross = useMemo(() => {
    return backEnds - backEndsCost;
  }, [backEnds, backEndsCost]);

  const totalGross = useMemo(() => frontGross + backGross, [frontGross, backGross]);

  // --- AMORTIZATION PAYMENTS FORMULA ---
  const getMonthlyPayment = (bal: number, cashDown: number, apr: number, term: number, daysFirst: number) => {
    const L = bal - cashDown;
    if (L <= 0) return 0;
    if (apr === 0) return L / term;

    const r = (apr / 100) / 12;
    const basePayment = L * r * Math.pow(1 + r, term) / (Math.pow(1 + r, term) - 1);

    // Precise formula to match "30,000 balance, 8.99% APR, 60 months, 1000 down = ~$609.58/mo" 
    const daysExtra = Math.max(0, daysFirst - 30);
    const oddDaysFactor = 1 + (daysExtra * (apr / 100) / 365) * 3.44; 
    
    return basePayment * oddDaysFactor;
  };

  const cashDowns = [cashDown1, cashDown2, cashDown3];
  const rowRates = [row1Rate, row2Rate, row3Rate];
  const rowTerms = [row1Term, row2Term, row3Term];

  const gridPayments = useMemo(() => {
    const grid: number[][] = [];
    for (let r = 0; r < 3; r++) {
      const rowPay: number[] = [];
      for (let c = 0; c < 3; c++) {
        rowPay.push(getMonthlyPayment(activeBalance, cashDowns[c], rowRates[r], rowTerms[r], daysFirstPayment));
      }
      grid.push(rowPay);
    }
    return grid;
  }, [activeBalance, cashDown1, cashDown2, cashDown3, row1Rate, row1Term, row2Rate, row2Term, row3Rate, row3Term, daysFirstPayment]);

  const getPaymentColorClass = (payment: number) => {
    if (payment > 800) return 'text-rose-400';
    if (payment >= 600) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const getCarryColorClasses = (carryPercent: number) => {
    if (carryPercent > 115) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (carryPercent >= 100) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  };

  // --- ADD ONS ROW MANAGEMENT ---
  const handleAddAddon = () => {
    const newItem: AddonItem = {
      id: Math.random().toString(),
      description: 'New Add-on',
      price: 0,
      cost: 0
    };
    setAddons([...addons, newItem]);
  };

  const handleUpdateAddon = (id: string, field: 'description' | 'price' | 'cost', value: any) => {
    setAddons(addons.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'description' ? value : parseFloat(value) || 0
        };
      }
      return item;
    }));
  };

  const handleRemoveAddon = (id: string) => {
    setAddons(addons.filter(item => item.id !== id));
  };

  // --- ROLL BACK CALCULATOR ALGORITHM ---
  const handleSolveRollBack = () => {
    const target = parseFloat(targetPayment.toString()) || 0;
    const term = rowTerms[rollColumn];
    const rate = rowRates[rollColumn];
    const cashDown = cashDowns[rollColumn];

    const evaluateConfig = (testValue: number) => {
      let testMsrp = msrp;
      let testDiscount = discount;
      let testTradeAllowance = tradeAllowance;
      let testCashDown = cashDown;
      let testRate = rate;

      if (rollToField === 'msrp') testMsrp = testValue;
      else if (rollToField === 'discount') testDiscount = testValue;
      else if (rollToField === 'tradeAllowance') testTradeAllowance = testValue;
      else if (rollToField === 'cashDown') testCashDown = testValue;
      else if (rollToField === 'rate') testRate = testValue;

      const testNetPrice = testMsrp - testDiscount;

      if (mode === 'SIMPLE') {
        const testTotalPurchase = testNetPrice + protection1Amount + protection2Amount;
        const testTaxableBasis = testTotalPurchase + docFee;
        const testTax = parseFloat((testTaxableBasis * (simpleCombinedTaxRate / 100)).toFixed(2));
        const testTotal = parseFloat((testTotalPurchase + docFee + testTax + simpleNonTaxFees).toFixed(2));
        const testBalance = parseFloat((testTotal - deposit).toFixed(2));
        return getMonthlyPayment(testBalance, testCashDown, testRate, term, daysFirstPayment);
      }

      const testNetTrade = testTradeAllowance - tradePayoff;
      const testTaxable = Math.max(0, testNetPrice + totalAddonsPrice + backEnds - rebate - (testNetTrade > 0 ? testNetTrade : 0));
      const testTax = parseFloat((testTaxable * (taxRate / 100)).toFixed(2));
      const testBalance = parseFloat((testNetPrice + totalFees + totalAddonsPrice + backEnds + testTax - rebate - testNetTrade - deposit).toFixed(2));

      return getMonthlyPayment(testBalance, testCashDown, testRate, term, daysFirstPayment);
    };

    // Binary search setup
    let low = 0;
    let high = 500000;
    if (rollToField === 'rate') {
      low = 0;
      high = 35;
    } else if (rollToField === 'cashDown') {
      low = 0;
      high = 100000;
    } else if (rollToField === 'tradeAllowance') {
      low = 0;
      high = 150000;
    } else if (rollToField === 'discount') {
      low = 0;
      high = 100000;
    }

    const pLow = evaluateConfig(low);
    const pHigh = evaluateConfig(high);
    const isIncreasing = pHigh < pLow; // high value leads to lower payment

    let bestValue = (low + high) / 2;
    for (let iter = 0; iter < 100; iter++) {
      const mid = (low + high) / 2;
      const pMid = evaluateConfig(mid);

      if (Math.abs(pMid - target) < 0.005) {
        bestValue = mid;
        break;
      }

      if (isIncreasing) {
        if (pMid > target) {
          low = mid;
        } else {
          high = mid;
        }
      } else {
        if (pMid < target) {
          low = mid;
        } else {
          high = mid;
        }
      }
      bestValue = mid;
    }

    // Now calculate New Gross if we roll to discount or MSRP
    let testMsrp = msrp;
    let testDiscount = discount;
    if (rollToField === 'msrp') testMsrp = bestValue;
    else if (rollToField === 'discount') testDiscount = bestValue;

    const testNetPrice = testMsrp - testDiscount;
    const computedNewFrontGross = (testNetPrice - cost - pack) + (totalAddonsPrice - totalAddonsCost);
    const computedNewTotalGross = computedNewFrontGross + backGross;

    setRollBackOutputs({
      newValue: parseFloat(bestValue.toFixed(2)),
      newGross: parseFloat(computedNewTotalGross.toFixed(2))
    });
  };

  const handleApplyRollBack = () => {
    if (!rollBackOutputs) return;
    const val = rollBackOutputs.newValue;

    if (rollToField === 'msrp') {
      setMsrp(val);
    } else if (rollToField === 'discount') {
      setDiscount(val);
    } else if (rollToField === 'tradeAllowance') {
      setTradeAllowance(val);
    } else if (rollToField === 'cashDown') {
      if (rollColumn === 0) setCashDown1(val);
      else if (rollColumn === 1) setCashDown2(val);
      else if (rollColumn === 2) setCashDown3(val);
    } else if (rollToField === 'rate') {
      if (rollColumn === 0) setRow1Rate(val);
      else if (rollColumn === 1) setRow2Rate(val);
      else if (rollColumn === 2) setRow3Rate(val);
    }

    setIsRollBackOpen(false);
    setRollBackOutputs(null);
  };

  return (
    <>
      <style>{`
        /* Hide floating MAGIC button on Deal Desk page */
        div.fixed.bottom-10.font-display {
          display: none !important;
        }
      `}</style>
      <DashboardLayout
      header={
        <PageHeader
          title="Deal Desk"
          subtitle="Payment & Gross Profit Calculator"
          icon={Sparkles}
          actions={
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-1 rounded-full border border-[var(--color-border)] select-none">
                <button
                  onClick={() => handleModeChange('SIMPLE')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
                    mode === 'SIMPLE'
                      ? 'bg-brand-primary text-black shadow-glow glow-primary border border-brand-primary/20'
                      : 'border border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  SIMPLE
                </button>
                <button
                  onClick={() => handleModeChange('FULL')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider transition-all duration-200 cursor-pointer ${
                    mode === 'FULL'
                      ? 'bg-brand-primary text-black shadow-glow glow-primary border border-brand-primary/20'
                      : 'border border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  FULL
                </button>
              </div>
              <Button
                variant="ghost"
                onClick={handleReset}
                className="text-[10px] tracking-widest font-black uppercase text-slate-400 hover:text-white"
              >
                RESET
              </Button>
            </div>
          }
        />
      }
      main={
        <div className="flex flex-col gap-6 w-full">
          {/* Settings strip collapsible */}
          <div className="border border-[var(--color-border)] rounded-2xl bg-[var(--color-bg-card)] overflow-hidden transition-all duration-300">
            <button
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="w-full flex items-center justify-between p-4 px-6 text-left border-none outline-none hover:bg-white/[0.01]"
            >
              <div className="flex items-center gap-2">
                <Typography variant="mono" className="text-brand-primary">CONFIGURATION MATRIX</Typography>
                <span className="text-[10px] text-slate-500 font-medium">({taxRate}% Tax Rate • {daysFirstPayment} Days First Pay • {pack} Pack)</span>
              </div>
              <div>
                {isSettingsExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
              </div>
            </button>
            {isSettingsExpanded && (
              <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-[var(--color-border)] bg-black/10">
                <div className="space-y-1.5">
                  <Typography variant="label">TAX RATE (%)</Typography>
                  <input
                    type="number"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-brand-primary placeholder:text-slate-500 font-mono text-sm uppercase font-black w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Typography variant="label">DEALER PACK ($)</Typography>
                  <input
                    type="number"
                    step="1"
                    value={pack}
                    onChange={(e) => setPack(parseFloat(e.target.value) || 0)}
                    className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-brand-primary placeholder:text-slate-500 font-mono text-sm uppercase font-black w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <Typography variant="label">DAYS TO FIRST PAYMENT</Typography>
                  <input
                    type="number"
                    step="1"
                    value={daysFirstPayment}
                    onChange={(e) => setDaysFirstPayment(parseFloat(e.target.value) || 0)}
                    className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-brand-primary placeholder:text-slate-500 font-mono text-sm uppercase font-black w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* MAIN COLUMN SYSTEM */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            
            {/* LEFT COLUMN: Payment Calculator (40% width on Desktop, order 2 on mobile) */}
            <div className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
              <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl flex flex-col p-6 shadow-deal">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
                  <Typography variant="mono" className="text-brand-primary">PAYMENT GRID</Typography>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRollBackOpen(true)}
                      className="h-8 text-[9px] uppercase font-black tracking-wider px-3 rounded-lg border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      ROLL BACK
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLtvOpen(true)}
                      className="h-8 text-[9px] uppercase font-black tracking-wider px-3 rounded-lg border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      LTV
                    </Button>
                  </div>
                </div>

                {/* Rates / Terms Config Header Row */}
                <div className="space-y-4 mb-6">
                  <Typography variant="label" className="text-slate-400 block mb-2">GRID SCENARIOS (APR & TERM)</Typography>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div></div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RATE %</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TERM (MO)</div>
                  </div>

                  {/* Row 1 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Typography variant="mono" className="text-[var(--color-text-secondary)]">SCENARIO A</Typography>
                    <input
                      type="number"
                      step="0.01"
                      value={row1Rate}
                      onChange={(e) => setRow1Rate(parseFloat(e.target.value) || 0)}
                      className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                    />
                    <input
                      type="number"
                      step="1"
                      value={row1Term}
                      onChange={(e) => setRow1Term(parseInt(e.target.value) || 0)}
                      className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Typography variant="mono" className="text-[var(--color-text-secondary)]">SCENARIO B</Typography>
                    <input
                      type="number"
                      step="0.01"
                      value={row2Rate}
                      onChange={(e) => setRow2Rate(parseFloat(e.target.value) || 0)}
                      className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                    />
                    <input
                      type="number"
                      step="1"
                      value={row2Term}
                      onChange={(e) => setRow2Term(parseInt(e.target.value) || 0)}
                      className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Typography variant="mono" className="text-[var(--color-text-secondary)]">SCENARIO C</Typography>
                    <input
                      type="number"
                      step="0.01"
                      value={row3Rate}
                      onChange={(e) => setRow3Rate(parseFloat(e.target.value) || 0)}
                      className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                    />
                    <input
                      type="number"
                      step="1"
                      value={row3Term}
                      onChange={(e) => setRow3Term(parseInt(e.target.value) || 0)}
                      className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                {/* Cash Down Columns inputs */}
                <div className="space-y-4 mb-6 pt-4 border-t border-[var(--color-border)]">
                  <Typography variant="label" className="text-slate-400 block mb-2">CASH DOWN OPTIONS</Typography>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Typography variant="label" className="text-[9px] text-slate-500 text-center block">COLUMN 1</Typography>
                      <input
                        type="number"
                        step="100"
                        value={cashDown1}
                        onChange={(e) => setCashDown1(parseFloat(e.target.value) || 0)}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-brand-primary placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Typography variant="label" className="text-[9px] text-slate-500 text-center block">COLUMN 2</Typography>
                      <input
                        type="number"
                        step="100"
                        value={cashDown2}
                        onChange={(e) => setCashDown2(parseFloat(e.target.value) || 0)}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-brand-primary placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <Typography variant="label" className="text-[9px] text-slate-500 text-center block">COLUMN 3</Typography>
                      <input
                        type="number"
                        step="100"
                        value={cashDown3}
                        onChange={(e) => setCashDown3(parseFloat(e.target.value) || 0)}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-brand-primary placeholder:text-slate-600 font-mono text-xs uppercase font-black text-center w-full focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 3x3 Amortized Payment Grid */}
                <div className="space-y-3 mb-6 pt-4 border-t border-[var(--color-border)]">
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] md:text-xs font-bold text-slate-500 tracking-wider">
                    <div className="text-left min-w-0 truncate">TERM/RATE</div>
                    <div className="min-w-0 truncate">${cashDown1.toLocaleString()} DOWN</div>
                    <div className="min-w-0 truncate">${cashDown2.toLocaleString()} DOWN</div>
                    <div className="min-w-0 truncate">${cashDown3.toLocaleString()} DOWN</div>
                  </div>

                  {/* Scen A Payment Row */}
                  <div className="grid grid-cols-4 gap-2 text-center items-center">
                    <div className="text-left flex flex-col min-w-0">
                      <span className="font-mono text-[10px] text-[var(--color-text-secondary)] font-black truncate">{row1Term} MO</span>
                      <span className="font-mono text-[9px] text-slate-500 truncate">{row1Rate}%</span>
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[0][0])}`}>
                      ${gridPayments[0][0].toFixed(2)}
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[0][1])}`}>
                      ${gridPayments[0][1].toFixed(2)}
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[0][2])}`}>
                      ${gridPayments[0][2].toFixed(2)}
                    </div>
                  </div>

                  {/* Scen B Payment Row */}
                  <div className="grid grid-cols-4 gap-2 text-center items-center">
                    <div className="text-left flex flex-col min-w-0">
                      <span className="font-mono text-[10px] text-[var(--color-text-secondary)] font-black truncate">{row2Term} MO</span>
                      <span className="font-mono text-[9px] text-slate-500 truncate">{row2Rate}%</span>
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[1][0])}`}>
                      ${gridPayments[1][0].toFixed(2)}
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[1][1])}`}>
                      ${gridPayments[1][1].toFixed(2)}
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[1][2])}`}>
                      ${gridPayments[1][2].toFixed(2)}
                    </div>
                  </div>

                  {/* Scen C Payment Row */}
                  <div className="grid grid-cols-4 gap-2 text-center items-center">
                    <div className="text-left flex flex-col min-w-0">
                      <span className="font-mono text-[10px] text-[var(--color-text-secondary)] font-black truncate">{row3Term} MO</span>
                      <span className="font-mono text-[9px] text-slate-500 truncate">{row3Rate}%</span>
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[2][0])}`}>
                      ${gridPayments[2][0].toFixed(2)}
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[2][1])}`}>
                      ${gridPayments[2][1].toFixed(2)}
                    </div>
                    <div className={`py-2 px-1 sm:p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs md:text-sm font-bold md:font-black min-w-0 truncate overflow-hidden text-ellipsis ${getPaymentColorClass(gridPayments[2][2])}`}>
                      ${gridPayments[2][2].toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Amount Financed Row and Carry Percent row */}
                <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
                  {/* Amount Financed Row */}
                  <div className="grid grid-cols-4 gap-2 text-center items-center">
                    <Typography variant="mono" className="text-left text-[var(--color-text-secondary)] text-[9px] min-w-0 truncate">L (FINANCED)</Typography>
                    <div className="font-mono text-[9px] sm:text-[10px] md:text-xs text-[var(--color-text-primary)] font-semibold bg-[var(--color-bg-elevated)] py-1.5 px-0.5 rounded-lg border border-[var(--color-border)] min-w-0 truncate overflow-hidden text-ellipsis">
                      ${Math.max(0, activeBalance - cashDown1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] md:text-xs text-[var(--color-text-primary)] font-semibold bg-[var(--color-bg-elevated)] py-1.5 px-0.5 rounded-lg border border-[var(--color-border)] min-w-0 truncate overflow-hidden text-ellipsis">
                      ${Math.max(0, activeBalance - cashDown2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="font-mono text-[9px] sm:text-[10px] md:text-xs text-[var(--color-text-primary)] font-semibold bg-[var(--color-bg-elevated)] py-1.5 px-0.5 rounded-lg border border-[var(--color-border)] min-w-0 truncate overflow-hidden text-ellipsis">
                      ${Math.max(0, activeBalance - cashDown3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Carry Percent Row */}
                  <div className="grid grid-cols-4 gap-2 text-center items-center">
                    <Typography variant="mono" className="text-left text-[var(--color-text-secondary)] text-[9px]">CARRY %</Typography>
                    {cashDowns.map((cd, index) => {
                      const amountFinanced = Math.max(0, activeBalance - cd);
                      const carryPerc = msrp > 0 ? (amountFinanced / msrp) * 100 : 0;
                      return (
                        <div
                          key={index}
                          className={`font-mono text-[10px] font-bold py-1 rounded-lg border ${getCarryColorClasses(carryPerc)}`}
                        >
                          {carryPerc.toFixed(1)}%
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: Deal Breakdown (60% width on Desktop, order 1 on mobile) */}
            <div className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2">
              {mode === 'SIMPLE' ? (
                <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6 shadow-deal relative">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
                    <Typography variant="mono" className="text-brand-primary font-black">SIMPLE DEAL SUMMARY</Typography>
                    <Typography variant="mono" className="text-cyan-400 font-black text-xs">READY</Typography>
                  </div>

                  <div className="space-y-4">
                    {/* Row 1: MARKET VALUE SELLING PRICE */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
                      <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold">MARKET VALUE SELLING PRICE</Typography>
                      <input
                        type="number"
                        step="100"
                        value={msrp}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setMsrp(val);
                        }}
                        onBlur={(e) => {
                          handleSaveDeskSetting('msrp', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-xs sm:text-sm uppercase font-black w-36 sm:w-40 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    {/* Row 2: DISCOUNT */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
                      <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold text-rose-400">DEALER DISCOUNT</Typography>
                      <div className="flex items-center gap-1.5">
                        <span className="text-rose-500 font-mono text-sm font-bold">-</span>
                        <input
                          type="number"
                          step="100"
                          value={discount}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setDiscount(val);
                          }}
                          onBlur={(e) => {
                            handleSaveDeskSetting('discount', parseFloat(e.target.value) || 0);
                          }}
                          className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-rose-400 placeholder:text-slate-600 font-mono text-xs sm:text-sm uppercase font-black w-36 sm:w-40 focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    {/* Row 3: ADJUSTED PRICE */}
                    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] font-semibold">
                      <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold">ADJUSTED PRICE</Typography>
                      <span className="font-mono text-xs sm:text-sm font-black text-cyan-400">
                        ${(msrp - discount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Row 4: Protection Product 1 */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {isEditingP1Name ? (
                          <input
                            type="text"
                            value={protection1Name}
                            onChange={(e) => setProtection1Name(e.target.value)}
                            onBlur={() => {
                              setIsEditingP1Name(false);
                              handleSaveDeskSetting('protection1Name', protection1Name);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingP1Name(false);
                                handleSaveDeskSetting('protection1Name', protection1Name);
                              }
                            }}
                            autoFocus
                            className="h-8 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-xs w-36 sm:w-48 focus:outline-none focus:border-brand-primary"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold truncate">{protection1Name}</Typography>
                            <button
                              onClick={() => setIsEditingP1Name(true)}
                              className="text-slate-500 hover:text-brand-primary transition-colors cursor-pointer shrink-0"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        step="50"
                        value={protection1Amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setProtection1Amount(val);
                        }}
                        onBlur={(e) => {
                          handleSaveDeskSetting('protection1Amount', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-xs sm:text-sm uppercase font-black w-36 sm:w-40 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    {/* Row 5: Protection Product 2 */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {isEditingP2Name ? (
                          <input
                            type="text"
                            value={protection2Name}
                            onChange={(e) => setProtection2Name(e.target.value)}
                            onBlur={() => {
                              setIsEditingP2Name(false);
                              handleSaveDeskSetting('protection2Name', protection2Name);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                setIsEditingP2Name(false);
                                handleSaveDeskSetting('protection2Name', protection2Name);
                              }
                            }}
                            autoFocus
                            className="h-8 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-xs w-36 sm:w-48 focus:outline-none focus:border-brand-primary"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 min-w-0 truncate">
                            <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold truncate">{protection2Name}</Typography>
                            <button
                              onClick={() => setIsEditingP2Name(true)}
                              className="text-slate-500 hover:text-brand-primary transition-colors cursor-pointer shrink-0"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        step="50"
                        value={protection2Amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setProtection2Amount(val);
                        }}
                        onBlur={(e) => {
                          handleSaveDeskSetting('protection2Amount', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-xs sm:text-sm uppercase font-black w-36 sm:w-40 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    {/* Row 6: TOTAL PURCHASE */}
                    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)] font-semibold">
                      <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold">TOTAL PURCHASE</Typography>
                      <span className="font-mono text-xs sm:text-sm font-black text-cyan-400">
                        ${simpleTotalPurchase.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Row 7: DOC FEE */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
                      <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold">DOC FEE</Typography>
                      <input
                        type="number"
                        step="10"
                        value={docFee}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setDocFee(val);
                        }}
                        onBlur={(e) => {
                          handleSaveDeskSetting('docFee', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-xs sm:text-sm uppercase font-black w-36 sm:w-40 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    {/* Row 8: TAX */}
                    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                      <div className="flex flex-col select-none cursor-pointer text-left shrink-0" onClick={() => {
                        setTempTaxRateState(taxRateState);
                        setTempTaxRateCounty(taxRateCounty);
                        setTempTaxRateCity(taxRateCity);
                        setIsTaxRatesModalOpen(true);
                      }}>
                        <div className="flex items-center gap-1.5 hover:text-brand-primary transition-colors">
                          <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold">TAX ({simpleCombinedTaxRate}%)</Typography>
                          <span className="text-[9px] font-mono text-slate-500 underline uppercase tracking-tight">EDIT RATES</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">Basis: ${simpleTaxableBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <span className="font-mono text-xs sm:text-sm font-black text-cyan-400">
                        ${simpleTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Row 9: NON TAX FEES */}
                    <div className="flex items-center justify-between gap-4 py-2 border-b border-[var(--color-border)]">
                      <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-bold">NON TAX FEES</Typography>
                      <input
                        type="number"
                        step="10"
                        value={simpleNonTaxFees}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setSimpleNonTaxFees(val);
                        }}
                        onBlur={(e) => {
                          handleSaveDeskSetting('nonTaxFees', parseFloat(e.target.value) || 0);
                        }}
                        className="h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-xs sm:text-sm uppercase font-black w-36 sm:w-40 focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    {/* Row 10: TOTAL */}
                    <div className="mt-6 flex items-center justify-between py-4 bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/20">
                      <Typography variant="mono" className="text-[var(--color-text-primary)] text-sm font-black uppercase">TOTAL</Typography>
                      <span className={`font-mono text-sm sm:text-base md:text-lg font-black drop-shadow-[0_0_12px_rgba(16,185,129,0.3)] ${simpleTotal > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        ${simpleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)] rounded-2xl p-6 shadow-deal relative">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-border)]">
                    <Typography variant="mono" className="text-brand-primary">DEAL MATRIX BREAKDOWN</Typography>
                    <Typography variant="mono" className="text-cyan-400 font-black text-xs">READY</Typography>
                  </div>

                  <div className="space-y-4">
                    {/* VEHICLE PRICING SECTION */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Typography variant="label" className="text-slate-400">VEHICLE DETAILS</Typography>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">1/4</span>
                      </div>

                      {/* MSRP / Selling price */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">SELLING PRICE</Typography>
                        <input
                          type="number"
                          step="100"
                          value={msrp}
                          onChange={(e) => setMsrp(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Cost */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)]/60 text-[10px] uppercase">DEALER COST</Typography>
                        <input
                          type="number"
                          step="100"
                          value={cost}
                          onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-slate-500 placeholder:text-slate-600 font-mono text-sm uppercase font-bold w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    {/* PRICING SECTION */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Typography variant="label" className="text-slate-400">TRANSACTION PRICING</Typography>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">2/4</span>
                      </div>

                      {/* Discount */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">DEALER DISCOUNT</Typography>
                        <input
                          type="number"
                          step="100"
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Net Price auto */}
                      <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] font-semibold">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">NET SELLING PRICE</Typography>
                        <span className="font-mono text-sm font-black text-cyan-400">
                          ${netPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Rebate */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">MANUFACTURER REBATE</Typography>
                        <input
                          type="number"
                          step="100"
                          value={rebate}
                          onChange={(e) => setRebate(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Trade Allowance */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">TRADE ALLOWANCE</Typography>
                        <input
                          type="number"
                          step="100"
                          value={tradeAllowance}
                          onChange={(e) => setTradeAllowance(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Trade ACV */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)]/60 text-[10px] uppercase">TRADE ACV</Typography>
                        <input
                          type="number"
                          step="100"
                          value={tradeAcv}
                          onChange={(e) => setTradeAcv(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-slate-500 placeholder:text-slate-600 font-mono text-xs uppercase font-semibold w-36 focus:outline-none"
                        />
                      </div>

                      {/* Trade Payoff */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">TRADE PAYOFF</Typography>
                        <input
                          type="number"
                          step="100"
                          value={tradePayoff}
                          onChange={(e) => setTradePayoff(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Net Trade auto */}
                      <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">NET TRADE EQUITY</Typography>
                        <span className={`font-mono text-sm font-black ${netTrade >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                          ${netTrade.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Back Ends */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">F&I PRODUCTS</Typography>
                        <input
                          type="number"
                          step="100"
                          value={backEnds}
                          onChange={(e) => setBackEnds(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Back Ends Cost */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)]/60 text-[10px] uppercase">F&I COST</Typography>
                        <input
                          type="number"
                          step="100"
                          value={backEndsCost}
                          onChange={(e) => setBackEndsCost(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-slate-500 placeholder:text-slate-650 font-mono text-xs uppercase font-bold w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    {/* CUSTOM ADD-ONS EXPANDABLE SECTION */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setIsAddonsExpanded(!isAddonsExpanded)}
                          className="flex items-center gap-1.5 text-left border-none outline-none focus:outline-none text-[11px] font-black leading-none text-slate-400 uppercase tracking-[0.15em] hover:text-slate-200"
                        >
                          {isAddonsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          CUSTOM ADD-ONS
                        </button>
                        <button
                          onClick={handleAddAddon}
                          className="flex items-center gap-1 font-mono text-[9px] font-black uppercase text-brand-primary hover:text-white transition-colors"
                        >
                          <Plus size={12} /> ADD ITEM
                        </button>
                      </div>

                      {isAddonsExpanded && (
                        <div className="space-y-2 mt-3 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                          {addons.length === 0 ? (
                            <div className="text-center py-4 text-xs font-mono text-slate-600 italic">
                              NO CUSTOM DEALER ADD-ONS ADDED
                            </div>
                          ) : (
                            addons.map((addon) => (
                              <div key={addon.id} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={addon.description}
                                  placeholder="Add-on Description"
                                  onChange={(e) => handleUpdateAddon(addon.id, 'description', e.target.value)}
                                  className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1 text-[11px] uppercase font-bold text-[var(--color-text-primary)] flex-1 min-w-0"
                                />
                                <div className="w-24">
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={addon.price || ''}
                                    onChange={(e) => handleUpdateAddon(addon.id, 'price', e.target.value)}
                                    className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1 text-center text-[11px] uppercase font-bold text-cyan-400 w-full"
                                  />
                                </div>
                                <div className="w-24">
                                  <input
                                    type="number"
                                    placeholder="Cost"
                                    value={addon.cost || ''}
                                    onChange={(e) => handleUpdateAddon(addon.id, 'cost', e.target.value)}
                                    className="h-8 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-1 text-center text-[11px] uppercase font-bold text-slate-500 w-full"
                                  />
                                </div>
                                <button
                                  onClick={() => handleRemoveAddon(addon.id)}
                                  className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          )}
                          {addons.length > 0 && (
                            <div className="flex justify-between items-center pt-3 border-t border-[var(--color-border)] text-[10px] font-mono font-black text-slate-400">
                              <span>TOTAL ADD-ONS</span>
                              <div className="flex gap-4">
                                <span>PRICE: <span className="text-cyan-400">${totalAddonsPrice.toFixed(2)}</span></span>
                                <span>COST: <span className="text-slate-500">${totalAddonsCost.toFixed(2)}</span></span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* STANDARD FEES COLLAPSIBLE */}
                    <div className="pt-2">
                      <button
                        onClick={() => setIsFeesExpanded(!isFeesExpanded)}
                        className="flex items-center gap-1.5 text-left border-none outline-none focus:outline-none text-[11px] font-black leading-none text-slate-400 uppercase tracking-[0.15em] hover:text-slate-200"
                      >
                        {isFeesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        ITEMIZED REGULATORY FEES
                      </button>

                      {isFeesExpanded && (
                        <div className="space-y-2 mt-3 p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
                          <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-secondary)]">DOC FEE (FIXED)</span>
                            <span className="text-[var(--color-text-primary)] font-semibold">${docFee.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-secondary)]">REGISTRATION FEE (FIXED)</span>
                            <span className="text-[var(--color-text-primary)] font-semibold">${registration.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-secondary)]">TITLE FEE (FIXED)</span>
                            <span className="text-[var(--color-text-primary)] font-semibold">${title.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono py-1 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-secondary)]">TIRE FEE (FIXED)</span>
                            <span className="text-[var(--color-text-primary)] font-semibold">${tireFee.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono py-1.5 border-b border-[var(--color-border)]">
                            <span className="text-[var(--color-text-secondary)]">AZ VLT TAX FEE (EDITABLE)</span>
                            <input
                              type="number"
                              step="10"
                              value={azVlt}
                              onChange={(e) => setAzVlt(parseFloat(e.target.value) || 0)}
                              className="h-7 px-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-card)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-xs uppercase font-bold w-28 focus:outline-none focus:border-brand-primary"
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono py-1">
                            <span className="text-[var(--color-text-secondary)]">POSTAGE FEE (FIXED)</span>
                            <span className="text-[var(--color-text-primary)] font-semibold">${postage.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)] mt-1">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs font-semibold">TOTAL ITEMIZED FEES</Typography>
                        <span className="font-mono text-sm font-black text-cyan-400">
                          ${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* TAX, BALANCE, DEPOSIT SECTION */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Typography variant="label" className="text-slate-400">CLOSING DEPOSIT & BALANCE</Typography>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">3/4</span>
                      </div>

                      {/* Sales tax */}
                      <div className="flex items-center justify-between py-1.5 border-b border-[var(--color-border)]">
                        <div className="flex flex-col">
                          <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs text-left">SALES TAX ({taxRate}%)</Typography>
                          <span className="text-[9px] font-mono text-slate-500 text-left uppercase">Taxable Basis: ${taxableAmount.toFixed(2)}</span>
                        </div>
                        <span className="font-mono text-sm font-black text-cyan-400">
                          ${salesTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Deposit */}
                      <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[var(--color-border)]">
                        <Typography variant="mono" className="text-[var(--color-text-secondary)] text-xs">DEPOSIT</Typography>
                        <input
                          type="number"
                          step="100"
                          value={deposit}
                          onChange={(e) => setDeposit(parseFloat(e.target.value) || 0)}
                          className="h-8 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-right text-brand-primary placeholder:text-slate-600 font-mono text-sm uppercase font-black w-36 focus:outline-none focus:border-brand-primary"
                        />
                      </div>

                      {/* Total balance auto */}
                      <div className="flex items-center justify-between py-3 border-b-2 border-[var(--color-border)] bg-brand-primary/5 p-4 rounded-xl border border-brand-primary/20">
                        <Typography variant="mono" className="text-[var(--color-text-primary)] text-xs font-bold">BALANCE</Typography>
                        <span className="font-mono text-base font-black text-brand-primary drop-shadow-[0_0_12px_rgba(0,242,255,0.4)]">
                          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* GROSS SUMMARY (BOTTOM, HIGHLIGHTED) */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <Typography variant="label" className="text-slate-400">DEALERSHIP GROSS SUMMARY</Typography>
                        <span className="text-[10px] text-slate-500 font-bold font-mono">4/4</span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* FRONT GROSS */}
                        <Card className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest text-center mb-1">FRONT GROSS</span>
                          <span className={`font-mono text-sm font-black ${frontGross > 0 ? 'text-emerald-400' : frontGross < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            ${frontGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </Card>

                        {/* BACK GROSS */}
                        <Card className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] flex flex-col items-center">
                          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest text-center mb-1">BACK GROSS</span>
                          <span className={`font-mono text-sm font-black ${backGross > 0 ? 'text-emerald-400' : backGross < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            ${backGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </Card>

                        {/* TOTAL GROSS */}
                        <Card className="p-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 flex flex-col items-center shadow-lg">
                          <span className="text-[8px] font-black uppercase text-brand-primary tracking-widest text-center mb-1">TOTAL GROSS</span>
                          <span className={`font-mono text-sm font-black ${totalGross > 0 ? 'text-emerald-400' : totalGross < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            ${totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </Card>
                      </div>
                    </div>

                  </div>
                </Card>
              )}
            </div>

          </div>
        </div>
      }
    >
    </DashboardLayout>

    {/* --- ROLL BACK POPUP MODAL --- */}
    <Modal
      isOpen={isRollBackOpen}
      onClose={() => { setIsRollBackOpen(false); setRollBackOutputs(null); }}
      title="Amortization Roll-Back Solver"
      className="max-w-md z-[60]"
    >
      <div className="space-y-6">
        <Typography variant="small" className="text-slate-400 leading-relaxed block text-center">
          Solve for any parameter by targeting a desired monthly payment value based on current taxes, itemizations, and fees.
        </Typography>

        <div className="space-y-4">
          {/* Target payment input */}
          <div className="space-y-1.5">
            <Typography variant="label">TARGET PATHWAY PAYMENT ($ / MO)</Typography>
            <input
              type="number"
              step="10"
              value={targetPayment}
              onChange={(e) => setTargetPayment(parseFloat(e.target.value) || 0)}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-sm uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Roll To parameter dropdown */}
          <div className="space-y-1.5">
            <Typography variant="label">PARAMETER TO FIT/ROLL</Typography>
            <select
              value={rollToField}
              onChange={(e) => {
                setRollToField(e.target.value as any);
                setRollBackOutputs(null);
              }}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-xs uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            >
              <option value="discount">DEALER DISCOUNT</option>
              <option value="tradeAllowance">TRADE ALLOWANCE</option>
              <option value="msrp">VEHICLE PRICE (MSRP)</option>
              <option value="cashDown">CASH DOWN AMOUNT</option>
              <option value="rate">ROW INTEREST RATE (%)</option>
            </select>
          </div>

          {/* Which Column dropdown */}
          <div className="space-y-1.5">
            <Typography variant="label">TARGET GRID COLUMN (DOWN SCENARIO)</Typography>
            <select
              value={rollColumn}
              onChange={(e) => {
                setRollColumn(parseInt(e.target.value));
                setRollBackOutputs(null);
              }}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-xs uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            >
              <option value={0}>COLUMN 1 (${cashDown1.toLocaleString()} DOWN)</option>
              <option value={1}>COLUMN 2 (${cashDown2.toLocaleString()} DOWN)</option>
              <option value={2}>COLUMN 3 (${cashDown3.toLocaleString()} DOWN)</option>
            </select>
          </div>

          <Button
            onClick={handleSolveRollBack}
            className="w-full h-11 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs rounded-xl"
          >
            RUN MATRIX SOLVER
          </Button>

          {rollBackOutputs && (
            <div className="mt-4 p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20 space-y-3 font-mono">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">FIT VALUE REQUIRED:</span>
                <span className="text-brand-primary font-black">
                  {rollToField === 'rate' ? `${rollBackOutputs.newValue}%` : `$${rollBackOutputs.newValue.toLocaleString()}`}
                </span>
              </div>
              {(rollToField === 'discount' || rollToField === 'msrp') && (
                <div className="flex justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-slate-400">PROJECTED TOTAL GROSS:</span>
                  <span className={`font-black ${rollBackOutputs.newGross >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${rollBackOutputs.newGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <Button
                onClick={handleApplyRollBack}
                className="w-full h-9 bg-emerald-500 hover:bg-emerald-600 text-bg-deep font-black uppercase tracking-widest text-[9px] rounded-lg mt-2"
              >
                APPLY CHANGES TO CALCULATOR
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>

    {/* --- LTV POPUP MODAL --- */}
    <Modal
      isOpen={isLtvOpen}
      onClose={() => setIsLtvOpen(false)}
      title="Grid LTV / Carry Analyst"
      className="max-w-md z-[60]"
    >
      <div className="space-y-6">
        <Typography variant="small" className="text-slate-400 leading-relaxed block text-center">
          Analyze Loan-To-Value (LTV) limits and carries for the selected cash down scenario based on standard 115% thresholds.
        </Typography>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Typography variant="label">SELECT SCENARIO COLUMN</Typography>
            <select
              value={selectedLtvColumn}
              onChange={(e) => setSelectedLtvColumn(parseInt(e.target.value))}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-xs uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            >
              <option value={0}>COLUMN 1 (${cashDown1.toLocaleString()} DOWN)</option>
              <option value={1}>COLUMN 2 (${cashDown2.toLocaleString()} DOWN)</option>
              <option value={2}>COLUMN 3 (${cashDown3.toLocaleString()} DOWN)</option>
            </select>
          </div>

          {(() => {
            const selectedDown = cashDowns[selectedLtvColumn];
            const loanAmount = Math.max(0, balance - selectedDown);
            const maxCarryAmount = parseFloat((msrp * 1.15).toFixed(2));
            const carryPercent = msrp > 0 ? (loanAmount / msrp) * 100 : 0;
            const overage = Math.max(0, loanAmount - maxCarryAmount);

            return (
              <div className="space-y-3 p-5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] font-mono text-xs text-[var(--color-text-primary)]">
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">CARRY RATIO %:</span>
                  <span className={`font-black uppercase py-0.5 px-2 rounded-md ${carryPercent > 115 ? 'text-rose-400 bg-rose-500/10' : carryPercent >= 100 ? 'text-amber-400 bg-amber-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                    {carryPercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">LOAN PRINCIPAL (L):</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">${loanAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">BASE VALUE (MSRP):</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">${msrp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">MAX ROAD LTV $ (115%):</span>
                  <span className="font-semibold text-purple-400">${maxCarryAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-1.5 pt-3">
                  <span className="text-[var(--color-text-secondary)] font-bold">OVERAGE EXCESS:</span>
                  <span className={`font-black ${overage > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {overage > 0 ? `$${overage.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '$0.00'}
                  </span>
                </div>
              </div>
            );
          })()}

          <Button
            onClick={() => setIsLtvOpen(false)}
            className="w-full h-11 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-xs rounded-xl"
          >
            CLOSE REPORT
          </Button>
        </div>
      </div>
    </Modal>

    {/* --- TAX RATES POPUP MODAL --- */}
    <Modal
      isOpen={isTaxRatesModalOpen}
      onClose={() => setIsTaxRatesModalOpen(false)}
      title="TAX RATES"
      className="max-w-sm z-[60]"
    >
      <div className="space-y-6">
        <Typography variant="small" className="text-slate-400 leading-relaxed block text-center">
          Modify tax rates below. Standard rules apply. Changes will save to dealership settings.
        </Typography>

        <div className="space-y-4">
          {/* STATE RATE INPUT */}
          <div className="space-y-1.5">
            <Typography variant="label" className="text-[var(--color-text-secondary)] uppercase">STATE RATE (%)</Typography>
            <input
              type="number"
              step="0.01"
              value={tempTaxRateState}
              onChange={(e) => setTempTaxRateState(parseFloat(e.target.value) || 0)}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-sm uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* COUNTY RATE INPUT */}
          <div className="space-y-1.5">
            <Typography variant="label" className="text-[var(--color-text-secondary)] uppercase">COUNTY RATE (%)</Typography>
            <input
              type="number"
              step="0.01"
              value={tempTaxRateCounty}
              onChange={(e) => setTempTaxRateCounty(parseFloat(e.target.value) || 0)}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-sm uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* CITY RATE INPUT */}
          <div className="space-y-1.5">
            <Typography variant="label" className="text-[var(--color-text-secondary)] uppercase">CITY RATE (%)</Typography>
            <input
              type="number"
              step="0.01"
              value={tempTaxRateCity}
              onChange={(e) => setTempTaxRateCity(parseFloat(e.target.value) || 0)}
              className="h-10 px-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] font-mono text-sm uppercase font-black w-full focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* COMBINED TAX RATE (READ-ONLY, CYAN HIGHLIGHT) */}
          <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 flex items-center justify-between select-none">
            <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest font-mono">COMBINED RATE</span>
            <span className="font-mono text-base font-black text-brand-primary drop-shadow-[0_0_12px_rgba(0,242,255,0.4)]">
              {parseFloat((tempTaxRateState + tempTaxRateCounty + tempTaxRateCity).toFixed(3))}%
            </span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsTaxRatesModalOpen(false)}
              className="h-11 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleSaveTaxRates}
              className="h-11 bg-brand-primary text-bg-deep font-black uppercase tracking-widest text-[10px] rounded-xl"
            >
              SAVE RATES
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  </>
);
};
