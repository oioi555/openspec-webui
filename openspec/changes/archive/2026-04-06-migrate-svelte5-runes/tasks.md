## 1. Store Module Migration (stores/index.ts)

- [x] 1.1 Rename `frontend/src/stores/index.ts` → `index.svelte.ts`, replace all `writable()` with `$state`, keep same export names (`isLoading`, `error`, `project`, `stats`, `specs`, `activeChanges`, `archivedChanges`, `currentRoute`, `searchQuery`, `toasts`, `specsRefreshTrigger`, `changesRefreshTrigger`)
- [x] 1.2 Migrate `addToast()` function to work with `$state` array (direct mutation or reassignment)
- [x] 1.3 Migrate `initializeData()` to use `$state` variable assignment instead of `.set()` calls
- [x] 1.4 Migrate `setupWebSocket()` to use `$state` assignment, verify `subscribe` callback pattern still works
- [x] 1.5 Migrate `navigateTo()` and popstate handler to use `$state` assignment for `currentRoute`

## 2. Store Module Migration (theme, commandPreferences)

- [x] 2.1 Rename `frontend/src/stores/theme.ts` → `theme.svelte.ts`, rewrite `createThemeStore` to use `$state` for theme value, export reactive theme and methods (`initialize`, `setTheme`, `destroy`)
- [x] 2.2 Rename `frontend/src/stores/commandPreferences.ts` → `commandPreferences.svelte.ts`, replace `writable()` with `$state`, maintain same exported interface
- [x] 2.3 Review and update `frontend/src/stores/suggestions.ts` — migrate to runes if it uses `writable()`
- [x] 2.4 Update `frontend/src/stores/theme.test.ts` to work with rune-based theme store (replace `get()` from `svelte/store` with direct value reads)

## 3. Leaf Component Migration (simple props, no lifecycle)

- [x] 3.1 Migrate `Icon.svelte` — convert `export let` props to `$props()`, remove `$store` usage if any
- [x] 3.2 Migrate `Toast.svelte` — convert `export let` props to `$props()`
- [x] 3.3 Migrate `Modal.svelte` — convert `export let` props to `$props()`
- [x] 3.4 Migrate `TaskProgress.svelte` — convert `export let` props to `$props()`
- [x] 3.5 Migrate `HtmlRenderer.svelte` — convert `export let` props to `$props()`
- [x] 3.6 Migrate `MarkdownRenderer.svelte` — convert `export let` props to `$props()`

## 4. Intermediate Component Migration (reactive declarations, store subscriptions)

- [x] 4.1 Migrate `Dashboard.svelte` — replace `$:` with `$derived`, replace `$store` references with direct imports from runes-based stores
- [x] 4.2 Migrate `SpecsList.svelte` — replace `$:` and `$store` patterns
- [x] 4.3 Migrate `ChangesList.svelte` — replace `$:` and `$store` patterns
- [x] 4.4 Migrate `ActiveChangesList.svelte` — convert props to `$props()`, replace `$store` usage
- [x] 4.5 Migrate `TaskList.svelte` — convert props to `$props()`, replace `$:` and `$store`
- [x] 4.6 Migrate `SpecViewer.svelte` — convert props to `$props()`, replace `$:` and `$store`, migrate `onMount` to `$effect` if present
- [x] 4.7 Migrate `ChangeViewer.svelte` — convert props to `$props()`, replace `$:` and `$store`, migrate `onMount` to `$effect` if present
- [x] 4.8 Migrate `SuggestionPanel.svelte` — convert props to `$props()`, replace reactive patterns
- [x] 4.9 Migrate `SuggestionPopover.svelte` — convert props to `$props()`, replace reactive patterns

## 5. Complex Component Migration (modals, navigation, lifecycle-heavy)

- [x] 5.1 Migrate `SettingsModal.svelte` — convert props to `$props()`, replace `$store` subscriptions for theme and command preferences, update event handlers for rune-based store methods
- [x] 5.2 Migrate `Navigation.svelte` — convert props to `$props()`, replace `$store` usage for routing
- [x] 5.3 Migrate `CommandShortcutBar.svelte` — convert props to `$props()`, replace `$:` derived commands

## 6. App Entry Point Migration

- [x] 6.1 Migrate `App.svelte` — replace `onMount` with `$effect`, replace `$currentRoute`/`$project`/`$toasts` auto-subscriptions with direct imports, replace `$:` route parser with `$derived`

## 7. Verification

- [x] 7.1 Run `npm run typecheck:frontend` — fix all type errors from runes migration
- [x] 7.2 Run `npm run test` — ensure theme store tests pass
- [x] 7.3 Run `npm run build:frontend` — verify production build succeeds
- [x] 7.4 Manual smoke test — verify theme switching, navigation, WebSocket refresh, and settings modal all work correctly
