## Why

Search currently opens results in a dialog, which interrupts quick preview workflows because users cannot keep a persistent result list while switching files in the main tabs. Moving search results into a dedicated Explorer pane panel makes search and documentation review feel like normal browsing: select a result, preview it in the main area, then continue through the list while the current keyword remains visible.

## What Changes

- Replace the dialog-centric search results workflow with a persistent, standalone Explorer pane Search panel that is separate from the Active Changes/Archive/Specs group and contains a fixed header, localized explanatory text, search input, and result list styled consistently with Explorer navigation.
- Selecting a search result opens or switches the corresponding document in the main tab viewer without closing or hiding the result list.
- Existing search entry points, including context menu actions and keyword searches initiated from `Spec.md`, switch to and populate the Explorer Search panel with equivalent behavior.
- Preserve existing search capabilities while improving result navigation and preview continuity.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `search`: Search results move from a modal/dialog-only workflow to a persistent Explorer pane panel that can open results in main tabs.
- `explorer-pane`: The Explorer pane gains a dedicated Search panel that replaces the normal section group while active and keeps its header/input fixed.
- `item-context-menu`: Context menu search actions route results to the Explorer Search panel instead of a transient dialog.

## Impact

- Affected frontend search state, Explorer pane components, dialog/search components, tab-opening behavior, and context menu/Spec.md search integration.
- No expected backend API or dependency changes.
