/**
 * StripeIt Constants
 */

import { LogField, LogFieldType } from '../types';

export const STRIPEIT_DEVELOPER_EMAIL = 'scottmoreau82@gmail.com';

export const DEFAULT_LOG_FIELDS: LogField[] = [
  { id: 'date', label: 'Deal Date', type: LogFieldType.DATE, required: true, visible: true, order: 0 },
  { id: 'desk', label: 'Desk Manager', type: LogFieldType.TEXT, required: true, visible: true, order: 1 },
  { id: 'customerName', label: 'Customer Last Name', type: LogFieldType.TEXT, required: true, visible: true, order: 2 },
  { id: 'dealNumber', label: 'Deal #', type: LogFieldType.TEXT, required: true, visible: true, order: 3 },
  { id: 'year', label: 'Year', type: LogFieldType.NUMBER, required: true, visible: true, order: 4 },
  { id: 'newOrUsed', label: 'N/U', type: LogFieldType.DROPDOWN, required: true, visible: true, order: 5, options: ['N', 'U', 'CPO'] },
  { id: 'model', label: 'Model', type: LogFieldType.TEXT, required: true, visible: true, order: 6 },
  { id: 'stockNumber', label: 'Stock #', type: LogFieldType.TEXT, required: true, visible: true, order: 7 },
  { id: 'frontGross', label: 'Front Gross', type: LogFieldType.CURRENCY, required: true, visible: true, order: 8 },
  { id: 'backGross', label: 'Back Gross', type: LogFieldType.CURRENCY, required: true, visible: true, order: 9 },
  { id: 'tradeInfo', label: 'Trade', type: LogFieldType.TEXT, required: false, visible: true, order: 10 },
  { id: 'salesperson', label: 'Salesperson', type: LogFieldType.TEXT, required: true, visible: true, order: 11 },
  { id: 'source', label: 'Source', type: LogFieldType.TEXT, required: false, visible: true, order: 12 },
  { id: 'fiManager', label: 'F&I', type: LogFieldType.TEXT, required: false, visible: true, order: 13 },
];

export const COLLECTIONS = {
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  DEALERSHIPS: 'dealerships',
  DEALS: 'deals',
  FEEDBACK_REPORTS: 'feedbackReports',
  ACTIVITY: 'activity',
  GOALS: 'goals',
  NOTIFICATIONS: 'notifications',
  COMPETITIONS: 'competitions',
  NOTES: 'notes',
};

export const ROUTES = {
  DASHBOARD: '/',
  SALES_LOG: '/sales-log',
  ACTIVITY: '/activity',
  ANALYTICS: '/analytics',
  GOALS: '/goals',
  REPORTS: '/reports',
  INVENTORY: '/inventory',
  SETTINGS: '/settings',
};
