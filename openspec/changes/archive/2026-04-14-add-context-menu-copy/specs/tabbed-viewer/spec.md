## MODIFIED Requirements

### Requirement: Tab management system
The system SHALL provide a tab management store that maintains an ordered list of open tabs. Each tab SHALL have a unique ID, type (spec, change, or dashboard), display name, URL path, and optional pinned state. The store SHALL support operations: open tab, close tab, focus tab, reorder tabs, and pin/unpin tab. The Dashboard tab SHALL be pinned by default, SHALL always be present, and SHALL NOT be closable or unpinnable. The tab store SHALL materialize tabs for the Dashboard route (`/`) and detail routes such as `/specs/<name>` and `/changes/<name>`. The system SHALL NOT create standalone list tabs for `/specs` or `/changes`; section browsing for Specs and Archive SHALL be handled by the Explorer Pane while the Main Viewer remains on the Dashboard or detail tabs. The ChangeViewer and SpecViewer SHALL use the `UnderlineTabs` component from `$lib/components/ui/underline-tabs/` for their internal sub-tab navigation instead of inline underline tab implementations. The `UnderlineTabs` API SHALL support optional badge counts so ChangeViewer can render file group counts and spec delta counts without feature-specific badge markup. The MainViewer SHALL NOT contain any suggestion panel or suggestion mode sidebar logic. The ChangeViewer SHALL use the project's ContextMenu component to provide a right-click context menu on the markdown content area, enabling text copy and quoted copy operations with change and file context.

#### Scenario: MainViewer renders content without suggestion panel
- **WHEN** the operator views any tab content
- **THEN** the Main Viewer renders only the content area with tab bar
- **AND** no suggestion panel sidebar or suggestion sheet overlay is present

#### Scenario: ChangeViewer provides context menu on markdown content
- **WHEN** the operator views a change tab and right-clicks on the markdown content area
- **THEN** a context menu appears with copy-related actions
- **AND** the menu uses the ContextMenu component from `$lib/components/ui/context-menu/`
