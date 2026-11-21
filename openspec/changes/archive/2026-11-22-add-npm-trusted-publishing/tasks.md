# Tasks

## 1. Release guard script

- [x] 1.1 Add `scripts/release-guard.mjs` (tag/version/lock, ancestry, notes file, npm registry state, npm CLI minimum, `--check-published` re-check, fail-closed parsing, `GITHUB_OUTPUT`) and verify by running it locally against `v2.0.0` with and without a notes file
- [x] 1.2 Add `scripts/release-guard.test.mjs`, register it in `scripts/test.mjs`, and verify `npm test` passes

## 2. Release workflow

- [x] 2.1 Add `.github/workflows/release.yml` with `guard`, `publish` (OIDC, `id-token: write`) and `github-release` (`contents: write`) jobs, concurrency and timeouts, and verify with actionlint
- [x] 2.2 Confirm `scripts/verify-release.mjs` (the `prepublishOnly` gate) passes on Linux and leaves `ThirdPartyNotices.txt` unchanged

## 3. Release skill

- [x] 3.1 Rewrite `.agents/skills/npm-release-workflow/SKILL.md` for prepare → push commit and tag → `gh run watch` → verify, with the one-time npmjs.com setup and a manual fallback, and verify every referenced path and command exists

## 4. Integration

- [x] 4.1 Run `npm test`, `npm run typecheck`, `npm run build`, and `openspec validate add-npm-trusted-publishing --strict`
- [ ] 4.2 Confirm on the first real tag release (deferred): OIDC publish, npm provenance badge, GitHub Release creation, and a `--failed` re-run skipping publish

Notes: 4.2 is intentionally left open; it can only be verified by a real tag push and is deferred to the first CI release.

## Workflow follow-up

- Archive the change after the first real release succeeds and the maintainer approves.
