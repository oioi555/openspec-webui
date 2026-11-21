import { getApiErrorMessage, getToolCompatibilityReference } from '$lib/api';
import type { ToolCompatibilityReferenceResponse } from '$lib/types/api';

/**
 * Machine-global tool-reference data served by `/api/tool-reference`
 * (display names, scope support, official definitions). Loaded once on first
 * use and shared by the command shortcuts and Settings.
 */
function createToolReferenceStore() {
  let reference = $state<ToolCompatibilityReferenceResponse | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let pending: Promise<void> | null = null;

  function load(): Promise<void> {
    if (reference) return Promise.resolve();
    if (pending) return pending;
    loading = true;
    error = null;
    pending = getToolCompatibilityReference()
      .then((next) => {
        reference = next;
      })
      .catch((cause: unknown) => {
        error = getApiErrorMessage(cause);
      })
      .finally(() => {
        loading = false;
        pending = null;
      });
    return pending;
  }

  return {
    get reference() {
      return reference;
    },
    get loading() {
      return loading;
    },
    get error() {
      return error;
    },
    /** Served id -> display name; empty until loaded (labels then fall back to ids). */
    get toolNames(): Readonly<Record<string, string>> {
      return reference?.toolNames ?? {};
    },
    load,
    retry(): Promise<void> {
      reference = null;
      return load();
    },
  };
}

export const toolReferenceStore = createToolReferenceStore();
