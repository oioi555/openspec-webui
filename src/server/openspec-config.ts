import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseDocument } from 'yaml';

import { execOpenSpec } from './openspec-cli.js';
import {
  detectToolIntegrations,
  deriveDistinctForms,
  getSupportedToolOptions,
  type DetectedIntegration,
  type InvocationFormId,
  type ToolInvocationOption,
  type ToolIntegrationDetectionDependencies,
} from './tool-integration-detection.js';

const expandedWorkflowCommands = ['new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive'] as const;

export type ExpandedWorkflowCommand = (typeof expandedWorkflowCommands)[number];

/**
 * Commands that must never be exposed as available workflows, even if the
 * upstream CLI reports them. `onboard` is intentionally excluded from every
 * command surface per the v1.8 workflow.
 */
const blockedWorkflowCommands = new Set(['onboard']);

export type CommandDelivery = 'commands' | 'skills' | 'both' | null;

/** The team's recorded skill scope from `openspec/config.yaml`; only `project` is surfaced. */
export type ProjectSkillsScope = 'project' | null;

export interface CommandAvailability {
  status: 'ready' | 'unavailable';
  profile: string | null;
  workflows: string[];
  /**
   * @deprecated Delivery mode from `openspec config get delivery`. Retired in
   * OpenSpec 2.x: not read and always `null` when the CLI major version is 2
   * or later. Nothing renders or gates on it.
   */
  delivery: CommandDelivery;
  /** `project` when `openspec/config.yaml` records `skillsScope: project`, else null. */
  skillsScope: ProjectSkillsScope;
  /**
   * Whether GitHub Copilot cloud coding-agent files that OpenSpec manages are
   * present (`.github/workflows/copilot-setup-steps.yml` or
   * `.github/agents/openspec.agent.md`). OpenSpec refuses `--scope global` then.
   */
  copilotCloud: boolean;
  /**
   * Detected OpenSpec tool integrations for the active repository. Each entry
   * carries authoritative workflow-specific `commands` and `skills`
   * inventories (matching command workflow ids and skill names with source
   * paths) plus legacy aggregate presentation fields that SHALL NOT be used
   * for candidate eligibility.
   */
  integrations: DetectedIntegration[];
  /**
   * @deprecated Deduplicated distinct invocation-form candidates derived from
   * the legacy aggregate fields. Compatibility-only presentation data; use the
   * per-integration inventories for candidate eligibility.
   */
  forms: InvocationFormId[];
  /**
   * @deprecated Static catalog of supported tool-to-form options derived from
   * the server signature table. Compatibility-only; never synthesizes
   * installed-tool candidates. Candidate generation SHALL consult the detected
   * inventories instead.
   */
  toolOptions: ToolInvocationOption[];
  /**
   * @deprecated Staged removal — superseded by `workflows` gating; retained as
   * a transition field during the migration.
   */
  availableExpandedCommands: ExpandedWorkflowCommand[];
  error: string | null;
}

function isExpandedWorkflowCommand(value: string): value is ExpandedWorkflowCommand {
  return expandedWorkflowCommands.includes(value as ExpandedWorkflowCommand);
}

function readOpenSpecConfigValue(cwd: string, key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execOpenSpec(['config', 'get', key], { cwd }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout.trim());
    });
  });
}

/**
 * Injectable reader seam for OpenSpec CLI config reads. Production uses
 * `readOpenSpecConfigValue`; tests may substitute a deterministic runner so
 * `inspectCommandAvailability` can be exercised without a real CLI.
 */
export type OpenSpecConfigReader = (cwd: string, key: string) => Promise<string>;

/**
 * Defensively parse the CLI `delivery` config value (`commands` | `skills` |
 * `both`). Any other value (empty, whitespace, unknown, malformed) degrades to
 * null — never an error.
 */
export function parseDelivery(value: string | null): CommandDelivery {
  if (value === 'commands' || value === 'skills' || value === 'both') {
    return value;
  }
  return null;
}

/** Reads the local OpenSpec CLI version string; null or a rejection means unknown. */
export type OpenSpecVersionReader = (cwd: string) => Promise<string | null>;

/** How long one `openspec --version` result is reused (the CLI rarely changes while the server runs). */
export const CLI_VERSION_CACHE_TTL_MS = 5 * 60 * 1000;

function spawnOpenSpecCliVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    execOpenSpec(['--version'], {}, (error, stdout) => {
      resolve(error ? null : stdout.trim() || null);
    });
  });
}

/**
 * Per-process memoized CLI version read, so availability requests do not spawn
 * `openspec --version` each time. The CLI is global, so the cwd is ignored.
 */
