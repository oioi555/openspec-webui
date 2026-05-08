## 1. Status Derivation

- [x] 1.1 Recheck the final V1 validation DTO and define a helper for item-level status lookup by type/name
- [x] 1.2 Support failed, passed/no-failures, unknown/not-run, and stale states
- [x] 1.3 Add tests for spec and change item lookup, missing items, and no-result states

## 2. Shared Viewer Status UI

- [x] 2.1 Create a compact validation status component or shared rendering helper usable by SpecViewer and ChangeViewer
- [x] 2.2 Render status label, issue count, last-run metadata when available, and Details toggle when messages exist
- [x] 2.3 Render collapsible Details with item-specific messages only
- [x] 2.4 Add accessibility labels for the Details toggle and status state

## 3. SpecViewer Integration

- [x] 3.1 Place the validation status area below the SpecViewer header/metadata and above the spec markdown content
- [x] 3.2 Wire the component to item type `spec` and the current capability name
- [x] 3.3 Verify expanded details keep the spec content immediately below the validation area

## 4. ChangeViewer Integration

- [x] 4.1 Place the validation status area below the ChangeViewer header/metadata and above the document tabs/content area
- [x] 4.2 Wire the component to item type `change` and the current change name
- [x] 4.3 Verify expanded details keep proposal/design/tasks/spec delta tabs immediately below the validation area

## 5. Verification

- [x] 5.1 Run component/state tests covering viewer status rendering
- [x] 5.2 Run `npm test`
- [x] 5.3 Run `npm run typecheck`
- [x] 5.4 Run `openspec validate show-validation-status-in-viewers --strict`
