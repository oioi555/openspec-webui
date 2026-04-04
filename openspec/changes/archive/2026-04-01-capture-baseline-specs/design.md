## Context

`openspec-webui` is a local-first TypeScript application with a Node.js CLI, a Fastify server, and a Svelte frontend. The codebase already implements browsing, live refresh, search, and suggestion review behavior for OpenSpec-compatible directories, but the repository's own `openspec/` tree does not yet describe that behavior.

This change is intentionally reverse-engineered from the current implementation. The goal is to capture the present contract before any larger product changes are proposed.

## Goals / Non-Goals

**Goals:**
- Record the existing user-visible behavior as baseline OpenSpec capabilities.
- Split the baseline into capability boundaries that future product changes can modify independently.
- Preserve a traceable history of the baseline capture by implementing and then archiving this change.
- Add repository-level project context in `openspec/project.md`.

**Non-Goals:**
- Redesign current behavior.
- Fix unrelated product bugs or UX issues while documenting the baseline.
- Normalize every implementation detail into a requirement if it is not externally meaningful.

## Decisions

- Use capability-oriented specs instead of a single monolithic baseline spec. The baseline is split into `cli-runtime`, `project-context`, `spec-browsing`, `change-browsing`, `task-tracking`, `live-refresh`, `search`, and `suggestion-handoff`.
- Treat current externally visible behavior as normative, even when the implementation is lightweight or local-first. Examples include browser auto-open, search scope limits, and localStorage-backed suggestions.
- Record implementation-specific ambiguities in this design rather than forcing them into SHALL-level requirements. This keeps the baseline useful without overcommitting to accidental internals.
- Create `openspec/project.md` directly during implementation. The archive flow updates main specs, but the project context file still needs to be written explicitly.
- Archive the change after validation so the repo ends with both current main specs and an archived record of how the baseline was derived.

## Risks / Trade-offs

- **Reverse-engineered behavior may capture accidental quirks** → Keep ambiguous or low-value internals in design notes and allow future changes to refine them deliberately.
- **Capability boundaries may need adjustment later** → Use behavior-based capability names now so future refactors can modify one area at a time.
- **Live refresh is currently implemented as full re-parse on every relevant file event** → Record that behavior as the baseline and let future performance work change it through a separate proposal.
- **Suggestion persistence is browser-local only** → Document it as a local workflow feature, not as collaborative state.

## Open Questions

- Whether archived change lookup should remain substring-based or become exact-match only.
- Whether capabilities without `spec.md` should continue surfacing as empty specs.
- Whether future search should include task lists, change design files, and supplemental artifacts.
- Whether websocket refresh should eventually use pushed payloads instead of always refetching over HTTP.
- Whether suggestion anchors should move from render-derived block IDs to a more stable identifier scheme.
