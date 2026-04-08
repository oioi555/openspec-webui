## 1. shadcn-svelte Setup & Dependencies

- [x] 1.1 Install npm dependencies: `shadcn-svelte` peer deps (bits-ui, tailwindcss-animate, clsx, tailwind-merge, @lucide/svelte) as devDependencies in package.json
- [x] 1.2 Create `frontend/components.json` with shadcn-svelte config for plain Vite (style: default, tailwind css path, $lib aliases)
- [x] 1.3 Add `$lib` path alias to `frontend/vite.config.ts` (resolve.alias: `$lib → path.resolve('./src/lib')`)
- [x] 1.4 Add `$lib` path alias to `frontend/tsconfig.json` (compilerOptions.paths)
- [x] 1.5 Add shadcn oklch theme variables to `frontend/src/app.css` (light/dark variants in `@theme` block)
- [x] 1.6 Map existing custom CSS variables to shadcn variables as aliases for backward compatibility
- [x] 1.7 Install shadcn-svelte components: Button, Tabs, Tooltip, ScrollArea, Collapsible, Resizable, Separator, Dialog, DropdownMenu, Sheet, Input, Badge (via CLI or manual)

## 2. Tab Store, Layout Store & Routing

- [x] 2.1 Create `frontend/src/stores/tabs.svelte.ts` with Tab interface (id, type, name, path, pinned) and tab management operations (open, close, focus, reorder, pin/unpin)
- [x] 2.2 Implement URL sync: active tab updates `window.history.pushState`, direct URL access opens corresponding tab
- [x] 2.3 Integrate tab store with existing `stores/index.svelte.ts` (replace manual route parsing with tab-based routing)
- [x] 2.4 Create `frontend/src/stores/layout.svelte.ts` to manage activity focus, Explorer Pane collapse state, section collapse state, responsive mode, and remembered Explorer width
- [x] 2.5 Sync Activity Bar actions with Explorer focus presets (`Home` → ACTIVE CHANGES, `Changes` → ARCHIVE, `Specs` → SPECS) and narrow-width drawer behavior

## 3. Activity Bar Component

- [x] 3.1 Create `frontend/src/components/layout/ActivityBar.svelte`: 48px fixed-width vertical bar with current project control at the top and Home, Changes, Specs, Search, Settings buttons using `@lucide/svelte`
- [x] 3.2 Implement active section highlighting logic (Dashboard or active change tab → Home, archived change tab → Changes, spec tab → Specs, overlays → Search/Settings)
- [x] 3.3 Add Tooltip on hover for each Activity Bar icon and current project control using shadcn-svelte Tooltip component
- [x] 3.4 Implement click handlers: project control → project selector, Home → Dashboard tab + expand ACTIVE CHANGES, Changes → expand ARCHIVE, Specs → expand SPECS, Search → search panel, Settings → open settings dialog
- [x] 3.5 Keep Activity Bar fully interactive when Explorer Pane is collapsed or hidden in narrow mode

## 4. Explorer Pane Component

- [x] 4.1 Create `frontend/src/components/layout/ExplorerPane.svelte`: container with project header and three Collapsible sections in workflow order (ACTIVE CHANGES, ARCHIVE, SPECS)
- [x] 4.2 Implement ACTIVE CHANGES section: list active changes from store, show task progress badge, click → open change tab
- [x] 4.3 Implement ARCHIVE section: list archived changes, click → open change tab
- [x] 4.4 Implement SPECS section: list specs from store, show design indicator badge, click → open spec tab
- [x] 4.5 Add count badges to each section header
- [x] 4.6 Add empty state placeholders for each section
- [x] 4.7 Wrap all sections in ScrollArea for vertical overflow
- [x] 4.8 Implement Activity Bar-driven focus presets (`Home` → ACTIVE CHANGES, `Changes` → ARCHIVE, `Specs` → SPECS) while still allowing manual section collapse/expand inside the pane
- [x] 4.9 Place workspace command shortcut row with the ACTIVE CHANGES surface for both persistent pane and narrow-width Home drawer

## 5. Tabbed Main Viewer Component

