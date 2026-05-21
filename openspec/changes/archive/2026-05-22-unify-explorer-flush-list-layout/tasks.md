# Tasks for Unify Explorer Flush List Layout

## 1. Layout Structure

- [x] **1.1** Update the default Explorer section group wrapper to remove the large outer padding and inter-section `space-y` gap.
- [x] **1.2** Adjust `ExplorerSection` so Active Changes, Archive, and Specs can render as flush full-width sections instead of rounded card containers.
- [x] **1.3** Preserve existing collapse/expand behavior, programmatic focus scrolling, header sort controls, and Active Changes command shortcut placement.

## 2. Visual Treatment

- [x] **2.1** Restyle section headers with full-width separators/background treatment that keeps section boundaries clear without card gaps.
- [x] **2.2** Replace card-wide focused styling with a flush-list-friendly focused indicator such as a header accent or subtle header state.
- [x] **2.3** Ensure list rows keep the existing Search/Validation-style full-width border-separated item treatment and gain usable horizontal label width.
- [x] **2.4** Verify empty states still render clearly inside collapsed/expanded sections without relying on rounded card boundaries.

## 3. Regression Coverage

- [x] **3.1** Update or add frontend tests for Explorer section rendering, collapse/expand, active row selection, and empty states where class/structure expectations changed.
- [x] **3.2** Run the relevant frontend test suite for Explorer/layout behavior.
- [x] **3.3** Run `npm run build`.

## 4. UX Verification

- [x] **4.1** Manually compare default Explorer sections with Search and Validation panels for consistent list density and row width.
- [x] **4.2** Check long active-change, archived-change, and spec names at narrow Explorer widths.
- [x] **4.3** Check section wayfinding when multiple sections are expanded and adjacent with no large vertical gap.
