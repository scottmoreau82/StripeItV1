/**
 * GuestSheetDetail.tsx
 * Read-only view of a saved Guest Sheet at /GuestSheet/:id
 * Actions: Edit, Create Sales Menu from this guest
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Pencil,
  UserCircle,
  Car,
  RefreshCw,
  DollarSign,
  ListChecks,
  Trash2,
} from 'lucide-react';
import { getGuestSheet, deleteGuestSheet, getSalesMenusForGuestSheet } from '../../services/guestSheetService';
import { GuestSheet, SalesMenu } from '../../types';

export function GuestSheetDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [sheet, setSheet] = useState<GuestSheet | null>(null);
  const [menus, setMenus] = useState<SalesMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    Promise.all([
      getGuestSheet(id),
      getSalesMenusForGuestSheet(id),
    ]).then(([s, m]) => {
      if (cancelled) return;
      setSheet(s);
      setMenus(m);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [id]);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    await deleteGuestSheet(id);
    navigate('/GuestSheet');
  }

  function handleCreateSalesMenu() {
    navigate('/GuestSheet/sales-menu/new', {
      state: {
        guestSheetId: sheet?.id,
        guestName: sheet?.guestName,
        vehicleDescription: [sheet?.model].filter(Boolean).join(' '),
      },
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-500">Guest sheet not found.</p>
        <button onClick={() => navigate('/GuestSheet')} className="text-sm text-blue-600 font-medium">
          Go back
        </button>
      </div>
    );
  }

  const vehicleLabel = [
    sheet.vehicleInterest?.toUpperCase(),
    sheet.stockNumber && `#${sheet.stockNumber}`,
    sheet.model,
  ].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate('/GuestSheet')}
          className="flex items-center gap-1 text-blue-600 text-sm font-medium"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Guest Sheet</h1>
        <button
          onClick={() => navigate(`/GuestSheet/${id}/edit`)}
          className="text-blue-600"
        >
          <Pencil size={18} />
        </button>
      </div>

      <div className="flex-1 px-4 pt-5 pb-10 space-y-5 max-w-lg mx-auto w-full">

        {/* Guest name hero */}
        <div className="bg-white rounded-2xl border border-gray-200 px-4 py-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <UserCircle size={24} className="text-blue-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{sheet.guestName}</p>
            {vehicleLabel && (
              <p className="text-xs text-gray-500 mt-0.5">{vehicleLabel}</p>
            )}
          </div>
        </div>

        {/* Create Sales Menu CTA */}
        <button
          onClick={handleCreateSalesMenu}
          className="w-full bg-blue-600 text-white text-sm font-semibold py-3.5 rounded-2xl shadow-sm active:opacity-80 transition-opacity flex items-center justify-center gap-2"
        >
          <ListChecks size={17} strokeWidth={2} />
          Create Sales Menu
        </button>

        {/* Linked Sales Menus */}
        {menus.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sales Menus</p>
            <div className="space-y-2">
              {menus.map(m => (
                <button
                  key={m.id}
                  onClick={() => navigate(`/GuestSheet/sales-menu/${m.id}`)}
                  className="w-full bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 text-left active:bg-gray-50 transition-colors"
                >
                  <ListChecks size={18} className="text-green-500 flex-shrink-0" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {m.vehicleDescription || sheet.guestName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(m.createdAt).toLocaleDateString('en-US')}
                    </p>
                  </div>
                  <ChevronLeft size={16} className="text-gray-300 rotate-180 flex-shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Guest Information */}
        <Section title="Guest Information" icon={<UserCircle size={16} className="text-blue-500" />}>
          <Row label="Name" value={sheet.guestName} />
          {sheet.address && <Row label="Address" value={sheet.address} />}
          {(sheet.city || sheet.state || sheet.zip) && (
            <Row
              label="City / State / Zip"
              value={[sheet.city, sheet.state, sheet.zip].filter(Boolean).join(', ')}
            />
          )}
          {sheet.cellPhone && <Row label="Cell Phone" value={sheet.cellPhone} />}
          {sheet.email && <Row label="Email" value={sheet.email} />}
        </Section>

        {/* Vehicle Considered */}
        <Section title="Vehicle Considered" icon={<Car size={16} className="text-blue-500" />}>
          <Row label="Interest" value={sheet.vehicleInterest?.charAt(0).toUpperCase() + sheet.vehicleInterest?.slice(1)} />
          {sheet.stockNumber && <Row label="Stock #" value={sheet.stockNumber} />}
          {sheet.model && <Row label="Model" value={sheet.model} />}
          {sheet.vehicleRequirements && <Row label="Requirements" value={sheet.vehicleRequirements} multiline />}
        </Section>

        {/* Trade Information */}
        {(sheet.tradeYear || sheet.tradeMake || sheet.tradeModel) && (
          <Section title="Trade Information" icon={<RefreshCw size={16} className="text-blue-500" />}>
            {(sheet.tradeYear || sheet.tradeMake) && (
              <Row label="Year / Make" value={[sheet.tradeYear, sheet.tradeMake].filter(Boolean).join(' ')} />
            )}
            {(sheet.tradeModel || sheet.tradeMiles) && (
              <Row label="Model / Miles" value={[sheet.tradeModel, sheet.tradeMiles && `${sheet.tradeMiles} mi`].filter(Boolean).join(' · ')} />
            )}
            {sheet.tradeEstPayoff && <Row label="Est. Payoff" value={sheet.tradeEstPayoff} />}
            {sheet.tradeWhereFinanced && <Row label="Where Financed" value={sheet.tradeWhereFinanced} />}
            {sheet.tradeReason && <Row label="Reason" value={sheet.tradeReason} multiline />}
          </Section>
        )}

        {/* Monthly Budget */}
        {(sheet.desiredMonthlyBudget || sheet.downPayment) && (
          <Section title="Monthly Budget" icon={<DollarSign size={16} className="text-blue-500" />}>
            {sheet.desiredMonthlyBudget && <Row label="Desired Monthly Budget" value={sheet.desiredMonthlyBudget} />}
            {sheet.downPayment && <Row label="Down Payment" value={sheet.downPayment} />}
          </Section>
        )}

        {/* Delete */}
        {!pendingDelete ? (
          <button
            onClick={() => setPendingDelete(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-red-400 font-medium"
          >
            <Trash2 size={15} />
            Delete Guest Sheet
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-4 space-y-3">
            <p className="text-sm text-red-700 font-medium text-center">Delete this guest sheet?</p>
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

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{title}</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm text-gray-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>{value}</p>
    </div>
  );
}
