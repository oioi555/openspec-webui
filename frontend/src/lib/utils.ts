import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
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

export function matchesArchivedChangeName(changeName: string, archivedChangeName: string): boolean {
  return archivedChangeName === changeName || formatChangeName(archivedChangeName) === changeName;
}

export function isArchivedChangeName(changeName: string, archivedChangeNames: readonly string[]): boolean {
  return archivedChangeNames.some((archivedName) => matchesArchivedChangeName(changeName, archivedName));
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

/**
 * Format an ISO date string in the browser's local timezone as `YYYY-MM-DD HH:mm`.
 * Returns empty string if the input is null/undefined or invalid.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hour = padDatePart(date.getHours());
  const minute = padDatePart(date.getMinutes());

  return `${year}-${month}-${day} ${hour}:${minute}`;
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
