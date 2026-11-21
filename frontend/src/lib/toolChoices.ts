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
 * 3. A 2.x multi-line shared target list (`sharedSkillTargets`) yields one
 *    labelled candidate per listed tool in its documented form (Codex `$`,
 *    Kimi `/skill:`, Code Assistant prompt, others `/`). Otherwise shared
 *    `.agents` target metadata selects Zed, Antigravity, Amp, GSD, or
 *    generic agents slash forms, Codex-led compatible forms, or the legacy
 *    fallback.
 *
 * Project and global integrations both participate. Effective candidates are grouped by their final command text; each group
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
 * Labels for the shared slash and Codex dollar interpretations. Valid Zed,
 * agents, Antigravity, Amp, and GSD markers override these labels before
 * final-command grouping.
 */
const AGENTS_SPLIT_LABELS: Partial<Record<InvocationFormId, string>> = {
  'skill-slash': 'Shared .agents',
  'skill-dollar': 'Codex',
};

/**
 * Official OpenSpec tool id -> display name (mirrors the server tool
 * reference). Used to label per-tool candidates derived from a 2.x
 * multi-line shared `.agents` marker. Unknown ids fall back to the id.
 */
const OPENSPEC_TOOL_NAMES: Readonly<Record<string, string>> = {
  'amazon-q': 'Amazon Q Developer', amp: 'Amp', antigravity: 'Antigravity', atomcode: 'AtomCode',
  auggie: 'Auggie', bob: 'IBM Bob', claude: 'Claude Code', cline: 'Cline', 'command-code': 'Command Code',
  codeartsagent: 'CodeArts', codebuddy: 'CodeBuddy', codestudio: 'Code Studio', codex: 'Codex',
  dsh: 'DeepSeek Harness', devin: 'Devin Desktop, formerly Windsurf', forgecode: 'ForgeCode',
  continue: 'Continue', costrict: 'CoStrict', crush: 'Crush', cursor: 'Cursor', easycode: 'EasyCode',
  factory: 'Factory Droid', gemini: 'Gemini CLI', 'github-copilot': 'GitHub Copilot', gigacode: 'GigaCode',
  grok: 'Grok Build', gsd: 'GSD', hermes: 'Hermes Agent', iflow: 'iFlow', junie: 'Junie',
  kilocode: 'Kilo Code', kimi: 'Kimi Code', kiro: 'Kiro', lingma: 'Lingma', 'minimax-code': 'MiniMax Code',
  vibe: 'Mistral Vibe', 'oh-my-pi': 'Oh My Pi', opencode: 'OpenCode', pi: 'Pi',
  codeassistant: 'SourceCraft Code Assistant for VS Code', qoder: 'Qoder', qwen: 'Qwen Code',
  rovodev: 'Rovo Dev CLI', roocode: 'Zoo Code', trae: 'Trae', veai: 'Veai', warp: 'Warp',
  zed: 'Zed Agent', zcode: 'ZCode', agents: 'Shared .agents',
};

/** Documented skill invocation form for a tool reading the shared `.agents/skills` tree. */
function sharedTargetForm(toolId: string): InvocationFormId {
  if (toolId === 'codex') {
    return 'skill-dollar';
  }
  if (toolId === 'kimi') {
    return 'skill-colon';
  }
  if (toolId === 'codeassistant') {
    return 'skill-prompt';
  }
  return 'skill-slash';
}

/** Labelled (form, tool name) pairs for a shared integration with a multi-line target list. */
function sharedTargetCandidates(targets: readonly string[]): Array<{ form: InvocationFormId; label: string }> {
  return targets.map((id) => ({ form: sharedTargetForm(id), label: OPENSPEC_TOOL_NAMES[id] ?? id }));
}

function toolLabelFor(integration: DetectedIntegration, form: InvocationFormId): string {
  if (integration.tool === AGENTS_TOOL_NAME) {
    if (integration.sharedSkillTarget === 'zed') {
      return 'Zed';
    }
    if (integration.sharedSkillTarget === 'agents') {
      return 'Shared .agents';
    }
    if (integration.sharedSkillTarget === 'antigravity') {
      return 'Antigravity';
    }
    if (integration.sharedSkillTarget === 'amp') {
      return 'Amp';
    }
    if (integration.sharedSkillTarget === 'gsd') {
      return 'GSD';
    }
    return AGENTS_SPLIT_LABELS[form] ?? integration.tool;
  }
  return integration.tool;
}

function skillFormsFor(integration: DetectedIntegration): InvocationFormId[] {
  const skills = integration.skills!;
  if (integration.tool !== AGENTS_TOOL_NAME) {
    return [skills.form, ...(skills.alternateForms ?? [])];
  }

  return integration.sharedSkillTarget === 'zed'
    || integration.sharedSkillTarget === 'agents'
    || integration.sharedSkillTarget === 'antigravity'
    || integration.sharedSkillTarget === 'amp'
    || integration.sharedSkillTarget === 'gsd'
    ? ['skill-slash']
    : ['skill-slash', 'skill-dollar'];
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
      if (integration.sharedSkillTargets?.length) {
        for (const { form, label } of sharedTargetCandidates(integration.sharedSkillTargets)) {
          addToolToGroup(groups, generateText(form, workflow, changeName), label);
        }
        continue;
      }
      for (const form of skillFormsFor(integration)) {
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
