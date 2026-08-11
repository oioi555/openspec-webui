/**
 * Pure functions for building the installed-only grouped copy choices for a
 * workflow command.
 *
 * Candidates are derived EXCLUSIVELY from OpenSpec artifacts detected in the
 * active repository (`availability.integrations` inventories). No static
 * supported-tool catalog, fallback form list, `Other tool…`, or custom command
 * input is ever used, so the copy selector can only produce commands backed by
 * real repository-local evidence.
 *
 * Resolution is per workflow and per tool:
 * 1. Commands-first — when the tool's Commands inventory contains the workflow
 *    id, its command form is used.
 * 2. Otherwise the tool's Skills inventory is consulted and the skill form is
 *    used only when it contains the workflow's canonical OpenSpec skill name.
 * 3. The shared `.agents` root stays ambiguous: a matching skill there produces
 *    one candidate per documented invocation form (`form` + `alternateForms`),
 *    labeled with the two documented target names.
 *
 * Effective candidates are grouped by their final command text; each group
 * carries every associated tool name in stable detector order, deduplicated.
 * When no tool has matching evidence the workflow receives no candidate at all.
 */
import type { DetectedIntegration } from './types/api';
import type { InvocationFormId, WorkflowCommand } from './types/commandTypes';
import { generateCommandCandidates } from './commandShortcuts';
import { getWorkflowMetadata } from './workflowMetadata';

/**
 * A grouped copy choice for one workflow command. `key` equals `text` and is a
 * stable identity for the UI; `tools` lists every detected tool that produces
 * exactly this command text, in stable detector order without duplicates.
 */
export interface ToolChoice {
  /** Stable key — the final command text (unique per group). */
  key: string;
  /** The final copyable command text, including the change name when scoped. */
  text: string;
  /** Associated tool names in stable detector order, deduplicated. */
  tools: string[];
}

/**
 * Display name of the shared `.agents/skills` root integration (matches the
 * server contract). Kept here so the split display labels below stay aligned.
 */
export const AGENTS_TOOL_NAME = 'Shared .agents / Codex';

/**
 * The shared `.agents` root is documented to be consumed by two targets that
 * share the same artifact tree — Shared `.agents` (`skill-slash`) and Codex
 * (`skill-dollar`). A matching skill is surfaced under both explicit labels so
 * the UI shows the two documented interpretations instead of asserting a
 * single executable.
 */
const AGENTS_SPLIT_LABELS: Partial<Record<InvocationFormId, string>> = {
  'skill-slash': 'Shared .agents',
  'skill-dollar': 'Codex',
};

function toolLabelFor(integration: DetectedIntegration, form: InvocationFormId): string {
  if (integration.tool === AGENTS_TOOL_NAME) {
    return AGENTS_SPLIT_LABELS[form] ?? integration.tool;
  }
  return integration.tool;
}

/** Generate the final command text for one invocation form and workflow. */
function generateText(
  form: InvocationFormId,
  workflow: WorkflowCommand,
  changeName?: string,
): string {
  const candidates = generateCommandCandidates(workflow, { changeName, forms: [form] });
  return candidates[0]?.text ?? '';
}

/** Append a tool name to the group, deduplicating while preserving order. */
function addToolToGroup(groups: Map<string, string[]>, text: string, tool: string): void {
  if (!text) {
    return;
  }
  const tools = groups.get(text);
  if (tools) {
    if (!tools.includes(tool)) {
      tools.push(tool);
    }
    return;
  }
  groups.set(text, [tool]);
}

/**
 * Resolve the grouped copy choices for one workflow from the detected
 * integrations' authoritative inventories.
 *
 * Returns an empty array when no detected tool has matching evidence — the
 * workflow's command shortcut must then be hidden. Groups appear in stable
 * first-seen detector order and each group's `tools` list is deduplicated.
 */
export function buildGroupedToolChoices(
  integrations: readonly DetectedIntegration[],
  workflow: WorkflowCommand,
  options: { changeName?: string } = {},
): ToolChoice[] {
  const { changeName } = options;
  const skillName = getWorkflowMetadata(workflow).skillName;
  const groups = new Map<string, string[]>();

  for (const integration of integrations) {
    // Commands evidence wins for this workflow when present.
    const commands = integration.commands;
    if (commands && commands.items.some((item) => item.workflowId === workflow)) {
      addToolToGroup(
        groups,
        generateText(commands.form, workflow, changeName),
        toolLabelFor(integration, commands.form),
      );
      continue;
    }

    // Otherwise fall back to a matching skill for this workflow only.
    const skills = integration.skills;
    if (skills && skills.items.some((item) => item.skillName === skillName)) {
      for (const form of [skills.form, ...(skills.alternateForms ?? [])]) {
        addToolToGroup(
          groups,
          generateText(form, workflow, changeName),
          toolLabelFor(integration, form),
        );
      }
    }
  }

  return [...groups].map(([text, tools]) => ({ key: text, text, tools }));
}
