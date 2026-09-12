import { execOpenSpec } from './openspec-cli.js';
import {
  detectToolIntegrations,
  deriveDistinctForms,
  getSupportedToolOptions,
  type DetectedIntegration,
  type InvocationFormId,
  type ToolInvocationOption,
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

export interface CommandAvailability {
  status: 'ready' | 'unavailable';
  profile: string | null;
  workflows: string[];
  /** Delivery mode from `openspec config get delivery` (defensively parsed). */
  delivery: CommandDelivery;
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

export async function inspectCommandAvailability(
  cwd: string,
  reader: OpenSpecConfigReader = readOpenSpecConfigValue
): Promise<CommandAvailability> {
  let profile: string | null = null;
  let delivery: CommandDelivery = null;

  try {
    profile = (await reader(cwd, 'profile')) || null;
  } catch {
    profile = null;
  }

  try {
    delivery = parseDelivery(await reader(cwd, 'delivery'));
  } catch {
    delivery = null;
  }

  // Detection is repo-scoped and independent of the CLI; failures degrade to an
  // empty list so availability never becomes an application error.
  const integrations = await detectToolIntegrations(cwd);
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
      integrations,
      forms,
      toolOptions,
      availableExpandedCommands: [],
      error: error instanceof Error ? error.message : 'Failed to inspect OpenSpec workflows',
    };
  }
}
