import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The six official OpenSpec invocation forms (docs/supported-tools.md).
 * Stable ids shared with the frontend `InvocationFormId` contract:
 *   opsx-colon     /opsx:<id>           folder-namespaced opsx/<id> command files
 *   opsx-dash      /opsx-<id>           opsx-<id> filename command files
 *   opsx-at        @opsx-<id>           Amazon Q prompts
 *   skill-slash    /openspec-<skill>    ordinary repo-local skill-only tools
 *   skill-colon    /skill:openspec-<skill>  Kimi Code
 *   skill-dollar   $openspec-<skill>    Codex CLI / shared `.agents` root
 */
export const INVOCATION_FORM_IDS = [
  'opsx-colon',
  'opsx-dash',
  'opsx-at',
  'skill-slash',
  'skill-colon',
  'skill-dollar',
] as const;

export type InvocationFormId = (typeof INVOCATION_FORM_IDS)[number];

export type ToolDelivery = 'commands' | 'skills' | 'both';

/**
 * One detected OpenSpec command artifact, normalized to a workflow id and its
 * repo-relative source path. The workflow id is the canonical command id used
 * by the invocation forms (`/opsx:<id>`, `/opsx-<id>`, `@opsx-<id>`), derived
 * from the artifact filename (e.g. `opsx/propose.md` -> `propose`).
 */
export interface CommandInventoryItem {
  workflowId: string;
  /** Posix-normalized path relative to the project root. */
  source: string;
}

/**
 * The complete Commands inventory for one detected tool: every matching
 * command artifact enumerated from the signature table. `form` is the
 * invocation form those command files produce. This is authoritative,
 * workflow-specific evidence — unlike the legacy singular `form`/`source`.
 */
export interface CommandInventory {
  form: InvocationFormId;
  items: CommandInventoryItem[];
}

/** One detected OpenSpec skill artifact: the canonical skill name (the
 * `openspec-*` directory name, e.g. `openspec-sync-specs`) and its SKILL.md
 * source path. */
export interface SkillInventoryItem {
  skillName: string;
  /** Posix-normalized path relative to the project root. */
  source: string;
}

/**
 * The complete Skills inventory for one detected tool: every matching
 * `openspec-*` SKILL.md enumerated from the signature table. `form` is the
 * primary invocation form for those skill files.
 *
 * `alternateForms` carries additional documented invocation forms that consume
 * the exact same artifact tree. It is only set for the shared `.agents` root,
 * which both Shared `.agents` (`skill-slash`) and Codex (`skill-dollar`) use;
 * detection asserts neither target, so candidate resolution SHALL generate one
 * candidate per form in `[form, ...alternateForms]`.
 */
export interface SkillInventory {
  form: InvocationFormId;
  alternateForms?: InvocationFormId[];
  items: SkillInventoryItem[];
}

/**
 * A detected repo-local OpenSpec integration. `commands` and `skills` are the
 * authoritative workflow-specific inventories; the remaining fields
 * (`delivery`, `form`, `example`, `source`) are legacy aggregate presentation
 * data kept for compatibility and SHALL NOT be used for candidate eligibility
 * because they discard dual-delivery and per-workflow evidence.
 */
export interface DetectedIntegration {
  tool: string;
  /** @deprecated Legacy aggregate presentation data. */
  delivery: ToolDelivery;
  /** @deprecated Legacy representative form (first command form, else first skill form). */
  form: InvocationFormId;
  /** @deprecated Legacy example invocation for the representative form. */
  example: string;
  /** @deprecated Legacy representative source path (first command, else first skill). */
  source: string;
  /** Authoritative Commands evidence, or null when no command artifact matched. */
  commands: CommandInventory | null;
  /** Authoritative Skills evidence, or null when no skill artifact matched. */
  skills: SkillInventory | null;
}

export interface ToolInvocationOption {
  tool: string;
  form: InvocationFormId;
}

type CommandShape = 'folder' | 'filename';

/**
 * Display name for the shared `.agents/skills` root. The official docs use the
 * same `openspec-*` SKILL.md tree for the Codex target (`$openspec-<skill>`)
 * and the vendor-neutral Shared `.agents` target (`/openspec-<skill>`); a
 * filesystem scan alone cannot tell them apart. The display name therefore
 * names both targets and never asserts Codex-only configuration.
 */
export const AGENTS_SHARED_TOOL = 'Shared .agents / Codex';

/** Example for the shared root showing both candidate invocations. */
const AGENTS_SHARED_EXAMPLE = '/openspec-propose or $openspec-propose';

/**
 * Candidate forms for the shared `.agents` root. Both are surfaced so the
 * copy-time selector opens an explicit menu instead of a direct copy.
 */
