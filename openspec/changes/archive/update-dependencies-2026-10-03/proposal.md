# Proposal

## Why

前回 2026-09-26 の依存更新以降、`npm outdated` で現行 semver 範囲内の直接依存が 6 件残っている。`npm audit` は high 2 件・moderate 2 件を報告し、いずれも `npm audit fix`（`--force` なし）で直せる。次回リリース前に、検証済みの依存ベースラインへ揃える。

## What Changes

- 現行 semver 範囲内の直接依存 6 件を最新安定版へ更新する。
- 続けて `npm audit fix`（`--force` なし）を実行し、既知の推移依存 advisories をロックファイル上で直す。対象パッケージを `package.json` の直接依存や `overrides` には追加しない。
- `package-lock.json` を更新し、意図した直接依存と互換推移依存だけが再解決されることを確認する。
- `ThirdPartyNotices.txt` を再生成し、ライセンス表示が依存グラフと同期していることを確認する。
- `npm audit`、型チェック、テスト、ビルド、リリース検証で更新結果を検証する。
- TypeScript 7、`openspec-webui` 自身のバージョン変更、npm 公開は本 Change に含めない。
- 進行中の `support-openspec-v1-14-0` の成果物や実装ファイルは本 Change の対象にしない。

対象とする直接依存更新:

- `@fastify/static` 10.1.4→10.1.5
- `@lucide/svelte` 1.48.0→1.50.0
- `@types/node` 26.6.2→26.6.4
- `@types/ws` 8.18.1→8.18.2
- `bits-ui` 2.19.3→2.19.4
- `vite` 8.3.1→8.3.2

対象とする監査修正（ロックファイルのみ。直接依存や overrides は追加しない）:

- `brace-expansion` 5.0.9→5.0.12（`@fastify/static` → `glob` → `minimatch` 経由、runtime）
- `fast-uri` 4.1.4→4.2.1 および nested 3.1.7→3.1.8（`fastify` / `@fastify/ajv-compiler` / `fast-json-stringify` / `ajv` 経由、runtime）
- `undici` 8.10.0→8.11.2（`generate-license-file` → `node-gyp` 経由、dev-only）
- `ip-address` 10.5.0→10.7.3（`generate-license-file` → arborist → `socks` 経由、dev-only）

## Capabilities

### New Capabilities

なし。

### Modified Capabilities

なし。本変更は依存関係と生成物の保守のみで、ユーザー可視の要件変更はないため `skip_specs: true` とする。既存の `package-distribution` は、公開前に直せる `npm audit` 指摘を解消することを既に要求しており、本 Change はその既存要件を満たす。

## Impact

- `package.json`: 現行 semver 範囲内の直接依存 6 件（runtime 1、dev 5）
- `package-lock.json`: 直接依存と互換推移依存の解決結果（監査修正の 4 系統を含む）
- `ThirdPartyNotices.txt`: ライセンス情報の再生成結果
- 検証: `npm audit` / `npm run typecheck` / `npm test` / `npm run build` / `node ./scripts/verify-release.mjs`
- `engines.node: ">=20.19.0"`、`packageManager: "npm@11.19.0"`、パッケージバージョン `1.4.4` は維持
- CLI、サーバー、UI の意図的な振る舞い変更なし
