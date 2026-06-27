/**
 * guestSheetService.ts
 * Firestore CRUD for GuestSheet and SalesMenu collections.
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  GuestSheet, SalesMenu, SalesMenuLineItem, AddendumItem,
  SalesMenuTaxConfig, SalesMenuPaymentConfig, AZFeesConfig,
} from '../types';

const GUEST_SHEETS = 'guestSheets';
const SALES_MENUS  = 'salesMenus';

// ─── VLT formula ──────────────────────────────────────────────────────────
// AZ: assessed = MSRP × 0.60 × (1 - 0.1625)^yearsOld
// New: $2.80/$100, Used: $2.89/$100

export function calcVLT(msrp: number, yearsOld: number, isNew: boolean): number {
  if (msrp <= 0) return 0;
  const assessed = msrp * 0.60 * Math.pow(1 - 0.1625, Math.max(0, yearsOld));
  const rate = isNew ? 2.80 : 2.89;
  return Math.round((assessed / 100) * rate * 100) / 100;
}

// ─── Default AZ fees config ───────────────────────────────────────────────

export function buildDefaultAZFees(vehiclePrice: number): AZFeesConfig {
  return {
    licenseFee:  8.25,
    postage:     3.00,
    tireFee:     5.00,
    airQuality:  1.50,
    titleFee:    4.00,
    // VLT: new vehicle, year 0, using vehicle price as MSRP
    vltMsrp:     vehiclePrice,
    vltAge:      0,
    vltIsNew:    true,
    vltAmount:   calcVLT(vehiclePrice, 0, true),
  };
}

export function calcAZFeesTotal(fees: AZFeesConfig): number {
  return (fees.licenseFee || 0)
    + (fees.postage || 0)
    + (fees.tireFee || 0)
    + (fees.airQuality || 0)
    + (fees.titleFee || 0)
    + (fees.vltAmount || 0);
}

// ─── Default line items ───────────────────────────────────────────────────

export function buildDefaultLineItems(): SalesMenuLineItem[] {
  return [
    { id: 'vehicle_price',   label: 'Vehicle Price',        amount: 0,      taxable: true },
    { id: 'savings',         label: 'Savings',              amount: 0,      isNegative: true },
    { id: 'customer_rebate', label: 'Customer Rebate',      amount: 0,      isNegative: true },
    { id: 'net_price',       label: 'Net Price',            amount: 0,      isSubtotal: true, isOverridable: true },
    { id: 'trade_value',     label: 'Trade-in Value',       amount: 0,      isNegative: true },
    { id: 'difference',      label: 'Difference',           amount: 0,      isSubtotal: true, isOverridable: true },
    { id: 'lien_payoff',     label: 'Lien Payoff',          amount: 0 },
    { id: 'sales_tax',       label: 'Sales Tax',            amount: 0 },
    { id: 'doc_fee',         label: 'Documentation Fee',    amount: 599.50 },
    { id: 'az_fees',         label: 'AZ Registration Fees', amount: calcAZFeesTotal(buildDefaultAZFees(0)) },
    { id: 'other',           label: 'Other',                amount: 0 },
    { id: 'balance_due',     label: 'Balance Due',          amount: 0,      isSubtotal: true, isOverridable: true },
  ];
}

export const defaultTaxConfig: SalesMenuTaxConfig = {
  cityRate:   0,
  stateRate:  0,
  countyRate: 0,
};

export const defaultPaymentConfig: SalesMenuPaymentConfig = {
  term:        72,
  apr:         6.9,
  downPayment: 0,
};

// ─── Recalculate subtotals ────────────────────────────────────────────────

export function recalcSubtotals(
  items: SalesMenuLineItem[],
  addendumItems: AddendumItem[],
  taxConfig: SalesMenuTaxConfig,
  overrides: Record<string, number | null>,
  azFees: AZFeesConfig,
): SalesMenuLineItem[] {
  const get = (id: string) => items.find(i => i.id === id)?.amount ?? 0;

  const vehiclePrice    = get('vehicle_price');
  const addendumTotal   = addendumItems.reduce((s, a) => s + a.price, 0);
  const savings         = get('savings');
  const rebate          = get('customer_rebate');

  const netPrice = overrides['net_price'] != null
    ? overrides['net_price']
    : vehiclePrice + addendumTotal - savings - rebate;

  const tradeValue  = get('trade_value');
  const difference  = overrides['difference'] != null
    ? overrides['difference']
    : netPrice - tradeValue;

  const lienPayoff  = get('lien_payoff');

  // Sales tax base: vehicle_price + taxable addendum
  const taxableAddendum = addendumItems.filter(a => a.taxable).reduce((s, a) => s + a.price, 0);
  const taxBase         = vehiclePrice + taxableAddendum;
  const totalTaxRate    = ((taxConfig.cityRate || 0) + (taxConfig.stateRate || 0) + (taxConfig.countyRate || 0)) / 100;
  const salesTax        = Math.round(taxBase * totalTaxRate * 100) / 100;

  const docFee    = get('doc_fee');
  const azTotal   = calcAZFeesTotal(azFees);
  const other     = get('other');

  const balanceDue = overrides['balance_due'] != null
    ? overrides['balance_due']
    : difference + lienPayoff + salesTax + docFee + azTotal + other;

  return items.map(i => {
    if (i.id === 'net_price')   return { ...i, amount: netPrice };
    if (i.id === 'difference')  return { ...i, amount: difference };
    if (i.id === 'sales_tax')   return { ...i, amount: salesTax };
    if (i.id === 'az_fees')     return { ...i, amount: azTotal };
    if (i.id === 'balance_due') return { ...i, amount: balanceDue };
    return i;
  });
}

// ─── GuestSheet CRUD ──────────────────────────────────────────────────────

export async function createGuestSheet(userId: string, data: Omit<GuestSheet, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, GUEST_SHEETS), { ...data, userId, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateGuestSheet(id: string, data: Partial<Omit<GuestSheet, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await updateDoc(doc(db, GUEST_SHEETS, id), { ...data, updatedAt: Date.now() });
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
  const q = query(collection(db, GUEST_SHEETS), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as GuestSheet));
}

// ─── SalesMenu CRUD ───────────────────────────────────────────────────────

export async function createSalesMenu(userId: string, data: Omit<SalesMenu, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Date.now();
  const ref = await addDoc(collection(db, SALES_MENUS), { ...data, userId, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateSalesMenu(id: string, data: Partial<Omit<SalesMenu, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await updateDoc(doc(db, SALES_MENUS, id), { ...data, updatedAt: Date.now() });
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
  const q = query(collection(db, SALES_MENUS), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesMenu));
}

export async function getSalesMenusForGuestSheet(guestSheetId: string): Promise<SalesMenu[]> {
  const q = query(collection(db, SALES_MENUS), where('guestSheetId', '==', guestSheetId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as SalesMenu));
}