const AGENTS_SHARED_FORMS: readonly InvocationFormId[] = ['skill-slash', 'skill-dollar'];


/**
 * Data-driven signature table for repo-local OpenSpec integrations, derived
 * from the official supported-tools.md "Tool Directory Reference". Display
 * names live here so detection stays table-driven. Only repo-local roots are
 * listed: global installs (e.g. `~/.minimax/skills`) are out of scope, and no
 * `.codex` root is invented (Codex writes to the shared `.agents/skills` root,
 * which is represented by the `agents` entry below as skill-dollar).
 *
 * Entry shape: [tool, [[dir, shape, form], ...commands], [[dir, form, ...], ...skills]]
 *   shape 'folder':   `<dir>/opsx/<id>.*`   (opsx-colon form)
 *   shape 'filename': `<dir>/opsx-<id>.*`   (opsx-dash / opsx-at form)
 *   skills: `<dir>/openspec-*` dirs with SKILL.md; the listed form plus any
 *   documented alternate forms that consume the same artifact tree.
 */
type SkillSpec = readonly [
  dir: string,
  form: InvocationFormId,
  alternateForms?: readonly InvocationFormId[],
];

type ToolSpec = readonly [
  tool: string,
  commands: ReadonlyArray<readonly [dir: string, shape: CommandShape, form: InvocationFormId]>,
  skills: ReadonlyArray<SkillSpec>,
];

const TOOL_SIGNATURES: readonly ToolSpec[] = [
  // --- opsx-colon (folder-namespaced `opsx/<id>.*` command files) ---
  ['Claude Code', [['.claude/commands', 'folder', 'opsx-colon']], [['.claude/skills', 'skill-slash']]],
  ['CodeBuddy', [['.codebuddy/commands', 'folder', 'opsx-colon']], [['.codebuddy/skills', 'skill-slash']]],
  ['Crush', [['.crush/commands', 'folder', 'opsx-colon']], [['.crush/skills', 'skill-slash']]],
  ['Gemini CLI', [['.gemini/commands', 'folder', 'opsx-colon']], [['.gemini/skills', 'skill-slash']]],
  ['Lingma', [['.lingma/commands', 'folder', 'opsx-colon']], [['.lingma/skills', 'skill-slash']]],
  ['Qoder', [['.qoder/commands', 'folder', 'opsx-colon']], [['.qoder/skills', 'skill-slash']]],
  // --- opsx-dash (filename `opsx-<id>.*` command files) ---
  ['Auggie', [['.augment/commands', 'filename', 'opsx-dash']], [['.augment/skills', 'skill-slash']]],
  ['Bob Shell', [['.bob/commands', 'filename', 'opsx-dash']], [['.bob/skills', 'skill-slash']]],
  ['Cursor', [['.cursor/commands', 'filename', 'opsx-dash']], [['.cursor/skills', 'skill-slash']]],
  ['Factory Droid', [['.factory/commands', 'filename', 'opsx-dash']], [['.factory/skills', 'skill-slash']]],
  ['iFlow', [['.iflow/commands', 'filename', 'opsx-dash']], [['.iflow/skills', 'skill-slash']]],
  ['Junie', [['.junie/commands', 'filename', 'opsx-dash']], [['.junie/skills', 'skill-slash']]],
  ['Oh My Pi', [['.omp/commands', 'filename', 'opsx-dash']], [['.omp/skills', 'skill-slash']]],
  ['OpenCode', [['.opencode/commands', 'filename', 'opsx-dash']], [['.opencode/skills', 'skill-slash']]],
  ['Qwen Code', [['.qwen/commands', 'filename', 'opsx-dash']], [['.qwen/skills', 'skill-slash']]],
  ['Zoo Code', [['.roo/commands', 'filename', 'opsx-dash']], [['.roo/skills', 'skill-slash']]],
  ['Trae', [['.trae/commands', 'filename', 'opsx-dash']], [['.trae/skills', 'skill-slash']]],
  // --- opsx-dash workflows variants ---
  ['Antigravity', [['.agent/workflows', 'filename', 'opsx-dash']], [['.agent/skills', 'skill-slash']]],
  ['Cline', [['.clinerules/workflows', 'filename', 'opsx-dash']], [['.cline/skills', 'skill-slash']]],
  ['Devin', [['.devin/workflows', 'filename', 'opsx-dash']], [['.devin/skills', 'skill-slash']]],
  ['Kilo Code', [['.kilocode/workflows', 'filename', 'opsx-dash']], [['.kilocode/skills', 'skill-slash']]],
  // --- opsx-dash prompt variants ---
  ['Continue', [['.continue/prompts', 'filename', 'opsx-dash']], [['.continue/skills', 'skill-slash']]],
  ['GitHub Copilot', [['.github/prompts', 'filename', 'opsx-dash']], [['.github/skills', 'skill-slash']]],
  ['Kiro', [['.kiro/prompts', 'filename', 'opsx-dash']], [['.kiro/skills', 'skill-slash']]],
  ['Pi', [['.pi/prompts', 'filename', 'opsx-dash']], [['.pi/skills', 'skill-slash']]],
  // --- opsx-dash nested command dir ---
  ['CoStrict', [['.cospec/openspec/commands', 'filename', 'opsx-dash']], [['.cospec/skills', 'skill-slash']]],
  // --- opsx-at (Amazon Q prompts) ---
  ['Amazon Q Developer', [['.amazonq/prompts', 'filename', 'opsx-at']], [['.amazonq/skills', 'skill-slash']]],
  // --- skill-only tools ---
  ['CodeArts', [], [['.codeartsdoer/skills', 'skill-slash']]],
  ['ForgeCode', [], [['.forge/skills', 'skill-slash']]],
  ['Hermes Agent', [], [['.hermes/skills', 'skill-slash']]],
  ['Mistral Vibe', [], [['.vibe/skills', 'skill-slash']]],
  ['Kimi Code', [], [['.kimi-code/skills', 'skill-colon']]],
  // --- shared `.agents` root (Codex target or vendor-neutral Shared `.agents`;
  // indistinguishable from artifacts alone, surfaced as both candidate forms) ---
  [AGENTS_SHARED_TOOL, [], [['.agents/skills', 'skill-slash', ['skill-dollar']]]],
];

