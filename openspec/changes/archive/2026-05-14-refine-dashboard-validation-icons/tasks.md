## 1. Dashboard Active Changes layout

- [x] 1.1 Move the Dashboard Active Changes validation status icon into the title/badge row after the change name, Proposal badge, and Design badge.
- [x] 1.2 Remove the trailing arrow icon from Dashboard Active Changes rows while preserving full-row click and context menu behavior.
- [x] 1.3 Update Dashboard Active Changes tests to assert the status icon ordering and absence of the trailing arrow.

## 2. Dashboard Recent Activity validation icons

- [x] 2.1 Add Recent Activity validation status derivation for active-change and spec items using shared validation list icon semantics.
- [x] 2.2 Render Recent Activity validation icons right-aligned in place of the previous trailing arrow when a compact status is available.
- [x] 2.3 Ensure archived Recent Activity items never render validation icons and no Recent Activity rows render trailing arrows.
- [x] 2.4 Update Recent Activity tests for active-change/spec status icons, archived change omission, row click behavior, and arrow removal.

## 3. Verification

- [x] 3.1 Run relevant frontend tests for Dashboard validation icon layout.
- [x] 3.2 Run type checks if Dashboard imports or helper types change.
- [x] 3.3 Run `openspec validate refine-dashboard-validation-icons --strict`.
