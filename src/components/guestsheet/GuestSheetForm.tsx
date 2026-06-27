/**
 * GuestSheetForm.tsx
 * Create/edit a Guest Sheet at /GuestSheet/new or /GuestSheet/:id/edit
 * Standalone — no sidebar chrome.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserCircle, Car, RefreshCw, DollarSign, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  createGuestSheet,
  updateGuestSheet,
  getGuestSheet,
} from '../../services/guestSheetService';
import { GuestSheet, VehicleInterestType } from '../../types';

type FormState = Omit<GuestSheet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

const EMPTY: FormState = {
  guestName: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  cellPhone: '',
  email: '',
  vehicleInterest: 'new',
  stockNumber: '',
  model: '',
  vehicleRequirements: '',
  tradeYear: '',
  tradeMake: '',
  tradeModel: '',
  tradeMiles: '',
  tradeEstPayoff: '',
  tradeWhereFinanced: '',
  tradeReason: '',
  desiredMonthlyBudget: '',
  downPayment: '',
};

interface Props {
  mode?: 'create' | 'edit';
}

export function GuestSheetForm({ mode = 'create' }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(mode === 'edit');
  const [error, setError] = useState('');

  // Load existing sheet when editing
  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    let cancelled = false;
    getGuestSheet(id).then(sheet => {
      if (cancelled || !sheet) return;
      const { id: _id, userId: _uid, createdAt: _c, updatedAt: _u, ...rest } = sheet;
      setForm(rest);
      setLoadingExisting(false);
    });
    return () => { cancelled = true; };
  }, [id, mode]);

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!user) return;
    if (!form.guestName.trim()) {
      setError('Guest name is required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (mode === 'edit' && id) {
        await updateGuestSheet(id, form);
        navigate(`/GuestSheet/${id}`);
      } else {
        const newId = await createGuestSheet(user.uid, form);
        navigate(`/GuestSheet/${newId}`);
      }
    } catch (e) {
      setError('Failed to save. Please try again.');
      setSaving(false);
    }
  }

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  const interestOptions: { label: string; value: VehicleInterestType }[] = [
    { label: 'New', value: 'new' },
    { label: 'Used', value: 'used' },
    { label: 'Trade', value: 'trade' },
  ];

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
        <h1 className="text-base font-semibold text-gray-900">Guest Sheet</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-blue-600 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-10 space-y-6 max-w-lg mx-auto w-full">

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* ── Guest Information ── */}
        <section>
          <SectionHeader icon={<UserCircle size={18} className="text-blue-500" />} title="Guest Information" />
          <div className="space-y-2">
            <Field label="Guest Name" value={form.guestName} onChange={v => set('guestName', v)} placeholder="John Haviland" />
            <Field label="Address" value={form.address ?? ''} onChange={v => set('address', v)} placeholder="14908 W Elko Ct" />
            {/* City / State / Zip row */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex">
              <div className="flex-1 border-r border-gray-200">
                <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">City</label>
                <input
                  value={form.city ?? ''}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Surprise"
                  className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
              <div className="w-16 border-r border-gray-200">
                <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">ST</label>
                <input
                  value={form.state ?? ''}
                  onChange={e => set('state', e.target.value)}
                  placeholder="AZ"
                  maxLength={2}
                  className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300 uppercase"
                />
              </div>
              <div className="w-24">
                <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">Zip</label>
                <input
                  value={form.zip ?? ''}
                  onChange={e => set('zip', e.target.value)}
                  placeholder="85379"
                  inputMode="numeric"
                  maxLength={5}
                  className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300"
                />
              </div>
            </div>
            {/* Phone / Email row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Field label="Cell Phone" value={form.cellPhone ?? ''} onChange={v => set('cellPhone', v)} placeholder="(623) 555-1234" inputMode="tel" />
              </div>
              <div className="flex-1">
                <Field label="Email" value={form.email ?? ''} onChange={v => set('email', v)} placeholder="john@example.com" inputMode="email" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Vehicle Considered ── */}
        <section>
          <SectionHeader icon={<Car size={18} className="text-blue-500" />} title="Vehicle Considered" />
          <div className="space-y-2">
            {/* New / Used / Trade toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-1 flex gap-1">
              {interestOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('vehicleInterest', opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    form.vehicleInterest === opt.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Field label="Stock #" value={form.stockNumber ?? ''} onChange={v => set('stockNumber', v)} placeholder="75295" />
            <Field label="Model" value={form.model ?? ''} onChange={v => set('model', v)} placeholder="Telluride Hybrid" />
            <TextAreaField
              label="What are the basic requirements you need for your vehicle?"
              value={form.vehicleRequirements ?? ''}
              onChange={v => set('vehicleRequirements', v)}
              placeholder="Spacious SUV, good gas mileage, advanced safety features…"
            />
          </div>
        </section>

        {/* ── Trade Information ── */}
        <section>
          <SectionHeader icon={<RefreshCw size={18} className="text-blue-500" />} title="Trade Information (Optional)" />
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Field label="Year" value={form.tradeYear ?? ''} onChange={v => set('tradeYear', v)} placeholder="2016" inputMode="numeric" maxLength={4} />
              </div>
              <div className="flex-1">
                <Field label="Make" value={form.tradeMake ?? ''} onChange={v => set('tradeMake', v)} placeholder="Chevrolet" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Field label="Model" value={form.tradeModel ?? ''} onChange={v => set('tradeModel', v)} placeholder="Silverado 1500" />
              </div>
              <div className="flex-1">
                <Field label="Miles" value={form.tradeMiles ?? ''} onChange={v => set('tradeMiles', v)} placeholder="180,820" inputMode="numeric" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Field label="Est. Payoff" value={form.tradeEstPayoff ?? ''} onChange={v => set('tradeEstPayoff', v)} placeholder="$29,592.70" inputMode="decimal" />
              </div>
              <div className="flex-1">
                <Field label="Where Financed" value={form.tradeWhereFinanced ?? ''} onChange={v => set('tradeWhereFinanced', v)} placeholder="Reprise Financial" />
              </div>
            </div>
            <TextAreaField
              label="Why are you considering transportation at this time?"
              value={form.tradeReason ?? ''}
              onChange={v => set('tradeReason', v)}
              placeholder="Need a more fuel-efficient vehicle for my daily commute…"
            />
          </div>
        </section>

        {/* ── Monthly Budget ── */}
        <section>
          <SectionHeader icon={<DollarSign size={18} className="text-blue-500" />} title="Monthly Budget" />
          <div className="space-y-2">
            <Field label="Desired Monthly Budget" value={form.desiredMonthlyBudget ?? ''} onChange={v => set('desiredMonthlyBudget', v)} placeholder="$550.00" inputMode="decimal" />
            <Field label="Down Payment" value={form.downPayment ?? ''} onChange={v => set('downPayment', v)} placeholder="$4,337.00" inputMode="decimal" />
          </div>
        </section>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 text-white text-sm font-semibold py-4 rounded-2xl shadow-sm active:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {saving ? 'Saving…' : 'Save Guest Sheet'}
        </button>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <p className="text-sm font-bold text-blue-600">{title}</p>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
}

function Field({ label, value, onChange, placeholder, inputMode, maxLength }: FieldProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300"
      />
    </div>
  );
}

interface TextAreaFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function TextAreaField({ label, value, onChange, placeholder }: TextAreaFieldProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <label className="block px-3 pt-2 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
        {label}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 pb-2 pt-0.5 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-300 resize-none"
      />
    </div>
  );
}
