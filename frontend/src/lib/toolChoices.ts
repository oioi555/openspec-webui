/**
 * Pure functions for building the copy-time tool-choice list.
 *
 * The selector is tool-centric: each menu item is identified by its tool name,
 * not by its invocation form.  The same form may appear under multiple tools
 * when more than one tool uses that form — each is a separate choice.
 *
 * The `.agents` integration is a neutral hint: `integrations` carries it as
 * `{tool: 'Shared .agents / Codex', form, source: '.agents/...'}` but
 * `toolOptions` already has the two split entries
 * `{tool: 'Shared .agents', form: 'skill-slash'}` and
 * `{tool: 'Codex', form: 'skill-dollar'}`.  Detection maps the neutral
 * integration to both split toolOptions so the user sees two explicit choices.
 */
import type { InvocationFormId } from './types/commandTypes';
import type { ToolInvocationOption, DetectedIntegration } from './types/api';
import { INVOCATION_FORM_IDS } from './types/commandTypes';
import { generateCommandCandidates } from './commandShortcuts';
import type { WorkflowCommand } from './types/commandTypes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolChoice {
  /** Stable key for deduplication: `${tool}\0${form}`. */
  key: string;
  /** User-facing tool name (e.g. "Claude Code", "Cursor", "Shared .agents"). */
  tool: string;
  /** The invocation form this tool uses. */
  form: InvocationFormId;
  /** The actual command text that will be copied. */
  text: string;
}

// ---------------------------------------------------------------------------
// Fallback tool catalog (when API toolOptions is empty/stale)
// ---------------------------------------------------------------------------

/**
 * Minimal human-readable tool labels for each of the six official forms.
 * Used only when the API returns an empty `toolOptions` array (stale cache,
 * server error, or old API version).  The labels are tool-family names,
 * never format IDs or prefixes.
 */
const FALLBACK_TOOL_LABELS: Record<InvocationFormId, string> = {
  'opsx-colon': 'Claude Code',
  'opsx-dash': 'Cursor / OpenCode',
  'opsx-at': 'Amazon Q Developer',
  'skill-slash': 'OpenSpec skill tools',
  'skill-colon': 'Kimi Code',
  'skill-dollar': 'Codex',
};

const FALLBACK_TOOL_OPTIONS: readonly ToolInvocationOption[] = INVOCATION_FORM_IDS.map(
  (form) => ({ tool: FALLBACK_TOOL_LABELS[form], form }),
);

// ---------------------------------------------------------------------------
// .agents neutral detection
// ---------------------------------------------------------------------------

const AGENTS_TOOL_NAME = 'Shared .agents / Codex';
const AGENTS_SOURCE_PREFIX = '.agents';

/** The two split toolOptions that a neutral `.agents` integration maps to. */
const AGENTS_SPLIT_KEYS: ReadonlyArray<string> = [
  `Shared .agents\u0000skill-slash`,
  `Codex\u0000skill-dollar`,
];

/** Check whether any integration is a neutral `.agents` hint. */
function hasNeutralAgentsIntegration(
  integrations: readonly DetectedIntegration[],
): boolean {
  return integrations.some(
    (i) => i.tool === AGENTS_TOOL_NAME && i.source.startsWith(AGENTS_SOURCE_PREFIX),
  );
}

// ---------------------------------------------------------------------------
// buildToolChoices (all toolOptions — already split)
// ---------------------------------------------------------------------------

/**
 * Return `toolOptions` if non-empty, otherwise the fallback catalog.
 * Exported for unit testing.
 */
export function getEffectiveToolOptions(
  toolOptions: readonly ToolInvocationOption[],
): readonly ToolInvocationOption[] {
  return toolOptions.length > 0 ? toolOptions : FALLBACK_TOOL_OPTIONS;
}

/**
 * Build the full tool-choice list from toolOptions.
 *
 * `toolOptions` from the API already has the two `.agents` entries split into
 * `{tool:'Shared .agents', form:'skill-slash'}` and
 * `{tool:'Codex', form:'skill-dollar'}`, so no expansion is needed.
 *
 * When `toolOptions` is empty (stale API / server error), the built-in
 * fallback catalog ensures every command always has at least one choice.
 */
