# Proposal

## Why

Releases today require the maintainer to run `npm publish` locally behind interactive 2FA (QR code plus biometrics), then push, tag and create the GitHub Release by hand. npm Trusted Publishing (OIDC) lets GitHub Actions publish without a long-lived token, so a release can be reduced to pushing a tag, with provenance attached automatically.

## What Changes

- Add `.github/workflows/release.yml`, triggered by pushing a `v*.*.*` tag, that guards the tag, publishes to npm through OIDC, and creates the GitHub Release.
- Add `scripts/release-guard.mjs` (with unit tests) that checks the tag against `package.json`/`package-lock.json`, the tag's ancestry on `main`, the committed release notes file, the npm CLI version, and whether the version is already on npm.
- Release notes become a committed file at `.github/release-notes/v<version>.md`, written in the release commit.
- Rewrite `.agents/skills/npm-release-workflow/SKILL.md`: prepare → push commit and tag → watch workflow → verify; keep a manual local-publish fallback and record the one-time npmjs.com trusted publisher setup.
- No long-lived `NPM_TOKEN` secret is introduced.

## Capabilities

### New Capabilities
- `release-automation`: tag-triggered publishing of the npm package and GitHub Release from CI, including pre-publish guards, idempotent re-runs, and committed release notes.

### Modified Capabilities

## Impact

- New: `.github/workflows/release.yml`, `scripts/release-guard.mjs`, `scripts/release-guard.test.mjs`, `.github/release-notes/` (per release).
- Changed: `scripts/test.mjs` (registers the new test), `.agents/skills/npm-release-workflow/SKILL.md`.
- External: one-time trusted publisher configuration on npmjs.com for `openspec-webui`; the package `repository.url` must keep matching `github.com/oioi555/openspec-webui`.
- No runtime or packaged-CLI behavior changes.
