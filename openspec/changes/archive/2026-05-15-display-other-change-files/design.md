## Context

Change detail views currently focus on the standard OpenSpec artifacts: proposal, design, tasks, and spec deltas. Some compatible workflows also place auxiliary files directly inside `openspec/changes/<changeId>/`, especially `.openspec.yaml` from the scaffold and `revisions.json` from OpenSpec MCP revision recording. Operators need a lightweight way to inspect those files without expanding scope to MCP review/approval folders that live outside the change directory.

## Goals / Non-Goals

**Goals:**
- Discover non-standard text files directly under a change directory.
- Render those files in ChangeViewer under a dedicated top-level `Other` tab using collapsible cards similar to spec delta sections.
- Format known text formats enough to be readable: Markdown as rendered content, `revisions.json` as structured revision cards, generic JSON as pretty-printed code, YAML/YML and other text as preformatted text.
- Show a lightweight dashboard card badge for meaningful other files while suppressing `.openspec.yaml`-only noise.
- Keep Explorer rows compact by not adding Other file metadata there.

**Non-Goals:**
- Reading or rendering MCP review/approval records from `openspec/reviews/**` or `openspec/approvals/**`.
- Providing review CRUD, approval workflow actions, or automatic AI review resolution.
- Supporting arbitrary repository file browsing outside the selected change directory.
- Adding new dashboard second-line icons or Explorer metadata indicators.

## Decisions

1. **Scope discovery to direct change-owned files.**
   - Decision: collect non-standard files from `openspec/changes/<changeId>/` while excluding `proposal.md`, `design.md`, `tasks.md`, and `specs/**/spec.md`.
   - Rationale: this captures `.openspec.yaml`, `revisions.json`, and local notes without treating unrelated MCP state folders as part of the change payload.
   - Alternative considered: also read `openspec/reviews/changes/<changeId>/`; rejected because review storage is a separate MCP concern and would imply review management UI expectations.

2. **Use a dedicated Other primary tab with generic file cards.**
   - Decision: render Other Files in their own top-level `Other` primary tab, with a badge count and collapsible file cards inside that tab.
   - Rationale: Other Files are peers to Proposal, Design, Tasks, and Spec Deltas in navigation. Putting them below the currently active standard tab, especially below Spec Deltas, makes them feel like part of that tab and hides the feature during debugging.
   - Alternative considered: build a dedicated revisions timeline immediately; rejected for MVP because a generic renderer is more robust for unknown custom files.
   - Alternative considered: render Other Files below all existing tab content; rejected because it couples Other Files to whichever tab is active and caused the implementation to appear inside the Spec Deltas page.

3. **Dashboard badge counts only meaningful extras.**
   - Decision: dashboard change cards show `Other N` beside existing first-line badges only when the count excluding `.openspec.yaml` is greater than zero.
   - Rationale: `.openspec.yaml` is common scaffold metadata and would make every change look like it has notable auxiliary content.
   - Alternative considered: show the count on the second metadata line; rejected because it requires new icon/spacing decisions and increases visual density.

4. **Explorer remains unchanged.**
   - Decision: no Other badge or file count appears in Explorer rows.
   - Rationale: Explorer rows are narrow and already carry date, spec delta count, task progress, progress bar, and validation state.

## Risks / Trade-offs

- **Large auxiliary files could make ChangeViewer heavy** → Limit rendering to text-like files and use existing content loading safeguards where available.
- **Unknown JSON/YAML schemas may not have a friendly summary** → Always keep a raw/preformatted fallback instead of requiring schema-specific parsing.
- **Known-schema renderers can drift from MCP output** → Apply friendly rendering only when `revisions.json` parses as the expected `{ changeId, revisions[] }` shape; otherwise fall back to generic JSON display.
- **Users may expect MCP reviews to appear** → Keep wording as "Other Files" and document that only files inside the change directory are included.
