# Tasks

## 1. Parser

- [x] 1.1 Normalize BOM/CRLF, add a fence mask (``` and ~~~, matching the opening fence length), relax the requirement header to `^###\s*Requirement:`, strip a closing `#` run from names, and allow it on section headers in `parseDeltaOperations`. Verify with `changes.test.ts` cases for each scenario and that existing parser tests pass unchanged.

## 2. Verification

- [x] 2.1 Run `npm test` and `npm run typecheck`, and verify both pass. Verify that the change API output for every change in this repository's `openspec/changes/archive` is identical before and after, by diffing `operations` with a scratch script.
