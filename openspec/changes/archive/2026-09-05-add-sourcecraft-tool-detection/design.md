## Context

See `proposal.md` for motivation. The v1.12.0 reference row for `codeassistant` is already present and provides both repository paths, but the detector allowlist excludes it. The current detector also requires every skill signature to map to one of six command-like invocation forms; SourceCraft instead activates skills through a natural-language request. Invocation-form ids are duplicated across the server and frontend API boundary, and candidate generation currently models a prefix plus either a workflow id or skill-name suffix.

## Goals / Non-Goals

**Goals:**

- Keep SourceCraft paths and documented invocation text derived from the pinned official definition.
- Detect command-only, skill-only, and dual-delivery SourceCraft repositories.
- Preserve workflow-level evidence and Commands-first candidate selection.
- Make the new form explicit across server serialization, frontend validation, and copy generation.

**Non-Goals:**

- Detect the SourceCraft executable, VS Code extension, web product, or JetBrains product.
- Refresh or reinterpret the already-updated v1.12.0 tool-reference datasets.
- Add a general free-form prompt editor or make arbitrary prose into an invocation form.
- Change candidate behavior for existing tools.

## Decisions

### Add a bounded `skill-prompt` invocation form

Extend the shared invocation-form contract with `skill-prompt`, whose canonical workspace rendering is `use the openspec-<skill> skill`. This retains the current typed, table-driven API instead of special-casing SourceCraft after detection or falsely classifying its skills as slash commands.

The invocation descriptor will support a trailing literal in addition to its prefix and interpolation target. Existing forms use an empty trailing literal; `skill-prompt` uses prefix `use the openspec-`, skill-name interpolation, and suffix ` skill`.

Alternative considered: record SourceCraft Skills evidence without a form. That would require nullable forms throughout the API and would make the existing rule that matching skill evidence produces a candidate ambiguous. Alternative considered: map it to `skill-slash`; that would generate syntax SourceCraft does not document.

### Use a natural-language change argument connector

For change-scoped SourceCraft prompts, append ` for <change-name>` rather than the command forms' positional ` <change-name>`. The invocation descriptor will carry the change-argument connector, defaulting to a single space for every existing form and using ` for ` for `skill-prompt`. This keeps generation declarative and produces a complete instruction rather than command-shaped prose.

Alternative considered: append the bare change name uniformly. It is mechanically smaller but produces an unclear prompt and weakens the value of a copyable natural-language candidate.

### Enroll SourceCraft through the existing official-definition allowlist

Add `codeassistant` to the code-owned detector ids. The signature builder will derive `.codeassistant/commands`, `.codeassistant/skills`, `opsx-dash`, and `skill-prompt` from the pinned definition, preserving the rule that a new official row does not silently broaden detection. No SourceCraft-only filesystem scanner is needed.

Commands remain the preferred supported-tool option and win per workflow when command and skill evidence both match. Skill-only repositories use the prompt form. The generic API and Settings rendering can consume the resulting inventories without SourceCraft-specific response fields.

Alternative considered: add only command detection. That would omit valid skills-only installations and contradict the detector's delivery-independent evidence model.

### Keep the new form synchronized at the API boundary

Add `skill-prompt` to both server and frontend invocation-form id sets, example generation, frontend runtime parsing, and command candidate generation. Regression tests will exercise serialization as well as generation so a one-sided update fails visibly.

## Risks / Trade-offs

- [Natural-language activation is more flexible than one canonical sentence] → Use the exact stable wording already pinned in the official tool definition and describe it as a copyable prompt, not the only phrase SourceCraft accepts.
- [Adding a seventh form can expose exhaustive-switch or validation drift] → Cover server examples, API parsing, frontend generation, and form completeness tests together.
- [User-provided change names become part of prose] → Preserve the existing trusted copy-only behavior and use the explicit ` for ` connector without executing the generated text.
- [The pinned SourceCraft definition is removed or changed later] → Retain the existing startup validation that fails when an allowlisted definition or supported signature shape disappears.

## Migration Plan

1. Add the synchronized invocation-form contract and generation metadata.
2. Add `codeassistant` to detector eligibility and verify its definition resolves.
3. Add detector, API, and frontend candidate regressions.
4. Run the focused tests followed by the repository test, typecheck, build, and strict OpenSpec validation suites.

Rollback removes the allowlist entry and `skill-prompt` contract additions together; no persisted data or user configuration requires migration.
