## Why

Command shortcuts currently list tools separately even when they generate identical command text, and expose undetected tools that cannot be used in the active repository. This makes the selector longer than necessary and can offer commands that do not match the repository's installed OpenSpec integrations.

## What Changes

- **BREAKING** Build command-copy candidates exclusively from OpenSpec command or skill artifacts detected in the active repository; repositories without matching artifacts no longer receive synthetic copy choices.
- Resolve delivery per tool and workflow from its actual artifacts: prefer the matching Commands artifact when both matching Commands and Skills artifacts exist, otherwise use whichever matching artifact is detected.
- Group detected tools that generate identical command text into one choice and show all corresponding tool names on that choice.
- Copy directly when all detected tools resolve to one command string; open a selector only when two or more distinct command strings remain.
- Preserve both documented invocation forms for detected shared `.agents/skills` artifacts because repository files cannot distinguish the Shared `.agents` target from Codex.
- **BREAKING** Remove the supported-but-undetected tool catalog, `Other tool…`, and custom-command fallback from command shortcut selection.
- Hide each command shortcut when no detected integration can generate that workflow's command, including repositories whose OpenSpec artifacts are stale or incomplete until `openspec update` is run.
- Show a warning placeholder in Settings > Tools when no OpenSpec integrations are detected for the active repository.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `command-shortcuts`: Generate, group, display, and copy only commands supported by detected repository integrations.
- `tool-integration-detection`: Provide authoritative repository-local evidence for shortcut candidate selection and warn when no integration artifacts are detected.

## Impact

- Server integration detection and command-availability response contracts.
- Frontend command candidate construction and `CommandShortcutBar` rendering.
- Settings > Tools empty-state messaging.
- Unit and integration tests for detection, grouping, direct copy, multi-format selection, stale artifacts, and zero-detection behavior.
