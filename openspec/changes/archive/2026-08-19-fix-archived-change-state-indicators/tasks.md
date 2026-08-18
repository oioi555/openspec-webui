## 1. Archived Change Name Resolution

- [x] 1.1 Add a shared directional matcher for exact archived names and archived names with one leading `YYYY-MM-DD-` prefix.
- [x] 1.2 Add unit tests covering exact matches, date-prefixed archive matches, non-matches, and original Change names that begin with a date-like prefix.

## 2. Reactive Navigation Indicators

- [x] 2.1 Update `TabBar` to derive archived Change icon state from refreshed archive summaries through the shared matcher while preserving the existing tab identity and route.
- [x] 2.2 Update `ActivityBar` to resolve the active archive section through the same matcher.
- [x] 2.3 Add regression coverage for an open original-name Change transitioning to archived tab and Activity Bar semantics after archive data refresh.

## 3. Verification

- [x] 3.1 Run the focused frontend tests for archived Change name and navigation-state behavior.
- [x] 3.2 Run the project typecheck and full test suite.
