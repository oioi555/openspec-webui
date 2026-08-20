## 1. Official OpenSpec Definitions

- [x] 1.1 Audit the pinned OpenSpec supported-tools source and normalize every official tool id, display name, Commands path/form, and Skills path/form into one server-owned definition snapshot with source version, URL, and verification date; verify a snapshot/completeness test covers every upstream row and explicit missing deliveries.
- [x] 1.2 Reuse the overlapping official definition fields from repository detection without changing evidence-only eligibility or invocation behavior; verify existing tool-detection and command-candidate regression tests pass.

## 2. Shared Agent Skills Research

- [x] 2.1 Curate only clients for which useful `.agents/skills` evidence or credible reports have been found, recording scope, reported access mode, evidence kind, source/reference, research date, and known version constraints; verify missing official tool ids are allowed and do not become compatibility conclusions.
- [x] 2.2 Add researched clients outside the official table and seed the named major project-path candidates, retaining runtime-observed provenance for Grok Build unless vendor documentation is established; verify dataset tests distinguish external clients from OpenSpec targets and preserve the non-exhaustive contract.
- [x] 2.3 Add static dataset validation for duplicate ids, invalid modes/scopes, broken official-id links, missing provenance, invalid dates, and missing official source metadata; verify malformed fixture cases fail with actionable errors.

## 3. Reference API

- [x] 3.1 Add an active-project-independent read-only API returning official definitions, official source metadata, and shared compatibility records; verify endpoint tests succeed without a project and perform no repository scan or mutation.
- [x] 3.2 Add shared/frontend response types and a client loader without extending command availability; verify type tests and API fixtures preserve the separation from detected integrations.

## 4. Independent Reference Dialog

- [x] 4.1 Add the Tools entry control and accessible modal shell with separate OpenSpec integrations and Shared `.agents` compatibility views; verify component tests cover open/close, keyboard dismissal, focus restoration, no-active-project access, and unchanged Settings state.
- [x] 4.2 Implement searchable official-definition rows with ids, deliveries, paths, invocation forms, and pinned-source metadata; verify tests cover name/id/path filtering, skills-only rows, missing values, and search reset.
- [x] 4.3 Implement a compact target summary that distinguishes slash-style `agents`/`zed` output from Codex's required dollar-style target, explains the one-way Codex-led sharing rule without duplicating the client list, and render researched rows with textual mode, scope, evidence, date, version, and source details.
- [x] 4.4 Add responsive desktop-table and narrow-width card/list behavior with contained long paths and reachable controls, centering the dialog within the content viewport to the right of the persistent Activity Bar; verify browser checks at desktop, half-FHD, and mobile widths and confirm compatibility is not conveyed by color alone.

## 5. Localization And Isolation

- [x] 5.1 Add all dialog, search, classification, provenance, empty-state, and accessibility messages to every supported locale while preserving product names, ids, paths, commands, versions, and URLs; verify localization parity and content-validation tests pass.
- [x] 5.2 Verify opening, filtering, switching views, and closing the dialog never refreshes integration detection, changes command candidates, executes `openspec init`, or writes project files through integration tests.

## 6. Full Verification

- [x] 6.1 Run `npm test`, `npm run typecheck`, and `npm run build`; verify the complete suite passes and both dialog views remain usable with the full definition dataset.
