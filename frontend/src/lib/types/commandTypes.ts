export const CORE_COMMANDS = ['propose', 'explore', 'apply', 'sync', 'archive', 'update'] as const;
export type CoreCommand = (typeof CORE_COMMANDS)[number];

export const EXPANDED_COMMANDS = ['new', 'continue', 'ff', 'verify', 'bulk-archive'] as const;
export type ExpandedCommand = (typeof EXPANDED_COMMANDS)[number];

export const ALL_COMMANDS = [...CORE_COMMANDS, ...EXPANDED_COMMANDS] as const;
export type WorkflowCommand = (typeof ALL_COMMANDS)[number];

// The seven official OpenSpec invocation forms (docs/supported-tools.md):
//   /opsx:<id>          opsx-colon    (folder-namespaced opsx/<id> command files)
//   /opsx-<id>          opsx-dash     (opsx-<id> filename command files)
//   @opsx-<id>          opsx-at       (Amazon Q prompts)
//   /openspec-<skill>   skill-slash   (skills-only tools)
//   /skill:openspec-<skill>  skill-colon (Kimi Code)
//   $openspec-<skill>   skill-dollar  (Codex CLI)
//   use the openspec-<skill> skill  skill-prompt (SourceCraft Code Assistant)
// These ids are stable identifiers shared with the command availability API.
export const INVOCATION_FORM_IDS = [
  'opsx-colon',
  'opsx-dash',
  'opsx-at',
  'skill-slash',
  'skill-colon',
  'skill-dollar',
  'skill-prompt',
] as const;
export type InvocationFormId = (typeof INVOCATION_FORM_IDS)[number];
