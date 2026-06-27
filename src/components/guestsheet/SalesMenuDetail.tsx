/**
 * SalesMenuDetail.tsx
 * Read-only view of a saved Sales Menu.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Pencil, Calculator, Trash2 } from 'lucide-react';
import { getSalesMenu, deleteSalesMenu, calcAZFeesTotal, buildDefaultAZFees } from '../../services/guestSheetService';
import { SalesMenu, SalesMenuLineItem, AZFeesConfig } from '../../types';

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function calcPayment(due: number, term: number, apr: number, down: number): number {
  const p = Math.max(0, due - down);
  if (p <= 0 || term <= 0) return 0;
  if (apr === 0) return p / term;
  const r = apr / 100 / 12;
  return (p * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1);
}

export function SalesMenuDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [menu, setMenu]             = useState<SalesMenu | null>(null);
  const [loading, setLoading]       = useState(true);
  const [pendingDelete, setPending] = useState(false);
  const [deleting, setDeleting]     = useState(false);

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
    if (!id || !menu) return;
    setDeleting(true);
    await deleteSalesMenu(id);
    menu.guestSheetId ? navigate(`/GuestSheet/${menu.guestSheetId}`) : navigate('/GuestSheet');
  }

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-sm text-gray-400">Loading…</p></div>;
  if (!menu) return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
      <p className="text-sm text-gray-500">Sales menu not found.</p>
      <button onClick={() => navigate('/GuestSheet')} className="text-sm text-blue-600 font-medium">Go back</button>
    </div>
  );

  const { term, apr, downPayment } = menu.paymentConfig;
  const balanceDue = menu.lineItems.find(i => i.id === 'balance_due')?.amount ?? 0;
  const monthly    = calcPayment(balanceDue, term, apr, downPayment);
  const totalTaxRate = (menu.taxConfig.cityRate || 0) + (menu.taxConfig.stateRate || 0) + (menu.taxConfig.countyRate || 0);
  const addendumItems = menu.addendumItems ?? [];
  const addendumTotal = addendumItems.reduce((s, a) => s + a.price, 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => menu.guestSheetId ? navigate(`/GuestSheet/${menu.guestSheetId}`) : navigate('/GuestSheet')} className="text-blue-600">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Sales Menu</h1>
        <button onClick={() => navigate(`/GuestSheet/sales-menu/${id}/edit`)} className="text-blue-600"><Pencil size={18} /></button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-10 space-y-3 max-w-lg mx-auto w-full">

        {/* Guest banner */}
        {menu.guestName && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-bold">{menu.guestName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{menu.guestName}</p>
              {menu.vehicleDescription && <p className="text-xs text-gray-500 truncate">{menu.vehicleDescription}</p>}
            </div>
            {menu.guestSheetId && (
              <button onClick={() => navigate(`/GuestSheet/${menu.guestSheetId}`)} className="text-xs text-blue-600 font-medium border border-blue-200 rounded-lg px-2 py-1 whitespace-nowrap">
                Guest Sheet
              </button>
            )}
          </div>
        )}

        {/* ── Line Items ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {menu.lineItems.map(item => {
            const isNeg = item.isNegative && item.amount > 0;
            return (
              <React.Fragment key={item.id}>
                {/* Addendum block after vehicle_price */}
                {item.id === 'savings' && addendumItems.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-blue-50">
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Addendum</p>
                    </div>
                    {addendumItems.map(a => (
                      <div key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 truncate">{a.description}</p>
                          {a.taxable && <p className="text-[10px] text-gray-400">Taxable</p>}
                        </div>
                        <p className="text-sm text-gray-900 flex-shrink-0">{fmt(a.price)}</p>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-blue-50/50 flex items-center justify-between">
                      <p className="text-xs text-gray-500">Addendum Total</p>
                      <p className="text-sm font-semibold text-gray-700">{fmt(addendumTotal)}</p>
                    </div>
                  </>
                )}

                {item.isSubtotal ? (
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">{item.label}</p>
                    <p className={`text-sm font-bold ${item.id === 'balance_due' ? 'text-blue-600 text-base' : 'text-gray-900'}`}>
                      {fmt(item.amount)}
                    </p>
                  </div>
                ) : (
                  <div className={`px-4 py-3 flex items-center justify-between ${item.isNegative ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${item.isNegative ? 'text-red-600' : 'text-gray-800'}`}>{item.label}</p>
                      {item.id === 'sales_tax' && totalTaxRate > 0 && (
                        <span className="text-[10px] text-gray-400">{totalTaxRate.toFixed(2)}%</span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold ${isNeg ? 'text-red-600' : 'text-gray-900'}`}>
                      {isNeg ? `-${fmt(item.amount)}` : fmt(item.amount)}
                    </p>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Payment Estimate ── */}
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calculator size={18} className="text-green-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Payment Estimate</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {term}mo · {apr}% APR{downPayment > 0 ? ` · ${fmt(downPayment)} down` : ''}
              </p>
            </div>
          </div>
          <p className="text-base font-bold text-green-600">
            {fmt(monthly)}<span className="text-xs font-normal text-gray-400">/mo</span>
          </p>
        </div>

        {/* Tax rates */}
        {totalTaxRate > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tax Rate</p>
            <div className="space-y-1">
              {menu.taxConfig.stateRate > 0  && <TaxRow label="State"  value={menu.taxConfig.stateRate} />}
              {menu.taxConfig.countyRate > 0 && <TaxRow label="County" value={menu.taxConfig.countyRate} />}
              {menu.taxConfig.cityRate > 0   && <TaxRow label="City"   value={menu.taxConfig.cityRate} />}
              <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                <p className="text-xs font-bold text-gray-600">Combined</p>
                <p className="text-xs font-bold text-gray-900">{totalTaxRate.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          Created {new Date(menu.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Delete */}
        {!pendingDelete ? (
          <button onClick={() => setPending(true)} className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-400 font-medium">
            <Trash2 size={15} /> Delete Sales Menu
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 space-y-3">
            <p className="text-sm text-red-700 font-medium text-center">Delete this sales menu?</p>
            <p className="text-xs text-red-500 text-center">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setPending(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 bg-white">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-40">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaxRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xs font-medium text-gray-700">{value}%</p>
    </div>
  );
}
