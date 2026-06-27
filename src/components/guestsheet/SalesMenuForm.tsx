/**
 * SalesMenuForm.tsx — Sales Menu builder
 * All lines always visible. AZ fees combined row with formula modal.
 * VLT auto-calculates from vehicle price live.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calculator, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createSalesMenu, updateSalesMenu, getSalesMenu,
  buildDefaultLineItems, buildDefaultAZFees, defaultTaxConfig,
  defaultPaymentConfig, recalcSubtotals, calcVLT, calcAZFeesTotal,
} from '../../services/guestSheetService';
import {
  SalesMenu, SalesMenuLineItem, AddendumItem,
  SalesMenuTaxConfig, SalesMenuPaymentConfig, AZFeesConfig,
} from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}
function parse(s: string | number): number {
  if (typeof s === 'number') return s;
  const n = parseFloat(String(s).replace(/[^0-9.\-]/g, ''));
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
  const navigate      = useNavigate();
  const { id }        = useParams<{ id: string }>();
  const location      = useLocation();
  const { user }      = useAuth();
  const passed        = (location.state as LocationState) || {};

  const [guestSheetId, setGuestSheetId]           = useState(passed.guestSheetId ?? '');
  const [guestName, setGuestName]                 = useState(passed.guestName ?? '');
  const [vehicleDesc, setVehicleDesc]             = useState(passed.vehicleDescription ?? '');
  const [lineItems, setLineItems]                 = useState<SalesMenuLineItem[]>(buildDefaultLineItems);
  const [addendumItems, setAddendumItems]         = useState<AddendumItem[]>([]);
  const [azFees, setAzFees]                       = useState<AZFeesConfig>(() => buildDefaultAZFees(0));
  const [taxConfig, setTaxConfig]                 = useState<SalesMenuTaxConfig>(defaultTaxConfig);
  const [paymentConfig, setPaymentConfig]         = useState<SalesMenuPaymentConfig>(defaultPaymentConfig);
  const [subtotalOverrides, setSubtotalOverrides] = useState<Record<string, number | null>>({});

  const [showTaxEditor, setShowTaxEditor]         = useState(false);
  const [showPaymentEditor, setShowPaymentEditor] = useState(false);
  const [showNoGuestModal, setShowNoGuestModal]   = useState(false);
  const [noGuestShown, setNoGuestShown]           = useState(false);
  const [showAddendumModal, setShowAddendumModal] = useState(false);
  const [editingAddendum, setEditingAddendum]     = useState<AddendumItem | null>(null);
  const [showAZModal, setShowAZModal]             = useState(false);
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
      setAzFees(menu.azFees ?? buildDefaultAZFees(0));
      setTaxConfig(menu.taxConfig);
      setPaymentConfig(menu.paymentConfig);
      setLoadingExisting(false);
    });
    return () => { cancelled = true; };
  }, [id, mode]);

  // Auto-update VLT when vehicle price changes (only if vltMsrp tracks vehicle price)
  function handleVehiclePriceChange(raw: string) {
    const amount = parse(raw);
    setLineItems(prev => prev.map(i => i.id === 'vehicle_price' ? { ...i, amount } : i));
    // Update VLT using vehicle price as MSRP proxy
    setAzFees(prev => {
      const newVlt = calcVLT(amount, prev.vltAge, prev.vltIsNew);
      return { ...prev, vltMsrp: amount, vltAmount: newVlt };
    });
  }

  const computed = recalcSubtotals(lineItems, addendumItems, taxConfig, subtotalOverrides, azFees);

  function setAmount(itemId: string, raw: string) {
    const amount = parse(raw);
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
  function removeAddendum(id: string) { setAddendumItems(prev => prev.filter(a => a.id !== id)); }

  // ── Tax ───────────────────────────────────────────────────────────────
  function handleTaxChange(field: keyof SalesMenuTaxConfig, raw: string) {
    setTaxConfig(prev => ({ ...prev, [field]: parseFloat(raw) || 0 }));
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
        azFees,
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

  if (loadingExisting) return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-sm text-gray-400">Loading…</p></div>;

  const totalTaxRate  = (taxConfig.cityRate || 0) + (taxConfig.stateRate || 0) + (taxConfig.countyRate || 0);
  const balanceDue    = computed.find(i => i.id === 'balance_due')?.amount ?? 0;
  const monthly       = calcPayment(balanceDue, paymentConfig);
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

        {/* ── Line Items ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
          {computed.map(item => {
            const isOverridden = item.isSubtotal && subtotalOverrides[item.id] != null;

            return (
              <React.Fragment key={item.id}>
                {/* Addendum block after vehicle_price */}
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
                          key={`${item.id}-${item.amount}-${isOverridden}`}
                          onBlur={e => setAmount(item.id, e.target.value)}
                          onFocus={e => e.target.select()}
                          inputMode="decimal"
                          className="w-full px-2 py-1.5 text-sm font-bold text-gray-900 text-right bg-white outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : item.id === 'az_fees' ? (
                  // AZ Registration Fees — tap to open modal
                  <button
                    onClick={() => setShowAZModal(true)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 active:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className="text-sm text-gray-800">AZ Registration Fees</p>
                      <span className="text-[10px] text-blue-500 border border-blue-200 rounded px-1 py-0.5">Edit</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">{fmt(calcAZFeesTotal(azFees))}</p>
                  </button>
                ) : item.id === 'vehicle_price' ? (
                  <div className={`px-4 py-3 flex items-center justify-between gap-3`}>
                    <p className="text-sm text-gray-800 flex-1">{item.label}</p>
                    <div className="border border-gray-200 rounded-lg overflow-hidden w-32 flex-shrink-0">
                      <input
                        defaultValue={item.amount !== 0 ? item.amount.toFixed(2) : ''}
                        key={`vehicle_price_${item.amount}`}
                        onBlur={e => handleVehiclePriceChange(e.target.value)}
                        onFocus={e => e.target.select()}
                        inputMode="decimal"
                        placeholder="0.00"
                        className="w-full px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`px-4 py-3 flex items-center justify-between gap-3 ${item.isNegative ? 'bg-red-50/30' : ''}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <p className={`text-sm ${item.isNegative ? 'text-red-600' : 'text-gray-800'}`}>{item.label}</p>
                      {item.id === 'sales_tax' && totalTaxRate > 0 && (
                        <span className="text-[10px] text-gray-400">{totalTaxRate.toFixed(2)}%</span>
                      )}
                    </div>
                    <div className="border border-gray-200 rounded-lg overflow-hidden w-32 flex-shrink-0">
                      <input
                        defaultValue={item.amount !== 0 ? item.amount.toFixed(2) : ''}
                        key={`${item.id}_${item.id === 'sales_tax' ? item.amount : 'static'}`}
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
                { label: 'Term (months)', field: 'term'        as const, imode: 'numeric'  as const },
                { label: 'APR (%)',       field: 'apr'         as const, imode: 'decimal'  as const },
                { label: 'Down Payment',  field: 'downPayment' as const, imode: 'decimal'  as const, prefix: '$' },
              ].map(({ label, field, imode, prefix }) => (
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

        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white text-sm font-semibold py-4 rounded-2xl shadow-sm active:opacity-80 disabled:opacity-40">
          {saving ? 'Saving…' : 'Save Sales Menu'}
        </button>
      </div>

      {/* ── No Guest Sheet Modal ── */}
      {showNoGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-gray-900 mb-2">No Guest Sheet Attached</p>
            <p className="text-sm text-gray-500 mb-5">For best results, create a Guest Sheet first.</p>
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
              <FloatField label="Description" value={editingAddendum.description} onChange={v => setEditingAddendum(a => a ? { ...a, description: v } : a)} placeholder="Tint, Door Edge Guards…" />
              <FloatField label="Price" value={editingAddendum.price || ''} onChange={v => setEditingAddendum(a => a ? { ...a, price: parse(v) } : a)} placeholder="0.00" inputMode="decimal" />
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-gray-700">Taxable</p>
                <button onClick={() => setEditingAddendum(a => a ? { ...a, taxable: !a.taxable } : a)} className={`w-12 h-6 rounded-full transition-colors relative ${editingAddendum.taxable ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${editingAddendum.taxable ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <button onClick={saveAddendum} className="w-full bg-blue-600 text-white text-sm font-semibold py-3.5 rounded-xl">Save Item</button>
          </div>
        </div>
      )}

      {/* ── AZ Registration Fees Modal ── */}
      {showAZModal && (
        <AZFeesModal
          fees={azFees}
          onChange={setAzFees}
          onClose={() => setShowAZModal(false)}
        />
      )}
    </div>
  );
}

// ─── Addendum Section ─────────────────────────────────────────────────────

function AddendumSection({ items, total, onAdd, onEdit, onRemove }: {
  items: AddendumItem[]; total: number;
  onAdd: () => void; onEdit: (i: AddendumItem) => void; onRemove: (id: string) => void;
}) {
  function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n); }
  return (
    <>
      <div className="px-4 py-2 bg-blue-50 flex items-center justify-between">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Addendum</p>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-blue-600 font-medium"><Plus size={13} /> Add Item</button>
      </div>
      {items.length === 0 ? (
        <div className="px-4 py-3"><p className="text-xs text-gray-400 italic">No addendum items</p></div>
      ) : (
        items.map(item => (
          <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{item.description || 'Unnamed'}</p>
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
      {items.length > 0 && (
        <div className="px-4 py-2 bg-blue-50/50 flex items-center justify-between">
          <p className="text-xs text-gray-500">Addendum Total</p>
          <p className="text-sm font-semibold text-gray-700">{fmt(total)}</p>
        </div>
      )}
    </>
  );
}

// ─── AZ Fees Modal ────────────────────────────────────────────────────────

function AZFeesModal({ fees, onChange, onClose }: {
  fees: AZFeesConfig;
  onChange: (f: AZFeesConfig) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<AZFeesConfig>({ ...fees });

  function set(field: keyof AZFeesConfig, value: string | number | boolean) {
    setLocal(prev => {
      const next = { ...prev, [field]: value };
      // Recalculate VLT whenever its inputs change
      if (['vltMsrp', 'vltAge', 'vltIsNew'].includes(field as string)) {
        next.vltAmount = calcVLT(
          field === 'vltMsrp' ? Number(value) : next.vltMsrp,
          field === 'vltAge'  ? Number(value) : next.vltAge,
          field === 'vltIsNew' ? Boolean(value) : next.vltIsNew,
        );
      }
      return next;
    });
  }

  function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n); }

  const total = (local.licenseFee || 0) + (local.postage || 0) + (local.tireFee || 0) + (local.airQuality || 0) + (local.titleFee || 0) + (local.vltAmount || 0);

  const vltFormula = local.vltMsrp > 0
    ? `${fmt(local.vltMsrp)} × 60% × (1−16.25%)^${local.vltAge} × ${local.vltIsNew ? '$2.80' : '$2.89'}/$100`
    : 'Enter MSRP to calculate';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-base font-bold text-gray-900">AZ Registration Fees</p>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        {/* Flat fees */}
        {([
          { label: 'License Fee',  field: 'licenseFee' as const },
          { label: 'Postage',      field: 'postage'    as const },
          { label: 'Tire Fee',     field: 'tireFee'    as const },
          { label: 'Air Quality',  field: 'airQuality' as const },
          { label: 'Title Fee',    field: 'titleFee'   as const },
        ]).map(({ label, field }) => (
          <div key={field} className="flex items-center justify-between">
            <p className="text-sm text-gray-700">{label}</p>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <span className="pl-2 text-sm text-gray-400">$</span>
              <input
                value={local[field] || ''}
                onChange={e => set(field, parseFloat(e.target.value) || 0)}
                onFocus={e => e.target.select()}
                inputMode="decimal"
                placeholder="0.00"
                className="w-20 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
              />
            </div>
          </div>
        ))}

        {/* VLT — formula section */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <p className="text-sm font-bold text-gray-800">Lieu Tax (VLT)</p>

          {/* New / Used toggle */}
          <div className="bg-gray-100 rounded-xl p-1 flex gap-1">
            {['New', 'Used'].map(label => (
              <button
                key={label}
                onClick={() => set('vltIsNew', label === 'New')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${(label === 'New') === local.vltIsNew ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">MSRP</p>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <span className="pl-2 text-sm text-gray-400">$</span>
              <input
                value={local.vltMsrp || ''}
                onChange={e => set('vltMsrp', parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0)}
                onFocus={e => e.target.select()}
                inputMode="decimal"
                placeholder="0.00"
                className="w-24 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">Vehicle Age (years)</p>
            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
              <input
                value={local.vltAge || ''}
                onChange={e => set('vltAge', parseInt(e.target.value) || 0)}
                onFocus={e => e.target.select()}
                inputMode="numeric"
                placeholder="0"
                className="w-16 px-2 py-1.5 text-sm text-right text-gray-900 outline-none bg-white"
              />
            </div>
          </div>

          {/* Formula display */}
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-1">Formula</p>
            <p className="text-xs text-gray-500 font-mono leading-relaxed">{vltFormula}</p>
          </div>

          {/* Result */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Calculated VLT</p>
            <p className="text-lg font-bold text-blue-600">{fmt(local.vltAmount)}</p>
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-800">Total AZ Fees</p>
          <p className="text-base font-bold text-gray-900">{fmt(total)}</p>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
          <button onClick={() => { onChange(local); onClose(); }} className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold">Apply</button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared field component ───────────────────────────────────────────────

function FloatField({ label, value, onChange, placeholder, inputMode }: {
  label: string; value: string | number; onChange: (v: string) => void;
  placeholder?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300" />
    </div>
  );
}
