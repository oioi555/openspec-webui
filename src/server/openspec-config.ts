import { execFile } from 'child_process';

const expandedWorkflowCommands = ['new', 'continue', 'ff', 'verify', 'sync', 'bulk-archive'] as const;

export type ExpandedWorkflowCommand = (typeof expandedWorkflowCommands)[number];

/**
 * Commands that must never be exposed as available workflows, even if the
 * upstream CLI reports them. `onboard` is intentionally excluded from every
 * command surface per the v1.8 workflow.
 */
const blockedWorkflowCommands = new Set(['onboard']);

export interface CommandAvailability {
  status: 'ready' | 'unavailable';
  profile: string | null;
  workflows: string[];
  availableExpandedCommands: ExpandedWorkflowCommand[];
  error: string | null;
}

function isExpandedWorkflowCommand(value: string): value is ExpandedWorkflowCommand {
  return expandedWorkflowCommands.includes(value as ExpandedWorkflowCommand);
}

function readOpenSpecConfigValue(cwd: string, key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('openspec', ['config', 'get', key], { cwd }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout.trim());
    });
  });
}

export async function inspectCommandAvailability(cwd: string): Promise<CommandAvailability> {
  let profile: string | null = null;

  try {
    profile = (await readOpenSpecConfigValue(cwd, 'profile')) || null;
  } catch {
    profile = null;
  }

  try {
    const workflowOutput = await readOpenSpecConfigValue(cwd, 'workflows');
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
      availableExpandedCommands: workflows.filter(isExpandedWorkflowCommand),
      error: null,
    };
  } catch (error) {
    return {
      status: 'unavailable',
      profile,
      workflows: [],
      availableExpandedCommands: [],
      error: error instanceof Error ? error.message : 'Failed to inspect OpenSpec workflows',
    };
  }
}
