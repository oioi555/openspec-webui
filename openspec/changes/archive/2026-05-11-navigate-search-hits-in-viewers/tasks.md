## 1. Search result contract

- [x] **1.1** Extend shared/frontend search result types to carry first-hit routing metadata for change documents and matching spec deltas.
- [x] **1.2** Update search parsing so change search covers proposal, design, tasks, other markdown files, and spec delta content instead of proposal body only.
- [x] **1.3** Preserve metadata-only result behavior without generating false body-hit routing metadata.

## 2. Search-open navigation

- [x] **2.1** Update Search result opening flow to write viewer-state navigation hints for first-hit routing.
- [x] **2.2** Add SpecViewer first-hit auto-scroll behavior that runs only for Search-driven markdown-body hits.
- [x] **2.3** Add ChangeViewer first-hit routing so opening a Search result selects the matching top-level document or Spec Deltas tab before scrolling.
- [x] **2.4** Ensure one-shot search navigation hints do not retrigger unexpectedly after manual tab switches or rerenders.

## 3. Change hit indicators and delta expansion

- [x] **3.1** Add warning-tone hit-presence indicators to change top-level document tabs that contain search hits.
- [x] **3.2** Add warning-tone hit counts to matching spec delta section headers.
- [x] **3.3** Auto-expand only the spec delta sections that contain hits when ChangeViewer is opened from Search into Spec Deltas.

## 4. Verification

- [x] **4.1** Add or update regression coverage for search contract metadata, viewer-state handoff, and metadata-only fallbacks.
- [x] **4.2** Add frontend regression coverage for SpecViewer auto-scroll, ChangeViewer document selection, top-level hit indicators, and matching spec-delta auto-expansion.
- [x] **4.3** Run `npm test`.
- [x] **4.4** Run `npm run typecheck`.
- [x] **4.5** Run `openspec validate navigate-search-hits-in-viewers --strict`.
