## 1. Header Layout

- [x] 1.1 Remove the title-row validation status badge from the Validation Explorer panel header.
- [x] 1.2 Add a compact settings action to the title row that opens Settings to the Validation section.
- [x] 1.3 Remove the persistent explanatory paragraph from the header.
- [x] 1.4 Move first-run explanation and prominent Run Validate action into the list placeholder, while keeping post-run reload action compact in the title row.

## 2. Status Count Filters

- [x] 2.1 Expose or derive file-level status counts for failed, warning, and info from the latest validation result.
- [x] 2.2 Render compact color-coded status count filter badges in the post-run status row after a run.
- [x] 2.3 Ensure the always-visible count badges act as multi-select include/exclude filters and their counts match the filtered item categories.
- [x] 2.4 Preserve last-run metadata, loading/error state, and Run Validate behavior.

## 3. Settings Deep Link

- [x] 3.1 Add or reuse a Settings navigation helper that opens/focuses Settings with the Validation section selected.
- [x] 3.2 Verify the Validation Explorer panel settings action uses that helper without moving preference controls into the Explorer panel.

## 4. Verification

- [x] 4.1 Run typecheck/build validation and fix regressions.
- [x] 4.2 Manually verify the header remains compact at narrow Explorer widths.
- [x] 4.3 Manually verify failed/warning/info counts are always visible, visually distinguishable, and filter the list as include/exclude choices.
