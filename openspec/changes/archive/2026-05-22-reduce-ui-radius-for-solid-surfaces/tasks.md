# Tasks for Reduce UI Radius for Solid Surfaces

## 1. Shared Radius System

- [x] **1.1** Audit shared UI primitives for nested/large radius usage (`SurfaceCard`, `InteractiveCard`, `InsetPanel`, `IconBox`, `Badge`, buttons/chips where relevant).
- [x] **1.2** Define and apply a restrained radius hierarchy: outer shells retain modest rounding, inner rows/items use no radius or smaller radius.
- [x] **1.3** Remove or reduce hover lift/shadow emphasis on shared interactive surfaces where a solid row/list treatment is preferred.

## 2. Dashboard Solid Surfaces

- [x] **2.1** Update Dashboard summary cards to use reduced radius and calmer hover treatment while preserving click targets.
- [x] **2.2** Convert Dashboard Active Changes inner items from card-in-card surfaces toward bounded solid task cards within the outer section shell, preserving item spacing so `Next Step` sub-row separators remain legible.
- [x] **2.3** Convert Dashboard Recent Activity items toward solid rows or less-rounded list tiles while preserving responsive layout.
- [x] **2.4** Review Planning Context inset panels and inline value blocks for nested radius consistency.
- [x] **2.5** Preserve badges, icons, validation indicators, progress display, command shortcuts, and context menus functionally unchanged.

## 3. Regression Coverage

- [x] **3.1** Update frontend tests affected by Dashboard or shared surface markup/class changes.
- [x] **3.2** Run relevant Dashboard and layout tests.
- [x] **3.3** Run `npm run build`.

## 4. UX Verification

- [x] **4.1** Compare Dashboard before/after for reduced nested rounding and reduced visual busyness.
- [x] **4.2** Verify outer containers still provide clear grouping while inner rows feel solid and scannable.
- [x] **4.3** Check light and dark themes for hover, selected, border, and status contrast.
- [x] **4.4** Check narrow and wide Dashboard layouts for summary cards, Active Changes, Recent Activity, and Planning Context.

## 5. Settings and Callout Solid Surfaces

- [x] **5.1** Reduce `Callout` radius so alert surfaces do not compete with outer shells.
- [x] **5.2** Reduce `OptionCard` and its icon container radius, and replace playful scale/shadow hover with grounded color treatment.
- [x] **5.3** Reduce Settings page inner navigation, grouped-list, preview-row, and inline command/code container radii.
- [x] **5.4** Add regression coverage for Settings and shared settings-surface radius expectations.
- [x] **5.5** Run Settings/Dashboard tests, `npm run build`, and strict OpenSpec validation.
- [x] **5.6** Align the base `Card` default radius with the restrained outer-shell radius so future direct Card usage follows the solid surface hierarchy.
