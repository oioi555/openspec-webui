# Proposal

## Why

OpenSpec v1.14.0 adds ten official tools and records Amp, GSD, Warp, and Grok Build as first-class repository integrations. The WebUI catalog pin can list those tools in Settings, but command-shortcut chips still come only from repository detection. Until the detector allowlist, shared `.agents` marker, and `.prompt.md` command files catch up, operators who ran `openspec init` for the new tools get no copyable commands.

## What Changes

- Pin the official tool-definition snapshot to OpenSpec v1.14.0 (50 tools, revision `94ca9c1eb15d1b49c06c988419b75c3d95f8b2b5`) through the existing analyze-first maintenance workflow. Keep the Vercel research list at 33 clients / revision `435076e78988e1e6ec40d00b0b1d76bdbbc5419a`, joining `amp` and `warp` now that official ids exist.
- Detect AtomCode, Code Studio, DeepSeek Harness, EasyCode, GigaCode, Grok Build, Veai, and Warp from their unique repository artifact paths so Settings and command chips can use them.
- Treat Amp and GSD as owners of the shared `.agents/skills` tree when `.openspec-target` is `amp` or `gsd`. Do not scan that shared path as Amp or GSD on every markerless tree.
- Parse official `opsx-<id>.prompt.md` command files (Code Studio, GitHub Copilot, Kiro) as workflow id `<id>`.
- Surface IBM Bob under the official catalog name `IBM Bob`.
- Keep existing Kilo Code dual-path, Antigravity dual-path, and markerless Shared `.agents` / Codex fallback behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tool-integration-detection`: Detect the v1.14.0 tools that have unique repository artifacts; resolve Amp and GSD through the shared `.agents` marker; treat `.prompt.md` command files as a single suffix; use the official IBM Bob display name.
- `command-shortcuts`: Attribute shared `.agents` skill candidates to Amp or GSD when the marker identifies those owners, using the slash skill form only.

## Impact

- `src/server/data/tool-reference/openspec-tools.json` and `shared-agents-research.json` provenance, tool count, IBM Bob name, and Amp/Warp JOIN.
- `src/server/tool-integration-detection.ts` allowlist, shared-target union, Amp/GSD ownership merge, and `.prompt.md` workflow-id parsing.
- Frontend `SharedSkillTarget` contract and command-choice labels for Amp/GSD.
- Snapshot assertions and focused detection / command-choice tests.
- Apply/archive gating, task parser, validation JSON handling, engines.node, and package version stay as they are.
