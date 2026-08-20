import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { OPEN_SPEC_TOOL_DEFINITIONS } from './tool-compatibility-reference.js';

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

export type SharedSkillTarget = 'agents' | 'codex' | 'zed' | 'legacy';

export interface ToolIntegrationDetectionDependencies {
  readTargetMarker?: (path: string) => Promise<string>;
}

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
 * the exact same artifact tree. It is set for legacy-ambiguous and Codex-led
 * shared `.agents` roots, whose generated handoffs support both slash and
 * dollar forms.
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
  /** Resolved v1.10 target for the shared `.agents/skills` tree. */
  sharedSkillTarget?: SharedSkillTarget;
}

export interface ToolInvocationOption {
  tool: string;
  form: InvocationFormId;
}

type CommandShape = 'folder' | 'filename';

/**
 * Compatibility display name for the shared `.agents/skills` root. The
 * additive `sharedSkillTarget` field carries the authoritative v1.10 identity;
 * this legacy field remains non-committal for existing API consumers.
 */
export const AGENTS_SHARED_TOOL = 'Shared .agents / Codex';

/** Example for the shared root showing both candidate invocations. */
const AGENTS_SHARED_EXAMPLE = '/openspec-propose or $openspec-propose';

async function resolveSharedSkillTarget(
  projectRoot: string,
  readTargetMarker: (path: string) => Promise<string>
): Promise<SharedSkillTarget> {
  try {
    const target = (await readTargetMarker(join(projectRoot, '.agents/skills/.openspec-target'))).trim();
    return target === 'agents' || target === 'codex' || target === 'zed' ? target : 'legacy';
  } catch {
    return 'legacy';
  }
}


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

const DETECTED_TOOL_IDS = [
  'claude', 'codebuddy', 'crush', 'gemini', 'lingma', 'qoder',
  'auggie', 'bob', 'command-code', 'cursor', 'factory', 'iflow', 'junie',
  'oh-my-pi', 'opencode', 'qwen', 'roocode', 'trae',
  'antigravity', 'cline', 'devin', 'kilocode',
  'continue', 'github-copilot', 'kiro', 'pi', 'costrict', 'amazon-q',
  'codeartsagent', 'forgecode', 'hermes', 'vibe', 'kimi',
] as const;

const DETECTION_DISPLAY_NAMES: Partial<Record<(typeof DETECTED_TOOL_IDS)[number], string>> = {
  bob: 'Bob Shell',
  devin: 'Devin',
};

function invocationForm(invocation: string | null): InvocationFormId | null {
  if (!invocation) return null;
  if (invocation.startsWith('/opsx:')) return 'opsx-colon';
  if (invocation.startsWith('/opsx-')) return 'opsx-dash';
  if (invocation.startsWith('@opsx-')) return 'opsx-at';
  if (invocation.startsWith('/skill:')) return 'skill-colon';
  if (invocation.startsWith('$openspec-')) return 'skill-dollar';
  if (invocation.startsWith('/openspec-')) return 'skill-slash';
  return null;
}

function commandSignature(
  path: string,
  invocation: string | null
): ToolSpec[1][number] | null {
  const form = invocationForm(invocation);
  if (!form) return null;
  const folderMarker = '/opsx/<id>';
  const filenameMarker = '/opsx-<id>';
  const folderIndex = path.indexOf(folderMarker);
  if (folderIndex >= 0) {
    return [path.slice(0, folderIndex), 'folder', form];
  }
  const filenameIndex = path.indexOf(filenameMarker);
  return filenameIndex >= 0 ? [path.slice(0, filenameIndex), 'filename', form] : null;
}

function skillSignature(path: string, invocation: string | null): SkillSpec | null {
  const form = invocationForm(invocation);
  const markerIndex = path.indexOf('/openspec-*');
  return form && markerIndex >= 0 ? [path.slice(0, markerIndex), form] : null;
}

/**
 * Detection consumes path and invocation fields from the pinned official
 * definition snapshot, while preserving the historical evidence-only tool set
 * and ordering. Global-only and unsupported detector shapes remain reference
 * rows rather than becoming repository evidence.
 */
const TOOL_SIGNATURES: readonly ToolSpec[] = [
  ...DETECTED_TOOL_IDS.map((id): ToolSpec => {
    const definition = OPEN_SPEC_TOOL_DEFINITIONS.find((candidate) => candidate.id === id);
    if (!definition) {
      throw new Error(`Missing official definition for detected tool ${id}`);
    }
    const command = definition.commands
      ? commandSignature(definition.commands.path, definition.commands.invocation)
      : null;
    const skill = definition.skills
      ? skillSignature(definition.skills.path, definition.skills.invocation)
      : null;
    return [
      DETECTION_DISPLAY_NAMES[id] ?? definition.name,
      command ? [command] : [],
      skill ? [skill] : [],
    ];
  }),
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
export async function detectToolIntegrations(
  projectRoot: string,
  dependencies: ToolIntegrationDetectionDependencies = {}
): Promise<DetectedIntegration[]> {
  const integrations: DetectedIntegration[] = [];
  const readTargetMarker = dependencies.readTargetMarker
    ?? ((path: string) => readFile(path, 'utf8'));

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
    // Markerless/invalid trees retain the legacy dual-form example; valid
    // agents and Zed markers narrow it to the slash form.
    const isAgentsShared = tool === AGENTS_SHARED_TOOL;
    const sharedSkillTarget = isAgentsShared
      ? await resolveSharedSkillTarget(projectRoot, readTargetMarker)
      : undefined;
    if (isAgentsShared && sharedSkillTarget !== 'legacy' && sharedSkillTarget !== 'codex') {
      skillInventory = {
        form: skillInventory!.form,
        items: skillInventory!.items,
      };
    }
    const example = isAgentsShared && skillInventory?.alternateForms
      ? AGENTS_SHARED_EXAMPLE
      : exampleForForm(form);

    integrations.push({
      tool,
      delivery,
      form,
      example,
      source,
      commands: commandInventory,
      skills: skillInventory,
      ...(sharedSkillTarget ? { sharedSkillTarget } : {}),
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
      for (const form of [
        integration.skills?.form ?? integration.form,
        ...(integration.skills?.alternateForms ?? []),
      ]) {
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
