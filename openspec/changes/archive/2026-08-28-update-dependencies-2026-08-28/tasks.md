## 1. 依存マニフェスト

- [x] 1.1 upstream `@fission-ai/openspec@1.11.0` の `engines.node` と `packageManager` 宣言を確認し、`engines.node: ">=20.19.0"` / `packageManager: "npm@11.19.0"` を維持することを記録する
- [x] 1.2 `@inlang/paraglide-js@2.25.0` / `@lucide/svelte@1.34.0` / `@types/node@26.4.0` / `generate-license-file@4.2.4` / `marked@18.0.11` / `shadcn-svelte@1.5.1` を明示バージョンで `npm install` し、`package.json` / `package-lock.json` の差分が当該直接更新とその transitive のみに限定されることを `git diff` で確認する
- [x] 1.3 `typescript` が `6.0.3` に留まり `7.0.2` へ上がっていないことを `package.json` と `npm ls typescript` で確認する（`svelte-check` peer 範囲外のため）

## 2. 生成物の再生成

- [x] 2.1 `ThirdPartyNotices.txt` を `node ./scripts/generate-licenses.mjs`（または `npm run build` 経由）で再生成し、`git diff ThirdPartyNotices.txt` でライセンス差分をレビューする

## 3. 検証

- [x] 3.1 `npm run typecheck` を実行し、Paraglide 生成・TypeScript・Svelte チェックが通過することを確認する
- [x] 3.2 `npm test` と `npm run build` を実行し、全テストと本番ビルドが成功することを確認する
- [x] 3.3 `npm audit` を実行し、脆弱性 0 件を維持することを確認する
- [x] 3.4 `node ./scripts/verify-release.mjs`（または `npm run prepublishOnly`）を実行し、packed CLI の `--help` / `--version` スモークと tarball 検証が通過することを確認する
