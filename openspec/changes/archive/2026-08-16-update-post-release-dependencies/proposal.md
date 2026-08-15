## Why

The v1.0.0 release was cut immediately after a full dependency refresh, but several compatible patch and minor releases have since shipped. Applying those updates now keeps the runtime and frontend toolchain current while the dependency delta is still small and preserves the zero-vulnerability audit baseline.

## What Changes

- Update the seven compatible direct dependencies reported by `npm outdated`: `fastify`, `open`, `@inlang/paraglide-js`, `@inlang/plugin-message-format`, `svelte`, `svelte-check`, and `svelte-sonner`.
- Keep TypeScript on the latest supported 6.x release because the current Svelte checking toolchain explicitly excludes and crashes with TypeScript 7.
- Regenerate `package-lock.json` and `ThirdPartyNotices.txt` from the resolved dependency tree.
- Keep the npm declaration aligned with upstream OpenSpec CLI requirements. OpenSpec CLI 1.9.0 declares Node `>=20.19.0` but no npm version requirement, so `packageManager: npm@11.19.0` remains unchanged unless upstream begins declaring one.
- Verify type checking, tests, production build, release packaging, and the npm audit baseline.

## Capabilities

### New Capabilities

None. This is dependency and build-tooling maintenance.

### Modified Capabilities

None. No user-visible requirements or public behavior change.

## Impact

- Dependency manifests: `package.json`, `package-lock.json`
- Generated notices: `ThirdPartyNotices.txt`
- Build and validation pipeline: Paraglide compilation, Svelte checking, Vite build, tests, and release verification
- No intended API, CLI, server, or browser UI behavior changes