/** Example invocation for the representative `propose` workflow, per form. */
function exampleForForm(form: InvocationFormId): string {
  switch (form) {
    case 'opsx-colon':
      return '/opsx:propose';
    case 'opsx-dash':
      return '/opsx-propose';
    case 'opsx-at':
      return '@opsx-propose';
    case 'skill-slash':
      return '/openspec-propose';
    case 'skill-colon':
      return '/skill:openspec-propose';
    case 'skill-dollar':
      return '$openspec-propose';
  }
}

async function listFiles(dir: string): Promise<string[] | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return null;
  }
}

async function listSubdirs(dir: string): Promise<string[] | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return null;
  }
}

function toPosixPath(value: string): string {
  return value.split('\\').join('/');
}

/** Strip the last extension from a filename (`opsx-propose.md` -> `opsx-propose`). */
function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/**
 * Enumerate every real OpenSpec command file for a signature, deriving a
 * normalized workflow id from each filename. Returns null when the directory
 * cannot be read (missing or unreadable -> no evidence), or an empty array
 * when it holds no matching files. A directory name alone never counts as
 * detection, dotfiles are ignored, and duplicate workflow ids collapse to the
 * first source in stable sorted order.
 */
async function findCommandFiles(
  root: string,
  dir: string,
  shape: CommandShape
): Promise<CommandInventoryItem[] | null> {
  const dirPath = join(root, dir);

  const names =
    shape === 'folder' ? await listFiles(join(dirPath, 'opsx')) : await listFiles(dirPath);
  if (!names) {
    return null;
  }

  const items: CommandInventoryItem[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    if (name.startsWith('.')) {
      continue;
    }
    const base = stripExtension(name);
    const workflowId =
      shape === 'folder' ? base : base.startsWith('opsx-') ? base.slice('opsx-'.length) : null;
    if (workflowId === null || workflowId.length === 0 || seen.has(workflowId)) {
      continue;
    }
    seen.add(workflowId);
    const relative = shape === 'folder' ? join(dir, 'opsx', name) : join(dir, name);
    items.push({ workflowId, source: toPosixPath(relative) });
  }

  return items;
}

/**
 * Enumerate every real OpenSpec skill file for a signature: each `openspec-*`
 * directory that contains a SKILL.md. Returns null when the directory cannot
 * be read (missing or unreadable -> no evidence), or an empty array when no
 * skill directory holds a real SKILL.md. Empty `openspec-*` directories are
 * never detection.
 */
async function findSkillFiles(
  root: string,
  dir: string
): Promise<SkillInventoryItem[] | null> {
  const skillsDir = join(root, dir);
  const subdirs = await listSubdirs(skillsDir);
  if (!subdirs) {
    return null;
  }

  const items: SkillInventoryItem[] = [];
  for (const skillDir of subdirs) {
    if (!skillDir.startsWith('openspec-')) {
      continue;
    }
    const files = await listFiles(join(skillsDir, skillDir));
    if (files && files.includes('SKILL.md')) {
      items.push({
        skillName: skillDir,
        source: toPosixPath(join(dir, skillDir, 'SKILL.md')),
      });
    }
  }
  return items;
}

