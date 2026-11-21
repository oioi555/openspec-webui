# Tasks

## 1. Parser

- [x] 1.1 In `parseDeltaOperations`, blank leading frontmatter (port of `findFrontmatterEnd`), end the section and requirement at any non-fenced `##` header, and `trimEnd()` requirement content. Keep the lenient section regex. Verify with one `changes.test.ts` case per rule, plus the singular header.

## 2. Verification

- [x] 2.1 Dump `operations` for every change before and after, and classify every difference by cause. Record the summary in Notes.
- [x] 2.2 Run `npm test`, `npm run typecheck` and `npm run build`, and verify all pass.

## Notes

- Baseline diff (116 existing changes, 701 operations): 700 differ only by trailing whitespace trimmed from `content` (699 drop one `\n`, 1 drops `\n\n`). 1 is unchanged (no trailing newline). No names, types, line numbers or counts changed. No existing delta has a non-delta `##` section or frontmatter, so no difference comes from those rules. Nothing is unexplained.
