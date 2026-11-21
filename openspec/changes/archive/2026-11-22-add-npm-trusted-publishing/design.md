# Design

## Context

Publishing is manual (see proposal.md - Why). `package.json` already gates publishing through `prepublishOnly: node ./scripts/verify-release.mjs`, `repository.url` is `git+https://github.com/oioi555/openspec-webui.git`, `packageManager` pins `npm@11.19.0`, and CI (`ci.yml`) runs read-only checks on Linux and Windows.

### Verified platform requirements

Sources: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers) (TP), [npm provenance](https://docs.npmjs.com/generating-provenance-statements) (PROV), [npm scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts) (SCRIPTS), [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish) (PUBLISH).

- npm CLI 11.5.1 or later and Node 22.14.0 or later are required (TP).
- The job needs `permissions: id-token: write` (TP, PROV).
- No `NODE_AUTH_TOKEN` or token in `.npmrc` is needed; the CLI detects the OIDC environment and uses it before falling back to tokens (TP). The docs' examples set `registry-url: https://registry.npmjs.org` on `actions/setup-node`; it is shown in every example but not stated as required (TP, PROV). We follow the examples.
- Provenance is generated automatically under trusted publishing from GitHub Actions; `--provenance` is not needed (TP, PROV). It requires a public repository and package (TP).
- Only GitHub-hosted (cloud) runners are supported (TP, PROV).
- npmjs.com fields: owner (user/org), repository, workflow filename (filename only, with `.yml`, file under `.github/workflows/`), optional environment; all case-sensitive and exact, and not validated on save (TP).
- `package.json` `repository.url` must match the GitHub repository exactly (TP, PROV).
- Neither page restricts publishing from tags; the TP example itself triggers on `push: tags: 'v*'` (TP).
- With `workflow_call`/`workflow_dispatch` the calling workflow's name is what is validated (TP), so publishing stays in `release.yml` itself rather than a reusable workflow.
- `prepublishOnly` runs before pack, only on `npm publish` (SCRIPTS); it still runs in CI.
- Publishing an existing name+version always fails (PUBLISH), so re-runs must detect it.
- A new trusted publisher configuration expires unless its first successful publish happens within 2 days; an expired one must be deleted and recreated (TP). The maintainer therefore sets it up right before the first CI release.
- After setup, npm recommends "Require two-factor authentication and disallow tokens" and revoking automation tokens; this does not affect trusted publishers (TP).

## Goals / Non-Goals

**Goals:** a tag push is the only release action; fail closed before any upload on mismatched tag, off-main commit, missing notes, stale license notices or failed verification; safe re-runs.

**Non-Goals:** automated version bumping, generated release notes, prerelease/dist-tag channels (tag pattern is `v*.*.*` and the guard rejects suffixes), GitHub `environment` approval gates.

## Decisions

1. **Three jobs: `guard` → `publish` → `github-release`.** Each gets only the permissions it needs: `guard` read-only, `publish` adds `id-token: write`, `github-release` gets `contents: write`. Alternative (one job with both write permissions) was rejected for least privilege.
2. **Verification runs once, through `prepublishOnly`.** The `publish` job runs `npm ci` then `npm publish`; npm runs `verify-release.mjs` on the exact tree being packed, before upload. A separate pre-publish verify job would repeat build/test/typecheck for no extra assurance. The cheap license-drift check (`generate-licenses` + `git diff --exit-code ThirdPartyNotices.txt`) lives in `guard`, because `verify-release.mjs` regenerates the file in place and would otherwise publish uncommitted notices silently.
3. **Guards in `scripts/release-guard.mjs`** with pure, unit-tested functions: tag form and equality with `package.json` and `package-lock.json`; `git merge-base --is-ancestor <tag>^{commit} origin/main`; notes file `.github/release-notes/v<version>.md` present and non-empty; `npm view name@version` where a clean E404 means "not published" and any other error fails (so an outage never triggers a duplicate publish attempt); `--check-npm-cli` mode asserting npm >= 11.5.1. Outputs go to `GITHUB_OUTPUT`.
4. **Pinned npm.** The publish job uses Node 24 and installs the `packageManager` npm (`npm@11.19.0`), then asserts the minimum, rather than depending on whatever npm the runner's Node bundles.
5. **Idempotency.** `publish` is skipped when `guard` reports the version on npm, and the publish job re-checks the registry (`release-guard.mjs --check-published`, fail-closed) immediately before `npm publish` because job outputs are frozen across `gh run rerun --failed` and a manual fallback publish may have happened meanwhile; `github-release` runs when `publish` succeeded or was skipped, waits up to about 5 minutes with backoff until the version is visible on npm, and skips creation if `gh release view` finds the Release. `concurrency` is per tag with `cancel-in-progress: false` so a publish is never cancelled midway.
6. **No environment.** The trusted publisher is bound to owner/repo/`release.yml` only. Adding a GitHub environment later would require setting the same name on npmjs.com.
7. **Release notes are committed** in the release commit so the published Release body is reviewed text tied to the tagged commit.

## Risks / Trade-offs

- [Misconfigured npmjs.com fields are only detected at publish time] → skill records exact values; first release is watched with `gh run watch`; the guard runs first so a failure leaves nothing half-published.
- [`setup-node` with `registry-url` writes an `.npmrc` referencing `NODE_AUTH_TOKEN`] → no token is set, and npm prefers OIDC per TP; confirm on the first real run.
- [Tag pushed before `main`] → ancestry guard fails; push `main` first, then re-run the workflow.
- [License output differs between maintainer machine and ubuntu runner] → guard fails with a diff; regenerate and amend before tagging.
- [Build-time dependencies run in the job holding `id-token: write`] → accepted; the same code produces the published artifact anyway, and the OIDC token is scoped to this package.
- [Tags are immutable on npm; a bad publish cannot be reused] → all guards and verification run before upload.

## Migration Plan

1. Maintainer configures the trusted publisher on npmjs.com (see the skill).
2. Merge this change; cut the next release by pushing commit then tag.
3. After one successful OIDC publish, optionally set "Require two-factor authentication and disallow tokens" and revoke old tokens.
Rollback: delete or disable `release.yml` and use the skill's manual fallback.
