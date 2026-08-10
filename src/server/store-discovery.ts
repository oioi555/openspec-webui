import { execFile } from 'node:child_process';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type {
  StoreDiscoveryDiagnostic,
  StoreDiscoveryResult,
  StoreRecord,
} from '../shared/types.js';

const STORE_LIST_TIMEOUT_MS = 10_000;

interface StoreListDependencies {
  exec: typeof execFile;
  getHomeDir: () => string;
  now: () => Date;
}

interface CreateStoreDiscoveryOptions {
  deps?: Partial<StoreListDependencies>;
}

export interface StoreDiscoveryService {
  listStores(): Promise<StoreDiscoveryResult>;
}

function createUnavailable(
  reason: StoreDiscoveryDiagnostic,
  checkedAt: string | null
): StoreDiscoveryResult {
  return {
    status: 'unavailable',
    stores: [],
    reason,
    checkedAt,
  };
}

function normalizeStoreRoot(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return resolve(value.trim());
}

/**
 * Defensively parse the documented `openspec store list --json` shape:
 * `{ stores: [{ id, root, ... }], status?: [...] }`. Unknown fields are
 * ignored. Returns the parsed records, or null when the shape is invalid.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseStoreListOutput(raw: unknown): StoreRecord[] | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const record = raw as Record<string, unknown>;
  if (!Array.isArray(record.stores)) {
    return null;
  }

  const stores: StoreRecord[] = [];
  for (const entry of record.stores) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return null;
    }

    const store = entry as Record<string, unknown>;
    if (typeof store.id !== 'string' || store.id.trim().length === 0) {
      return null;
    }

    const root = normalizeStoreRoot(store.root);
    if (!root) {
      return null;
    }

    stores.push({ id: store.id.trim(), root });
  }

  return stores;
}

function isCommandNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ENOENT'
  );
}

function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { code?: unknown; killed?: unknown; signal?: unknown };

  if (candidate.code === 'ETIMEDOUT') {
    return true;
  }

  // Node's execFile timeout kills the child with SIGTERM and sets `killed`.
  if (candidate.killed === true || candidate.signal === 'SIGTERM') {
    return true;
  }

  return false;
}

export function createStoreDiscoveryService(
  options: CreateStoreDiscoveryOptions = {}
): StoreDiscoveryService {
  const deps: StoreListDependencies = {
    exec: options.deps?.exec ?? execFile,
    getHomeDir: options.deps?.getHomeDir ?? homedir,
    now: options.deps?.now ?? (() => new Date()),
  };

  async function listStores(): Promise<StoreDiscoveryResult> {
    const checkedAt = deps.now().toISOString();

    // Stable cwd: Store discovery is machine-global and must not depend on the
    // active project's working directory.
    const cwd = deps.getHomeDir();

    const { stdout, stderr, exitCode } = await new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
    }>((resolvePromise) => {
      deps.exec(
        'openspec',
        ['store', 'list', '--json'],
        { cwd, timeout: STORE_LIST_TIMEOUT_MS },
        (error, stdout, stderr) => {
          if (error && isCommandNotFoundError(error)) {
            resolvePromise({ stdout: '', stderr: 'openspec command not found', exitCode: null });
            return;
          }
          if (error && isTimeoutError(error)) {
            resolvePromise({ stdout: '', stderr: 'openspec store list timed out', exitCode: null });
            return;
          }
          resolvePromise({
            stdout: stdout ?? '',
            stderr: (stderr ?? '').trim(),
            exitCode: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          });
        }
      );
    });

    if (exitCode === null && stderr === 'openspec command not found') {
      return createUnavailable(
        { code: 'CLI_MISSING', message: 'OpenSpec CLI is not installed' },
        checkedAt
      );
    }

    if (exitCode === null && stderr === 'openspec store list timed out') {
      return createUnavailable(
        { code: 'TIMEOUT', message: 'openspec store list timed out' },
        checkedAt
      );
    }

    if (exitCode !== 0) {
      return createUnavailable(
        {
          code: 'CLI_ERROR',
          message: `openspec store list failed with exit code ${exitCode ?? 'null'}`,
          exitCode,
          stderr: stderr || undefined,
        },
        checkedAt
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      return createUnavailable(
        { code: 'MALFORMED_OUTPUT', message: 'openspec store list returned invalid JSON' },
        checkedAt
      );
    }

    const stores = parseStoreListOutput(parsed);
    if (!stores) {
      return createUnavailable(
        { code: 'INVALID_SHAPE', message: 'openspec store list returned an unexpected shape' },
        checkedAt
      );
    }

    return {
      status: stores.length > 0 ? 'stores' : 'empty',
      stores,
      reason: null,
      checkedAt,
    };
  }

  return { listStores };
}
