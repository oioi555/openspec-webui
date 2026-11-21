---
name: npm-release-workflow
description: Run the openspec-webui npm release workflow. Use this whenever the user wants to publish a new npm version, cut a release, bump the package version, verify a release candidate, or do the usual prepare → publish → release flow for this repository. Publishing runs in GitHub Actions via npm Trusted Publishing (OIDC) when a v<version> tag is pushed; this skill prepares the release commit and notes, pushes commit and tag, watches the workflow, and verifies the result.
---

Run the `openspec-webui` release flow with a fixed rule set.

Publishing happens in `.github/workflows/release.yml` on a `v*.*.*` tag push,
through npm Trusted Publishing (OIDC, no npm token, provenance automatic). The
assistant never runs `npm publish` in the normal flow.

## Core rule

Always treat releases as exactly these 3 phases:

- Phase 1: prepare (local: bump, licenses, verify, release notes, release commit)
- Phase 2: ship (push commit, push tag, watch the release workflow)
- Phase 3: verify (npm `latest` and GitHub Release)

Pause after Phase 1 and ask before pushing: pushing the tag is the irreversible
step that publishes to npm.

## When to use

"release it", "publish to npm", "cut a new version", "bump patch/minor/major and
release", "do the usual release flow", "prepare publish release".

This skill is repo-specific. Assume the package is `openspec-webui`.

## Repo defaults

- Package name: `openspec-webui`; version source of truth: `package.json`
- Tag format: `v<package.json version>` (plain `x.y.z`, no prerelease suffix)
- Release notes file: `.github/release-notes/v<version>.md` (committed in the release commit; the workflow fails before publishing without it)
- `prepublishOnly` runs `node ./scripts/verify-release.mjs` (licenses, build, test, typecheck, `npm pack` checks, packed CLI smoke test). It runs locally in Phase 1 and again in CI during `npm publish`.
- License generation: `node ./scripts/generate-licenses.mjs` (there is no `npm run licenses:generate`)
- Guards: `node ./scripts/release-guard.mjs --tag v<version>` checks tag = version, lockfile version, tag on `origin/main`, notes file present, and whether the version is already on npm
- Release workflow jobs: `guard` → `publish` (OIDC) → `github-release`
- The workflow also fails if regenerated `ThirdPartyNotices.txt` differs from the committed file

## One-time setup on npmjs.com (maintainer, before the first CI release)

Done once by the maintainer in a browser; the assistant cannot do it.

**Timing:** a new trusted publisher configuration must complete its first successful publish within **2 days**, or it expires and can no longer be used or edited. If that happens, delete it, create a new one, and publish within 2 days. So do this setup right before the first CI release, not in advance.

1. Sign in to https://www.npmjs.com as `oioi555`, open package `openspec-webui` → **Settings** → **Trusted Publisher**.
2. Choose **GitHub Actions** and enter exactly (case-sensitive, not validated on save):
   - Organization or user: `oioi555`
   - Repository: `openspec-webui`
   - Workflow filename: `release.yml` (filename only, not the path)
   - Environment name: leave empty (the workflow uses no GitHub environment)
