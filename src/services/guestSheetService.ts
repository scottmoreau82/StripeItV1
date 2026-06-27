/**
 * guestSheetService.ts
 * Firestore CRUD for GuestSheet and SalesMenu collections.
 * Stored under the authenticated user's UID — not tied to orgId.
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GuestSheet, SalesMenu, SalesMenuLineItem, SalesMenuTaxConfig, SalesMenuPaymentConfig } from '../types';

const GUEST_SHEETS = 'guestSheets';
const SALES_MENUS = 'salesMenus';

// ─── Default line items for a new Sales Menu ──────────────────────────────

export function buildDefaultLineItems(vehicleDescription?: string): SalesMenuLineItem[] {
  return [
    {
      id: 'vehicle_price',
      label: 'Vehicle Price',
      sublabel: vehicleDescription || '',
      amount: 0,
      enabled: true,
    },
    {
      id: 'addons',
      label: 'Add-Ons',
      sublabel: '',
      amount: 0,
      enabled: true,
    },
    {
      id: 'discount',
      label: 'Discount',
      sublabel: '',
      amount: 0,
      enabled: false,
      isNegative: true,
    },
    {
      id: 'fees',
      label: 'Fees',
      sublabel: 'Documentation Fee',
      amount: 0,
      enabled: true,
    },
    {
      id: 'rebate',
      label: 'Rebate',
      sublabel: '',
      amount: 0,
      enabled: false,
      isNegative: true,
    },
    {
      id: 'trade_allowance',
      label: 'Trade Allowance',
      sublabel: '',
      amount: 0,
      enabled: false,
      isNegative: true,
    },
    {
      id: 'sales_tax',
      label: 'Sales Tax',
      sublabel: '',
      amount: 0,
      enabled: true,
      isReadOnly: true,
    },
  ];
}

export const defaultTaxConfig: SalesMenuTaxConfig = {
  cityRate: 0,
  stateRate: 0,
  countyRate: 0,
};

export const defaultPaymentConfig: SalesMenuPaymentConfig = {
  term: 72,
  apr: 6.9,
  downPayment: 0,
};

// ─── GuestSheet CRUD ──────────────────────────────────────────────────────

export async function createGuestSheet(
  userId: string,
  data: Omit<GuestSheet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, GUEST_SHEETS), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateGuestSheet(
  id: string,
  data: Partial<Omit<GuestSheet, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, GUEST_SHEETS, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteGuestSheet(id: string): Promise<void> {
  await deleteDoc(doc(db, GUEST_SHEETS, id));
}

export async function getGuestSheet(id: string): Promise<GuestSheet | null> {
  const snap = await getDoc(doc(db, GUEST_SHEETS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as GuestSheet;
}

export async function getUserGuestSheets(userId: string): Promise<GuestSheet[]> {
  const q = query(
    collection(db, GUEST_SHEETS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuestSheet));
}

// ─── SalesMenu CRUD ───────────────────────────────────────────────────────

export async function createSalesMenu(
  userId: string,
  data: Omit<SalesMenu, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, SALES_MENUS), {
    ...data,
    userId,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateSalesMenu(
  id: string,
  data: Partial<Omit<SalesMenu, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  await updateDoc(doc(db, SALES_MENUS, id), {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteSalesMenu(id: string): Promise<void> {
  await deleteDoc(doc(db, SALES_MENUS, id));
}

export async function getSalesMenu(id: string): Promise<SalesMenu | null> {
  const snap = await getDoc(doc(db, SALES_MENUS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as SalesMenu;
}

export async function getUserSalesMenus(userId: string): Promise<SalesMenu[]> {
  const q = query(
    collection(db, SALES_MENUS),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesMenu));
}

export async function getSalesMenusForGuestSheet(guestSheetId: string): Promise<SalesMenu[]> {
  const q = query(
    collection(db, SALES_MENUS),
    where('guestSheetId', '==', guestSheetId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesMenu));
}
