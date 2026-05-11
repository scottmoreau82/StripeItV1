import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a value is a valid date input
 */
export function isValidDate(date: any): boolean {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Safely converts an input to a Date object, with a fallback
 */
export function safeDate(date: any, fallback: Date = new Date()): Date {
  if (!date) return fallback;
  const d = new Date(date);
  return isNaN(d.getTime()) ? fallback : d;
}

/**
 * Safely formats a date with a fallback string if invalid
 */
export function formatDateSafe(date: any, formatString: string = 'PP', fallback: string = '---'): string {
  if (!date) return fallback;
  const d = new Date(date);
  if (isNaN(d.getTime())) return fallback;
  try {
    return format(d, formatString);
  } catch (e) {
    return fallback;
  }
}