3. Save. Keep `package.json` `repository.url` pointing at `github.com/oioi555/openspec-webui`; it must match for OIDC and provenance.
4. Optional, after the first successful CI release: **Settings → Publishing access → "Require two-factor authentication and disallow tokens"**, and revoke any old automation tokens. This does not block trusted publishing, but it does block the token part of the manual fallback (the maintainer's interactive 2FA publish still works).

Renaming `release.yml` or moving the publish step into a reusable workflow breaks the binding.

## Phase 1: Prepare

1. Read `package.json` for the current version. Use the user's bump type or explicit version; if none was given, ask.
2. `git status`; if unrelated dirty files exist, stop and ask. Confirm the branch is `main` and up to date with `origin/main`.
3. `npm version --no-git-tag-version <patch|minor|major|x.y.z>`
4. `node ./scripts/generate-licenses.mjs`
5. Verify: `npm test`, `npm run typecheck`, `npm run build`, then `node ./scripts/verify-release.mjs` (the authoritative gate; the earlier ones fail faster).
6. Write the release notes to `.github/release-notes/v<version>.md` (format below).
7. Run `node ./scripts/release-guard.mjs --tag v<version> --skip-ancestry` (the commit is not on `origin/main` yet). It must pass and report the version is not on npm.
8. `git status`: only release files should change (`package.json`, `package-lock.json`, `ThirdPartyNotices.txt`, the notes file, intentional README/docs).
9. Commit: `git commit -m "chore(release): v<version>"` with only those files.
10. Report, then ask before Phase 2:

```md
## Prepare complete

- Current version: <old>
- Target version: <new>
- Verification: passed
- Release notes: .github/release-notes/v<version>.md
- Release commit: <sha>

Next: Phase 2 pushes main and tag v<version>, which publishes to npm.
```

If any step fails, stop and show the failing command and error.

## Phase 2: Ship

Only after the user confirms.

1. `git push origin main` (main first; the workflow rejects tags not on `origin/main`).
2. `git tag v<version>` on the release commit (check it does not already exist: `git tag -l v<version>`), then `git push origin v<version>`.
3. Find and watch the run:
   ```bash
   RUN_ID=$(gh run list --workflow release.yml --event push --limit 20 \
     --json databaseId,headBranch,status \
     --jq '[.[] | select(.headBranch == "v<version>")][0].databaseId')
   gh run watch "$RUN_ID" --exit-status
   ```
   If `RUN_ID` is empty, the run has not registered yet; wait a few seconds and query again. Never fall back to the newest run of another tag.
4. On failure, show `gh run view <run-id> --log-failed` and stop. Typical causes:
   - `guard` failed → fix in a new commit only if the version is not yet on npm; never move a pushed tag without asking.
   - `publish` failed with 403/404/ENEEDAUTH → trusted publisher fields on npmjs.com are wrong or missing (see setup). Fix them, then `gh run rerun <run-id> --failed`.
   - `github-release` failed → `gh run rerun <run-id> --failed`; re-runs skip the publish when the version is already on npm and skip an existing Release.

## Phase 3: Verify

```bash
npm view openspec-webui dist-tags.latest      # must print <version>
gh release view v<version> --json url,name     # must exist, name v<version>
```

Optionally confirm the provenance badge on https://www.npmjs.com/package/openspec-webui.

```md
## Release complete

- Version: <version>
- Tag: v<version>
- npm latest: <version> (published by GitHub Actions with provenance)
- GitHub Release: <url>
```

## Release notes format

English only. Rewrite commits into user-facing bullets; never paste raw commit
subjects. Drop internal noise (`sync specs`, `archive change`, `chore(release)`,
OpenSpec bookkeeping).

1. Previous tag: `git tag --sort=-v:refname | head -1` (before creating the new tag).
2. Commits: `git log "<previous>"..HEAD --pretty=format:"%s"`.
3. Sections in this order, omitting empty ones:
   - `## ✨ What's New` — `feat`
   - `## 🐛 Bug Fixes` — `fix`
   - `## 🔧 Maintenance` — dependencies, security, docs, release, internal
4. End with `**Full Changelog**: https://github.com/oioi555/openspec-webui/compare/v<previous>...v<version>`.
5. Never use `--generate-notes`; a maintenance-only release still uses the template.

Example:

```md
## ✨ What's New

- Add Explorer sorting controls

## 🐛 Bug Fixes

- Restore browser-local project selection after restart

## 🔧 Maintenance

- Publish releases from GitHub Actions with npm provenance

**Full Changelog**: https://github.com/oioi555/openspec-webui/compare/v2.0.0...v2.1.0
```

## Manual fallback (only when OIDC publishing is broken)

Use only if the workflow cannot publish (for example npm or GitHub OIDC outage)
and the user explicitly chooses the fallback. Phase 1 is unchanged.

1. Hand off to the user; never run `npm publish`, `npm login`, or 2FA steps yourself:
   ```bash
   npm whoami        # if it fails: npm login
   npm publish       # from the committed release tree; prepublishOnly re-verifies
   ```
2. Ask a blocking question: `npm publish はどうなりましたか？` with options `Published / continue` and `Abort release`. Do not auto-continue or send reminders.
3. After `Published / continue`: push main and the tag. The release workflow then sees the version on npm, skips publishing, and creates the GitHub Release from the notes file. If the workflow itself is unusable, create it by hand:
   `gh release create v<version> --notes-file .github/release-notes/v<version>.md --title v<version>`

## Safety rules

- Never push the tag without the user's go-ahead after Phase 1.
- Never push the tag before `main` contains the release commit.
- Never move, delete, or re-push a tag that has been pushed without asking.
- Never add an `NPM_TOKEN` secret or a token to `.npmrc` for CI publishing.
- Never run `npm publish` in the normal flow; never perform interactive npm auth for the user.
- Never guess whether a run succeeded; use `gh run watch --exit-status` and Phase 3 checks.
- Never skip verification failures or the release notes file.
- If a step fails, stop at that phase and report the exact command and error.
