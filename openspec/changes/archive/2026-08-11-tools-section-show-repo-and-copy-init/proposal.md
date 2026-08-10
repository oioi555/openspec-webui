## Why

The Settings → Tools & Integrations section describes detected OpenSpec integrations as "configured for this repository", but it never names which repository is active, so users cannot tell what the list applies to. The only affordance for changing those integrations is a sentence mentioning `openspec init`; users have to retype the command and figure out the repository path themselves. This makes the section feel abstract and forces unnecessary terminal work for a common operation (re-running init against the current repository to add or remove per-tool integrations).

## What Changes

- Show the active repository path at the top of the Tools & Integrations section so the scope of the detected-integration list is unambiguous.
- Add a copyable command block for `openspec init <active-repository-path>` that mirrors the Versions section's update-command pattern (code field + copy button), so users can re-run init against the current repository without retyping the path.
- Reorganize the Tools section layout to use the same `InsetPanel`-based structure as the Versions section's "After updating OpenSpec CLI" block: a short header identifying the active repository, the copyable init command, and the existing detected-integration list underneath.
- Keep the section read-only: the copy button copies a terminal command to the clipboard; it does not execute `openspec init` from the browser. Existing refresh control, supported-tools documentation link, and integration list columns (tool, Commands/Skills delivery, example invocation, detection source) are preserved.
- Add a new shared documentation URL constant pointing to the `openspec init` CLI reference (`https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md#openspec-init`) and surface it as an additional documentation link in the Tools section's existing docs-link paragraph, next to the supported-tools link.
- Localize the new copy and the repository-path label in every supported locale, while keeping the command token `openspec init` in English to match the rest of the UI.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tool-integration-detection`: Add requirements that the Tools section displays the active repository path, exposes a copyable `openspec init <active-repository-path>` command block, uses the shared copy affordance already used by the Versions section, and links to the `openspec init` CLI reference via a new shared documentation URL constant alongside the existing supported-tools documentation link. Existing read-only constraints (no format selection, `openspec init` re-run guidance, detected-integration list, refresh control) are preserved.
- `command-preferences`: Reinforce that the Tools category remains read-only even with the new copy command block (copying is not execution), and that the new repository-path display, init-command copy affordance, and init CLI reference link live alongside the existing read-only integration list.
- `ui-localization`: Add localization requirements for the new Tools section copy (active-repository label, init-command block caption, copy-button aria, empty-state when no project is active) in every supported locale, with the `openspec init` token kept in English.

## Impact

- **Frontend**: `frontend/src/lib/components/layout/SettingsView.svelte` (Tools section markup and state wiring), `frontend/src/lib/openspecDocs.ts` (new `OPENSPEC_INIT_DOCS_URL` constant), `frontend/src/lib/openspecDocs.test.ts` (constant assertion), `frontend/src/lib/uiText.ts` and `frontend/messages/*.json` (new message keys and a new `FIXED_LABELS.settings.docs.initCommand` label across all supported locales), existing copy-command helper reuse.
- **State**: Reads `projectStore` (active project id → path) already available to the Settings view; no new store or API endpoint.
- **Specs**: Delta specs for `tool-integration-detection`, `command-preferences`, and `ui-localization`; no API or protocol changes.
- **No breaking changes**: Visual and copy-only reorganization of an existing read-only section; no API, config, or persistence changes.