- [x] 5.1 Create `frontend/src/components/layout/TabBar.svelte`: horizontal tab bar using shadcn-svelte Tabs, render tab names and close buttons (X icon from @lucide/svelte)
- [x] 5.2 Implement active tab highlighting and click-to-focus behavior
- [x] 5.3 Implement tab close logic (close → focus adjacent, fallback to Dashboard)
- [x] 5.4 Add horizontal scroll for tab overflow
- [x] 5.5 Implement tab pinning (pin icon, grouped left, no close button)
- [x] 5.6 Create `frontend/src/components/layout/MainViewer.svelte`: container that renders the active tab's content (Dashboard / SpecViewer / ChangeViewer) based on tab type

## 6. Layout Shell

- [x] 6.1 Create `frontend/src/components/layout/AppLayout.svelte`: three-pane Resizable layout (ActivityBar | ExplorerPane | MainViewer)
- [x] 6.2 Configure Resizable with min/max constraints (Explorer: 180-400px, MainViewer min: 300px)
- [x] 6.3 Implement Explorer Pane collapse/expand toggle (separate from section collapse) and restore the previous width on reopen
- [x] 6.4 Implement narrow-width fallback: keep only Activity Bar + Main Viewer persistent, open Explorer as a temporary `Sheet` / drawer from `Home`, `Changes`, and `Specs`
- [x] 6.5 Replace `App.svelte` body: remove old Navigation + main layout, use new AppLayout component

## 7. Component Migration

- [x] 7.1 Migrate `Navigation.svelte` search functionality to Activity Bar search panel or command palette overlay
- [x] 7.2 Integrate current project context / project selector trigger into the Activity Bar top slot and Explorer header
- [x] 7.3 Remove `Navigation.svelte` (replaced by ActivityBar + ExplorerPane)
- [x] 7.4 Remove `SpecsList.svelte` (replaced by Explorer Pane SPECS section)
- [x] 7.5 Remove `ChangesList.svelte` (replaced by Explorer Pane ACTIVE CHANGES + ARCHIVE sections)
- [x] 7.6 Update `Dashboard.svelte` to work as the Home tab content component (keep project context/documentation and Active Changes linkage assumptions)
- [x] 7.7 Update `SpecViewer.svelte` to work as tab content (remove back navigation link, accept tab context)
- [x] 7.8 Update `ChangeViewer.svelte` to work as tab content (remove back navigation link, accept tab context)
- [x] 7.9 Delete custom `Icon.svelte`, replace all imports with `@lucide/svelte` equivalents throughout the codebase
- [x] 7.10 Update `SettingsModal.svelte` to open from Activity Bar Settings icon, use shadcn Dialog component
- [x] 7.11 Update `SuggestionPanel.svelte` to render as a collapsible right sidebar within the layout

## 8. Theme Migration

- [x] 8.1 Replace custom CSS variable colors with shadcn oklch variables in all component Tailwind classes
- [x] 8.2 Update markdown rendering styles in `app.css` to use shadcn theme variables
- [x] 8.3 Update diff highlighting styles to use shadcn theme variables
- [x] 8.4 Verify light/dark/system theme switching works with new variables
- [x] 8.5 Remove legacy CSS variable aliases once all components are migrated

## 9. Verification & Polish

- [x] 9.1 Verify all existing features work: spec browsing, change browsing, search, suggestions, command shortcuts, live refresh
- [x] 9.2 Verify tab system: open/close/focus/pin tabs, URL sync, direct URL access
- [x] 9.3 Verify Activity Bar / Explorer sync: workflow order, `Home → ACTIVE CHANGES`, `Changes → ARCHIVE`, `Specs → SPECS`, manual section collapse, remembered width, Explorer restore
- [x] 9.4 Verify responsive fallback: narrow width keeps Activity Bar visible, `Home` / `Changes` / `Specs` can open Explorer drawer, Main Viewer remains usable
- [x] 9.5 Verify theme switching: light/dark/system modes all render correctly
- [x] 9.6 Run `npm run typecheck` to verify no TypeScript errors
- [x] 9.7 Run `npm run build` to verify production build succeeds
