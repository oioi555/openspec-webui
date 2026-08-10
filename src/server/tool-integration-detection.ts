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

export interface DetectedIntegration {
  tool: string;
  delivery: ToolDelivery;
  form: InvocationFormId;
  example: string;
  source: string;
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
 * Entry shape: [tool, [[dir, shape, form], ...commands], [[dir, form], ...skills]]
 *   shape 'folder':   `<dir>/opsx/<id>.*`   (opsx-colon form)
 *   shape 'filename': `<dir>/opsx-<id>.*`   (opsx-dash / opsx-at form)
 *   skills: `<dir>/openspec-*` dirs with SKILL.md; the listed form.
 */
type ToolSpec = readonly [
  tool: string,
  commands: ReadonlyArray<readonly [dir: string, shape: CommandShape, form: InvocationFormId]>,
  skills: ReadonlyArray<readonly [dir: string, form: InvocationFormId]>,
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
  [AGENTS_SHARED_TOOL, [], [['.agents/skills', 'skill-slash']]],
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

/**
 * Find the first real OpenSpec command file for a signature, or null when the
 * directory is empty, missing, or holds no matching files. A directory name
 * alone never counts as detection.
 */
async function findCommandFile(
  root: string,
  dir: string,
  shape: CommandShape
): Promise<string | null> {
  const dirPath = join(root, dir);

  if (shape === 'folder') {
    const files = await listFiles(join(dirPath, 'opsx'));
    if (!files || files.length === 0) {
      return null;
    }
    return toPosixPath(join(dir, 'opsx', files[0]!));
  }

  const files = await listFiles(dirPath);
  if (!files) {
    return null;
  }
  const match = files.find((name) => name.startsWith('opsx-'));
  return match ? toPosixPath(join(dir, match)) : null;
}

/**
 * Find the first real OpenSpec skill file (an `openspec-*` directory that
 * contains SKILL.md) for a signature, or null when no skill directory holds a
 * real SKILL.md. Empty `openspec-*` directories are never detection.
 */
async function findSkillFile(root: string, dir: string): Promise<string | null> {
  const skillsDir = join(root, dir);
  const subdirs = await listSubdirs(skillsDir);
  if (!subdirs) {
    return null;
  }

  const openspecDirs = subdirs.filter((name) => name.startsWith('openspec-'));
  for (const skillDir of openspecDirs) {
    const files = await listFiles(join(skillsDir, skillDir));
    if (files && files.includes('SKILL.md')) {
      return toPosixPath(join(dir, skillDir, 'SKILL.md'));
    }
  }
  return null;
}

/**
 * Detect repo-local OpenSpec tool integrations by scanning the project root for
 * real OpenSpec-generated artifacts (command files and `openspec-*` skill
 * directories containing SKILL.md). Results are advisory hints: empty directories are never
 * detected, unknown roots are ignored, and scan failures degrade to an empty
 * list rather than an application error.
 */
export async function detectToolIntegrations(projectRoot: string): Promise<DetectedIntegration[]> {
  const integrations: DetectedIntegration[] = [];

  for (const [tool, commandSpecs, skillSpecs] of TOOL_SIGNATURES) {
    let commandSource: string | null = null;
    let commandForm: InvocationFormId | null = null;

    for (const [dir, shape, form] of commandSpecs) {
      const source = await findCommandFile(projectRoot, dir, shape);
      if (source) {
        commandSource = source;
        commandForm = form;
        break;
      }
    }

    let skillSource: string | null = null;
    let skillForm: InvocationFormId | null = null;

    for (const [dir, form] of skillSpecs) {
      const source = await findSkillFile(projectRoot, dir);
      if (source) {
        skillSource = source;
        skillForm = form;
        break;
      }
    }

    if (!commandSource && !skillSource) {
      continue;
    }

    // Merge command + skill evidence per tool: prefer the command form/example
    // for the singular `form` contract, and report `both` delivery.
    const hasCommands = commandSource !== null;
    const hasSkills = skillSource !== null;
    const delivery: ToolDelivery = hasCommands && hasSkills ? 'both' : hasCommands ? 'commands' : 'skills';
    const form = commandForm ?? skillForm!;
    const source = commandSource ?? skillSource!;
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
