# Proposal

## Why

OpenSpec v1.13.1 widened task-line recognition so `status`, apply, and archive no longer silently drop unfinished work written as `+ [ ]`, `1. [ ]`, `[~]`, empty `[]`, or padded `[ x]`. The WebUI still matches only hyphen checkboxes with a space-or-x marker and non-empty text, so Dashboard, Explorer, ChangeViewer progress, and apply/archive gating can disagree with the CLI on the same `tasks.md`. The pinned official tool-definition snapshot is also still sourced from v1.12.0.

## What Changes

- Align the WebUI task parser with OpenSpec v1.13.1's task-line pattern: CommonMark list markers (`-`, `*`, `+`, ordered `1.` / `1)` up to nine digits), one-token checkboxes, only `x`/`X` as done, empty descriptions allowed, and link-bullet rejection (`](` / `][`) except whitespace-only `[ ](...)` / `[ ][...]`).
- Keep WebUI-specific nesting: indent-based task trees and source line numbers. Progress totals must count the same lines the CLI counts.
- Pin the official tool-definition snapshot to OpenSpec v1.13.1 through the existing analyze-first maintenance workflow. The tagged table still has 40 tools. Report official-source disagreements instead of silently taking one document: (1) `agents` display name — tagged table "Shared `.agents` skills" vs release notes / shipped picker "Other / Universal"; keep the tagged table name in the snapshot and do not rename detector labels (`Shared .agents / Codex`); (2) `antigravity` paths — tagged table still lists `.agent` while shipped v1.13.1 config and the current snapshot use `.agents`; keep `.agents` and do not regress.
- No CLI execution, validation, archive internals, nested `changes/<namespace>/<name>/` discovery, or new tool detection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `task-tracking`: Recognize the v1.13.1 task-line set and completion rule while retaining indent nesting, line numbers, and recursive progress.

## Impact

- `src/parser/tasks.ts` and new focused parser tests (plus any existing change-parser fixtures that assume the old hyphen-only rule).
- `openspec/specs/task-tracking/spec.md` via this change's delta.
- Pinned `src/server/data/tool-reference/openspec-tools.json` source provenance (`version`, `revision`, `checkedAt`, `url`) and the snapshot test that currently asserts v1.12.0.
- Apply/archive/bulk-archive gating continues to read `taskProgress`; those surfaces change only because they consume the wider parser.
- No API field removal, no dependency bump, no `engines.node` change, and no detector/command-shortcut contract change.