/**
 * Detect repo-local OpenSpec tool integrations by scanning the project root for
 * real OpenSpec-generated artifacts (command files and `openspec-*` skill
 * directories containing SKILL.md). Every matching artifact is retained in the
 * workflow-specific `commands` / `skills` inventories; the legacy singular
 * fields are derived presentation data kept for compatibility. Results are
 * advisory hints: empty directories are never detected, unknown roots are
 * ignored, and scan failures degrade to an empty list rather than an
 * application error.
 */
export async function detectToolIntegrations(projectRoot: string): Promise<DetectedIntegration[]> {
  const integrations: DetectedIntegration[] = [];

  for (const [tool, commandSpecs, skillSpecs] of TOOL_SIGNATURES) {
    let commandInventory: CommandInventory | null = null;
    let skillInventory: SkillInventory | null = null;

    for (const [dir, shape, form] of commandSpecs) {
      const items = await findCommandFiles(projectRoot, dir, shape);
      if (items && items.length > 0) {
        commandInventory = { form, items };
        break;
      }
    }

    for (const [dir, form, alternateForms] of skillSpecs) {
      const items = await findSkillFiles(projectRoot, dir);
      if (items && items.length > 0) {
        skillInventory = {
          form,
          ...(alternateForms && alternateForms.length > 0 ? { alternateForms: [...alternateForms] } : {}),
          items,
        };
        break;
      }
    }

    if (!commandInventory && !skillInventory) {
      continue;
    }

    // Merge command + skill evidence per tool for the legacy aggregate fields:
    // prefer the command form/example and report `both` delivery. These fields
    // are compatibility-only presentation data — the inventories above are the
    // authoritative evidence for per-workflow candidate eligibility.
    const hasCommands = commandInventory !== null;
    const hasSkills = skillInventory !== null;
    const delivery: ToolDelivery = hasCommands && hasSkills ? 'both' : hasCommands ? 'commands' : 'skills';
    const form = commandInventory?.form ?? skillInventory!.form;
    const source =
      commandInventory?.items[0]!.source ?? skillInventory!.items[0]!.source;
    // The shared `.agents` root is ambiguous between the Codex target and the
    // vendor-neutral target, so its example names both candidate invocations
    // rather than asserting one.
    const isAgentsShared = tool === AGENTS_SHARED_TOOL;
    const example = isAgentsShared ? AGENTS_SHARED_EXAMPLE : exampleForForm(form);

    integrations.push({
      tool,
      delivery,
      form,
      example,
      source,
      commands: commandInventory,
      skills: skillInventory,
    });
  }

  return integrations;
}

/**
 * Distinct invocation-form candidates from a set of detected integrations, in
 * the stable canonical form order. Identical forms collapse into one entry.
 */
export function deriveDistinctForms(integrations: readonly DetectedIntegration[]): InvocationFormId[] {
  const present = new Set<InvocationFormId>();

  for (const integration of integrations) {
    if (integration.tool === AGENTS_SHARED_TOOL) {
      // The shared `.agents` root is ambiguous: surface both candidate forms so
      // the frontend opens an explicit selection menu instead of a direct copy.
      for (const form of AGENTS_SHARED_FORMS) {
        present.add(form);
      }
    } else {
      present.add(integration.form);
    }
  }

  return INVOCATION_FORM_IDS.filter((form) => present.has(form));
}

/**
 * Static catalog of supported tool-to-form options derived from the same
 * signature table used by detection, so the frontend never maintains a
 * duplicate catalog. For each tool the preferred form is the first command
 * form when command evidence exists, otherwise the first skill form. The
 * shared `.agents` root is expanded into its two ambiguous targets. Entries
 * keep official signature order and are deduplicated by (tool, form).
 */
export function getSupportedToolOptions(): ToolInvocationOption[] {
  const options: ToolInvocationOption[] = [];
  const seen = new Set<string>();

  for (const [tool, commandSpecs, skillSpecs] of TOOL_SIGNATURES) {
    if (tool === AGENTS_SHARED_TOOL) {
      const agentsOptions: readonly ToolInvocationOption[] = [
        { tool: 'Shared .agents', form: 'skill-slash' },
        { tool: 'Codex', form: 'skill-dollar' },
      ];
      for (const option of agentsOptions) {
        const key = `${option.tool}\u0000${option.form}`;
        if (!seen.has(key)) {
          seen.add(key);
          options.push(option);
        }
      }
      continue;
    }

    const preferredForm = commandSpecs.length > 0 ? commandSpecs[0]![2] : skillSpecs[0]![1];
    const key = `${tool}\u0000${preferredForm}`;
    if (!seen.has(key)) {
      seen.add(key);
      options.push({ tool, form: preferredForm });
    }
  }

  return options;
}
