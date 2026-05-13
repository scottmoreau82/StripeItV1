import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts an input to a Date object, with a fallback.
 * Treats "YYYY-MM-DD" strings as calendar dates (local time).
 */
export function parseCalendarDate(date: any): Date | null {
  if (!date) return null;
  if (date instanceof Date) return isNaN(date.getTime()) ? null : date;
  
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    // Note: month is 0-indexed in new Date()
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }
  
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Extracts the calendar month (0-11) from a "YYYY-MM-DD" string or Date object.
 */
export function getCalendarMonth(date: any): number {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return parseInt(date.split('-')[1], 10) - 1;
  }
  const d = parseCalendarDate(date);
  return d ? d.getMonth() : new Date().getMonth();
}

/**
 * Extracts the calendar year from a "YYYY-MM-DD" string or Date object.
 */
export function getCalendarYear(date: any): number {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return parseInt(date.split('-')[0], 10);
  }
  const d = parseCalendarDate(date);
  return d ? d.getFullYear() : new Date().getFullYear();
}

/**
 * Checks if a value is a valid date input
 */
export function isValidDate(date: any): boolean {
  return parseCalendarDate(date) !== null;
}

/**
 * Safely converts an input to a Date object, with a fallback
 */
export function safeDate(date: any, fallback: Date = new Date()): Date {
  return parseCalendarDate(date) || fallback;
}

/**
 * Safely formats a date with a fallback string if invalid
 */
export function formatDateSafe(date: any, formatString: string = 'PP', fallback: string = '---'): string {
  const d = parseCalendarDate(date);
  if (!d) return fallback;
  try {
    return format(d, formatString);
  } catch (e) {
    return fallback;
  }
}
