## 1. Runtime floor

- [x] 1.1 Set `engines.node` to `>=22.22.0` in package.json and the package-lock.json root entry
- [x] 1.2 Update README Prerequisites, Development requirements and compatibility text to Node.js 22.22

## 2. chokidar 6

- [x] 2.1 `npm install chokidar@6`
- [x] 2.2 Add an `error` listener in src/watcher/file-watcher.ts that logs a warning with the watched path
- [x] 2.3 Review Node 20 workarounds (settings-ssr-loader.mjs `.ts` strip, `ws` test client); keep unless clearly dead, refresh comments

## 3. CI

- [x] 3.1 Replace the ubuntu Node `20.19` matrix entry with `22.22.0` in .github/workflows/ci.yml
- [x] 3.2 Run actionlint

## 4. Verification

- [x] 4.1 `npm test`, `npm run typecheck`, `npm run build` on latest Node 22
- [x] 4.2 `npm test` on Node 22.22.0 exactly
- [x] 4.3 Live-refresh check: create/modify/delete a file under a fixture's openspec/changes/ and confirm WebSocket update messages
