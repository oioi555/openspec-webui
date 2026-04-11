import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(text: string, maxLength: number) {
  if (maxLength <= 0) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export function decodeName(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Format change name by removing the date prefix from archived changes.
 * OpenSpec archives changes with names like "YYYY-MM-DD-change-name".
 * This function removes the "YYYY-MM-DD-" prefix for display purposes.
 */
export function formatChangeName(name: string): string {
  return name.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

/**
 * Format an ISO date string to YYYY-MM-DD.
 * Returns empty string if the input is null/undefined or invalid.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}
