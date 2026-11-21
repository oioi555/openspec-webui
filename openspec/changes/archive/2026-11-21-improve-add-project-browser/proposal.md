# Proposal

## Why

The add-project dialog renders every subdirectory of the current folder as a button at once. Large folders such as `/tmp` (about 930 entries on a typical machine) make each navigation step feel slow, so operators fall back to typing paths by hand. The browse API itself answers in a few milliseconds, so the cost is on the client.

## What Changes

- Add a name filter to the directory list. Typing narrows the visible entries without another server request.
- List subdirectories that contain `openspec/` before the others, keeping name order inside each group.
- Render a bounded first page of entries (200), with a control that reveals the rest.
- Clear the filter and the page size whenever the displayed directory changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-selector-ui`: the add-project directory list stays responsive for large folders (filter, OpenSpec-first order, bounded rendering).

## Impact

- `frontend/src/lib/components/layout/AddProjectDialog.svelte` and its test.
- `frontend/src/lib/uiText.ts` or the paraglide messages (7 locales) for the filter placeholder, the match count and the "show more" control.
- No API change. `/api/fs/browse` keeps its response shape.