export function buildToolChoices(
  toolOptions: readonly ToolInvocationOption[],
  _integrations: readonly DetectedIntegration[],
  workflow: WorkflowCommand,
  changeName?: string,
): ToolChoice[] {
  const effective = getEffectiveToolOptions(toolOptions);
  const seen = new Set<string>();
  const choices: ToolChoice[] = [];

  for (const opt of effective) {
    const key = `${opt.tool}\u0000${opt.form}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const candidates = generateCommandCandidates(workflow, {
      changeName,
      forms: [opt.form],
    });

    if (candidates.length > 0) {
      choices.push({ key, tool: opt.tool, form: opt.form, text: candidates[0].text });
    }
  }

  return choices;
}

// ---------------------------------------------------------------------------
// buildDetectedToolChoices
// ---------------------------------------------------------------------------

/**
 * Build choices from detected integrations only (for the primary menu).
 *
 * Neutral `.agents` integrations (`{tool:'Shared .agents / Codex', ...}`)
 * are mapped to both split toolOptions so the user sees two explicit choices.
 */
export function buildDetectedToolChoices(
  integrations: readonly DetectedIntegration[],
  toolOptions: readonly ToolInvocationOption[],
  workflow: WorkflowCommand,
  changeName?: string,
): ToolChoice[] {
  const seen = new Set<string>();
  const choices: ToolChoice[] = [];

  // Fast lookup: key → option
  const optionByKey = new Map<string, ToolInvocationOption>();
  for (const opt of toolOptions) {
    optionByKey.set(`${opt.tool}\u0000${opt.form}`, opt);
  }

  const agentsDetected = hasNeutralAgentsIntegration(integrations);

  for (const integration of integrations) {
    if (
      integration.source.startsWith(AGENTS_SOURCE_PREFIX) &&
      integration.tool === AGENTS_TOOL_NAME
    ) {
      // Neutral .agents → map to both split toolOptions
      for (const splitKey of AGENTS_SPLIT_KEYS) {
        if (seen.has(splitKey)) continue;
        seen.add(splitKey);

        const opt = optionByKey.get(splitKey);
        if (!opt) continue;

        const candidates = generateCommandCandidates(workflow, {
          changeName,
          forms: [opt.form],
        });

        if (candidates.length > 0) {
          choices.push({
            key: splitKey,
            tool: opt.tool,
            form: opt.form,
            text: candidates[0].text,
          });
        }
      }
      continue;
    }

    // Normal integration: match by tool+form
    const key = `${integration.tool}\u0000${integration.form}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const candidates = generateCommandCandidates(workflow, {
      changeName,
      forms: [integration.form],
    });

    if (candidates.length > 0) {
      choices.push({
        key,
        tool: integration.tool,
        form: integration.form,
        text: candidates[0].text,
      });
    }
  }

  return choices;
}

// ---------------------------------------------------------------------------
// buildUndetectedToolChoices
// ---------------------------------------------------------------------------

/**
 * Build choices for toolOptions not covered by detected integrations
 * (for the "Other tool…" submenu).
 *
 * A neutral `.agents` integration excludes both split toolOptions
 * (`Shared .agents`/`skill-slash` and `Codex`/`skill-dollar`).
 */
export function buildUndetectedToolChoices(
  integrations: readonly DetectedIntegration[],
  toolOptions: readonly ToolInvocationOption[],
  workflow: WorkflowCommand,
  changeName?: string,
): ToolChoice[] {
  const detectedKeys = new Set<string>();

  // Normal integrations: exact tool+form
  for (const integration of integrations) {
    if (
      integration.source.startsWith(AGENTS_SOURCE_PREFIX) &&
      integration.tool === AGENTS_TOOL_NAME
    ) {
      // Neutral .agents → exclude both split keys
      for (const splitKey of AGENTS_SPLIT_KEYS) {
        detectedKeys.add(splitKey);
      }
    } else {
      detectedKeys.add(`${integration.tool}\u0000${integration.form}`);
    }
  }

  // Use effective options (with fallback) so undetected also gets the fallback
  // catalog when toolOptions is empty.  Then exclude detected keys.
  const effective = getEffectiveToolOptions(toolOptions);
  const undetectedOptions = effective.filter((opt) => {
    const key = `${opt.tool}\u0000${opt.form}`;
    return !detectedKeys.has(key);
  });

  // Build choices from the filtered list.  Pass the original toolOptions (not
  // effective) so buildToolChoices does NOT apply the fallback a second time —
  // we already applied it above.
  const seen = new Set<string>();
  const choices: ToolChoice[] = [];

  for (const opt of undetectedOptions) {
    const key = `${opt.tool}\u0000${opt.form}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const candidates = generateCommandCandidates(workflow, {
      changeName,
      forms: [opt.form],
    });

    if (candidates.length > 0) {
      choices.push({ key, tool: opt.tool, form: opt.form, text: candidates[0].text });
    }
  }

  return choices;
}
