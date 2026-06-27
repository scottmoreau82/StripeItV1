/**
 * SalesMenuForm.tsx
 * Sales Menu builder — all lines always visible, addendum modal, VLT modal.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calculator, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createSalesMenu, updateSalesMenu, getSalesMenu,
  buildDefaultLineItems, defaultTaxConfig, defaultPaymentConfig,
  recalcSubtotals, calcVLT,
} from '../../services/guestSheetService';
import { SalesMenu, SalesMenuLineItem, AddendumItem, SalesMenuTaxConfig, SalesMenuPaymentConfig } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}
function parse(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}
function calcPayment(due: number, cfg: SalesMenuPaymentConfig): number {
  const p = Math.max(0, due - cfg.downPayment);
  if (p <= 0 || cfg.term <= 0) return 0;
  if (cfg.apr === 0) return p / cfg.term;
  const r = cfg.apr / 100 / 12;
  return (p * r * Math.pow(1 + r, cfg.term)) / (Math.pow(1 + r, cfg.term) - 1);
}

interface LocationState { guestSheetId?: string; guestName?: string; vehicleDescription?: string; }

export function SalesMenuForm({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const passed = (location.state as LocationState) || {};

  const [guestSheetId, setGuestSheetId]           = useState(passed.guestSheetId ?? '');
  const [guestName, setGuestName]                 = useState(passed.guestName ?? '');
  const [vehicleDesc, setVehicleDesc]             = useState(passed.vehicleDescription ?? '');
  const [lineItems, setLineItems]                 = useState<SalesMenuLineItem[]>(buildDefaultLineItems);
  const [addendumItems, setAddendumItems]         = useState<AddendumItem[]>([]);
  const [taxConfig, setTaxConfig]                 = useState<SalesMenuTaxConfig>(defaultTaxConfig);
  const [paymentConfig, setPaymentConfig]         = useState<SalesMenuPaymentConfig>(defaultPaymentConfig);
  const [subtotalOverrides, setSubtotalOverrides] = useState<Record<string, number | null>>({});

  const [showTaxEditor, setShowTaxEditor]         = useState(false);
  const [showPaymentEditor, setShowPaymentEditor] = useState(false);
  const [showNoGuestModal, setShowNoGuestModal]   = useState(false);
  const [noGuestShown, setNoGuestShown]           = useState(false);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [editingAddendum, setEditingAddendum]     = useState<AddendumItem | null>(null);
  const [showVltModal, setShowVltModal]           = useState(false);
  const [saving, setSaving]                       = useState(false);
  const [loadingExisting, setLoadingExisting]     = useState(mode === 'edit');
  const [error, setError]                         = useState('');

  useEffect(() => {
    if (mode === 'create' && !passed.guestSheetId && !noGuestShown) {
      setShowNoGuestModal(true);
      setNoGuestShown(true);
    }
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let cancelled = false;
    getSalesMenu(id).then(menu => {
      if (cancelled || !menu) return;
      setGuestSheetId(menu.guestSheetId ?? '');
      setGuestName(menu.guestName ?? '');
      setVehicleDesc(menu.vehicleDescription ?? '');
      setLineItems(menu.lineItems);
      setAddendumItems(menu.addendumItems ?? []);
      setTaxConfig(menu.taxConfig);
      setPaymentConfig(menu.paymentConfig);
      setLoadingExisting(false);
    });
    return () => { cancelled = true; };
  }, [id, mode]);

  // Recompute subtotals whenever inputs change
  const computed = recalcSubtotals(lineItems, addendumItems, taxConfig, subtotalOverrides);

  function setAmount(itemId: string, raw: string) {
    const amount = parse(raw);
    // If it's a subtotal, store as override
    const item = lineItems.find(i => i.id === itemId);
    if (item?.isSubtotal) {
      setSubtotalOverrides(prev => ({ ...prev, [itemId]: amount }));
    } else {
      setLineItems(prev => prev.map(i => i.id === itemId ? { ...i, amount } : i));
    }
  }

  function clearOverride(itemId: string) {
    setSubtotalOverrides(prev => { const n = { ...prev }; delete n[itemId]; return n; });
  }

  // ── Addendum ──────────────────────────────────────────────────────────
  function openAddendumNew() {
    setEditingAddendum({ id: `add_${Date.now()}`, description: '', price: 0, taxable: true });
    setShowAddendumModal(true);
  }
  function openAddendumEdit(item: AddendumItem) {
    setEditingAddendum({ ...item });
    setShowAddendumModal(true);
  }
  function saveAddendum() {
    if (!editingAddendum) return;
    setAddendumItems(prev => {
      const exists = prev.find(a => a.id === editingAddendum.id);
      return exists ? prev.map(a => a.id === editingAddendum.id ? editingAddendum : a) : [...prev, editingAddendum];
    });
    setShowAddendumModal(false);
    setEditingAddendum(null);
  }
  function removeAddendum(id: string) {
    setAddendumItems(prev => prev.filter(a => a.id !== id));
  }

  // ── Tax ───────────────────────────────────────────────────────────────
  function handleTaxChange(field: keyof SalesMenuTaxConfig, raw: string) {
    setTaxConfig(prev => ({ ...prev, [field]: parseFloat(raw) || 0 }));
    // Clear sales_tax override so it recalculates
    setSubtotalOverrides(prev => { const n = { ...prev }; delete n['sales_tax']; return n; });
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
        vehicleDescription: vehicleDesc || undefined,
        lineItems: computed,
        addendumItems,
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
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-sm text-gray-400">Loading…</p></div>;
  }

  const totalTaxRate = (taxConfig.cityRate || 0) + (taxConfig.stateRate || 0) + (taxConfig.countyRate || 0);
  const balanceDue   = computed.find(i => i.id === 'balance_due')?.amount ?? 0;
  const monthly      = calcPayment(balanceDue, paymentConfig);
  const addendumTotal = addendumItems.reduce((s, a) => s + a.price, 0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-blue-600"><ChevronLeft size={22} /></button>
        <h1 className="text-base font-semibold text-gray-900">Sales Menu</h1>
        <button onClick={handleSave} disabled={saving} className="text-sm font-semibold text-blue-600 disabled:opacity-40">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 px-4 pt-4 pb-10 space-y-3 max-w-lg mx-auto w-full">
        {error && <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {/* Guest banner */}
        {guestName ? (
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-sm font-bold">{guestName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{guestName}</p>
              {vehicleDesc && <p className="text-xs text-gray-500 truncate">{vehicleDesc}</p>}
            </div>
            {guestSheetId && (
              <button onClick={() => navigate(`/GuestSheet/${guestSheetId}`)} className="text-xs text-blue-600 font-medium border border-blue-200 rounded-lg px-2 py-1 whitespace-nowrap">
                Guest Sheet
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Vehicle Description</label>
            <input value={vehicleDesc} onChange={e => setVehicleDesc(e.target.value)} placeholder="2017 Ford F-150 XLT" className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300" />
          </div>
        )}

        {/* ── Line Items Table ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {computed.map((item, idx) => {
            const isOverridden = item.isSubtotal && subtotalOverrides[item.id] !== undefined && subtotalOverrides[item.id] !== null;

            return (
              <React.Fragment key={item.id}>
                {/* Insert addendum block after vehicle_price */}
                {item.id === 'savings' && (
                  <AddendumSection
                    items={addendumItems}
                    total={addendumTotal}
                    onAdd={openAddendumNew}
                    onEdit={openAddendumEdit}
                    onRemove={removeAddendum}
                  />
                )}

                {item.isSubtotal ? (
                  // Subtotal row
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{item.label}</p>
                      {isOverridden && (
                        <button onClick={() => clearOverride(item.id)} className="text-[10px] text-blue-500 border border-blue-200 rounded px-1 py-0.5 whitespace-nowrap">Auto</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="text-[10px] text-gray-400 mr-1">{isOverridden ? 'override' : 'calc'}</span>
                      <div className="border border-gray-300 rounded-lg overflow-hidden w-32">
                        <input
                          defaultValue={item.amount.toFixed(2)}
                          key={`${item.id}-${item.amount}`}
                          onBlur={e => setAmount(item.id, e.target.value)}
                          onFocus={e => e.target.select()}
                          inputMode="decimal"
                          className="w-full px-2 py-1.5 text-sm font-bold text-gray-900 text-right bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular row
                  <div className={`px-4 py-3 flex items-center justify-between gap-3 ${item.isNegative ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className={`text-sm text-gray-800 ${item.isNegative ? 'text-red-600' : ''}`}>{item.label}</p>
                      {item.id === 'lieu_tax' && (
                        <button onClick={() => setShowVltModal(true)} className="text-[10px] text-blue-500 border border-blue-200 rounded px-1 py-0.5">VLT Calc</button>
                      )}
                      {item.id === 'sales_tax' && totalTaxRate > 0 && (
                        <span className="text-[10px] text-gray-400">{totalTaxRate.toFixed(2)}%</span>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden w-32 flex-shrink-0">
                      <input
                        defaultValue={item.amount !== 0 ? item.amount.toFixed(2) : ''}
                        key={`${item.id}-${item.id === 'sales_tax' ? item.amount : 'static'}`}
                        onBlur={e => setAmount(item.id, e.target.value)}
                        onFocus={e => e.target.select()}
                        inputMode="decimal"
                        placeholder="0.00"
                        readOnly={item.id === 'sales_tax'}
                        className={`w-full px-2 py-1.5 text-sm text-right text-gray-900 outline-none ${item.id === 'sales_tax' ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Tax Rate ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button onClick={() => setShowTaxEditor(v => !v)} className="w-full px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 text-left">Sales Tax Rate</p>
              <p className="text-xs text-gray-400 mt-0.5">{totalTaxRate.toFixed(2)}% combined</p>
            </div>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${showTaxEditor ? 'rotate-90' : ''}`} />
          </button>
          {showTaxEditor && (
            <div className="border-t border-gray-100 divide-y divide-gray-100">
              {(['stateRate', 'countyRate', 'cityRate'] as (keyof SalesMenuTaxConfig)[]).map(field => (
                <div key={field} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-gray-700 capitalize">{field.replace('Rate', ' Rate')}</p>
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                    <input defaultValue={taxConfig[field] || ''} onBlur={e => handleTaxChange(field, e.target.value)} onFocus={e => e.target.select()} inputMode="decimal" placeholder="0" className="w-16 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white" />
                    <span className="pr-2 text-sm text-gray-400">%</span>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 bg-gray-50 flex justify-between">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Combined</p>
                <p className="text-sm font-bold text-gray-900">{totalTaxRate.toFixed(2)}%</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Payment Estimate ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button onClick={() => setShowPaymentEditor(v => !v)} className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-green-500" />
              <div>
                <p className="text-sm font-semibold text-gray-900 text-left">Payment Estimate</p>
                <p className="text-xs text-gray-400 mt-0.5">Estimated Monthly</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-base font-bold text-green-600">{fmt(monthly)}<span className="text-xs font-normal text-gray-400">/mo</span></p>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${showPaymentEditor ? 'rotate-90' : ''}`} />
            </div>
          </button>
          {showPaymentEditor && (
            <div className="border-t border-gray-100 divide-y divide-gray-100">
              {[
                { label: 'Term (months)', field: 'term' as const, mode: 'numeric' as const },
                { label: 'APR (%)',        field: 'apr'  as const, mode: 'decimal' as const },
                { label: 'Down Payment',   field: 'downPayment' as const, mode: 'decimal' as const, prefix: '$' },
              ].map(({ label, field, mode: imode, prefix }) => (
                <div key={field} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-gray-700">{label}</p>
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                    {prefix && <span className="pl-2 text-sm text-gray-400">{prefix}</span>}
                    <input
                      defaultValue={paymentConfig[field] || ''}
                      onBlur={e => setPaymentConfig(p => ({ ...p, [field]: field === 'term' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0 }))}
                      onFocus={e => e.target.select()}
                      inputMode={imode}
                      placeholder="0"
                      className="w-20 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white text-sm font-semibold py-4 rounded-2xl shadow-sm active:opacity-80 disabled:opacity-40">
          {saving ? 'Saving…' : 'Save Sales Menu'}
        </button>
      </div>

      {/* ── No Guest Sheet Modal ── */}
      {showNoGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-gray-900 mb-2">No Guest Sheet Attached</p>
            <p className="text-sm text-gray-500 mb-5">For best results, create a Guest Sheet first so customer details pre-fill here.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowNoGuestModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Continue Anyway</button>
              <button onClick={() => navigate('/GuestSheet/new')} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold">Create Guest Sheet</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Addendum Modal ── */}
      {showAddendumModal && editingAddendum && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Addendum Item</p>
              <button onClick={() => { setShowAddendumModal(false); setEditingAddendum(null); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Description</label>
                <input
                  value={editingAddendum.description}
                  onChange={e => setEditingAddendum(a => a ? { ...a, description: e.target.value } : a)}
                  placeholder="Tint, Door Edge Guards, etc."
                  className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none"
                />
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Price</label>
                <input
                  value={editingAddendum.price || ''}
                  onChange={e => setEditingAddendum(a => a ? { ...a, price: parse(e.target.value) } : a)}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none"
                />
              </div>
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-gray-700">Taxable</p>
                <button
                  onClick={() => setEditingAddendum(a => a ? { ...a, taxable: !a.taxable } : a)}
                  className={`w-12 h-6 rounded-full transition-colors ${editingAddendum.taxable ? 'bg-blue-600' : 'bg-gray-300'} relative`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editingAddendum.taxable ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <button onClick={saveAddendum} className="w-full bg-blue-600 text-white text-sm font-semibold py-3.5 rounded-xl">
              Save Item
            </button>
          </div>
        </div>
      )}

      {/* ── VLT Modal ── */}
      {showVltModal && (
        <VltModal
          onApply={amount => {
            setLineItems(prev => prev.map(i => i.id === 'lieu_tax' ? { ...i, amount } : i));
            setShowVltModal(false);
          }}
          onClose={() => setShowVltModal(false)}
        />
      )}
    </div>
  );
}

// ─── Addendum Section ─────────────────────────────────────────────────────

function AddendumSection({
  items, total, onAdd, onEdit, onRemove,
}: {
  items: AddendumItem[];
  total: number;
  onAdd: () => void;
  onEdit: (item: AddendumItem) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <>
      {/* Addendum header row */}
      <div className="px-4 py-2 bg-blue-50 flex items-center justify-between">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Addendum</p>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-blue-600 font-medium">
          <Plus size={13} /> Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 italic">No addendum items</p>
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{item.description || 'Unnamed item'}</p>
              {item.taxable && <p className="text-[10px] text-gray-400 mt-0.5">Taxable</p>}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <p className="text-sm text-gray-900">{fmt(item.price)}</p>
              <button onClick={() => onEdit(item)} className="text-gray-400"><Pencil size={14} /></button>
              <button onClick={() => onRemove(item.id)} className="text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))
      )}

      {/* Addendum subtotal */}
      {items.length > 0 && (
        <div className="px-4 py-2 bg-blue-50/50 flex items-center justify-between border-b border-gray-100">
          <p className="text-xs text-gray-500">Addendum Total</p>
          <p className="text-sm font-semibold text-gray-700">{fmt(total)}</p>
        </div>
      )}
    </>
  );
}

// ─── VLT Modal ────────────────────────────────────────────────────────────

function VltModal({ onApply, onClose }: { onApply: (amount: number) => void; onClose: () => void }) {
  const [msrp, setMsrp]       = useState('');
  const [age, setAge]         = useState('');
  const [isNew, setIsNew]     = useState(true);

  const msrpNum = parse(msrp);
  const ageNum  = parseInt(age) || 0;
  const result  = calcVLT(msrpNum, ageNum, isNew);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">VLT Calculator</p>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-400">AZ Vehicle License Tax — 60% of MSRP × depreciation × rate/100</p>

        {/* New / Used toggle */}
        <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
          {['New', 'Used'].map(label => (
            <button
              key={label}
              onClick={() => setIsNew(label === 'New')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${(label === 'New') === isNew ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">MSRP</label>
            <input value={msrp} onChange={e => setMsrp(e.target.value)} inputMode="decimal" placeholder="$49,095.00" className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none" />
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
            <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Vehicle Age (years since first registered in AZ)</label>
            <input value={age} onChange={e => setAge(e.target.value)} inputMode="numeric" placeholder="0" className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none" />
          </div>
        </div>

        {/* Result */}
        <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Calculated VLT</p>
          <p className="text-lg font-bold text-blue-600">{fmt(result)}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={() => onApply(result)} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold">Apply to Lieu Tax</button>
        </div>
      </div>
    </div>
  );
}
