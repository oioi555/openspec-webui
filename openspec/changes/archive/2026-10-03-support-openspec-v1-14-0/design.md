# Design

## Context

See `proposal.md` for motivation. Official tool definitions are a packaged JSON snapshot (`src/server/data/tool-reference/openspec-tools.json`) maintained by `scripts/update-tool-reference.mjs` (analyze-first; write only with `--write --review-hash`). Detection signatures in `src/server/tool-integration-detection.ts` are derived from that snapshot, then gated by the code-owned `DETECTED_TOOL_IDS` allowlist. Command-shortcut chips are built exclusively from `availability.integrations`.

The v1.14.0 pin is already written: 50 tools, revision `94ca9c1eb15d1b49c06c988419b75c3d95f8b2b5`, `checkedAt` 2026-10-02, IBM Bob catalog name, Amp/Warp JOIN. Snapshot tests still assert v1.13.2 / 40 tools. Shared `.agents/skills` currently accepts markers `agents | antigravity | codex | zed`. Filename command ids are derived by stripping the last extension, so `opsx-propose.prompt.md` currently becomes workflow id `propose.prompt`.

## Goals / Non-Goals

**Goals:**
- Point snapshot assertions at the already-written v1.14.0 pin.
- Detect the eight unique-path v1.14.0 tools from real OpenSpec artifacts.
- Resolve Amp and GSD through the shared `.agents` marker, matching Zed/Antigravity ownership rather than scanning `.agents/skills` as ordinary allowlisted tools.
- Parse official `.prompt.md` command files as a single suffix.
- Report IBM Bob under the official catalog name.

**Non-Goals:**
- Refresh, prune, or expand the Vercel research list beyond the Amp/Warp JOIN already written.
- Add Amp, GSD, Codex, Zed, `agents`, Rovo Dev, Zcode, or MiniMax to `DETECTED_TOOL_IDS`.
- Treat `WARP.md`, empty `.amp` / `.gsd` / `.warp` directories, or a marker without skills as evidence.
- Change task parsing, validation JSON handling, apply/archive gating, engines.node, or the package version.

## Decisions

### Keep Amp and GSD off the snapshot scanner

Amp and GSD official rows both list `.agents/skills/openspec-*/SKILL.md`. Adding those ids to `DETECTED_TOOL_IDS` would fire on every shared-skill tree and duplicate the existing Shared `.agents` / Codex integration.

Extend `SharedSkillTarget` with `amp | gsd`. `resolveSharedSkillTarget` accepts them. Existing slash-style marker handling already strips `alternateForms` for every non-legacy, non-Codex target, so Amp/GSD inherit slash-only skills. After scanning, rename the shared integration to `Amp` or `GSD` when that marker owns the tree (the Antigravity skills-only branch). Do not merge Amp/GSD with a unique-path row; they have none.

Frontend `SharedSkillTarget`, `isSharedSkillTarget`, `toolLabelFor`, and `skillFormsFor` add the same two values so a still-shared payload labels Amp/GSD with slash only. Copy chips continue to read integrations only; `getSupportedToolOptions` stays the deprecated static catalog and does not add Amp/GSD entries.

Alternative considered: allowlist Amp and GSD as ordinary snapshot tools. Rejected because any `.agents/skills` tree would claim Amp and GSD even when the marker is `agents`, `zed`, or absent.

### Append unique-path tools to the existing allowlist

Append `atomcode`, `codestudio`, `dsh`, `easycode`, `gigacode`, `grok`, `veai`, and `warp` to `DETECTED_TOOL_IDS`, keeping historical order of the current ids. Signatures stay derived from the pinned snapshot:

- AtomCode / GigaCode: filename `/opsx-<id>` plus skills
- Code Studio: filename commands under `.codestudio/prompts` plus skills
- EasyCode: folder `/opsx:<id>` TOML plus skills
- DeepSeek Harness / Grok Build / Veai / Warp: skills-only unique directories

Empty directories remain non-evidence. Warp detection requires `.warp/skills/openspec-*/SKILL.md`; `WARP.md` is not an OpenSpec artifact.

Alternative considered: a dedicated scanner per new tool. Rejected because the snapshot already encodes path, shape, and invocation once the allowlist includes the id.

### Strip `.prompt.md` before the last extension

Code Studio, GitHub Copilot, and Kiro official command files use `opsx-<id>.prompt.md`. Current last-extension stripping yields workflow id `propose.prompt`. Strip a trailing `.prompt.md` first, then fall back to the last extension so `.md` and `.toml` keep working. Apply this in the shared command-file enumerator, not as a Code Studio-only branch, so Copilot and Kiro pick up the same official suffix.

Alternative considered: special-case Code Studio only. Rejected because Copilot and Kiro already ship the same suffix in the pinned snapshot.

### Drop the IBM Bob display override

`DETECTION_DISPLAY_NAMES` currently maps `bob` to `Bob Shell`. The v1.14.0 catalog name is `IBM Bob`. Remove that override and keep `devin: 'Devin'`. Detector labels then match Settings catalog copy.

## Risks / Trade-offs

- **[Amp/GSD false claims on markerless trees]** → Keep them off `DETECTED_TOOL_IDS`; rename only when the marker is exactly `amp` or `gsd` and matching skills exist.
- **[WARP.md or empty product dirs]** → Continue requiring real `openspec-*` / `SKILL.md` or command files; ignore product marker files.
- **[`.prompt.md` vs leftover `.md` command files]** → Compound-suffix stripping still accepts `opsx-<id>.md`.
- **[Static catalog omits Amp/GSD]** → Accept the same Zed/Codex split: chips use integrations; `getSupportedToolOptions` remains deprecated.

## Migration Plan

1. Update snapshot assertions to v1.14.0 / 50 tools / `94ca9c1` / `2026-10-02`, IBM Bob name, and Amp/Warp JOIN.
2. Extend shared-target unions and Amp/GSD ownership rename.
3. Append the eight unique-path ids, compound `.prompt.md` stripping, and IBM Bob catalog name.
4. Add focused detection and command-choice tests, then run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate --all --strict --json`.

Rollback is a source revert of the snapshot assertions, allowlist, shared-target union, and tests. No project files are migrated.
