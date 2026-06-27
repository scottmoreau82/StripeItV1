/**
 * SalesMenuDetail.tsx
 * Read-only view of a saved Sales Menu at /GuestSheet/sales-menu/:id
 * Shows all line items, deal summary, payment estimate, edit and delete actions.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Pencil,
  ListChecks,
  DollarSign,
  Calculator,
  UserCircle,
  Trash2,
} from 'lucide-react';
import { getSalesMenu, deleteSalesMenu } from '../../services/guestSheetService';
import { SalesMenu, SalesMenuLineItem } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function calcMonthlyPayment(amountDue: number, term: number, apr: number, downPayment: number): number {
  const principal = Math.max(0, amountDue - downPayment);
  if (principal <= 0 || term <= 0) return 0;
  if (apr === 0) return principal / term;
  const monthlyRate = apr / 100 / 12;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) /
    (Math.pow(1 + monthlyRate, term) - 1)
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function SalesMenuDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [menu, setMenu] = useState<SalesMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getSalesMenu(id).then(m => {
      if (cancelled) return;
      setMenu(m);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    await deleteSalesMenu(id);
    // Go back to guest sheet if linked, else home
    if (menu?.guestSheetId) {
      navigate(`/GuestSheet/${menu.guestSheetId}`);
    } else {
      navigate('/GuestSheet');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Sales menu not found.</p>
        <button onClick={() => navigate('/GuestSheet')} className="text-sm text-blue-600 font-medium">
          Go back
        </button>
      </div>
    );
  }

  const enabledItems = menu.lineItems.filter(i => i.enabled);

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

  const { term, apr, downPayment } = menu.paymentConfig;
  const monthlyPayment = calcMonthlyPayment(estimatedAmountDue, term, apr, downPayment);

  const totalTaxRate =
    (menu.taxConfig.cityRate || 0) +
    (menu.taxConfig.stateRate || 0) +
    (menu.taxConfig.countyRate || 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() =>
            menu.guestSheetId
              ? navigate(`/GuestSheet/${menu.guestSheetId}`)
              : navigate('/GuestSheet')
          }
          className="flex items-center gap-1 text-blue-600 text-sm font-medium"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Sales Menu</h1>
        <button
          onClick={() => navigate(`/GuestSheet/sales-menu/${id}/edit`)}
          className="text-blue-600"
        >
          <Pencil size={18} />
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-10 space-y-5 max-w-lg mx-auto w-full">

        {/* Guest banner */}
        {menu.guestName && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-bold">
                {menu.guestName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{menu.guestName}</p>
              {menu.vehicleDescription && (
                <p className="text-xs text-gray-500 truncate">{menu.vehicleDescription}</p>
              )}
            </div>
            {menu.guestSheetId && (
              <button
                onClick={() => navigate(`/GuestSheet/${menu.guestSheetId}`)}
                className="text-xs text-blue-600 font-medium border border-blue-200 rounded-lg px-2 py-1 whitespace-nowrap"
              >
                View Guest Sheet
              </button>
            )}
          </div>
        )}

        {/* ── Line Items ── */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={16} className="text-blue-500" />
            <p className="text-sm font-bold text-blue-600">Menu Items</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {menu.lineItems.map(item => (
              <div
                key={item.id}
                className={`px-4 py-3 flex items-center gap-3 ${!item.enabled ? 'opacity-30' : ''}`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                    item.enabled ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}
                >
                  {item.enabled && (
                    <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                      <path d="M1 4L4.5 7.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                    {item.id === 'sales_tax' && (
                      <span className="text-[10px] text-gray-400">{totalTaxRate.toFixed(2)}%</span>
                    )}
                  </div>
                  {item.sublabel && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.sublabel}</p>
                  )}
                </div>

                {/* Amount */}
                <p className={`text-sm font-semibold flex-shrink-0 ${
                  item.isNegative && item.amount > 0 ? 'text-red-500' : 'text-gray-900'
                }`}>
                  {item.isNegative && item.amount > 0
                    ? `-${formatCurrency(item.amount)}`
                    : formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
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
              <SummaryRow
                label="Trade Allowance"
                value={`-${formatCurrency(tradeAllowance)}`}
                valueClass="text-red-500"
              />
            )}
            {discounts > 0 && (
              <SummaryRow
                label="Discounts & Rebates"
                value={`-${formatCurrency(discounts)}`}
                valueClass="text-red-500"
              />
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

        {/* ── Payment Estimate ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator size={18} className="text-green-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Payment Estimate</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {term}mo · {apr}% APR
                {downPayment > 0 && ` · ${formatCurrency(downPayment)} down`}
              </p>
            </div>
          </div>
          <p className="text-base font-bold text-green-600">
            {formatCurrency(monthlyPayment)}
            <span className="text-xs font-normal text-gray-400">/mo</span>
          </p>
        </div>

        {/* Tax rates summary */}
        {totalTaxRate > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tax Breakdown</p>
            <div className="space-y-1">
              {menu.taxConfig.stateRate > 0 && (
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">State</p>
                  <p className="text-xs font-medium text-gray-700">{menu.taxConfig.stateRate}%</p>
                </div>
              )}
              {menu.taxConfig.countyRate > 0 && (
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">County</p>
                  <p className="text-xs font-medium text-gray-700">{menu.taxConfig.countyRate}%</p>
                </div>
              )}
              {menu.taxConfig.cityRate > 0 && (
                <div className="flex justify-between">
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-xs font-medium text-gray-700">{menu.taxConfig.cityRate}%</p>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                <p className="text-xs font-bold text-gray-600">Combined</p>
                <p className="text-xs font-bold text-gray-900">{totalTaxRate.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <p className="text-xs text-gray-400 text-center">
          Created {new Date(menu.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })}
        </p>

        {/* Delete */}
        {!pendingDelete ? (
          <button
            onClick={() => setPendingDelete(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-400 font-medium"
          >
            <Trash2 size={15} />
            Delete Sales Menu
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 space-y-3">
            <p className="text-sm text-red-700 font-medium text-center">Delete this sales menu?</p>
            <p className="text-xs text-red-500 text-center">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPendingDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 font-medium bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

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
