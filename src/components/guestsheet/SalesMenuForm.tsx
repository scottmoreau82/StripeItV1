/**
 * SalesMenuForm.tsx
 * Sales Menu builder at /GuestSheet/sales-menu/new and /GuestSheet/sales-menu/:id/edit
 * Line items, editable tax rates (city/state/county), deal summary, payment estimate.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ListChecks,
  DollarSign,
  Calculator,
  X,
  Plus,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createSalesMenu,
  updateSalesMenu,
  getSalesMenu,
  buildDefaultLineItems,
  defaultTaxConfig,
  defaultPaymentConfig,
} from '../../services/guestSheetService';
import {
  SalesMenu,
  SalesMenuLineItem,
  SalesMenuTaxConfig,
  SalesMenuPaymentConfig,
} from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function parseCurrency(s: string): number {
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function calcMonthlyPayment(
  amountDue: number,
  config: SalesMenuPaymentConfig
): number {
  const principal = Math.max(0, amountDue - config.downPayment);
  if (principal <= 0 || config.term <= 0) return 0;
  if (config.apr === 0) return principal / config.term;
  const monthlyRate = config.apr / 100 / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, config.term)) /
    (Math.pow(1 + monthlyRate, config.term) - 1)
  );
}

// ─── Component ────────────────────────────────────────────────────────────

interface LocationState {
  guestSheetId?: string;
  guestName?: string;
  vehicleDescription?: string;
}

interface Props {
  mode?: 'create' | 'edit';
}

export function SalesMenuForm({ mode = 'create' }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();

  const passedState = (location.state as LocationState) || {};

  // ── State ────────────────────────────────────────────────────────────
  const [guestSheetId, setGuestSheetId] = useState(passedState.guestSheetId ?? '');
  const [guestName, setGuestName] = useState(passedState.guestName ?? '');
  const [vehicleDescription, setVehicleDescription] = useState(passedState.vehicleDescription ?? '');
  const [lineItems, setLineItems] = useState<SalesMenuLineItem[]>(() =>
    buildDefaultLineItems(passedState.vehicleDescription)
  );
  const [taxConfig, setTaxConfig] = useState<SalesMenuTaxConfig>(defaultTaxConfig);
  const [paymentConfig, setPaymentConfig] = useState<SalesMenuPaymentConfig>(defaultPaymentConfig);

  // UI state
  const [showTaxEditor, setShowTaxEditor] = useState(false);
  const [showPaymentEditor, setShowPaymentEditor] = useState(false);
  const [showNoGuestModal, setShowNoGuestModal] = useState(false);
  const [noGuestShown, setNoGuestShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(mode === 'edit');
  const [error, setError] = useState('');

  // Show "no guest sheet" modal once on create if none passed
  useEffect(() => {
    if (mode === 'create' && !passedState.guestSheetId && !noGuestShown) {
      setShowNoGuestModal(true);
      setNoGuestShown(true);
    }
  }, []);

  // Load existing menu when editing
  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let cancelled = false;
    getSalesMenu(id).then(menu => {
      if (cancelled || !menu) return;
      setGuestSheetId(menu.guestSheetId ?? '');
      setGuestName(menu.guestName ?? '');
      setVehicleDescription(menu.vehicleDescription ?? '');
      setLineItems(menu.lineItems);
      setTaxConfig(menu.taxConfig);
      setPaymentConfig(menu.paymentConfig);
      setLoadingExisting(false);
    });
    return () => { cancelled = true; };
  }, [id, mode]);

  // ── Tax calculation ───────────────────────────────────────────────────
  const totalTaxRate =
    (taxConfig.cityRate || 0) +
    (taxConfig.stateRate || 0) +
    (taxConfig.countyRate || 0);

  // Recalculate sales tax line item whenever rates or taxable items change
  const updateTaxLine = useCallback(
    (items: SalesMenuLineItem[], rates: SalesMenuTaxConfig) => {
      const rate =
        ((rates.cityRate || 0) +
          (rates.stateRate || 0) +
          (rates.countyRate || 0)) /
        100;
      const taxableIds = ['vehicle_price', 'addons'];
      const taxableTotal = items
        .filter(i => taxableIds.includes(i.id) && i.enabled)
        .reduce((sum, i) => sum + (i.isNegative ? -i.amount : i.amount), 0);
      const taxAmount = Math.max(0, taxableTotal * rate);
      return items.map(i =>
        i.id === 'sales_tax' ? { ...i, amount: taxAmount } : i
      );
    },
    []
  );

  // ── Deal Summary ─────────────────────────────────────────────────────
  const enabledItems = lineItems.filter(i => i.enabled);

  const netPrice = enabledItems
    .filter(i => !i.isNegative && i.id !== 'sales_tax' && i.id !== 'fees')
    .reduce((s, i) => s + i.amount, 0);

  const totalTaxesAndFees = enabledItems
    .filter(i => i.id === 'sales_tax' || i.id === 'fees')
    .reduce((s, i) => s + i.amount, 0);

  const tradeAllowance = enabledItems
    .filter(i => i.id === 'trade_allowance')
    .reduce((s, i) => s + i.amount, 0);

  const discounts = enabledItems
    .filter(i => i.isNegative && i.id !== 'trade_allowance')
    .reduce((s, i) => s + i.amount, 0);

  const estimatedAmountDue = netPrice + totalTaxesAndFees - discounts - tradeAllowance;
  const monthlyPayment = calcMonthlyPayment(estimatedAmountDue, paymentConfig);

  // ── Item handlers ─────────────────────────────────────────────────────
  function toggleItem(itemId: string) {
    setLineItems(prev => {
      const updated = prev.map(i =>
        i.id === itemId ? { ...i, enabled: !i.enabled } : i
      );
      return updateTaxLine(updated, taxConfig);
    });
  }

  function updateItemAmount(itemId: string, raw: string) {
    const amount = parseCurrency(raw);
    setLineItems(prev => {
      const updated = prev.map(i =>
        i.id === itemId ? { ...i, amount } : i
      );
      return updateTaxLine(updated, taxConfig);
    });
  }

  function updateItemSublabel(itemId: string, sublabel: string) {
    setLineItems(prev => prev.map(i => (i.id === itemId ? { ...i, sublabel } : i)));
  }

  function addCustomItem() {
    const newItem: SalesMenuLineItem = {
      id: `custom_${Date.now()}`,
      label: 'Custom Item',
      sublabel: '',
      amount: 0,
      enabled: true,
    };
    setLineItems(prev => {
      // Insert before sales_tax
      const taxIdx = prev.findIndex(i => i.id === 'sales_tax');
      if (taxIdx === -1) return [...prev, newItem];
      const next = [...prev];
      next.splice(taxIdx, 0, newItem);
      return next;
    });
  }

  function removeCustomItem(itemId: string) {
    setLineItems(prev => prev.filter(i => i.id !== itemId));
  }

  function updateCustomLabel(itemId: string, label: string) {
    setLineItems(prev => prev.map(i => (i.id === itemId ? { ...i, label } : i)));
  }

  // ── Tax config handler ────────────────────────────────────────────────
  function handleTaxChange(field: keyof SalesMenuTaxConfig, raw: string) {
    const val = parseFloat(raw) || 0;
    const updated = { ...taxConfig, [field]: val };
    setTaxConfig(updated);
    setLineItems(prev => updateTaxLine(prev, updated));
  }

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const payload: Omit<SalesMenu, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
        guestSheetId: guestSheetId || undefined,
        guestName: guestName || undefined,
        vehicleDescription: vehicleDescription || undefined,
        lineItems,
        taxConfig,
        paymentConfig,
      };
      if (mode === 'edit' && id) {
        await updateSalesMenu(id, payload);
        navigate(`/GuestSheet/sales-menu/${id}`);
      } else {
        const newId = await createSalesMenu(user.uid, payload);
        navigate(`/GuestSheet/sales-menu/${newId}`);
      }
    } catch {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  const isCustomItem = (item: SalesMenuLineItem) => item.id.startsWith('custom_');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-blue-600 text-sm font-medium"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Sales Menu</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-blue-600 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-10 space-y-4 max-w-lg mx-auto w-full">

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Guest banner */}
        {guestName && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-bold">
                {guestName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{guestName}</p>
              {vehicleDescription && (
                <p className="text-xs text-gray-500 truncate">{vehicleDescription}</p>
              )}
            </div>
            {guestSheetId && (
              <button
                onClick={() => navigate(`/GuestSheet/${guestSheetId}`)}
                className="text-xs text-blue-600 font-medium whitespace-nowrap border border-blue-200 rounded-lg px-2 py-1"
              >
                View Guest Sheet
              </button>
            )}
          </div>
        )}

        {/* Vehicle description (no guest) */}
        {!guestName && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              Vehicle Description
            </label>
            <input
              value={vehicleDescription}
              onChange={e => {
                setVehicleDescription(e.target.value);
                setLineItems(prev =>
                  prev.map(i =>
                    i.id === 'vehicle_price' ? { ...i, sublabel: e.target.value } : i
                  )
                );
              }}
              placeholder="2016 Chevrolet Silverado 1500"
              className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300"
            />
          </div>
        )}

        {/* ── Line Items ── */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={16} className="text-blue-500" />
            <p className="text-sm font-bold text-blue-600">Select Menu Items</p>
          </div>
          <p className="text-xs text-gray-400 mb-3">Add items and adjust values as needed.</p>

          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {lineItems.map(item => (
              <LineItemRow
                key={item.id}
                item={item}
                isCustom={isCustomItem(item)}
                onToggle={() => toggleItem(item.id)}
                onAmountChange={raw => updateItemAmount(item.id, raw)}
                onSublabelChange={sl => updateItemSublabel(item.id, sl)}
                onLabelChange={isCustomItem(item) ? label => updateCustomLabel(item.id, label) : undefined}
                onRemove={isCustomItem(item) ? () => removeCustomItem(item.id) : undefined}
                taxRate={item.id === 'sales_tax' ? totalTaxRate : undefined}
              />
            ))}
          </div>

          {/* Add Custom Item */}
          <button
            onClick={addCustomItem}
            className="w-full mt-2 border border-dashed border-gray-300 rounded-xl py-3 flex items-center justify-center gap-2 text-sm text-blue-500 font-medium active:bg-gray-50"
          >
            <Plus size={15} />
            Add Custom Item
          </button>
        </section>

        {/* ── Deal Summary ── */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-500" />
            <p className="text-sm font-bold text-blue-600">Deal Summary</p>
          </div>

          <div className="bg-blue-50 rounded-2xl border border-blue-100 px-4 py-4 space-y-2">
            <SummaryRow label="Net Price" value={formatCurrency(netPrice)} />
            <SummaryRow label="Total Taxes & Fees" value={formatCurrency(totalTaxesAndFees)} />
            {tradeAllowance > 0 && (
              <SummaryRow label="Trade Allowance" value={`-${formatCurrency(tradeAllowance)}`} valueClass="text-red-500" />
            )}
            {discounts > 0 && (
              <SummaryRow label="Discounts & Rebates" value={`-${formatCurrency(discounts)}`} valueClass="text-red-500" />
            )}
            <div className="border-t border-blue-200 pt-2 mt-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-gray-900">Estimated Amount Due</p>
                  <p className="text-[10px] text-gray-400">(Before Down Payment)</p>
                </div>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(estimatedAmountDue)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tax Rate Editor ── */}
        <section>
          <button
            onClick={() => setShowTaxEditor(v => !v)}
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between text-left active:bg-gray-50"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900">Tax Rate</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalTaxRate.toFixed(2)}% combined</p>
            </div>
            <ChevronRight
              size={16}
              className={`text-gray-400 transition-transform ${showTaxEditor ? 'rotate-90' : ''}`}
            />
          </button>

          {showTaxEditor && (
            <div className="bg-white rounded-xl border border-gray-200 mt-1 divide-y divide-gray-100 overflow-hidden">
              <TaxRateField
                label="State Rate"
                value={taxConfig.stateRate}
                onChange={v => handleTaxChange('stateRate', v)}
              />
              <TaxRateField
                label="County Rate"
                value={taxConfig.countyRate}
                onChange={v => handleTaxChange('countyRate', v)}
              />
              <TaxRateField
                label="City Rate"
                value={taxConfig.cityRate}
                onChange={v => handleTaxChange('cityRate', v)}
              />
              <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Combined Rate</p>
                <p className="text-sm font-bold text-gray-900">{totalTaxRate.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </section>

        {/* ── Payment Estimate ── */}
        <section>
          <button
            onClick={() => setShowPaymentEditor(v => !v)}
            className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between text-left active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Payment Estimate</p>
                <p className="text-xs text-gray-400 mt-0.5">Estimated Monthly Payment</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-base font-bold text-green-600">
                {formatCurrency(monthlyPayment)}<span className="text-xs font-normal text-gray-400">/mo</span>
              </p>
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform ${showPaymentEditor ? 'rotate-90' : ''}`}
              />
            </div>
          </button>

          {showPaymentEditor && (
            <div className="bg-white rounded-xl border border-gray-200 mt-1 divide-y divide-gray-100 overflow-hidden">
              <PaymentField
                label="Term (months)"
                value={paymentConfig.term}
                onChange={v => setPaymentConfig(p => ({ ...p, term: parseInt(v) || 0 }))}
                inputMode="numeric"
              />
              <PaymentField
                label="APR (%)"
                value={paymentConfig.apr}
                onChange={v => setPaymentConfig(p => ({ ...p, apr: parseFloat(v) || 0 }))}
                inputMode="decimal"
              />
              <PaymentField
                label="Down Payment"
                value={paymentConfig.downPayment}
                onChange={v => setPaymentConfig(p => ({ ...p, downPayment: parseCurrency(v) }))}
                inputMode="decimal"
                prefix="$"
              />
            </div>
          )}
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white text-sm font-semibold py-4 rounded-2xl shadow-sm active:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save Sales Menu'}
        </button>

      </div>

      {/* No Guest Sheet modal */}
      {showNoGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-gray-900 mb-2">No Guest Sheet Attached</p>
            <p className="text-sm text-gray-500 mb-5">
              For the best experience, create a Guest Sheet first so customer and vehicle details pre-fill here.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoGuestModal(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
              >
                Continue Anyway
              </button>
              <button
                onClick={() => navigate('/GuestSheet/new')}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold"
              >
                Create Guest Sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Line Item Row ────────────────────────────────────────────────────────

interface LineItemRowProps {
  item: SalesMenuLineItem;
  isCustom: boolean;
  onToggle: () => void;
  onAmountChange: (raw: string) => void;
  onSublabelChange: (sl: string) => void;
  onLabelChange?: (label: string) => void;
  onRemove?: () => void;
  taxRate?: number;
}

function LineItemRow({
  item,
  isCustom,
  onToggle,
  onAmountChange,
  onSublabelChange,
  onLabelChange,
  onRemove,
  taxRate,
}: LineItemRowProps) {
  const [amountStr, setAmountStr] = useState(
    item.amount !== 0 ? item.amount.toString() : ''
  );
  const [editingLabel, setEditingLabel] = useState(false);

  // Sync external amount changes (e.g. tax recalculation)
  useEffect(() => {
    if (item.id === 'sales_tax') {
      setAmountStr(item.amount !== 0 ? item.amount.toFixed(2) : '');
    }
  }, [item.amount, item.id]);

  const displayAmount = item.isNegative && item.amount > 0
    ? `-${formatCurrency(item.amount)}`
    : formatCurrency(item.amount);

  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${!item.enabled ? 'opacity-40' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.enabled
            ? 'bg-blue-600 border-blue-600'
            : 'border-gray-300 bg-white'
        }`}
      >
        {item.enabled && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Label + sublabel */}
      <div className="flex-1 min-w-0">
        {isCustom && editingLabel ? (
          <input
            autoFocus
            value={item.label}
            onChange={e => onLabelChange?.(e.target.value)}
            onBlur={() => setEditingLabel(false)}
            className="text-sm font-semibold text-gray-900 bg-transparent outline-none border-b border-blue-400 w-full"
          />
        ) : (
          <div className="flex items-center gap-1">
            <p
              className="text-sm font-semibold text-gray-900 truncate"
              onClick={() => isCustom && setEditingLabel(true)}
            >
              {item.label}
            </p>
            {taxRate !== undefined && (
              <span className="text-[10px] text-gray-400 font-normal">
                {taxRate.toFixed(2)}%
              </span>
            )}
          </div>
        )}
        {!item.isReadOnly && (
          <input
            value={item.sublabel ?? ''}
            onChange={e => onSublabelChange(e.target.value)}
            placeholder="Description"
            className="text-xs text-gray-400 bg-transparent outline-none w-full truncate mt-0.5 placeholder-gray-200"
          />
        )}
      </div>

      {/* Amount input or remove button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {item.isReadOnly ? (
          <p className="text-sm font-semibold text-gray-900 w-24 text-right">
            {displayAmount}
          </p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden w-28">
            <input
              value={amountStr}
              onChange={e => {
                setAmountStr(e.target.value);
                onAmountChange(e.target.value);
              }}
              onFocus={e => e.target.select()}
              inputMode="decimal"
              placeholder="$0.00"
              className="w-full px-2 py-1.5 text-sm text-gray-900 text-right bg-white outline-none placeholder-gray-300"
            />
          </div>
        )}
        {isCustom && onRemove && (
          <button onClick={onRemove} className="text-gray-300 active:text-red-400">
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Summary Row ─────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

// ─── Tax Rate Field ───────────────────────────────────────────────────────

function TaxRateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          inputMode="decimal"
          placeholder="0"
          className="w-16 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
        />
        <span className="pr-2 text-sm text-gray-400">%</span>
      </div>
    </div>
  );
}

// ─── Payment Field ────────────────────────────────────────────────────────

function PaymentField({
  label,
  value,
  onChange,
  inputMode,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  prefix?: string;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
        {prefix && <span className="pl-2 text-sm text-gray-400">{prefix}</span>}
        <input
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          onFocus={e => e.target.select()}
          inputMode={inputMode}
          placeholder="0"
          className="w-20 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
        />
      </div>
    </div>
  );
}
