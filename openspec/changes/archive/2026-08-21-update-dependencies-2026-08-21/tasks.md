## 1. 依存マニフェスト

- [x] 1.1 upstream `@fission-ai/openspec@1.10.0` の `engines.node` と `packageManager` 宣言を確認し、`engines.node: ">=20.19.0"` / `packageManager: "npm@11.19.0"` を維持することを記録し `npx openspec status` で差分なしを確認
- [x] 1.2 `fastify@5.12.1` / `marked@18.0.10` / `svelte@5.56.10` / `vite@8.2.2` を明示バージョンで `npm install` し `package.json` / `package-lock.json` の差分が当該直接更新とその transitive のみに限定されることを `git diff` で確認
- [x] 1.3 `@lucide/svelte@1.33.0` / `bits-ui@2.19.0` を明示バージョンで `npm install` し上記と同様に lockfile 差分を確認
- [x] 1.4 `typescript` が `6.0.3` に留まり `7.0.2` へ上がっていないことを `package.json` と `npm ls typescript` で確認（`svelte-check` peer 範囲外のため）

## 2. 生成物の再生成

- [x] 2.1 `ThirdPartyNotices.txt` を `node ./scripts/generate-licenses.mjs`（または `npm run build` 経由）で再生成し `git diff ThirdPartyNotices.txt` でライセンス差分をレビュー

## 3. 検証

- [x] 3.1 `npm run typecheck` を実行し Paraglide 生成・TypeScript・Svelte チェックが通過することを確認
- [x] 3.2 `npm test` と `npm run build` を実行し全テストと本番ビルドが成功することを確認
- [x] 3.3 `npm audit` を実行し脆弱性 0 件を維持することを確認
- [x] 3.4 `node ./scripts/verify-release.mjs`（または `npm run prepublishOnly`）を実行し packed CLI の `--help` / `--version` スモークと tarball 検証が通過することを確認