export function createMemoizedVersionReader(
  spawn: () => Promise<string | null> = spawnOpenSpecCliVersion,
  now: () => number = Date.now,
  ttlMs: number = CLI_VERSION_CACHE_TTL_MS,
): OpenSpecVersionReader {
  let cache: { value: Promise<string | null>; expiresAt: number } | null = null;
  return () => {
    const time = now();
    if (!cache || time >= cache.expiresAt) {
      cache = { value: spawn(), expiresAt: time + ttlMs };
    }
    return cache.value;
  };
}

const readOpenSpecCliVersion = createMemoizedVersionReader();

/** Major version from a CLI version string such as `2.1.1` or `v1.14.0`; null when unparseable. */
export function parseCliMajorVersion(value: string | null | undefined): number | null {
  const match = typeof value === 'string' ? /(\d+)\.\d+/.exec(value) : null;
  return match ? Number(match[1]) : null;
}

/**
 * Read `skillsScope` from `openspec/config.yaml`. Only `project` is surfaced;
 * absent, `global`, invalid values or an unreadable file become null.
 */
export async function readProjectSkillsScope(cwd: string): Promise<ProjectSkillsScope> {
  try {
    const content = await readFile(join(cwd, 'openspec', 'config.yaml'), 'utf8');
    const parsed = parseDocument(content).toJS() as unknown;
    if (parsed && typeof parsed === 'object' && (parsed as { skillsScope?: unknown }).skillsScope === 'project') {
      return 'project';
    }
  } catch {
    // Missing or malformed config degrades to null.
  }
  return null;
}

const COPILOT_CLOUD_FILES = [
  ['.github', 'workflows', 'copilot-setup-steps.yml'],
  ['.github', 'agents', 'openspec.agent.md'],
] as const;

/** Whether any OpenSpec-managed GitHub Copilot cloud coding-agent file exists. */
export async function hasCopilotCloudFiles(cwd: string): Promise<boolean> {
  for (const segments of COPILOT_CLOUD_FILES) {
    try {
      await access(join(cwd, ...segments));
      return true;
    } catch {
      // Not present.
    }
  }
  return false;
}

export async function inspectCommandAvailability(
  cwd: string,
  reader: OpenSpecConfigReader = readOpenSpecConfigValue,
  detectionDependencies: Pick<ToolIntegrationDetectionDependencies, 'homeDir' | 'claudeConfigDir'> = {},
  // An injected config reader implies a test seam: the version then stays
  // unknown unless a version reader is injected too.
  versionReader: OpenSpecVersionReader = reader === readOpenSpecConfigValue ? readOpenSpecCliVersion : async () => null
): Promise<CommandAvailability> {
  let profile: string | null = null;
  let delivery: CommandDelivery = null;

  try {
    profile = (await reader(cwd, 'profile')) || null;
  } catch {
    profile = null;
  }

  let cliMajor: number | null = null;
  try {
    cliMajor = parseCliMajorVersion(await versionReader(cwd));
  } catch {
    cliMajor = null;
  }

  // `delivery` was retired in OpenSpec 2.0: skip the read for 2.x CLIs. An
  // unknown version still reads it, which is harmless because nothing renders it.
  if (cliMajor === null || cliMajor < 2) {
    try {
      delivery = parseDelivery(await reader(cwd, 'delivery'));
    } catch {
      delivery = null;
    }
  }

  const [skillsScope, copilotCloud] = await Promise.all([readProjectSkillsScope(cwd), hasCopilotCloudFiles(cwd)]);

  // Detection is repo-scoped and independent of the CLI; failures degrade to an
  // empty list so availability never becomes an application error.
  const integrations = await detectToolIntegrations(cwd, detectionDependencies);
  const forms = deriveDistinctForms(integrations);
  // The static tool catalog is independent of CLI config and detection; it is
  // always included so the UI can offer tool choices even with zero detections.
  const toolOptions = getSupportedToolOptions();

  try {
    const workflowOutput = await reader(cwd, 'workflows');
    if (!workflowOutput) {
      throw new Error('No workflows returned from OpenSpec config');
    }

    const parsed = JSON.parse(workflowOutput) as unknown;
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'string')) {
      throw new Error('Invalid workflows response from OpenSpec config');
    }

    const workflows = parsed.filter((item) => !blockedWorkflowCommands.has(item));

    return {
      status: 'ready',
      profile,
      workflows,
      delivery,
      skillsScope,
      copilotCloud,
      integrations,
      forms,
      toolOptions,
      availableExpandedCommands: workflows.filter(isExpandedWorkflowCommand),
      error: null,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      profile,
      workflows: [],
      delivery,
      skillsScope,
      copilotCloud,
      integrations,
      forms,
      toolOptions,
      availableExpandedCommands: [],
      error: error instanceof Error ? error.message : 'Failed to inspect OpenSpec workflows',
    };
  }
}
