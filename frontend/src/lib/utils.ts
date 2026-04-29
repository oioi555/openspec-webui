import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getLocale } from './paraglide/runtime.js';
import * as m from './paraglide/messages.js';

interface ToastLike {
  success(message: string): void;
  error(message: string): void;
}

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
export function formatDate(iso: string | null | undefined, locale: string = getLocale()): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

async function loadToast(): Promise<ToastLike> {
  const testToast = (globalThis as { __OPENSPEC_TEST_TOAST__?: ToastLike }).__OPENSPEC_TEST_TOAST__;
  if (testToast) {
    return testToast;
  }

  const { toast } = await import('svelte-sonner');
  return toast;
}

export async function copyToClipboard(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    const toast = await loadToast();
    toast.success(m.common_copied({ label }));
  } catch {
    const toast = await loadToast();
    toast.error(m.common_failed_to_copy());
  }
}
