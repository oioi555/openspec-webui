## 1. Layout Store

- [x] 1.1 Change `ResponsiveMode` type from `'narrow' | 'medium' | 'wide'` to `'narrow' | 'wide'`
- [x] 1.2 Add `DESKTOP_BREAKPOINT = 960` named constant
- [x] 1.3 Rewrite `getResponsiveMode` to return `'narrow'` when `width <= DESKTOP_BREAKPOINT`, otherwise `'wide'`
- [x] 1.4 Remove the unused `setResponsiveMode` method (dead code)

## 2. Spec Updates

- [x] 2.1 Update `openspec/specs/resizable-layout/spec.md`: change `768px` references to `960px`
- [x] 2.2 Update `openspec/specs/explorer-pane/spec.md`: change `768px` references to `960px`

## 3. Verification

- [x] 3.1 Confirm no other files reference the old 768px breakpoint or `medium` mode
- [x] 3.2 Visual check: at 960px viewport the Explorer collapses to drawer; at 961px the three-pane layout renders
