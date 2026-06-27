/**
 * GuestSheetHome.tsx
 * Landing screen for the Guest Sheet mini-app at /GuestSheet
 * Standalone — no sidebar, no DashboardLayout chrome.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, ListChecks, ChevronRight, ClipboardList } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserGuestSheets, getUserSalesMenus } from '../../services/guestSheetService';
import { GuestSheet, SalesMenu } from '../../types';

type RecentRecord =
  | { kind: 'guestsheet'; data: GuestSheet }
  | { kind: 'salesmenu'; data: SalesMenu };

export function GuestSheetHome() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [records, setRecords] = useState<RecentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function load() {
      try {
        const [sheets, menus] = await Promise.all([
          getUserGuestSheets(user!.uid),
          getUserSalesMenus(user!.uid),
        ]);

        if (cancelled) return;

        const combined: RecentRecord[] = [
          ...sheets.map(d => ({ kind: 'guestsheet' as const, data: d })),
          ...menus.map(d => ({ kind: 'salesmenu' as const, data: d })),
        ];

        // Sort by most recent first
        combined.sort((a, b) => b.data.createdAt - a.data.createdAt);
        setRecords(combined.slice(0, 10));
      } catch (e) {
        // silently fail — non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  const firstName = profile?.displayName?.split(' ')[0] ?? 'Scott';

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString('en-US');
  }

  function getVehicleDescription(record: RecentRecord): string {
    if (record.kind === 'guestsheet') {
      const parts = [record.data.model].filter(Boolean);
      return parts.length ? parts.join(' ') : '—';
    }
    return record.data.vehicleDescription || '—';
  }

  function getGuestName(record: RecentRecord): string {
    if (record.kind === 'guestsheet') return record.data.guestName;
    return record.data.guestName || 'Unknown Guest';
  }

  function handleRecordTap(record: RecentRecord) {
    if (record.kind === 'guestsheet') {
      navigate(`/GuestSheet/${record.data.id}`);
    } else {
      navigate(`/GuestSheet/sales-menu/${record.data.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">


      <div className="flex-1 px-4 pt-5 pb-8 space-y-6 max-w-lg mx-auto w-full">
        {/* Action Cards */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/GuestSheet/new')}
            className="w-full bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 px-4 py-4 text-left active:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <UserCircle size={28} className="text-blue-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Create Guest Sheet</p>
              <p className="text-xs text-gray-500 mt-0.5">Capture guest &amp; vehicle details</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          </button>

          <button
            onClick={() => navigate('/GuestSheet/sales-menu/new')}
            className="w-full bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 px-4 py-4 text-left active:bg-gray-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <ListChecks size={28} className="text-green-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Create Sales Menu</p>
              <p className="text-xs text-gray-500 mt-0.5">Build a simple deal proposal</p>
            </div>
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          </button>
        </div>

        {/* Recent Records */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Recent Records</p>
            {records.length > 0 && (
              <button
                onClick={() => {}} // future: full records list
                className="text-xs font-medium text-blue-600"
              >
                View all
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 h-16 animate-pulse" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-6 text-center">
              <ClipboardList size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <button
                  key={`${record.kind}-${record.data.id}`}
                  onClick={() => handleRecordTap(record)}
                  className="w-full bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {record.kind === 'guestsheet' ? (
                      <UserCircle size={20} className="text-blue-500" strokeWidth={1.5} />
                    ) : (
                      <ListChecks size={20} className="text-green-500" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {getGuestName(record)}
                      {record.kind === 'salesmenu' && (
                        <span className="font-normal text-gray-500"> - Sales Menu</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {getVehicleDescription(record)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(record.data.createdAt)}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
