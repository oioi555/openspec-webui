## 1. Dependency Manifests

- [x] 1.1 Confirm the current OpenSpec CLI engine and package-manager declarations, retaining `engines.node` and `packageManager` when no upstream requirement has changed.
- [x] 1.2 Update `fastify` to 5.12.0 and `open` to 11.0.1, then regenerate their lockfile resolutions.
- [x] 1.3 Update `@inlang/paraglide-js` to 2.24.1, `@inlang/plugin-message-format` to 4.4.3, `svelte` to 5.56.9, `svelte-check` to 4.7.6, and `svelte-sonner` to 1.2.1 while retaining TypeScript 6.0.3.
- [x] 1.4 Review `package.json` and `package-lock.json` to confirm the changes are limited to intended direct updates and their resolved transitives.

## 2. Generated Compliance Output

- [x] 2.1 Regenerate `ThirdPartyNotices.txt` from the updated dependency tree and review the resulting license changes.

## 3. Verification

- [x] 3.1 Run `npm run typecheck` and confirm Paraglide compilation, TypeScript, and Svelte checks pass.
- [x] 3.2 Run `npm test` and `npm run build`.
- [x] 3.3 Run `npm audit` and confirm there are no known vulnerabilities.
- [x] 3.4 Run the release verification path and confirm the packed CLI/server smoke passes with the updated tree.
