## 1. Documentation

- [x] 1.1 Add a concise README security and permissions section covering local network binding, selected project filesystem access, explicit `openspec` command execution, environment/config reads, and npm registry version checks.
- [x] 1.2 State that normal operation does not send project contents to external services and that the package does not rely on install-time lifecycle scripts.

## 2. Dependency Updates

- [x] 2.1 Update `@fastify/static` to a patched compatible version and refresh `package-lock.json`.
- [x] 2.2 Apply npm-audit-fixable transitive dependency updates, including Svelte/devalue/fast-uri/ip-address/kysely resolutions as applicable.
- [x] 2.3 Regenerate third-party notices if dependency metadata changes require attribution updates.

## 3. Verification

- [x] 3.1 Run `npm audit` and confirm planned fixes remove known fixable advisories.
- [x] 3.2 Run `npm run typecheck`, `npm test`, and `npm run build`.
- [x] 3.3 Run release/package verification or `npm pack --dry-run` smoke checks to confirm the tarball remains minimal and runnable.
